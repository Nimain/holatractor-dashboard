"use client";

import { useState } from "react";
import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Eye, Check, X } from "lucide-react";

// Define the structure of a Purchase object
interface Purchase {
  id: string;
  user: {
    name: string;
    email: string;
  };
  credits: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

interface PurchaseActionProps {
  purchase: Purchase;
  index: number;
  isUpdating: boolean;
  onUpdateStatus: (purchaseId: string, status: 'Approved' | 'Rejected') => void;
}

const PurchaseAction = ({ purchase, index, onUpdateStatus, isUpdating }: PurchaseActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to determine the color of the status chip
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Table Row: Clickable to open the details modal */}
      <div
        className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_1fr] items-center gap-x-4 p-4 border-b hover:bg-gray-50 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <p>{index + 1}</p>
        <div>
          <p className="font-medium text-gray-800">{purchase.user.name}</p>
          <p className="text-xs text-gray-500">{purchase.user.email}</p>
        </div>
        <p className="font-medium text-blue-600">+{purchase.credits}</p>
        <p>{`${purchase.amount.toFixed(2)} ${purchase.currency}`}</p>
        <p>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(purchase.status)}`}>
            {purchase.status}
          </span>
        </p>
        <p>{new Date(purchase.createdAt).toLocaleDateString()}</p>
        <div className="text-center">
          <button className="p-2 text-gray-500 hover:text-black">
            <Eye size={18} />
          </button>
        </div>
      </div>

      {/* Details Modal with Approve/Reject actions */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <h3 className="text-xl font-semibold text-gray-900">Purchase Details</h3>
        </DialogTitle>
        <DialogContent>
          <div className="space-y-3 text-gray-700">
            <p><strong>User:</strong> {purchase.user.name} ({purchase.user.email})</p>
            <p><strong>Transaction ID:</strong> {purchase.transactionId}</p>
            <p><strong>Payment Method:</strong> {purchase.paymentMethod}</p>
            <p><strong>Amount:</strong> {purchase.amount.toFixed(2)} {purchase.currency}</p>
            <p><strong>Credits Purchased:</strong> {purchase.credits}</p>
            <p><strong>Date:</strong> {new Date(purchase.createdAt).toLocaleString()}</p>
            <p><strong>Current Status:</strong>
              <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusChip(purchase.status)}`}>
                {purchase.status}
              </span>
            </p>
            <hr className="my-4" />
            <p className="text-sm text-gray-500">
              Admin Action: Please verify the transaction details before taking action.
            </p>
          </div>
        </DialogContent>
        <div className="p-4 flex justify-end gap-3 bg-gray-50">
          <Button onClick={() => setIsModalOpen(false)} variant="outlined" disabled={isUpdating}>
            Close
          </Button>
          {/* Show Approve/Reject buttons only if the status is Pending */}
          {purchase.status === 'Pending' && (
            <>
              <Button
                onClick={() => onUpdateStatus(purchase.id, 'Rejected')}
                variant="contained"
                color="error"
                disabled={isUpdating}
                startIcon={<X size={16} />}
              >
                Reject
              </Button>
              <Button
                onClick={() => onUpdateStatus(purchase.id, 'Approved')}
                variant="contained"
                color="success"
                disabled={isUpdating}
                startIcon={<Check size={16} />}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default PurchaseAction;