import { Canvas } from "@react-three/fiber";
import { memo } from "react";
import { PiModel3D } from "./pi-model-3d";

const IMG_SRC = "/pi/pi.png";
const DEPTH_SRC = "/pi/pi_depth.png";

const DEFAULT_CONTROLS: PiModelCanvasProps = {
  width: 16,
  height: 7,
  fov: 15,
  near: 0.8,
  far: 10,
  cameraPosition: [0, 0, 3],
  ambientLightIntensity: 1.9,
  directionalLightPosition: [2, 2, 3],
  directionalLightIntensity: 1.2,
};

interface PiModelCanvasProps {
  width?: number;
  height?: number;
  fov?: number;
  near?: number;
  far?: number;
  cameraPosition?: [number, number, number];
  ambientLightIntensity?: number;
  directionalLightPosition?: [number, number, number];
  directionalLightIntensity?: number;
}

// Memoized to prevent WebGL context issues from parent re-renders
export const PiModelCanvas = memo(function PiModelCanvas(props: PiModelCanvasProps) {
  const combinedProps = {
    ...DEFAULT_CONTROLS,
    ...props,
  }
  const { width, height, fov, near, far, cameraPosition, ambientLightIntensity, directionalLightPosition, directionalLightIntensity } = combinedProps;
  return (
    <div
      style={{ aspectRatio: `${width}/${height}` }}
      className="w-full overflow-hidden"
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{ position: cameraPosition, fov: fov, near: near, far: far }}
      >
        <ambientLight intensity={ambientLightIntensity} />
        <directionalLight position={directionalLightPosition} intensity={directionalLightIntensity} />
        <PiModel3D imageSrc={IMG_SRC} depthSrc={DEPTH_SRC} />
      </Canvas>
    </div>
  );
});
