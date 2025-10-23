// Enums from backend
export enum FlightStatus {
  SCHEDULED = 'scheduled',
  BOARDING = 'boarding',
  DEPARTED = 'departed',
  ARRIVED = 'arrived',
  CANCELLED = 'cancelled',
  DELAYED = 'delayed',
}

export enum AircraftStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

export enum TicketClass {
  ECONOMY = 'economy',
  BUSINESS = 'business',
  FIRST = 'first',
}

export enum TicketStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  USED = 'used',
  REFUNDED = 'refunded',
}

export enum BaggageStatus {
  CHECKED_IN = 'checked_in',
  LOADED = 'loaded',
  UNLOADED = 'unloaded',
  DELIVERED = 'delivered',
  LOST = 'lost',
}

export enum GateStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
}

export enum TerminalStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
}

export enum RouteStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum MaintenanceType {
  ROUTINE = 'routine',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  OVERHAUL = 'overhaul',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CrewPosition {
  PILOT = 'pilot',
  CO_PILOT = 'co_pilot',
  FLIGHT_ENGINEER = 'flight_engineer',
  FLIGHT_ATTENDANT = 'flight_attendant',
  PURSER = 'purser',
}

// Base types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// User types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  passport_number?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  roles: Role[];
}

export interface Role {
  role_id: number;
  role_name: string;
  description?: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

export interface UserRole {
  user_role_id: number;
  user_id: number;
  role_id: number;
  assigned_at: string;
  assigned_by?: number;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  passport_number?: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  passport_number?: string;
  is_active?: boolean;
}

// Airport types
export interface City {
  city_id: number;
  city_name: string;
  country: string;
  timezone: string;
}

export interface Airport {
  airport_id: number;
  iata_code: string;
  icao_code: string;
  airport_name: string;
  city_id: number;
  latitude: number;
  longitude: number;
  city?: City;
}

export interface CreateAirportDto {
  iata_code: string;
  icao_code: string;
  airport_name: string;
  city_id: number;
  latitude: number;
  longitude: number;
}

export interface UpdateAirportDto {
  iata_code?: string;
  icao_code?: string;
  airport_name?: string;
  city_id?: number;
  latitude?: number;
  longitude?: number;
}

// Aircraft types
export interface AircraftModel {
  model_id: number;
  model_name: string;
  manufacturer: string;
  capacity: number;
  max_range: number;
}

export interface Aircraft {
  aircraft_id: number;
  registration_number: string;
  model_id: number;
  model_name: string;
  manufacturer: string;
  capacity: number;
  max_range: number;
  status: AircraftStatus;
  purchase_date: string;
  last_maintenance?: string;
  next_maintenance?: string;
}

export interface CreateAircraftDto {
  registration_number: string;
  model_id: number;
  purchase_date: string;
}

export interface UpdateAircraftDto {
  registration_number?: string;
  model_id?: number;
  status?: AircraftStatus;
  last_maintenance?: string;
  next_maintenance?: string;
}

// Route types
export interface Route {
  route_id: number;
  route_name: string;
  departure_airport_id: number;
  arrival_airport_id: number;
  distance: number;
  duration: string;
  status: RouteStatus;
  departure_airport?: Airport;
  arrival_airport?: Airport;
}

export interface CreateRouteDto {
  route_name: string;
  departure_airport_id: number;
  arrival_airport_id: number;
  distance: number;
  duration: string;
}

export interface UpdateRouteDto {
  route_name?: string;
  departure_airport_id?: number;
  arrival_airport_id?: number;
  distance?: number;
  duration?: string;
  status?: RouteStatus;
}

// Terminal types
export interface Terminal {
  terminal_id: number;
  terminal_name: string;
  terminal_code: string;
  capacity: number;
  status: TerminalStatus;
  opening_hours: string;
}

export interface Gate {
  gate_id: number;
  terminal_id: number;
  gate_number: string;
  status: GateStatus;
  capacity: number;
  terminal?: Terminal;
}

export interface CreateGateDto {
  terminal_id: number;
  gate_number: string;
  capacity: number;
}

export interface UpdateGateDto {
  terminal_id?: number;
  gate_number?: string;
  status?: GateStatus;
  capacity?: number;
}

// Flight types
export interface Flight {
  flight_id: number;
  flight_number: string;
  aircraft_id: number;
  route_id: number;
  departure_airport_id: number;
  arrival_airport_id: number;
  gate_id?: number;
  scheduled_departure: string;
  scheduled_arrival: string;
  actual_departure?: string;
  actual_arrival?: string;
  status: FlightStatus;
  price: number;
  created_at: string;
  updated_at: string;
  // Additional computed fields
  load_percentage?: number;
  available_seats?: number;
  departure_airport?: Airport;
  arrival_airport?: Airport;
  aircraft?: Aircraft;
  gate?: Gate;
}

export interface CreateFlightDto {
  flight_number: string;
  aircraft_id: number;
  route_id: number;
  gate_id?: number;
  scheduled_departure: string;
  scheduled_arrival: string;
  price: number;
  notes?: string;
}

export interface UpdateFlightDto {
  flight_number?: string;
  aircraft_id?: number;
  route_id?: number;
  gate_id?: number;
  scheduled_departure?: string;
  scheduled_arrival?: string;
  actual_departure?: string;
  actual_arrival?: string;
  status?: FlightStatus;
  price?: number;
  notes?: string;
}

export interface SearchFlightDto extends PaginationParams {
  departure_iata?: string;
  arrival_iata?: string;
  departure_date?: string;
  arrival_date?: string;
  status?: FlightStatus;
  aircraft_id?: number;
  route_id?: number;
  gate_id?: number;
  max_price?: number;
  passenger_count?: number;
  airline?: string;
}

export interface FlightSearchCriteriaDto {
  departure_airport?: string;
  arrival_airport?: string;
  departure_date?: string;
  arrival_date?: string;
  passenger_count?: number;
  ticket_class?: string;
  max_price?: number;
  airline?: string;
  direct_flights_only?: boolean;
  preferred_airlines?: string[];
}

export interface FlightStatisticsDto {
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month' | 'year';
  airport_id?: number;
  route_id?: number;
}

export interface FlightStatisticsResponse {
  period: string;
  total_flights: number;
  total_passengers: number;
  total_revenue: number;
  average_load_factor: number;
  on_time_performance: number;
  cancellations: number;
  delays: number;
  average_delay_minutes: number;
  top_routes: Array<{
    route_id: number;
    departure_airport: string;
    arrival_airport: string;
    flight_count: number;
  }>;
  load_factor_by_class: Record<string, number>;
}

// Passenger types
export interface Passenger {
  passenger_id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  passport_number: string;
  nationality: string;
  date_of_birth: string;
  phone?: string;
  email?: string;
  special_requirements?: string;
  created_at: string;
}

export interface CreatePassengerDto {
  user_id?: number;
  first_name: string;
  last_name: string;
  passport_number: string;
  nationality: string;
  date_of_birth: string;
  phone?: string;
  email?: string;
  special_requirements?: string;
}

export interface UpdatePassengerDto {
  first_name?: string;
  last_name?: string;
  passport_number?: string;
  nationality?: string;
  date_of_birth?: string;
  phone?: string;
  email?: string;
  special_requirements?: string;
}

export interface SearchPassengerDto extends PaginationParams {
  first_name?: string;
  last_name?: string;
  passport_number?: string;
  nationality?: string;
  email?: string;
}

// Ticket types
export interface Ticket {
  ticket_id: number;
  ticket_number: string;
  flight_id: number;
  passenger_id: number;
  seat_number: string;
  class: TicketClass;
  price: number;
  status: TicketStatus;
  purchase_date: string;
  check_in_time?: string;
  flight?: Flight;
  passenger?: Passenger;
}

export interface CreateTicketDto {
  flight_id: number;
  passenger_id: number;
  seat_number: string;
  class: TicketClass;
  price: number;
}

export interface UpdateTicketDto {
  seat_number?: string;
  class?: TicketClass;
  price?: number;
  status?: TicketStatus;
  check_in_time?: string;
}

export interface SearchTicketDto extends PaginationParams {
  ticket_number?: string;
  flight_id?: number;
  passenger_id?: number;
  status?: TicketStatus;
  class?: TicketClass;
}

export interface CheckInDto {
  ticket_id: number;
  seat_number?: string;
}

export interface SeatSelectionDto {
  ticket_id: number;
  seat_number: string;
}

export interface TicketCancellationDto {
  ticket_id: number;
  reason: string;
}

export interface TicketRefundDto {
  ticket_id: number;
  reason: string;
  refund_amount?: number;
}

export interface SeatAvailabilityDto {
  flight_id: number;
  class?: TicketClass;
}

export interface SeatAvailabilityResponse {
  flight_id: number;
  available_seats: number;
  seats_by_class: Record<TicketClass, number>;
  seat_map?: any;
}

// Baggage types
export interface Baggage {
  baggage_id: number;
  passenger_id: number;
  flight_id: number;
  baggage_tag: string;
  weight: number;
  status: BaggageStatus;
  check_in_time: string;
  delivery_time?: string;
  passenger?: Passenger;
  flight?: Flight;
}

export interface CreateBaggageDto {
  passenger_id: number;
  flight_id: number;
  weight: number;
}

export interface UpdateBaggageDto {
  weight?: number;
  status?: BaggageStatus;
  delivery_time?: string;
}

// Flight Crew types
export interface FlightCrew {
  crew_id: number;
  flight_id: number;
  user_id: number;
  position: CrewPosition;
  assigned_at: string;
  user?: User;
  flight?: Flight;
}

export interface CreateFlightCrewDto {
  flight_id: number;
  user_id: number;
  position: CrewPosition;
}

// Maintenance types
export interface MaintenanceRecord {
  maintenance_id: number;
  aircraft_id: number;
  maintenance_type: MaintenanceType;
  description: string;
  start_date: string;
  end_date?: string;
  cost: number;
  technician_id: number;
  status: MaintenanceStatus;
  aircraft?: Aircraft;
  technician?: User;
}

export interface CreateMaintenanceRecordDto {
  aircraft_id: number;
  maintenance_type: MaintenanceType;
  description: string;
  start_date: string;
  end_date?: string;
  cost: number;
  technician_id: number;
}

export interface UpdateMaintenanceRecordDto {
  maintenance_type?: MaintenanceType;
  description?: string;
  start_date?: string;
  end_date?: string;
  cost?: number;
  technician_id?: number;
  status?: MaintenanceStatus;
}

// Analytics types
export interface FlightAnalyticsDto {
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month';
  airport_id?: number;
}

export interface RevenueAnalyticsDto {
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month';
  class?: TicketClass;
}

export interface PassengerAnalyticsDto {
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month';
  nationality?: string;
}

export interface OperationalAnalyticsDto {
  start_date?: string;
  end_date?: string;
  airport_id?: number;
}

export interface DelayAnalyticsDto {
  start_date?: string;
  end_date?: string;
  airport_id?: number;
  route_id?: number;
}

export interface DashboardAnalyticsDto {
  start_date?: string;
  end_date?: string;
}

// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  passport_number?: string;
}

