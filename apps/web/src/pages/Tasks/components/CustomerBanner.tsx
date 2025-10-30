import ValidationIcon from "../../../shared/components/ValidationIcon"

interface CustomerBannerProps {
  icon: string
  title: string
  isValid: boolean
  children: React.ReactNode
}

const CustomerBanner = ({ icon, title, isValid, children }: CustomerBannerProps) => {
  return (
    <div className="customer-banner">
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
