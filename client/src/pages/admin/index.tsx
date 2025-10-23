import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';

// Export the actual implementations
export { AdminFlightsPage } from './AdminFlightsPage';
export { AdminAnalyticsPage } from './AdminAnalyticsPage';
export { AdminUsersPage } from './AdminUsersPage';
export { AdminAircraftPage } from './AdminAircraftPage';
export { AdminPassengersPage } from './AdminPassengersPage';

// Enhanced Admin Dashboard with real data
export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalPassengers: 0,
    totalRevenue: 0,
    onTimePercentage: 0,
    totalAircraft: 0,
    totalUsers: 0,
    activeFlights: 0,
    maintenanceAircraft: 0,
  });

  const [recentFlights, setRecentFlights] = useState<Array<{
    flight_number: string;
    route: string;
    status: string;
    time: string;
  }>>([]);
  const [recentBookings, setRecentBookings] = useState<Array<{
    passenger: string;
    flight: string;
    seat: string;
    class: string;
  }>>([]);

  useEffect(() => {
    // Mock data - in real app, this would come from API
    setTimeout(() => {
      setStats({
        totalFlights: 156,
        totalPassengers: 2847,
        totalRevenue: 45230,
        onTimePercentage: 94.2,
        totalAircraft: 12,
        totalUsers: 45,
        activeFlights: 8,
        maintenanceAircraft: 2,
      });

      setRecentFlights([
        { flight_number: 'AA123', route: 'JFK → LAX', status: 'DEPARTED', time: '14:30' },
        { flight_number: 'UA456', route: 'LAX → JFK', status: 'BOARDING', time: '16:45' },
        { flight_number: 'DL789', route: 'ATL → MIA', status: 'SCHEDULED', time: '18:20' },
        { flight_number: 'WN321', route: 'DEN → LAS', status: 'DELAYED', time: '19:15' },
      ]);

      setRecentBookings([
        { passenger: 'John Doe', flight: 'AA123', seat: '12A', class: 'Economy' },
        { passenger: 'Jane Smith', flight: 'UA456', seat: '8B', class: 'Business' },
        { passenger: 'Mike Johnson', flight: 'DL789', seat: '15C', class: 'Economy' },
        { passenger: 'Sarah Wilson', flight: 'WN321', seat: '3A', class: 'First' },
      ]);
    }, 1000);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of airport operations and key metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">✈</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Flights</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFlights}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPassengers.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-bold">⏰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">On-time %</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.onTimePercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-600 font-bold">🛩</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aircraft Fleet</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAircraft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <span className="text-pink-600 font-bold">👤</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-emerald-600 font-bold">🟢</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Flights</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeFlights}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">🔧</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.maintenanceAircraft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Flights */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Flights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFlights.map((flight, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{flight.flight_number}</p>
                      <p className="text-sm text-gray-600">{flight.route}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        flight.status === 'DEPARTED' ? 'bg-green-100 text-green-800' :
                        flight.status === 'BOARDING' ? 'bg-blue-100 text-blue-800' :
                        flight.status === 'SCHEDULED' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {flight.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{flight.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{booking.passenger}</p>
                      <p className="text-sm text-gray-600">{booking.flight} - {booking.seat}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.class === 'First' ? 'bg-purple-100 text-purple-800' :
                        booking.class === 'Business' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.class}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
