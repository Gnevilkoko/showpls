import { useTranslation } from "react-i18next"
import { useState, useEffect, type ChangeEvent } from "react"
import type { UploadedImageType } from "../../../shared/types"
import ModalContent from "../../../shared/components/ModalContent"
import uploadIcon from "../../../assets/icons/actions/camera-white.svg"
import plusIcon from "../../../assets/icons/ui/plus.svg"
import { NotificationHandler } from "../../../shared/utils/notificationHandler"

interface UploadWorkModalProps {
    onConfirm: (images: UploadedImageType[], geo: { latitude: number; longitude: number } | null) => void
    onCancel: () => void
    isUploading?: boolean
}

const UploadWorkModal = ({ onConfirm, onCancel, isUploading }: UploadWorkModalProps) => {
    const { t } = useTranslation()
    const [images, setImages] = useState<UploadedImageType[]>([])
    const [geo, setGeo] = useState<{ latitude: number; longitude: number } | null>(null)

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setGeo({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                (err) => {
                    console.error("Geo error:", err)
                    NotificationHandler.showErrorTranslated("locationError")
                },
                { enableHighAccuracy: true }
            )
        }
    }, [])

    const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newImages: UploadedImageType[] = Array.from(files).map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }))

        setImages((prev) => [...prev, ...newImages])
        e.target.value = ""
    }

    const handleRemove = (url: string) => {
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
                    <input type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} />
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
