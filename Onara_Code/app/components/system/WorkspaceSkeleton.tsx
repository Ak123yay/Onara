type WorkspaceSkeletonProps = {
  variant: "account" | "billing" | "build" | "checkout" | "dashboard" | "help" | "progress";
};

function Block({ className = "" }: { className?: string }) {
  return <span className={`workspace-skeleton-block ${className}`} />;
}

function HeaderSkeleton({ narrow = false }: { narrow?: boolean }) {
  return (
    <header className={`workspace-skeleton-header${narrow ? " workspace-skeleton-header-narrow" : ""}`}>
      <Block className="workspace-skeleton-kicker" />
      <Block className="workspace-skeleton-title" />
      <Block className="workspace-skeleton-copy" />
    </header>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-main-inner dashboard-main-redesign workspace-skeleton-page">
      <div className="workspace-skeleton-dashboard-heading">
        <HeaderSkeleton />
        <Block className="workspace-skeleton-button" />
      </div>
      <section className="workspace-skeleton-command">
        <div className="workspace-skeleton-command-copy">
          <Block className="workspace-skeleton-kicker" />
          <Block className="workspace-skeleton-subtitle" />
          <Block className="workspace-skeleton-copy" />
        </div>
        <div className="workspace-skeleton-metrics">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index}>
              <Block className="workspace-skeleton-kicker" />
              <Block className="workspace-skeleton-metric" />
              <Block className="workspace-skeleton-caption" />
            </div>
          ))}
        </div>
      </section>
      <section className="workspace-skeleton-brief">
        <Block className="workspace-skeleton-icon" />
        <div>
          <Block className="workspace-skeleton-kicker" />
          <Block className="workspace-skeleton-subtitle" />
          <Block className="workspace-skeleton-copy" />
        </div>
      </section>
      <section className="workspace-skeleton-sites">
        <div className="workspace-skeleton-section-heading">
          <div>
            <Block className="workspace-skeleton-kicker" />
            <Block className="workspace-skeleton-subtitle" />
          </div>
          <Block className="workspace-skeleton-caption" />
        </div>
        {Array.from({ length: 2 }, (_, index) => (
          <div className="workspace-skeleton-site-row" key={index}>
            <Block className="workspace-skeleton-site-thumb" />
            <div>
              <Block className="workspace-skeleton-site-name" />
              <Block className="workspace-skeleton-site-url" />
              <Block className="workspace-skeleton-site-meta" />
            </div>
            <Block className="workspace-skeleton-row-action" />
          </div>
        ))}
      </section>
    </div>
  );
}

function BuildSkeleton() {
  return (
    <main className="build-shell paper workspace-skeleton-build">
      <section className="build-header workspace-skeleton-build-header">
        <Block className="workspace-skeleton-logo" />
        <Block className="workspace-skeleton-avatar" />
      </section>
      <section className="build-workspace">
        <div className="build-studio-layout">
          <aside className="build-step-rail workspace-skeleton-step-rail">
            <Block className="workspace-skeleton-kicker" />
            {Array.from({ length: 4 }, (_, index) => (
              <div className="workspace-skeleton-step" key={index}>
                <Block className="workspace-skeleton-step-number" />
                <Block className="workspace-skeleton-step-label" />
              </div>
            ))}
            <Block className="workspace-skeleton-rail-note" />
          </aside>
          <div className="build-studio-main workspace-skeleton-build-main">
            <HeaderSkeleton narrow />
            <div className="workspace-skeleton-search">
              <Block className="workspace-skeleton-input" />
              <Block className="workspace-skeleton-button workspace-skeleton-search-button" />
            </div>
            <div className="workspace-skeleton-result-card">
              <Block className="workspace-skeleton-result-avatar" />
              <div>
                <Block className="workspace-skeleton-site-name" />
                <Block className="workspace-skeleton-copy" />
              </div>
            </div>
          </div>
          <aside className="build-live-brief workspace-skeleton-live-brief">
            <Block className="workspace-skeleton-kicker" />
            <Block className="workspace-skeleton-subtitle" />
            {Array.from({ length: 4 }, (_, index) => (
              <Block className="workspace-skeleton-brief-row" key={index} />
            ))}
          </aside>
        </div>
      </section>
    </main>
  );
}

