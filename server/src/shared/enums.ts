// Shared enums for the airport management system
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
