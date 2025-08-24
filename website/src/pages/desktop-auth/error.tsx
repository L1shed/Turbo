import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DesktopAuthError() {
  const router = useRouter();
  const [errorReason, setErrorReason] = useState<string>('');

  useEffect(() => {
    if (router.isReady) {
      setErrorReason(router.query.reason as string || 'delivery_failed');
    }
  }, [router.isReady, router.query.reason]);

  const retryPairing = () => {
    // Go back to the desktop auth check page to retry
    router.push('/desktop-auth/check' + (router.query.port ? `?port=${router.query.port}` : ''));
  };

  const openDiscord = () => {
    window.open("https://discord.gg/ZqdvQkSEc7", '_blank');
  };

  const getErrorMessage = () => {
    switch (errorReason) {
      case 'delivery_failed':
        return {
          title: "Can't connect to your desktop app",
          description: "We couldn't deliver the authentication to your desktop application. Your login was successful, but the connection to your local app failed.",
          icon: <AlertTriangle className="w-6 h-6 text-orange-600" />
        };
      case 'missing_port':
        return {
          title: "Missing port parameter",
          description: "A port number is required to connect to your desktop application. Please initiate the pairing process from your desktop app.",
          icon: <AlertTriangle className="w-6 h-6 text-blue-600" />
        };
      case 'not_authenticated':
        return {
          title: "Authentication required",
          description: "You need to sign in first before connecting your desktop application.",
          icon: <AlertTriangle className="w-6 h-6 text-blue-600" />
        };
      default:
        return {
          title: "Something went wrong",
          description: "We encountered an issue while setting up your desktop app connection.",
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            {errorInfo.icon}
          </div>
          <CardTitle className="text-gray-800">{errorInfo.title}</CardTitle>
          <CardDescription>
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(errorReason === 'delivery_failed') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-3">Try these steps to fix the issue:</h3>
              <ul className="text-xs text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-medium">1.</span>
                  <span>Make sure your Turbo Node is running on the same device</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">2.</span>
                  <span>Close and restart your desktop application completely</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">3.</span>
                  <span>Check that your firewall isn't blocking local connections</span>
                </li>
              </ul>
            </div>
          )}

          {errorReason === 'missing_port' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-3">How to fix this:</h3>
              <ul className="text-xs text-yellow-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-medium">1.</span>
                  <span>Open your Turbo desktop application</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">2.</span>
                  <span>Look for a "Pair with web" or "Connect account" button</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-medium">3.</span>
                  <span>Click it to get the proper authentication link with port</span>
                </li>
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              {(errorReason === 'delivery_failed') && router.query.port && (
                <Button onClick={retryPairing} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Pairing Again
                </Button>
              )}
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 pt-2">
            Still having trouble? Our <Button variant="link" onClick={openDiscord} className="p-0 h-auto text-xs">
               Discord community
            </Button> is here to help you get connected.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
