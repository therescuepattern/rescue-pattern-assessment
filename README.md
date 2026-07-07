# The Rescue Pattern — Assessment

A complete, deploy-ready Vite + React app. Drop it into Vercel and you've got your
bio-link funnel: the assessment auto-scores, generates a personalized read, and captures
emails — all backed by two serverless functions in `/api`.

```
rescue-pattern-assessment/
├─ index.html
├─ package.json
├─ vite.config.js
├─ src/
│  ├─ main.jsx
│  └─ App.jsx          ← the assessment
└─ api/
   ├─ read.js          ← personalized AI read (holds your API key)
   └─ subscribe.js     ← email capture → your list
```

## Deploy from a Chromebook (all in the browser)

1. **Make a GitHub repo.** At github.com → New repository → name it `rescue-pattern-assessment`.
   Use the "uploading an existing file" link and drag this whole folder in (or unzip first,
   then drag the contents). Commit.
2. **Import to Vercel.** At vercel.com → Add New ▸ Project → import the repo. Vercel
   auto-detects Vite and the `/api` functions. Click Deploy.
3. **Upgrade to Pro** (Settings ▸ Plans) — your site is commercial, so this is the right tier,
   and it lifts the function timeout for the AI read.
4. **Add environment variables** (Settings ▸ Environment Variables), then redeploy:
   - `ANTHROPIC_API_KEY` = `sk-ant-...` (from console.anthropic.com)
   - `KIT_API_KEY` and `KIT_FORM_ID` (once your email tool is connected — optional at first;
     the app accepts emails gracefully without them)
5. **Put the live `*.vercel.app` URL in your Instagram bio.** Custom domain whenever you want.

> Tip: env vars don't apply to old builds — always redeploy after adding them. And keep the
> `api/` folder at the project root, not inside `src/`.

## Run it locally first (optional)

If you set up the ChromeOS Linux environment:
```
npm install
npm run dev
```
The AI read falls back to a written result until `ANTHROPIC_API_KEY` is set — that's expected.

## Customize

- The "Get the workbook" button in `src/App.jsx` has a comment marking where to paste your
  Gumroad / Stan / Payhip checkout link.
- Colors and copy live at the top of `src/App.jsx`.
