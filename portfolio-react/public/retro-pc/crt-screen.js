// A gently aged desktop CRT: soft light spread, fixed fine glass texture,
// and uneven edge falloff. Reflections come from the 3D glass material.
export class CrtSurface {
  constructor(canvas, display) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.display = display;
    this.glow = document.createElement('canvas');
    this.glow.width = 640;
    this.glow.height = 480;
    this.glowCtx = this.glow.getContext('2d');
    // Cache full-surface grain once: no moving static or repeating line pattern.
    this.grain = document.createElement('canvas');
    this.grain.width = canvas.width;
    this.grain.height = canvas.height;
    const g = this.grain.getContext('2d');
    const pixels = g.createImageData(canvas.width, canvas.height);
    let seed = 1997;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const value = seed >>> 24;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      pixels.data[i + 3] = 7;
    }
    g.putImageData(pixels, 0, 0);
  }
  apply() {
    const c = this.ctx, { x, y, scale } = this.display;
    const w = 1024 * scale, h = 768 * scale;
    this.glowCtx.clearRect(0, 0, 640, 480);
    this.glowCtx.drawImage(this.canvas, 0, 0, 640, 480);
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    // Mix in a soft image very lightly, keeping small text legible.
    c.globalAlpha = .65;
    c.drawImage(this.glow, 0, 0, 1024, 768);
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = .055;
    c.filter = 'blur(1.1px)';
    c.drawImage(this.glow, 0, 0, 1024, 768);
    c.filter = 'none';
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.drawImage(this.grain, 0, 0);
    const coating = c.createLinearGradient(x, y, x + w, y + h);
    coating.addColorStop(0, 'rgba(237,218,177,.08)');
    coating.addColorStop(.5, 'rgba(237,218,177,.035)');
    coating.addColorStop(1, 'rgba(30,39,53,.065)');
    c.fillStyle = coating;
    c.fillRect(x, y, w, h);
    c.translate(x + w / 2, y + h / 2);
    c.scale(w / 2, h / 2);
    const edge = c.createRadialGradient(-.12, -.1, .25, 0, 0, 1.42);
    edge.addColorStop(0, 'rgba(12,16,22,0)');
    edge.addColorStop(.65, 'rgba(12,16,22,.075)');
    edge.addColorStop(1, 'rgba(12,16,22,.28)');
    c.fillStyle = edge;
    c.fillRect(-1, -1, 2, 2);
    c.restore();

  }
}
