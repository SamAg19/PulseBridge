'use client';

import { useState, useEffect } from 'react';
import { getPrescriptionsByAppointment } from '@/lib/firebase/firestore';

interface PrescriptionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  doctorName: string;
}

interface Prescription {
  id: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  instructions: string;
  notes?: string;
  createdAt: any;
}

export default function PrescriptionViewModal({ 
  isOpen, 
  onClose, 
  appointmentId, 
  doctorName 
}: PrescriptionViewModalProps) {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchPrescription();
    }
  }, [isOpen, appointmentId]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const prescriptions = await getPrescriptionsByAppointment(appointmentId);
      if (prescriptions.length > 0) {
        setPrescription(prescriptions[0] as Prescription);
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary">Prescription</h2>
              <p className="text-secondary">From Dr. {doctorName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-secondary">Loading prescription...</p>
            </div>
          ) : prescription ? (
            <div>
              {/* Prescription Date */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-primary">Prescription Date</h3>
                    <p className="text-secondary">{formatDate(prescription.createdAt)}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Medications</h3>
                <div className="space-y-4">
                  {prescription.medications.map((medication, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-primary mb-2">{medication.name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-secondary">Dosage:</span>
                          <span className="ml-2 font-medium">{medication.dosage}</span>
                        </div>
                        <div>
                          <span className="text-secondary">Frequency:</span>
                          <span className="ml-2 font-medium">{medication.frequency}</span>
                        </div>
                        <div>
                          <span className="text-secondary">Duration:</span>
                          <span className="ml-2 font-medium">{medication.duration}</span>
                        </div>
                      </div>
                      {medication.instructions && (
                        <div className="mt-2">
                          <span className="text-secondary text-sm">Instructions:</span>
                          <p className="text-sm text-primary mt-1">{medication.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* General Instructions */}
              {prescription.instructions && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-primary mb-2">General Instructions</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-primary">{prescription.instructions}</p>
                  </div>
                </div>
              )}

              {/* Doctor Notes */}
              {prescription.notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-primary mb-2">Doctor Notes</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-primary">{prescription.notes}</p>
                  </div>
                </div>
              )}

              {/* Print Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Print Prescription
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">No prescription found</h3>
              <p className="text-secondary">No prescription has been created for this appointment yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}