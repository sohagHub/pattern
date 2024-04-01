import axios from 'axios';
import React from 'react';
import { toast } from 'react-toastify';
import { PlaidLinkOnSuccessMetadata } from 'react-plaid-link';

import { DuplicateItemToastMessage } from '../components';

const baseURL = '/api';

// Get the token
const token = localStorage.getItem('token');

const api = axios.create({
  baseURL,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: 0,
    Authorization: `Bearer ${token}`,
  },
});

api.interceptors.request.use(config => {
  //const token = localStorage.getItem('token');
  //config.headers.Authorization = token ? `Bearer ${token}` : '';
  return config;
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: unknown, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;
    if (
      (error.response && error.response.status === 403) ||
      error.response.status === 401
    ) {
      if (
        !originalRequest._retry &&
        originalRequest.url !== '/sessions/refresh_token'
      ) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            await refreshAccessToken();
            isRefreshing = false;
            processQueue(null);
          } catch (err) {
            processQueue(err, null);
            window.location.href = '/';
          }
        }

        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
// currentUser
export const getLoginUser = (username: string, password: string) =>
  api.post('/sessions', { username, password });

export const refreshAccessToken = () => api.post('/sessions/refresh_token', {});

// assets
export const addAsset = (userId: number, description: string, value: number) =>
  api.post('/assets', { userId, description, value });
export const getAssetsByUser = (userId: number) => api.get(`/assets/${userId}`);
export const deleteAssetByAssetId = (assetId: number) =>
  api.delete(`/assets/${assetId}`);

// users
export const getUsers = () => api.get('/users');
export const getUserById = (userId: number) => api.get(`/users/${userId}`);
export const addNewUser = (username: string, password: string) =>
  api.post('/users', { username, password });
export const deleteUserById = (userId: number) =>
  api.delete(`/users/${userId}`);

// items
export const getItemById = (id: number) => api.get(`/items/${id}`);
export const getItemsByUser = (userId: number) =>
  api.get(`/users/${userId}/items`);
export const deleteItemById = (id: number) => api.delete(`/items/${id}`);
export const setItemState = (itemId: number, status: string) =>
  api.put(`items/${itemId}`, { status });
// This endpoint is only availble in the sandbox enviornment
export const setItemToBadState = (itemId: number) =>
  api.post('/items/sandbox/item/reset_login', { itemId });

export const getLinkToken = (userId: number, itemId: number) =>
  api.post(`/link-token`, {
    userId,
    itemId,
  });

// accounts
export const getAccountsByItem = (itemId: number) =>
  api.get(`/items/${itemId}/accounts`);
export const getAccountsByUser = (userId: number) =>
  api.get(`/users/${userId}/accounts`);

// sync
export const syncAll = () => api.post('/services/sync');
export const syncAllForUser = (userId: number) =>
  api.post(`/users/${userId}/transactions/sync`);

// transactions
export const getTransactionsByAccount = (accountId: number) =>
  api.get(`/accounts/${accountId}/transactions`);
export const getTransactionsByItem = (itemId: number) =>
  api.get(`/items/${itemId}/transactions`);
export const getTransactionsByUser = (userId: number) =>
  api.get(`/users/${userId}/transactions`);
export const updateTransactionById = (id: number, data: any) =>
  api.put(`/services/transaction/${id}`, data);

// rules
export const getRulesByUser = (userId: number) =>
  api.get(`/users/${userId}/rules`);

export const addRuleForUser = (userId: number, rule: any) => {
  return api.post(`/services/${userId}/rule`, rule);
};

export const updateRuleForUserById = (userId: number, id: number, rule: any) =>
  api.put(`/services/${userId}/rule/${id}`, rule);

export const deleteRuleForUserById = (userId: number, id: number) =>
  api.delete(`/services/${userId}/rule/${id}`);

export const applyRulesForUser = (userId: number) =>
  api.put(`/services/updateTransactionsByRule/${userId}`);

// institutions
export const getInstitutionById = (instId: string) =>
  api.get(`/institutions/${instId}`);

// misc
export const postLinkEvent = (event: any) => api.post(`/link-event`, event);

export const exchangeToken = async (
  publicToken: string,
  institution: any,
  accounts: PlaidLinkOnSuccessMetadata['accounts'],
  userId: number
) => {
  try {
    const { data } = await api.post('/items', {
      publicToken,
      institutionId: institution.institution_id,
      userId,
      accounts,
    });
    return data;
  } catch (err) {
    const { response } = err as { response: any };
    if (response && response.status === 409) {
      toast.error(
        <DuplicateItemToastMessage institutionName={institution.name} />
      );
    } else {
      toast.error(`Error linking ${institution.name}`);
    }
  }
};
