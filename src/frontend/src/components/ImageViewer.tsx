import { X } from "lucide-react";

interface ImageViewerProps {
  url: string;
  onClose: () => void;
}

export function ImageViewer({ url, onClose }: ImageViewerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape" || e.key === "Enter") onClose();
      }}
      aria-label="Cerrar visor de imagen"
      data-ocid="image-viewer.overlay"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
        aria-label="Cerrar imagen"
        data-ocid="image-viewer.close_button"
      >
        <X size={18} />
      </button>

      {/* Image — stop click propagation so clicking the image itself doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <img
          src={url}
          alt="Comprobante adjunto"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          data-ocid="image-viewer.image"
        />
      </div>
    </div>
  );
}
