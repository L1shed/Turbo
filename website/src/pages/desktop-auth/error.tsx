import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, LogIn, ExternalLink } from 'lucide-react';

export default function DesktopAuthError() {
  const router = useRouter();
  const [reason, setReason] = useState<string>('unknown');

  useEffect(() => {
    if (router.isReady) {
      setReason((router.query.reason as string) || 'unknown');
    }
  }, [router.isReady, router.query.reason]);

  const getErrorMessage = (reason: string) => {
    switch (reason) {
      case 'not_authenticated':
        return {
          title: 'Not Authenticated',
          description: 'You need to sign in to your account first before the desktop app can access your user ID.',
          action: 'Sign In',
        };
      case 'invalid_token':
        return {
          title: 'Session Expired',
          description: 'Your authentication session has expired. Please sign in again.',
          action: 'Sign In Again',
        };
      case 'server_error':
        return {
          title: 'Server Error',
          description: 'There was a problem on our end. Please try again later.',
          action: 'Try Again',
        };
      default:
        return {
          title: 'Authentication Failed',
          description: 'Unable to retrieve your user information for the desktop app.',
          action: 'Sign In',
        };
    }
  };

  const goToSignIn = () => {
    router.push('/');
  };

  const retryAuth = () => {
    router.push('/api/desktop-auth');
  };

  const errorInfo = getErrorMessage(reason);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-800">{errorInfo.title}</CardTitle>
          <CardDescription>
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Error Code
            </label>
            <Badge variant="destructive" className="font-mono text-xs">
              {reason}
            </Badge>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-800 mb-2">What to do next:</h3>
            <ul className="text-xs text-amber-700 space-y-1">
              {reason === 'not_authenticated' && (
                <>
                  <li>• Sign in to your account using Discord or Google</li>
                  <li>• Once signed in, retry the desktop app connection</li>
                </>
              )}
              {reason === 'invalid_token' && (
                <>
                  <li>• Your session has expired for security reasons</li>
                  <li>• Sign in again to create a new session</li>
                </>
              )}
              {reason === 'server_error' && (
                <>
                  <li>• This is a temporary issue on our end</li>
                  <li>• Please wait a moment and try again</li>
                </>
              )}
              {reason === 'unknown' && (
                <>
                  <li>• Try signing in to your account</li>
                  <li>• If the problem persists, contact support</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button onClick={goToSignIn} variant="outline" className="flex-1">
              <LogIn className="w-4 h-4 mr-2" />
              {errorInfo.action}
            </Button>
            {reason === 'server_error' && (
              <Button onClick={retryAuth} className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
