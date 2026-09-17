export type Pan = "left" | "center" | "right";

export type Operator = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  sustainLevel: number;
  totalLevel: number;
  multiplier: number;
  detune: number;
  rateScale: number;
  amEnabled: boolean;
  ssgEg: number;
};

export type Voice = {
  schemaVersion: 1;
  name: string;
  algorithm: number;
  feedback: number;
  operators: [Operator, Operator, Operator, Operator];
  ams: number;
  pms: number;
  pan: Pan;
};

export type RegisterWrite = {
  port: 0 | 1;
  address: number;
  value: number;
};

export type EngineStatus = "idle" | "loading" | "ready" | "error";
