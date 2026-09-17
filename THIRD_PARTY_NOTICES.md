# Third-party notices

## Nuked-OPN2

OPNZ uses **Nuked-OPN2**, a cycle-accurate Yamaha YM3438/YM2612-family
emulator by Alexey Khokholov (Nuke.YKT).

- Upstream: https://github.com/nukeykt/Nuked-OPN2
- Pinned commit: `335747d78cb0abbc3b55b004e62dad9763140115`
- License: GNU Lesser General Public License v2.1 or later
- Corresponding source: `vendor/Nuked-OPN2/`
- Local build wrapper: `wasm/opn2_adapter.c`
- Rebuild command: `npm run build:wasm`

The upstream license is preserved at `vendor/Nuked-OPN2/LICENSE`.

## MMLisp implementation research

The WebAssembly boundary and native-rate rendering strategy were informed by
the open-source MMLisp player by Hiroshi Okamura (5&UP Inc.). MMLisp is
licensed under the MIT License.

- Project: https://github.com/5up-okamura/mmlisp
- Copyright (c) 2026 Hiroshi Okamura (5&UP Inc.)

The OPNZ application code and adapter were written for this project; this
notice preserves attribution for the implementation research.
