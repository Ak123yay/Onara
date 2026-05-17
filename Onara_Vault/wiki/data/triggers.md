# Database Triggers — Functions and Triggers

All trigger functions and their associated triggers. Source: `raw/02_database_schema.md` Section 5.

---

## Trigger 1 — Auto-Update `updated_at`

**Tables**: `users`, `projects`

**Purpose**: Automatically sets `updated_at = NOW()` on every row update. Eliminates the need for application code to set this manually.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Trigger 2 — New User Profile Creation

**Table**: `auth.users` (Supabase built-in)

**Purpose**: When a user signs up (Google OAuth or email/password), Supabase creates a row in `auth.users`. This trigger immediately creates the corresponding profile row in `public.users` with default values including the 14-day trial.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Notes**:
- `SECURITY DEFINER` runs the function as the function owner (postgres), bypassing the RLS INSERT restriction on `public.users`.
- `full_name` and `avatar_url` come from Google OAuth metadata automatically.
- Default column values (`plan = 'free'`, `is_trial = TRUE`, `trial_ends_at = NOW() + 14 days`, `revisions_limit = 3`) are set by the table definition — this function only needs to supply the identity fields.

---

## Trigger 3 — Enforce Project Limit

**Table**: `public.projects`

**Purpose**: Prevents users from creating more projects than their plan allows. Enforced at the database level so it cannot be bypassed by the application.

```sql
CREATE OR REPLACE FUNCTION enforce_project_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  current_count INT;
  max_allowed   INT;
  user_plan     plan_type;
BEGIN
  SELECT plan INTO user_plan FROM public.users WHERE id = NEW.user_id;

  current_count := (
    SELECT COUNT(*) FROM public.projects
    WHERE user_id = NEW.user_id AND status != 'failed'
  );

  max_allowed := CASE user_plan
    WHEN 'free'    THEN 1
    WHEN 'starter' THEN 1
    WHEN 'pro'     THEN 3
    ELSE 1
  END;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Project limit reached for plan %', user_plan;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_project_limit
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION enforce_project_limit();
```

**Plan limits**:
| Plan | Max projects |
|------|-------------|
| free | 1 |
| starter | 1 |
| pro | 3 |

**Note**: `status != 'failed'` — failed projects don't count against the limit. This allows retry without needing to delete the failed record first.

---

## Trigger 4 — Track Revision Usage

**Table**: `public.revisions`

**Purpose**: Increments `revisions_used` on the user's row whenever a new revision record is inserted. Keeps revision tracking in sync without requiring application code to manage the counter.

```sql
CREATE OR REPLACE FUNCTION decrement_revision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users
  SET revisions_used = revisions_used + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_revision_created
  AFTER INSERT ON public.revisions
  FOR EACH ROW EXECUTE FUNCTION decrement_revision();
```

**Note**: The function is named `decrement_revision` but it increments `revisions_used`. The naming reflects that it "decrements" the remaining count from the user's perspective. The API checks `revisions_used < revisions_limit` before allowing a revision to be submitted.

---

## Trigger Execution Summary

| Trigger | Fires | Table | When |
|---------|-------|-------|------|
| `users_updated_at` | BEFORE UPDATE | `users` | Every user row update |
| `projects_updated_at` | BEFORE UPDATE | `projects` | Every project row update |
| `on_auth_user_created` | AFTER INSERT | `auth.users` | Every new signup |
| `check_project_limit` | BEFORE INSERT | `projects` | Before any project creation |
| `on_revision_created` | AFTER INSERT | `revisions` | Every new revision submission |

---

## Verifying Triggers Are Active

```sql
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
ORDER BY event_object_table, action_timing;
```
