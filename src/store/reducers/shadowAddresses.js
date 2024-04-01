// shadowSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = [
  // { alias: 'WarrenBuffet1', walletAddress: '0x95A5A3a9bDFdF011061d3D304E67666362F73B4a' },
  // { alias: 'Alex Becker1', walletAddress: '0xca74f404e0c7bfa35b13b511097df966d5a65597' },
  // { alias: 'ETHTrader', walletAddress: '0xcbb48e6d1594e36c88b5dbd14179f2017530012d'},
  // { alias: 'Test', walletAddress: '0xE5deeD731B09108cBFA3C26Fb3d61522E93519bC'},
  { alias: 'TestLow1', walletAddress: '0xc7e6700171a2ccc4fded8d831100ac626f3db52d'},
  { alias: 'TestLow3', walletAddress: '0xD124688fe3Ff4b66aE8715b82135caDeD05c61Dc'},
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
