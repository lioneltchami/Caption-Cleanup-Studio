import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { AssemblyAI } from 'assemblyai';

// Allow streaming responses up to 5 minutes (transcription can take time)
export const maxDuration = 300;

// Helper function to try OpenAI Whisper
async function tryOpenAI(audioFile: File): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key not configured, skipping...');
    return null;
  }

  try {
    console.log('Attempting transcription with OpenAI Whisper...');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'srt',
      language: 'en',
    });

    console.log('✓ OpenAI Whisper transcription successful');
    return transcription;
  } catch (error: any) {
    // Log the specific error for debugging
    console.warn('OpenAI Whisper failed:', error.message || error);

    // Check if it's an account deactivation error
    if (error.message?.includes('deactivated')) {
      console.log('OpenAI account deactivated, falling back to AssemblyAI...');
    } else if (error.status === 401) {
      console.log('OpenAI authentication failed, falling back to AssemblyAI...');
    } else {
      console.log('OpenAI error, falling back to AssemblyAI...');
    }

    return null;
  }
}

// Helper function to try AssemblyAI
async function tryAssemblyAI(audioFile: File): Promise<string | null> {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    console.error('AssemblyAI API key not configured');
    return null;
  }

  try {
    console.log('Attempting transcription with AssemblyAI...');
    const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });

    // Convert File to Buffer for AssemblyAI
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload and transcribe
    const transcript = await client.transcripts.transcribe({
      audio: buffer,
      language_code: 'en',
    });

    if (transcript.status === 'error') {
      throw new Error(transcript.error || 'AssemblyAI transcription failed');
    }

    // Get SRT format
    const srt = await client.transcripts.subtitles(transcript.id, 'srt');

    console.log('✓ AssemblyAI transcription successful');
    return srt;
  } catch (error: any) {
    console.error('AssemblyAI failed:', error.message || error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the audio file from the request
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing audio file: ${audioFile.name} (${audioFile.size} bytes)`);

    // Try OpenAI first (if available)
    let transcription = await tryOpenAI(audioFile);

    // If OpenAI failed, try AssemblyAI
    if (!transcription) {
      transcription = await tryAssemblyAI(audioFile);
    }

    // If both failed, return error
    if (!transcription) {
      return new Response(
        JSON.stringify({
          error: 'Both transcription services failed. Please ensure you have either OPENAI_API_KEY or ASSEMBLYAI_API_KEY configured in your .env.local file.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return the SRT captions
    return new Response(transcription, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error in transcription:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: `Error transcribing audio: ${errorMessage}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
