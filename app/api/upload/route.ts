import { NextRequest, NextResponse } from 'next/server';
import { verifyPin } from '@/lib/auth';
import { formatFilename } from '@/lib/format-filename';
import { createUploadSession } from '@/lib/onedrive';
import { UploadSessionRequest, UploadSessionResponse, UploadSession } from '@/types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadSessionResponse>> {
  const body: UploadSessionRequest = await request.json();

  const { pin, volunteerName, caption, files } = body;

  // Verify PIN server-side
  if (!pin || !verifyPin(pin)) {
    return NextResponse.json(
      { success: false, sessions: [], error: 'Invalid PIN' },
      { status: 401 }
    );
  }

  // Validate name and caption
  if (
    !volunteerName ||
    !caption ||
    volunteerName.trim() === '' ||
    caption.trim() === ''
  ) {
    return NextResponse.json(
      { success: false, sessions: [], error: 'Name and caption are required' },
      { status: 400 }
    );
  }

  // Validate files array
  if (!files || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json(
      { success: false, sessions: [], error: 'At least one file is required' },
      { status: 400 }
    );
  }

  // Validate file types
  const allowedTypes = [
    'image/jpeg',
    'image/heic',
    'image/heic-sequence',
    'image/png',
    'video/mp4',
    'video/quicktime',
  ];

  for (const file of files) {
    if (!allowedTypes.includes(file.mimeType)) {
      return NextResponse.json(
        {
          success: false,
          sessions: [],
          error: 'File type not allowed. Please upload JPG, HEIC, PNG, MP4, or MOV files only.',
        },
        { status: 400 }
      );
    }
  }

  // Create upload sessions for each file
  const sessions: UploadSession[] = [];

  for (const file of files) {
    try {
      const filename = formatFilename(volunteerName, caption, file.name);
      const uploadUrl = await createUploadSession(
        filename,
        file.size,
        file.mimeType
      );
      sessions.push({
        filename,
        uploadUrl,
        mimeType: file.mimeType,
        size: file.size,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create upload session';
      return NextResponse.json(
        { success: false, sessions: [], error: message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { success: true, sessions },
    { status: 200 }
  );
}
