import React from 'react';
import { Card, CardContent, Button } from '../components/ui';
import { Search, Plane, MapPin, Calendar } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Airport Management System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Search and book flights with ease. Manage your travel plans efficiently.
        </p>
      </div>

      {/* Search Form */}
      <Card className="max-w-4xl mx-auto">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Departure airport"
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Arrival airport"
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departure Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passengers
              </label>
              <select className="input">
                <option value="1">1 Passenger</option>
                <option value="2">2 Passengers</option>
                <option value="3">3 Passengers</option>
                <option value="4">4 Passengers</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button className="w-full">
                <Search className="h-5 w-5 mr-2" />
                Search Flights
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <div className="text-center">
              <Plane className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
              <p className="text-gray-600">
                Book your flights quickly and securely with our streamlined process.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="text-center">
              <MapPin className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Global Destinations</h3>
              <p className="text-gray-600">
                Access flights to destinations worldwide with competitive prices.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <div className="text-center">
              <Calendar className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Flexible Dates</h3>
              <p className="text-gray-600">
                Find the best deals with our flexible date search options.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
