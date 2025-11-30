'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useFFmpeg } from './hooks/useFFmpeg';
import { CaptionEditor } from '@/components/caption-editor';
import {
  parseCaptions,
  serializeCaptions,
  detectFormat,
  type Caption,
} from '@/lib/caption-utils';

export default function Home() {
  const [originalCaptions, setOriginalCaptions] = useState('');
  const [correctedCaptions, setCorrectedCaptions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtractingCaptions, setIsExtractingCaptions] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState('');

  // Visual editor state
  const [captionObjects, setCaptionObjects] = useState<Caption[]>([]);
  const [viewMode, setViewMode] = useState<'text' | 'visual'>('text');
  const [captionFormat, setCaptionFormat] = useState<'SRT' | 'VTT'>('SRT');
  const [isUpdatingFromVisual, setIsUpdatingFromVisual] = useState(false);

  const { extractCaptionsFromVideo, extractAudioFromVideo, ffmpegLoadError } = useFFmpeg();

  // Parse captions when originalCaptions changes (but NOT when updating from visual editor)
  useEffect(() => {
    if (isUpdatingFromVisual) {
      setIsUpdatingFromVisual(false);
      return;
    }

    if (originalCaptions.trim()) {
      try {
        const format = detectFormat(originalCaptions);
        console.log('🎬 Detected format:', format);
        if (format !== 'UNKNOWN') {
          setCaptionFormat(format);
          const parsed = parseCaptions(originalCaptions);
          console.log('✅ Parsed captions:', parsed.length, 'captions');
          setCaptionObjects(parsed);
        }
      } catch (err) {
        console.error('Failed to parse captions:', err);
        // Keep text view if parsing fails
      }
    } else {
      setCaptionObjects([]);
    }
  }, [originalCaptions, isUpdatingFromVisual]);

  // Handle caption objects update from visual editor
  const handleCaptionObjectsChange = (updatedCaptions: Caption[]) => {
    setCaptionObjects(updatedCaptions);
    // Sync back to text
    try {
      const serialized = serializeCaptions(updatedCaptions, captionFormat);
      setIsUpdatingFromVisual(true); // Prevent re-parsing
      setOriginalCaptions(serialized);
    } catch (err) {
      console.error('Failed to serialize captions:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setCorrectedCaptions('');

    // Check if it's a video file
    const isVideoFile = file.type.startsWith('video/') ||
                        file.name.match(/\.(mp4|mov|webm|avi|mkv)$/i);

    if (isVideoFile) {
      // Handle video file - try to extract embedded captions first
      setIsExtractingCaptions(true);
      setProcessingStatus('Step 1/3: Checking video for embedded captions...');

      const extractedCaptions = await extractCaptionsFromVideo(file);

      if (extractedCaptions) {
        // Found embedded captions!
        setOriginalCaptions(extractedCaptions);
        setError('');
        setProcessingStatus('');
        setIsExtractingCaptions(false);
      } else {
        // No embedded captions - try Whisper auto-transcription
        try {
          // Extract audio from video
          setProcessingStatus('Step 2/3: Extracting audio from video...');
          const audioFile = await extractAudioFromVideo(file);

          if (!audioFile) {
            setError('Failed to extract audio from video. Please try uploading a caption file (.srt/.vtt) instead.');
            setProcessingStatus('');
            setIsExtractingCaptions(false);
            e.target.value = '';
            return;
          }

          // Send audio to Whisper API
          setProcessingStatus('Step 3/3: Generating captions with AI transcription... This may take a minute.');
          const formData = new FormData();
          formData.append('audio', audioFile);

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            let errorMessage = 'Failed to transcribe audio. ';

            // Provide specific guidance based on status code
            if (response.status === 401 || response.status === 403) {
              errorMessage += 'Invalid or missing API key. Please add OPENAI_API_KEY or ASSEMBLYAI_API_KEY to your .env.local file.';
            } else if (response.status === 429) {
              errorMessage += 'API rate limit exceeded. Please try again in a few moments.';
            } else if (response.status === 500) {
              errorMessage += 'Server error. Please try again or check your API key configuration.';
            } else {
              errorMessage += errorData.error || 'Please check your API key configuration and try again.';
            }

            setError(errorMessage);
            setProcessingStatus('');
            setIsExtractingCaptions(false);
            e.target.value = '';
            return;
          }

          // Get the transcribed SRT captions
          const transcribedCaptions = await response.text();
          setOriginalCaptions(transcribedCaptions);
          setError('');
          setProcessingStatus('');
          setIsExtractingCaptions(false);
        } catch (err) {
          setError('Failed to transcribe audio. Please try uploading a caption file (.srt/.vtt) instead.');
          console.error('Transcription error:', err);
          setProcessingStatus('');
          setIsExtractingCaptions(false);
        }
      }
    } else {
      // Handle caption file (SRT/VTT) - read as text
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setOriginalCaptions(text);
      };
      reader.readAsText(file);
    }

    // Reset file input so user can upload the same file again or a different file
    e.target.value = '';
  };

  const correctCaptions = async () => {
    if (!originalCaptions.trim()) {
      setError('Please upload or paste captions first');
      return;
    }

    setIsProcessing(true);
    setError('');
    setCorrectedCaptions('');

    try {
      const response = await fetch('/api/correct-captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ captions: originalCaptions }),
      });

      if (!response.ok) {
        // Provide specific error messages based on status code
        let errorMessage = 'Failed to correct captions. ';

        if (response.status === 401 || response.status === 403) {
          errorMessage += 'Invalid or missing API key. Please add ANTHROPIC_API_KEY to your .env.local file.';
        } else if (response.status === 429) {
          errorMessage += 'API rate limit exceeded. Please try again in a few moments.';
        } else if (response.status === 500) {
          errorMessage += 'Server error. Please try again later.';
        } else {
          const errorData = await response.json().catch(() => ({}));
          errorMessage += errorData.error || 'Please check your API key configuration and try again.';
        }

        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let correctedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          correctedText += chunk;
          setCorrectedCaptions(correctedText);
        }
      }
    } catch (err) {
      // Use the error message from the thrown error if available
      const errorMessage = err instanceof Error ? err.message : 'Error correcting captions. Please check your API key and try again.';
      setError(errorMessage);
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCaptions = () => {
    const blob = new Blob([correctedCaptions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // Use detected format from state (more reliable than re-detecting)
    const extension = captionFormat.toLowerCase();
    a.download = `corrected-captions.${extension}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Caption Craft Studio
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              AI-powered caption correction specialized for streaming vocabulary
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Video or Captions</CardTitle>
              <CardDescription>
                Upload a video file (MP4, MOV, WEBM) with embedded captions, or an SRT/VTT file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    variant="outline"
                    disabled={isExtractingCaptions}
                  >
                    {isExtractingCaptions ? 'Extracting Captions...' : 'Choose File'}
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".srt,.vtt,.mp4,.mov,.webm,.avi,.mkv,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-sm text-zinc-500">
                    Supports video files (MP4, MOV, WEBM) and caption files (.srt, .vtt)
                  </span>
                </div>
                {isExtractingCaptions && (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    {processingStatus || 'Processing video...'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Side-by-Side Preview */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Original Captions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Original Captions</CardTitle>
                    <CardDescription>
                      {viewMode === 'text' ? 'Paste or upload your captions' : 'Edit captions visually'}
                    </CardDescription>
                  </div>
                  {captionObjects.length > 0 ? (
                    <div className="flex gap-2">
                      <Button
                        variant={viewMode === 'text' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('text')}
                      >
                        Text
                      </Button>
                      <Button
                        variant={viewMode === 'visual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('visual')}
                      >
                        Visual
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">
                      💡 Visual editor unlocks after upload
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'text' ? (
                  <Textarea
                    value={originalCaptions}
                    onChange={(e) => setOriginalCaptions(e.target.value)}
                    placeholder="Paste your SRT or VTT captions here...&#10;&#10;1&#10;00:00:01,000 --> 00:00:03,000&#10;That was a pog play!"
                    className="min-h-[400px] font-mono text-sm"
                  />
                ) : (
                  <div className="max-h-[600px] overflow-y-auto pr-2">
                    <CaptionEditor
                      captions={captionObjects}
                      onCaptionsChange={handleCaptionObjectsChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Corrected Captions */}
            <Card>
              <CardHeader>
                <CardTitle>Corrected Captions</CardTitle>
                <CardDescription>
                  AI-corrected with streaming vocabulary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={correctedCaptions}
                  readOnly
                  placeholder="Corrected captions will appear here..."
                  className="min-h-[400px] font-mono text-sm bg-zinc-50 dark:bg-zinc-900"
                />
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={correctCaptions}
              disabled={isProcessing || !originalCaptions.trim() || (originalCaptions.trim() && detectFormat(originalCaptions) === 'UNKNOWN')}
              size="lg"
              className="w-full sm:w-auto"
              title={
                originalCaptions.trim() && detectFormat(originalCaptions) === 'UNKNOWN'
                  ? 'Invalid caption format. Please upload a valid SRT or VTT file.'
                  : ''
              }
            >
              {isProcessing ? 'Correcting...' : 'Correct Captions'}
            </Button>

            <Button
              onClick={downloadCaptions}
              disabled={!correctedCaptions}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Download Corrected Captions
            </Button>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-center text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
          {ffmpegLoadError && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-center text-red-800 dark:bg-red-900/20 dark:text-red-400">
              <strong>Video Processing Unavailable:</strong> {ffmpegLoadError}
              <div className="mt-2 text-sm">You can still upload caption files (.srt, .vtt) directly.</div>
            </div>
          )}
          {originalCaptions.trim() && detectFormat(originalCaptions) === 'UNKNOWN' && (
            <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-center text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
              <strong>Invalid Caption Format:</strong> The text you entered doesn't appear to be a valid SRT or VTT caption file.
              <div className="mt-2 text-sm">Please upload a properly formatted caption file or paste valid SRT/VTT text.</div>
            </div>
          )}

          {/* Info Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                <strong>1. Upload:</strong> Upload a video file with embedded captions, or directly upload an SRT/VTT caption file
              </p>
              <p>
                <strong>2. AI Correction:</strong> Claude 3.5 Haiku analyzes and corrects common streaming errors
              </p>
              <p>
                <strong>3. Download:</strong> Get your corrected captions ready to use
              </p>
              <div className="mt-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                <p className="font-semibold">Supported Terms:</p>
                <p className="mt-1">
                  Emotes (Pog, Kappa, LUL, KEKW, Sadge), Gaming (GG, inting, ganking, Meta),
                  Slang (POV, FR, NGL, TBH, IRL), and more!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
