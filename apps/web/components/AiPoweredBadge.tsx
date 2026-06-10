export default function AiPoweredBadge() {
  return (
    <span
      aria-label="AI Powered"
      className="hidden sm:inline-flex items-center gap-1.5 rounded border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent/80"
    >
      <span aria-hidden="true" className="animate-pulse">◆</span>
      AI Powered
    </span>
  );
}
