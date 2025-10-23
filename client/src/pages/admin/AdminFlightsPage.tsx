import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Button, LoadingSpinner, StatusBadge, ConfirmDialog } from '../../components/ui';
import { FlightForm } from '../../components/admin/FlightForm';
import { FlightStatusManager } from '../../components/admin/FlightStatusManager';
import { GateAssignment } from '../../components/admin/GateAssignment';
import { flightsApi } from '../../api';
import { useToast } from '../../components/ui/Notification';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import type { Flight } from '../../types';

export const AdminFlightsPage: React.FC = () => {
  const { success, error } = useToast();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [deleteFlight, setDeleteFlight] = useState<Flight | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadFlights = useCallback(async () => {
    setLoading(true);
    try {
      const response = await flightsApi.getAll(currentPage, 10);
      const data = response.data;

      if (data.data) {
        let filteredFlights = data.data;

        // Apply search filter
        if (searchTerm) {
          filteredFlights = filteredFlights.filter((flight: Flight) =>
            flight.flight_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            flight.departure_airport?.iata_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            flight.arrival_airport?.iata_code.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Apply status filter
        if (statusFilter) {
          filteredFlights = filteredFlights.filter((flight: Flight) =>
            flight.status === statusFilter
          );
        }

        setFlights(filteredFlights);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err: unknown) {
      error('Failed to load flights', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, error]);

  useEffect(() => {
    loadFlights();
  }, [loadFlights]);

  const handleCreateFlight = () => {
    setEditingFlight(null);
    setIsFormOpen(true);
  };

  const handleEditFlight = (flight: Flight) => {
    setEditingFlight(flight);
    setIsFormOpen(true);
  };

  const handleSaveFlight = (savedFlight: Flight) => {
    if (editingFlight) {
      setFlights(prev => prev.map(flight => 
        flight.flight_id === savedFlight.flight_id ? savedFlight : flight
      ));
    } else {
      setFlights(prev => [savedFlight, ...prev]);
    }
    setIsFormOpen(false);
    setEditingFlight(null);
  };

  const handleDeleteFlight = async () => {
    if (!deleteFlight) return;

    try {
      await flightsApi.delete(deleteFlight.flight_id);
      success('Flight deleted', `Flight ${deleteFlight.flight_number} has been deleted`);
      setFlights(prev => prev.filter(flight => flight.flight_id !== deleteFlight.flight_id));
      setDeleteFlight(null);
    } catch (err: unknown) {
      error('Failed to delete flight', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleStatusUpdate = (updatedFlight: Flight) => {
    setFlights(prev => prev.map(flight => 
      flight.flight_id === updatedFlight.flight_id ? updatedFlight : flight
    ));
  };

  const handleGateUpdate = (updatedFlight: Flight) => {
    setFlights(prev => prev.map(flight => 
      flight.flight_id === updatedFlight.flight_id ? updatedFlight : flight
    ));
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (loading && flights.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Flight Management</h1>
            <p className="text-gray-600 mt-2">
              Manage flights, status, and gate assignments
            </p>
          </div>
          <Button onClick={handleCreateFlight} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Flight</span>
          </Button>
        </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
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
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-full"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="boarding">Boarding</option>
                <option value="departed">Departed</option>
                <option value="arrived">Arrived</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Button variant="outline" onClick={loadFlights}>
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flights List */}
      <div className="space-y-4">
        {flights.map((flight) => (
          <Card key={flight.flight_id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-6">
                    {/* Flight Info */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {flight.flight_number}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flight.departure_airport?.iata_code} → {flight.arrival_airport?.iata_code}
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatTime(flight.scheduled_departure)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(flight.scheduled_departure)}
                      </div>
                    </div>

                    {/* Aircraft */}
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {flight.aircraft?.model_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {flight.aircraft?.registration_number}
                      </div>
                    </div>

                    {/* Gate */}
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {flight.gate?.gate_number || 'TBD'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {String(flight.gate?.terminal || 'Gate')}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        ${typeof flight.price === 'number' ? flight.price.toFixed(2) : Number(flight.price).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {flight.available_seats} seats
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <StatusBadge status={flight.status} />
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFlight(flight)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <FlightStatusManager
                      flight={flight}
                      onStatusUpdate={handleStatusUpdate}
                    />
                    
                    <GateAssignment
                      flight={flight}
                      onGateUpdate={handleGateUpdate}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteFlight(flight)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Flight Form Modal */}
      <FlightForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingFlight(null);
        }}
        onSave={handleSaveFlight}
        flight={editingFlight}
        mode={editingFlight ? 'edit' : 'create'}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteFlight}
        onClose={() => setDeleteFlight(null)}
        onConfirm={handleDeleteFlight}
        title="Delete Flight"
        message={`Are you sure you want to delete flight ${deleteFlight?.flight_number}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
      </div>
    </div>
  );
};