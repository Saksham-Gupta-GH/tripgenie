import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Map,
  PlusCircle,
  List,
  Users,
  LogOut,
  MapPin,
  Briefcase,
  X,
} from 'lucide-react';
import type { UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems: NavItem[] = [
    // Traveller routes
    {
      path: '/traveller/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['traveller'],
    },
    {
      path: '/traveller/my-trips',
      label: 'My Trips',
      icon: <Map className="w-5 h-5" />,
      roles: ['traveller'],
    },
    // Agent routes
    {
      path: '/agent/dashboard',
      label: 'Manage Places',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['agent'],
    },
    {
      path: '/agent/create-plan',
      label: 'Create Plan',
      icon: <PlusCircle className="w-5 h-5" />,
      roles: ['agent'],
    },
    {
      path: '/agent/bookings',
      label: 'Manage Bookings',
      icon: <List className="w-5 h-5" />,
      roles: ['agent'],
    },
    // Admin routes
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['admin'],
    },
    {
      path: '/admin/users',
      label: 'User Management',
      icon: <Users className="w-5 h-5" />,
      roles: ['admin'],
    },
    {
      path: '/admin/trips',
      label: 'All Trips',
      icon: <Briefcase className="w-5 h-5" />,
      roles: ['admin'],
    },
    {
      path: '/admin/places',
      label: 'Global Places',
      icon: <MapPin className="w-5 h-5" />,
      roles: ['admin'],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">TripGenie</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-1">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-lg text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
