import { useTranslation } from "react-i18next"
import { useState } from "react"
import ModalContent from "../../../shared/components/ModalContent"
import penIcon from "../../../assets/icons/actions/pen.svg"

interface CreateArbitrationModalProps {
    isCreating: boolean
    onConfirm: (reason: string) => void
    onCancel: () => void
}

const CreateArbitrationModal = ({ isCreating, onConfirm, onCancel }: CreateArbitrationModalProps) => {
    const { t } = useTranslation()
    const [reason, setReason] = useState("")

    return (
        <ModalContent
            icon={penIcon}
            title={t("writeArbitration")}
            description={t("arbitrationDescription")}
            confirmText={isCreating ? t("loading") : t("submit")}
            cancelText={t("cancel")}
            onConfirm={() => onConfirm(reason)}
            onCancel={onCancel}
        >
            <div className="feedback_container" style={{ marginTop: "20px" }}>
                <span>{t("reasonForArbitration", "Reason for arbitration")}</span>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("describeTheProblem", "Please describe the problem in detail...")}
                    disabled={isCreating}
                />
            </div>
        </ModalContent>
    )
}

export default CreateArbitrationModal
