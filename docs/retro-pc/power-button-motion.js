import * as THREE from 'three';

export class PowerButtonMotion {
  constructor(model, bounds, reducedMotion) {
    this.reducedMotion = reducedMotion;
    this.buttons = {};
    const point = new THREE.Vector3();
    for (const [name, box] of Object.entries(bounds)) {
      const parts = [];
      model.traverse(mesh => {
        if (!mesh.isMesh || Array.isArray(mesh.material)) return;
        const material = mesh.material.name;
        const movable = name === 'monitor'
          ? /Warm aged ABS|Dark plastic/.test(material)
          : /Warm grey keycaps/.test(material);
        if (!movable) return;
        const geometry = mesh.geometry, position = geometry.attributes.position;
        const vertices = new Set();
        for (let t = 0; t < geometry.index.count; t += 3) {
          const ids = [0, 1, 2].map(i => geometry.index.getX(t + i));
          if (ids.every(i => box.containsPoint(point.fromBufferAttribute(position, i)))) {
            ids.forEach(i => vertices.add(i));
          }
        }
        if (vertices.size) parts.push({ position, vertices: [...vertices].map(i => [i, position.getZ(i)]) });
      });
      this.buttons[name] = { parts, depth: name === 'monitor' ? .012 : .018, offset: 0, velocity: 0, held: false, releaseAt: 0 };
    }
  }
  press(name, pulse = false) {
    const button = this.buttons[name];
    if (!button) return;
    button.held = true;
    button.releaseAt = pulse ? performance.now() + 100 : 0;
  }
  release() {
    for (const button of Object.values(this.buttons)) { button.held = false; button.releaseAt = 0; }
  }
  update(time, delta) {
    let moving = false;
    for (const button of Object.values(this.buttons)) {
      if (button.releaseAt && time >= button.releaseAt) { button.held = false; button.releaseAt = 0; }
      const target = button.held ? -button.depth : 0;
      const steps = Math.max(1, Math.ceil(delta / .008)), step = delta / steps;
      for (let i = 0; i < steps; i++) {
        const damping = this.reducedMotion.matches || button.held ? 48 : 22;
        button.velocity += ((target - button.offset) * 650 - button.velocity * damping) * step;
        button.offset += button.velocity * step;
      }
      const settled = Math.abs(button.offset - target) < .00001 && Math.abs(button.velocity) < .0001;
      if (settled) { button.offset = target; button.velocity = 0; }
      else moving = true;
      if (button.releaseAt) moving = true;
      for (const { position, vertices } of button.parts) {
        for (const [i, z] of vertices) position.setZ(i, z + button.offset);
        position.needsUpdate = true;
      }
    }
    return moving;
  }
  get state() {
    return Object.fromEntries(Object.entries(this.buttons).map(([name, b]) => [name, { offset: b.offset, held: b.held, parts: b.parts.length }]));
  }
}
