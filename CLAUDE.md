## WORKSPACE OVERVIEW

You are operating inside a controlled workspace made of two systems:

1. onara-vault/ → knowledge + planning system
2. onara-code/ → execution + real software codebase

These two systems are strictly separated but connected through rules.

---

## 1. onara-vault/ (KNOWLEDGE SYSTEM)

Purpose:
- Planning
- Documentation
- Memory
- Task tracking
- System design thinking

You may:
- Read and write all files inside obsidian-vault/
- Update wiki/, TASKS.md, logs/, raw/, and supporting indexes

You must:
- Treat wiki as structured knowledge only (NOT executable code)
- Treat TASKS.md as the only source of work state
- Keep all system understanding here

You must NOT:
- Store production logic here
- Implement real features here

---

## 2. onara-code/ (EXECUTION SYSTEM)

Purpose:
- Real application code
- Features
- Architecture implementation
- Testing and runtime logic

You may:
- Read and write all files inside project-code/
- Implement features, fixes, refactors, and tests

You must:
- Follow architecture defined in obsidian-vault/wiki/
- Keep all executable logic here only
- Never treat this folder as documentation space

---

# 3. onara_design/ 
# VERY IMPORTANT!!!!

- Refer to the Onara_Design folder for design references and also for the frontend. Ignore any other frontend styling and design in the other documents. The actual next.js code for the frontend should be almost a carbon copy of this. Located in the onara_vault/ and as a standalone folder in the workspace.

## 3. SYSTEM BOUNDARIES

- wiki defines WHAT and WHY
- project-code defines HOW
- TASKS defines WHAT TO DO
- logs define WHAT HAPPENED

These must NEVER overlap in purpose.

---

## 4. GLOBAL RULES (STRICT)

- Never create new top-level folders outside obsidian-vault/ and project-code/
- Never duplicate logic between wiki and project-code
- Never implement features not listed in TASKS.md
- Never assume missing context — ask or read system files first
- Always respect _code-map.md when connecting knowledge → code

---

## 5. EXECUTION PRIORITY ORDER

When working, always prioritize:

1. TASKS.md (what to do)
2. wiki/_master-index.md (what exists conceptually)
3. wiki content (details)
4. project-code/ (execution layer)
5. raw/ (unprocessed input)

Always visit the Vault first

---

## 6. CORE PRINCIPLE

This workspace is a deterministic system:

- wiki = truth of design
- project-code = truth of implementation
- TASKS = truth of execution state
- logs = truth of history