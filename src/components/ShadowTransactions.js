import React, { useState, useEffect, useMemo } from 'react';
import Table from 'react-bootstrap/Table';
import Select from 'react-select';
import Button from 'react-bootstrap/Button';
import { useSelector } from 'react-redux';

import etherscanLogo from '../logo-etherscan.png';

const timeToSeconds = (time) => {
  const [hours, minutes, seconds] = time.split('-').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};


const ShadowTransactions = () => {
    const shadows = useSelector((state) => state.shadowSlice) || [];

    useEffect(() => {
        shadows.forEach((wallet) => {
            console.log(wallet.walletAddress);
        });
    }, [shadows]);

    const [filters, setFilters] = useState({
        alias: [],
        tokenFrom: [],
        tokenTo: []
    });

    const [transactions, setTransactions] = useState([
      { alias: 'WarrenBuffet1', tokenFrom: 'ETH', tokenTo: 'BTC', amountFrom: '2.5', exchangeRate: '0.075', exchangeRateDifference: '3%', timeSinceSwap: '00-00-45', transactionHash: '0x7c028b92f82aa60314b87b9f2a1683f2026faf0b7b403588f3084c33db98b5c5 ', inputAmountFrom: '' },
      { alias: 'AlexBecker1', tokenFrom: 'USDC', tokenTo: 'ARB', amountFrom: '1000', exchangeRate: '0.95', exchangeRateDifference: '-2%', timeSinceSwap: '00-03-15', transactionHash: '0xabcdef1234567890000000000000000000000003', inputAmountFrom: '' },
      { alias: 'WarrenBuffet2', tokenFrom: 'SOL', tokenTo: 'USDT', amountFrom: '150', exchangeRate: '1.5', exchangeRateDifference: '1%', timeSinceSwap: '00-01-30', transactionHash: '0xabcdef1234567890000000000000000000000002', inputAmountFrom: '' },
      { alias: 'John1', tokenFrom: 'BTC', tokenTo: 'ETH', amountFrom: '0.8', exchangeRate: '13.5', exchangeRateDifference: '2.5%', timeSinceSwap: '00-10-00', transactionHash: '0xabcdef1234567890000000000000000000000004', inputAmountFrom: '' },
      { alias: 'John1', tokenFrom: 'USDT', tokenTo: 'SOL', amountFrom: '500', exchangeRate: '0.65', exchangeRateDifference: '0.5%', timeSinceSwap: '01-00-00', transactionHash: '0xabcdef1234567890000000000000000000000005', inputAmountFrom: '' },
    ]);

    const formatTimeSinceSwap = (time) => {
        const parts = time.split('-');
        return `${parts[0]} d, ${parts[1]} h, ${parts[2]} m`;
    };

    // Apply filters to the transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
            const filterAlias = filters.alias.length === 0 || filters.alias.some(option => option.value === transaction.alias);
            const filterTokenFrom = filters.tokenFrom.length === 0 || filters.tokenFrom.some(option => option.value === transaction.tokenFrom);
            const filterTokenTo = filters.tokenTo.length === 0 || filters.tokenTo.some(option => option.value === transaction.tokenTo);
            return filterAlias && filterTokenFrom && filterTokenTo;
        }).sort((a, b) => timeToSeconds(a.timeSinceSwap) - timeToSeconds(b.timeSinceSwap));
    }, [transactions, filters, timeToSeconds]);

    const options = {
        alias: [...new Set(transactions.map(tx => tx.alias))].map(alias => ({ label: alias, value: alias })),
        tokenFrom: [...new Set(transactions.map(tx => tx.tokenFrom))].map(token => ({ label: token, value: token })),
        tokenTo: [...new Set(transactions.map(tx => tx.tokenTo))].map(token => ({ label: token, value: token }))
    };

    const handleFilterChange = (selectedOptions, { name }) => {
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: selectedOptions || []
        }));
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log(`Copied to clipboard: ${text}`);
        });
    };

    return (
        <div>
            <Select
                isMulti
                name="alias"
                options={options.alias}
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={handleFilterChange}
                placeholder="Filter by Alias"
            />
            <Select
                isMulti
                name="tokenFrom"
                options={options.tokenFrom}
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={handleFilterChange}
                placeholder="Filter by Token From"
            />
            <Select
                isMulti
                name="tokenTo"
                options={options.tokenTo}
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={handleFilterChange}
                placeholder="Filter by Token To"
            />
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Alias</th>
                        <th>Token from</th>
                        <th>Token to</th>
                        <th>Amount from tokens</th>
                        <th>Exchange rate</th>
                        <th>%Difference vs. current exchange</th>
                        <th>Time since swap</th>
                        <th>Swap amount</th>
                        <th>Copy</th>
                        <th>Etherscan</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTransactions.map((transaction, index) => (
                        <tr key={index}>
                            <td>{transaction.alias}</td>
                            <td>{transaction.tokenFrom}</td>
                            <td>{transaction.tokenTo}</td>
                            <td>{transaction.amountFrom}</td>
                            <td>{transaction.exchangeRate}</td>
                            <td>{transaction.exchangeRateDifference}</td>
                            <td>{formatTimeSinceSwap(transaction.timeSinceSwap)}</td>
                            <td>
                                <input
                                    type="number"
                                    placeholder="Input swap amount"
                                    value={transaction.inputAmountFrom}
                                    onChange={(e) => {
                                        const updatedTransactions = [...transactions];
                                        updatedTransactions[index].inputAmountFrom = e.target.value;
                                        setTransactions(updatedTransactions);
                                    }}
                                />
                            </td>
                            <td>
                                <Button variant="primary" onClick={() => handleCopy(transaction.transactionHash)}>
                                    Copy
                                </Button>
                            </td>
                            <td>
                                <a href={`https://etherscan.io/tx/${transaction.transactionHash}`} target="_blank" rel="noopener noreferrer">
                                    <img src={etherscanLogo} alt="Etherscan Logo" style={{ width: '24px', height: '24px' }} />
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default ShadowTransactions;
