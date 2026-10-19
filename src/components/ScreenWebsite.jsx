'use client';

import { useState, useRef } from 'react';

/**
 * ScreenWebsite.jsx — the interactive website rendered inside the laptop screen.
 *
 * Mounted via drei <Html transform> so it tracks the screen plane in 3D space.
 * Layout is fixed at 1600x1000 (matches the 16:10 screen aspect) and the Html
 * `distanceFactor={0.74}` maps it to SCREEN_W x SCREEN_H (2.96 x 1.85) world units.
 * The outer container scrolls internally; the navbar is sticky with a designated slot
 * for the 3D LogoMesh.
 */
export default function ScreenWebsite({ interactive = true }) {
  const containerRef = useRef(null);
  const [activePlan, setActivePlan] = useState('Growth');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', service: 'Full Experience', message: '' });

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleReplayIntro = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4500);
  };

  return (
    <div
      ref={containerRef}
      id="screen-website-container"
      style={{
        width: '1600px',
        height: '1000px',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'radial-gradient(120% 80% at 80% 0%, #0a1a44 0%, #061029 45%, #040817 100%)',
        color: '#eaf2ff',
        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(127,233,255,0.4) transparent',
        position: 'relative',
        userSelect: interactive ? 'auto' : 'none',
      }}
    >
      {/* ---------------- Navbar (sticky) ---------------- */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '92px',
          padding: '0 70px',
          borderBottom: '1px solid rgba(127, 233, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* blurred background layer with transparent cutout for 3D logo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(4, 8, 23, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            maskImage: 'linear-gradient(to right, transparent 0, transparent 230px, #000 250px)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0, transparent 230px, #000 250px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '18px', zIndex: 2 }}>
          {/* Transparent placeholder — designated dock for 3D LogoMesh */}
          <div style={{ width: '220px', height: '84px', pointerEvents: 'none' }} />
          <span
            style={{
              fontSize: '30px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(90deg, #ffffff 40%, #7fe9ff 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Web Seba
          </span>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '40px', zIndex: 2 }}>
          {[
            { label: 'Work', id: 'work' },
            { label: 'Services', id: 'services' },
            { label: 'Pricing', id: 'pricing' },
            { label: 'Testimonials', id: 'testimonials' },
            { label: 'Contact', id: 'contact' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => scrollTo(item.id)}
              style={{
                fontSize: '17px',
                fontWeight: 500,
                color: 'rgba(220, 235, 255, 0.78)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s, transform 0.2s',
                padding: '6px 0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#7fe9ff';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(220, 235, 255, 0.78)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={() => scrollTo('contact')}
            style={{
              padding: '14px 32px',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(90deg, #00d2ff 0%, #1050ff 100%)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 8px 26px rgba(16, 80, 255, 0.45)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 210, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 26px rgba(16, 80, 255, 0.45)';
            }}
          >
            Get a quote
          </button>
        </div>
      </nav>

      {/* ---------------- Hero ---------------- */}
      <section
        id="hero"
        style={{
          position: 'relative',
          padding: '80px 70px 100px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: '60px',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 20px',
              borderRadius: '999px',
              background: 'rgba(0, 224, 255, 0.08)',
              border: '1px solid rgba(0, 224, 255, 0.3)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#7fe9ff',
              marginBottom: '26px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#00e0ff',
                boxShadow: '0 0 10px #00e0ff',
              }}
            />
            Studio for ambitious brands
          </div>

          <h1
            style={{
              fontSize: '76px',
              lineHeight: '1.02',
              fontWeight: 800,
              margin: '0 0 12px',
              letterSpacing: '-2px',
            }}
          >
            We build websites
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #12e6ff 0%, #2f6bff 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              that feel alive.
            </span>
          </h1>

          <p
            style={{
              fontSize: '21px',
              lineHeight: '1.6',
              color: 'rgba(200, 220, 255, 0.78)',
              marginTop: '26px',
              maxWidth: '560px',
            }}
          >
            Next-generation web design, full-stack React/Next.js development, and real-time 3D experiences.
            Engineered to captivate visitors and multiply conversions.
          </p>

          <div style={{ display: 'flex', gap: '18px', marginTop: '40px' }}>
            <button
              onClick={() => scrollTo('contact')}
              style={{
                padding: '18px 36px',
                borderRadius: '999px',
                border: 'none',
                background: 'linear-gradient(90deg, #00d2ff 0%, #1050ff 100%)',
                color: '#fff',
                fontSize: '17px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 12px 30px rgba(16, 80, 255, 0.4)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Start a project
            </button>
            <button
              onClick={() => scrollTo('work')}
              style={{
                padding: '18px 36px',
                borderRadius: '999px',
                border: '1.5px solid rgba(255,255,255,0.28)',
                background: 'rgba(255,255,255,0.04)',
                color: '#fff',
                fontSize: '17px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(127,233,255,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
              }}
            >
              See our work
            </button>
          </div>

          <div style={{ display: 'flex', gap: '14px', marginTop: '36px' }}>
            {['WebGL / Three.js', 'Next.js 16', 'Tailwind & Motion', 'Creative Engineering'].map((t) => (
              <span
                key={t}
                style={{
                  padding: '9px 20px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'rgba(220,235,255,0.85)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero visual card */}
        <div
          style={{
            position: 'relative',
            height: '470px',
            borderRadius: '28px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '36px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'rgba(200,220,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Live Analytics
              </div>
              <div style={{ fontSize: '42px', fontWeight: 800, marginTop: '4px', letterSpacing: '-1px' }}>
                +248% <span style={{ fontSize: '18px', fontWeight: 500, color: '#00e0ff' }}>Growth</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['#00e0ff', '#0a86ff', '#2f6bff'].map((c) => (
                <span key={c} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c }} />
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '18px', height: '240px', marginTop: '26px' }}>
            {[
              { v: 0.38, m: 'Mon' },
              { v: 0.58, m: 'Tue' },
              { v: 0.44, m: 'Wed' },
              { v: 0.74, m: 'Thu' },
              { v: 0.52, m: 'Fri' },
              { v: 0.88, m: 'Sat' },
              { v: 0.68, m: 'Sun' },
            ].map((bar, i) => {
              const bh = bar.v * 210;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${bh}px`,
                      borderRadius: '12px 12px 6px 6px',
                      background: 'linear-gradient(180deg, #12e6ff 0%, #1848ff 100%)',
                      boxShadow: '0 0 20px rgba(18, 230, 255, 0.28)',
                      transition: 'height 0.4s ease',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'rgba(200,220,255,0.5)' }}>{bar.m}</span>
                </div>
              );
            })}
          </div>

          {/* Interactive sparkline */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'rgba(200,220,255,0.7)' }}>Average Session: 4m 12s</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#7fe9ff' }}>99.98% Uptime</span>
          </div>
        </div>
      </section>

      {/* ---------------- Services ---------------- */}
      <section id="services" style={{ padding: '80px 70px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#7fe9ff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            What We Do
          </div>
          <h2 style={{ fontSize: '50px', fontWeight: 800, margin: '14px 0 0', letterSpacing: '-1px' }}>
            Services Built for High Performance
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
          {[
            {
              t: 'Creative Web Design',
              d: 'Bespoke, human-centric user interfaces that convey premium value and convert traffic effortlessly.',
              g: 'linear-gradient(135deg, #00e0ff, #0a86ff)',
              features: ['Custom Design Systems', 'Figma Prototypes', 'Responsive Layouts'],
            },
            {
              t: 'Full-Stack Development',
              d: 'Blazing-fast Next.js architecture, optimized rendering pipelines, and scalable APIs.',
              g: 'linear-gradient(135deg, #0a86ff, #2f6bff)',
              features: ['Next.js 16 Turbopack', 'Microservices & APIs', 'Clean Architecture'],
            },
            {
              t: 'Interactive 3D & WebGL',
              d: 'Custom Three.js shaders, animated 3D product visualizers, and spatial web experiences.',
              g: 'linear-gradient(135deg, #2f6bff, #1050ff)',
              features: ['Procedural Shaders', 'Three.js / R3F Canvas', 'GPU Accelerated'],
            },
          ].map((f) => (
            <div
              key={f.t}
              style={{
                padding: '40px',
                borderRadius: '26px',
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'transform 0.3s, border-color 0.3s, background 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'rgba(127,233,255,0.4)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.035)';
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: f.g,
                  marginBottom: '24px',
                  boxShadow: '0 10px 28px rgba(16,80,255,0.35)',
                }}
              />
              <h3 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 12px' }}>{f.t}</h3>
              <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'rgba(200,220,255,0.72)', margin: '0 0 24px' }}>
                {f.d}
              </p>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {f.features.map((item) => (
                  <li key={item} style={{ fontSize: '14px', color: 'rgba(127,233,255,0.85)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#00e0ff' }}>✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section
        style={{
          margin: '30px 70px',
          padding: '60px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(0,224,255,0.08), rgba(16,80,255,0.08))',
          border: '1px solid rgba(127,233,255,0.18)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '30px',
          textAlign: 'center',
        }}
      >
        {[
          { n: '120+', l: 'Projects shipped' },
          { n: '98%', l: 'Client retention rate' },
          { n: '24ms', l: 'Avg. server response' },
          { n: '14', l: 'Design & tech awards' },
        ].map((s) => (
          <div key={s.l}>
            <div
              style={{
                fontSize: '54px',
                fontWeight: 800,
                background: 'linear-gradient(90deg, #12e6ff, #2f6bff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}
            >
              {s.n}
            </div>
            <div style={{ marginTop: '10px', fontSize: '16px', color: 'rgba(200,220,255,0.7)' }}>
              {s.l}
            </div>
          </div>
        ))}
      </section>

      {/* ---------------- Portfolio ---------------- */}
      <section id="work" style={{ padding: '80px 70px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#7fe9ff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Selected Case Studies
          </div>
          <h2 style={{ fontSize: '50px', fontWeight: 800, margin: '14px 0 0', letterSpacing: '-1px' }}>
            Crafted with Rigor and Taste
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
          {[
            { t: 'Nimbus Analytics', c: 'Real-time Financial Intelligence', g: 'linear-gradient(135deg, #0a86ff, #00e0ff)', tag: 'Next.js & D3.js' },
            { t: 'Lumen Studio 3D', c: 'Luxury Architecture Portfolio', g: 'linear-gradient(135deg, #2f6bff, #0a86ff)', tag: 'Three.js & GLTF' },
            { t: 'Orbit E-Commerce', c: 'Spatial Shopping Platform', g: 'linear-gradient(135deg, #1050ff, #2f6bff)', tag: 'Shopify Headless' },
            { t: 'Pulse Medical', c: 'Telehealth AI Experience', g: 'linear-gradient(135deg, #00e0ff, #1050ff)', tag: 'React Native & Web' },
          ].map((p) => (
            <div
              key={p.t}
              style={{
                borderRadius: '26px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'transform 0.3s, border-color 0.3s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'rgba(0,224,255,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <div style={{ height: '260px', background: p.g, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: '24px',
                    borderRadius: '18px',
                    background: 'rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#fff',
                  }}
                >
                  Interactive Showcase
                </div>
              </div>
              <div style={{ padding: '28px 34px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#7fe9ff', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {p.c}
                  </div>
                  <h3 style={{ fontSize: '28px', fontWeight: 700, margin: '6px 0 0' }}>{p.t}</h3>
                </div>
                <span
                  style={{
                    padding: '6px 16px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.06)',
                    fontSize: '12px',
                    color: 'rgba(220,235,255,0.7)',
                  }}
                >
                  {p.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Pricing Section ---------------- */}
      <section id="pricing" style={{ padding: '80px 70px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#7fe9ff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Transparent Pricing
          </div>
          <h2 style={{ fontSize: '50px', fontWeight: 800, margin: '14px 0 0', letterSpacing: '-1px' }}>
            Choose the Right Engagement
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
          {[
            {
              name: 'Startup MVP',
              price: '$4,900',
              period: 'one-time',
              desc: 'High-impact landing page with custom 3D element and conversion tracking.',
              items: ['Custom UI/UX in Figma', 'Next.js Production Build', 'Single 3D WebGL Canvas', '2-Week Delivery'],
            },
            {
              name: 'Growth',
              price: '$9,800',
              period: 'one-time',
              popular: true,
              desc: 'Complete digital platform with full CMS, animations, and multi-page routing.',
              items: ['Full Brand & UI System', 'Interactive 3D Experiences', 'Headless CMS Integration', 'SEO & Performance Guarantee'],
            },
            {
              name: 'Enterprise Studio',
              price: '$18,500',
              period: 'custom',
              desc: 'Dedicated creative engineering squad for enterprise products and spatial web apps.',
              items: ['Custom Shaders & WebGL Pipelines', 'Bespoke 3D Modeling & Rigging', 'Dedicated Tech Lead & SLA', 'Continuous Optimization'],
            },
          ].map((plan) => {
            const isSelected = activePlan === plan.name;
            return (
              <div
                key={plan.name}
                onClick={() => setActivePlan(plan.name)}
                style={{
                  padding: '40px',
                  borderRadius: '26px',
                  background: isSelected ? 'rgba(0,210,255,0.08)' : 'rgba(255,255,255,0.035)',
                  border: isSelected ? '2px solid #00d2ff' : '1px solid rgba(255,255,255,0.08)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '24px',
                      padding: '4px 14px',
                      borderRadius: '999px',
                      background: 'linear-gradient(90deg, #00d2ff, #1050ff)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#fff',
                    }}
                  >
                    Most Popular
                  </div>
                )}
                <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '44px', fontWeight: 800 }}>{plan.price}</span>
                  <span style={{ fontSize: '15px', color: 'rgba(200,220,255,0.6)' }}>/ {plan.period}</span>
                </div>
                <p style={{ fontSize: '15px', lineHeight: '1.5', color: 'rgba(200,220,255,0.7)', margin: '0 0 28px' }}>
                  {plan.desc}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                  {plan.items.map((it) => (
                    <div key={it} style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#00e0ff' }}>✓</span> {it}
                    </div>
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollTo('contact');
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '999px',
                    border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)',
                    background: isSelected ? 'linear-gradient(90deg, #00d2ff, #1050ff)' : 'transparent',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Select {plan.name}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Testimonials ---------------- */}
      <section id="testimonials" style={{ padding: '80px 70px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#7fe9ff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Client Endorsements
          </div>
          <h2 style={{ fontSize: '50px', fontWeight: 800, margin: '14px 0 0', letterSpacing: '-1px' }}>
            Trusted by World-Class Founders
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
          {[
            {
              quote: 'Web Seba completely transformed our digital presence. The 3D interactions alone increased demo bookings by 180%.',
              author: 'Elena Vance',
              role: 'VP Marketing, Apex Financial',
              avatar: 'EV',
            },
            {
              quote: 'The level of craft and polish is unmatched. Working with them felt like building with an elite in-house engineering team.',
              author: 'Marcus Sterling',
              role: 'Founder & CEO, Lumen HQ',
              avatar: 'MS',
            },
            {
              quote: 'Fast, communicative, and technically superb. The 60fps 3D performance on mobile is something other agencies said was impossible.',
              author: 'Sarah Lin',
              role: 'Head of Product, Orbit Labs',
              avatar: 'SL',
            },
          ].map((t) => (
            <div
              key={t.author}
              style={{
                padding: '38px',
                borderRadius: '26px',
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ color: '#00e0ff', fontSize: '20px', marginBottom: '16px' }}>★★★★★</div>
                <p style={{ fontSize: '17px', lineHeight: '1.6', color: 'rgba(220,235,255,0.85)', margin: '0 0 24px' }}>
                  "{t.quote}"
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00d2ff, #1050ff)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    fontSize: '15px',
                  }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{t.author}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(200,220,255,0.55)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Contact & Interactive Form ---------------- */}
      <section
        id="contact"
        style={{
          margin: '40px 70px 90px',
          padding: '80px 70px',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, #0a1a44 0%, #061029 100%)',
          border: '1px solid rgba(127,233,255,0.2)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div>
          <h2 style={{ fontSize: '54px', fontWeight: 800, margin: '0 0 20px', letterSpacing: '-1.5px' }}>
            Let's build something
            <span
              style={{
                background: 'linear-gradient(90deg, #12e6ff, #2f6bff)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {' '}remarkable.
            </span>
          </h2>
          <p style={{ fontSize: '19px', color: 'rgba(200,220,255,0.75)', lineHeight: '1.6', marginBottom: '32px' }}>
            Have a project in mind? Tell us what you are envisioning. We will reply within 24 hours with an actionable roadmap.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: 'rgba(220,240,255,0.9)' }}>
              <span style={{ color: '#00e0ff' }}>✉</span> hello@webseba.studio
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: 'rgba(220,240,255,0.9)' }}>
              <span style={{ color: '#00e0ff' }}>📍</span> San Francisco, CA & Remote Worldwide
            </div>
          </div>
        </div>

        {/* Interactive Form */}
        <form
          onSubmit={handleFormSubmit}
          style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '36px',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {submitted ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                background: 'rgba(0,224,255,0.1)',
                borderRadius: '18px',
                border: '1px solid rgba(0,224,255,0.3)',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#7fe9ff' }}>Message Sent!</div>
              <p style={{ color: 'rgba(200,220,255,0.8)', marginTop: '8px' }}>
                Thank you! Our studio team will get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(200,220,255,0.7)', marginBottom: '8px' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(4,8,24,0.6)',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(200,220,255,0.7)', marginBottom: '8px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alex@company.com"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(4,8,24,0.6)',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(200,220,255,0.7)', marginBottom: '8px' }}>
                  Service Needed
                </label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: '#070f26',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                >
                  <option value="Full Experience">Full Experience (Design + Next.js + 3D)</option>
                  <option value="3D WebGL">Interactive 3D / Three.js</option>
                  <option value="Design">UI/UX & Design Systems</option>
                  <option value="Custom Consultation">Custom Consultation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'rgba(200,220,255,0.7)', marginBottom: '8px' }}>
                  Project Overview
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Briefly describe your goals, timeline, and scope..."
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(4,8,24,0.6)',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '18px 36px',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'linear-gradient(90deg, #00d2ff 0%, #1050ff 100%)',
                  color: '#fff',
                  fontSize: '17px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(16,80,255,0.4)',
                  marginTop: '8px',
                }}
              >
                Send Inquiry →
              </button>
            </>
          )}
        </form>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer
        style={{
          padding: '50px 70px',
          borderTop: '1px solid rgba(127,233,255,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'rgba(200,220,255,0.55)',
          fontSize: '15px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00e0ff, #0a3cff)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              color: '#fff',
              fontSize: '15px',
            }}
          >
            WS
          </div>
          <span>© {new Date().getFullYear()} Web Seba Studio. All rights reserved.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <button
            onClick={() => scrollTo('hero')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(200,220,255,0.7)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ↑ Top of Screen
          </button>
          <a href="#work" style={{ color: 'inherit', textDecoration: 'none' }}>Twitter</a>
          <a href="#work" style={{ color: 'inherit', textDecoration: 'none' }}>GitHub</a>
          <a href="#work" style={{ color: 'inherit', textDecoration: 'none' }}>LinkedIn</a>
        </div>
      </footer>

      {/* ---------------- Floating "Replay 3D Intro" button ---------------- */}
      <button
        onClick={handleReplayIntro}
        title="Scroll back up to watch the 3D laptop animation"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '34px',
          zIndex: 99,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '999px',
          background: 'rgba(8, 14, 30, 0.75)',
          border: '1px solid rgba(127,233,255,0.3)',
          backdropFilter: 'blur(12px)',
          color: '#7fe9ff',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#00e0ff';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(127,233,255,0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span>↺</span> Replay 3D Intro
      </button>
    </div>
  );
}
