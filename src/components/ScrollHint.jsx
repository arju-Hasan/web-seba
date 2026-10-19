'use client';

/**
 * ScrollHint.jsx — animated "scroll down" instruction popup.
 *
 * Renders near the bottom of the viewport. Smoothly fades + slides out once
 * the user starts scrolling (controlled by the `scrolled` prop).
 */
export default function ScrollHint({ scrolled = false }) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: window.innerHeight * 1.4, behavior: 'smooth' });
    }
  };

  return (
    <div
      aria-hidden={scrolled}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title="Click or scroll down to explore"
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '6vh',
        transform: `translate(-50%, ${scrolled ? '24px' : '0'}) scale(${scrolled ? 0.94 : 1})`,
        opacity: scrolled ? 0 : 1,
        pointerEvents: scrolled ? 'none' : 'auto',
        cursor: 'pointer',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 10,
        willChange: 'opacity, transform',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            borderRadius: '999px',
            background: 'rgba(8, 14, 30, 0.68)',
            border: '1px solid rgba(120, 210, 255, 0.28)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow:
              '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(0, 210, 255, 0.14), inset 0 0 16px rgba(0, 224, 255, 0.08)',
            transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.6)';
            e.currentTarget.style.boxShadow =
              '0 14px 44px rgba(0, 0, 0, 0.6), 0 0 32px rgba(0, 224, 255, 0.28), inset 0 0 20px rgba(0, 224, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(120, 210, 255, 0.28)';
            e.currentTarget.style.boxShadow =
              '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 24px rgba(0, 210, 255, 0.14), inset 0 0 16px rgba(0, 224, 255, 0.08)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00e0ff',
              boxShadow: '0 0 12px #00e0ff, 0 0 24px rgba(0, 224, 255, 0.7)',
              animation: 'wsPulse 1.8s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontFamily:
                'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(230, 245, 255, 0.95)',
              whiteSpace: 'nowrap',
            }}
          >
            Scroll to explore
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7fe9ff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'wsBounce 1.8s ease-in-out infinite' }}
          >
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
        </div>

        <div
          style={{
            width: '2px',
            height: '34px',
            borderRadius: '2px',
            background:
              'linear-gradient(to bottom, rgba(127, 233, 255, 0.75), rgba(127, 233, 255, 0))',
          }}
        />
      </div>

      <style>{`
        @keyframes wsBounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(5px); opacity: 0.6; }
        }
        @keyframes wsPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.65); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
