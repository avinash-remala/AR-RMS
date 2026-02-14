import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CompaniesList from './features/companies/pages/CompaniesList';
import OrdersList from './features/orders/pages/OrdersList';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <nav style={{
          width: '250px',
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '20px'
        }}>
          <h2 style={{ marginBottom: '30px' }}>RMS-AV</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '15px' }}>
              <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
                Dashboard
              </Link>
            </li>
            <li style={{ marginBottom: '15px' }}>
              <Link to="/orders" style={{ color: 'white', textDecoration: 'none' }}>
                Orders
              </Link>
            </li>
            <li style={{ marginBottom: '15px' }}>
              <Link to="/companies" style={{ color: 'white', textDecoration: 'none' }}>
                Companies
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, backgroundColor: '#ecf0f1' }}>
          <Routes>
            <Route path="/" element={
              <div style={{ padding: '20px' }}>
                <h1>Dashboard</h1>
                <p>Welcome to RMS-AV Restaurant Management System</p>
              </div>
            } />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/companies" element={<CompaniesList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
