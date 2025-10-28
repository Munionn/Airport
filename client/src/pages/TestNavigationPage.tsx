import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui';

export const TestNavigationPage: React.FC = () => {
  const location = useLocation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">🧪 Test Navigation Page</h1>
        <p className="text-gray-600 mt-2">
          Current Path: <span className="font-mono text-blue-600">{location.pathname}</span>
        </p>

        <Card>
          <CardHeader>
            <CardTitle>🔗 Test Admin Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/admin" 
                className="p-4 border rounded-lg hover:bg-gray-50 text-center"
                onClick={() => console.log('🧪 Test: Clicking /admin')}
              >
                <div className="font-semibold">Admin Dashboard</div>
                <div className="text-sm text-gray-500">/admin</div>
              </Link>
              
              <Link 
                to="/admin/cities" 
                className="p-4 border rounded-lg hover:bg-gray-50 text-center"
                onClick={() => console.log('🧪 Test: Clicking /admin/cities')}
              >
                <div className="font-semibold">Cities</div>
                <div className="text-sm text-gray-500">/admin/cities</div>
              </Link>
              
              <Link 
                to="/admin/flights" 
                className="p-4 border rounded-lg hover:bg-gray-50 text-center"
                onClick={() => console.log('🧪 Test: Clicking /admin/flights')}
              >
                <div className="font-semibold">Flights</div>
                <div className="text-sm text-gray-500">/admin/flights</div>
              </Link>
              
              <Link 
                to="/admin/users" 
                className="p-4 border rounded-lg hover:bg-gray-50 text-center"
                onClick={() => console.log('🧪 Test: Clicking /admin/users')}
              >
                <div className="font-semibold">Users</div>
                <div className="text-sm text-gray-500">/admin/users</div>
              </Link>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Instructions:</h3>
              <ol className="mt-2 text-sm text-yellow-700 list-decimal list-inside space-y-1">
                <li>Login as admin.manager@airport.com</li>
                <li>Click on the links above</li>
                <li>Check console for navigation logs</li>
                <li>Verify URL changes and page content updates</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};