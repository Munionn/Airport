import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, StatusBadge, LoadingSpinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Notification';
import { Plane, Calendar, Clock, MapPin, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Ticket {
  ticket_id: number;
  flight_id: number;
  passenger_id: number;
  seat_number: string;
  ticket_class: string;
  status: string;
  price: number;
  booking_date: string;
  flight: {
    flight_number: string;
    scheduled_departure: string;
    scheduled_arrival: string;
    departure_airport: {
      iata_code: string;
      city: string;
    };
    arrival_airport: {
      iata_code: string;
      city: string;
    };
    status: string;
  };
}

export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Mock tickets data - in real app, this would call ticketsApi
        const mockTickets: Ticket[] = [
          {
            ticket_id: 1,
            flight_id: 1,
            passenger_id: user.user_id,
            seat_number: '12A',
            ticket_class: 'economy',
            status: 'active',
            price: 299.99,
            booking_date: '2024-01-15',
            flight: {
              flight_number: 'AA123',
              scheduled_departure: '2024-02-15T08:00:00Z',
              scheduled_arrival: '2024-02-15T11:30:00Z',
              departure_airport: {
                iata_code: 'JFK',
                city: 'New York',
              },
              arrival_airport: {
                iata_code: 'LAX',
                city: 'Los Angeles',
              },
              status: 'scheduled',
            },
          },
          {
            ticket_id: 2,
            flight_id: 2,
            passenger_id: user.user_id,
            seat_number: '8B',
            ticket_class: 'business',
            status: 'used',
            price: 899.99,
            booking_date: '2024-01-10',
            flight: {
              flight_number: 'UA456',
              scheduled_departure: '2024-01-20T14:00:00Z',
              scheduled_arrival: '2024-01-20T17:45:00Z',
              departure_airport: {
                iata_code: 'LAX',
                city: 'Los Angeles',
              },
              arrival_airport: {
                iata_code: 'JFK',
                city: 'New York',
              },
              status: 'arrived',
            },
          },
        ];
        
        setTickets(mockTickets);
      } catch (err: unknown) {
        error('Failed to load tickets', err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [user, error]);

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

  const handleCheckIn = (ticket: Ticket) => {
    // In real app, this would call check-in API
    console.log('Check-in for ticket:', ticket.ticket_id);
  };

  const handleDownloadTicket = (ticket: Ticket) => {
    // In real app, this would generate and download PDF
    console.log('Download ticket:', ticket.ticket_id);
  };

  const handleViewDetails = (ticket: Ticket) => {
    // Navigate to ticket details or show modal
    console.log('View details for ticket:', ticket.ticket_id);
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
          <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-600 mt-2">
            Manage your flight bookings and check-in
          </p>
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
                          {ticket.flight.departure_airport.iata_code}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(ticket.flight.scheduled_departure)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(ticket.flight.scheduled_departure)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ticket.flight.departure_airport.city}
                        </div>
                      </div>

                      {/* Flight Path */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center space-x-2">
                          <Plane className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                          {getDuration(ticket.flight.scheduled_departure, ticket.flight.scheduled_arrival)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ticket.flight.flight_number}
                        </div>
                      </div>

                      {/* Arrival */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {ticket.flight.arrival_airport.iata_code}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(ticket.flight.scheduled_arrival)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(ticket.flight.scheduled_arrival)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ticket.flight.arrival_airport.city}
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
                        {ticket.ticket_class.charAt(0).toUpperCase() + ticket.ticket_class.slice(1)} Class
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Booked {formatDate(ticket.booking_date)}
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col items-end space-y-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ${ticket.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Total paid</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <StatusBadge status={ticket.status} />
                      <StatusBadge status={ticket.flight.status} />
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
                      {ticket.status === 'active' && ticket.flight.status === 'scheduled' && (
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