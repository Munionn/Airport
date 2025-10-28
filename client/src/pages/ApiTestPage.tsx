import React, { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { ticketsApi, flightsApi } from '../api';

export const ApiTestPage: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testApiConnection = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      addResult('🔄 Testing API connection...');
      
      // Test 1: Basic flight API
      addResult('🔄 Testing flights API...');
      const flightResponse = await flightsApi.getById(1);
      addResult(`✅ Flight API works: ${flightResponse.data.flight_number} - $${flightResponse.data.price}`);
      
      // Test 2: Tickets API
      addResult('🔄 Testing tickets API...');
      const ticketsResponse = await ticketsApi.getByPassengerId(12, 1, 5);
      addResult(`✅ Tickets API works: Found ${ticketsResponse.data.data?.length || 0} tickets`);
      
      // Test 3: Seat availability
      addResult('🔄 Testing seat availability API...');
      const seatResponse = await ticketsApi.getSeatAvailability({
        flight_id: 1,
        include_details: true
      });
      addResult(`✅ Seat API works: ${seatResponse.data.available_seats} available seats`);
      
      addResult('🎉 All API tests passed!');
      
    } catch (error: any) {
      addResult(`❌ API test failed: ${error.message}`);
      if (error.response) {
        addResult(`❌ Response status: ${error.response.status}`);
        addResult(`❌ Response data: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const testBooking = async () => {
    setLoading(true);
    
    try {
      addResult('🔄 Testing booking API...');
      
      const bookingData = {
        flight_id: 1,
        passenger_id: 12,
        seat_number: '32D',
        class: 'economy',
        price: 150.00
      };
      
      const bookingResponse = await ticketsApi.simpleCreate(bookingData);
      addResult(`✅ Booking API works: Created ticket ${bookingResponse.data.ticket_number}`);
      
    } catch (error: any) {
      addResult(`❌ Booking test failed: ${error.message}`);
      if (error.response) {
        addResult(`❌ Response status: ${error.response.status}`);
        addResult(`❌ Response data: ${JSON.stringify(error.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>API Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button 
                onClick={testApiConnection} 
                disabled={loading}
                className="px-6"
              >
                Test API Connection
              </Button>
              <Button 
                onClick={testBooking} 
                disabled={loading}
                variant="outline"
                className="px-6"
              >
                Test Booking
              </Button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
              <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <p className="text-gray-500">No tests run yet. Click a button above to start testing.</p>
                ) : (
                  <div className="space-y-1">
                    {results.map((result, index) => (
                      <div key={index} className="text-sm font-mono">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
