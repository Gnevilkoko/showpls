import cameraIcon from "../../../assets/icons/actions/camera.svg"
import checkGreenIcon from "../../../assets/icons/status/check-green.svg"
import checkReadIcon from "../../../assets/icons/status/check-read.svg"
import checkReadWhiteIcon from "../../../assets/icons/status/check-read-white.svg"
import type { Message } from "../../../shared/types"
import { formatTimeFromEpochMs } from "../../../shared/format"

type MessageItemProps = {
  message: Message
}

const MessageItem = ({ message }: MessageItemProps) => {
  // здесь нужно брать свой айдишник из user
  const userId = 100

  const time = formatTimeFromEpochMs(message.created_at)

  if (message.type === "notification") {
    return (
      <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
        <div className="message-notification">
          <img src={message.variant === "upload" ? checkGreenIcon : cameraIcon} alt="Camera Icon" />
          <span>{message.text}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
      <div className={`message ${message.sender_id === userId ? "green" : ""} ${!message.text ? "image" : ""}`}>
        {message.attachments && message.attachments.map((url) => <img key={url} src={url} alt="Attachments Image" />)}

        {message.text ? (
          <div className="message__content">
            <span>{message.text}</span>
            <div className="message__info">
              <span>{time}</span>
              {message.is_read && <img src={checkReadIcon} alt="Check Read Icon" />}
            </div>
          </div>
        ) : (
          <div className="message__info-blur">
            <span>{time}</span>
            {message.is_read && <img src={checkReadWhiteIcon} alt="Check Read Icon" />}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageItem
