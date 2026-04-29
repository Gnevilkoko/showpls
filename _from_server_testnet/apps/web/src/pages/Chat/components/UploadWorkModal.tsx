import { useTranslation } from "react-i18next"
import { useState, useEffect, useRef, type ChangeEvent } from "react"
import type { UploadedImageType } from "../../../shared/types"
import ModalContent from "../../../shared/components/ModalContent"
import uploadIcon from "../../../assets/icons/actions/camera-white.svg"
import plusIcon from "../../../assets/icons/ui/plus.svg"
import { NotificationHandler } from "../../../shared/utils/notificationHandler"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
]
// iOS Safari: accept image/* so HEIC from library can be picked; specific list for better UX
const ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,video/mp4,video/quicktime,video/x-msvideo"
const ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp", "gif", "heic", "heif",
  "mp4", "mov", "avi",
]

interface UploadWorkModalProps {
    onConfirm: (images: UploadedImageType[], geo: { latitude: number; longitude: number } | null) => void
    onCancel: () => void
    isUploading?: boolean
}

const UploadWorkModal = ({ onConfirm, onCancel, isUploading }: UploadWorkModalProps) => {
    const { t } = useTranslation()
    const [images, setImages] = useState<UploadedImageType[]>([])
    const [geo, setGeo] = useState<{ latitude: number; longitude: number } | null>(null)
    // В Telegram Mini App геолокация через браузер обычно недоступна — не запрашиваем и не показываем ошибку
    const isMiniApp = typeof window !== "undefined" && !!(window as any).Telegram?.WebApp

    useEffect(() => {
        if (isMiniApp || !navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (pos) => setGeo({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => {
                // Ошибку не показываем: в мини-аппе это норма, в браузере — не мешаем пользователю
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        )
    }, [isMiniApp])

    const isFileAllowed = (file: File): boolean => {
        if (ALLOWED_MIME_TYPES.includes(file.type)) return true
        // iOS Safari often leaves file.type empty for HEIC/photo library; allow by extension
        if (!file.type && file.name) {
            const ext = file.name.split(".").pop()?.toLowerCase()
            return ALLOWED_EXTENSIONS.includes(ext || "")
        }
        return false
    }

    const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const valid: UploadedImageType[] = []
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!isFileAllowed(file)) {
                NotificationHandler.showErrorTranslated("invalidFileType")
                continue
            }
            valid.push({ file, url: URL.createObjectURL(file) })
        }
        if (valid.length > 0) {
            setImages((prev) => [...prev, ...valid])
        }
        e.target.value = ""
    }

    const handleRemove = (url: string) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url)
        setImages((prev) => prev.filter((img) => img.url !== url))
    }

    return (
        <ModalContent
            icon={uploadIcon}
            title={t("uploadWork")}
            description={t("uploadWorkDescription")}
            confirmText={isUploading ? t("loading") : t("submit")}
            cancelText={t("cancel")}
            onConfirm={() => onConfirm(images, geo)}
            onCancel={onCancel}
        >
            <div className="upload-work-modal-body" style={{ marginTop: '20px' }}>
                <label className="message-input-dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <img src={plusIcon} alt="add" />
                    <span>{t("addFiles")}</span>
                    <input
                    type="file"
                    accept={ACCEPT_ATTR}
                    multiple
                    onChange={handleUpload}
                    style={{ display: "none" }}
                  />
                </label>

                {images.length > 0 && (
                    <div className="upload-work-preview-grid" style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                        {images.map((img) => (
                            <div key={img.url} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                <img src={img.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                <button
                                    onClick={() => handleRemove(img.url)}
                                    style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                                    type="button"
                                >
                                    x
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {geo && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '15px' }}>
                        ✓ {t("locationAttached")}
                    </p>
                )}
            </div>
        </ModalContent>
    )
}

export default UploadWorkModal
