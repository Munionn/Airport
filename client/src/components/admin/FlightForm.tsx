import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, TimePicker } from "../ui";
import { useToast } from "../ui/Notification";
import { flightsApi } from '../../api';
import { X, Save, Plane } from 'lucide-react';
import type { Flight, CreateFlightDto, UpdateFlightDto } from '../../types';

interface FlightFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flight: Flight) => void;
  flight?: Flight | null;
  mode: 'create' | 'edit';
}

export const FlightForm: React.FC<FlightFormProps> = ({
  isOpen,
  onClose,
  onSave,
  flight,
  mode,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateFlightDto | UpdateFlightDto>({
    flight_number: '',
    aircraft_id: 0,
    route_id: 0,
    scheduled_departure: '',
    scheduled_arrival: '',
    price: 0,
  });

  // Mock data for dropdowns
  const aircraftOptions = [
    { value: 1, label: 'Boeing 737-800 (N123AB)' },
    { value: 2, label: 'Airbus A320 (N456CD)' },
    { value: 3, label: 'Boeing 777-300ER (N789EF)' },
  ];

  const routeOptions = [
    { value: 1, label: 'JFK → LAX (New York to Los Angeles)' },
    { value: 2, label: 'LAX → JFK (Los Angeles to New York)' },
    { value: 3, label: 'JFK → LHR (New York to London)' },
    { value: 4, label: 'LHR → JFK (London to New York)' },
  ];

  useEffect(() => {
    if (flight && mode === 'edit') {
      setFormData({
        flight_number: flight.flight_number,
        aircraft_id: flight.aircraft_id,
        route_id: flight.route_id,
        scheduled_departure: flight.scheduled_departure,
        scheduled_arrival: flight.scheduled_arrival,
        price: typeof flight.price === 'number' ? flight.price : Number(flight.price),
      });
    } else {
      setFormData({
        flight_number: '',
        aircraft_id: 0,
        route_id: 0,
        scheduled_departure: '',
        scheduled_arrival: '',
        price: 0,
      });
    }
  }, [flight, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (mode === 'create') {
        response = await flightsApi.create(formData as CreateFlightDto);
      } else {
        response = await flightsApi.update(flight!.flight_id, formData as UpdateFlightDto);
      }

      success(
        `Flight ${mode === 'create' ? 'created' : 'updated'} successfully`,
        `Flight ${formData.flight_number} has been ${mode === 'create' ? 'created' : 'updated'}`
      );
      
      onSave(response.data);
      onClose();
    } catch (err: any) {
      error(
        `Failed to ${mode} flight`,
        err.message || `Failed to ${mode} flight`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return '';
    return `${date}T${time}:00.000Z`;
  };

  const parseDateTime = (dateTime: string) => {
    if (!dateTime) return { date: '', time: '' };
    const date = new Date(dateTime);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().split(' ')[0].substring(0, 5),
    };
  };

  const departureDateTime = parseDateTime(formData.scheduled_departure);
  const arrivalDateTime = parseDateTime(formData.scheduled_arrival);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Plane className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Create New Flight' : 'Edit Flight'}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flight Number *
              </label>
              <Input
                value={formData.flight_number}
                onChange={(e) => handleChange('flight_number', e.target.value)}
                placeholder="AA123"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                placeholder="299.99"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aircraft *
              </label>
              <select
                value={formData.aircraft_id}
                onChange={(e) => handleChange('aircraft_id', parseInt(e.target.value))}
                className="input w-full"
                required
              >
                <option value={0}>Select Aircraft</option>
                {aircraftOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route *
              </label>
              <select
                value={formData.route_id}
                onChange={(e) => handleChange('route_id', parseInt(e.target.value))}
                className="input w-full"
                required
              >
                <option value={0}>Select Route</option>
                {routeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date *
              </label>
              <DatePicker
                value={departureDateTime.date}
                onChange={(value) => {
                  const newDateTime = formatDateTime(value, departureDateTime.time);
                  handleChange('scheduled_departure', newDateTime);
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Time *
              </label>
              <TimePicker
                value={departureDateTime.time}
                onChange={(value) => {
                  const newDateTime = formatDateTime(departureDateTime.date, value);
                  handleChange('scheduled_departure', newDateTime);
                }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arrival Date *
              </label>
              <DatePicker
                value={arrivalDateTime.date}
                onChange={(value) => {
                  const newDateTime = formatDateTime(value, arrivalDateTime.time);
                  handleChange('scheduled_arrival', newDateTime);
                }}
                min={departureDateTime.date}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arrival Time *
              </label>
              <TimePicker
                value={arrivalDateTime.time}
                onChange={(value) => {
                  const newDateTime = formatDateTime(arrivalDateTime.date, value);
                  handleChange('scheduled_arrival', newDateTime);
                }}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create Flight' : 'Update Flight'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
