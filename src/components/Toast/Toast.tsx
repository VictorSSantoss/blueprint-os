import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from 'lucide-react';
import type { Toast as ToastType } from './toastStore';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const icons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-ember-wash border-ember/20 text-ember',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-teal-wash border-teal/20 text-teal-deep',
};

const iconStyles = {
  success: 'text-green-600',
  error: 'text-ember',
  warning: 'text-amber-600',
  info: 'text-teal',
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-sm ${styles[toast.type]}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconStyles[toast.type]}`} />
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
        aria-label="Dismiss"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
