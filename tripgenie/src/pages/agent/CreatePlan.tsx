import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/Card';
import { LocationPicker } from '../../components/LocationPicker';
import { tripService } from '../../services/tripService';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Plus, 
  Trash2, 
  Type, 
  Map as MapIcon,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

export const CreatePlan: React.FC = () => {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    budget: 1000,
    numberOfDays: 3,
    itinerary: [''],
    imageUrls: [''],
    exactAddress: '',
    location: null as { lat: number, lng: number } | null,
  });

  const handleAddDay = () => {
    setFormData((prev) => ({
      ...prev,
      itinerary: [...prev.itinerary, ''],
    }));
  };

  const handleRemoveDay = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index),
    }));
  };

  const handleItineraryChange = (index: number, value: string) => {
    const newItinerary = [...formData.itinerary];
    newItinerary[index] = value;
    setFormData((prev) => ({ ...prev, itinerary: newItinerary }));
  };

  const handleAddImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ''],
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.imageUrls];
    newImages[index] = value;
    setFormData((prev) => ({ ...prev, imageUrls: newImages }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setIsLoading(true);

    try {
      const imageUrls = formData.imageUrls.filter(url => url.trim() !== '');
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
      alert('Failed to create plan: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Create Expert Plan</h1>
          <p className="text-gray-500 mt-2 font-medium">
            Build curated, clear, expert travel itineraries for travellers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="border-none shadow-xl shadow-gray-100 rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">Plan Title</label>
                  <div className="relative group">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-gray-900"
                      placeholder="e.g., Amazing 3 Days in Paris"
                    />
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">Destination</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => setFormData((prev) => ({ ...prev, destination: e.target.value }))}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-gray-900"
                      placeholder="Goa, Rajasthan, etc."
                    />
                  </div>
                </div>

                {/* Budget */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">Budget ($)</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData((prev) => ({ ...prev, budget: parseInt(e.target.value) }))}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-gray-900"
                    />
                  </div>
                </div>

                {/* Days */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">Total Days</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="number"
                      value={formData.numberOfDays}
                      onChange={(e) => setFormData((prev) => ({ ...prev, numberOfDays: parseInt(e.target.value) }))}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Map Location */}
              <div className="space-y-4 pt-4">
                <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider flex items-center">
                  <MapIcon className="w-5 h-5 mr-2 text-red-500" />
                  Exact Pin Location & Address
                </label>
                <div className="rounded-3xl overflow-hidden border-2 border-gray-100 p-1">
                  <LocationPicker 
                    position={formData.location}
                    setPosition={(pos) => setFormData(prev => ({ ...prev, location: pos }))}
                    onAddressFound={(addr) => setFormData(prev => ({ ...prev, exactAddress: addr }))}
                  />
                </div>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <p className="text-sm font-bold text-red-700">Selected Address:</p>
                  <p className="text-sm text-red-600 italic mt-1">{formData.exactAddress || 'Please click on the map to select a location'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Itinerary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Daily Itinerary</h2>
              <button
                type="button"
                onClick={handleAddDay}
                className="flex items-center text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 px-4 py-2 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Day
              </button>
            </div>
            <div className="grid gap-6">
              {formData.itinerary.map((day, index) => (
                <div key={index} className="group animate-slide-in">
                  <div className="flex items-center gap-4 mb-2 ml-1">
                    <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">Day {index + 1}</span>
                    {formData.itinerary.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(index)}
                        className="ml-auto p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={day}
                    onChange={(e) => handleItineraryChange(index, e.target.value)}
                    required
                    rows={4}
                    className="w-full p-5 bg-white border border-gray-200 rounded-3xl focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-gray-800 shadow-sm"
                    placeholder={`Describe activities for day ${index + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gallery</h2>
              <button
                type="button"
                onClick={handleAddImage}
                className="flex items-center text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 px-4 py-2 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Image
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 z-10">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all font-medium text-gray-900 shadow-sm"
                    placeholder="Image URL (e.g., Unsplash)"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-500 text-white py-5 rounded-3xl font-black text-xl hover:bg-red-600 focus:ring-8 focus:ring-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-red-200 flex items-center justify-center transform active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-8 h-8 mr-3 animate-spin" />
                  Publishing Expert Plan...
                </>
              ) : (
                'Publish Expert Plan'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
