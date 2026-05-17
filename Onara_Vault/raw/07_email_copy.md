# ONARA — EMAIL COPY DOCUMENT
## All Transactional Emails
### Sent via Resend | From: hello@onara.tech

---

## EMAIL 1 — Welcome / Site Is Live
**Trigger**: Pipeline completes successfully, site deployed to Cloudflare Pages
**To**: User's email
**Subject**: Your website is live, {first_name} 🎉

---

**Subject**: Your website is live, {first_name} 🎉
**Preview text**: {business_name} now has a professional website. Here's your link.

---

Hi {first_name},

Your website is ready.

**[View Your Live Site →]**
{public_url}

Here's what Onara built for you:

- A professional homepage for {business_name}
- Your services, hours, and contact info — all pulled from Google
- Your Google reviews displayed front and center
- A mobile-friendly design that loads fast

**Share it today.** Add the link to your Google Business Profile, your Facebook page, and your email signature. Every customer who finds you on Google can now click through to a real website.

**Want to make changes?** Log in to your dashboard and click "Revise Site." Just describe what you want in plain English — "add roof repair to my services" or "change my phone number" — and we'll update it.

You're on your 14-day Pro trial. Your site is live and public. After the trial, you'll need a paid plan to keep it live.

**[Go to Your Dashboard →]**
https://onara.tech/dashboard

---

Questions? Reply to this email — you'll reach a real person.

The Onara Team

---
*Onara · onara.tech · Unsubscribe from non-essential emails*

---
---

## EMAIL 2 — Trial Expiry Warning (Day 11)
**Trigger**: 3 days before trial_ends_at
**To**: User's email (trial users with at least one live site only)
**Subject**: Your Onara trial ends in 3 days

---

**Subject**: Your Onara trial ends in 3 days
**Preview text**: Keep {business_name} online for $12/month.

---

Hi {first_name},

Your 14-day Pro trial ends on {trial_end_date}.

When it ends, your live site at **{public_url}** will go offline. Anyone who clicks your link will see a placeholder page instead of your business website.

To keep it live, pick a plan:

**Starter — $12/month**
- Your site stays live at {public_url}
- 10 revisions per month
- Custom domain support

**Pro — $29/month**
- Up to 3 websites
- Unlimited revisions
- Code download

**[Keep My Site Live — $12/month →]**
https://onara.tech/pricing

If you've already added your link to Google, Facebook, or anywhere else — your customers are counting on it being there.

The Onara Team

---
*Onara · onara.tech · Manage your account · Unsubscribe*

---
---

## EMAIL 3 — Trial Expiry Final Warning (Day 13)
**Trigger**: 1 day before trial_ends_at
**To**: User's email (trial users with at least one live site, no paid plan yet)
**Subject**: Your site goes offline tomorrow

---

**Subject**: Your site goes offline tomorrow
**Preview text**: One click keeps {business_name} online.

---

Hi {first_name},

Tomorrow your Onara trial ends and your live site goes offline.

Your site: **{public_url}**

After tomorrow, anyone who visits that URL — including anyone you've already shared it with — will see a suspension page instead of your business.

Upgrade today to keep it live without interruption.

**[Keep My Site Live →]**
https://onara.tech/pricing

*Starter is $12/month — less than one service call.*

The Onara Team

---
*Onara · onara.tech · Manage your account · Unsubscribe*

---
---

## EMAIL 4 — Trial Expired / Downgrade Notice (Day 14)
**Trigger**: trial_ends_at has passed, user not on paid plan
**To**: User's email
**Subject**: Your Onara trial has ended

---

**Subject**: Your Onara trial has ended
**Preview text**: Your site is now offline. Here's how to bring it back.

---

Hi {first_name},

Your 14-day Pro trial ended today.

Your site at **{public_url}** is now offline. Your site data is safe — the moment you upgrade, we'll redeploy it automatically.

**[Reactivate My Site →]**
https://onara.tech/pricing

Your site, your business data, and all your revisions are saved. Nothing is deleted. Upgrading takes 60 seconds and your site will be live again immediately.

Starter is $12/month. That's it.

