import type { CSSProperties } from "react";

type KnobProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  color?: string;
  displayValue?: string;
  onChange: (value: number) => void;
};

export function Knob({
  label,
  value,
  min,
  max,
  color = "var(--cyan)",
  displayValue,
  onChange,
}: KnobProps) {
  const ratio = (value - min) / (max - min || 1);
  const angle = -135 + ratio * 270;
  const style = {
    "--knob-color": color,
    "--knob-angle": `${angle}deg`,
  } as CSSProperties;

  return (
    <label className="knob-control" style={style}>
      <span className="control-label">{label}</span>
      <span className="knob-shell" aria-hidden="true">
        <span className="knob-indicator" />
      </span>
      <input
        className="knob-input"
        type="range"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output>{displayValue ?? value}</output>
    </label>
  );
}
