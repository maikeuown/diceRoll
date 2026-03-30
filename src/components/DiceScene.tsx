'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePlane, useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { getQuaternionForValue, createDiceTexture, createFaceMaterials, createDieGeometry } from './DiceGeometry';
import { SKIN_CONFIGS } from './DiceMaterials';
import type { DiceSkin, DropPhase } from '@/types';

const DICE_COUNT = 100;
const DICE_SIZE = 0.8;
const ARENA_SIZE = 12;
const SETTLE_START = 3.0; // seconds after drop to begin settling
const SETTLE_DURATION = 1.0; // seconds to slerp to target

interface DiceSceneProps {
  diceValues: number[] | null;
  phase: DropPhase;
  skin: DiceSkin;
  onSettled: () => void;
}

// Invisible wall/floor component
function Wall({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  usePlane(() => ({
    position,
    rotation,
    type: 'Static',
    material: { restitution: 0.5, friction: 0.4 },
  }));
  return null;
}

// Single die physics body that syncs to InstancedMesh
function DieBody({
  index,
  meshRef,
  targetValue,
  phase,
  dropTime,
}: {
  index: number;
  meshRef: React.RefObject<THREE.InstancedMesh | null>;
  targetValue: number;
  phase: DropPhase;
  dropTime: React.RefObject<number>;
}) {
  const settleProgress = useRef(0);
  const startQuat = useRef(new THREE.Quaternion());
  const targetQuat = useRef(new THREE.Quaternion());
  const hasStartedSettle = useRef(false);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const quaternion = useMemo(() => new THREE.Quaternion(), []);
  const scale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  // Grid layout for initial spawn positions
  const spawnPos = useMemo((): [number, number, number] => {
    const cols = 10;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const spacing = ARENA_SIZE / (cols + 1);
    return [
      -ARENA_SIZE / 2 + spacing * (col + 1) + (Math.random() - 0.5) * 0.5,
      15 + Math.random() * 10,
      -ARENA_SIZE / 2 + spacing * (row + 1) + (Math.random() - 0.5) * 0.5,
    ];
  }, [index]);

  const [ref, api] = useBox(() => ({
    mass: 0.3,
    args: [DICE_SIZE, DICE_SIZE, DICE_SIZE],
    position: spawnPos,
    rotation: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
    angularVelocity: [(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15],
    velocity: [0, -5 - Math.random() * 3, 0],
    material: { restitution: 0.6, friction: 0.4 },
    angularDamping: 0.4,
    linearDamping: 0.2,
    allowSleep: true,
    sleepSpeedLimit: 0.5,
  }));

  // Reset position when phase changes to dropping
  useEffect(() => {
    if (phase === 'dropping') {
      settleProgress.current = 0;
      hasStartedSettle.current = false;
      api.position.set(
        spawnPos[0],
        15 + Math.random() * 10,
        spawnPos[2]
      );
      api.velocity.set(0, -5 - Math.random() * 3, 0);
      api.angularVelocity.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );
      api.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      api.wakeUp();
    }
  }, [phase, api, spawnPos]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Read current physics transform
    if (ref.current) {
      ref.current.getWorldPosition(position);
      ref.current.getWorldQuaternion(quaternion);
    }

    // Settling logic: slerp to target quaternion
    if (phase === 'settling' || phase === 'dropping') {
      const elapsed = state.clock.elapsedTime - (dropTime.current || 0);

      if (elapsed > SETTLE_START && targetValue >= 1 && targetValue <= 6) {
        if (!hasStartedSettle.current) {
          hasStartedSettle.current = true;
          startQuat.current.copy(quaternion);
          targetQuat.current.copy(getQuaternionForValue(targetValue));
          settleProgress.current = 0;
        }

        settleProgress.current = Math.min(1, settleProgress.current + (1 / 60) / SETTLE_DURATION);
        const t = smoothstep(settleProgress.current);
        quaternion.slerpQuaternions(startQuat.current, targetQuat.current, t);

        // Override physics rotation
        api.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

        if (settleProgress.current >= 0.8) {
          api.velocity.set(0, 0, 0);
          api.angularVelocity.set(0, 0, 0);
        }
      }
    }

    // Update instanced mesh
    matrix.compose(position, quaternion, scale);
    meshRef.current.setMatrixAt(index, matrix);
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <group ref={ref as React.Ref<THREE.Group>} />;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export default function DiceScene({ diceValues, phase, skin, onSettled }: DiceSceneProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dropTime = useRef(0);
  const settledNotified = useRef(false);

  const skinConfig = SKIN_CONFIGS[skin];

  const geometry = useMemo(() => createDieGeometry(0.06, DICE_SIZE), []);
  const materials = useMemo(() => {
    const texture = createDiceTexture(skinConfig.bodyColor, skinConfig.pipColor);
    const mats = createFaceMaterials(texture);
    mats.forEach((mat) => {
      mat.roughness = skinConfig.roughness;
      mat.metalness = skinConfig.metalness;
      if (skinConfig.emissiveColor) {
        mat.emissive = new THREE.Color(skinConfig.emissiveColor);
        mat.emissiveIntensity = skinConfig.emissiveIntensity ?? 0;
      }
      if (skinConfig.transparent) {
        mat.transparent = true;
        mat.opacity = skinConfig.opacity ?? 1;
      }
    });
    return mats;
  }, [skinConfig]);

  // Track drop start time
  useEffect(() => {
    if (phase === 'dropping') {
      settledNotified.current = false;
    }
  }, [phase]);

  // Detect when settling is complete
  useFrame((state) => {
    if (phase === 'dropping' && dropTime.current === 0) {
      dropTime.current = state.clock.elapsedTime;
    }
    if (phase === 'dropping' || phase === 'settling') {
      const elapsed = state.clock.elapsedTime - dropTime.current;
      if (elapsed > SETTLE_START + SETTLE_DURATION + 0.5 && !settledNotified.current) {
        settledNotified.current = true;
        dropTime.current = 0;
        onSettled();
      }
    }
  });

  const values = diceValues ?? Array.from({ length: DICE_COUNT }, () => 1);

  return (
    <>
      {/* Arena walls */}
      <Wall position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <Wall position={[-ARENA_SIZE / 2, 5, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Wall position={[ARENA_SIZE / 2, 5, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Wall position={[0, 5, -ARENA_SIZE / 2]} rotation={[0, 0, 0]} />
      <Wall position={[0, 5, ARENA_SIZE / 2]} rotation={[0, Math.PI, 0]} />

      {/* InstancedMesh for all dice */}
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, DICE_COUNT]}
        material={materials}
        castShadow
        receiveShadow
        frustumCulled={false}
      />

      {/* Individual physics bodies */}
      {values.map((value, i) => (
        <DieBody
          key={i}
          index={i}
          meshRef={meshRef}
          targetValue={value}
          phase={phase}
          dropTime={dropTime}
        />
      ))}
    </>
  );
}
