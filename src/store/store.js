import { configureStore } from '@reduxjs/toolkit'

import provider from './reducers/provider'
import tokens from './reducers/tokens'
import amm from './reducers/amm'
import shadowAddresses from './reducers/shadowAddresses'
import COPY_tokens from './reducers/COPY_tokens'

export const store = configureStore({
	reducer: {
		provider,
		tokens,
		amm,
		shadowAddresses,
		COPY_tokens,
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false
		})
})
