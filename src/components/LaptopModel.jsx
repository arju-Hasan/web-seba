'use client';

/**
 * RotatingLaptop.jsx — Realistic procedural 3D laptop (react-three-fiber)
 *
 * Install:
 *   npm i three @react-three/fiber @react-three/drei
 *   (React 18: fiber@8 + drei@9  |  React 19: fiber@9 + drei@10)
 *
 * Parts:
 *   aluminium unibody (brushed + anisotropic), recessed keyboard well, ~90 real 3D keys
 *   with legends, glass trackpad, hinge, ports, rubber feet, black bezel, webcam,
 *   glowing screen (canvas texture — Web Seba landing page mock), glass glare, WS chrome logo on lid.
 *
 * Scroll story (pure function of scroll progress => scroll back reverses exactly):
 *   closed laptop -> lid opens (screen turns on) -> side view -> back view (logo)
 *   -> top-down keyboard view -> camera flies into the screen and fills the viewport.
 *
 * Usage (page must be tall enough to scroll, e.g. 600vh):
 *   const RotatingLaptop = dynamic(() => import('@/components/RotatingLaptop'), { ssr: false });
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  MeshReflectorMaterial,
  RoundedBox,
} from '@react-three/drei';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { LogoMesh } from './LogoModel.jsx';
import ScreenWebsite from './ScreenWebsite.jsx';
import ScrollHint from './ScrollHint.jsx';

const { clamp, lerp, smoothstep, smootherstep, damp } = THREE.MathUtils;
const TAU = Math.PI * 2;

/* -------------------------------------------------------------------------- */
/*  Dimensions (1 unit ≈ 13.6 cm)                                              */
/* -------------------------------------------------------------------------- */

const W = 3.2;            // base / lid width
const D = 2.2;            // base depth
const SLAB = 0.06;        // lower base slab
const DECK = 0.05;        // upper deck layer (has the keyboard cut-out)
const BASE_H = SLAB + DECK;
const HINGE = { y: BASE_H + 0.002, z: -1.09 };
const LID_T = 0.07;
const LID_D = 2.18;
const LID_MAX = 1.95;     // ~112 degrees
const SCREEN_W = 2.96;
const SCREEN_H = 1.85;    // 16:10
const KEY_U = 0.19;
const KEY_Y = SLAB + 0.004;
const KEY_H = 0.044;
const FLOOR_Y = -0.012;

/* -------------------------------------------------------------------------- */
/*  Logo transition (lid backside -> navbar on the screen)                     */
/* -------------------------------------------------------------------------- */

const LID_CENTER_Z = LID_D / 2;

// logo position on the lid backside (lid-local space)
const LOGO_BACK_LOCAL = new THREE.Vector3(0, LID_T + 0.003, LID_CENTER_Z);
// logo target position at the navbar (top-left of the screen, lid-local space)
const LOGO_NAV_LOCAL = new THREE.Vector3(-1.15, -0.006, LID_CENTER_Z + SCREEN_H * 0.44);

const LOGO_BACK_SCALE = 0.082;
const LOGO_NAV_SCALE = 0.054;

// backside: logo faces +Y (lid outward normal), upright with +Y along lid +Z (away from hinge).
const LOGO_BACK_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, Math.PI, 0));
// navbar: logo faces -Y (screen outward normal), upright with +Y along lid +Z (top of screen).
const LOGO_NAV_QUAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));

/* -------------------------------------------------------------------------- */
/*  Keyboard layout                                                            */
/* -------------------------------------------------------------------------- */

const chars = (s) => s.split('').map((c) => [c, 1]);
const ROWS = [
  { z: -0.88, h: 0.12, fn: true,
    keys: [['esc', 1], ...Array.from({ length: 12 }, (_, i) => ['F' + (i + 1), 1]), ['pwr', 1], ['del', 1]] },
  { z: -0.71, h: 0.17, keys: [['`', 1], ...chars('1234567890-='), ['delete', 2]] },
  { z: -0.52, h: 0.17, keys: [['tab', 1.5], ...chars('qwertyuiop[]'), ['\\', 1.5]] },
  { z: -0.33, h: 0.17, keys: [['caps', 1.75], ...chars("asdfghjkl;'"), ['return', 2.25]] },
  { z: -0.14, h: 0.17, keys: [['shift', 2.25], ...chars('zxcvbnm,./'), ['shift', 2.75]] },
  { z: 0.05,  h: 0.17,
    keys: [['ctrl', 1.25], ['opt', 1.25], ['cmd', 1.25], ['', 6.25], ['cmd', 1.25], ['opt', 1.25], ['<', 1.25], ['>', 1.25]] },
];

