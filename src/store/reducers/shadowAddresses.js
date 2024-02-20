// shadowSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = [
  // { alias: 'WarrenBuffet1', walletAddress: '0x95A5A3a9bDFdF011061d3D304E67666362F73B4a' },
  { alias: 'AlexBecker1', walletAddress: '0xca74f404e0c7bfa35b13b511097df966d5a65597' },
  // { alias: 'ETHTrader', walletAddress: '0xcbb48e6d1594e36c88b5dbd14179f2017530012d'}
  // Add more initial data here
];

const shadowAddresses = createSlice({
  name: 'shadows',
  initialState,
  reducers: {
    addShadowAddress: (state, action) => {
      state.push(action.payload);
    },
    removeShadowAddress: (state, action) => {
      const aliasToRemove = action.payload;
      return state.filter((shadow) => shadow.alias !== aliasToRemove);
    },
  },
});

export const { addShadowAddress, removeShadowAddress } = shadowAddresses.actions;

export default shadowAddresses.reducer;
