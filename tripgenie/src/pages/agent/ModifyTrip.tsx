import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { Modal } from '../../components/Modal';
import { tripService } from '../../services/tripService';
import { placesService } from '../../services/placesService';
import type { Trip, Place, ItineraryItem } from '../../types';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Clock,
  Save,
} from 'lucide-react';

export const ModifyTrip: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!tripId) return;
    try {
      const [tripData, allPlaces] = await Promise.all([
        tripService.getTripById(tripId),
        placesService.getAllPlaces(),
      ]);
      setTrip(tripData);
      setPlaces(allPlaces);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      void loadData();
    }
  }, [tripId, loadData]);

  const handleApprove = async () => {
    if (!trip || !user) return;
    setIsSaving(true);
    try {
      await tripService.updateTripStatus(trip.id, 'approved', user.id);
      setTrip((prev) => (prev ? { ...prev, status: 'approved' } : null));
    } catch (error) {
      console.error('Error approving trip:', error);
      alert('Failed to approve trip');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!trip) return;
    setIsSaving(true);
    try {
      await tripService.updateTripStatus(trip.id, 'rejected');
      setTrip((prev) => (prev ? { ...prev, status: 'rejected' } : null));
    } catch (error) {
      console.error('Error rejecting trip:', error);
      alert('Failed to reject trip');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPlaceToDay = (place: Place, day: number) => {
    if (!trip) return;

    const newItem: ItineraryItem = {
      placeId: place.id,
      placeName: place.name,
      startTime: '09:00',
      endTime: '11:00',
      notes: `Visit ${place.name}`,
    };

    const updatedItinerary = trip.itinerary.map((dayPlan) => {
      if (dayPlan.day === day) {
        return {
          ...dayPlan,
          items: [...dayPlan.items, newItem],
        };
      }
      return dayPlan;
    });

    setTrip((prev) =>
      prev ? { ...prev, itinerary: updatedItinerary } : null
    );
    setShowAddPlaceModal(false);
  };

  const handleRemoveItem = (day: number, itemIndex: number) => {
    if (!trip) return;

    const updatedItinerary = trip.itinerary.map((dayPlan) => {
      if (dayPlan.day === day) {
        return {
          ...dayPlan,
          items: dayPlan.items.filter((_, idx) => idx !== itemIndex),
        };
      }
      return dayPlan;
    });

    setTrip((prev) =>
      prev ? { ...prev, itinerary: updatedItinerary } : null
    );
  };

  const handleSaveChanges = async () => {
    if (!trip) return;
    setIsSaving(true);
    try {
      await tripService.updateItinerary(trip.id, trip.itinerary);
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
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
          <Button className="mt-4" onClick={() => navigate('/agent/trip-requests')}>
            Back to Requests
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
              onClick={() => navigate('/agent/trip-requests')}
            >
              Back
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            {trip.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  leftIcon={<XCircle className="w-4 h-4" />}
                  onClick={handleReject}
                  isLoading={isSaving}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Reject
                </Button>
                <Button
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                  onClick={handleApprove}
                  isLoading={isSaving}
                >
                  Approve
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              leftIcon={<Save className="w-4 h-4" />}
              onClick={handleSaveChanges}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
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
                  <span>{trip.days} days</span>
                  <span>${trip.budget} budget</span>
                </div>
              </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Itinerary */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Itinerary</h2>
          {trip.itinerary.map((dayPlan) => (
            <Card key={dayPlan.day}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center text-lg">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {dayPlan.day}
                  </span>
                  Day {dayPlan.day}
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setSelectedDay(dayPlan.day);
                    setShowAddPlaceModal(true);
                  }}
                >
                  Add Place
                </Button>
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
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-16 text-center">
                            <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                            <span className="text-xs text-gray-600">
                              {item.startTime}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {item.placeName}
                            </h4>
                            {item.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(dayPlan.day, index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Place Modal */}
      <Modal
        isOpen={showAddPlaceModal}
        onClose={() => setShowAddPlaceModal(false)}
        title={`Add Place to Day ${selectedDay}`}
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {places.map((place) => (
              <div
                key={place.id}
                onClick={() =>
                  selectedDay && handleAddPlaceToDay(place, selectedDay)
                }
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{place.name}</h4>
                  <p className="text-sm text-gray-600">{place.category}</p>
                </div>
                <Plus className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
