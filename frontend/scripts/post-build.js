const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const publicDir = path.join(__dirname, '..', 'public');
const indexPath = path.join(distDir, 'index.html');

// 1. Copy all public assets to dist
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, distDir, { recursive: true });
  console.log('✅ Copied public/ assets to dist/');
}

// 2. Patch index.html with PWA tags if not present
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  const pwaTags = `
    <!-- PWA Manifest & Meta Tags -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0066CC" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="CarePulse" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  `;

  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `${pwaTags}\n  </head>`);
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('✅ Patched dist/index.html with PWA meta tags');
  }
}
