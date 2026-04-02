import React, { useEffect, useState } from 'react';

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
  User,
  Trash2,
} from 'lucide-react';

export const AllTrips: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const allPlans = await tripService.getAllPlans();
      setPlans(allPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await tripService.deletePlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Plans</h1>
          <p className="text-gray-600 mt-1">
            View and manage all plans in the system
          </p>
        </div>

        {/* Plans List */}
        {plans.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No plans found
              </h3>
              <p className="text-gray-500">
                No plans in the system yet.
              </p>
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
                          <User className="w-4 h-4 mr-1" />
                          Agent: {plan.createdBy.slice(0, 8)}...
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {plan.numberOfDays} days
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />${plan.budget}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
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
