// Business logic interfaces for airport management system

export interface FlightSearchCriteria {
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: Date;
  arrivalDate?: Date;
  passengerCount?: number;
  ticketClass?: string;
  maxPrice?: number;
  airline?: string;
}

export interface FlightBookingRequest {
  flightId: number;
  passengerIds: number[];
  ticketClass: string;
  seatPreferences?: string[];
  specialRequests?: string[];
}

export interface SeatAssignment {
  seatNumber: string;
  isAvailable: boolean;
  ticketClass: string;
  price: number;
}

export interface FlightLoadInfo {
  flightId: number;
  totalCapacity: number;
  occupiedSeats: number;
  loadPercentage: number;
  availableSeatsByClass: Record<string, number>;
}

export interface PassengerInfo {
  passengerId: number;
  firstName: string;
  lastName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: Date;
  contactInfo: {
    email?: string;
    phone?: string;
  };
}

export interface TicketInfo {
  ticketId: number;
  ticketNumber: string;
  passengerId: number;
  flightId: number;
  seatNumber: string;
  ticketClass: string;
  price: number;
  status: string;
  bookingDate: Date;
}

export interface BaggageInfo {
  baggageId: number;
  passengerId: number;
  flightId: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  status: string;
  trackingNumber: string;
}

export interface CrewAssignment {
  flightId: number;
  userId: number;
  position: string;
  isCaptain: boolean;
  assignedDate: Date;
}

export interface MaintenanceSchedule {
  aircraftId: number;
  maintenanceType: string;
  scheduledDate: Date;
  estimatedDuration: number;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface GateAssignment {
  gateId: number;
  flightId: number;
  assignedTime: Date;
  estimatedDeparture: Date;
  status: string;
}

export interface RouteInfo {
  routeId: number;
  departureAirport: string;
  arrivalAirport: string;
  distance: number;
  estimatedDuration: number;
  isActive: boolean;
}

export interface AirportInfo {
  airportId: number;
  iataCode: string;
  icaoCode: string;
  airportName: string;
  city: string;
  country: string;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface AircraftInfo {
  aircraftId: number;
  registrationNumber: string;
  modelName: string;
  capacity: number;
  status: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
}

export interface StatisticsData {
  period: string;
  totalFlights: number;
  totalPassengers: number;
  totalRevenue: number;
  averageLoadFactor: number;
  onTimePerformance: number;
  cancellations: number;
  delays: number;
}

export interface NotificationData {
  type: 'FLIGHT_DELAY' | 'GATE_CHANGE' | 'BOARDING' | 'CANCELLATION' | 'MAINTENANCE';
  recipientId: number;
  recipientType: 'PASSENGER' | 'CREW' | 'ADMIN';
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  scheduledTime?: Date;
}
