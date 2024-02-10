import React, { useEffect, useState } from 'react';

import { currencyFilter } from '../util';
import { TransactionType } from './types';
import { updateTransactionById } from '../services/api';
import useTransactions from '../services/transactions';

interface Props {
  transactions: TransactionType[];
  filterText: string;
}

export default function TransactionsTable(props: Props) {
  const [rowsPerPage, setRowsPerPage] = useState(20);

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
    if (!value) {
      return;
    }
    const response = await updateTransactionById(id, { [field]: value });
    console.log(response);
    dispatch({
      type: 'UPDATE_TRANSACTION',
      payload: { id, updates: { [field]: value } },
    });
  };

  // Pagination logic
  //const transactionsPerPage = 50; // Replace 10 with the desired number of transactions per page
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastTransaction = currentPage * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;

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
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12',
    };

    // Split the input into month and year
    const parts = input && input.split(' ');
    if (parts && parts.length === 2) {
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
    console.log('filter: ' + props.filterText);
    const newFilterTerm = convertDateString(props.filterText);
    if (
      newFilterTerm === 'Invalid Date Format' ||
      newFilterTerm === 'Invalid Month'
    ) {
      setFilterTerm(props.filterText ? props.filterText : '');
    } else {
      setFilterTerm(newFilterTerm);
    }
  }, [props.filterText]);

  // Update filteredTransactions when props.selectedMonth changes
  useEffect(() => {
    // split filterTerm by spaces
    const filterTerms = filterTerm
      .split(' ')
      .map((term: string) => term.trim().toLowerCase());

    const filteredTransactions = props.transactions.filter(tx => {
      let shouldInclude = true;
      let nextShouldNotInclude = false;

      filterTerms.forEach((filterTerm, index) => {
        if (filterTerm === 'and' || filterTerm === 'or') {
          // Skip AND and OR, they are handled in the next iteration
          return;
        }

        if (filterTerm === 'not') {
          nextShouldNotInclude = true;
          return;
        }

        const includesTerm =
          (tx.name ? tx.name.toLowerCase().includes(filterTerm) : false) ||
          (tx.category
            ? tx.category.toLowerCase().includes(filterTerm)
            : false) ||
          (tx.subcategory
            ? tx.subcategory.toLowerCase().includes(filterTerm)
            : false) ||
          (tx.account_name
            ? tx.account_name.toLowerCase().includes(filterTerm)
            : false) ||
          (tx.amount
            ? tx.amount
                .toString()
                .toLowerCase()
                .includes(filterTerm)
            : false) ||
          (tx.date ? tx.date.toLowerCase().includes(filterTerm) : false);

        if (nextShouldNotInclude) {
          shouldInclude = shouldInclude && !includesTerm;
          nextShouldNotInclude = false;
        } else if (index > 0 && filterTerms[index - 1].toLowerCase() === 'or') {
          shouldInclude = shouldInclude || includesTerm;
        } else {
          shouldInclude = shouldInclude && includesTerm;
        }
      });

      return shouldInclude;
    });

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

    const currentTransactions = sortedTransactions.slice(
      indexOfFirstTransaction,
      indexOfLastTransaction
    );

    setCurrentTransactions(currentTransactions);
  }, [
    filteredTransactions,
    indexOfFirstTransaction,
    indexOfLastTransaction,
    sortDirection,
  ]);

  function renderPagination() {
    const numPages = Math.ceil(filteredTransactions.length / rowsPerPage);
    // always show the first 3 pages, last 3 pages, the current page, and 2 pages around the current page
    const setOfNumbers = new Set([
      1,
      2,
      3,
      numPages - 2,
      numPages - 1,
      numPages,
      currentPage,
      currentPage - 1,
      currentPage + 1,
    ]);

    let previousWasEllipsis = false;

    return (
      <>
        {Array.from({ length: numPages }).map((_, index) => {
          // Adjust the index to start from 1
          const pageNumber = index + 1;

          // Only show the pages in the set
          if (setOfNumbers.has(pageNumber)) {
            previousWasEllipsis = false;
            return (
              <li
                key={index}
                className={`pagination-item  ${
                  currentPage === pageNumber ? 'active' : ''
                }`}
              >
                <button
                  className="pagination-link"
                  onClick={() => paginate(pageNumber)}
                >
                  {pageNumber}
                </button>
              </li>
            );
          }

          // Show "..." for skipped pages, but only once before and after the current page +- 1
          if (
            !previousWasEllipsis &&
            (setOfNumbers.has(pageNumber - 1) ||
              setOfNumbers.has(pageNumber + 1))
          ) {
            previousWasEllipsis = true;
            return (
              <li className="pagination-item" key={index}>
                ......
              </li>
            );
          }

          return null;
        })}
      </>
    );
  }

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
        <select
          className="nice-input sort-input"
          value={sortDirection}
          onChange={handleSortChange}
        >
          <option value="">By Date Latest</option>
          <option value="date_desc">By Date Earliest</option>
          <option value="asc">By Amount Ascending</option>
          <option value="desc">By Amount Descending</option>
        </select>
        <span className="nice-text">Rows</span>
        <select
          className="nice-input page-input"
          value={rowsPerPage}
          onChange={e => setRowsPerPage(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
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
          {currentTransactions.map(tx => (
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
        {filteredTransactions.length > rowsPerPage && (
          <ul className="pagination-list">
            {/* BEGIN: ed8c6549bwf9 */}
            {renderPagination()}
            {/* END: ed8c6549bwf9 */}
          </ul>
        )}
      </div>
    </div>
  );
}
