/**
 * Dedicated SEO landing pages, rendered by src/pages/[tool].astro.
 *
 * Each page targets one primary keyword (in the <title>, H1, URL and first
 * paragraph) plus one secondary keyword (in an H2 and the meta description).
 * Copy must stay unique per page — near-duplicate pages get folded together
 * by Google and rank as one, which is the problem these pages exist to fix.
 */

export type OutputFormat = 'webp' | 'jpeg' | 'png' | 'avif';
export type ToolCategory = 'convert' | 'compress' | 'target';

export interface ToolPage {
  slug: string;
  category: ToolCategory;
  /** Short label for footer / related-tool links. */
  label: string;
  /** One-line blurb for tool cards. */
  blurb: string;
  /** [primary, secondary] target keywords. */
  keywords: [string, string];
  title: string;
  description: string;
  headline: string;
  highlight: string;
  sub: string;
  format: OutputFormat;
  quality: number;
  targetKB?: number;
  /** H2 for the explanatory section — carries the secondary keyword. */
  introHeading: string;
  intro: string[];
  howToHeading: string;
  steps: string[];
  benefits: { title: string; body: string }[];
  /** Optional "typical requirements" table (target-size pages). */
  specs?: { heading: string; note: string; rows: [string, string][] };
  faqs: { q: string; a: string }[];
  related: string[];
}

const EXAM_NOTE =
  'Limits differ between exams and change between years — always follow the exact size, dimensions and format in your official notification.';

