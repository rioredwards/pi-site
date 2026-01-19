"use client";

import { useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const IMG_SRC = "/pi/pi.png";
const DEPTH_SRC = "/pi/pi_depth.png";

interface Controls {
  displacement: number;
  invertDepth: boolean;
  rotationX: number;
  rotationY: number;
  lerpSpeed: number;
}

const DEFAULT_CONTROLS: Controls = {
  displacement: 0.12,
  invertDepth: false,
  rotationX: 0.25,
  rotationY: 0.35,
  lerpSpeed: 0.10,
};

export default function Page() {
  const [controls, setControls] = useState<Controls>(DEFAULT_CONTROLS);

  const updateControl = <K extends keyof Controls>(key: K, value: Controls[K]) => {
    setControls((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-[100svh] bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">3D Pi (Depth Displacement)</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Move your mouse over the canvas. Adjust the controls below to fine-tune the effect.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="aspect-[16/7] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950 to-zinc-900">
            <Canvas
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
              camera={{ position: [0, 0, 1.5], fov: 45, near: 0.1 }}
            >
              <ambientLight intensity={0.9} />
              <directionalLight position={[2, 2, 3]} intensity={1.2} />
              <PiCard imageSrc={IMG_SRC} depthSrc={DEPTH_SRC} controls={controls} />
            </Canvas>
          </div>

          {/* Control Panel */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Slider
              label="Displacement"
              value={controls.displacement}
              min={0}
              max={0.4}
              step={0.01}
              onChange={(v) => updateControl("displacement", v)}
            />
            <Slider
              label="Rotation X"
              value={controls.rotationX}
              min={0}
              max={0.8}
              step={0.01}
              onChange={(v) => updateControl("rotationX", v)}
            />
            <Slider
              label="Rotation Y"
              value={controls.rotationY}
              min={0}
              max={0.8}
              step={0.01}
              onChange={(v) => updateControl("rotationY", v)}
            />
            <Slider
              label="Smoothing"
              value={controls.lerpSpeed}
              min={0.01}
              max={0.3}
              step={0.01}
              onChange={(v) => updateControl("lerpSpeed", v)}
            />
            <Toggle
              label="Invert Depth"
              value={controls.invertDepth}
              onChange={(v) => updateControl("invertDepth", v)}
            />
            <button
              onClick={() => setControls(DEFAULT_CONTROLS)}
              className="h-10 rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-zinc-300 transition-colors hover:bg-white/10"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            Assets: <code>{IMG_SRC}</code> + <code>{DEPTH_SRC}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <label className="text-zinc-400">{label}</label>
        <span className="font-mono text-xs text-zinc-500">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-indigo-500"
      />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex h-10 items-center justify-between">
      <label className="text-sm text-zinc-400">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          value ? "bg-indigo-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function PiCard({
  imageSrc,
  depthSrc,
  controls,
}: {
  imageSrc: string;
  depthSrc: string;
  controls: Controls;
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
