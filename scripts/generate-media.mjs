import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const mediaDir = path.join(root, "public", "media");
const imagePath = path.join(mediaDir, "sea-view-demo.jpg");
const pdfPath = path.join(mediaDir, "sea-view-brochure-demo.pdf");
const videoPath = path.join(mediaDir, "sea-view-film-demo.mp4");

fs.mkdirSync(mediaDir, { recursive: true });
if (!fs.existsSync(imagePath)) {
  throw new Error(`Missing ${imagePath}. The demo visual must exist before generating media.`);
}

const navy = rgb(0.043, 0.078, 0.133);
const ivory = rgb(0.98, 0.973, 0.953);
const gold = rgb(0.722, 0.557, 0.243);
const red = rgb(0.792, 0.176, 0.176);
const ink = rgb(0.09, 0.13, 0.19);
const muted = rgb(0.39, 0.44, 0.5);

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawParagraph(page, text, options) {
  const { x, y, width, size = 11, font, color = ink, lineHeight = 16 } = options;
  let cursor = y;
  for (const line of wrapText(text, font, size, width)) {
    page.drawText(line, { x, y: cursor, size, font, color });
    cursor -= lineHeight;
  }
  return cursor;
}

function drawDemoBanner(page, fontBold, pageWidth, y) {
  page.drawRectangle({ x: 0, y, width: pageWidth, height: 28, color: red });
  page.drawText("DEMO MATERIAL  /  NOT A BOOKING OR PAYMENT DOCUMENT", {
    x: 24,
    y: y + 9,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
}

async function makeBrochure() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Sea View Skydiving — Demo Brochure");
  pdf.setAuthor("Greedy Adventures assignment prototype");
  pdf.setSubject("Demo material generated from captured public website facts");
  pdf.setProducer("pdf-lib / scripts/generate-media.mjs");

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const imageBytes = fs.readFileSync(imagePath);
  const image = await pdf.embedJpg(imageBytes);

  const cover = pdf.addPage([595.28, 841.89]);
  const width = cover.getWidth();
  const height = cover.getHeight();
  cover.drawRectangle({ x: 0, y: 0, width, height, color: navy });
  cover.drawImage(image, { x: 0, y: 405, width, height: 360 });
  cover.drawRectangle({ x: 0, y: 405, width, height: 360, color: navy, opacity: 0.28 });
  cover.drawRectangle({ x: 0, y: 0, width, height: 420, color: navy });

  drawDemoBanner(cover, fontBold, width, height - 28);
  cover.drawText("GREEDY ADVENTURES", { x: 42, y: 720, size: 11, font: fontBold, color: gold });
  cover.drawText("SEA VIEW", { x: 40, y: 640, size: 48, font: fontBold, color: ivory });
  cover.drawText("SKYDIVING", { x: 40, y: 588, size: 48, font: fontBold, color: ivory });
  cover.drawText("Pattaya Dropzone  ·  Gulf of Thailand", {
    x: 42, y: 548, size: 13, font, color: gold,
  });
  cover.drawText("DEMO MATERIAL", { x: 42, y: 330, size: 18, font: fontBold, color: red });
  drawParagraph(cover,
    "A two-page sample brochure generated for the chatbot assignment. Package facts are copied from the public Greedy Adventures page captured on 2026-11-04. Exact content is not important: this file exists to demonstrate correct PDF delivery.",
    { x: 42, y: 300, width: width - 84, size: 11, font, color: ivory, lineHeight: 17 });
  cover.drawText("13,000 ft exit   ·   60 seconds freefall   ·   about 3h at the dropzone", {
    x: 42, y: 72, size: 10, font, color: gold,
  });

  const details = pdf.addPage([595.28, 841.89]);
  const dWidth = details.getWidth();
  const dHeight = details.getHeight();
  details.drawRectangle({ x: 0, y: 0, width: dWidth, height: dHeight, color: ivory });
  drawDemoBanner(details, fontBold, dWidth, dHeight - 28);
  details.drawText("PACKAGE SNAPSHOT", { x: 42, y: 775, size: 20, font: fontBold, color: ink });
  details.drawText("Prices shown on the public experience page, per person.", {
    x: 42, y: 751, size: 10, font, color: muted,
  });

  let y = 710;
  const packages = [
    ["ECO  ·  THB 9,500", "The jump, nothing else."],
    ["DELUXE  ·  THB 12,500", "Video and photos included. The FAQ describes handy cam video."],
    ["VIP  ·  THB 14,000", "Personal cameraman and edited film; full media coverage."],
  ];
  for (const [title, body] of packages) {
    details.drawRectangle({ x: 42, y: y - 74, width: dWidth - 84, height: 68, color: rgb(1, 1, 1), borderColor: gold, borderWidth: 1 });
    details.drawText(title, { x: 58, y: y - 24, size: 13, font: fontBold, color: ink });
    details.drawText(body, { x: 58, y: y - 48, size: 10, font, color: muted });
    y -= 84;
  }

  details.drawText("SHARED INCLUSIONS", { x: 42, y: y - 8, size: 14, font: fontBold, color: ink });
  let listY = y - 34;
  for (const item of [
    "Tandem skydive experience in Pattaya, Thailand",
    "Safety briefing and tandem instructor support",
    "Aircraft ascent and ocean-view jump experience",
    "Certificate of completion",
  ]) {
    details.drawText(`-  ${item}`, { x: 46, y: listY, size: 10.5, font, color: ink });
    listY -= 18;
  }

  details.drawText("SOURCE", { x: 42, y: 170, size: 12, font: fontBold, color: ink });
  details.drawText("https://www.greedyadventures.com/experiences/sea-view-skydiving", {
    x: 42, y: 150, size: 9, font, color: muted,
  });
  details.drawText("https://www.greedyadventures.com/escapes/thailand/pattaya", {
    x: 42, y: 136, size: 9, font, color: muted,
  });
  details.drawRectangle({ x: 0, y: 0, width: dWidth, height: 42, color: red });
  details.drawText("DEMO MATERIAL  ·  Sample only  ·  No real booking, payment or availability is offered.", {
    x: 24, y: 15, size: 9, font: fontBold, color: rgb(1, 1, 1),
  });

  fs.writeFileSync(pdfPath, await pdf.save());
  console.log(`Wrote ${path.relative(root, pdfPath)} (${pdf.getPageCount()} pages)`);
}

function makeVideo() {
  const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
  const fontFile = process.env.VIDEO_FONT_FILE || "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
  const check = spawnSync(ffmpeg, ["-version"], { stdio: "ignore" });
  if (check.error || check.status !== 0) {
    console.warn("Skipping MP4 generation: ffmpeg not found. Set FFMPEG_PATH to regenerate.");
    return;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "greedy-demo-video-"));
  const titleFile = path.join(tmp, "title.txt");
  const subtitleFile = path.join(tmp, "subtitle.txt");
  fs.writeFileSync(titleFile, "DEMO MATERIAL  |  SEA VIEW SKYDIVING");
  fs.writeFileSync(subtitleFile, "Generated sample film for the chatbot prototype");
  const hasFont = fs.existsSync(fontFile);

  const filters = [
    "scale=1600:900",
    "zoompan=z='1.0+0.10*on/143':d=144:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=24",
    "drawbox=x=0:y=0:w=iw:h=ih:color=0x0B1422@0.16:t=fill",
  ];
  if (hasFont) {
    filters.push(
      `drawtext=fontfile=${fontFile}:textfile=${titleFile}:fontcolor=white:fontsize=30:box=1:boxcolor=0x0B1422@0.72:boxborderw=16:x=42:y=42`,
      `drawtext=fontfile=${fontFile}:textfile=${subtitleFile}:fontcolor=white:fontsize=21:box=1:boxcolor=0x0B1422@0.65:boxborderw=12:x=42:y=h-72`,
    );
  }
  const args = [
    "-y", "-hide_banner", "-loglevel", "error",
    "-loop", "1", "-framerate", "24", "-i", imagePath,
    "-vf", filters.join(","),
    "-frames:v", "144", "-an",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "25",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    videoPath,
  ];
  const result = spawnSync(ffmpeg, args, { stdio: "inherit" });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (result.status !== 0) throw new Error(`ffmpeg failed with status ${result.status}`);
  console.log(`Wrote ${path.relative(root, videoPath)} (${fs.statSync(videoPath).size} bytes)`);
}

await makeBrochure();
makeVideo();
