# Andrés Landazábal — Portfolio

The homepage opens the interactive retro PC. Turn it on, then open the desktop’s **portafolio** folder, then double-click the **portafolio** document to view the existing React portfolio. Single-click selects the document; double-click opens it. With the desktop canvas focused, Enter opens the folder, opens its file, or restores the minimized website. Use the title-bar controls to minimize the website to its desktop taskbar button, maximize/restore its size, or close it. Minimizing preserves the page and scroll position; click its taskbar button to restore it. Escape closes the website and returns to the folder. The complete site also remains available at `/portfolio/`.

## Development

```sh
cd portfolio-react
npm install
npm run dev
```

`npm run build` builds both pages and copies the PC runtime into `docs/` for GitHub Pages. `npm run lint` checks the application code.

## Files

- `portfolio-react/index.html`: full-screen PC landing page.
- `portfolio-react/public/retro-pc/`: model, interactive desktop, portfolio window, and local Three.js runtime, extracted from the supplied ZIP.
- `portfolio-react/portfolio/index.html` and `portfolio-react/src/`: existing portfolio and translations.
- `artifacts/retro-pc-portfolio/`: full original ZIP extraction, including the Blender source (local, ignored by Git).

Asset credits are retained in `public/retro-pc/assets/skull-CREDIT.md` and `public/retro-pc/vendor/THREE-LICENSE.txt`. Serve the skull animation `.bin.gz` as a binary file; it is decompressed by the viewer.
