# Caption Craft Studio - Complete Setup Instructions

This document provides step-by-step instructions for setting up and running Caption Craft Studio.

## Prerequisites

- Node.js 18.x or higher
- npm (comes with Node.js)
- OpenAI API account

## Step 1: Clone or Download the Project

If you received this project as a folder, skip this step.

## Step 2: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required packages:
- Next.js 14
- React
- Vercel AI SDK
- OpenAI provider
- shadcn/ui components
- Tailwind CSS
- TypeScript
- subtitle.js (for SRT/VTT parsing)

## Step 3: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Give it a name (e.g., "Caption Craft Studio")
5. Copy the key (it starts with `sk-`)
6. **Important**: Save this key somewhere safe - you won't be able to see it again!

### OpenAI Free Credits

- New OpenAI accounts get $5 in free credits
- Credits expire after 3 months
- GPT-4o-mini costs $0.15 per 1M input tokens
- Average caption correction costs ~$0.001 (one-tenth of a cent)
- $5 = approximately 5,000 caption corrections

## Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

   On Windows:
   ```cmd
   copy .env.example .env.local
   ```

2. Open `.env.local` in a text editor

3. Replace `your_openai_api_key_here` with your actual API key:
   ```env
   OPENAI_API_KEY=sk-proj-abc123...your-actual-key
   ```

4. Save the file

**Security Note**: Never commit `.env.local` to git or share it publicly!

## Step 5: Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

You should see output like:
```
▲ Next.js 16.0.5 (Turbopack)
- Local:   http://localhost:3000
✓ Ready in 759ms
```

## Step 6: Test the Application

1. Open your browser and go to http://localhost:3000

2. You should see the Caption Craft Studio interface with:
   - "Upload Captions" section at the top
   - Two side-by-side text areas (Original Captions / Corrected Captions)
   - "Correct Captions" and "Download" buttons
   - Information section at the bottom

3. Test with the sample file:
   - Click "Choose File"
   - Select `sample-captions.srt` from the project root
   - The original captions will appear in the left text area
   - Click "Correct Captions"
   - Watch as the AI corrects the captions in real-time (streaming)
   - Click "Download Corrected Captions" to save the result

4. Or test by pasting:
   - Copy this sample SRT content:
     ```
     1
     00:00:01,000 --> 00:00:03,000
     That was a pog play!

     2
     00:00:03,500 --> 00:00:06,000
     G.G. everyone!
     ```
   - Paste into the left text area
   - Click "Correct Captions"
   - See the corrections appear on the right

## Step 7: Verify API Key is Working

If you see errors like "Error correcting captions", check:

1. **Is your API key correct?**
   - Open `.env.local`
   - Make sure there are no extra spaces
   - Key should start with `sk-`

2. **Do you have credits remaining?**
   - Go to https://platform.openai.com/usage
   - Check your credit balance

3. **Is the server running?**
   - Check the terminal for error messages
   - Restart the server with `Ctrl+C` then `npm run dev`

4. **Check browser console:**
   - Press F12 in your browser
   - Go to Console tab
   - Look for error messages

## Common Issues and Solutions

### Port 3000 Already in Use

If you see "Port 3000 is already in use":

```bash
# Kill the process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or run on a different port
npm run dev -- -p 3001
```

### Module Not Found Errors

If you see module errors:

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Windows
rmdir /s /q node_modules
del package-lock.json
npm install
```

### API Key Not Working

1. Check for typos in `.env.local`
2. Ensure no quotes around the key
3. Restart the dev server after changing `.env.local`
4. Check OpenAI dashboard for usage limits

### Captions Not Correcting

1. Check browser console (F12) for errors
2. Verify the API key in `.env.local`
3. Make sure you have caption text in the left textarea
4. Try a simple test like "G.G." to see if it corrects to "GG"

## What the AI Corrects

The GPT-4o-mini model is specifically prompted to correct:

### Streaming Emotes
- "pog" → "Pog"
- "kappa" → "Kappa"
- "lul" → "LUL"
- "kek W" → "KEKW"

### Gaming Terms
- "G.G." → "GG"
- "in ting" → "inting"
- "gang king" → "ganking"
- "O P" → "OP"

### Punctuation & Capitalization
- Adds periods at end of sentences
- Capitalizes first words
- Fixes common typos

### What It Preserves
- SRT/VTT format and structure
- Timestamp codes
- Line numbers
- Correct words (doesn't change what's already right)

## Project Structure Explained

```
captionstudio/
├── app/                          # Next.js App Router directory
│   ├── api/                      # API routes
│   │   └── correct-captions/
│   │       └── route.ts          # AI correction endpoint (GPT-4o-mini)
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Main UI component (upload, preview, download)
│   └── globals.css               # Global styles (Tailwind CSS)
├── components/
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── textarea.tsx
├── lib/
│   └── utils.ts                  # Utility functions (from shadcn)
├── .env.local                    # Your API keys (DO NOT COMMIT!)
├── .env.example                  # Template for environment variables
├── components.json               # shadcn/ui configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── sample-captions.srt           # Test file with streaming errors
└── README.md                     # Project overview
```

## Cost Monitoring

Monitor your OpenAI usage:
- Dashboard: https://platform.openai.com/usage
- Set usage limits: https://platform.openai.com/account/limits

Estimated costs:
- 1 caption correction (15 subtitles): ~$0.001
- 1,000 corrections: ~$1.00
- Your $5 free credits: ~5,000 corrections

## Next Steps

Once you have the basic flow working:

1. **Try different caption files**: Create your own SRT files to test
2. **Experiment with the prompt**: Edit `app/api/correct-captions/route.ts` to add more terms
3. **Customize the UI**: Edit `app/page.tsx` to change colors, layout, etc.
4. **Deploy to Vercel**: See deployment instructions in README.md

## Need Help?

- Check the browser console (F12) for errors
- Review the terminal output where you ran `npm run dev`
- Verify all steps above
- Check OpenAI API status: https://status.openai.com/

## Success Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] OpenAI API key obtained
- [ ] `.env.local` file created with API key
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can upload/paste captions
- [ ] "Correct Captions" button works
- [ ] See corrected output on right side
- [ ] Can download corrected file

If all items are checked, you're ready to use Caption Craft Studio! 🎉
