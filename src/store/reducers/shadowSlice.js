// shadowSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = [
  { alias: 'WarrenBuffet1', walletAddress: '0xb3dC55698077b07DC7BEC0b65cc15aF63116D811' },
  { alias: 'AlexBecker1', walletAddress: '0xca74f404e0c7bfa35b13b511097df966d5a65597' },
  // Add more initial data here
];

const shadowSlice = createSlice({
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

export const { addShadowAddress, removeShadowAddress } = shadowSlice.actions;

export default shadowSlice.reducer;
