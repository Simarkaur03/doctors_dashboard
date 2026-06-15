"use client";

import React, { useEffect, useState } from "react";
import {
  subscribeToToasts,
  removeToast,
  type Toast,
} from "@/lib/toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const toastIcons = {
  success: <CheckCircle className="w-5 h-5 text-green-600" />,
  error: <AlertCircle className="w-5 h-5 text-red-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
};

const toastStyles = {
  success:
    "bg-green-50 border-green-200 text-green-900",
  error: "bg-red-50 border-red-200 text-red-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${toastStyles[toast.type]} shadow-md animate-slideIn`}
      role="alert"
    >
      {toastIcons[toast.type]}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-current opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts(setToasts);
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full px-4">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}
