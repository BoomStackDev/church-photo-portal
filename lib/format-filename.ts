export function formatFilename(
  volunteerName: string,
  caption: string,
  originalFilename: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const cleanName = volunteerName.trim().replace(/\s+/g, '_');
  const cleanCaption = caption.trim().replace(/\s+/g, '_').slice(0, 50);
  const ext = originalFilename.split('.').pop();
  return `${cleanName}_${cleanCaption}_${timestamp}.${ext}`;
}
