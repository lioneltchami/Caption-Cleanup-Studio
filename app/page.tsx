'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function Home() {
  const [originalCaptions, setOriginalCaptions] = useState('');
  const [correctedCaptions, setCorrectedCaptions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setOriginalCaptions(text);
      setCorrectedCaptions('');
      setError('');
    };
    reader.readAsText(file);
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
        throw new Error('Failed to correct captions');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let correctedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const json = JSON.parse(line.substring(2));
                if (json.type === 'text-delta' && json.textDelta) {
                  correctedText += json.textDelta;
                  setCorrectedCaptions(correctedText);
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (err) {
      setError('Error correcting captions. Please check your API key and try again.');
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

    // Determine file extension from original content
    const extension = originalCaptions.includes('WEBVTT') ? 'vtt' : 'srt';
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
              Caption Studio
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              AI-powered caption correction specialized for streaming vocabulary
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Captions</CardTitle>
              <CardDescription>
                Upload an SRT or VTT file, or paste your captions below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    variant="outline"
                  >
                    Choose File
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".srt,.vtt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-sm text-zinc-500">
                    Supports .srt and .vtt files
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side-by-Side Preview */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Original Captions */}
            <Card>
              <CardHeader>
                <CardTitle>Original Captions</CardTitle>
                <CardDescription>Paste or upload your captions</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={originalCaptions}
                  onChange={(e) => setOriginalCaptions(e.target.value)}
                  placeholder="Paste your SRT or VTT captions here...&#10;&#10;1&#10;00:00:01,000 --> 00:00:03,000&#10;That was a pog play!"
                  className="min-h-[400px] font-mono text-sm"
                />
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
              disabled={isProcessing || !originalCaptions.trim()}
              size="lg"
              className="w-full sm:w-auto"
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

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-center text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Info Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p>
                <strong>1. Upload:</strong> Upload your SRT/VTT caption file or paste captions directly
              </p>
              <p>
                <strong>2. AI Correction:</strong> GPT-4o-mini analyzes and corrects common streaming errors
              </p>
              <p>
                <strong>3. Download:</strong> Get your corrected captions ready to use
              </p>
              <div className="mt-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
                <p className="font-semibold">Supported Terms:</p>
                <p className="mt-1">
                  Emotes (Pog, Kappa, LUL), Gaming (GG, inting, ganking),
                  Slang (POV, FR, NGL), and more!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
