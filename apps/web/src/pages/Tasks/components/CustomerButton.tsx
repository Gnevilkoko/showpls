interface CustomerButtonProps {
  img: string
  title: string
  description?: string
  color: "green" | "blue"
  onClick?: () => void
  disabled?: boolean
}

const CustomerButton = ({ img, title, description, color, onClick, disabled }: CustomerButtonProps) => {
  return (
    <button className={`customer__btn ${color}`} onClick={onClick} disabled={disabled}>
      <img src={img} alt={`${title} Icon`} className="action-banner__icon" />

      <div className="customer__btn__content">
        <span>{title}</span>

        {description && <p>{description}</p>}
      </div>
    </button>
  )
}

export default CustomerButton
