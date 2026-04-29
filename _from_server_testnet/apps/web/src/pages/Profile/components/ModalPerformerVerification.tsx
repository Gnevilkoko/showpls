import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import Modal from "../../../shared/components/Modal"
import TaskPrimaryButton from "../../../shared/components/TaskPrimaryButton"
import { useNotification } from "../../../shared/hooks/useNotification"
import {
  collectDeviceProfileSync,
  enrichDeviceProfileWithHints,
  requestGeolocationPosition,
  type CollectedDeviceProfile,
} from "../../../shared/utils/performerDeviceProfile"
import {
  usePatchPerformerVerificationGeoMutation,
  useSubmitPerformerVerificationMutation,
} from "../../../store/api/userApi"
import { useAppDispatch, useAppSelector } from "../../../store"
import { updateUserPartial } from "../../../store/userSlice"
import verificationShieldIcon from "../../../assets/icons/ui/security-safe.svg"
import locationGreenIcon from "../../../assets/icons/ui/location-green.svg"

interface ModalPerformerVerificationProps {
  isOpen: boolean
  onClose: () => void
}

function osLabel(os: CollectedDeviceProfile["os"]): string {
  if (os === "ios") return "iOS"
  if (os === "android") return "Android"
  return "Web"
}

const ModalPerformerVerification = ({ isOpen, onClose }: ModalPerformerVerificationProps) => {
  const { t } = useTranslation()
  const notification = useNotification()
  const dispatch = useAppDispatch()
  const userData = useAppSelector((s) => s.user.userData)
  const [submitVerification, { isLoading: submitting }] = useSubmitPerformerVerificationMutation()
  const [patchGeo, { isLoading: patchingGeo }] = usePatchPerformerVerificationGeoMutation()

  const isVerified =
    userData?.performerVerification != null && typeof userData.performerVerification === "object"
  const isLoading = submitting || patchingGeo

  const [device, setDevice] = useState<CollectedDeviceProfile>(() => collectDeviceProfileSync())
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [accuracyM, setAccuracyM] = useState<number | null>(null)
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle")
  const [geoErrorKey, setGeoErrorKey] = useState<string | null>(null)

  const savedCoordsKeyRef = useRef("")

  useEffect(() => {
    if (!isOpen) {
      savedCoordsKeyRef.current = ""
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    const pv = userData?.performerVerification as
      | { latitude?: unknown; longitude?: unknown; accuracyM?: unknown }
      | undefined
    if (
      pv != null &&
      typeof pv.latitude === "number" &&
      typeof pv.longitude === "number" &&
      Number.isFinite(pv.latitude) &&
      Number.isFinite(pv.longitude)
    ) {
      setLat(pv.latitude)
      setLng(pv.longitude)
      const acc = pv.accuracyM
      setAccuracyM(acc != null && typeof acc === "number" ? Math.round(acc) : null)
    } else {
      setLat(null)
      setLng(null)
      setAccuracyM(null)
    }

    setGeoStatus("loading")
    setGeoErrorKey(null)

    ;(async () => {
      const enriched = await enrichDeviceProfileWithHints(collectDeviceProfileSync())
      if (!cancelled) setDevice(enriched)
      try {
        const pos = await requestGeolocationPosition()
        if (cancelled) return
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setAccuracyM(pos.coords.accuracy != null ? Math.round(pos.coords.accuracy) : null)
        setGeoStatus("ok")
      } catch (err: unknown) {
        if (cancelled) return
        setGeoStatus("error")
        const code = err && typeof err === "object" && "code" in err ? (err as GeolocationPositionError).code : undefined
        if (code === 1) setGeoErrorKey("performerVerification.locationDenied")
        else if (code === 2) setGeoErrorKey("performerVerification.locationUnavailable")
        else if (code === 3) setGeoErrorKey("performerVerification.locationTimeout")
        else if (err instanceof Error && err.message === "GEO_UNSUPPORTED")
          setGeoErrorKey("performerVerification.locationUnsupported")
        else setGeoErrorKey("performerVerification.locationError")
      }
    })()

    return () => {
      cancelled = true
    }
  /** Не завязываемся на объект performerVerification — иначе после patch снова дергается гео. */
  }, [isOpen, userData?.id])

  useEffect(() => {
    if (!isOpen || !isVerified || geoStatus !== "ok" || lat == null || lng == null || patchingGeo) return
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
    if (savedCoordsKeyRef.current === key) return
    savedCoordsKeyRef.current = key

    void (async () => {
      try {
        const res = await patchGeo({
          latitude: lat,
          longitude: lng,
          accuracyM,
        }).unwrap()
        dispatch(
          updateUserPartial({
            performerVerification: res.performerVerification as Record<string, unknown>,
          }),
        )
      } catch {
        savedCoordsKeyRef.current = ""
      }
    })()
  }, [isOpen, isVerified, geoStatus, lat, lng, accuracyM, patchGeo, dispatch, notification, patchingGeo])

  const retryGeolocation = useCallback(() => {
    setGeoStatus("loading")
    setGeoErrorKey(null)
    requestGeolocationPosition()
      .then((pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setAccuracyM(pos.coords.accuracy != null ? Math.round(pos.coords.accuracy) : null)
        setGeoStatus("ok")
      })
      .catch((err: GeolocationPositionError | Error) => {
        setGeoStatus("error")
        const code = "code" in err ? err.code : undefined
        if (code === 1) setGeoErrorKey("performerVerification.locationDenied")
        else if (code === 2) setGeoErrorKey("performerVerification.locationUnavailable")
        else if (code === 3) setGeoErrorKey("performerVerification.locationTimeout")
        else if (err.message === "GEO_UNSUPPORTED") setGeoErrorKey("performerVerification.locationUnsupported")
        else setGeoErrorKey("performerVerification.locationError")
      })
  }, [])

  const handleSubmitFirstVerification = async () => {
    if (lat == null || lng == null) {
      notification.showError("performerVerificationNeedLocation")
      return
    }
    try {
      const res = await submitVerification({
        latitude: lat,
        longitude: lng,
        accuracyM,
        os: device.os,
        osVersion: device.osVersion || "—",
        deviceModel: device.deviceModel,
        userAgent: device.userAgent || "—",
      }).unwrap()

      dispatch(
        updateUserPartial({
          performerVerification: res.performerVerification as Record<string, unknown>,
        }),
      )
      notification.showSuccess("performerVerificationComplete")
      onClose()
    } catch {
      notification.showError("somethingWentWrong")
    }
  }

  const osText = osLabel(device.os)
  const osVersionText = device.osVersion ? ` ${device.osVersion}` : ""

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="modal__header">{t("performerVerification.title")}</h2>
      <p className="performer-verification__intro">
        {t(isVerified ? "performerVerification.introUpdateGeo" : "performerVerification.intro")}
      </p>

      <div className="performer-verification__info-card">
        <div className="performer-verification__info-row">
          <span className="performer-verification__info-label">{t("performerVerification.deviceOs")}</span>
          <span className="performer-verification__info-value">
            {osText}
            {osVersionText}
          </span>
        </div>
        <div className="performer-verification__divider" />
        <div className="performer-verification__info-row">
          <span className="performer-verification__info-label">{t("performerVerification.deviceModel")}</span>
          <span className="performer-verification__info-value">{device.deviceModel}</span>
        </div>
        <div className="performer-verification__divider" />
        <div className="performer-verification__info-row">
          <span className="performer-verification__info-label">
            <img src={locationGreenIcon} alt="" className="performer-verification__row-icon" />
            {t("performerVerification.location")}
          </span>
          {geoStatus === "loading" ? (
            <span className="performer-verification__info-value performer-verification__info-value--muted">
              {t("performerVerification.gettingLocation")}
            </span>
          ) : geoStatus === "ok" && lat != null && lng != null ? (
            <span className="performer-verification__info-value performer-verification__info-value--geo">
              {lat.toFixed(5)}, {lng.toFixed(5)}
              {accuracyM != null ? <span className="performer-verification__accuracy">±{accuracyM} m</span> : null}
            </span>
          ) : (
            <span className="performer-verification__info-value performer-verification__info-value--muted">
              {t("performerVerification.locationPending")}
            </span>
          )}
        </div>
      </div>

      {geoStatus === "error" && geoErrorKey && <p className="performer-verification__error">{t(geoErrorKey)}</p>}

      {geoStatus === "error" && (
        <TaskPrimaryButton
          color="green"
          icon={verificationShieldIcon}
          text={t("performerVerification.retryLocation")}
          onClick={retryGeolocation}
          disabled={isLoading}
        />
      )}

      {!isVerified && (
        <TaskPrimaryButton
          color="green"
          icon={verificationShieldIcon}
          text={t("performerVerification.submit")}
          onClick={handleSubmitFirstVerification}
          disabled={isLoading || geoStatus !== "ok" || lat == null || lng == null}
        />
      )}
    </Modal>
  )
}

export default ModalPerformerVerification
