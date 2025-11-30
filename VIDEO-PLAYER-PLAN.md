# Video Preview with Sync - Implementation Plan

## Research Summary

### Key Findings (2024 Best Practices):
1. **Native HTML5 Video**: Use `<video>` element for simplicity (no external library needed for MVP)
2. **TimeUpdate Event**: Use `timeupdate` event to track playback position
3. **Custom Caption Overlay**: Build custom overlay instead of native `<track>` for better control
4. **Click-to-Seek**: Implement `video.currentTime = timestamp` for seeking
5. **Caption Sync**: Compare current time with caption start/end times to find active caption

### Advantages of This Approach:
- ✅ No external dependencies
- ✅ Full control over caption display
- ✅ Works with our existing Caption type
- ✅ Lightweight and fast
- ✅ Browser-native features

---

## Component Architecture

### 1. VideoPlayer Component (`components/video-player.tsx`)

**Purpose:** Display video with caption overlay

**Props:**
```typescript
interface VideoPlayerProps {
  videoSrc: string;              // Blob URL or file URL
  captions: Caption[];           // Array of caption objects
  onTimeUpdate?: (time: number) => void;  // Notify parent of time changes
  className?: string;
}
```

**State:**
```typescript
- currentTime: number           // Current playback position (ms)
- duration: number              // Total video duration (ms)
- isPlaying: boolean            // Playback state
- activeCaptionIndex: number | null  // Index of currently displayed caption
```

**Features:**
- [x] HTML5 video element with controls
- [x] Caption overlay at bottom center
- [x] Auto-update current caption based on time
- [x] Emit time updates to parent

**UI Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         Video Content           │
│                                 │
│                                 │
├─────────────────────────────────┤
│  "This is the current caption"  │  ← Caption Overlay
│   [Video Controls: Play/Pause]  │
└─────────────────────────────────┘
```

---

### 2. Integration with CaptionEditor

**Bidirectional Sync:**

**Video → CaptionEditor:**
- Video plays → timeupdate event → find active caption → highlight in editor

**CaptionEditor → Video:**
- User clicks caption → call seekTo(caption.start) → video jumps to timestamp

**Implementation:**
```typescript
// In app/page.tsx
const [currentVideoTime, setCurrentVideoTime] = useState(0);
const videoRef = useRef<HTMLVideoElement>(null);

const handleVideoTimeUpdate = (time: number) => {
  setCurrentVideoTime(time);
  // Find active caption and scroll into view
};

const handleCaptionClick = (caption: Caption) => {
  if (videoRef.current) {
    videoRef.current.currentTime = caption.start / 1000; // Convert ms to seconds
  }
};
```

---

## Implementation Steps

### Phase 1: Basic Video Player (1 hour)
1. Create `components/video-player.tsx`
2. Add HTML5 video element with ref
3. Implement playback controls (play/pause)
4. Add timeupdate event handler
5. Test with sample video

### Phase 2: Caption Overlay (30 min)
1. Add caption overlay div (absolute positioning)
2. Calculate active caption from currentTime
3. Display caption text with styling
4. Test caption display timing

### Phase 3: Caption Highlight Sync (30 min)
1. Pass currentVideoTime to CaptionEditor
2. Add activeTime prop to CaptionEditor
3. Highlight caption card when active
4. Auto-scroll to active caption

### Phase 4: Click-to-Seek (30 min)
1. Add seekTo method to VideoPlayer
2. Expose seekTo via ref (useImperativeHandle)
3. Call seekTo when caption clicked
4. Test click-to-jump functionality

### Phase 5: Video Upload (30 min)
1. Allow video file upload
2. Create blob URL from file
3. Pass to VideoPlayer
4. Clean up blob URLs on unmount

### Phase 6: Polish & Testing (1 hour)
1. Add loading states
2. Handle video errors
3. Test with different formats (MP4, WEBM, MOV)
4. Test with long caption files
5. Mobile responsive testing

---

## Technical Details

### Finding Active Caption
```typescript
function findActiveCaptionIndex(captions: Caption[], currentTime: number): number | null {
  for (let i = 0; i < captions.length; i++) {
    if (currentTime >= captions[i].start && currentTime < captions[i].end) {
      return i;
    }
  }
  return null;
}
```

### Caption Overlay Styling
```css
.caption-overlay {
  position: absolute;
  bottom: 60px; /* Above video controls */
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  max-width: 80%;
  text-align: center;
  font-size: 1.125rem;
  line-height: 1.5;
  pointer-events: none;
}
```

### Video Upload Flow
```
User uploads video file
    ↓
Create blob URL: URL.createObjectURL(file)
    ↓
Pass to VideoPlayer: videoSrc={blobUrl}
    ↓
Video loads and plays
    ↓
On unmount: URL.revokeObjectURL(blobUrl)
```

---

## Integration Points

### In app/page.tsx:
1. **Add state:**
   ```typescript
   const [videoFile, setVideoFile] = useState<File | null>(null);
   const [videoBlobUrl, setVideoBlobUrl] = useState<string>('');
   const [currentVideoTime, setCurrentVideoTime] = useState(0);
   const videoPlayerRef = useRef<VideoPlayerRef>(null);
   ```

2. **Handle video upload:**
   ```typescript
   const handleVideoUpload = (file: File) => {
     // Clean up old blob URL
     if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);

     // Create new blob URL
     const url = URL.createObjectURL(file);
     setVideoBlobUrl(url);
     setVideoFile(file);
   };
   ```

3. **Layout change:**
   - Left side: Video Player
   - Right side: Caption Editor (with active highlight)

---

## File Structure

```
components/
├── video-player.tsx          # New: Video player with caption overlay
├── caption-editor.tsx        # Modified: Add activeTime prop, highlight logic
├── caption-card.tsx          # Modified: Add isActive highlight
└── ui/                       # shadcn components

lib/
└── caption-utils.ts          # Add: findActiveCaptionIndex helper

app/
└── page.tsx                  # Modified: Integrate video player, manage video state
```

---

## Success Criteria

- [x] Video plays smoothly
- [x] Captions display in sync with video
- [x] Active caption highlights in editor
- [x] Clicking caption seeks video to timestamp
- [x] Video upload works
- [x] No performance issues with long videos
- [x] Responsive on mobile devices

---

## Potential Challenges & Solutions

### Challenge 1: TimeUpdate Event Frequency
**Problem:** `timeupdate` fires frequently, causing re-renders
**Solution:** Throttle time updates to every 100ms, only update if caption changes

### Challenge 2: Video Format Support
**Problem:** Not all browsers support all video formats
**Solution:** Recommend MP4 (H.264) for best compatibility, show error for unsupported formats

### Challenge 3: Large Video Files
**Problem:** Blob URLs with large files may cause memory issues
**Solution:** For MVP, accept this limitation; future: use video streaming

### Challenge 4: Caption Timing Precision
**Problem:** Video time is in seconds (float), captions in milliseconds (int)
**Solution:** Convert consistently: `videoTime * 1000` for comparison

---

## Next Steps After Completion

1. Add video playback speed control (0.5x, 1x, 1.5x, 2x)
2. Add keyboard shortcuts (Space = play/pause, Arrow keys = seek)
3. Add waveform visualization
4. Add frame-by-frame stepping
5. Add caption auto-alignment based on video speech detection
