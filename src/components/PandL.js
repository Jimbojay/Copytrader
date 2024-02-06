import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Table from 'react-bootstrap/Table';
import { ethers } from 'ethers';
import { useSelector } from 'react-redux'; 

import UNISWAP_ROUTER_ABI from '../abis/UniswapV2_Router.json';
import UNISWAP_ABI from '../abis/UniswapV2.json';

const etherscanApiKey = 'Q8XU2NTS5272HC4JPE9UAW3YSGMKT9B2PN';
const address = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const INFURA_API_KEY = "a8aa19688193447d9a185f415344cf61";
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);


const TransactionsTable = () => {
    const shadows = useSelector((state) => state.shadowSlice) || [];
    // console.log(shadows)

    // Extract all walletAddresses into a separate array and convert them to lowercase
    const walletAddresses = shadows
      .filter(shadow => shadow.walletAddress !== undefined) // Keep only items with walletAddress
      .map(shadow => shadow.walletAddress.toLowerCase());

    // console.log(walletAddresses); // This will show all extracted and filtered walletAddresses, all in lowercase    


    const [receipts, setReceipts] = useState([]);
    const [loadingStatus, setLoadingStatus] = useState({
        transactions: false,
        decoding: false,
        receipts: false,
    });

    useEffect(() => {
        const fetchTransactionsAndReceipts = async () => {
            setLoadingStatus({ transactions: false, decoding: false, receipts: false });
            const contractInterfaceRouter = new ethers.utils.Interface(UNISWAP_ROUTER_ABI);
            const contractInterface = new ethers.utils.Interface(UNISWAP_ABI);
            try {
                const currentBlock = await provider.getBlockNumber();
                const blocksPerMonth = 4 * 60 * 24 * 30; // Approximation
                const startBlock = currentBlock - (3 * blocksPerMonth);

                const apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${currentBlock}&sort=desc&apikey=${etherscanApiKey}`;

                const response = await axios.get(apiUrl);
                if (response.data.status === "1" && response.data.message === "OK") {
                    const transactions = response.data.result;
                    console.log('Transactions:', transactions);

                    const filteredTransactions = transactions.filter(tx =>
                        walletAddresses.some(addr => addr.toLowerCase() === tx.from.toLowerCase())
                    );

                    const transactionsWithDetails = await Promise.all(filteredTransactions.map(async tx => {
                        let decodedInputData = {};
                        try {
                            decodedInputData = contractInterfaceRouter.parseTransaction({ data: tx.input });
                        } catch (error) {
                            console.error('Error decoding transaction input:', tx.hash, error);
                        }

                        const receipt = await provider.getTransactionReceipt(tx.hash);

                        // Filtering out failed transactions by checking receipt status
                        if (receipt.status === 0) {
                            console.log(`Skipping failed transaction with hash: ${tx.hash}`);
                            return null; // Skip adding this transaction to the results
                        }

                        let swapDetails = {
                            hash: tx.hash,
                            walletAddress: tx.from,
                            path0: undefined,
                            path1: undefined,
                            swapData: undefined, // Placeholder for swap data
                            decodedLogs: [] // Placeholder for decoded logs
                        };

                        if (decodedInputData && decodedInputData.args && decodedInputData.args.path) {
                            swapDetails.path0 = decodedInputData.args.path[0];
                            swapDetails.path1 = decodedInputData.args.path.length > 1 ? decodedInputData.args.path[1] : undefined;
                        }

                        receipt.logs.forEach(log => {
                            try {
                                const decodedLog = contractInterface.parseLog({
                                    topics: log.topics,
                                    data: log.data
                                });
                                swapDetails.decodedLogs.push(decodedLog.name); // Store only the event names
                                console.log('decodedLog:', decodedLog)
                            } catch (error) {
                                // This catch block will handle errors for logs that don't match the ABI
                            }
                        });

                        return { ...tx, decodedInputData, receipt, swapDetails };
                    }));

                    const validTransactions = transactionsWithDetails.filter(tx => tx && tx.swapDetails.path0 && tx.swapDetails.path1);
                    console.log('Transactions with Receipts:', validTransactions);
                    setReceipts(validTransactions);
                    setLoadingStatus({ transactions: true, decoding: true, receipts: true });
                } else {
                    console.error('No transactions found or error fetching transactions:', response.data.result);
                }
            } catch (error) {
                console.error('Error fetching transactions or receipts:', error);
            }
        };

        fetchTransactionsAndReceipts();
    }, []);

    if (!loadingStatus.transactions || !loadingStatus.decoding || !loadingStatus.receipts) {
        return <div>Loading transactions and receipts...</div>;
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Transaction Hash</th>
                        <th>Wallet Address</th>
                        <th>Path[0]</th>
                        <th>Path[1]</th>
                        <th>Event Names</th>
                    </tr>
                </thead>
                <tbody>
                    {receipts.map((tx, index) => (
                        <tr key={index}>
                            <td>{tx.hash}</td>
                            <td>{tx.swapDetails.walletAddress}</td>
                            <td>{tx.swapDetails.path0}</td>
                            <td>{tx.swapDetails.path1}</td>
                            <td>
                                {tx.swapDetails.decodedLogs.join(", ")}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default TransactionsTable;
