import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Páginas
import Login from './pages/Login';
import Home from './pages/Home';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ClientDashboard from './pages/client/Dashboard';
import TechnicianDashboard from './pages/technician/Dashboard';
import TicketDetails from './pages/TicketDetails';
import NewTicket from './pages/client/NewTicket';
import NearbyTechnicians from './pages/client/NearbyTechnicians';
import TechnicianServices from './pages/technician/Services';
import TechnicianAds from './pages/technician/Ads';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Payments from './pages/Payments';
import Attachments from './pages/Attachments';
import LocalServices from './pages/LocalServices';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTechnicians from './pages/admin/AdminTechnicians';
import AdminTickets from './pages/admin/AdminTickets';
import AdminLayout from './layouts/AdminLayout';

// Componentes
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* Removido wrapper .container para usar largura total */}
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          
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
            <Route path="ads" element={<TechnicianAds />} />
            <Route path="local-services" element={<LocalServices />} />
            <Route path="ticket/:ticketId" element={<TicketDetails />} />
            <Route path="ticket/:ticketId/attachments" element={<Attachments />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="payments" element={<Payments />} />
          </Route>
          <Route path="/admin" element={<PrivateRoute role="admin" />}> 
            <Route element={<AdminLayout />}> 
              <Route index element={<AdminDashboard />} /> 
              <Route path="users" element={<AdminUsers />} /> 
              <Route path="technicians" element={<AdminTechnicians />} /> 
              <Route path="tickets" element={<AdminTickets />} /> 
            </Route>
          </Route>
          
          {/* Rota 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={5000} />
    </ErrorBoundary>
  );
}

export default App;
