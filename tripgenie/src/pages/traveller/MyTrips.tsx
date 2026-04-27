import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Plan } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  Map,
  Calendar,
  DollarSign,
  Trash2,
  Eye,
  Search,
  QrCode
} from 'lucide-react';

export const MyTrips: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<{plan: Plan, booking: any}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const userPlans = await tripService.getSelectedPlansForUser(firebaseUser.uid);
      setPlans(userPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const handleUnselectPlan = async (planId: string) => {
    if (!firebaseUser) return;
    if (!window.confirm('Are you sure you want to remove this plan from your list?')) return;

    try {
      await tripService.unselectPlan(firebaseUser.uid, planId);
      setPlans((prev) => prev.filter((p) => p.plan.id !== planId));
    } catch (error) {
      console.error('Error removing plan:', error);
      alert('Failed to remove plan');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Loading fullScreen />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Selected Plans</h1>
            <p className="text-gray-600 mt-1">
              View and manage the expert travel plans you've selected
            </p>
          </div>
          <Button
            leftIcon={<Search className="w-4 h-4" />}
            onClick={() => navigate('/traveller/dashboard')}
          >
            Discover More Plans
          </Button>
        </div>

        {/* Plans List */}
        {plans.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No plans selected
              </h3>
              <p className="text-gray-500 mb-6">
                You haven't selected any expert travel plans yet.
              </p>
              <Button
                onClick={() => navigate('/traveller/dashboard')}
                leftIcon={<Search className="w-4 h-4" />}
              >
                Discover Plans
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {plans.map(({ plan, booking }) => (
              <Card key={booking.id} className="hover:shadow-lg transition-all border-none shadow-md overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Plan Info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{plan.title}</h3>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                          booking.status === 'denied' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status || 'pending'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 font-medium text-lg mb-4 flex items-center">
                        <Map className="w-4 h-4 mr-2 text-red-600" />
                        {plan.destination}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Duration</p>
                          <p className="text-sm font-bold text-gray-900 flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5 text-red-600" />
                            {plan.numberOfDays} Days
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Est. Budget</p>
                          <p className="text-sm font-bold text-gray-900 flex items-center">
                            <DollarSign className="w-4 h-4 mr-1.5 text-red-600" />
                            ${plan.budget}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg col-span-2 sm:col-span-1">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Travel Date</p>
                          <p className="text-sm font-bold text-gray-900">
                            {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'TBD'}
                          </p>
                        </div>
                      </div>

                      {booking.agentMessage && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg">
                          <p className="text-xs font-bold text-red-800 uppercase mb-1">Message from Agent</p>
                          <p className="text-sm text-gray-700 italic">"{booking.agentMessage}"</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Eye className="w-4 h-4" />}
                          onClick={() => navigate(`/traveller/plan-details/${plan.id}`)}
                        >
                          View Full Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<QrCode className="w-4 h-4" />}
                          onClick={() => setShowQR(showQR === booking.id ? null : booking.id)}
                        >
                          {showQR === booking.id ? 'Hide Pass' : 'Show Trip Pass'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleUnselectPlan(plan.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          Cancel Trip
                        </Button>
                      </div>
                    </div>

                    {/* QR Section (Slide-in effect) */}
                    {showQR === booking.id && (
                      <div className="bg-red-600 p-8 flex flex-col items-center justify-center lg:w-72 transition-all animate-fade-in">
                        <div className="bg-white p-4 rounded-xl shadow-inner mb-4">
                          <QRCodeSVG 
                            value={`TripGenie Pass\nPlan: ${plan.title}\nUser: ${user?.name}\nDate: ${new Date(booking.travelDate).toLocaleDateString()}\nStatus: ${booking.status}`} 
                            size={160} 
                          />
                        </div>
                        <p className="text-white text-xs font-bold uppercase tracking-tighter text-center">
                          Digital Trip Pass<br/>
                          <span className="opacity-70 font-normal">Scan during check-in</span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
