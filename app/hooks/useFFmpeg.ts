'use client';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { useRef, useState } from 'react';

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [ffmpegLoadError, setFFmpegLoadError] = useState('');

  const loadFFmpeg = async () => {
    if (isFFmpegLoaded && ffmpegRef.current) {
      return ffmpegRef.current;
    }

    try {
      const ffmpeg = new FFmpeg();

      // Load FFmpeg with CDN URLs (using jsdelivr as per official example)
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setIsFFmpegLoaded(true);
      setFFmpegLoadError('');

      return ffmpeg;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load FFmpeg';
      setFFmpegLoadError(errorMessage);
      console.error('FFmpeg load error:', error);
      throw error;
    }
  };

  const extractCaptionsFromVideo = async (videoFile: File): Promise<string | null> => {
    let videoFileName = '';
    let outputFileName = '';

    try {
      const ffmpeg = await loadFFmpeg();

      // Read file as array buffer
      const fileData = await videoFile.arrayBuffer();
      videoFileName = `input_${Date.now()}.mp4`;
      outputFileName = `output_${Date.now()}.srt`;

      // Write file to FFmpeg's virtual filesystem
      await ffmpeg.writeFile(videoFileName, new Uint8Array(fileData));

      // Try to extract subtitles - first subtitle stream
      try {
        await ffmpeg.exec(['-i', videoFileName, '-map', '0:s:0', outputFileName]);

        // Read the extracted subtitle file
        const data = await ffmpeg.readFile(outputFileName);
        const captionText = new TextDecoder().decode(data);

        // Clean up files
        try {
          await ffmpeg.deleteFile(videoFileName);
          await ffmpeg.deleteFile(outputFileName);
        } catch (cleanupError) {
          console.warn('Cleanup warning:', cleanupError);
        }

        return captionText;
      } catch (extractError) {
        // No subtitles found in video
        console.warn('No embedded subtitles found in video');
        return null;
      }
    } catch (error) {
      console.error('Error loading FFmpeg or processing video:', error);
      return null;
    } finally {
      // Always try to clean up files, even if errors occurred
      if (videoFileName && ffmpegRef.current) {
        try {
          const ffmpeg = ffmpegRef.current;
          await ffmpeg.deleteFile(videoFileName).catch(() => {});
          if (outputFileName) {
            await ffmpeg.deleteFile(outputFileName).catch(() => {});
          }
        } catch (e) {
          // Silently ignore cleanup errors
        }
      }
    }
  };

  const extractAudioFromVideo = async (videoFile: File): Promise<File | null> => {
    let videoFileName = '';
    let audioFileName = '';

    try {
      const ffmpeg = await loadFFmpeg();

      // Read file as array buffer
      const fileData = await videoFile.arrayBuffer();
      videoFileName = `input_${Date.now()}.mp4`;
      audioFileName = `output_${Date.now()}.mp3`;

      // Write video file to FFmpeg's virtual filesystem
      await ffmpeg.writeFile(videoFileName, new Uint8Array(fileData));

      // Extract audio to MP3
      await ffmpeg.exec([
        '-i', videoFileName,
        '-vn', // No video
        '-acodec', 'libmp3lame', // MP3 codec
        '-q:a', '2', // Quality level (0-9, 2 is good)
        audioFileName
      ]);

      // Read the extracted audio file
      const data = await ffmpeg.readFile(audioFileName);

      // Create a File object from the audio data
      const audioBlob = new Blob([data.buffer], { type: 'audio/mpeg' });
      const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });

      return audioFile;
    } catch (error) {
      console.error('Error extracting audio:', error);
      return null;
    } finally {
      // Always try to clean up files
      if (videoFileName && ffmpegRef.current) {
        try {
          const ffmpeg = ffmpegRef.current;
          await ffmpeg.deleteFile(videoFileName).catch(() => {});
          if (audioFileName) {
            await ffmpeg.deleteFile(audioFileName).catch(() => {});
          }
        } catch (e) {
          // Silently ignore cleanup errors
        }
      }
    }
  };

  return {
    loadFFmpeg,
    extractCaptionsFromVideo,
    extractAudioFromVideo,
    isFFmpegLoaded,
    ffmpegLoadError,
  };
}
