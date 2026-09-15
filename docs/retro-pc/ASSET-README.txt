RETRO PC PORTFOLIO - COMPLETE PROJECT

OPEN ON WINDOWS
1. Extract All from this ZIP.
2. Open the extracted retro-pc-portfolio folder.
3. Double-click START-PREVIEW.cmd. Your browser opens the portfolio.
4. Keep the terminal open while using the preview; close it to stop.
Python 3 is required. On other systems run: python scripts/open_preview.py
Do not open index.html directly: browser modules need a local web server.

WHAT IS INCLUDED
- Interactive PC, keyboard, mouse and all four stickers.
- Power on/off, smooth screen zoom and the Windows-style portafolio folder.
- CRT screen texture and the animated ASCII skull.
- Classic pixel cursors and the fixed-size dragging hand.
- Editable website HTML, CSS and JavaScript.
- retro-pc.blend: editable Blender scene.
- assets/retro-pc-web.glb: compact model with Draco compression.
- assets/retro-pc.glb: standard model for other 3D software.
- Local Three.js libraries and the required decoder.

ADD IT TO YOUR PORTFOLIO WEBSITE
Upload index.html, style.css, viewer.js, desktop.js, crt-screen.js,
ascii-skull.js, stats.json, assets/ and vendor/ together, keeping their paths.
This is a static website: no build step or CDN is needed.
The Blender file and scripts/ are only for editing and local preview.
Only assets/retro-pc-web.glb is loaded by the site; the larger standard GLB
can also be left out of a deployed website.

The GLB alone contains a still screen. Keep the website code and
assets/skull-ascii.bin.gz to retain the working desktop and animation.
Serve skull-ascii.bin.gz as a file without automatic gzip decompression;
the website decompresses those animation samples itself.
The browser needs WebGL 2 and DecompressionStream support.

CREDITS
Computer geometry and base textures created for this project using Blender.
Visual reference: Old PC by Jaewoo:
https://sketchfab.com/3d-models/old-pc-eb9ab21bfaa44efdbb48a4948f88248f
The reference mesh is not included. Sticker artwork supplied by you.
Skull geometry: Vladimir Petkovic, CC0; see assets/skull-CREDIT.md.
Three.js: MIT; see vendor/THREE-LICENSE.txt.
