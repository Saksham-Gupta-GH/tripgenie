import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Trip } from '../../types';
import {
  Map,
  Calendar,
  DollarSign,
  Trash2,
  Eye,
  Search,
} from 'lucide-react';

export const MyTrips: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrips = useCallback(async () => {
    if (!user) return;
    try {
      const userTrips = await tripService.getTripsByUser(user.id);
      setTrips(userTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm('Are you sure you want to delete this trip from your list?')) return;

    try {
      await tripService.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip');
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Selected Trips</h1>
            <p className="text-gray-600 mt-1">
              View and manage the expert travel plans you've selected
            </p>
          </div>
          <Button
            leftIcon={<Search className="w-4 h-4" />}
            onClick={() => navigate('/traveller/dashboard')}
          >
            Discover More Plans
          </Button>
        </div>

        {/* Trips List */}
        {trips.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No trips selected
              </h3>
              <p className="text-gray-500 mb-6">
                You haven't selected any expert travel plans yet.
              </p>
              <Button
                onClick={() => navigate('/traveller/dashboard')}
                leftIcon={<Search className="w-4 h-4" />}
              >
                Discover Plans
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {trips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {trip.destination}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {trip.days} days
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />${trip.budget}
                        </span>
                        <span className="flex items-center">
                          <Map className="w-4 h-4 mr-1" />
                          {trip.itinerary.reduce(
                            (acc, day) => acc + day.items.length,
                            0
                          )}{' '}
                          places
                        </span>
                      </div>
                      {trip.interests && trip.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {trip.interests.slice(0, 3).map((interest) => (
                            <span
                              key={interest}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                          {trip.interests.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{trip.interests.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-4 h-4" />}
                        onClick={() =>
                          navigate(`/traveller/trip-details/${trip.id}`)
                        }
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
