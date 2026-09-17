import { describe, expect, it } from "vitest";
import { INIT_VOICE } from "./presets";
import {
  encodeDetune,
  keyWrite,
  midiNoteToFrequency,
  noteToFrequencyWrites,
  voiceToRegisterWrites,
} from "./registers";

describe("OPN2 register conversion", () => {
  it("encodes positive and negative detune values", () => {
    expect(encodeDetune(0)).toBe(0);
    expect(encodeDetune(3)).toBe(3);
    expect(encodeDetune(-1)).toBe(5);
    expect(encodeDetune(-3)).toBe(7);
  });

  it("maps logical operators to the OPN2 slot order", () => {
    const writes = voiceToRegisterWrites(0, INIT_VOICE);
    const multiplierAddresses = writes
      .filter((write) => write.address >= 0x30 && write.address < 0x40)
      .map((write) => write.address);
    expect(multiplierAddresses).toEqual([0x30, 0x38, 0x34, 0x3c]);
  });

  it("moves channels four through six to port one", () => {
    const writes = voiceToRegisterWrites(4, INIT_VOICE);
    expect(writes.every((write) => write.port === 1)).toBe(true);
    expect(writes.at(-2)?.address).toBe(0xb1);
  });

  it("generates high-byte then low-byte frequency writes", () => {
    const writes = noteToFrequencyWrites(0, 69);
    expect(writes).toHaveLength(2);
    expect(writes[0].address).toBe(0xa4);
    expect(writes[1].address).toBe(0xa0);
    expect(midiNoteToFrequency(69)).toBe(440);
  });

  it("uses the YM2612 key channel gap for channels four to six", () => {
    expect(keyWrite(0, true).value).toBe(0xf0);
    expect(keyWrite(3, true).value).toBe(0xf4);
    expect(keyWrite(5, false).value).toBe(0x06);
  });
});
