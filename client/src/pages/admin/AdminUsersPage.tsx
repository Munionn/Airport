import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, LoadingSpinner, StatusBadge, ConfirmDialog } from '../../components/ui';
import { useToast } from '../../components/ui/Notification';
import { Plus, Edit, Trash2, User as UserIcon, Mail, Shield } from 'lucide-react';
import { format } from 'date-fns';
import type { User, Role } from '../../types';

interface UserWithRoles extends User {
  roles: Role[];
}

export const AdminUsersPage: React.FC = () => {
  const { success, error } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [deleteUser, setDeleteUser] = useState<UserWithRoles | null>(null);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockUsers: UserWithRoles[] = [
      {
        user_id: 1,
        username: 'john.doe',
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        date_of_birth: '1990-01-01',
        passport_number: 'A1234567',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        is_active: true,
        roles: [
          {
            role_id: 1,
            role_name: 'passenger',
            description: 'Regular Passenger',
            permissions: { flights: true, tickets: true },
            created_at: '2024-01-15T10:00:00Z',
          }
        ]
      },
      {
        user_id: 2,
        username: 'admin.manager',
        email: 'admin.manager@airport.com',
        first_name: 'Admin',
        last_name: 'Manager',
        phone: '+1234567891',
        date_of_birth: '1985-05-15',
        passport_number: 'B2345678',
        created_at: '2024-01-10T08:00:00Z',
        updated_at: '2024-01-20T14:30:00Z',
        is_active: true,
        roles: [
          {
            role_id: 2,
            role_name: 'admin',
            description: 'System Administrator',
            permissions: { flights: true, users: true, analytics: true },
            created_at: '2024-01-10T08:00:00Z',
          }
        ]
      },
      {
        user_id: 3,
        username: 'operator.jane',
        email: 'operator.jane@airport.com',
        first_name: 'Jane',
        last_name: 'Operator',
        phone: '+1234567892',
        date_of_birth: '1988-03-20',
        passport_number: 'C3456789',
        created_at: '2024-01-12T09:00:00Z',
        updated_at: '2024-01-18T16:45:00Z',
        is_active: true,
        roles: [
          {
            role_id: 3,
            role_name: 'operator',
            description: 'Flight Operator',
            permissions: { flights: true, passengers: true },
            created_at: '2024-01-12T09:00:00Z',
          }
        ]
      },
      {
        user_id: 4,
        username: 'passenger.mike',
        email: 'passenger.mike@example.com',
        first_name: 'Mike',
        last_name: 'Passenger',
        phone: '+1234567893',
        date_of_birth: '1992-07-10',
        passport_number: 'D4567890',
        created_at: '2024-01-25T11:00:00Z',
        updated_at: '2024-01-25T11:00:00Z',
        is_active: false,
        roles: [
          {
            role_id: 1,
            role_name: 'passenger',
            description: 'Regular Passenger',
            permissions: { flights: true, tickets: true },
            created_at: '2024-01-25T11:00:00Z',
          }
        ]
      }
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === '' || 
      user.roles.some(role => role.role_name === selectedRole);
    
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = async (user: UserWithRoles) => {
    try {
      // In real app, this would call usersApi.delete(user.user_id)
      setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
      success('User deleted', `User ${user.first_name} ${user.last_name} has been deleted`);
      setDeleteUser(null);
    } catch (err: unknown) {
      error('Delete failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleToggleUserStatus = async (user: UserWithRoles) => {
    try {
      // In real app, this would call usersApi.update(user.user_id, { is_active: !user.is_active })
      setUsers(prev => prev.map(u => 
        u.user_id === user.user_id 
          ? { ...u, is_active: !u.is_active }
          : u
      ));
      success(
        'Status updated', 
        `User ${user.first_name} ${user.last_name} has been ${!user.is_active ? 'activated' : 'deactivated'}`
      );
    } catch (err: unknown) {
      error('Update failed', err instanceof Error ? err.message : 'Unknown error');
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">
              Manage system users, roles, and permissions
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="input w-48"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="passenger">Passenger</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.user_id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Roles */}
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <div className="flex space-x-1">
                        {user.roles.map((role) => (
                          <StatusBadge
                            key={role.role_id}
                            status={role.role_name}
                            className="text-xs"
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Status */}
                    <StatusBadge
                      status={user.is_active ? 'active' : 'inactive'}
                      className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    />
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteUser(user)}
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
                    <span className="font-medium">Phone:</span> {user.phone || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Passport:</span> {user.passport_number || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {format(new Date(user.updated_at), 'MMM dd, yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={() => deleteUser && handleDeleteUser(deleteUser)}
          title="Delete User"
          message={`Are you sure you want to delete user ${deleteUser?.first_name} ${deleteUser?.last_name}? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </div>
  );
};