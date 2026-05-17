# ONARA — RAG SEED CONTENT
## HTML/CSS/JS Pattern Library for ChromaDB
## Step 17 — Loaded at setup, used by Agents 7 (Debugger) and 9 (QA)
##
## Format: Each pattern has metadata + HTML snippet
## Load with: chromadb collection.add(documents=[...], metadatas=[...], ids=[...])

---

## HOW TO LOAD THIS FILE

```python
import chromadb
import json

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("onara_patterns")

# Load patterns from this file and insert
for i, pattern in enumerate(PATTERNS):
    collection.add(
        documents=[pattern["html"]],
        metadatas=[{
            "id": pattern["id"],
            "type": pattern["type"],
            "description": pattern["description"],
            "use_case": pattern["use_case"]
        }],
        ids=[pattern["id"]]
    )
```

---

## PATTERN LIBRARY

---

### PATTERN 001 — Hero Section with Phone CTA (Contractor)

**ID**: hero_contractor_phone_cta
**Type**: section
**Use case**: Plumber, HVAC, electrician, any trade where phone calls are primary conversion
**Description**: Full-width hero with headline, subheadline, large phone button, and trust badges

```html
<!-- PATTERN: hero_contractor_phone_cta -->
<section class="hero">
  <div class="container">
    <div class="hero__content">
      <h1 class="hero__headline">Trusted Plumber in Austin, TX</h1>
      <p class="hero__sub">Licensed, insured, and available 24/7. One call and we're on our way.</p>
      <div class="hero__ctas">
        <a href="tel:+15125551234" class="btn btn--primary btn--large">
          📞 Call for a Free Quote
        </a>
        <a href="#contact" class="btn btn--secondary">
          Get a Free Estimate
        </a>
      </div>
      <div class="hero__trust">
        <span class="trust-badge">✓ Licensed & Insured</span>
        <span class="trust-badge">✓ 15+ Years Experience</span>
        <span class="trust-badge">✓ 4.9 ★ on Google</span>
      </div>
    </div>
  </div>
</section>

<style>
.hero {
  background: var(--color-primary);
  color: white;
  padding: 80px 0;
  text-align: center;
}

.hero__headline {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero__sub {
  font-size: clamp(1rem, 2vw, 1.25rem);
  opacity: 0.9;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero__ctas {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.btn--large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  min-height: 56px;
  border-radius: var(--border-radius);
}

.hero__trust {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  font-size: 0.875rem;
  opacity: 0.85;
}

@media (max-width: 768px) {
  .hero { padding: 60px 0; }
  .hero__ctas { flex-direction: column; align-items: center; }
  .hero__ctas .btn { width: 100%; max-width: 320px; }
  .hero__trust { gap: 0.75rem; }
}
</style>
```

---

### PATTERN 002 — Emergency Banner (Top of Page)

**ID**: emergency_banner_top
**Type**: banner
**Use case**: Plumbers, HVAC, electricians — businesses that handle urgent calls
**Description**: Sticky top banner with large phone number and emergency label

```html
<!-- PATTERN: emergency_banner_top -->
<div class="emergency-banner" role="banner" aria-label="Emergency contact">
  <div class="container emergency-banner__inner">
    <span class="emergency-banner__label">🚨 24/7 Emergency Service</span>
    <a href="tel:+15125551234" class="emergency-banner__phone">
      (512) 555-1234 — Call Now
    </a>
  </div>
</div>

<style>
.emergency-banner {
  background: var(--color-secondary);
  color: white;
  padding: 0.5rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.emergency-banner__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.emergency-banner__label {
  font-size: 0.875rem;
  font-weight: 500;
}

.emergency-banner__phone {
  color: white;
  font-weight: 700;
  font-size: 1rem;
  text-decoration: none;
  letter-spacing: 0.025em;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.emergency-banner__phone:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .emergency-banner__inner { gap: 0.5rem; }
  .emergency-banner__label { font-size: 0.75rem; }
}
</style>
```

