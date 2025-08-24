import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Truck } from 'lucide-react';

export default function DesktopAuthSuccess() {
  const router = useRouter();
  const [delivered, setDelivered] = useState<boolean>(false);

  useEffect(() => {
    if (router.isReady) {
      const isDelivered = !!router.query.delivered;
      setDelivered(isDelivered);

      // Redirect to dashboard after 2 seconds
      const timeout = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [router.isReady, router.query.delivered, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            {delivered ? (
              <Truck className="w-6 h-6 text-green-600" />
            ) : (
              <Check className="w-6 h-6 text-green-600" />
            )}
          </div>
          <CardTitle className="text-green-800">Authentication Successful</CardTitle>
          <CardDescription>
            {delivered 
              ? "Your authentication has been delivered to the desktop app." 
              : "Your desktop application has been successfully authenticated."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {delivered && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                <Truck className="w-4 h-4" />
                Successfully Delivered to Desktop App
              </div>
              <p className="text-xs text-green-700 mt-1">
                Your authentication has been automatically sent to your desktop application.
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">What's Next:</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              {delivered ? (
                <>
                  <li>• Your desktop app has received the authentication</li>
                  <li>• You can now use all authenticated features</li>
                  <li>• This window will automatically redirect to your dashboard</li>
                </>
              ) : (
                <>
                  <li>• Your authentication was successful</li>
                  <li>• You can now access your dashboard</li>
                </>
              )}
            </ul>
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-gray-700">Redirecting to dashboard automatically...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

