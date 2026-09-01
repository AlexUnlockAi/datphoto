import "server-only";
import sharp from "sharp";

// Tiles "DATPHOTOGRAPHY • PROOF" diagonally across the image so no clean
// crop can remove it, without obscuring the photo enough to be unusable
// for browsing/deciding what to buy.
function watermarkSvg(width: number, height: number): string {
  const label = "DATPHOTOGRAPHY  •  PROOF";
  const tileW = 340;
  const tileH = 170;
  const cols = Math.ceil(width / tileW) + 1;
  const rows = Math.ceil(height / tileH) + 1;

  let texts = "";
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileW;
      const y = row * tileH + (col % 2 === 0 ? 0 : tileH / 2);
      texts += `<text x="${x}" y="${y}" transform="rotate(-30 ${x} ${y})">${label}</text>`;
    }
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text {
          font-family: sans-serif;
          font-size: 26px;
          font-weight: 600;
          fill: rgba(255,255,255,0.35);
          stroke: rgba(0,0,0,0.25);
          stroke-width: 0.5;
        }
      </style>
      ${texts}
    </svg>
  `;
}

export async function watermarkImage(original: Buffer): Promise<Buffer> {
  const image = sharp(original).rotate(); // .rotate() normalizes EXIF orientation
  const metadata = await image.metadata();
  const width = metadata.width ?? 1600;
  const height = metadata.height ?? 1200;

  const overlay = Buffer.from(watermarkSvg(width, height));

  return image
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 82 })
    .toBuffer();
}
