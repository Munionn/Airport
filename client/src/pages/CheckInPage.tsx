import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, LoadingSpinner } from '../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Notification';
import { Search, CheckCircle, Plane, Calendar, Clock, MapPin, User } from 'lucide-react';
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
    gate?: {
      gate_number: string;
      terminal: string;
    };
  };
}

export const CheckInPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkingIn, setCheckingIn] = useState<number | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      // Mock tickets data - in real app, this would call ticketsApi
      const mockTickets: Ticket[] = [
        {
          ticket_id: 1,
          flight_id: 1,
          passenger_id: user?.user_id || 1,
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
            gate: {
              gate_number: 'A12',
              terminal: 'Terminal A',
            },
          },
        },
        {
          ticket_id: 2,
          flight_id: 2,
          passenger_id: user?.user_id || 1,
          seat_number: '8B',
          ticket_class: 'business',
          status: 'checked_in',
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
            status: 'boarding',
            gate: {
              gate_number: 'B8',
              terminal: 'Terminal B',
            },
          },
        },
      ];
      
      setTickets(mockTickets);
    } catch (err: any) {
      error('Failed to load tickets', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (ticketId: number) => {
    setCheckingIn(ticketId);
    try {
      // In real app, this would call checkInApi
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setTickets(prev => prev.map(ticket => 
        ticket.ticket_id === ticketId 
          ? { ...ticket, status: 'checked_in' }
          : ticket
      ));
      
      success('Check-in successful', 'You have been checked in for your flight');
    } catch (err: any) {
      error('Check-in failed', err.message);
    } finally {
      setCheckingIn(null);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (!searchTerm) return true;
    return ticket.flight.flight_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ticket.flight.departure_airport.iata_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ticket.flight.arrival_airport.iata_code.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

  const canCheckIn = (ticket: Ticket) => {
    const departureTime = new Date(ticket.flight.scheduled_departure);
    const now = new Date();
    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return ticket.status === 'active' && 
           ticket.flight.status === 'scheduled' && 
           hoursUntilDeparture >= 2 && 
           hoursUntilDeparture <= 24;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Check-In</h1>
        <p className="text-gray-600 mt-2">
          Check in for your upcoming flights
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search flights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No flights match your search criteria.' : 'You have no upcoming flights to check in for.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.ticket_id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-6">
                      {/* Flight Info */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {ticket.flight.flight_number}
                        </div>
                        <div className="text-sm text-gray-600">
                          {ticket.flight.departure_airport.iata_code} → {ticket.flight.arrival_airport.iata_code}
                        </div>
                      </div>

                      {/* Schedule */}
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatTime(ticket.flight.scheduled_departure)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(ticket.flight.scheduled_departure)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getDuration(ticket.flight.scheduled_departure, ticket.flight.scheduled_arrival)}
                        </div>
                      </div>

                      {/* Seat & Gate */}
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          Seat {ticket.seat_number}
                        </div>
                        <div className="text-sm text-gray-600">
                          {ticket.ticket_class.charAt(0).toUpperCase() + ticket.ticket_class.slice(1)}
                        </div>
                        {ticket.flight.gate && (
                          <div className="text-xs text-gray-500">
                            Gate {ticket.flight.gate.gate_number}
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="text-center">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          ticket.status === 'checked_in' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.status === 'checked_in' ? 'Checked In' : 'Not Checked In'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {ticket.flight.status.charAt(0).toUpperCase() + ticket.flight.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {canCheckIn(ticket) ? (
                      <Button
                        onClick={() => handleCheckIn(ticket.ticket_id)}
                        disabled={checkingIn === ticket.ticket_id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {checkingIn === ticket.ticket_id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Checking In...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Check In
                          </>
                        )}
                      </Button>
                    ) : ticket.status === 'checked_in' ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Checked In</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {new Date(ticket.flight.scheduled_departure) < new Date() 
                          ? 'Flight departed'
                          : 'Check-in not available yet'
                        }
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Check-in Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Check-in Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Check-in Times</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Online check-in: 24 hours before departure</li>
                <li>• Airport check-in: 2 hours before departure</li>
                <li>• International flights: 3 hours before departure</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What You Need</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Valid passport or ID</li>
                <li>• Booking confirmation</li>
                <li>• Mobile device for boarding pass</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
