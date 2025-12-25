import toast from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export const useToast = () => {
  const notify = (message: string, type: ToastType = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message, {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#fff',
            fontWeight: '500',
          },
        });
        break;

      case 'error':
        toast.error(message, {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: '500',
          },
        });
        break;

      case 'warning':
        toast(message, {
          duration: 3500,
          position: 'top-right',
          icon: '⚠️',
          style: {
            background: '#f59e0b',
            color: '#fff',
            fontWeight: '500',
          },
        });
        break;

      case 'info':
      default:
        toast(message, {
          duration: 3000,
          position: 'top-right',
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff',
            fontWeight: '500',
          },
        });
        break;
    }
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        style: {
          minWidth: '250px',
        },
        success: {
          duration: 3000,
          icon: '✅',
        },
        error: {
          duration: 4000,
          icon: '❌',
        },
      }
    );
  };

  return { notify, promise };
};
