'use client';

import { useState, useCallback, useEffect, Suspense, useTransition } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Environment } from '@react-three/drei';
import DiceScene from './DiceScene';
import WebGLFallback from './WebGLFallback';
import { rollDice } from '@/actions/roll';
import type { DiceSkin, DropPhase, Profile } from '@/types';

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return !!gl;
  } catch {
    return false;
  }
}

interface DiceCanvasProps {
  profile: Profile | null;
  canDrop: boolean;
}

export default function DiceCanvas({ profile, canDrop: initialCanDrop }: DiceCanvasProps) {
  const [diceValues, setDiceValues] = useState<number[] | null>(null);
  const [phase, setPhase] = useState<DropPhase>('idle');
  const [score, setScore] = useState<number | null>(null);
  const [canDrop, setCanDrop] = useState(initialCanDrop);
  const [skin, setSkin] = useState<DiceSkin>(profile?.active_skin ?? 'matte');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    setWebglSupported(detectWebGL());
  }, []);

  const handleDrop = useCallback(() => {
    if (!canDrop || phase === 'dropping' || phase === 'settling') return;

    setError(null);
    setPhase('dropping');
    setScore(null);

    startTransition(async () => {
      try {
        const result = await rollDice();
        setDiceValues(result.diceValues);
        setScore(result.score);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Drop failed');
        setPhase('idle');
      }
    });
  }, [canDrop, phase]);

  const handleSettled = useCallback(() => {
    setPhase('done');
    setCanDrop(false);
  }, []);

  return (
    <div className="relative w-full h-full">
      {!webglSupported && <WebGLFallback />}
      <Canvas
        shadows
        camera={{ position: [0, 22, 16], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-5, 10, -5]} intensity={0.5} color="#4a00e0" />
        <pointLight position={[5, 10, 5]} intensity={0.3} color="#00d4ff" />

        <Suspense fallback={null}>
          <Physics gravity={[0, -30, 0]} iterations={10} tolerance={0.001}>
            <DiceScene
              diceValues={diceValues}
              phase={phase}
              skin={skin}
              onSettled={handleSettled}
            />
          </Physics>
          <Environment preset="night" />
        </Suspense>

        {/* Floor visual */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#12121a" roughness={0.8} metalness={0.2} />
        </mesh>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl md:text-4xl font-bold tracking-wider text-white/90 drop-shadow-lg">
            THE 100-DICE GAUNTLET
          </h1>
        </div>

        {/* Score display */}
        {score !== null && phase === 'done' && (
          <div className="text-center animate-fade-in">
            <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-lg">
              {score}
            </div>
            <p className="text-white/60 text-sm mt-1">points scored this drop</p>
          </div>
        )}

        {/* Bottom controls */}
        <div className="flex flex-col items-center gap-3 pointer-events-auto">
          {/* Skin selector */}
          <div className="flex gap-2">
            {(['matte', 'neon', 'glass', 'gold'] as DiceSkin[]).map((s) => (
              <button
                key={s}
                onClick={() => setSkin(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  skin === s
                    ? 'bg-white/20 text-white ring-1 ring-white/40'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Drop button */}
          <button
            onClick={handleDrop}
            disabled={!canDrop || phase === 'dropping' || phase === 'settling' || isPending || !profile}
            className={`
              px-10 py-4 rounded-2xl text-lg font-black uppercase tracking-[0.2em] transition-all duration-300
              ${canDrop && profile
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
              }
            `}
          >
            {!profile
              ? 'Sign in to drop'
              : phase === 'dropping' || phase === 'settling'
              ? 'Dropping...'
              : isPending
              ? 'Rolling...'
              : canDrop
              ? 'Drop the dice'
              : 'Come back tomorrow'}
          </button>
        </div>
      </div>
    </div>
  );
}
