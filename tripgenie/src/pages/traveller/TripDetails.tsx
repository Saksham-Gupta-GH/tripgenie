import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Trip } from '../../types';
import {
  Calendar,
  DollarSign,
  ArrowLeft,
  Clock,
  Send,
} from 'lucide-react';

export const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      const tripData = await tripService.getTripById(tripId);
      setTrip(tripData);
    } catch (error) {
      console.error('Error loading trip:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      void loadTrip();
    }
  }, [tripId, loadTrip]);

  const handleSubmitForReview = async () => {
    if (!trip) return;
    setIsSubmitting(true);
    try {
      await tripService.updateTripStatus(trip.id, 'pending');
      setTrip((prev) => (prev ? { ...prev, status: 'pending' } : null));
    } catch (error) {
      console.error('Error submitting trip:', error);
      alert('Failed to submit trip for review');
    } finally {
      setIsSubmitting(false);
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

  if (!trip) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Trip not found</h2>
          <Button
            className="mt-4"
            onClick={() => navigate('/traveller/my-trips')}
          >
            Back to My Trips
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/traveller/my-trips')}
            >
              Back
            </Button>
          </div>
          {trip.status === 'draft' && (
            <Button
              leftIcon={<Send className="w-4 h-4" />}
              onClick={handleSubmitForReview}
              isLoading={isSubmitting}
            >
              Submit for Review
            </Button>
          )}
        </div>

        {/* Trip Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {trip.destination}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                      trip.status
                    )}`}
                  >
                    {trip.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {trip.days} days
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />${trip.budget}
                  </span>
                </div>
              </div>
              {trip.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {trip.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Itinerary */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Itinerary</h2>
          {trip.itinerary.map((dayPlan) => (
            <Card key={dayPlan.day}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {dayPlan.day}
                  </span>
                  Day {dayPlan.day}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dayPlan.items.length === 0 ? (
                  <p className="text-gray-500 italic">
                    No activities planned for this day
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dayPlan.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-16 text-center">
                          <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-600">
                            {item.startTime}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.placeName}
                          </h4>
                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.startTime} - {item.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};
