'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import type { FoodResult } from '@/types'

interface BarcodeScannerProps {
  onSelect: (food: FoodResult) => void
}

type ScanState = 'scanning' | 'loading' | 'not-found' | 'error'

function describeError(err: unknown): string {
  if (!navigator.mediaDevices) {
    return 'Camera access requires HTTPS. Please use a secure connection.'
  }
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') {
      return 'Camera permission denied. Please allow camera access and try again.'
    }
    if (err.name === 'NotFoundError') {
      return 'No camera found on this device.'
    }
    if (err.name === 'NotReadableError') {
      return 'Camera is in use by another app. Please close it and try again.'
    }
    if (err.name === 'OverconstrainedError') {
      return 'Camera constraint error. Please try again.'
    }
    return err.message || 'Unable to start camera.'
  }
  if (err instanceof Error) {
    if (err.message.toLowerCase().includes('permission')) {
      return 'Camera permission denied. Please allow camera access and try again.'
    }
    return err.message || 'Unable to start camera.'
  }
  return 'Unable to start camera.'
}

export function BarcodeScanner({ onSelect }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scanState, setScanState] = useState<ScanState>('scanning')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Prevent firing multiple times on a single barcode read
  const didScanRef = useRef(false)

  const handleCode = useCallback(
    async (rawCode: string) => {
      if (didScanRef.current) return
      didScanRef.current = true
      setScanState('loading')

      try {
        const res = await fetch(`/api/food/barcode/${encodeURIComponent(rawCode)}`)
        if (res.status === 404) {
          setScanState('not-found')
          return
        }
        if (!res.ok) throw new Error('Lookup failed')
        const food: FoodResult = await res.json()
        onSelect(food)
      } catch {
        setErrorMsg('Failed to look up barcode. Please try again.')
        setScanState('error')
      }
    },
    [onSelect],
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Guard: camera API requires HTTPS (or localhost)
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Camera access requires HTTPS. Please use a secure connection.')
      setScanState('error')
      return
    }

    let stopFn: (() => void) | undefined
    let cancelled = false

    import('@zxing/browser').then(({ BrowserMultiFormatReader }) => {
      // Component may have unmounted while import was loading
      if (cancelled || !videoRef.current) return

      const reader = new BrowserMultiFormatReader()
      // Set cleanup immediately so StrictMode double-invocation is handled
      stopFn = () => reader.reset()

      const onDecode = (
        result: import('@zxing/library').Result | undefined,
        err: Error | undefined,
      ) => {
        if (result) {
          handleCode(result.getText())
        }
        // NotFoundException fires on every frame without a barcode — expected, not an error.
        // Use .name check: NotFoundException is not re-exported by @zxing/browser, so
        // `instanceof NotFoundException` would throw when NotFoundException is undefined.
        if (err && err.name !== 'NotFoundException') {
          console.error('[BarcodeScanner]', err)
        }
      }

      // Use `ideal` so browsers fall back to any camera when no rear camera exists
      reader
        .decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          video,
          onDecode,
        )
        .then((controls) => {
          if (cancelled) {
            controls.stop()
          } else {
            stopFn = () => controls.stop()
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setErrorMsg(describeError(err))
            setScanState('error')
          }
        })
    })

    return () => {
      cancelled = true
      stopFn?.()
    }
  }, [handleCode])

  const retry = () => {
    didScanRef.current = false
    setScanState('scanning')
    setErrorMsg(null)
  }

  const [manualCode, setManualCode] = useState('')
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const code = manualCode.trim()
    if (code) handleCode(code)
  }

  return (
    <div className="space-y-4">
      {/* Viewfinder */}
      <div className="relative overflow-hidden rounded-xl bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scanning reticle */}
        {scanState === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-2/5 rounded-lg border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
        )}

        {/* Loading overlay */}
        {scanState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-white text-sm font-medium">Looking up product…</p>
          </div>
        )}
      </div>

      {/* Status messages */}
      {scanState === 'scanning' && (
        <p className="text-sm text-muted-foreground text-center">
          Point your camera at a barcode
        </p>
      )}

      {scanState === 'not-found' && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Product not found in the Open Food Facts database.
          </p>
          <button onClick={retry} className="text-sm text-primary underline underline-offset-2">
            Scan again
          </button>
        </div>
      )}

      {scanState === 'error' && (
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{errorMsg}</p>
          <button onClick={retry} className="text-sm text-primary underline underline-offset-2">
            Try again
          </button>
        </div>
      )}

      {/* Manual barcode entry for testing / fallback */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Enter barcode manually…"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          disabled={scanState === 'loading'}
        />
        <button
          type="submit"
          disabled={!manualCode.trim() || scanState === 'loading'}
          className="shrink-0 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          Look up
        </button>
      </form>
    </div>
  )
}
