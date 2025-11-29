# Caption Studio

AI-powered caption error correction specialized for streaming vocabulary (game terms, emotes, usernames)

## Features

- ✅ **SRT/VTT Upload**: Upload caption files or paste directly
- ✅ **AI Correction**: GPT-4o-mini powered corrections for streaming vocabulary
- ✅ **Side-by-Side Preview**: See original and corrected captions
- ✅ **Download**: Export corrected captions
- ⏳ **Video Processing** (Coming soon): Upload videos and extract captions automatically
- ⏳ **Burned-in Captions** (Coming soon): Export videos with corrected captions

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up OpenAI API Key

1. Get your API key from https://platform.openai.com/api-keys
2. Copy `.env.example` to `.env.local`
3. Add your API key:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 4. Test the App

1. Upload a caption file or paste SRT/VTT content
2. Click "Correct Captions"
3. Review the AI-corrected output
4. Download the corrected file

## Supported Streaming Terms

The AI is trained to recognize and correct:

### Emotes
- Pog, PogChamp, Kappa, LUL, KEKW, Sadge, Copium, Hopium, Pepega

### Gaming Terms
- GG (good game), GGWP
- inting/feeding, ganking, farming
- clutch, tilted, Meta, nerf, buff, OP

### Slang
- POV, FR, NGL, TBH, IMO, IMHO
- irl, rn, btw

### Chat Actions
- raid, host, lurking, subbing, gifting subs

## Sample SRT File

See `sample-captions.srt` for a test file with common streaming errors.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI**: Vercel AI SDK + OpenAI GPT-4o-mini
- **UI**: shadcn/ui + Tailwind CSS
- **Parsing**: subtitle.js (SRT/VTT)
- **Video Processing** (planned): FFmpeg.wasm
- **Storage** (planned): Vercel Blob Storage
- **Analytics** (planned): PostHog

## Cost Estimates

GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens

Average caption file (~500 words):
- Input tokens: ~650
- Output tokens: ~650
- Cost per correction: **~$0.001** (one-tenth of a cent)

$5 OpenAI budget = ~5,000 caption corrections

## Project Structure

```
captionstudio/
├── app/
│   ├── api/
│   │   └── correct-captions/
│   │       └── route.ts          # AI correction API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main caption correction UI
│   └── globals.css               # Global styles
├── components/
│   └── ui/                       # shadcn/ui components
├── .env.local                    # API keys (not in git)
├── .env.example                  # Example env file
└── README.md
```

## Development Status

### ✅ Completed (Phase 1: Rapid Prototype)
- [x] Next.js 14 project setup
- [x] shadcn/ui integration
- [x] Vercel AI SDK + GPT-4o-mini
- [x] SRT/VTT file upload
- [x] AI correction with streaming vocabulary
- [x] Side-by-side preview
- [x] Download corrected captions
- [x] Streaming-specific prompt engineering

### ⏳ In Progress (Phase 2: File Processing)
- [ ] FFmpeg.wasm integration
- [ ] Video file upload
- [ ] Automatic caption extraction
- [ ] Burned-in caption export

### 📋 Planned (Phase 3: Deployment)
- [ ] Vercel deployment
- [ ] PostHog analytics
- [ ] Usage tracking
- [ ] Optional: Stripe payment links

## Validation Targets

- ✅ Working caption upload and AI correction flow
- ✅ GPT-4o-mini integration ($0.15 per 1M input tokens)
- ✅ User uploads SRT file, sees corrected version

**Next milestone**: 10 users, 10+ caption files processed, 5+ corrections per file

## Contributing

This is a rapid prototype. Contributions welcome!

## License

MIT
