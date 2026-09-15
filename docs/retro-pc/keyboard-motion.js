import * as THREE from 'three';

// The supplied model batches all keycaps by material. Recover each separate
// key using connected geometry, keeping its printed legend attached.
export class KeyboardMotion {
  constructor(model, reducedMotion) {
    this.reducedMotion = reducedMotion;
    this.keys = [];
    this.vertexKeys = new Map();
    this.presses = new Map();
    model.traverse(mesh => {
      if (!mesh.isMesh || Array.isArray(mesh.material) || !/keycaps/.test(mesh.material.name)) return;
      const g = mesh.geometry, p = g.attributes.position;
      const parent = Array.from({ length: p.count }, (_, i) => i);
      const root = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
      const join = (a, b) => { parent[root(a)] = root(b); };
      const welded = new Map();
      for (let i = 0; i < p.count; i++) {
        const coordinate = `${p.getX(i)},${p.getY(i)},${p.getZ(i)}`;
        if (welded.has(coordinate)) join(i, welded.get(coordinate));
        else welded.set(coordinate, i);
      }
      for (let i = 0; i < g.index.count; i += 3) {
        join(g.index.getX(i), g.index.getX(i + 1));
        join(g.index.getX(i), g.index.getX(i + 2));
      }
      const groups = new Map();
      for (let i = 0; i < p.count; i++) { const r = root(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); }
      const lookup = new Map();
      for (const vertices of groups.values()) {
        const bounds = new THREE.Box3();
        vertices.forEach(i => bounds.expandByPoint(new THREE.Vector3().fromBufferAttribute(p, i)));
        if (bounds.min.z < 1.1 || bounds.max.y > .5) continue;
        const key = { id: this.keys.length, bounds, center: bounds.getCenter(new THREE.Vector3()), parts: [{ position: p, vertices: vertices.map(i => [i, p.getY(i)]) }], offset: 0, velocity: 0, holders: new Set() };
        this.keys.push(key);
        vertices.forEach(i => lookup.set(i, key));
      }
      this.vertexKeys.set(mesh, lookup);
    });
    model.traverse(mesh => {
      if (!mesh.isMesh || !mesh.name.includes('Printed')) return;
      const p = mesh.geometry.attributes.position, lookup = new Map();
      for (const key of this.keys) {
        const vertices = [];
        for (let i = 0; i < p.count; i++) {
          const b = key.bounds;
          if (p.getX(i) >= b.min.x && p.getX(i) <= b.max.x && p.getZ(i) >= b.min.z && p.getZ(i) <= b.max.z && p.getY(i) >= b.min.y && p.getY(i) <= b.max.y + .03) {
            vertices.push([i, p.getY(i)]); lookup.set(i, key);
          }
        }
        if (vertices.length) key.parts.push({ position: p, vertices });
      }
      this.vertexKeys.set(mesh, lookup);
    });
  }
  hit(intersection) { return intersection?.face ? this.vertexKeys.get(intersection.object)?.get(intersection.face.a) : null; }
  press(key, pointerId) { this.presses.set(pointerId, key); key.holders.add(pointerId); }
  release(pointerId) {
    this.presses.get(pointerId)?.holders.delete(pointerId);
    this.presses.delete(pointerId);
  }
  releaseAll() { for (const id of this.presses.keys()) this.release(id); }
  update(delta) {
    let moving = false;
    for (const key of this.keys) {
      const held = key.holders.size > 0, target = held ? -.028 : 0;
      if (key.offset === target && key.velocity === 0) continue;
      const steps = Math.max(1, Math.ceil(delta / .008)), dt = delta / steps;
      for (let i = 0; i < steps; i++) {
        const damping = held || this.reducedMotion.matches ? 52 : 20;
        key.velocity += ((target - key.offset) * 800 - key.velocity * damping) * dt;
        key.offset += key.velocity * dt;
      }
      if (Math.abs(key.offset - target) < .00001 && Math.abs(key.velocity) < .0001) { key.offset = target; key.velocity = 0; }
      moving = true;
      for (const part of key.parts) {
        for (const [i, y] of part.vertices) part.position.setY(i, y + key.offset);
        part.position.needsUpdate = true;
      }
    }
    return moving;
  }
  get state() { return { count: this.keys.length, active: this.keys.filter(k => k.offset || k.holders.size).map(k => ({ id: k.id, offset: k.offset, held: Boolean(k.holders.size), parts: k.parts.length })) }; }
}
