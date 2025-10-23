import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlightSearchFilters } from '../components/FlightSearchFilters';
import { FlightSearchResults } from '../components/FlightSearchResults';
import { Pagination } from '../components/Pagination';
import { flightsApi } from '../api';
import { useToast } from '../components/ui/Notification';
import type { Flight, SearchFlightDto } from '../types';

export const FlightSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalFlights] = useState(0);
  const [searchParams, setSearchParams] = useState<SearchFlightDto>({});

  const handleSearch = async (filters: SearchFlightDto) => {
    setLoading(true);
    setSearchParams(filters);
    setCurrentPage(1);

    try {
      const response = await flightsApi.search(filters);
      const data = response.data;

      if (data.data) {
        setFlights(data.data);
        setTotalPages(data.totalPages || 1);
        setTotalFlights(data.total || 0);
      } else {
        setFlights([]);
        setTotalPages(1);
        setTotalFlights(0);
      }
    } catch (err: any) {
      error('Search failed', err.message || 'Failed to search flights');
      setFlights([]);
      setTotalPages(1);
      setTotalFlights(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    setLoading(true);

    try {
      const response = await flightsApi.search({
        ...searchParams,
        page,
      });
      const data = response.data;

      if (data.data) {
        setFlights(data.data);
        setTotalPages(data.totalPages || 1);
        setTotalFlights(data.total || 0);
      }
    } catch (err: any) {
      error('Failed to load page', err.message || 'Failed to load flights');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlight = (flight: Flight) => {
    navigate(`/flights/${flight.flight_id}`);
  };

  const handleBookFlight = (flight: Flight) => {
    navigate(`/user/book-flight/${flight.flight_id}`);
  };

  // Load initial flights on component mount
  useEffect(() => {
    const loadInitialFlights = async () => {
      setLoading(true);
      try {
        const response = await flightsApi.getAll(1, 10);
        const data = response.data;

        if (data.data) {
          setFlights(data.data);
        setTotalPages(data.totalPages || 1);
        setTotalFlights(data.total || 0);
        }
      } catch (err: any) {
        console.error('Failed to load initial flights:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialFlights();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Flight</h1>
          <p className="mt-2 text-gray-600">
            Search and compare flights from hundreds of airlines
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search Filters */}
          <div className="lg:col-span-1">
            <FlightSearchFilters
              onSearch={handleSearch}
              loading={loading}
            />
          </div>

          {/* Search Results */}
          <div className="lg:col-span-3">
            <FlightSearchResults
              flights={flights}
              loading={loading}
              onSelectFlight={handleSelectFlight}
              onBookFlight={handleBookFlight}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};