type Props = { message: string };

export function JobsLoadError({ message }: Props) {
  const isConfig =
    message.includes("CANDIDATE_SYNC_SECRET") ||
    message.includes("HR_PORTAL_INTERNAL_URL") ||
    message.includes("HR portal is not configured");

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 space-y-3 text-sm">
      <p className="font-semibold text-destructive">Could not load jobs from HR portal</p>
      <p className="text-muted-foreground">{message}</p>
      {isConfig ? (
        <div className="text-xs text-muted-foreground space-y-2 rounded-lg border border-border/40 bg-background/50 p-3 font-mono">
          <p className="font-sans font-semibold text-foreground not-font-mono">
            Server admin: add to <code className="font-mono">/opt/portal/Hr-tech/.env</code> (both
            containers use the same file):
          </p>
          <p>CANDIDATE_SYNC_SECRET=&lt;same random secret on HR + apply&gt;</p>
          <p>HR_PORTAL_INTERNAL_URL=http://app:3000</p>
          <p className="font-sans not-font-mono pt-1">
            Then: <code className="font-mono">docker compose up -d --force-recreate app apply</code>
          </p>
        </div>
      ) : null}
    </div>
  );
}
