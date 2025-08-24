import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    title: "Download the App",
    description: "Get the official application on your device and install it to start contributing to the network.",
    action: (
      <button className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors">
        Download Now
      </button>
    )
  },
  {
    number: "02", 
    title: "Connect Your Wallet",
    description: "Link your cryptocurrency wallet to receive payments securely and automatically.",
    action: (
      <div className="text-gray-300">
        <p className="text-sm">Compatible with:</p>
        <div className="flex gap-2 mt-2">
          <span className="px-3 py-1 bg-gray-800 rounded text-sm">MetaMask</span>
          <span className="px-3 py-1 bg-gray-800 rounded text-sm">WalletConnect</span>
        </div>
      </div>
    )
  },
  {
    number: "03",
    title: "Get Paid Out",
    description: "Earn rewards automatically as you contribute your unused bandwidth to power research networks.",
    action: (
      <div className="text-green-400">
        <p className="text-lg font-semibold">Up to $50/month</p>
        <p className="text-sm text-gray-300">Based on usage</p>
      </div>
    )
  }
];

const StepsSection = ({ stepRefs }: { stepRefs: React.MutableRefObject<Array<HTMLDivElement | null>> }) => {
  useEffect(() => {
    stepRefs.current.forEach((step, index) => {
      if (step) {
        gsap.set(step, {
          y: 100,
          opacity: 0.3,
        });

        gsap.timeline({
          scrollTrigger: {
            trigger: step,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 1,
            onEnter: () => {
              gsap.to(step, {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: 'power3.out',
              });
            },
            onLeave: () => {
              gsap.to(step, {
                y: -50,
                opacity: 0.5,
                duration: 0.8,
                ease: 'power2.inOut',
              });
            },
            onEnterBack: () => {
              gsap.to(step, {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: 'power3.out',
              });
            },
            onLeaveBack: () => {
              gsap.to(step, {
                y: 100,
                opacity: 0.3,
                duration: 0.8,
                ease: 'power2.inOut',
              });
            },
          },
        });

        const stepContent = step.querySelectorAll('.step-content > *');
        gsap.set(stepContent, { y: 30, opacity: 0 });
        gsap.to(stepContent, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 70%',
            end: 'bottom 30%',
          },
        });
      }
    });
  }, [stepRefs]);

  return (
    <div className="flex">
      <div className="sticky top-0 h-screen w-1/3 flex items-center justify-center">
        <div className="relative flex items-center">
          <div className="w-1 h-40 bg-orange-400 mr-8"></div>
          <h2 className="text-6xl font-bold text-white leading-tight text-left">
            GET<br />
            STARTED
          </h2>
        </div>
      </div>
      <div className="w-2/3 relative">
        {steps.map((step, index) => (
          <div
            key={index}
            ref={el => { stepRefs.current[index] = el }}
            className={`h-screen flex ${index === steps.length - 1 ? "items-center" : "items-end"} justify-center p-12`}
            style={{
              marginBottom: index !== steps.length - 1 ? "180px" : "0",
            }}
          >
            <div className="max-w-2xl step-content scale-110">
              <div className="flex items-center gap-6 mb-12">
                <span className="text-8xl font-bold text-white/20 step-number">
                  {step.number}
                </span>
                <div className="w-24 h-1 bg-white/30 step-line"></div>
              </div>
              <h3 className="text-5xl font-bold text-white mb-10 step-title">
                {step.title}
              </h3>
              <p className="text-2xl text-gray-300 mb-12 leading-relaxed step-description">
                {step.description}
              </p>
              <div className="flex items-center step-action">
                {step.action}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepsSection;
