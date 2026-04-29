import arrowLeft from "../../../assets/icons/ui/arrow-left.svg"
import { useNavigate } from "react-router-dom"
import Navigation from "../../../shared/components/Navigation"

type ProfileSubPageProps = {
  title: string
  children: React.ReactNode
}

const ProfileSubPage = ({ title, children }: ProfileSubPageProps) => {
  const navigate = useNavigate()

  return (
    <div className="page profile-subpage">
      <header className="profile-subpage__header">
        <button type="button" className="profile-subpage__back" onClick={() => navigate("/profile")} aria-label="Back">
          <img src={arrowLeft} alt="" />
        </button>
        <h1 className="profile-subpage__title">{title}</h1>
      </header>

      <div className="profile-subpage__content">{children}</div>

      <Navigation />
    </div>
  )
}

export default ProfileSubPage
