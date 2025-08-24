import { useEffect, useRef, createRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import * as THREE from "three";

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const textItemRefs = useRef([
    createRef<HTMLSpanElement>(),
    createRef<HTMLSpanElement>(),
    createRef<HTMLSpanElement>()
  ]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    globe?: THREE.Mesh;
    nodes?: THREE.Mesh[];
    animationFrameId?: number;
  }>({});

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create globe with enhanced 3D appearance
    const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a86ff,
      transparent: true,
      opacity: 0.9,
      wireframe: false,
      shininess: 100,
      specular: 0x4fc3f7,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Add wireframe overlay for enhanced 3D effect
    const wireframeGeometry = new THREE.SphereGeometry(1.01, 32, 32);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x64b5f6,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    globe.add(wireframe);

    // Add enhanced lighting for better 3D effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x4fc3f7, 0.6);
    pointLight.position.set(-5, -3, 5);
    scene.add(pointLight);

    // Create nodes around the globe
    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < 20; i++) {
      const phi = Math.acos(-1 + (2 * i) / 20);
      const theta = Math.sqrt(20 * Math.PI) * phi;

      const nodeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
      const nodeMaterial = new THREE.MeshBasicMaterial({ 
        color: i % 3 === 0 ? 0xff7b00 : 0x2ecc71 
      });
      
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      
      // Position nodes on the sphere
      node.position.x = 1.2 * Math.sin(phi) * Math.cos(theta);
      node.position.y = 1.2 * Math.sin(phi) * Math.sin(theta);
      node.position.z = 1.2 * Math.cos(phi);
      
      scene.add(node);
      nodes.push(node);
    }

    // Add connections between nodes
    for (let i = 0; i < nodes.length; i++) {
      if (i % 3 === 0) {
        for (let j = 0; j < nodes.length; j++) {
          if (i !== j && Math.random() > 0.85) {
            const material = new THREE.LineBasicMaterial({ 
              color: 0x3a86ff, 
              transparent: true,
              opacity: 0.3
            });
            
            const points = [];
            points.push(nodes[i].position);
            points.push(nodes[j].position);
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            scene.add(line);
          }
        }
      }
    }

    // Store references
    worldRef.current = {
      scene,
      camera,
      renderer,
      globe,
      nodes,
    };

    // Animation loop with enhanced rotation
    const animate = () => {
      if (!worldRef.current.scene) return;
      
      // Continuous slow rotation
      worldRef.current.globe!.rotation.y += 0.002;
      worldRef.current.globe!.rotation.x += 0.001;
      
      // Animate nodes orbiting around the globe
      worldRef.current.nodes?.forEach((node, index) => {
        const time = Date.now() * 0.001;
        const radius = 1.2;
        const speed = 0.5 + (index % 3) * 0.2;
        
        // Keep original spherical distribution but add slow orbital motion
        const phi = Math.acos(-1 + (2 * index) / 20);
        const theta = Math.sqrt(20 * Math.PI) * phi + time * speed * 0.1;
        
        node.position.x = radius * Math.sin(phi) * Math.cos(theta);
        node.position.y = radius * Math.sin(phi) * Math.sin(theta);
        node.position.z = radius * Math.cos(phi);
      });
      
      worldRef.current.renderer!.render(
        worldRef.current.scene,
        worldRef.current.camera!
      );
      
      worldRef.current.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      if (!worldRef.current.camera || !worldRef.current.renderer) return;
      
      worldRef.current.camera.aspect = window.innerWidth / window.innerHeight;
      worldRef.current.camera.updateProjectionMatrix();
      worldRef.current.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (worldRef.current.animationFrameId !== undefined) {
        cancelAnimationFrame(worldRef.current.animationFrameId);
      }
      worldRef.current.scene = undefined;
      worldRef.current.camera = undefined;
      worldRef.current.renderer = undefined;
    };
  }, []);

  // GSAP animations
  useEffect(() => {
    if (!sectionRef.current) return;

    // Title animation - arc movement from top left to top right
    gsap.fromTo(
      titleRef.current,
      {
        x: "-100vw",
        y: "10vh",
        opacity: 0,
      },
      {
        x: "60vw",
        y: "10vh",
        opacity: 1,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "top 30%",
          scrub: true,
        },
      }
    );

    // ensure DOM transform origin is centered so scaling expands from the globe's center
    if (globeRef.current) {
      gsap.set(globeRef.current, { transformOrigin: "50% 50%" });
    }

    // Globe animation - appear, move to upper-left and grow (reduced max size)
    gsap.fromTo(
      globeRef.current,
      {
        x: "-20vw",
        y: "10vh",
        scale: 0.6,
        opacity: 0,
      },
      {
        x: "-25vw",
        y: "4vh",
        scale: 1.4, // reduced max size
        opacity: 1,
        duration: 2,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "center center",
          scrub: true,
        },
      }
    );

    // Gentle camera zoom to match the visual growth (less aggressive than before)
    if (worldRef.current?.camera) {
      gsap.to(worldRef.current.camera.position, {
        z: 3.5, // moderate zoom in
        duration: 2,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "center center",
          scrub: true,
        },
        onUpdate: () => {
          worldRef.current?.camera?.updateProjectionMatrix?.();
        },
      });
    }

    // Make the Three.js globe revolve around itself throughout the entire scroll sequence
    if (worldRef.current?.globe) {
      gsap.to(worldRef.current.globe.rotation, {
        y: Math.PI * 8, // rotate 4 full turns while scrubbing
        x: Math.PI * 3, // add rotation on X axis for more dynamic 3D effect
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%", // start rotation as soon as section comes into view
          end: "bottom top", // continue until section exits
          scrub: 1, // smooth scrubbing tied to scroll movement
        },
      });
    }

    // Pin the globe as soon as it reaches max size and keep it centered
    if (globeRef.current) {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "center center", // matches the end of the scale animation
        end: "+=60%",
        pin: globeRef.current,
        pinSpacing: false,
      });
    }

    // Main text animation
    gsap.fromTo(
      textRef.current,
      {
        opacity: 0,
      },
      {
        opacity: 1,
        duration: 1,
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 40%",
          end: "center center",
          scrub: true,
        },
      }
    );

    // Text items animations
    textItemRefs.current.forEach((ref, index) => {
      if (!ref.current) return;
      
      // Different animation for each text item
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: `top ${30 - index * 10}%`,
            end: `center ${40 - index * 10}%`,
            scrub: true,
          },
        }
      );

      // Special animation for "worldwide" (last item)
      if (index === 2) {
        gsap.fromTo(
          ref.current,
          {
            scale: 1,
          },
          {
            scale: 1.8,
            color: "#2ecc71",
            fontWeight: "bold",
            duration: 1.5,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "center 30%",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[200vh] bg-blue-100 overflow-hidden"
    >
      {/* Canvas for Three.js globe */}
      <div
        ref={globeRef}
        className="absolute left-1/2 top-1/2 pointer-events-none transform-gpu"
        style={{
          transform: "translate(-50%, -50%)",
          transformOrigin: "center center"
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-[600px] h-[600px]"
        />
      </div>

      {/* Title */}
      <div
        ref={titleRef}
        className="absolute top-10 left-0 text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500 backdrop-blur-sm py-2 px-8 rounded-xl"
        style={{ textShadow: "0 0 10px rgba(59, 130, 246, 0.5)" }}
      >
        How It Works
      </div>

      {/* Text content */}
      <div
        ref={textRef}
        className="absolute top-1/3 right-10 max-w-md text-right"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Better data access for
        </h2>
        <div className="flex flex-col gap-6 text-3xl md:text-4xl font-semibold">
          <span ref={textItemRefs.current[0]} className="text-white">
            NGOs
          </span>
          <span ref={textItemRefs.current[1]} className="text-white">
            Research groups
          </span>
          <span
            ref={textItemRefs.current[2]}
            className="text-green-400"
          >
            Worldwide
          </span>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;