interface CustomerButtonProps {
  img: string
  title: string
  description?: string
  color: "green" | "blue"
}

const CustomerButton = ({ img, title, description, color }: CustomerButtonProps) => {
  return (
    <button className={`customer__btn ${color}`}>
      <img src={img} alt={`${title} Icon`} className="action-banner__icon" />

      <div className="customer__btn__content">
        <span>{title}</span>

        {description && <p>{description}</p>}
      </div>
    </button>
  )
}

export default CustomerButton
