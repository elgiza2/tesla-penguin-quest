import type { ButtonHTMLAttributes, ReactNode } from "react";
import tslaLogo from "@/assets/tesla-icon.png";
import gramAsset from "@/assets/gram-official.svg.asset.json";

export const GRAM_ICON = gramAsset.url;
export const TSLA_ICON = tslaLogo;

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-2xl p-4 ${className}`}>{children}</div>;
}

export function PrimaryButton({ className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p}
      className={`btn-tesla h-14 w-full rounded-2xl text-base transition active:scale-[0.98] disabled:opacity-50 ${className}`} />
  );
}

export function GhostButton({ className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p}
      className={`glass-strong h-12 rounded-2xl px-4 text-sm text-foreground transition active:scale-[0.98] disabled:opacity-50 ${className}`} />
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <h1 className="mb-4 text-3xl">{children}</h1>;
}

export function CoinIcon({ src, className = "size-10" }: { src: string; className?: string }) {
  return <img src={src} alt="" className={`${className} shrink-0 rounded-full`} />;
}

export function InfoPage({ title, sections, children }: { title: string; sections: { h: string; p: string }[]; children?: ReactNode }) {
  return (
    <div className="space-y-8 py-2">
      <h1 className="text-2xl">{title}</h1>
      {sections.map((s) => (
        <section key={s.h}>
          <h2 className="mb-2 text-lg text-primary">{s.h}</h2>
          <p className="leading-8 text-muted-foreground">{s.p}</p>
        </section>
      ))}
      {children}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { key: T; label: ReactNode }[]; onChange: (k: T) => void }) {
  return (
    <div className="glass mb-5 grid gap-1 rounded-full p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button key={o.key} onClick={() => onChange(o.key)}
          className={`h-10 rounded-full text-sm font-semibold transition ${value === o.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
