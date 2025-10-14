import { Test, TestingModule } from '@nestjs/testing';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';
import { FlightEntity } from './entities/flight.entity';
import { CreateFlightDto, UpdateFlightDto } from './flights.service';

describe('FlightsController', () => {
  let controller: FlightsController;
  let service: jest.Mocked<FlightsService>;

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

  beforeEach(async () => {
    const mockFlightsService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByFlightNumber: jest.fn(),
      findByAircraft: jest.fn(),
      findByRoute: jest.fn(),
      findByAirports: jest.fn(),
      findByStatus: jest.fn(),
      findByDateRange: jest.fn(),
      createFlight: jest.fn(),
      updateFlight: jest.fn(),
      updateFlightStatus: jest.fn(),
      updateActualTimes: jest.fn(),
      assignGate: jest.fn(),
      cancelFlight: jest.fn(),
      deleteFlight: jest.fn(),
      searchFlights: jest.fn(),
      checkSeatAvailability: jest.fn(),
      calculateFlightLoad: jest.fn(),
      getFlightDetails: jest.fn(),
      getFlightStatistics: jest.fn(),
      getPassengerTicketInfo: jest.fn(),
      getFlightCrew: jest.fn(),
      getFlightBaggage: jest.fn(),
      searchFlightsPaginated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlightsController],
      providers: [
        {
          provide: FlightsService,
          useValue: mockFlightsService,
        },
      ],
    }).compile();

    controller = module.get<FlightsController>(FlightsController);
    service = module.get(FlightsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all flights', async () => {
      const mockFlights = [mockFlight];
      service.findAll.mockResolvedValue(mockFlights);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockFlights);
    });
  });

  describe('findById', () => {
    it('should return a flight by ID', async () => {
      service.findById.mockResolvedValue(mockFlight);

      const result = await controller.findById(1);

      expect(service.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFlight);
    });

    it('should return null if flight not found', async () => {
      service.findById.mockResolvedValue(null);

      const result = await controller.findById(999);

      expect(service.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('findByFlightNumber', () => {
    it('should return a flight by flight number', async () => {
      service.findByFlightNumber.mockResolvedValue(mockFlight);

      const result = await controller.findByFlightNumber('AA1234');

      expect(service.findByFlightNumber).toHaveBeenCalledWith('AA1234');
      expect(result).toEqual(mockFlight);
    });
  });

  describe('findByAircraft', () => {
    it('should return flights by aircraft ID', async () => {
      const mockFlights = [mockFlight];
      service.findByAircraft.mockResolvedValue(mockFlights);

      const result = await controller.findByAircraft(1);

      expect(service.findByAircraft).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFlights);
    });
  });

  describe('findByRoute', () => {
    it('should return flights by route ID', async () => {
      const mockFlights = [mockFlight];
      service.findByRoute.mockResolvedValue(mockFlights);

      const result = await controller.findByRoute(1);

      expect(service.findByRoute).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFlights);
    });
  });

  describe('findByAirports', () => {
    it('should return flights between airports', async () => {
      const mockFlights = [mockFlight];
      service.findByAirports.mockResolvedValue(mockFlights);

      const result = await controller.findByAirports(1, 2);

      expect(service.findByAirports).toHaveBeenCalledWith(1, 2);
      expect(result).toEqual(mockFlights);
    });
  });

  describe('findByStatus', () => {
    it('should return flights by status', async () => {
      const mockFlights = [mockFlight];
      service.findByStatus.mockResolvedValue(mockFlights);

      const result = await controller.findByStatus('scheduled');

      expect(service.findByStatus).toHaveBeenCalledWith('scheduled');
      expect(result).toEqual(mockFlights);
    });
  });

  describe('findByDateRange', () => {
    it('should return flights in date range', async () => {
      const mockFlights = [mockFlight];
      service.findByDateRange.mockResolvedValue(mockFlights);

      const result = await controller.findByDateRange('2024-01-15', '2024-01-16');

      expect(service.findByDateRange).toHaveBeenCalledWith(
        new Date('2024-01-15'),
        new Date('2024-01-16'),
      );
      expect(result).toEqual(mockFlights);
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
      service.searchFlightsPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await controller.searchFlightsPaginated(
        'JFK',
        'LAX',
        '2024-01-15',
        'scheduled',
        '1',
        '1',
        '10',
      );

      expect(service.searchFlightsPaginated).toHaveBeenCalledWith(
        {
          departure_iata: 'JFK',
          arrival_iata: 'LAX',
          departure_date: new Date('2024-01-15'),
          status: 'scheduled',
          aircraft_id: 1,
        },
        1,
        10,
      );
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should handle optional parameters', async () => {
      const mockPaginatedResult = {
        data: [mockFlight],
        total: 1,
        page: 1,
        limit: 10,
      };
      service.searchFlightsPaginated.mockResolvedValue(mockPaginatedResult);

      const result = await controller.searchFlightsPaginated();

      expect(service.searchFlightsPaginated).toHaveBeenCalledWith({}, 1, 10);
      expect(result).toEqual(mockPaginatedResult);
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
      service.searchFlights.mockResolvedValue(mockSearchResults);

      const result = await controller.searchFlights('JFK', 'LAX', '2024-01-15');

      expect(service.searchFlights).toHaveBeenCalledWith('JFK', 'LAX', new Date('2024-01-15'));
      expect(result).toEqual(mockSearchResults);
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

      service.createFlight.mockResolvedValue(mockFlight);

      const result = await controller.createFlight(createFlightDto);

      expect(service.createFlight).toHaveBeenCalledWith(createFlightDto);
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
      service.updateFlight.mockResolvedValue(updatedFlight);

      const result = await controller.updateFlight(1, updateFlightDto);

      expect(service.updateFlight).toHaveBeenCalledWith(1, updateFlightDto);
      expect(result).toEqual(updatedFlight);
    });
  });

  describe('updateFlightStatus', () => {
    it('should update flight status', async () => {
      const updatedFlight = { ...mockFlight, status: 'boarding' };
      service.updateFlightStatus.mockResolvedValue(updatedFlight);

      const result = await controller.updateFlightStatus(1, 'boarding');

      expect(service.updateFlightStatus).toHaveBeenCalledWith(1, 'boarding');
      expect(result).toEqual(updatedFlight);
    });
  });

  describe('updateActualTimes', () => {
    it('should update actual departure and arrival times', async () => {
      const actualDeparture = '2024-01-15T10:15:00Z';
      const actualArrival = '2024-01-15T14:10:00Z';
      const updatedFlight = {
        ...mockFlight,
        actual_departure: new Date(actualDeparture),
        actual_arrival: new Date(actualArrival),
      };
      service.updateActualTimes.mockResolvedValue(updatedFlight);

      const result = await controller.updateActualTimes(1, actualDeparture, actualArrival);

      expect(service.updateActualTimes).toHaveBeenCalledWith(
        1,
        new Date(actualDeparture),
        new Date(actualArrival),
      );
      expect(result).toEqual(updatedFlight);
    });
  });

  describe('assignGate', () => {
    it('should assign gate to flight', async () => {
      const updatedFlight = { ...mockFlight, gate_id: 5 };
      service.assignGate.mockResolvedValue(updatedFlight);

      const result = await controller.assignGate(1, 5);

      expect(service.assignGate).toHaveBeenCalledWith(1, 5);
      expect(result).toEqual(updatedFlight);
    });
  });

  describe('cancelFlight', () => {
    it('should cancel flight', async () => {
      const cancelledFlight = { ...mockFlight, status: 'cancelled' };
      service.cancelFlight.mockResolvedValue(cancelledFlight);

      const result = await controller.cancelFlight(1);

      expect(service.cancelFlight).toHaveBeenCalledWith(1);
      expect(result).toEqual(cancelledFlight);
    });
  });

  describe('deleteFlight', () => {
    it('should delete a flight', async () => {
      service.deleteFlight.mockResolvedValue(true);

      await controller.deleteFlight(1);

      expect(service.deleteFlight).toHaveBeenCalledWith(1);
    });
  });

  describe('checkSeatAvailability', () => {
    it('should check seat availability', async () => {
      service.checkSeatAvailability.mockResolvedValue(true);

      const result = await controller.checkSeatAvailability(1, '12A');

      expect(service.checkSeatAvailability).toHaveBeenCalledWith(1, '12A');
      expect(result).toEqual({ available: true });
    });
  });

  describe('calculateFlightLoad', () => {
    it('should calculate flight load percentage', async () => {
      service.calculateFlightLoad.mockResolvedValue(75.5);

      const result = await controller.calculateFlightLoad(1);

      expect(service.calculateFlightLoad).toHaveBeenCalledWith(1);
      expect(result).toEqual({ loadPercentage: 75.5 });
    });
  });

  describe('getFlightDetails', () => {
    it('should get flight details', async () => {
      const mockDetails = {
        flight_id: 1,
        flight_number: 'AA1234',
        departure_iata: 'JFK',
        arrival_iata: 'LAX',
        departure_city: 'New York',
        arrival_city: 'Los Angeles',
      };
      service.getFlightDetails.mockResolvedValue(mockDetails);

      const result = await controller.getFlightDetails(1);

      expect(service.getFlightDetails).toHaveBeenCalledWith(1);
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
      service.getFlightStatistics.mockResolvedValue(mockStats);

      const result = await controller.getFlightStatistics('2024-01-15');

      expect(service.getFlightStatistics).toHaveBeenCalledWith(new Date('2024-01-15'));
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
      service.getPassengerTicketInfo.mockResolvedValue(mockPassengerInfo);

      const result = await controller.getPassengerTicketInfo(1);

      expect(service.getPassengerTicketInfo).toHaveBeenCalledWith(1);
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
      service.getFlightCrew.mockResolvedValue(mockCrew);

      const result = await controller.getFlightCrew(1);

      expect(service.getFlightCrew).toHaveBeenCalledWith(1);
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
      service.getFlightBaggage.mockResolvedValue(mockBaggage);

      const result = await controller.getFlightBaggage(1);

      expect(service.getFlightBaggage).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBaggage);
    });
  });
});
