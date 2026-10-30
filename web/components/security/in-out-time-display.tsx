"use client";

type InOutTimeDisplayProps = {
  inTime: string;
  outTime?: string | null;
  className?: string;
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatDuration(inTime: string, outTime: string): string {
  const ms = new Date(outTime).getTime() - new Date(inTime).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function InOutTimeDisplay({ inTime, outTime, className }: InOutTimeDisplayProps) {
  return (
    <div className={className}>
      <div className="text-sm">
        <span className="text-muted-foreground">In: </span>
        {formatTime(inTime)}
      </div>
      {outTime ? (
        <div className="text-sm">
          <span className="text-muted-foreground">Out: </span>
          {formatTime(outTime)}
          <span className="ml-2 text-xs text-muted-foreground">
            ({formatDuration(inTime, outTime)})
          </span>
        </div>
      ) : (
        <div className="text-xs text-emerald-600 dark:text-emerald-400">Inside premises</div>
      )}
    </div>
  );
}
