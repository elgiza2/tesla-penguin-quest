import { useEffect, useRef } from "react";

const TOKENS = ["--game-blue", "--game-pink", "--game-coral", "--game-violet", "--game-sky", "--game-yellow"];

/** Live multicolour wallpaper: drifting colour fields and folded ribbons drawn every frame, softened by a CSS blur. */
export function CrashBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const css = getComputedStyle(document.documentElement);
    const colors = TOKENS.map(t => css.getPropertyValue(t).trim());
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const draw = (now: number) => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const t = reduced ? 0 : now / 4200;
      ctx.clearRect(0, 0, w, h);
      // drifting colour fields
      colors.forEach((color, i) => {
        const x = w * (0.5 + 0.38 * Math.sin(t * (0.6 + i * 0.13) + i * 2.1));
        const y = h * (0.45 + 0.4 * Math.cos(t * (0.5 + i * 0.11) + i * 1.3));
        const r = Math.max(w, h) * (0.32 + 0.06 * Math.sin(t + i));
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color); g.addColorStop(1, "transparent");
        ctx.globalAlpha = 0.85; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      });
      // folded ribbons
      for (let i = 0; i < 3; i++) {
        const shift = Math.sin(t * 1.2 + i * 1.9) * w * 0.22, y = h * (0.18 + i * 0.26);
        const grad = ctx.createLinearGradient(0, y, w, y + h * 0.3);
        grad.addColorStop(0, colors[i]!); grad.addColorStop(0.5, colors[(i + 3) % colors.length]!); grad.addColorStop(1, colors[(i + 1) % colors.length]!);
        ctx.globalAlpha = 0.7; ctx.fillStyle = grad;
        ctx.beginPath(); ctx.moveTo(-w * 0.2, y);
        ctx.bezierCurveTo(w * 0.25 + shift, y - h * 0.3, w * 0.55 - shift, y + h * 0.4, w * 1.2, y - h * 0.1);
        ctx.lineTo(w * 1.2, y + h * 0.08);
        ctx.bezierCurveTo(w * 0.55 - shift, y + h * 0.5, w * 0.25 + shift, y - h * 0.15, -w * 0.2, y + h * 0.14);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <div className="crash-backdrop" aria-hidden="true"><canvas ref={ref} className="crash-ribbons" /></div>;
}
