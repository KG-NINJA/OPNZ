import { Fader } from "./Fader";
import { Knob } from "./Knob";
import type { Operator } from "../audio/types";

type OperatorPanelProps = {
  index: number;
  operator: Operator;
  color: string;
  onChange: (operator: Operator) => void;
};

export function OperatorPanel({
  index,
  operator,
  color,
  onChange,
}: OperatorPanelProps) {
  const update = <K extends keyof Operator>(key: K, value: Operator[K]) =>
    onChange({ ...operator, [key]: value });

  return (
    <section className="operator-panel" style={{ "--operator-color": color } as React.CSSProperties}>
      <header>
        <h3>Operator {index + 1}</h3>
        <span className="operator-led" aria-hidden="true" />
      </header>
      <div className="knob-row">
        <Knob
          label="Total Level"
          value={operator.totalLevel}
          min={0}
          max={127}
          color={color}
          onChange={(value) => update("totalLevel", value)}
        />
        <Knob
          label="Multiplier"
          value={operator.multiplier}
          min={0}
          max={15}
          color={color}
          displayValue={operator.multiplier === 0 ? "0.5" : `${operator.multiplier}.00`}
          onChange={(value) => update("multiplier", value)}
        />
        <Knob
          label="Detune"
          value={operator.detune}
          min={-3}
          max={3}
          color={color}
          onChange={(value) => update("detune", value)}
        />
      </div>
      <div className="fader-row">
        <Fader
          label="Attack"
          value={operator.attack}
          min={0}
          max={31}
          color={color}
          onChange={(value) => update("attack", value)}
        />
        <Fader
          label="Decay"
          value={operator.decay}
          min={0}
          max={31}
          color={color}
          onChange={(value) => update("decay", value)}
        />
        <Fader
          label="Sustain"
          value={operator.sustain}
          min={0}
          max={31}
          color={color}
          onChange={(value) => update("sustain", value)}
        />
        <Fader
          label="Release"
          value={operator.release}
          min={0}
          max={15}
          color={color}
          onChange={(value) => update("release", value)}
        />
      </div>
    </section>
  );
}
