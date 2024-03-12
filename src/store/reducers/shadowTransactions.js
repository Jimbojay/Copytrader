// features/transactions/transactionsSlice.js
import { createSlice } from '@reduxjs/toolkit';

export const shadowTransactions = createSlice({
	name: 'transactions',
	initialState: [],
	reducers: {
		addTransaction: (state, action) => {
			state.push(action.payload);
		},
		updateTokensTransactions: (state, action) => {
			const index = state.findIndex(tx => tx.hash === action.payload.hash);
			if (index !== -1) {
			state[index] = { ...state[index], ...action.payload.updates };
			}
		},
	},
});

export const { addTransaction, updateTokensTransactions } = shadowTransactions.actions;

export default shadowTransactions.reducer;
