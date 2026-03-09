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
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Missing environment variables' }, { status: 500 });
  }

  const body: { fileIds: string[] } = await request.json();
  const { fileIds } = body;

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return NextResponse.json({ success: false, error: 'No files specified' }, { status: 400 });
  }

  let deleted = 0;

  for (const fileId of fileIds) {
    const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${fileId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (response.ok || response.status === 204) {
      deleted++;
    } else {
      const error = await response.text();
      return NextResponse.json(
        { success: false, error: `Failed to delete file: ${error}`, deleted },
        { status: response.status }
      );
    }
  }

  return NextResponse.json({ success: true, deleted });
}
