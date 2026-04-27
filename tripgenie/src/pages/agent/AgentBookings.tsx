import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Plan, SelectedPlan } from '../../types';
import { RefreshCw, ClipboardList, MessageSquare } from 'lucide-react';

export const AgentBookings: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [bookings, setBookings] = useState<{plan: Plan, booking: SelectedPlan}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<{[key: string]: string}>({});

  const loadData = useCallback(async () => {
    if (!firebaseUser) return;
    setIsLoading(true);
    setError(null);
    try {
      console.log('AgentBookings: Loading for user', firebaseUser.uid);
      const b = await tripService.getAllBookingsForAgent(firebaseUser.uid);
      console.log('AgentBookings: Loaded count', b.length);
      setBookings(b);
    } catch (err: any) {
      console.error('AgentBookings Error:', err);
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleUpdateStatus = async (bookingId: string, status: 'confirmed' | 'denied') => {
    try {
      const msg = replyMessage[bookingId] || '';
      await tripService.updateBookingStatus(bookingId, status, msg);
      alert(`Booking ${status} successfully!`);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert('Failed to update booking status: ' + e.message);
    }
  };

  if (isLoading) return <Layout><Loading fullScreen /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
            <p className="text-gray-600 mt-1">Review, confirm, or deny traveller bookings.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <ClipboardList className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-400">No bookings yet.</p>
              <p className="text-sm mt-2">New bookings (created after the latest update) will appear here automatically.</p>
              <Button variant="ghost" onClick={loadData} className="mt-4">Check Again</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map(({ plan, booking }) => (
              <Card key={booking.id} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{plan.title}</h3>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                          booking.status === 'denied' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-4">{plan.destination}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Traveller ID: {booking.userId.substring(0, 8)}...</span>
                        <span>Date: {new Date(booking.travelDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="w-full md:w-auto">
                      {booking.status === 'pending' && (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateStatus(booking.id, 'confirmed')}>Approve</Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-100" onClick={() => handleUpdateStatus(booking.id, 'denied')}>Decline</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-700">
                        <MessageSquare className="w-4 h-4 text-red-600" />
                        Response Message
                      </div>
                      <textarea
                        placeholder="e.g. 'Looking forward to hosting you!' or 'Sorry, we are fully booked on this date.'"
                        className="w-full p-3 border border-gray-200 rounded-xl mb-0 text-sm focus:ring-2 focus:ring-red-500 outline-none bg-gray-50"
                        rows={2}
                        value={replyMessage[booking.id] || ''}
                        onChange={e => setReplyMessage(prev => ({...prev, [booking.id]: e.target.value}))}
                      />
                    </div>
                  )}

                  {booking.status !== 'pending' && booking.agentMessage && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Your response sent:</p>
                      <p className="text-sm text-gray-700 italic">"{booking.agentMessage}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