const KEYS = (() => {
  const out = [];
  const x0 = (-15 * KEY_U) / 2;
  ROWS.forEach((r) => {
    let x = x0;
    r.keys.forEach(([label, u]) => {
      const w = u * KEY_U;
      out.push({ label, x: x + w / 2, z: r.z, w: w - 0.02, d: r.h, fn: !!r.fn });
      x += w;
    });
  });
  return out;
})();

const KB_W = 15 * KEY_U;       // 2.85
const KB_ZMIN = -0.94;
const KB_ZMAX = 0.135;
const KB_H = KB_ZMAX - KB_ZMIN; // 1.075

/* -------------------------------------------------------------------------- */
/*  Utilities & textures                                                       */
/* -------------------------------------------------------------------------- */

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvasTex(w, h, draw, srgb = true) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function makeBrushedTexture() {
  const tex = canvasTex(1024, 1024, (ctx, s) => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, s, s);
    const rand = rng(21);
    for (let i = 0; i < 7000; i++) {
      const y = rand() * s, x = rand() * s, len = 80 + rand() * 500;
      const v = (100 + rand() * 110) | 0;
      ctx.strokeStyle = `rgba(${v},${v},${v},${0.08 + rand() * 0.2})`;
      ctx.lineWidth = 0.6 + rand() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + (rand() - 0.5) * 1.5);
      ctx.stroke();
    }
  }, false);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeLegendTexture() {
  const w = 2048, h = Math.round((2048 * KB_H) / KB_W);
  return canvasTex(w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#d5d9df';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    KEYS.forEach((k) => {
      if (!k.label) return;
      const cx = ((k.x + KB_W / 2) / KB_W) * w;
      const cy = ((k.z - KB_ZMIN) / KB_H) * h;
      const long = k.label.length > 1;
      ctx.font = `600 ${long ? 26 : k.fn ? 30 : 44}px Helvetica, Arial, sans-serif`;
      ctx.fillText(k.label.length === 1 ? k.label.toUpperCase() : k.label, cx, cy);
    });
  });
}

