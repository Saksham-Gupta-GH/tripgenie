import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import { userService } from '../../services/userService';
import {
  Users,
  Map,
  UserCheck,
  Briefcase,
  Shield,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    travellers: 0,
    agents: 0,
    admins: 0,
    totalPlans: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [userStats, plans] = await Promise.all([
        userService.getUserStats(),
        tripService.getAllPlans(),
      ]);

      setStats({
        ...userStats,
        totalPlans: plans.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Loading fullScreen />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}! System overview and management.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Users className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Map className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Plans</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalPlans}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Briefcase className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Travel Agents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.agents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              User Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-red-50 rounded-lg">
                <UserCheck className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Travellers</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.travellers}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-orange-50 rounded-lg">
                <Briefcase className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Agents</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.agents}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-red-50 rounded-lg">
                <Shield className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.admins}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/admin/users')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Users className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      User Management
                    </h3>
                    <p className="text-sm text-gray-600">
                      Manage users and roles
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/admin/trips')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Map className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">All Plans</h3>
                    <p className="text-sm text-gray-600">
                      View all plans in system
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
