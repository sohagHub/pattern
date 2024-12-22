import { distanceInWords, parse } from 'date-fns';
import {
  PlaidLinkOnSuccessMetadata,
  PlaidLinkOnExitMetadata,
  PlaidLinkStableEvent,
  PlaidLinkOnEventMetadata,
  PlaidLinkError,
} from 'react-plaid-link';

import { postLinkEvent as apiPostLinkEvent } from '../services/api';
import colors from 'plaid-threads/scss/colors';

/**
 * @desc small helper for pluralizing words for display given a number of items
 */
export function pluralize(noun: string, count: number) {
  return count === 1 ? noun : `${noun}s`;
}

/**
 * @desc converts number values into $ currency strings
 */
export function currencyFilter(value: number) {
  if (typeof value !== 'number') {
    return '-';
  }

  const isNegative = value < 0;
  const displayValue = value < 0 ? -value : value;
  return `${isNegative ? '-' : ''}$${displayValue
    .toFixed(2)
    .replace(/(\d)(?=(\d{3})+(\.|$))/g, '$1,')}`;
}

export type MonthMap = { [key: string]: string };

// Mapping of month names to month numbers
export const monthMap: MonthMap = {
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

export interface MonthYearItem {
  monthYear: string;
  [key: string]: any;
}

export const sortByMonthYear = (a: MonthYearItem, b: MonthYearItem) => {
  const aMonth = a.monthYear.split(' ')[0];
  const aYear = a.monthYear.split(' ')[1];
  const bMonth = b.monthYear.split(' ')[0];
  const bYear = b.monthYear.split(' ')[1];
  const aMonthNumber = monthMap[aMonth];
  const bMonthNumber = monthMap[bMonth];
  if (aYear === bYear) {
    return Number(aMonthNumber) - Number(bMonthNumber);
  }
  return Number(aYear) - Number(bYear);
};

const monthList = [
  null,
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * @desc Returns formatted date.
 */
export function formatDate(timestamp: string) {
  if (timestamp) {
    // slice will return the first 10 char(date)of timestamp
    // coming in as: 2019-05-07T15:41:30.520Z
    const [y, m, d] = timestamp.slice(0, 10).split('-');
    return `${monthList[+m]} ${d}, ${y}`;
  }

  return '';
}

/**
 * @desc Checks the difference between the current time and a provided time
 */
export function diffBetweenCurrentTime(timestamp: string) {
  return distanceInWords(new Date(), parse(timestamp), {
    addSuffix: true,
    includeSeconds: true,
  }).replace(/^(about|less than)\s/i, '');
}

export const logEvent = (
  eventName: PlaidLinkStableEvent | string,
  metadata:
    | PlaidLinkOnEventMetadata
    | PlaidLinkOnSuccessMetadata
    | PlaidLinkOnExitMetadata,
  error?: PlaidLinkError | null
) => {
  console.log(`Link Event: ${eventName}`, metadata, error);
};

export const logSuccess = async (
  { institution, accounts, link_session_id }: PlaidLinkOnSuccessMetadata,
  userId: number
) => {
  logEvent('onSuccess', {
    institution,
    accounts,
    link_session_id,
  });
  await apiPostLinkEvent({
    userId,
    link_session_id,
    type: 'success',
  });
};

export const logExit = async (
  error: PlaidLinkError | null,
  { institution, status, link_session_id, request_id }: PlaidLinkOnExitMetadata,
  userId: number
) => {
  logEvent(
    'onExit',
    {
      institution,
      status,
      link_session_id,
      request_id,
    },
    error
  );

  const eventError = error || {};
  await apiPostLinkEvent({
    userId,
    link_session_id,
    request_id,
    type: 'exit',
    ...eventError,
    status,
  });
};

export const COLORS = [
  colors.yellow900,
  colors.red900,
  colors.blue900,
  colors.green900,
  colors.purple900,
  //give me more colors
  colors.yellow600,
  colors.red600,
  colors.blue600,
  colors.green600,
  //colors.purple600,
];
