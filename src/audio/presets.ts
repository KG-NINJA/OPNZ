import type { Operator, Voice } from "./types";

const op = (overrides: Partial<Operator> = {}): Operator => ({
  attack: 31,
  decay: 10,
  sustain: 8,
  release: 7,
  sustainLevel: 6,
  totalLevel: 48,
  multiplier: 1,
  detune: 0,
  rateScale: 0,
  amEnabled: false,
  ssgEg: 0,
  ...overrides,
});

export const INIT_VOICE: Voice = {
  schemaVersion: 1,
  name: "INIT VOICE",
  algorithm: 7,
  feedback: 2,
  operators: [
    op({ totalLevel: 24 }),
    op({ totalLevel: 30 }),
    op({ totalLevel: 36 }),
    op({ totalLevel: 20 }),
  ],
  ams: 0,
  pms: 0,
  pan: "center",
};

export const FACTORY_PRESETS: Voice[] = [
  INIT_VOICE,
  {
    ...INIT_VOICE,
    name: "Bright EP",
    algorithm: 4,
    feedback: 3,
    operators: [
      op({ multiplier: 1, totalLevel: 22, decay: 11, sustainLevel: 5 }),
      op({ multiplier: 2, totalLevel: 58, decay: 16, sustain: 12 }),
      op({ multiplier: 1, totalLevel: 28, decay: 10 }),
      op({ multiplier: 4, totalLevel: 66, decay: 20, release: 9 }),
    ],
  },
  {
    ...INIT_VOICE,
    name: "Deep Bass",
    algorithm: 2,
    feedback: 6,
    operators: [
      op({ multiplier: 1, totalLevel: 18, decay: 7, sustainLevel: 4 }),
      op({ multiplier: 1, totalLevel: 34, decay: 9 }),
      op({ multiplier: 2, totalLevel: 52, decay: 13 }),
      op({ multiplier: 1, totalLevel: 10, decay: 6, release: 5 }),
    ],
  },
  {
    ...INIT_VOICE,
    name: "Metal Bell",
    algorithm: 5,
    feedback: 1,
    operators: [
      op({ multiplier: 1, totalLevel: 18, decay: 18, sustain: 22 }),
      op({ multiplier: 7, detune: 2, totalLevel: 44, decay: 20 }),
      op({ multiplier: 4, detune: -1, totalLevel: 48, decay: 22 }),
      op({ multiplier: 11, totalLevel: 56, decay: 24, release: 12 }),
    ],
  },
  {
    ...INIT_VOICE,
    name: "Soft Pad",
    algorithm: 7,
    feedback: 1,
    operators: [
      op({ attack: 8, decay: 4, sustain: 3, release: 8, totalLevel: 28 }),
      op({ attack: 7, decay: 5, sustain: 4, release: 9, totalLevel: 40 }),
      op({ attack: 9, decay: 3, sustain: 2, release: 8, totalLevel: 44, detune: -1 }),
      op({ attack: 6, decay: 4, sustain: 4, release: 10, totalLevel: 35, detune: 1 }),
    ],
  },
  {
    ...INIT_VOICE,
    name: "FM Lead",
    algorithm: 3,
    feedback: 5,
    pms: 2,
    operators: [
      op({ multiplier: 1, totalLevel: 12, decay: 8 }),
      op({ multiplier: 2, totalLevel: 38, decay: 12 }),
      op({ multiplier: 3, totalLevel: 50, decay: 13 }),
      op({ multiplier: 1, totalLevel: 18, decay: 7 }),
    ],
  },
  {
    ...INIT_VOICE,
    name: "Warm Keys",
    algorithm: 6,
    feedback: 2,
    operators: [
      op({ multiplier: 1, totalLevel: 22, decay: 9 }),
      op({ multiplier: 2, totalLevel: 48, decay: 12 }),
      op({ multiplier: 1, totalLevel: 32, decay: 10, detune: -1 }),
      op({ multiplier: 3, totalLevel: 54, decay: 14, detune: 1 }),
    ],
  },
  {
    ...INIT_VOICE,
    name: "Short Pluck",
    algorithm: 4,
    feedback: 4,
    operators: [
      op({ decay: 22, sustain: 28, release: 13, sustainLevel: 13, totalLevel: 18 }),
      op({ multiplier: 3, decay: 26, sustain: 29, release: 14, totalLevel: 46 }),
      op({ multiplier: 1, decay: 24, sustain: 28, release: 13, totalLevel: 30 }),
      op({ multiplier: 5, decay: 28, sustain: 30, release: 15, totalLevel: 52 }),
    ],
  },
];

export function cloneVoice(voice: Voice): Voice {
  return structuredClone(voice);
}
