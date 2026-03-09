import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { AuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_CLIENT_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      tenantId: process.env.AZURE_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email Files.Read.All',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email ?? '';
      return email.endsWith('@tpob.org');
    },
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.accessToken === 'string') {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = process.env.ONEDRIVE_USER_ID;
  const folderPath = process.env.ONEDRIVE_FOLDER_PATH;

  if (!userId || !folderPath) {
    return NextResponse.json({ success: false, error: 'Missing environment variables' }, { status: 500 });
  }

  const body: { fileIds: string[]; destinationFolder: string } = await request.json();
  const { fileIds, destinationFolder } = body;

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json({ success: false, error: 'No files specified' }, { status: 400 });
  }

  if (!destinationFolder || destinationFolder.trim() === '') {
    return NextResponse.json({ success: false, error: 'Destination folder is required' }, { status: 400 });
  }

  const trimmedFolder = destinationFolder.trim();

  // Check if destination folder exists
  const checkUrl = `https://graph.microsoft.com/v1.0/users/${userId}/drive/root:/${folderPath}/${trimmedFolder}`;
  const checkRes = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  // Create folder if it doesn't exist
  if (checkRes.status === 404) {
    const createUrl = `https://graph.microsoft.com/v1.0/users/${userId}/drive/root:/${folderPath}:/children`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: trimmedFolder,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename',
      }),
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      return NextResponse.json(
        { success: false, error: `Failed to create folder: ${error}` },
        { status: createRes.status }
      );
    }
  } else if (!checkRes.ok) {
    const error = await checkRes.text();
    return NextResponse.json(
      { success: false, error: `Failed to check folder: ${error}` },
      { status: checkRes.status }
    );
  }

  // Move each file
  let moved = 0;

  for (const fileId of fileIds) {
    const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${fileId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parentReference: {
          path: `/drive/root:/${folderPath}/${trimmedFolder}`,
        },
      }),
    });

    if (response.ok) {
      moved++;
    } else {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: `Failed to move file: ${error}`, moved },
        { status: response.status }
      );
    }
  }

  return NextResponse.json({ success: true, moved });
}
