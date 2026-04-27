import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { tripService } from '../../services/tripService';
import type { Plan, SelectedPlan } from '../../types';

export const AgentBookings: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [bookings, setBookings] = useState<{plan: Plan, booking: SelectedPlan}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState<{[key: string]: string}>({});

  const loadData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const b = await tripService.getAllBookingsForAgent(firebaseUser.uid);
      setBookings(b);
    } catch (error) {
      console.error('Error loading bookings:', error);
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
    } catch (e) {
      console.error(e);
      alert('Failed to update booking status.');
    }
  };

  if (isLoading) return <Layout><Loading fullScreen /></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-600 mt-1">Review, confirm, or deny traveller bookings.</p>
        </div>

        {bookings.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500">No bookings yet.</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map(({ plan, booking }) => (
              <Card key={booking.id}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{plan.title}</h3>
                      <p className="text-sm text-gray-500">Destination: {plan.destination}</p>
                      <p className="text-sm text-gray-500">Traveller ID: {booking.userId}</p>
                      <p className="text-sm text-gray-500">Status: <strong className="uppercase">{booking.status}</strong></p>
                    </div>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="pt-4 border-t border-gray-100">
                      <textarea
                        placeholder="Add a message to the traveller..."
                        className="w-full p-2 border border-gray-300 rounded mb-2 text-sm"
                        value={replyMessage[booking.id] || ''}
                        onChange={e => setReplyMessage(prev => ({...prev, [booking.id]: e.target.value}))}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateStatus(booking.id, 'confirmed')}>Confirm Booking</Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleUpdateStatus(booking.id, 'denied')}>Deny Booking</Button>
                      </div>
                    </div>
                  )}
                  {booking.status !== 'pending' && booking.agentMessage && (
                    <div className="text-sm text-gray-600">
                      <strong>Your message:</strong> {booking.agentMessage}
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
