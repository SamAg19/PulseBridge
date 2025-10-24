'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { getTasksByDoctor, updateTask } from '@/lib/firebase/firestore';
import { Task } from '@/lib/types';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Plus, FileText, Clock, DollarSign, Eye, Edit, Trash2 } from 'lucide-react';

interface TaskWithId extends Task {
  id: string;
}

export default function TasksPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingTasks, setPublishingTasks] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    const fetchTasks = async () => {
      if (address) {
        try {
          const tasksList = await getTasksByDoctor(address);
          setTasks(tasksList as TaskWithId[]);
        } catch (error) {
          console.error('Error fetching tasks:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTasks();
  }, [address, isConnected, router]);

  const handlePublishToggle = async (taskId: string, currentStatus: string) => {
    try {
      setPublishingTasks(prev => new Set(prev).add(taskId));

      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const updates: Partial<Task> = {
        status: newStatus as 'draft' | 'published' | 'archived'
      };

      if (newStatus === 'published') {
        updates.publishedAt = new Date();
      }

      await updateTask(taskId, updates);

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus as 'draft' | 'published' | 'archived', publishedAt: updates.publishedAt }
            : task
        )
      );

      // Show success notification
      setNotification({
        message: newStatus === 'published'
          ? 'Service published! It\'s now visible to patients.'
          : 'Service unpublished and hidden from patients.',
        type: 'success'
      });

      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error('Error updating task status:', error);
      setNotification({
        message: 'Failed to update task status. Please try again.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setPublishingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'consultation': return '🩺';
      case 'procedure': return '⚕️';
      case 'followup': return '📋';
      default: return '🏥';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consultation': return 'from-blue-500 to-blue-600';
      case 'procedure': return 'from-purple-500 to-purple-600';
      case 'followup': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (!isConnected) return null;

  return (
    <ResponsiveLayout
      userType="doctor"
      title="My Services"
      subtitle="Manage your healthcare services and consultations"
    >
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${notification.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
          }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {notification.message}
          </div>
        </div>
      )}
      <nav className="glass-card border-b border-blue-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <Link
            href="/dashboard/tasks/create"
            className="btn-primary text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300"
          >
            + Create Service
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">My Services</h1>
          <p className="text-secondary text-lg">Manage your medical services and appointments</p>

          <div className="mt-4 glass-card rounded-xl p-4 border border-blue-200 bg-blue-50">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Publishing Your Services</h4>
                <p className="text-blue-800 text-sm">
                  When you publish a service, it becomes visible to patients on the platform. They can view your profile,
                  see your services, book appointments, and make payments. Unpublished services remain as drafts and are only visible to you.
                </p>
              </div>
            </div>
          </div>

          {tasks.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card rounded-xl p-4 border border-blue-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{tasks.length}</div>
                    <div className="text-sm text-secondary">Total Services</div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-4 border border-green-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {tasks.filter(task => (task.status || 'draft') === 'published').length}
                    </div>
                    <div className="text-sm text-secondary">Published</div>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {tasks.filter(task => (task.status || 'draft') === 'draft').length}
                    </div>
                    <div className="text-sm text-secondary">Drafts</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-xl text-secondary">Loading services...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-primary mb-3">No services yet</h3>
            <p className="text-secondary mb-8 max-w-md mx-auto">
              Create your first medical service to start accepting appointments from patients
            </p>
            <Link
              href="/dashboard/tasks/create"
              className="btn-primary text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 inline-block"
            >
              Create Your First Service
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-blue-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getCategoryColor(task.category)} flex items-center justify-center text-2xl`}>
                    {getCategoryIcon(task.category)}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.status === 'published' ? 'bg-green-100 text-green-800' :
                      task.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {(task.status || 'draft').toUpperCase()}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-primary mb-2 flex items-center">
                  {task.title}
                  {(task.status || 'draft') === 'published' && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Visible to Patients
                    </span>
                  )}
                </h3>
                <p className="text-secondary text-sm mb-4 line-clamp-2">{task.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Category:</span>
                    <span className="font-medium text-primary capitalize">{task.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Duration:</span>
                    <span className="font-medium text-primary">{task.duration} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Fee:</span>
                    <span className="font-medium text-primary">
                      {task.fee >= 1 ? `${task.fee} ETH` : `${(task.fee * 1000).toFixed(0)} mETH`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Time Slots:</span>
                    <span className="font-medium text-primary">{task.dateTimeSlots?.length || 0}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                    Edit
                  </button>
                  <button
                    onClick={() => handlePublishToggle(task.id, task.status || 'draft')}
                    disabled={publishingTasks.has(task.id)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${(task.status || 'draft') === 'published'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } ${publishingTasks.has(task.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {publishingTasks.has(task.id)
                      ? 'Updating...'
                      : (task.status || 'draft') === 'published'
                        ? 'Unpublish'
                        : 'Publish'
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}
