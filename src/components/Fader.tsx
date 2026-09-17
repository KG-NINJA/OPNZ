type FaderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  color: string;
  onChange: (value: number) => void;
};

export function Fader({
  label,
  value,
  min,
  max,
  color,
  onChange,
}: FaderProps) {
  return (
    <label className="fader-control" style={{ "--fader-color": color } as React.CSSProperties}>
      <span className="control-label">{label}</span>
      <span className="fader-track">
        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </span>
      <output>{value}</output>
    </label>
  );
}
