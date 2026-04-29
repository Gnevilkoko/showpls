import ValidationIcon from "../../../shared/components/ValidationIcon"

interface CustomerBannerProps {
  icon: string
  title: string
  isValid: boolean
  children: React.ReactNode
  padding?: "none"
}

const CustomerBanner = ({ icon, title, isValid, children, padding }: CustomerBannerProps) => {
  return (
    <div className={`customer-banner ${padding === "none" ? "no-padding" : ""}`}>
      <div className="customer-banner__title-wrapper">
        <div className="customer-banner__title">
          <img src={icon} alt={`${title} Icon`} />

          <span>{title}</span>
        </div>

        <ValidationIcon isValid={isValid} />
      </div>

      {children}
    </div>
  )
}

export default CustomerBanner
