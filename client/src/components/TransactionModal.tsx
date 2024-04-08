// TransactionModal.tsx
import React, { FC, useState, useEffect } from 'react';
import { TransactionType } from './types';

interface TransactionModalProps {
  transaction: TransactionType | null;
  isOpen: boolean;
  onSave: (transaction: TransactionType) => void;
  onCancel: () => void;
}

const TransactionModal: FC<TransactionModalProps> = ({
  transaction,
  isOpen,
  onSave,
  onCancel,
}) => {
  const [
    editedTransaction,
    setEditedTransaction,
  ] = useState<TransactionType | null>(null);

  useEffect(() => {
    setEditedTransaction(transaction);
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSave = () => {
    if (editedTransaction) onSave(editedTransaction);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div>
            <label>Name: </label>
            <input
                // eslint-disable-next-line prettier/prettier
                value={editedTransaction?.name || ''}
                onChange={e =>
                    editedTransaction && editedTransaction.id &&
                    setEditedTransaction({
                        ...editedTransaction,
                        name: e.target.value,
                    })
                }
            />
        </div>
        <div>
            <label>Date: </label>
            <input
                type="date"
                value={editedTransaction? editedTransaction.date.slice(0, 10) : ''}
                onChange={e =>
                    editedTransaction && editedTransaction.id &&
                    setEditedTransaction({
                        ...editedTransaction,
                        date: e.target.value,
                    })
                }
            />
        </div>
        <div>
            <label>Category: </label>
            <input
                value={editedTransaction?.category || ''}
                onChange={e =>
                    editedTransaction && editedTransaction.id &&
                    setEditedTransaction({
                        ...editedTransaction,
                        category: e.target.value,
                    })
                }
            />
        </div>
        <div>
            <label>Subcategory: </label>
            <input
                value={editedTransaction?.subcategory || ''}
                onChange={e =>
                    editedTransaction && editedTransaction.id &&
                    setEditedTransaction({
                        ...editedTransaction,
                        subcategory: e.target.value,
                    })
                }
            />
        </div>
        <div>
            <label>Amount: </label>
            <input
                value={editedTransaction?.amount || ''}
                onChange={e =>
                    editedTransaction && editedTransaction.id &&
                    setEditedTransaction({
                        ...editedTransaction,
                        subcategory: e.target.value,
                    })
                }
            />
        </div>
        <div className="modal-button-container">
            <button type="submit" onClick={handleSave}>Save</button>
            <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;