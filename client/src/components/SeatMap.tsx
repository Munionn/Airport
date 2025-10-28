import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/ui';
import { User, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ticketsApi } from '../api/ticketsApi';
import type { Flight } from '../types';

interface SeatMapProps {
  flight: Flight;
  selectedSeats: string[];
  onSeatSelect: (seatNumber: string) => void;
  passengerCount: number;
  className?: string;
}

interface SeatProps {
  seatNumber: string;
  isOccupied: boolean;
  isSelected: boolean;
  isAvailable: boolean;
  onClick: () => void;
}

const Seat: React.FC<SeatProps> = ({
  seatNumber,
  isOccupied,
  isSelected,
  isAvailable,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isOccupied || !isAvailable}
      className={clsx(
        'w-8 h-8 rounded text-xs font-medium transition-colors',
        isSelected
          ? 'bg-blue-600 text-white'
          : isOccupied
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : isAvailable
          ? 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
      )}
    >
      {seatNumber}
    </button>
  );
};

export const SeatMap: React.FC<SeatMapProps> = ({
  flight,
  selectedSeats,
  onSeatSelect,
  passengerCount,
  className,
}) => {
  const [seatMap, setSeatMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real seat availability from API
  useEffect(() => {
    const fetchSeatAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching seat availability for flight:', flight.flight_id);
        
        const response = await ticketsApi.getSeatAvailability({
          flight_id: flight.flight_id,
          include_details: true
        });
        
        console.log('✅ Seat availability response:', response.data);
        
        // Process seat map data
        const seats: Record<string, boolean> = {};
        
        if (response.data.seat_map) {
          response.data.seat_map.forEach((seat: any) => {
            seats[seat.seat_number] = seat.status === 'occupied';
          });
        } else {
          // Fallback: generate seats based on capacity
          const capacity = flight.aircraft?.capacity || 150;
          for (let i = 1; i <= capacity; i++) {
            const seatNumber = `${Math.floor((i - 1) / 6) + 1}${String.fromCharCode(65 + ((i - 1) % 6))}`;
            seats[seatNumber] = false; // All available by default
          }
        }
        
        setSeatMap(seats);
        console.log('✅ Seat map loaded:', seats);
        
      } catch (err) {
        console.error('❌ Failed to fetch seat availability:', err);
        setError('Failed to load seat map');
        
        // Fallback: generate empty seat map
        const seats: Record<string, boolean> = {};
        const capacity = flight.aircraft?.capacity || 150;
        for (let i = 1; i <= capacity; i++) {
          const seatNumber = `${Math.floor((i - 1) / 6) + 1}${String.fromCharCode(65 + ((i - 1) % 6))}`;
          seats[seatNumber] = false;
        }
        setSeatMap(seats);
      } finally {
        setLoading(false);
      }
    };

    if (flight?.flight_id) {
      fetchSeatAvailability();
    }
  }, [flight?.flight_id]);

  const getSeatRows = () => {
    const rows: string[][] = [];
    const capacity = flight.aircraft?.capacity || 150;
    const seatsPerRow = 6;
    const totalRows = Math.ceil(capacity / seatsPerRow);

    for (let row = 1; row <= totalRows; row++) {
      const rowSeats: string[] = [];
      for (let seat = 0; seat < seatsPerRow; seat++) {
        const seatNumber = `${row}${String.fromCharCode(65 + seat)}`;
        rowSeats.push(seatNumber);
      }
      rows.push(rowSeats);
    }

    return rows;
  };

  const seatRows = getSeatRows();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Select Your Seats</span>
          <div className="text-sm text-gray-600">
            {selectedSeats.length} of {passengerCount} selected
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading seat map...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Legend */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>Occupied</span>
            </div>
          </div>

          {/* Aircraft Layout */}
          <div className="space-y-4">
            {/* Front of aircraft indicator */}
            <div className="text-center text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span>Cockpit</span>
              </div>
            </div>

            {/* Seat Map */}
            <div className="space-y-2">
              {seatRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-center space-x-2">
                  <div className="w-8 text-center text-xs text-gray-500 font-medium">
                    {rowIndex + 1}
                  </div>
                  <div className="flex space-x-1">
                    {row.slice(0, 3).map((seatNumber) => (
                      <Seat
                        key={seatNumber}
                        seatNumber={seatNumber}
                        isOccupied={seatMap[seatNumber] || false}
                        isSelected={selectedSeats.includes(seatNumber)}
                        isAvailable={!seatMap[seatNumber]}
                        onClick={() => onSeatSelect(seatNumber)}
                      />
                    ))}
                  </div>
                  <div className="w-4"></div>
                  <div className="flex space-x-1">
                    {row.slice(3).map((seatNumber) => (
                      <Seat
                        key={seatNumber}
                        seatNumber={seatNumber}
                        isOccupied={seatMap[seatNumber] || false}
                        isSelected={selectedSeats.includes(seatNumber)}
                        isAvailable={!seatMap[seatNumber]}
                        onClick={() => onSeatSelect(seatNumber)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Back of aircraft indicator */}
            <div className="text-center text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <span>Exit</span>
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
              </div>
            </div>
          </div>

          {/* Selected Seats Summary */}
          {selectedSeats.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Selected Seats:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <div
                    key={seat}
                    className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                  >
                    <span>{seat}</span>
                    <button
                      onClick={() => onSeatSelect(seat)}
                      className="hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
