import { NextRequest, NextResponse } from 'next/server';
import { verifyPin } from '@/lib/auth';
import { formatFilename } from '@/lib/format-filename';
import { uploadFileToOneDrive } from '@/lib/onedrive';
import { UploadResult } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<UploadResult>> {
  const formData = await request.formData();

  const pin = formData.get('pin');
  const volunteerName = formData.get('volunteerName');
  const caption = formData.get('caption');
  const files = formData.getAll('files');

  // Verify PIN server-side
  if (typeof pin !== 'string' || !verifyPin(pin)) {
    return NextResponse.json(
      { success: false, uploadedFiles: [], failedFiles: [], error: 'Invalid PIN' },
      { status: 401 }
    );
  }

  // Validate name and caption
  if (
    typeof volunteerName !== 'string' ||
    typeof caption !== 'string' ||
    volunteerName.trim() === '' ||
    caption.trim() === ''
  ) {
    return NextResponse.json(
      { success: false, uploadedFiles: [], failedFiles: [], error: 'Name and caption are required' },
      { status: 400 }
    );
  }

  // Validate at least one file
  const fileEntries = files.filter((f): f is File => f instanceof File);
  if (fileEntries.length === 0) {
    return NextResponse.json(
      { success: false, uploadedFiles: [], failedFiles: [], error: 'At least one file is required' },
      { status: 400 }
    );
  }

  const uploadedFiles: string[] = [];
  const failedFiles: string[] = [];

  for (const file of fileEntries) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type;
      const filename = formatFilename(volunteerName, caption, file.name);

      await uploadFileToOneDrive(filename, buffer, mimeType);
      uploadedFiles.push(filename);
    } catch {
      failedFiles.push(file.name);
    }
  }

  // Determine status code
  if (uploadedFiles.length === 0) {
    return NextResponse.json(
      { success: false, uploadedFiles, failedFiles, error: 'All files failed to upload' },
      { status: 500 }
    );
  }

  if (failedFiles.length > 0) {
    return NextResponse.json(
      { success: true, uploadedFiles, failedFiles },
      { status: 207 }
    );
  }

  return NextResponse.json(
    { success: true, uploadedFiles, failedFiles },
    { status: 200 }
  );
}
