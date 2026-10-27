/* Mr. Boni — fixed, overhead arena. All artwork is drawn locally on canvas. */
import { CONFIG, getFreshness } from './engine.js';

const WORLD = { width: CONFIG.worldWidth, height: CONFIG.worldHeight };
// Levels share one physical arena. Only the active sheet's ice is rendered.
const ARENA_RINK = CONFIG.rinks[0];
const LAYER_SCALE = 3;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const HIGHLIGHT_COLORS = {
  missed: { rgb: [255, 52, 52], hex: '#ff3434' },
  pool: { rgb: [22, 118, 164], hex: '#1676a4' },
};
const GLOW_STYLES = { base: { radius: 4, strength: 150 }, near: { radius: 5, strength: 190 },
  pulse: { radius: 7, strength: 190 } };

function insideRink(x, y, rink) {
  const nearX = clamp(x, rink.x + rink.radius, rink.x + rink.w - rink.radius);
  const nearY = clamp(y, rink.y + rink.radius, rink.y + rink.h - rink.radius);
  return x >= rink.x && x <= rink.x + rink.w && y >= rink.y && y <= rink.y + rink.h &&
    (x - nearX) ** 2 + (y - nearY) ** 2 <= rink.radius ** 2;
}

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hash(x, y, seed = 0) {
  let n = Math.imul((x | 0) ^ (seed * 541), 374761393) + Math.imul(y | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function rounded(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function box(ctx, x, y, w, h, fill, stroke, radius = 0) {
  rounded(ctx, x, y, w, h, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function line(ctx, x1, y1, x2, y2, color, width = 0.4) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}

function circle(ctx, x, y, r, stroke, fill, width = 0.3) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function label(ctx, value, x, y, size, color = '#e8f3fb', align = 'left', weight = 600) {
  ctx.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

export class ArenaRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = 0;
    this.height = 0;
    this.rinkLayers = new Map();
    this.runRinks = null;
    this.camera = null;
    this.cameraTime = null;
    this.cameraLevel = null;
    this.cameraNeedsSettle = true;
    this.showMissed = false;
    this.showDumpIntro = false;
    this.cameraDumpIntro = false;
    this.reducedMotionQuery = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)') || null;
    this.makeCanvas = (width, height) => {
      const layer = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(Math.ceil(width), Math.ceil(height))
        : canvas.ownerDocument.createElement('canvas');
      layer.width = Math.ceil(width); layer.height = Math.ceil(height);
      return layer;
    };
    this.floor = this.makeCanvas(WORLD.width * LAYER_SCALE, WORLD.height * LAYER_SCALE);
    this.structure = this.makeCanvas(WORLD.width * LAYER_SCALE, WORLD.height * LAYER_SCALE);
    this.drawFloor(this.floor.getContext('2d'));
    this.drawStructure(this.structure.getContext('2d'));
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    const style = typeof globalThis.getComputedStyle === 'function' ? globalThis.getComputedStyle(this.canvas) : null;
    const inset = side => Math.max(0, parseFloat(style?.getPropertyValue(`--play-${side}`)) || 0) * ratio;
    const top = inset('top'), bottom = inset('bottom'), left = inset('left'), right = inset('right');
    const verticalScale = Math.min(1, Math.max(0, height - 1) / Math.max(1, top + bottom));
    const horizontalScale = Math.min(1, Math.max(0, width - 1) / Math.max(1, left + right));
    const playTop = top * verticalScale, playBottom = bottom * verticalScale;
    const playLeft = left * horizontalScale, playRight = right * horizontalScale;
    if (width !== this.width || height !== this.height || playTop !== this.playTop || playBottom !== this.playBottom ||
        playLeft !== this.playLeft || playRight !== this.playRight) {
      this.canvas.width = this.width = width;
      this.canvas.height = this.height = height;
      this.cameraNeedsSettle = true;
    }
    this.pixelRatio = ratio;
    this.playTop = playTop; this.playBottom = playBottom;
    this.playLeft = playLeft; this.playRight = playRight;
    this.playHeight = Math.max(1, height - playTop - playBottom);
    this.playWidth = Math.max(1, width - playLeft - playRight);
    this.scale = Math.min(this.playWidth / (ARENA_RINK.w + 12), this.playHeight / (ARENA_RINK.h + 12));
  }

  updateCamera(game, now = performance.now()) {
    if (this.cameraDumpIntro !== this.showDumpIntro) {
      this.cameraDumpIntro = this.showDumpIntro;
      this.cameraNeedsSettle = true;
      this.scale = Math.min(this.playWidth / (ARENA_RINK.w + 12), this.playHeight / (ARENA_RINK.h + 12));
    }
    if (this.showDumpIntro) {
      // The briefing uses the same overhead view, fitted to the complete building.
      this.scale = Math.min(this.playWidth / (WORLD.width + 12), this.playHeight / (WORLD.height + 12));
      this.camera = { x: WORLD.width / 2, y: WORLD.height / 2 };
      this.cameraTime = now; this.cameraLevel = game.level; this.cameraNeedsSettle = false;
      this.offsetX = this.playLeft + this.playWidth / 2 - this.camera.x * this.scale;
      this.offsetY = this.playTop + this.playHeight / 2 - this.camera.y * this.scale;
      return;
    }
    const rink = game.rinks[(game.level || 1) - 1], v = game.vehicle, gate = CONFIG.gate;
    const rinkCenterX = rink.x + rink.w / 2, rinkCenterY = rink.y + rink.h / 2;
    const halfW = this.playWidth / this.scale / 2, halfH = this.playHeight / this.scale / 2;
    const minX = Math.min(WORLD.width / 2, halfW - 2), maxX = Math.max(WORLD.width / 2, WORLD.width + 2 - halfW);
    const minY = Math.min(WORLD.height / 2, halfH - 2), maxY = Math.max(WORLD.height / 2, WORLD.height + 2 - halfH);
    let service = 0;
    const onIce = insideRink(v.x, v.y, rink);
    if (!onIce) {
      const gateDepth = (v.x - gate.center.x) * gate.normal.x + (v.y - gate.center.y) * gate.normal.y;
      const exitBlend = clamp(Math.max(gateDepth, (v.y - rink.y - rink.h) * 1.4) / 14, 0, 1);
      const progress = clamp((v.y - gate.center.y) / Math.max(1, 245 - gate.center.y), 0, 1);
      service = exitBlend * (.5 + .5 * (1 - (1 - progress) ** 2));
    }
    const target = {
      x: clamp(rinkCenterX + (CONFIG.dump.x + CONFIG.dump.w / 2 - rinkCenterX) * service, minX, maxX),
      y: clamp(rinkCenterY + (Math.min(180, maxY) - rinkCenterY) * service, minY, maxY),
    };
    if (!this.camera || this.cameraNeedsSettle || this.cameraLevel !== game.level) {
      this.camera = target;
    } else {
      const dt = clamp((now - (this.cameraTime ?? now)) / 1000, 0, .1);
      const blend = 1 - Math.exp(-7 * dt);
      this.camera.x += (target.x - this.camera.x) * blend;
      this.camera.y += (target.y - this.camera.y) * blend;
    }
    // Panning must never leave the vehicle behind an edge or a mobile control.
    const margin = Math.min(9, halfW * .25, halfH * .25);
    this.camera.x = clamp(clamp(this.camera.x, minX, maxX), v.x - halfW + margin, v.x + halfW - margin);
    this.camera.y = clamp(clamp(this.camera.y, minY, maxY), v.y - halfH + margin, v.y + halfH - margin);
    // Re-entering the ice must immediately reveal the complete sheet, even
    // while the service-area easing still has time left to settle.
    if (onIce) {
      this.camera.x = clamp(this.camera.x, rink.x + rink.w + 6 - halfW, rink.x - 6 + halfW);
      this.camera.y = clamp(this.camera.y, rink.y + rink.h + 6 - halfH, rink.y - 6 + halfH);
    }
    this.cameraTime = now; this.cameraLevel = game.level; this.cameraNeedsSettle = false;
    this.offsetX = this.playLeft + this.playWidth / 2 - this.camera.x * this.scale;
    this.offsetY = this.playTop + this.playHeight / 2 - this.camera.y * this.scale;
  }

  getCameraState() {
    if (!this.camera) return null;
    return Object.freeze({
      centerX: this.camera.x, centerY: this.camera.y, scale: this.scale, pixelRatio: this.pixelRatio,
      viewport: Object.freeze({ x: this.camera.x - this.playWidth / this.scale / 2,
        y: this.camera.y - this.playHeight / this.scale / 2, width: this.playWidth / this.scale, height: this.playHeight / this.scale }),
      playRect: Object.freeze({ x: this.playLeft, y: this.playTop, width: this.playWidth, height: this.playHeight }),
    });
  }

  drawFloor(ctx) {
    ctx.scale(LAYER_SCALE, LAYER_SCALE);
    const rng = random(6701026);
    const rink = ARENA_RINK, corridor = CONFIG.corridor, dump = CONFIG.dump, gate = CONFIG.gate;
    const dumpCenter = dump.x + dump.w / 2;
    const routeY = corridor.y + corridor.h * .62;
    const floor = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height);
    floor.addColorStop(0, '#4d657c'); floor.addColorStop(0.48, '#71869a'); floor.addColorStop(1, '#405b73');
    ctx.fillStyle = floor; ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // Concrete slabs and stippled aggregate. These never repaint during play.
    for (let y = 0; y < WORLD.height; y += 12) {
      for (let x = 0; x < WORLD.width; x += 15) {
        ctx.fillStyle = `rgba(${rng() > .5 ? '255,248,229' : '24,39,39'},${rng() * .05})`;
        ctx.fillRect(x + .35, y + .35, 14.3, 11.3);
      }
      line(ctx, 0, y, WORLD.width, y, 'rgba(13,36,62,.12)', .18);
    }
    for (let x = 0; x < WORLD.width; x += 15) line(ctx, x, 0, x, WORLD.height, 'rgba(13,36,62,.1)', .18);
    for (let n = 0; n < WORLD.width * WORLD.height / 5; n++) {
      ctx.fillStyle = n % 2 ? 'rgba(235,248,255,.1)' : 'rgba(6,28,52,.09)';
      ctx.fillRect(rng() * WORLD.width, rng() * WORLD.height, .15 + rng() * .4, .15 + rng() * .45);
    }
    for (let n = 0; n < WORLD.width; n++) {
      const x = rng() * WORLD.width, y = rng() * WORLD.height;
      line(ctx, x, y, x + rng() * 5 - 2.5, y + rng() * 1.6 - .8, 'rgba(19,41,63,.1)', .12);
    }
    // Broad worn patches and reflected strip lights break up the flat concrete.
    for (const x of [rink.x - 10, rink.x + rink.w + 10]) {
      const light = ctx.createLinearGradient(x - 5, 0, x + 5, 0);
      light.addColorStop(0, 'rgba(190,232,255,0)');
      light.addColorStop(.5, 'rgba(190,232,255,.15)');
      light.addColorStop(1, 'rgba(190,232,255,0)');
      ctx.fillStyle = light; ctx.fillRect(x - 5, rink.y, 10, rink.h);
    }
    for (let n = 0; n < 16; n++) {
      const x = corridor.x + rng() * corridor.w, y = corridor.y + 15 + rng() * (WORLD.height - corridor.y - 20);
      const stain = ctx.createRadialGradient(x, y, 0, x, y, 3 + rng() * 4);
      stain.addColorStop(0, 'rgba(11,37,65,.13)'); stain.addColorStop(1, 'rgba(11,37,65,0)');
      ctx.fillStyle = stain; ctx.fillRect(x - 7, y - 7, 14, 14);
    }

    // One open rink gate leads into the short service lane and snow bay.
    box(ctx, corridor.x + 1, corridor.y + 5, corridor.w - 2, 10.5, '#263f5d', null, .7);
    for (let x = corridor.x + 1; x < corridor.x + corridor.w - 1; x += .75) {
      line(ctx, x, corridor.y + 5.5, x, corridor.y + 15, 'rgba(4,19,39,.23)', .17);
    }
    ctx.beginPath(); ctx.moveTo(gate.center.x, gate.center.y);
    ctx.lineTo(gate.outer.x, gate.outer.y);
    ctx.quadraticCurveTo(gate.outer.x - 2, routeY, dumpCenter, routeY);
    ctx.lineTo(dumpCenter, dump.y + 3);
    ctx.strokeStyle = 'rgba(67,214,243,.6)'; ctx.lineWidth = .58; ctx.stroke();
    ctx.setLineDash([2.2, 2]);
    line(ctx, corridor.x, corridor.y + corridor.h - 5.5, corridor.x + corridor.w, corridor.y + corridor.h - 5.5, 'rgba(67,214,243,.62)', .45);
    ctx.setLineDash([]);
    this.arrow(ctx, dumpCenter, dump.y - 2, Math.PI / 2, '#43d6f3', 2.5);

    ctx.save(); ctx.shadowBlur = 4 * LAYER_SCALE; ctx.shadowColor = 'rgba(2,17,37,.48)';
    ctx.shadowOffsetY = 1.5 * LAYER_SCALE; ctx.shadowOffsetX = .8 * LAYER_SCALE;
    box(ctx, rink.x - 2.2, rink.y - 2.2, rink.w + 4.4, rink.h + 4.4, '#092854', null, rink.radius + 2);
    ctx.restore();
    this.drawDump(ctx);
    this.drawWorkshop(ctx);
    this.drawAisles(ctx);
    this.drawGateBridge(ctx);

    // Building wall, services, and restrained fluorescent lighting.
    box(ctx, 0, 0, WORLD.width, 3, '#082244');
    box(ctx, 0, 0, 3.3, WORLD.height, '#082244');
    box(ctx, WORLD.width - 3.3, 0, 3.3, WORLD.height, '#082244');
    box(ctx, 0, WORLD.height - 2.5, WORLD.width, 2.5, '#082244');
    for (const x of [5, WORLD.width - 5]) {
      line(ctx, x, 9, x, WORLD.height - 10, '#163858', 1.25);
      line(ctx, x - .3, 9, x - .3, WORLD.height - 10, '#91afc5', .3);
      for (let y = 16; y < WORLD.height - 15; y += 35) {
        box(ctx, x - 1.6, y, 3.2, 4, '#123555', '#06254a', .2);
        box(ctx, x - .4, y + .4, .8, 3.2, '#d3edf9');
      }
    }
  }

  arrow(ctx, x, y, angle, color, size = 2) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(-size, -size * .65); ctx.lineTo(size * .45, 0); ctx.lineTo(-size, size * .65);
    ctx.strokeStyle = color; ctx.lineWidth = .45; ctx.stroke(); ctx.restore();
  }

  drawGateBridge(ctx) {
    const gate = CONFIG.gate, half = gate.width / 2;
    const corner = (point, sign) => ({ x: point.x + gate.tangent.x * half * sign, y: point.y + gate.tangent.y * half * sign });
    const points = [corner(gate.inner, -1), corner(gate.inner, 1), corner(gate.outer, 1), corner(gate.outer, -1)];
    ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.closePath(); ctx.fillStyle = '#53728a'; ctx.fill();
    for (let along = -half + .5; along < half; along += .7) {
      line(ctx, gate.inner.x + gate.tangent.x * along, gate.inner.y + gate.tangent.y * along,
        gate.outer.x + gate.tangent.x * along, gate.outer.y + gate.tangent.y * along, 'rgba(12,32,54,.19)', .15);
    }
    line(ctx, gate.center.x, gate.center.y, gate.outer.x, gate.outer.y, '#43d6f3', .6);
    this.arrow(ctx, gate.center.x + gate.normal.x * 8, gate.center.y + gate.normal.y * 8,
      Math.atan2(gate.normal.y, gate.normal.x), '#43d6f3', 2);
  }

  drawDump(ctx) {
    const dump = CONFIG.dump;
    ctx.save(); ctx.translate(dump.x, dump.y); ctx.scale(dump.w / 67, dump.h / 30);
    box(ctx, 0, 0, 67, 30, '#284762', '#092a4f', .6);
    box(ctx, 2, 1, 63, 27, '#5b7891', null, .3);
    ctx.save(); rounded(ctx, 2, 1, 63, 27, .3); ctx.clip();
    for (let x = -29; x < 81; x += 4) line(ctx, x, 30, x + 30, 0, 'rgba(249,115,22,.38)', 1.5);
    ctx.restore();
    box(ctx, 7, 2, 53, 24, '#6a879e', null, .3);
    line(ctx, .5, 0, .5, 30, '#f97316', 1);
    line(ctx, 66.5, 0, 66.5, 30, '#f97316', 1);
    line(ctx, .5, 29.5, 66.5, 29.5, '#f97316', 1);
    for (const x of [1, 66]) { circle(ctx, x, .6, 1, '#071d35', '#f97316', .35); }
    // A bank of already dumped snow leaves a clear unloading pad in front.
    const rng = random(1445);
    for (let n = 0; n < 52; n++) {
      const x = 9 + rng() * 49, y = 21 + rng() * 6;
      const radius = 1.2 + rng() * 2.8;
      const points = Array.from({ length: 9 }, (_, i) => {
        const angle = i / 9 * Math.PI * 2, r = radius * (.7 + rng() * .3);
        return [Math.cos(angle) * r, Math.sin(angle) * r * .7];
      });
      for (const [offsetX, offsetY, color] of [[.4, .6, '#617d95'], [0, 0, n % 3 ? '#d5e7f1' : '#edf6fb']]) {
        ctx.beginPath();
        points.forEach(([px, py], i) => i ? ctx.lineTo(x + px + offsetX, y + py + offsetY) : ctx.moveTo(x + px + offsetX, y + py + offsetY));
        ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      }
      line(ctx, x - radius * .35, y - radius * .2, x + radius * .5, y - radius * .35, 'rgba(242,252,255,.38)', .3);
    }
    box(ctx, 14, 8.5, 38, 7, '#0b3157', 'rgba(140,217,244,.32)', .5);
    label(ctx, 'SNOW DUMP', 33, 12, 3.9, '#f6fcff', 'center', 700);
    ctx.restore();
  }

  drawWorkshop(ctx) {
    // One compact workshop fits beside the dump, below the driveable lane.
    const x = CONFIG.dump.x + CONFIG.dump.w + 7;
    const y = CONFIG.dump.y + 5, width = WORLD.width - x - 9;
    box(ctx, x + 1, y + 2, width, 22, 'rgba(9,29,51,.18)', null, .3);
    box(ctx, x, y, width, 3.2, '#153955', '#08274b', .3);
    box(ctx, x, y + .2, width, .75, '#8daabd');
    for (let p = x + 1; p < x + width - 6; p += 8) {
      box(ctx, p, y + 3.4, 6.6, 6.5, '#294e6a', '#0b2948', .2);
      line(ctx, p + 1.8, y + 6, p + 4.7, y + 6, '#b1c8d9', .3);
    }
    line(ctx, x, y + 21, x + width, y + 21, 'rgba(17,40,65,.3)', .3);
    for (const crateX of [x + 2, x + 15]) {
      box(ctx, crateX, y - 3.3, 8.2, 3, '#33516c', '#102c4b', .2);
      line(ctx, crateX + .3, y - 2.8, crateX + 7.8, y - 2.8, '#9ab6c9', .25);
      for (let n = 1; n < 6; n++) line(ctx, crateX + n * 1.3, y - 3, crateX + n * 1.3, y - .6, '#233f58', .2);
    }
    label(ctx, 'WORKSHOP', x + width / 2, y + 23, 2.6, '#c8deed', 'center', 600);
    const hoseX = x + width - 6;
    circle(ctx, hoseX, y + 16, 3.8, '#0a2949', '#21445f', .6);
    circle(ctx, hoseX, y + 16, 2.5, '#87b6cf', null, .65);
    circle(ctx, hoseX, y + 16, 1.2, '#87b6cf', null, .5);
    const drainX = CONFIG.corridor.x + CONFIG.corridor.w - 18, drainY = CONFIG.corridor.y + 21;
    box(ctx, drainX, drainY, 4, 4, '#284a63', '#809eb4');
    for (let n = 0; n < 5; n++) line(ctx, drainX + .6, drainY + .5 + n * .65, drainX + 3.4, drainY + .5 + n * .65, '#132f49', .22);
    for (const bucketX of [x + 4, x + 10]) {
      circle(ctx, bucketX, y + 16, 1.6, '#0b2b49', '#c85a19', .4);
      circle(ctx, bucketX, y + 16, .8, null, '#233c53');
    }
  }

  drawAisles(ctx) {
    for (const x of [ARENA_RINK.x - 15, ARENA_RINK.x + ARENA_RINK.w + 7]) {
      const pipeEnd = x < ARENA_RINK.x ? CONFIG.gate.center.y - 17 : ARENA_RINK.y + ARENA_RINK.h - 2;
      // Benches, wall-mounted service boxes, and steel columns.
      for (const y of [46, 97, 153]) {
        box(ctx, x + .7, y + .8, 7, 23, 'rgba(9,28,51,.25)', null, .5);
        box(ctx, x, y, 6.6, 22, '#315c7a', '#123956', .5);
        for (let n = 0; n < 4; n++) line(ctx, x + .6 + n * 1.4, y + .4, x + .6 + n * 1.4, y + 21.5, '#729cb7', .3);
        box(ctx, x - .4, y + 3, 7.4, .8, '#1b3e5d');
        box(ctx, x - .4, y + 18, 7.4, .8, '#1b3e5d');
      }
      line(ctx, x + 9, 10, x + 9, pipeEnd, '#446782', .8);
      line(ctx, x + 9.4, 10, x + 9.4, pipeEnd, '#b6cfdf', .25);
      for (const y of [22, 80, 136, 196]) {
        if (y + 4.4 > pipeEnd) continue;
        box(ctx, x + 7.2, y, 3.4, 4.4, '#173d60', '#729db8', .2);
        box(ctx, x + 7.9, y + .5, .7, 3.2, '#d8edf9');
      }
    }
  }

  drawStructure(ctx) {
    ctx.scale(LAYER_SCALE, LAYER_SCALE);
    const rink = ARENA_RINK;
    {
      const { x, y, w, h, radius } = rink;
      // A soft interior shadow belongs to the boards, not to the snow state.
      ctx.save(); rounded(ctx, x, y, w, h, radius); ctx.clip();
      for (let inset = 3; inset > .5; inset -= .5) {
        ctx.lineWidth = .6;
        box(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2,
          null, `rgba(38,70,80,${(3.5 - inset) * .018})`, radius - inset);
      }
      ctx.restore();
      // Ice-level boards with translucent glass and a yellow kick plate.
      ctx.lineWidth = 2.3;
      box(ctx, x - 1, y - 1, w + 2, h + 2, null, '#0b315c', radius + 1);
      ctx.lineWidth = 1.05;
      box(ctx, x - .35, y - .35, w + .7, h + .7, null, '#f2f9ff', radius + .35);
      ctx.lineWidth = .55;
      box(ctx, x + .35, y + .35, w - .7, h - .7, null, '#43d6f3', radius - .35);
      // Glass stanchions along the straight boards.
      for (let by = y + radius; by < y + h - radius; by += 12) {
        line(ctx, x - 1.9, by, x - .5, by, '#77a0bd', .45);
        line(ctx, x + w + .5, by, x + w + 1.9, by, '#77a0bd', .45);
      }
      for (let bx = x + radius; bx < x + w - radius; bx += 10) {
        line(ctx, bx, y - 1.9, bx, y - .5, '#77a0bd', .45);
      }
      const cx = x + w / 2;
      // The opening follows the engine's southwest corner arc exactly. The old
      // bottom-centre boards stay intact; only this diagonal bridge is open.
      const gate = CONFIG.gate;
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.moveTo(gate.cornerCenter.x, gate.cornerCenter.y);
      ctx.arc(gate.cornerCenter.x, gate.cornerCenter.y, radius + 5,
        gate.angle - gate.halfAngle, gate.angle + gate.halfAngle);
      ctx.closePath(); ctx.fill(); ctx.restore();
      for (const angle of [gate.angle - gate.halfAngle, gate.angle + gate.halfAngle]) {
        const px = gate.cornerCenter.x + Math.cos(angle) * radius;
        const py = gate.cornerCenter.y + Math.sin(angle) * radius;
        const ex = px + gate.normal.x * 5, ey = py + gate.normal.y * 5;
        line(ctx, px - gate.normal.x, py - gate.normal.y, ex, ey, '#0d3156', 1.1);
        line(ctx, px - .2, py - .2, ex - .2, ey - .2, '#cce9f6', .28);
        circle(ctx, ex, ey, .75, '#06274a', '#f97316', .3);
      }
      // The dynamic level/snow label is painted here after the static structure.
      box(ctx, cx - 37, y - 5.6, 74, 3.4, '#062653', 'rgba(160,218,246,.2)', .5);
    }
  }

  createRinkLayer(rink) {
    const base = this.makeCanvas(rink.w * LAYER_SCALE, rink.h * LAYER_SCALE);
    const ice = base.getContext('2d'); ice.scale(LAYER_SCALE, LAYER_SCALE);
    ice.save(); rounded(ice, 0, 0, rink.w, rink.h, rink.radius); ice.clip();
    const gradient = ice.createLinearGradient(0, 0, rink.w, rink.h);
    gradient.addColorStop(0, '#9ebfc8'); gradient.addColorStop(.4, '#c1d6d7'); gradient.addColorStop(1, '#93b8c3');
    ice.fillStyle = gradient; ice.fillRect(0, 0, rink.w, rink.h);
    const rng = random(71600 + rink.id);
    for (let n = 0; n < 1100; n++) {
      const x = rng() * rink.w, y = rng() * rink.h;
      line(ice, x, y, x + rng() * .7 - .35, y + rng() * 8, `rgba(247,255,250,${.03 + rng() * .08})`, .15);
    }
    this.drawMarkings(ice, rink);
    // Long ceiling-light reflections are deliberately subtle under the snow.
    for (const x of [9, 61]) {
      const light = ice.createLinearGradient(x, 0, x + 12, 0);
      light.addColorStop(0, 'rgba(246,253,255,0)');
      light.addColorStop(.5, 'rgba(246,253,255,.14)');
      light.addColorStop(1, 'rgba(246,253,255,0)');
      ice.fillStyle = light; ice.fillRect(x, 3, 12, rink.h - 6);
    }
    ice.restore();
    const surface = this.makeCanvas(rink.w * LAYER_SCALE, rink.h * LAYER_SCALE);
    const map = this.makeCanvas(rink.cols || 85, rink.rows || 200);
    const mapContext = map.getContext('2d');
    const highlight = this.makeCanvas(map.width, map.height);
    const highlightContext = highlight.getContext('2d');
    const glowMasks = {};
    for (const kind of ['missed', 'pool']) {
      const mask = this.makeCanvas(map.width, map.height), context = mask.getContext('2d');
      glowMasks[kind] = { mask, context, image: context.createImageData(map.width, map.height),
        glow: this.makeCanvas(1, 1), version: -1, cells: null, scaleKey: '', count: 0 };
    }
    const snowMask = this.makeCanvas(map.width, map.height);
    const snowMaskContext = snowMask.getContext('2d');
    const snowTexture = this.makeCanvas(base.width, base.height);
    this.drawSnowTexture(snowTexture.getContext('2d'), rink);
    const snowDetails = this.makeCanvas(base.width, base.height);
    const freshMap = this.makeCanvas(map.width, map.height);
    const freshContext = freshMap.getContext('2d');
    return {
      base, surface, map, mapContext, image: mapContext.createImageData(map.width, map.height),
      highlight, highlightContext, highlightImage: highlightContext.createImageData(map.width, map.height),
      snowTexture, snowDetails, snowMask, snowMaskContext,
      snowMaskImage: snowMaskContext.createImageData(map.width, map.height),
      freshMap, freshContext, freshImage: freshContext.createImageData(map.width, map.height),
      freshCells: [], freshTick: -1, freshDirty: true, freshVisible: false, nextFreshExpiry: Infinity,
      glowMasks, unfinished: 0, version: -1, cells: null,
    };
  }

  drawSnowTexture(ctx, rink) {
    ctx.scale(LAYER_SCALE, LAYER_SCALE);
    const rng = random(35921 + rink.id);
    // Tank-load tuning must not collapse the three distinct snow appearances.
    const level = clamp(rink.id || 1, 1, 3);
    // Three deliberately different snow structures at the same fixed zoom:
    // thin skate dust, granular coverage, and overlapping raised shaving piles.
    // Artwork is cached once, then masked by the actual remaining snow cells.
    const strokes = [0, 320, 540, 180][level];
    for (let n = 0; n < strokes; n++) {
      const x = rng() * rink.w, y = rng() * rink.h;
      const length = level === 1 ? 2 + rng() * 9 : 2 + rng() * 5;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rng() * Math.PI * 2);
      ctx.beginPath(); ctx.moveTo(-length / 2, 0);
      ctx.quadraticCurveTo(0, -length * .2, length / 2, .25);
      ctx.strokeStyle = level === 1 ? 'rgba(86,119,131,.12)' : 'rgba(101,133,143,.2)';
      ctx.lineWidth = level === 1 ? .18 : .35; ctx.stroke();
      ctx.translate(0, -.25);
      ctx.beginPath(); ctx.moveTo(-length / 2, 0);
      ctx.quadraticCurveTo(0, -length * .2, length / 2, .25);
      ctx.strokeStyle = level === 1 ? 'rgba(248,253,255,.72)' : 'rgba(247,253,255,.7)';
      ctx.lineWidth = level === 1 ? .27 : .6; ctx.stroke();
      ctx.restore();
    }

    // Fine flecks occupy very little of sheet 1, allowing blue ice and painted
    // markings to remain crisp. Sheet 2 has a dense granular white covering.
    const grains = level === 1 ? 560 : level === 2 ? 1550 : 650;
    for (let n = 0; n < grains; n++) {
      const x = rng() * rink.w, y = rng() * rink.h;
      const r = level === 1 ? .12 + rng() * .35 : .2 + rng() * .85;
      ctx.beginPath(); ctx.ellipse(x + .15, y + .22, r, r * .6, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = level === 1 ? 'rgba(96,128,139,.13)' : 'rgba(111,140,149,.24)'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y, r, r * .6, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = level === 1 ? 'rgba(246,252,255,.86)' : '#f5fbff'; ctx.fill();
    }

    // The heavy surface uses visible irregular silhouettes and directional
    // relief, rather than another nearly identical shade of white.
    const clumps = level === 1 ? 30 : level === 2 ? 180 : 780;
    for (let n = 0; n < clumps; n++) {
      const x = rng() * rink.w, y = rng() * rink.h;
      const r = level === 1 ? .5 + rng() * .7 : level === 2 ? .7 + rng() * 1.2 : 1.5 + rng() * 2.3;
      const points = Array.from({ length: 8 }, (_, i) => {
        const angle = i * Math.PI / 4, radius = r * (.62 + rng() * .38);
        return [Math.cos(angle) * radius, Math.sin(angle) * radius * (.6 + rng() * .2)];
      });
      ctx.save(); ctx.translate(x, y); ctx.rotate(rng() * Math.PI);
      const outline = (offsetX, offsetY) => {
        ctx.beginPath();
        points.forEach(([px, py], i) => i ? ctx.lineTo(px + offsetX, py + offsetY) : ctx.moveTo(px + offsetX, py + offsetY));
        ctx.closePath();
      };
      outline(.28, level === 3 ? .65 : .25);
      ctx.fillStyle = level === 3 ? 'rgba(113,144,157,.44)' : 'rgba(113,144,157,.16)'; ctx.fill();
      outline(0, 0);
      const relief = ctx.createLinearGradient(-r * .5, -r, r * .4, r);
      relief.addColorStop(0, '#ffffff');
      relief.addColorStop(.45, level === 3 ? '#f7fbff' : '#edf7fc');
      relief.addColorStop(1, level === 3 ? '#cfdeed' : '#e2eef6');
      ctx.fillStyle = relief; ctx.fill();
      if (level === 3) {
        line(ctx, -r * .5, -r * .13, r * .35, -r * .25, 'rgba(255,255,255,.9)', .35);
      }
      ctx.restore();
    }
  }

  drawMarkings(ctx, rink) {
    const w = rink.w, h = rink.h, cx = w / 2;
    const red = '#b95f5c', blue = '#477d9d';
    line(ctx, 0, 11, w, 11, red, .38);
    line(ctx, 0, h - 11, w, h - 11, red, .38);
    line(ctx, 0, 75, w, 75, blue, .9);
    line(ctx, 0, h - 75, w, h - 75, blue, .9);
    line(ctx, 0, h / 2, w, h / 2, red, .85);
    ctx.setLineDash([1.3, 1.3]);
    line(ctx, 0, h / 2, w, h / 2, '#f0f7fc', .2);
    ctx.setLineDash([]);
    circle(ctx, cx, h / 2, 15, blue, null, .32);
    circle(ctx, cx, h / 2, .65, null, blue);
    for (const y of [31, h - 31]) {
      for (const x of [cx - 22, cx + 22]) {
        circle(ctx, x, y, 15, red, null, .28);
        circle(ctx, x, y, .8, null, red);
        for (const direction of [-1, 1]) {
          line(ctx, x - 2, y + direction * 2, x - 2, y + direction * 4.3, red, .22);
          line(ctx, x + 2, y + direction * 2, x + 2, y + direction * 4.3, red, .22);
          line(ctx, x - 3, y + direction * 2, x - 1, y + direction * 2, red, .22);
          line(ctx, x + 1, y + direction * 2, x + 3, y + direction * 2, red, .22);
        }
      }
    }
    for (const y of [80, h - 80]) {
      for (const x of [cx - 22, cx + 22]) circle(ctx, x, y, .7, null, red);
    }
    // Painted goal creases remain; there are deliberately no physical nets.
    for (const [y, direction] of [[11, 1], [h - 11, -1]]) {
      ctx.beginPath(); ctx.moveTo(cx - 4, y);
      ctx.lineTo(cx - 4, y + direction * 3.5);
      ctx.quadraticCurveTo(cx, y + direction * 8, cx + 4, y + direction * 3.5);
      ctx.lineTo(cx + 4, y); ctx.closePath();
      ctx.fillStyle = 'rgba(93,158,186,.3)'; ctx.fill(); ctx.strokeStyle = red; ctx.lineWidth = .28; ctx.stroke();
    }
  }

  updateRink(rink, cache, elapsed) {
    if (cache.version === rink.version && cache.cells === rink.cells) return;
    const data = cache.image.data, cols = rink.cols || 85;
    const highlights = cache.highlightImage.data;
    const snowMask = cache.snowMaskImage.data;
    data.fill(0);
    snowMask.fill(0);
    highlights.fill(0); cache.unfinished = 0;
    for (const layer of Object.values(cache.glowMasks)) { layer.image.data.fill(0); layer.count = 0; }
    cache.freshCells.length = 0; cache.freshDirty = true;
    const cells = rink.cells;
    const snowLevel = clamp(rink.id || 1, 1, 3);
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell || !cell.valid) continue;
      const x = i % cols, y = Math.floor(i / cols), p = i * 4;
      const noise = hash(x, y, rink.id);
      if (cell.snow > 1e-7 || cell.wet || cell.water < CONFIG.waterMinimum - 1e-7) {
        const kind = cell.wet ? 'pool' : 'missed';
        const color = HIGHLIGHT_COLORS[kind].rgb;
        highlights[p] = color[0]; highlights[p + 1] = color[1]; highlights[p + 2] = color[2];
        highlights[p + 3] = 255;
        const layer = cache.glowMasks[kind], mask = layer.image.data;
        mask[p] = color[0]; mask[p + 1] = color[1]; mask[p + 2] = color[2]; mask[p + 3] = 255;
        layer.count++;
        cache.unfinished++;
      }
      if (cell.snow > 1e-7) {
        const shade = Math.floor(noise * 9);
        data[p] = 238 + shade; data[p + 1] = 243 + shade; data[p + 2] = 237 + shade;
        if (snowLevel === 1) {
          // Mostly visible blue ice, with small patches of thin powder.
          const dustyPatch = hash(Math.floor(x / 3), Math.floor(y / 3), 405) > .86;
          data[p + 3] = 14 + Math.floor(noise * 18) + (dustyPatch ? 48 : 0);
        } else if (snowLevel === 2) {
          data[p + 3] = 175 + Math.floor(noise * 30);
        } else {
          data[p + 3] = 248 + Math.floor(noise * 7);
        }
        snowMask[p + 3] = 255;
        // A stationary live pump can saturate snow before it is collected.
        // Keep that pooling visible instead of burying it under the snow art.
        if (cell.wet) {
          const ripple = Math.sin(y * 1.05 + Math.sin(x * .55) * 1.5) > .65;
          data[p] = ripple ? 97 : 34;
          data[p + 1] = ripple ? 155 : 88;
          data[p + 2] = ripple ? 185 : 132;
          data[p + 3] = 232;
          snowMask[p + 3] = 75;
        }
      } else if (cell.wet) {
        const ripple = Math.sin(y * 1.05 + Math.sin(x * .55) * 1.5) > .65;
        data[p] = ripple ? 97 : 34; data[p + 1] = ripple ? 155 : 88; data[p + 2] = ripple ? 185 : 132;
        data[p + 3] = 232;
      } else if (cell.water < CONFIG.waterMinimum - 1e-7) {
        const hatch = (x - y + 1000) % 7 < 2;
        data[p] = hatch ? 192 : 217; data[p + 1] = hatch ? 160 : 190; data[p + 2] = hatch ? 103 : 146;
        data[p + 3] = hatch ? 182 : 146;
      } else {
        // Finished ice is permanently cool grey-blue. A separate time-aware
        // layer supplies the fresh cyan sheen without rebuilding this texture.
        data[p] = 136; data[p + 1] = 159; data[p + 2] = 172; data[p + 3] = 122;
        if (getFreshness(cell, elapsed) > 0) cache.freshCells.push({ cell, p });
      }
    }
    cache.mapContext.putImageData(cache.image, 0, 0);
    cache.highlightContext.putImageData(cache.highlightImage, 0, 0);
    for (const layer of Object.values(cache.glowMasks)) layer.context.putImageData(layer.image, 0, 0);
    cache.snowMaskContext.putImageData(cache.snowMaskImage, 0, 0);
    const details = cache.snowDetails.getContext('2d');
    details.setTransform(1, 0, 0, 1, 0, 0);
    details.clearRect(0, 0, cache.snowDetails.width, cache.snowDetails.height);
    details.globalCompositeOperation = 'source-over';
    details.drawImage(cache.snowTexture, 0, 0);
    details.globalCompositeOperation = 'destination-in';
    details.imageSmoothingEnabled = false;
    details.drawImage(cache.snowMask, 0, 0, cache.snowDetails.width, cache.snowDetails.height);
    details.globalCompositeOperation = 'source-over';
    const ctx = cache.surface.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cache.surface.width, cache.surface.height);
    ctx.drawImage(cache.base, 0, 0);
    ctx.save(); ctx.scale(LAYER_SCALE, LAYER_SCALE);
    rounded(ctx, 0, 0, rink.w, rink.h, rink.radius); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(cache.map, 0, 0, rink.w, rink.h);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cache.snowDetails, 0, 0, rink.w, rink.h);
    ctx.restore();
    cache.version = rink.version; cache.cells = rink.cells;
  }

  updateGlow(rink, cache, kind, variant = 'base') {
    const source = cache.glowMasks[kind];
    if (!source.count) return null;
    source.variants ||= {};
    const layer = variant === 'base' ? source : source.variants[variant] ||= {
      glow: this.makeCanvas(1, 1), version: -1, cells: null, scaleKey: '',
    };
    const width = Math.ceil(rink.w * this.scale), height = Math.ceil(rink.h * this.scale);
    const scaleKey = `${width}:${height}:${this.pixelRatio}`;
    if (layer.version === cache.version && layer.cells === cache.cells && layer.scaleKey === scaleKey) return layer.glow;
    if (layer.glow.width !== width || layer.glow.height !== height) {
      layer.glow.width = width; layer.glow.height = height;
    }
    const ctx = layer.glow.getContext('2d');
    if (!layer.glowImage || layer.glowImage.width !== width || layer.glowImage.height !== height) {
      layer.glowImage = ctx.createImageData(width, height);
    }
    const output = layer.glowImage.data, mask = source.image.data;
    const cols = source.mask.width, rows = source.mask.height, style = GLOW_STYLES[variant];
    const sx = width / cols, sy = height / rows, radius = style.radius * this.pixelRatio;
    const radiusSquared = radius * radius, color = HIGHLIGHT_COLORS[kind].rgb;
    output.fill(0);
    // Only patch-boundary cells contribute. Their distance falloff is computed
    // once per changed mask/scale. A small set of cached CSS-pixel radii lets
    // the near-finish pulse expand without per-frame image allocations or blur.
    for (let index = 0; index < cols * rows; index++) {
      if (!mask[index * 4 + 3]) continue;
      const x = index % cols, y = Math.floor(index / cols);
      if (x && x + 1 < cols && y && y + 1 < rows && mask[(index - 1) * 4 + 3] &&
          mask[(index + 1) * 4 + 3] && mask[(index - cols) * 4 + 3] && mask[(index + cols) * 4 + 3]) continue;
      const left = x * sx, right = (x + 1) * sx, top = y * sy, bottom = (y + 1) * sy;
      const fromX = Math.max(0, Math.floor(left - radius)), toX = Math.min(width - 1, Math.ceil(right + radius));
      const fromY = Math.max(0, Math.floor(top - radius)), toY = Math.min(height - 1, Math.ceil(bottom + radius));
      for (let py = fromY; py <= toY; py++) {
        const dy = Math.max(top - py - .5, py + .5 - bottom, 0);
        const row = Math.floor((py + .5) / sy) * cols;
        for (let px = fromX; px <= toX; px++) {
          // The glow is entirely outside its actual patch. Normal pool ripples
          // and the solid manual overlay retain their own interior appearance.
          if (mask[(row + Math.floor((px + .5) / sx)) * 4 + 3]) continue;
          const dx = Math.max(left - px - .5, px + .5 - right, 0);
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared >= radiusSquared) continue;
          const fade = 1 - Math.sqrt(distanceSquared) / radius;
          const alpha = Math.round(style.strength * fade * fade), p = (py * width + px) * 4;
          if (alpha <= output[p + 3]) continue;
          output[p] = color[0]; output[p + 1] = color[1]; output[p + 2] = color[2]; output[p + 3] = alpha;
        }
      }
    }
    ctx.putImageData(layer.glowImage, 0, 0);
    layer.version = cache.version; layer.cells = cache.cells; layer.scaleKey = scaleKey;
    return layer.glow;
  }

  drawPatchGlows(ctx, rink, cache, missed = false, opacity = 1, nearComplete = false, elapsed = 0) {
    ctx.save(); rounded(ctx, rink.x, rink.y, rink.w, rink.h, rink.radius); ctx.clip();
    for (const kind of missed ? ['missed', 'pool'] : ['pool']) {
      const enhance = kind === 'missed' && nearComplete;
      const glow = this.updateGlow(rink, cache, kind, enhance ? 'near' : 'base');
      ctx.globalAlpha = enhance ? .95 : opacity;
      if (glow) ctx.drawImage(glow, rink.x, rink.y, rink.w, rink.h);
      if (glow && enhance && !this.reducedMotionQuery?.matches) {
        // Crossfade real patch contours from five to seven CSS pixels, then
        // fade away over two seconds. The zero-slope envelope avoids flashing
        // at the cycle boundary; simulation time makes pause freeze the pulse.
        const phase = ((elapsed % 2) + 2) % 2 / 2;
        const envelope = Math.sin(Math.PI * phase) ** 2 * .65;
        const expanded = this.updateGlow(rink, cache, kind, 'pulse');
        ctx.globalAlpha = envelope * (1 - phase);
        ctx.drawImage(glow, rink.x, rink.y, rink.w, rink.h);
        ctx.globalAlpha = envelope * phase;
        ctx.drawImage(expanded, rink.x, rink.y, rink.w, rink.h);
      }
    }
    ctx.restore();
  }

  drawHighlights(ctx, rink, cache, manual, nearComplete = false, elapsed = 0) {
    if (!cache.unfinished) return;
    this.drawPatchGlows(ctx, rink, cache, true, manual ? 1 : .55, nearComplete, elapsed);
    ctx.save(); rounded(ctx, rink.x, rink.y, rink.w, rink.h, rink.radius); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = manual ? 1 : .55;
    ctx.drawImage(cache.highlight, rink.x, rink.y, rink.w, rink.h);
    ctx.restore();
  }

  updateFreshness(cache, elapsed) {
    // Five tiny colour steps per second are smooth across the freshness window.
    // Only actively fresh cells are visited; untouched/aged rinks cost nothing.
    // Every decision uses simulation time, so pause freezes the appearance.
    const tick = Math.floor(elapsed * 5 + 1e-7);
    if (!cache.freshDirty && (!cache.freshCells.length ||
        (tick === cache.freshTick && elapsed < cache.nextFreshExpiry))) return;
    const data = cache.freshImage.data;
    data.fill(0);
    let count = 0, nextExpiry = Infinity;
    for (const entry of cache.freshCells) {
      const freshness = getFreshness(entry.cell, elapsed);
      if (freshness <= 0) continue;
      cache.freshCells[count++] = entry;
      nextExpiry = Math.min(nextExpiry, entry.cell.freshUntil);
      // Fresh cyan stays distinct from the dark-blue ripples of pooling.
      data[entry.p] = 31; data[entry.p + 1] = 199; data[entry.p + 2] = 224;
      data[entry.p + 3] = Math.round(194 * freshness);
    }
    cache.freshCells.length = count;
    cache.freshContext.putImageData(cache.freshImage, 0, 0);
    cache.freshTick = tick; cache.freshDirty = false;
    cache.freshVisible = count > 0; cache.nextFreshExpiry = nextExpiry;
  }

  drawVehicle(ctx, game) {
    const v = game.vehicle;
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.angle);
    const widthScale = CONFIG.vehicleWidth / 8;
    ctx.scale(CONFIG.vehicleLength / 13.25, widthScale);
    // Modest contrast halo makes the accurately scaled machine easy to find.
    ctx.shadowColor = 'rgba(3,21,45,.5)'; ctx.shadowBlur = 1.4; ctx.shadowOffsetY = .55;
    box(ctx, -6.6, -3.8, 13.25, 7.6, '#062653', '#03182e', .85);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    for (const x of [-4.35, 4]) {
      for (const y of [-4.05, 3.15]) {
        box(ctx, x - 1.25, y, 2.5, .9, '#101e30', '#070d1c', .23);
        line(ctx, x - .8, y + .1, x - .8, y + .8, '#5b7087', .12);
        line(ctx, x + .3, y + .1, x + .3, y + .8, '#5b7087', .12);
      }
    }
    // Conditioner width follows the live rules instead of an old fixed scale.
    const brushHalf = CONFIG.brushWidth / widthScale / 2;
    box(ctx, -7.05, -brushHalf, 1.2, brushHalf * 2, '#829fb4', '#153853', .2);
    line(ctx, -7.1, -brushHalf + .2, -7.1, brushHalf - .2, '#d4e7f1', .5);
    if (game.pump > 0 && game.status === 'running') {
      line(ctx, -7.3, -brushHalf + .35, -7.3, brushHalf - .35, game.pump === 1 ? '#43d6f3' : '#a8e8f5', .35);
    }
    const orange = ctx.createLinearGradient(0, -3.7, 0, 3.7);
    orange.addColorStop(0, '#ffb56b'); orange.addColorStop(.3, '#f97316'); orange.addColorStop(1, '#c7510c');
    box(ctx, -5.6, -3.45, 8.6, 6.9, orange, '#8c3a0e', .5);
    box(ctx, -4.75, -2.65, 6.7, 5.3, '#f97316', '#ffc086', .35);
    line(ctx, -4.4, -1.7, 1.6, -1.7, 'rgba(255,217,172,.6)', .18);
    line(ctx, -4.4, 1.8, 1.6, 1.8, 'rgba(142,58,11,.4)', .18);
    // Cabin, driver seat, bumper, lights and an opaque snow-tank lid.
    box(ctx, 3.15, -3.2, 2.7, 6.4, '#062653', '#031c39', .4);
    box(ctx, 3.5, -2.7, 1.9, 2.2, '#70b3cd', '#c6e9f5', .2);
    box(ctx, 3.6, .5, 1.5, 1.8, '#081b33', null, .3);
    circle(ctx, 4.1, .65, .65, '#14263d', '#cda985', .2);
    line(ctx, 6.1, -2.7, 6.1, 2.7, '#cfdfed', .65);
    for (const y of [-2.3, 2.3]) box(ctx, 5.9, y - .38, .5, .76, '#fff2d8', null, .1);
    box(ctx, -1.75, -2.8, 1, 5.6, 'rgba(255,223,184,.35)', null, .1);
    ctx.restore();
    if (game.action) {
      ctx.save();
      ctx.setLineDash([1, 1.3]);
      circle(ctx, v.x, v.y, 9, game.action === 'dump' ? '#f97316' : '#c9f5ff', null, .4);
      ctx.restore();
    }
  }

  drawDumpIntro(ctx) {
    const { gate, corridor, dump } = CONFIG;
    const dumpCenterX = dump.x + dump.w / 2;
    const routeY = corridor.y + corridor.h * .62;
    const pixel = this.pixelRatio / this.scale;
    const route = () => {
      ctx.beginPath(); ctx.moveTo(gate.center.x, gate.center.y);
      ctx.lineTo(gate.outer.x, gate.outer.y);
      ctx.quadraticCurveTo(gate.outer.x - 2, routeY, dumpCenterX, routeY);
      ctx.lineTo(dumpCenterX, dump.y + 3);
    };
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    route(); ctx.strokeStyle = '#062653'; ctx.lineWidth = 6 * pixel; ctx.stroke();
    route(); ctx.strokeStyle = '#43d6f3'; ctx.lineWidth = 3 * pixel; ctx.stroke();
    const arrow = 5 * pixel;
    ctx.beginPath(); ctx.moveTo(dumpCenterX, dump.y + 4);
    ctx.lineTo(dumpCenterX - arrow, dump.y + 4 - arrow * 1.5);
    ctx.lineTo(dumpCenterX + arrow, dump.y + 4 - arrow * 1.5);
    ctx.closePath(); ctx.fillStyle = '#43d6f3'; ctx.fill();
    ctx.lineWidth = 2.5 * pixel;
    box(ctx, dump.x - 1, dump.y - 1, dump.w + 2, dump.h + 2,
      'rgba(67,214,243,.12)', '#43d6f3', 1.5);

    // Keep this label readable even when a short screen makes the building small.
    const ratio = this.pixelRatio, labelWidth = 126 * ratio, labelHeight = 30 * ratio;
    const bayX = this.offsetX + dumpCenterX * this.scale;
    const bayY = this.offsetY + (dump.y + dump.h * .44) * this.scale;
    const worldRight = this.offsetX + WORLD.width * this.scale;
    const beside = this.playLeft + this.playWidth - worldRight >= labelWidth + 24 * ratio;
    const labelX = beside ? worldRight + 12 * ratio : bayX - labelWidth / 2;
    const labelY = clamp(bayY - labelHeight / 2, this.playTop + 4 * ratio,
      this.playTop + this.playHeight - labelHeight - 4 * ratio);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (beside) {
      line(ctx, this.offsetX + (dump.x + dump.w + 1) * this.scale, bayY,
        labelX, labelY + labelHeight / 2, '#43d6f3', 2 * ratio);
    }
    ctx.lineWidth = 1.5 * ratio;
    box(ctx, labelX, labelY, labelWidth, labelHeight, '#062653', '#43d6f3', 5 * ratio);
    label(ctx, 'SNOW DUMP', labelX + labelWidth / 2, labelY + labelHeight / 2,
      13 * ratio, '#f3f9ff', 'center', 800);
    ctx.restore();
  }

  render(game, stats) {
    if (!this.width || !this.height) this.resize();
    // A restart can reuse every id/version/position, but never the same cell set.
    // Clear cached ice when a new run arrives and retain separate level caches.
    if (this.runRinks !== game.rinks) {
      this.rinkLayers.clear(); this.runRinks = game.rinks; this.cameraNeedsSettle = true;
    }
    const level = Math.max(1, Math.min(game.rinks.length, game.level || 1));
    const rink = game.rinks[level - 1];
    const rinkStats = stats?.active?.id === rink.id ? stats.active : stats?.rinks?.find(entry => entry.id === rink.id);
    this.updateCamera(game);
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#070d1c'; ctx.fillRect(0, 0, this.width, this.height);
    // HUD space is truly reserved: a pan can crop the far end of the rink,
    // but it can never draw playable ice underneath a meter or timer.
    ctx.save(); ctx.beginPath();
    ctx.rect(this.playLeft, this.playTop, this.playWidth, this.playHeight); ctx.clip();
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.floor, 0, 0, WORLD.width, WORLD.height);
    {
      let cache = this.rinkLayers.get(rink.id);
      const geometryKey = `${rink.x}:${rink.y}:${rink.w}:${rink.h}:${rink.radius}:${rink.cols}:${rink.rows}:${rink.density}`;
      if (!cache || cache.geometryKey !== geometryKey) {
        cache = this.createRinkLayer(rink); cache.geometryKey = geometryKey;
        this.rinkLayers.set(rink.id, cache);
      }
      this.updateRink(rink, cache, game.elapsed);
      this.updateFreshness(cache, game.elapsed);
      ctx.drawImage(cache.surface, rink.x, rink.y, rink.w, rink.h);
      if (cache.freshVisible) {
        ctx.save(); rounded(ctx, rink.x, rink.y, rink.w, rink.h, rink.radius); ctx.clip();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(cache.freshMap, rink.x, rink.y, rink.w, rink.h);
        ctx.restore();
      }
      const nearComplete = rinkStats?.total > 0 && rinkStats.remaining > 0 && rinkStats.remaining / rinkStats.total <= .1;
      if (this.showMissed || game.highlight || nearComplete) {
        this.drawHighlights(ctx, rink, cache, this.showMissed || game.highlight, nearComplete, game.elapsed);
      } else this.drawPatchGlows(ctx, rink, cache, false, .8);
    }
    ctx.drawImage(this.structure, 0, 0, WORLD.width, WORLD.height);
    const cx = rink.x + rink.w / 2;
    label(ctx, `LEVEL ${level}  /  ${['LIGHT', 'MEDIUM', 'HEAVY'][level - 1]} SNOW`, cx - 1, rink.y - 3.9, 2.7, '#f0f8ff', 'center', 700);
    circle(ctx, cx + 32, rink.y - 3.9, .65, '#03254b', rinkStats?.complete ? '#8ed6b1' : '#f97316', .25);
    if (this.showDumpIntro) this.drawDumpIntro(ctx);
    this.drawVehicle(ctx, game);
    ctx.restore();
  }
}
