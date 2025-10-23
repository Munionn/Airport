import React, { useState } from 'react';
import { Button, Modal } from "../ui";
import { useToast } from "../ui/Notification";
import { flightsApi } from '../../api';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { Flight, FlightStatus } from '../../types';

interface FlightStatusManagerProps {
  flight: Flight;
  onStatusUpdate: (updatedFlight: Flight) => void;
}

export const FlightStatusManager: React.FC<FlightStatusManagerProps> = ({
  flight,
  onStatusUpdate,
}) => {
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<FlightStatus>(flight.status as FlightStatus);
  const [delayReason, setDelayReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled', icon: Clock, color: 'blue' },
    { value: 'boarding', label: 'Boarding', icon: CheckCircle, color: 'yellow' },
    { value: 'departed', label: 'Departed', icon: CheckCircle, color: 'green' },
    { value: 'arrived', label: 'Arrived', icon: CheckCircle, color: 'emerald' },
    { value: 'delayed', label: 'Delayed', icon: AlertTriangle, color: 'orange' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'red' },
  ];

  const handleStatusChange = async () => {
    setLoading(true);

    try {
      let response;
      
      if (newStatus === 'delayed') {
        response = await flightsApi.handleDelay(flight.flight_id, {
          reason: delayReason,
          estimated_departure: flight.scheduled_departure,
        });
      } else if (newStatus === 'cancelled') {
        response = await flightsApi.cancel(flight.flight_id, {
          reason: cancellationReason,
        });
      } else {
        response = await flightsApi.updateStatus(flight.flight_id, {
          status: newStatus,
        });
      }

      success(
        'Flight status updated',
        `Flight ${flight.flight_number} status changed to ${newStatus}`
      );
      
      onStatusUpdate(response.data);
      setIsOpen(false);
    } catch (err: any) {
      error('Failed to update status', err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentStatusOption = statusOptions.find(option => option.value === flight.status);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1"
      >
        {currentStatusOption && (
          <>
            <currentStatusOption.icon className="h-4 w-4" />
            <span>Manage Status</span>
          </>
        )}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Update Flight Status
            </h2>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status: <span className="font-semibold">{currentStatusOption?.label}</span>
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as FlightStatus)}
                className="input w-full"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {newStatus === 'delayed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay Reason
                </label>
                <textarea
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="input w-full h-20 resize-none"
                  placeholder="Enter reason for delay..."
                  required
                />
              </div>
            )}

            {newStatus === 'cancelled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="input w-full h-20 resize-none"
                  placeholder="Enter reason for cancellation..."
                  required
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={loading || (newStatus === 'delayed' && !delayReason) || (newStatus === 'cancelled' && !cancellationReason)}
              >
                {loading ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
