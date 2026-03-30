import * as THREE from 'three';

// Face value mapping for a standard die:
// +X face = 1, -X face = 6
// +Y face = 2, -Y face = 5
// +Z face = 3, -Z face = 4
const FACE_ROTATIONS: Record<number, THREE.Euler> = {
  1: new THREE.Euler(0, 0, Math.PI / 2),    // +X up
  2: new THREE.Euler(0, 0, 0),               // +Y up (default)
  3: new THREE.Euler(Math.PI / 2, 0, 0),     // +Z up
  4: new THREE.Euler(-Math.PI / 2, 0, 0),    // -Z up
  5: new THREE.Euler(Math.PI, 0, 0),          // -Y up
  6: new THREE.Euler(0, 0, -Math.PI / 2),    // -X up
};

const quaternionCache = new Map<number, THREE.Quaternion>();

export function getQuaternionForValue(value: number): THREE.Quaternion {
  if (quaternionCache.has(value)) return quaternionCache.get(value)!.clone();
  const q = new THREE.Quaternion().setFromEuler(FACE_ROTATIONS[value]);
  quaternionCache.set(value, q);
  return q.clone();
}

// Create a pip (dot) as a circle geometry merged into the face
function createPipPositions(value: number): THREE.Vector2[] {
  const s = 0.12; // pip spacing
  const positions: THREE.Vector2[] = [];

  const center = new THREE.Vector2(0, 0);
  const tl = new THREE.Vector2(-s, s);
  const tr = new THREE.Vector2(s, s);
  const bl = new THREE.Vector2(-s, -s);
  const br = new THREE.Vector2(s, -s);
  const ml = new THREE.Vector2(-s, 0);
  const mr = new THREE.Vector2(s, 0);

  switch (value) {
    case 1: positions.push(center); break;
    case 2: positions.push(tl, br); break;
    case 3: positions.push(tl, center, br); break;
    case 4: positions.push(tl, tr, bl, br); break;
    case 5: positions.push(tl, tr, center, bl, br); break;
    case 6: positions.push(tl, tr, ml, mr, bl, br); break;
  }
  return positions;
}

// Create a canvas texture atlas for dice faces (1x6 grid)
export function createDiceTexture(
  bodyColor: string,
  pipColor: string,
  size = 256
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size * 6;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  for (let face = 0; face < 6; face++) {
    const value = face + 1;
    const ox = face * size;

    // Background
    ctx.fillStyle = bodyColor;
    ctx.fillRect(ox, 0, size, size);

    // Border/edge
    ctx.strokeStyle = pipColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(ox + 4, 4, size - 8, size - 8);

    // Pips
    const pips = createPipPositions(value);
    ctx.fillStyle = pipColor;
    for (const pip of pips) {
      const cx = ox + size / 2 + pip.x * size;
      const cy = size / 2 - pip.y * size;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Creates 6 materials (one per box face) from the texture atlas
export function createFaceMaterials(texture: THREE.CanvasTexture): THREE.MeshStandardMaterial[] {
  // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
  // We map: +X=1, -X=6, +Y=2, -Y=5, +Z=3, -Z=4
  const faceToValue = [1, 6, 2, 5, 3, 4];

  return faceToValue.map((value) => {
    const mat = new THREE.MeshStandardMaterial({ map: texture.clone() });
    // Offset UV to show correct face
    mat.map!.repeat.set(1 / 6, 1);
    mat.map!.offset.set((value - 1) / 6, 0);
    mat.map!.needsUpdate = true;
    return mat;
  });
}

// Rounded box geometry for the die
export function createDieGeometry(radius = 0.06, size = 1, segments = 4): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(size, size, size, segments, segments, segments);
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  const halfSize = size / 2;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Clamp then round the corners
    const inner = new THREE.Vector3(
      Math.max(-halfSize + radius, Math.min(halfSize - radius, v.x)),
      Math.max(-halfSize + radius, Math.min(halfSize - radius, v.y)),
      Math.max(-halfSize + radius, Math.min(halfSize - radius, v.z))
    );

    const dir = v.clone().sub(inner);
    const len = dir.length();
    if (len > 1e-6) {
      dir.normalize().multiplyScalar(radius);
      v.copy(inner).add(dir);
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}
