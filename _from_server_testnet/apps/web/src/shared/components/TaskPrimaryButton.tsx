interface TaskPrimaryButtonProps {
  onClick: () => void
  icon?: string | null
  text: string
  color: "green" | "blue" | "none"
  disabled?: boolean
  disabledHint?: string
}

const TaskPrimaryButton = ({ onClick, icon, text, color, disabled, disabledHint }: TaskPrimaryButtonProps) => {
  return (
    <div className="task__action-btn-wrap">
      <button className={`task__action-btn ${color}`} onClick={onClick} type="button" disabled={disabled}>
        {icon && <img src={icon} alt="Action Icon" />}
        <span>{text}</span>
      </button>
      {disabled && disabledHint && <span className="task__action-btn-hint">{disabledHint}</span>}
    </div>
  )
}

export default TaskPrimaryButton
