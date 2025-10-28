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
  TicketDetailPage,
  CheckInPage,
  ProfilePage,
  ApiTestPage,
} from './pages';
import { TestNavigationPage } from './pages/TestNavigationPage';
import {
  AdminDashboard,
  AdminFlightsPage,
  AdminAircraftPage,
  AdminPassengersPage,
  AdminAnalyticsPage,
  AdminUsersPage,
  AdminCitiesPage,
} from './pages/admin';
import { useAuth } from './hooks/useAuth';

// Component that handles auth initialization inside the Provider
function AppContent() {
  useAuth(); // Initialize auth on app load
  
  console.log('🚀 AppContent rendered - Router should be working');

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
          <Route path="test-nav" element={<TestNavigationPage />} />
          <Route path="api-test" element={<ApiTestPage />} />
          
          {/* User Protected Routes */}
          <Route path="user/my-tickets" element={<ProtectedRoute allowedRoles={['passenger', 'admin', 'operator']}><MyTicketsPage /></ProtectedRoute>} />
          <Route path="user/ticket/:ticketId" element={<ProtectedRoute allowedRoles={['passenger', 'admin', 'operator']}><TicketDetailPage /></ProtectedRoute>} />
          <Route path="user/check-in" element={<ProtectedRoute allowedRoles={['passenger', 'admin', 'operator']}><CheckInPage /></ProtectedRoute>} />
          <Route path="user/profile" element={<ProtectedRoute allowedRoles={['passenger', 'admin', 'operator']}><ProfilePage /></ProtectedRoute>} />
          <Route path="user/book-flight/:flightId" element={<ProtectedRoute allowedRoles={['passenger', 'admin', 'operator']}><BookingPage /></ProtectedRoute>} />
          
          {/* Admin Routes - Temporarily without ProtectedRoute for testing */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/flights" element={<AdminFlightsPage />} />
          <Route path="admin/aircraft" element={<AdminAircraftPage />} />
          <Route path="admin/passengers" element={<AdminPassengersPage />} />
          <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/cities" element={<AdminCitiesPage />} />
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