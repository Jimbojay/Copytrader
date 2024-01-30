import React, { useState, useMemo } from 'react';
import Table from 'react-bootstrap/Table';
import Select from 'react-select';
import Button from 'react-bootstrap/Button';

// Helper function to convert time string to seconds
const timeToSeconds = (time) => {
  const [hours, minutes, seconds] = time.split('-').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const ShadowTransactions = () => {
  const [filters, setFilters] = useState({
    alias: [],
    tokenFrom: [],
    tokenTo: []
  });

  const transactions = [
    { alias: 'WarrenBuffet1', tokenFrom: 'ETH', tokenTo: 'BTC', amountFrom: '2.5', exchangeRate: '0.075', exchangeRateDifference: '3%', timeSinceSwap: '00-00-45', transactionHash: '0xabcdef1234567890000000000000000000000001' },
    { alias: 'AlexBecker1', tokenFrom: 'USDC', tokenTo: 'ARB', amountFrom: '1000', exchangeRate: '0.95', exchangeRateDifference: '-2%', timeSinceSwap: '00-03-15', transactionHash: '0xabcdef1234567890000000000000000000000003' },
    { alias: 'WarrenBuffet2', tokenFrom: 'SOL', tokenTo: 'USDT', amountFrom: '150', exchangeRate: '1.5', exchangeRateDifference: '1%', timeSinceSwap: '00-01-30', transactionHash: '0xabcdef1234567890000000000000000000000002' },
    { alias: 'John1', tokenFrom: 'BTC', tokenTo: 'ETH', amountFrom: '0.8', exchangeRate: '13.5', exchangeRateDifference: '2.5%', timeSinceSwap: '00-10-00', transactionHash: '0xabcdef1234567890000000000000000000000004' },
    { alias: 'John1', tokenFrom: 'USDT', tokenTo: 'SOL', amountFrom: '500', exchangeRate: '0.65', exchangeRateDifference: '0.5%', timeSinceSwap: '01-00-00', transactionHash: '0xabcdef1234567890000000000000000000000005' },
  ];

  // Function to format time from "dd-hh-mm" to "dd days, hh hours, mm minutes"
  const formatTimeSinceSwap = (time) => {
    const parts = time.split('-');
    return `${parts[0]} d, ${parts[1]} h, ${parts[2]} m`;
  };

  // Sort transactions by timeSinceSwap in descending order
  const sortedTransactions = useMemo(() => {
    return transactions.slice().sort((a, b) => timeToSeconds(a.timeSinceSwap) - timeToSeconds(b.timeSinceSwap));
  }, [transactions]);


  const filteredTransactions = sortedTransactions.filter((tx) =>
    (filters.alias.length === 0 || filters.alias.some((alias) => alias.value === tx.alias)) &&
    (filters.tokenFrom.length === 0 || filters.tokenFrom.some((token) => token.value === tx.tokenFrom)) &&
    (filters.tokenTo.length === 0 || filters.tokenTo.some((token) => token.value === tx.tokenTo))
  );

  const options = {
    alias: [...new Set(transactions.map((tx) => tx.alias))].map((alias) => ({ label: alias, value: alias })),
    tokenFrom: [...new Set(transactions.map((tx) => tx.tokenFrom))].map((token) => ({ label: token, value: token })),
    tokenTo: [...new Set(transactions.map((tx) => tx.tokenTo))].map((token) => ({ label: token, value: token }))
  };

  const handleFilterChange = (selectedOptions, { name }) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: selectedOptions || []
    }));
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
      // Optional: Show some notification or change button state after copy
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
            <th>%Exchange rate difference since swap</th>
            <th>Time since swap</th>
            <th>Copy</th>
            <th>Transaction hash</th>
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
                <Button 
                  variant="primary" 
                  onClick={() => handleCopy(transaction.transactionHash)}
                >
                  Copy
                </Button>
              </td>
              <td>{transaction.transactionHash}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ShadowTransactions;
