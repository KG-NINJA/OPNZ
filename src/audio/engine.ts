import type { EngineStatus, RegisterWrite, Voice } from "./types";
import { voiceToRegisterWrites } from "./registers";

type StatusListener = (status: EngineStatus, message?: string) => void;

export class Opn2Engine {
  private context: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private master: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private recordingDestination: MediaStreamAudioDestinationNode | null = null;
  private recorder: MediaRecorder | null = null;
  private recordingChunks: Blob[] = [];
  private statusListener: StatusListener;
  private readyPromise: Promise<void> | null = null;
  private resolveReady: (() => void) | null = null;
  private rejectReady: ((error: Error) => void) | null = null;

  constructor(statusListener: StatusListener) {
    this.statusListener = statusListener;
  }

  get analyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  get sampleRate(): number {
    return this.context?.sampleRate ?? 0;
  }

  async start(voices: Voice[]): Promise<void> {
    if (!this.context) {
      await this.initialize(voices);
    }
    await this.context?.resume();
  }

  private async initialize(voices: Voice[]): Promise<void> {
    this.statusListener("loading");
    this.context = new AudioContext({ latencyHint: "interactive" });
    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });

    try {
      const workletUrl = new URL(
        `${import.meta.env.BASE_URL}audio/opn2-worklet.js`,
        window.location.href,
      );
      await this.context.audioWorklet.addModule(workletUrl);
      this.node = new AudioWorkletNode(this.context, "opnz-processor", {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      this.master = this.context.createGain();
      this.master.gain.value = 0.72;
      this.analyserNode = this.context.createAnalyser();
      this.analyserNode.fftSize = 1024;
      this.analyserNode.smoothingTimeConstant = 0.72;
      this.recordingDestination = this.context.createMediaStreamDestination();

      this.node.connect(this.master);
      this.master.connect(this.analyserNode);
      this.analyserNode.connect(this.context.destination);
      this.master.connect(this.recordingDestination);

      this.node.port.onmessage = (event: MessageEvent) => {
        const message = event.data as { type?: string; error?: string };
        if (message.type === "ready") {
          this.resolveReady?.();
          this.statusListener("ready");
        }
        if (message.type === "error") {
          const error = new Error(message.error ?? "Audio engine failed");
          this.rejectReady?.(error);
          this.statusListener("error", error.message);
        }
      };

      await this.readyPromise;
      voices.forEach((voice, channel) => this.setVoice(channel, voice));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.statusListener("error", message);
      await this.context.close();
      this.context = null;
      throw error;
    }
  }

  async suspend(): Promise<void> {
    this.panic();
    await this.context?.suspend();
  }

  setVoice(channel: number, voice: Voice): void {
    this.sendWrites(voiceToRegisterWrites(channel, voice));
  }

  setLfo(enabled: boolean, rate: number): void {
    const value = (enabled ? 0x08 : 0) | Math.max(0, Math.min(7, rate));
    this.sendWrites([{ port: 0, address: 0x22, value }]);
  }

  setDacEnabled(enabled: boolean): void {
    this.sendWrites([{ port: 0, address: 0x2b, value: enabled ? 0x80 : 0x00 }]);
  }

  noteOn(note: number, velocity = 100): void {
    this.node?.port.postMessage({ type: "note-on", note, velocity });
  }

  noteOff(note: number): void {
    this.node?.port.postMessage({ type: "note-off", note });
  }

  panic(): void {
    this.node?.port.postMessage({ type: "panic" });
  }

  private sendWrites(writes: RegisterWrite[]): void {
    this.node?.port.postMessage({ type: "writes", writes });
  }

  startRecording(): boolean {
    if (!this.recordingDestination || typeof MediaRecorder === "undefined") {
      return false;
    }
    this.recordingChunks = [];
    this.recorder = new MediaRecorder(this.recordingDestination.stream);
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordingChunks.push(event.data);
    };
    this.recorder.start(250);
    return true;
  }

  stopRecording(): Promise<Blob | null> {
    if (!this.recorder || this.recorder.state === "inactive") {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      if (!this.recorder) return resolve(null);
      this.recorder.onstop = () => {
        resolve(
          new Blob(this.recordingChunks, {
            type: this.recorder?.mimeType || "audio/webm",
          }),
        );
      };
      this.recorder.stop();
    });
  }
}
