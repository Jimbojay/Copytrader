import { createSlice } from '@reduxjs/toolkit'

export const COPY_tokens = createSlice({
	name: 'COPY_tokens',
	initialState: {
		contracts: [],
		symbols: [],
		decimals: []
	},
	reducers: {
		setCopyContracts: (state, action) => {
			state.contracts = action.payload
		},
		setCopySymbols: (state, action) => {
			state.contracts = action.payload
		},
		setCopyDecimals: (state, action) => {
			state.contracts = action.payload
		}
	}


})

export const {  setCopyContracts, setCopySymbols, setCopyDecimals } = COPY_tokens.actions;

export default COPY_tokens.reducer;

