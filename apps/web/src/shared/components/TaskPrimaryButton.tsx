interface TaskPrimaryButtonProps {
  onClick: () => void
  icon?: string | null
  text: string
  color: "green" | "blue" | "none"
  disabled?: boolean
}

const TaskPrimaryButton = ({ onClick, icon, text, color, disabled }: TaskPrimaryButtonProps) => {
  return (
    <button className={`task__action-btn ${color}`} onClick={onClick} type="button" disabled={disabled}>
      {icon && <img src={icon} alt="Action Icon" />}
      <span>{text}</span>
    </button>
  )
}

export default TaskPrimaryButton
