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
  BookOpen,
  Search,
  MapPin
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
        {recentPlans.length > 0 && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Your Selected Plans</CardTitle>
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
                {recentPlans.map(({ plan }) => (
                  <div
                    key={plan.id}
                    onClick={() => navigate(`/traveller/plan-details/${plan.id}`)}
                    className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <h3 className="font-bold text-gray-900 truncate">
                      {plan.title}
                    </h3>
                    <h4 className="font-medium text-gray-700 truncate mt-1">
                      {plan.destination}
                    </h4>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {plan.numberOfDays} days
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />${plan.budget}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Map Explorer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 text-red-600 mr-2" />
              Explore Destinations Visually
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
              <MapContainer
                key={`${mapCenter.lat}-${mapCenter.lng}-${searchQuery}`} // Force re-render on search change to recenter
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
                      <div className="p-2">
                        <h3 className="font-bold text-lg mb-1">{plan.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{plan.exactAddress || plan.destination}</p>
                        <Button size="sm" onClick={() => navigate(`/traveller/plan-details/${plan.id}`)} className="w-full">
                          View Details
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expert Travel Plans */}
        <Card className="h-full">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 text-red-600 mr-2" />
              Discover Expert Travel Plans
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search destination or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
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
                      ? 'bg-red-600 text-white' 
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
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
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>
          )}
          <CardContent>
            {allPlans.length === 0 ? (
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
                {filteredPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex flex-col p-5 bg-red-50 rounded-xl border border-red-100 shadow-sm"
                  >
                    {plan.imageUrls && plan.imageUrls.length > 0 && (
                      <div className="mb-4 overflow-hidden rounded-lg border border-red-100 bg-white">
                        <img
                          src={plan.imageUrls[0]}
                          alt={`${plan.destination} preview`}
                          className="h-36 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div
                        className="cursor-pointer"
                        onClick={() => navigate(`/traveller/plan-details/${plan.id}`)}
                      >
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-700 transition-colors">
                          {plan.title}
                        </h3>
                        <p className="text-sm font-medium text-gray-700 mt-1">
                          {plan.destination}
                        </p>
                        {plan.exactAddress && (
                          <p className="text-xs text-gray-500 mt-1">
                            {plan.exactAddress}
                          </p>
                        )}
                        <p className="text-xs text-red-600 font-semibold mt-2">
                          Curated by Expert Agent
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={isSelecting === plan.id}
                        onClick={() => handleChoosePlan(plan.id)}
                      >
                        Select Plan
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-6 mt-4 text-sm text-gray-700">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5 text-red-600" />
                        {plan.numberOfDays} <span className="text-gray-500 ml-1">days</span>
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1.5 text-red-600" />
                        {plan.budget} <span className="text-gray-500 ml-1">est.</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Modal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        title="Select Travel Date"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Travel Date
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleConfirmSelect}
              isLoading={pendingPlanId ? isSelecting === pendingPlanId : false}
            >
              Confirm
            </Button>
            <Button
              variant="outline"
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
