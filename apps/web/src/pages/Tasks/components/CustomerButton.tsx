interface CustomerButtonProps {
  img: string
  title: string
  description?: string
  color: "green" | "blue"
  onClick?: () => void
}

const CustomerButton = ({ img, title, description, color, onClick }: CustomerButtonProps) => {
  return (
    <button className={`customer__btn ${color}`} onClick={onClick}>
      <img src={img} alt={`${title} Icon`} className="action-banner__icon" />

      <div className="customer__btn__content">
        <span>{title}</span>

        {description && <p>{description}</p>}
      </div>
    </button>
  )
}

export default CustomerButton
