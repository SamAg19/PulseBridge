'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Send, CheckCircle, AlertCircle, ExternalLink, Copy, Users } from 'lucide-react';
import { sendMeetingLinksToAll, generateJitsiMeetingLink, MeetingEmailData } from '@/lib/email/emailService';
import { updateAppointmentMeetingLink, initializeMeetingVerification } from '@/lib/firebase/firestore';
import MeetingVerification from './MeetingVerification';
import { MeetingVerification as MeetingVerificationType } from '@/lib/types';

interface SendMeetingLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    patientId: string;
    patientName?: string;
    patientEmail?: string;
    doctorName: string;
    doctorEmail: string;
    scheduledDate: any;
    scheduledTime: string;
    taskTitle?: string;
    meetingLink?: string;
    status?: string;
    verification?: MeetingVerificationType;
  };
  userType?: 'doctor' | 'patient';
  onSuccess: () => void;
}

export default function SendMeetingLinkModal({ 
  isOpen, 
  onClose, 
  appointment, 
  userType = 'doctor',
  onSuccess 
}: SendMeetingLinkModalProps) {
  const [sending, setSending] = useState(false);
  const [meetingLink, setMeetingLink] = useState(appointment.meetingLink || '');
  const [customLink, setCustomLink] = useState('');
  const [useCustomLink, setUseCustomLink] = useState(false);
  const [result, setResult] = useState<{
    doctorSent: boolean;
    patientSent: boolean;
    errors: string[];
  } | null>(null);
  const [step, setStep] = useState<'setup' | 'sending' | 'result'>('setup');
  const [activeTab, setActiveTab] = useState<'meeting' | 'verification'>('meeting');
  const [verification, setVerification] = useState<MeetingVerificationType | null>(null);

  useEffect(() => {
    if (isOpen && appointment.status === 'confirmed' && !appointment.verification) {
      // Initialize verification for confirmed appointments that don't have it yet
      initializeMeetingVerification(appointment.id).catch(console.error);
    }
  }, [isOpen, appointment.id, appointment.status, appointment.verification]);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const generateNewMeetingLink = () => {
    const newLink = generateJitsiMeetingLink(
      appointment.id,
      appointment.doctorName,
      appointment.patientName || appointment.patientId
    );
    setMeetingLink(newLink);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Meeting link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSendEmails = async () => {
    if (!meetingLink && !customLink) {
      alert('Please generate a meeting link or enter a custom link');
      return;
    }

    if (!appointment.patientEmail) {
      alert('Patient email is not available. Please ensure the patient has completed their profile.');
      return;
    }

    setSending(true);
    setStep('sending');

    try {
      const finalMeetingLink = useCustomLink ? customLink : meetingLink;
      
      // Update appointment with meeting link
      await updateAppointmentMeetingLink(appointment.id, finalMeetingLink);

      // Prepare email data
      const emailData: MeetingEmailData = {
        appointmentId: appointment.id,
        doctorName: appointment.doctorName,
        doctorEmail: appointment.doctorEmail,
        patientName: appointment.patientName || `Patient ${appointment.patientId.slice(0, 6)}`,
        patientEmail: appointment.patientEmail,
        meetingLink: finalMeetingLink,
        appointmentDate: formatDate(appointment.scheduledDate),
        appointmentTime: formatTime(appointment.scheduledTime),
        serviceTitle: appointment.taskTitle || 'Healthcare Consultation'
      };

      // Send emails
      const emailResult = await sendMeetingLinksToAll(emailData);
      setResult(emailResult);
      setStep('result');

      if (emailResult.doctorSent || emailResult.patientSent) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending meeting links:', error);
      setResult({
        doctorSent: false,
        patientSent: false,
        errors: [`Failed to send meeting links: ${error}`]
      });
      setStep('result');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setStep('setup');
    setResult(null);
    setActiveTab('meeting');
    onClose();
  };

  const handleVerificationUpdate = (updatedVerification: MeetingVerificationType) => {
    setVerification(updatedVerification);
    onSuccess(); // Refresh parent component data
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-200">
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-blue-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary">Meeting Management</h2>
              <p className="text-secondary text-sm sm:text-base">Manage meeting links and verification</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tab Navigation */}
          {appointment.status === 'confirmed' && (
            <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('meeting')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'meeting'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Meeting Links
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'verification'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Verification
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'verification' && appointment.status === 'confirmed' ? (
            <div className="space-y-6">
              {/* Appointment Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Appointment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Patient:</span>
                    <span className="ml-2 text-gray-900">
                      {appointment.patientName || `${appointment.patientId.slice(0, 6)}...`}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Doctor:</span>
                    <span className="ml-2 text-gray-900">Dr. {appointment.doctorName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="ml-2 text-gray-900">{formatDate(appointment.scheduledDate)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Time:</span>
                    <span className="ml-2 text-gray-900">{formatTime(appointment.scheduledTime)}</span>
                  </div>
                </div>
              </div>

              {/* Meeting Link Display */}
              {appointment.meetingLink && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-3">Meeting Link</h3>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={appointment.meetingLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-green-200 rounded text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(appointment.meetingLink!)}
                      className="p-2 text-green-600 hover:text-green-800 transition-colors"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a
                      href={appointment.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-green-600 hover:text-green-800 transition-colors"
                      title="Open meeting"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Meeting Verification Component */}
              <MeetingVerification
                appointmentId={appointment.id}
                userType={userType}
                onVerificationUpdate={(updatedVerification) => {
                  setVerification(updatedVerification);
                  onSuccess(); // Refresh parent component
                }}
              />
            </div>
          ) : step === 'setup' && (
            <div className="space-y-6">
              {/* Appointment Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Appointment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Patient:</span>
                    <span className="ml-2 text-gray-900">
                      {appointment.patientName || `${appointment.patientId.slice(0, 6)}...`}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Doctor:</span>
                    <span className="ml-2 text-gray-900">Dr. {appointment.doctorName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="ml-2 text-gray-900">{formatDate(appointment.scheduledDate)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Time:</span>
                    <span className="ml-2 text-gray-900">{formatTime(appointment.scheduledTime)}</span>
                  </div>
                </div>
              </div>

              {/* Email Recipients */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-3">Email Recipients</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Doctor:</span>
                    <span className="text-gray-900">{appointment.doctorEmail}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Patient:</span>
                    <span className="text-gray-900">
                      {appointment.patientEmail || (
                        <span className="text-red-600">Email not available - Patient needs to complete profile</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meeting Link Options */}
              <div>
                <h3 className="font-semibold text-primary mb-4">Meeting Link Options</h3>
                
                <div className="space-y-4">
                  {/* Auto-generated Jitsi Link */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="radio"
                        id="auto-link"
                        name="link-option"
                        checked={!useCustomLink}
                        onChange={() => setUseCustomLink(false)}
                        className="text-blue-600"
                      />
                      <label htmlFor="auto-link" className="font-medium text-gray-900">
                        Auto-generated Jitsi Link
                      </label>
                    </div>
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={meetingLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                        placeholder="Click 'Generate Link' to create a meeting link"
                      />
                      <button
                        onClick={generateNewMeetingLink}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Generate Link
                      </button>
                      {meetingLink && (
                        <button
                          onClick={() => copyToClipboard(meetingLink)}
                          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Custom Link */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="radio"
                        id="custom-link"
                        name="link-option"
                        checked={useCustomLink}
                        onChange={() => setUseCustomLink(true)}
                        className="text-blue-600"
                      />
                      <label htmlFor="custom-link" className="font-medium text-gray-900">
                        Custom Meeting Link
                      </label>
                    </div>
                    
                    <input
                      type="url"
                      value={customLink}
                      onChange={(e) => setCustomLink(e.target.value)}
                      placeholder="Enter your custom meeting link (Zoom, Teams, etc.)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      disabled={!useCustomLink}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmails}
                  disabled={(!meetingLink && !customLink) || !appointment.patientEmail}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Meeting Links
                </button>
              </div>
            </div>
          )}

          {step === 'sending' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-primary mb-2">Sending Meeting Links</h3>
              <p className="text-secondary">Please wait while we send the meeting links to both parties...</p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  result.doctorSent || result.patientSent ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {result.doctorSent || result.patientSent ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">
                  {result.doctorSent || result.patientSent ? 'Emails Sent!' : 'Failed to Send Emails'}
                </h3>
              </div>

              {/* Results */}
              <div className="space-y-3">
                <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                  result.doctorSent ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {result.doctorSent ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    Doctor Email: {result.doctorSent ? 'Sent Successfully' : 'Failed to Send'}
                  </span>
                </div>

                <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                  result.patientSent ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {result.patientSent ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    Patient Email: {result.patientSent ? 'Sent Successfully' : 'Failed to Send'}
                  </span>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meeting Link */}
              {(meetingLink || customLink) && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Meeting Link:</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={useCustomLink ? customLink : meetingLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(useCustomLink ? customLink : meetingLink)}
                      className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a
                      href={useCustomLink ? customLink : meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Open meeting"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}