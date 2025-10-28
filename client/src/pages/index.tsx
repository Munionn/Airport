import React from 'react';

// Export the actual implementations
export { HomePage } from './HomePage';
export { LoginPage } from './LoginPage';
export { RegisterPage } from './RegisterPage';
export { FlightSearchPage } from './FlightSearchPage';
export { FlightDetailsPage } from './FlightDetailsPage';
export { BookingPage } from './BookingPage';
export { MyTicketsPage } from './MyTicketsPage';
export { TicketDetailPage } from './TicketDetailPage';
export { ApiTestPage } from './ApiTestPage';

export const CheckInPage: React.FC = () => (
  <div className="p-6 bg-white rounded-lg shadow-md">
    <h2 className="text-2xl font-bold mb-4">Check In</h2>
    <p>Check-in functionality will be implemented here.</p>
  </div>
);

export const ProfilePage: React.FC = () => (
  <div className="p-6 bg-white rounded-lg shadow-md">
    <h2 className="text-2xl font-bold mb-4">Profile</h2>
    <p>User profile management will be implemented here.</p>
  </div>
);
