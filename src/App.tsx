import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletContextProvider } from './contexts/WalletContextProvider';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Contracts } from './pages/Contracts';
import { ContractDetails } from './pages/ContractDetails';
import { Credentials } from './pages/Credentials';
import { Dashboard } from './pages/Dashboard';
import { JobBoard } from './pages/JobBoard';
import { EmployerVerification } from './pages/EmployerVerification';

function App() {
  return (
    <WalletContextProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/:contractId" element={<ContractDetails />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<JobBoard />} />
            <Route path="/verify" element={<EmployerVerification />} />
          </Routes>
        </Layout>
      </Router>
    </WalletContextProvider>
  );
}

export default App;