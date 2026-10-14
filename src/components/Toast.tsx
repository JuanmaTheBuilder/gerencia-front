interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

const styles = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  return (
    <div className={`${styles[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 min-w-[300px]`}>
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-white hover:text-gray-200 text-lg leading-none">
          ×
        </button>
      )}
    </div>
  );
}
