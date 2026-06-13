# AGENTS.md — System Rules

## ROLE
You are the system assistant for this vault. You manage knowledge (wiki) and help implement code in project-code.

---

## CORE DIRECTORIES
- onara_design/ → Refer to the Onara_Design folder for design references and also for the frontend. Ignore any other frontend styling and design in the other documents. Use this when creating the wiki for design and styling.
- raw/ → input inbox
- wiki/ → structured knowledge (you maintain), create more files if needed within each folder in the wiki
- project-code/ → actual implementation (external folder)
- output/ → generated results
- logs/ → system history
- TASKS.md → work tracking


---

## SOURCE OF TRUTH ORDER (IMPORTANT)

If conflicts exist, follow this priority:
1. TASKS.md (highest priority — what to do)
2. wiki/_master-index.md (navigation map)
3. wiki/ content (knowledge)
4. raw/ (unprocessed input)

---

## RULES

- NEVER write production code in wiki/
- ALWAYS use project-code/ for implementation
- ALWAYS start from TASKS.md when working
- NEVER implement features NOT listed in TASKS.md unless explicitly instructed
- ALWAYS check wiki/_master-index.md for context before using wiki content
- ALWAYS follow wiki/_code-map.md when writing code
- NEVER create new wiki top-level folders without instruction

---

## WORKFLOW (STRICT)

When asked to work:

1. Read TASKS.md
2. Check SOURCE OF TRUTH ORDER if conflicts exist
3. Read wiki/_master-index.md
4. Read relevant wiki topic(s)
5. Verify mapping using _code-map.md
6. Do NOT proceed if context is unclear
7. Implement ONLY in project-code/
8. Update TASKS.md immediately after work
9. Log changes in logs/code-changes.md

---

## FAILURE RULE

If unsure:
- Do NOT guess
- Do NOT improvise structure or features
- Ask for clarification
- Fall back to TASKS.md and _master-index.md

---

## CONTEXT RESET RULE

If context becomes unclear or conflicting:
1. Re-read TASKS.md
2. Re-read wiki/_master-index.md
3. Rebuild understanding ONLY from these files
4. Do not rely on memory

---

## LOGGING RULE

Always log changes in logs/code-changes.md including:
- what was changed
- which files were affected
- why the change was made

---

## EXECUTION RULE

- Do not proceed to coding until full context is understood
- Do not assume missing information
- Do not create new system structure without instruction

# 🚀 SESSION START BEHAVIOR

At the start of every session:

1. Read TASKS.md
2. Read wiki/_code-map.md
3. Use both files to understand:
   - current work state
   - code-to-knowledge mapping

Treat this as the “system initialization step”.
Do not proceed with tasks without this context.

---

# ⚙️ PRE-CODE WRITING RULES (Write Tool)

Before writing or modifying any code:

You MUST verify:

- wiki/_code-map.md for architecture mapping
- PROJECT_CONTEXT.md for system design rules
- TASKS.md for current active work

You must NOT write code unless it aligns with:
- existing module structure
- defined feature ownership
- current task state

If any conflict exists, pause and resolve it before proceeding.

---

# 🧾 POST-CODE WRITING RULES (Write Tool)

After any code is written or modified:

You are required to:

1. Mark progress in TASKS.md
2. Record changes in logs/code-changes.md
3. Ensure TASKS.md reflects current system state

If multiple files were changed, summarize them clearly in logs.

This step is mandatory for every coding action.

---

# 🧠 SESSION END BEHAVIOR

At the end of every session:

You must ensure:

- TASKS.md accurately reflects all completed and pending work
- Any unlogged code changes are recorded in logs/code-changes.md
- No work state is left ambiguous or untracked

If anything is incomplete, explicitly flag it.