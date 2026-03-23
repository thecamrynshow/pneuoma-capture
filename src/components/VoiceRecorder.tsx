'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'

interface AudioRecorderPlugin {
  requestPermission(): Promise<{ granted: boolean }>
  startRecording(): Promise<{ recording: boolean }>
  stopRecording(): Promise<{ base64: string; mimeType: string; duration: number }>
}

let NativeAudioRecorder: AudioRecorderPlugin | null = null
try {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    NativeAudioRecorder = registerPlugin<AudioRecorderPlugin>('AudioRecorder')
  }
} catch {
  NativeAudioRecorder = null
}

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  disabled?: boolean
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64)
  const bytes = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    bytes[i] = byteChars.charCodeAt(i)
  }
  return new Blob([bytes.buffer as ArrayBuffer], { type: mimeType })
}

function getSupportedMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return 'audio/webm'
}

type RecordingMode = 'native' | 'web'

export default function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const activeMode = useRef<RecordingMode>('web')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startTimer = () => {
    setDuration(0)
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
  }

  const startWebRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000, channelCount: 1 },
    })
    streamRef.current = stream
    setPermissionStatus('granted')

    const mimeType = getSupportedMimeType()
    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 })
    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      stream.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      onRecordingComplete(blob)
    }

    recorder.start(500)
    activeMode.current = 'web'
    setRecording(true)
    startTimer()
  }, [onRecordingComplete])

  const startRecording = useCallback(async () => {
    // Try native plugin first on iOS
    if (NativeAudioRecorder) {
      try {
        const permResult = await NativeAudioRecorder.requestPermission()
        if (!permResult.granted) {
          setPermissionStatus('denied')
          return
        }
        setPermissionStatus('granted')
        await NativeAudioRecorder.startRecording()
        activeMode.current = 'native'
        setRecording(true)
        startTimer()
        return
      } catch {
        // Native plugin not available, fall through to web API
      }
    }

    // Fall back to getUserMedia (works with HTTPS + WKUIDelegate)
    try {
      await startWebRecording()
    } catch {
      setPermissionStatus('denied')
    }
  }, [startWebRecording])

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRecording(false)

    if (activeMode.current === 'native' && NativeAudioRecorder) {
      try {
        const result = await NativeAudioRecorder.stopRecording()
        const blob = base64ToBlob(result.base64, result.mimeType)
        onRecordingComplete(blob)
      } catch {
        // Recording may have been too short
      }
    } else {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [onRecordingComplete])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (permissionStatus === 'denied') {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--text-secondary)] font-semibold mb-1">Microphone access required</p>
        <p className="text-xs text-[var(--text-muted)] mb-3">Tap the microphone button to allow access when prompted.</p>
        <button
          onClick={() => setPermissionStatus('unknown')}
          className="text-xs text-[var(--accent)] font-semibold hover:opacity-80"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-10">
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled}
        className={`w-[120px] h-[120px] rounded-full border-none flex items-center justify-center cursor-pointer transition-all relative ${
          recording
            ? 'bg-[var(--accent-red)] animate-pulse-rec'
            : 'bg-[var(--accent)] shadow-[0_8px_32px_rgba(245,158,11,0.3)] hover:scale-105 hover:shadow-[0_8px_40px_rgba(245,158,11,0.4)] active:scale-[0.97]'
        } disabled:bg-[var(--bg-elevated)] disabled:shadow-none disabled:cursor-not-allowed`}
      >
        {recording ? (
          <svg className="w-11 h-11 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-11 h-11 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>

      {recording && (
        <p className="text-[28px] font-extrabold tabular-nums text-[var(--accent-red)] mt-4">
          {formatTime(duration)}
        </p>
      )}

      <p className="text-[13px] text-[var(--text-muted)] mt-3">
        {recording ? 'Tap to stop recording' : 'Tap to start recording'}
      </p>
    </div>
  )
}
