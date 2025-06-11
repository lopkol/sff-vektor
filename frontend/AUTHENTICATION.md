# Authentication with NextAuth.js and Google OAuth

This project uses NextAuth.js v4 with Google OAuth 2.0 for authentication, including refresh token support to prevent users from being disconnected after token expiration.

## Features

- Google OAuth 2.0 authentication
- Automatic token refresh
- Offline access support
- Graceful error handling for failed refreshes

## Configuration

### Environment Variables

Make sure to set the following environment variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000 # or your production URL
```

### Google OAuth Configuration

In your Google Cloud Console, make sure to:

1. Enable the Google+ API
2. Configure OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

## How It Works

### Refresh Token Flow

1. **Initial Authentication**: When users sign in, we request `offline` access to get both access and refresh tokens
2. **Token Storage**: Both tokens are stored in the JWT along with expiration time
3. **Automatic Refresh**: Before each request, we check if the access token is about to expire
4. **Silent Refresh**: If expired, we automatically refresh it using the refresh token
5. **Error Handling**: If refresh fails, we gracefully sign out the user

### Key Components

#### NextAuth Configuration (`/api/auth/[...nextauth]/route.ts`)

- Configures Google provider with offline access
- Implements JWT callback for token management
- Handles automatic token refresh
- Provides session callback for client-side access

#### Custom Auth Hook (`/hooks/useAuth.ts`)

- Provides a convenient interface for authentication
- Automatically handles refresh errors
- Offers utility functions for auth headers and status

#### Auth Utilities (`/lib/auth.ts`)

- Server-side authentication helpers
- Handles authentication headers for API requests
- Provides authentication status checks

## Usage

### Client-side

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { session, isAuthenticated, getAuthHeader, signOut } = useAuth();

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Welcome, {session?.user?.name}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### API Requests

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { getAuthHeader } = useAuth();

  const makeApiRequest = async () => {
    const headers = getAuthHeader();
    if (!headers) {
      // User is not authenticated
      return;
    }

    const response = await fetch('/api/my-endpoint', {
      headers,
    });
    // Handle response
  };

  return <button onClick={makeApiRequest}>Make Request</button>;
}
```

### Server-side

```tsx
import { getServerAuthSession } from '@/lib/auth';

export default async function ServerComponent() {
  const session = await getServerAuthSession();
  
  if (!session) {
    return <div>Not authenticated</div>;
  }

  return <div>Welcome, {session.user?.name}</div>;
}
```

## Token Lifecycle

1. **Access Token**: Valid for 1 hour, used for API requests
2. **Refresh Token**: Long-lived, used to obtain new access tokens
3. **ID Token**: Contains user information, sent to your backend for validation

## Error Handling

The system automatically handles various error scenarios:

- **Token Refresh Failure**: Automatically signs out the user
- **Network Errors**: Retries refresh once, then signs out
- **Invalid Credentials**: Prevents sign-in and shows error

## Security Considerations

- Refresh tokens are stored securely in HTTP-only JWT cookies
- All tokens are encrypted using NextAuth's built-in encryption
- Failed refresh attempts trigger automatic sign-out
- ID tokens are validated against your backend on each sign-in

## Troubleshooting

### Common Issues

1. **Users getting signed out frequently**: Check Google OAuth configuration for offline access
2. **Refresh not working**: Verify `GOOGLE_CLIENT_SECRET` is correct
3. **CORS errors**: Ensure redirect URIs are properly configured in Google Console

### Debug Mode

Enable debug logging by setting:

```env
NEXTAUTH_DEBUG=true
```

This will log detailed information about the authentication flow, including token refresh attempts. 