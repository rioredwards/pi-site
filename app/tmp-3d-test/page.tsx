"use client";

import { useState } from "react";
import { PiModelCanvas } from "../../components/pi-model-canvas";

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

        <PiModelCanvas />

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
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-indigo-500" : "bg-zinc-700"
          }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-0"
            }`}
        />
      </button>
    </div>
  );
}
