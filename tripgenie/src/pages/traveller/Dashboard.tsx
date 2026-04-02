import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Trip } from '../../types';
import {

  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
  BookOpen,
  Search,
} from 'lucide-react';

export const TravellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [publicTrips, setPublicTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloning, setIsCloning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [userTrips, allPublicTrips] = await Promise.all([
        tripService.getTripsByUser(user.id),
        tripService.getPublicTrips(),
      ]);
      
      setMyTrips(userTrips);
      setPublicTrips(allPublicTrips.filter(t => t.userId !== user.id)); // Don't show own public trips if any
      
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

  const filteredPlans = publicTrips.filter(plan => 
    plan.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueDestinations = Array.from(
    new Set(publicTrips.map((p) => p.destination))
  ).sort();

  if (isLoading) {
    return (
      <Layout>
        <Loading fullScreen />
      </Layout>
    );
  }

  const recentTrips = myTrips.slice(0, 3);

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
              Discover and select expert travel plans tailored for you.
            </p>
          </div>
        </div>

        {/* Selected Trips */}
        {recentTrips.length > 0 && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Your Selected Trips</CardTitle>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recentTrips.map((trip) => (
                  <div
                    key={trip.id}
                    onClick={() => navigate(`/traveller/trip-details/${trip.id}`)}
                    className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-900 truncate">
                      {trip.destination}
                    </h3>
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
            </CardContent>
          </Card>
        )}

        {/* Expert Travel Plans */}
        <Card className="h-full">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
              Discover Expert Travel Plans
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              />
            </div>
          </CardHeader>
          {uniqueDestinations.length > 0 && (
            <div className="px-6 pb-2">
              <p className="text-sm text-gray-500 mb-2 font-medium">Browse by Destination:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSearchQuery('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    searchQuery === '' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  All Destinations
                </button>
                {uniqueDestinations.map(dest => (
                  <button
                    key={dest}
                    onClick={() => setSearchQuery(dest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      searchQuery.toLowerCase() === dest.toLowerCase()
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>
          )}
          <CardContent>
            {publicTrips.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No expert plans available at the moment.</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No plans found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlans.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex flex-col p-5 bg-purple-50 rounded-xl border border-purple-100 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="cursor-pointer"
                        onClick={() => navigate(`/traveller/trip-details/${trip.id}`)}
                      >
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-700 transition-colors">
                          {trip.destination}
                        </h3>
                        <p className="text-xs text-purple-600 font-semibold mt-1">
                          Curated by Expert Agent
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={isCloning === trip.id}
                        onClick={() => handleChoosePlan(trip.id)}
                      >
                        Select Plan
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-6 mt-4 text-sm text-gray-700">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5 text-purple-600" />
                        {trip.days} <span className="text-gray-500 ml-1">days</span>
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1.5 text-purple-600" />
                        {trip.budget} <span className="text-gray-500 ml-1">est.</span>
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-purple-100 flex flex-wrap gap-2">
                       {trip.interests && trip.interests.map(interest => (
                         <span key={interest} className="px-2.5 py-1 bg-white text-purple-700 text-xs rounded-md border border-purple-100">
                           {interest}
                         </span>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
};
