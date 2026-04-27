import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Plan } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Calendar,
  DollarSign,
  ArrowLeft,
  List,
  MapPin,
  Star
} from 'lucide-react';

// Fix for default marker icon missing in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const PlanDetails: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user, firebaseUser } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  
  const loadPlan = useCallback(async () => {
    if (!planId) return;
    try {
      const planData = await tripService.getPlanById(planId);
      setPlan(planData);
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (planId) {
      void loadPlan();
    }
  }, [planId, loadPlan]);

  const handleBook = async () => {
    if (!firebaseUser) return;
    if (!bookingDate) {
      alert('Please select a travel date');
      return;
    }
    try {
      await tripService.selectPlan(firebaseUser.uid, planId!, new Date(bookingDate));
      alert('Booking submitted! Waiting for agent confirmation.');
      navigate('/traveller/my-trips');
    } catch (e: any) {
      alert(e.message || 'Failed to book.');
    }
  };

  const handleRate = async () => {
    if (!firebaseUser || !planId) return;
    if (rating === 0) return;
    try {
      await tripService.ratePlan(planId, firebaseUser.uid, rating, review);
      alert('Thank you for rating!');
      loadPlan();
    } catch (e: any) {
      alert('Failed to submit rating.');
    }
  };

  if (isLoading) return <Layout><Loading fullScreen /></Layout>;
  if (!plan) return <Layout><div className="text-center py-12"><h2 className="text-xl">Plan not found</h2><Button onClick={() => navigate(-1)}>Back</Button></div></Layout>;

  const avgRating = plan.ratings && plan.ratings.length > 0 
    ? (plan.ratings.reduce((a, b) => a + b.rating, 0) / plan.ratings.length).toFixed(1)
    : 'No ratings yet';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4"/>} onClick={() => navigate(-1)}>Back</Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{plan.title}</h1>
            <p className="text-gray-700 font-medium text-lg mb-3">{plan.destination}</p>
            <div className="flex flex-wrap gap-4 text-gray-600 mb-6">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />{plan.numberOfDays} days</span>
              <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1" />${plan.budget}</span>
              <span className="flex items-center"><Star className="w-4 h-4 mr-1 text-yellow-500" />{avgRating}</span>
            </div>

            {plan.imageUrls && plan.imageUrls.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {plan.imageUrls.map((url, i) => (
                  <img key={i} src={url} alt={`Destination ${i+1}`} className="h-48 w-full object-cover rounded-lg" />
                ))}
              </div>
            )}

            {plan.location && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center"><MapPin className="w-5 h-5 mr-2 text-red-600" /> Exact Location</h3>
                <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
                  <MapContainer center={[plan.location.lat, plan.location.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[plan.location.lat, plan.location.lng]} />
                  </MapContainer>
                </div>
              </div>
            )}

            {user?.role === 'traveller' && (
              <div className="mt-8 p-6 bg-red-50 rounded-lg flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Book?</h3>
                  <p className="text-sm text-gray-600 mb-4">Select a travel date to request this booking from the agent.</p>
                  <input type="date" className="border border-gray-300 p-2 rounded w-full mb-4" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
                  <Button onClick={handleBook} className="w-full">Request Booking</Button>
                </div>
                <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-sm">
                  <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Scan to view</p>
                  <QRCodeSVG value={window.location.href} size={120} />
                </div>
              </div>
            )}
            
            {user?.role === 'traveller' && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Rate this Plan</h3>
                <div className="flex gap-2 mb-2">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className={`w-8 h-8 cursor-pointer ${rating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} onClick={() => setRating(star)} />
                  ))}
                </div>
                <textarea className="w-full border border-gray-300 rounded p-2 mb-2" placeholder="Write a review..." value={review} onChange={(e) => setReview(e.target.value)} />
                <Button onClick={handleRate} disabled={rating === 0}>Submit Review</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <List className="w-5 h-5 mr-2 text-red-600" />
            Itinerary
          </h2>
          {plan.itinerary.map((dayText, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">{index + 1}</span>
                  Day {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-gray-700 whitespace-pre-wrap">{dayText}</p></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};
