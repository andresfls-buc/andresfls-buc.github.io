import * as THREE from 'three';

// Replace the two RETRO brand labels without changing the keyboard legends.
export function personalizeNameplates(mesh) {
  const geometry = mesh.geometry;
  const uv = geometry.attributes.uv;
  const labelVertices = new Set();
  const labels = [];
  for (let offset = 0; offset < geometry.index.count; offset += 3) {
    const vertices = [0, 1, 2].map(i => geometry.index.getX(offset + i));
    const isLabel = vertices.every(i =>
      uv.getX(i) > .374 && uv.getX(i) < .501 &&
      uv.getY(i) > .624 && uv.getY(i) < .688);
    labels.push(isLabel ? 1 : 0);
    if (isLabel) vertices.forEach(i => labelVertices.add(i));
  }
  if (!labelVertices.size) return;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#34372b';
  context.font = 'bold 76px "Courier New", monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Andres Landazabal', 512, 64, 990);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = 4;
  const material = mesh.material.clone();
  material.name = 'Andres Landazabal nameplate';
  material.map = texture;

  const xs = [...labelVertices].map(i => uv.getX(i));
  const ys = [...labelVertices].map(i => uv.getY(i));
  const left = Math.min(...xs), right = Math.max(...xs);
  const top = Math.min(...ys), bottom = Math.max(...ys);
  for (const i of labelVertices) {
    uv.setXY(i, (uv.getX(i) - left) / (right - left), (uv.getY(i) - top) / (bottom - top));
  }
  uv.needsUpdate = true;
  geometry.clearGroups();
  let start = 0;
  for (let i = 1; i <= labels.length; i++) {
    if (labels[i] !== labels[start]) {
      geometry.addGroup(start * 3, (i - start) * 3, labels[start]);
      start = i;
    }
  }
  mesh.material = [mesh.material, material];
}
