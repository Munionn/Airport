import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, LoadingSpinner } from '../../components/ui';
import { useToast } from '../../components/ui/Notification';
import { X, User, Mail, Phone, Calendar, Hash, MapPin } from 'lucide-react';
import { passengersApi } from '../../api/passengersApi';
import type { Passenger } from '../../types';

interface PassengerUpdateFormProps {
  passengerId: number;
  onClose: () => void;
  onSuccess: () => void;
}

// Simplified update DTO that matches the actual database schema
interface UpdatePassengerDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  passport_number?: string;
  nationality?: string;
  date_of_birth?: string;
  special_requirements?: string;
}

export const PassengerUpdateForm: React.FC<PassengerUpdateFormProps> = ({ passengerId, onClose, onSuccess }) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingPassenger, setLoadingPassenger] = useState(true);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  
  const [formData, setFormData] = useState<UpdatePassengerDto>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    passport_number: '',
    nationality: '',
    date_of_birth: '',
    special_requirements: '',
  });

  const [errors, setErrors] = useState<Partial<UpdatePassengerDto>>({});

  useEffect(() => {
    const loadPassenger = async () => {
      try {
        setLoadingPassenger(true);
        const response = await passengersApi.getById(passengerId);
        const passengerData = response.data;
        setPassenger(passengerData);
        
        // Populate form with existing data
        setFormData({
          first_name: passengerData.first_name || '',
          last_name: passengerData.last_name || '',
          email: passengerData.email || '',
          phone: passengerData.phone || '',
          passport_number: passengerData.passport_number || '',
          nationality: passengerData.nationality || '',
          date_of_birth: passengerData.date_of_birth ? new Date(passengerData.date_of_birth).toISOString().split('T')[0] : '',
          special_requirements: passengerData.special_requirements || '',
        });
      } catch (err: unknown) {
        console.error('Failed to load passenger:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        error('Failed to load passenger data', errorMessage);
      } finally {
        setLoadingPassenger(false);
      }
    };

    loadPassenger();
  }, [passengerId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<UpdatePassengerDto> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.passport_number.trim()) {
      newErrors.passport_number = 'Passport number is required';
    }

    if (!formData.nationality.trim()) {
      newErrors.nationality = 'Nationality is required';
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Convert date string back to Date object
      const updateData = {
        ...formData,
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : undefined,
      };

      const response = await passengersApi.update(passengerId, updateData);
      console.log('✅ Passenger updated:', response.data);
      
      success(
        'Passenger Updated', 
        `Passenger ${formData.first_name} ${formData.last_name} has been successfully updated`
      );
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Failed to update passenger:', err);
      error('Failed to update passenger', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdatePassengerDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (loadingPassenger) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6">
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
            <p className="text-center mt-4 text-gray-600">Loading passenger data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Update Passenger
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                First Name *
              </label>
              <Input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter first name"
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Last Name *
              </label>
              <Input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter last name"
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Passport Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="h-4 w-4 inline mr-1" />
                Passport Number *
              </label>
              <Input
                type="text"
                value={formData.passport_number}
                onChange={(e) => handleInputChange('passport_number', e.target.value)}
                placeholder="Enter passport number"
                className={errors.passport_number ? 'border-red-500' : ''}
              />
              {errors.passport_number && (
                <p className="text-red-500 text-sm mt-1">{errors.passport_number}</p>
              )}
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Nationality *
              </label>
              <Input
                type="text"
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                placeholder="Enter nationality"
                className={errors.nationality ? 'border-red-500' : ''}
              />
              {errors.nationality && (
                <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date of Birth *
              </label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className={errors.date_of_birth ? 'border-red-500' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.date_of_birth && (
                <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>
              )}
            </div>

            {/* Special Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements
              </label>
              <textarea
                value={formData.special_requirements}
                onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                placeholder="Enter any special requirements or notes"
                className="input w-full h-20 resize-none"
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Update Passenger
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
