import paperclipIcon from '../../../assets/paperclip.svg';
import emojiIcon from '../../../assets/emoji.svg';
import sendIcon from '../../../assets/send.svg';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

type MessageInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const MessageInput = ({ value, onChange }: MessageInputProps) => {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <div className="message-input__container">
      <button className="added-attachments-btn">
        <img src={paperclipIcon} alt="Paperclip Icon" />
      </button>

      <div className="message-input__wrapper">
        <textarea
          className="message-input"
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          ref={textareaRef}
          placeholder={t('message')}
        />

        <button className="message-input__emoji-btn">
          <img src={emojiIcon} alt="Emoji Icon" />
        </button>
      </div>

      <button className="send-message-btn">
        <img src={sendIcon} alt="Send Icon" />
      </button>
    </div>
  );
};

export default MessageInput;
