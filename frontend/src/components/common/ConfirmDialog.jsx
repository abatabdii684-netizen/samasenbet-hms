import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';

function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, loading = false, variant = 'danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button
            onClick={onConfirm}
            className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          <ExclamationTriangleIcon className="w-5 h-5" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 pt-2">{message}</p>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
