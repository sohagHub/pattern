// TransactionModal.tsx
import React, { FC, useState, useEffect } from 'react';
import { TransactionType } from './types';
import RuleForm from './RuleForm';

interface TransactionModalProps {
    transaction: TransactionType | null;
    categoryToSubcategoryMapping: Record<string, string[]>;
    isOpen: boolean;
    onSave: (transaction: TransactionType) => void;
    onCancel: () => void;
}

const TransactionModal: FC<TransactionModalProps> = ({
  transaction,
  categoryToSubcategoryMapping,
  isOpen,
  onSave,
  onCancel,
}) => {
  const [showRuleForm, setShowRuleForm] = useState(false);

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
    
  const handleDelete = () => {
      if (editedTransaction) {
          editedTransaction.mark_delete = true;
          onSave(editedTransaction);
      }
  };
  
  const onCreateRule = () => {
      setShowRuleForm(true);
  };

    console.log('allCategories: ', categoryToSubcategoryMapping);

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div>
            <label>{editedTransaction?.original_name}</label>
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
                list="category-options"
                value={editedTransaction?.category || ''}
                onFocus={(e) => {
                    // Temporarily clear the input value to ensure the dropdown shows all options
                    if (e.target.value === editedTransaction?.category) {
                        e.target.value = '';
                    }
                }}
                onBlur={(e) => {
                    // Restore the original value if no new option was selected
                    if (!e.target.value.trim()) {
                        e.target.value = transaction.category;
                    }
                }}
                onChange={(e) => {
                    if (editedTransaction && editedTransaction.id) {
                        setEditedTransaction({
                            ...editedTransaction,
                            category: e.target.value,
                        });
                    }
                }}
            />
            <datalist id="category-options">
                {Object.keys(categoryToSubcategoryMapping).map((category, index) => (
                    <option key={index} value={category} />
                ))}
            </datalist>
        </div>
        <div>
            <label>Subcategory: </label>
            <input
                list="subcategory-options"
                value={editedTransaction?.subcategory || ''}
                onFocus={(e) => {
                    // Temporarily clear the input value to ensure the dropdown shows all options
                    if (e.target.value === editedTransaction?.subcategory) {
                        e.target.value = '';
                    }
                }}
                onBlur={(e) => {
                    // Restore the original value if no new option was selected
                    if (!e.target.value.trim()) {
                        e.target.value = transaction.subcategory;
                    }
                }}
                onChange={e =>
                    editedTransaction && editedTransaction.id &&
                    setEditedTransaction({
                        ...editedTransaction,
                        subcategory: e.target.value,
                    })
                }
            />
            <datalist id="subcategory-options">
                {editedTransaction && categoryToSubcategoryMapping[editedTransaction.category]?.map((subcategory, index) => (
                    <option key={index} value={subcategory} />
                ))}
            </datalist>
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
            <button type="button" onClick={onCreateRule}>Create Rule</button>
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="button" onClick={handleDelete}>Delete</button>
        </div>
      </div>
          {showRuleForm &&
              <RuleForm
                initialRule={{
                    name: editedTransaction?.name || '',
                    new_name: editedTransaction?.name || '',
                    new_category: editedTransaction?.category || '',
                    new_subcategory: editedTransaction?.subcategory || ''
                }}
                onCancel={() => setShowRuleForm(false)}
                onSubmit={() => setShowRuleForm(false)}
              />
          }
    </div>
  );
};

export default TransactionModal;
