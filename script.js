/* ==========================================================================
   MonoTools — Static Client-Side Application
   Bilingual (EN/AR) · SPA show-hide navigation · 5 in-browser tools
   No backend. All processing happens locally on the user's device.
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     UTILITIES
     ====================================================================== */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function el(tag, attrs = {}, ...children) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else e.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  function downloadBlob(blob, filename) {
    // Append a unique suffix so re-downloading a new result never gets
    // mistaken by the browser for the same previous file (avoids the
    // "Download file again?" prompt when content changes but the base
    // name stays the same).
    const dot = filename.lastIndexOf('.');
    const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const uniqueName = dot === -1
      ? `${filename}-${stamp}`
      : `${filename.slice(0, dot)}-${stamp}${filename.slice(dot)}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = uniqueName;
    document.body.appendChild(a); a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  const ICONS = {
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M12 16l-4-4M12 16l4-4M4 20h16"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  };

  function spinner(msg) {
    return el('div', { class: 'spinner-wrap' },
      el('div', { class: 'spinner' }),
      el('p', {}, msg || t('processing'))
    );
  }

  function showError(parent, msg) {
    let box = $('.error-box', parent);
    if (!box) { box = el('div', { class: 'error-box' }); parent.appendChild(box); }
    box.textContent = msg;
    box.classList.add('active');
  }
  
  function clearError(parent) {
    const box = $('.error-box', parent);
    if (box) box.classList.remove('active');
  }

  function wireUploadZone(zoneEl, inputEl, onFile) {
    zoneEl.addEventListener('click', () => inputEl.click());
    inputEl.addEventListener('change', () => {
      if (inputEl.files && inputEl.files.length) {
        Array.from(inputEl.files).forEach(onFile);
      }
      inputEl.value = '';
    });
    zoneEl.addEventListener('dragover', e => { e.preventDefault(); zoneEl.classList.add('dragover'); });
    zoneEl.addEventListener('dragleave', () => zoneEl.classList.remove('dragover'));
    zoneEl.addEventListener('drop', e => {
      e.preventDefault();
      zoneEl.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files && files.length) Array.from(files).forEach(onFile);
    });
  }

  /* ======================================================================
     i18n — Bilingual (English default, Arabic toggle)
     ====================================================================== */
  const I18N = {
    en: {
      'nav.home': 'Home', 'nav.qr': 'QR Generator', 'nav.bg': 'Background Remover',
      'nav.compress': 'Image Compressor', 'nav.pfp': 'Profile Pic Maker', 'nav.youtube': 'YouTube Thumbnail', 'nav.pdf': 'Image to PDF',
      'hero.title': 'Image Tools, Reimagined',
      'hero.sub': 'Six fast, free tools that run entirely in your browser. No uploads, no sign-up — your files never leave your device.',
      'card.qr.title': 'QR Code Generator', 'card.qr.desc': 'Generate QR codes instantly in your browser. Square, high-resolution, downloadable as PNG.',
      'card.bg.title': 'Background Remover', 'card.bg.desc': 'Remove image backgrounds with on-device AI. Export transparent PNG instantly.',
      'card.compress.title': 'Image Compressor', 'card.compress.desc': 'Compress images right in your browser — automatically, at the best possible quality.',
      'card.pfp.title': 'Profile Pic Maker', 'card.pfp.desc': 'Turn any photo into a clean circular profile picture with a transparent background. Drag and zoom to frame it just right.',
      'card.yt.title': 'YouTube Thumbnail', 'card.yt.desc': 'Download any YouTube video thumbnail in the highest available quality, in one click.',
      'card.pdf.title': 'Image to PDF', 'card.pdf.desc': 'Convert multiple images into a single PDF file, right in your browser. Fast and secure.',
      'card.cta': 'Open tool →',
      'trust': '100% Privacy: All files are processed locally on your device',
      'feat.free': 'Completely Free', 'feat.instant': 'Instant Results',
      'feat.private': 'Full Privacy', 'feat.nosignup': 'No Sign-up',
      'ad.top': 'Ad Space — Top', 'ad.bottom': 'Ad Space — Bottom',
      'back': 'Back',
      'processing': 'Processing…',
      'qr.title': 'QR Code Generator',
      'qr.desc': 'Generate a QR code instantly in your browser. Enter text or a URL, choose the error-correction level, then download.',
      'qr.content': 'Content (link)', 'qr.contentPh': 'Paste a link (URL)...',
      'qr.ecc': 'Error correction', 'qr.generate': 'Generate QR', 'qr.download': 'Download PNG',
      'qr.empty': 'Your QR code will appear here', 'qr.errEmpty': 'Please enter content to generate a QR code.',
      'bg.title': 'Background Remover',
      'bg.desc': "Remove image backgrounds with on-device AI (RMBG-1.4). The model downloads once on first use, then runs entirely in your browser. Export a transparent PNG.",
      'bg.loading': 'Loading AI engine… (first run only)', 'bg.model': 'Downloading AI model…',
      'bg.processing': 'Removing background…', 'bg.done': 'Background removed',
      'bg.download': 'Download PNG', 'bg.errFail': 'Background removal failed. Please try another image.',
      'compress.title': 'Image Compressor',
      'compress.desc': 'Compress any image directly in your browser using the Canvas API — automatically resizes very large photos and finds the highest quality that keeps the file under 1MB. Runs entirely on your device.',
      'compress.originalSize': 'Original Size', 'compress.compressedSize': 'Compressed Size',
      'compress.download': 'Download JPG', 'compress.errFail': 'Image compression failed. Please try another image.',
      'pfp.title': 'Profile Pic Maker',
      'pfp.desc': 'Crop your photo into a clean circular profile picture with a transparent background. Drag to reposition, pinch or scroll to zoom. Runs entirely on your device.',
      'pfp.hint': 'Drag to reposition. Pinch or scroll to zoom.',
      'pfp.download': 'Download PNG', 'pfp.errFail': 'Could not process that image. Please try another one.',
      'yt.title': 'YouTube Thumbnail Downloader',
      'yt.desc': 'Paste a YouTube video URL to view all available thumbnails in every quality, then download any of them in one click.',
      'yt.urlPh': 'https://www.youtube.com/watch?v=...', 'yt.fetch': 'Fetch',
      'yt.errEmpty': 'Please enter a YouTube URL.', 'yt.errInvalid': 'Could not find a YouTube video ID in that URL.',
      'yt.searching': 'Searching for thumbnails…', 'yt.unavailable': 'Not available for this video',
      'yt.download': 'Download', 'yt.bytes': 'bytes', 'yt.openDirect': 'Open image (save manually)',
      'pdf.title': 'Image to PDF',
      'pdf.desc': 'Select one or more images, arrange them, then convert to a single PDF file right in your browser. Fast and secure — nothing is uploaded.',
      'pdf.drop': 'Drop images here or click to select (multiple allowed)',
      'pdf.portrait': 'Portrait', 'pdf.landscape': 'Landscape', 'pdf.pageSize': 'Page size',
      'pdf.convert': 'Convert to PDF', 'pdf.processing': 'Creating PDF…', 'pdf.download': 'Download PDF',
      'pdf.images': 'Images', 'pdf.size': 'Size', 'pdf.orient': 'Orientation',
      'pdf.errEmpty': 'Add at least one image first.', 'pdf.remove': 'Remove',
      'upload.drop': 'Drop image here or click to select',
      'upload.sub': 'PNG · JPG · WEBP · BMP — processed locally',
      'footer.tag': 'Minimalist image tools',
      'footer.dev': 'Developed by', 'footer.copy': 'All rights reserved',
      'footer.privacy': 'Privacy Policy', 'footer.terms': 'Terms of Use',
      'footer.about': 'About Us', 'footer.contact': 'Contact',
      'seo.qr.heading': 'About this QR code generator',
      'seo.qr.intro': 'Create a QR code from any link in seconds. Everything happens right in your browser — nothing is uploaded to a server, so your QR codes stay completely private.',
      'seo.qr.howto.1': 'Type or paste the text or link you want to encode.',
      'seo.qr.howto.2': 'Choose your preferred error-correction level and size.',
      'seo.qr.howto.3': 'Click Generate and download the PNG.',
      'seo.qr.faqHeading': 'Frequently asked questions',
      'seo.qr.faq.1.q': 'Do I need an account to create a QR code?',
      'seo.qr.faq.1.a': 'No. This tool works instantly with no sign-up and no limit on how many codes you generate.',
      'seo.qr.faq.2.q': 'Will the QR code expire?',
      'seo.qr.faq.2.a': "No. It's a static image with your content permanently embedded — it works forever, even offline.",
      'seo.qr.faq.3.q': 'What can I put inside a QR code?',
      'seo.qr.faq.3.a': 'A link (URL) — for example a website address, a social media page, or a video link.',
      'seo.bg.heading': 'About this background remover',
      'seo.bg.intro': 'Remove the background from any photo automatically using an AI model that runs entirely on your device. No image is ever uploaded anywhere — the AI processing happens locally in your browser, then you download a transparent PNG.',
      'seo.bg.howto.1': 'Upload a photo.',
      'seo.bg.howto.2': 'Wait a few seconds while the on-device AI detects the subject.',
      'seo.bg.howto.3': 'Download the transparent PNG.',
      'seo.bg.faqHeading': 'Frequently asked questions',
      'seo.bg.faq.1.q': 'Is my photo uploaded to a server?',
      'seo.bg.faq.1.a': 'No. The AI model downloads once to your browser and all processing happens on your own device.',
      'seo.bg.faq.2.q': 'Why did some edges come out rough?',
      'seo.bg.faq.2.a': 'Complex backgrounds with busy edges or similar colors can confuse any AI background remover, including paid ones. Try a photo with clearer contrast between subject and background for best results.',
      'seo.bg.faq.3.q': 'What file type do I get?',
      'seo.bg.faq.3.a': 'A PNG file with a transparent background, ready to use anywhere.',
      'seo.compress.heading': 'About this image compressor',
      'seo.compress.intro': 'Shrink large photos down to under 1MB automatically, while keeping the highest visual quality possible. The tool resizes oversized images and fine-tunes JPEG quality on its own — no sliders, no guesswork.',
      'seo.compress.howto.1': 'Upload your image.',
      'seo.compress.howto.2': 'The tool automatically resizes and compresses it.',
      'seo.compress.howto.3': 'Download the compressed JPG.',
      'seo.compress.faqHeading': 'Frequently asked questions',
      'seo.compress.faq.1.q': 'Will my photo lose quality?',
      'seo.compress.faq.1.a': 'The tool always finds the highest quality that still fits under 1MB, so quality loss is minimized and usually invisible to the eye.',
      'seo.compress.faq.2.q': 'Does it work on huge photos from my phone?',
      'seo.compress.faq.2.a': 'Yes. Photos larger than 1920px are automatically resized before compression.',
      'seo.compress.faq.3.q': 'Is there a file size limit for uploads?',
      'seo.compress.faq.3.a': "No hard limit — processing happens on your device, so it depends on your device's memory for very large files.",
      'seo.pfp.heading': 'About this profile picture maker',
      'seo.pfp.intro': "Turn any photo into a clean, circular profile picture with a transparent background. Drag to reposition and pinch or scroll to zoom until it's framed exactly how you want it.",
      'seo.pfp.howto.1': 'Upload a photo.',
      'seo.pfp.howto.2': 'Drag and zoom inside the circle to frame your face or subject.',
      'seo.pfp.howto.3': 'Click Download PNG.',
      'seo.pfp.faqHeading': 'Frequently asked questions',
      'seo.pfp.faq.1.q': 'Can I choose which part of the photo shows?',
      'seo.pfp.faq.1.a': "Yes — drag the image inside the circle and pinch or scroll to zoom, exactly like a mobile app's profile picture picker.",
      'seo.pfp.faq.2.q': 'What format is the download?',
      'seo.pfp.faq.2.a': 'A PNG file with a transparent background outside the circle.',
      'seo.pfp.faq.3.q': 'Does this upload my photo anywhere?',
      'seo.pfp.faq.3.a': 'No, the entire crop and render happens locally in your browser.',
      'seo.youtube.heading': 'About this YouTube thumbnail downloader',
      'seo.youtube.intro': "Download any YouTube video's thumbnail in the highest quality available, straight to your device. Just paste the video link — no software, no account needed.",
      'seo.youtube.howto.1': 'Paste a YouTube video URL.',
      'seo.youtube.howto.2': 'The tool fetches every available thumbnail quality.',
      'seo.youtube.howto.3': 'Click download on the resolution you want.',
      'seo.youtube.faqHeading': 'Frequently asked questions',
      'seo.youtube.faq.1.q': 'Is this legal to use?',
      'seo.youtube.faq.1.a': 'Downloading a thumbnail for personal reference, backup, or discussion is generally fine; always respect copyright if you plan to republish it.',
      'seo.youtube.faq.2.q': 'What qualities are available?',
      'seo.youtube.faq.2.a': 'From the small default thumbnail up to the maximum resolution the video has, often 1280×720 or higher.',
      'seo.youtube.faq.3.q': 'Does it work for private videos?',
      'seo.youtube.faq.3.a': 'No, only thumbnails for public or unlisted videos can be fetched.',
      'seo.pdf.heading': 'About this image to PDF converter',
      'seo.pdf.intro': 'Combine multiple images into a single PDF file, right in your browser. Reorder pages, choose orientation, and download — all without installing anything.',
      'seo.pdf.howto.1': 'Upload one or more images.',
      'seo.pdf.howto.2': 'Arrange the order and pick portrait or landscape.',
      'seo.pdf.howto.3': 'Click Create PDF and download.',
      'seo.pdf.faqHeading': 'Frequently asked questions',
      'seo.pdf.faq.1.q': 'How many images can I add?',
      'seo.pdf.faq.1.a': "As many as your device's memory can handle — there's no artificial limit set by the tool.",
      'seo.pdf.faq.2.q': 'Can I reorder the pages?',
      'seo.pdf.faq.2.a': 'Yes, arrange your images in whatever order you want before creating the PDF.',
      'seo.pdf.faq.3.q': 'Is the PDF password-protected?',
      'seo.pdf.faq.3.a': "No, it's a standard PDF file with no restrictions or passwords.",
      'page.updated': 'Last updated: January 2026',
      'page.about.title': 'About Us',
      'about.p1.h': 'What is MonoTools?',
      'about.p1': 'MonoTools is a small collection of free, browser-based image tools: a QR code generator, an AI background remover, an image compressor, a profile picture maker, a YouTube thumbnail downloader, and an image-to-PDF converter. Every tool runs entirely inside your browser using JavaScript and the Canvas API — nothing you upload is ever sent to a server.',
      'about.p2.h': 'Why we built it',
      'about.p2': "Most online image tools ask you to upload your photos to a server, which means your files pass through someone else's infrastructure before you get a result. We wanted the opposite: fast, free tools that respect your privacy by design — your images never leave your device, whether you're on Wi-Fi or offline.",
      'about.p3.h': 'Design philosophy',
      'about.p3': "The entire site follows one visual rule: pure black ink on white, no color, no gradients. It's a deliberate choice to keep the interface calm, fast-loading, and focused on the tools themselves rather than decoration.",
      'page.contact.title': 'Contact Us',
      'contact.p1.h': 'Get in touch',
      'contact.p1': "Have a question, found a bug, or want to suggest a new tool? We'd like to hear from you. The best way to reach us is by email:",
      'contact.p2.h': 'Response time',
      'contact.p2': "We're a small independent project, so please allow a few days for a reply. We read every message.",
      'page.privacy-policy.title': 'Privacy Policy',
      'privacy.p1.h': 'Overview',
      'privacy.p1': 'MonoTools ("we", "the site") provides free, browser-based image tools. This policy explains what information is and is not collected when you use the site.',
      'privacy.p2.h': 'Your files are never uploaded',
      'privacy.p2': "Every tool on this site (QR generator, background remover, image compressor, profile picture maker, image-to-PDF) processes your files entirely on your own device using your browser's built-in capabilities. Your images, PDFs, and QR code content are never transmitted to our servers or any third party.",
      'privacy.p3.h': 'Local storage',
      'privacy.p3': "We use your browser's local storage only to remember your language preference (English or Arabic) between visits. This stays on your device and is never sent anywhere.",
      'privacy.p4.h': 'Third-party services (YouTube thumbnails)',
      'privacy.p4': "The YouTube Thumbnail Downloader tool fetches publicly available thumbnail images directly from YouTube's own servers based on the video link you paste. This request goes directly from your browser to YouTube, not through us.",
      'privacy.p5.h': 'Cookies and advertising',
      'privacy.p5': "This site may display advertisements served by Google AdSense and other third-party advertising networks. These networks may use cookies and similar technologies to serve ads based on your prior visits to this and other websites. You can learn more about how Google uses data and manage your ad personalization preferences at Google's Ads Settings page.",
      'privacy.p6.h': "Children's privacy",
      'privacy.p6': 'This site is not directed at children under 13, and we do not knowingly collect personal information from children.',
      'privacy.p7.h': 'Changes to this policy',
      'privacy.p7': 'We may update this policy from time to time. Changes will be posted on this page with an updated date.',
      'privacy.p8.h': 'Contact us',
      'privacy.p8': 'If you have questions about this privacy policy, please contact us at the email listed on our Contact page.',
      'page.terms.title': 'Terms of Use',
      'terms.p1.h': 'Acceptance of terms',
      'terms.p1': 'By using MonoTools, you agree to these terms of use. If you do not agree, please do not use the site.',
      'terms.p2.h': 'Description of service',
      'terms.p2': 'MonoTools provides free, browser-based image and utility tools, including a QR code generator, background remover, image compressor, profile picture maker, YouTube thumbnail downloader, and image-to-PDF converter. All processing happens locally in your browser.',
      'terms.p3.h': 'Acceptable use',
      'terms.p3': "You agree not to use these tools to process content that is illegal, infringes on someone else's copyright or privacy, or violates the terms of service of any third party (including YouTube, for the thumbnail downloader).",
      'terms.p4.h': '"As is" service, no warranty',
      'terms.p4': 'This site and its tools are provided "as is" without any warranty of any kind. We do not guarantee the tools will be error-free, uninterrupted, or fit for any particular purpose.',
      'terms.p5.h': 'Limitation of liability',
      'terms.p5': 'To the fullest extent permitted by law, MonoTools and its operators are not liable for any damages arising from your use of, or inability to use, this site or its tools.',
      'terms.p6.h': 'Advertising',
      'terms.p6': 'This site may display third-party advertisements (such as Google AdSense) to support the cost of running the service. We are not responsible for the content of third-party ads.',
      'terms.p7.h': 'Changes to these terms',
      'terms.p7': 'We may update these terms from time to time. Continued use of the site after changes means you accept the updated terms.',
      'lang.ar': 'العربية', 'lang.en': 'English',
    },
    ar: {
      'nav.home': 'الرئيسية', 'nav.qr': 'صانع QR', 'nav.bg': 'إزالة الخلفية',
      'nav.compress': 'ضغط الصور', 'nav.pfp': 'صانع صور البروفايل', 'nav.youtube': 'صور يوتيوب', 'nav.pdf': 'صور إلى PDF',
      'hero.title': 'أدوات الصور، بتصميم جديد',
      'hero.sub': 'ست أدوات سريعة ومجانية تعمل بالكامل في متصفحك. بدون رفع، بدون تسجيل — ملفاتك لا تغادر جهازك أبداً.',
      'card.qr.title': 'صانع رمز QR', 'card.qr.desc': 'توليد رمز QR فوري في المتصفح. مربع، عالي الدقة، قابل للتحميل كـ PNG.',
      'card.bg.title': 'إزالة خلفية الصور', 'card.bg.desc': 'إزالة خلفية الصور بالذكاء الاصطناعي على جهازك. صدّر PNG شفاف فوراً.',
      'card.compress.title': 'ضغط الصور', 'card.compress.desc': 'اضغط الصور مباشرة في متصفحك تلقائياً وبأفضل جودة ممكنة.',
      'card.pfp.title': 'صانع صور البروفايل', 'card.pfp.desc': 'حوّل أي صورة إلى صورة بروفايل دائرية نظيفة بخلفية شفافة. اسحب وقرّب لتأطيرها بالظبط زي ما عايز.',
      'card.yt.title': 'تحميل صور يوتيوب', 'card.yt.desc': 'تحميل أي صورة مصغرة من فيديو يوتيوب بأعلى دقة متوفرة، بضغطة واحدة.',
      'card.pdf.title': 'صور إلى PDF', 'card.pdf.desc': 'تحويل عدة صور إلى ملف PDF واحد مباشرة في متصفحك. سريع وآمن.',
      'card.cta': 'افتح الأداة ←',
      'trust': 'خصوصية 100%: تتم معالجة جميع الملفات محلياً على جهازك',
      'feat.free': 'مجاني تماماً', 'feat.instant': 'نتائج فورية',
      'feat.private': 'خصوصية كاملة', 'feat.nosignup': 'بدون تسجيل',
      'ad.top': 'مساحة إعلانية — أعلى', 'ad.bottom': 'مساحة إعلانية — أسفل',
      'back': 'رجوع',
      'processing': 'جارٍ المعالجة…',
      'qr.title': 'صانع رمز QR',
      'qr.desc': 'أنشئ رمز QR فورياً في متصفحك. اكتب نصاً أو رابطاً، اختر مستوى تصحيح الأخطاء، ثم حمّل.',
      'qr.content': 'المحتوى (رابط)', 'qr.contentPh': 'الصق رابط (URL)...',
      'qr.ecc': 'تصحيح الأخطاء', 'qr.generate': 'توليد QR', 'qr.download': 'تحميل PNG',
      'qr.empty': 'سيظهر رمز الـ QR هنا', 'qr.errEmpty': 'الرجاء إدخال محتوى لإنشاء رمز QR.',
      'bg.title': 'إزالة خلفية الصور',
      'bg.desc': 'إزالة خلفية الصور بالذكاء الاصطناعي على جهازك (RMBG-1.4). يُحمّل النموذج مرة واحدة عند أول استخدام، ثم يعمل بالكامل في متصفحك. صدّر PNG شفاف.',
      'bg.loading': 'جارٍ تحميل محرك الذكاء… (أول استخدام فقط)', 'bg.model': 'جارٍ تنزيل نموذج الذكاء الاصطناعي…',
      'bg.processing': 'جارٍ إزالة الخلفية…', 'bg.done': 'تمت إزالة الخلفية',
      'bg.download': 'تحميل PNG', 'bg.errFail': 'فشلت إزالة الخلفية. جرّب صورة أخرى.',
      'compress.title': 'ضغط الصور',
      'compress.desc': 'اضغط أي صورة مباشرة في متصفحك باستخدام Canvas API — تصغّر الصور الضخمة تلقائياً وتوجد أعلى جودة ممكنة تخلي حجم الملف أقل من 1 ميجابايت. تعمل الأداة بالكامل على جهازك.',
      'compress.originalSize': 'الحجم الأصلي', 'compress.compressedSize': 'الحجم بعد الضغط',
      'compress.download': 'تحميل JPG', 'compress.errFail': 'فشل ضغط الصورة. جرّب صورة أخرى.',
      'pfp.title': 'صانع صور البروفايل',
      'pfp.desc': 'اقتطع صورتك في دائرة نظيفة بخلفية شفافة. اسحب لتحديد المكان، وقرّب أو بعّد بالبينش أو بعجلة الماوس. تعمل الأداة بالكامل على جهازك.',
      'pfp.hint': 'اسحب لتحديد المكان. قرّب أو بعّد بالبينش أو بعجلة الماوس.',
      'pfp.download': 'تحميل PNG', 'pfp.errFail': 'تعذّرت معالجة هذه الصورة. جرّب صورة أخرى.',
      'yt.title': 'تحميل صور يوتيوب المصغرة',
      'yt.desc': 'ألصق رابط فيديو يوتيوب لعرض جميع الصور المصغرة المتوفرة بكل الجودات، ثم حمّل أي منها بضغطة واحدة.',
      'yt.urlPh': 'https://www.youtube.com/watch?v=...', 'yt.fetch': 'بحث',
      'yt.errEmpty': 'الرجاء إدخال رابط يوتيوب.', 'yt.errInvalid': 'تعذّر العثور على معرّف فيديو يوتيوب في هذا الرابط.',
      'yt.searching': 'جارٍ البحث عن الصور المصغرة…', 'yt.unavailable': 'غير متوفرة لهذا الفيديو',
      'yt.download': 'تحميل', 'yt.bytes': 'بايت', 'yt.openDirect': 'فتح الصورة (احفظ يدوياً)',
      'pdf.title': 'تحويل الصور إلى PDF',
      'pdf.desc': 'اختر صورة أو أكثر، رتّبها، ثم حوّلها إلى ملف PDF واحد في متصفحك. سريع وآمن — لا يُرفع شيء.',
      'pdf.drop': 'اسحب الصور هنا أو اضغط للاختيار (متعدد مسموح)',
      'pdf.portrait': 'طولي', 'pdf.landscape': 'عرضي', 'pdf.pageSize': 'حجم الصفحة',
      'pdf.convert': 'تحويل إلى PDF', 'pdf.processing': 'جارٍ إنشاء PDF…', 'pdf.download': 'تحميل PDF',
      'pdf.images': 'الصور', 'pdf.size': 'الحجم', 'pdf.orient': 'الاتجاه',
      'pdf.errEmpty': 'أضف صورة واحدة على الأقل أولاً.', 'pdf.remove': 'حذف',
      'upload.drop': 'اسحب الصورة هنا أو اضغط للاختيار',
      'upload.sub': 'PNG · JPG · WEBP · BMP — معالجة محلية',
      'footer.tag': 'أدوات صور مينيمالية',
      'footer.dev': 'تطوير', 'footer.copy': 'جميع الحقوق محفوظة',
      'footer.privacy': 'سياسة الخصوصية', 'footer.terms': 'شروط الاستخدام',
      'footer.about': 'من نحن', 'footer.contact': 'تواصل معنا',
      'seo.qr.heading': 'عن مولد أكواد QR ده',
      'seo.qr.intro': 'أنشئ كود QR من أي رابط في ثوانٍ. كل حاجة بتحصل جوه متصفحك — من غير ما أي بيانات تتبعت لأي سيرفر، فكود الـ QR بتاعك يفضل خاص تماماً.',
      'seo.qr.howto.1': 'اكتب أو الصق النص أو الرابط اللي عايز تحوله.',
      'seo.qr.howto.2': 'اختار مستوى تصحيح الأخطاء والمقاس اللي يناسبك.',
      'seo.qr.howto.3': 'دوس "توليد" وحمّل الصورة PNG.',
      'seo.qr.faqHeading': 'أسئلة شائعة',
      'seo.qr.faq.1.q': 'محتاج حساب عشان أعمل كود QR؟',
      'seo.qr.faq.1.a': 'لأ، الأداة شغالة فوراً من غير تسجيل ومن غير حد أقصى لعدد الأكواد.',
      'seo.qr.faq.2.q': 'الكود ده هينتهي؟',
      'seo.qr.faq.2.a': 'لأ، صورة ثابتة بمحتواك متضمن فيها للأبد، وشغالة حتى من غير إنترنت.',
      'seo.qr.faq.3.q': 'أقدر أحط ايه جوه كود الـ QR؟',
      'seo.qr.faq.3.a': 'رابط (URL) — زي رابط موقع، صفحة سوشيال ميديا، أو رابط فيديو.',
      'seo.bg.heading': 'عن أداة إزالة الخلفية دي',
      'seo.bg.intro': 'شيل خلفية أي صورة تلقائياً باستخدام موديل ذكاء اصطناعي شغال بالكامل على جهازك. الصورة مبتترفعش لأي سيرفر خالص — كل المعالجة بتحصل جوه متصفحك، وبعدين تنزّل صورة PNG بخلفية شفافة.',
      'seo.bg.howto.1': 'ارفع الصورة.',
      'seo.bg.howto.2': 'استنى كام ثانية لحد ما الذكاء الاصطناعي المحلي يحدد الموضوع.',
      'seo.bg.howto.3': 'حمّل الصورة الشفافة PNG.',
      'seo.bg.faqHeading': 'أسئلة شائعة',
      'seo.bg.faq.1.q': 'صورتي بترفع على سيرفر؟',
      'seo.bg.faq.1.a': 'لأ، الموديل بينزل مرة واحدة على متصفحك وكل المعالجة بتحصل على جهازك.',
      'seo.bg.faq.2.q': 'ليه بعض الحواف طلعت مش دقيقة؟',
      'seo.bg.faq.2.a': 'الخلفيات المعقدة أو الألوان المتقاربة ممكن تلخبط أي أداة ذكاء اصطناعي حتى المدفوعة. جرب صورة بتباين أوضح بين الموضوع والخلفية.',
      'seo.bg.faq.3.q': 'هطلع بصيغة ايه؟',
      'seo.bg.faq.3.a': 'ملف PNG بخلفية شفافة، جاهز تستخدمه في أي حاجة.',
      'seo.compress.heading': 'عن أداة ضغط الصور دي',
      'seo.compress.intro': 'قلّل حجم الصور الكبيرة لأقل من 1 ميجابايت تلقائياً، مع الحفاظ على أعلى جودة بصرية ممكنة. الأداة بتصغّر الصور الضخمة وتظبط جودة JPEG بنفسها — من غير أشرطة تحكم ومن غير تخمين.',
      'seo.compress.howto.1': 'ارفع الصورة.',
      'seo.compress.howto.2': 'الأداة بتصغّرها وتضغطها أوتوماتيك.',
      'seo.compress.howto.3': 'حمّل ملف الـ JPG المضغوط.',
      'seo.compress.faqHeading': 'أسئلة شائعة',
      'seo.compress.faq.1.q': 'هتقل جودة صورتي؟',
      'seo.compress.faq.1.a': 'الأداة دايماً بتدور على أعلى جودة تخلي الحجم أقل من 1 ميجا، فأي فقدان بيبقى غير محسوس تقريباً للعين.',
      'seo.compress.faq.2.q': 'بتشتغل مع صور الموبايل الكبيرة؟',
      'seo.compress.faq.2.a': 'أيوه، أي صورة أكبر من 1920 بكسل بتتصغّر تلقائياً قبل الضغط.',
      'seo.compress.faq.3.q': 'فيه حد أقصى لحجم الرفع؟',
      'seo.compress.faq.3.a': 'مفيش حد ثابت — المعالجة بتحصل على جهازك، فبتعتمد على ذاكرة جهازك للملفات الكبيرة جداً.',
      'seo.pfp.heading': 'عن صانع صور البروفايل ده',
      'seo.pfp.intro': 'حوّل أي صورة لصورة بروفايل دائرية نظيفة بخلفية شفافة. اسحب لتحديد المكان وقرّب أو بعّد بالبينش أو بعجلة الماوس لحد ما تظبطها بالظبط زي ما عايز.',
      'seo.pfp.howto.1': 'ارفع الصورة.',
      'seo.pfp.howto.2': 'اسحب وقرّب جوه الدائرة عشان تأطّر وشك أو الموضوع.',
      'seo.pfp.howto.3': 'دوس تحميل PNG.',
      'seo.pfp.faqHeading': 'أسئلة شائعة',
      'seo.pfp.faq.1.q': 'أقدر أختار أي جزء من الصورة يظهر؟',
      'seo.pfp.faq.1.a': 'أيوه، اسحب الصورة جوه الدائرة وقرّب أو بعّد بالبينش أو العجلة، بالظبط زي أدوات صور البروفايل في الموبايل.',
      'seo.pfp.faq.2.q': 'هتنزل بصيغة ايه؟',
      'seo.pfp.faq.2.a': 'ملف PNG بخلفية شفافة برّه الدائرة.',
      'seo.pfp.faq.3.q': 'الصورة بترفع لأي مكان؟',
      'seo.pfp.faq.3.a': 'لأ، كل القص والمعالجة بتحصل محلياً جوه متصفحك.',
      'seo.youtube.heading': 'عن أداة تحميل صور يوتيوب دي',
      'seo.youtube.intro': 'حمّل صورة أي فيديو يوتيوب بأعلى جودة متاحة مباشرة على جهازك. الصق رابط الفيديو بس — من غير برامج ومن غير حساب.',
      'seo.youtube.howto.1': 'الصق رابط فيديو اليوتيوب.',
      'seo.youtube.howto.2': 'الأداة بتجيب كل جودات الصورة المتاحة.',
      'seo.youtube.howto.3': 'دوس تحميل على الدقة اللي عايزها.',
      'seo.youtube.faqHeading': 'أسئلة شائعة',
      'seo.youtube.faq.1.q': 'ده قانوني؟',
      'seo.youtube.faq.1.a': 'تحميل الصورة للاستخدام الشخصي أو المرجعي غالباً مقبول؛ احترم حقوق النشر لو هتعيد نشرها.',
      'seo.youtube.faq.2.q': 'ايه الجودات المتاحة؟',
      'seo.youtube.faq.2.a': 'من الصورة الصغيرة الافتراضية لحد أعلى دقة متاحة للفيديو، غالباً 1280×720 أو أعلى.',
      'seo.youtube.faq.3.q': 'بتشتغل مع الفيديوهات الخاصة؟',
      'seo.youtube.faq.3.a': 'لأ، بس الفيديوهات العامة أو غير المدرجة.',
      'seo.pdf.heading': 'عن أداة تحويل الصور إلى PDF دي',
      'seo.pdf.intro': 'ادمج كذا صورة في ملف PDF واحد، مباشرة جوه متصفحك. رتّب الصفحات، اختار الاتجاه، وحمّل — من غير ما تثبّت أي برنامج.',
      'seo.pdf.howto.1': 'ارفع صورة أو أكتر.',
      'seo.pdf.howto.2': 'رتّب الترتيب واختار عمودي أو أفقي.',
      'seo.pdf.howto.3': 'دوس إنشاء PDF وحمّله.',
      'seo.pdf.faqHeading': 'أسئلة شائعة',
      'seo.pdf.faq.1.q': 'أقدر أضيف كام صورة؟',
      'seo.pdf.faq.1.a': 'بقد ما ذاكرة جهازك تسمح — مفيش حد أقصى مفروض من الأداة.',
      'seo.pdf.faq.2.q': 'أقدر أرتّب الصفحات؟',
      'seo.pdf.faq.2.a': 'أيوه، رتّب الصور بالترتيب اللي عايزه قبل إنشاء الملف.',
      'seo.pdf.faq.3.q': 'الـ PDF محمي بباسورد؟',
      'seo.pdf.faq.3.a': 'لأ، ملف PDF عادي من غير أي قيود أو باسورد.',
      'page.updated': 'آخر تحديث: يناير 2026',
      'page.about.title': 'من نحن',
      'about.p1.h': 'ايه هو MonoTools؟',
      'about.p1': 'MonoTools مجموعة صغيرة من أدوات صور مجانية شغالة بالكامل في المتصفح: مولد أكواد QR، أداة إزالة خلفية بالذكاء الاصطناعي، أداة ضغط صور، صانع صور بروفايل، أداة تحميل صور يوتيوب المصغرة، وأداة تحويل الصور إلى PDF. كل أداة شغالة بالكامل جوه متصفحك باستخدام JavaScript وواجهة الـ Canvas — أي حاجة ترفعها معدّياش من جهازك أبداً.',
      'about.p2.h': 'ليه عملنا الموقع ده',
      'about.p2': 'أغلب أدوات الصور أونلاين بتطلب منك ترفع صورك على سيرفر، يعني ملفاتك بتعدي على أجهزة حد تاني قبل ما تاخد النتيجة. إحنا عايزين عكس كده: أدوات سريعة ومجانية بتحترم خصوصيتك من الأساس — صورك ما بتسيبش جهازك خالص، سواء وانت أونلاين أو حتى أوفلاين.',
      'about.p3.h': 'فلسفة التصميم',
      'about.p3': 'الموقع كله ماشي على قاعدة تصميم واحدة: خط أسود نقي على أبيض، من غير ألوان أو تدرجات. اختيار مقصود عشان الواجهة تفضل هادية، سريعة التحميل، ومركّزة على الأدوات نفسها مش الزخرفة.',
      'page.contact.title': 'تواصل معنا',
      'contact.p1.h': 'تواصل معانا',
      'contact.p1': 'عندك سؤال، لقيت مشكلة، أو عايز تقترح أداة جديدة؟ يسعدنا نسمع منك. أفضل طريقة تتواصل بيها معانا هي الإيميل:',
      'contact.p2.h': 'مدة الرد',
      'contact.p2': 'إحنا مشروع مستقل صغير، فمن فضلك اسمحلنا بكام يوم للرد. بنقرأ كل رسالة بتوصلنا.',
      'page.privacy-policy.title': 'سياسة الخصوصية',
      'privacy.p1.h': 'نظرة عامة',
      'privacy.p1': 'MonoTools ("إحنا"، "الموقع") بيقدم أدوات صور مجانية شغالة في المتصفح. السياسة دي بتشرح ايه المعلومات اللي بتتجمع وإيه اللي مش بيتجمع لما تستخدم الموقع.',
      'privacy.p2.h': 'ملفاتك متترفعش أبداً',
      'privacy.p2': 'كل أداة على الموقع (مولد الـ QR، إزالة الخلفية، ضغط الصور، صانع صور البروفايل، تحويل الصور إلى PDF) بتعالج ملفاتك بالكامل على جهازك باستخدام إمكانيات المتصفح. صورك وملفات الـ PDF ومحتوى أكواد الـ QR متتبعتش لسيرفراتنا أو لأي طرف تالت أبداً.',
      'privacy.p3.h': 'التخزين المحلي',
      'privacy.p3': 'بنستخدم التخزين المحلي في متصفحك بس عشان نفتكر تفضيل اللغة بتاعك (إنجليزي أو عربي) بين الزيارات. ده بيفضل على جهازك ومبيتبعتش لأي مكان.',
      'privacy.p4.h': 'خدمات طرف تالت (صور يوتيوب)',
      'privacy.p4': 'أداة تحميل صور يوتيوب المصغرة بتجيب صور عامة مباشرة من سيرفرات يوتيوب نفسها بناءً على رابط الفيديو اللي بتلصقه. الطلب ده بيروح مباشرة من متصفحك ليوتيوب، مش من خلالنا.',
      'privacy.p5.h': 'الكوكيز والإعلانات',
      'privacy.p5': 'الموقع ممكن يعرض إعلانات من Google AdSense وشبكات إعلانية تالتة. الشبكات دي ممكن تستخدم كوكيز وتقنيات مشابهة عشان تعرض إعلانات بناءً على زياراتك السابقة لهذا الموقع ومواقع تانية. تقدر تعرف أكتر عن استخدام جوجل للبيانات وتتحكم في تفضيلات الإعلانات المخصصة من صفحة إعدادات إعلانات جوجل.',
      'privacy.p6.h': 'خصوصية الأطفال',
      'privacy.p6': 'الموقع ده مش موجه للأطفال تحت سن 13 سنة، وإحنا معنديش نية إننا نجمع أي معلومات شخصية من الأطفال.',
      'privacy.p7.h': 'تغييرات على السياسة',
      'privacy.p7': 'ممكن نحدّث السياسة دي من وقت للتاني. أي تغييرات هتتنشر في الصفحة دي مع تاريخ التحديث.',
      'privacy.p8.h': 'تواصل معنا',
      'privacy.p8': 'لو عندك أسئلة عن سياسة الخصوصية دي، تواصل معانا على الإيميل الموجود في صفحة "تواصل معنا".',
      'page.terms.title': 'شروط الاستخدام',
      'terms.p1.h': 'الموافقة على الشروط',
      'terms.p1': 'باستخدامك لـ MonoTools، إنت موافق على شروط الاستخدام دي. لو مش موافق، من فضلك متستخدمش الموقع.',
      'terms.p2.h': 'وصف الخدمة',
      'terms.p2': 'MonoTools بيقدم أدوات صور ومساعدات مجانية شغالة في المتصفح، منها مولد أكواد QR، أداة إزالة خلفية، أداة ضغط صور، صانع صور بروفايل، أداة تحميل صور يوتيوب، وأداة تحويل صور إلى PDF. كل المعالجة بتحصل محلياً جوه متصفحك.',
      'terms.p3.h': 'الاستخدام المقبول',
      'terms.p3': 'إنت موافق على إنك متستخدمش الأدوات دي في معالجة محتوى غير قانوني، أو بينتهك حقوق نشر أو خصوصية حد تاني، أو بيخالف شروط استخدام أي طرف تالت (بما فيه يوتيوب بالنسبة لأداة تحميل الصور المصغرة).',
      'terms.p4.h': 'الخدمة "كما هي"، من غير ضمان',
      'terms.p4': 'الموقع والأدوات بتاعته متقدمين "كما هم" من غير أي ضمان من أي نوع. إحنا مش بنضمن إن الأدوات هتكون خالية من الأخطاء، أو شغالة من غير انقطاع، أو مناسبة لغرض معين.',
      'terms.p5.h': 'حدود المسؤولية',
      'terms.p5': 'لأقصى حد يسمح بيه القانون، MonoTools والقائمين عليه مش مسؤولين عن أي أضرار ناتجة عن استخدامك للموقع أو أدواته أو عدم قدرتك على استخدامها.',
      'terms.p6.h': 'الإعلانات',
      'terms.p6': 'الموقع ممكن يعرض إعلانات من طرف تالت (زي Google AdSense) عشان يغطي تكاليف تشغيل الخدمة. إحنا مش مسؤولين عن محتوى إعلانات الطرف التالت.',
      'terms.p7.h': 'تغييرات على الشروط',
      'terms.p7': 'ممكن نحدّث الشروط دي من وقت للتاني. استمرارك في استخدام الموقع بعد أي تغيير معناه موافقتك على الشروط المحدّثة.',
      'lang.ar': 'العربية', 'lang.en': 'English',
    }
  };

  let curLang = localStorage.getItem('monotools-lang') || 'en';

  function t(key) {
    return (I18N[curLang] && I18N[curLang][key]) || (I18N.en[key]) || key;
  }

  function applyLang(lang) {
    curLang = lang;
    localStorage.setItem('monotools-lang', lang);
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(node => {
      const key = node.getAttribute('data-i18n');
      const val = t(key);
      if (val) node.textContent = val;
    });
    $$('[data-i18n-ph]').forEach(node => {
      node.setAttribute('placeholder', t(node.getAttribute('data-i18n-ph')));
    });
    const label = $('#langLabel');
    if (label) label.textContent = lang === 'en' ? t('lang.ar') : t('lang.en');
    reRenderDynamic();
  }

  /* ======================================================================
     QR CODE GENERATOR 
     ====================================================================== */
  function initQR() {
    const view = $('#view-qr');
    if (!view) return;
    const textEl = $('#qrText', view);
    const sizeEl = $('#qrSize', view); 
    const eccEl  = $('#qrEcc', view);
    const genBtn = $('#qrGen', view);
    const preview = $('#qrPreview', view);
    const dlBtn = $('#qrDownload', view);

    function generate() {
      const text = textEl.value.trim();
      if (!text) { showError(view, t('qr.errEmpty')); return; }
      clearError(view);
      preview.innerHTML = '';
      const ecc = QRCode.CorrectLevel[eccEl.value];
      try {
        new QRCode(preview, {
          text, width: 256, height: 256,
          colorDark: '#000000', colorLight: '#ffffff',
          correctLevel: ecc,
        });
        setTimeout(() => {
          const node = $('img', preview) || $('canvas', preview);
          if (node) {
            node.style.width = '100%';
            node.style.height = '100%';
            node.style.aspectRatio = '1 / 1';
            node.style.objectFit = 'contain';
          }
        }, 30);
        dlBtn.style.display = 'inline-flex';
      } catch (e) {
        showError(view, e.message);
      }
    }

    genBtn.addEventListener('click', generate);
    textEl.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') generate(); });

    dlBtn.addEventListener('click', () => {
      const size = sizeEl ? parseInt(sizeEl.value, 10) : 1024;
      const srcCanvas = $('canvas', preview);
      const srcImg = $('img', preview);
      const source = srcCanvas || srcImg;
      if (!source) return;
      
      const out = document.createElement('canvas');
      out.width = size;
      out.height = size;
      const ctx = out.getContext('2d');
      ctx.imageSmoothingEnabled = false; 
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(source, 0, 0, size, size);
      out.toBlob((blob) => {
        downloadBlob(blob, 'MonoTools-QR-HighRes.png');
      }, 'image/png');
    });
  }

  /* ======================================================================
     BACKGROUND REMOVER
     ====================================================================== */
  let _tfMod = null, _bgModel = null, _bgProcessor = null;

  function otsuThreshold(mask) {
    // Automatically finds the best cut point between foreground/background
    // in the AI mask's histogram, per image, instead of a fixed guess.
    const hist = new Array(256).fill(0);
    for (let i = 0; i < mask.length; i++) hist[mask[i]]++;
    const total = mask.length;
    let sum = 0;
    for (let t = 0; t < 256; t++) sum += t * hist[t];

    let sumB = 0, wB = 0, maxVar = -1, threshold = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      const wF = total - wB;
      if (wF === 0) break;
      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      if (varBetween > maxVar) { maxVar = varBetween; threshold = t; }
    }
    // Never trust an extreme, near-degenerate split (near-uniform mask) —
    // fall back to a safe mid-point in that case.
    return (threshold < 10 || threshold > 245) ? 128 : threshold;
  }

  // Separable min/max filter (box erosion/dilation) over a 0/1 mask.
  function boxFilter(mask, w, h, radius, mode) {
    const tmp = new Uint8Array(w * h);
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const rowOff = y * w;
      for (let x = 0; x < w; x++) {
        let val = mode === 'max' ? 0 : 1;
        const xs = Math.max(0, x - radius), xe = Math.min(w - 1, x + radius);
        for (let xx = xs; xx <= xe; xx++) {
          const v = mask[rowOff + xx];
          if (mode === 'max') { if (v > val) val = v; } else { if (v < val) val = v; }
        }
        tmp[rowOff + x] = val;
      }
    }
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        let val = mode === 'max' ? 0 : 1;
        const ys = Math.max(0, y - radius), ye = Math.min(h - 1, y + radius);
        for (let yy = ys; yy <= ye; yy++) {
          const v = tmp[yy * w + x];
          if (mode === 'max') { if (v > val) val = v; } else { if (v < val) val = v; }
        }
        out[y * w + x] = val;
      }
    }
    return out;
  }

  // Erosion then dilation: shaves off thin spurs/tendrils (stray edges,
  // leaked background slivers) while leaving the bulky main subject intact.
  function morphOpen(mask, w, h, radius) {
    return boxFilter(boxFilter(mask, w, h, radius, 'min'), w, h, radius, 'max');
  }

  // Keeps only the connected regions that are a meaningful fraction of the
  // largest one — drops small isolated islands of leaked background/noise.
  function keepLargeComponents(mask, w, h, minRatio) {
    const total = w * h;
    const labels = new Int32Array(total).fill(-1);
    const stack = new Int32Array(total);
    const sizes = [];
    let compId = 0;

    for (let i = 0; i < total; i++) {
      if (mask[i] === 1 && labels[i] === -1) {
        let sp = 0;
        stack[sp++] = i;
        labels[i] = compId;
        let count = 0;
        while (sp > 0) {
          const idx = stack[--sp];
          count++;
          const x = idx % w, y = (idx / w) | 0;
          if (x > 0) { const n = idx - 1; if (mask[n] === 1 && labels[n] === -1) { labels[n] = compId; stack[sp++] = n; } }
          if (x < w - 1) { const n = idx + 1; if (mask[n] === 1 && labels[n] === -1) { labels[n] = compId; stack[sp++] = n; } }
          if (y > 0) { const n = idx - w; if (mask[n] === 1 && labels[n] === -1) { labels[n] = compId; stack[sp++] = n; } }
          if (y < h - 1) { const n = idx + w; if (mask[n] === 1 && labels[n] === -1) { labels[n] = compId; stack[sp++] = n; } }
        }
        sizes.push(count);
        compId++;
      }
    }
    if (sizes.length === 0) return mask;

    let maxSize = 0;
    for (const s of sizes) if (s > maxSize) maxSize = s;
    const keep = sizes.map(s => s >= maxSize * minRatio);

    const out = new Uint8Array(total);
    for (let i = 0; i < total; i++) {
      if (mask[i] === 1 && keep[labels[i]]) out[i] = 1;
    }
    return out;
  }

  // Shrinks the mask to a capped working resolution before running the
  // (relatively expensive) morphology/labeling passes. This is not a
  // quality compromise: the AI model itself only ever segments at ~1024px,
  // then the mask is upscaled to the full photo size — so real detail is
  // already capped well below that, and cleaning up at a smaller size is
  // both far faster and just as accurate.
  function downsampleMask(mask, w, h, maxDim) {
    const scale = Math.min(1, maxDim / Math.max(w, h));
    if (scale === 1) return { data: mask, w, h, scale: 1 };
    const nw = Math.max(1, Math.round(w * scale));
    const nh = Math.max(1, Math.round(h * scale));
    const out = new Uint8ClampedArray(nw * nh);
    for (let y = 0; y < nh; y++) {
      const sy = Math.min(h - 1, Math.floor(y / scale));
      const rowOff = sy * w;
      for (let x = 0; x < nw; x++) {
        const sx = Math.min(w - 1, Math.floor(x / scale));
        out[y * nw + x] = mask[rowOff + sx];
      }
    }
    return { data: out, w: nw, h: nh, scale };
  }

  function upsampleBinaryMask(mask, mw, mh, w, h) {
    if (mw === w && mh === h) return mask;
    const out = new Uint8Array(w * h);
    const sx = mw / w, sy = mh / h;
    for (let y = 0; y < h; y++) {
      const my = Math.min(mh - 1, Math.floor(y * sy));
      const rowOff = my * mw;
      for (let x = 0; x < w; x++) {
        const mx = Math.min(mw - 1, Math.floor(x * sx));
        out[y * w + x] = mask[rowOff + mx];
      }
    }
    return out;
  }

  // Full cleanup pass on the AI mask: binarize at the auto threshold, shave
  // off thin leaked edges, then drop small disconnected noise blobs — while
  // keeping the ORIGINAL soft alpha values (not the binarized ones) for
  // every pixel that survives, so fur/edge softness is preserved. Runs on a
  // capped working resolution so it stays fast even on large phone photos.
  function cleanupMask(rawMask, w, h) {
    const WORK_MAX_DIM = 768;
    const { data: smallMask, w: sw, h: sh } = downsampleMask(rawMask, w, h, WORK_MAX_DIM);

    const tol = otsuThreshold(smallMask);
    const smallTotal = sw * sh;
    let binary = new Uint8Array(smallTotal);
    for (let i = 0; i < smallTotal; i++) binary[i] = smallMask[i] > tol ? 1 : 0;

    binary = morphOpen(binary, sw, sh, 2);
    binary = keepLargeComponents(binary, sw, sh, 0.02);

    const fullBinary = upsampleBinaryMask(binary, sw, sh, w, h);

    const total = w * h;
    const finalAlpha = new Uint8ClampedArray(total);
    for (let i = 0; i < total; i++) finalAlpha[i] = fullBinary[i] ? rawMask[i] : 0;
    return finalAlpha;
  }

  function initBgRemover() {
    const view = $('#view-bg');
    if (!view) return;
    const zone = $('#bgZone', view);
    const input = $('#bgInput', view);
    const work = $('#bgWork', view);
    const preview = $('#bgPreview', view);

    let currentBlob = null;

    wireUploadZone(zone, input, async (file) => {
      clearError(work);
      preview.classList.add('active');
      preview.innerHTML = '';

      const wrap = spinner(t('bg.loading'));
      preview.appendChild(wrap);

      try {
        if (!_bgModel) {
          _tfMod = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
          _tfMod.env.allowLocalModels = false;
          const p = $('p', wrap); if(p) p.textContent = t('bg.model');
          _bgModel = await _tfMod.AutoModel.from_pretrained('briaai/RMBG-1.4', { config: { model_type: 'custom' } });
          _bgProcessor = await _tfMod.AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
            config: { do_normalize: true, do_pad: false, do_rescale: true, do_resize: true, image_mean: [0.5, 0.5, 0.5], image_std: [1.0, 1.0, 1.0], resample: 2, rescale_factor: 0.00392156862745098, size: { width: 1024, height: 1024 } }
          });
        }
        
        const p = $('p', wrap); if(p) p.textContent = t('bg.processing');
        const url = URL.createObjectURL(file);
        const image = await _tfMod.RawImage.fromURL(url);
        const { pixel_values } = await _bgProcessor(image);
        const { output } = await _bgModel({ input: pixel_values });
        const mask = await _tfMod.RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);

        const w = image.width, h = image.height;
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const rawCtx = c.getContext('2d'); rawCtx.drawImage(image.toCanvas(), 0, 0);
        const rawImgData = rawCtx.getImageData(0, 0, w, h);

        const cleanAlpha = cleanupMask(mask.data, w, h);
        const pd = new ImageData(new Uint8ClampedArray(rawImgData.data), w, h);
        for (let i = 0; i < cleanAlpha.length; ++i) {
          pd.data[4 * i + 3] = cleanAlpha[i];
        }

        const tempC = document.createElement('canvas'); tempC.width = w; tempC.height = h;
        tempC.getContext('2d').putImageData(pd, 0, 0);
        currentBlob = await new Promise(r => tempC.toBlob(r, 'image/png'));

        preview.innerHTML = '';
        const imgWrap = el('div', { class: 'preview-img-wrap' });
        const outImg = el('img', { alt: t('bg.done') }); outImg.src = URL.createObjectURL(currentBlob);
        outImg.style.background = 'repeating-conic-gradient(rgba(0,0,0,0.05) 0% 25%, #ffffff 0% 50%) 50% / 16px 16px';
        imgWrap.appendChild(outImg);

        const info = el('div', { class: 'result-info' },
          el('span', { class: 'result-info-item' }, t('bg.done'), ' — ', el('strong', {}, formatBytes(currentBlob.size)))
        );
        const dlBtn = el('button', {
          class: 'btn btn-block', html: ICONS.download + ' ' + t('bg.download'),
          onclick: () => downloadBlob(currentBlob, 'monotools-nobg.png')
        });
        preview.append(imgWrap, info, dlBtn);

      } catch (e) {
        console.error(e);
        preview.classList.remove('active');
        preview.innerHTML = '';
        showError(work, t('bg.errFail'));
      }
    });
  }

  /* ======================================================================
     IMAGE COMPRESSOR
     ====================================================================== */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function initCompressor() {
    const view = $('#view-compress');
    if (!view) return;
    const zone = $('#compressZone', view);
    const input = $('#compressInput', view);
    const work = $('#compressWork', view);
    const preview = $('#compressPreview', view);

    const MAX_DIM = 1920;       // cap huge photos down before compressing
    const TARGET_BYTES = 1024 * 1024; // 1MB ceiling

    let _origSize = 0, _origName = 'image', currentBlob = null;

    function encodeAt(canvas, quality) {
      return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    }

    // Finds the HIGHEST JPEG quality that still lands under the 1MB target.
    // Tries full quality first (many images won't even need reduction), then
    // binary-searches for the best quality/size tradeoff otherwise.
    async function findBestQuality(canvas, maxBytes) {
      const fullQuality = await encodeAt(canvas, 1);
      if (fullQuality.size <= maxBytes) return fullQuality;

      let lo = 0.05, hi = 0.98, best = null;
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        const blob = await encodeAt(canvas, mid);
        if (blob.size <= maxBytes) { best = blob; lo = mid; }
        else { hi = mid; }
      }
      // Extremely large/detailed image that can't fit even at the lowest
      // tried quality — return the smallest one we found rather than fail.
      return best || await encodeAt(canvas, lo);
    }

    async function renderCompressed(canvas) {
      currentBlob = await findBestQuality(canvas, TARGET_BYTES);

      preview.classList.add('active');
      preview.innerHTML = '';
      const wrap = el('div', { class: 'preview-img-wrap' });
      const outImg = el('img', { alt: t('compress.title') });
      outImg.src = URL.createObjectURL(currentBlob);
      wrap.appendChild(outImg);

      const reduction = _origSize > 0 ? Math.round((1 - currentBlob.size / _origSize) * 100) : 0;
      const info = el('div', { class: 'result-info' },
        el('span', { class: 'result-info-item' }, t('compress.originalSize') + ': ', el('strong', {}, formatBytes(_origSize))),
        el('span', { class: 'result-info-item' }, t('compress.compressedSize') + ': ', el('strong', {}, formatBytes(currentBlob.size))),
        el('span', { class: 'result-info-item' }, el('strong', {}, (reduction >= 0 ? '-' : '+') + Math.abs(reduction) + '%'))
      );
      const dlBtn = el('button', {
        class: 'btn btn-block', html: ICONS.download + ' ' + t('compress.download'),
        onclick: () => downloadBlob(currentBlob, _origName + '-compressed.jpg')
      });
      preview.append(wrap, info, dlBtn);
    }

    wireUploadZone(zone, input, async (file) => {
      clearError(work);
      preview.classList.remove('active');
      preview.innerHTML = '';
      preview.classList.add('active');
      preview.appendChild(spinner(t('processing')));

      _origSize = file.size;
      _origName = (file.name || 'image').replace(/\.[^.]+$/, '');
      const url = URL.createObjectURL(file);

      try {
        const img = await loadImage(url);
        // Only shrink genuinely large photos — never upscale, never touch
        // images that are already within bounds.
        const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        // JPEG has no alpha channel — without this, any transparent area
        // in the source (e.g. a PNG logo) would render as solid black
        // instead of white once flattened.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        await renderCompressed(canvas);
      } catch (e) {
        console.error(e);
        preview.classList.remove('active');
        preview.innerHTML = '';
        showError(work, t('compress.errFail'));
      } finally {
        URL.revokeObjectURL(url);
      }
    });
  }

  function initPfp() {
    const view = $('#view-pfp');
    if (!view) return;
    const zone = $('#pfpZone', view);
    const input = $('#pfpInput', view);
    const work = $('#pfpWork', view);
    const editor = $('#pfpEditor', view);
    const frame = $('#pfpCropFrame', view);
    const cropImg = $('#pfpCropImg', view);
    const downloadBtn = $('#pfpDownloadBtn', view);
    const preview = $('#pfpPreview', view);

    const MIN_SCALE = 1, MAX_SCALE = 4;
    let naturalW = 0, naturalH = 0, baseScale = 1, userScale = 1;
    let left = 0, top = 0;
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    let currentUrl = null;
    const pointers = new Map();
    let pinchStartDist = 0, pinchStartScale = 1;

    function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
    function frameSize() { return frame.clientWidth || 280; }

    function applyTransform() {
      const fs = frameSize();
      const w = naturalW * baseScale * userScale;
      const h = naturalH * baseScale * userScale;
      const minLeft = Math.min(0, fs - w);
      const minTop = Math.min(0, fs - h);
      left = clamp(left, minLeft, 0);
      top = clamp(top, minTop, 0);
      cropImg.style.width = w + 'px';
      cropImg.style.height = h + 'px';
      cropImg.style.left = left + 'px';
      cropImg.style.top = top + 'px';
    }

    function resetView() {
      const fs = frameSize();
      baseScale = fs / Math.min(naturalW, naturalH);
      userScale = 1;
      left = (fs - naturalW * baseScale) / 2;
      top = (fs - naturalH * baseScale) / 2;
      applyTransform();
    }

    frame.addEventListener('pointerdown', (e) => {
      frame.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        startLeft = left; startTop = top;
        frame.classList.add('dragging');
      } else if (pointers.size === 2) {
        dragging = false;
        const pts = [...pointers.values()];
        pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartScale = userScale;
      }
    });

    frame.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchStartDist > 0) {
          userScale = clamp(pinchStartScale * (dist / pinchStartDist), MIN_SCALE, MAX_SCALE);
          applyTransform();
        }
      } else if (dragging && pointers.size === 1) {
        left = startLeft + (e.clientX - startX);
        top = startTop + (e.clientY - startY);
        applyTransform();
      }
    });

    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStartDist = 0;
      if (pointers.size === 0) {
        dragging = false;
        frame.classList.remove('dragging');
      }
    }
    frame.addEventListener('pointerup', endPointer);
    frame.addEventListener('pointercancel', endPointer);

    frame.addEventListener('wheel', (e) => {
      e.preventDefault();
      userScale = clamp(userScale - e.deltaY * 0.001, MIN_SCALE, MAX_SCALE);
      applyTransform();
    }, { passive: false });

    window.addEventListener('resize', () => {
      if (editor.style.display !== 'none' && naturalW) applyTransform();
    });

    function buildOutputCanvas() {
      const fs = frameSize();
      const displayScale = baseScale * userScale;
      const cropX = -left / displayScale;
      const cropY = -top / displayScale;
      const cropSize = fs / displayScale;

      const outputSize = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');

      // Clip to a circle, then draw exactly the region the user framed —
      // everything outside the circle stays fully transparent.
      ctx.save();
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(cropImg, cropX, cropY, cropSize, cropSize, 0, 0, outputSize, outputSize);
      ctx.restore();
      return canvas;
    }

    downloadBtn.addEventListener('click', async () => {
      clearError(work);
      try {
        const canvas = buildOutputCanvas();
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));

        preview.classList.add('active');
        preview.innerHTML = '';
        const wrap = el('div', { class: 'preview-img-wrap' });
        const outImg = el('img', { alt: t('pfp.title') });
        outImg.src = URL.createObjectURL(blob);
        outImg.style.background = 'repeating-conic-gradient(rgba(0,0,0,0.05) 0% 25%, #ffffff 0% 50%) 50% / 16px 16px';
        wrap.appendChild(outImg);

        const info = el('div', { class: 'result-info' },
          el('span', { class: 'result-info-item' }, `${canvas.width} × ${canvas.height}px`),
          el('span', { class: 'result-info-item' }, el('strong', {}, formatBytes(blob.size)))
        );
        preview.append(wrap, info);

        downloadBlob(blob, 'profile-picture.png');
      } catch (e) {
        console.error(e);
        showError(work, t('pfp.errFail'));
      }
    });

    wireUploadZone(zone, input, async (file) => {
      clearError(work);
      editor.style.display = 'none';
      preview.classList.remove('active');
      preview.innerHTML = '';

      if (currentUrl) URL.revokeObjectURL(currentUrl);
      const url = URL.createObjectURL(file);
      currentUrl = url;

      try {
        await new Promise((resolve, reject) => {
          cropImg.onload = resolve;
          cropImg.onerror = reject;
          cropImg.src = url;
        });
        naturalW = cropImg.naturalWidth;
        naturalH = cropImg.naturalHeight;
        editor.style.display = 'block';
        requestAnimationFrame(resetView);
      } catch (e) {
        console.error(e);
        showError(work, t('pfp.errFail'));
      }
    });
  }

  /* ======================================================================
     YOUTUBE THUMBNAIL DOWNLOADER 
     ====================================================================== */
  function extractYouTubeId(url) {
    if (!url) return null;
    const s = url.trim();
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/,
      /[?&]v=([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = s.match(p);
      if (m) return m[1];
    }
    return null;
  }

  const THUMB_VARIANTS = [
    { id: 'maxresdefault', label: 'Max Res', w: 1280, h: 720 },
    { id: 'sddefault',    label: 'SD',      w: 640,  h: 480 },
    { id: 'hqdefault',    label: 'HQ',      w: 480,  h: 360 },
    { id: 'mqdefault',    label: 'MQ',      w: 320,  h: 180 },
    { id: 'default',      label: 'Default', w: 120,  h: 90  },
  ];

  function probeImage(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  function initYouTube() {
    const view = $('#view-youtube');
    if (!view) return;
    const urlEl = $('#ytUrl', view);
    const fetchBtn = $('#ytFetch', view);
    const work = $('#ytWork', view);
    const results = $('#ytResults', view);

    async function fetchThumbs() {
      clearError(work);
      const url = urlEl.value.trim();
      if (!url) { showError(work, t('yt.errEmpty')); return; }
      const id = extractYouTubeId(url);
      if (!id) { showError(work, t('yt.errInvalid')); return; }

      results.innerHTML = '';
      results.appendChild(spinner(t('yt.searching')));

      const checks = await Promise.all(THUMB_VARIANTS.map(async v => {
        const direct = `https://i.ytimg.com/vi/${id}/${v.id}.jpg`;
        const ok = await probeImage(direct);
        return { ...v, direct, ok };
      }));

      results.innerHTML = '';
      const available = checks.filter(c => c.ok);
      if (available.length === 0) {
        showError(work, t('yt.errInvalid'));
        return;
      }
      available.forEach(v => {
        const card = el('div', { class: 'yt-thumb-card' });
        const prev = el('div', { class: 'yt-thumb-preview' });
        const img = el('img', { alt: v.label, loading: 'lazy', src: v.direct });
        prev.appendChild(img);

        const meta = el('div', { class: 'yt-thumb-meta' },
          el('div', { class: 'yt-thumb-meta-info' },
            el('strong', {}, `${v.label} (${v.w}×${v.h})`),
            el('span', {}, `${v.id}.jpg`)
          ),
          el('button', {
            class: 'btn', html: ICONS.download + ' ' + t('yt.download'),
            onclick: async (e) => {
              const btn = e.currentTarget;
              btn.disabled = true;
              const original = btn.innerHTML;
              btn.innerHTML = '…';
              try {
                const proxied = 'https://images.weserv.nl/?url=' + encodeURIComponent('i.ytimg.com/vi/' + id + '/' + v.id + '.jpg');
                const res = await fetch(proxied);
                if (!res.ok) throw new Error('proxy');
                const blob = await res.blob();
                downloadBlob(blob, `${id}_${v.id}.jpg`);
              } catch (err) {
                window.open(v.direct, '_blank');
              } finally {
                btn.disabled = false;
                btn.innerHTML = original;
              }
            }
          })
        );
        card.append(prev, meta);
        results.appendChild(card);
      });
    }

    fetchBtn.addEventListener('click', fetchThumbs);
    urlEl.addEventListener('keydown', e => { if (e.key === 'Enter') fetchThumbs(); });
  }

  /* ======================================================================
     IMAGE TO PDF 
     ====================================================================== */
  function initPdf() {
    const view = $('#view-pdf');
    if (!view) return;
    const zone = $('#pdfZone', view);
    const input = $('#pdfInput', view);
    const list = $('#pdfList', view);
    const orientGroup = $('#pdfOrient', view);
    const sizeSel = $('#pdfSize', view);
    const genBtn = $('#pdfGen', view);
    const work = $('#pdfWork', view);
    const preview = $('#pdfPreview', view);
    const files = [];
    let orientation = 'p';

    $$('.scale-option', orientGroup).forEach(opt => {
      opt.addEventListener('click', () => {
        $$('.scale-option', orientGroup).forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        orientation = opt.dataset.orient;
      });
    });

    wireUploadZone(zone, input, (file) => {
      if (!file.type.startsWith('image/')) return;
      files.push({ file, url: URL.createObjectURL(file), name: file.name, size: file.size });
      renderList();
    });

    function renderList() {
      list.innerHTML = '';
      list.style.display = files.length ? 'block' : 'none';
      genBtn.style.display = files.length ? 'inline-flex' : 'none';
      files.forEach((f, i) => {
        const row = el('div', { class: 'pdf-file-row' },
          el('img', { src: f.url, alt: f.name }),
          el('span', { class: 'pdf-file-name' }, `${i + 1}. ${f.name}`),
          el('span', { class: 'pdf-file-size' }, formatBytes(f.size)),
          el('button', {
            class: 'pdf-file-del', html: t('pdf.remove'),
            onclick: () => {
              URL.revokeObjectURL(f.url);
              files.splice(i, 1);
              renderList();
            }
          })
        );
        list.appendChild(row);
      });
    }

    genBtn.addEventListener('click', async () => {
      if (files.length === 0) { showError(work, t('pdf.errEmpty')); return; }
      clearError(work);
      preview.classList.add('active');
      preview.innerHTML = '';
      preview.appendChild(spinner(t('pdf.processing')));

      try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation, unit: 'pt', format: sizeSel.value });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 24;
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;

        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const img = await loadImage(f.url);
          const w = img.naturalWidth, h = img.naturalHeight;
          const ratio = Math.min(maxW / w, maxH / h);
          let dw = w, dh = h;
          if (ratio < 1) { dw = w * ratio; dh = h * ratio; }
          else { dw = maxW; dh = maxW * (h / w); if (dh > maxH) { dh = maxH; dw = maxH * (w / h); } }

          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

          if (i > 0) pdf.addPage();
          const x = (pageW - dw) / 2;
          const y = (pageH - dh) / 2;
          pdf.addImage(dataUrl, 'JPEG', x, y, dw, dh);
        }

        const blob = pdf.output('blob');
        preview.innerHTML = '';
        const info = el('div', { class: 'result-info' },
          el('span', { class: 'result-info-item' }, t('pdf.images') + ': ', el('strong', {}, String(files.length))),
          el('span', { class: 'result-info-item' }, t('pdf.size') + ': ', el('strong', {}, formatBytes(blob.size)))
        );
        const dlBtn = el('button', {
          class: 'btn btn-block', html: ICONS.download + ' ' + t('pdf.download'),
          onclick: () => downloadBlob(blob, 'monotools-images.pdf')
        });
        preview.append(info, dlBtn);
      } catch (e) {
        preview.classList.remove('active');
        preview.innerHTML = '';
        showError(work, e.message || 'error');
      }
    });
  }

  function reRenderDynamic() {
    const pdfList = $('#pdfList');
    if (pdfList) {
      $$('.pdf-file-del', pdfList).forEach(b => { b.textContent = t('pdf.remove'); });
    }
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  function boot() {
    $('#year').textContent = new Date().getFullYear();

    $('#navToggle')?.addEventListener('click', () => $('#mainNav').classList.toggle('open'));
    $('#langToggle')?.addEventListener('click', () => applyLang(curLang === 'en' ? 'ar' : 'en'));

    // Each init function guards itself if its tool isn't on the current
    // page, so it's safe to call all of them on every page.
    initQR();
    initBgRemover();
    initCompressor();
    initPfp();
    initYouTube();
    initPdf();

    applyLang(curLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();