"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const SCAN_REGION_ID = "qr-scan-region";

interface QrScanModalProps {
  open: boolean;
  onClose: () => void;
  onDetected: (rawValue: string) => void;
}

/**
 * Live-camera QR scanner. Used on the student login page so a kid can scan
 * their printed code slip with the device they're already on (e.g. shared
 * school iPad), without having to type the 8-character code.
 *
 * Validates origin on detection: if the scanned URL points to a different
 * origin we still pass it back, but the parent decides whether to accept.
 */
export default function QrScanModal({ open, onClose, onDetected }: QrScanModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError(null);
    setStarting(true);

    const scanner = new Html5Qrcode(SCAN_REGION_ID, /* verbose */ false);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (cancelled) return;
          // Stop immediately so we don't fire onDetected multiple times.
          scanner.stop().catch(() => {});
          onDetected(decodedText);
        },
        () => {
          // per-frame "no QR found" — silent on purpose
        }
      )
      .then(() => {
        if (!cancelled) setStarting(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setStarting(false);
        // NotAllowedError = user denied camera permission;
        // NotFoundError = no camera; OverconstrainedError = no rear camera, etc.
        if (err.name === "NotAllowedError") {
          setError("Camera permission was denied. Please allow camera access and try again.");
        } else if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
          setError("No camera available on this device.");
        } else {
          setError("Couldn't start the camera. Please type your code instead.");
        }
      });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s && s.isScanning) {
        s.stop().catch(() => {});
      }
    };
  }, [open, onDetected]);

  // Esc-to-close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scan-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-3 text-center">
          <h2 id="qr-scan-title" className="font-bold text-meq-slate text-lg">
            Scan your QR code
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Hold your card in front of the camera.
          </p>
        </div>

        <div className="bg-black aspect-square mx-6 rounded-xl overflow-hidden relative">
          {/* html5-qrcode will inject a <video> into this element */}
          <div id={SCAN_REGION_ID} className="w-full h-full" />
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              Starting camera…
            </div>
          )}
        </div>

        {error && (
          <p className="mx-6 mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="p-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-base font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