---

### PATTERN 003 — Services Grid (3-Column)

**ID**: services_grid_3col
**Type**: section
**Use case**: Any service business
**Description**: 3-column card grid for services, responsive to 1-column on mobile

```html
<!-- PATTERN: services_grid_3col -->
<section class="services" id="services">
  <div class="container">
    <h2 class="section__headline">Our Services</h2>
    <p class="section__sub">Professional service you can count on.</p>
    <div class="services__grid">
      <div class="service-card">
        <div class="service-card__icon" aria-hidden="true">🔧</div>
        <h3 class="service-card__title">Drain Cleaning</h3>
        <p class="service-card__desc">Fast, effective drain clearing for clogs of any size.</p>
      </div>
      <div class="service-card">
        <div class="service-card__icon" aria-hidden="true">🚿</div>
        <h3 class="service-card__title">Water Heater Repair</h3>
        <p class="service-card__desc">Same-day repair and replacement for all major brands.</p>
      </div>
      <div class="service-card">
        <div class="service-card__icon" aria-hidden="true">🏠</div>
        <h3 class="service-card__title">Pipe Repair</h3>
        <p class="service-card__desc">Leak detection and full pipe repair, done right the first time.</p>
      </div>
    </div>
  </div>
</section>

<style>
.services { padding: var(--section-padding); background: var(--color-surface); }

.services__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 3rem;
}

.service-card {
  background: white;
  border-radius: var(--border-radius);
  padding: 2rem;
  border: 1px solid var(--color-border);
  text-align: center;
}

.service-card__icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
}

.service-card__title {
  font-family: var(--font-heading);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}

.service-card__desc {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .services__grid { grid-template-columns: 1fr; }
}
</style>
```

---

### PATTERN 004 — Google Reviews Badge

**ID**: google_reviews_badge
**Type**: section
**Use case**: Any business with Google reviews
**Description**: Review count, star rating display, and pull quote

```html
<!-- PATTERN: google_reviews_badge -->
<section class="reviews" id="reviews">
  <div class="container">
    <div class="reviews__badge">
      <div class="reviews__stars" aria-label="4.9 out of 5 stars">
        ★★★★★
      </div>
      <div class="reviews__score">4.9</div>
      <div class="reviews__meta">
        <strong>127 reviews</strong> on Google
      </div>
    </div>
    <blockquote class="reviews__quote">
      "Best plumber I've ever used. On time, honest about what needed to be done, and cleaned up after himself."
      <cite>— Sarah M., Austin TX</cite>
    </blockquote>
    <a
      href="https://g.page/r/PLACE_ID/review"
      target="_blank"
      rel="noopener noreferrer"
      class="reviews__cta"
      aria-label="Read our Google reviews (opens in new tab)"
    >
      Read All Reviews on Google ↗
    </a>
  </div>
</section>

<style>
.reviews {
  padding: var(--section-padding);
  background: var(--color-background);
  text-align: center;
}

.reviews__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.reviews__stars {
  color: #facc15;
  font-size: 1.75rem;
  letter-spacing: 2px;
}

.reviews__score {
  font-size: 3rem;
  font-weight: 800;
  font-family: var(--font-heading);
  color: var(--color-primary);
  line-height: 1;
}

.reviews__meta {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

.reviews__quote {
  max-width: 600px;
  margin: 0 auto 1.5rem;
  font-style: italic;
  font-size: 1.125rem;
  color: var(--color-text-primary);
  line-height: 1.7;
  border-left: 3px solid var(--color-primary);
  padding-left: 1.5rem;
  text-align: left;
}

.reviews__quote cite {
  display: block;
  margin-top: 0.5rem;
  font-style: normal;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.reviews__cta {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
  font-size: 0.9375rem;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
</style>
```

---

### PATTERN 005 — Contact Form with Phone

**ID**: contact_form_with_phone
**Type**: section
**Use case**: Any business
**Description**: Side-by-side layout — phone/hours on left, form on right

