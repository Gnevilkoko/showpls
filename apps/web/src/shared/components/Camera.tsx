import { useEffect, useRef, useState } from "react"

interface CameraProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

const Camera = ({ isOpen, onClose, onCapture }: CameraProps) => {
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment")
  const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo")
  const [isRecording, setIsRecording] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const getCameraStream = async (facingMode: "environment" | "user", needsAudio = false) => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: needsAudio,
      })
    } catch {
      // Если указанная камера недоступна, пробуем любую доступную камеру
      return await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: needsAudio,
      })
    }
  }

  const handleSwitchCamera = async () => {
    if (!streamRef.current) return

    const newFacingMode = cameraFacing === "environment" ? "user" : "environment"

    // Останавливаем текущий поток
    streamRef.current.getTracks().forEach((track) => track.stop())

    try {
      const newStream = await getCameraStream(newFacingMode, cameraMode === "video")
      if (newStream && videoRef.current) {
        streamRef.current = newStream
        videoRef.current.srcObject = newStream
        videoRef.current.muted = true
        setCameraFacing(newFacingMode)
      }
    } catch (error) {
      console.error("Ошибка при переключении камеры:", error)
    }
  }

  const handleSwitchMode = async () => {
    // Если идет запись, останавливаем её
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current = null
    }

    const newMode = cameraMode === "photo" ? "video" : "photo"
    const needsAudio = newMode === "video"
    setCameraMode(newMode)

    // Если камера открыта, нужно перезапустить поток с новым режимом аудио
    if (isOpen && streamRef.current) {
      // Останавливаем текущий поток
      streamRef.current.getTracks().forEach((track) => track.stop())

      try {
        const newStream = await getCameraStream(cameraFacing, needsAudio)
        if (newStream && videoRef.current) {
          streamRef.current = newStream
          videoRef.current.srcObject = newStream
          videoRef.current.muted = true
        }
      } catch (error) {
        console.error("Ошибка при переключении режима:", error)
      }
    }
  }

  // Инициализация камеры и установка потока на видео элемент
  useEffect(() => {
    let stream: MediaStream | null = null
    let videoElement: HTMLVideoElement | null = null

    if (isOpen) {
      const initializeCamera = async () => {
        try {
          const cameraStream = await getCameraStream(cameraFacing, cameraMode === "video")
          videoElement = videoRef.current
          if (cameraStream && videoElement) {
            stream = cameraStream
            streamRef.current = stream
            videoElement.srcObject = stream
            videoElement.muted = true
            await videoElement.play()
            console.log("Камера успешно запущена")
          }
        } catch (error) {
          console.error("Ошибка при открытии камеры:", error)
          alert("Не удалось открыть камеру. Пожалуйста, разрешите доступ к камере.")
          onClose()
        }
      }
      initializeCamera()
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoElement) {
        videoElement.srcObject = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleCapturePhoto = () => {
    if (!videoRef.current) return

    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
            onCapture(file)
            handleCloseCamera()
          }
        },
        "image/jpeg",
        0.9
      )
    }
  }

  const handleStartRecording = () => {
    if (!streamRef.current || !videoRef.current) return

    recordedChunksRef.current = []
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp8",
    })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
      const file = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" })
      onCapture(file)
      handleCloseCamera()
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current = null
    }
  }

  const handleCloseCamera = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    recordedChunksRef.current = []
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="camera-modal">
      <div className="camera-modal__controls">
        <button
          onClick={handleSwitchCamera}
          className="camera-modal__control-btn"
          type="button"
          title="Переключить камеру"
        >
          🔄
        </button>
        <button
          onClick={handleSwitchMode}
          className="camera-modal__control-btn"
          type="button"
          title={cameraMode === "photo" ? "Переключить на видео" : "Переключить на фото"}
        >
          {cameraMode === "photo" ? "📹" : "📷"}
        </button>
      </div>

      <video ref={videoRef} autoPlay playsInline muted className="camera-modal__video" />

      {isRecording && (
        <div className="camera-modal__recording-indicator">
          <div className="camera-modal__recording-dot" />
          Запись...
        </div>
      )}

      <div className="camera-modal__actions">
        {cameraMode === "photo" ? (
          <button
            onClick={handleCapturePhoto}
            className="camera-modal__action-btn camera-modal__action-btn--green"
            type="button"
          >
            Сделать фото
          </button>
        ) : (
          <>
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="camera-modal__action-btn camera-modal__action-btn--red"
                type="button"
              >
                Начать запись
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="camera-modal__action-btn camera-modal__action-btn--red"
                type="button"
              >
                Остановить запись
              </button>
            )}
          </>
        )}
        <button
          onClick={handleCloseCamera}
          className="camera-modal__action-btn camera-modal__action-btn--gray"
          type="button"
        >
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default Camera
