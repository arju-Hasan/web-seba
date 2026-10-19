'use client';

/**
 * RotatingBox.jsx  —  Web Seba "WS" 3D logo
 *
 * Install:
 *   npm i three @react-three/fiber @react-three/drei
 *   (React 18 hole: @react-three/fiber@8 + @react-three/drei@9,
 *    React 19 hole: @react-three/fiber@9 + @react-three/drei@10)
 *
 * Features:
 *  - Logo-r 7-ta piece SVG-style path theke Shape -> ExtrudeGeometry (bevel shoho)
 *  - Piece-gulo vertex-color gradient diye logo-r moto cyan -> blue
 *  - Glossy MeshPhysicalMaterial (clearcoat) + animated studio lights (Lightformer)
 *  - Intro: piece-gulo alada alada ure eshe jure jay
 *  - Scroll: multi-angle rotation, position shift, scale, "explode" effect
 *  - Mouse parallax + idle float
 *
 * Exports:
 *  - default RotatingBox : standalone Canvas (unchanged behavior)
 *  - LogoMesh            : reusable logo mesh group (forwardRef). animateRoot=false
 *                          lets the parent fully control position/rotation/scale
 *                          (e.g. for the laptop backside -> navbar transition).
 */

import { forwardRef, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Sparkles } from '@react-three/drei';

/* -------------------------------------------------------------------------- */
/*  Logo geometry data (coordinates = original logo image pixels, ~1780x890)   */
/* -------------------------------------------------------------------------- */

const SC = 0.004; // pixel -> world unit
const CX = 890;
const CY = 475;
const DEPTH = 0.5;
const BEVEL_T = 0.05;

const px = (x, y) => [(x - CX) * SC, (CY - y) * SC];

function buildShape(cmds) {
  const s = new THREE.Shape();
  cmds.forEach(([t, ...a]) => {
    if (t === 'M') s.moveTo(...px(a[0], a[1]));
    else if (t === 'L') s.lineTo(...px(a[0], a[1]));
    else if (t === 'Q') s.quadraticCurveTo(...px(a[0], a[1]), ...px(a[2], a[3]));
    else if (t === 'C')
      s.bezierCurveTo(...px(a[0], a[1]), ...px(a[2], a[3]), ...px(a[4], a[5]));
    else if (t === 'Z') s.closePath();
  });
  return s;
}

