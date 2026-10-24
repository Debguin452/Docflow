// Explicit icon map. Importing the whole lucide namespace (`import * as Icons`)
// defeats tree-shaking and ships ~600 icons; this ships only the ones we use.
import {
  BookOpen, Crop, Eraser, Eye, FileDown, FileEdit, FileImage, FilePlus2, FileText,
  GripVertical, ImageDown, Image as ImageIcon, Layers, Lock, Maximize2, Monitor,
  QrCode, RefreshCw, RotateCw, ScanLine, ScanText, Scissors, Stamp, Unlock, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  BookOpen, Crop, Eraser, Eye, FileDown, FileEdit: FileEdit, FileImage, FilePlus2, FileText,
  GripVertical, ImageDown, ImageIcon, Layers, Lock, Maximize2, Monitor,
  QrCode, RefreshCw, RotateCw, ScanLine, ScanText, Scissors, Stamp, Unlock, Wrench, Zap,
}

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Wrench
}
