'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { getTasksByDoctor } from '@/lib/firebase/firestore';
import { Task } from '@/lib/types';

interface TaskWithId extends Task {
  id: string;
}

export default function TasksPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithId[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-light-blue">
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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.status === 'published' ? 'bg-green-100 text-green-800' :
                    task.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {(task.status || 'draft').toUpperCase()}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-primary mb-2">{task.title}</h3>
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
                    <span className="font-medium text-primary">${task.fee} PYUSD</span>
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
                  <button className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium">
                    {(task.status || 'draft') === 'published' ? 'Published' : 'Publish'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