```html
<!-- PATTERN: contact_form_with_phone -->
<section class="contact" id="contact">
  <div class="container">
    <h2 class="section__headline">Get a Free Quote</h2>
    <div class="contact__layout">
      <div class="contact__info">
        <h3>Call or Text Us</h3>
        <a href="tel:+15125551234" class="contact__phone">(512) 555-1234</a>
        <p class="contact__sub">Available 7 days a week · Emergency service 24/7</p>
        <div class="contact__hours">
          <h4>Hours</h4>
          <dl>
            <dt>Mon – Fri</dt><dd>7am – 6pm</dd>
            <dt>Saturday</dt><dd>8am – 2pm</dd>
            <dt>Sunday</dt><dd>Emergency only</dd>
          </dl>
        </div>
      </div>
      <div class="contact__form-wrapper">
        <form class="contact__form" name="contact" netlify>
          <div class="form-group">
            <label for="name">Your Name</label>
            <input type="text" id="name" name="name" required autocomplete="name" />
          </div>
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" required autocomplete="tel" />
          </div>
          <div class="form-group">
            <label for="message">How can we help?</label>
            <textarea id="message" name="message" rows="4" required></textarea>
          </div>
          <button type="submit" class="btn btn--primary btn--full">
            Send Message
          </button>
          <p class="form__note">No commitment. We'll get back to you same day.</p>
        </form>
      </div>
    </div>
  </div>
</section>

<style>
.contact { padding: var(--section-padding); background: var(--color-surface); }

.contact__layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 3rem;
  margin-top: 3rem;
}

.contact__phone {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
  margin: 0.5rem 0;
  min-height: 44px;
  line-height: 44px;
}

.contact__phone:hover { color: var(--color-secondary); }

.contact__sub { color: var(--color-text-secondary); margin-bottom: 1.5rem; }

.contact__hours h4 { font-weight: 600; margin-bottom: 0.5rem; }

.contact__hours dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 1.5rem;
  font-size: 0.9375rem;
}

.contact__hours dt { font-weight: 500; }
.contact__hours dd { color: var(--color-text-secondary); }

.form-group { margin-bottom: 1rem; }

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.375rem;
  font-size: 0.9375rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 16px; /* prevents iOS zoom */
  font-family: var(--font-body);
  background: white;
  color: var(--color-text-primary);
  min-height: 44px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
  border-color: var(--color-primary);
}

.btn--full { width: 100%; justify-content: center; }

.form__note {
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-top: 0.75rem;
}

@media (max-width: 768px) {
  .contact__layout { grid-template-columns: 1fr; gap: 2rem; }
}
</style>
```

---

### PATTERN 006 — CSS :root Variables (Complete Set)

**ID**: css_root_variables
**Type**: foundation
**Use case**: All sites — must be included
**Description**: Complete set of CSS custom properties to define in :root

```html
<!-- PATTERN: css_root_variables — include in every generated site -->
<style>
  :root {
    /* Colors — populated by Agent 3 Style Agent output */
    --color-primary: #1a4f8a;
    --color-secondary: #f97316;
    --color-background: #ffffff;
    --color-surface: #f8fafc;
    --color-text-primary: #1e293b;
    --color-text-secondary: #64748b;
    --color-border: #e2e8f0;

    /* Typography */
    --font-heading: 'Inter', sans-serif;
    --font-body: 'Inter', sans-serif;
    --font-size-base: 16px;

    /* Spacing */
    --section-padding: 80px 0;
    --container-max: 1100px;
    --container-padding: 0 1.5rem;
    --border-radius: 8px;

    /* Shadows */
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  }

  *, *::before, *::after { box-sizing: border-box; }

  html { font-size: var(--font-size-base); scroll-behavior: smooth; }

  body {
    font-family: var(--font-body);
    color: var(--color-text-primary);
    background: var(--color-background);
    margin: 0;
    line-height: 1.6;
  }

  img { max-width: 100%; height: auto; display: block; }

  .container {
    max-width: var(--container-max);
    margin: 0 auto;
    padding: var(--container-padding);
  }

  .section__headline {
    font-family: var(--font-heading);
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    color: var(--color-primary);
    text-align: center;
    margin-bottom: 0.75rem;
  }

  .section__sub {
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 1.0625rem;
    max-width: 540px;
    margin: 0 auto;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius);
    font-weight: 600;
    font-size: 1rem;
    text-decoration: none;
    cursor: pointer;
    border: 2px solid transparent;
    transition: opacity 0.15s ease, transform 0.15s ease;
    min-height: 44px;
    min-width: 44px;
  }

  .btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .btn:active { transform: translateY(0); }

  .btn--primary {
    background: var(--color-secondary);
    color: white;
    border-color: var(--color-secondary);
  }

  .btn--secondary {
    background: transparent;
    color: white;
    border-color: rgba(255,255,255,0.7);
  }

  @media (max-width: 768px) {
    :root { --section-padding: 48px 0; }
  }
</style>
```

