import React from 'react';
import { Card, CardContent, Button, StatusBadge, LoadingSpinner } from '../components/ui';
import { Plane, Clock, Users, DollarSign, ArrowRight, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import type { Flight } from '../types';

interface FlightSearchResultsProps {
  flights: Flight[];
  loading?: boolean;
  onSelectFlight: (flight: Flight) => void;
  onBookFlight: (flight: Flight) => void;
  className?: string;
}

export const FlightSearchResults: React.FC<FlightSearchResultsProps> = ({
  flights,
  loading = false,
  onSelectFlight,
  onBookFlight,
  className,
}) => {
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

  if (loading) {
    return (
      <div className={clsx('flex justify-center py-8', className)}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or dates to find available flights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {flights.length} flight{flights.length !== 1 ? 's' : ''} found
        </h2>
        <div className="text-sm text-gray-600">
          Prices shown are per person
        </div>
      </div>

      {flights.map((flight) => (
        <Card key={flight.flight_id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Flight Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-6">
                  {/* Departure */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {flight.departure_airport?.iata_code}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(flight.scheduled_departure)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(flight.scheduled_departure)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {flight.departure_airport?.city}
                    </div>
                  </div>

                  {/* Flight Path */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-2">
                      <Plane className="h-5 w-5 text-blue-600" />
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {getDuration(flight.scheduled_departure, flight.scheduled_arrival)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {flight.flight_number}
                    </div>
                  </div>

                  {/* Arrival */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {flight.arrival_airport?.iata_code}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(flight.scheduled_arrival)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(flight.scheduled_arrival)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {flight.arrival_airport?.city}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Plane className="h-4 w-4 mr-1" />
                    {flight.aircraft?.model_name}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {flight.available_seats} seats available
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {flight.gate?.gate_number ? `Gate ${flight.gate.gate_number}` : 'Gate TBD'}
                  </div>
                </div>
              </div>

              {/* Price and Actions */}
              <div className="flex flex-col items-end space-y-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${typeof flight.price === 'number' ? flight.price.toFixed(2) : Number(flight.price).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">per person</div>
                </div>

                <div className="flex items-center space-x-2">
                  <StatusBadge status={flight.status} />
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectFlight(flight)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onBookFlight(flight)}
                    disabled={flight.status !== 'scheduled' || flight.available_seats === 0}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
