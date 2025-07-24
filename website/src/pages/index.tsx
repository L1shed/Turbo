import React from "react";
import Link from "next/link";
import {
  Zap,
  Shield,
  Globe,
  DollarSign,
  Download,
  ArrowRightIcon,
} from "lucide-react";
import Layout from "../components/Layout";
import Head from "next/head";

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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.859-.45 1.607-.603 2.408-.31 1.548-.513 3.219-.343 4.998.148 1.611.886 3.032 2.055 4.235.906.93 2.018 1.491 3.19 1.808 1.085.293 2.23.315 3.353.233 1.172-.086 2.329-.378 3.421-.93 1.058-.534 2.001-1.314 2.684-2.315.665-.973.996-2.13 1.07-3.298.078-1.229-.133-2.463-.514-3.634-.4-1.226-.978-2.386-1.746-3.432-.785-1.07-1.775-1.978-2.927-2.65-.904-.527-1.9-.827-2.927-.95-.31-.036-.624-.054-.939-.054zm.051 1.008c.282 0 .563.015.842.045.854.092 1.677.348 2.414.764.904.509 1.713 1.252 2.37 2.156.636.877 1.13 1.889 1.469 2.954.335 1.054.509 2.16.441 3.272-.064 1.04-.349 2.068-.889 2.93-.523.836-1.302 1.479-2.191 1.934-.864.441-1.816.695-2.783.771-1.008.079-2.027.031-3.003-.219-1.001-.255-1.956-.722-2.738-1.417-1.042-1.066-1.697-2.54-1.825-4.061-.122-1.449.063-2.912.33-4.322.137-.724.29-1.441.52-2.116.455-1.339 1.357-2.507 2.263-3.535.712-.807 1.513-1.416 2.427-1.787.542-.22 1.118-.34 1.706-.38.154-.01.307-.016.46-.016l-.003-.001z"/>
  </svg>
);

const usePlatform = () => {
  const [platform, setPlatform] = React.useState<string>("");

  React.useEffect(() => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes("Win")) setPlatform("windows");
    else if (userAgent.includes("Mac")) setPlatform("macos");
    else if (userAgent.includes("Linux")) setPlatform("linux");
    else setPlatform("unknown");
  }, []);

  return platform;
};

export default function LandingPage() {
  const platform = usePlatform();
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Helper function to get OS logo
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

  // Helper function to get OS display name
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
      //console.error("Download failed:", error);
      window.location.href = "https://github.com/L1shed/Turbo";
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Turbo: Earn Passive Income</title>
      </Head>
      <Layout theme="dark">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Earn Passive Income
            </h1>
            <p className="text-xl md:text-4xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Share your unused bandwidth and earn cryptocurrency rewards with
              Turbo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownload}
                disabled={isDownloading || !platform}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center gap-2 justify-center"
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
              <button className="border border-gray-600 hover:border-gray-400 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                <Link href="/blog">Learn More <ArrowRightIcon className="w-5 h-5 inline-block" /></Link>
              </button>
            </div>
            {platform && (
              <p className="text-sm text-gray-400 mt-4">
                Not on {getOSName()}? see{" "}
                <Link href="https://github.com/L1shed/Turbo/releases" className="underline">
                  other platforms
                </Link>
              </p>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">
              Why Choose Turbo?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Passive Income</h3>
                <p className="text-gray-400">
                  Earn money 24/7 by sharing your unused internet bandwidth with
                  our global network
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Secure & Private</h3>
                <p className="text-gray-400">
                  Your data remains private and secure with end-to-end encryption
                  and privacy protection
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Global Network</h3>
                <p className="text-gray-400">
                  Join thousands of nodes worldwide contributing to a
                  decentralized internet infrastructure
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-orange-500 mb-2">
                  100+
                </div>
                <div className="text-gray-400">Active Nodes</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-500 mb-2">
                  $100+
                </div>
                <div className="text-gray-400">Total Earnings Paid</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-500 mb-2">
                  10+
                </div>
                <div className="text-gray-400">Countries</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-500 mb-2">
                  99.9%
                </div>
                <div className="text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4">Install & Setup</h3>
                <p className="text-gray-400">
                  Download the Turbo client and set up your node in minutes
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4">Share Bandwidth</h3>
                <p className="text-gray-400">
                  Your node automatically shares unused bandwidth with the network
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4">Earn Rewards</h3>
                <p className="text-gray-400">
                  Get paid in cryptocurrency based on your contribution to the
                  network
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Earning?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join <span className="text-orange-500">100+</span> users already earning passive income with Turbo
            </p>
            <button
              onClick={handleDownload}
              disabled={isDownloading || !platform}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  Downloading...{" "}
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                </>
              ) : (
                <>
                  {getOSLogo()}
                  Download Now
                </>
              )}
            </button>
          </div>
        </section>
      </Layout></>
  );
}
