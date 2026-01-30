"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

interface PiTiltControls {
  displacement: number;
  invertDepth: boolean;
  rotationX: number;
  rotationY: number;
  lerpSpeed: number;

  // ambient loop (optional)
  bobAmount?: number; // world units
  bobSpeed?: number; // radians/sec-ish
  idleTiltX?: number; // radians
  idleTiltY?: number; // radians
  idleTiltSpeed?: number;
}

const DEFAULTS: PiTiltControls = {
  displacement: 0.06,
  invertDepth: false,
  rotationX: 0.25,
  rotationY: 0.35,
  lerpSpeed: 0.1,

  bobAmount: 0.02,
  bobSpeed: 1.2,
  idleTiltX: 0.09,
  idleTiltY: 0.06,
  idleTiltSpeed: 0.9,
};

export function PiModel3D({
  imageSrc,
  depthSrc,
  controls = DEFAULTS,
}: {
  imageSrc: string;
  depthSrc: string;
  controls?: PiTiltControls;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const [imgTex, depthTex] = useTexture([imageSrc, depthSrc], (textures) => {
    const [img, depth] = textures as THREE.Texture[];

    img.colorSpace = THREE.SRGBColorSpace;
    img.minFilter = THREE.LinearMipmapLinearFilter;
    img.magFilter = THREE.LinearFilter;
    img.anisotropy = 8;
    img.needsUpdate = true;

    depth.colorSpace = THREE.NoColorSpace;
    depth.minFilter = THREE.LinearFilter;
    depth.magFilter = THREE.LinearFilter;
    depth.needsUpdate = true;
  });

  const material = useMemo(() => {
    const uniforms = {
      uImage: { value: imgTex },
      uDepth: { value: depthTex },
      uDisplacement: { value: controls.displacement },
      uInvertDepth: { value: controls.invertDepth ? 1.0 : 0.0 },
    };

    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms,
      vertexShader: /* glsl */ `
        uniform sampler2D uDepth;
        uniform float uDisplacement;
        uniform float uInvertDepth;

        varying vec2 vUv;

        void main() {
          vUv = uv;

          float depth = texture2D(uDepth, uv).r;
          depth = mix(depth, 1.0 - depth, uInvertDepth);

          vec3 displaced = position;
          displaced.z += depth * uDisplacement;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uImage;

        void main() {
          vec4 col = texture2D(uImage, vUv);
          gl_FragColor = col;
        }
      `,
    });
  }, [imgTex, depthTex, controls.displacement, controls.invertDepth]);

  useEffect(() => {
    material.uniforms.uDisplacement.value = controls.displacement;
    material.uniforms.uInvertDepth.value = controls.invertDepth ? 1.0 : 0.0;
  }, [material, controls.displacement, controls.invertDepth]);

  useFrame(({ pointer, clock }) => {
    const t = clock.getElapsedTime();

    // Pointer tilt
    const mx = THREE.MathUtils.clamp(pointer.x, -1, 1);
    const my = THREE.MathUtils.clamp(pointer.y, -1, 1);
    const pointerRx = -my * controls.rotationX;
    const pointerRy = mx * controls.rotationY;

    // Ambient loop
    const bobAmount = controls.bobAmount ?? 0.02;
    const bobSpeed = controls.bobSpeed ?? 1.2;
    const idleTiltX = controls.idleTiltX ?? 0.05;
    const idleTiltY = controls.idleTiltY ?? 0.04;
    const idleTiltSpeed = controls.idleTiltSpeed ?? 0.9;

    const bobY = Math.sin(t * bobSpeed) * bobAmount;

    // Slight “breathing” perspective tilt (phase-shifted so it feels organic)
    const ambientRx = Math.sin(t * idleTiltSpeed) * idleTiltX;
    const ambientRy = Math.sin(t * idleTiltSpeed * 0.85 + 1.1) * idleTiltY;

    // Combine
    const targetRx = pointerRx + ambientRx;
    const targetRy = pointerRy + ambientRy;

    if (meshRef.current) {
      // Smooth rotation
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        targetRx,
        controls.lerpSpeed,
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRy,
        controls.lerpSpeed,
      );

      // Smooth bob (keep x/z stable)
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        bobY,
        Math.min(1, controls.lerpSpeed * 0.6),
      );
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[1.2, 0.8, 128, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
