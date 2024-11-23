import sharp from "sharp";

export const extensions = {
  avif: 0,
  webp: 1,
};

const mimeTypes = {
  avif: "image/avif",
  webp: "image/webp",
};

export async function imageProxy(url, extension = extensions.webp) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  const config = {
    avif: { quality: 90 },
    webp: { quality: 80 },
  };

  const format = extension === extensions.avif ? 'avif' : 'webp';
  const image = sharp(buffer)[format](config[format]);
  
  return {
    buf: await image.toBuffer(),
    mt: mimeTypes[format],
  };
}