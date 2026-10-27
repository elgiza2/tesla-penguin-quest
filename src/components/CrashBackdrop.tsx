import { useEffect, useRef } from "react";

/** Animated folded-light ribbons; every frame is drawn, not a moving still. */
export function CrashBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const colors = ["--game-blue", "--game-pink", "--game-coral", "--game-sky", "--game-violet"].map(t => getComputedStyle(document.documentElement).getPropertyValue(t).trim());
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const draw = (now: number) => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w * 2 || canvas.height !== h * 2) { canvas.width = w * 2; canvas.height = h * 2; }
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const t = reduced ? 0 : now / 6000;
      colors.forEach((color, i) => {
        const shift = Math.sin(t + i * 1.8) * w * .16;
        const y = h * (.08 + i * .18);
        const gradient = ctx.createLinearGradient(0, y, w, y + h * .35);
        gradient.addColorStop(0, color); gradient.addColorStop(.5, colors[(i + 2) % colors.length]); gradient.addColorStop(1, color);
        ctx.fillStyle = gradient; ctx.globalAlpha = .6;
        ctx.beginPath(); ctx.moveTo(-w, y);
        ctx.bezierCurveTo(w * .2 + shift, y - h * .35, w * .35 - shift, y + h * .7, w * 2, y - h * .14);
        ctx.lineTo(w * 2, y + h * .15);
        ctx.bezierCurveTo(w * .6 - shift, y + h * .8, w * .2 + shift, y - h * .05, -w, y + h * .35);
        ctx.closePath(); ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={ref} className="crash-ribbons" aria-hidden="true" />;
}