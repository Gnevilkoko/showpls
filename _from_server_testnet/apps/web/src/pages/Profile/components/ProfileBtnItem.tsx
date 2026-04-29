import arrowRightIcon from "../../../assets/icons/ui/arrow-right.svg"

interface ProfileBtnItemProps {
  title: string
  icon: string
  onClick: () => void
  onBlur?: () => void
  children?: React.ReactNode
}

const ProfileBtnItem = ({ title, icon, onClick, onBlur, children = null }: ProfileBtnItemProps) => {
  return (
    <button className="profile__option" onClick={onClick} onBlur={onBlur}>
      <div className="profile__option-content">
        <img src={icon} alt={`${title} Icon`} />

        <span>{title}</span>
      </div>

      {children}

      <img src={arrowRightIcon} alt="Arrow Right Icon" />
    </button>
  )
}

export default ProfileBtnItem
