// Writes public/img/noise.png: 256x256 film grain (random grey, semi-transparent).
// The game tiles it and slides it with a CSS transform, so there is no per-frame canvas work.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const SIZE = 256;
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

// grey + alpha, 8 bit; each row starts with filter byte 0
const raw = Buffer.alloc(SIZE * (SIZE * 2 + 1));
let seed = 1234567;
const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
for (let y = 0; y < SIZE; y++) {
  const row = y * (SIZE * 2 + 1);
  for (let x = 0; x < SIZE; x++) {
    raw[row + 1 + x * 2] = rand() < 0.5 ? 0 : 255; // dark or light speck
    raw[row + 2 + x * 2] = Math.floor(40 + rand() * 90); // how strong it is
  }
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 4; // grey + alpha
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
mkdirSync("public/img", { recursive: true });
writeFileSync("public/img/noise.png", png);
console.log("wrote public/img/noise.png", png.length, "bytes");
