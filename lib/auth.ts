export function verifyPin(submittedPin: string): boolean {
  const correctPin = process.env.UPLOAD_PIN;
  if (!correctPin) {
    throw new Error('UPLOAD_PIN environment variable is not set');
  }
  return submittedPin === correctPin;
}
