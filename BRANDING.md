# PowerUp Connect branding

PowerUp Connect follows the Power Up Women's Conference website brand (set November 2026).

## Where the brand lives in the code
- `client/src/index.css` — colour, font, radius and shadow tokens for light and dark mode, plus the `pu-*` brand utilities at the bottom of the file.
- `client/index.html` — Google Fonts (Outfit, Inter, Kaushan Script), favicon and theme colour.
- `client/src/components/logo.tsx` — `Logo` (the power button) and `Wordmark`.
- `client/src/components/brand-rings.tsx` — the rings graphic used in empty states.
- `client/src/components/ui/button.tsx` — pill buttons and the `gold` variant.
- `client/src/assets/power-button.png`, `power-up-logo.png` — brand artwork.

## Colours
| Role | Hex |
|---|---|
| Navy (text, dark surfaces) | #0B1440, #140A6E |
| Purple (primary) | #6A21C4, #8A2BE2, #44158F |
| Gold (accent, main call to action) | #FFD23F, #FFB81C, #FF8A00 |
| Red | #E0263C, #C2183A |
| Green | #2E9E33, #70C040 |
| Blue | #1D8DF0, #02AFEF, #0A3F9E |
| Lavender tints | #F4F0FF, #EEE8FA, #E4D8F7 |

## Brand utilities
- Gradients: `pu-hero`, `pu-night`, `pu-purple`, `pu-blue`, `pu-green`, `pu-sun`, `pu-text-grad`
- Call to action: `pu-gold` (or `<Button variant="gold">`)
- Card corners: `pu-shape-0` to `pu-shape-3`; soft card tint: `pu-card-tint`
- Decoration: `pu-ring`, `pu-float`; handwritten accent: `font-script`

## Rules of thumb
- One gold button per screen, for the main action. Everything else is purple or outline.
- Use `font-script` for a few words at most, never for body text or labels.
- Vary card corners and offsets so layouts do not read as a uniform grid.
- Keep text at 4.5:1 contrast or better: navy on gold, white on purple, blue, green and the hero gradient.
