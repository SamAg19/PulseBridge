'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TimeSlot } from '@/lib/types';

export default function CreateTaskForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'consultation' as const,
    duration: 30,
    fee: 0,
    dateTimeSlots: [] as TimeSlot[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        doctorId: user?.uid,
      }),
    });
    if (response.ok) {
      alert('Task created successfully');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">Task Title</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium">Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={4}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium">Duration (minutes)</label>
          <input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
            className="mt-1 block w-full rounded-md border-gray-300"
            required
          />
        </div>
        <div>
          <label htmlFor="fee" className="block text-sm font-medium">Fee (PYUSD)</label>
          <input
            id="fee"
            type="number"
            step="0.01"
            value={formData.fee}
            onChange={(e) => setFormData({...formData, fee: parseFloat(e.target.value)})}
            className="mt-1 block w-full rounded-md border-gray-300"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Create Task
      </button>
    </form>
  );
}
