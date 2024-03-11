import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'

// Components
import Navigation from './Navigation';
import Tabs from './Tabs';
// import Swap from './Swap';
// import Deposit from './Deposit';
// import Withdraw from './Withdraw';
// import Charts from './Charts';
import ShadowTransactions from './ShadowTransactions';
import ShadowAddressManager from './ShadowAddresses';
import PandL from './PandL';
import Roadmap from './Roadmap';

// import '../CustomStyle.css';


import { 
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadAMM
} from '../store/interactions'

function App() {

  const dispatch = useDispatch()

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = await loadProvider(dispatch)

    const chainId = await loadNetwork(provider, dispatch)

    // Reload page when network changes
    window.ethereum.on('chainChanged', async () => {
      window.location.reload()
    })

    // Fetch current account from Metamask when changed
    window.ethereum.on('accountsChanged', async () => {
      await loadAccount(dispatch)
    })

    
    // Initiate contracts
    // await loadTokens(provider, chainId, dispatch)
    // await loadAMM(provider, chainId, dispatch)
    // console.log(`test`)
  }

  useEffect(() => {
      loadBlockchainData()
  }, [loadBlockchainData]);

  return(
    <Container>
      <HashRouter>
      
        <Navigation />

        <hr />

        <Tabs />

        <hr />
        
        <Routes>
          <Route path="/" element={<ShadowTransactions />} />
          <Route path="/shadowAddressManager" element={<ShadowAddressManager />} />
          <Route path="/PandL" element={<PandL />} />
          <Route path="/Roadmap" element={<Roadmap />} />
        </Routes>

      </HashRouter>

    </Container>
    
  )
}

export default App;
