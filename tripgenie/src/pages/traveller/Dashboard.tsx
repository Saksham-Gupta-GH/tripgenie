import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Trip, DashboardStats } from '../../types';
import {
  Map,
  Calendar,
  DollarSign,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const TravellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [publicTrips, setPublicTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloning, setIsCloning] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalTrips: 0,
    pendingTrips: 0,
    approvedTrips: 0,
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [userTrips, allPublicTrips] = await Promise.all([
        tripService.getTripsByUser(user.id),
        tripService.getPublicTrips(),
      ]);
      
      setTrips(userTrips);
      setPublicTrips(allPublicTrips.filter(t => t.userId !== user.id)); // Don't show own public trips here
      
      setStats({
        totalTrips: userTrips.length,
        pendingTrips: userTrips.filter((t) => t.status === 'pending').length,
        approvedTrips: userTrips.filter((t) => t.status === 'approved').length,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleChoosePlan = async (tripId: string) => {
    if (!user) return;
    setIsCloning(tripId);
    try {
      const clonedTrip = await tripService.cloneTrip(tripId, user.id);
      alert('Plan added to your trips!');
      navigate(`/traveller/trip-details/${clonedTrip.id}`);
    } catch (error) {
      console.error('Error choosing plan:', error);
      alert('Failed to choose this plan. Please try again.');
    } finally {
      setIsCloning(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Loading fullScreen />
      </Layout>
    );
  }

  const recentTrips = trips.slice(0, 3);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Ready to plan your next adventure?
            </p>
          </div>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/traveller/create-trip')}
          >
            Create New Trip
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Map className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalTrips}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingTrips}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.approvedTrips}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Recent Trips</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/traveller/my-trips')}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {recentTrips.length === 0 ? (
                <div className="text-center py-8">
                  <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No trips yet. Start planning!</p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate('/traveller/create-trip')}
                  >
                    Create Your First Trip
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTrips.map((trip) => (
                    <div
                      key={trip.id}
                      onClick={() =>
                        navigate(`/traveller/trip-details/${trip.id}`)
                      }
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {trip.destination}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {trip.days} days
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />${trip.budget}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            trip.status
                          )}`}
                        >
                          {trip.status}
                        </span>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
                Expert Travel Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {publicTrips.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No expert plans available yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publicTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="flex flex-col p-4 bg-purple-50 rounded-lg border border-purple-100"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {trip.destination}
                          </h3>
                          <p className="text-xs text-purple-600 font-medium">
                            Created by Expert Agent
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          isLoading={isCloning === trip.id}
                          onClick={() => handleChoosePlan(trip.id)}
                        >
                          Choose Plan
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {trip.days} days
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />${trip.budget}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
