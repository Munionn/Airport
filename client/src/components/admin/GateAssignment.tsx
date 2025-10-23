import React, { useState, useEffect } from 'react';
import { Button, Modal } from "../ui";
import { useToast } from "../ui/Notification";
import { flightsApi } from '../../api';
import { MapPin, X } from 'lucide-react';
import type { Flight } from '../../types';

interface GateAssignmentProps {
  flight: Flight;
  onGateUpdate: (updatedFlight: Flight) => void;
}

export const GateAssignment: React.FC<GateAssignmentProps> = ({
  flight,
  onGateUpdate,
}) => {
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedGate, setSelectedGate] = useState<string>('');
  const [availableGates, setAvailableGates] = useState<Array<{gate_id: number, gate_number: string, terminal: string}>>([]);

  // Mock available gates data
  useEffect(() => {
    const mockGates = [
      { gate_id: 1, gate_number: 'A1', terminal: 'Terminal A' },
      { gate_id: 2, gate_number: 'A2', terminal: 'Terminal A' },
      { gate_id: 3, gate_number: 'A3', terminal: 'Terminal A' },
      { gate_id: 4, gate_number: 'B1', terminal: 'Terminal B' },
      { gate_id: 5, gate_number: 'B2', terminal: 'Terminal B' },
      { gate_id: 6, gate_number: 'B3', terminal: 'Terminal B' },
      { gate_id: 7, gate_number: 'C1', terminal: 'Terminal C' },
      { gate_id: 8, gate_number: 'C2', terminal: 'Terminal C' },
    ];
    setAvailableGates(mockGates);
    
    if (flight.gate?.gate_number) {
      setSelectedGate(flight.gate.gate_number);
    }
  }, [flight]);

  const handleAssignGate = async () => {
    if (!selectedGate) return;
    
    setLoading(true);

    try {
      const gateId = availableGates.find(gate => gate.gate_number === selectedGate)?.gate_id;
      
      const response = await flightsApi.assignGate(flight.flight_id, {
        gate_id: gateId!,
      });

      success(
        'Gate assigned successfully',
        `Flight ${flight.flight_number} assigned to gate ${selectedGate}`
      );
      
      onGateUpdate(response.data);
      setIsOpen(false);
    } catch (err: any) {
      error('Failed to assign gate', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseGate = async () => {
    setLoading(true);

    try {
      const response = await flightsApi.releaseGate(flight.flight_id);

      success(
        'Gate released successfully',
        `Gate released for flight ${flight.flight_number}`
      );
      
      onGateUpdate(response.data);
      setIsOpen(false);
    } catch (err: any) {
      error('Failed to release gate', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1"
      >
        <MapPin className="h-4 w-4" />
        <span>{flight.gate?.gate_number || 'Assign Gate'}</span>
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Gate Assignment
            </h2>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Flight: <span className="font-semibold">{flight.flight_number}</span>
                {flight.gate && (
                  <span className="ml-2">
                    Current Gate: <span className="font-semibold">{flight.gate.gate_number}</span>
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Gate
              </label>
              <select
                value={selectedGate}
                onChange={(e) => setSelectedGate(e.target.value)}
                className="input w-full"
              >
                <option value="">Choose a gate...</option>
                {availableGates.map(gate => (
                  <option key={gate.gate_id} value={gate.gate_number}>
                    {gate.gate_number} - {gate.terminal}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Gate Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Gates are assigned based on terminal and availability</p>
                <p>• Passengers will be notified of gate changes</p>
                <p>• Gates can be reassigned if needed</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              {flight.gate && (
                <Button
                  variant="outline"
                  onClick={handleReleaseGate}
                  disabled={loading}
                >
                  Release Gate
                </Button>
              )}
              <Button
                onClick={handleAssignGate}
                disabled={loading || !selectedGate}
              >
                {loading ? 'Assigning...' : 'Assign Gate'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
