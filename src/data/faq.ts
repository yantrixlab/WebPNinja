export const faqs = [
  {
    q: "Are my images uploaded to a server?",
    a: "Never. All compression happens inside your browser using the Canvas and WebAssembly APIs. Your images are processed entirely on your device and are never sent anywhere.",
  },
  {
    q: "How many images can I compress at once?",
    a: "There is no limit. Drop as many files as you like — 5, 50, or 500. Because processing is client-side, we don't have server costs to pass on to you.",
  },
  {
    q: "What image formats are supported?",
    a: "You can compress PNG, JPEG, WebP, GIF, and BMP files. Output formats are JPEG, PNG, WebP, and AVIF — you choose based on your needs.",
  },
  {
    q: "Why should I use WebP instead of PNG or JPEG?",
    a: "WebP is a modern format designed for the web. It delivers smaller file sizes at the same visual quality — typically 25–35% smaller than JPEG and 26% smaller than PNG — while still supporting transparency, unlike JPEG. Every modern browser (Chrome, Firefox, Safari, Edge) supports it fully.",
  },
  {
    q: "Does compression reduce image quality?",
    a: "It depends on the quality setting. With WebP at our default of 60, the difference is hard to spot for most photos — and screenshots or graphics look identical even far lower. Use the quality slider to find the right balance between file size and fidelity for your use case.",
  },
  {
    q: "Can I paste a screenshot directly?",
    a: "Yes! Press Ctrl+V (or Cmd+V on Mac) anywhere on this page and any image in your clipboard will be compressed immediately. No need to save to disk first.",
  },
  {
    q: "Is this free forever?",
    a: "Yes. Because compression runs entirely in your browser, there are no server costs. WebP Ninja is and will remain free with no file limits and no sign-up required for the browser tool.",
  },
  {
    q: "How do I reduce an image's file size without losing quality?",
    a: "Use a quality setting of 75–85% with WebP or AVIF output. At this range, modern codecs remove data that's imperceptible to the human eye while keeping the image visually identical — you get 50–80% smaller files with no noticeable quality loss.",
  },
  {
    q: "What's the best image format for website speed and SEO?",
    a: "WebP is the best general-purpose choice — broad browser support with excellent compression. AVIF compresses even further but has slightly less universal support. Both significantly outperform JPEG and PNG for Core Web Vitals metrics like Largest Contentful Paint.",
  },
  {
    q: "What's the difference between WebP and AVIF?",
    a: "AVIF generally produces smaller files than WebP at the same visual quality, especially for photos, but takes longer to encode and has slightly less universal browser/tool support. WebP is the safer default; AVIF is worth trying if you want to squeeze out extra savings.",
  },
  {
    q: "Does compression preserve transparency?",
    a: "Yes — PNG and WebP output both preserve the alpha (transparency) channel. Note that JPEG doesn't support transparency at all, so any transparent areas will be filled with white if you choose JPEG as your output format.",
  },
  {
    q: "Can I convert HEIC photos from my iPhone?",
    a: "Browser support for HEIC varies — Safari can open HEIC files directly, but Chrome and Firefox generally can't due to licensing restrictions on the format. If your browser can't open a HEIC file here, convert it to JPEG first using your phone or computer's built-in Photos app, then compress it with WebP Ninja.",
  },
  {
    q: "Will my compressed images work in every browser?",
    a: "JPEG and PNG work everywhere, including very old browsers. WebP is supported by all browsers released in the last several years. AVIF has slightly newer support — if you need maximum compatibility for an older audience, stick with WebP or JPEG.",
  },
  {
    q: "Is there a maximum file size I can compress?",
    a: "There's no artificial limit we impose. In practice, very large files (100MB+) may process more slowly depending on your device's memory and processing power, since everything runs locally in your browser.",
  },
  {
    q: "Do I need to create an account to use this?",
    a: "No — the browser-based compressor requires no sign-up at all. An account (via Google Sign-In) is only needed if you want to use the separate Developer API for server-side, automated compression.",
  },
  {
    q: "What is the Developer API and how is it different from this page?",
    a: "The Developer API is a separate REST API for automating image compression from your own backend or scripts — useful for bulk pipelines where a browser isn't involved. Unlike the tool on this page, API requests are processed on our servers (briefly, in memory, never stored). See the full reference on the Developer API docs page.",
  },
  {
    q: "Is there a WordPress plugin?",
    a: "Yes — the WebP Ninja Compressor plugin auto-compresses every image on upload directly on your own WordPress server, using GD or Imagick, with no external API calls. Download it free from the WordPress Plugin section above.",
  },
  {
    q: "How is WebP Ninja different from TinyPNG or Squoosh?",
    a: "TinyPNG uploads your images to its servers to compress them and caps free usage at 20 images per batch. WebP Ninja runs entirely in your browser instead, so there's no upload step, no per-batch limit, and your images never leave your device. Squoosh is also browser-based and is a great tool too — WebP Ninja adds batch processing, ZIP downloads, clipboard paste, and a Developer API on top.",
  },
  {
    q: "Can I batch convert many PNGs to WebP at once?",
    a: "Yes — drop as many files as you like, set the output format to WebP, and every file converts in place. When you're done, use Download All to get everything as a single ZIP.",
  },
  {
    q: "Does WebP Ninja work on mobile devices?",
    a: "Yes. Since compression runs in your browser rather than an app, it works on any modern mobile browser on iOS or Android — just open this page and drop or select your images.",
  },
  {
    q: "Do I need an internet connection to compress images?",
    a: "You need internet to load the page initially, but the actual compression happens locally using WebAssembly — nothing is uploaded or downloaded during the process itself.",
  },
  {
    q: "Can I use compressed images for e-commerce or client websites?",
    a: "Absolutely — compression happens locally with no usage restrictions, so it's well suited for Shopify, WooCommerce, client sites, or any commercial project. There's no attribution requirement either.",
  },
  {
    q: "Is my payment information safe when I subscribe to the Developer API?",
    a: "Yes. Paid plans are processed by Razorpay, a PCI-DSS compliant payment processor — your card or bank details go directly to Razorpay and are never seen or stored by us.",
  },
];
