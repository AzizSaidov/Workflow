import client from './client'

export const walletApi = {
  get: () => client.get('/wallet/'),
  deposit: (amount) => client.post('/wallet/deposit', { amount }),
  getTransactions: () => client.get('/wallet/transactions'),
}
