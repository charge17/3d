'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Grid,
  ContactShadows,
  useProgress,
  Html,
} from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// ============================================================
// Loading overlay
// ============================================================
function Loader() {
  const { progress, active } = useProgress();
  return (
    <Html center>
      <div style={{
        color: '#598dff',
        fontSize: '14px',
        textAlign: 'center',
        background: 'rgba(10,10,20,0.9)',
        padding: '16px 24px',
        borderRadius: '12px',
        border: '1px solid #2a2a4a',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⬡</div>
        Loading 3D Model...
        <br />
        <span style={{ color: '#9898b8', fontSize: '12px' }}>
          {active ? `${progress.toFixed(0)}%` : 'Ready'}
        </span>
      </div>
    </Html>
  );
}

// ============================================================
// Fallback when no model URL
// ============================================================
function PlaceholderScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#598dff" />
      <pointLight position={[-5, 3, -5]} intensity={0.4} color="#a78bfa" />

      <mesh rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial
          color="#3366ff"
          metalness={0.3}
          roughness={0.2}
          wireframe={false}
        />
      </mesh>

      <Grid
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2a2a4a"
        fadeDistance={30}
      />
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={10}
        blur={2.5}
        far={4}
      />
    </>
  );
}

// ============================================================
// Model display
// ============================================================
function ModelDisplay({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const modelRef = useRef<THREE.Group>(null);

  // Auto-center and scale
  useEffect(() => {
    if (gltf?.scene && modelRef.current) {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4 / maxDim;

      gltf.scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      gltf.scene.scale.setScalar(scale);
    }
  }, [gltf]);

  // Apply default material if missing
  useEffect(() => {
    if (gltf?.scene) {
      gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && !child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#598dff',
            metalness: 0.1,
            roughness: 0.4,
          });
        }
      });
    }
  }, [gltf]);

  return <primitive ref={modelRef} object={gltf.scene} />;
}

// ============================================================
// Scene content
// ============================================================
function Scene({ url }: { url: string | null }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(5, 3, 7);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[8, 12, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-4, 6, -4]} intensity={0.3} color="#a78bfa" />
      <pointLight position={[0, 8, 0]} intensity={0.2} color="#f472b6" />

      {/* Model or placeholder */}
      {url ? (
        <Suspense fallback={<Loader />}>
          <ModelDisplay url={url} />
        </Suspense>
      ) : (
        <PlaceholderScene />
      )}

      {/* Environment */}
      <Environment preset="city" />
      <Grid
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.5}
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#2a2a4a"
        fadeDistance={25}
      />
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.5}
        scale={10}
        blur={2}
        far={4}
      />

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={15}
        maxPolarAngle={Math.PI * 0.8}
      />
    </>
  );
}

// ============================================================
// Exported component
// ============================================================
interface ModelViewerProps {
  modelUrl: string | null;
  className?: string;
  height?: string;
}

export default function ModelViewer({
  modelUrl,
  className = '',
  height = '500px',
}: ModelViewerProps) {
  return (
    <div className={`viewer-container ${className}`} style={{ height }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [5, 3, 7], fov: 45 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Scene url={modelUrl} />
      </Canvas>
    </div>
  );
}
