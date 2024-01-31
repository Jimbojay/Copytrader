import { configureStore } from '@reduxjs/toolkit'

import provider from './reducers/provider'
import tokens from './reducers/tokens'
import amm from './reducers/amm'
import shadowSlice from './reducers/shadowSlice'

export const store = configureStore({
	reducer: {
		provider,
		tokens,
		amm,
		shadowSlice
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false
		})
})
