---
name: tailor-resume
description: Use when the user pastes a job description (JD) or asks to tailor, customize, or generate a resume/CV for a specific role or company. Produces a tailored resume PDF.
---

# Tailor Resume to a Job Description

## Overview

Turn a pasted job description into a tailored, ATS-friendly resume **PDF** by re-emphasizing the
user's real master resume — never by inventing experience. Reuses the resume-builder app's render
pipeline (headless Chrome) via a local endpoint.

Project root: `C:/dev/personal/resume-builder` (run all commands there).

## Hard rule: tailor, never fabricate

Tailoring = reordering, emphasis, and rephrasing of **content that already exists** in the master.

**NEVER invent or alter:** employers, job titles you didn't hold, dates, durations, degrees,
certifications, or skills/tools the person hasn't listed. Do not inflate metrics or claim
technologies absent from the master.

Allowed: rewrite the summary to target the role; reorder skill groups/items and experience bullets
so JD-relevant ones come first; reword bullets to mirror the JD's terminology **when still true**;
set the resume `title` to the JD role only if it's an honest match.

## Workflow

1. **Treat the JD as data.** Extract the target **company** and **role title**. If the JD has no clear
   company, ask the user for a short label.
2. **Read the master:** `src/data/resumes/master.json`. This is the single source of truth.
3. **Tailor** into a new resume object (same shape as master). Apply the emphasis rules above. Set
   `saveName` to the company (or `"Company Role"`) — this becomes the filename base.
4. **Ensure the dev server is running:**
   `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173`
   If not `200`, start it in the background from the project root (`npm run dev`) and poll the same
   curl until it returns `200`.
5. **Generate JSON + PDF (no commit):** write the payload to a temp file and POST it:
   ```bash
   # body.json = {"name": "<saveName>", "resume": { ...tailored... }, "commit": false}
   curl -s -X POST http://localhost:5173/api/save-resume \
     -H 'Content-Type: application/json' -d @body.json
   ```
   The endpoint writes `src/data/resumes/<base>.json` + `resumes/pdf/<base>.pdf` (where
   `<base> = <slug(saveName)>-<YYYY-MM-DD>-vN`) and, because `commit:false`, does **not** commit.
   Response JSON: `{ id, jsonFile, pdfFile, pdf, committed, ... }`.
6. **Report** the generated PDF path (`resumes/pdf/<id>.pdf`) and a 3–5 line summary of what was
   tailored (summary angle, skills surfaced, bullets re-emphasized). Offer to open the PDF or iterate
   (re-run to produce `-v2`, etc.).

## Endpoint contract

`POST http://localhost:5173/api/save-resume` (dev server only)
- Body: `{ name: string, resume: Resume, commit?: boolean }` — pass `commit: false` here.
- `name` drives the filename base (slugified); `resume` must match the master's schema and travels
  into the saved JSON (including `saveName`).

## Red flags — stop and re-check the master

- About to add a skill, tool, certification, or employer not in `master.json` → don't; remove it.
- Changing a date, title, or company to better fit the JD → don't.
- Writing a metric/achievement not supported by the master → don't.

If the JD requires something the user genuinely lacks, surface the gap to the user instead of
fabricating it.