The Onara Team

---
*Onara · onara.tech · Manage your account · Unsubscribe*

---
---

## EMAIL 5 — Payment Failed
**Trigger**: Stripe `invoice.payment_failed` event, after all retries exhausted
**To**: User's email
**Subject**: Payment failed — your Onara site will go offline soon

---

**Subject**: Payment failed — your Onara site will go offline soon
**Preview text**: Update your payment method to keep {business_name} online.

---

Hi {first_name},

We weren't able to process your last payment for Onara.

**Plan**: {plan_name} — ${plan_price}/month
**Amount**: ${amount_due}
**Last attempted**: {last_attempt_date}

If we can't collect payment, your site at **{public_url}** will go offline.

**[Update Payment Method →]**
https://onara.tech/account

This takes less than a minute. Once your payment is updated, your subscription continues and your site stays live.

If you have questions or need help, reply to this email.

The Onara Team

---
*Onara · onara.tech · Manage your account*

---
---

## EMAIL 6 — Subscription Cancelled Confirmation
**Trigger**: User cancels subscription (end of billing period)
**To**: User's email
**Subject**: Your Onara subscription has been cancelled

---

**Subject**: Your Onara subscription has been cancelled
**Preview text**: We saved your site data for 90 days.

---

Hi {first_name},

Your Onara {plan_name} subscription has been cancelled. It was active through {cancellation_effective_date}.

**What happens now:**
- Your live site at {public_url} is now offline
- Your site data and business info are saved for 90 days
- Reactivate anytime to bring your site back instantly

**[Reactivate My Account →]**
https://onara.tech/pricing

If you cancelled because something wasn't working right, we'd like to know. Reply to this email and tell us what went wrong — we read every reply.

The Onara Team

---
*Onara · onara.tech*

---
---

## EMAIL 7 — Revision Complete
**Trigger**: User-requested revision pipeline completes successfully
**To**: User's email
**Subject**: Your site has been updated

---

**Subject**: Your site has been updated
**Preview text**: Your changes to {business_name}'s website are live.

---

Hi {first_name},

Your revision is done.

**What we changed**: {revision_description}

**[View Your Updated Site →]**
{public_url}

You have **{revisions_remaining} revision{s}** left this month. They reset on {reset_date}.

The Onara Team

---
*Onara · onara.tech · Go to dashboard*

---
---

## EMAIL 8 — GBP Sync Notification (v2.5 feature)
**Trigger**: Google Business Profile change detected, site auto-updated
**To**: User's email
**Subject**: We updated your website automatically

---

**Subject**: We updated your website automatically
**Preview text**: Your Google Business hours changed. We synced your site.

---

Hi {first_name},

We noticed your Google Business Profile changed, so we updated your website automatically.

**What changed**: {changed_field}
**Old value**: {old_value}
**New value**: {new_value}

**[View Your Site →]**
{public_url}

You don't need to do anything. This is part of your Onara {plan_name} plan.

If this change looks wrong, reply to this email and we'll fix it.

The Onara Team

---
*Onara · onara.tech · Manage sync settings*

---
---

## VARIABLE REFERENCE

All templates use these variables populated by the backend:

| Variable | Source |
|----------|--------|
| `{first_name}` | users.full_name (first word) |
| `{business_name}` | projects.business_name |
| `{public_url}` | projects.public_url |
| `{trial_end_date}` | users.trial_ends_at (formatted: "June 1, 2026") |
| `{plan_name}` | users.plan (capitalized) |
| `{plan_price}` | Stripe price lookup |
| `{amount_due}` | Stripe invoice amount |
| `{last_attempt_date}` | Stripe invoice last attempt |
| `{cancellation_effective_date}` | Stripe subscription period_end |
| `{revision_description}` | revisions.instruction (truncated to 100 chars) |
| `{revisions_remaining}` | users.revisions_limit - users.revisions_used |
| `{reset_date}` | users.revisions_reset_at (formatted) |
| `{changed_field}` | gbp_sync_log.field_changed |
| `{old_value}` | gbp_sync_log.old_value |
| `{new_value}` | gbp_sync_log.new_value |
