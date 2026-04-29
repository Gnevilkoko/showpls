import userIcon from "../../../assets/icons/navigation/user.svg"
import statsStarWhiteIcon from "../../../assets/icons/status/stats-star-white.svg"
import { performerMapDisplayNick } from "../../utils/performerMapLabel"

export type PerformerMapPinProps = {
  avatar: string | null
  username: string | null
  firstName: string
  lastName: string | null
  rating: number
  /** high rating — зелёный акцент как у задач pro */
  accent?: boolean
}

/** Пин на карте: аватар, ник/username, рейтинг */
const PerformerMapPin = ({ avatar, username, firstName, lastName, rating, accent }: PerformerMapPinProps) => {
  const r = Number.isFinite(rating) ? rating : 5
  const label = performerMapDisplayNick(username, firstName, lastName)

  return (
    <div className={`performer-map-pin custom-marker${accent ? " accent" : ""}`}>
      <img className="performer-map-pin__avatar" src={avatar || userIcon} alt="" />
      <div className="performer-map-pin__meta">
        <span className="performer-map-pin__nick" title={label}>
          {label}
        </span>
        <span className="performer-map-pin__rating">
          <img src={statsStarWhiteIcon} alt="" />
          {r.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

export default PerformerMapPin
