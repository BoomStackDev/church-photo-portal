export interface SubmissionForm {
  volunteerName: string;
  caption: string;
  files: File[];
}

export interface UploadResult {
  success: boolean;
  uploadedFiles: string[];
  failedFiles: string[];
  error?: string;
}

export interface FileMetadata {
  name: string;
  mimeType: string;
  size: number;
}

export interface UploadSessionRequest {
  pin: string;
  volunteerName: string;
  caption: string;
  files: FileMetadata[];
}

export interface UploadSessionResponse {
  success: boolean;
  sessions: UploadSession[];
  error?: string;
}

export interface UploadSession {
  filename: string;
  uploadUrl: string;
  mimeType: string;
  size: number;
}
