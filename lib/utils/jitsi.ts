// Generate Jitsi meeting link
export const generateJitsiMeetingLink = (
  sessionId: number,
  doctorId: number,
  patientAddress: string
): string => {
  // Create a unique room name based on session details
  // Using sessionId and doctorId to ensure consistency for both parties
  const roomName = `healthcare-session-${sessionId}-doctor-${doctorId}`;
  const cleanRoomName = roomName.replace(/[^a-zA-Z0-9-]/g, '');
  return `https://meet.jit.si/${cleanRoomName}`;
};
