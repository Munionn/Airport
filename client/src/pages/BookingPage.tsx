import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MultiStepForm } from '../components/MultiStepForm';
import { SeatMap } from '../components/SeatMap';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../components/ui';
import { flightsApi } from '../api';
import { useToast } from '../components/ui/Notification';
import { useAuth } from '../hooks/useAuth';
import { User, CreditCard, CheckCircle, Plane } from 'lucide-react';
import type { Flight } from '../types';

interface PassengerInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  passport_number: string;
  date_of_birth: string;
}

interface PaymentInfo {
  card_number: string;
  expiry_date: string;
  cvv: string;
  cardholder_name: string;
  billing_address: string;
}

interface BookingData {
  passengers: PassengerInfo[];
  selectedSeats: string[];
  paymentInfo: PaymentInfo;
  ticketClass: string;
}

export const BookingPage: React.FC = () => {
  const { flightId } = useParams<{ flightId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [passengerCount] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [ticketClass, setTicketClass] = useState('economy');

  useEffect(() => {
    const loadFlight = async () => {
      if (!flightId) return;
      
      setLoading(true);
      try {
        const response = await flightsApi.getById(parseInt(flightId));
        setFlight(response.data);
      } catch (err: any) {
        error('Failed to load flight', err.message);
        navigate('/flights');
      } finally {
        setLoading(false);
      }
    };

    loadFlight();
  }, [flightId, navigate, error]);

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

  const PassengerInfoStep = ({ onNext }: any) => {
    const [passengers, setPassengers] = useState<PassengerInfo[]>(
      Array(passengerCount).fill(null).map(() => ({
        first_name: '',
        last_name: '',
        email: user?.email || '',
        phone: user?.phone || '',
        passport_number: '',
        date_of_birth: '',
      }))
    );

    const handlePassengerChange = (index: number, field: keyof PassengerInfo, value: string) => {
      setPassengers(prev => prev.map((passenger, i) => 
        i === index ? { ...passenger, [field]: value } : passenger
      ));
    };

    const handleNext = () => {
      onNext({ passengers });
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

  const SeatSelectionStep = ({ onNext }: any) => {
    const handleNext = () => {
      if (selectedSeats.length === passengerCount) {
        onNext({ selectedSeats, ticketClass });
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Plane className="h-4 w-4" />
          <span>Seat Selection</span>
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
            Continue to Payment
          </Button>
        </div>
      </div>
    );
  };

  const PaymentStep = ({ onNext }: any) => {
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
      card_number: '',
      expiry_date: '',
      cvv: '',
      cardholder_name: '',
      billing_address: '',
    });

    const handlePaymentChange = (field: keyof PaymentInfo, value: string) => {
      setPaymentInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
      onNext({ paymentInfo });
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CreditCard className="h-4 w-4" />
          <span>Payment Information</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Card Number"
              value={paymentInfo.card_number}
              onChange={(e) => handlePaymentChange('card_number', e.target.value)}
              placeholder="1234 5678 9012 3456"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry Date"
                value={paymentInfo.expiry_date}
                onChange={(e) => handlePaymentChange('expiry_date', e.target.value)}
                placeholder="MM/YY"
                required
              />
              <Input
                label="CVV"
                value={paymentInfo.cvv}
                onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                placeholder="123"
                required
              />
            </div>
            <Input
              label="Cardholder Name"
              value={paymentInfo.cardholder_name}
              onChange={(e) => handlePaymentChange('cardholder_name', e.target.value)}
              required
            />
            <Input
              label="Billing Address"
              value={paymentInfo.billing_address}
              onChange={(e) => handlePaymentChange('billing_address', e.target.value)}
              required
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={handleNext}
            disabled={!paymentInfo.card_number || !paymentInfo.expiry_date || !paymentInfo.cvv}
          >
            Complete Booking
          </Button>
        </div>
      </div>
    );
  };

  const ConfirmationStep = () => {
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

  const handleBookingComplete = async (data: BookingData) => {
    try {
      // In a real app, this would call the booking API
      console.log('Booking data:', data);
      
      success('Booking successful!', 'Your flight has been booked successfully.');
      navigate('/user/my-tickets');
    } catch (err: any) {
      error('Booking failed', err.message);
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

  const steps = [
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
      id: 'payment',
      title: 'Payment',
      description: 'Enter payment details',
      component: <PaymentStep />,
    },
    {
      id: 'confirmation',
      title: 'Confirmation',
      description: 'Review and confirm',
      component: <ConfirmationStep />,
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