export const tools: ToolPage[] = [
  /* ══════════════ FORMAT CONVERTERS ══════════════ */
  {
    slug: 'png-to-webp',
    category: 'convert',
    label: 'PNG to WebP',
    blurb: 'Smaller files, transparency kept.',
    keywords: ['png to webp', 'convert png to webp'],
    title: 'PNG to WebP Converter — Free & Unlimited | WebP Ninja',
    description:
      'Convert PNG to WebP free in your browser. Batch convert PNG to WebP with transparency preserved — no upload, no sign-up, no file limits.',
    headline: 'PNG to WebP',
    highlight: 'converter.',
    sub: 'Turn heavy PNGs into WebP files that are typically <strong class="text-[#111] font-semibold">25–80% smaller</strong> — transparency included. Runs entirely in your browser.',
    format: 'webp',
    quality: 20,
    introHeading: 'Why convert PNG to WebP?',
    intro: [
      'PNG is lossless, which makes it great for editing but heavy on the web — a single screenshot or product cut-out can easily weigh a few megabytes. WebP was built by Google specifically for websites: it supports the same alpha transparency as PNG while producing far smaller files.',
      'This PNG to WebP converter encodes with libwebp compiled to WebAssembly, directly on your device. Your files are never uploaded, so it is safe for client work, unreleased designs and private screenshots.',
    ],
    howToHeading: 'How to convert PNG to WebP',
    steps: [
      'Drop your PNG files onto the box above, click to browse, or paste a screenshot with Ctrl+V.',
      'Each image is converted to WebP instantly. Move the Quality slider if you want an even smaller file or a crisper result.',
      'Download files one by one, or click “Download all” to get every WebP in a single ZIP.',
    ],
    benefits: [
      { title: 'Transparency preserved', body: 'Logos, icons and cut-outs keep their transparent background — no white boxes.' },
      { title: 'Batch convert', body: 'Convert 5 or 500 PNGs at once. There is no per-batch cap and no daily limit.' },
      { title: 'Better Core Web Vitals', body: 'Lighter images load faster, which improves Largest Contentful Paint and page speed scores.' },
    ],
    faqs: [
      { q: 'Does converting PNG to WebP lose quality?', a: 'WebP can be lossy or lossless. At the default setting the difference is invisible for photos and screenshots; for pixel-perfect graphics, raise the Quality slider toward 100.' },
      { q: 'Will my transparent PNG stay transparent?', a: 'Yes. WebP supports a full alpha channel, so transparent and semi-transparent areas are preserved exactly as in the original PNG.' },
      { q: 'Do all browsers support WebP?', a: 'Every current version of Chrome, Edge, Firefox, Safari and Opera supports WebP, on both desktop and mobile.' },
      { q: 'Can I convert PNG to WebP for WordPress?', a: 'Yes — convert here and upload the .webp files, which WordPress has supported since version 5.8. For automatic conversion on upload, use our free WordPress plugin.' },
    ],
    related: ['jpg-to-webp', 'webp-to-png', 'png-to-avif', 'compress-png'],
  },
  {
    slug: 'jpg-to-webp',
    category: 'convert',
    label: 'JPG to WebP',
    blurb: 'Photos up to 35% lighter.',
    keywords: ['jpg to webp', 'jpeg to webp'],
    title: 'JPG to WebP Converter — Free & Unlimited | WebP Ninja',
    description:
      'Convert JPG to WebP online for free. Batch JPEG to WebP conversion in your browser — smaller photos, same look, and nothing is uploaded.',
    headline: 'JPG to WebP',
    highlight: 'in one click.',
    sub: 'Convert JPEG photos to WebP and cut their size by <strong class="text-[#111] font-semibold">25–35% or more</strong> with no visible difference. Private, unlimited and free.',
    format: 'webp',
    quality: 20,
    introHeading: 'JPEG to WebP: same photo, fewer bytes',
    intro: [
      'JPEG has been the default photo format for 30 years, but its compression is dated. WebP uses newer prediction and entropy coding, so the same photo at the same visual quality comes out noticeably smaller — which means faster product pages, blogs and galleries.',
      'Converting JPG to WebP here happens entirely inside your browser using WebAssembly. Nothing leaves your device, and there is no limit on how many photos you convert.',
    ],
    howToHeading: 'How to convert JPG to WebP',
    steps: [
      'Drag your .jpg or .jpeg files into the box above (or click to choose them).',
      'They are converted to WebP straight away. Adjust Quality to trade a little size for extra detail.',
      'Save each WebP, or use “Download all” to grab a ZIP of the whole batch.',
    ],
    benefits: [
      { title: 'Smaller photos', body: 'WebP typically beats JPEG by a quarter to a third at equal quality — more on detailed images.' },
      { title: 'No upload wait', body: 'Local processing means no upload or download round-trip, even for large camera photos.' },
      { title: 'EXIF stripped', body: 'Location and camera metadata is not carried over, which protects privacy and saves more bytes.' },
    ],
    faqs: [
      { q: 'Is WebP better than JPG?', a: 'For websites, yes: WebP is smaller at the same quality and also supports transparency and animation. JPG is still the safer choice for email attachments and old software.' },
      { q: 'What quality should I use for JPG to WebP?', a: 'The default is tuned for web use and looks identical to the original for most photos. For photography portfolios, try 60–80 on the Quality slider.' },
      { q: 'Can I convert JPG to WebP on my phone?', a: 'Yes. The converter runs in any modern mobile browser on Android or iPhone — open this page and pick photos from your gallery.' },
      { q: 'Does it keep the photo resolution?', a: 'Yes. The width and height stay exactly the same; only the encoding changes.' },
    ],
    related: ['png-to-webp', 'webp-to-jpg', 'compress-jpeg', 'compress-image-to-100kb'],
  },
  {
    slug: 'webp-to-jpg',
    category: 'convert',
    label: 'WebP to JPG',
    blurb: 'Open WebP anywhere.',
    keywords: ['webp to jpg', 'convert webp to jpg'],
    title: 'WebP to JPG Converter — Free & Private | WebP Ninja',
    description:
      'Convert WebP to JPG free, right in your browser. Turn WebP images into JPG files that open in every app, email and upload form — no upload, no limits.',
    headline: 'WebP to JPG',
    highlight: 'that opens anywhere.',
    sub: 'Downloaded a .webp that your app, printer or form won’t accept? Convert it to a universal <strong class="text-[#111] font-semibold">JPG</strong> in seconds — privately, in your browser.',
    format: 'jpeg',
    quality: 82,
    introHeading: 'Convert WebP to JPG for apps that don’t support WebP',
    intro: [
      'Many websites now serve images as WebP, so “Save image as” often gives you a .webp file. Older photo editors, office documents, print shops and many government or job-portal upload forms still only accept JPG.',
      'This tool decodes the WebP and re-encodes it as a high-quality JPG using MozJPEG. Transparent areas are filled with white, since JPG has no transparency. Everything happens on your device.',
    ],
    howToHeading: 'How to convert WebP to JPG',
    steps: [
      'Drop one or more .webp files into the box above.',
      'Each file is converted to JPG automatically. The default quality (82) keeps photos sharp at a sensible size.',
      'Download the JPGs individually or all together as a ZIP.',
    ],
    benefits: [
      { title: 'Universal compatibility', body: 'JPG opens in every OS, editor, messaging app and upload form.' },
      { title: 'MozJPEG quality', body: 'A smarter JPEG encoder than most apps use — smaller files without visible artifacts.' },
      { title: 'Batch friendly', body: 'Convert a whole folder of WebP images at once and download a single ZIP.' },
    ],
    faqs: [
      { q: 'Why are images saved as WebP instead of JPG?', a: 'Websites serve WebP because it loads faster. Your browser saves the file in whatever format the site delivered, which is increasingly WebP.' },
      { q: 'What happens to transparency when converting WebP to JPG?', a: 'JPG does not support transparency, so transparent areas become white. If you need to keep transparency, convert WebP to PNG instead.' },
      { q: 'Does converting WebP to JPG reduce quality?', a: 'JPG is lossy, but at the default quality of 82 the result is visually identical for photos. Raise the slider to 90+ if you plan to edit or print the image.' },
      { q: 'Can I convert animated WebP to JPG?', a: 'JPG is a still-image format, so only the first frame of an animated WebP is kept.' },
    ],
    related: ['webp-to-png', 'jpg-to-webp', 'compress-jpeg', 'compress-image-to-50kb'],
  },
  {
    slug: 'webp-to-png',
    category: 'convert',
    label: 'WebP to PNG',
    blurb: 'Keep transparency, open anywhere.',
    keywords: ['webp to png', 'convert webp to png'],
    title: 'WebP to PNG Converter — Keep Transparency | WebP Ninja',
    description:
      'Convert WebP to PNG online free with transparency preserved. Private, in-browser WebP to PNG conversion with no upload, no sign-up and no file limits.',
    headline: 'WebP to PNG',
    highlight: 'transparency intact.',
    sub: 'Convert .webp images to <strong class="text-[#111] font-semibold">PNG</strong> for editing, design tools and apps that can’t read WebP — with alpha transparency fully preserved.',
    format: 'png',
    quality: 90,
    introHeading: 'When to convert WebP to PNG',
    intro: [
      'PNG is the go-to format for graphics you plan to edit: logos, icons, UI elements and anything with a transparent background. Some design tools, slide software and older editors still can’t open WebP, so converting WebP to PNG is the quickest fix.',
      'Unlike converting to JPG, WebP to PNG keeps the alpha channel, so cut-outs stay cut out. The output is optimized with oxipng so the PNG isn’t larger than it needs to be.',
    ],
    howToHeading: 'How to convert WebP to PNG',
    steps: [
      'Drop your .webp files into the box above or paste an image from the clipboard.',
      'Files are converted to PNG automatically. Keep Quality high (90–100) for graphics you’ll edit further.',
      'Download each PNG, or use “Download all” for a ZIP.',
    ],
    benefits: [
      { title: 'Alpha preserved', body: 'Transparent and semi-transparent pixels come through untouched.' },
      { title: 'Editor friendly', body: 'PNG opens in every design, slide and image-editing tool.' },
      { title: 'Optimized output', body: 'oxipng squeezes out redundant bytes so PNGs stay as light as possible.' },
    ],
    faqs: [
      { q: 'Is PNG better quality than WebP?', a: 'Converting to PNG can’t add detail that isn’t in the WebP, but it won’t lose any more either at high quality settings. PNG’s advantage is compatibility and easy editing.' },
      { q: 'Why is my PNG bigger than the WebP?', a: 'WebP is a more efficient format, so the same image as PNG is usually larger. That is expected — lower the Quality slider to reduce colors and shrink the PNG.' },
      { q: 'Does WebP to PNG keep a transparent background?', a: 'Yes. PNG supports full alpha transparency, so backgrounds stay transparent.' },
      { q: 'Is my image uploaded?', a: 'No. Decoding and encoding both run in your browser with WebAssembly; the file never leaves your device.' },
    ],
    related: ['webp-to-jpg', 'png-to-webp', 'compress-png', 'compress-signature'],
  },
  {
    slug: 'png-to-avif',
    category: 'convert',
    label: 'PNG to AVIF',
    blurb: 'Next-gen format, smallest files.',
    keywords: ['png to avif', 'convert png to avif'],
    title: 'PNG to AVIF Converter — Free Online | WebP Ninja',
    description:
      'Convert PNG to AVIF free in your browser. AVIF delivers the smallest next-gen image files with transparency — private, unlimited PNG to AVIF conversion.',
    headline: 'PNG to AVIF',
    highlight: 'next-gen small.',
    sub: 'AVIF often beats WebP by another <strong class="text-[#111] font-semibold">20% or more</strong>. Convert PNGs to AVIF with transparency, entirely on your device.',
    format: 'avif',
    quality: 40,
    introHeading: 'Why convert PNG to AVIF',
    intro: [
      'AVIF is based on the AV1 video codec and is currently the most efficient widely supported image format. For photos and complex graphics it usually produces smaller files than both WebP and JPEG, and like PNG it supports transparency.',
      'The trade-off is encoding speed: AVIF takes longer to create than WebP. Because this converter runs locally, large batches simply use your own device’s CPU — nothing is queued on a server.',
    ],
    howToHeading: 'How to convert PNG to AVIF',
    steps: [
      'Drop PNG files into the box above or click to browse.',
      'Each image is encoded to AVIF. Start around 40 on the Quality slider; raise it for fine detail.',
      'Download the .avif files one at a time or as a ZIP.',
    ],
    benefits: [
      { title: 'Smallest files', body: 'AVIF regularly outperforms WebP and JPEG at the same perceived quality.' },
      { title: 'Transparency support', body: 'Alpha channels are preserved, so PNG cut-outs convert cleanly.' },
      { title: 'Broad support', body: 'Chrome, Edge, Firefox and Safari 16+ all display AVIF natively.' },
    ],
    faqs: [
      { q: 'AVIF vs WebP: which should I use?', a: 'AVIF is smaller; WebP is faster to encode and supported slightly more widely. Many sites serve AVIF with a WebP fallback using the <picture> element.' },
      { q: 'Why is AVIF conversion slower?', a: 'AV1 encoding does much more analysis per pixel than older codecs. That extra work is what produces the smaller files.' },
      { q: 'Does PNG to AVIF keep transparency?', a: 'Yes, AVIF supports a full alpha channel.' },
      { q: 'Can I use AVIF in WordPress?', a: 'WordPress 6.5 and later accept AVIF uploads, provided your server’s image library supports it.' },
    ],
    related: ['png-to-webp', 'compress-png', 'jpg-to-webp', 'webp-to-png'],
  },

  /* ══════════════ FORMAT COMPRESSORS ══════════════ */
  {
    slug: 'compress-jpeg',
    category: 'compress',
    label: 'Compress JPEG',
    blurb: 'MozJPEG, smaller JPGs.',
    keywords: ['compress jpeg', 'reduce jpg size'],
    title: 'Compress JPEG Online — Reduce JPG Size Free | WebP Ninja',
    description:
      'Compress JPEG images online for free. Reduce JPG file size by up to 80% with MozJPEG — in your browser, with no upload and no limit on files.',
    headline: 'Compress JPEG',
    highlight: 'without the blur.',
    sub: 'Reduce JPG file size by up to <strong class="text-[#111] font-semibold">80%</strong> using MozJPEG — the same encoder big image CDNs use. Output stays JPG.',
    format: 'jpeg',
    quality: 70,
    introHeading: 'Reduce JPG size and keep it a JPG',
    intro: [
      'Cameras and phones save JPEGs at very high quality settings, which wastes space on detail your eyes can’t see. Re-encoding with MozJPEG — a modern, smarter JPEG encoder — removes that waste and keeps the file fully compatible, since it is still a normal .jpg.',
      'That makes it the right choice when a platform only accepts JPG: email attachments, marketplaces, CMS uploads or job applications. Everything is processed locally in your browser.',
    ],
    howToHeading: 'How to compress a JPEG',
    steps: [
      'Drop your JPG/JPEG photos into the box above.',
      'They are compressed straight away at quality 70. Lower it for smaller files, or set “Max size” to hit an exact limit.',
      'Download individually or as a ZIP.',
    ],
    benefits: [
      { title: 'Stays a JPG', body: 'Output is standard JPEG that works in every app and upload form.' },
      { title: 'Exact size limits', body: 'Need under 100 KB? Pick a Max size and quality is chosen automatically.' },
      { title: 'Private by design', body: 'Photos are compressed on your device — ideal for personal and ID images.' },
    ],
    faqs: [
      { q: 'How much can I compress a JPEG?', a: 'Most phone and camera photos shrink 50–80% at quality 60–75 with no obvious difference on screen.' },
      { q: 'Does compressing a JPEG reduce resolution?', a: 'Not at a normal quality setting — the pixel dimensions stay the same. Only Max size mode resizes, and only large images that couldn’t otherwise fit the limit at a decent quality.' },
      { q: 'What is MozJPEG?', a: 'MozJPEG is an open-source JPEG encoder from Mozilla that produces smaller files than standard libjpeg at the same visual quality, while staying 100% compatible.' },
      { q: 'Should I convert to WebP instead?', a: 'For your own website, WebP is usually smaller still. When the destination requires JPG, compressing the JPEG is the right choice.' },
    ],
    related: ['compress-png', 'jpg-to-webp', 'compress-image-to-100kb', 'compress-image-to-200kb'],
  },
  {
    slug: 'compress-png',
    category: 'compress',
    label: 'Compress PNG',
    blurb: 'Smart color reduction + oxipng.',
    keywords: ['compress png', 'png compressor'],
    title: 'Compress PNG Online — Shrink PNG Files Free | WebP Ninja',
    description:
      'Free online PNG compressor. Shrink PNG files by up to 80% with smart color quantization and oxipng, preserving transparency — no upload, no limits.',
    headline: 'Compress PNG',
    highlight: 'keep transparency.',
    sub: 'Shrink PNGs by up to <strong class="text-[#111] font-semibold">80%</strong> with smart color quantization and oxipng. Output stays PNG, transparency and all.',
    format: 'png',
    quality: 70,
    introHeading: 'A PNG compressor that stays PNG',
    intro: [
      'Most PNGs store millions of possible colors even when the image uses far fewer. This PNG compressor analyzes the image, builds an optimized palette, applies subtle dithering so gradients stay smooth, and then runs oxipng to squeeze out every redundant byte.',
      'The result is a standard PNG with the same dimensions and transparency — often a fraction of the original size. Screenshots, UI mockups, logos and illustrations compress especially well.',
    ],
    howToHeading: 'How to compress PNG files',
    steps: [
      'Drop PNG files into the box above, or press Ctrl+V to paste a screenshot.',
      'Compression starts automatically. A lower Quality means fewer colors and a smaller file.',
      'Download each PNG or the whole batch as a ZIP.',
    ],
    benefits: [
      { title: 'Lossy + lossless', body: 'Palette reduction (like pngquant) followed by lossless oxipng optimization.' },
      { title: 'Transparency safe', body: 'The alpha channel is kept, so logos and icons stay clean on any background.' },
      { title: 'Never bigger', body: 'If a PNG can’t be improved, you get the original back instead of a larger file.' },
    ],
    faqs: [
      { q: 'Is PNG compression lossless?', a: 'The oxipng step is lossless. The color-reduction step is lossy but visually subtle; set Quality to 100 for the gentlest result.' },
      { q: 'Why did my PNG barely shrink?', a: 'Photos saved as PNG have too many unique colors to compress well. Convert them to WebP or JPEG instead for much bigger savings.' },
      { q: 'Is this like TinyPNG?', a: 'It uses a similar technique (color quantization), but runs in your browser with no 20-image cap and no upload.' },
      { q: 'Can I compress large PNGs?', a: 'Yes. Very large PNGs (over ~40 megapixels) can optionally be sent to our server for stronger compression — only with your explicit confirmation.' },
    ],
    related: ['png-to-webp', 'compress-jpeg', 'png-to-avif', 'compress-signature'],
  },
  {
    slug: 'compress-gif',
    category: 'compress',
    label: 'Compress GIF',
    blurb: 'Shrink static GIFs to WebP/PNG.',
    keywords: ['compress gif', 'reduce gif size'],
    title: 'Compress GIF Online — Reduce GIF Size Free | WebP Ninja',
    description:
      'Compress GIF images free in your browser. Reduce GIF size by converting static GIFs to much smaller WebP or PNG files — private, no upload, no limits.',
    headline: 'Compress GIF',
    highlight: 'into something lighter.',
    sub: 'GIF is a 1987 format. Re-encode static GIFs as <strong class="text-[#111] font-semibold">WebP or PNG</strong> and they usually get far smaller — with the same look.',
    format: 'webp',
    quality: 60,
    introHeading: 'The best way to reduce GIF size',
    intro: [
      'GIF’s compression is decades old and limited to 256 colors, so static GIF images — diagrams, logos, badges, old web graphics — are almost always larger than they need to be. Re-encoding them as WebP (smallest) or PNG (most compatible) reduces GIF size dramatically without changing how they look.',
      'Note: this tool works on still images. For an animated GIF, only the first frame is kept, so use it for static GIFs.',
    ],
    howToHeading: 'How to compress a GIF',
    steps: [
      'Drop your .gif files into the box above.',
      'They are converted to WebP by default. Switch Format to PNG if the destination doesn’t accept WebP.',
      'Download the smaller files individually or as a ZIP.',
    ],
    benefits: [
      { title: 'Much smaller', body: 'Static GIFs routinely shrink by half or more when re-encoded as WebP.' },
      { title: 'More colors', body: 'WebP and PNG aren’t limited to 256 colors, so gradients look smoother.' },
      { title: 'Transparency kept', body: 'GIF transparency carries over to WebP and PNG.' },
    ],
    faqs: [
      { q: 'Does this compress animated GIFs?', a: 'No — only the first frame of an animated GIF is kept. This tool is for static GIF images.' },
      { q: 'Can the output stay a .gif?', a: 'Not currently. GIF is inefficient enough that WebP or PNG is almost always the better way to cut its size.' },
      { q: 'WebP or PNG for GIF compression?', a: 'WebP gives the smallest files and works in all modern browsers. Choose PNG when a platform or app doesn’t accept WebP.' },
      { q: 'Is my GIF uploaded?', a: 'No. Everything runs in your browser; the file never leaves your device.' },
    ],
    related: ['compress-png', 'png-to-webp', 'webp-to-png', 'compress-jpeg'],
  },

  /* ══════════════ TARGET FILE SIZE (India exam / govt forms) ══════════════ */
  {
    slug: 'compress-image-to-20kb',
    category: 'target',
    label: 'Compress to 20KB',
    blurb: 'For photo & signature uploads.',
    keywords: ['compress image to 20kb', 'reduce photo size to 20kb'],
    title: 'Compress Image to 20KB Online — Free | WebP Ninja',
    description:
      'Compress image to 20KB online free. Reduce photo size to 20KB in JPG for SSC, UPSC, bank and govt form uploads — automatic, private, no sign-up.',
    headline: 'Compress image',
    highlight: 'to 20KB.',
    sub: 'Pick a photo and get a <strong class="text-[#111] font-semibold">JPG under 20 KB</strong> automatically — ready for exam and government form uploads. Nothing is uploaded.',
    format: 'jpeg',
    quality: 70,
    targetKB: 20,
    introHeading: 'Reduce photo size to 20KB — automatically',
    intro: [
      '20 KB is one of the most common limits on Indian application portals — especially for signatures and small photos on recruitment, admission and scholarship forms. A phone photo is usually 2–5 MB, which is 100–250 times too big.',
      'Instead of guessing a quality setting, this tool searches for the highest quality that fits under 20 KB. Large photos are also scaled down to a resolution that suits the limit — a smaller, clean image beats a large, blocky one — and you see the final size and resolution.',
    ],
    howToHeading: 'How to compress an image to 20KB',
    steps: [
      'Click the box above and choose your photo or signature (JPG, PNG, HEIC-converted, WebP).',
      'It is automatically compressed to a JPG under 20 KB. The card shows the final size and dimensions.',
      'Download and upload it to your form. Need 10 KB or 50 KB instead? Change “Max size”.',
    ],
    benefits: [
      { title: 'Always under the limit', body: 'We target 20,000 bytes, so the file passes whether the portal counts 1 KB as 1000 or 1024 bytes.' },
      { title: 'Best quality that fits', body: 'The highest quality under the limit is chosen, not just “as small as possible”.' },
      { title: 'Private', body: 'ID photos and signatures stay on your phone or computer — nothing is uploaded.' },
    ],
    specs: {
      heading: 'Common 20KB upload requirements',
      note: EXAM_NOTE,
      rows: [
        ['Signature (many recruitment forms)', 'JPG, about 10–20 KB'],
        ['Photograph (smaller portals)', 'JPG, about 20–50 KB'],
        ['Thumb impression', 'JPG, about 20–50 KB'],
      ],
    },
    faqs: [
      { q: 'How do I reduce photo size to 20KB without losing quality?', a: 'Some quality loss is unavoidable at 20 KB, but this tool keeps as much as possible by choosing the highest quality that fits and only shrinking dimensions when needed. Start from a well-lit, tightly cropped photo for the best result.' },
      { q: 'Will the image be exactly 20KB?', a: 'It will be just under 20 KB. Forms set a maximum, so slightly under is what you want.' },
      { q: 'My form needs a minimum of 10KB — is that OK?', a: 'Yes. Because we pick the highest quality that fits, results normally land close to the 20 KB limit, well above a 10 KB minimum.' },
      { q: 'Can I do this on my phone?', a: 'Yes. Open this page in Chrome or Safari on your phone, choose the photo from your gallery and download the result.' },
    ],
    related: ['compress-signature', 'compress-image-to-50kb', 'compress-passport-photo', 'compress-image-to-100kb'],
  },
  {
    slug: 'compress-image-to-50kb',
    category: 'target',
    label: 'Compress to 50KB',
    blurb: 'The classic exam-photo limit.',
    keywords: ['compress image to 50kb', 'photo size 50kb'],
    title: 'Compress Image to 50KB Online — Free | WebP Ninja',
    description:
      'Compress image to 50KB free. Get your photo size under 50KB in JPG for SSC, IBPS, railway and state exam forms — automatic, private and instant.',
    headline: 'Compress image',
    highlight: 'to 50KB.',
    sub: 'Get any photo to a <strong class="text-[#111] font-semibold">JPG under 50 KB</strong> in one step — the most common size limit for exam application photos.',
    format: 'jpeg',
    quality: 70,
    targetKB: 50,
    introHeading: 'Photo size under 50KB for exam forms',
    intro: [
      'A 20–50 KB JPG is the standard photograph requirement on many recruitment and admission portals. Phone cameras produce files dozens of times larger, and generic compressors make you guess a quality setting and try again and again.',
      'Here you just choose the photo: the tool finds the best quality that fits under 50 KB, balances resolution against quality, and shows you the final file size and pixel dimensions before you download.',
    ],
    howToHeading: 'How to compress a photo to 50KB',
    steps: [
      'Choose or drop your photo in the box above.',
      'It is converted to a JPG under 50 KB automatically.',
      'Check the size and dimensions on the result card, then download and upload it.',
    ],
    benefits: [
      { title: 'One step', body: 'No quality slider to fiddle with — the target size does the work.' },
      { title: 'Clear faces', body: 'Resolution and quality are balanced so faces stay clean instead of blocky.' },
      { title: 'Batch ready', body: 'Compress your photo, signature and documents together; download all as a ZIP.' },
    ],
    specs: {
      heading: 'Where the 50KB limit applies',
      note: EXAM_NOTE,
      rows: [
        ['Photograph (SSC, bank, railway-style forms)', 'JPG, about 20–50 KB'],
        ['Signature', 'Usually smaller: about 10–20 KB'],
        ['Scanned certificates', 'Often 50–300 KB, sometimes PDF'],
      ],
    },
    faqs: [
      { q: 'How can I reduce a photo from 2MB to 50KB?', a: 'Upload it here — the tool scales the photo to a resolution that suits 50 KB and then picks the highest JPEG quality that fits.' },
      { q: 'My form says 20KB to 50KB. Will this work?', a: 'Yes. Results land just under 50 KB, which is inside a 20–50 KB range.' },
      { q: 'Does it change my photo’s dimensions?', a: 'A large phone photo is scaled down to fit 50 KB at good quality; small images keep their size. The result card shows the final width × height so you can check it against your form’s pixel requirements.' },
      { q: 'Is it safe for ID photos?', a: 'Yes. The photo is processed on your own device and is never uploaded to any server.' },
    ],
    related: ['compress-passport-photo', 'compress-image-to-20kb', 'compress-image-to-100kb', 'compress-signature'],
  },
  {
    slug: 'compress-image-to-100kb',
    category: 'target',
    label: 'Compress to 100KB',
    blurb: 'Photos & documents for portals.',
    keywords: ['compress image to 100kb', 'reduce image size to 100kb'],
    title: 'Compress Image to 100KB Online — Free | WebP Ninja',
    description:
      'Compress image to 100KB online free. Reduce image size to 100KB in JPG for forms, portals and email — automatic quality, private, no sign-up.',
    headline: 'Compress image',
    highlight: 'to 100KB.',
    sub: 'Turn large photos and scanned documents into a <strong class="text-[#111] font-semibold">JPG under 100 KB</strong> — clear enough to read, small enough to upload.',
    format: 'jpeg',
    quality: 75,
    targetKB: 100,
    introHeading: 'Reduce image size to 100KB',
    intro: [
      '100 KB is a common cap for scanned documents, ID proofs, photos on university and scholarship portals, and profile pictures on job sites. It is enough room for a clear, readable image — if the compression is done well.',
      'This tool keeps text and faces sharp by choosing the highest JPEG quality that fits under 100 KB, and only downsizing as much as the limit requires.',
    ],
    howToHeading: 'How to compress an image to 100KB',
    steps: [
      'Drop your photo or scanned document into the box above.',
      'It is compressed to a JPG under 100 KB automatically.',
      'Download it — or change “Max size” if your form needs a different limit.',
    ],
    benefits: [
      { title: 'Readable documents', body: 'At 100 KB, scanned text and certificates stay legible.' },
      { title: 'Size-accurate', body: 'Guaranteed under 100,000 bytes, whichever way the portal counts KB.' },
      { title: 'Unlimited', body: 'Compress as many files as you need; no daily cap or watermark.' },
    ],
    specs: {
      heading: 'Typical 100KB upload uses',
      note: EXAM_NOTE,
      rows: [
        ['Scanned ID proof / certificate (image)', 'JPG, up to about 100–300 KB'],
        ['Photo on admission / scholarship portals', 'JPG, up to about 100 KB'],
        ['Profile photo on job sites', 'Often up to 100 KB–2 MB'],
      ],
    },
    faqs: [
      { q: 'How do I reduce image size to 100KB?', a: 'Drop the image here. The highest quality that fits under 100 KB is found automatically; very large images are also scaled down to a sensible resolution.' },
      { q: 'Will text in my scanned document stay readable?', a: 'At 100 KB, yes for a normal A4 page. Crop away empty margins before compressing for the sharpest text.' },
      { q: 'Can I compress a PDF to 100KB?', a: 'This tool works on images (JPG, PNG, WebP). Scan or export your document as an image first.' },
      { q: 'Can I keep the PNG format?', a: 'Yes — switch Format to PNG after uploading. JPG is usually better for photos and gets closer to the limit with higher quality.' },
    ],
    related: ['compress-image-to-200kb', 'compress-image-to-50kb', 'compress-jpeg', 'compress-passport-photo'],
  },
  {
    slug: 'compress-image-to-200kb',
    category: 'target',
    label: 'Compress to 200KB',
    blurb: 'High-quality, still upload-safe.',
    keywords: ['compress image to 200kb', 'reduce jpg to 200kb'],
    title: 'Compress Image to 200KB Online — Free | WebP Ninja',
    description:
      'Compress image to 200KB free in your browser. Reduce JPG to 200KB with the best possible quality for forms, visas and portals — private and instant.',
    headline: 'Compress image',
    highlight: 'to 200KB.',
    sub: 'Get a high-quality <strong class="text-[#111] font-semibold">JPG under 200 KB</strong> — ideal for documents, visa photos and portals with a generous limit.',
    format: 'jpeg',
    quality: 80,
    targetKB: 200,
    introHeading: 'Reduce JPG to 200KB with maximum quality',
    intro: [
      'A 200 KB limit leaves room for a genuinely good-looking image, but a raw phone photo is still 10–25 times bigger. Compressing with a fixed quality either overshoots the limit or throws away quality you could have kept.',
      'This tool finds the highest quality that fits under 200 KB, so your photo or document looks as good as the limit allows.',
    ],
    howToHeading: 'How to compress an image to 200KB',
    steps: [
      'Choose your image in the box above.',
      'It is compressed to a JPG under 200 KB automatically.',
      'Download it, or select several files and use “Download all”.',
    ],
    benefits: [
      { title: 'Quality first', body: 'Scans and smaller images often fit under 200 KB without any resizing.' },
      { title: 'Any input', body: 'Works with JPG, PNG, WebP, BMP and GIF input.' },
      { title: 'No upload', body: 'Processed on your device — safe for passports, visas and certificates.' },
    ],
    specs: {
      heading: 'Where a 200KB limit is common',
      note: EXAM_NOTE,
      rows: [
        ['Scanned documents & certificates', 'JPG, up to about 200–500 KB'],
        ['Photos on some visa / admission portals', 'JPG, up to about 200 KB'],
        ['Email & chat attachments', 'Smaller files send and open faster'],
      ],
    },
    faqs: [
      { q: 'How do I reduce a JPG to 200KB?', a: 'Drop it here. The best quality under 200 KB is picked automatically; you don’t need to adjust anything.' },
      { q: 'Will my image be resized?', a: 'Scans and small images usually keep their size. A 12-megapixel phone photo is scaled down (typically to around 1200–1600 px wide) because it can’t fit 200 KB at full size — the card shows the final dimensions.' },
      { q: 'Can I compress multiple images to 200KB at once?', a: 'Yes. Select or drop several files; each one is compressed to under 200 KB and you can download them all as a ZIP.' },
      { q: 'Is there a watermark?', a: 'No watermark, no sign-up and no limits.' },
    ],
    related: ['compress-image-to-100kb', 'compress-jpeg', 'compress-image-to-50kb', 'jpg-to-webp'],
  },
  {
    slug: 'compress-passport-photo',
    category: 'target',
    label: 'Passport Photo Compressor',
    blurb: 'Passport-size photo under 50KB.',
    keywords: ['passport size photo compressor', 'passport photo 50kb'],
    title: 'Passport Size Photo Compressor — Under 50KB | WebP Ninja',
    description:
      'Free passport size photo compressor. Resize your passport photo to 50KB (or 20KB, 100KB) in JPG for exam, visa and govt applications — private, instant.',
    headline: 'Passport size photo',
    highlight: 'compressor.',
    sub: 'Compress your passport-size photo to a <strong class="text-[#111] font-semibold">JPG under 50 KB</strong> for exam and government applications. Change the limit in one tap.',
    format: 'jpeg',
    quality: 75,
    targetKB: 50,
    introHeading: 'Passport photo under 50KB, face still sharp',
    intro: [
      'Application forms for recruitment exams, admissions, scholarships and many government services ask for a recent passport-size photograph as a small JPG — very often between 20 KB and 50 KB. Getting there with a phone photo usually means several apps and a lot of trial and error.',
      'This passport photo compressor does it in one step: the highest quality that fits your limit, the face kept as sharp as possible, and the final size and pixel dimensions shown so you can check them against the notification.',
    ],
    howToHeading: 'How to compress a passport size photo',
    steps: [
      'Crop your photo to passport proportions first (your phone’s editor works) with a plain, light background.',
      'Drop it in the box above — it becomes a JPG under 50 KB. Pick 20 KB or 100 KB in “Max size” if your form differs.',
      'Download and upload. The result card shows the exact size and dimensions.',
    ],
    benefits: [
      { title: 'Made for forms', body: 'JPG output under a strict byte limit — exactly what portals validate.' },
      { title: 'Face-first quality', body: 'Resolution and quality are balanced so facial detail stays clear, not blocky.' },
      { title: 'Stays on your phone', body: 'Your photo is never uploaded — important for identity documents.' },
    ],
    specs: {
      heading: 'Typical passport-size photo requirements',
      note: EXAM_NOTE,
      rows: [
        ['File format', 'JPG / JPEG'],
        ['File size (many exam forms)', 'About 20–50 KB'],
        ['Background', 'Plain white or light colored'],
        ['Framing', 'Recent photo, face clearly visible, ~70–80% of frame'],
      ],
    },
    faqs: [
      { q: 'How do I compress a passport size photo to 50KB?', a: 'Drop the photo in the box above. It is automatically converted to a JPG under 50 KB with the best quality that fits.' },
      { q: 'Does this crop or change the background?', a: 'No — it only compresses (and resizes if needed). Crop and choose a plain background before compressing.' },
      { q: 'My form asks for specific pixel dimensions. What should I do?', a: 'Crop to the required aspect ratio first. The result card shows the final width × height; if the form needs exact pixels, resize to those dimensions and then compress.' },
      { q: 'Can I compress the photo and signature together?', a: 'Yes. Drop both, then download them together. For signatures with a 10–20 KB limit, use the signature compressor.' },
    ],
    related: ['compress-signature', 'compress-image-to-50kb', 'compress-image-to-20kb', 'compress-image-to-100kb'],
  },
  {
    slug: 'compress-signature',
    category: 'target',
    label: 'Signature Compressor',
    blurb: 'Signature under 20KB, strokes crisp.',
    keywords: ['signature resize 20kb', 'compress signature online'],
    title: 'Compress Signature to 20KB Online — Free | WebP Ninja',
    description:
      'Compress signature online free. Signature resize to 20KB (or 10KB) in JPG for SSC, UPSC, bank and govt forms — crisp strokes, white background, no upload.',
    headline: 'Signature resize',
    highlight: 'to 20KB.',
    sub: 'Turn a photo or scan of your signature into a <strong class="text-[#111] font-semibold">JPG under 20 KB</strong> with crisp strokes — ready for any application form.',
    format: 'jpeg',
    quality: 80,
    targetKB: 20,
    introHeading: 'Compress a signature online without blurry strokes',
    intro: [
      'Most recruitment and government application forms want a scanned signature as a JPG between roughly 10 KB and 20 KB. Signatures are thin dark lines on a light background, and careless compression smears those lines into grey blocks.',
      'This signature compressor downsizes in multiple smooth steps to keep strokes clean, flattens transparent backgrounds to white (JPG can’t store transparency), and picks the best quality that fits under 20 KB.',
    ],
    howToHeading: 'How to resize a signature to 20KB',
    steps: [
      'Sign in black or dark-blue ink on white paper, photograph or scan it, and crop tightly around the signature.',
      'Drop the image in the box above — it becomes a JPG under 20 KB. Choose 10 KB in “Max size” if your form requires it.',
      'Download and upload. Check the size and dimensions on the result card.',
    ],
    benefits: [
      { title: 'Crisp strokes', body: 'Multi-step downscaling avoids the jagged, broken lines of one-step resizing.' },
      { title: 'White background', body: 'Transparent PNG signatures are flattened onto white, never black.' },
      { title: '10 KB or 20 KB', body: 'Switch limits instantly for forms with stricter requirements.' },
    ],
    specs: {
      heading: 'Typical signature upload requirements',
      note: EXAM_NOTE,
      rows: [
        ['File format', 'JPG / JPEG'],
        ['File size (many exam forms)', 'About 10–20 KB'],
        ['Ink & paper', 'Black or dark-blue ink on plain white paper'],
        ['Cropping', 'Tight around the signature, no extra margins'],
      ],
    },
    faqs: [
      { q: 'How do I resize my signature to 20KB?', a: 'Crop your signature photo, drop it here, and it’s automatically converted to a JPG under 20 KB.' },
      { q: 'How do I compress a signature to 10KB?', a: 'After adding the file, change “Max size” to 10 KB. Crop tightly first — less empty paper means sharper strokes at 10 KB.' },
      { q: 'Why is my signature background black?', a: 'That happens when a transparent PNG is saved as JPG by tools that don’t handle transparency. This tool fills transparent areas with white automatically.' },
      { q: 'Can I compress my photo and signature together?', a: 'Yes — but they usually need different limits. Use the passport photo compressor for the photo (20–50 KB) and this page for the signature.' },
    ],
    related: ['compress-passport-photo', 'compress-image-to-20kb', 'compress-image-to-50kb', 'webp-to-jpg'],
  },
];

export const toolsBySlug = new Map(tools.map((t) => [t.slug, t]));

export const toolGroups: { category: ToolCategory; label: string }[] = [
  { category: 'convert', label: 'Convert' },
  { category: 'compress', label: 'Compress' },
  { category: 'target', label: 'Exact file size (forms)' },
];
