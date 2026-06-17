export interface BlogPost {
  slug: string
  title: string
  description: string
  content: string
  category: 'tutorials' | 'comparisons' | 'guides' | 'tips'
  tags: string[]
  author: string
  publishedAt: string
  updatedAt?: string
  readingTime: number
  coverImage?: string
  relatedPosts?: string[]
  featured?: boolean
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-compress-pdf-without-losing-quality',
    title: 'How to Compress PDF Files Without Losing Quality',
    description: 'Learn the best techniques to reduce PDF file size while maintaining document quality. Step-by-step guide with examples.',
    category: 'tutorials',
    tags: ['pdf', 'compress', 'file-size', 'optimization'],
    author: 'DocFlow Team',
    publishedAt: '2024-01-15',
    readingTime: 6,
    featured: true,
    relatedPosts: ['best-pdf-merge-tools', 'webp-vs-jpg-vs-png'],
    content: `
## Why PDF Compression Matters

PDF files are the standard for sharing documents professionally, but they can quickly grow to sizes that make emailing difficult, slow to load online, or frustrating to share. A 50-page report with embedded images can easily reach 25MB or more.

Compressing PDF files is not about degrading quality — it's about removing redundancy, optimizing embedded resources, and restructuring the file so it contains exactly what it needs and nothing more.

## Understanding What Makes PDFs Large

Before compressing, it helps to understand why PDFs become large:

**Embedded images**: Images embedded at print resolution (300 DPI) are far larger than needed for screen viewing (96 DPI). A single high-resolution photograph can account for several megabytes.

**Embedded fonts**: PDFs embed font files to ensure consistent rendering. While necessary, subsetted fonts (only the characters used) are far smaller than full font files.

**Redundant data**: PDFs generated from design tools sometimes contain duplicate objects, unused resources, and metadata that adds size without adding value.

**Object streams**: Unoptimized PDFs don't use object compression, leaving size savings on the table.

## Three Approaches to PDF Compression

### 1. Online Browser-Based Compression (Recommended for Most Users)

Tools like DocFlow's PDF Compressor process your file directly in the browser — no uploads to third-party servers, no privacy risks, and results in seconds.

**How it works:**
1. Open DocFlow's PDF Compress tool
2. Drag and drop your PDF file
3. Select a compression level: Low (best quality), Medium (balanced), or High (smallest file)
4. Click "Compress PDF"
5. Download your compressed file

**When to use this:** For everyday documents, reports, presentations, and any file under 50MB.

### 2. Choosing the Right Compression Level

- **Low compression (~30% reduction):** Best for legal documents, contracts, and anything where precise text rendering matters. Nearly imperceptible quality change.
- **Medium compression (~60% reduction):** The sweet spot for most documents. PDFs with images may show very slight quality reduction, but for text-heavy documents the difference is invisible.
- **High compression (~85% reduction):** Best for documents that will only be viewed on screen and never printed. Aggressive image downsampling and maximum optimization.

### 3. Tips for Maximum Compression

**Before generating the PDF:**
- Export images at screen resolution (96-150 DPI) instead of print resolution
- Use JPEG for photographs and PNG only for diagrams with flat colors
- Avoid embedding unnecessary fonts — use standard system fonts

**After compression:**
- Test the compressed PDF by opening it at 100% zoom and checking all text is crisp
- Verify all images are acceptable quality for your use case
- Check that links and form fields (if any) still work correctly

## Common Compression Mistakes to Avoid

**Over-compressing**: If you're distributing a document for print, using "High" compression will result in pixelated images when printed. Use "Low" or "Medium" for print-destined documents.

**Compressing already-compressed PDFs**: Running a PDF through compression multiple times usually yields diminishing returns after the first pass. Each subsequent compression typically saves less than 5% additional space.

**Ignoring the original source**: If you need a truly small PDF, the best approach is often to re-export from the source application (Word, InDesign, etc.) with optimized settings rather than compressing an already large file.

## Comparing File Sizes: Real Examples

| Document type | Before | After (Medium) | Savings |
|---|---|---|---|
| 10-page text report | 1.2 MB | 480 KB | 60% |
| 20-page presentation with photos | 18 MB | 4.5 MB | 75% |
| 5-page scanned document | 8 MB | 3.2 MB | 60% |
| Legal contract (text only) | 800 KB | 280 KB | 65% |

## Conclusion

PDF compression is straightforward when you understand what makes files large. For most use cases, a browser-based tool like DocFlow gives you instant results without the privacy concerns of uploading sensitive documents to unknown servers. Start with Medium compression, verify quality, and adjust if needed.
    `.trim(),
  },
  {
    slug: 'webp-vs-jpg-vs-png',
    title: 'WEBP vs JPG vs PNG: Which Image Format Should You Use?',
    description: 'A complete comparison of WEBP, JPG, and PNG image formats. When to use each, file size differences, browser support, and real-world examples.',
    category: 'comparisons',
    tags: ['webp', 'jpg', 'png', 'image-formats', 'compression'],
    author: 'DocFlow Team',
    publishedAt: '2024-01-22',
    readingTime: 8,
    featured: true,
    relatedPosts: ['how-to-compress-pdf-without-losing-quality', 'remove-image-backgrounds'],
    content: `
## The Three Main Web Image Formats

Choosing the wrong image format is one of the most common performance mistakes web developers and designers make. A JPG that should be a WEBP could be 2-3x larger than necessary. A PNG that should be a JPG could be 5-10x larger. Understanding when to use each format is essential.

## JPEG (JPG): The Universal Standard

JPEG has been the dominant format for photographs since the 1990s. It uses lossy compression — it discards some image data to achieve smaller file sizes.

**Best for:**
- Photographs and realistic images
- Complex scenes with many colors and gradients
- Images where small quality loss is acceptable
- Maximum compatibility (works everywhere)

**Avoid for:**
- Images with text overlays (the lossy compression creates visible artifacts around text)
- Images that will be re-edited and re-saved multiple times
- Screenshots and images with flat color regions
- Images requiring transparency

**Typical file size for a 1920×1080 photograph:** 100-400 KB

## PNG: Lossless Quality

PNG uses lossless compression — no image data is discarded. This produces perfect quality but larger files than JPEG.

**Best for:**
- Screenshots and UI elements
- Images with text overlays
- Logos and graphics with flat colors
- Images requiring transparency (PNG-24 supports alpha channel)
- Images that will be re-edited (no generation loss)

**Avoid for:**
- Photographs (PNG files of photos are 5-10x larger than JPEG equivalents)
- Any image where transparency is not needed and the image is photographic

**Typical file size for a 1920×1080 photograph:** 2-8 MB

## WEBP: The Modern Standard

WEBP was developed by Google and offers the best of both worlds: lossy compression comparable to JPEG but with 25-34% better compression, plus lossless compression 26% better than PNG, plus transparency support.

**Best for:**
- Web images in modern browsers (Chrome, Firefox, Safari 14+, Edge)
- Replacing both JPEG and PNG for web use
- Images that need transparency AND good compression
- Core Web Vitals optimization

**Avoid for:**
- When you need maximum compatibility with older systems
- Print workflows (limited support in design applications)
- Email attachments (some email clients can't display WEBP)

**Typical file size for a 1920×1080 photograph:** 70-200 KB (vs 100-400 KB for JPEG)

## Side-by-Side Comparison

| Property | JPEG | PNG | WEBP |
|---|---|---|---|
| Compression | Lossy | Lossless | Both |
| Transparency | No | Yes | Yes |
| Animation | No | No | Yes |
| Browser support | Universal | Universal | 96%+ |
| Best quality/size ratio | Medium | Medium | High |
| Ideal for | Photos | Graphics/UI | Web images |

## When to Convert Between Formats

### WEBP → JPG or PNG
Convert to WEBP for web use to save bandwidth. Convert back to JPG/PNG when:
- Sending to someone who might have an older system
- Uploading to platforms that don't support WEBP (some CMS, email clients)
- Using in print workflows

### PNG → WEBP
If you have a PNG on your website and it doesn't need perfect lossless quality, converting to WEBP lossless can reduce size by 26%. For web PNGs that don't require pixel-perfect quality, converting to WEBP lossy can reduce size by 60-80%.

### JPG → WEBP
Converting existing JPEGs to WEBP for web use is almost always beneficial — 25-34% smaller with equivalent visual quality.

## The Developer's Decision Tree

1. **Is it a photograph?** → WEBP (web) or JPG (universal)
2. **Does it need transparency?** → WEBP (web) or PNG (universal)
3. **Is it a screenshot/UI element?** → WEBP (web) or PNG (universal)
4. **Will it be printed?** → JPG for photos, PNG for graphics
5. **Is maximum compatibility critical?** → JPG for photos, PNG for everything else

## Converting Image Formats

Use DocFlow's free online tools to convert between formats instantly in your browser:
- **JPG to PNG**: When you need to add transparency to a photo
- **PNG to JPG**: When you need to reduce a PNG's file size
- **WEBP Converter**: When optimizing for web delivery

## Conclusion

For modern web development, WEBP should be your default choice. For maximum compatibility (email, print, older browsers), use JPG for photos and PNG for graphics. The difference in file sizes is significant enough that making the right choice can meaningfully improve your website's performance.
    `.trim(),
  },
  {
    slug: 'how-to-remove-image-backgrounds',
    title: 'How to Remove Image Backgrounds — The Complete Guide',
    description: 'Learn how to remove image backgrounds using AI-powered browser-based tools. No Photoshop required. Works for product photos, portraits, and more.',
    category: 'guides',
    tags: ['background-removal', 'image-editing', 'ai', 'product-photos'],
    author: 'DocFlow Team',
    publishedAt: '2024-02-03',
    readingTime: 7,
    featured: false,
    relatedPosts: ['webp-vs-jpg-vs-png', 'how-to-compress-pdf-without-losing-quality'],
    content: `
## Why Background Removal Matters

Whether you're running an e-commerce store and need clean product shots, creating social media content, building presentation slides, or designing marketing materials, the ability to remove image backgrounds is an essential skill.

In the past, background removal required Photoshop expertise and hours of careful editing. Today, AI-powered tools can do this in seconds with results that rival professional editing for most use cases.

## How AI Background Removal Works

Modern background removal uses deep learning models trained on millions of images. These models:

1. Analyze the image to identify the foreground subject (person, product, object)
2. Create a precise alpha mask that separates the foreground from the background
3. Apply the mask to produce a transparent PNG where the background was

The key advantage of DocFlow's background remover is that this entire process happens in your browser using the @imgly/background-removal library. Your photos never leave your device.

## When AI Background Removal Works Best

**High contrast between subject and background**: A product on a white background, a person against a plain wall, or an object on a desk all work excellently.

**Clear, well-lit subjects**: Good lighting with minimal shadows gives the AI model the clearest signal about where the subject ends.

**Portraits and headshots**: The model is specifically trained on humans and typically produces excellent results for profile photos and headshots.

**Product photography**: Items photographed for e-commerce on clean backgrounds are ideal candidates.

## When Results May Need Touch-Up

**Hair and fur**: Fine details like individual hair strands are difficult for any automated tool. The results are usually good but may need manual refinement for professional use.

**Transparent or reflective objects**: Glass bottles, transparent containers, and shiny metallic objects confuse background removal models because they partially show the background.

**Complex backgrounds**: Images with busy, detailed backgrounds that share colors with the subject are more challenging than clean studio-style shots.

**Low-quality or blurry images**: The AI needs clear edge information to produce clean masks. Low-resolution or blurry input produces imprecise masks.

## Step-by-Step Guide

### Using DocFlow's Background Remover

1. **Navigate to the Background Remover tool** at /background-remover
2. **Upload your image** by dragging and dropping or clicking to browse
   - Supported formats: JPG, PNG, WEBP
   - Maximum size: 50MB
3. **Wait for processing** — the AI model runs locally in your browser
   - First use may take 30-60 seconds to load the model
   - Subsequent images process in 5-15 seconds
4. **Preview the result** — check edges and transparency
5. **Download as PNG** — the output is always PNG to preserve transparency

### Getting Better Results

**Prepare your image:**
- Use the highest resolution version available
- Ensure the subject is well-lit and in focus
- Crop tightly to remove excessive background before uploading

**After removal:**
- For professional use, zoom into edges at 200% and check for fringing (residual background color on edges)
- If you see green/blue/color fringing on edges, the original had challenging lighting — you may need to manually refine in an editor

## Common Use Cases

### E-commerce Product Photos
Remove backgrounds to place products on white backgrounds for consistency, or on lifestyle backgrounds for context. A consistent white background is the standard for major marketplaces like Amazon.

### Professional Headshots  
LinkedIn profiles and professional bios benefit from clean, background-replaced headshots. Replace a distracting office background with solid gray or a professional environment.

### Marketing Materials
Extract people and products from photos to place them in designed layouts. This is how marketing agencies create composite images from individual photo shoots.

### Social Media Content
Create visually consistent content by extracting subjects from different photos and compositing them on branded backgrounds.

## Output Format: Always PNG

Background-removed images must be saved as PNG to preserve the transparent regions. If you need a smaller file size, converting to WEBP (which also supports transparency) can reduce the file size by 30-50% compared to PNG while maintaining transparency.

## Privacy Note

DocFlow's background removal tool uses on-device AI processing — the model download is approximately 50MB but is cached after the first use. Your images never leave your browser. This is fundamentally different from services that upload your photos to cloud servers.

## Conclusion

AI background removal has become fast enough and accurate enough for most everyday use cases. For professional product photography and marketing materials, automated removal combined with light manual touch-up produces results that used to require hours of skilled editing work in a matter of seconds.
    `.trim(),
  },
  {
    slug: 'merge-pdf-files-complete-guide',
    title: 'How to Merge PDF Files — Complete Guide for 2024',
    description: 'Learn multiple ways to merge PDF files on Windows, Mac, and online. Free methods, step-by-step instructions, and tips for organizing merged documents.',
    category: 'guides',
    tags: ['pdf', 'merge', 'combine', 'documents'],
    author: 'DocFlow Team',
    publishedAt: '2024-02-10',
    readingTime: 5,
    featured: false,
    relatedPosts: ['how-to-compress-pdf-without-losing-quality', 'best-pdf-tools-comparison'],
    content: `
## When Do You Need to Merge PDFs?

Merging PDFs is one of the most common document tasks across businesses, education, and personal use:

- **Combining report sections** written by different team members into a single document
- **Consolidating invoices** for expense reports or accounting
- **Merging scanned pages** from a multi-page document into one file
- **Creating portfolios** by combining samples from different projects
- **Bundling contracts** with their attachments and exhibits

## Method 1: Using DocFlow (Online, Free, Private)

The fastest method for most users. All processing happens in your browser.

**Steps:**
1. Go to /merge-pdf
2. Click "Add Files" or drag and drop your PDFs
3. Arrange them in the desired order by dragging
4. Click "Merge PDF"
5. Download the merged file

**Pros:** Free, no installation, works on any device, files never leave your browser
**Cons:** 50MB limit per file, requires modern browser

## Method 2: Using macOS Preview (Free, Built-in)

macOS has PDF merging built into the Preview app.

**Steps:**
1. Open the first PDF in Preview
2. Open the Sidebar (View → Sidebar → Show Sidebar)
3. Open Finder and drag additional PDF files into the sidebar in the desired order
4. File → Export as PDF to save the merged document

**Pros:** No software to install, works offline
**Cons:** macOS only, can be slow with large files

## Method 3: Using Adobe Acrobat (Paid)

The professional option for heavy PDF users.

**Steps:**
1. Open Adobe Acrobat
2. Tools → Combine Files
3. Add files, arrange order, set page ranges
4. Click "Combine"

**Pros:** Advanced options, handles large files, can merge PDFs with forms
**Cons:** Expensive subscription ($14.99+/month)

## Organizing Your Merged PDF

Before merging, consider:

**Page order matters**: The final PDF will contain pages in exactly the order you specified. Draft your merge order before starting.

**Add a cover page**: Many merged PDFs benefit from a simple cover page with a title and table of contents. Create this in Word or Google Docs, export as PDF, and add it as the first file.

**Consistent page sizes**: If your source PDFs have different page sizes (e.g., mixing Letter and A4), most merge tools will preserve the original sizes. Consider standardizing to one size if consistency matters.

**Check page numbering**: Merged PDFs reset page numbers at each source file's beginning unless you specifically add page numbers after merging using a PDF editor.

## File Size After Merging

Merged PDFs are approximately the sum of the source files (no compression applied during merge). If size is a concern, compress after merging:

1. Merge all files into one PDF
2. Use the PDF Compress tool to reduce the size

This two-step process gives you control over both structure and file size.

## Securing Merged PDFs

If you're merging sensitive documents, consider:
- Adding a password after merging using PDF Protect
- Verifying that any confidential source document content is appropriate to include
- Checking that all embedded metadata (from source applications) is appropriate

## Conclusion

For most users, an online tool like DocFlow is the fastest and most convenient option for merging PDFs. No installation, no cost, and your files never leave your device. For power users who regularly merge large numbers of files, a desktop application may be more appropriate.
    `.trim(),
  },
  {
    slug: 'ocr-extract-text-from-images',
    title: 'OCR Explained: How to Extract Text From Images and Scanned Documents',
    description: 'What is OCR and how does it work? Complete guide to extracting text from images, scanned PDFs, and photos using free online tools.',
    category: 'guides',
    tags: ['ocr', 'text-extraction', 'scanned-documents', 'image-to-text'],
    author: 'DocFlow Team',
    publishedAt: '2024-02-18',
    readingTime: 6,
    featured: false,
    relatedPosts: ['merge-pdf-files-complete-guide', 'how-to-compress-pdf-without-losing-quality'],
    content: `
## What is OCR?

OCR (Optical Character Recognition) is technology that converts images containing text — photographs, scans, screenshots — into machine-readable text. Instead of seeing an image of the word "invoice," OCR recognizes those pixel patterns as the letters I-N-V-O-I-C-E.

Modern OCR engines like Tesseract.js (used by DocFlow) achieve accuracy rates above 95% on clear, well-formatted documents and support over 100 languages.

## Common OCR Use Cases

**Digitizing physical documents**: Scanning paper receipts, contracts, letters, and books into searchable, editable text.

**Extracting data from forms**: Pulling specific fields (names, dates, amounts) from standardized forms automatically.

**Making scanned PDFs searchable**: PDFs created by scanning physical documents are image-only — OCR makes them text-searchable.

**Processing screenshots**: Extracting text from screenshots for quick copy-pasting without retyping.

**Archiving historical documents**: Converting aged paper documents into digital text for long-term preservation and searchability.

## How to Get the Best OCR Results

### Image Quality is Everything

OCR accuracy depends almost entirely on input quality:

**Resolution**: Minimum 150 DPI for basic recognition, 300 DPI for best results. Phone camera photos of documents taken from a reasonable distance typically meet this threshold.

**Contrast**: Black text on white background gives optimal results. Low-contrast documents (faded text, colored backgrounds) reduce accuracy significantly.

**Alignment**: Documents should be scanned straight. Tilted documents (more than 10-15 degrees) reduce accuracy, though modern engines can correct for minor skew.

**Focus**: Images must be in sharp focus. The biggest source of poor OCR results from phone camera shots is blurriness from motion or shallow depth of field.

### Preparing Your Image

Before running OCR:
1. Ensure the image is well-lit and shadow-free
2. If the document is tilted, rotate it to vertical alignment
3. Crop out anything that isn't the document (tablecloths, desk surfaces)
4. If possible, use a scanner rather than a camera for critical documents

## Using DocFlow's OCR Tool

1. Navigate to /ocr
2. Upload your image (JPG, PNG, WEBP supported)
3. Select your document's language from the dropdown
4. Click "Extract Text"
5. Review and copy the extracted text

**Processing time**: Approximately 5-30 seconds per page, depending on document complexity and your device.

**Privacy**: All OCR processing runs locally in your browser using Tesseract.js. No text is sent to any server.

## Understanding OCR Limitations

**Handwriting**: OCR engines are optimized for printed text. Handwritten documents have significantly lower accuracy, though clear, neat handwriting can achieve reasonable results.

**Complex layouts**: Multi-column layouts, tables, and documents with mixed text and images can produce garbled output as the OCR engine may not correctly identify reading order.

**Stylized fonts**: Decorative, ornamental, or highly stylized fonts may not be recognized accurately.

**Languages**: Most OCR engines perform best on Latin-script languages. Non-Latin scripts (Arabic, Chinese, Hindi) require specific language data packs for accurate recognition.

## After Extraction: Cleaning Up OCR Output

Raw OCR output often contains minor errors. A typical cleanup workflow:

1. Copy the extracted text to a text editor
2. Run spell-check to catch obvious errors
3. Spot-check key details (names, dates, numbers) against the original
4. Replace or fix any incorrectly recognized characters

For automated processing (data extraction from forms), post-processing rules or regular expressions can clean predictable patterns.

## Conclusion

OCR has become fast enough and accurate enough that extracting text from clear images is now a routine, seconds-long task. The key to good results is good input: high resolution, good contrast, and properly aligned text. For documents that matter, always spot-check the output against the original.
    `.trim(),
  },
]

export const BLOG_CATEGORIES = ['All', 'tutorials', 'comparisons', 'guides', 'tips'] as const
export type BlogCategory = (typeof BLOG_CATEGORIES)[number]

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug)
}

export function getRelatedBlogPosts(post: BlogPost): BlogPost[] {
  if (!post.relatedPosts?.length) return []
  return post.relatedPosts
    .map(slug => BLOG_POSTS.find(p => p.slug === slug))
    .filter(Boolean) as BlogPost[]
}

export function getBlogPostsByCategory(category: BlogCategory): BlogPost[] {
  if (category === 'All') return BLOG_POSTS
  return BLOG_POSTS.filter(p => p.category === category)
}
