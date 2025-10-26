'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { getDoctorAvailability, removeTimeSlot } from '@/lib/firebase/availability';
import { TimeSlot } from '@/lib/types';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Plus, Calendar, Clock, Trash2, AlertCircle } from 'lucide-react';

export default function ManageSlotsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'available' | 'booked'>('all');

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    if (address) {
      fetchSlots();
    }
  }, [address, isConnected, router]);

  const fetchSlots = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const availability = await getDoctorAvailability(address);

      if (availability && availability.timeSlots) {
        // Sort slots by date and time
        const sortedSlots = availability.timeSlots.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.startTime}`);
          const dateB = new Date(`${b.date}T${b.startTime}`);
          return dateA.getTime() - dateB.getTime();
        });
        setSlots(sortedSlots);
      } else {
        setSlots([]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slot: TimeSlot) => {
    if (!address) return;

    if (!confirm(`Are you sure you want to delete the slot on ${formatDate(slot.date)} at ${slot.startTime}?`)) {
      return;
    }

    try {
      setDeleting(`${slot.date}-${slot.startTime}`);
      await removeTimeSlot(address, { date: slot.date, startTime: slot.startTime });

      // Refresh slots
      await fetchSlots();

      alert('Time slot deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting slot:', error);
      alert(`Failed to delete slot: ${error.message}`);
    } finally {
      setDeleting('');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isPastSlot = (slot: TimeSlot) => {
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
    return slotDateTime < new Date();
  };

  const filteredSlots = slots.filter(slot => {
    if (filter === 'available') return !slot.isBooked && !isPastSlot(slot);
    if (filter === 'booked') return slot.isBooked;
    return true;
  });

  const stats = {
    total: slots.length,
    available: slots.filter(s => !s.isBooked && !isPastSlot(s)).length,
    booked: slots.filter(s => s.isBooked).length,
    past: slots.filter(s => isPastSlot(s)).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center max-w-md w-full border border-blue-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-secondary">Loading time slots...</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveLayout
      userType="doctor"
      title="Manage Time Slots"
      subtitle="View and manage your available consultation slots"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Total Slots</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Available</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.available}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Booked</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{stats.booked}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Past</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-600">{stats.past}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Slots Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/tasks/create"
          className="inline-flex items-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Time Slots
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Slots' },
            { key: 'available', label: 'Available Only' },
            { key: 'booked', label: 'Booked Only' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slots List */}
      {filteredSlots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlots.map((slot, index) => {
            const isPast = isPastSlot(slot);
            const slotKey = `${slot.date}-${slot.startTime}`;
            const isDeleting = deleting === slotKey;

            return (
              <div
                key={index}
                className={`glass-card rounded-xl p-4 border transition-all ${
                  slot.isBooked
                    ? 'border-purple-200 bg-purple-50'
                    : isPast
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className={`w-5 h-5 ${slot.isBooked ? 'text-purple-600' : isPast ? 'text-gray-500' : 'text-green-600'}`} />
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      slot.isBooked
                        ? 'bg-purple-100 text-purple-800'
                        : isPast
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {slot.isBooked ? 'Booked' : isPast ? 'Past' : 'Available'}
                    </span>
                  </div>
                  {!slot.isBooked && (
                    <button
                      onClick={() => handleDeleteSlot(slot)}
                      disabled={isDeleting}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete slot"
                    >
                      {isDeleting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-secondary mb-1">Date</p>
                    <p className="text-sm font-semibold text-primary">{formatDate(slot.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary mb-1">Time</p>
                    <p className="text-sm font-medium text-primary">
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                </div>

                {slot.isBooked && (
                  <div className="mt-3 p-2 bg-purple-100 rounded-lg">
                    <p className="text-xs text-purple-800 font-medium">
                      ⚠️ This slot is booked and cannot be deleted
                    </p>
                  </div>
                )}

                {isPast && !slot.isBooked && (
                  <div className="mt-3 p-2 bg-gray-100 rounded-lg">
                    <p className="text-xs text-gray-700">
                      This slot has passed
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-6 sm:p-12 text-center border border-blue-200">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-primary mb-2">
            {filter === 'all' ? 'No time slots found' : `No ${filter} slots found`}
          </h3>
          <p className="text-secondary mb-4 text-sm sm:text-base">
            {filter === 'all'
              ? "You haven't added any time slots yet."
              : `You don't have any ${filter} time slots.`
            }
          </p>
          {filter === 'all' && (
            <Link
              href="/dashboard/tasks/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Time Slot
            </Link>
          )}
        </div>
      )}
    </ResponsiveLayout>
  );
}
