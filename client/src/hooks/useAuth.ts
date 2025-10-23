import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loginUser, logout, setUser, setLoading } from '../features/auth/authSlice';
import type { User, LoginCredentials, Role } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch(setLoading(true));
        const storedUser = localStorage.getItem('user');
        const storedRoles = localStorage.getItem('userRoles');
        console.log('Initializing auth:', { storedUser: !!storedUser, storedRoles: !!storedRoles });
        
        if (storedUser && storedRoles) {
          const userData: User = JSON.parse(storedUser);
          const rolesData: Role[] = JSON.parse(storedRoles);
          // Create user object with roles
          const userWithRoles: User = {
            ...userData,
            roles: rolesData
          };
          console.log('Setting user with roles:', userWithRoles);
          dispatch(setUser(userWithRoles));
        } else {
          console.log('No stored auth data found');
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('userRoles');
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch]);

  const signIn = async (credentials: LoginCredentials) => {
    try {
      const result = await dispatch(loginUser(credentials));
      
      if (loginUser.fulfilled.match(result)) {
        localStorage.setItem('user', JSON.stringify(result.payload.user));
        localStorage.setItem('userRoles', JSON.stringify(result.payload.roles));
        return { success: true, user: result.payload.user };
      } else {
        const errorMessage = result.payload as string || 'Login failed';
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const signOut = () => {
    dispatch(logout());
    localStorage.removeItem('user');
    localStorage.removeItem('userRoles');
  };

  const hasRole = (roleName: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => role.role_name === roleName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => roleNames.includes(role.role_name));
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isOperator = (): boolean => hasRole('operator');
  const isPassenger = (): boolean => hasRole('passenger');

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    hasRole,
    hasAnyRole,
    isAdmin,
    isOperator,
    isPassenger,
  };
};