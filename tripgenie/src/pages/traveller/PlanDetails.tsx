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
  Star,
  CreditCard,
  Smartphone
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [paymentValue, setPaymentValue] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isBooked, setIsBooked] = useState(false);
  
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
    if (!paymentValue) {
      alert(`Please enter your ${paymentMethod === 'card' ? 'Card Number' : 'UPI ID'}`);
      return;
    }
    try {
      await tripService.selectPlan(firebaseUser.uid, planId!, new Date(bookingDate));
      alert('Booking submitted with payment! Waiting for agent confirmation.');
      setIsBooked(true);
      // Wait a bit then navigate
      setTimeout(() => navigate('/traveller/my-trips'), 5000);
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

  const qrValue = `TripGenie Booking:\nPlan: ${plan.title}\nDestination: ${plan.destination}\nUser: ${user?.name || 'Traveller'}\nDate: ${bookingDate}\nStatus: PENDING_CONFIRMATION`;

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
                    <TileLayer 
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                    />
                    <Marker position={[plan.location.lat, plan.location.lng]} />
                  </MapContainer>
                </div>
              </div>
            )}

            {user?.role === 'traveller' && !isBooked && (
              <div className="mt-8 p-6 bg-red-50 rounded-lg border border-red-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Your Booking</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Travel Date</label>
                    <input type="date" className="border border-gray-300 p-2 rounded w-full" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <div className="flex gap-4">
                      <button 
                        className={`flex-1 flex items-center justify-center gap-2 p-2 rounded border ${paymentMethod === 'card' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'}`}
                        onClick={() => { setPaymentMethod('card'); setPaymentValue(''); }}
                      >
                        <CreditCard className="w-4 h-4" /> Card
                      </button>
                      <button 
                        className={`flex-1 flex items-center justify-center gap-2 p-2 rounded border ${paymentMethod === 'upi' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'}`}
                        onClick={() => { setPaymentMethod('upi'); setPaymentValue(''); }}
                      >
                        <Smartphone className="w-4 h-4" /> UPI
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {paymentMethod === 'card' ? 'Card Number (Dummy)' : 'UPI ID (Dummy)'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={paymentMethod === 'card' ? 'xxxx-xxxx-xxxx-xxxx' : 'user@upi'} 
                    className="border border-gray-300 p-2 rounded w-full"
                    value={paymentValue}
                    onChange={(e) => setPaymentValue(e.target.value)}
                  />
                </div>

                <Button onClick={handleBook} className="w-full">Securely Book Now</Button>
              </div>
            )}

            {isBooked && (
              <div className="mt-8 p-8 bg-green-50 rounded-xl border border-green-200 text-center flex flex-col items-center">
                <div className="bg-white p-6 rounded-2xl shadow-lg mb-4">
                  <QRCodeSVG value={qrValue} size={200} />
                </div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">Booking Requested!</h3>
                <p className="text-green-700">Scan the QR code above to see your trip details. Redirecting to your trips in a few seconds...</p>
              </div>
            )}
            
            {user?.role === 'traveller' && (
              <div className="mt-12 border-t pt-8">
                <h3 className="text-xl font-bold mb-4">Rate this Plan</h3>
                <div className="flex gap-2 mb-2">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className={`w-8 h-8 cursor-pointer ${rating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} onClick={() => setRating(star)} />
                  ))}
                </div>
                <textarea className="w-full border border-gray-300 rounded p-2 mb-2" placeholder="Write a review..." value={review} onChange={(e) => setReview(e.target.value)} />
                <Button onClick={handleRate} disabled={rating === 0} variant="outline">Submit Review</Button>
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
              <CardContent><p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{dayText}</p></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};
