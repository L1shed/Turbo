import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  const getErrorMessage = (errorCode: string | string[] | undefined) => {
    if (!errorCode || typeof errorCode !== 'string') {
      return 'An unknown error occurred during authentication.';
    }

    switch (errorCode) {
      case 'access_denied':
        return 'Access was denied. You may have cancelled the authentication process.';
      case 'server_error':
        return 'A server error occurred. Please try again later.';
      case 'temporarily_unavailable':
        return 'The authentication service is temporarily unavailable. Please try again later.';
      case 'invalid_request':
        return 'Invalid authentication request. Please try again.';
      case 'invalid_client':
        return 'Invalid client configuration. Please contact support.';
      case 'invalid_grant':
        return 'Invalid authentication grant. Please try again.';
      case 'unauthorized_client':
        return 'Unauthorized client. Please contact support.';
      case 'unsupported_grant_type':
        return 'Unsupported authentication method. Please contact support.';
      case 'invalid_scope':
        return 'Invalid authentication scope. Please contact support.';
      case 'missing_code':
        return 'Missing authentication code. Please try again.';
      case 'no_session':
        return 'Failed to create session. Please try again.';
      case 'unexpected_error':
        return 'An unexpected error occurred. Please try again.';
      default:
        return `Authentication error: ${errorCode}`;
    }
  };

  return (
    <>
      <Head>
        <title>Authentication Error | Turbo</title>
      </Head>
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-4 text-red-400">Authentication Failed</h1>
          
          <p className="text-gray-300 mb-8 leading-relaxed">
            {getErrorMessage(error)}
          </p>
          
          <div className="space-y-4">
            <Link
              href="/"
              className="block bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Try Again
            </Link>
            
            <Link
              href="/blog"
              className="block border border-gray-600 hover:border-gray-400 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Learn More
            </Link>
          </div>
          
          <p className="text-sm text-gray-500 mt-8">
            If this problem persists, please{' '}
            <a 
              href="https://discord.gg/ZqdvQkSEc7" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 underline"
            >
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
