import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '../../components/ui';
import { citiesApi } from '../../api/citiesApi';
import { airportsApi } from '../../api/airportsApi';
import type { City, Airport } from '../../types';
import { Search, Plus, Edit, Trash2, Plane, MapPin, ArrowLeft } from 'lucide-react';

// Extended Airport type for this component
interface ExtendedAirport extends Airport {
  city_name?: string;
  country?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export const AdminCitiesPage: React.FC = () => {
  console.log('🏙️ AdminCitiesPage rendered!');
  console.log('📍 Current URL:', window.location.href);
  console.log('📍 Current pathname:', window.location.pathname);
  
  const [cities, setCities] = useState<City[]>([]);
  const [airports, setAirports] = useState<ExtendedAirport[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityAirports, setCityAirports] = useState<ExtendedAirport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cities from server
  const loadCities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading cities from server...');
      
      const response = await citiesApi.getAll({
        page: 1,
        limit: 100, // Load more cities
        city_name: searchTerm || undefined,
        country: selectedCountry || undefined,
      });
      
      console.log('✅ Cities loaded:', response.data);
      setCities(response.data.data || response.data);
    } catch (err: unknown) {
      console.error('❌ Error loading cities:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cities';
      setError(errorMessage);
      // Fallback to empty array
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCountry]);

  // Load airports from server
  const loadAirports = async () => {
    try {
      console.log('🔄 Loading airports from server...');
      
      const response = await airportsApi.getAll();
      
      console.log('✅ Airports loaded:', response.data);
      setAirports(response.data.data || response.data);
    } catch (err: unknown) {
      console.error('❌ Error loading airports:', err);
      // Fallback to empty array
      setAirports([]);
    }
  };

  useEffect(() => {
    loadCities();
    loadAirports();
  }, [loadCities]);

  // Reload cities when search term or country changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCities();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [loadCities]);

  const handleGoBack = () => {
    console.log('🔙 Going back to admin dashboard');
    window.location.href = '/admin';
  };

  const handleCityClick = async (city: City) => {
    try {
      console.log('🏙️ City clicked:', city.city_name);
      setSelectedCity(city);
      setLoading(true);
      setError(null);
      
      // Load airports for this specific city from server
      console.log('🔄 Loading airports for city:', city.city_id);
      const response = await airportsApi.getByCity(city.city_id);
      
      console.log('✅ City airports loaded:', response.data);
      setCityAirports(response.data.data || response.data);
    } catch (err: unknown) {
      console.error('❌ Error loading city airports:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load airports for this city';
      setError(errorMessage);
      setCityAirports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedCity(null);
    setCityAirports([]);
  };

  const filteredCities = cities; // Cities are already filtered by server

  const countries = [...new Set(cities.map(city => city.country))];

  if (selectedCity) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBackToList}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Cities</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
                  <MapPin className="h-8 w-8 text-blue-600" />
                  <span>{selectedCity.city_name}</span>
                </h1>
                <p className="text-gray-600 mt-2">
                  {selectedCity.country} • {selectedCity.region} • {cityAirports.length} airports
                </p>
              </div>
            </div>
            <Button
              onClick={handleGoBack}
              variant="outline"
            >
              ← Back to Dashboard
            </Button>
          </div>

          {/* City Info */}
          <Card>
            <CardHeader>
              <CardTitle>City Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Country</p>
                  <p className="text-lg">{selectedCity.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Region</p>
                  <p className="text-lg">{selectedCity.region}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Timezone</p>
                  <p className="text-lg">{selectedCity.timezone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Coordinates</p>
                  <p className="text-lg">{Number(selectedCity.latitude)?.toFixed(4)}, {Number(selectedCity.longitude)?.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Airports List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plane className="h-5 w-5" />
                <span>Airports in {selectedCity.city_name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading airports...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-4">
                    <Plane className="h-12 w-12 mx-auto mb-2" />
                    <p className="font-semibold">Error loading airports</p>
                    <p className="text-sm">{error}</p>
                  </div>
                  <Button onClick={() => handleCityClick(selectedCity)} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : cityAirports.length > 0 ? (
                <div className="space-y-4">
                  {cityAirports.map((airport) => (
                    <div key={airport.airport_id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{airport.airport_name}</h3>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-600">IATA:</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono">
                                {airport.iata_code}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-600">ICAO:</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-mono">
                                {airport.icao_code}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-600">Coordinates:</span>
                              <span className="text-sm text-gray-600">
                                {Number(airport.latitude)?.toFixed(4)}, {Number(airport.longitude)?.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No airports found for this city</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span>City Management</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Manage cities, regions, and view airport information
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add City</span>
            </Button>
            <Button
              onClick={handleGoBack}
              variant="outline"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cities List */}
        {loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading cities...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-red-600 mb-4">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <p className="font-semibold">Error loading cities</p>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={loadCities} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCities.map((city) => {
              const cityAirportsCount = airports.filter(airport => airport.city_id === city.city_id).length;
              
              return (
                <div 
                  key={city.city_id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleCityClick(city)}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{city.city_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{city.country}</p>
                          <p className="text-xs text-gray-500 mt-1">{city.region}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Plane className="h-4 w-4" />
                            <span className="text-sm font-medium">{cityAirportsCount}</span>
                          </div>
                          <p className="text-xs text-gray-500">airports</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{city.timezone}</span>
                          <span>{city.country_code}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredCities.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No cities found matching your search criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};