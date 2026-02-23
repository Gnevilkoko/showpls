import Modal from "../../../shared/components/Modal"
import userIcon from "../../../assets/icons/navigation/user.svg"
import { useFormatDate } from "../../../shared/hooks/useFormatDate"
import starFilledIcon from "../../../assets/icons/status/star-filled.svg"
import { useTranslation } from "react-i18next"

type Review = {
  id: number
  name: string
  review: string
  grade: number
  date: string
  avatar: string
}

interface ModalReviewsProps {
  isOpenReviews: boolean
  setIsOpenReviews: (isOpenReviews: boolean) => void
}

const reviews: Review[] = []

const ModalReviews = ({ isOpenReviews, setIsOpenReviews }: ModalReviewsProps) => {
  const { formatDate } = useFormatDate()
  const { t } = useTranslation()

  const renderStars = (grade: number) => {
    return Array.from({ length: grade }, (_, index) => {
      return <img src={starFilledIcon} alt="Star Icon" key={index} />
    })
  }

  return (
    <Modal isOpen={isOpenReviews} onClose={() => setIsOpenReviews(false)}>
      {reviews.length === 0 ? (
        <div className="empty-state">
          <p>{t("noReviews", "У вас пока нет отзывов.")}</p>
        </div>
      ) : (
        reviews.map((review: Review) => {
          const formattedDate = formatDate(review.date)
          const time = formattedDate.split(" ")[0]
          const date = formattedDate.split(" ")[1]

          return (
            <div className="review-item__wrapper" key={review.id}>
              <div className="review-item__header">
                <div className="review-item__title">
                  <img src={review.avatar || userIcon} alt="Review Avatar" className="review-item__avatar" />

                  <div className="review-item__user-info">
                    <span className="review-item__name-user">{review.name}</span>

                    <div className="review-item__grade">{renderStars(review.grade)}</div>
                  </div>
                </div>

                <div className="review-item__date">
                  <span>{time}</span>
                  <span>{date}</span>
                </div>
              </div>

              <div className="review-item__content">
                <span>{review.review}</span>
              </div>
            </div>
          )
        })
      )}
    </Modal>
  )
}

export default ModalReviews
