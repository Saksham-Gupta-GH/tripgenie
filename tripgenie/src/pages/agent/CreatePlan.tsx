import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { tripService } from '../../services/tripService';
import { placesService } from '../../services/placesService';
import type { Place } from '../../types';
import {
  MapPin,
  DollarSign,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const INTEREST_OPTIONS = [
  'Food & Dining',
  'Adventure',
  'History & Culture',
  'Nature',
  'Shopping',
  'Nightlife',
  'Relaxation',
  'Photography',
];

export const CreatePlan: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [formData, setFormData] = useState({
    destination: '',
    budget: 1000,
    days: 3,
    interests: [] as string[],
  });

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      const allPlaces = await placesService.getAllPlaces();
      setPlaces(allPlaces);
    } catch (error) {
      console.error('Error loading places:', error);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await tripService.createTrip(
        {
          userId: user.id,
          destination: formData.destination,
          budget: formData.budget,
          days: formData.days,
          interests: formData.interests,
          isPublic: true,
        },
        places
      );
      
      alert('Expert plan created successfully!');
      navigate('/agent/dashboard');
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Expert Plan</h1>
          <p className="text-gray-600 mt-1">
            Build curated, expert travel itineraries for travellers to discover and enjoy.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        destination: e.target.value,
                      }))
                    }
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Where do you want to go? (e.g., Goa, Rajasthan)"
                  />
                </div>
              </div>

              {/* Budget and Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="100"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          budget: parseInt(e.target.value) || 0,
                        }))
                      }
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Days
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.days}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          days: parseInt(e.target.value) || 1,
                        }))
                      }
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.interests.includes(interest)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">
                      How it works
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Provide a destination, budget, and select key interests. The system will auto-generate an estimated itinerary that you can curate for travellers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="flex-1"
                  leftIcon={
                    isLoading ? undefined : <ArrowRight className="w-4 h-4" />
                  }
                >
                  {isLoading ? 'Generating Itinerary...' : 'Create Expert Plan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/agent/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
