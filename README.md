# OPNZ — OPN2 Playground

OPNZ is a browser-based six-channel FM synthesizer powered by the
cycle-accurate [Nuked-OPN2](https://github.com/nukeykt/Nuked-OPN2) YM3438 core.
It turns the original C library into a WebAssembly audio engine and exposes a
playable four-operator voice editor, computer keyboard, Web MIDI input,
presets, oscilloscope, and local recording.

## Architecture

```text
React controls / MIDI / keyboard
             │ timestamped commands
             ▼
      AudioWorkletProcessor
             │ register writes + render
             ▼
       Nuked-OPN2 WebAssembly
             │ 53.267 kHz native stereo
             ▼
        linear resampler → Web Audio
```

The emulator never runs on the React/UI thread. The AudioWorklet owns chip
state, register writes, voice allocation, native-rate rendering, and output
resampling.

## Local development

Prerequisites:

- Node.js 22 or later
- Emscripten (`emcc`)

```bash
npm install
npm run build:wasm
npm run dev
```

Run validation:

```bash
npm test
npm run build
```

## Keyboard

The lower row maps chromatically from C:

```text
Z S X D C V G B H N J M , L . ; /
```

Use `−` and `+` beside Octave to transpose the computer keyboard.

## Licensing

The OPNZ application is MIT licensed. Nuked-OPN2 remains LGPL-2.1-or-later;
its pinned corresponding source and original license are included in
`vendor/Nuked-OPN2/`. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

No game music, game patches, ROM data, or manufacturer branding is bundled.
