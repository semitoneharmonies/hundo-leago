# Daily chat motion — combined analytics release, 27 November 2026

## Approved behavior

Integrated the five effects approved on 25 November: stronger wiggle, brighter shimmer, balloon/pop, soft spin, and grow/shrink. The frozen reference is `E:/hundo-leago/.hundo.local/daily-chat-motion-20261125/approved-preview.html`, SHA-256 `28a68320a28cae003e5d255bbdf43821335a653d16ef969e191b06ca4f38e00e`.

The first burst starts after eight eligible seconds. Each burst lasts 1.1 seconds; later starts are eight seconds apart, leaving approximately 6.9 seconds still. The sequence loops in the approved order. All six CSS keyframe definitions (shimmer uses glow and sweep) match the reference exactly apart from the application namespace. Approved timing functions, amplitudes, teal gradient, sparkle and brighter shimmer are retained.

Only an inner 36px face animates. The outer 36px button and unread badge stay stationary. Hover, focus, open chat, hidden documents, reduced-motion preference and less than 10% visible launcher area cancel both timers and clear the current effect. Resuming waits a fresh eight seconds, without catching up missed bursts. Closing chat returns focus as before; motion remains paused until that focus leaves. Without IntersectionObserver or matchMedia support the launcher stays still. Unmount removes listeners, observer and timers. A matching-specificity reduced-motion CSS rule provides an additional safeguard.

The previous 18-second nudge and independent seven-second shimmer are removed. Chat permissions, API requests, polling, unread persistence, send/retry behavior and aggregate chat open/send hooks retain their existing behavior. Motion itself creates no network request, persistence or analytics event.

## Files

- `src/features/daily/DailyChat.jsx`: attach motion hook and wrap icons in the inner face.
- `src/features/daily/DailyChat.css`: exact approved effects on the face; stationary button/badge.
- `src/features/daily/useDailyChatMotion.js`: in-memory scheduling, suppression and cleanup.
- `src/features/daily/useDailyChatMotion.test.jsx`: timing, all pause conditions, overlapping pauses, open/returned focus, StrictMode replay, missing observer support, legacy media listener and unmount cleanup coverage.
- `e2e/fixtures/daily-chat-motion.html`, `.jsx`, `.css`: real DailyChat local browser fixture with sample data; no backend transport. The fixture records real start times and button dimensions and provides offscreen/open/close checks.

## Verification

Focused run: 22/22 tests passed (14 new scheduling tests and 8 existing chat tests). Scoped ESLint and Git diff checks passed. A separate read-only script verified the frozen preview hash and exact six keyframe bodies and confirmed no old nudge or infinite animation remains.

```powershell
Set-Location 'E:\hundo-leago\.hundo.local\admin-analytics-20261127\frontend'
& 'E:\hundo-tools\node-v24.14.1-win-x64\node.exe' node_modules/vitest/vitest.mjs run src/features/daily/useDailyChatMotion.test.jsx src/features/daily/DailyChat.test.jsx
& 'E:\hundo-tools\node-v24.14.1-win-x64\node.exe' node_modules/eslint/bin/eslint.js src/features/daily/DailyChat.jsx src/features/daily/useDailyChatMotion.js src/features/daily/useDailyChatMotion.test.jsx e2e/fixtures/daily-chat-motion.jsx
```

Browser fixture: `http://127.0.0.1:5186/e2e/fixtures/daily-chat-motion.html`. Browser acceptance and the combined frontend regression/build are recorded by the release owner in the combined release receipt. A visual preview is not physical-device or production acceptance. Deployment is authorized as part of the combined analytics release; this implementation checkpoint itself did not commit, push, deploy, or change live data.
