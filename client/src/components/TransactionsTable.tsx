import React, { useEffect, useState, useCallback } from 'react';

import { currencyFilter, convertDateToString, mapCategoriesToSubcategories } from '../util';
import { TransactionType } from './types';
import { updateTransactionById } from '../services/api';
import useTransactions from '../services/transactions';
import TransactionModal from './TransactionModal';
import DropdownTreeSelect, { TreeNode } from 'react-dropdown-tree-select';
import 'react-dropdown-tree-select/dist/styles.css';

interface Props {
  filterText: string;
  rows?: number;
}

export default function TransactionsTable(props: Props) {
  const [rowsPerPage, setRowsPerPage] = useState(props.rows || 20);
  
  const { dispatch, allTransactions } = useTransactions();
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  useEffect(() => {
    setTransactions(allTransactions);
  }, [allTransactions]);


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

  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionType[]
  >([]);
  const [currentTransactions, setCurrentTransactions] = useState<
    TransactionType[]
  >([]);



  // Update monthFilter when props.selectedMonth changes
  useEffect(() => {
    console.log('filter: ' + props.filterText);
    // get all term that are separated by space or quotes and not empty string
    let terms = props.filterText.split("'").filter(item => item.trim() !== '');

    const newFilterTerm = convertDateToString(terms[0]); //convertDateString(props.filterText);
    if (
      newFilterTerm === 'Invalid Date Format' ||
      newFilterTerm === 'Invalid Month'
    ) {
      setFilterTerm(terms.join(' '));
    } else {
      setFilterTerm(newFilterTerm + ' ' + terms.slice(1).join(' '));
    }
  }, [props.filterText]);

  const [categoryFilter, setCategoryFilter] = useState<string[]>([]); 
  const [subCategoryFilter, setSubCategoryFilter] = useState<string[]>([]);

  const [
    categoryToSubcategoryMapping,
    setCategoryToSubcategoryMapping,
  ] = useState<Record<string, string[]>>({});
  const [categoryTreeData, setCategoryTreeData] = useState<TreeNode[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<TreeNode[]>([]);

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
      orTerms.push(
        ...orMatches[1]
          .trim()
          .toLowerCase()
          .split(/\s+/)
      );
    }

    if (notMatches && notMatches[1]) {
      notTerms.push(
        ...notMatches[1]
          .trim()
          .toLowerCase()
          .split(/\s+/)
      );
    }

    // Remove the OR and NOT parts from the input, then treat the rest as AND terms
    const andString = input
      .replace(/OR ?\(.*?\)/, '')
      .replace(/NOT ?\(.*?\)/, '');
    andTerms.push(
      ...andString
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(term => term)
    );

    // Function to check if a transaction matches a given term
    const matchesTerm = (tx: TransactionType, term: string): boolean => {
      if (term.toLowerCase().startsWith('category:')) {
        if (tx.category === null) {
          return false;
        }
        return tx.category.toLowerCase().includes(term.slice(9));
      }

      if (term.toLowerCase().startsWith('subcategory:')) {
        if (tx.subcategory === null) {
          return false;
        }

        return tx.subcategory.toLowerCase().includes(term.slice(12));
      }

      return (
        // eslint-disable-next-line prettier/prettier
        tx.name?.toLowerCase().includes(term) ||
        tx.category?.toLowerCase().includes(term) ||
        tx.subcategory?.toLowerCase().includes(term) ||
        tx.account_name?.toLowerCase().includes(term) ||
        tx.amount
          ?.toString()
          .toLowerCase()
          .includes(term) ||
        tx.date?.toLowerCase().includes(term)
      );
    };

    // Filter transactions based on AND, OR, NOT logic
    let filteredTransactions = transactions.filter(tx => {
      //if (tx.category === 'Duplicate') return false;

      const andMatch =
        andTerms.length === 0 || andTerms.every(term => matchesTerm(tx, term));
      const orMatch =
        orTerms.length > 0 && orTerms.some(term => matchesTerm(tx, term));
      const notMatch = notTerms.every(term => !matchesTerm(tx, term));

      return andMatch && (orMatch || orTerms.length === 0) && notMatch;
    });

    setCategoryToSubcategoryMapping(
      mapCategoriesToSubcategories(transactions)
    );
    
    filteredTransactions = filteredTransactions.filter(tx => {

      if (categoryFilter.length === 0 && subCategoryFilter.length === 0) {
        return true;
      }

      // Category filter
      if (categoryFilter.length > 0 && categoryFilter.includes(tx.category)) {
        return true;
      }

      // Subcategory filter
      if (subCategoryFilter.length > 0 && subCategoryFilter.includes(tx.category + '::' + tx.subcategory)) {
        return true;
      }

      return false;
    });

    setFilteredTransactions(filteredTransactions);

    // Build the mapping from all transactions
    const mapping = mapCategoriesToSubcategories(transactions); // instead of transactions
    setCategoryToSubcategoryMapping(mapping);

    // Calculate total number of categories and subcategories
    const totalCategories = Object.keys(mapping).length;
    const totalSubcategories = Object.values(mapping).reduce(
      (acc, subcats) => acc + subcats.length,
      0
    );
    const totalNodes = totalCategories + totalSubcategories + 1; // +1 for 'Select All'

    // Create tree data from the complete mapping
    const treeData = [
      {
        label: 'Select All',
        value: 'all',
        checked: selectedCategories.length === totalNodes, // Updated condition
        expanded: true,
        children: [],
      },
      ...Object.entries(mapping).map(([category, subcategories]) => ({
        label: category,
        value: category,
        checked: selectedCategories.some(node => node.value === category || node.parent === category),
        expanded: selectedCategories.some(node => node.parent === category),
        children: subcategories.map((sub: string) => ({
          label: sub,
          value: `${category}::${sub}`,
          checked: selectedCategories.some(node => node.value === `${category}::${sub}`),
          parent: category,
        })),
      })),
    ];
    setCategoryTreeData(treeData);
  }, [categoryFilter, subCategoryFilter, filterTerm, transactions, selectedCategories]);

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

  // Handler for category selection change
  const handleCategoryTreeChange = (currentNode: TreeNode, selectedNodes: TreeNode[]) => {
    if (currentNode.value === 'all') {
      if (currentNode.checked) {
        // Select all categories and subcategories
        const allNodes = categoryTreeData.flatMap(category => [
          { ...category, checked: true },
          ...category.children?.map((sub: TreeNode) => ({ ...sub, checked: true })) || [],
        ]);
        setSelectedCategories(allNodes);
        setCategoryFilter(Object.keys(categoryToSubcategoryMapping));
        setSubCategoryFilter(
          Object.values(categoryToSubcategoryMapping).flatMap(subs => subs.map(sub => `${Object.keys(categoryToSubcategoryMapping).find(key => categoryToSubcategoryMapping[key].includes(sub))}::${sub}`))
        );
      } else {
        // Deselect all categories and subcategories
        setSelectedCategories([]);
        setCategoryFilter([]);
        setSubCategoryFilter([]);
      }
    } else {

      // Ensure that when a parent/currentnode is unselected, its children are also unselected
      const updatedSelectedNodes = selectedNodes.filter(node => {
        return currentNode.value !== node.parent;
      });
      setSelectedCategories(updatedSelectedNodes);

      // Extract categories and subcategories from updatedSelectedNodes
      const updatedCategories = updatedSelectedNodes
        .filter(node => !node.parent)
        .map(node => node.label);

      const updatedSubcategories = updatedSelectedNodes
        .filter(node => node.parent)
        .map(node => node.value);
      
      const subCategoryCategories = updatedSubcategories.map(subcategory => subcategory.split('::')[0]);
      const newCategories = updatedCategories.filter(category => !subCategoryCategories.includes(category));

      setCategoryFilter(newCategories);
      setSubCategoryFilter(updatedSubcategories);
      setCurrentPage(1);
    }
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
                ...
              </li>
            );
          }

          return null;
        })}
      </>
    );
  }

  // Then, inside your component
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [
    currentTransaction,
    setCurrentTransaction,
  ] = useState<TransactionType | null>(null);

  // Function to open the modal with a transaction
  const handleRowDoubleClick = (transaction: TransactionType) => {
    setCurrentTransaction(transaction);
    if (isModalOpen) {
      setCurrentTransaction(null);
    }
    setIsModalOpen(!isModalOpen);
  };

  // This function is called when the modal is closed
  const handleClose = () => {
    // Reset the state of the currentTransaction
    setCurrentTransaction(null);

    // Close the modal
    setIsModalOpen(false);
  };

  // Function to handle saving changes from the modal
  const handleSaveChanges = async (transaction: TransactionType) => {
    handleClose();

    // Call API to save changes
    await updateTransactionById(transaction.id, transaction);

    // Update local state or refetch transactions as necessary
    dispatch({
      type: 'UPDATE_TRANSACTION',
      payload: {
        id: transaction.id,
        updates: transaction,
      },
    });
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
        <thead>
          <tr>
            <th className="mobile-only">Date & Details</th>
            <th>Date</th>
            <th>Details</th>
            <th>
              Category
              <div className="category-dropdown">
                <DropdownTreeSelect
                  data={categoryTreeData}
                  onChange={handleCategoryTreeChange}
                  keepChildrenOnSearch={true}
                  showPartiallySelected={true}
                  texts={{ placeholder: 'Select Category' }}
                  mode="hierarchical" // Optional: use 'simpleSelect' if you want single selection
                />
              </div>
            </th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {currentTransactions.map(tx => (
            <React.Fragment key={tx.id}>
              <tr
                onClick={() => {
                  handleRowDoubleClick(tx);
                }}
              >
                <td className="mobile-only">
                  {tx.date.slice(0, 10)}
                  <br />
                  <strong>{tx.name}</strong>
                  <br />
                  {tx.account_name}
                </td>
                <td>{tx.date.slice(0, 10)}</td>
                <td>
                  <strong>{tx.name}</strong>
                  <br />
                  Account: {tx.account_name} <br />
                  {tx.id}#{tx.original_name}
                </td>
                <td>
                  <strong>{tx.category}</strong>
                  <br />
                  {tx.subcategory}
                </td>
                <td>
                  <strong>{currencyFilter(tx.amount)}</strong>
                </td>
              </tr>
              {currentTransaction && currentTransaction.id === tx.id && (
                <tr>
                  <td colSpan={5}>
                    <TransactionModal
                      transaction={currentTransaction}
                      categoryToSubcategoryMapping={
                        categoryToSubcategoryMapping
                      }
                      isOpen={isModalOpen}
                      onSave={handleSaveChanges}
                      onCancel={handleClose}
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        {filteredTransactions.length > rowsPerPage && (
          <ul className="pagination-list">{renderPagination()}</ul>
        )}
      </div>
    </div>
  );}