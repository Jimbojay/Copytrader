export const saveWallets = (state) => {
	try {
	const serialState = JSON.stringify(state);
	localStorage.setItem('shadowWallets', serialState);
	console.log('added wallet: ' )
	} catch(err) {
		console.log(err);
	}
};

export const loadWallets = () => {
	try {
	const serialState = localStorage.getItem('shadowWallets');
	if (serialState === null) {
		return undefined;
	}
	return JSON.parse(serialState);
	} catch (err) {
	return undefined;
	}
};

export const addWallet = (newWallet) => {
	try {
	  // Load the current wallets from localStorage, or initialize as an empty array if none exist
		const currentWallets = loadWallets() || [];
		
        // Check if the wallet's alias or address already exists
        const aliasExists = currentWallets.some(wallet => wallet.alias === newWallet.alias);
        const addressExists = currentWallets.some(wallet => wallet.walletAddress === newWallet.walletAddress);

        if (aliasExists) {
            console.error("Error adding new wallet: Alias already exists.");
            return; // Prevent adding the new wallet
        }

        if (addressExists) {
            console.error("Error adding new wallet: Wallet address already exists.");
            return; // Prevent adding the new wallet
        }
		
		// Add the new wallet to the array
		const updatedWallets = [...currentWallets, newWallet];
		
		// Save the updated wallets back to localStorage
		saveWallets(updatedWallets);
		console.log('Wallet added successfully:', JSON.stringify(newWallet));
	} catch (err) {
		console.error("Error adding new wallet:", err);
	}
};

export const removeWallet = (aliasToRemove) => {
    try {
        // Load the current wallets from localStorage
        const currentWallets = loadWallets() || [];
        
        // Filter out the wallet with the given alias
        const updatedWallets = currentWallets.filter(wallet => wallet.alias !== aliasToRemove);
        
        // Save the updated wallets back to localStorage
        saveWallets(updatedWallets);
        
        console.log(`Removed wallet with alias: ${aliasToRemove}`);
    } catch (err) {
        console.error("Error removing wallet:", err);
    }
};

export const clearWallets = () => {
    try {
        localStorage.removeItem('shadowWallets');
        console.log('All wallets removed successfully');
    } catch (err) {
        console.error("Error clearing wallets:", err);
    }
};