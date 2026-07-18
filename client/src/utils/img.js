// Neutral inline-SVG placeholder shown when a photo fails to load, so a broken
// image never renders the browser's default "?" icon.
const SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
  <rect width='100%' height='100%' fill='#e9e9ee'/>
  <g fill='none' stroke='#b7b7c0' stroke-width='14' stroke-linecap='round' stroke-linejoin='round'>
    <rect x='300' y='235' width='200' height='150' rx='14'/>
    <circle cx='355' cy='285' r='16'/>
    <path d='M312 372l52-52 40 40 46-50 50 55'/>
  </g>
</svg>`;

export const PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(SVG);

// Swap a broken <img> to the placeholder (guarded so it can't loop).
export function onImgError(e) {
  if (e.currentTarget.src !== PLACEHOLDER) {
    e.currentTarget.src = PLACEHOLDER;
  }
}
