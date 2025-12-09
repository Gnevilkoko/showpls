import { useState, useEffect } from "react"
import Header from "../../shared/components/Header"
import { useLocation } from "react-router-dom"
import ToggleProfileMode from "../../shared/components/ToggleProfileMode"
import { useTranslation } from "react-i18next"
import Navigation from "../../shared/components/Navigation"
import CustomerTaskForm from "./screens/CustomerTaskForm"
import PerformerDiscover from "./screens/PerformerDiscover"

const Tasks = () => {
  const location = useLocation()
  const locationState = location.state
  const { t } = useTranslation()

  const [activeMode, setActiveMode] = useState<"customer" | "performer">(
    locationState?.mode === "createTask" ? "customer" : "performer"
  )

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [activeMode])

  return (
    <div className="page tasks">
      <Header />

      <h1 className="tasks-page-title">
        {activeMode === "customer" ? t("tasksPage.customerTitlePage") : t("tasksPage.performerTitlePage")}
      </h1>

      <ToggleProfileMode activeMode={activeMode} callback={(val: "customer" | "performer") => setActiveMode(val)} />

      {activeMode === "customer" && <CustomerTaskForm callback={() => setActiveMode("performer")} />}

      {activeMode === "performer" && <PerformerDiscover />}

      <Navigation />
    </div>
  )
}

export default Tasks
