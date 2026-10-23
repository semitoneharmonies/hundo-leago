# Tip Jar audience artwork

These original transparent illustrations were generated for Tip Jar with OpenAI image generation on 2026-10-21. They are fictional adult spectators, not photographs or likenesses of real people. No third-party stock photograph is bundled.

- `spectators.png`: six isolated, fully clothed adult caricatures in a 1536 x 1024 atlas. The renderer crops each cell separately, anchors the seated figures to actual seat pans, and overlays the original 100 and tip-jar sign graphics.
- `railing-fan.png`: one isolated bored adult spectator, 1254 x 1254. His elbows align with the rear railing; the renderer keeps his hanging hands in front of it.
- The skinny black cat and both sign graphics are original code-authored geometry/artwork in `src/audience.js`.

The exact generation and revision prompts are preserved in the source project's `artifacts/arena-targets/` directory. Atlas stages are `audience-caricature-final-prompt.txt`, `audience-cel-style-prompt.txt`, `audience-cel-spacing-prompt.txt`, `audience-square-signs-outfits-prompt.txt`, and `audience-square-spacing-prompt.txt`; the seventh fan uses `railing-fan-prompt.txt`. The final revision enlarges the signs, changes the old spectator's puck hat into a purple toque, and updates the adult women's outfits.

Final generated originals (retained on E:):

- Atlas: `exec-24947b7b-1268-4ec3-86ea-6dd65762c077.png`
- Railing fan: `exec-1e18b18c-d359-43a2-8018-2d9a2c3f2aaf.png`

PNG artwork was copied into this folder without external image editing. Texture coordinates perform cropping at render time. Transparent gutters were checked from the PNG alpha channel; seat/rail alignment and occlusion were checked with the actual scene geometry.

## Level 1 TIPS supporters — 2026-10-22

`level1-tips.png` is an original OpenAI-generated transparent caricature atlas of four fictional adult, shirtless male hockey fans. The 1254 x 1254 PNG contains four 627 x 627 cells in T, I, P, S reading order. The painted letters are added by the renderer, so each remains exact and readable at the chosen audience size. The generated original is `exec-260f1e9e-bd67-4797-8c15-fa51a0fff130.png` in the E: generated-images folder. The PNG was copied unchanged; alpha-channel inspection confirmed all visible body pixels and soles are inside their own cells, with no visible clipping or overlap. No external image editor or third-party photograph was used.

## Level 1 cheerleaders and seated fans — 2026-10-22

`level1-cheer.png` is a 1536 x 1024 RGBA atlas of six fictional adult caricatures: three standing professional cheerleaders and three seated spectators. It was made with the built-in OpenAI image generation tool. A spacing-only edit preserved the six designs while separating the top-row shoes from the bottom-row cells. The exact edit prompt is `artifacts/arena-targets/level1-cheer-spacing-prompt.txt`; final generated original: `exec-59d2a61b-27bf-4a03-b866-f04cd3818e16.png`. The PNG was copied without external image editing. Runtime UV crops preserve the artwork's proportions and genuine alpha; shoe and hip landmarks anchor people to the arena treads and seats.

## Level 3 spectators — 2026-10-22

`level3-fans.png` is the original 1536 x 1024 transparent generated atlas of six fictional adult spectators, including three seated women, two sign holders and a foam-finger fan. The built-in image generation tool produced original `exec-c0165f13-cf34-41e4-a6c8-b66cf710004d.png`. An attempted spacing-only edit (`artifacts/arena-targets/level3-fans-spacing-prompt.txt`) was rejected by the image tool and was not used. The original PNG is copied unchanged. Exact runtime UV rectangles retain the top-right woman's complete shoe through pixel y=514 and begin the lower-right fan after y=522, so the figures do not bleed between cells. Code-authored square signs read `JUST THE TIP!` and `HUNDO LEAGO`; foreground grip layers keep their fingers and hats in front.
