import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';

interface ScreenshotLightboxProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export function ScreenshotLightbox({ imageUrl, title, onClose }: ScreenshotLightboxProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div
      id="screenshot-lightbox-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="screenshot-lightbox-modal"
        className="relative flex flex-col max-w-6xl max-h-[92vh] w-full bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
              {title || 'Trade Execution Chart Screenshot'}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="lightbox-zoom-out-btn"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              id="lightbox-zoom-reset-btn"
              onClick={handleResetZoom}
              className="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/80 rounded transition"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              id="lightbox-zoom-in-btn"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1"></div>

            <a
              id="lightbox-download-btn"
              href={imageUrl}
              download="trade-screenshot.jpg"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              title="Download Screenshot"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              id="lightbox-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition ml-2"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image display container */}
        <div className="relative flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-4 min-h-[300px]">
          <img
            src={imageUrl}
            alt={title || 'Trade chart screenshot'}
            className="max-h-[80vh] max-w-full object-contain rounded-lg transition-transform duration-150"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}
