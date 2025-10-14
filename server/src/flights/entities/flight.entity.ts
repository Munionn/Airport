export interface FlightEntity {
  flight_id: number;
  flight_number: string;
  aircraft_id: number;
  route_id: number;
  departure_airport_id: number;
  arrival_airport_id: number;
  gate_id?: number;
  scheduled_departure: Date;
  scheduled_arrival: Date;
  actual_departure?: Date;
  actual_arrival?: Date;
  status: string;
  price: number;
}
