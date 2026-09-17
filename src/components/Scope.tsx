import { useEffect, useRef } from "react";

type ScopeProps = {
  analyser: AnalyserNode | null;
  active: boolean;
};

export function Scope({ analyser, active }: ScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const samples = new Float32Array(analyser?.fftSize ?? 1024);
    let frame = 0;

    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.strokeStyle = "rgba(111, 135, 146, 0.16)";
      context.lineWidth = 1;
      for (let x = 0; x <= width; x += width / 8) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y <= height; y += height / 4) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      if (analyser && active) analyser.getFloatTimeDomainData(samples);
      else samples.fill(0);

      context.strokeStyle = "#35d2ff";
      context.shadowBlur = 8;
      context.shadowColor = "rgba(53, 210, 255, 0.38)";
      context.lineWidth = 1.8;
      context.beginPath();
      for (let index = 0; index < samples.length; index += 1) {
        const x = (index / (samples.length - 1)) * width;
        const y = height / 2 + samples[index] * height * 0.43;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      context.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [analyser, active]);

  return <canvas ref={canvasRef} className="scope-canvas" aria-label="Output oscilloscope" />;
}
