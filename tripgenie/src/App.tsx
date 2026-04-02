import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';

// Traveller Pages
import { TravellerDashboard } from './pages/traveller/Dashboard';
import { MyTrips } from './pages/traveller/MyTrips';
import { TripDetails as TravellerTripDetails } from './pages/traveller/TripDetails';

// Agent Pages
import { AgentDashboard } from './pages/agent/Dashboard';
import { CreatePlan } from './pages/agent/CreatePlan';
import { PlacesManagement } from './pages/agent/PlacesManagement';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { AllTrips } from './pages/admin/AllTrips';
import { GlobalPlaces } from './pages/admin/GlobalPlaces';

import './styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Traveller Routes */}
          <Route
            path="/traveller/dashboard"
            element={
              <ProtectedRoute allowedRoles={['traveller']}>
                <TravellerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/traveller/my-trips"
            element={
              <ProtectedRoute allowedRoles={['traveller']}>
                <MyTrips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/traveller/trip-details/:tripId"
            element={
              <ProtectedRoute allowedRoles={['traveller']}>
                <TravellerTripDetails />
              </ProtectedRoute>
            }
          />

          {/* Agent Routes */}
          <Route
            path="/agent/dashboard"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/create-plan"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <CreatePlan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/places"
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <PlacesManagement />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trips"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AllTrips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/places"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <GlobalPlaces />
              </ProtectedRoute>
            }
          />

          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
