import { useEffect, useRef } from "react";
import gsap from "gsap";

const OrangeParticles = () => {
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const PARTICLE_COUNT = 60;
    const orangeColors = [
      "rgba(255,140,0,", // dark orange
      "rgba(255,165,0,", // orange
      "rgba(255,200,80,", // light orange
      "rgba(255,100,0,"   // reddish orange
    ];
    const particles = Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 2 + Math.random() * 3,
      dx: (Math.random() - 0.5) * 0.7,
      dy: (Math.random() - 0.5) * 0.7,
      alpha: 0.3 + Math.random() * 0.7,
      color: `${orangeColors[Math.floor(Math.random() * orangeColors.length)]}${0.2 + Math.random() * 0.6})`
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    };

    const animateParticles = () => {
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > width) p.dx *= -1;
        if (p.y < 0 || p.y > height) p.dy *= -1;
      });
      render();
    };

    gsap.ticker.add(animateParticles);

    const handleResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    render();

    return () => {
      gsap.ticker.remove(animateParticles);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={particleCanvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 10
      }}
    />
  );
};

export default OrangeParticles;
