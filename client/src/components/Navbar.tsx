import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import { 
  Home, 
  Plane, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building,
  Users,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, roles } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('user');
    localStorage.removeItem('userRoles');
    navigate('/');
  };

  const handleNavigation = (href: string, name: string) => {
    console.log('🚀 NAVIGATION:', { 
      name, 
      href,
      currentPath: location.pathname,
      targetPath: href
    });
    
    // Use React Router navigation instead of window.location.href
    navigate(href);
  };


  // Close admin menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const adminMenu = target.closest('.admin-dropdown-menu');
      const adminButton = target.closest('.admin-panel-button');
      
      if (isAdminMenuOpen && !adminMenu && !adminButton) {
        console.log('🔥 Clicking outside admin menu - closing it');
        setIsAdminMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAdminMenuOpen]);

  const isAdmin = roles.some(role => role.role_name === 'admin');
  const isOperator = roles.some(role => role.role_name === 'operator');

  const navigation = [
    { name: 'Home', href: '/', icon: Home, show: true },
    { name: 'Flights', href: '/flights', icon: Plane, show: true },
    { name: 'My Tickets', href: '/user/my-tickets', icon: User, show: isAuthenticated },
    { name: 'Profile', href: '/user/profile', icon: User, show: isAuthenticated },
    { name: 'Admin Panel', href: '/admin', icon: Settings, show: isAdmin || isOperator },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: Settings },
    { name: 'Flights', href: '/admin/flights', icon: Plane },
    { name: 'Aircraft', href: '/admin/aircraft', icon: Plane },
    { name: 'Passengers', href: '/admin/passengers', icon: User },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Cities', href: '/admin/cities', icon: Building },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  const visibleNavigation = navigation.filter(item => item.show);

  // Debug logging for admin navigation
  console.log('🔍 Navbar Debug for admin.manager@airport.com:', {
    isAuthenticated,
    roles: roles.map(r => r.role_name),
    isAdmin,
    isOperator,
    user: user?.email,
    visibleNavigation: visibleNavigation.map(n => n.name),
    adminNavigation: adminNavigation.map(n => n.name),
    location: location.pathname,
    shouldShowAdminPanel: isAdmin || isOperator,
    adminPanelItem: navigation.find(n => n.name === 'Admin Panel'),
    isAdminMenuOpen,
    dropdownShouldShow: isAdminMenuOpen && (isAdmin || isOperator)
  });

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Airport Management
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {visibleNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              
              // Special handling for Admin Panel dropdown
              if (item.name === 'Admin Panel' && (isAdmin || isOperator)) {
                console.log('Rendering Admin Panel dropdown:', { 
                  itemName: item.name, 
                  isAdmin, 
                  isOperator, 
                  shouldShow: isAdmin || isOperator 
                });
                return (
                  <div key={item.name} className="relative">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔥 Admin Panel Button Clicked:', {
                          isAdminMenuOpen,
                          willToggle: !isAdminMenuOpen
                        });
                        setIsAdminMenuOpen(!isAdminMenuOpen);
                      }}
                      className={`admin-panel-button flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname.startsWith('/admin')
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    
                    {/* Admin Dropdown Menu */}
                    {isAdminMenuOpen && (
                      <div className="admin-dropdown-menu absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          {adminNavigation.map((adminItem) => {
                            const isActiveAdmin = location.pathname === adminItem.href;
                            return (
                              <a
                                key={adminItem.name}
                                href={adminItem.href}
                                onClick={() => {
                                  console.log('🔥 LINK CLICK:', {
                                    name: adminItem.name,
                                    href: adminItem.href,
                                    currentPath: location.pathname
                                  });
                                  setIsAdminMenuOpen(false);
                                }}
                                className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                                  isActiveAdmin
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <adminItem.icon className="h-4 w-4" />
                                <span>{adminItem.name}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              
              console.log('Rendering regular nav item:', { 
                itemName: item.name, 
                href: item.href, 
                isActive,
                show: item.show 
              });
              
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    console.log('🚀 Regular Button Clicked:', {
                      name: item.name,
                      href: item.href,
                      currentPath: location.pathname,
                      targetPath: item.href
                    });
                    handleNavigation(item.href, item.name);
                  }}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">{user?.first_name} {user?.last_name}</div>
                    <div className="text-xs text-gray-500">
                      {roles.map(role => role.role_name).join(', ')}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {visibleNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                
                // Special handling for Admin Panel in mobile
                if (item.name === 'Admin Panel' && (isAdmin || isOperator)) {
                  return (
                    <div key={item.name}>
                      <div className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Admin Functions
                      </div>
                      {adminNavigation.map((adminItem) => {
                        const isActiveAdmin = location.pathname === adminItem.href;
                        return (
                          <a
                            key={adminItem.name}
                            href={adminItem.href}
                            onClick={() => {
                              console.log('🔥 MOBILE LINK CLICK:', {
                                name: adminItem.name,
                                href: adminItem.href,
                                currentPath: location.pathname
                              });
                              setIsMobileMenuOpen(false);
                            }}
                            className={`flex items-center space-x-2 px-6 py-2 rounded-md text-base font-medium transition-colors ${
                              isActiveAdmin
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <adminItem.icon className="h-4 w-4" />
                            <span>{adminItem.name}</span>
                          </a>
                        );
                      })}
                    </div>
                  );
                }
                
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      console.log('🚀 Mobile Regular Button Clicked:', {
                        name: item.name,
                        href: item.href,
                        currentPath: location.pathname,
                        targetPath: item.href
                      });
                      handleNavigation(item.href, item.name);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors w-full text-left ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
              
              {isAuthenticated ? (
                <div className="pt-4 border-t">
                  <div className="px-3 py-2 text-sm text-gray-700">
                    <div className="font-medium">{user?.first_name} {user?.last_name}</div>
                    <div className="text-xs text-gray-500">
                      {roles.map(role => role.role_name).join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t space-y-2">
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
