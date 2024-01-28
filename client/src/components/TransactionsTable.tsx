import React, { useEffect, useState } from 'react';

import { currencyFilter } from '../util';
import { TransactionType } from './types';
import { updateTransactionById } from '../services/api';
import useTransactions from '../services/transactions';

interface Props {
  transactions: TransactionType[];
  filterText: string | null;
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

  const { dispatch } = useTransactions();
  
  // Define the save function
  const saveChanges = async (
    id: number,
    field: keyof TransactionType,
    value: string
  ) => {
    const response = updateTransactionById(id, { [field]: value });
    console.log(response);
    dispatch({
        type: 'UPDATE_TRANSACTION',
        payload: { id, updates: { [field]: value } }
      });
  };

  // Pagination logic
  const transactionsPerPage = 50; // Replace 10 with the desired number of transactions per page
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

  const [filteredTransactions, setFilteredTransactions] = useState<TransactionType[]>([]);
  const [currentTransactions, setCurrentTransactions] = useState<TransactionType[]>([]);

  function convertDateString(input: string): string {
    // Define a type for the month mapping
    type MonthMap = { [key: string]: string };

    // Mapping of month names to month numbers
    const months: MonthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };

    // Split the input into month and year
    const parts = input.split(' ');
    if (parts.length === 2) {
        const month = parts[0];
        const year = parts[1];

        // Check if month is valid
        if (months[month]) {
            return `${year}-${months[month]}`;
        } else {
            return 'Invalid Month';
        }
    } else {
        return 'Invalid Date Format';
    }
  }

  // Update monthFilter when props.selectedMonth changes
  useEffect(() => {
    if (props.filterText) {
      console.log(props.filterText);
      const newMonthFilter = convertDateString(props.filterText); //new Date(props.selectedMonth).toISOString().slice(0, 7);
      setFilterTerm(newMonthFilter); // Set filterTerm as monthFilter
    }
  }, [props.filterText]);
  
  // Update filteredTransactions when props.selectedMonth changes
  useEffect(() => {
    const filteredTransactions = props.transactions.filter(tx =>
      ((tx.name ? tx.name.toLowerCase().includes(filterTerm.toLowerCase()) : false) ||
      (tx.category ? tx.category.toLowerCase().includes(filterTerm.toLowerCase()) : false) ||
      (tx.subcategory ? tx.subcategory.toLowerCase().includes(filterTerm.toLowerCase()) : false) ||
      (tx.account_name ? tx.account_name.toLowerCase().includes(filterTerm.toLowerCase()) : false) ||
      (tx.amount ? tx.amount.toString().toLowerCase().includes(filterTerm.toLowerCase()) : false) ||
      (tx.date ? tx.date.toLowerCase().includes(filterTerm.toLowerCase()) : false))
    );

    setFilteredTransactions(filteredTransactions);
  }, [filterTerm, props.transactions]);

  useEffect(() => {
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
      .slice(indexOfFirstTransaction, indexOfLastTransaction);
    
    setCurrentTransactions(currentTransactions);
  }, [filteredTransactions, indexOfFirstTransaction, indexOfLastTransaction, sortDirection]);

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
        {filteredTransactions.length > transactionsPerPage && (
          <ul className="pagination-list">
            {Array.from({
              length: Math.ceil(
                filteredTransactions.length / transactionsPerPage
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
