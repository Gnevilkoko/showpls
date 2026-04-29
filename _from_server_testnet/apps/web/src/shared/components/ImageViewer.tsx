import { useState, useCallback, useEffect } from "react"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"

interface ImageViewerProps {
  images: string[]
  currentImageIndex?: number
  onClose: () => void
}

const ImageViewer = ({ images, currentImageIndex = 0, onClose }: ImageViewerProps) => {
  const [activeIndex, setActiveIndex] = useState(currentImageIndex)

  useEffect(() => {
    setActiveIndex(currentImageIndex)
  }, [currentImageIndex])

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

  const handleDownload = useCallback(() => {
    const url = images[activeIndex]
    if (!url) return

    // Прокси на нашем бэкенде: сервер фетчит файл с S3 и отдаёт с
    // Content-Disposition: attachment — браузер/WebView скачивает, а не открывает.
    // Работает на iOS, Android и desktop без CORS-ограничений.
    const proxyUrl = `/api/upload/download?url=${encodeURIComponent(url)}`
    const a = document.createElement("a")
    a.href = proxyUrl
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [images, activeIndex])

  if (images.length === 0) return null

  return (
    <div className="image-modal" onClick={onClose} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="image-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="image-modal__zoom">
          <TransformWrapper
            key={`${activeIndex}-${images[activeIndex] ?? ""}`}
            initialScale={1}
            minScale={1}
            maxScale={5}
            centerOnInit
            limitToBounds
            wheel={{ step: 0.12 }}
            pinch={{ step: 8 }}
            doubleClick={{ mode: "toggle", step: 0.7 }}
            panning={{ velocityDisabled: false }}
          >
            <TransformComponent
              wrapperClass="image-modal__transform-wrapper"
              contentClass="image-modal__transform-content"
            >
              <img
                src={images[activeIndex]}
                alt="Full size"
                className="image-modal__image"
                draggable={false}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>

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

        <button className="image-modal__download" onClick={handleDownload} title="Download">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3v10m0 0l-4-4m4 4l4-4M3 15v1a1 1 0 001 1h12a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button className="modal__close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  )
}

export default ImageViewer
