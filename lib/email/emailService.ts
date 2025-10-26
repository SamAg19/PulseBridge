// Email service for sending meeting links
// This is a client-side implementation that can be extended with a backend service

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MeetingEmailData {
  appointmentId: string;
  doctorName: string;
  doctorEmail: string;
  patientName: string;
  patientEmail: string;
  meetingLink: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceTitle: string;
}

// Generate meeting link email template
export const generateMeetingEmailTemplate = (data: MeetingEmailData, isForDoctor: boolean) => {
  const recipient = isForDoctor ? 'Doctor' : 'Patient';
  const otherParty = isForDoctor ? data.patientName : `Dr. ${data.doctorName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Healthcare Appointment - Meeting Link</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .appointment-card { background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .appointment-card h3 { margin: 0 0 15px 0; color: #1e293b; font-size: 18px; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #64748b; }
        .detail-value { color: #1e293b; }
        .meeting-button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; transition: background 0.3s; }
        .meeting-button:hover { background: #059669; }
        .instructions { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .instructions h4 { margin: 0 0 10px 0; color: #92400e; }
        .instructions ul { margin: 10px 0; padding-left: 20px; }
        .instructions li { margin: 5px 0; color: #92400e; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 5px 0; color: #64748b; font-size: 14px; }
        .support-info { background: #eff6ff; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .support-info h4 { margin: 0 0 10px 0; color: #1d4ed8; }
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .content { padding: 20px 15px; }
          .detail-row { flex-direction: column; }
          .detail-label { margin-bottom: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Healthcare Appointment</h1>
          <p>Your virtual consultation is ready</p>
        </div>
        
        <div class="content">
          <h2>Hello ${isForDoctor ? `Dr. ${data.doctorName}` : data.patientName}!</h2>
          <p>Your virtual healthcare consultation is scheduled and ready. Please find your meeting details below:</p>
          
          <div class="appointment-card">
            <h3>📅 Appointment Details</h3>
            <div class="detail-row">
              <span class="detail-label">${isForDoctor ? 'Patient' : 'Doctor'}:</span>
              <span class="detail-value">${otherParty}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service:</span>
              <span class="detail-value">${data.serviceTitle}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${data.appointmentDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${data.appointmentTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Appointment ID:</span>
              <span class="detail-value">${data.appointmentId.slice(0, 8)}...</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${data.meetingLink}" class="meeting-button" target="_blank" rel="noopener noreferrer">
              🎥 Join Video Consultation
            </a>
          </div>
          
          <div class="instructions">
            <h4>📋 Before joining the meeting:</h4>
            <ul>
              <li>Test your camera and microphone</li>
              <li>Find a quiet, well-lit space</li>
              <li>Have a stable internet connection</li>
              <li>${isForDoctor ? 'Review patient information and prepare consultation materials' : 'Prepare any questions or symptoms you want to discuss'}</li>
              <li>Join the meeting 2-3 minutes early</li>
            </ul>
          </div>
          
          <div class="support-info">
            <h4>🔧 Technical Support</h4>
            <p>If you experience any technical issues:</p>
            <ul>
              <li>Try refreshing your browser</li>
              <li>Check your internet connection</li>
              <li>Ensure your browser allows camera/microphone access</li>
              <li>Use Chrome, Firefox, or Safari for best experience</li>
            </ul>
          </div>
          
          <p><strong>Meeting Link:</strong><br>
          <a href="${data.meetingLink}" style="color: #3b82f6; word-break: break-all;">${data.meetingLink}</a></p>
          
          <p style="margin-top: 30px;">
            ${isForDoctor 
              ? 'Please ensure you join the meeting on time to provide the best care for your patient.' 
              : 'We look forward to providing you with excellent healthcare service.'
            }
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Healthcare Platform</strong></p>
          <p>Secure • Professional • Convenient</p>
          <p style="font-size: 12px; margin-top: 15px;">
            This is an automated message. Please do not reply to this email.<br>
            If you need assistance, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Healthcare Appointment - Meeting Link

Hello ${isForDoctor ? `Dr. ${data.doctorName}` : data.patientName}!

Your virtual healthcare consultation is scheduled:

${isForDoctor ? 'Patient' : 'Doctor'}: ${otherParty}
Service: ${data.serviceTitle}
Date: ${data.appointmentDate}
Time: ${data.appointmentTime}
Appointment ID: ${data.appointmentId.slice(0, 8)}...

Meeting Link: ${data.meetingLink}

Please join the meeting 2-3 minutes early and ensure you have:
- A stable internet connection
- Working camera and microphone
- A quiet, well-lit space

For technical support, try refreshing your browser or checking your internet connection.

Healthcare Platform - Secure • Professional • Convenient
  `;

  return { html, text };
};

// Send email using EmailJS (client-side solution)
export const sendMeetingEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // For demo purposes, we'll use EmailJS
    // In production, you'd want to use a backend service
    
    // Check if EmailJS is available
    if (typeof window !== 'undefined' && (window as any).emailjs) {
      const result = await (window as any).emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id',
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'your_template_id',
        {
          to_email: emailData.to,
          subject: emailData.subject,
          html_content: emailData.html,
          text_content: emailData.text || ''
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key'
      );
      
      return result.status === 200;
    } else {
      // Fallback: Open email client
      const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.text || 'Please check the HTML version of this email.')}`;
      window.open(mailtoLink);
      return true;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send meeting links to both doctor and patient
export const sendMeetingLinksToAll = async (meetingData: MeetingEmailData): Promise<{
  doctorSent: boolean;
  patientSent: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];
  let doctorSent = false;
  let patientSent = false;

  try {
    // Generate email for doctor
    const doctorEmailTemplate = generateMeetingEmailTemplate(meetingData, true);
    const doctorEmailData: EmailData = {
      to: meetingData.doctorEmail,
      subject: `Healthcare Consultation - Meeting Link | ${meetingData.appointmentDate} at ${meetingData.appointmentTime}`,
      html: doctorEmailTemplate.html,
      text: doctorEmailTemplate.text
    };

    // Generate email for patient
    const patientEmailTemplate = generateMeetingEmailTemplate(meetingData, false);
    const patientEmailData: EmailData = {
      to: meetingData.patientEmail,
      subject: `Your Healthcare Appointment - Meeting Link | ${meetingData.appointmentDate} at ${meetingData.appointmentTime}`,
      html: patientEmailTemplate.html,
      text: patientEmailTemplate.text
    };

    // Send emails
    try {
      doctorSent = await sendMeetingEmail(doctorEmailData);
      if (!doctorSent) {
        errors.push('Failed to send email to doctor');
      }
    } catch (error) {
      errors.push(`Doctor email error: ${error}`);
    }

    try {
      patientSent = await sendMeetingEmail(patientEmailData);
      if (!patientSent) {
        errors.push('Failed to send email to patient');
      }
    } catch (error) {
      errors.push(`Patient email error: ${error}`);
    }

  } catch (error) {
    errors.push(`General error: ${error}`);
  }

  return {
    doctorSent,
    patientSent,
    errors
  };
};

// Generate Jitsi meeting link
export const generateJitsiMeetingLink = (appointmentId: string, doctorName: string, patientName: string): string => {
  // Create a unique room name based on appointment details
  const roomName = `healthcare-${appointmentId.slice(0, 8)}-${Date.now()}`;
  const cleanRoomName = roomName.replace(/[^a-zA-Z0-9-]/g, '');
  
  return `https://meet.jit.si/${cleanRoomName}`;
};