// export const saveState = (state) => {
// 	try {
// 	const serialState = JSON.stringify(state);
// 	localStorage.setItem('shadowWallets', serialState);
// 	} catch(err) {
// 		console.log(err);
// 	}
// };
export const loadState = () => {
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
export const addState = (newEntry) => {
    try {
        // Use loadState() to fetch the existing state
        const existingState = loadState() || {};

        // Update the existing state with the new entry
        // Assuming the state and newEntry are objects
        const updatedState = { ...existingState, ...newEntry };

        // Serialize the updated state and save it back to localStorage
        const serialState = JSON.stringify(updatedState);
        localStorage.setItem('shadowWallets', serialState);
    } catch (err) {
        console.log(err);
    }
};

export const removeState = (keysToRemove) => {
    try {
        const state = loadState() || {};

        // Iterate over each key and remove it if present
        keysToRemove.forEach(key => {
            if (state.hasOwnProperty(key)) {
                delete state[key];
            }
        });

        // Serialize and save the updated state
        const serialState = JSON.stringify(state);
        localStorage.setItem('shadowWallets', serialState);
    } catch (err) {
        console.log(err);
    }
};
