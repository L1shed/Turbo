import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Download, X } from "lucide-react";

const WindowsLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91V13.1l10 .15z"/>
  </svg>
);

const MacLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const LinuxLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5">
    <path d="M20.581 19.049c-.55-.446-.336-1.431-.907-1.917.553-3.365-.997-6.331-2.845-8.232-1.551-1.595-1.051-3.147-1.051-4.49 0-2.146-.881-4.41-3.55-4.41-2.853 0-3.635 2.38-3.663 3.738-.068 3.262.659 4.11-1.25 6.484-2.246 2.793-2.577 5.579-2.07 7.057-.237.276-.557.582-1.155.835-1.652.72-.441 1.925-.898 2.78-.13.243-.192.497-.192.74 0 .75.596 1.399 1.679 1.302 1.461-.13 2.809.905 3.681.905.77 0 1.402-.438 1.696-1.041 1.377-.339 3.077-.296 4.453.059.247.691.917 1.141 1.662 1.141 1.631 0 1.945-1.849 3.816-2.475.674-.225 1.013-.879 1.013-1.488 0-.39-.139-.761-.419-.988zm-9.147-10.465c-.319 0-.583-.258-1-.568-.528-.392-1.065-.618-1.059-1.03 0-.283.379-.37.869-.681.526-.333.731-.671 1.249-.671.53 0 .69.268 1.41.579.708.307 1.201.427 1.201.773 0 .355-.741.609-1.158.868-.613.378-.928.73-1.512.73zm1.665-5.215c.882.141.981 1.691.559 2.454l-.355-.145c.184-.543.181-1.437-.435-1.494-.391-.036-.643.48-.697.922-.153-.064-.32-.11-.523-.127.062-.923.658-1.737 1.451-1.61zm-3.403.331c.676-.168 1.075.618 1.078 1.435l-.31.19c-.042-.343-.195-.897-.579-.779-.411.128-.344 1.083-.115 1.279l-.306.17c-.42-.707-.419-2.133.232-2.295zm-2.115 19.243c-1.963-.893-2.63-.69-3.005-.69-.777 0-1.031-.579-.739-1.127.248-.465.171-.952.11-1.343-.094-.599-.111-.794.478-1.052.815-.346 1.177-.791 1.447-1.124.758-.937 1.523.537 2.15 1.85.407.851 1.208 1.282 1.455 2.225.227.871-.71 1.801-1.896 1.261zm6.987-1.874c-1.384.673-3.147.982-4.466.299-.195-.563-.507-.927-.843-1.293.539-.142.939-.814.46-1.489-.511-.721-1.555-1.224-2.61-2.04-.987-.763-1.299-2.644.045-4.746-.655 1.862-.272 3.578.057 4.069.068-.988.146-2.638 1.496-4.615.681-.998.691-2.316.706-3.14l.62.424c.456.337.838.708 1.386.708.81 0 1.258-.466 1.882-.853.244-.15.613-.302.923-.513.52 2.476 2.674 5.454 2.795 7.15.501-1.032-.142-3.514-.142-3.514.842 1.285.909 2.356.946 3.67.589.241 1.221.869 1.279 1.696l-.245-.028c-.126-.919-2.607-2.269-2.83-.539-1.19.181-.757 2.066-.997 3.288-.11.559-.314 1.001-.462 1.466zm4.846-.041c-.985.38-1.65 1.187-2.107 1.688-.88.966-2.044.503-2.168-.401-.131-.966.36-1.493.572-2.574.193-.987-.023-2.506.431-2.668.295 1.753 2.066 1.016 2.47.538.657 0 .712.222.859.837.092.385.219.709.578 1.09.418.447.29 1.133-.635 1.49zm-8-13.006c-.651 0-1.138-.433-1.534-.769-.203-.171.05-.487.253-.315.387.328.777.675 1.281.675.607 0 1.142-.519 1.867-.805.247-.097.388.285.143.382-.704.277-1.269.832-2.01.832z"/>
  </svg>
);

