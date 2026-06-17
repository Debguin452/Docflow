import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { SearchProvider } from './context/SearchContext'

// Pages
const Home = lazy(() => import('./pages/Home'))
const Tools = lazy(() => import('./pages/Tools'))
const About = lazy(() => import('./pages/About'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const BlogList = lazy(() => import('./pages/Blog'))
const BlogPostPage = lazy(() => import('./pages/BlogPost'))
const NotFound = lazy(() => import('./pages/NotFound'))

// PDF Tools
const PDFCompress = lazy(() => import('./components/tools/pdf/PDFCompress'))
const PDFMerge = lazy(() => import('./components/tools/pdf/PDFMerge'))
const PDFSplit = lazy(() => import('./components/tools/pdf/PDFSplit'))
const PDFToImages = lazy(() => import('./components/tools/pdf/PDFToImages'))
const ImagesToPDF = lazy(() => import('./components/tools/pdf/ImagesToPDF'))
const PDFRotate = lazy(() => import('./components/tools/pdf/PDFRotate'))
const PDFReorder = lazy(() => import('./components/tools/pdf/PDFReorder'))
const PDFProtect = lazy(() => import('./components/tools/pdf/PDFProtect'))
const PDFUnlock = lazy(() => import('./components/tools/pdf/PDFUnlock'))
const PDFWatermark = lazy(() => import('./components/tools/pdf/PDFWatermark'))
const PDFExtract = lazy(() => import('./components/tools/pdf/PDFExtract'))
const PDFMetadata = lazy(() => import('./components/tools/pdf/PDFMetadata'))
const PDFPreview = lazy(() => import('./components/tools/pdf/PDFPreview'))

// Image Tools
const ImageCompress = lazy(() => import('./components/tools/image/ImageCompress'))
const ResizeImage = lazy(() => import('./components/tools/image/ResizeImage'))
const CropImage = lazy(() => import('./components/tools/image/CropImage'))
const JPGtoPNG = lazy(() => import('./components/tools/image/JPGtoPNG'))
const PNGtoJPG = lazy(() => import('./components/tools/image/PNGtoJPG'))
const WEBPConverter = lazy(() => import('./components/tools/image/WEBPConverter'))
const BackgroundRemover = lazy(() => import('./components/tools/image/BackgroundRemover'))
const ImageConverter = lazy(() => import('./components/tools/image/ImageConverter'))
const BulkImage = lazy(() => import('./components/tools/image/BulkImage'))

// Utility Tools
const QRGenerator = lazy(() => import('./components/tools/utils/QRGenerator'))
const QRScanner = lazy(() => import('./components/tools/utils/QRScanner'))
const OCRTool = lazy(() => import('./components/tools/utils/OCRTool'))
const TextToPDF = lazy(() => import('./components/tools/utils/TextToPDF'))
const ScreenshotToPDF = lazy(() => import('./components/tools/utils/ScreenshotToPDF'))

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Core pages */}
              <Route path="/" element={<Home />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />

              {/* PDF tools */}
              <Route path="/pdf-compress" element={<PDFCompress />} />
              <Route path="/merge-pdf" element={<PDFMerge />} />
              <Route path="/split-pdf" element={<PDFSplit />} />
              <Route path="/pdf-to-images" element={<PDFToImages />} />
              <Route path="/images-to-pdf" element={<ImagesToPDF />} />
              <Route path="/pdf-rotate" element={<PDFRotate />} />
              <Route path="/pdf-reorder" element={<PDFReorder />} />
              <Route path="/pdf-protect" element={<PDFProtect />} />
              <Route path="/pdf-unlock" element={<PDFUnlock />} />
              <Route path="/pdf-watermark" element={<PDFWatermark />} />
              <Route path="/pdf-extract" element={<PDFExtract />} />
              <Route path="/pdf-metadata" element={<PDFMetadata />} />
              <Route path="/pdf-preview" element={<PDFPreview />} />

              {/* Image tools */}
              <Route path="/compress-image" element={<ImageCompress />} />
              <Route path="/resize-image" element={<ResizeImage />} />
              <Route path="/crop-image" element={<CropImage />} />
              <Route path="/jpg-to-png" element={<JPGtoPNG />} />
              <Route path="/png-to-jpg" element={<PNGtoJPG />} />
              <Route path="/webp-converter" element={<WEBPConverter />} />
              <Route path="/background-remover" element={<BackgroundRemover />} />
              <Route path="/image-converter" element={<ImageConverter />} />
              <Route path="/bulk-image" element={<BulkImage />} />

              {/* Utility tools */}
              <Route path="/qr-generator" element={<QRGenerator />} />
              <Route path="/qr-scanner" element={<QRScanner />} />
              <Route path="/ocr" element={<OCRTool />} />
              <Route path="/text-to-pdf" element={<TextToPDF />} />
              <Route path="/screenshot-to-pdf" element={<ScreenshotToPDF />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </SearchProvider>
    </BrowserRouter>
  )
}