export interface AuthResponse {
  user: User;
  roles: Role[];
}

export interface AuthState {
  user: User | null;
  roles: Role[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// UI types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: any;
}

export interface LoadingState {
  [key: string]: boolean;
}

// Filter types
export interface FlightFilters {
  departure_iata?: string;
  arrival_iata?: string;
  departure_date?: string;
  arrival_date?: string;
  status?: FlightStatus;
  max_price?: number;
  passenger_count?: number;
  airline?: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  class?: TicketClass;
  flight_id?: number;
  passenger_id?: number;
}

export interface PassengerFilters {
  first_name?: string;
  last_name?: string;
  passport_number?: string;
  nationality?: string;
  email?: string;
}

// Additional missing types
export interface SearchAirportsDto {
  query?: string;
  country?: string;
  city?: string;
}

export interface AirportStatisticsDto {
  start_date: string;
  end_date: string;
  airport_id?: number;
}

export interface AirportDistanceDto {
  airport1_id: number;
  airport2_id: number;
}

export interface AssignGateDto {
  gate_id: number;
}

export interface UpdateFlightStatusDto {
  status: FlightStatus;
  reason?: string;
}

export interface FlightDelayDto {
  delay_minutes: number;
  reason: string;
}

export interface FlightCancellationDto {
  reason: string;
  refund_policy: string;
}

export interface PassengerStatisticsDto {
  start_date: string;
  end_date: string;
  airport_id?: number;
  route_id?: number;
}

export interface PassengerStatisticsResponseDto {
  total_passengers: number;
  new_passengers: number;
  returning_passengers: number;
  passengers_by_class: Record<string, number>;
  passengers_by_route: Array<{
    route_id: number;
    route_name: string;
    passenger_count: number;
  }>;
}

// Additional missing types for API files
export interface RegisterPassengerForFlightDto {
  passenger_id: number;
  flight_id: number;
  seat_number?: string;
  ticket_class: TicketClass;
}

export interface PassengerFlightHistoryDto {
  passenger_id: number;
  start_date?: string;
  end_date?: string;
}

export interface TicketStatisticsDto {
  start_date: string;
  end_date: string;
  airport_id?: number;
  route_id?: number;
}

export interface TicketStatisticsResponseDto {
  total_tickets: number;
  tickets_by_class: Record<string, number>;
  tickets_by_status: Record<string, number>;
  revenue_by_route: Array<{
    route_id: number;
    route_name: string;
    revenue: number;
  }>;
}

export interface TicketPricingDto {
  flight_id: number;
  ticket_class: TicketClass;
  passenger_count: number;
}

export interface TicketPricingResponseDto {
  base_price: number;
  taxes: number;
  fees: number;
  total_price: number;
  currency: string;
}
