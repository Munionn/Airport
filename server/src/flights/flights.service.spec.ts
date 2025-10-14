import { Test, TestingModule } from '@nestjs/testing';
import { FlightsService, CreateFlightDto, UpdateFlightDto } from './flights.service';
import { DatabaseService } from '../database/database.service';
import { FlightEntity } from './entities/flight.entity';

describe('FlightsService', () => {
  let service: FlightsService;
  let databaseService: jest.Mocked<DatabaseService>;

  const mockFlight: FlightEntity = {
    flight_id: 1,
    flight_number: 'AA1234',
    aircraft_id: 1,
    route_id: 1,
    departure_airport_id: 1,
    arrival_airport_id: 2,
    gate_id: 1,
    scheduled_departure: new Date('2024-01-15T10:00:00Z'),
    scheduled_arrival: new Date('2024-01-15T14:00:00Z'),
    actual_departure: undefined,
    actual_arrival: undefined,
    status: 'scheduled',
    price: 299.99,
  };

  const mockQueryResult = {
    rows: [mockFlight],
    rowCount: 1,
    command: 'SELECT',
    oid: 0,
    fields: [],
  };

  beforeEach(async () => {
    const mockDatabaseService = {
      query: jest.fn(),
      queryPaginated: jest.fn(),
      transaction: jest.fn(),
      bulkTransaction: jest.fn(),
      queryWithRetry: jest.fn(),
      callProcedure: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      getClient: jest.fn(),
      getPool: jest.fn(),
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightsService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<FlightsService>(FlightsService);
    databaseService = module.get(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all flights', async () => {
      const mockFlights = [mockFlight, { ...mockFlight, flight_id: 2 }];
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: mockFlights });

      const result = await service.findAll();

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flights ORDER BY scheduled_departure DESC',
      );
      expect(result).toEqual(mockFlights);
    });
  });

  describe('findById', () => {
    it('should return a flight by ID', async () => {
      databaseService.query.mockResolvedValue(mockQueryResult);

      const result = await service.findById(1);

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flights WHERE flight_id = $1',
        [1],
      );
      expect(result).toEqual(mockFlight);
    });

    it('should return null if flight not found', async () => {
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: [] });

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByFlightNumber', () => {
    it('should return a flight by flight number', async () => {
      databaseService.query.mockResolvedValue(mockQueryResult);

      const result = await service.findByFlightNumber('AA1234');

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flights WHERE flight_number = $1',
        ['AA1234'],
      );
      expect(result).toEqual(mockFlight);
    });
  });

  describe('findByAircraft', () => {
    it('should return flights by aircraft ID', async () => {
      const mockFlights = [mockFlight];
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: mockFlights });

      const result = await service.findByAircraft(1);

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flights WHERE aircraft_id = $1 ORDER BY scheduled_departure DESC',
        [1],
      );
      expect(result).toEqual(mockFlights);
    });
  });

  describe('findByRoute', () => {
    it('should return flights by route ID', async () => {
      const mockFlights = [mockFlight];
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: mockFlights });

      const result = await service.findByRoute(1);

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flights WHERE route_id = $1 ORDER BY scheduled_departure DESC',
        [1],
      );
      expect(result).toEqual(mockFlights);
    });
  });

  describe('findByAirports', () => {
    it('should return flights between airports', async () => {
      const mockFlights = [mockFlight];
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: mockFlights });

      const result = await service.findByAirports(1, 2);

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flights WHERE departure_airport_id = $1 AND arrival_airport_id = $2 ORDER BY scheduled_departure DESC',
        [1, 2],
      );
      expect(result).toEqual(mockFlights);
    });
  });

  describe('findByStatus', () => {
    it('should return flights by status', async () => {
      const mockFlights = [mockFlight];
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: mockFlights });

      const result = await service.findByStatus('scheduled');

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flights WHERE status = $1 ORDER BY scheduled_departure DESC',
        ['scheduled'],
      );
      expect(result).toEqual(mockFlights);
    });
  });

  describe('findByDateRange', () => {
    it('should return flights in date range', async () => {
      const mockFlights = [mockFlight];
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: mockFlights });

      const result = await service.findByDateRange(startDate, endDate);

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flights WHERE scheduled_departure BETWEEN $1 AND $2 ORDER BY scheduled_departure',
        [startDate, endDate],
      );
      expect(result).toEqual(mockFlights);
    });
  });

  describe('createFlight', () => {
    it('should create a new flight', async () => {
      const createFlightDto: CreateFlightDto = {
        flight_number: 'AA1234',
        aircraft_id: 1,
        route_id: 1,
        gate_id: 1,
        scheduled_departure: new Date('2024-01-15T10:00:00Z'),
        scheduled_arrival: new Date('2024-01-15T14:00:00Z'),
        price: 299.99,
      };

      databaseService.query.mockResolvedValue(mockQueryResult);

      const result = await service.createFlight(createFlightDto);

      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO flights'),
        [
          'AA1234',
          1,
          1,
          1,
          createFlightDto.scheduled_departure,
          createFlightDto.scheduled_arrival,
          299.99,
        ],
      );
      expect(result).toEqual(mockFlight);
    });
  });

  describe('updateFlight', () => {
    it('should update a flight', async () => {
      const updateFlightDto: UpdateFlightDto = {
        status: 'boarding',
        price: 350.0,
      };

      const updatedFlight = { ...mockFlight, status: 'boarding', price: 350.0 };
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: [updatedFlight] });

      const result = await service.updateFlight(1, updateFlightDto);

      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE flights SET'),
        [1, 'boarding', 350.0],
      );
      expect(result).toEqual(updatedFlight);
    });

    it('should return existing flight if no fields to update', async () => {
      const updateFlightDto: UpdateFlightDto = {};
      databaseService.query.mockResolvedValue(mockQueryResult);

      const result = await service.updateFlight(1, updateFlightDto);

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flights WHERE flight_id = $1',
        [1],
      );
      expect(result).toEqual(mockFlight);
    });
  });

  describe('updateFlightStatus', () => {
    it('should update flight status', async () => {
      const updatedFlight = { ...mockFlight, status: 'boarding' };
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: [updatedFlight] });

      const result = await service.updateFlightStatus(1, 'boarding');

      expect(databaseService.query).toHaveBeenCalledWith(
        'UPDATE flights SET status = $1 WHERE flight_id = $2 RETURNING *',
        ['boarding', 1],
      );
      expect(result).toEqual(updatedFlight);
    });
  });

  describe('updateActualTimes', () => {
    it('should update actual departure and arrival times', async () => {
      const actualDeparture = new Date('2024-01-15T10:15:00Z');
      const actualArrival = new Date('2024-01-15T14:10:00Z');
      const updatedFlight = {
        ...mockFlight,
        actual_departure: actualDeparture,
        actual_arrival: actualArrival,
      };
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: [updatedFlight] });

      const result = await service.updateActualTimes(1, actualDeparture, actualArrival);

      expect(databaseService.query).toHaveBeenCalledWith(
        'UPDATE flights SET actual_departure = $1, actual_arrival = $2 WHERE flight_id = $3 RETURNING *',
        [actualDeparture, actualArrival, 1],
      );
      expect(result).toEqual(updatedFlight);
    });
  });

  describe('assignGate', () => {
    it('should assign gate to flight', async () => {
      const updatedFlight = { ...mockFlight, gate_id: 5 };
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: [updatedFlight] });

      const result = await service.assignGate(1, 5);

      expect(databaseService.query).toHaveBeenCalledWith(
        'UPDATE flights SET gate_id = $1 WHERE flight_id = $2 RETURNING *',
        [5, 1],
      );
      expect(result).toEqual(updatedFlight);
    });
  });

  describe('cancelFlight', () => {
    it('should cancel flight by updating status', async () => {
      const cancelledFlight = { ...mockFlight, status: 'cancelled' };
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: [cancelledFlight] });

      const result = await service.cancelFlight(1);

      expect(databaseService.query).toHaveBeenCalledWith(
        'UPDATE flights SET status = $1 WHERE flight_id = $2 RETURNING *',
        ['cancelled', 1],
      );
      expect(result).toEqual(cancelledFlight);
    });
  });

  describe('deleteFlight', () => {
    it('should delete a flight', async () => {
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rowCount: 1 });

      const result = await service.deleteFlight(1);

      expect(databaseService.query).toHaveBeenCalledWith(
        'DELETE FROM flights WHERE flight_id = $1',
        [1],
      );
      expect(result).toBe(true);
    });

    it('should return false if flight not found', async () => {
      databaseService.query.mockResolvedValue({ ...mockQueryResult, rowCount: 0 });

      const result = await service.deleteFlight(999);

      expect(result).toBe(false);
    });
  });

  describe('searchFlights', () => {
    it('should search flights using database function', async () => {
      const mockSearchResults = [
        {
          flight_id: 1,
          flight_number: 'AA1234',
          scheduled_departure: new Date('2024-01-15T10:00:00Z'),
          scheduled_arrival: new Date('2024-01-15T14:00:00Z'),
          price: 299.99,
          status: 'scheduled',
          load_percentage: 75.5,
        },
      ];

      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: mockSearchResults });

      const result = await service.searchFlights('JFK', 'LAX', new Date('2024-01-15'));

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM search_flights($1, $2, $3)',
        ['JFK', 'LAX', new Date('2024-01-15')],
      );
      expect(result).toEqual(mockSearchResults);
    });
  });

  describe('checkSeatAvailability', () => {
    it('should check seat availability', async () => {
      databaseService.query.mockResolvedValue({
        rows: [{ check_seat_availability: true }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await service.checkSeatAvailability(1, '12A');

      expect(databaseService.query).toHaveBeenCalledWith('SELECT check_seat_availability($1, $2)', [
        1,
        '12A',
      ]);
      expect(result).toBe(true);
    });
  });

  describe('calculateFlightLoad', () => {
    it('should calculate flight load percentage', async () => {
      databaseService.query.mockResolvedValue({
        rows: [{ calculate_flight_load: 75.5 }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await service.calculateFlightLoad(1);

      expect(databaseService.query).toHaveBeenCalledWith('SELECT calculate_flight_load($1)', [1]);
      expect(result).toBe(75.5);
    });
  });

  describe('getFlightDetails', () => {
    it('should get flight details using view', async () => {
      const mockDetails = {
        flight_id: 1,
        flight_number: 'AA1234',
        departure_iata: 'JFK',
        arrival_iata: 'LAX',
        departure_city: 'New York',
        arrival_city: 'Los Angeles',
      };

      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: [mockDetails] });

      const result = await service.getFlightDetails(1);

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flight_details WHERE flight_id = $1',
        [1],
      );
      expect(result).toEqual(mockDetails);
    });
  });

  describe('getFlightStatistics', () => {
    it('should get flight statistics for date', async () => {
      const mockStats = {
        flight_date: '2024-01-15',
        total_flights: 10,
        completed_flights: 8,
        cancelled_flights: 1,
        delayed_flights: 1,
        average_price: 299.99,
      };

      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: [mockStats] });

      const result = await service.getFlightStatistics(new Date('2024-01-15'));

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM flight_statistics WHERE flight_date = $1',
        [new Date('2024-01-15')],
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe('getPassengerTicketInfo', () => {
    it('should get passenger ticket information', async () => {
      const mockPassengerInfo = [
        {
          passenger_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          ticket_number: 'T123456',
          class: 'economy',
          price: 299.99,
        },
      ];

      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: mockPassengerInfo });

      const result = await service.getPassengerTicketInfo(1);

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM passenger_ticket_info WHERE flight_id = $1',
        [1],
      );
      expect(result).toEqual(mockPassengerInfo);
    });
  });

  describe('getFlightCrew', () => {
    it('should get flight crew', async () => {
      const mockCrew = [
        {
          crew_id: 1,
          flight_id: 1,
          user_id: 1,
          position: 'pilot',
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@airline.com',
        },
      ];

      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: mockCrew });

      const result = await service.getFlightCrew(1);

      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT fc.*, u.first_name, u.last_name, u.email'),
        [1],
      );
      expect(result).toEqual(mockCrew);
    });
  });

  describe('getFlightBaggage', () => {
    it('should get flight baggage', async () => {
      const mockBaggage = [
        {
          baggage_id: 1,
          passenger_id: 1,
          flight_id: 1,
          baggage_tag: 'BAG001',
          weight: 23.5,
          status: 'checked_in',
          first_name: 'John',
          last_name: 'Doe',
        },
      ];

      databaseService.query.mockResolvedValue({ ...mockQueryResult, rows: mockBaggage });

      const result = await service.getFlightBaggage(1);

      expect(databaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT b.*, p.first_name, p.last_name'),
        [1],
      );
      expect(result).toEqual(mockBaggage);
    });
  });

  describe('searchFlightsPaginated', () => {
    it('should search flights with pagination', async () => {
      const mockPaginatedResult = {
        data: [mockFlight],
        total: 1,
        page: 1,
        limit: 10,
      };

      databaseService.queryPaginated.mockResolvedValue(mockPaginatedResult);

      const searchParams = {
        departure_iata: 'JFK',
        arrival_iata: 'LAX',
        departure_date: new Date('2024-01-15'),
      };

      const result = await service.searchFlightsPaginated(searchParams, 1, 10);

      expect(databaseService.queryPaginated).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM flights WHERE 1=1'),
        expect.arrayContaining(['JFK', 'LAX', new Date('2024-01-15')]),
        1,
        10,
      );
      expect(result).toEqual(mockPaginatedResult);
    });
  });
});
