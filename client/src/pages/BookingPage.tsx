import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MultiStepForm } from '../components/MultiStepForm';
import { SeatMap } from '../components/SeatMap';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../components/ui';
import { flightsApi, ticketsApi } from '../api';
import { useToast } from '../components/ui/Notification';
import { useAuth } from '../hooks/useAuth';
import { User, CheckCircle, Plane } from 'lucide-react';
import type { Flight, TicketClass } from '../types';

interface PassengerInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  passport_number: string;
  date_of_birth: string;
}

interface BookingData extends Record<string, unknown> {
  passengers: PassengerInfo[];
  selectedSeats: string[];
  ticketClass: string;
}

interface StepProps {
  onNext?: (data: Record<string, unknown>) => void;
}

export const BookingPage: React.FC = () => {
  const { flightId } = useParams<{ flightId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [ticketClass, setTicketClass] = useState('economy');
  const [passengers, setPassengers] = useState<PassengerInfo[]>(
    Array(1).fill(null).map(() => ({
      first_name: '',
      last_name: '',
      passport_number: '',
      nationality: '',
      date_of_birth: '',
      phone: '',
      email: '',
    }))
  );

  useEffect(() => {
    const loadFlight = async () => {
      if (!flightId) return;
      
      setLoading(true);
      try {
        console.log('🔄 Loading flight with ID:', flightId);
        const response = await flightsApi.getById(parseInt(flightId));
        console.log('✅ Flight loaded:', response.data);
        setFlight(response.data);
      } catch (err: unknown) {
        console.error('❌ Failed to load flight:', err);
        navigate('/flights');
      } finally {
        setLoading(false);
      }
    };

    loadFlight();
  }, [flightId, navigate]);

  const handleSeatSelect = (seatNumber: string) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber);
      } else if (prev.length < passengerCount) {
        return [...prev, seatNumber];
      }
      return prev;
    });
  };

  const handlePassengerCountChange = (count: number) => {
    setPassengerCount(count);
    // Update passengers array to match the new count
    setPassengers(prev => {
      const newPassengers = Array(count).fill(null).map((_, index) => {
        if (prev[index]) {
          return prev[index];
        }
        return {
          first_name: '',
          last_name: '',
          passport_number: '',
          nationality: '',
          date_of_birth: '',
          phone: '',
          email: '',
        };
      });
      return newPassengers;
    });
    // Clear selected seats when passenger count changes
    setSelectedSeats([]);
  };

  const PassengerCountStep = ({ onNext }: StepProps) => {
    const handleNext = () => {
      if (onNext) {
        onNext({ passengerCount });
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How many passengers?</h2>
          <p className="text-gray-600">
            Select the number of passengers for this booking
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-md mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
            <button
              key={count}
              onClick={() => handlePassengerCountChange(count)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                passengerCount === count
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-gray-600">
                {count === 1 ? 'Passenger' : 'Passengers'}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Selected: <span className="font-semibold">{passengerCount} {passengerCount === 1 ? 'passenger' : 'passengers'}</span>
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleNext} disabled={passengerCount < 1}>
            Continue to Passenger Details
          </Button>
        </div>
      </div>
    );
  };

  const PassengerInfoStep = ({ onNext }: StepProps) => {

    const handlePassengerChange = (index: number, field: keyof PassengerInfo, value: string) => {
      setPassengers(prev => prev.map((passenger, i) => 
        i === index ? { ...passenger, [field]: value } : passenger
      ));
    };

    const handleNext = () => {
      if (onNext) {
        onNext({ passengers });
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>Passenger Information ({passengerCount} passenger{passengerCount > 1 ? 's' : ''})</span>
        </div>

        {passengers.map((passenger, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">
                Passenger {index + 1}
                {index === 0 && <span className="text-sm font-normal text-gray-600 ml-2">(Primary)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={passenger.first_name}
                  onChange={(e) => handlePassengerChange(index, 'first_name', e.target.value)}
                  required
                />
                <Input
                  label="Last Name"
                  value={passenger.last_name}
                  onChange={(e) => handlePassengerChange(index, 'last_name', e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={passenger.email}
                  onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                  required
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={passenger.phone}
                  onChange={(e) => handlePassengerChange(index, 'phone', e.target.value)}
                  required
                />
                <Input
                  label="Passport Number"
                  value={passenger.passport_number}
                  onChange={(e) => handlePassengerChange(index, 'passport_number', e.target.value)}
                  required
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={passenger.date_of_birth}
                  onChange={(e) => handlePassengerChange(index, 'date_of_birth', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button onClick={handleNext} disabled={passengers.some(p => !p.first_name || !p.last_name)}>
            Continue to Seat Selection
          </Button>
        </div>
      </div>
    );
  };

  const SeatSelectionStep = ({ onNext }: StepProps) => {
    const handleNext = () => {
      if (selectedSeats.length === passengerCount && onNext) {
        onNext({ selectedSeats, ticketClass });
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Plane className="h-4 w-4" />
            <span>Seat Selection</span>
          </div>
          <div className="text-sm text-gray-600">
            Selected: {selectedSeats.length} / {passengerCount} seats
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {flight && (
              <SeatMap
                flight={flight}
                selectedSeats={selectedSeats}
                onSeatSelect={handleSeatSelect}
                passengerCount={passengerCount}
              />
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Class</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={ticketClass}
                  onChange={(e) => setTicketClass(e.target.value)}
                  className="input w-full"
                >
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </CardContent>
            </Card>

            {/* Seat Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seat Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {passengers.map((passenger, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">
                        {passenger.first_name} {passenger.last_name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        (Passenger {index + 1})
                      </span>
                    </div>
                    <div className="text-sm font-semibold">
                      {selectedSeats[index] || 'Not selected'}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Passengers:</span>
                  <span>{passengerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Class:</span>
                  <span className="capitalize">{ticketClass}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seats:</span>
                  <span>{selectedSeats.join(', ') || 'Not selected'}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>
                      ${flight ? (typeof flight.price === 'number' ? flight.price : Number(flight.price)) * passengerCount : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleNext} 
            disabled={selectedSeats.length !== passengerCount}
          >
            Continue to Confirmation
          </Button>
        </div>
      </div>
    );
  };


  const ConfirmationStep = ({ onNext }: StepProps) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirmBooking = async () => {
      console.log('🎯 ConfirmationStep: handleConfirmBooking called');
      setIsProcessing(true);
      try {
        // Create booking data with all collected information
        const bookingData: BookingData = {
          passengers,
          selectedSeats,
          ticketClass: ticketClass as TicketClass,
        };
        
        console.log('🎯 ConfirmationStep: calling onNext with booking data:', bookingData);
        
        // Call the booking completion directly
        await handleBookingComplete(bookingData);
        
        // Then move to the next step (success)
        if (onNext) {
          await onNext({});
        }
      } catch (error) {
        console.error('❌ ConfirmationStep: Booking confirmation failed:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <div className="text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Booking</h2>
          <p className="text-gray-600">
            Please review your booking details and confirm to complete your reservation.
          </p>
        </div>
        
        {/* Booking Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Flight:</span>
                <span>{flight?.flight_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Route:</span>
                <span>{flight?.departure_airport?.iata_code} → {flight?.arrival_airport?.iata_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Passengers:</span>
                <span>{passengerCount}</span>
              </div>
              {/* Passenger Details */}
              {passengers.map((passenger, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Passenger {index + 1}
                  </div>
                  <div className="text-sm text-gray-600">
                    {passenger.first_name} {passenger.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Seat: {selectedSeats[index] || 'Not selected'}
                  </div>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="font-medium">Seats:</span>
                <span>{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Class:</span>
                <span className="capitalize">{ticketClass}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Price:</span>
                  <span>
                    ${flight ? (typeof flight.price === 'number' ? flight.price : Number(flight.price)) * passengerCount : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button 
            onClick={handleConfirmBooking}
            disabled={isProcessing}
            className="px-8"
          >
            {isProcessing ? 'Processing...' : 'Confirm Booking'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/flights')}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const handleBookingComplete = async (data: BookingData) => {
    console.log('🎯 handleBookingComplete called with data:', data);
    
    if (!flight || !user) {
      console.log('❌ Missing flight or user:', { flight: !!flight, user: !!user });
      return;
    }
    
    try {
      console.log('🔄 Creating ticket for booking:', data);
      
      // Create ticket for each passenger
      const ticketPromises = data.passengers.map(async (_, index) => {
        const ticketData = {
          flight_id: flight.flight_id,
          passenger_id: user.user_id, // This will be used to find/create passenger record
          seat_number: data.selectedSeats[index] || `${index + 1}A`, // Correct format: number + letter
          class: data.ticketClass as TicketClass,
          price: flight.price,
        };
        
        console.log('🔄 Creating ticket:', ticketData);
        return await ticketsApi.simpleCreate(ticketData); // Use working simple endpoint
      });
      
      const tickets = await Promise.all(ticketPromises);
      console.log('✅ Tickets created:', tickets);
      
      success('Booking successful!', `Your flight has been booked successfully. ${tickets.length} ticket(s) created.`);
      
      // Don't navigate immediately - let the success step handle navigation
      // The MultiStepForm will automatically move to the next step (success)
    } catch (err: unknown) {
      console.error('❌ Booking failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tickets';
      error('Booking failed', errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading flight details...</p>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Flight not found</p>
        <Button onClick={() => navigate('/flights')} className="mt-4">
          Back to Search
        </Button>
      </div>
    );
  }

  const SuccessStep = () => {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600">
            Your flight has been successfully booked. You will receive a confirmation email shortly.
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => navigate('/user/my-tickets')}>
            View My Tickets
          </Button>
          <Button variant="outline" onClick={() => navigate('/flights')}>
            Search More Flights
          </Button>
        </div>
      </div>
    );
  };

  const steps = [
    {
      id: 'passenger-count',
      title: 'Passenger Count',
      description: 'Select number of passengers',
      component: <PassengerCountStep />,
    },
    {
      id: 'passengers',
      title: 'Passenger Info',
      description: 'Enter passenger details',
      component: <PassengerInfoStep />,
    },
    {
      id: 'seats',
      title: 'Seat Selection',
      description: 'Choose your seats',
      component: <SeatSelectionStep />,
    },
    {
      id: 'confirmation',
      title: 'Confirmation',
      description: 'Review and confirm',
      component: <ConfirmationStep />,
    },
    {
      id: 'success',
      title: 'Success',
      description: 'Booking completed',
      component: <SuccessStep />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book Your Flight</h1>
          <p className="mt-2 text-gray-600">
            Flight {flight.flight_number} • {flight.departure_airport?.iata_code} → {flight.arrival_airport?.iata_code}
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onComplete={handleBookingComplete}
          onCancel={() => navigate('/flights')}
        />
      </div>
    </div>
  );
};