// dir = gradient direction in world space (y up). c0 -> c1 along dir.
const PIECES = [
  {
    name: 'v1',
    cmds: [
      ['M', 62, 139], ['L', 283, 139], ['Q', 335, 142, 360, 182],
      ['L', 647, 662], ['L', 575, 765], ['Q', 535, 810, 490, 810],
      ['Q', 425, 808, 400, 758], ['Z'],
    ],
    c0: '#06d8ff', c1: '#0430e8', dir: [0.2, -1],
    ex: [-1.3, 0.5, 0.7], spin: [0.6, -1.2, 0.4], delay: 0.0,
  },
  {
    name: 'v1-highlight',
    cmds: [['M', 603, 410], ['L', 708, 581], ['L', 647, 662], ['L', 547, 487], ['Z']],
    c0: '#00e6ff', c1: '#0a86ff', dir: [-1, -1],
    ex: [0.2, -0.6, 1.6], spin: [-0.8, 0.9, 0.5], delay: 0.1,
  },
  {
    name: 'v2',
    cmds: [
      ['M', 474, 139], ['L', 683, 139], ['Q', 750, 142, 780, 190],
      ['L', 1036, 600], ['Q', 1040, 606, 1036, 612], ['L', 890, 800],
      ['Q', 872, 818, 856, 800], ['Z'],
    ],
    c0: '#00d6ff', c1: '#0533ea', dir: [0.2, -1],
    ex: [0.0, 0.8, 1.0], spin: [0.5, 1.4, -0.3], delay: 0.2,
  },
  {
    name: 's-top',
    cmds: [
      ['M', 910, 328], ['Q', 950, 260, 985, 215], ['Q', 1050, 139, 1145, 139],
      ['L', 1713, 139], ['Q', 1670, 210, 1620, 241], ['L', 1215, 241],
      ['Q', 1140, 246, 1090, 318], ['L', 993, 467], ['Z'],
    ],
    c0: '#04eaff', c1: '#0a86ff', dir: [-1, -0.6],
    ex: [1.3, 0.9, 0.8], spin: [-0.7, -1.0, 0.6], delay: 0.3,
    overlay: {
      cmds: [
        ['M', 1215, 241], ['L', 1620, 241], ['Q', 1550, 315, 1480, 315],
        ['L', 1215, 315], ['Q', 1140, 320, 1105, 378], ['L', 1007, 490],
        ['L', 993, 467], ['L', 1090, 318], ['Q', 1140, 246, 1215, 241], ['Z'],
      ],
      c0: '#0a92ff', c1: '#00179c', dir: [-1, -0.7],
    },
  },
  {
    name: 's-bottom',
    cmds: [
      ['M', 1028, 517], ['L', 1105, 415], ['Q', 1145, 377, 1195, 377],
      ['L', 1480, 377], ['C', 1640, 377, 1713, 500, 1713, 597],
      ['C', 1713, 720, 1620, 810, 1510, 810], ['L', 915, 810],
      ['L', 1063, 625], ['L', 1435, 625],
      ['C', 1470, 625, 1490, 600, 1490, 572],
      ['C', 1490, 540, 1470, 517, 1435, 517], ['Z'],
    ],
    c0: '#08f2ff', c1: '#0866ff', dir: [-1, -1],
    ex: [1.0, -0.9, 0.5], spin: [0.8, 0.8, -0.5], delay: 0.4,
    overlay: {
      cmds: [
        ['M', 1435, 517], ['C', 1530, 517, 1583, 590, 1583, 645],
        ['C', 1583, 725, 1510, 800, 1410, 810], ['Q', 1520, 720, 1490, 572],
        ['C', 1490, 540, 1470, 517, 1435, 517], ['Z'],
      ],
      c0: '#0a5cff', c1: '#0330d0', dir: [-0.3, -1],
    },
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function paintGradient(geo, c0, c1, dir) {
  const pos = geo.attributes.position;
  const a = new THREE.Color(c0);
  const b = new THREE.Color(c1);
  const d = new THREE.Vector2(dir[0], dir[1]).normalize();
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const proj = [
    [min.x, min.y], [max.x, min.y], [min.x, max.y], [max.x, max.y],
  ].map(([x, y]) => x * d.x + y * d.y);
  const lo = Math.min(...proj);
  const hi = Math.max(...proj);
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    let t = (pos.getX(i) * d.x + pos.getY(i) * d.y - lo) / (hi - lo || 1);
    t = THREE.MathUtils.smoothstep(t, 0, 1);
    c.lerpColors(a, b, t);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
const easeOutBack = (x) => {
  const c1 = 1.4, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// Scroll keyframes: r = rotation xyz, p = position xyz, s = scale, e = explode
const KF = [
  { at: 0.0,  r: [0.0, 0.0, 0.0],            p: [0, 0, 0],       s: 1.0,  e: 0.0 },
  { at: 0.18, r: [0.28, -0.85, 0.04],        p: [-1.4, 0.1, 0],  s: 0.9,  e: 0.35 },
  { at: 0.38, r: [-0.35, -2.2, -0.08],       p: [1.5, -0.1, 0.5], s: 0.85, e: 0.9 },
  { at: 0.58, r: [0.45, -Math.PI, 0.1],      p: [-1.2, 0.25, 0],  s: 0.95, e: 1.0 },
  { at: 0.78, r: [-0.2, -4.6, -0.05],        p: [0.8, 0, 0.8],    s: 0.9,  e: 0.5 },
  { at: 1.0,  r: [0.0, -Math.PI * 2, 0.0],   p: [0, 0, 0],        s: 1.1,  e: 0.0 },
];

const sampled = { r: [0, 0, 0], p: [0, 0, 0], s: 1, e: 0 };
function sampleKF(p) {
  let i = 0;
  while (i < KF.length - 2 && p > KF[i + 1].at) i++;
  const a = KF[i];
  const b = KF[i + 1];
  const f = THREE.MathUtils.smootherstep(p, a.at, b.at);
  for (let k = 0; k < 3; k++) {
    sampled.r[k] = THREE.MathUtils.lerp(a.r[k], b.r[k], f);
    sampled.p[k] = THREE.MathUtils.lerp(a.p[k], b.p[k], f);
  }
  sampled.s = THREE.MathUtils.lerp(a.s, b.s, f);
  sampled.e = THREE.MathUtils.lerp(a.e, b.e, f);
  return sampled;
}

function mergeRefs(...refs) {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') ref(value);
      else if (ref) ref.current = value;
    });
  };
}

/* -------------------------------------------------------------------------- */
/*  Reusable logo mesh (forwardRef)                                            */
/* -------------------------------------------------------------------------- */

/**
 * LogoMesh — the WS logo as a group of extruded pieces.
 *
 * Props:
 *  - progressRef / mouseRef : scroll + mouse input (same as standalone Logo)
 *  - animateRoot (default true) : when false, the parent controls the root group's
 *    position/rotation/scale (used for the laptop backside -> navbar transition)
 *  - idle (default true)        : subtle idle float on the inner group
 *  - showLight (default true)   : the moving key light that gives the glossy sweep
 *  - material / overlayMaterial : optional override materials
 */
export const LogoMesh = forwardRef(function LogoMesh(
  {
    progressRef,
    mouseRef,
    animateRoot = true,
    idle = true,
    showLight = true,
    material,
    overlayMaterial,
    ...props
  },
  ref
) {
  const root = useRef();
  const float = useRef();
  const pieceRefs = useRef([]);
  const light = useRef();
  const { viewport } = useThree();

  const cur = useRef({ p: 0, mx: 0, my: 0 });

  const { built, mat, overlayMat } = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.15,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      reflectivity: 0.6,
      envMapIntensity: 1.0,
    });
    const overlayMat = mat.clone();
    overlayMat.polygonOffset = true;
    overlayMat.polygonOffsetFactor = -2;
    overlayMat.polygonOffsetUnits = -2;

    const built = PIECES.map((pc) => {
      const geo = new THREE.ExtrudeGeometry(buildShape(pc.cmds), {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: BEVEL_T,
        bevelSize: 0.025,
        bevelOffset: -0.025,
        bevelSegments: 6,
        curveSegments: 28,
      });
      geo.translate(0, 0, -DEPTH / 2);
      paintGradient(geo, pc.c0, pc.c1, pc.dir);

      let overlayGeo = null;
      if (pc.overlay) {
        overlayGeo = new THREE.ShapeGeometry(buildShape(pc.overlay.cmds), 28);
        paintGradient(overlayGeo, pc.overlay.c0, pc.overlay.c1, pc.overlay.dir);
      }
      return { geo, overlayGeo };
    });
    return { built, mat, overlayMat };
  }, []);

  useEffect(
    () => () => {
      built.forEach((b) => {
        b.geo.dispose();
        b.overlayGeo?.dispose();
      });
      mat.dispose();
      overlayMat.dispose();
    },
    [built, mat, overlayMat]
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const c = cur.current;

    // smooth scroll + mouse
    c.p = THREE.MathUtils.damp(c.p, progressRef?.current ?? 0, 4, dt);
    c.mx = THREE.MathUtils.damp(c.mx, mouseRef?.current.x ?? 0, 3, dt);
    c.my = THREE.MathUtils.damp(c.my, mouseRef?.current.y ?? 0, 3, dt);

    const k = sampleKF(c.p);
    const fit = Math.min(1, viewport.width / 8);
    const spread = Math.min(1, viewport.width / 13);

    if (animateRoot && root.current) {
      // intro (whole logo)
      const introAll = THREE.MathUtils.clamp((t - 0.1) / 2.6, 0, 1);
      const introRot = (1 - easeOutQuart(introAll)) * Math.PI * 1.4;
      const introScale = 0.6 + 0.4 * easeOutBack(introAll);

      root.current.position.set(k.p[0] * spread, k.p[1], k.p[2]);
      root.current.rotation.set(
        k.r[0] + c.my * -0.18,
        k.r[1] + c.mx * 0.3 + introRot,
        k.r[2]
      );
      root.current.scale.setScalar(k.s * fit * introScale);
    }

    if (idle && float.current) {
      // idle float
      float.current.position.y = Math.sin(t * 1.1) * 0.08;
      float.current.rotation.x = Math.sin(t * 0.7) * 0.025;
      float.current.rotation.z = Math.cos(t * 0.6) * 0.015;
    }

    // per piece: assemble intro + scroll explode
    // When animateRoot is false (e.g. laptop backside -> navbar transition),
    // keep pieces assembled so the parent controls the whole logo as one unit.
    if (animateRoot) {
      PIECES.forEach((pc, i) => {
        const g = pieceRefs.current[i];
        if (!g) return;
        const pi = easeOutQuart(
          THREE.MathUtils.clamp((t - 0.2 - pc.delay) / 1.7, 0, 1)
        );
        const inv = 1 - pi;
        const amt = k.e + inv * 3.2;
        g.position.set(pc.ex[0] * amt, pc.ex[1] * amt, pc.ex[2] * amt);
        g.rotation.set(inv * pc.spin[0], inv * pc.spin[1], inv * pc.spin[2]);
      });
    } else {
      PIECES.forEach((pc, i) => {
        const g = pieceRefs.current[i];
        if (!g) return;
        g.position.set(0, 0, 0);
        g.rotation.set(0, 0, 0);
      });
    }

    // moving key light => glossy sweep across surfaces
    if (showLight && light.current) {
      light.current.position.set(
        Math.cos(c.p * Math.PI * 4 + t * 0.3) * 7,
        3 + Math.sin(c.p * Math.PI * 2) * 2,
        6
      );
    }
  });

  const frontZ = DEPTH / 2 + BEVEL_T + 0.003;
  const useMat = material ?? mat;
  const useOverlay = overlayMaterial ?? overlayMat;

  return (
    <group ref={mergeRefs(ref, root)} {...props}>
      {showLight && <pointLight ref={light} intensity={90} distance={30} color="#7fe9ff" />}
      <group ref={float}>
        {PIECES.map((pc, i) => (
          <group key={pc.name} ref={(el) => (pieceRefs.current[i] = el)}>
            <mesh geometry={built[i].geo} material={useMat} />
            {built[i].overlayGeo && (
              <mesh
                geometry={built[i].overlayGeo}
                material={useOverlay}
                position={[0, 0, frontZ]}
              />
            )}
          </group>
        ))}
      </group>
    </group>
  );
});

