import createNukedModule from "./nuked-opn2.js";

const CHANNEL_CODES = [0, 1, 2, 4, 5, 6];
const MASTER_CLOCK = 7_670_454;
const OUTPUT_GAIN = 2.8;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function noteFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function frequencyWrites(channel, note) {
  const port = channel < 3 ? 0 : 1;
  const index = channel % 3;
  const frequency = noteFrequency(note);
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
    [port, 0xa4 + index, (block << 3) | ((fNumber >> 8) & 7)],
    [port, 0xa0 + index, fNumber & 0xff],
  ];
}

class OpnzProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.module = null;
    this.bufferBase = 0;
    this.nativeRate = 7_670_454 / 144;
    this.phase = 0;
    this.currentLeft = 0;
    this.currentRight = 0;
    this.nextLeft = 0;
    this.nextRight = 0;
    this.channels = Array.from({ length: 6 }, () => ({
      note: null,
      startedAt: 0,
      releasing: false,
    }));
    this.sequence = 0;
    this.pending = [];
    this.port.onmessage = (event) => {
      if (!this.module) this.pending.push(event.data);
      else this.handle(event.data);
    };
    this.initialize();
  }

  async initialize() {
    try {
      this.module = await createNukedModule();
      this.module._opnz_init();
      this.bufferBase = this.module._opnz_buffer_ptr() >> 1;
      this.nativeRate = this.module._opnz_native_rate();
      for (const message of this.pending) this.handle(message);
      this.pending.length = 0;
      this.port.postMessage({ type: "ready" });
    } catch (error) {
      this.port.postMessage({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  write(port, address, value) {
    this.module._opnz_write(port, address, value);
  }

  key(channel, on) {
    this.write(0, 0x28, (on ? 0xf0 : 0) | CHANNEL_CODES[channel]);
  }

  selectChannel() {
    const free = this.channels.findIndex((channel) => channel.note === null);
    if (free >= 0) return free;
    let selected = 0;
    for (let index = 1; index < this.channels.length; index += 1) {
      const candidate = this.channels[index];
      const current = this.channels[selected];
      if (candidate.releasing && !current.releasing) selected = index;
      else if (
        candidate.releasing === current.releasing &&
        candidate.startedAt < current.startedAt
      ) {
        selected = index;
      }
    }
    return selected;
  }

  noteOn(note) {
    const existing = this.channels.findIndex((channel) => channel.note === note);
    const channel = existing >= 0 ? existing : this.selectChannel();
    if (this.channels[channel].note !== null) this.key(channel, false);
    for (const [port, address, value] of frequencyWrites(channel, note)) {
      this.write(port, address, value);
    }
    this.key(channel, true);
    this.channels[channel] = {
      note,
      startedAt: ++this.sequence,
      releasing: false,
    };
  }

  noteOff(note) {
    this.channels.forEach((channel, index) => {
      if (channel.note === note) {
        this.key(index, false);
        channel.releasing = true;
        channel.note = null;
      }
    });
  }

  panic() {
    this.channels.forEach((channel, index) => {
      this.key(index, false);
      channel.note = null;
      channel.releasing = false;
    });
  }

  handle(message) {
    if (message.type === "writes") {
      for (const write of message.writes) {
        this.write(write.port, write.address, write.value);
      }
    } else if (message.type === "note-on") {
      this.noteOn(message.note);
    } else if (message.type === "note-off") {
      this.noteOff(message.note);
    } else if (message.type === "panic") {
      this.panic();
    }
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    if (!output || output.length < 2) return true;
    const left = output[0];
    const right = output[1];
    if (!this.module) {
      left.fill(0);
      right.fill(0);
      return true;
    }

    const ratio = this.nativeRate / sampleRate;
    const needed = Math.min(
      4096,
      Math.floor(this.phase + left.length * ratio) + 2,
    );
    this.module._opnz_render(needed);
    const heap = this.module.HEAP16;
    let sourceIndex = 0;

    for (let frame = 0; frame < left.length; frame += 1) {
      const t = this.phase;
      let sampleLeft = this.currentLeft * (1 - t) + this.nextLeft * t;
      let sampleRight = this.currentRight * (1 - t) + this.nextRight * t;
      this.phase += ratio;
      while (this.phase >= 1) {
        this.phase -= 1;
        this.currentLeft = this.nextLeft;
        this.currentRight = this.nextRight;
        const offset = this.bufferBase + sourceIndex * 2;
        this.nextLeft = heap[offset] / 512;
        this.nextRight = heap[offset + 1] / 512;
        sourceIndex += 1;
      }
      sampleLeft = clamp(sampleLeft * OUTPUT_GAIN, -1, 1);
      sampleRight = clamp(sampleRight * OUTPUT_GAIN, -1, 1);
      left[frame] = sampleLeft;
      right[frame] = sampleRight;
    }
    return true;
  }
}

registerProcessor("opnz-processor", OpnzProcessor);
