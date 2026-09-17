const LAYOUTS = [
  [[26, 10], [26, 23], [26, 36], [26, 49]],
  [[17, 10], [17, 28], [35, 28], [26, 49]],
  [[14, 14], [38, 14], [14, 38], [38, 38]],
  [[17, 12], [35, 12], [17, 35], [35, 48]],
  [[12, 14], [26, 14], [40, 14], [26, 45]],
  [[14, 14], [38, 14], [14, 42], [38, 42]],
  [[12, 18], [26, 18], [40, 18], [26, 45]],
  [[10, 32], [24, 32], [38, 32], [50, 32]],
] as const;

type AlgorithmSelectorProps = {
  value: number;
  onChange: (value: number) => void;
};

export function AlgorithmSelector({ value, onChange }: AlgorithmSelectorProps) {
  return (
    <div className="algorithm-selector" role="radiogroup" aria-label="Algorithm">
      {LAYOUTS.map((nodes, index) => (
        <button
          className={value === index ? "algorithm active" : "algorithm"}
          type="button"
          role="radio"
          aria-checked={value === index}
          aria-label={`Algorithm ${index + 1}`}
          key={index}
          onClick={() => onChange(index)}
        >
          <svg viewBox="0 0 60 60" aria-hidden="true">
            {nodes.slice(0, -1).map((node, nodeIndex) => {
              const next = nodes[nodeIndex + 1];
              return (
                <line
                  key={`line-${nodeIndex}`}
                  x1={node[0]}
                  y1={node[1]}
                  x2={next[0]}
                  y2={next[1]}
                />
              );
            })}
            {nodes.map((node, nodeIndex) => (
              <g key={`node-${nodeIndex}`}>
                <rect x={node[0] - 6} y={node[1] - 6} width="12" height="12" rx="1" />
                <text x={node[0]} y={node[1] + 3}>{nodeIndex + 1}</text>
              </g>
            ))}
          </svg>
          <span>{index + 1}</span>
        </button>
      ))}
    </div>
  );
}
