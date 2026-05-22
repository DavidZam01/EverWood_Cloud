import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";

export default function UploadHistory({ refresh }) {
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCargas() {
      setLoading(true);
      const q = query(collection(db, "cargas"), orderBy("fechaCarga", "desc"));
      const snapshot = await getDocs(q);
      setCargas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchCargas();
  }, [refresh]);

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function formatDate(ts) {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleString("es-CO");
  }

  function getFileIcon(tipo) {
    if (tipo?.includes("json")) return "{ }";
    if (tipo?.includes("csv"))  return "csv";
    if (tipo?.includes("text")) return "txt";
    return "···";
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.iconWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </div>
        <div>
          <h2 style={styles.title}>Historial de cargas</h2>
          {!loading && <span style={styles.count}>{cargas.length} archivo{cargas.length !== 1 ? "s" : ""}</span>}
        </div>
      </div>

      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.loadingBar}><div style={styles.loadingFill} /></div>
          <span style={styles.emptyText}>Cargando historial...</span>
        </div>
      ) : cargas.length === 0 ? (
        <div style={styles.emptyState}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "10px" }}>
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
          <span style={styles.emptyText}>No hay archivos cargados aún.</span>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Archivo", "Tipo", "Tamaño", "Fecha de carga", "Responsable", "Estado", ""].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargas.map((c, i) => (
                <tr key={c.id} style={{ ...styles.tr, animationDelay: `${i * 40}ms` }}>
                  <td style={styles.td}>
                    <div style={styles.fileCell}>
                      <span style={styles.fileChip}>{getFileIcon(c.tipo)}</span>
                      <span style={styles.fileName}>{c.nombre}</span>
                    </div>
                  </td>
                  <td style={styles.td}><span style={styles.typeText}>{c.tipo}</span></td>
                  <td style={styles.td}>{formatSize(c.tamaño)}</td>
                  <td style={styles.td}>{formatDate(c.fechaCarga)}</td>
                  <td style={styles.td}>{c.responsable}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{c.estado}</span>
                  </td>
                  <td style={styles.td}>
                    <a href={c.url} target="_blank" rel="noreferrer" style={styles.link}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "24px",
  },
  iconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "rgba(129,140,248,0.1)",
    border: "1px solid rgba(129,140,248,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "1.1rem",
    color: "#e2e8f0",
    marginBottom: "2px",
  },
  count: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontWeight: 500,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 20px",
    gap: "8px",
  },
  emptyText: {
    color: "#475569",
    fontSize: "0.88rem",
    fontStyle: "italic",
  },
  loadingBar: {
    width: "160px",
    height: "3px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "99px",
    overflow: "hidden",
    marginBottom: "10px",
  },
  loadingFill: {
    height: "100%",
    width: "40%",
    background: "linear-gradient(90deg, #38bdf8, #818cf8)",
    borderRadius: "99px",
    animation: "slide 1.2s ease-in-out infinite alternate",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  },
  th: {
    padding: "10px 14px",
    textAlign: "left",
    color: "#475569",
    fontWeight: 600,
    fontSize: "0.72rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    transition: "background .15s",
  },
  td: {
    padding: "12px 14px",
    color: "#94a3b8",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  fileCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  fileChip: {
    background: "rgba(255,255,255,0.06)",
    color: "#64748b",
    padding: "2px 6px",
    borderRadius: "5px",
    fontFamily: "monospace",
    fontSize: "0.7rem",
    fontWeight: 700,
    flexShrink: 0,
  },
  fileName: {
    color: "#e2e8f0",
    fontWeight: 500,
  },
  typeText: {
    color: "#475569",
    fontFamily: "monospace",
    fontSize: "0.78rem",
  },
  badge: {
    background: "rgba(52,211,153,0.1)",
    color: "#34d399",
    padding: "3px 10px",
    borderRadius: "999px",
    fontWeight: 600,
    fontSize: "0.75rem",
    border: "1px solid rgba(52,211,153,0.2)",
  },
  link: {
    color: "#38bdf8",
    fontWeight: 500,
    fontSize: "0.82rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    opacity: 1,
    transition: "opacity .15s",
  },
};