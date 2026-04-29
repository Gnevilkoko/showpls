import verifiedCheckIcon from "../../assets/icons/status/verified-check.svg"

interface ValidationIconProps {
  isValid: boolean
}

const ValidationIcon = ({ isValid }: ValidationIconProps) => {
  if (!isValid) return null

  return <img src={verifiedCheckIcon} alt="Verified Check Icon" className="validation-icon" />
}

export default ValidationIcon
