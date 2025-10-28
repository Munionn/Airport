import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, StatusBadge, LoadingSpinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { ticketsApi } from '../api/ticketsApi';
import { 
  Plane, 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  ArrowLeft, 
  User, 
  CreditCard,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  QrCode
} from 'lucide-react';
import { format } from 'date-fns';
import type { Ticket } from '../types';

export const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) {
        setError('Ticket ID not provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading ticket details for ID:', ticketId);
        
        // Get ticket by ID
        const response = await ticketsApi.getById(parseInt(ticketId));
        console.log('✅ Ticket found:', response.data);
        setTicket(response.data);
        
      } catch (err: unknown) {
        console.error('❌ Failed to load ticket:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ticket details');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getDuration = (departure: string, arrival: string) => {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diffMs = arr.getTime() - dep.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price || '0');
    return numPrice.toFixed(2);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadTicket = () => {
    if (!ticket) return;
    
    const ticketContent = `
AIRPORT MANAGEMENT SYSTEM
========================

TICKET DETAILS
--------------
Ticket Number: ${ticket.ticket_number}
Flight: ${ticket.flight_number || 'N/A'}
Route: ${ticket.departure_airport || 'N/A'} → ${ticket.arrival_airport || 'N/A'}
Date: ${(ticket.scheduled_departure || (ticket as any).departure_time) ? formatDate(ticket.scheduled_departure || (ticket as any).departure_time) : 'N/A'}
Time: ${(ticket.scheduled_departure || (ticket as any).departure_time) ? formatTime(ticket.scheduled_departure || (ticket as any).departure_time) : 'N/A'}
Duration: ${(ticket.scheduled_departure || (ticket as any).departure_time) && (ticket.scheduled_arrival || (ticket as any).arrival_time)
  ? getDuration(ticket.scheduled_departure || (ticket as any).departure_time, ticket.scheduled_arrival || (ticket as any).arrival_time) 
  : 'N/A'}
Seat: ${ticket.seat_number}
Class: ${ticket.class}
Price: $${formatPrice(ticket.price)}
Status: ${ticket.status}

AIRPORT DETAILS
---------------
Departure: ${ticket.departure_airport_name || 'N/A'} (${ticket.departure_airport || 'N/A'})
City: ${ticket.departure_city || 'N/A'}
Arrival: ${ticket.arrival_airport_name || 'N/A'} (${ticket.arrival_airport || 'N/A'})
City: ${ticket.arrival_city || 'N/A'}

PASSENGER DETAILS
-----------------
Name: ${user?.first_name} ${user?.last_name}
Email: ${user?.email}
Phone: ${user?.phone || 'N/A'}

BOOKING DETAILS
---------------
Purchase Date: ${ticket.purchase_date ? formatDateTime(ticket.purchase_date) : 'N/A'}
Check-in Time: ${ticket.check_in_time ? formatDateTime(ticket.check_in_time) : 'Not checked in'}

Thank you for choosing Airport Management System!
    `;
    
    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.ticket_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket Not Found</h3>
            <p className="text-gray-600 mb-4">
              {error || 'The requested ticket could not be found.'}
            </p>
            <Button onClick={() => navigate('/user/my-tickets')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/user/my-tickets')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ticket Details</h1>
              <p className="text-gray-600 mt-1">
                Ticket #{ticket.ticket_number}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <StatusBadge 
              status={ticket.status} 
              className={getStatusColor(ticket.status)}
            >
              {ticket.status}
            </StatusBadge>
            <Button onClick={handleDownloadTicket}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticket Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plane className="h-5 w-5 mr-2" />
                  Flight Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Flight Number</label>
                    <p className="text-lg font-semibold">{ticket.flight_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ticket Class</label>
                    <p className="text-lg font-semibold capitalize">{ticket.class}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Seat Number</label>
                    <p className="text-lg font-semibold">{ticket.seat_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Price</label>
                    <p className="text-lg font-semibold text-green-600">${formatPrice(ticket.price)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Departure */}
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {ticket.departure_airport || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {(ticket.scheduled_departure || (ticket as any).departure_time) ? formatTime(ticket.scheduled_departure || (ticket as any).departure_time) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(ticket.scheduled_departure || (ticket as any).departure_time) ? formatDate(ticket.scheduled_departure || (ticket as any).departure_time) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {ticket.departure_city || 'N/A'}
                      </div>
                    </div>

                    {/* Flight Path */}
                    <div className="flex flex-col items-center flex-1">
                      <div className="flex items-center space-x-2">
                        <Plane className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        {(ticket.scheduled_departure || (ticket as any).departure_time) && (ticket.scheduled_arrival || (ticket as any).arrival_time)
                          ? getDuration(ticket.scheduled_departure || (ticket as any).departure_time, ticket.scheduled_arrival || (ticket as any).arrival_time)
                          : 'N/A'
                        }
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {ticket.arrival_airport || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {(ticket.scheduled_arrival || (ticket as any).arrival_time) ? formatTime(ticket.scheduled_arrival || (ticket as any).arrival_time) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(ticket.scheduled_arrival || (ticket as any).arrival_time) ? formatDate(ticket.scheduled_arrival || (ticket as any).arrival_time) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {ticket.arrival_city || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Airport Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Departure Airport</label>
                      <p className="font-medium">{ticket.departure_airport_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Arrival Airport</label>
                      <p className="font-medium">{ticket.arrival_airport_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                    <p className="font-medium">
                      {ticket.purchase_date ? formatDateTime(ticket.purchase_date) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Check-in Time</label>
                    <p className="font-medium">
                      {ticket.check_in_time ? formatDateTime(ticket.check_in_time) : 'Not checked in'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ticket Status</label>
                    <div className="flex items-center mt-1">
                      <StatusBadge 
                        status={ticket.status} 
                        className={getStatusColor(ticket.status)}
                      >
                        {ticket.status}
                      </StatusBadge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Flight Status</label>
                    <p className="font-medium capitalize">{ticket.flight_status || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Passenger Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Passenger Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {user?.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {user?.phone || 'Not provided'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleDownloadTicket}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Ticket
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/user/my-tickets')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to My Tickets
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/flights')}
                  className="w-full"
                >
                  <Plane className="h-4 w-4 mr-2" />
                  Book Another Flight
                </Button>
              </CardContent>
            </Card>

            {/* Ticket QR Code Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Boarding Pass
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-gray-100 p-8 rounded-lg">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    QR Code for {ticket.ticket_number}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Show this at the gate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
