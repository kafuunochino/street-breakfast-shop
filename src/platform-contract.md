# Canvas platform contract

`startGame(platform)` in `src/main.js` returns `{ destroy(), inspect() }`. `inspect()` is read-only diagnostics and is not a gameplay action API.

All gameplay controls and artwork are drawn in Canvas 2D. The browser only attaches a canvas; its adapter isolates DOM, browser storage, audio, and pointer input. No DOM controls, HTML art, CSS rendering, fetch, or external asset hosts are used by the game renderer. The earlier H5 / DOM draft is archived in `archive/h5-draft` and excluded from platform builds.

Required platform fields:

- `canvas`: Canvas with `getContext('2d')`.
- `getSize()`: `{ width, height, dpr, safeInsets? }` in logical pixels. Adapter owns backing buffer sizing.
- `onPointer(fn)`: subscribe to `{ type: 'down' | 'move' | 'up' | 'cancel', x, y, id }`; return unsubscribe.
- `onResize(fn)`, `onPause(fn)`, `onResume(fn)`: return unsubscribe.
- `requestFrame(fn)`, `cancelFrame(id)`: host frame scheduling.
- `storage.getItem(key)`, `storage.setItem(key, string)`: may throw; renderer safely degrades without saves.
- `audio.play(name)`, `audio.setMuted(boolean)`: host audio; unknown/unavailable sounds must be harmless.

`safeInsets` is `{ top, right, bottom, left }` in logical viewport pixels and defaults to zero. Pointer x/y remain full-viewport coordinates, not safe-area-relative. Browser reads the CSS safe-area variables; tt measures safeArea / statusBarHeight, conservatively reserves 48px above gameplay, and guards optional capsule bounds lookup. Real host placement is not yet validated.

Renderer applies DPR once with `ctx.setTransform`, offsets by safe insets, and scales its 360px-wide portrait world by available width (maximum 1.25). It derives the world height from the remaining viewport; short screens compress decoration, not the whole interface. Every interactive target is at least 56 logical pixels tall; tested widths of 320px, including 12px side insets, preserve at least 44 physical pixels. Extremely short landscape and widths below 320px remain outside the tested range.

Resize discards pending pointer gestures. Switching prep / cook / serve stations continues cooking. Opening any menu / receipt screen or hiding the app pauses progress; resume does not advance hidden time. Redo is always available on each station, and no view may bypass the pure recipe validation.

Adapters are copied from the shared runtime proof. A source adapter is not official platform certification. The `tt` build still requires official developer-tool and real-device testing before claiming Douyin compatibility.

## Optional Douyin sidebar

`platform.sidebar` may provide `getState()`, `subscribe(fn)`, `navigate()` and `destroy()`. The generated tt entry registers this feature synchronously before creating the Canvas. The renderer shows a real Canvas CTA only when available; an explicit confirmation button calls navigation. Returning via sidebar is determined by the latest exact onShow fields, never navigation success, and no reward is promised. Browser platforms may omit the feature entirely.

## Rewarded continuation hook (0.3.0)

Optional `platform.rewards` exposes `getState()`, `request({placement, context})`, `cancel()`, `destroy()`; mock mode additionally exposes `resolveMock(status)`. Requests resolve `{status, requestId}` and never award game resources themselves. The renderer accepts completed results only for its exact active runId/failureId/request token and a failed round that has not already used its one continuation.

Browser/offline explicitly inject mock mode and draw all four result choices in Canvas. The TT bootstrap injects a default-disabled service with no ad ID. Host pause/resume stops drawing/cooking but does not cancel a pending ad. Starting a new round cancels and invalidates old callbacks. Failure always offers a free restart. Coin continuation is an atomic separate path and shares the once-per-round cap. See docs/REWARDED_AD_CONTRACT.md before any future live activation.

## Fifty-shift state

The same pure reducer owns queue selection, fuel, cooking-turn patience, held meals and paired serving. Cooking turns advance only on COOK, not pointer events, waiting, menus, or wall-clock time. Visible-arrival records ensure newly shown guests have a clear first chance. Renderer animation time affects only illustrations and actual pan heat progress. Saves use content version2 under the existing key, carrying completed shifts, currency, limited inventory and monotonic round IDs, not the unfinished board.

Unfinished boards restart on reload; a sanitized `pendingSpend` receipt persists any consumed tool / coin continuation together with its debit. Reload or an explicit new run returns those resources once, while successful completion clears the receipt without refund. Bought but unused inventory remains owned. Paid effects are applied only after the same storage write succeeds. Tool overflow during refund returns its purchase price instead of exceeding the inventory cap.

A press that moves more than12 viewport/CSS pixels remains cancelled even if it returns to the button. The browser adapter maps lost capture and window blur to pointer cancellation. Pointer identity remains owned until release/cancel; normal taps and multi-touch isolation are separately covered through the exact offline HTML.
