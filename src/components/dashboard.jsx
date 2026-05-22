import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export default function Dashboard({ refresh }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, [refresh]);

  async function fetchStats() {
    setLoading(true);
    const [cargasSnap, faqsSnap] = await Promise.all([
      getDocs(collection(db, "cargas")),
      getDocs(collection(db, "faqs_sugeridas")),
    ]);

    const cargas = cargasSnap.docs.map((d) => d.data());
    const faqs   = faqsSnap.docs.map((d) => d.data());

    const totalFaqs     = faqs.length;
    const aprobadas     = faqs.filter((f) => f.estado === "aprobada").length;
    const rechazadas    = faqs.filter((f) => f.estado === "rechazada").length;
    const pendientes    = faqs.filter((f) => f.estado === "pendiente").length;
    const precision     = totalFaqs > 0 ? Math.round((aprobadas / totalFaqs) * 100) : 0;

    // Categorías más frecuentes
    const catCount = {};
    faqs.filter((f) => f.estado === "aprobada").forEach((f) => {
      catCount[f.categoria || "General"] = (catCount[f.categoria || "General"] || 0) + 1;
    });
    const topCats = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Archivos por tipo
    const tipoCount = {};
    cargas.forEach((c) => {
      const t = c.tipo?.includes("json") ? "JSON" : c.tipo?.includes("csv") ? "CSV" : "TXT";
      tipoCount[t] = (tipoCount[t] || 0) + 1;
    });

    setStats({
      totalArchivos: cargas.length,
      totalFaqs, aprobadas, rechazadas, pendientes, precision,
      topCats, tipoCount,
    });
    setLoading(false);
  }

  if (loading) return (
    <div style={styles.card}>
      <div style={styles.loadingWrap}>
        <div style={styles.loadingBar}><div style={styles.loadingFill} /></div>
        <span style={styles.loadingText}>Calculando métricas...</span>
      </div>
    </div>
  );

  if (!stats) return null;

  const barMax = stats.topCats[0]?.[1] || 1;

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <div style={styles.iconWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6"  y1="20" x2="6"  y2="14"/>
          </svg>
        </div>
        <div>
          <h2 style={styles.title}>Métricas de desempeño</h2>
          <p style={styles.desc}>Evaluación experimental del sistema de FAQs</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={styles.kpiGrid}>
        <KPI label="Archivos cargados"  value={stats.totalArchivos} color="#38bdf8" icon="📁" />
        <KPI label="FAQs generadas"     value={stats.totalFaqs}     color="#fbbf24" icon="💡" />
        <KPI label="FAQs aprobadas"     value={stats.aprobadas}     color="#34d399" icon="✓"  />
        <KPI label="Tasa de precisión"  value={`${stats.precision}%`} color="#818cf8" icon="🎯" />
      </div>

      {/* Progreso de revisión */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Progreso de revisión</h3>
        <div style={styles.progressBars}>
          <ProgressBar label="Aprobadas"  value={stats.aprobadas}  total={stats.totalFaqs} color="#34d399" />
          <ProgressBar label="Rechazadas" value={stats.rechazadas} total={stats.totalFaqs} color="#f87171" />
          <ProgressBar label="Pendientes" value={stats.pendientes} total={stats.totalFaqs} color="#fbbf24" />
        </div>
      </div>

      {/* Top categorías */}
      {stats.topCats.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Top categorías aprobadas</h3>
          <div style={styles.catBars}>
            {stats.topCats.map(([cat, count]) => (
              <div key={cat} style={styles.catRow}>
                <span style={styles.catName}>{cat}</span>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: `${(count / barMax) * 100}%` }} />
                </div>
                <span style={styles.catCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tipos de archivo */}
      {Object.keys(stats.tipoCount).length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Archivos por formato</h3>
          <div style={styles.tiposRow}>
            {Object.entries(stats.tipoCount).map(([tipo, count]) => (
              <div key={tipo} style={styles.tipoChip}>
                <span style={styles.tipoLabel}>{tipo}</span>
                <span style={styles.tipoCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, color, icon }) {
  return (
    <div style={{ ...kpiStyles.wrap, borderColor: `${color}20` }}>
      <span style={kpiStyles.icon}>{icon}</span>
      <span style={{ ...kpiStyles.value, color }}>{value}</span>
      <span style={kpiStyles.label}>{label}</span>
    </div>
  );
}

function ProgressBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={pbStyles.wrap}>
      <div style={pbStyles.labelRow}>
        <span style={pbStyles.label}>{label}</span>
        <span style={{ ...pbStyles.pct, color }}>{value} <span style={pbStyles.pctSub}>({pct}%)</span></span>
      </div>
      <div style={pbStyles.track}>
        <div style={{ ...pbStyles.fill, width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#111827", borderRadius: "16px", padding: "28px", border: "1px solid rgba(255,255,255,0.07)" },
  cardHeader: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" },
  iconWrap: {
    width: "40px", height: "40px", borderRadius: "10px",
    background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  title: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#e2e8f0", marginBottom: "4px" },
  desc: { color: "#64748b", fontSize: "0.83rem" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "28px" },
  section: { marginBottom: "24px" },
  sectionTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "14px" },
  progressBars: { display: "flex", flexDirection: "column", gap: "12px" },
  catBars: { display: "flex", flexDirection: "column", gap: "10px" },
  catRow: { display: "flex", alignItems: "center", gap: "12px" },
  catName: { color: "#94a3b8", fontSize: "0.82rem", fontWeight: 500, width: "100px", flexShrink: 0 },
  barTrack: { flex: 1, height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden" },
  barFill: { height: "100%", background: "linear-gradient(90deg, #818cf8, #38bdf8)", borderRadius: "99px", transition: "width .5s ease" },
  catCount: { color: "#475569", fontSize: "0.78rem", fontWeight: 700, width: "24px", textAlign: "right" },
  tiposRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  tipoChip: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
    padding: "12px 20px", borderRadius: "10px",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
  },
  tipoLabel: { fontSize: "0.72rem", color: "#64748b", fontWeight: 600, fontFamily: "monospace" },
  tipoCount: { fontSize: "1.4rem", fontWeight: 800, color: "#e2e8f0", fontFamily: "'Syne', sans-serif" },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "48px" },
  loadingBar: { width: "160px", height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden" },
  loadingFill: { height: "100%", width: "40%", background: "linear-gradient(90deg, #818cf8, #38bdf8)", borderRadius: "99px", animation: "slide 1.2s ease-in-out infinite alternate" },
  loadingText: { color: "#475569", fontSize: "0.85rem", fontStyle: "italic" },
};

const kpiStyles = {
  wrap: {
    display: "flex", flexDirection: "column", gap: "6px", padding: "16px",
    borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid",
  },
  icon: { fontSize: "1.1rem" },
  value: { fontSize: "1.8rem", fontWeight: 800, fontFamily: "'Syne', sans-serif", lineHeight: 1 },
  label: { fontSize: "0.75rem", color: "#64748b", fontWeight: 500 },
};

const pbStyles = {
  wrap: { display: "flex", flexDirection: "column", gap: "6px" },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  label: { fontSize: "0.82rem", color: "#94a3b8", fontWeight: 500 },
  pct: { fontSize: "0.88rem", fontWeight: 700 },
  pctSub: { color: "#475569", fontWeight: 400, fontSize: "0.78rem" },
  track: { height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden" },
  fill: { height: "100%", borderRadius: "99px", transition: "width .5s ease" },
};