// Shared interfaces for common data structures
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  city: string;
  country: string;
  timezone?: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
}

export interface PersonalInfo {
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  passport_number?: string;
  nationality?: string;
}

export interface AuditInfo {
  created_at: Date;
  updated_at: Date;
  created_by?: number;
  updated_by?: number;
}

export interface StatusInfo {
  status: string;
  is_active?: boolean;
}

export interface PriceInfo {
  price: number;
  currency?: string;
}

export interface CapacityInfo {
  capacity: number;
  current_load?: number;
  load_percentage?: number;
}

export interface TimeInfo {
  scheduled_time: Date;
  actual_time?: Date;
  duration?: number; // in minutes
}

export interface LocationInfo {
  departure_location: string;
  arrival_location: string;
  distance?: number; // in kilometers
}
