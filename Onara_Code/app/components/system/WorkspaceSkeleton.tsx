type WorkspaceSkeletonProps = {
  variant: "account" | "billing" | "build" | "checkout" | "dashboard" | "help" | "progress";
};

function Block({ className = "" }: { className?: string }) {
  return <span className={`sk-block ${className}`} />;
}

function Text({ lines = 1, wide = false }: { lines?: number; wide?: boolean }) {
  return (
    <span className={`sk-text${wide ? " sk-text-wide" : ""}`}>
      {Array.from({ length: lines }, (_, index) => <Block key={index} />)}
    </span>
  );
}

function PageHeading({ action = false }: { action?: boolean }) {
  return (
    <div>
      <Block className="sk-eyebrow" />
      <Block className="sk-page-title" />
      <Text lines={2} wide />
      {action ? <Block className="sk-button sk-heading-action" /> : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-main-inner dashboard-main-redesign sk-page">
      <section className="dashboard-hero-row dashboard-hero-redesign">
        <div>
          <Block className="sk-eyebrow" />
          <Block className="sk-dashboard-title" />
        </div>
        <Block className="sk-button dashboard-new-site" />
      </section>

      <section className="dashboard-command-panel">
        <div className="dashboard-command-main">
          <Block className="sk-eyebrow" />
          <Block className="sk-section-title" />
          <Text lines={2} />
        </div>
        <dl className="dashboard-command-metrics">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index}>
              <Block className="sk-label" />
              <Block className="sk-metric" />
              <Block className="sk-caption" />
            </div>
          ))}
        </dl>
      </section>

      <section className="dashboard-ai-brief">
        <Block className="sk-round-icon" />
        <div className="dashboard-ai-brief-copy">
          <div className="dashboard-ai-brief-kicker">
            <Block className="sk-eyebrow" />
            <Block className="sk-badge" />
          </div>
          <Block className="sk-section-title" />
          <Text lines={2} wide />
        </div>
        <ul className="dashboard-ai-brief-recs" aria-hidden="true">
          {Array.from({ length: 3 }, (_, index) => <li className="sk-card-fill" key={index} />)}
        </ul>
      </section>

      <section className="sites-list">
        <div className="sites-list-header">
          <div>
            <Block className="sk-eyebrow" />
            <Block className="sk-small-title" />
          </div>
          <Block className="sk-caption" />
        </div>
        <div className="sites-list-stack">
          {Array.from({ length: 2 }, (_, index) => (
            <article className="dashboard-site-row site-card" key={index}>
              <Block className="site-thumb sk-site-thumb" />
              <div className="site-card-main">
                <div className="site-card-title-row">
                  <Block className="sk-site-name" />
                  <Block className="sk-badge" />
                </div>
                <Block className="sk-url" />
                <div className="site-link-panel">
                  <Block className="sk-icon" />
                  <Block className="sk-link" />
                  <Block className="sk-mini-button" />
                </div>
                <Block className="sk-meta" />
              </div>
              <div className="site-card-actions sk-site-actions">
                <Block className="sk-button" />
                <Block className="sk-button" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BuildSkeleton() {
  return (
    <main className="build-shell paper sk-page">
      <section className="build-header">
        <Block className="sk-logo" />
        <Block className="sk-user-pill" />
      </section>
      <section className="build-workspace">
        <div className="build-studio-layout">
          <aside className="build-step-rail">
            <div>
              <Block className="sk-eyebrow" />
              <div className="step-indicator">
                {Array.from({ length: 4 }, (_, index) => (
                  <div className="step-indicator-item" key={index}>
                    <Block className="step-dot" />
                    <Block className="sk-step-label" />
                  </div>
                ))}
              </div>
            </div>
            <div className="build-step-promise">
              <Block className="sk-icon" />
              <Text lines={3} wide />
            </div>
          </aside>

          <div className="build-studio-main">
            <div className="build-panel">
              <Block className="sk-eyebrow sk-centered" />
              <Block className="sk-build-title sk-centered" />
              <span className="build-subcopy"><Text lines={2} wide /></span>
              <div className="places-search-form sk-search-form">
                <Block className="sk-icon" />
                <Block className="sk-search-input" />
                <Block className="sk-button" />
              </div>
              <div className="manual-business-entry">
                <div className="manual-business-callout">
                  <Block className="sk-icon" />
                  <div>
                    <Block className="sk-label" />
                    <Text lines={2} />
                  </div>
                  <Block className="sk-mini-button" />
                </div>
              </div>
              <div className="build-hint">
                <Block className="sk-caption sk-centered" />
              </div>
            </div>
          </div>

          <aside className="build-live-brief">
            <div className="build-live-brief-head">
              <Block className="sk-label" />
              <Block className="sk-caption" />
            </div>
            <div className="build-live-identity">
              <Block className="business-monogram sk-square-icon" />
              <div>
                <Block className="sk-site-name" />
                <Block className="sk-caption" />
              </div>
            </div>
            <div className="build-live-facts">
              {Array.from({ length: 3 }, (_, index) => <Block className="sk-fact-row" key={index} />)}
            </div>
            <dl className="build-live-metrics">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index}>
                  <Block className="sk-label" />
                  <Block className="sk-small-title" />
                </div>
              ))}
            </dl>
            <div className="build-live-sections">
              <Block className="sk-label" />
              {Array.from({ length: 4 }, (_, index) => <Block className="sk-chip" key={index} />)}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ProgressSkeleton() {
  return (
    <div className="agent-progress-shell sk-page">
      <section className="agent-progress-grid">
        <aside className="agent-progress-panel">
          <Block className="agent-progress-back sk-back" />
          <section className="agent-command-card card">
            <div className="agent-command-card-top">
              <Block className="sk-eyebrow" />
              <Block className="sk-badge" />
            </div>
            <div className="agent-command-card-copy">
              <Block className="sk-progress-title" />
              <Block className="sk-meta" />
            </div>
            <div className="agent-command-meter">
              <div className="agent-progress-meter-head">
                <Block className="sk-label" />
                <Block className="sk-caption" />
              </div>
              <Block className="agent-progress-bar sk-progress-bar" />
              <div className="agent-progress-meter-footer">
                <Block className="sk-caption" />
                <Block className="sk-caption" />
              </div>
            </div>
            <dl className="agent-progress-stats">
              {Array.from({ length: 3 }, (_, index) => (
                <div className="agent-progress-stat" key={index}>
                  <Block className="sk-label" />
                  <Block className="sk-stat-value" />
                </div>
              ))}
            </dl>
            <div className="agent-progress-save-note">
              <Block className="sk-icon" />
              <Text lines={2} wide />
            </div>
          </section>

          <div className="agent-active-card card">
            <Block className="sk-label" />
            <Block className="sk-small-title" />
            <Text lines={2} wide />
          </div>

          <div className="agent-step-list-card card">
            <div className="agent-step-list-head">
              <Block className="sk-label" />
              <Block className="sk-caption" />
            </div>
            <div className="agent-step-list">
              {Array.from({ length: 7 }, (_, index) => (
                <div className="agent-step-row agent-step-row-pending" key={index}>
                  <Block className="agent-step-index" />
                  <span className="agent-step-copy">
                    <Block className="sk-stage-title" />
                    <Block className="sk-stage-copy" />
                  </span>
                  <Block className="agent-step-model sk-stage-status" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="agent-preview-panel">
          <div className="agent-preview-toolbar">
            <Block className="sk-window-dots" />
            <Block className="agent-preview-url sk-preview-url" />
            <Block className="agent-preview-badge sk-badge" />
          </div>
          <div className="agent-preview-frame-wrap sk-preview-loading">
            <Block className="sk-preview-logo" />
            <Block className="sk-eyebrow" />
            <Block className="sk-preview-title" />
            <Text lines={2} wide />
            <span className="sk-preview-lines">
              <Block />
              <Block />
              <Block />
            </span>
          </div>
          <div className="agent-preview-footer">
            <div>
              <Block className="sk-label" />
              <Block className="sk-small-title" />
              <Block className="sk-meta" />
            </div>
            <div className="agent-preview-actions">
              <Block className="sk-button" />
              <Block className="sk-button" />
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="account-settings-page sk-page">
      <div className="account-settings-header">
        <PageHeading />
        <Block className="account-settings-header-link sk-button" />
      </div>
      <section className="account-settings-hero card">
        <div className="account-settings-profile">
          <Block className="account-settings-avatar" />
          <div>
            <Block className="sk-eyebrow" />
            <Block className="sk-account-name" />
            <Block className="sk-url" />
          </div>
        </div>
        <div className="account-settings-access">
          <div className="account-settings-access-top">
            <Block className="sk-eyebrow sk-dark" />
            <Block className="sk-badge sk-dark" />
          </div>
          <Block className="sk-section-title sk-dark" />
          <Text lines={2} wide />
          <Block className="account-settings-meter sk-dark-meter" />
          <Block className="account-settings-access-link sk-button" />
        </div>
      </section>
      <section className="account-settings-facts">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="account-settings-fact card" key={index}>
            <Block className="sk-label" />
            <Block className="sk-fact-value" />
          </div>
        ))}
      </section>
      <section className="account-training-card card">
        <div className="account-training-main">
          <Block className="account-training-icon" />
          <div>
            <Block className="sk-eyebrow" />
            <Block className="sk-section-title" />
            <Text lines={3} wide />
          </div>
        </div>
        <div className="account-training-status">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index}>
              <Block className="sk-label" />
              <Block className="sk-fact-value" />
              <Block className="sk-caption" />
            </div>
          ))}
        </div>
        <div className="account-training-actions">
          <Block className="sk-button" />
          <Block className="sk-button" />
        </div>
        <Block className="account-training-note sk-note" />
      </section>
      <section className="account-settings-controls">
        <div className="account-settings-section-title">
          <Block className="sk-eyebrow" />
          <Block className="sk-section-title" />
          <Text lines={1} wide />
        </div>
        <div className="account-settings-action-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="account-settings-action card" key={index}>
              <Block className="account-settings-action-icon" />
              <span className="account-settings-action-copy">
                <Block className="sk-label" />
                <Block className="sk-site-name" />
                <Block className="sk-meta" />
              </span>
              <Block className="account-settings-action-open sk-caption" />
            </div>
          ))}
        </div>
        <Block className="account-settings-footnote card sk-footnote" />
      </section>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="account-billing-page sk-page">
      <div className="account-billing-header"><PageHeading /></div>
      <Block className="account-billing-support card sk-support" />
      <section className="account-current-card card">
        <div className="account-current-main">
          <Block className="account-current-icon" />
          <div>
            <Block className="sk-eyebrow" />
            <Block className="sk-section-title" />
            <Text lines={2} wide />
          </div>
        </div>
        <Block className="sk-badge" />
      </section>
      <section className="account-billing-grid">
        <div className="account-billing-panel card">
          <Block className="sk-eyebrow" />
          <div className="account-billing-metrics">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index}>
                <Block className="sk-label" />
                <Block className="sk-fact-value" />
              </div>
            ))}
          </div>
        </div>
        <div className="account-billing-panel account-trial-panel card">
          <Block className="sk-eyebrow" />
          <Block className="sk-section-title" />
          <Text lines={2} />
          <Block className="account-trial-meter" />
        </div>
      </section>
      <section className="account-plan-section">
        <div className="account-section-heading">
          <Block className="sk-eyebrow" />
          <Block className="sk-section-title" />
        </div>
        <div className="account-plan-grid">
          {Array.from({ length: 2 }, (_, index) => (
            <article className="account-plan-card card" key={index}>
              <div className="account-plan-card-top">
                <div>
                  <Block className="sk-eyebrow" />
                  <Block className="sk-price" />
                </div>
              </div>
              <Text lines={2} />
              <ul>
                {Array.from({ length: 3 }, (_, row) => <li key={row}><Block className="sk-feature" /></li>)}
              </ul>
              <div className="account-plan-actions">
                {index === 0 ? <Block className="btn sk-button" /> : null}
                <Block className="btn sk-button" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="account-checkout-page sk-page">
      <div className="account-checkout-header">
        <Block className="account-checkout-back sk-back" />
        <PageHeading />
      </div>
      <div className="account-checkout-grid">
        <aside className="account-checkout-summary card">
          <Block className="sk-eyebrow" />
          <Block className="sk-section-title" />
          <div className="account-checkout-price"><Block className="sk-price" /></div>
          <Text lines={2} wide />
          <ul>{Array.from({ length: 3 }, (_, index) => <li key={index}><Block className="sk-feature" /></li>)}</ul>
          <div className="account-checkout-note"><Block className="sk-label" /><Text lines={3} wide /></div>
        </aside>
        <section className="embedded-checkout-form card">
          <div className="embedded-checkout-form-header">
            <div><Block className="sk-eyebrow" /><Block className="sk-section-title" /></div>
            <Block className="embedded-checkout-lock sk-badge" />
          </div>
          <Block className="embedded-checkout-total sk-total" />
          {Array.from({ length: 4 }, (_, index) => <Block className="sk-payment-row" key={index} />)}
          <Block className="sk-button sk-full-button" />
        </section>
      </div>
    </div>
  );
}

function HelpSkeleton() {
  return (
    <div className="help-page sk-page">
      <header className="help-header">
        <PageHeading />
        <Block className="help-header-link sk-button" />
      </header>
      <section className="help-hero card">
        <div className="help-hero-main">
          <Block className="help-hero-icon" />
          <Block className="sk-eyebrow" />
          <Block className="sk-help-title" />
          <Text lines={3} wide />
          <div className="help-hero-stats">
            {Array.from({ length: 3 }, (_, index) => <Block key={index} />)}
          </div>
        </div>
        <div className="help-hero-checklist">
          <Block className="sk-eyebrow sk-dark" />
          <ul>{Array.from({ length: 4 }, (_, index) => <li key={index}><Block className="sk-check" /></li>)}</ul>
        </div>
      </section>
      <section className="help-quick-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="help-action card" key={index}>
            <Block className="help-action-icon" />
            <span className="help-action-copy">
              <Block className="sk-label" />
              <Block className="sk-site-name" />
              <Block className="sk-meta" />
            </span>
            <Block className="sk-icon" />
          </div>
        ))}
      </section>
      <div className="help-layout">
        <main className="help-main">
          {Array.from({ length: 2 }, (_, sectionIndex) => (
            <section className="help-section card" key={sectionIndex}>
              <div className="help-section-heading">
                <Block className="help-section-icon" />
                <div><Block className="sk-eyebrow" /><Block className="sk-section-title" /></div>
              </div>
              <div className={sectionIndex === 0 ? "help-flow" : "help-faq-list"}>
                {Array.from({ length: sectionIndex === 0 ? 4 : 3 }, (_, index) => (
                  <div className={sectionIndex === 0 ? "help-flow-step" : "help-faq-item"} key={index}>
                    <Block className={sectionIndex === 0 ? "sk-step-number" : "help-faq-number"} />
                    <div><Block className="sk-site-name" /><Text lines={2} wide /></div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>
        <aside className="help-aside">
          <section className="help-contact-card">
            <div><Block className="sk-eyebrow sk-dark" /><Block className="sk-section-title sk-dark" /><Text lines={3} wide /></div>
            <Block className="help-contact-button sk-button" />
          </section>
          {Array.from({ length: 3 }, (_, index) => (
            <section className="help-aside-card card" key={index}>
              <Block className="sk-eyebrow" />
              <Block className="sk-section-title" />
              <Text lines={4} wide />
            </section>
          ))}
        </aside>
      </div>
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
