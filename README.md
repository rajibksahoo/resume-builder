# Résumé Builder

A personal, interactive, **ATS-friendly** résumé builder. Edit live in the browser, keep
multiple tailored versions, and export a clean PDF with **real selectable text** in one click.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Build a static bundle (deployable anywhere) with `npm run build`, preview it with `npm run preview`.

## How it works

- **Left pane** — form editor. Every keystroke updates the preview.
- **Right pane** — the actual résumé document. This is the *only* thing that prints.
- **Export PDF** — triggers the browser print dialog; choose **“Save as PDF”**. Output is a
  clean **A4** file with **no browser header, URL, page number, or timestamp**, and an even
  margin on **every** page.

  This works because the résumé is rendered as real A4 sheets (`ResumePages.tsx`): each block is
  measured off-screen and packed whole into a page, so a block (Skills, Education, each role…)
  is **never split across a page boundary** — it moves down intact. Each sheet carries its
  margins as inner padding, and the print CSS uses `@page { margin: 0 }`, which is what makes
  Chrome omit the header/footer automatically (no dialog toggle needed). Single-column,
  semantic, selectable text that ATS parsers read cleanly: no images, no columns.

## Versions

Each résumé version lives as a JSON file in `src/data/resumes/`. The seeded one is
`rajib-default.json`.

- **New / Duplicate** — create extra versions in the browser (stored in localStorage).
- **Export JSON** — download the current version. To make a browser-made version a permanent,
  git-tracked file, drop the downloaded JSON into `src/data/resumes/` and reload.
- **Import JSON** — load a `.json` file back into the editor.
- A **● modified** badge shows when your edits differ from the committed JSON; **Revert**
  restores the saved version.

Working edits auto-save to your browser, so a refresh never loses changes.

## ATS-friendly by design

Single `<h1>` name, `<h2>` standard section headings (Summary, Experience, Skills,
Education, …), `<h3>` roles, plain-text contact line, standard fonts, black-on-white,
single column, no tables or text-in-images. The PDF text == the on-screen text.

## Structure

```
src/
  types/resume.ts            # résumé schema (single source of truth)
  data/resumes/*.json        # one file per version
  state/useResume.ts         # versions, localStorage working copy, dirty tracking
  components/
    AppShell.tsx, Toolbar.tsx
    editor/                  # form sections
    resume/                  # ATS render + print CSS
```
