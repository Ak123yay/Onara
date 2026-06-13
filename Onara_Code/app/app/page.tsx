import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-shell paper">
      <nav className="nav">
        <Link href="/" className="onara-logo">
          <span className="onara-logo-mark" />
          <span>Onara</span>
        </Link>
        <div className="nav-links">
          <Link href="/auth/login">Sign in</Link>
          <Link href="/auth/signup" className="btn btn-accent btn-sm">
            Start free
          </Link>
        </div>
      </nav>

      <section className="home-hero">
        <p className="eyebrow">Local service websites</p>
        <h1 className="serif">Your professional website, built in 60 seconds.</h1>
        <p>
          Onara turns a Google Business listing into a polished contractor-ready site,
          then keeps the launch workflow tied to Supabase, Stripe, and the pipeline.
        </p>
        <div className="home-actions">
          <Link href="/auth/signup" className="btn btn-accent btn-lg">
            Build my website
          </Link>
          <Link href="/auth/login" className="btn btn-soft btn-lg">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
