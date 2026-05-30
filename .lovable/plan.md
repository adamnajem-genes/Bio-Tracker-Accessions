# Making AccessionDeck feel real

You've got the bones. What's missing is the stuff that makes a tool feel like someone actually uses it every day. Two tiers — **feature gaps** (things a real bioinformatician would expect) and **polish** (the texture that separates "shipped product" from "weekend project").

---

## Tier 1 — Feature gaps you probably aren't thinking of

### 1. Auto-enrich accessions from the source database
Right now the user types in title, organism, length by hand. That's the #1 thing that makes the tool feel fake. When someone pastes `NM_001301717`, we should hit **NCBI E-utilities**, **UniProt REST**, **Ensembl REST**, **EBI**, **PDB** — fetch title, organism, length, description, publication date — and pre-fill the entry. Same on bulk import: enrich all 200 rows in the background with a progress bar.

These are all free, no-API-key public REST endpoints. Wraps in a server fn so we can rate-limit politely and cache.

### 2. Duplicate detection
If the user adds `P38398` in two different projects, surface that. A small "also in: BRCA-project" badge. Prevents redundant collection.

### 3. Bulk actions on the table
Checkboxes per row → bulk **status change**, **tag**, **move to project**, **delete**, **export selection only**. Right now every action is one-at-a-time, which falls apart at 50+ entries.

### 4. Inline edit + sortable columns
Click a cell to edit status, tags, notes. Click a column header to sort. Column visibility toggle. Table feels alive instead of read-only.

### 5. Command palette (⌘K)
Jump to any project, search any accession, run any action (new entry, import, export, switch view) from the keyboard. This single thing makes a tool feel "pro."

### 6. Per-project dashboard
A tab per project showing: count by database, count by status, recent activity timeline, top tags. Right now the user has no overview of *what they have* — just a flat list.

### 7. Notes & methods per entry
A markdown notes field per entry — "ran BLAST against nr, top hit was X" — with auto-linkification of PMIDs, DOIs, and other accessions. Plus a `methods.md` export so the user can drop straight into a manuscript.

### 8. Citation export (BibTeX)
For every accession in a project, generate proper citations (NCBI gives you the PMID, UniProt gives you the primary refs). Export as `.bib`. Researchers will lose their minds.

### 9. Saved views
"NM_ entries in BRCA project tagged qc-passed" as a one-click filter chip the user names and pins. Power-user retention feature.

### 10. Activity feed / audit log
Per-entry: when added, status changes, edits. So when the user opens the project two months later they remember what they did.

---

## Tier 2 — Polish that kills the "vibe coded" smell

These are the things that — individually trivial — collectively make a product feel **made by humans for humans**.

### Onboarding & first impression
- **Real landing page at `/`** for logged-out visitors (not just a redirect to login). Explains what it is, who it's for, screenshot of the deck. SEO + shareable.
- **Sample project on first signup** — auto-create "Demo: BRCA1 study" with 8–10 real example accessions across NCBI / UniProt / PDB / PubMed so a new user immediately sees what a populated deck looks like.
- **Empty states** with a clear next action, not just "No entries." Show a glassy illustration + "Paste an accession to get started" + a button.

### Feedback & forgiveness
- **Loading skeletons** instead of blank screens or spinners. Glassy shimmer that matches the aesthetic.
- **Undo toasts** on every destructive action ("Entry deleted · Undo" 6-second toast). Same for status changes and bulk ops.
- **Optimistic UI** — when you change a status, it updates instantly and rolls back on error.
- **Inline validation** — accession format warnings as the user types ("That doesn't look like a UniProt ID — did you mean `P38398`?").

### Keyboard & power-user feel
- `/` to focus search, `n` for new entry, `i` for import, `Esc` to close any dialog, `Enter` to submit, `⌘K` for palette.
- Tab order through the table. Arrow keys to navigate rows.

### Micro-interactions
- Subtle hover lifts on glass cards (1–2px translate, shadow deepen).
- Page transitions (fade + slide ~150ms).
- Button press feedback (scale 0.98).
- Status badge color pulses softly when changed.
- A "data being fetched from NCBI" ambient indicator when enrichment is in flight.

### Real metadata
- **Favicon** that matches the Frutiger Aero aesthetic (glossy aqua DNA helix or similar).
- **Open Graph image** so the link unfurls beautifully when shared on Slack / Twitter.
- **Per-route titles** ("BRCA project · AccessionDeck") so browser tabs read like a real app.
- **Web manifest** so it's installable as a PWA.

### Mobile
- The current table will break on phones. Switch to a card list under 640px with the same actions surfaced via a swipe/long-press menu.

### Trust & legitimacy
- **Footer** with version number, last-updated date, link to a `/changelog` page.
- **Status badge** in the header — green dot "All databases reachable" / amber "NCBI slow" (we can ping). Massive credibility boost.
- **Documentation** at `/docs` covering supported databases, accession formats, and export formats — written like real docs, not lorem ipsum.

### Copy
Replace every generic label. "Add entry" → "Track an accession". "Export" → "Hand off to R / Python / spreadsheet". Voice should sound like a lab notebook, not a CRUD app.

---

## How I'd suggest sequencing

If you say "go," I'd do this in three passes:

1. **Pass A (biggest impact, ~1 build):** Metadata auto-enrichment + bulk actions + command palette + sample project on signup + skeletons & empty states + undo toasts + favicon/OG/per-route titles.
2. **Pass B:** Project dashboard + inline edit + sortable columns + saved views + duplicate detection + landing page.
3. **Pass C:** Notes/markdown + BibTeX export + audit log + PWA manifest + docs page + mobile card view + status pings.

---

## A note on tech

All of Tier 1 fits cleanly inside the existing stack — `createServerFn` for the enrichment fetches (so we can keep NCBI rate-limit headers server-side), Supabase migrations for the activity log + notes + saved-views tables, and zero new dependencies for the command palette (shadcn already ships `cmdk`).

**Question for you before I start building:** want me to do all of Pass A in one go, or pick a subset? And is there anything from Tier 1 you'd swap out for something I missed?
