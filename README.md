# Sherlock Holmes: A Scandal in Bohemia — Mobile Edition

Complete smartphone-optimized game, with the original graphics and story.
Also supports desktop keyboard and mouse controls.

## Play
Extract the ZIP first. On a desktop, open index.html in your browser.
For smartphone play, upload the contents of the Sherlock-Holmes-Mobile folder to a static web host, keeping index.html, style.css, game.js and assets together. Open the hosted link in your phone browser. Opening an HTML file in a phone's file-preview app may not run the game.

No build, package installation, backend or API keys are required.

Optional desktop local server (Python installed):
  macOS/Linux: python3 -m http.server 8000 --bind 127.0.0.1
  Windows: py -m http.server 8000 --bind 127.0.0.1
Run from the extracted folder, then visit http://localhost:8000.

## Phone controls
- Hold the arrow pad to move, or tap the floor to walk.
- Tap a person/object button below or beside the scene to approach and interact.
- Tap Inspect nearby to interact with a nearby target.
- Open Casebook & travel to review evidence, change locations or make deductions.
- Rotate between portrait and landscape; the full scene remains visible.

## Desktop controls
WASD or arrow keys to move. E to interact. Click a target to approach it.

## Files
index.html — interface
style.css — responsive layout and styling
game.js — story, touch controls, movement, dialogue, evidence and rendering
assets/ — all original background and character WebP images

HTML5 Canvas 2D, CSS and plain JavaScript. No external runtime dependencies.
Mobile drawing is capped at 30 fps. Progress lasts for this page session and resets on refresh. The optional read-only WebMCP tool is not required to play.

Story adapted from Arthur Conan Doyle's A Scandal in Bohemia (1891). Dialogue is adapted and compressed; the original outcome is preserved. Artwork was generated for this prototype.
Original story: https://sherlock-holm.es/stories/pdf/letter/1-sided/advs.pdf#page=9

Validation: syntax, complete story flow, touch movement, cancelled touches and casebook interaction logic checked. Actual phone/browser visual playtesting remains pending.