function ProgressSkeleton() {
  return (
    <div className="agent-progress-shell workspace-skeleton-progress">
      <section className="agent-progress-grid">
        <aside className="agent-progress-panel">
          <Block className="workspace-skeleton-back" />
          <div className="workspace-skeleton-progress-card">
            <Block className="workspace-skeleton-kicker" />
            <Block className="workspace-skeleton-title workspace-skeleton-progress-title" />
            <Block className="workspace-skeleton-copy" />
            <Block className="workspace-skeleton-progress-bar" />
            <div className="workspace-skeleton-progress-stats">
              {Array.from({ length: 3 }, (_, index) => (
                <Block className="workspace-skeleton-stat" key={index} />
              ))}
            </div>
          </div>
          <div className="workspace-skeleton-stage-card">
            <Block className="workspace-skeleton-kicker" />
            <Block className="workspace-skeleton-subtitle" />
            <Block className="workspace-skeleton-copy" />
          </div>
          <div className="workspace-skeleton-stage-list">
            {Array.from({ length: 5 }, (_, index) => (
              <Block className="workspace-skeleton-stage-row" key={index} />
            ))}
          </div>
        </aside>
        <section className="agent-preview-panel workspace-skeleton-preview">
          <div className="workspace-skeleton-preview-toolbar">
            <Block className="workspace-skeleton-dots" />
            <Block className="workspace-skeleton-preview-url" />
            <Block className="workspace-skeleton-badge" />
          </div>
          <div className="workspace-skeleton-preview-canvas">
            <Block className="workspace-skeleton-preview-nav" />
            <Block className="workspace-skeleton-preview-hero" />
            <div className="workspace-skeleton-preview-cards">
              {Array.from({ length: 3 }, (_, index) => (
                <Block key={index} />
              ))}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="account-settings-page workspace-skeleton-page">
      <HeaderSkeleton />
      <section className="workspace-skeleton-account-hero">
        <div className="workspace-skeleton-profile">
          <Block className="workspace-skeleton-account-avatar" />
          <div>
            <Block className="workspace-skeleton-kicker" />
            <Block className="workspace-skeleton-title workspace-skeleton-account-name" />
            <Block className="workspace-skeleton-copy" />
          </div>
        </div>
        <div className="workspace-skeleton-access-card">
          <Block className="workspace-skeleton-kicker" />
          <Block className="workspace-skeleton-subtitle" />
          <Block className="workspace-skeleton-copy" />
          <Block className="workspace-skeleton-progress-bar" />
        </div>
      </section>
      <section className="workspace-skeleton-facts">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <Block className="workspace-skeleton-kicker" />
            <Block className="workspace-skeleton-fact-value" />
          </div>
        ))}
      </section>
      <section className="workspace-skeleton-account-section">
        <Block className="workspace-skeleton-kicker" />
        <Block className="workspace-skeleton-subtitle" />
        <div className="workspace-skeleton-action-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <Block className="workspace-skeleton-icon" />
              <Block className="workspace-skeleton-site-name" />
              <Block className="workspace-skeleton-copy" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="account-billing-page workspace-skeleton-page">
      <HeaderSkeleton />
      <Block className="workspace-skeleton-support-row" />
      <section className="workspace-skeleton-current-plan">
        <Block className="workspace-skeleton-account-avatar" />
        <div>
          <Block className="workspace-skeleton-kicker" />
          <Block className="workspace-skeleton-subtitle" />
          <Block className="workspace-skeleton-copy" />
        </div>
        <Block className="workspace-skeleton-badge" />
      </section>
      <section className="workspace-skeleton-billing-grid">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index}>
            <Block className="workspace-skeleton-kicker" />
            <Block className="workspace-skeleton-subtitle" />
            <Block className="workspace-skeleton-copy" />
          </div>
        ))}
      </section>
      <section className="workspace-skeleton-plan-section">
        <Block className="workspace-skeleton-kicker" />
        <Block className="workspace-skeleton-subtitle" />
        <div className="workspace-skeleton-plan-grid">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index}>
              <Block className="workspace-skeleton-kicker" />
              <Block className="workspace-skeleton-plan-price" />
              <Block className="workspace-skeleton-copy" />
              <Block className="workspace-skeleton-plan-list" />
              <Block className="workspace-skeleton-button workspace-skeleton-plan-button" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="account-checkout-page workspace-skeleton-page">
      <Block className="workspace-skeleton-back" />
      <HeaderSkeleton />
      <div className="workspace-skeleton-checkout-grid">
        <section>
          <Block className="workspace-skeleton-kicker" />
          <Block className="workspace-skeleton-subtitle" />
          <Block className="workspace-skeleton-plan-price" />
          <Block className="workspace-skeleton-copy" />
          <Block className="workspace-skeleton-plan-list" />
        </section>
        <section>
          <Block className="workspace-skeleton-kicker" />
          <Block className="workspace-skeleton-subtitle" />
          <Block className="workspace-skeleton-payment-summary" />
          {Array.from({ length: 4 }, (_, index) => (
            <Block className="workspace-skeleton-payment-row" key={index} />
          ))}
          <Block className="workspace-skeleton-button workspace-skeleton-payment-button" />
        </section>
      </div>
    </div>
  );
}