/* -------------------------------------------------------------------------- */
/*  Standalone logo (unchanged behavior)                                       */
/* -------------------------------------------------------------------------- */

function Logo({ progressRef, mouseRef }) {
  return <LogoMesh progressRef={progressRef} mouseRef={mouseRef} />;
}

/* -------------------------------------------------------------------------- */
/*  Studio lighting (procedural env — kono HDR download lagbe na)              */
/* -------------------------------------------------------------------------- */

function Studio({ progressRef }) {
  const rig = useRef();
  useFrame((state) => {
    if (!rig.current) return;
    rig.current.rotation.y =
      progressRef.current * Math.PI * 2 + state.clock.elapsedTime * 0.05;
  });

  return (
    <Environment resolution={256} frames={Infinity} background={false}>
      <color attach="background" args={['#04060f']} />
      <group ref={rig}>
        <Lightformer form="rect" intensity={5} color="#ffffff" position={[0, 6, -4]} scale={[14, 2, 1]} />
        <Lightformer form="rect" intensity={3} color="#7fe9ff" position={[-7, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={3} color="#3d7bff" position={[7, -1, 2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={4} color="#ffffff" position={[0, 0, 8]} scale={5} />
        <Lightformer form="circle" intensity={2.5} color="#00e5ff" position={[0, -6, 2]} scale={6} />
      </group>
    </Environment>
  );
}

/* -------------------------------------------------------------------------- */
/*  Public component                                                           */
/* -------------------------------------------------------------------------- */

export default function RotatingBox({ className = '', style = {} }) {
  const progressRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current = max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
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
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse at 50% 42%, #0c1d3f 0%, #060a1a 55%, #02030a 100%)',
        ...style,
      }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 14], fov: 30, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        flat
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 8]} intensity={1.6} color="#ffffff" />
        <Studio progressRef={progressRef} />
        <Logo progressRef={progressRef} mouseRef={mouseRef} />
        <Sparkles count={70} scale={[14, 8, 6]} size={2} speed={0.3} opacity={0.55} color="#3ad8ff" />
      </Canvas>
    </div>
  );
}
