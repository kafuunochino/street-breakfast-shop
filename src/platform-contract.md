# Canvas platform contract

`startGame(platform)` in `src/main.js` returns `{ destroy(), inspect() }`. `inspect()` is read-only diagnostics and is not a gameplay action API.

All gameplay controls and artwork are drawn in Canvas 2D. The browser only attaches a canvas; its adapter isolates DOM, browser storage, audio, and pointer input. No DOM controls, HTML art, CSS rendering, fetch, or external asset hosts are used by the game renderer. The earlier H5 / DOM draft is archived in `archive/h5-draft` and excluded from platform builds.

Required platform fields:

- `canvas`: Canvas with `getContext('2d')`.
- `getSize()`: `{ width, height, dpr }` in logical pixels. Adapter owns backing buffer sizing.
- `onPointer(fn)`: subscribe to `{ type: 'down' | 'move' | 'up' | 'cancel', x, y, id }`; return unsubscribe.
- `onResize(fn)`, `onPause(fn)`, `onResume(fn)`: return unsubscribe.
- `requestFrame(fn)`, `cancelFrame(id)`: host frame scheduling.
- `storage.getItem(key)`, `storage.setItem(key, string)`: may throw; renderer safely degrades without saves.
- `audio.play(name)`, `audio.setMuted(boolean)`: host audio; unknown/unavailable sounds must be harmless.

Renderer applies DPR once with `ctx.setTransform`, then fits its 390 × 780 portrait logical layout in the available viewport. Resize discards pending pointer gestures. Pause stops cooking progress; resume does not advance time spent hidden.

Adapters are copied from the shared runtime proof. A source adapter is not official platform certification. The `tt` build still requires official developer-tool and real-device testing before claiming Douyin compatibility.
