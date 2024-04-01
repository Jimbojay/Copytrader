function formatTokenAmount(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0'; // Return '0' if the amount is not a number

    // For numbers larger than 1 million, round to nearest million with one decimal
    if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + 'M';
    }

    // Determine the number of decimal places needed based on the value
    const minFractionDigits = num < 1 ? 4 : (num >= 1 && num < 1000) ? 2 : 0;
    const maxFractionDigits = num < 1 ? 4 : (num >= 1 && num < 1000) ? 2 : 0;

    // Check if the number is too small to be represented in the minimum fraction digits
    if (num > 0 && num < Math.pow(10, -minFractionDigits)) {
        // Show in scientific notation with two decimal places
        return num.toExponential(2);
    } else {
        // Use Intl.NumberFormat for thousand separators and conditional decimals
        const formatter = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: minFractionDigits,
            maximumFractionDigits: maxFractionDigits,
        });

        let formatted = formatter.format(num);

        // Convert to string to manipulate decimals
        formatted = formatted.toString();

        // Check if the formatted string contains a decimal point
        if (formatted.indexOf('.') !== -1) {
            // Trim trailing zeros
            formatted = formatted.replace(/\.?0+$/, '');
        }

        return formatted;
    }
}

function getTimeSince(timestamp) {
    const now = new Date(); // Current time
    const txDate = new Date(timestamp * 1000); // Convert Unix epoch time to JavaScript Date object
    const diff = now - txDate; // Difference in milliseconds

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days} D, ${hours} H, ${minutes} M`;
}

async function addTokenToMetaMask(tokenAddress, symbol, decimals) {
    try {
        // Check if MetaMask is installed
        if (!window.ethereum) throw new Error("MetaMask is not installed");

        console.log('MetaMask:', tokenAddress, symbol, decimals);

        const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
            type: 'ERC20', // Initially only supports ERC20, but other standards may be added
            options: {
            address: tokenAddress, // The address of the token contract
            symbol: symbol, // A ticker symbol or shorthand, up to 5 characters
            decimals: decimals, // The number of token decimals
            // You can also add an image URL for the token here
            },
        },
        });

        if (wasAdded) {
        console.log('Token was added to MetaMask');
        } else {
        console.log('Token was not added to MetaMask');
        }
    } catch (error) {
        console.error(error);
    }
    }

module.exports = {
    formatTokenAmount,
    getTimeSince,
    addTokenToMetaMask
}
