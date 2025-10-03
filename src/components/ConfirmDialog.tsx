'use client';

import NeuCard from './NeuCard';
import NeuButton from './NeuButton';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <NeuCard className="p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="mb-6 opacity-70">{message}</p>
        <div className="flex gap-4 justify-end">
          <NeuButton onClick={onCancel} className="px-6">
            {cancelText}
          </NeuButton>
          <NeuButton
            onClick={onConfirm}
            className={`px-6 ${danger ? 'text-red-500' : ''}`}
          >
            {confirmText}
          </NeuButton>
        </div>
      </NeuCard>
    </div>
  );
}
