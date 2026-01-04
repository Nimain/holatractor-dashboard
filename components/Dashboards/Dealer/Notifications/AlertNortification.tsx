'use client'

import React, { useState } from 'react';
import { AlertCircle, Lightbulb, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'alert' | 'unsuccessful' | 'successful';
  title: string;
  message: string;
}

const AlertPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'alert',
      title: 'Payment Alert',
      message: 'Your payment of $2,450.00 for Invoice #INV-2024-0847 is due in 3 days. Please complete the payment to avoid any service interruption or late fees.'
    },
    {
      id: '2',
      type: 'unsuccessful',
      title: 'Payment Unsuccessful',
      message: 'Your payment of $1,850.00 could not be processed due to insufficient funds in your account ending in 4532. Please update your payment method and try again.'
    },
    {
      id: '3',
      type: 'successful',
      title: 'Payment Successful',
      message: 'Your payment of $3,200.00 for Invoice #INV-2024-0845 has been successfully processed. A receipt has been sent to your registered email address.'
    },
    {
      id: '4',
      type: 'alert',
      title: 'Payment Alert',
      message: 'Your subscription payment of $99.99 will be automatically charged to your card ending in 7821 on January 15, 2026. Please ensure sufficient balance.'
    },
    {
      id: '5',
      type: 'alert',
      title: 'Payment Alert',
      message: 'Outstanding balance of $5,670.00 detected on your account. Immediate payment is required to maintain active service status and avoid account suspension.'
    },
    {
      id: '6',
      type: 'unsuccessful',
      title: 'Payment Unsuccessful',
      message: 'Transaction declined. Your card ending in 9234 was declined by your bank. Please contact your bank or use an alternative payment method to complete the transaction.'
    },
    {
      id: '7',
      type: 'successful',
      title: 'Payment Successful',
      message: 'Payment of $890.50 received and confirmed. Your order #ORD-78945 is now being processed and will be shipped within 2-3 business days. Thank you for your purchase.'
    }
  ]);

  const handleDismiss = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleAction = (id: string, action: string) => {
    console.log(`Action: ${action} for notification ${id}`);
    // Handle action logic here
  };

  const getIcon = (type: string) => {
    if (type === 'alert') {
      return <AlertCircle className="w-8 h-8" />;
    }
    return <Lightbulb className="w-8 h-8" />;
  };

  const getIconColor = (type: string) => {
    if (type === 'alert') return 'text-orange-500';
    if (type === 'unsuccessful') return 'text-orange-500';
    return 'text-green-500';
  };

  const getActionButton = (type: string, id: string) => {
    if (type === 'alert') {
      return (
        <button
          onClick={() => handleAction(id, 'pay')}
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-lg font-medium transition-colors"
        >
          Pay
        </button>
      );
    }
    if (type === 'unsuccessful') {
      return (
        <button
          onClick={() => handleAction(id, 'retry')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-lg font-medium transition-colors"
        >
          Retry
        </button>
      );
    }
    return (
      <button
        onClick={() => handleDismiss(id)}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`flex-shrink-0 ${getIconColor(notification.type)}`}>
                {getIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {notification.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {notification.message}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                {getActionButton(notification.type, notification.id)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertPage;