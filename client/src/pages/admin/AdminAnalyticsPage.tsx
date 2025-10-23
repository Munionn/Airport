import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, LoadingSpinner } from '../../components/ui';
import { useToast } from '../../components/ui/Notification';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Plane, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

interface DashboardStats {
  total_flights: number;
  total_passengers: number;
  total_revenue: number;
  flights_today: number;
  on_time_percentage: number;
  load_factor: number;
}

interface FlightAnalytics {
  flights_by_status: Array<{ status: string; count: number }>;
  flights_by_route: Array<{ route: string; count: number }>;
  revenue_by_month: Array<{ month: string; revenue: number }>;
  passenger_trends: Array<{ date: string; passengers: number }>;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export const AdminAnalyticsPage: React.FC = () => {
  const { error } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<FlightAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Mock data since we don't have real analytics API yet
      const mockStats: DashboardStats = {
        total_flights: 1247,
        total_passengers: 15689,
        total_revenue: 2345678.90,
        flights_today: 23,
        on_time_percentage: 87.5,
        load_factor: 78.3,
      };

      const mockAnalytics: FlightAnalytics = {
        flights_by_status: [
          { status: 'Scheduled', count: 45 },
          { status: 'Boarding', count: 12 },
          { status: 'Departed', count: 8 },
          { status: 'Arrived', count: 23 },
          { status: 'Delayed', count: 3 },
          { status: 'Cancelled', count: 1 },
        ],
        flights_by_route: [
          { route: 'JFK → LAX', count: 156 },
          { route: 'LAX → JFK', count: 142 },
          { route: 'JFK → LHR', count: 98 },
          { route: 'LHR → JFK', count: 95 },
          { route: 'JFK → CDG', count: 87 },
          { route: 'CDG → JFK', count: 82 },
        ],
        revenue_by_month: [
          { month: 'Jan', revenue: 234567 },
          { month: 'Feb', revenue: 245678 },
          { month: 'Mar', revenue: 256789 },
          { month: 'Apr', revenue: 267890 },
          { month: 'May', revenue: 278901 },
          { month: 'Jun', revenue: 289012 },
        ],
        passenger_trends: [
          { date: '2024-01-01', passengers: 1234 },
          { date: '2024-01-02', passengers: 1456 },
          { date: '2024-01-03', passengers: 1678 },
          { date: '2024-01-04', passengers: 1890 },
          { date: '2024-01-05', passengers: 2012 },
          { date: '2024-01-06', passengers: 2234 },
          { date: '2024-01-07', passengers: 2456 },
        ],
      };

      setStats(mockStats);
      setAnalytics(mockAnalytics);
    } catch (err: any) {
      error('Failed to load analytics', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Key performance indicators and flight analytics
          </p>
        </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plane className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Flights</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.total_flights)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.total_passengers)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Flights Today</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.flights_today}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On-Time Performance</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.on_time_percentage}%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${stats.on_time_percentage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Load Factor</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.load_factor}%</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${stats.load_factor}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Flights by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2" />
                Flights by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.flights_by_status}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }) => `${status} ${(Number(percent) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.flights_by_status.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Month */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Revenue by Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.revenue_by_month}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Passenger Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Passenger Trends (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.passenger_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value as number)} />
                  <Area 
                    type="monotone" 
                    dataKey="passengers" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Routes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plane className="h-5 w-5 mr-2" />
                Top Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.flights_by_route} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="route" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};