import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from 'react-router-bootstrap';

const Tabs = () => {

  return (
    <Nav variant="pills" defaultActiveKey="/" className ='justify-content-center my-4'>
      <LinkContainer to="/ShadowTransactions">
        <Nav.Link>Shadow Transactions</Nav.Link>
      </LinkContainer>
      <LinkContainer to="/ShadowAddressManager">
        <Nav.Link>Shadow Addresses</Nav.Link>
      </LinkContainer>
      <LinkContainer to="/PandL">
        <Nav.Link>P&L Copied transactions</Nav.Link>
      </LinkContainer>
    </Nav>
  );
}

export default Tabs;

      // {/*
      // */}
