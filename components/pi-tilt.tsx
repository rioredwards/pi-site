"use client";

import { useMemo, useRef, useState } from "react";

type Props = {
  src: string;
  className?: string;
  maxTiltDeg?: number; // e.g. 10
};

export function PiTilt({ src, className, maxTiltDeg = 10 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [rot, setRot] = useState({ rx: 0, ry: 0 });

  const style = useMemo(() => {
    const { rx, ry } = rot;
    return {
      transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`,
      transition: "transform 120ms ease-out",
    } as React.CSSProperties;
  }, [rot]);

  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);

    // Clamp to [-1, 1]
    const cx = Math.max(-1, Math.min(1, x));
    const cy = Math.max(-1, Math.min(1, y));

    setRot({
      rx: -cy * maxTiltDeg,
      ry: cx * maxTiltDeg,
    });
  }

  function onLeave() {
    setRot({ rx: 0, ry: 0 });
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={[
        "relative select-none",
        "rounded-3xl border border-white/10 bg-white/5 backdrop-blur",
        "overflow-hidden",
        className ?? "",
      ].join(" ")}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.18),transparent_55%),radial-gradient(circle_at_80%_60%,rgba(59,130,246,0.14),transparent_55%)]" />

      <div className="relative p-6" style={style}>
        <img
          src={src}
          alt="Raspberry Pi"
          draggable={false}
          className="mx-auto w-full max-w-[520px] drop-shadow-[0_25px_45px_rgba(0,0,0,0.55)]"
          style={{
            transform: "translateZ(30px)",
          }}
        />
      </div>
    </div>
  );
}
