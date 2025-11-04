import Modal from "../../../shared/components/Modal"
import userIcon from "../../../assets/icons/navigation/user.svg"
import { useFormatDate } from "../../../shared/hooks/useFormatDate"
import starFilledIcon from "../../../assets/icons/status/star-filled.svg"

interface ModalReviewsProps {
  isOpenReviews: boolean
  setIsOpenReviews: (isOpenReviews: boolean) => void
}

type Review = {
  id: number
  name: string
  review: string
  grade: number
  date: string
  avatar: string
}

const reviews: Review[] = [
  {
    id: 1,
    name: "Vasiliy Vasilyev",
    review: "This is a review",
    grade: 5,
    date: new Date().toISOString(),
    avatar: userIcon,
  },
  {
    id: 2,
    name: "Ivan Ivanov",
    review: "lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    grade: 4,
    date: "2025-01-14T10:30:00.000Z",
    avatar: userIcon,
  },
  {
    id: 3,
    name: "Petr Petrov",
    review:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    grade: 3,
    date: "2024-01-15T10:30:00.000Z",
    avatar: userIcon,
  },
  {
    id: 4,
    name: "Sergey Sergeev",
    review:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    grade: 2,
    date: "2024-01-15T10:30:00.000Z",
    avatar: userIcon,
  },
  {
    id: 5,
    name: "Dmitriy Dmitriev",
    review:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    grade: 1,
    date: "2024-01-15T10:30:00.000Z",
    avatar: userIcon,
  },
  {
    id: 6,
    name: "Dmitriy Dmitriev",
    review:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    grade: 1,
    date: "2024-01-15T10:30:00.000Z",
    avatar: userIcon,
  },
  {
    id: 7,
    name: "Dmitriy Dmitriev",
    review:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    grade: 1,
    date: "2024-01-15T10:30:00.000Z",
    avatar: userIcon,
  },
  {
    id: 8,
    name: "Dmitriy Dmitriev",
    review:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    grade: 1,
    date: "2024-01-15T10:30:00.000Z",
    avatar: userIcon,
  },
]

const ModalReviews = ({ isOpenReviews, setIsOpenReviews }: ModalReviewsProps) => {
  const { formatDate } = useFormatDate()

  const renderStars = (grade: number) => {
    return Array.from({ length: grade }, (_, index) => {
      return <img src={starFilledIcon} alt="Star Icon" key={index} />
    })
  }

  return (
    <Modal isOpen={isOpenReviews} onClose={() => setIsOpenReviews(false)}>
      {reviews.map((review: Review) => {
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
      })}
    </Modal>
  )
}

export default ModalReviews
