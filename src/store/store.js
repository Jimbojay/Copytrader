import { configureStore } from '@reduxjs/toolkit'

import provider from './reducers/provider'
// import tokens from './reducers/tokens'
// import amm from './reducers/amm'
import shadowAddresses from './reducers/shadowAddresses'
import shadowTransactions from './reducers/shadowTransactions'

export const store = configureStore({
	reducer: {
		provider,
		// tokens,
		// amm,
		shadowAddresses,
		shadowTransactions,
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false
		})
})
