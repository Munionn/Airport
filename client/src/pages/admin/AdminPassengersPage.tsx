import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, LoadingSpinner, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../components/ui/Notification';
import { Edit, Trash2, User as UserIcon, Mail, Calendar, Plane, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { passengersApi } from '../../api/passengersApi';
import { PassengerUpdateForm } from '../../components/admin/PassengerUpdateForm';
import { PassengerCreateForm } from '../../components/admin/PassengerCreateForm';
import type { Passenger } from '../../types';

interface PassengerWithDetails extends Passenger {
  totalFlights: number;
  totalTickets: number;
  lastFlight: string;
  loyaltyPoints: number;
}

export const AdminPassengersPage: React.FC = () => {
  const { success, error } = useToast();
  const [passengers, setPassengers] = useState<PassengerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletePassenger, setDeletePassenger] = useState<PassengerWithDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingPassenger, setEditingPassenger] = useState<PassengerWithDetails | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load passengers data from API
  useEffect(() => {
    const loadPassengers = async () => {
      try {
        setLoading(true);
        const response = await passengersApi.getAll(1, 100);
        console.log('✅ Passengers loaded:', response.data);
        
        // Transform API data to include additional details
        const passengersWithDetails: PassengerWithDetails[] = (response.data.data || response.data).map((passenger: Passenger) => ({
          ...passenger,
          totalFlights: Math.floor(Math.random() * 50) + 5, // Mock data - would come from flights API
          totalTickets: Math.floor(Math.random() * 60) + 8, // Mock data - would come from tickets API
          lastFlight: passenger.created_at || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          loyaltyPoints: Math.floor(Math.random() * 5000) + 500, // Mock data - would come from loyalty system
        }));
        
        setPassengers(passengersWithDetails);
      } catch (err: unknown) {
        console.error('❌ Failed to load passengers:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setLoadError(errorMessage);
        
        // Fallback to mock data if API fails
        const mockPassengers: PassengerWithDetails[] = [
          {
            passenger_id: 1,
            user_id: 1,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            date_of_birth: '1990-01-01',
            passport_number: 'A1234567',
            nationality: 'US',
            created_at: '2024-01-15T10:00:00Z',
            totalFlights: 12,
            totalTickets: 15,
            lastFlight: '2024-01-18T14:30:00Z',
            loyaltyPoints: 2450,
          },
          {
            passenger_id: 2,
            user_id: 2,
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+1234567891',
            date_of_birth: '1985-05-15',
            passport_number: 'B2345678',
            nationality: 'CA',
            created_at: '2024-01-10T08:00:00Z',
            totalFlights: 8,
            totalTickets: 10,
            lastFlight: '2024-01-22T09:15:00Z',
            loyaltyPoints: 1800,
          }
        ];
        setPassengers(mockPassengers);
      } finally {
        setLoading(false);
      }
    };

    loadPassengers();
  }, []); // Empty dependency array to prevent infinite loop

  // Show error toast when loadError changes
  useEffect(() => {
    if (loadError) {
      error('Failed to load passengers', loadError);
      setLoadError(null); // Clear error after showing
    }
  }, [loadError, error]);

  const filteredPassengers = passengers.filter(passenger => {
    const matchesSearch = 
      passenger.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passenger.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (passenger.email && passenger.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      passenger.passport_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleDeletePassenger = async (passenger: PassengerWithDetails) => {
    try {
      await passengersApi.delete(passenger.passenger_id);
      setPassengers(prev => prev.filter(p => p.passenger_id !== passenger.passenger_id));
      success('Passenger deleted', `Passenger ${passenger.first_name} ${passenger.last_name} has been deleted`);
      setDeletePassenger(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error('Delete failed', errorMessage);
    }
  };

  const handleUpdateSuccess = () => {
    // Reload passengers list after successful update
    const loadPassengers = async () => {
      try {
        const response = await passengersApi.getAll(1, 100);
        const passengersWithDetails: PassengerWithDetails[] = (response.data.data || response.data).map((passenger: Passenger) => ({
          ...passenger,
          totalFlights: Math.floor(Math.random() * 50) + 5,
          totalTickets: Math.floor(Math.random() * 60) + 8,
          lastFlight: passenger.created_at || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          loyaltyPoints: Math.floor(Math.random() * 5000) + 500,
        }));
        setPassengers(passengersWithDetails);
      } catch (err: unknown) {
        console.error('Failed to reload passengers:', err);
      }
    };
    loadPassengers();
  };

  const handleCreateSuccess = () => {
    // Reload passengers list after successful creation
    const loadPassengers = async () => {
      try {
        const response = await passengersApi.getAll(1, 100);
        const passengersWithDetails: PassengerWithDetails[] = (response.data.data || response.data).map((passenger: Passenger) => ({
          ...passenger,
          totalFlights: Math.floor(Math.random() * 50) + 5,
          totalTickets: Math.floor(Math.random() * 60) + 8,
          lastFlight: passenger.created_at || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          loyaltyPoints: Math.floor(Math.random() * 5000) + 500,
        }));
        setPassengers(passengersWithDetails);
      } catch (err: unknown) {
        console.error('Failed to reload passengers:', err);
      }
    };
    loadPassengers();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Passenger Management</h1>
            <p className="text-gray-600 mt-2">
              Manage passenger information and flight history
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Passenger
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                  <p className="text-2xl font-bold text-gray-900">{passengers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Plane className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Flights</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {passengers.reduce((sum, p) => sum + p.totalFlights, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {passengers.reduce((sum, p) => sum + p.totalTickets, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Loyalty Points</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(passengers.reduce((sum, p) => sum + p.loyaltyPoints, 0) / passengers.length)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search passengers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passengers List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredPassengers.map((passenger) => (
            <Card key={passenger.passenger_id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {passenger.first_name} {passenger.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{passenger.nationality}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{passenger.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Stats */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Flights</p>
                      <p className="text-lg font-semibold">{passenger.totalFlights}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Tickets</p>
                      <p className="text-lg font-semibold">{passenger.totalTickets}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Points</p>
                      <p className="text-lg font-semibold text-orange-600">{passenger.loyaltyPoints}</p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingPassenger(passenger)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletePassenger(passenger)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Phone:</span> {passenger.phone}
                  </div>
                  <div>
                    <span className="font-medium">Passport:</span> {passenger.passport_number}
                  </div>
                  <div>
                    <span className="font-medium">Last Flight:</span> {format(new Date(passenger.lastFlight), 'MMM dd, yyyy')}
                  </div>
                  <div>
                    <span className="font-medium">Member Since:</span> {format(new Date(passenger.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deletePassenger}
          onClose={() => setDeletePassenger(null)}
          onConfirm={() => deletePassenger && handleDeletePassenger(deletePassenger)}
          title="Delete Passenger"
          message={`Are you sure you want to delete passenger ${deletePassenger?.first_name} ${deletePassenger?.last_name}? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />

        {/* Update Form */}
        {editingPassenger && (
          <PassengerUpdateForm
            passengerId={editingPassenger.passenger_id}
            onClose={() => setEditingPassenger(null)}
            onSuccess={handleUpdateSuccess}
          />
        )}

        {/* Create Form */}
        {showCreateForm && (
          <PassengerCreateForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    </div>
  );
};