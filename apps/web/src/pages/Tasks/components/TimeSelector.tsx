import { useEffect, useState } from "react"

interface TimeSelectorProps {
  value: string
  options: number[]
  placeholder: string
  setValue: (value: string) => void
}

const TimeSelector = ({ value, setValue, options, placeholder }: TimeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = (value: number) => {
    setValue(value.toString())
    setIsOpen(!isOpen)
  }

  // Закрытие выпадающих меню при клике вне их
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(".time-selector")) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="time-selector">
      <div className={`time-dropdown-trigger ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
        <span>{value ? value.padStart(2, "0") : placeholder}</span>
        <svg className="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="time-dropdown-menu">
          {options.map((option) => (
            <div
              key={option}
              className={`time-dropdown-item ${value === option.toString() ? "selected" : ""}`}
              onClick={() => handleClick(option)}
            >
              {option.toString().padStart(2, "0")}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TimeSelector
