type RouteLoadingProps = {
  compact?: boolean;
  label?: string;
};

export function RouteLoading({
  compact = false,
  label = "Loading your workspace",
}: RouteLoadingProps) {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={`route-loading${compact ? " route-loading-compact" : ""}`}
    >
      <section className="route-loading-header">
        <p className="eyebrow">Onara</p>
        <h1 className="serif">{label}</h1>
        <p>The page is open. Its latest information is loading now.</p>
      </section>

      <div className="route-loading-grid" aria-hidden="true">
        <div className="route-loading-card route-loading-card-wide">
          <span className="route-loading-line route-loading-line-short" />
          <span className="route-loading-line route-loading-line-title" />
          <span className="route-loading-line" />
        </div>
        <div className="route-loading-card">
          <span className="route-loading-line route-loading-line-short" />
          <span className="route-loading-line route-loading-line-title" />
          <span className="route-loading-line" />
        </div>
        <div className="route-loading-card">
          <span className="route-loading-line route-loading-line-short" />
          <span className="route-loading-line route-loading-line-title" />
          <span className="route-loading-line" />
        </div>
      </div>
    </main>
  );
}
