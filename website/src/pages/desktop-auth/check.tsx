import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Check, AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DesktopAuthCheck() {
  const router = useRouter();
  const auth = useAuth();
  const { user, loading, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'checking' | 'sending' | 'success' | 'error' | 'signup'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const sendUIDToDesktopApp = async (uid: string, port: string) => {
    try {
      setStatus('sending');
      
      const response = await fetch(`http://localhost:${port}/auth-result`, {
        method: 'POST',
        body: uid,
      });

      if (response.ok) {
        setStatus('success');
        // Redirect to success page after successful delivery
        setTimeout(() => {
          router.push(`/desktop-auth/success?delivered=true`);
        }, 2000);
      } else {
        throw new Error(`Desktop app responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send UID to desktop app:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setStatus('error');
      
      // Redirect to error page and preserve the port parameter
      setTimeout(() => {
        router.push(`/desktop-auth/error?reason=delivery_failed&port=${encodeURIComponent(port)}`);
      }, 3000);
    }
  };

  useEffect(() => {
    if (!loading && router.isReady) {
      const { port } = router.query;
      
      // Port is required - redirect to error if missing
      if (!port || typeof port !== 'string') {
        router.push('/desktop-auth/error?reason=missing_port');
        return;
      }
      
      if (isAuthenticated && user) {
        // Send UID to desktop app via HTTP POST
        sendUIDToDesktopApp(user.id, port);
      } else {
        // User is not authenticated, set status to signup
        setStatus('signup');
        // Store the port in localStorage so we can use it after authentication
        localStorage.setItem('desktop_auth_port', port);
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // After successful authentication, check if we need to continue with desktop auth
  useEffect(() => {
    // This effect handles the case where the user signs in and we need to continue desktop auth
    if (isAuthenticated && user && status === 'signup') {
      const port = localStorage.getItem('desktop_auth_port');
      if (port) {
        localStorage.removeItem('desktop_auth_port'); // Clean up
        sendUIDToDesktopApp(user.id, port);
      } else {
        // No port stored, redirect to success page
        router.push(`/desktop-auth/success`);
      }
    }
  }, [isAuthenticated, user, status]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'checking':
        return {
          icon: <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />,
          title: 'Checking Authentication',
          description: 'Verifying your login status for desktop app access...',
          bgColor: 'bg-blue-100',
          showAuth: false,
        };
      case 'sending':
        return {
          icon: <Loader2 className="w-6 h-6 text-green-600 animate-spin" />,
          title: 'Sending to Desktop App',
          description: 'Delivering your authentication details to the desktop application...',
          bgColor: 'bg-green-100',
          showAuth: false,
        };
      case 'success':
        return {
          icon: <Check className="w-6 h-6 text-green-600" />,
          title: 'Success!',
          description: 'Your UID has been successfully sent to the desktop app.',
          bgColor: 'bg-green-100',
          showAuth: false,
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-600" />,
          title: 'Delivery Failed',
          description: `Failed to pair desktop app: ${errorMessage}.`,
          bgColor: 'bg-red-100',
          showAuth: false,
        };
      case 'signup':
        return {
          icon: <LogIn className="w-6 h-6 text-blue-600" />,
          title: 'Authentication Required',
          description: 'Please sign in or create an account to continue with desktop app authentication.',
          bgColor: 'bg-blue-100',
          showAuth: true,
        };
      default:
        return {
          icon: <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />,
          title: 'Processing',
          description: 'Processing your request...',
          bgColor: 'bg-blue-100',
          showAuth: false,
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-12 h-12 ${statusDisplay.bgColor} rounded-full flex items-center justify-center mb-4`}>
            {statusDisplay.icon}
          </div>
          <CardTitle>{statusDisplay.title}</CardTitle>
          <CardDescription>
            {statusDisplay.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          {statusDisplay.showAuth && (
            <div className="flex flex-col gap-4 mt-4">
              <p className="text-sm text-center">Sign in with:</p>
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={auth.signInWithDiscord}
                  className="bg-[#5865F2] hover:bg-[#4752C4] flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Discord
                </Button>
                <Button 
                  onClick={() => auth.signInWithGoogle(router.asPath)}
                  className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Google
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        
        {statusDisplay.showAuth && (
          <CardFooter className="flex justify-center">
            <p className="text-xs text-gray-500">After signing in, you'll be automatically connected to the desktop app</p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
