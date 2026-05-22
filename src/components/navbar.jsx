export default function Navbar({ tabActivo, onTabChange }) {
  const tabs = [
    { id: "cargas",     label: "Cargas",      icon: UploadIcon    },
    { id: "analisis",   label: "Análisis IA",  icon: BoltIcon      },
    { id: "validacion", label: "Validación",   icon: CheckIcon     },
    { id: "metricas",   label: "Métricas",     icon: ChartIcon     },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.dot} />
          <span style={styles.logo}>Everwood</span>
          <span style={styles.logoAccent}>FAQ Cloud</span>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              style={{ ...styles.tab, ...(tabActivo === id ? styles.tabActive : {}) }}
            >
              <Icon active={tabActivo === id} />
              <span style={styles.tabLabel}>{label}</span>
            </button>
          ))}
        </div>

        {/* Badge */}
        <span style={styles.badge}>v2.0</span>
      </div>
    </nav>
  );
}

function UploadIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#38bdf8" : "#64748b"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function BoltIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#fbbf24" : "#64748b"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function CheckIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#34d399" : "#64748b"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
}

function ChartIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#818cf8" : "#64748b"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  );
}

const styles = {
  nav: {
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(11,15,26,0.9)",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  inner: {
    maxWidth: "960px", margin: "0 auto", padding: "0 24px",
    height: "60px", display: "flex", alignItems: "center", gap: "24px",
  },
  brand: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 },
  dot: { width: "7px", height: "7px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", animation: "pulse 2s infinite" },
  logo: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem", color: "#e2e8f0", letterSpacing: "-0.02em" },
  logoAccent: { fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "1rem", color: "#38bdf8", letterSpacing: "-0.02em" },
  tabs: { display: "flex", gap: "2px", flex: 1, justifyContent: "center" },
  tab: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "6px 14px", borderRadius: "8px", border: "none",
    background: "transparent", cursor: "pointer", fontFamily: "inherit",
    transition: "all .15s",
  },
  tabActive: { background: "rgba(255,255,255,0.07)" },
  tabLabel: { fontSize: "0.82rem", fontWeight: 500, color: "#94a3b8" },
  badge: {
    fontSize: "0.68rem", fontWeight: 700, color: "#475569",
    padding: "3px 8px", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "999px", fontFamily: "monospace", flexShrink: 0,
  },
};