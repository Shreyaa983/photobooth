// PhotoBooth Home Page
// This page renders the animated 3D spider and web using Three.js and GLTF models.
// Users can interact with the spider and start the photobooth experience.

'use client';

import React, { useEffect, useRef } from 'react';
import { GLTFLoader } from 'three-stdlib';
import * as THREE from 'three';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


export default function Home() {
 
  const [showContent] = React.useState(true);
  const pathname = usePathname(); 
  // Reference to the DOM node for mounting Three.js renderer
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Setup Three.js renderer, scene, camera, and models
    const mountNode = mountRef.current;
    const renderer= new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const scene = new THREE.Scene;
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);;
    let model: THREE.Object3D | null = null;
    let webModel: THREE.Object3D | null = null;
    const clock = new THREE.Clock();
    const legBones: THREE.Bone[] = [];
    const spiderTarget = new THREE.Vector3(2.7, -1.7, -1);
    const mouse = new THREE.Vector2(0, 0);
    const isMobile = () => window.innerWidth < 768;


    // Setup scene
    
    camera.position.set(
      0,
      isMobile() ? 1.5 : 1,
      isMobile() ? 8 : 5
    );


    renderer.setSize(window.innerWidth, window.innerHeight, false);
    if (mountNode) {
      // Clear any existing canvas before appending new one
      while (mountNode.firstChild) {
        mountNode.removeChild(mountNode.firstChild);
      }
      mountNode.appendChild(renderer.domElement);
    }


    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xfA8F1FF, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(ambientLight, directionalLight);

    // Mouse tracking for spider movement
    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      const minX = isMobile() ? 1.0 : 1.5;
      const maxX = isMobile() ? 3.0 : 4.0;
      const minY = isMobile() ? -3.0 : -2.5;
      const maxY = isMobile() ? -1.2 : -1.0;

      spiderTarget.x = minX + ((mouse.x + 1) / 2) * (maxX - minX);
      spiderTarget.y = minY + ((mouse.y + 1) / 2) * (maxY - minY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const loader = new GLTFLoader();

    loader.load(
      '/models/Spider.glb',
      (gltf) => {
        model = gltf.scene;
        model.traverse((child) => {
          if (child instanceof THREE.Bone && child.name.startsWith('Armature.')) {
            legBones.push(child);
          }
        });

        model.scale.set(
          isMobile() ? 0.6 : 1,
          isMobile() ? 0.6 : 1,
          isMobile() ? 0.6 : 1
        );
        model.position.set(
          isMobile() ? 1.8 : 2.7,
          isMobile() ? -2.0 : -1.7,
          -1
        );

        model.rotation.y = -Math.PI / 2 - Math.PI / 3;
        scene.add(model);
      },
      undefined,
      (error) => console.error('Error loading Spider.glb:', error)
    );

    loader.load(
      '/models/Web.glb',
      (gltf) => {
        webModel = gltf.scene;
        webModel.scale.set(
          (isMobile() ? 0.6 : 1) * 5,
          (isMobile() ? 0.6 : 1) * 5,
          5
        );
        webModel.position.set(
          isMobile() ? -2.5 : -3.7,
          isMobile() ? -6.0 : -5.7,
          -5
        );

        scene.add(webModel);
      },
      undefined,
      (error) => console.error('Error loading Web.glb:', error)
    );

    // Handle spider hop on click
    const handleMouseClick = () => {
      if (!model) return;
      const initialY = model.position.y;
      const hopHeight = 1;

      const hopUp = () => {
        model!.position.y += 0.1;
        if (model!.position.y < initialY + hopHeight) {
          requestAnimationFrame(hopUp);
        } else {
          hopDown();
        }
      };

      const hopDown = () => {
        model!.position.y -= 0.1;
        if (model!.position.y > initialY) {
          requestAnimationFrame(hopDown);
        } else {
          model!.position.y = initialY;
        }
      };

      hopUp();
    };

    window.addEventListener('click', handleMouseClick);

    // Handle window resize for responsive 3D scene
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);

      // Reposition camera and models if needed
      camera.position.set(0, isMobile() ? 1.5 : 1, isMobile() ? 8 : 5);
      if (model) {
        model.scale.set(isMobile() ? 0.6 : 1, isMobile() ? 0.6 : 1, isMobile() ? 0.6 : 1);
        model.position.set(isMobile() ? 1.8 : 2.7, isMobile() ? -2.0 : -1.7, -1);
      }
      if (webModel) {
        const scale = isMobile() ? 3 : 5;
        webModel.scale.set(scale, scale, 5);
        webModel.position.set(isMobile() ? -2.5 : -3.7, isMobile() ? -6.0 : -5.7, -5);
      }
    };


    window.addEventListener('resize', handleResize);

    // Animation loop for spider and web
    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (webModel) {
        const stretchX = 1 + 0.05 * mouse.x;
        const stretchY = 1 + 0.05 * mouse.y;
        webModel.scale.set(stretchX * 5, stretchY * 5, 5);
        webModel.rotation.z = 0.02 * Math.sin(t * 1.5);
      }

      if (model) {
        const crawlSpeed = 5;
        for (let i = 0; i < legBones.length; i++) {
          const bone = legBones[i];
          const phaseOffset = i % 2 === 0 ? 0 : Math.PI;
          const swing = 0.4 * Math.sin(t * crawlSpeed + phaseOffset + i);
          const lift = 0.2 * Math.cos(t * crawlSpeed + phaseOffset + i);
          bone.rotation.x = lift;
          bone.rotation.z = swing;
        }
        model.position.lerp(spiderTarget, 0.08);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Restart animation logic on tab focus
    const restartAnimation = () => {
      clock.start(); // reset/start clock if paused
    };
    window.addEventListener('focus', restartAnimation);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleMouseClick);
      window.removeEventListener('focus', restartAnimation);
      if (renderer) {
        renderer.dispose();
        if (mountNode?.contains(renderer.domElement)) {
          mountNode.removeChild(renderer.domElement);
        }
      }

      scene.clear();
    };
  }, [pathname]);


  // Render the 3D scene and landing content
  return (
    <main
      className="relative min-h-screen text-white"
      style={{
        background: 'linear-gradient(135deg, #1F51FF, #1F2937)',
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <div ref={mountRef} className="absolute top-0 left-0 w-full h-full z-0" />
      </div>
      {showContent && (
        <div className="relative z-10 flex flex-col items-center justify-center h-screen text-center px-4">
          <h1
            className="text-5xl md:text-6xl font-bold leading-tight mb-4 relative"
            style={{
              textShadow:
                '0 4px 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(31, 81, 255, 0.5)',
            }}
          >
            <span className="text-[#81BFDA]">Welcome to</span> PhotoBooth
          </h1>
          <p
            className="text-lg text-[#FBF8EF] mb-6 relative"
            style={{
              textShadow:
                '0 4px 10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(31, 81, 255, 0.5)',
            }}
          >
            Snap it. Style it. Save it. Experience the modern photobooth in your browser.
          </p>
          <Link
            href="/camera"
            className="inline-block bg-[#1B56FD] hover:bg-[#1B56FD] text-white font-medium py-3 px-6 rounded-2xl transition-all shadow-lg relative"
            style={{
              boxShadow:
                '0 4px 10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(31, 81, 255, 0.5)',
            }}
          >
            Start Photobooth
          </Link>
        </div>
      )}
    </main>
  );
}
