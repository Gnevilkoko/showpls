import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import Header from "../../shared/components/Header"
import Navigation from "../../shared/components/Navigation"
import { useAppSelector } from "../../store"
import type { RootState } from "../../store"
import ChatsTab from "./tabs/ChatsTab"
import ArbitrationTab from "./tabs/ArbitrationTab"
import SpecialsTab from "./tabs/SpecialsTab"

type AdminTab = "chats" | "arbitration" | "specials"

const TABS: AdminTab[] = ["chats", "arbitration", "specials"]

export default function AdminPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const userData = useAppSelector((state: RootState) => state.user.userData)
  const isAdmin = userData?.role === "admin"

  const rawTab = params.get("tab")
  const activeTab: AdminTab = TABS.includes(rawTab as AdminTab) ? (rawTab as AdminTab) : "chats"

  const setTab = (tab: AdminTab) => {
    setParams({ tab }, { replace: true })
  }

  useEffect(() => {
    if (userData && !isAdmin) {
      navigate("/home", { replace: true })
    }
  }, [userData, isAdmin, navigate])

  if (!userData || !isAdmin) return null

  return (
    <div className="page admin-panel">
      <Header />
      <div className="admin-panel__content">
        <h1 className="admin-panel__title">{t("adminPanel.title")}</h1>

        <div className="admin-panel__tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-panel__tab ${activeTab === tab ? "admin-panel__tab--active" : ""}`}
              onClick={() => setTab(tab)}
            >
              {t(`adminPanel.tab_${tab}`)}
            </button>
          ))}
        </div>

        <div className="admin-panel__body">
          {activeTab === "chats" && <ChatsTab />}
          {activeTab === "arbitration" && <ArbitrationTab />}
          {activeTab === "specials" && <SpecialsTab />}
        </div>
      </div>
      <Navigation />
    </div>
  )
}