function HelpSkeleton() {
  return (
    <div className="help-page workspace-skeleton-page">
      <div className="workspace-skeleton-dashboard-heading">
        <HeaderSkeleton />
        <Block className="workspace-skeleton-button" />
      </div>
      <section className="workspace-skeleton-help-hero">
        <div>
          <Block className="workspace-skeleton-icon" />
          <Block className="workspace-skeleton-kicker" />
          <Block className="workspace-skeleton-subtitle" />
          <Block className="workspace-skeleton-copy" />
        </div>
        <div>
          <Block className="workspace-skeleton-kicker" />
          <Block className="workspace-skeleton-subtitle" />
          <Block className="workspace-skeleton-copy" />
          <Block className="workspace-skeleton-button" />
        </div>
      </section>
      <section className="workspace-skeleton-account-section">
        <Block className="workspace-skeleton-kicker" />
        <Block className="workspace-skeleton-subtitle" />
        <div className="workspace-skeleton-action-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <Block className="workspace-skeleton-icon" />
              <Block className="workspace-skeleton-site-name" />
              <Block className="workspace-skeleton-copy" />
            </div>
          ))}
        </div>
      </section>
      <section className="workspace-skeleton-help-faq">
        <Block className="workspace-skeleton-kicker" />
        <Block className="workspace-skeleton-subtitle" />
        {Array.from({ length: 4 }, (_, index) => (
          <Block className="workspace-skeleton-help-row" key={index} />
        ))}
      </section>
    </div>
  );
}

export function WorkspaceSkeleton({ variant }: WorkspaceSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Loading page" className={`workspace-skeleton workspace-skeleton-${variant}`}>
      {variant === "dashboard" ? <DashboardSkeleton /> : null}
      {variant === "build" ? <BuildSkeleton /> : null}
      {variant === "progress" ? <ProgressSkeleton /> : null}
      {variant === "account" ? <AccountSkeleton /> : null}
      {variant === "billing" ? <BillingSkeleton /> : null}
      {variant === "checkout" ? <CheckoutSkeleton /> : null}
      {variant === "help" ? <HelpSkeleton /> : null}
      <span className="sr-only">Loading the latest page information.</span>
    </div>
  );
}
