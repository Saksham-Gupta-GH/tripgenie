import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { tripService } from '../../services/tripService';
import {
  MapPin,
  DollarSign,
  Calendar,
  ArrowRight,
  Type,
  List,
  Map as MapIcon
} from 'lucide-react';
import { LocationPicker } from '../../components/LocationPicker';

export const CreatePlan: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    exactAddress: '',
    budget: 1000,
    numberOfDays: 3,
    itinerary: ['', '', ''],
    imageUrlsText: '',
    location: null as { lat: number; lng: number } | null
  });

  const handleDayChange = (index: number) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[index] = e.target.value;
    setFormData((prev) => ({ ...prev, itinerary: newItinerary }));
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDays = parseInt(e.target.value) || 1;
    setFormData((prev) => {
      let newItinerary = [...prev.itinerary];
      if (newDays > prev.itinerary.length) {
        newItinerary = [...newItinerary, ...Array(newDays - prev.itinerary.length).fill('')];
      } else if (newDays < prev.itinerary.length) {
        newItinerary = newItinerary.slice(0, newDays);
      }
      return { ...prev, numberOfDays: newDays, itinerary: newItinerary };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firebaseUser) {
      alert('Please wait for authentication to finish, then try again.');
      return;
    }

    const imageUrls = formData.imageUrlsText
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);

    setIsLoading(true);
    try {
      await tripService.createPlan({
        title: formData.title,
        destination: formData.destination,
        exactAddress: formData.exactAddress,
        budget: formData.budget,
        numberOfDays: formData.numberOfDays,
        itinerary: formData.itinerary,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        location: formData.location || undefined,
        createdBy: firebaseUser.uid,
      });
      
      alert('Expert plan created successfully!');
      navigate('/agent/dashboard');
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Expert Plan</h1>
          <p className="text-gray-600 mt-1">
            Build curated, clear, expert travel itineraries for travellers.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Title
                </label>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    maxLength={60}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    placeholder="e.g., Amazing 3 Days in Paris"
                  />
                </div>
              </div>

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
                      setFormData((prev) => ({ ...prev, destination: e.target.value }))
                    }
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    placeholder="Where is this plan for? (e.g., Goa, Rajasthan)"
                  />
                </div>
              </div>

              {/* Exact Location Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapIcon className="w-4 h-4 mr-1 text-gray-500" />
                  Exact Pin Location & Address (Optional)
                </label>
                <div className="mb-4">
                  <input
                    type="text"
                    value={formData.exactAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, exactAddress: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    placeholder="Manually write the exact address (e.g. A Building, B Street, Mumbai)"
                  />
                </div>
                <p className="text-xs text-gray-500 mb-2">You can also click on the map to place a precise pin.</p>
                <LocationPicker 
                  position={formData.location}
                  setPosition={(pos) => setFormData(prev => ({ ...prev, location: pos }))}
                  onAddressFound={(address) => setFormData(prev => ({ ...prev, exactAddress: address }))}
                />
              </div>

              {/* Destination Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Images (paste URLs)
                </label>
                <textarea
                  value={formData.imageUrlsText}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, imageUrlsText: e.target.value }))
                  }
                  rows={3}
                  className="w-full p-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                  placeholder="Paste one image URL per line"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Example: https://example.com/paris-1.jpg
                </p>
              </div>

              {/* Budget and Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Budget (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="10"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, budget: parseInt(e.target.value) || 0 }))
                      }
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
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
                      max="10"
                      value={formData.numberOfDays}
                      onChange={handleDaysChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Itinerary */}
              <div className="pt-4 border-t border-gray-100 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <List className="w-5 h-5 mr-2 text-red-600" />
                  Day-by-Day Itinerary
                </h3>
                <div className="space-y-4">
                  {formData.itinerary.map((dayText, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Day {index + 1}
                      </label>
                      <textarea
                        value={dayText}
                        onChange={handleDayChange(index)}
                        rows={3}
                        required
                        className="w-full p-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                        placeholder={`Describe the activities for Day ${index + 1}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="flex-1"
                  leftIcon={
                    isLoading ? undefined : <ArrowRight className="w-4 h-4" />
                  }
                >
                  {isLoading ? 'Saving...' : 'Publish Expert Plan'}
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