---

### PATTERN 007 — Footer with License Number

**ID**: footer_contractor_license
**Type**: footer
**Use case**: Contractors in licensed trades (plumbers, electricians, HVAC)
**Description**: Footer with business info, license number, nav links, and copyright

```html
<!-- PATTERN: footer_contractor_license -->
<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <strong class="footer__name">Mike's Plumbing</strong>
        <p>Austin's trusted plumber since 2009.</p>
        <p class="footer__license">License #: TX-PLB-12345</p>
      </div>
      <div class="footer__contact">
        <h4>Contact</h4>
        <a href="tel:+15125551234">(512) 555-1234</a>
        <a href="mailto:mike@mikesplumbing.com">mike@mikesplumbing.com</a>
        <p>123 Main St, Austin, TX 78701</p>
      </div>
      <div class="footer__links">
        <h4>Quick Links</h4>
        <nav aria-label="Footer navigation">
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#reviews">Reviews</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </div>
    <div class="footer__bottom">
      <p>© 2026 Mike's Plumbing. All rights reserved.</p>
      <p>Licensed & Insured · Serving Austin, TX and surrounding areas</p>
    </div>
  </div>
</footer>

<style>
.footer {
  background: var(--color-text-primary);
  color: rgba(255,255,255,0.8);
  padding: 60px 0 24px;
}

.footer__grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

.footer__name {
  display: block;
  font-size: 1.25rem;
  color: white;
  margin-bottom: 0.5rem;
}

.footer__license {
  font-size: 0.8125rem;
  opacity: 0.6;
  margin-top: 0.5rem;
}

.footer h4 {
  color: white;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.footer a {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.9375rem;
  min-height: 44px;
  line-height: 44px;
}

.footer a:hover { color: white; }

.footer__bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 1.5rem;
  font-size: 0.8125rem;
  opacity: 0.6;
  text-align: center;
}

@media (max-width: 768px) {
  .footer__grid { grid-template-columns: 1fr; gap: 2rem; }
}
</style>
```

---

## LOADING SCRIPT

```python
# load_rag_patterns.py
# Run once at setup: python load_rag_patterns.py

import chromadb
import re

PATTERNS = [
    {
        "id": "hero_contractor_phone_cta",
        "type": "hero_section",
        "description": "Hero section with large phone CTA button, subheadline, and trust badges for contractor sites",
        "use_case": "plumber, electrician, hvac, landscaper",
        "html": "...",  # paste each pattern's HTML block
    },
    # Add remaining patterns...
]

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(
    name="onara_patterns",
    metadata={"hnsw:space": "cosine"}
)

for pattern in PATTERNS:
    collection.upsert(
        documents=[f"{pattern['description']} {pattern['use_case']} {pattern['html']}"],
        metadatas=[{k: v for k, v in pattern.items() if k != 'html'}],
        ids=[pattern["id"]]
    )

print(f"Loaded {len(PATTERNS)} patterns into ChromaDB")
```
