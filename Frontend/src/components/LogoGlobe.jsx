import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * LogoGlobe — wraps the SocioSphere logo image around a 3D sphere
 * and rotates it like a globe in movies (WebGL / Three.js).
 *
 * - The logo texture is mapped onto the sphere (equirectangular-ish wrap).
 * - Sphere rotates slowly on Y axis 24/7 + a subtle tilt.
 * - Transparent background (alpha canvas) so it sits behind the UI.
 */
export default function LogoGlobe({ size = 380, opacity = 1, className = "" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // renderer with alpha (transparent bg)
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3.2);

    // texture from the logo image
    const loader = new THREE.TextureLoader();
    const texture = loader.load("/logo-sphere.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = 1; // wrap once around
    texture.anisotropy = 4;

    const geometry = new THREE.SphereGeometry(1.35, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.rotation.x = -0.15; // subtle tilt like the logo
    scene.add(sphere);

    // faint atmosphere glow ring behind the sphere
    const glowGeo = new THREE.SphereGeometry(1.42, 48, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff4ecd,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    // animate — rotate Y like a globe, 24/7
    let raf;
    const animate = () => {
      sphere.rotation.y += 0.008; // slow globe spin
      sphere.rotation.x = -0.15 + Math.sin(Date.now() * 0.0005) * 0.06; // gentle wobble
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      texture.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      className={`logo-globe ${className}`}
      style={{ width: size, height: size, opacity, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
