import { useState } from "react"

interface ImageViewerProps {
  images: string[]
  currentImageIndex?: number
  onClose: () => void
}

const ImageViewer = ({ images, currentImageIndex = 0, onClose }: ImageViewerProps) => {
  const [activeIndex, setActiveIndex] = useState(currentImageIndex)

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrevious()
    } else if (e.key === "ArrowRight") {
      handleNext()
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  if (images.length === 0) return null

  return (
    <div className="image-modal" onClick={onClose} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="image-modal__content" onClick={(e) => e.stopPropagation()}>
        <img src={images[activeIndex]} alt="Full size" className="image-modal__image" />

        {images.length > 1 && (
          <>
            <button className="image-modal__nav image-modal__nav--prev" onClick={handlePrevious}>
              ‹
            </button>
            <button className="image-modal__nav image-modal__nav--next" onClick={handleNext}>
              ›
            </button>
            <div className="image-modal__counter">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}

        <button className="modal__close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  )
}

export default ImageViewer
