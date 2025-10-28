import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, StatusBadge, LoadingSpinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { ticketsApi } from '../api/ticketsApi';
import { Plane, Calendar, Clock, MapPin, Download, Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { Ticket } from '../types';

// Helper function to safely format price
const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'number' ? price : parseFloat(price || '0');
  return numPrice.toFixed(2);
};


export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = useCallback(async (isRefresh = false) => {
    if (!user) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('🔄 Loading tickets for user:', user.user_id);
      
      // Try to get tickets by passenger ID first
      const response = await ticketsApi.getByPassengerId(user.user_id, 1, 50);
      console.log('✅ Tickets loaded:', response.data);
      
      // Handle both direct array and paginated response
      const ticketsData = response.data.data || response.data;
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      
    } catch (err: unknown) {
      console.error('❌ Failed to load tickets:', err);
      
      // Show error message to user
      if (err instanceof Error) {
        console.error('Error details:', err.message);
      }
      
      // Don't try fallback since it won't work correctly
      // The backend API should handle the user_id to passenger_id mapping
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadTickets();
    
    // Refresh tickets every 30 seconds to catch new bookings
    const refreshInterval = setInterval(() => loadTickets(true), 30000);
    
    return () => clearInterval(refreshInterval);
  }, [user, loadTickets]);

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getDuration = (departure: string, arrival: string) => {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diffMs = arr.getTime() - dep.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleCheckIn = async (ticket: Ticket) => {
    try {
      console.log('🔄 Checking in ticket:', ticket.ticket_id);
      await ticketsApi.checkIn({
        ticket_id: ticket.ticket_id,
      });
      console.log('✅ Check-in successful');
      // Reload tickets to show updated status
      window.location.reload();
    } catch (err: unknown) {
      console.error('❌ Check-in failed:', err);
    }
  };

  const handleDownloadTicket = (ticket: Ticket) => {
    // Generate a simple text-based ticket for download
    const ticketContent = `
AIRPORT MANAGEMENT SYSTEM
========================

Ticket Number: ${ticket.ticket_number}
Flight: ${ticket.flight_number || 'N/A'}
Route: ${ticket.departure_airport || 'N/A'} → ${ticket.arrival_airport || 'N/A'}
Date: ${ticket.scheduled_departure ? formatDate(ticket.scheduled_departure) : 'N/A'}
Time: ${ticket.scheduled_departure ? formatTime(ticket.scheduled_departure) : 'N/A'}
Seat: ${ticket.seat_number}
Class: ${ticket.class}
Price: $${formatPrice(ticket.price)}
Status: ${ticket.status}

Passenger: ${user?.first_name} ${user?.last_name}
Email: ${user?.email}

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

  const handleViewDetails = (ticket: Ticket) => {
    // Navigate to ticket details page
    navigate(`/user/ticket/${ticket.ticket_id}`);
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
            <p className="text-gray-600 mt-2">
              Manage your flight bookings and check-in
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => loadTickets(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button onClick={() => window.location.href = '/flights'}>
              <Plane className="h-4 w-4 mr-2" />
              Book New Flight
            </Button>
          </div>
        </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-600 mb-4">
              You haven't booked any flights yet.
            </p>
            <Button onClick={() => window.location.href = '/flights'}>
              Search Flights
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.ticket_id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Flight Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-6">
                      {/* Departure */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {ticket.departure_airport || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {ticket.flight?.scheduled_departure ? formatTime(ticket.flight?.scheduled_departure) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.scheduled_departure ? formatDate(ticket.scheduled_departure) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ticket.departure_city || 'N/A'}
                        </div>
                      </div>

                      {/* Flight Path */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-2">
                          <Plane className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          {ticket.scheduled_departure && ticket.scheduled_arrival 
                            ? getDuration(ticket.scheduled_departure, ticket.scheduled_arrival)
                            : 'N/A'
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.flight_number || 'N/A'}
                        </div>
                      </div>

                      {/* Arrival */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {ticket.arrival_airport || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {ticket.scheduled_arrival ? formatTime(ticket.scheduled_arrival) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.scheduled_arrival ? formatDate(ticket.scheduled_arrival) : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ticket.arrival_city || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Seat {ticket.seat_number}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {ticket.class.charAt(0).toUpperCase() + ticket.class.slice(1)} Class
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Booked {formatDate(ticket.purchase_date)}
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col items-end space-y-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${formatPrice(ticket.price)}
                      </div>
                      <div className="text-sm text-gray-600">Total paid</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <StatusBadge status={ticket.status} />
                      {ticket.flight?.status && <StatusBadge status={ticket.flight.status} />}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(ticket)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadTicket(ticket)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {ticket.status === 'active' && ticket.flight?.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(ticket)}
                        >
                          Check In
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};