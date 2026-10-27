/** Living iOS-style wallpaper: soft blue/red/violet light fields that drift and breathe behind every page. */
export function AmbientBackdrop({ vivid = false }: { vivid?: boolean }) {
  return (
    <div className="ambient" data-vivid={vivid} aria-hidden="true">
      <span className="ambient-blob ambient-a" />
      <span className="ambient-blob ambient-b" />
      <span className="ambient-blob ambient-c" />
      <span className="ambient-blob ambient-d" />
      <span className="ambient-blob ambient-e" />
    </div>
  );
}
