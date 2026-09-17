import type { Operator, RegisterWrite, Voice } from "./types";

export const MASTER_CLOCK = 7_670_454;

const OPERATOR_REGISTER_OFFSETS = [0, 8, 4, 12] as const;
const KEY_CHANNEL_CODES = [0, 1, 2, 4, 5, 6] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

export function encodeDetune(detune: number): number {
  const value = clamp(detune, -3, 3);
  if (value >= 0) return value;
  return 4 + Math.abs(value);
}

function channelBus(channel: number): { port: 0 | 1; index: number } {
  const safe = clamp(channel, 0, 5);
  return {
    port: safe < 3 ? 0 : 1,
    index: safe % 3,
  };
}

function operatorWrites(
  port: 0 | 1,
  channelIndex: number,
  operatorIndex: number,
  operator: Operator,
): RegisterWrite[] {
  const offset = OPERATOR_REGISTER_OFFSETS[operatorIndex] + channelIndex;
  return [
    {
      port,
      address: 0x30 + offset,
      value:
        (encodeDetune(operator.detune) << 4) |
        clamp(operator.multiplier, 0, 15),
    },
    {
      port,
      address: 0x40 + offset,
      value: clamp(operator.totalLevel, 0, 127),
    },
    {
      port,
      address: 0x50 + offset,
      value:
        (clamp(operator.rateScale, 0, 3) << 6) |
        clamp(operator.attack, 0, 31),
    },
    {
      port,
      address: 0x60 + offset,
      value:
        (operator.amEnabled ? 0x80 : 0) | clamp(operator.decay, 0, 31),
    },
    {
      port,
      address: 0x70 + offset,
      value: clamp(operator.sustain, 0, 31),
    },
    {
      port,
      address: 0x80 + offset,
      value:
        (clamp(operator.sustainLevel, 0, 15) << 4) |
        clamp(operator.release, 0, 15),
    },
    {
      port,
      address: 0x90 + offset,
      value: clamp(operator.ssgEg, 0, 15),
    },
  ];
}

export function voiceToRegisterWrites(
  channel: number,
  voice: Voice,
): RegisterWrite[] {
  const { port, index } = channelBus(channel);
  const writes = voice.operators.flatMap((operator, operatorIndex) =>
    operatorWrites(port, index, operatorIndex, operator),
  );

  const panBits =
    voice.pan === "left" ? 0x80 : voice.pan === "right" ? 0x40 : 0xc0;

  writes.push(
    {
      port,
      address: 0xb0 + index,
      value:
        (clamp(voice.feedback, 0, 7) << 3) |
        clamp(voice.algorithm, 0, 7),
    },
    {
      port,
      address: 0xb4 + index,
      value:
        panBits |
        (clamp(voice.ams, 0, 3) << 4) |
        clamp(voice.pms, 0, 7),
    },
  );
  return writes;
}

export function midiNoteToFrequency(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

export function noteToFrequencyWrites(
  channel: number,
  note: number,
  pitchBendSemitones = 0,
): RegisterWrite[] {
  const { port, index } = channelBus(channel);
  const frequency = midiNoteToFrequency(note + pitchBendSemitones);

  let block = 0;
  let fNumber = 0;
  for (let candidate = 0; candidate <= 7; candidate += 1) {
    const calculated = Math.round(
      (frequency * 144 * 2 ** (20 - candidate)) / MASTER_CLOCK,
    );
    if (calculated <= 2047) {
      block = candidate;
      fNumber = calculated;
      break;
    }
  }

  fNumber = clamp(fNumber, 0, 2047);
  return [
    {
      port,
      address: 0xa4 + index,
      value: (block << 3) | ((fNumber >> 8) & 0x07),
    },
    {
      port,
      address: 0xa0 + index,
      value: fNumber & 0xff,
    },
  ];
}

export function keyWrite(channel: number, on: boolean): RegisterWrite {
  const safe = clamp(channel, 0, 5);
  return {
    port: 0,
    address: 0x28,
    value: (on ? 0xf0 : 0x00) | KEY_CHANNEL_CODES[safe],
  };
}
