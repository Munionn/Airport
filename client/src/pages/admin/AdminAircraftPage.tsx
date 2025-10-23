import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, LoadingSpinner, StatusBadge, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../components/ui/Notification';
import { Plus, Edit, Trash2, Search, Plane, Wrench, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Aircraft, AircraftStatus } from '../../types';

interface AircraftWithDetails extends Aircraft {
  totalFlights: number;
  totalHours: number;
  lastMaintenance: string;
  nextMaintenance: string;
}

export const AdminAircraftPage: React.FC = () => {
  const { success, error } = useToast();
  const [aircraft, setAircraft] = useState<AircraftWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deleteAircraft, setDeleteAircraft] = useState<AircraftWithDetails | null>(null);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockAircraft: AircraftWithDetails[] = [
      {
        aircraft_id: 1,
        registration_number: 'N123AB',
        model: 'Boeing 737-800',
        manufacturer: 'Boeing',
        capacity: 189,
        status: 'ACTIVE',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z',
        totalFlights: 156,
        totalHours: 2847,
        lastMaintenance: '2024-01-10T08:00:00Z',
        nextMaintenance: '2024-02-10T08:00:00Z',
      },
      {
        aircraft_id: 2,
        registration_number: 'N456CD',
        model: 'Airbus A320',
        manufacturer: 'Airbus',
        capacity: 180,
        status: 'MAINTENANCE',
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2024-01-25T16:45:00Z',
        totalFlights: 203,
        totalHours: 3245,
        lastMaintenance: '2024-01-25T16:45:00Z',
        nextMaintenance: '2024-02-25T16:45:00Z',
      },
      {
        aircraft_id: 3,
        registration_number: 'N789EF',
        model: 'Boeing 777-300ER',
        manufacturer: 'Boeing',
        capacity: 396,
        status: 'ACTIVE',
        created_at: '2024-01-12T09:00:00Z',
        updated_at: '2024-01-18T12:30:00Z',
        totalFlights: 89,
        totalHours: 1890,
        lastMaintenance: '2024-01-05T10:00:00Z',
        nextMaintenance: '2024-02-05T10:00:00Z',
      },
      {
        aircraft_id: 4,
        registration_number: 'N321GH',
        model: 'Airbus A350-900',
        manufacturer: 'Airbus',
        capacity: 315,
        status: 'RETIRED',
        created_at: '2023-12-01T08:00:00Z',
        updated_at: '2024-01-30T14:00:00Z',
        totalFlights: 445,
        totalHours: 8920,
        lastMaintenance: '2024-01-30T14:00:00Z',
        nextMaintenance: 'N/A',
      }
    ];

    setTimeout(() => {
      setAircraft(mockAircraft);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAircraft = aircraft.filter(plane => {
    const matchesSearch = 
      plane.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plane.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plane.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === '' || plane.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteAircraft = async (plane: AircraftWithDetails) => {
    try {
      // In real app, this would call aircraftApi.delete(plane.aircraft_id)
      setAircraft(prev => prev.filter(a => a.aircraft_id !== plane.aircraft_id));
      success('Aircraft deleted', `Aircraft ${plane.registration_number} has been deleted`);
      setDeleteAircraft(null);
    } catch (err: any) {
      error('Delete failed', err.message);
    }
  };

  const handleStatusChange = async (plane: AircraftWithDetails, newStatus: AircraftStatus) => {
    try {
      // In real app, this would call aircraftApi.update(plane.aircraft_id, { status: newStatus })
      setAircraft(prev => prev.map(a => 
        a.aircraft_id === plane.aircraft_id 
          ? { ...a, status: newStatus }
          : a
      ));
      success('Status updated', `Aircraft ${plane.registration_number} status updated to ${newStatus}`);
    } catch (err: any) {
      error('Update failed', err.message);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Aircraft Management</h1>
            <p className="text-gray-600 mt-2">
              Manage aircraft fleet, maintenance, and status
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Aircraft
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Plane className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Aircraft</p>
                  <p className="text-2xl font-bold text-gray-900">{aircraft.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {aircraft.filter(a => a.status === 'ACTIVE').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {aircraft.filter(a => a.status === 'MAINTENANCE').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Plane className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {aircraft.reduce((sum, a) => sum + a.capacity, 0)}
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
                  placeholder="Search aircraft..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input w-48"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Aircraft List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAircraft.map((plane) => (
            <Card key={plane.aircraft_id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Plane className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {plane.registration_number}
                      </h3>
                      <p className="text-sm text-gray-600">{plane.model}</p>
                      <p className="text-sm text-gray-500">{plane.manufacturer}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Status */}
                    <StatusBadge status={plane.status} />
                    
                    {/* Capacity */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Capacity</p>
                      <p className="text-lg font-semibold">{plane.capacity}</p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <select
                        value={plane.status}
                        onChange={(e) => handleStatusChange(plane, e.target.value as AircraftStatus)}
                        className="input text-sm"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="RETIRED">Retired</option>
                      </select>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteAircraft(plane)}
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
                    <span className="font-medium">Total Flights:</span> {plane.totalFlights}
                  </div>
                  <div>
                    <span className="font-medium">Total Hours:</span> {plane.totalHours.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Maintenance:</span> {format(new Date(plane.lastMaintenance), 'MMM dd, yyyy')}
                  </div>
                  <div>
                    <span className="font-medium">Next Maintenance:</span> {plane.nextMaintenance === 'N/A' ? 'N/A' : format(new Date(plane.nextMaintenance), 'MMM dd, yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteAircraft}
          onClose={() => setDeleteAircraft(null)}
          onConfirm={() => deleteAircraft && handleDeleteAircraft(deleteAircraft)}
          title="Delete Aircraft"
          message={`Are you sure you want to delete aircraft ${deleteAircraft?.registration_number}? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </div>
  );
};