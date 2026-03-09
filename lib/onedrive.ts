export async function getAccessToken(): Promise<string> {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing Azure environment variables');
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function createUploadSession(
  filename: string,
  fileSize: number,
  mimeType: string
): Promise<string> {
  const userId = process.env.ONEDRIVE_USER_ID;
  const folderPath = process.env.ONEDRIVE_FOLDER_PATH;

  if (!userId || !folderPath) {
    throw new Error('Missing OneDrive environment variables');
  }

  const accessToken = await getAccessToken();

  const sessionUrl = `https://graph.microsoft.com/v1.0/users/${userId}/drive/root:/${folderPath}/${filename}:/createUploadSession`;

  const response = await fetch(sessionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item: {
        '@microsoft.graph.conflictBehavior': 'rename',
        name: filename,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create upload session for ${filename}: ${error}`);
  }

  const data = await response.json();
  return data.uploadUrl;
}
