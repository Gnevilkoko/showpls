interface TaskPrimaryButtonProps {
  onClick: () => void
  icon?: string | null
  text: string
  color: "green" | "blue" | "none"
}

const TaskPrimaryButton = ({ onClick, icon, text, color }: TaskPrimaryButtonProps) => {
  return (
    <button className={`task__action-btn ${color}`} onClick={onClick} type="button">
      {icon && <img src={icon} alt="Action Icon" />}
      <span>{text}</span>
    </button>
  )
}

export default TaskPrimaryButton
