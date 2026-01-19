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
}

const DEFAULTS: PiTiltControls = {
  displacement: 0.12,
  invertDepth: false,
  rotationX: 0.25,
  rotationY: 0.35,
  lerpSpeed: 0.10,
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

    // Image texture (color)
    img.colorSpace = THREE.SRGBColorSpace;
    img.minFilter = THREE.LinearMipmapLinearFilter;
    img.magFilter = THREE.LinearFilter;
    img.anisotropy = 8;
    img.needsUpdate = true;

    // Depth texture (data-ish)
    depth.colorSpace = THREE.NoColorSpace;
    depth.minFilter = THREE.LinearFilter;
    depth.magFilter = THREE.LinearFilter;
    depth.needsUpdate = true;
  });

  // Custom shader: displace vertices based on depth map for real 3D geometry
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

          // Sample depth map
          float depth = texture2D(uDepth, uv).r;
          depth = mix(depth, 1.0 - depth, uInvertDepth);

          // Displace vertex along Z axis based on depth
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

  // Update uniforms when controls change
  useEffect(() => {
    material.uniforms.uDisplacement.value = controls.displacement;
    material.uniforms.uInvertDepth.value = controls.invertDepth ? 1.0 : 0.0;
  }, [material, controls.displacement, controls.invertDepth]);

  useFrame(({ pointer }) => {
    // pointer is already normalized roughly -1..1 in r3f
    const mx = THREE.MathUtils.clamp(pointer.x, -1, 1);
    const my = THREE.MathUtils.clamp(pointer.y, -1, 1);

    // Rotate the actual 3D mesh based on mouse position
    const targetRx = -my * controls.rotationX;
    const targetRy = mx * controls.rotationY;

    if (meshRef.current) {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        targetRx,
        controls.lerpSpeed
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRy,
        controls.lerpSpeed
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
