import { useSelector, useDispatch } from 'react-redux'
import Navbar from 'react-bootstrap/Navbar';
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Blockies from 'react-blockies'
import '../CustomStyle.css';

import logo from '../media/DappAstra_logo_transparent.png';

import { loadAccount
// , loadBalances 
,loadNetwork
} from '../store/interactions'

import config from '../config.json'

const Navigation = () => {
  const chainId = useSelector(state => state.provider.chainId)
  const account = useSelector(state => state.provider.account)
  // const tokens = useSelector(state => state.tokens.contracts)
  // const amm = useSelector(state => state.amm.contract)

  const dispatch = useDispatch()

  const connectHandler = async () => {
    const account = await loadAccount(dispatch)
    // await loadBalances(amm, tokens, account, dispatch)
  }

  const networkHandler = async (e) => {
    console.log(e.target.value)
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: e.target.value }],
      });
      // Optionally dispatch action to update chainId in your Redux store:
      // dispatch(loadNetwork(provider, e.target.value));
    } catch (error) {
      if (error.code === 4902) {
        console.error('The requested network is not available.');
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  }

  return (
    <Navbar className='my-3' expand="lg">
      <img
        alt="logo"
        src={logo}
        width="200"
        height="36"
        className="d-inline-block align-top mx-3"
      />
      <Navbar.Brand href="#" className="white-navbar-brand">Copytrader</Navbar.Brand>
      <Navbar.Toggle aria-controls="nav" />
      <Navbar.Collapse id="nav" className="justify-content-end">

        <div className="d-flex justify-content-end mt-3">
          {console.log('test chainid: ', chainId)}
          {console.log("Current hex chainId:", `0x${parseInt(chainId, 10).toString(16)}`)}
          
          <Form.Select
            aria-label="Network Selector"
            value={config[chainId] ? `0x${parseInt(chainId, 10).toString(16)}` : "0"}
            onChange={networkHandler}
            style={{ maxWidth: '200px', marginRight: '20px' }}
          >
            <option value="0" disabled>Select Network</option>
            <option value="0x1">ETH Mainnet</option>
            <option value="0x7a69">Localhost</option>
            {/* <option value="0x89">Polygon</option> */}
          </Form.Select>

          {account ? (
            <Navbar.Text className='d-flex align-items-center'>
              {account.slice(0, 5) + '...' + account.slice(38, 42)}
              <Blockies
                seed={account}
                size={10}
                scale={3}
                color="#2187D0"
                bgColor="#F1F2F9"
                spotColor="#767F92"
                className="identicon mx-2"
              />
            </Navbar.Text>
          ) : (
            <Button onClick={connectHandler}>Connect</Button>
          )}

        </div>

      </Navbar.Collapse>
    </Navbar>
  );
}

export default Navigation;
