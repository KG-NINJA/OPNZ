import createNukedModule from "../public/audio/nuked-opn2.js";

const module = await createNukedModule();
const slots = [0, 8, 4, 12];

function write(address, value, port = 0) {
  module._opnz_write(port, address, value);
}

function programTestVoice() {
  slots.forEach((slot, index) => {
    write(0x30 + slot, 0x01);
    write(0x40 + slot, index === 0 ? 0x00 : 0x7f);
    write(0x50 + slot, 0x1f);
    write(0x60 + slot, 0x00);
    write(0x70 + slot, 0x00);
    write(0x80 + slot, 0x0f);
    write(0x90 + slot, 0x00);
  });
  write(0xb0, 0x07);
  write(0xb4, 0xc0);
  write(0xa4, 0x22);
  write(0xa0, 0x84);
  write(0x28, 0xf0);
}

function renderSignature() {
  module._opnz_render(4096);
  const base = module._opnz_buffer_ptr() >> 1;
  let energy = 0;
  let hash = 2166136261;
  for (let index = 0; index < 8192; index += 1) {
    const sample = module.HEAP16[base + index];
    energy += Math.abs(sample);
    hash ^= sample & 0xffff;
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return { energy, hash };
}

module._opnz_init();
programTestVoice();
const first = renderSignature();
module._opnz_reset();
programTestVoice();
const second = renderSignature();

if (first.energy < 1000) {
  throw new Error(`Nuked-OPN2 produced insufficient signal energy: ${first.energy}`);
}
if (first.hash !== second.hash || first.energy !== second.energy) {
  throw new Error(
    `Nuked-OPN2 output is not deterministic: ${JSON.stringify({ first, second })}`,
  );
}

console.log(`Nuked-OPN2 PCM check passed: energy=${first.energy} hash=${first.hash}`);