function makeScreenTexture() {
  return canvasTex(1600, 1000, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#040a1c');
    bg.addColorStop(1, '#071433');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    glow(ctx, w * 0.78, h * 0.32, 520, '0,214,255', 0.5);
    glow(ctx, w * 0.2, h * 0.88, 560, '20,70,255', 0.5);
    glow(ctx, w * 0.55, h * 0.02, 380, '0,120,255', 0.35);

    const font = (wt, px) => `${wt} ${px}px Inter, Helvetica, Arial, sans-serif`;
    ctx.textBaseline = 'middle';

    // nav
    ctx.textAlign = 'left';
    ctx.font = font(700, 34);
    ctx.fillStyle = '#fff';
    ctx.fillText('Web Seba', 140, 71);

    ctx.font = font(500, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ['Work', 'Services', 'Pricing', 'Contact'].forEach((t, i) => ctx.fillText(t, 780 + i * 150, 71));
    const bt = ctx.createLinearGradient(1290, 0, 1530, 0);
    bt.addColorStop(0, '#00d2ff');
    bt.addColorStop(1, '#1050ff');
    ctx.fillStyle = bt;
    rr(ctx, 1290, 42, 240, 56, 28);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = font(600, 24);
    ctx.fillText('Get a quote', 1410, 71);

    // hero copy
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = font(800, 92);
    ctx.fillText('We build websites', 90, 330);
    const hg = ctx.createLinearGradient(90, 0, 700, 0);
    hg.addColorStop(0, '#12e6ff');
    hg.addColorStop(1, '#2f6bff');
    ctx.fillStyle = hg;
    ctx.fillText('that feel alive.', 90, 435);
    ctx.fillStyle = 'rgba(200,220,255,0.75)';
    ctx.font = font(400, 30);
    ctx.fillText('Web design, development and 3D experiences', 90, 530);
    ctx.fillText('for brands that want to stand out.', 90, 574);

    const pg = ctx.createLinearGradient(90, 0, 360, 0);
    pg.addColorStop(0, '#00d2ff');
    pg.addColorStop(1, '#1050ff');
    ctx.fillStyle = pg;
    rr(ctx, 90, 630, 270, 72, 36);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = font(600, 28);
    ctx.fillText('Start a project', 225, 667);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    rr(ctx, 384, 630, 236, 72, 36);
    ctx.stroke();
    ctx.fillText('See our work', 502, 667);

    // glass cards
    const card = (x, y, cw, ch) => {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      rr(ctx, x, y, cw, ch, 28);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 2;
      rr(ctx, x, y, cw, ch, 28);
      ctx.stroke();
    };
    card(930, 210, 560, 350);
    const bars = [0.35, 0.55, 0.42, 0.7, 0.5, 0.85, 0.65];
    bars.forEach((v, i) => {
      const bx = 980 + i * 72, bh = v * 240, by = 520 - bh;
      const bg2 = ctx.createLinearGradient(0, by, 0, 520);
      bg2.addColorStop(0, '#12e6ff');
      bg2.addColorStop(1, '#1848ff');
      ctx.fillStyle = bg2;
      rr(ctx, bx, by, 44, bh, 12);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'left';
    ctx.font = font(600, 26);
    ctx.fillText('Performance', 980, 250);

    card(1050, 600, 440, 250);
    ctx.strokeStyle = '#12e6ff';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    [[1090, 780], [1160, 720], [1230, 750], [1300, 670], [1380, 700], [1450, 630]].forEach(([x, y], i) =>
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    );
    ctx.stroke();

    // chips
    ['Design', 'Develop', 'Launch'].forEach((t, i) => {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      rr(ctx, 90 + i * 200, 860, 176, 60, 30);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center';
      ctx.font = font(500, 24);
      ctx.fillText(t, 178 + i * 200, 891);
    });
  });
}

/* -------------------------------------------------------------------------- */
/*  Geometry helpers                                                           */
/* -------------------------------------------------------------------------- */

function rrPath(path, cx, cy, w, h, r) {
  const x = cx - w / 2, y = cy - h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

// deck layer with a keyboard-shaped hole
function makeDeckGeometry() {
  const outer = rrPath(new THREE.Shape(), 0, 0, W - 0.012, D - 0.012, 0.06);
  // shape y  ->  world -z   (keyboard well centre is z = -0.405)
  outer.holes.push(rrPath(new THREE.Path(), 0, 0.405, 2.982, 1.172, 0.035));
  const g = new THREE.ExtrudeGeometry(outer, {
    depth: DECK - 0.012,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 3,
    curveSegments: 20,
  });
  g.translate(0, 0, 0.006);
  g.rotateX(-Math.PI / 2);
  g.translate(0, SLAB, 0);
  g.computeVertexNormals();
  return g;
}

/* -------------------------------------------------------------------------- */
/*  Laptop model                                                               */
/* -------------------------------------------------------------------------- */

function LaptopModel({ lidRef, screenMatRef, glowRef, color, interactive = false }) {
  const inst = useRef();

  const S = useMemo(() => {
    const brushed = makeBrushedTexture();
    const alu = new THREE.MeshPhysicalMaterial({
      color, metalness: 1, roughness: 0.85, roughnessMap: brushed,
      bumpMap: brushed, bumpScale: 0.25, anisotropy: 0.55, envMapIntensity: 1.15,
    });
    const trackpadMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color).multiplyScalar(0.92), metalness: 1, roughness: 0.18,
      clearcoat: 0.6, clearcoatRoughness: 0.1,
    });
    const grooveMat = new THREE.MeshStandardMaterial({ color: '#3b3d42', metalness: 0.8, roughness: 0.5 });
    const wellMat = new THREE.MeshStandardMaterial({ color: '#0b0b0d', roughness: 0.8, metalness: 0.2 });
    const keyMat = new THREE.MeshPhysicalMaterial({ color: '#16171b', roughness: 0.45, clearcoat: 0.15, clearcoatRoughness: 0.5 });
    const hingeMat = new THREE.MeshStandardMaterial({ color: '#25272b', metalness: 0.9, roughness: 0.35 });
    const footMat = new THREE.MeshStandardMaterial({ color: '#0c0c0e', roughness: 0.9 });
    const portMat = new THREE.MeshStandardMaterial({ color: '#050506', roughness: 0.6 });
    const bezelMat = new THREE.MeshPhysicalMaterial({ color: '#050507', roughness: 0.35, clearcoat: 0.4 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#000000', transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0,
      clearcoat: 1, depthWrite: false, envMapIntensity: 1.6,
    });
    const legendTex = makeLegendTexture();
    const screenTex = makeScreenTexture();
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });

    const deckGeo = makeDeckGeometry();
    const keyGeo = new RoundedBoxGeometry(1, 1, 1, 3, 0.2);
    const bezelGeo = new THREE.ShapeGeometry(rrPath(new THREE.Shape(), 0, 0, 3.16, 2.14, 0.05), 16);
    bezelGeo.rotateX(Math.PI / 2);
    const screenGeo = new THREE.PlaneGeometry(SCREEN_W, SCREEN_H);
    screenGeo.rotateX(Math.PI / 2);
    const glassGeo = screenGeo.clone();
    const camGeo = new THREE.CircleGeometry(0.012, 20);
    camGeo.rotateX(Math.PI / 2);

    return {
      alu, trackpadMat, grooveMat, wellMat, keyMat, hingeMat, footMat, portMat, bezelMat,
      glassMat, legendTex, screenMat, deckGeo, keyGeo, bezelGeo, screenGeo, glassGeo, camGeo,
    };
  }, [color]);

  // expose screen material for fade-in
  useEffect(() => {
    screenMatRef.current = S.screenMat;
  }, [S, screenMatRef]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    KEYS.forEach((k, i) => {
      m.compose(
        new THREE.Vector3(k.x, KEY_Y + KEY_H / 2, k.z),
        q,
        new THREE.Vector3(k.w, KEY_H, k.d)
      );
      inst.current.setMatrixAt(i, m);
    });
    inst.current.instanceMatrix.needsUpdate = true;
  }, []);

  const lidCenterZ = LID_D / 2;
  const legendY = KEY_Y + KEY_H + 0.0008;

  return (
    <group>
      {/* ---------------- base ---------------- */}
      <RoundedBox args={[W, SLAB, D]} radius={0.03} smoothness={4} position={[0, SLAB / 2, 0]} material={S.alu} castShadow receiveShadow />
      <mesh geometry={S.deckGeo} material={S.alu} castShadow receiveShadow />

      {/* keyboard well + keys + legends */}
      <mesh material={S.wellMat} position={[0, SLAB + 0.002, -0.405]} receiveShadow>
        <boxGeometry args={[3.0, 0.004, 1.2]} />
      </mesh>
      <instancedMesh ref={inst} args={[S.keyGeo, S.keyMat, KEYS.length]} castShadow receiveShadow />
      <mesh rotation-x={-Math.PI / 2} position={[0, legendY, (KB_ZMIN + KB_ZMAX) / 2]}>
        <planeGeometry args={[KB_W, KB_H]} />
        <meshBasicMaterial map={S.legendTex} transparent depthWrite={false} toneMapped={false} opacity={0.85} />
      </mesh>

      {/* trackpad */}
      <RoundedBox args={[1.32, 0.004, 0.74]} radius={0.0018} smoothness={3} position={[0, BASE_H + 0.0005, 0.66]} material={S.grooveMat} receiveShadow />
      <RoundedBox args={[1.3, 0.006, 0.72]} radius={0.0025} smoothness={3} position={[0, BASE_H + 0.001, 0.66]} material={S.trackpadMat} receiveShadow />

      {/* ports */}
      {[0.2, 0.45].map((z) => (
        <RoundedBox key={'l' + z} args={[0.012, 0.026, 0.11]} radius={0.005} smoothness={3} position={[-W / 2 + 0.002, 0.055, z]} material={S.portMat} />
      ))}
      {[0.2, 0.45].map((z) => (
        <RoundedBox key={'r' + z} args={[0.012, 0.026, 0.11]} radius={0.005} smoothness={3} position={[W / 2 - 0.002, 0.055, z]} material={S.portMat} />
      ))}
      <mesh rotation-z={Math.PI / 2} position={[W / 2 - 0.002, 0.055, 0.8]} material={S.portMat}>
        <cylinderGeometry args={[0.02, 0.02, 0.012, 20]} />
      </mesh>

      {/* rubber feet */}
      {[[-1.28, -0.85], [1.28, -0.85], [-1.28, 0.85], [1.28, 0.85]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.006, z]} material={S.footMat} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.012, 24]} />
        </mesh>
      ))}

      {/* hinge */}
      <mesh rotation-z={Math.PI / 2} position={[0, HINGE.y + 0.003, HINGE.z]} material={S.hingeMat} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 2.3, 28]} />
      </mesh>

      {/* ---------------- lid ---------------- */}
      <group ref={lidRef} position={[0, HINGE.y, HINGE.z]}>
        <RoundedBox args={[W, LID_T, LID_D]} radius={0.03} smoothness={4} position={[0, LID_T / 2 + 0.001, lidCenterZ]} material={S.alu} castShadow receiveShadow />

        {/* laser-engraved circular bed & accent bezel on lid backside */}
        <mesh position={[0, LID_T + 0.0012, lidCenterZ]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.24, 0.265, 48]} />
          <meshStandardMaterial color="#383c44" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, LID_T + 0.0011, lidCenterZ]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.24, 48]} />
          <meshStandardMaterial color="#1a1c22" metalness={0.9} roughness={0.45} />
        </mesh>

        {/* inner: bezel, screen, glass, webcam */}
        <mesh geometry={S.bezelGeo} material={S.bezelMat} position={[0, -0.0006, lidCenterZ]} />
        <mesh geometry={S.screenGeo} material={S.screenMat} position={[0, -0.0012, lidCenterZ]} />
        <mesh geometry={S.glassGeo} material={S.glassMat} position={[0, -0.0018, lidCenterZ]} renderOrder={2} />
        <mesh geometry={S.camGeo} position={[0, -0.0021, lidCenterZ + 1.02]}>
          <meshStandardMaterial color="#1b2333" roughness={0.2} metalness={0.6} />
        </mesh>

        {/* interactive website rendered on the screen plane */}
        <Html
          transform
          position={[0, -0.0022, lidCenterZ]}
          rotation-x={-Math.PI / 2}
          distanceFactor={0.74}
          pointerEvents={interactive ? 'auto' : 'none'}
          style={{
            width: '1600px',
            height: '1000px',
            overflow: 'hidden',
            opacity: interactive ? 1 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: interactive ? 'auto' : 'none',
          }}
        >
          <ScreenWebsite interactive={interactive} />
        </Html>

        {/* screen light spilling on the keyboard */}
        <pointLight ref={glowRef} position={[0, -0.5, 1.0]} color="#8ec5ff" intensity={0} distance={5} decay={2} />
      </group>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Scroll choreography                                                        */
