import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { NotificationProvider } from './components/ui';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  FlightSearchPage,
  FlightDetailsPage,
  BookingPage,
  MyTicketsPage,
  CheckInPage,
  ProfilePage,
} from './pages';
import {
  AdminDashboard,
  AdminFlightsPage,
  AdminAircraftPage,
  AdminPassengersPage,
  AdminAnalyticsPage,
  AdminUsersPage,
} from './pages/admin';
import { useAuth } from './hooks/useAuth';

// Component that handles auth initialization inside the Provider
function AppContent() {
  useAuth(); // Initialize auth on app load

  return (
    <Router>
      <Routes>
        {/* Main Layout with Navbar */}
        <Route path="/" element={<MainLayout />}>
          {/* Public Routes */}
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="flights" element={<FlightSearchPage />} />
          <Route path="flights/:id" element={<FlightDetailsPage />} />
          
          {/* User Protected Routes */}
          <Route path="user/my-tickets" element={<ProtectedRoute allowedRoles={['passenger', 'admin', 'operator']}><MyTicketsPage /></ProtectedRoute>} />
          <Route path="user/check-in" element={<ProtectedRoute allowedRoles={['passenger', 'admin', 'operator']}><CheckInPage /></ProtectedRoute>} />
          <Route path="user/profile" element={<ProtectedRoute allowedRoles={['passenger', 'admin', 'operator']}><ProfilePage /></ProtectedRoute>} />
          <Route path="user/book-flight/:flightId" element={<ProtectedRoute allowedRoles={['passenger', 'admin', 'operator']}><BookingPage /></ProtectedRoute>} />
          
          {/* Admin Protected Routes */}
          <Route path="admin" element={<ProtectedRoute allowedRoles={['admin', 'operator']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/flights" element={<ProtectedRoute allowedRoles={['admin', 'operator']}><AdminFlightsPage /></ProtectedRoute>} />
          <Route path="admin/aircraft" element={<ProtectedRoute allowedRoles={['admin', 'operator']}><AdminAircraftPage /></ProtectedRoute>} />
          <Route path="admin/passengers" element={<ProtectedRoute allowedRoles={['admin', 'operator']}><AdminPassengersPage /></ProtectedRoute>} />
          <Route path="admin/analytics" element={<ProtectedRoute allowedRoles={['admin', 'operator']}><AdminAnalyticsPage /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute allowedRoles={['admin', 'operator']}><AdminUsersPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </Provider>
  );
}

export default App;