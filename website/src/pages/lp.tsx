import { useRef } from "react";
import NodeButton from "../components/landing page/NodeButton";
import OrangeParticles from "../components/landing page/OrangeParticles";
import StepsSection from "../components/landing page/StepsSection";
import ScrollingBackgroundTransition from "@/components/landing page/BackgroundTransition";
import HowItWorksSection from "@/components/landing page/HowItWorks";

export default function LandingPage() {
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const containerRef = useRef<HTMLElement>(null);

  return (
    <main>
      <section
        className="w-100% h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/image copy 3.png')" }}
      >
        <div className="fixed top-0 left-0 w-full z-60 flex justify-center px-6 py-4">
          <nav className="flex items-center justify-between w-[95%] max-w-4xl mx-auto px-6 py-3 mt-4 rounded-xl bg-white/60 backdrop-blur-sm shadow-md">
            <div className="flex items-center gap-8">
              <div className="bg-black rounded-full p-2">
                <span className="font-bold">Logo</span>
              </div>

              <ul className="hidden md:flex items-center gap-6 font-medium">
                <li className="cursor-pointer">Blog</li>
                <li className="cursor-pointer">Documentation</li>
                <li className="cursor-pointer">For Organizations</li>
              </ul>
            </div>

            <button className="px-4 py-2 rounded-full border border-black bg-white hover:bg-black text-black hover:text-white font-medium cursor-pointer">
              Run a Node
            </button>
          </nav>
        </div>
        <div className="w-full h-full flex flex-col items-center justify-evenly bg-black/40 text-white text-center">
          <div>
            <h1
              className="pb-6"
              style={{
                fontFamily: "Bitstream Iowan Old Style Bold BT",
                fontWeight: "normal",
                fontSize: "48px",
              }}
            >
              Power Research.
              <br />
              Get Paid.
            </h1>
            <h2 className="font-semibold text-2xl pb-16">
              Earn rewards by sharing your unused bandwidth.
            </h2>
          </div>
          <NodeButton />
        </div>
      </section>

      <section ref={containerRef} className="relative min-h-[300vh] bg-black z-50">
        <OrangeParticles />
        <StepsSection stepRefs={stepRefs} />
      </section>
      
      <ScrollingBackgroundTransition />
      <HowItWorksSection />

    </main>
  );
}