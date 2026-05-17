# GBP Leads Search Process — DC / Northern Virginia

_How to find 50–200 contractor listings on Google Maps with no website. Takes 60–90 min total._

---

## Output

Fill in: `output/gbp-leads-tracker.csv`

---

## Search Rounds (do in order)

Each round = one search term + one area. Scan the map pins, open listings that look like they have no website, and copy into the tracker.

### Round 1 — Core trades in DC proper

Search Google Maps for each term below with area set to **Washington DC**:

| Search term | Expected no-website rate |
|-------------|--------------------------|
| `plumber Washington DC` | ~40% |
| `electrician Washington DC` | ~35% |
| `hvac contractor Washington DC` | ~40% |
| `handyman Washington DC` | ~55% |
| `roofer Washington DC` | ~45% |
| `landscaper Washington DC` | ~50% |

### Round 2 — Northern Virginia suburbs

Repeat the same terms with each area below. One round per area:

- **Arlington VA**
- **Alexandria VA**
- **Fairfax VA**
- **Herndon VA**
- **Manassas VA**

### Round 3 — Extended trades

Additional high-yield categories for any area:

| Search term |
|-------------|
| `fence contractor DC` |
| `drywall contractor Northern Virginia` |
| `concrete contractor Fairfax` |
| `gutter cleaning DC` |
| `pressure washing Arlington VA` |
| `house painter Alexandria VA` |
| `tree service Fairfax VA` |
| `flooring contractor DC` |
| `remodeling contractor Northern Virginia` |

---

## How to Spot a No-Website Listing

When you click a GBP pin on Google Maps:

- The **right panel** will show: address, phone, hours, reviews — AND a "Website" button if they have one.
- **No "Website" button = no website.** That's your lead.
- If there's a website button, click it and check — some link to a Facebook page or a parked domain. Those count as no-website.

---

## What to Record (one row per listing)

| Field | Where to find it |
|-------|-----------------|
| `business_name` | Top of GBP panel |
| `category` | Under the name (e.g. "Plumber") |
| `address` | GBP panel |
| `city` | GBP panel |
| `state` | GBP panel |
| `phone` | GBP panel |
| `has_website` | FALSE if no Website button |
| `website_url` | Leave blank |
| `gbp_url` | Copy the Maps URL from your browser |
| `facebook_url` | Search their name on Facebook — most contractors have a page |
| `email` | Sometimes in the GBP "More" tab |
| `rating` | GBP panel (e.g. 4.2) |
| `review_count` | GBP panel (e.g. 17) |

Leave `contacted`, `contact_method`, `contact_date`, `response`, `notes` blank for now.

---

## Speed Tips

- Target **3–4 star, 5–30 reviews** — active businesses, not polished enough to have invested in web presence
- Avoid franchises — "SERVPRO of Arlington" etc. already have corporate sites
- Avoid chains — Home Depot, Angi-network businesses
- One session per area — stay in one city at a time to keep data clean

---

## Target

- **Minimum**: 50 listings before moving to outreach
- **Good**: 100–150 listings (covers 6–8 weeks of outreach at 20/day)
- **Great**: 200+ listings (full 10-week outreach runway)

---

---

## Supplementary Source: Craigslist (Pre-Seeded Leads)

The tracker has been pre-seeded with **73 Craigslist DC/NoVA contractor leads** (as of 2026-05-15). These are from the Washington DC Craigslist skilled trade services section — small operators posting on Craigslist who almost certainly have no independent website (Craigslist is their primary marketing channel).

**How to use the pre-seeded leads:**

For each row with `notes: craigslist|gbp_needed`:
1. Take the phone number (if present) or the business name
2. Search it on Google Maps (e.g., type the phone number directly into Maps search)
3. If a GBP listing comes up — copy the Maps URL into `gbp_url`
4. If no GBP listing appears — delete the row (not a GBP lead)
5. Confirm `has_website: false` by checking the GBP panel for a "Website" button

**Expected hit rate**: ~60–70% of Craigslist operators will have a GBP listing. Of 73 leads, expect ~44–51 confirmed GBP listings with no website — right at or above the 50-listing target without additional Maps searching.

**To reach 100+ listings**: run Rounds 1–3 of the Google Maps process above to add fresh listings on top of the verified Craigslist leads.

---

## Related Files

- `output/gbp-leads-tracker.csv` — the spreadsheet to fill in (73 leads pre-seeded 2026-05-15)
- `wiki/research/facebook-groups.md` — contractor Facebook groups to join for additional lead discovery
- `wiki/content/outbound-scripts.md` — what to say once you have leads
- `wiki/business/gtm.md` — overall launch strategy