/* -------------------------------------------------------------------------- */

// the camera orbits (elevation `el`, distance `d`, target y/z); the laptop turns on Y (`ry`).
const HERO_Y = HINGE.y + (LID_D / 2) * Math.sin(LID_MAX);
const HERO_Z = HINGE.z + (LID_D / 2) * Math.cos(LID_MAX);
const HERO = { at: 1, ry: -TAU, el: LID_MAX - Math.PI / 2, d: 4, ty: HERO_Y, tz: HERO_Z, lid: 1 };

const KFS = [
  { at: 0.0,  ry: -0.85,        el: 0.32,  d: 6.8, ty: 0.16, tz: 0.0,  lid: 0 },
  { at: 0.1,  ry: -0.6,         el: 0.28,  d: 6.6, ty: 0.16, tz: 0.0,  lid: 0.02 },
  { at: 0.32, ry: -0.28,        el: 0.16,  d: 8.0, ty: 0.78, tz: -0.4, lid: 1 },
  { at: 0.48, ry: -1.55,        el: 0.1,   d: 8.2, ty: 0.78, tz: -0.4, lid: 1 },
  { at: 0.62, ry: -Math.PI,     el: 0.2,   d: 8.0, ty: 0.78, tz: -0.4, lid: 1 },
  { at: 0.76, ry: -4.75,        el: 0.85,  d: 7.2, ty: 0.45, tz: -0.2, lid: 1 },
  { at: 0.88, ry: -TAU,         el: 0.379, d: 8.0, ty: 0.78, tz: -0.4, lid: 1 },
  HERO,
];

