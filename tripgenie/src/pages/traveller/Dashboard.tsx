import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Plan } from '../../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
  Search,
  MapPin,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';

// Fix for default marker icon missing in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const TravellerDashboard: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [myPlans, setMyPlans] = useState<{ plan: Plan; booking: any }[]>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [travelDate, setTravelDate] = useState('');
  
  const [showMap, setShowMap] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);

  const loadData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const [selectedPlans, publicPlans] = await Promise.all([
        tripService.getSelectedPlansForUser(firebaseUser.uid),
        tripService.getAllPlans(),
      ]);
      
      setMyPlans(selectedPlans);
      setAllPlans(publicPlans);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleChoosePlan = (planId: string) => {
    if (!firebaseUser) return;
    setPendingPlanId(planId);
    setTravelDate('');
    setIsDateModalOpen(true);
  };

  const handleConfirmSelect = async () => {
    if (!firebaseUser || !pendingPlanId) return;
    if (!travelDate) {
      alert('Please select a travel date.');
      return;
    }

    setIsSelecting(pendingPlanId);
    try {
      await tripService.selectPlan(
        firebaseUser.uid,
        pendingPlanId,
        new Date(`${travelDate}T00:00:00`)
      );
      setIsDateModalOpen(false);
      setPendingPlanId(null);
      alert('Plan added to your trips!');
      navigate(`/traveller/plan-details/${pendingPlanId}`);
    } catch (error: any) {
      console.error('Error choosing plan:', error);
      alert(error.message || 'Failed to select this plan. Please try again.');
    } finally {
      setIsSelecting(null);
    }
  };

  const filteredPlans = allPlans.filter(plan => {
    const q = searchQuery.toLowerCase();
    return plan.destination.toLowerCase().includes(q) || 
           plan.title.toLowerCase().includes(q) ||
           (plan.exactAddress && plan.exactAddress.toLowerCase().includes(q));
  });

  const uniqueDestinations = Array.from(
    new Set(allPlans.map((p) => p.destination))
  ).sort();

  if (isLoading) {
    return (
      <Layout>
        <Loading fullScreen />
      </Layout>
    );
  }

  const recentPlans = myPlans.slice(0, 3);

  // Use map center based on first filtered plan with a location, or default to world view
  const mapCenter = filteredPlans.find(p => p.location)?.location || { lat: 20.5937, lng: 78.9629 };
  const mapZoom = filteredPlans.length > 0 && filteredPlans[0].location ? 5 : 2;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Ready for your next adventure?
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none shadow-sm transition-all"
              />
            </div>
            <button 
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 shadow-lg hover:shadow-red-200/50 w-full sm:w-auto justify-center ${
                showMap 
                  ? 'bg-gray-800 text-white hover:bg-gray-900' 
                  : 'bg-red-600 text-white hover:bg-red-700 animate-pulse-slow'
              }`}
            >
              <MapIcon className={`w-5 h-5 ${!showMap ? 'animate-bounce' : ''}`} />
              {showMap ? 'Close Map' : 'Explore Map'}
            </button>
          </div>
        </div>

        {/* Selected Trips */}
        {recentPlans.length > 0 && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100">
              <CardTitle>Your Upcoming Trips</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/traveller/my-trips')}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recentPlans.map(({ plan }) => (
                  <div
                    key={plan.id}
                    onClick={() => navigate(`/traveller/plan-details/${plan.id}`)}
                    className="flex flex-col p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-all cursor-pointer border border-red-100 shadow-sm"
                  >
                    <h3 className="font-bold text-gray-900 truncate">
                      {plan.title}
                    </h3>
                    <h4 className="font-medium text-gray-600 truncate mt-1">
                      {plan.destination}
                    </h4>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 font-medium">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-red-500" />
                        {plan.numberOfDays}d
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-red-500" />${plan.budget}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Map Explorer (Conditional) */}
        {showMap && (
          <Card className="overflow-hidden border-2 border-red-100">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center text-red-700">
                <MapPin className="w-5 h-5 mr-2" />
                World Explorer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] w-full relative z-0">
                <MapContainer
                  key={`${mapCenter.lat}-${mapCenter.lng}-${searchQuery}`} 
                  center={[mapCenter.lat, mapCenter.lng]} 
                  zoom={mapZoom} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  {filteredPlans.map(plan => plan.location && (
                    <Marker key={plan.id} position={[plan.location.lat, plan.location.lng]}>
                      <Popup>
                        <div className="p-2 min-w-[150px]">
                          <h3 className="font-bold text-gray-900 mb-1">{plan.title}</h3>
                          <p className="text-xs text-gray-600 mb-3">{plan.destination}</p>
                          <Button size="sm" onClick={() => navigate(`/traveller/plan-details/${plan.id}`)} className="w-full">
                            Details
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Big Discover Button */}
        <div className="flex justify-center py-4">
          <button 
            onClick={() => setShowAllPlans(!showAllPlans)}
            className="group relative inline-flex items-center justify-center px-10 py-6 font-bold text-white transition-all duration-200 bg-red-600 font-pj rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 hover:bg-red-700 shadow-xl"
          >
            <Sparkles className="w-6 h-6 mr-3 animate-pulse" />
            <span className="text-xl">Discover Expert Travel Plans</span>
            {showAllPlans ? <ChevronUp className="w-6 h-6 ml-3" /> : <ChevronDown className="w-6 h-6 ml-3" />}
          </button>
        </div>

        {/* Expert Travel Plans List (Conditional) */}
        {showAllPlans && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Featured Itineraries</h2>
            </div>

            {uniqueDestinations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSearchQuery('')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    searchQuery === '' 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'bg-white text-gray-600 hover:bg-red-50 border border-gray-200'
                  }`}
                >
                  All
                </button>
                {uniqueDestinations.map(dest => (
                  <button
                    key={dest}
                    onClick={() => setSearchQuery(dest)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      searchQuery.toLowerCase() === dest.toLowerCase()
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-red-50 border border-gray-200'
                    }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-xl text-gray-500 font-medium">No plans found matching your search.</p>
                  <Button variant="ghost" onClick={() => setSearchQuery('')} className="mt-4">Clear Search</Button>
                </div>
              ) : (
                filteredPlans.map((plan) => (
                  <Card key={plan.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-none shadow-lg">
                    {plan.imageUrls && plan.imageUrls.length > 0 && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={plan.imageUrls[0]}
                          alt={plan.destination}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-red-600 shadow-sm">
                          ${plan.budget}
                        </div>
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors">
                            {plan.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {plan.destination}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 mb-6">
                        <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <Calendar className="w-4 h-4 mr-1.5 text-red-500" />
                          {plan.numberOfDays} Days
                        </div>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <Star className="w-4 h-4 mr-1.5 text-yellow-500 fill-yellow-500" />
                          {plan.ratings && plan.ratings.length > 0 
                            ? (plan.ratings.reduce((a, b) => a + b.rating, 0) / plan.ratings.length).toFixed(1)
                            : 'New'}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => navigate(`/traveller/plan-details/${plan.id}`)}
                        >
                          View Plan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChoosePlan(plan.id)}
                        >
                          <Sparkles className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      <Modal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        title="Quick Book"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select your preferred travel date to get started with this expert plan.</p>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Preferred Start Date
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              required
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              className="flex-1"
              onClick={handleConfirmSelect}
              isLoading={isSelecting !== null}
            >
              Continue to Details
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDateModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
