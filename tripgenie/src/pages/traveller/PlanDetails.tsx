import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Plan } from '../../types';
import {
  Calendar,
  DollarSign,
  ArrowLeft,
  List,
} from 'lucide-react';

export const PlanDetails: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <Layout>
        <Loading fullScreen />
      </Layout>
    );
  }

  if (!plan) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Plan not found</h2>
          <Button
            className="mt-4"
            onClick={() => navigate('/traveller/dashboard')}
          >
            Back to Dashboard
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
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </div>
        </div>

        {/* Plan Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {plan.title}
                  </h1>
                </div>
                <p className="text-gray-700 font-medium text-lg mb-3">
                  {plan.destination}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {plan.numberOfDays} days
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />${plan.budget}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itinerary */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <List className="w-5 h-5 mr-2 text-blue-600" />
            Itinerary
          </h2>
          {plan.itinerary.map((dayText, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </span>
                  Day {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {dayText ? dayText : <span className="text-gray-400 italic">No activities planned</span>}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};
