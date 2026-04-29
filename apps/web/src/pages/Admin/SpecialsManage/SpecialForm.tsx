import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { CreateSpecialInput, UpdateSpecialInput } from "../../../store/api/specialsApi"
import type { SpecialBackend } from "../../../shared/types/backend"

type SpecialFormProps = {
  initial?: SpecialBackend | null
  onSubmit: (values: CreateSpecialInput | UpdateSpecialInput) => void
  onCancel: () => void
  isSubmitting: boolean
}

const defaultLocalized = () => ({ ru: "", en: "" })

export default function SpecialForm({ initial, onSubmit, onCancel, isSubmitting }: SpecialFormProps) {
  const { t } = useTranslation()

  const getDefaultValues = (): CreateSpecialInput => {
    if (initial) {
      return {
        section: initial.section,
        title: initial.title,
        description: initial.description,
        steps: initial.steps?.length ? initial.steps : [{ ru: "", en: "" }],
        partnerName: initial.partnerName,
        partnerShort: initial.partnerShort,
        partnerColor: initial.partnerColor,
        badge: initial.badge ?? undefined,
        actionType: initial.actionType,
        actionPayload: initial.actionPayload ?? undefined,
        actionLabel: initial.actionLabel,
        rewardAmount: initial.rewardAmount,
        isActive: !initial.claimStatus || initial.claimStatus !== "unavailable",
        startsAt: initial.startsAt ?? undefined,
        endsAt: initial.endsAt ?? undefined,
        sortOrder: 0,
        claimLimitPerUser: initial.claimLimitPerUser ?? 1,
      }
    }
    return {
      section: "missions",
      title: defaultLocalized(),
      description: defaultLocalized(),
      steps: [defaultLocalized()],
      partnerName: "",
      partnerShort: "",
      partnerColor: "#2CD896",
      actionType: "findTask",
      actionLabel: defaultLocalized(),
      rewardAmount: 50,
      isActive: true,
      sortOrder: 0,
      claimLimitPerUser: 1,
    }
  }

  const [form, setForm] = useState<CreateSpecialInput>(getDefaultValues)

  useEffect(() => {
    setForm(getDefaultValues())
  }, [initial?.id])

  const update = (patch: Partial<CreateSpecialInput>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const updateLocalized = (
    key: "title" | "description" | "actionLabel" | "badge",
    lang: "ru" | "en",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], [lang]: value },
    }))
  }

  const updateStep = (index: number, lang: "ru" | "en", value: string) => {
    setForm((prev) => {
      const steps = [...(prev.steps || [defaultLocalized()])]
      if (!steps[index]) steps[index] = defaultLocalized()
      steps[index] = { ...steps[index], [lang]: value }
      return { ...prev, steps }
    })
  }

  const addStep = () => {
    setForm((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), defaultLocalized()],
    }))
  }

  const removeStep = (index: number) => {
    setForm((prev) => {
      const steps = (prev.steps || []).filter((_, i) => i !== index)
      return { ...prev, steps: steps.length ? steps : [defaultLocalized()] }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form }
    const steps = payload.steps?.filter((s) => s.ru.trim() || s.en.trim()) ?? []
    if (steps.length === 0) payload.steps = [{ ru: "", en: "" }]
    else payload.steps = steps
    if (!payload.badge?.ru && !payload.badge?.en) payload.badge = null
    onSubmit(initial ? payload : (payload as CreateSpecialInput))
  }

  const steps = form.steps ?? [defaultLocalized()]

  return (
    <form onSubmit={handleSubmit} className="admin-specials-form">
      <div className="admin-specials-form__card">
        <h3 className="admin-specials-form__section-title">{t("adminSpecials.section")}</h3>
        <select
          value={form.section}
          onChange={(e) => update({ section: e.target.value as "missions" | "hotspots" })}
          className="admin-specials-form__input"
        >
          <option value="missions">{t("adminSpecials.sectionMissions")}</option>
          <option value="hotspots">{t("adminSpecials.sectionHotspots")}</option>
        </select>
      </div>

      <div className="admin-specials-form__card">
        <h3 className="admin-specials-form__section-title">{t("adminSpecials.partnerName")}</h3>
        <div className="admin-specials-form__row-2">
          <input
            type="text"
            value={form.partnerName}
            onChange={(e) => update({ partnerName: e.target.value })}
            placeholder="Nike"
            className="admin-specials-form__input"
            required
          />
          <input
            type="text"
            value={form.partnerShort}
            onChange={(e) => update({ partnerShort: e.target.value })}
            placeholder="N"
            maxLength={12}
            className="admin-specials-form__input admin-specials-form__input--short"
            required
          />
        </div>
        <label className="admin-specials-form__label">{t("adminSpecials.partnerColor")}</label>
        <div className="admin-specials-form__color-row">
          <input
            type="color"
            value={form.partnerColor}
            onChange={(e) => update({ partnerColor: e.target.value })}
            className="admin-specials-form__color-picker"
          />
          <input
            type="text"
            value={form.partnerColor}
            onChange={(e) => update({ partnerColor: e.target.value })}
            placeholder="#2CD896"
            className="admin-specials-form__input"
          />
        </div>
      </div>

      <div className="admin-specials-form__card">
        <h3 className="admin-specials-form__section-title">{t("adminSpecials.titleRu")} / {t("adminSpecials.titleEn")}</h3>
        <input
          type="text"
          value={form.title.ru}
          onChange={(e) => updateLocalized("title", "ru", e.target.value)}
          placeholder="Заголовок RU"
          className="admin-specials-form__input"
          required
        />
        <input
          type="text"
          value={form.title.en}
          onChange={(e) => updateLocalized("title", "en", e.target.value)}
          placeholder="Title EN"
          className="admin-specials-form__input"
          required
        />
      </div>

      <div className="admin-specials-form__card">
        <h3 className="admin-specials-form__section-title">{t("adminSpecials.descriptionRu")} / {t("adminSpecials.descriptionEn")}</h3>
        <textarea
          value={form.description.ru}
          onChange={(e) => updateLocalized("description", "ru", e.target.value)}
          placeholder="Описание RU"
          rows={2}
          className="admin-specials-form__input admin-specials-form__textarea"
        />
        <textarea
          value={form.description.en}
          onChange={(e) => updateLocalized("description", "en", e.target.value)}
          placeholder="Description EN"
          rows={2}
          className="admin-specials-form__input admin-specials-form__textarea"
        />
      </div>

      <div className="admin-specials-form__card">
        <h3 className="admin-specials-form__section-title">{t("adminSpecials.steps")}</h3>
        {steps.map((step, i) => (
          <div key={i} className="admin-specials-form__step">
            <span className="admin-specials-form__step-num">{i + 1}</span>
            <input
              type="text"
              value={step.ru}
              onChange={(e) => updateStep(i, "ru", e.target.value)}
              placeholder={`${t("adminSpecials.stepRu")} ${i + 1}`}
              className="admin-specials-form__input"
            />
            <input
              type="text"
              value={step.en}
              onChange={(e) => updateStep(i, "en", e.target.value)}
              placeholder={`${t("adminSpecials.stepEn")} ${i + 1}`}
              className="admin-specials-form__input"
            />
            <button type="button" onClick={() => removeStep(i)} className="admin-specials-form__remove-step" aria-label="Remove step">
              ×
            </button>
          </div>
        ))}
        <button type="button" onClick={addStep} className="admin-specials-form__add-step">
          + {t("adminSpecials.steps")}
        </button>
      </div>

      <div className="admin-specials-form__card">
        <h3 className="admin-specials-form__section-title">{t("adminSpecials.badgeRu")} / {t("adminSpecials.badgeEn")} (optional)</h3>
        <input
          type="text"
          value={form.badge?.ru ?? ""}
          onChange={(e) => update({ badge: { ...(form.badge ?? defaultLocalized()), ru: e.target.value } })}
          placeholder="Бейдж RU"
          className="admin-specials-form__input"
        />
        <input
          type="text"
          value={form.badge?.en ?? ""}
          onChange={(e) => update({ badge: { ...(form.badge ?? defaultLocalized()), en: e.target.value } })}
          placeholder="Badge EN"
          className="admin-specials-form__input"
        />
      </div>

      <div className="admin-specials-form__card">
        <h3 className="admin-specials-form__section-title">{t("adminSpecials.rewardAmount")}</h3>
        <div className="admin-specials-form__row-2">
          <input
            type="number"
            min={0}
            value={form.rewardAmount}
            onChange={(e) => update({ rewardAmount: Number(e.target.value) || 0 })}
            className="admin-specials-form__input"
          />
          <label className="admin-specials-form__checkbox-label">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => update({ isActive: e.target.checked })}
            />
            {t("adminSpecials.isActive")}
          </label>
        </div>
        <div className="admin-specials-form__row-2">
          <input
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) => update({ sortOrder: Number(e.target.value) || 0 })}
            placeholder={t("adminSpecials.sortOrder")}
            className="admin-specials-form__input"
          />
          <input
            type="number"
            min={0}
            value={form.claimLimitPerUser ?? 1}
            onChange={(e) => update({ claimLimitPerUser: Number(e.target.value) || 1 })}
            placeholder={t("adminSpecials.claimLimitPerUser")}
            className="admin-specials-form__input"
          />
        </div>
      </div>

      <div className="admin-specials-form__card">
        <h3 className="admin-specials-form__section-title">{t("adminSpecials.startsAt")} / {t("adminSpecials.endsAt")}</h3>
        <input
          type="datetime-local"
          value={form.startsAt ? form.startsAt.slice(0, 16) : ""}
          onChange={(e) => update({ startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
          className="admin-specials-form__input"
        />
        <input
          type="datetime-local"
          value={form.endsAt ? form.endsAt.slice(0, 16) : ""}
          onChange={(e) => update({ endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
          className="admin-specials-form__input"
        />
      </div>

      <div className="admin-specials-form__actions">
        <button type="button" className="admin-specials-form__btn admin-specials-form__btn--cancel" onClick={onCancel}>
          {t("adminSpecials.cancel")}
        </button>
        <button type="submit" className="admin-specials-form__btn admin-specials-form__btn--submit" disabled={isSubmitting}>
          {isSubmitting ? "..." : t("adminSpecials.save")}
        </button>
      </div>
    </form>
  )
}
