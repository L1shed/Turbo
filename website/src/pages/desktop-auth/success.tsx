import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ExternalLink, Truck, AlertTriangle } from 'lucide-react';

export default function DesktopAuthSuccess() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [delivered, setDelivered] = useState<boolean>(false);
  const [deliveryFailed, setDeliveryFailed] = useState<boolean>(false);

  useEffect(() => {
    if (router.isReady && router.query.uid) {
      setUid(router.query.uid as string);
      setDelivered(!!router.query.delivered);
      setDeliveryFailed(!!router.query.delivery_failed);
    }
  }, [router.isReady, router.query.uid, router.query.delivered, router.query.delivery_failed]);

  const copyToClipboard = async () => {
    if (uid) {
      try {
        await navigator.clipboard.writeText(uid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  if (!uid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Retrieving your authentication information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            {deliveryFailed ? (
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            ) : delivered ? (
              <Truck className="w-6 h-6 text-green-600" />
            ) : (
              <Check className="w-6 h-6 text-green-600" />
            )}
          </div>
          <CardTitle className="text-green-800">Authentication Successful</CardTitle>
          <CardDescription>
            {delivered && "Your UID has been delivered to the desktop app."}
            {deliveryFailed && "Authentication successful, but desktop app delivery failed."}
            {!delivered && !deliveryFailed && "Your desktop application can now access your user ID."}
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
                Your UID has been automatically sent to your desktop application via HTTP.
              </p>
            </div>
          )}

          {deliveryFailed && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-800 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Desktop App Delivery Failed
              </div>
              <p className="text-xs text-orange-700 mt-1">
                Authentication was successful, but we couldn't reach your desktop app. 
                You can copy the UID manually below.
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              User ID
            </label>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="font-mono text-xs flex-1 justify-center py-2">
                {uid}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">For Desktop App Integration:</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              {delivered ? (
                <>
                  <li>• Your desktop app received the UID via HTTP POST</li>
                  <li>• The UID identifies your authenticated user session</li>
                  <li>• You can safely close this window</li>
                </>
              ) : (
                <>
                  <li>• The desktop app can now extract this UID from the URL</li>
                  <li>• This UID identifies your authenticated user session</li>
                  <li>• You can safely close this window</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button onClick={goToDashboard} className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
