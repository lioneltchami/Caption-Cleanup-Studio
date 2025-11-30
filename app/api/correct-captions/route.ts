import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { captions } = await req.json();

    if (!captions || typeof captions !== 'string') {
      return new Response('Captions text is required', { status: 400 });
    }

    const result = streamText({
      model: anthropic('claude-3-5-haiku-20241022'),
      messages: [
        {
          role: 'system',
          content: `You are an expert at correcting live stream and gaming caption errors. Your task is to fix common transcription mistakes while preserving the original timing and structure.

STREAMING & GAMING VOCABULARY TO RECOGNIZE:
- Common emotes: Pog, PogChamp, Kappa, LUL, KEKW, Sadge, Copium, Hopium, Pepega
- Gaming terms: GG (good game), GGWP, inting/feeding, ganking, farming, clutch, tilted, Meta, nerf, buff, OP (overpowered)
- Slang: POV, FR (for real), NGL (not gonna lie), TBH, IMO, IMHO, irl (in real life), rn (right now)
- Chat actions: raid, host, lurking, subbing, gifting subs
- Platform terms: Twitch, YouTube, Discord, Stream, VOD, clip

COMMON CORRECTIONS:
- "GG" not "G.G." or "gee gee"
- "Pog" not "pog", "pawg", "pod"
- "inting" not "in ting" or "inting"
- "ganking" not "ganking" or "gang king"
- Username corrections: preserve capitalization like "xXPlayerXx"
- Fix punctuation and capitalization
- Correct obvious speech-to-text errors
- Preserve timestamps and caption structure

CRITICAL RULES:
1. Output ONLY the corrected captions - no explanations, no summaries, no headers
2. Preserve the EXACT format (SRT/VTT structure with numbers, timestamps, and text)
3. Keep timing codes UNCHANGED
4. Fix capitalization and punctuation appropriately
5. Don't add or remove content - only correct errors
6. Return the corrected captions EXACTLY as they should appear in the file`,
        },
        {
          role: 'user',
          content: `Correct these captions and output ONLY the corrected captions with no additional text:\n\n${captions}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent corrections
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in caption correction:', error);
    return new Response('Error processing captions', { status: 500 });
  }
}
