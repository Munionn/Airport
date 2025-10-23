import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, StatusBadge, LoadingSpinner, ErrorMessage } from '../components/ui';
import { flightsApi } from '../api';
import { FlightStatus } from '../types';
import { 
  Plane, 
  Clock, 
  Users, 
  ArrowRight,
  Wifi,
  Coffee,
  Utensils,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';

export const FlightDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [flight, setFlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFlightDetails = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await flightsApi.getById(parseInt(id));
        setFlight(response.data);
      } catch (err: any) {
        console.error('Failed to load flight details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFlightDetails();
  }, [id]);

  const handleBookFlight = () => {
    if (flight) {
      navigate(`/user/book-flight/${flight.flight_id}`);
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM dd, yyyy');
  };

  const getDuration = (departure: string, arrival: string) => {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const diffMs = arr.getTime() - dep.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!flight) {
    return (
      <ErrorMessage 
        message="Flight not found" 
        onRetry={() => navigate('/flights')} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Flight Details</h1>
          <p className="text-gray-600 mt-1">Flight {flight.flight_number}</p>
        </div>
        <StatusBadge status={flight.status} />
      </div>

      {/* Flight Overview */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {flight.departure_airport?.iata_code}
                </div>
                <div className="text-sm text-gray-600">
                  {flight.departure_airport?.city}
                </div>
                <div className="text-xs text-gray-500">
                  {flight.departure_airport?.airport_name}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center space-x-2">
                  <Plane className="h-6 w-6 text-primary-600" />
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {getDuration(flight.scheduled_departure, flight.scheduled_arrival)}
                </div>
                <div className="text-xs text-gray-500">
                  {flight.route?.distance} km
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {flight.arrival_airport?.iata_code}
                </div>
                <div className="text-sm text-gray-600">
                  {flight.arrival_airport?.city}
                </div>
                <div className="text-xs text-gray-500">
                  {flight.arrival_airport?.airport_name}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-primary-600">
                ${typeof flight.price === 'number' ? flight.price.toFixed(2) : Number(flight.price).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">per person</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">Departure</div>
                <div className="text-sm text-gray-600">
                  {formatTime(flight.scheduled_departure)} • {formatDate(flight.scheduled_departure)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">Arrival</div>
                <div className="text-sm text-gray-600">
                  {formatTime(flight.scheduled_arrival)} • {formatDate(flight.scheduled_arrival)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-900">Available Seats</div>
                <div className="text-sm text-gray-600">
                  {flight.available_seats} of {flight.aircraft?.capacity} seats
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aircraft Information */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aircraft Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Aircraft</span>
                <span className="text-sm font-medium">{flight.aircraft?.model_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Registration</span>
                <span className="text-sm font-medium">{flight.aircraft?.registration_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Capacity</span>
                <span className="text-sm font-medium">{flight.aircraft?.capacity} passengers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Range</span>
                <span className="text-sm font-medium">{flight.aircraft?.max_range} km</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gate Information */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gate Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Terminal</span>
                <span className="text-sm font-medium">{flight.gate?.terminal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gate</span>
                <span className="text-sm font-medium">{flight.gate?.gate_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <StatusBadge status={flight.gate?.status || 'available'} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Wifi className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">Free WiFi</span>
              </div>
              <div className="flex items-center space-x-3">
                <Coffee className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">Complimentary Drinks</span>
              </div>
              <div className="flex items-center space-x-3">
                <Utensils className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">Meal Service</span>
              </div>
              <div className="flex items-center space-x-3">
                <Briefcase className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">Overhead Storage</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Section */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to Book?</h3>
              <p className="text-gray-600 mt-1">
                Secure your seat on this flight
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  ${typeof flight.price === 'number' ? flight.price.toFixed(2) : Number(flight.price).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">per person</div>
              </div>
              <Button 
                onClick={handleBookFlight}
                disabled={flight.status !== FlightStatus.SCHEDULED || flight.available_seats === 0}
                className="px-8"
              >
                Book Now
              </Button>
            </div>
          </div>
          
          {flight.status !== FlightStatus.SCHEDULED && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                This flight is no longer available for booking.
              </p>
            </div>
          )}
          
          {flight.available_seats === 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                This flight is fully booked.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
