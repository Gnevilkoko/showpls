import plusActionBannerIcon from "../../../assets/icons/actions/plus-action-banner.svg"
import searchActionBannerIcon from "../../../assets/icons/actions/search-action-banner.svg"
import { useTranslation } from "react-i18next"
import { useState, type ChangeEvent } from "react"
import type { UploadedImageType } from "../../../shared/types"
import ImageViewer from "../../../shared/components/ImageViewer"
import CustomerButton from "../components/CustomerButton"
import DescriptionTaskField from "../components/DescriptionTaskField"
import MapTaskField from "../components/MapTaskField"
import TimeLimitField from "../components/TimeLimitField"
import BudgetField from "../components/BudgetField"
import Modal from "../../../shared/components/Modal"
import PerformersMap from "../PerformersMap"
import VerifProofField from "../components/VerifProofField"

const CustomerTaskForm = () => {
  const { t } = useTranslation()

  // Состояния для валидации инпутов
  const [taskDescription, setTaskDescription] = useState("")
  const [attachmentsList, setAttachmentsList] = useState<UploadedImageType[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const [address, setAddress] = useState("")
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  const [isUrgent, setIsUrgent] = useState(false)
  const [timeHours, setTimeHours] = useState("")
  const [timeMinutes, setTimeMinutes] = useState("")

  const [budget, setBudget] = useState("")

  const [verifProof, setVerifProof] = useState<"base" | "pro">("base")

  const handleChangeVerifProof = (value: "base" | "pro") => {
    setVerifProof(value)
  }

  const [isOpenPerformerDiscover, setIsOpenPerformerDiscover] = useState(false)

  const handleOpenPerformerDiscover = () => {
    setIsOpenPerformerDiscover(true)
  }

  const handleClosePerformerDiscover = () => {
    setIsOpenPerformerDiscover(false)
  }

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: UploadedImageType[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))

    setAttachmentsList((prev) => [...prev, ...newImages])
    e.target.value = ""
  }

  const handleRemove = (url: string) => {
    setAttachmentsList((prev) => prev.filter((img) => img.url !== url))
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleCloseImageViewer = () => {
    setSelectedImageIndex(null)
  }

  return (
    <>
      <DescriptionTaskField
        value={taskDescription}
        onChange={setTaskDescription}
        attachmentsList={attachmentsList}
        handleUpload={handleUpload}
        handleImageClick={handleImageClick}
        handleRemove={handleRemove}
      />

      <MapTaskField
        value={address}
        onChange={setAddress}
        mapCoordinates={mapCoordinates}
        setMapCoordinates={setMapCoordinates}
      />

      <TimeLimitField
        isUrgent={isUrgent}
        setIsUrgent={setIsUrgent}
        timeHours={timeHours}
        timeMinutes={timeMinutes}
        setTimeHours={setTimeHours}
        setTimeMinutes={setTimeMinutes}
      />

      <BudgetField budget={budget} setBudget={setBudget} />

      <VerifProofField verifProof={verifProof} handleChangeVerifProof={handleChangeVerifProof} />

      <CustomerButton img={plusActionBannerIcon} title={t("tasksPage.publishRequest")} color="green" />

      <CustomerButton
        img={searchActionBannerIcon}
        title={t("tasksPage.findPerformer")}
        description={t("tasksPage.sendDirect")}
        color="blue"
        onClick={handleOpenPerformerDiscover}
      />

      {selectedImageIndex !== null && (
        <ImageViewer
          images={attachmentsList.map((img) => img.url)}
          currentImageIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
        />
      )}

      <Modal isOpen={isOpenPerformerDiscover} onClose={handleClosePerformerDiscover}>
        <PerformersMap />
      </Modal>
    </>
  )
}

export default CustomerTaskForm
