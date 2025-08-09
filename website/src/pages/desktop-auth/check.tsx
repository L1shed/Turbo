import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, AlertCircle } from 'lucide-react';

export default function DesktopAuthCheck() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'checking' | 'sending' | 'success' | 'error'>('checking');
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
          router.push(`/desktop-auth/success?uid=${encodeURIComponent(uid)}&delivered=true`);
        }, 2000);
      } else {
        throw new Error(`Desktop app responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send UID to desktop app:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setStatus('error');
      
      // Fall back to showing success page
      setTimeout(() => {
        router.push(`/desktop-auth/success?uid=${encodeURIComponent(uid)}&delivery_failed=true`);
      }, 3000);
    }
  };

  const sendErrorToDesktopApp = async (port: string, reason: string) => {
    try {
      await fetch(`http://localhost:${port}/auth-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: reason,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send error to desktop app:', error);
    }
  };

  useEffect(() => {
    if (!loading && router.isReady) {
      const { port } = router.query;
      
      if (isAuthenticated && user) {
        if (port && typeof port === 'string') {
          // Send UID to desktop app via HTTP POST
          sendUIDToDesktopApp(user.id, port);
        } else {
          // No port specified, redirect to success page
          router.push(`/desktop-auth/success?uid=${encodeURIComponent(user.id)}`);
        }
      } else {
        if (port && typeof port === 'string') {
          // Send error to desktop app
          sendErrorToDesktopApp(port, 'not_authenticated');
        }
        // Redirect to error page
        router.push('/desktop-auth/error?reason=not_authenticated');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'checking':
        return {
          icon: <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />,
          title: 'Checking Authentication',
          description: 'Verifying your login status for desktop app access...',
          bgColor: 'bg-blue-100',
        };
      case 'sending':
        return {
          icon: <Loader2 className="w-6 h-6 text-green-600 animate-spin" />,
          title: 'Sending to Desktop App',
          description: 'Delivering your authentication details to the desktop application...',
          bgColor: 'bg-green-100',
        };
      case 'success':
        return {
          icon: <Check className="w-6 h-6 text-green-600" />,
          title: 'Success!',
          description: 'Your UID has been successfully sent to the desktop app.',
          bgColor: 'bg-green-100',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-600" />,
          title: 'Delivery Failed',
          description: `Failed to reach desktop app: ${errorMessage}. Redirecting to success page...`,
          bgColor: 'bg-red-100',
        };
      default:
        return {
          icon: <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />,
          title: 'Processing',
          description: 'Processing your request...',
          bgColor: 'bg-blue-100',
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
          <div className="text-center text-sm text-gray-600">
            {router.query.port ? (
              <>Desktop app is listening on port {router.query.port}</>
            ) : (
              <>No desktop app port specified - using web interface</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
