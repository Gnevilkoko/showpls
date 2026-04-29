interface ToggleSectionButtonProps {
  isActive: boolean
  onClick: () => void
  title: string
}

const ToggleSectionButton = ({ isActive, onClick, title }: ToggleSectionButtonProps) => {
  return (
    <button className={`performer__option ${isActive ? "active" : ""} `} onClick={onClick}>
      {title}
    </button>
  )
}

export default ToggleSectionButton
