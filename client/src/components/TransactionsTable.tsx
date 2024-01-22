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


  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // New state for filter term and sort direction
  const [filterTerm, setFilterTerm] = useState('');
  const [sortDirection, setSortDirection] = useState('');

  // Function to handle changes to the filter input
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterTerm(event.target.value);
  };

  // Function to handle changes to the sort direction
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortDirection(event.target.value);
  };

  // Adjust rendering of currentTransactions to filter and sort
  const filteredTransactions = props.transactions.filter(tx =>
    (tx.name ? tx.name.toLowerCase().includes(filterTerm.toLowerCase()) : false) ||
    (tx.category ? tx.category.toLowerCase().includes(filterTerm.toLowerCase()) : false) ||
    (tx.subcategory ? tx.subcategory.toLowerCase().includes(filterTerm.toLowerCase()) : false) ||
    (tx.account_name ? tx.account_name.toLowerCase().includes(filterTerm.toLowerCase()) : false) ||
    (tx.amount ? tx.amount.toString().toLowerCase().includes(filterTerm.toLowerCase()) : false) ||
    (tx.date ? tx.date.toLowerCase().includes(filterTerm.toLowerCase()) : false)
  );

  const sortedTransactions = filteredTransactions.sort((a, b) => {
    if (sortDirection === 'asc') {
      return a.amount - b.amount;
    } else if (sortDirection === 'desc') {
      return b.amount - a.amount;
    } else if (sortDirection === 'date_desc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const currentTransactions = sortedTransactions
    //.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(indexOfFirstTransaction, indexOfLastTransaction);

  return (
    <div className="transactions">
      {/* New inputs for filter term and sort direction */}
      
      <div className="table-filter-sort-container">
      <span className="nice-text">Filter</span>
      <input
        className="nice-input filter-input"
        type="text"
        placeholder="Filter by keyword"
        value={filterTerm}
        onChange={handleFilterChange}
      />
      <span className="nice-text">Sort</span>
      <select className="nice-input sort-input" value={sortDirection} onChange={handleSortChange}>
        <option value="">By Date Latest</option>
        <option value="date_desc">By Date Earliest</option>
        <option value="asc">By Amount Ascending</option>
        <option value="desc">By Amount Descending</option>
      </select>
      </div>  
      <table className="transactions-table">
        <thead className="transactions-header">
          <tr>
            <th className="table-date">Date</th>
            <th className="table-account">Account</th>
            <th className="table-name">Name</th>
            <th className="table-category">Category</th>
            <th className="table-category">Subcategory</th>
            <th className="table-amount">Amount</th>
          </tr>
        </thead>
        <tbody className="transactions-body">
          {currentTransactions
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
                <td className="table-account">
                  <input
                    className="nice-input"
                    type="text"
                    value={tx.account_name}
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
