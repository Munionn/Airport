import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Notification';
import { Eye, EyeOff, LogIn, User, Shield, Settings } from 'lucide-react';
import type { LoginCredentials } from '../types';

type LoginFormData = LoginCredentials;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn(data);
      
      if (result.success) {
        success('Login successful!', 'Welcome back!');
        
        // Redirect based on user role
        const userRoles = result.user?.roles?.map(role => role.role_name) || [];
        console.log('User roles:', userRoles);
        
        if (userRoles.includes('admin') || userRoles.includes('operator')) {
          navigate('/admin', { replace: true });
        } else if (userRoles.includes('passenger')) {
          navigate('/user/my-tickets', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        error('Login failed', result.error);
      }
    } catch (err: any) {
      error('Login failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (email: string, password: string, role: string) => {
    setValue('email', email);
    setValue('password', password);
    console.log(`Quick login as ${role}: ${email}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Login Buttons */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Login (Development)</h3>
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => quickLogin('admin.manager@airport.com', 'password123', 'Admin')}
              className="flex items-center justify-center"
            >
              <Shield className="h-4 w-4 mr-2" />
              Login as Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => quickLogin('operator@airport.com', 'password123', 'Operator')}
              className="flex items-center justify-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Login as Operator
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => quickLogin('john.doe@example.com', 'password123', 'Passenger')}
              className="flex items-center justify-center"
            >
              <User className="h-4 w-4 mr-2" />
              Login as Passenger
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  {...register('email', { required: 'Email is required' })}
                  error={errors.email?.message}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    {...register('password', { required: 'Password is required' })}
                    error={errors.password?.message}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full flex justify-center items-center"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign in
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {/* Social login buttons can go here */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};