const usePlatform = () => {
  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes("Win")) setPlatform("windows");
    else if (userAgent.includes("Mac")) setPlatform("macos");
    else if (userAgent.includes("Linux")) setPlatform("linux");
    else setPlatform("unknown");
  }, []);

  return platform;
};

interface WelcomeScreenProps {
  showPopup?: boolean;
  onClosePopup?: () => void;
}

export function WelcomeScreen({ showPopup = false, onClosePopup }: WelcomeScreenProps) {
  const platform = usePlatform();
  const [isDownloading, setIsDownloading] = useState(false);

  const getOSLogo = () => {
    switch (platform) {
      case 'windows':
        return <WindowsLogo />;
      case 'macos':
        return <MacLogo />;
      case 'linux':
        return <LinuxLogo />;
      default:
        return <Download className="w-5 h-5" />;
    }
  };

  const getOSName = () => {
    switch (platform) {
      case 'windows':
        return 'Windows';
      case 'macos':
        return 'macOS';
      case 'linux':
        return 'Linux';
      default:
        return 'Unknown';
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(
        "https://api.github.com/repos/L1shed/Turbo/releases/latest"
      );
      const release = await response.json();

      if (!release.assets || release.assets.length === 0) {
        throw new Error("No assets found in the latest release");
      }

      const platformPatterns = {
        windows: /windows|win|\.exe$/i,
        macos: /macos|mac|darwin|\.dmg$|\.pkg$/i,
        linux: /linux|\.deb$|\.rpm$|\.tar\.gz$/i,
      };

      let asset = release.assets.find((asset: any) =>
        platformPatterns[platform as keyof typeof platformPatterns]?.test(
          asset.name
        )
      );

      if (!asset) {
        asset = release.assets[0];
      }

      const downloadUrl = asset.browser_download_url;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = asset.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      window.location.href = "https://github.com/L1shed/Turbo";
    } finally {
      setIsDownloading(false);
    }
  };

  const content = (
    <div className="text-center">
      <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Zap className="w-8 h-8 text-orange-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">
        {showPopup ? "No Node Setup" : "Welcome to Turbo"}
      </h2>
      <p className="text-gray-300 mb-8 max-w-md mx-auto">
        {showPopup 
          ? "You don't have a Turbo node connected to your account yet. Download and set up the Turbo client to start earning passive income."
          : "Set up your Turbo node to start earning passive income by sharing your unused bandwidth."
        }
      </p>
      
      <div className="space-y-4">
        <button
          onClick={handleDownload}
          disabled={isDownloading || !platform}
          className={`${showPopup ? "w-full" : ""} bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center gap-2 justify-center ${!showPopup ? "mx-auto" : ""}`}
        >
          {isDownloading ? (
            <>
              Downloading...{" "}
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            </>
          ) : (
            <>
              {getOSLogo()}
              Download for {getOSName()}
            </>
          )}
        </button>
        
        {platform && (
          <p className="text-sm text-gray-400">
            Not on {getOSName()}? See{" "}
            <Link href="https://github.com/L1shed/Turbo/releases" className="text-orange-500 hover:text-orange-400 underline">
              other platforms
            </Link>
          </p>
        )}
        
        {showPopup && onClosePopup && (
          <button
            onClick={onClosePopup}
            className="w-full border border-gray-600 hover:border-gray-400 px-6 py-3 rounded-lg font-semibold transition-colors text-gray-300 hover:text-white"
          >
            I'll set up later
          </button>
        )}
      </div>
    </div>
  );

  if (showPopup) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4 relative">
          {onClosePopup && (
            <button
              onClick={onClosePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="py-20">
          {content}
        </div>
      </div>
      
      <div className="text-center text-gray-500 text-sm pb-8">
        <p>Turbo Node • Earn passive income by sharing bandwidth</p>
      </div>
    </div>
  );
}
