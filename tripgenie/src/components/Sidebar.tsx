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
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-100">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tighter">TripGenie</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* User info */}
          <div className="mx-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{user?.role}</p>
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
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-red-500 text-white font-bold shadow-lg shadow-red-100'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
