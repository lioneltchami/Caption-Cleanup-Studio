# Visual Caption Editor - Test Plan

## Overview
Testing the newly implemented visual caption editor feature for Caption Craft Studio.

## What Was Built

### Components Created:
1. **`lib/caption-utils.ts`** - Core utility library (400+ lines)
   - Caption parsing (SRT/VTT → objects)
   - Caption serialization (objects → SRT/VTT)
   - Time conversion utilities
   - Validation functions
   - Statistics calculations
   - CRUD operations

2. **`components/caption-card.tsx`** - Individual caption editor
   - Inline text editing
   - Time editing (start/end)
   - Validation warnings display
   - Delete functionality
   - Duration and CPS display

3. **`components/caption-editor.tsx`** - Caption list manager
   - Statistics dashboard
   - Validation summary
   - Add caption button
   - Empty state handling

4. **`app/page.tsx`** - Updated main page
   - Visual editor integration
   - Text/Visual view toggle
   - Automatic caption parsing
   - Bidirectional sync (objects ↔ text)

## Test Cases

### Test 1: Upload and Parse SRT File
**Steps:**
1. Navigate to http://localhost:3000
2. Copy this sample SRT text:
   ```
   1
   00:00:01,000 --> 00:00:03,500
   oh my god that was such a pog champ moment dude

   2
   00:00:03,500 --> 00:00:06,000
   gee gee well played everyone in the chat

   3
   00:00:06,000 --> 00:00:09,000
   stop feeding and in ting bro youre throwing the game
   ```
3. Paste into "Original Captions" textarea
4. Click "Visual" button that appears

**Expected Results:**
- ✅ Text/Visual toggle buttons appear
- ✅ Switching to Visual view shows 3 caption cards
- ✅ Statistics show: 3 total captions, ~8s duration, average CPS
- ✅ Validation warnings appear (>42 char lines, high CPS)

### Test 2: Edit Caption Text
**Steps:**
1. Click on any caption card
2. Edit the text in the textarea
3. Switch back to "Text" view

**Expected Results:**
- ✅ Caption card highlights when active (blue ring)
- ✅ Text updates are reflected immediately
- ✅ Text view shows updated SRT format
- ✅ Statistics update (character count, CPS)

### Test 3: Edit Caption Timing
**Steps:**
1. In Visual view, click the time display (e.g., "00:00:01,000 → 00:00:03,500")
2. Edit mode appears with two input fields
3. Change start time to "00:00:02,000"
4. Click "Apply"

**Expected Results:**
- ✅ Time editing mode shows Start/End inputs
- ✅ Apply button commits changes
- ✅ Cancel button reverts changes
- ✅ Text view reflects updated timing
- ✅ Duration and CPS recalculate

### Test 4: Add New Caption
**Steps:**
1. Click "Add Caption" button
2. Fill in text for new caption
3. Optionally edit timing

**Expected Results:**
- ✅ New caption appears at end of list
- ✅ Auto-calculated timing (starts at previous caption's end)
- ✅ New caption is automatically active (blue ring)
- ✅ Statistics update (total captions count)

### Test 5: Delete Caption
**Steps:**
1. Click delete button (trash icon) on any caption
2. Confirm deletion in dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Caption is removed from list
- ✅ Statistics update
- ✅ Text view updates to reflect deletion

### Test 6: Validation Warnings
**Steps:**
1. Create a caption with >42 characters per line
2. Create a caption with very short duration (high CPS)
3. View validation summary at top

**Expected Results:**
- ✅ Individual captions show yellow warning badges
- ✅ Validation summary shows total warning count
- ✅ Warnings list specific issues (char count, CPS)

### Test 7: AI Correction Integration
**Steps:**
1. In Visual view, edit some captions
2. Switch to Text view
3. Click "Correct Captions"
4. Wait for AI correction

**Expected Results:**
- ✅ Changes in Visual editor sync to Text view
- ✅ AI correction processes the current caption text
- ✅ Corrected captions appear on right side

### Test 8: View Toggle Persistence
**Steps:**
1. Switch between Text and Visual views multiple times
2. Edit in both views

**Expected Results:**
- ✅ Edits persist across view switches
- ✅ No data loss when switching
- ✅ Visual editor shows latest text changes
- ✅ Text view shows latest visual changes

### Test 9: Empty State
**Steps:**
1. Clear all caption text
2. Observe empty state

**Expected Results:**
- ✅ Empty state message appears
- ✅ "Add First Caption" button shows
- ✅ No toggle buttons (stays in text view)

### Test 10: Download Workflow
**Steps:**
1. Edit captions in Visual editor
2. Click "Correct Captions"
3. Click "Download Corrected Captions"

**Expected Results:**
- ✅ Download includes all visual editor changes
- ✅ File format matches original (SRT or VTT)
- ✅ Downloaded file is valid SRT/VTT format

## Known Limitations

1. **VTT Support**: While parsing works, primarily tested with SRT format
2. **Large Files**: Visual editor may be slower with 100+ captions (not tested)
3. **Caption Reordering**: Drag-and-drop not implemented yet (function exists but no UI)

## Next Steps (After Testing)

1. ✅ Test all scenarios above in browser
2. ⏳ Fix any bugs found during testing
3. ⏳ Add error handling for edge cases:
   - Invalid time formats
   - Malformed SRT input
   - Empty caption text
4. ⏳ Performance optimization if needed
5. ⏳ Additional features:
   - Bulk operations (select multiple captions)
   - Caption search/filter
   - Keyboard shortcuts
   - Drag-and-drop reordering UI

## Browser Compatibility

Tested on: (TO BE FILLED)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Performance Metrics

(TO BE MEASURED)
- Page load time: ___
- Caption parsing time (100 captions): ___
- Visual editor rendering: ___
- Text ↔ Visual sync delay: ___
