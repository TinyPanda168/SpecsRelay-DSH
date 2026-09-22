const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const productHuntRoot = path.resolve(__dirname, '..');
const repositoryRoot = path.resolve(productHuntRoot, '..');
const outputDirectory = path.join(productHuntRoot, 'assets');
const heroPath = path.join(repositoryRoot, 'assets', 'specsrelay-dsh-hero.png');
const defaultIconPath = path.resolve(repositoryRoot, '..', 'SpecsRelay', 'extension', 'icons', 'specsrelay-icon-1024.png');
const iconPath = process.env.SPECSRELAY_ICON || defaultIconPath;

for (const inputPath of [heroPath, iconPath]) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing image input: ${inputPath}`);
  }
}

fs.mkdirSync(outputDirectory, { recursive: true });

const heroData = `data:image/png;base64,${fs.readFileSync(heroPath).toString('base64')}`;
const iconData = `data:image/png;base64,${fs.readFileSync(iconPath).toString('base64')}`;
const font = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

function svgDocument(width, height, content) {
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#07131b"/>
      <stop offset="0.58" stop-color="#0c1119"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
    <radialGradient id="mintGlow" cx="0.15" cy="0.1" r="0.85">
      <stop offset="0" stop-color="#65e5ba" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#65e5ba" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="blueGlow" cx="0.95" cy="0.95" r="0.65">
      <stop offset="0" stop-color="#4278ff" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#4278ff" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
    <clipPath id="heroClip"><rect x="0" y="0" width="720" height="406" rx="24"/></clipPath>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#background)"/>
  <rect width="${width}" height="${height}" fill="url(#mintGlow)"/>
  <rect width="${width}" height="${height}" fill="url(#blueGlow)"/>
  ${content}
</svg>`;
}

function brandHeader(x = 58, y = 50) {
  return `
    <image href="${iconData}" x="${x}" y="${y}" width="54" height="54"/>
    <text x="${x + 70}" y="${y + 35}" fill="#f7fbff" font-family="${font}" font-size="26" font-weight="700">SpecsRelay for DeepSeek</text>`;
}

function footer(label = 'Open source · MIT licensed · Community maintained') {
  return `
    <line x1="58" y1="698" x2="1212" y2="698" stroke="#ffffff" stroke-opacity="0.12"/>
    <text x="58" y="730" fill="#a9b6c5" font-family="${font}" font-size="17">${label}</text>
    <text x="1212" y="730" text-anchor="end" fill="#78e3bd" font-family="${font}" font-size="17">github.com/TinyPandaGame/SpecsRelay-DSH</text>`;
}

function pill(x, y, width, label, accent = '#78e3bd') {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="42" rx="21" fill="#ffffff" fill-opacity="0.055" stroke="${accent}" stroke-opacity="0.5"/>
    <circle cx="${x + 20}" cy="${y + 21}" r="5" fill="${accent}"/>
    <text x="${x + 34}" y="${y + 27}" fill="#dce6ef" font-family="${font}" font-size="16" font-weight="600">${label}</text>`;
}

async function render(filename, width, height, content) {
  const outputPath = path.join(outputDirectory, filename);
  await sharp(Buffer.from(svgDocument(width, height, content))).png().toFile(outputPath);
  return outputPath;
}

async function buildThumbnail() {
  const icon = await sharp(iconPath).resize(216, 216, { fit: 'contain' }).png().toBuffer();
  await sharp({
    create: { width: 240, height: 240, channels: 4, background: '#0f151d' },
  }).composite([{ input: icon, left: 12, top: 12 }]).png().toFile(path.join(outputDirectory, 'thumbnail-240.png'));
}

async function buildGalleryOne() {
  const content = `
    ${brandHeader()}
    <text x="58" y="195" fill="#f7fbff" font-family="${font}" font-size="54" font-weight="760" letter-spacing="-1.5">From DeepSeek discussion</text>
    <text x="58" y="258" fill="#78e3bd" font-family="${font}" font-size="54" font-weight="760" letter-spacing="-1.5">to DSH execution.</text>
    <text x="58" y="322" fill="#b8c4d1" font-family="${font}" font-size="22">Capture the full conversation, clarify what matters,</text>
    <text x="58" y="354" fill="#b8c4d1" font-family="${font}" font-size="22">and send an actionable requirement to the right project.</text>
    ${pill(58, 405, 160, 'Open source')}
    ${pill(232, 405, 186, 'No copy &amp; paste')}
    ${pill(432, 405, 178, 'No extra API key')}
    <g transform="translate(640 178) scale(0.78)" filter="url(#shadow)" clip-path="url(#heroClip)">
      <image href="${heroData}" x="0" y="0" width="720" height="406" preserveAspectRatio="xMidYMid slice"/>
    </g>
    <rect x="640" y="178" width="562" height="317" rx="20" fill="none" stroke="#ffffff" stroke-opacity="0.2"/>
    ${footer()}`;
  return render('gallery-01-deepseek-to-dsh.png', 1270, 760, content);
}

async function buildGalleryTwo() {
  const cards = [
    ['1', 'Discuss in DeepSeek', 'Use the real website, sign-in,', 'history, and familiar conversation.'],
    ['2', 'Organize requirement', 'Capture the complete current chat', 'and extract an actionable brief.'],
    ['3', 'Clarify only if needed', 'Ask only when a missing decision', 'would materially change delivery.'],
    ['4', 'Send to DSH &amp; start', 'Choose the local project, confirm,', 'then start its Agent.'],
  ];
  const cardMarkup = cards.map((card, index) => {
    const x = 58 + index * 295;
    const accent = index === 3 ? '#78e3bd' : '#5d88ff';
    const arrow = index < 3 ? `<path d="M ${x + 252} 424 H ${x + 280}" stroke="#78e3bd" stroke-width="3" stroke-linecap="round"/><path d="M ${x + 272} 416 L ${x + 280} 424 L ${x + 272} 432" fill="none" stroke="#78e3bd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : '';
    return `
      <rect x="${x}" y="304" width="260" height="250" rx="24" fill="#ffffff" fill-opacity="0.055" stroke="#ffffff" stroke-opacity="0.16" filter="url(#softShadow)"/>
      <rect x="${x + 22}" y="328" width="44" height="44" rx="13" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-opacity="0.65"/>
      <text x="${x + 44}" y="358" text-anchor="middle" fill="${accent}" font-family="${font}" font-size="20" font-weight="800">${card[0]}</text>
      <text x="${x + 22}" y="411" fill="#f5f8fb" font-family="${font}" font-size="20" font-weight="720">${card[1]}</text>
      <text x="${x + 22}" y="455" fill="#aebbc8" font-family="${font}" font-size="16">${card[2]}</text>
      <text x="${x + 22}" y="481" fill="#aebbc8" font-family="${font}" font-size="16">${card[3]}</text>
      ${arrow}`;
  }).join('');
  const content = `
    ${brandHeader()}
    <text x="58" y="185" fill="#f7fbff" font-family="${font}" font-size="52" font-weight="760" letter-spacing="-1.2">One action. Four clear stages.</text>
    <text x="58" y="235" fill="#b8c4d1" font-family="${font}" font-size="22">The workflow stays invisible until you ask SpecsRelay to organize the current conversation.</text>
    ${cardMarkup}
    ${footer('User initiated · Clarification when material · Confirmed delivery')}`;
  return render('gallery-02-workflow.png', 1270, 760, content);
}

