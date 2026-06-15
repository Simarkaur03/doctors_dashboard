/**
 * Toast Notification System
 * Simple, lightweight toast notifications for user feedback
 */

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // milliseconds, 0 = infinite
}

let toastId = 0;
const toasts: Map<string, Toast> = new Map();
const listeners: Set<(toasts: Toast[]) => void> = new Set();

/**
 * Subscribe to toast changes
 */
export function subscribeToToasts(callback: (toasts: Toast[]) => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Notify all listeners of toast changes
 */
function notifyListeners() {
  listeners.forEach((listener) => listener(Array.from(toasts.values())));
}

/**
 * Show a toast notification
 */
export function showToast(
  message: string,
  type: ToastType = "info",
  duration: number = 4000
): string {
  const id = String(++toastId);
  const toast: Toast = { id, message, type, duration };

  toasts.set(id, toast);
  notifyListeners();

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

/**
 * Remove a specific toast
 */
export function removeToast(id: string) {
  toasts.delete(id);
  notifyListeners();
}

/**
 * Clear all toasts
 */
export function clearToasts() {
  toasts.clear();
  notifyListeners();
}

/**
 * Get all current toasts
 */
export function getToasts(): Toast[] {
  return Array.from(toasts.values());
}

// Convenience functions
export const toast = {
  success: (message: string, duration = 4000) => showToast(message, "success", duration),
  error: (message: string, duration = 5000) => showToast(message, "error", duration),
  info: (message: string, duration = 4000) => showToast(message, "info", duration),
  warning: (message: string, duration = 4000) => showToast(message, "warning", duration),
};
