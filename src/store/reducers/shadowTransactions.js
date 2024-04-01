// features/transactions/transactionsSlice.js
import { createSlice } from '@reduxjs/toolkit';

export const ShadowTransactions = createSlice({
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
		clearShadowTransactions: state => {
			return []; // Simply return an empty array to clear the transactions
		},
	},
});

export const { addTransaction, updateTokensTransactions, clearShadowTransactions } = ShadowTransactions.actions;

export default ShadowTransactions.reducer;