async function buildGalleryThree() {
  const feature = (y, title, detail) => `
    <circle cx="835" cy="${y - 7}" r="7" fill="#78e3bd"/>
    <text x="858" y="${y}" fill="#f5f8fb" font-family="${font}" font-size="21" font-weight="700">${title}</text>
    <text x="858" y="${y + 30}" fill="#aebbc8" font-family="${font}" font-size="16">${detail}</text>`;
  const content = `
    ${brandHeader()}
    <text x="58" y="172" fill="#f7fbff" font-family="${font}" font-size="48" font-weight="760" letter-spacing="-1.2">The real DeepSeek website.</text>
    <text x="58" y="228" fill="#78e3bd" font-family="${font}" font-size="48" font-weight="760" letter-spacing="-1.2">A native DSH handoff.</text>
    <g transform="translate(58 282) scale(0.99)" filter="url(#shadow)" clip-path="url(#heroClip)">
      <image href="${heroData}" x="0" y="0" width="720" height="406" preserveAspectRatio="xMidYMid slice"/>
    </g>
    <rect x="58" y="282" width="713" height="402" rx="24" fill="none" stroke="#ffffff" stroke-opacity="0.18"/>
    ${feature(320, 'Real sign-in and history', 'Not a screenshot or remote video stream.')}
    ${feature(410, 'Complete multi-turn capture', 'Runs only after the user asks to organize.')}
    ${feature(500, 'Uses your DSH model', 'No second model key inside SpecsRelay.')}
    ${feature(590, 'Project-aware delivery', 'Select the project, confirm, and start its Agent.')}
    ${footer('Sandboxed website · Local draft · Explicit handoff')}`;
  return render('gallery-03-native-experience.png', 1270, 760, content);
}

async function buildSocialCard() {
  const content = `
    ${brandHeader(56, 48)}
    <text x="56" y="182" fill="#f7fbff" font-family="${font}" font-size="50" font-weight="760" letter-spacing="-1.2">DeepSeek conversation</text>
    <text x="56" y="242" fill="#78e3bd" font-family="${font}" font-size="50" font-weight="760" letter-spacing="-1.2">→ actionable DSH work</text>
    <text x="56" y="300" fill="#b8c4d1" font-family="${font}" font-size="21">Open-source requirement handoff for local DSH projects.</text>
    <g transform="translate(598 125) scale(0.74)" filter="url(#shadow)" clip-path="url(#heroClip)">
      <image href="${heroData}" x="0" y="0" width="720" height="406" preserveAspectRatio="xMidYMid slice"/>
    </g>
    <rect x="598" y="125" width="533" height="300" rx="18" fill="none" stroke="#ffffff" stroke-opacity="0.2"/>
    ${pill(56, 356, 160, 'Open source')}
    ${pill(230, 356, 186, 'No copy &amp; paste')}
    <line x1="56" y1="558" x2="1144" y2="558" stroke="#ffffff" stroke-opacity="0.12"/>
    <text x="56" y="594" fill="#a9b6c5" font-family="${font}" font-size="17">SpecsRelay for DeepSeek</text>
    <text x="1144" y="594" text-anchor="end" fill="#78e3bd" font-family="${font}" font-size="17">github.com/TinyPandaGame/SpecsRelay-DSH</text>`;
  const outputPath = path.join(outputDirectory, 'social-card-1200x630.png');
  await sharp(Buffer.from(svgDocument(1200, 630, content))).png().toFile(outputPath);
  return outputPath;
}

async function main() {
  await buildThumbnail();
  const outputs = await Promise.all([
    buildGalleryOne(),
    buildGalleryTwo(),
    buildGalleryThree(),
    buildSocialCard(),
  ]);
  console.log(`Wrote ${outputs.length + 1} Product Hunt assets to ${outputDirectory}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
