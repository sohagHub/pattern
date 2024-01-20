import React, { useState } from 'react';

import { currencyFilter } from '../util';
import { TransactionType } from './types';
import { updateTransactionById } from '../services/api';

interface Props {
  transactions: TransactionType[];
}

export default function TransactionsTable(props: Props) {
  // State to store the editable state and modified values for each field
  const [editableTransactions, setEditableTransactions] = useState<{
    [key: string]: { name: string; category: string; subcategory: string };
  }>({});

  // Function to handle changes in input fields
  const handleInputChange = (id: number, field: string, value: string) => {
    setEditableTransactions(
      (prev: {
        [key: string]: { name: string; category: string; subcategory: string };
      }) => ({
        ...prev,
        [id]: { ...prev[id], [field]: value },
      })
    );
  };

  // Define the save function
  const saveChanges = async (
    id: number,
    field: keyof TransactionType,
    value: string
  ) => {
    const response = updateTransactionById(id, { [field]: value });
    console.log(response);
  };

  // Pagination logic
  const transactionsPerPage = 100; // Replace 10 with the desired number of transactions per page
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = props.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(indexOfFirstTransaction, indexOfLastTransaction);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="transactions">
      <table className="transactions-table">
        <thead className="transactions-header">
          <tr>
            <th className="table-date">Date</th>
            <th className="table-name">Name</th>
            <th className="table-category">Category</th>
            <th className="table-category">Subcategory</th>
            <th className="table-amount">Amount</th>
          </tr>
        </thead>
        <tbody className="transactions-body">
          {currentTransactions
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .map(tx => (
              <tr key={tx.id} className="transactions-data-rows">
                <td className="table-date">
                  <input
                    className="nice-input"
                    type="text"
                    value={tx.date.slice(0, 10)}
                    readOnly
                  />
                </td>
                <td className="table-name">
                  <input
                    className="nice-input"
                    type="text"
                    value={editableTransactions[tx.id]?.name ?? tx.name}
                    onChange={e =>
                      handleInputChange(tx.id, 'name', e.target.value)
                    }
                    onBlur={() =>
                      saveChanges(
                        tx.id,
                        'name',
                        editableTransactions[tx.id]?.name
                      )
                    }
                  />
                </td>
                <td className="table-category">
                  <input
                    className="nice-input"
                    type="text"
                    value={editableTransactions[tx.id]?.category ?? tx.category}
                    onChange={e =>
                      handleInputChange(tx.id, 'category', e.target.value)
                    }
                    onBlur={() =>
                      saveChanges(
                        tx.id,
                        'category',
                        editableTransactions[tx.id]?.category
                      )
                    }
                  />
                </td>
                <td className="table-subcategory">
                  <input
                    className="nice-input"
                    type="text"
                    value={
                      editableTransactions[tx.id]?.subcategory ?? tx.subcategory
                    }
                    onChange={e =>
                      handleInputChange(tx.id, 'subcategory', e.target.value)
                    }
                    onBlur={() =>
                      saveChanges(
                        tx.id,
                        'subcategory',
                        editableTransactions[tx.id]?.subcategory
                      )
                    }
                  />
                </td>
                <td className="table-amount">
                  <input
                    className="nice-input"
                    style={{ textAlign: 'right' }}
                    type="text"
                    value={currencyFilter(tx.amount)}
                    readOnly
                  />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <div className="pagination">
        {props.transactions.length > transactionsPerPage && (
          <ul className="pagination-list">
            {Array.from({
              length: Math.ceil(
                props.transactions.length / transactionsPerPage
              ),
            }).map((_, index) => (
              <li
                key={index}
                className={`pagination-item ${
                  currentPage === index + 1 ? 'active' : ''
                }`}
              >
                <button
                  className="pagination-link"
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
