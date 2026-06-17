# DocFlow — Document & Image Toolkit

> Production-ready PDF and image processing platform built on Cloudflare Pages.  
> All processing is browser-local. No files ever leave the user's device.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Environment Variables](#environment-variables)
4. [KV Namespace Schema](#kv-namespace-schema)
5. [API Route Map](#api-route-map)
6. [Component Map](#component-map)
7. [Utility Engine Design](#utility-engine-design)
8. [Cloudflare Free Tier Budget](#cloudflare-free-tier-budget)
9. [Deployment Guide](#deployment-guide)
10. [Local Development](#local-development)
11. [Testing](#testing)
12. [Performance Targets](#performance-targets)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│                                                              │
│  React SPA (Vite + TypeScript + Tailwind)                   │
│  ├── pdf-lib        → PDF create/edit/merge/split/protect   │
│  ├── pdfjs-dist     → PDF render → canvas → PNG/JPG         │
│  ├── browser-image-compression → resize/compress images     │
│  ├── Canvas API     → crop/convert/format images            │
│  ├── @imgly/bg-removal → AI background removal (WASM)       │
│  ├── Tesseract.js   → OCR (WASM, runs entirely in browser)  │
│  ├── qrcode         → QR code generation (canvas)           │
│  ├── jsqr           → QR code scanning (canvas)             │
│  ├── Fuse.js        → instant client-side search            │
│  └── IndexedDB      → cache WASM models, processed results  │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │ fetch /api/*  (only analytics + sitemap)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Pages + Functions                    │
│                                                              │
│  functions/                                                  │
│  ├── _middleware.ts     → security headers, rate limit       │
│  ├── api/               │                                    │
│  │   ├── analytics.ts   → batched KV writes (POST only)     │
│  │   ├── sitemap.ts     → dynamic sitemap.xml (cached 1h)   │
│  │   └── stats.ts       → read tool popularity (GET)        │
│  └── sitemap.xml.ts     → edge-cached XML generation        │
│                                                              │
│  KV Namespace: DOCFLOW_KV                                    │
│  ├── "stats:tools"      → { [slug]: count }   (JSON)       │
│  ├── "stats:daily:DATE" → { total, byTool }   (JSON, 7d TTL)│
│  └── "sitemap:cache"    → XML string          (1h TTL)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Processing Decision Tree

```
File uploaded by user
       │
       ▼
Is it a file operation?  ──yes──►  Browser API (pdf-lib / Canvas)
       │
       no
       ▼
Is it AI? (bg removal, OCR)  ──yes──►  WASM in browser (zero upload)
       │
       no
       ▼
Is it analytics?  ──yes──►  POST /api/analytics (batched, no PII)
       │
       no
       ▼
Is it sitemap/SEO?  ──yes──►  GET /api/sitemap (edge-cached 1h)
```

---

## Folder Structure

```
docflow/
│
├── public/                          # Static assets (Cloudflare Pages serves directly)
│   ├── _headers                     # Cache-Control, CSP, security headers
│   ├── _redirects                   # SPA fallback + /api/* passthrough
│   ├── manifest.json                # PWA manifest
│   ├── robots.txt                   # Crawl directives
│   ├── favicon.svg                  # SVG favicon
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
│
├── functions/                       # Cloudflare Pages Functions (edge workers)
│   ├── _middleware.ts               # Global: rate limit, CSP, security headers
│   └── api/
│       ├── analytics.ts             # POST → batch-write tool usage to KV
│       ├── stats.ts                 # GET  → read tool popularity from KV
│       └── sitemap.ts               # GET  → generate + cache sitemap XML
│
├── src/
│   ├── main.tsx                     # React entry: StrictMode + HelmetProvider
│   ├── App.tsx                      # BrowserRouter + SearchProvider + lazy routes
│   ├── index.css                    # Tailwind base + design tokens + components
│   │
│   ├── types/
│   │   └── index.ts                 # All shared TypeScript interfaces
│   │
│   ├── data/
│   │   ├── tools.ts                 # Tool registry (id, slug, name, meta, FAQs)
│   │   ├── blog.ts                  # Static blog posts (markdown content)
│   │   └── faq.ts                   # FAQ data per tool and homepage
│   │
│   ├── context/
│   │   └── SearchContext.tsx        # Fuse.js search state + keyboard nav
│   │
│   ├── hooks/
│   │   ├── useFileProcess.ts        # Status machine: idle→processing→done→error
│   │   └── useAnalytics.ts          # Fire-and-forget analytics events
│   │
│   ├── lib/
│   │   ├── pdf/
│   │   │   └── operations.ts        # pdf-lib wrappers: compress/merge/split/etc
│   │   ├── image/
│   │   │   └── operations.ts        # Canvas + browser-image-compression wrappers
│   │   ├── idb.ts                   # IndexedDB cache (WASM models, results)
│   │   └── validation.ts            # File type/size/name sanitization
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx           # Sticky header + search bar + mobile nav
│   │   │   ├── Footer.tsx           # 4-column footer + links
│   │   │   └── Layout.tsx           # Header + <main> + Footer wrapper
│   │   │
│   │   ├── ui/                      # Primitive reusable components (no business logic)
│   │   │   ├── Button.tsx           # primary / secondary / ghost / danger
│   │   │   ├── Badge.tsx            # blue / green / orange / gray
│   │   │   ├── Input.tsx            # label + error + hint
│   │   │   ├── Select.tsx           # label + options + error
│   │   │   ├── Slider.tsx           # range input with custom track/thumb
│   │   │   ├── ProgressBar.tsx      # value + label + variant
│   │   │   ├── DropZone.tsx         # react-dropzone wrapper with accept/size
│   │   │   ├── FileItem.tsx         # file row: name, size, savings, download
│   │   │   ├── ToolCard.tsx         # link card with icon, name, badge
│   │   │   ├── Breadcrumb.tsx       # Home → Tools → Tool Name
│   │   │   ├── SEOHead.tsx          # react-helmet-async meta + schema
│   │   │   └── SearchBar.tsx        # controlled search + dropdown results
│   │   │
│   │   ├── sections/                # Homepage / landing page sections
│   │   │   ├── Hero.tsx             # Headline + CTAs + trust strip
│   │   │   ├── ToolCategories.tsx   # 3-column PDF / Image / Utils cards
│   │   │   ├── PopularTools.tsx     # 4-column popular tools grid
│   │   │   ├── Statistics.tsx       # 4 key stats (30+ tools, 100% browser, etc.)
│   │   │   ├── Features.tsx         # 6-feature grid (privacy, speed, edge, etc.)
│   │   │   ├── BlogPreview.tsx      # 3 featured blog post cards
│   │   │   ├── FAQ.tsx              # Accordion FAQ with schema support
│   │   │   └── CTA.tsx              # Blue full-width call to action
│   │   │
│   │   └── tools/
│   │       ├── ToolLayout.tsx       # Shared wrapper: header, steps, about, related, FAQ
│   │       │
│   │       ├── pdf/                 # 13 PDF tool components
│   │       │   ├── PDFCompress.tsx
│   │       │   ├── PDFMerge.tsx
│   │       │   ├── PDFSplit.tsx
│   │       │   ├── PDFToImages.tsx
│   │       │   ├── ImagesToPDF.tsx
│   │       │   ├── PDFRotate.tsx
│   │       │   ├── PDFReorder.tsx
│   │       │   ├── PDFProtect.tsx
│   │       │   ├── PDFUnlock.tsx
│   │       │   ├── PDFWatermark.tsx
│   │       │   ├── PDFExtract.tsx
│   │       │   ├── PDFMetadata.tsx
│   │       │   └── PDFPreview.tsx
│   │       │
│   │       ├── image/               # 9 Image tool components
│   │       │   ├── ImageCompress.tsx
│   │       │   ├── ResizeImage.tsx
│   │       │   ├── CropImage.tsx
│   │       │   ├── JPGtoPNG.tsx
│   │       │   ├── PNGtoJPG.tsx
│   │       │   ├── WEBPConverter.tsx
│   │       │   ├── BackgroundRemover.tsx
│   │       │   ├── ImageConverter.tsx
│   │       │   └── BulkImage.tsx
│   │       │
│   │       └── utils/               # 5 Utility tool components
│   │           ├── QRGenerator.tsx
│   │           ├── QRScanner.tsx
│   │           ├── OCRTool.tsx
│   │           ├── TextToPDF.tsx
│   │           └── ScreenshotToPDF.tsx
│   │
│   └── pages/                       # Route-level page components
│       ├── Home.tsx                 # All homepage sections assembled
│       ├── Tools.tsx                # Tools directory with search + filter
│       ├── About.tsx                # Company info, privacy commitment
│       ├── Privacy.tsx              # Full privacy policy
│       ├── Terms.tsx                # Terms of service
│       ├── Blog.tsx                 # Blog list with category filter + pagination
│       ├── BlogPost.tsx             # Single post with markdown renderer
│       └── NotFound.tsx             # 404 page
│
├── index.html                       # Vite entry (meta tags, fonts, schema)
├── vite.config.ts                   # Code splitting, aliases, worker support
├── tailwind.config.ts               # Design tokens, custom shadows, animations
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── wrangler.toml                    # KV bindings, env vars, Pages config
├── .env.example                     # Template for environment variables
├── .gitignore
└── README.md                        # This file
```

---

## Environment Variables

### `.env.example` (copy to `.env` for local dev)

```bash
# ── Cloudflare ──────────────────────────────────────────────
# Obtained from: Cloudflare Dashboard → Workers & Pages → KV
DOCFLOW_KV_ID=                  # KV namespace ID (production)
DOCFLOW_KV_PREVIEW_ID=          # KV namespace ID (preview/dev)

# ── Application ─────────────────────────────────────────────
VITE_SITE_URL=https://docflow.pages.dev   # Public site URL (no trailing slash)
VITE_SITE_NAME=DocFlow
VITE_MAX_FILE_SIZE_MB=100               # Client-side file size limit

# ── Features ────────────────────────────────────────────────
VITE_ENABLE_ANALYTICS=true      # Set false to disable analytics pings
```

### Setting secrets in Cloudflare Dashboard

```
Dashboard → Workers & Pages → docflow → Settings → Environment Variables

Production:
  ENVIRONMENT = production

Preview:
  ENVIRONMENT = preview
```

### How to create the KV Namespace

```bash
# 1. Install wrangler globally
npm install -g wrangler

# 2. Authenticate
wrangler login

# 3. Create namespace
wrangler kv namespace create DOCFLOW_KV
# → outputs: id = "xxxxxxxxxxxx"

# 4. Create preview namespace
wrangler kv namespace create DOCFLOW_KV --preview
# → outputs: preview_id = "xxxxxxxxxxxx"

# 5. Paste both IDs into wrangler.toml under [[kv_namespaces]]
```

---

## KV Namespace Schema

**Namespace binding:** `DOCFLOW_KV`  
**Free tier limits:** 100K reads/day · 1K writes/day · 1K deletes/day · 1GB storage

### Key Design (minimal writes, maximum caching)

```
Key                          Value                              TTL        Write Trigger
─────────────────────────────────────────────────────────────────────────────────────────
stats:tools                  { "pdf-compress": 1420, ... }     none       Batched every 10min
stats:daily:2024-01-15       { total: 580, tools: {...} }      7 days     Batched daily rollup
sitemap:cache                "<?xml version..."               1 hour     On GET /api/sitemap
```

### Write batching strategy

- Client accumulates events in `sessionStorage` during a session
- On `visibilitychange` (tab hidden/close) → flush batch to `/api/analytics`
- Server-side: read → merge → single write back to KV
- **Maximum 1 KV write per analytics flush** (regardless of how many tools used)
- Daily rollup: separate write triggered at UTC midnight if any traffic occurred

### Reads per page load

```
Page type          KV reads    Source
──────────────────────────────────────
Homepage           0           All static
Tool page          0           All static
/tools             0           All static
/api/sitemap       1           sitemap:cache (miss → 0 additional KV reads, recompute from static data)
/api/stats         1           stats:tools
Analytics flush    1r + 1w     stats:tools (read-modify-write)
```

**Estimated daily KV operations at 10,000 visitors:**
- Reads: ~300 (mostly sitemap cache hits after first)
- Writes: ~150 (batched analytics, well under 1K limit)

---

## API Route Map

All functions live in `functions/` and are auto-discovered by Cloudflare Pages.

```
Method  Path              Function file           Auth    Rate limit   Cache
──────────────────────────────────────────────────────────────────────────────
POST    /api/analytics    api/analytics.ts        none    20/min/IP    none
GET     /api/stats        api/stats.ts            none    60/min/IP    5min edge
GET     /api/sitemap      api/sitemap.ts          none    none         1h edge

(All other routes served as static SPA by _redirects fallback)
```

### `/api/analytics` — POST

**Request body:**
```json
{
  "events": [
    { "tool": "pdf-compress", "ts": 1705312000000 },
    { "tool": "merge-pdf",    "ts": 1705312040000 }
  ]
}
```

**Behavior:**
1. Validate: max 20 events per batch, only known tool slugs accepted
2. Read `stats:tools` from KV (single read)
3. Increment counts in memory
4. Write merged object back (single write)
5. Return `{ ok: true }`

**No PII stored.** No IP, no user-agent, no timestamps in KV.

### `/api/stats` — GET

**Response:**
```json
{
  "tools": { "pdf-compress": 1420, "merge-pdf": 980, ... },
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### `/api/sitemap` — GET

Returns `text/xml` sitemap. Built from static tool/blog data in `src/data/`.  
Cached in KV for 1 hour. `Cache-Control: public, max-age=3600`.

---

## Component Map

### Design System Primitives (`src/components/ui/`)

```
Component       Props summary                          Used in
────────────────────────────────────────────────────────────────
Button          variant, size, loading, icon           All tools
Badge           variant (blue/green/orange/gray)       ToolCard, ToolLayout
Input           label, error, hint                     tool forms
Select          label, options[], error                tool forms
Slider          min, max, value, displayValue          ImageCompress, quality controls
ProgressBar     value, label, variant                  all processing flows
DropZone        accept, multiple, maxSize, label       all upload flows
FileItem        name, size, status, downloadUrl        file list displays
ToolCard        tool: ToolMeta, compact?: bool         Tools page, PopularTools
Breadcrumb      crumbs: {label, href?}[]               ToolLayout
SEOHead         title, description, canonical, schema  all pages
SearchBar       placeholder, autoFocus                 Header, Tools page
```

### Tool Layout Shell (`src/components/tools/ToolLayout.tsx`)

Every tool page renders inside `ToolLayout` which provides:
- Breadcrumb navigation
- Tool icon + title + badges
- The tool interface (children)
- "How to use" 3-step guide
- "About" description section
- Related tools grid
- FAQ accordion
- JSON-LD WebApplication + FAQ schema

### State Machine per Tool

```
useFileProcess() hook:
  idle → uploading → processing → done
                                → error → idle (on reset)

Each tool manages its own local state for:
  - uploaded File[] 
  - configuration options (quality, format, password, etc.)
  - result Blob / Uint8Array / string
```

---

## Utility Engine Design

### PDF Engine (`src/lib/pdf/operations.ts`)

Built on `pdf-lib` (pure JS, no server needed).

```
Function              Input                  Output           Max size
──────────────────────────────────────────────────────────────────────
compressPDF()         File, level            Uint8Array       100 MB
mergePDFs()           File[]                 Uint8Array       50 MB each
splitPDF()            File, ranges[]         Uint8Array[]     100 MB
splitPDFEveryPage()   File                   Uint8Array[]     50 MB
rotatePDF()           File, deg, pages?      Uint8Array       100 MB
extractPages()        File, indices[]        Uint8Array       100 MB
reorderPages()        File, order[]          Uint8Array       100 MB
protectPDF()          File, passwords        Uint8Array       100 MB
unlockPDF()           File, password         Uint8Array       100 MB
addTextWatermark()    File, text, opts       Uint8Array       100 MB
editMetadata()        File, metadata         Uint8Array       100 MB
getMetadata()         File                   MetadataObj      100 MB
imagesToPDF()         File[], size, fit      Uint8Array       50 MB each
textToPDF()           string, opts           Uint8Array       N/A
```

PDF → Images rendering uses `pdfjs-dist` (renders via canvas, no server):
```
pdfToImages()         File, format, dpi      Blob[]           50 MB
```

### Image Engine (`src/lib/image/operations.ts`)

Built on native Canvas API + `browser-image-compression`.

```
Function                  Input                     Output
──────────────────────────────────────────────────────────────
compressImage()           File, quality, maxDim     File
resizeImage()             File, w, h, aspect        Blob
cropImage()               File, {x,y,w,h}           Blob
convertImageFormat()      File, format, quality     Blob
getImageDimensions()      File                      {w, h}
removeBackground()        File, onProgress          Blob        ← WASM (@imgly)
stripMetadata()           File                      Blob
bulkProcess()             File[], operation         Result[]
```

### IndexedDB Cache (`src/lib/idb.ts`)

Avoids re-downloading large WASM models (Tesseract, @imgly):
```
Store: "wasm-cache"    → key: model URL, value: ArrayBuffer
Store: "results"       → key: sha256(file), value: {blob, ts}   TTL: 1 hour
```

### Search Engine (`src/context/SearchContext.tsx`)

Fuse.js index built once at module load from `ALL_TOOLS` array.
```
Keys:   name (weight 0.5) · tags (weight 0.3) · shortDesc (weight 0.2)
Threshold: 0.35 (permissive enough for typos)
Results: max 12, ordered by score
```

---

## Cloudflare Free Tier Budget

| Resource             | Free Limit         | DocFlow Usage      | Headroom |
|----------------------|--------------------|--------------------|----------|
| Pages requests       | Unlimited          | N/A                | ✅ None  |
| Pages builds         | 500/month          | ~20/month          | ✅ 480   |
| Workers (Functions)  | 100K req/day       | ~1K req/day        | ✅ 99K   |
| KV reads             | 100K/day           | ~300/day           | ✅ 99.7K |
| KV writes            | 1K/day             | ~150/day           | ✅ 850   |
| KV storage           | 1 GB               | < 1 MB             | ✅ ~1GB  |
| Bandwidth            | Unlimited (Pages)  | N/A                | ✅ None  |

**Cost at scale:** $0/month until ~3M KV reads/day (would need paid plan then).

---

## Deployment Guide

### Prerequisites

```bash
node >= 18
npm >= 9
wrangler >= 3.17
```

### First-time setup

```bash
# 1. Clone and install
git clone <repo> docflow && cd docflow
npm install

# 2. Authenticate with Cloudflare
wrangler login

# 3. Create KV namespaces
wrangler kv namespace create DOCFLOW_KV
wrangler kv namespace create DOCFLOW_KV --preview

# 4. Update wrangler.toml with the output IDs:
#    id = "paste_production_id_here"
#    preview_id = "paste_preview_id_here"

# 5. Copy env template
cp .env.example .env
# Edit .env: set VITE_SITE_URL, etc.

# 6. Build and deploy
npm run deploy
```

### Connecting a custom domain

```
Dashboard → Workers & Pages → docflow → Custom domains
→ Add custom domain → docflow.yourdomain.com
```

Cloudflare automatically:
- Provisions TLS certificate
- Sets up DNS CNAME
- Routes traffic through edge network

### Environment Variables in Dashboard

```
Dashboard → Workers & Pages → docflow → Settings → Environment Variables

Add:
  ENVIRONMENT    = production
  (VITE_* vars are baked in at build time, not needed as runtime secrets)
```

---

## Local Development

```bash
# Start Vite dev server (SPA only, no Functions)
npm run dev
# → http://localhost:5173

# Start with Cloudflare Pages Functions (local workers)
npx wrangler pages dev dist --local
# (build first with: npm run build)

# Type checking
npm run typecheck

# Production build
npm run build
# → dist/ folder (serve with: npm run preview)
```

---

## Testing

### Manual test checklist per tool

```
[ ] Upload a valid file → correct result downloaded
[ ] Upload oversized file → clear error message
[ ] Upload wrong file type → clear error message
[ ] Upload corrupt file → graceful error, no crash
[ ] Process on mobile → layout intact, touch targets ≥ 44px
[ ] Progress indicator visible during processing
[ ] Download button appears after completion
[ ] "Process another" resets state cleanly
[ ] Tool page loads without JS → SEO content visible
```

### Lighthouse targets

Run: `npx lighthouse https://docflow.pages.dev --view`

```
Performance:     ≥ 95
Accessibility:   100
Best Practices:  100
SEO:             100
```

### Core Web Vitals targets

```
FCP (First Contentful Paint):  < 1.0s
LCP (Largest Contentful Paint): < 2.0s
CLS (Cumulative Layout Shift):  < 0.05
INP (Interaction to Next Paint): < 200ms
```

---

## SEO Strategy

### Per-tool schema markup

Each tool page emits:
```json
{
  "@type": "WebApplication",
  "name": "DocFlow PDF Compress",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0" }
}
```

Plus `BreadcrumbList` and per-tool `FAQPage`.

### Sitemap structure

```
https://docflow.pages.dev/
https://docflow.pages.dev/tools
https://docflow.pages.dev/about
https://docflow.pages.dev/blog
https://docflow.pages.dev/blog/{slug}   × 5 posts
https://docflow.pages.dev/{tool-slug}   × 27 tools
```

Total: ~36 URLs, `changefreq` based on content type.

---

## Security

### Content Security Policy (in `public/_headers`)

```
script-src 'self' 'unsafe-inline' 'unsafe-eval'
  ↑ needed for Vite chunks + pdfjs worker + Tesseract WASM

connect-src 'self' blob:
  ↑ only internal API calls + blob URLs (no third-party data exfil)

worker-src 'self' blob:
  ↑ required for pdf.js + Tesseract web workers
```

### Rate limiting (in `functions/_middleware.ts`)

```
/api/analytics  → 20 requests/minute per IP  (KV write protection)
/api/stats      → 60 requests/minute per IP
/api/sitemap    → no limit (pure read, edge-cached)
```

Implemented via sliding window in KV with 60s TTL keys.  
Keeps writes well within free tier limits.

### File validation

- MIME type verified via `file.type` (client) 
- Max size: 100MB client-side hard-stop
- Filename sanitized: strip `../`, control characters, dangerous extensions
- All processing in browser sandbox — no server-side file handling

---

## License

MIT — use freely for personal or commercial projects.
