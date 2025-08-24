import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ScrollingBackgroundTransition = () => {
  const containerRef = useRef(null);
  const leftRectRef = useRef(null);
  const rightRectRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const leftRect = leftRectRef.current;
    const rightRect = rightRectRef.current;

    // Set initial positions - rectangles start off-screen
    // start much farther off-screen and lower on the page
    // increase/decrease the y value (e.g. '30%', '40%') to control how low they start
    gsap.set(leftRect, { x: '-150%', y: '39%' });
    gsap.set(rightRect, { x: '150%', y: '39%' });
    
    // Create the scroll-triggered animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        // start earlier (when the container top reaches 90% down the viewport)
        start: 'top 90%',
        end: 'bottom top',
        // increased scrub to make the follow-through slower/smoother
        scrub: 2,
        onUpdate: (self) => {
          const progress = self.progress;

          // amplify progress for movement so motion begins earlier in the scroll range
          const moveProgress = Math.min(progress * 1.3, 1);
          const scaleProgress = Math.min(progress, 1);
          const radiusProgress = Math.min(progress, 1);

          // Apply easing for a natural slower feel
          const easedMove = gsap.parseEase('power2.inOut')(moveProgress);
          const easedScale = gsap.parseEase('power1.out')(scaleProgress);
          const easedRadius = gsap.parseEase('power1.in')(radiusProgress);

          // Move rectangles inward more slowly
          // interpolate from the farther starting positions into the final positions
          const leftX = gsap.utils.interpolate(-150, 25, easedMove);
          const rightX = gsap.utils.interpolate(150, -25, easedMove);

          // Scale and border radius change slower as well
          const scale = gsap.utils.interpolate(1, 2, easedScale);
          const borderRadius = gsap.utils.interpolate(50, 0, easedRadius);

          gsap.set(leftRect, { x: `${leftX}%` });
          gsap.set(rightRect, { x: `${rightX}%` });

          gsap.set([leftRect, rightRect], {
            scale: scale,
            borderRadius: `${borderRadius}% ${borderRadius}% 0 0`,
          });
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden overflow-hidden">

      {/* Transition container */}
      <div 
        ref={containerRef}
        className="relative h-screen overflow-visible"
      >
        {/* The actual white background that will be revealed */}
        <div className="absolute inset-0 bg-black z-0"></div>
        
        {/* Left animated rectangle */}
        <div
          ref={leftRectRef}
          className="absolute top-0 left-0 w-[200vh] h-screen bg-gradient-to-b from-purple-900 to-blue-100 z-10 rounded-tr-full"
        
        ></div>

        {/* Right animated rectangle */}
        <div
          ref={rightRectRef}
          className="absolute top-0 right-0 w-[200vh] h-screen bg-gradient-to-b from-purple-900 to-blue-100 z-10 rounded-tl-full"
          
        ></div>

      </div>

      <div className="bg-blue-100 h-[100vh]"></div>
    </div>
  );
};

export default ScrollingBackgroundTransition;