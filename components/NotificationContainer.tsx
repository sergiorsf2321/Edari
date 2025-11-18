import React from 'react';
import { Notification } from '../types';
import { CheckCircleIcon, XIcon, AlertTriangleIcon, InfoIcon } from './icons/Icons';

interface NotificationContainerProps {
  notifications: Notification[];
  removeNotification: (id: number) => void;
}

const ICONS = {
    success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
    error: <AlertTriangleIcon className="h-6 w-6 text-red-500" />,
    info: <InfoIcon className="h-6 w-6 text-blue-500" />,
};

const NotificationToast: React.FC<{ notification: Notification; onDismiss: (id: number) => void }> = ({ notification, onDismiss }) => {
    const { id, message, type } = notification;

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="w-full max-w-sm bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-fade-in-right"
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {ICONS[type]}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-900">{message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={() => onDismiss(id)}
                            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            aria-label="Fechar"
                        >
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, removeNotification }) => {
  return (
    <div
      aria-live="polite"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;
