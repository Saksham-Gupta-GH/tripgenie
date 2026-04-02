import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Plan } from '../../types';
import {
  List,
  ArrowRight,
  Briefcase,
  Sparkles,
  Trash2,
  Calendar,
  DollarSign
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agentPlans, setAgentPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState({
    totalPlans: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const plans = await tripService.getPlansByCreator(user.id);

      setAgentPlans(plans);
      setStats({
        totalPlans: plans.length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDeletePlan = async (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await tripService.deletePlan(planId);
      setAgentPlans(prev => prev.filter(t => t.id !== planId));
      setStats(prev => ({ ...prev, totalPlans: prev.totalPlans - 1 }));
    } catch (error) {
      console.error('Failed to delete plan', error);
      alert('Failed to delete plan.');
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
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Curate travel experiences and manage your plans
            </p>
          </div>
          <Button
            leftIcon={<Sparkles className="w-4 h-4" />}
            onClick={() => navigate('/agent/create-plan')}
          >
            Create Expert Plan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Your Plans</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalPlans}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Your Plans */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Your Created Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {agentPlans.length === 0 ? (
              <div className="text-center py-8">
                <List className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">You haven't created any plans yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agentPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => navigate(`/traveller/plan-details/${plan.id}`)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 truncate max-w-sm">
                        {plan.title}
                      </h3>
                      <h4 className="font-medium text-gray-700">
                        {plan.destination}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {plan.numberOfDays} days
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />${plan.budget}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={(e) => handleDeletePlan(e, plan.id)}
                      >
                        Delete
                      </Button>
                      <ArrowRight className="w-5 h-5 text-gray-400 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
