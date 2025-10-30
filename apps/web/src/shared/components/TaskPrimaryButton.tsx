interface TaskPrimaryButtonProps {
  onClick: () => void
  icon: string
  text: string
}

const TaskPrimaryButton = ({ onClick, icon, text }: TaskPrimaryButtonProps) => {
  return (
    <button className="task__first-action-btn" onClick={onClick} type="button">
      <img src={icon} alt="Action Icon" />
      <span>{text}</span>
    </button>
  )
}

export default TaskPrimaryButton
