import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Plan } from '../../types';
import {
  Map,
  Calendar,
  DollarSign,
  Trash2,
  Eye,
  Search,
} from 'lucide-react';

export const MyTrips: React.FC = () => {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setPlans((prev) => prev.filter((p) => p.id !== planId));
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
          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {plan.title}
                        </h3>
                      </div>
                      <p className="text-gray-700 font-medium mb-3">
                        {plan.destination}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {plan.numberOfDays} days
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />${plan.budget}
                        </span>
                        <span className="flex items-center">
                          <Map className="w-4 h-4 mr-1" />
                          {plan.itinerary.length} days planned
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-4 h-4" />}
                        onClick={() =>
                          navigate(`/traveller/plan-details/${plan.id}`)
                        }
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleUnselectPlan(plan.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
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
