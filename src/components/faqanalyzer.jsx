import { useState } from "react";
import { parseCSV, extraerFAQs, agruparPorCategoria } from "../services/gemini";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const CATEGORY_COLORS = {
  Envíos:      { bg: "rgba(56,189,248,0.1)",  border: "rgba(56,189,248,0.25)",  text: "#38bdf8" },
  Pagos:       { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.25)",  text: "#34d399" },
  Productos:   { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)",  text: "#fbbf24" },
  Soporte:     { bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.25)", text: "#818cf8" },
  Devoluciones:{ bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", text: "#f87171" },
  General:     { bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)",  text: "#94a3b8" },
};

function getCategoryStyle(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS["General"];
}

export default function FAQAnalyzer({ onFaqsGuardadas }) {
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError]         = useState(null);
  const [guardando, setGuardando] = useState({});
  const [guardados, setGuardados] = useState({});

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setError("Solo se aceptan archivos CSV para el análisis.");
      return;
    }
    setFile(f);
    setError(null);
    setResultado(null);
  }

  async function handleAnalizar() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const text = await file.text();
      const conversaciones = parseCSV(text);

      if (conversaciones.length === 0) {
        throw new Error("No se encontraron mensajes en el CSV. Verifica que tenga columnas: fecha, usuario, mensaje.");
      }

      const resultado = await extraerFAQs(conversaciones);
      setResultado(resultado);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuardar(faq, index) {
    setGuardando((g) => ({ ...g, [index]: true }));
    try {
      await addDoc(collection(db, "faqs_sugeridas"), {
        pregunta:    faq.pregunta,
        respuesta:   faq.respuesta,
        categoria:   faq.categoria,
        frecuencia:  faq.frecuencia,
        estado:      "pendiente",
        archivoOrigen: file?.name || "desconocido",
        creadoEn:    serverTimestamp(),
      });
      setGuardados((g) => ({ ...g, [index]: true }));
      if (onFaqsGuardadas) onFaqsGuardadas();
    } catch (err) {
      setError("Error al guardar en Firebase: " + err.message);
    } finally {
      setGuardando((g) => ({ ...g, [index]: false }));
    }
  }

  async function handleGuardarTodas() {
    if (!resultado?.faqs) return;
    for (let i = 0; i < resultado.faqs.length; i++) {
      if (!guardados[i]) await handleGuardar(resultado.faqs[i], i);
    }
  }

  const grupos = resultado ? agruparPorCategoria(resultado.faqs) : {};

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <div style={styles.iconWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <h2 style={styles.title}>Analizador de FAQs</h2>
          <p style={styles.desc}>Sube un CSV y Gemini extraerá las preguntas frecuentes automáticamente</p>
        </div>
      </div>

      {/* Input área */}
      <div style={styles.inputRow}>
        <label style={styles.fileLabel}>
          <input type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {file ? file.name : "Elegir CSV"}
        </label>

        <button
          onClick={handleAnalizar}
          disabled={!file || loading}
          style={{ ...styles.btn, ...(!file || loading ? styles.btnDisabled : {}) }}
        >
          {loading ? (
            <span style={styles.btnInner}><span style={styles.spinner} /> Analizando...</span>
          ) : (
            <span style={styles.btnInner}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Analizar con IA
            </span>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.alertError}>
          <span style={styles.alertDot} />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={styles.loadingBox}>
          <div style={styles.loadingBar}><div style={styles.loadingFill} /></div>
          <p style={styles.loadingText}>Gemini está analizando tus conversaciones...</p>
        </div>
      )}

      {/* Resultados */}
      {resultado && (
        <div style={styles.resultados}>
          {/* Resumen */}
          {resultado.resumen && (
            <div style={styles.resumen}>
              <span style={styles.resumenIcon}>💡</span>
              <p style={styles.resumenText}>{resultado.resumen}</p>
            </div>
          )}

          {/* Stats */}
          <div style={styles.statsRow}>
            <StatChip label="FAQs encontradas" value={resultado.faqs?.length || 0} color="#fbbf24" />
            <StatChip label="Categorías" value={Object.keys(grupos).length} color="#818cf8" />
            <StatChip label="Guardadas" value={Object.values(guardados).filter(Boolean).length} color="#34d399" />
          </div>

          {/* Botón guardar todas */}
          <button onClick={handleGuardarTodas} style={styles.btnGuardarTodas}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Guardar todas para revisión
          </button>

          {/* FAQs por categoría */}
          {Object.entries(grupos).map(([cat, faqs]) => (
            <div key={cat} style={styles.grupo}>
              <div style={styles.grupoHeader}>
                <span style={{ ...styles.catBadge, background: getCategoryStyle(cat).bg, color: getCategoryStyle(cat).text, border: `1px solid ${getCategoryStyle(cat).border}` }}>
                  {cat}
                </span>
                <span style={styles.grupoCount}>{faqs.length} pregunta{faqs.length !== 1 ? "s" : ""}</span>
              </div>
              {faqs.map((faq, i) => {
                const globalIndex = resultado.faqs.indexOf(faq);
                return (
                  <FAQCard
                    key={i}
                    faq={faq}
                    index={globalIndex}
                    guardado={guardados[globalIndex]}
                    guardando={guardando[globalIndex]}
                    onGuardar={() => handleGuardar(faq, globalIndex)}
                    catStyle={getCategoryStyle(cat)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FAQCard({ faq, guardado, guardando, onGuardar, catStyle }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={cardStyles.wrap}>
      <div style={cardStyles.top} onClick={() => setExpanded(!expanded)}>
        <div style={cardStyles.preguntaRow}>
          <span style={cardStyles.chevron}>{expanded ? "▾" : "▸"}</span>
          <p style={cardStyles.pregunta}>{faq.pregunta}</p>
        </div>
        <div style={cardStyles.meta}>
          <span style={cardStyles.freq}>×{faq.frecuencia}</span>
          {guardado ? (
            <span style={cardStyles.savedBadge}>✓ Guardado</span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onGuardar(); }}
              disabled={guardando}
              style={cardStyles.saveBtn}
            >
              {guardando ? "..." : "Guardar"}
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div style={cardStyles.respuesta}>
          <span style={cardStyles.respuestaLabel}>Respuesta sugerida</span>
          <p style={cardStyles.respuestaText}>{faq.respuesta}</p>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ ...chipStyles.wrap, borderColor: `${color}30` }}>
      <span style={{ ...chipStyles.value, color }}>{value}</span>
      <span style={chipStyles.label}>{label}</span>
    </div>
  );
}

const styles = {
  card: {
    background: "#111827",
    borderRadius: "16px",
    padding: "28px",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  cardHeader: {
    display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px",
  },
  iconWrap: {
    width: "40px", height: "40px", borderRadius: "10px",
    background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  title: {
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.1rem",
    color: "#e2e8f0", marginBottom: "4px",
  },
  desc: { color: "#64748b", fontSize: "0.83rem" },
  inputRow: { display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" },
  fileLabel: {
    display: "inline-flex", alignItems: "center", gap: "8px",
    padding: "10px 16px", borderRadius: "10px", fontSize: "0.85rem",
    fontWeight: 500, color: "#94a3b8", cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)",
    transition: "all .2s", fontFamily: "inherit",
  },
  btn: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "white", border: "none", padding: "10px 20px",
    borderRadius: "10px", fontSize: "0.88rem", fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  btnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  btnInner: { display: "flex", alignItems: "center", gap: "7px" },
  spinner: {
    width: "13px", height: "13px",
    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
    borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block",
  },
  alertError: {
    padding: "10px 14px", borderRadius: "8px", marginBottom: "16px",
    fontSize: "0.85rem", fontWeight: 500, color: "#f87171",
    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
    display: "flex", alignItems: "center", gap: "8px",
  },
  alertDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "#f87171", flexShrink: 0,
  },
  loadingBox: {
    padding: "32px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: "12px",
  },
  loadingBar: {
    width: "200px", height: "3px", background: "rgba(255,255,255,0.05)",
    borderRadius: "99px", overflow: "hidden",
  },
  loadingFill: {
    height: "100%", width: "40%",
    background: "linear-gradient(90deg, #f59e0b, #818cf8)",
    borderRadius: "99px", animation: "slide 1.2s ease-in-out infinite alternate",
  },
  loadingText: { color: "#64748b", fontSize: "0.85rem", fontStyle: "italic" },
  resultados: { display: "flex", flexDirection: "column", gap: "20px" },
  resumen: {
    display: "flex", gap: "12px", padding: "16px",
    background: "rgba(255,255,255,0.03)", borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  resumenIcon: { fontSize: "1.1rem", flexShrink: 0 },
  resumenText: { color: "#94a3b8", fontSize: "0.88rem", lineHeight: "1.6" },
  statsRow: { display: "flex", gap: "12px", flexWrap: "wrap" },
  btnGuardarTodas: {
    alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px",
    padding: "9px 18px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
    color: "#34d399", background: "rgba(52,211,153,0.08)",
    border: "1px solid rgba(52,211,153,0.2)", cursor: "pointer", fontFamily: "inherit",
  },
  grupo: { display: "flex", flexDirection: "column", gap: "8px" },
  grupoHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  catBadge: {
    padding: "3px 10px", borderRadius: "999px",
    fontSize: "0.75rem", fontWeight: 700,
  },
  grupoCount: { color: "#475569", fontSize: "0.78rem" },
};

const cardStyles = {
  wrap: {
    background: "rgba(255,255,255,0.02)", borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
  },
  top: {
    padding: "14px 16px", display: "flex",
    justifyContent: "space-between", alignItems: "center",
    cursor: "pointer", gap: "12px",
  },
  preguntaRow: { display: "flex", alignItems: "flex-start", gap: "8px", flex: 1 },
  chevron: { color: "#475569", fontSize: "0.75rem", marginTop: "2px", flexShrink: 0 },
  pregunta: { color: "#e2e8f0", fontSize: "0.88rem", fontWeight: 500, lineHeight: "1.5" },
  meta: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
  freq: {
    color: "#475569", fontSize: "0.75rem", fontWeight: 600,
    background: "rgba(255,255,255,0.04)", padding: "2px 7px",
    borderRadius: "5px", fontFamily: "monospace",
  },
  saveBtn: {
    padding: "4px 12px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
    color: "#38bdf8", background: "rgba(56,189,248,0.1)",
    border: "1px solid rgba(56,189,248,0.2)", cursor: "pointer", fontFamily: "inherit",
  },
  savedBadge: {
    fontSize: "0.75rem", fontWeight: 600, color: "#34d399",
    padding: "4px 10px", borderRadius: "6px",
    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
  },
  respuesta: {
    padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(255,255,255,0.01)",
  },
  respuestaLabel: {
    fontSize: "0.7rem", fontWeight: 600, color: "#475569",
    letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "6px",
  },
  respuestaText: { color: "#94a3b8", fontSize: "0.85rem", lineHeight: "1.6" },
};

const chipStyles = {
  wrap: {
    display: "flex", flexDirection: "column", gap: "2px",
    padding: "10px 16px", borderRadius: "10px",
    background: "rgba(255,255,255,0.02)", border: "1px solid",
  },
  value: { fontSize: "1.3rem", fontWeight: 800, fontFamily: "'Syne', sans-serif" },
  label: { fontSize: "0.7rem", color: "#64748b", fontWeight: 500 },
};