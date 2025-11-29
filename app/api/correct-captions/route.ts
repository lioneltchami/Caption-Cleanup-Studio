import { openai } from '@ai-sdk/openai';
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
      model: openai('gpt-4o-mini'),
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

RULES:
1. Only fix errors - don't change correct words
2. Preserve the exact format (SRT/VTT structure)
3. Keep timing codes unchanged
4. Fix capitalization appropriately
5. Add proper punctuation where missing
6. Don't add or remove content - only correct errors`,
        },
        {
          role: 'user',
          content: `Please correct the following captions:\n\n${captions}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent corrections
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in caption correction:', error);
    return new Response('Error processing captions', { status: 500 });
  }
}
