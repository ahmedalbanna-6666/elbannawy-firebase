# Real Device Test Protocol

## Mandatory Test Devices

| Device | OS/Browser | Resolution | Orientation | Tested By | Date | Result |
|---|---|---|---|---|---|---|
| iPhone 14 Pro | iOS 17 / Safari | 393×852 | Portrait/Landscape | | | ⬜ |
| iPhone SE (3rd gen) | iOS 17 / Safari | 375×667 | Portrait/Landscape | | | ⬜ |
| Galaxy S23 | Android 14 / Chrome | 430×932 | Portrait/Landscape | | | ⬜ |
| Galaxy Tab S8 | Android 14 / Chrome | 1600×2560 | Portrait/Landscape | | | ⬜ |
| iPad Pro 12.9" | iOS 17 / Safari | 2048×2732 | Portrait/Landscape | | | ⬜ |
| iPad Mini | iOS 17 / Safari | 744×1133 | Portrait/Landscape | | | ⬜ |
| Desktop 1920×1080 | Chrome 125+ | 1920×1080 | N/A | | | ⬜ |
| Desktop 1440×900 | Safari 17 | 1440×900 | N/A | | | ⬜ |

## Test Cases

### 1. Lighthouse Report (Desktop)

```bash
cd apps/web
npm run build
npm run start -p 3000 &
npx lhci autorun
```

Capture the JSON/HTML from `.lighthouseci/` and attach to this document.

**Expected:**
- Performance ≥ 85
- Accessibility ≥ 95
- Best Practices ≥ 90
- SEO ≥ 95
- CLS < 0.1

### 2. Lighthouse Report (Mobile)

```bash
npx lhci collect --settings.preset=mobile
```

**Expected:**
- Performance ≥ 70
- Accessibility ≥ 90

### 3. Bundle Analyzer

```bash
ANALYZE=true npm run build
```

Opens `http://localhost:8888` with interactive treemap of all chunks.

**Measure:**
- Initial JS: ≤ 150KB gzip
- Shared JS: ≤ 100KB gzip
- Largest route chunk: ≤ 80KB gzip
- Vendor chunk: ≤ 80KB gzip

### 4. Chrome Performance Trace

**Steps:**
1. Open Chrome DevTools → Performance tab
2. Click "Record"
3. Navigate: Login → Dashboard → Units → Lesson → Quiz
4. Stop recording
5. Export as `.json` file
6. Look for:
   - Long tasks (> 50ms)
   - Forced reflows
   - Layout shifts
   - Memory leaks in timeline

**Expected:**
- No long tasks > 100ms on initial render
- No forced synchronous layouts
- No layout shifts after paint

### 5. React Profiler Recordings

**Steps:**
1. Open Chrome DevTools → Components → Profiler
2. Click "Record"
3. Interact with:
   - Sidebar open/close (3 times)
   - Bottom nav tab switching (all tabs)
   - Dashboard home → Units → Lesson → Back
   - Dialog open/close
4. Stop recording
5. Look for:
   - Components re-rendering without prop changes
   - Excessive render counts
   - Slow renders (> 5ms)

**Expected:**
- Average commit time < 3ms
- No component renders > 5ms
- No unnecessary re-renders (verify with props diff)

### 6. Memory Leak Test

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/memory-leak-audit.mjs
```

**In Browser:**
1. Open Chrome DevTools → Memory
2. Take heap snapshot
3. Open/close dialog 10 times
4. Take heap snapshot
5. Diff should show < 50KB growth per cycle

**Expected:**
- No detached DOM nodes
- No growing event listener count
- Heap stable after GC

### 7. Device-Specific Tests

#### iPhone Safari
- [ ] Safe area respected (notch + home indicator)
- [ ] Bottom nav fully visible with gesture bar
- [ ] Keyboard doesn't overlap inputs
- [ ] PWA install prompt works
- [ ] Standalone mode navigation works
- [ ] Scroll performance smooth (60 FPS)
- [ ] Landscape video player fills screen

#### Android Chrome
- [ ] Gesture navigation doesn't hide content
- [ ] Bottom nav has adequate touch targets
- [ ] Back button navigates correctly
- [ ] PWA install prompt works
- [ ] Text not too small on high-DPI
- [ ] Orientation change doesn't lose state

#### iPad
- [ ] Sidebar is persistent (not overlay)
- [ ] Sidebar width is adequate (280px)
- [ ] Bottom nav is hidden
- [ ] Split view works (if supported)
- [ ] Landscape uses full width

#### Desktop Safari
- [ ] Font rendering matches Chrome
- [ ] Scroll behavior smooth
- [ ] Keyboard shortcuts work
- [ ] RTL layout correct in full screen

### 8. RTL Visual Regression

For every page, verify:
- [ ] Text is right-aligned
- [ ] Sidebar opens from right
- [ ] Chevrons point correct direction
- [ ] Switch toggles correct direction
- [ ] Breadcrumbs correct direction
- [ ] Toast appears in correct position
- [ ] Dialog close button on correct side

### 9. Accessibility Manual Test

- [ ] Tab through all interactive elements (no keyboard trap)
- [ ] Focus rings visible on all focusable elements
- [ ] NVDA/VoiceOver reads all content correctly
- [ ] Skip link appears on first Tab
- [ ] Dialog traps focus
- [ ] Dialog Escape closes
- [ ] Dialog returns focus on close
- [ ] Color contrast sufficient (use axe DevTools)

### 10. Network Throttling Test

DevTools → Network → Slow 3G:
- [ ] Skeleton loaders appear immediately
- [ ] No layout shift when content loads
- [ ] First paint < 3s
- [ ] LCP < 5s
- [ ] Interactive < 5s

---

## Result Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| QA Engineer | | | |
| Lead Frontend | | | |
| Product Owner | | | |
