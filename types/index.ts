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
