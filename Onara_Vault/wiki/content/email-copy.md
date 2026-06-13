# Email Copy — Onara

_All 8 transactional email templates. Source: `raw/07_email_copy.md`._

---

## Template Variables Reference

| Variable | Source | Example |
|----------|--------|---------|
| `{{first_name}}` | `users.full_name` (first word) | `Sarah` |
| `{{business_name}}` | `projects.business_name` | `Main Street Salon` |
| `{{site_url}}` | `projects.public_url` | `https://onara-abc123.pages.dev` |
| `{{trial_end_date}}` | `users.trial_ends_at` | `May 28, 2026` |
| `{{plan_name}}` | `users.plan` | `Starter` |
| `{{amount}}` | Stripe invoice amount | `$12.00` |
| `{{next_billing_date}}` | Stripe subscription period end | `June 14, 2026` |

---

## Email 1: Welcome + Site Live

**Trigger**: After deployment completes first site generation  
**From**: `hello@onara.tech`  
**Subject**: `Your {{business_name}} website is live 🎉`

```
Hi {{first_name}},

Your website is live!

[Visit Your Site →] {{site_url}}

Here's what we built for you:
- Professional design tailored to your business
- SEO-optimized so Google can find you
- Mobile-friendly — looks great on any device
- Pulls from your Google Business Profile automatically

You're on a 14-day free trial with full Pro access.
No credit card needed yet — just enjoy it.

Questions? Reply to this email.

The Onara Team
```

---

## Email 2: Trial Ending in 3 Days (Day 11)

**Trigger**: pg_cron — fires when `trial_ends_at` is 3 days away  
**Subject**: `Your Onara trial ends in 3 days`

```
Hi {{first_name}},

Your free trial ends on {{trial_end_date}}.

After that, your dashboard preview stays available, but your public URL is hidden unless you choose a paid plan.

[Choose a Plan →]

Starter — $12/month or $99/year
Everything you need: 1 live site, 10 revisions/month

Pro — $29/month
3 live sites, unlimited revisions, code download

Still have questions? Reply to this email.

The Onara Team
```

---

## Email 3: Trial Ending Tomorrow (Day 13)

**Trigger**: pg_cron — fires when `trial_ends_at` is 1 day away  
**Subject**: `Last chance — your Onara trial ends tomorrow`

```
Hi {{first_name}},

Your trial ends tomorrow.

Your dashboard preview stays available regardless. To keep the public URL live, generate more sites, or request paid-plan revisions, choose a plan.

[Pick a Plan →]

Starter — $12/month or $99/year · Pro — $29/month

No credit card was needed to start. Takes 2 minutes to upgrade.

The Onara Team
```

---

## Email 4: Trial Ended (Day 14)

**Trigger**: pg_cron — fires on `trial_ends_at`  
**Subject**: `Your Onara trial has ended`

```
Hi {{first_name}},

Your 14-day trial has ended. Your dashboard preview is still available, but your public URL is now hidden on the free plan.

What changed:
- Public URL hidden on the free plan
- 1 preview site remains in your dashboard
- 3 free revisions/month remain available

[Upgrade Now →]

Starter — $12/month or $99/year  |  Pro — $29/month

The Onara Team
```

---

## Email 5: Payment Failed

**Trigger**: Stripe webhook `invoice.payment_failed`  
**Subject**: `Action required: payment failed for Onara`

```
Hi {{first_name}},

We couldn't process your payment of {{amount}} for your Onara {{plan_name}} subscription.

Your site is still live, but we'll need to update your payment method to keep your plan active.

[Update Payment Method →]

If you don't update within 7 days, your plan will be paused.

Need help? Reply to this email.

The Onara Team
```

---

## Email 6: Subscription Cancelled

**Trigger**: Stripe webhook `customer.subscription.deleted`  
**Subject**: `Your Onara subscription has been cancelled`

```
Hi {{first_name}},

Your Onara {{plan_name}} subscription has been cancelled.

Your site at {{site_url}} will remain live. You can still log in and view your sites.

To generate new sites or request revisions, you'll need to resubscribe.

[Resubscribe →]

We'd love to know why you cancelled — reply to this email if you're open to sharing.

The Onara Team
```

---

## Email 7: Revision Complete

**Trigger**: Team marks revision as `complete` in Supabase  
**Subject**: `Your revision for {{business_name}} is ready`

```
Hi {{first_name}},

Your revision for {{business_name}} is complete.

[View Your Updated Site →] {{site_url}}

What changed: [revision instructions from the revision record]

Have more feedback? You can request another revision from your dashboard.

The Onara Team
```

---

## Email 8: GBP Sync Notification (v2.5)

**Trigger**: pg_cron detects change in Google Business Profile  
**Subject**: `Update detected for {{business_name}} — regenerate your site?`

```
Hi {{first_name}},

We noticed your Google Business Profile for {{business_name}} was recently updated.

To reflect these changes on your website, you can regenerate it in one click.

[Regenerate Site →]

If you didn't make any changes, you can ignore this email.

The Onara Team
```

---

## Sending via Resend

All emails sent via `POST https://api.resend.com/emails`:

```typescript
await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,      // hello@onara.tech
  replyTo: process.env.RESEND_REPLY_TO,     // support@onara.tech
  to: [user.email],
  subject: '...',
  html: '...',   // rendered template
})
```

---

## Related Files

- `wiki/integrations/resend.md` — Resend setup and domain verification
- `wiki/features/billing.md` — which billing events trigger which emails
- `raw/07_email_copy.md` — source file with additional copy variants
