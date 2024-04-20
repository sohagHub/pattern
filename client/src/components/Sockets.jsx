import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

import { useAccounts, useItems, useTransactions } from '../services';
const io = require('socket.io-client');
const { REACT_APP_SERVER_PORT } = process.env;

export default function Sockets() {
  const socket = useRef();
  const { getAccountsByItem } = useAccounts();
  const { getTransactionsByItem } = useTransactions();
  const { getTransactionsByUser } = useTransactions();
  const { getItemById } = useItems();

  useEffect(() => {
    socket.current = io(`http://localhost:${REACT_APP_SERVER_PORT}`);

    socket.current.on('SYNC_HAPPENED', ({ itemId, userId, log } = {}) => {
      const msg = `${log}`;
      console.log(msg);
      //toast(msg);
    });

    socket.current.on('SYNC_COMPLETED', ({ itemId, userId, log } = {}) => {
      const msg = `${log}`;
      console.log(msg);
      toast(msg, { position: 'top' });
      //getAccountsByItem(itemId);
      //getTransactionsByItem(itemId);
      getTransactionsByUser(userId);
    });

    socket.current.on('SYNC_ERROR', ({ itemId, userId, log, error } = {}) => {
      const msg = `${log} ${error}`;
      console.log(msg);
      toast(msg, { autoClose: false });
      getAccountsByItem(itemId);
      getTransactionsByItem(itemId);
      //getTransactionsByUser(userId);
    });

    socket.current.on('SYNC_UPDATES_AVAILABLE', ({ itemId } = {}) => {
      const msg = `New Webhook Event: Item ${itemId}: Transactions updates`;
      console.log(msg);
      toast(msg);
      getAccountsByItem(itemId);
      getTransactionsByItem(itemId);
    });

    socket.current.on('ERROR', ({ itemId, errorCode } = {}) => {
      const msg = `New Webhook Event: Item ${itemId}: Item Error ${errorCode}`;
      console.error(msg);
      toast.error(msg);
      getItemById(itemId, true);
    });

    socket.current.on('PENDING_EXPIRATION', ({ itemId } = {}) => {
      const msg = `New Webhook Event: Item ${itemId}: Access consent is expiring in 7 days. User should re-enter login credentials.`;
      console.log(msg);
      toast(msg);
      getItemById(itemId, true);
    });

    socket.current.on('NEW_TRANSACTIONS_DATA', ({ itemId } = {}) => {
      getAccountsByItem(itemId);
      getTransactionsByItem(itemId);
    });

    return () => {
      socket.current.removeAllListeners();
      socket.current.close();
    };
  }, [
    getAccountsByItem,
    getTransactionsByItem,
    getTransactionsByUser,
    getItemById,
  ]);

  return <div />;
}
