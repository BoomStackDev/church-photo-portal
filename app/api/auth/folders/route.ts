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

interface OneDriveItem {
  name: string;
  folder?: Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = process.env.ONEDRIVE_USER_ID;
  const folderPath = process.env.ONEDRIVE_FOLDER_PATH;

  if (!userId || !folderPath) {
    return NextResponse.json({ success: false, error: 'Missing environment variables' }, { status: 500 });
  }

  const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/root:/${folderPath}:/children`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ success: false, error }, { status: response.status });
  }

  const data: { value: OneDriveItem[] } = await response.json();
  const folders = data.value
    .filter((item) => item.folder !== undefined)
    .map((item) => item.name);

  return NextResponse.json({ success: true, folders });
}
