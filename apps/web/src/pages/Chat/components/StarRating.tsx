import starGrayIcon from "../../../assets/icons/status/star-filled-gray.svg"
import starFilledIcon from "../../../assets/icons/status/star-filled.svg"

interface StarRatingProps {
  rating: number
  maxRating: number
  onRatingChange: (rating: number) => void
}

const StarRating = ({ rating, maxRating, onRatingChange }: StarRatingProps) => {
  const handleRatingChange = (newRating: number) => {
    onRatingChange(newRating)
  }

  return (
    <div className="star-rating__container">
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1
        return (
          <button key={index} className="star-rating-btn" onClick={() => handleRatingChange(starValue)} type="button">
            <img src={rating >= starValue ? starFilledIcon : starGrayIcon} alt="Star Icon" />
          </button>
        )
      })}
    </div>
  )
}

export default StarRating
