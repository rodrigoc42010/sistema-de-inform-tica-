import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Páginas
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import ClientDashboard from './pages/client/Dashboard';
import TechnicianDashboard from './pages/technician/Dashboard';
import TicketDetails from './pages/TicketDetails';
import NewTicket from './pages/client/NewTicket';
import NearbyTechnicians from './pages/client/NearbyTechnicians';
import TechnicianServices from './pages/technician/Services';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Payments from './pages/Payments';
import Attachments from './pages/Attachments';
import LocalServices from './pages/LocalServices';

// Componentes
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <>
      <Router>
        <div className="container">
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Rotas privadas - Cliente */}
            <Route path="/client" element={<PrivateRoute role="client" />}>
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="new-ticket" element={<NewTicket />} />
              <Route path="nearby-technicians" element={<NearbyTechnicians />} />
              <Route path="local-services" element={<LocalServices />} />
              <Route path="ticket/:ticketId" element={<TicketDetails />} />
              <Route path="ticket/:ticketId/attachments" element={<Attachments />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="payments" element={<Payments />} />
            </Route>
            
            {/* Rotas privadas - Técnico */}
            <Route path="/technician" element={<PrivateRoute role="technician" />}>
              <Route path="dashboard" element={<TechnicianDashboard />} />
              <Route path="services" element={<TechnicianServices />} />
              <Route path="local-services" element={<LocalServices />} />
              <Route path="ticket/:ticketId" element={<TicketDetails />} />
              <Route path="ticket/:ticketId/attachments" element={<Attachments />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="payments" element={<Payments />} />
            </Route>
            
            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
      <ToastContainer position="top-right" autoClose={5000} />
    </>
  );
}

export default App;