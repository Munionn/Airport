import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, DatePicker } from '../components/ui';
import { Search, Filter, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { SearchFlightDto } from '../types';

interface FlightSearchFiltersProps {
  onSearch: (filters: SearchFlightDto) => void;
  loading?: boolean;
  className?: string;
}

interface FilterFormData {
  departure_iata?: string;
  arrival_iata?: string;
  departure_date?: string;
  return_date?: string;
  passengers?: number;
  ticket_class?: string;
  max_price?: number;
  airlines?: string[];
}

export const FlightSearchFilters: React.FC<FlightSearchFiltersProps> = ({
  onSearch,
  loading = false,
  className,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FilterFormData>({
    defaultValues: {
      passengers: 1,
      ticket_class: 'economy',
    },
  });

  const watchedValues = watch();

  const onSubmit = (data: FilterFormData) => {
    const searchFilters: SearchFlightDto = {
      departure_iata: data.departure_iata,
      arrival_iata: data.arrival_iata,
      departure_date: data.departure_date,
      passenger_count: data.passengers || 1,
      // ticket_class: data.ticket_class, // Not in SearchFlightDto
      max_price: data.max_price,
      page: 1,
      limit: 10,
    };

    onSearch(searchFilters);
  };

  const handleClearFilters = () => {
    reset({
      passengers: 1,
      ticket_class: 'economy',
    });
    setTripType('one-way');
  };

  const swapAirports = () => {
    const departure = watchedValues.departure_iata;
    const arrival = watchedValues.arrival_iata;
    setValue('departure_iata', arrival);
    setValue('arrival_iata', departure);
  };

  return (
    <Card className={clsx('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Flights
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="h-4 w-4 mr-1" />
            {showAdvanced ? 'Hide' : 'Show'} Filters
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Trip Type */}
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="one-way"
                checked={tripType === 'one-way'}
                onChange={(e) => setTripType(e.target.value as 'one-way' | 'round-trip')}
                className="mr-2"
              />
              One-way
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="round-trip"
                checked={tripType === 'round-trip'}
                onChange={(e) => setTripType(e.target.value as 'one-way' | 'round-trip')}
                className="mr-2"
              />
              Round-trip
            </label>
          </div>

          {/* Airport Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <Input
                {...register('departure_iata', {
                  required: 'Departure airport is required',
                  pattern: {
                    value: /^[A-Z]{3}$/,
                    message: 'Please enter a valid 3-letter airport code',
                  },
                })}
                placeholder="JFK"
                className="uppercase"
                maxLength={3}
              />
              {errors.departure_iata && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.departure_iata.message}
                </p>
              )}
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={swapAirports}
                className="w-full"
              >
                <X className="h-4 w-4 rotate-90" />
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <Input
                {...register('arrival_iata', {
                  required: 'Arrival airport is required',
                  pattern: {
                    value: /^[A-Z]{3}$/,
                    message: 'Please enter a valid 3-letter airport code',
                  },
                })}
                placeholder="LAX"
                className="uppercase"
                maxLength={3}
              />
              {errors.arrival_iata && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.arrival_iata.message}
                </p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Departure Date"
              value={watchedValues.departure_date}
              onChange={(value) => setValue('departure_date', value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            {tripType === 'round-trip' && (
              <DatePicker
                label="Return Date"
                value={watchedValues.return_date}
                onChange={(value) => setValue('return_date', value)}
                min={watchedValues.departure_date || new Date().toISOString().split('T')[0]}
              />
            )}
          </div>

          {/* Passengers and Class */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passengers
              </label>
              <select
                value={watchedValues.passengers?.toString() || '1'}
                onChange={(e) => setValue('passengers', parseInt(e.target.value))}
                className="input w-full"
              >
                <option value="1">1 Passenger</option>
                <option value="2">2 Passengers</option>
                <option value="3">3 Passengers</option>
                <option value="4">4 Passengers</option>
                <option value="5">5 Passengers</option>
                <option value="6">6 Passengers</option>
                <option value="7">7 Passengers</option>
                <option value="8">8 Passengers</option>
                <option value="9">9 Passengers</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                value={watchedValues.ticket_class || 'economy'}
                onChange={(e) => setValue('ticket_class', e.target.value)}
                className="input w-full"
              >
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price ($)
                  </label>
                  <Input
                    {...register('max_price', {
                      min: { value: 0, message: 'Price must be positive' },
                    })}
                    type="number"
                    placeholder="1000"
                    min="0"
                  />
                  {errors.max_price && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.max_price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Airlines
                  </label>
                  <select
                    value=""
                    onChange={() => {}}
                    className="input w-full"
                  >
                    <option value="">All Airlines</option>
                    <option value="AA">American Airlines</option>
                    <option value="UA">United Airlines</option>
                    <option value="DL">Delta Air Lines</option>
                    <option value="SU">Aeroflot</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Searching...' : 'Search Flights'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
