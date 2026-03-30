import type { DiceSkin } from '@/types';

export interface SkinConfig {
  bodyColor: string;
  pipColor: string;
  roughness: number;
  metalness: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
}

export const SKIN_CONFIGS: Record<DiceSkin, SkinConfig> = {
  matte: {
    bodyColor: '#e8e8e8',
    pipColor: '#1a1a1a',
    roughness: 0.9,
    metalness: 0.0,
  },
  neon: {
    bodyColor: '#1a1a2e',
    pipColor: '#00f5ff',
    roughness: 0.3,
    metalness: 0.1,
    emissiveColor: '#00f5ff',
    emissiveIntensity: 0.4,
  },
  glass: {
    bodyColor: '#b8d4e3',
    pipColor: '#0a0a0a',
    roughness: 0.1,
    metalness: 0.2,
    opacity: 0.85,
    transparent: true,
  },
  gold: {
    bodyColor: '#ffd700',
    pipColor: '#2a1a00',
    roughness: 0.3,
    metalness: 1.0,
  },
};
