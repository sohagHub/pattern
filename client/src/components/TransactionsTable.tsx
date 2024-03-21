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
  const [rowsPerPage, setRowsPerPage] = useState(30);

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

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  
  // Update filteredTransactions when props.selectedMonth changes
  useEffect(() => {
    const input = filterTerm;
    const andTerms: string[] = [];
    const orTerms: string[] = [];
    const notTerms: string[] = [];

    // Use a regex to capture the content inside OR() and NOT(), and split the rest as AND terms
    const orMatches = input.match(/OR ?\((.*?)\)/);
    const notMatches = input.match(/NOT ?\((.*?)\)/);

    if (orMatches && orMatches[1]) {
      orTerms.push(...orMatches[1].trim().toLowerCase().split(/\s+/));
    }

    if (notMatches && notMatches[1]) {
      notTerms.push(...notMatches[1].trim().toLowerCase().split(/\s+/));
    }

    // Remove the OR and NOT parts from the input, then treat the rest as AND terms
    const andString = input.replace(/OR ?\(.*?\)/, '').replace(/NOT ?\(.*?\)/, '');
    andTerms.push(...andString.trim().toLowerCase().split(/\s+/).filter(term => term));

    // Function to check if a transaction matches a given term
    const matchesTerm = (tx: TransactionType, term: string): boolean => (
      // eslint-disable-next-line prettier/prettier
      tx.name?.toLowerCase().includes(term) ||
      tx.category?.toLowerCase().includes(term) ||
      tx.subcategory?.toLowerCase().includes(term) ||
      tx.account_name?.toLowerCase().includes(term) ||
      tx.amount?.toString().toLowerCase().includes(term) ||
      tx.date?.toLowerCase().includes(term)
    );

    // Filter transactions based on AND, OR, NOT logic
    let filteredTransactions = props.transactions.filter(tx => {
      //if (tx.category === 'Duplicate') return false;

      const andMatch = andTerms.length === 0 || andTerms.every(term => matchesTerm(tx, term));
      const orMatch = orTerms.length > 0 && orTerms.some(term => matchesTerm(tx, term));
      const notMatch = notTerms.every(term => !matchesTerm(tx, term));

      return andMatch && (orMatch || orTerms.length === 0) && notMatch;
    });

    const uniqueCategories = Array.from(new Set(filteredTransactions.map(tx => tx.category)));
    setUniqueCategories(uniqueCategories);

    filteredTransactions = filteredTransactions.filter(tx => {
      // Category filter
      if (categoryFilter !== 'All' && tx.category !== categoryFilter) {
        return false;
      }

      return true;
    });

    setFilteredTransactions(filteredTransactions);
  }, [categoryFilter, filterTerm, props.transactions]);



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

  // Handler for category filter change
  const handleCategoryFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(event.target.value);
  };

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
                className={`pagination-item  ${currentPage === pageNumber ? 'active' : ''
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

  type FieldName = 'date' | 'account_name' | 'name' | 'category' | 'subcategory' | 'amount';
  type EditableField = Exclude<FieldName, 'date' | 'amount' | 'account_name'>; // Assuming 'date', 'amount', 'account_name' are not editable

  const renderEditableCell = (tx: TransactionType, field: FieldName, type: string = "text", readOnly: boolean = false) => {    
    const isEditableField = field === 'name' || field === 'category' || field === 'subcategory';
    const isEditableTransaction = isEditableField && editableTransactions[tx.id];
    const editableValue = isEditableTransaction ? editableTransactions[tx.id][field as EditableField] : undefined;
    // eslint-disable-next-line prettier/prettier
    let value = editableValue ?? tx[field];
    if (field === 'amount') {
      value = currencyFilter(Number(value));
    }
    
    return (
      <td className={`table-${field}`}>
        <input
          className="nice-input"
          type={type}
          value={field === 'date' ? tx.date.slice(0, 10) : value}
          onChange = {readOnly || !isEditableField ? undefined : (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(tx.id, field, e.target.value)}
          onBlur   = {readOnly || !isEditableField ? undefined : () => saveChanges(tx.id, field as keyof TransactionType, String(value))}
          readOnly = {readOnly}
          style={{ textAlign: field === 'amount' ? 'right' : 'left' }}
        />
      </td>
    );
  };


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
            <th className="table-category">
              Category
              <select className="table-category-select" onChange={handleCategoryFilterChange} value={categoryFilter}>
                <option value="All">All</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </th>
            <th className="table-category">Subcategory</th>
            <th className="table-amount">Amount</th>
          </tr>
        </thead>
        <tbody className="transactions-body">
          {currentTransactions.map(tx => (
            <tr key={tx.id} className="transactions-data-rows">
              {renderEditableCell(tx, 'date', 'text', true)}  {/* Date, readOnly */}
              {renderEditableCell(tx, 'account_name', 'text', true)}  {/* Account, readOnly */}
              {renderEditableCell(tx, 'name')}
              {renderEditableCell(tx, 'category')}
              {renderEditableCell(tx, 'subcategory')}
              {renderEditableCell(tx, 'amount', 'text', true)} {/* Amount, readOnly */}
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
