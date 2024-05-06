import React, { useState } from 'react';
import { useDispatch } from 'react-redux'; 
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import {addWallet, loadWallets, removeWallet} from '../localStorage';

import { addShadowAddress, removeShadowAddress } from '../store/reducers/shadowAddresses'; // Import the actions

import etherscanLogo from '../media/logo-etherscan_transparant.png';

const ShadowAddressManager = () => {
  // console.log("teststring")
  // console.log("teststring_test", loadWallets())

  const shadows = loadWallets() || [];
  // console.log('testShadows', shadows)
  const dispatch = useDispatch();
  // const shadows = useSelector((state) => state.shadowAddresses) || [];

  const [newAlias, setNewAlias] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [selectedAlias, setSelectedAlias] = useState('');

  const handleAddShadowAddress = () => {
    if (newAlias && newWalletAddress && isValidEthereumAddress(newWalletAddress)) {
      addWallet({ alias: newAlias, walletAddress: newWalletAddress })
      dispatch(addShadowAddress({ alias: newAlias, walletAddress: newWalletAddress }));
      setNewAlias('');
      setNewWalletAddress('');
    } else {
      alert('Please enter a valid Ethereum wallet address.');
    }
  };

  const handleRemoveShadowAddress = () => {
    if (selectedAlias) {
      removeWallet(selectedAlias)
      dispatch(removeShadowAddress(selectedAlias));
      setSelectedAlias('');
    }
  };

  const isValidEthereumAddress = (address) => {
    return address.match(/^0x[a-fA-F0-9]{40}$/) !== null;
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <h4>Shadow addresses</h4>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Alias</th>
                      <th>Etherscan</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shadows && shadows.map((aliasData, index) => (
                      <tr key={index}>
                        <td>{aliasData.alias}</td>
                        <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <a
                            href={`https://etherscan.io/address/${aliasData.walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={etherscanLogo}
                              alt="Etherscan Logo"
                              style={{ width: '24px', height: '24px' }}
                            />
                          </a>
                        </td>
                        <td>{aliasData.walletAddress}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body> 
          </Card>
        </div>
        <div className="col-md-6" style={{ maxWidth: '450px' }}>
          <Card>
            <Card.Header>
              <h4>Add shadow address</h4>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group controlId="newAlias">
                  <Form.Label>Alias</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter arbitrary alias"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="newWalletAddress">
                  <Form.Label>Wallet Address</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter wallet address"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                  />
                </Form.Group>
                <Button variant="primary" style={{ marginTop: '10px' }} onClick={handleAddShadowAddress}>
                  Add
                </Button>
              </Form>
            </Card.Body>
          </Card>
          <Card className="mt-3">
            <Card.Header>
              <h4>Remove shadow address</h4>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group controlId="selectedAlias">
                  <Form.Label>Select Alias</Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedAlias}
                    onChange={(e) => setSelectedAlias(e.target.value)}
                  >
                    <option value="">Select an alias</option>
                    {shadows && shadows.map((alias) => (
                      <option key={alias.alias} value={alias.alias}>
                        {alias.alias}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <Form.Group controlId="walletAddress">
                  <Form.Label>Wallet Address</Form.Label>
                  <Form.Control
                    style={{ backgroundColor: '#333', color: '#fff' }}
                    type="text"
                    className="disabled-input"
                    readOnly
                    value={shadows.find((alias) => alias.alias === selectedAlias)?.walletAddress || ''}
                  />
                </Form.Group>
                <Button variant="danger" style={{ marginTop: '10px' }} onClick={handleRemoveShadowAddress}>
                  Remove
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShadowAddressManager;
