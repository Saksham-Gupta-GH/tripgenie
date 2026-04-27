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
  DollarSign,
  MapPin
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [agentPlans, setAgentPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState({
    totalPlans: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const plans = await tripService.getPlansByCreator(firebaseUser.uid);

      setAgentPlans(plans);
      setStats({
        totalPlans: plans.length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

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
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Manage Places
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Curate and manage your expert travel itineraries.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-red-50 rounded-2xl">
                <Briefcase className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Plans</p>
                <p className="text-3xl font-black text-gray-900">{stats.totalPlans}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Plans */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Your Created Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {agentPlans.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500 font-bold">You haven't created any plans yet</p>
                <Button className="mt-6" onClick={() => navigate('/agent/create-plan')}>Create Your First Plan</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {agentPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => navigate(`/traveller/plan-details/${plan.id}`)}
                    className="group flex flex-col p-5 bg-white border border-gray-100 rounded-3xl hover:shadow-xl transition-all duration-300 cursor-pointer relative"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-red-500 transition-colors line-clamp-1">
                          {plan.title}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 mt-1 flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-red-500" />
                          {plan.destination}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeletePlan(e, plan.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-6 mt-auto pt-4 border-t border-gray-50">
                      <div className="flex items-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                        <Calendar className="w-4 h-4 mr-2 text-red-500" />
                        {plan.numberOfDays} Days
                      </div>
                      <div className="flex items-center text-xs font-bold text-gray-700 uppercase tracking-wide">
                        <DollarSign className="w-4 h-4 mr-1 text-red-500" />
                        ${plan.budget}
                      </div>
                      <div className="ml-auto">
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                      </div>
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
