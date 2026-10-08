# Bugs & QA Log: S2DIO

Total test cases executed: 11  
Passed: 11  
Failed: 0  
Open S1/S2 bugs: 0  

---

### BUG-001: AudioStage missing screen control action button for guest
- Severity: S2
- Flow / case: F04-H1
- Screen: S03 / S08
- Build: 2026-10-08-prod-init  Browser / device: Chromium 140, 1440px
- Steps:
  1. Open `/guest/test-session-1` as collaborator.
  2. Click "Start Listening Now".
  3. Attempt to request remote DAW screen control.
- Expected: "Request Control" button visible in top-right participant/control bar.
- Actual: Guest could not see request button on canvas; control status remained inactive.
- Evidence: Playwright failure `getByRole('button', { name: /request control/i }) failed to resolve`.
- Suspected cause: Component was missing explicit JSX conditional rendering for collaborator control action.
- Status: Fixed in commit `src/components/AudioStage.tsx` with request button and host grant/deny prompts.

---

### BUG-002: Mixer popover mute button lacked accessible name and conflicted with other controls
- Severity: S3
- Flow / case: F03-H1
- Screen: S04 (MixerPopover)
- Build: 2026-10-08-prod-init  Browser / device: Chromium 140, 1440px
- Steps:
  1. Open `/session/:slug`.
  2. Click "Mixer Trims" to open console faders.
  3. Attempt to click 'M' button via screen reader or automated test locator.
- Expected: Mute button has unambiguous accessible label (e.g., `Mute Master DAW`).
- Actual: Button only had single letter 'M' without `aria-label`, creating ambiguity with other buttons.
- Evidence: Playwright locator timeout on `getByRole('button', { name: 'M' })`.
- Status: Fixed in commit `src/components/AudioChannelStrip.tsx` with `aria-label="Mute {channel.name}"`.

---

### BUG-003: Home studio launch blocked on empty input without default fallback
- Severity: S3
- Flow / case: F01-H1 / F01-E1
- Screen: S01 / S02 (Home Hub)
- Build: 2026-10-08-prod-init  Browser / device: Chromium 140, 1440px
- Steps:
  1. Navigate to `/`.
  2. Leave session name input blank.
  3. Click "Open Studio →".
- Expected: Auto-generates session with default title ("Studio Session") and redirects immediately.
- Actual: Early return prevented form submission if input was empty.
- Evidence: Form did not submit without manual typing.
- Status: Fixed in `src/app/page.tsx` by providing default title fallback `inputValue.trim() || "Studio Session"`.
