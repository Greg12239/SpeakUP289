# SpeakUp website foundation

Production front-end foundation for SpeakUp, built with Next.js App Router,
React, strict TypeScript, Tailwind CSS and Motion for React.

## Local development

```bash
npm install
npm run dev
```

## Production preview

Build the static export and serve it over localhost so root-relative Next.js
assets, styles, fonts and client-side interactions load correctly:

```bash
npm run build
npm run preview
```

Open [http://localhost:3000](http://localhost:3000). The generated homepage is
also available at `out/index.html` for inspection, but should be previewed
through the local server rather than opened directly with `file://`. On
Windows, double-click `PREVIEW-SPEAKUP.bat` to build and launch the preview.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

The final production URL can be supplied through `NEXT_PUBLIC_SITE_URL` to
enable canonical metadata. Join, social, email and privacy destinations remain
intentionally unconfigured until verified URLs are supplied.