const POSE = { ry: 0, el: 0, d: 0, ty: 0, tz: 0, lid: 0 };
const FIELDS = ['ry', 'el', 'd', 'ty', 'tz', 'lid'];

function samplePose(p) {
  let i = 0;
  while (i < KFS.length - 2 && p > KFS[i + 1].at) i++;
  const a = KFS[i], b = KFS[i + 1];
  const f = smootherstep(p, a.at, b.at);
  FIELDS.forEach((k) => (POSE[k] = lerp(a[k], b[k], f)));
  return POSE;
}

function Scene({ progressRef, mouseRef, color, interactive }) {
  const laptop = useRef();
  const lid = useRef();
  const screenMat = useRef();
  const glowLight = useRef();
  const logo = useRef();
  const cur = useRef({ p: 0, mx: 0, my: 0 });
  const { camera, size } = useThree();

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const c = cur.current;
    c.p = damp(c.p, progressRef.current, 3, dt);
    c.mx = damp(c.mx, mouseRef.current.x, 3, dt);
    c.my = damp(c.my, mouseRef.current.y, 3, dt);

    const aspect = size.width / size.height;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    HERO.d = Math.max(SCREEN_H / 0.9, SCREEN_W / (0.94 * aspect)) / (2 * tanH);

    const pose = samplePose(c.p);
    const hero = smoothstep(c.p, 0.88, 1);
    const intro = 1 - Math.pow(1 - clamp(t / 2, 0, 1), 3);

    // keep the whole laptop in frame on narrow screens
    const fitD = 4.3 / (2 * tanH * aspect);
    const d = Math.max(pose.d, fitD * (1 - hero)) * (1 + (1 - intro) * 0.5);
    const el = pose.el + c.my * 0.04 * (1 - hero);

    camera.position.set(0, pose.ty + Math.sin(el) * d, pose.tz + Math.cos(el) * d);
    camera.lookAt(0, pose.ty, pose.tz);

    laptop.current.rotation.y = pose.ry + c.mx * 0.12 * (1 - hero) + (1 - intro) * 0.9;
    lid.current.rotation.x = -pose.lid * LID_MAX;

    // update world matrices so the logo can track the lid backside / navbar
    laptop.current.updateMatrixWorld(true);

    // cinematic logo transition: lid backside -> navbar on the screen
    // As the laptop opens and turns back to face the user, the logo detaches,
    // floats over the top edge of the lid with a cinematic arc, flips around,
    // and settles into the navbar position on the screen.
    const trans = smoothstep(c.p, 0.58, 0.94);
    const localPos = new THREE.Vector3().lerpVectors(LOGO_BACK_LOCAL, LOGO_NAV_LOCAL, trans);

    // 1. Lift away from the lid along local surface normal (+Y)
    const arcLift = Math.sin(trans * Math.PI) * 0.44;
    localPos.y += arcLift;

    // 2. Arc over the top edge of the lid (+Z in local space)
    const arcTop = Math.sin(trans * Math.PI) * 0.32;
    localPos.z += arcTop;

    const worldPos = lid.current.localToWorld(localPos);

    if (logo.current) {
      logo.current.position.copy(worldPos);

      // Slerp quaternion with a subtle dynamic mid-air bank/roll
      const targetQuat = new THREE.Quaternion().copy(LOGO_BACK_QUAT).slerp(LOGO_NAV_QUAT, trans);
      if (trans > 0.01 && trans < 0.99) {
        const roll = Math.sin(trans * Math.PI) * 0.18;
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll);
        targetQuat.multiply(rollQuat);
      }
      logo.current.quaternion.copy(targetQuat);

      // Scale transition: slight mid-air expansion for weightless feel, then settles
      const flightScale = Math.sin(trans * Math.PI) * 0.012;
      const baseScale = lerp(LOGO_BACK_SCALE, LOGO_NAV_SCALE, trans);
      logo.current.scale.setScalar(baseScale + flightScale);
    }

    if (screenMat.current) {
      const on = clamp((pose.lid - 0.35) * 2.2, 0, 1);
      screenMat.current.color.setScalar(on);
      // fade the static screen texture out as the interactive website takes over
      const texOpacity = 1 - smoothstep(c.p, 0.90, 0.96);
      screenMat.current.opacity = texOpacity;
      screenMat.current.transparent = texOpacity < 1;
      screenMat.current.depthWrite = texOpacity >= 1;
    }
    if (glowLight.current) glowLight.current.intensity = 2.5 * clamp((pose.lid - 0.35) * 2.2, 0, 1);
  });

  return (
    <group>
      <group ref={laptop}>
        <LaptopModel
          lidRef={lid}
          screenMatRef={screenMat}
          glowRef={glowLight}
          color={color}
          interactive={interactive}
        />
      </group>

      {/* 3D engraved logo — detached from the laptop so it can fly in world space
          from the lid backside to the navbar position on the screen. */}
      <LogoMesh
        ref={logo}
        animateRoot={false}
        idle={false}
        showLight={false}
      />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Public component                                                           */
/* -------------------------------------------------------------------------- */

export default function RotatingLaptop({
  className = '',
  style = {},
  bg = '#070a12',
  color = '#b9bcc2',       // aluminium: silver '#b9bcc2' | space gray '#5b5e66' | midnight '#23262d'
  reflectiveFloor = true,  // turn off on low-end / mobile devices
}) {
  const progressRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const interactiveRef = useRef(false);
  const [interactive, setInteractive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;

      const p = progressRef.current;
      const isPastTop = p > 0.015;
      if (isPastTop !== scrolledRef.current) {
        scrolledRef.current = isPastTop;
        setScrolled(isPastTop);
      }
      const nextInteractive = p > 0.94;
      if (nextInteractive !== interactiveRef.current) {
        interactiveRef.current = nextInteractive;
        setInteractive(nextInteractive);
      }
    };
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: interactive ? 'auto' : 'none',
        background: bg,
        ...style,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.5, 9], fov: 30, near: 0.1, far: 120 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[bg]} />
        <fog attach="fog" args={[bg, 14, 40]} />

        <ambientLight intensity={0.12} />
        <directionalLight
          position={[4, 9, 6]}
          intensity={1.8}
          color="#fff4e6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          shadow-camera-near={1}
          shadow-camera-far={30}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
        />

        <Environment resolution={512} frames={1}>
          <Lightformer form="rect" intensity={5} color="#ffffff" position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[10, 6, 1]} />
          <Lightformer form="rect" intensity={3} color="#dfeaff" position={[-6, 2, -1]} rotation-y={Math.PI / 2} scale={[1.2, 8, 1]} />
          <Lightformer form="rect" intensity={3} color="#fff0dd" position={[6, 2, -1]} rotation-y={-Math.PI / 2} scale={[1.2, 8, 1]} />
          <Lightformer form="rect" intensity={2} color="#ffffff" position={[0, 1.5, -7]} scale={[10, 1.2, 1]} />
          <Lightformer form="rect" intensity={2.5} color="#9fc4ff" position={[0, 2, 8]} rotation-y={Math.PI} scale={[8, 1.5, 1]} />
        </Environment>

        <Scene progressRef={progressRef} mouseRef={mouseRef} color={color} interactive={interactive} />

        {/* floor */}
        <mesh rotation-x={-Math.PI / 2} position-y={FLOOR_Y} receiveShadow>
          <planeGeometry args={[60, 60]} />
          {reflectiveFloor ? (
            <MeshReflectorMaterial
              blur={[400, 120]}
              resolution={1024}
              mixBlur={1}
              mixStrength={35}
              mixContrast={1}
              roughness={0.9}
              depthScale={1.1}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#0b0f1a"
              metalness={0.6}
            />
          ) : (
            <meshStandardMaterial color="#0b0f1a" roughness={0.9} />
          )}
        </mesh>
        <ContactShadows position={[0, FLOOR_Y + 0.002, 0]} opacity={0.7} scale={14} blur={2.4} far={3} resolution={1024} color="#000000" />
      </Canvas>

      {/* soft vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* animated scroll instruction popup */}
      <ScrollHint scrolled={scrolled} />
    </div>
  );
}