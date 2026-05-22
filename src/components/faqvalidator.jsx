import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const ESTADOS = {
  pendiente: { label: "Pendiente",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.2)"  },
  aprobada:  { label: "Aprobada",   color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)"  },
  rechazada: { label: "Rechazada",  color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)" },
};

export default function FAQValidator({ refresh }) {
  const [faqs, setFaqs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState("pendiente");
  const [editando, setEditando]   = useState(null);
  const [editData, setEditData]   = useState({});
  const [guardando, setGuardando] = useState({});

  useEffect(() => { fetchFaqs(); }, [refresh]);

  async function fetchFaqs() {
    setLoading(true);
    const q = query(collection(db, "faqs_sugeridas"), orderBy("creadoEn", "desc"));
    const snap = await getDocs(q);
    setFaqs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  async function cambiarEstado(id, nuevoEstado) {
    setGuardando((g) => ({ ...g, [id]: true }));
    await updateDoc(doc(db, "faqs_sugeridas", id), { estado: nuevoEstado });
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    setGuardando((g) => ({ ...g, [id]: false }));
  }

  async function guardarEdicion(id) {
    setGuardando((g) => ({ ...g, [id]: true }));
    await updateDoc(doc(db, "faqs_sugeridas", id), {
      pregunta: editData.pregunta,
      respuesta: editData.respuesta,
    });
    setFaqs((prev) => prev.map((f) => f.id === id ? { ...f, ...editData } : f));
    setEditando(null);
    setGuardando((g) => ({ ...g, [id]: false }));
  }

  async function eliminar(id) {
    if (!window.confirm("¿Eliminar esta FAQ?")) return;
    await deleteDoc(doc(db, "faqs_sugeridas", id));
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  const faqsFiltradas = filtro === "todos"
    ? faqs
    : faqs.filter((f) => f.estado === filtro);

  const counts = {
    todos:     faqs.length,
    pendiente: faqs.filter((f) => f.estado === "pendiente").length,
    aprobada:  faqs.filter((f) => f.estado === "aprobada").length,
    rechazada: faqs.filter((f) => f.estado === "rechazada").length,
  };

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <div style={styles.iconWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <div>
          <h2 style={styles.title}>Validación de FAQs</h2>
          <p style={styles.desc}>Revisa, edita y aprueba las sugerencias generadas por IA</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={styles.filtros}>
        {[
          { key: "pendiente", label: "Pendientes" },
          { key: "aprobada",  label: "Aprobadas"  },
          { key: "rechazada", label: "Rechazadas" },
          { key: "todos",     label: "Todas"      },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            style={{ ...styles.filtroBtn, ...(filtro === key ? styles.filtroBtnActive : {}) }}
          >
            {label}
            <span style={{ ...styles.filtroBadge, ...(filtro === key ? styles.filtroBadgeActive : {}) }}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div style={styles.empty}>
          <div style={styles.loadingBar}><div style={styles.loadingFill} /></div>
          <span style={styles.emptyText}>Cargando FAQs...</span>
        </div>
      ) : faqsFiltradas.length === 0 ? (
        <div style={styles.empty}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={styles.emptyText}>
            {filtro === "pendiente"
              ? "No hay FAQs pendientes. ¡Todo revisado!"
              : filtro === "todos"
              ? "No hay FAQs guardadas aún. Analiza un CSV primero."
              : `No hay FAQs ${filtro}s.`}
          </span>
        </div>
      ) : (
        <div style={styles.lista}>
          {faqsFiltradas.map((faq) => {
            const est = ESTADOS[faq.estado] || ESTADOS.pendiente;
            const isEdit = editando === faq.id;
            return (
              <div key={faq.id} style={styles.faqCard}>
                {/* Top row */}
                <div style={styles.faqTop}>
                  <span style={{ ...styles.estadoBadge, color: est.color, background: est.bg, border: `1px solid ${est.border}` }}>
                    {est.label}
                  </span>
                  {faq.categoria && (
                    <span style={styles.catTag}>{faq.categoria}</span>
                  )}
                  <span style={styles.origen}>{faq.archivoOrigen}</span>
                </div>

                {/* Pregunta / Respuesta */}
                {isEdit ? (
                  <div style={styles.editForm}>
                    <label style={styles.editLabel}>Pregunta</label>
                    <textarea
                      value={editData.pregunta}
                      onChange={(e) => setEditData((d) => ({ ...d, pregunta: e.target.value }))}
                      style={styles.textarea}
                      rows={2}
                    />
                    <label style={styles.editLabel}>Respuesta</label>
                    <textarea
                      value={editData.respuesta}
                      onChange={(e) => setEditData((d) => ({ ...d, respuesta: e.target.value }))}
                      style={styles.textarea}
                      rows={3}
                    />
                    <div style={styles.editActions}>
                      <button onClick={() => guardarEdicion(faq.id)} style={styles.btnGuardar}>
                        {guardando[faq.id] ? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button onClick={() => setEditando(null)} style={styles.btnCancelar}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.faqBody}>
                    <p style={styles.pregunta}>{faq.pregunta}</p>
                    <p style={styles.respuesta}>{faq.respuesta}</p>
                  </div>
                )}

                {/* Acciones */}
                {!isEdit && (
                  <div style={styles.acciones}>
                    {faq.estado !== "aprobada" && (
                      <button
                        onClick={() => cambiarEstado(faq.id, "aprobada")}
                        disabled={guardando[faq.id]}
                        style={styles.btnAprobar}
                      >
                        ✓ Aprobar
                      </button>
                    )}
                    {faq.estado !== "rechazada" && (
                      <button
                        onClick={() => cambiarEstado(faq.id, "rechazada")}
                        disabled={guardando[faq.id]}
                        style={styles.btnRechazar}
                      >
                        ✕ Rechazar
                      </button>
                    )}
                    <button
                      onClick={() => { setEditando(faq.id); setEditData({ pregunta: faq.pregunta, respuesta: faq.respuesta }); }}
                      style={styles.btnEditar}
                    >
                      ✎ Editar
                    </button>
                    <button onClick={() => eliminar(faq.id)} style={styles.btnEliminar}>
                      🗑
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#111827", borderRadius: "16px",
    padding: "28px", border: "1px solid rgba(255,255,255,0.07)",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" },
  iconWrap: {
    width: "40px", height: "40px", borderRadius: "10px",
    background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  title: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#e2e8f0", marginBottom: "4px" },
  desc: { color: "#64748b", fontSize: "0.83rem" },
  filtros: { display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" },
  filtroBtn: {
    display: "inline-flex", alignItems: "center", gap: "7px",
    padding: "7px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 500,
    color: "#64748b", background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", fontFamily: "inherit",
    transition: "all .15s",
  },
  filtroBtnActive: { color: "#e2e8f0", background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.15)" },
  filtroBadge: {
    background: "rgba(255,255,255,0.06)", color: "#475569",
    padding: "1px 6px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
  },
  filtroBadgeActive: { background: "rgba(255,255,255,0.12)", color: "#94a3b8" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "48px 20px" },
  emptyText: { color: "#475569", fontSize: "0.88rem", fontStyle: "italic", textAlign: "center" },
  loadingBar: { width: "160px", height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "99px", overflow: "hidden" },
  loadingFill: { height: "100%", width: "40%", background: "linear-gradient(90deg, #34d399, #818cf8)", borderRadius: "99px", animation: "slide 1.2s ease-in-out infinite alternate" },
  lista: { display: "flex", flexDirection: "column", gap: "12px" },
  faqCard: {
    background: "rgba(255,255,255,0.02)", borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)", padding: "16px",
    display: "flex", flexDirection: "column", gap: "12px",
  },
  faqTop: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  estadoBadge: { padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700 },
  catTag: {
    padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600,
    color: "#818cf8", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)",
  },
  origen: { color: "#334155", fontSize: "0.72rem", marginLeft: "auto", fontFamily: "monospace" },
  faqBody: { display: "flex", flexDirection: "column", gap: "8px" },
  pregunta: { color: "#e2e8f0", fontWeight: 600, fontSize: "0.9rem", lineHeight: "1.5" },
  respuesta: { color: "#64748b", fontSize: "0.85rem", lineHeight: "1.6" },
  acciones: { display: "flex", gap: "8px", flexWrap: "wrap" },
  btnAprobar: {
    padding: "6px 14px", borderRadius: "7px", fontSize: "0.78rem", fontWeight: 600,
    color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
    cursor: "pointer", fontFamily: "inherit",
  },
  btnRechazar: {
    padding: "6px 14px", borderRadius: "7px", fontSize: "0.78rem", fontWeight: 600,
    color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)",
    cursor: "pointer", fontFamily: "inherit",
  },
  btnEditar: {
    padding: "6px 14px", borderRadius: "7px", fontSize: "0.78rem", fontWeight: 600,
    color: "#94a3b8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    cursor: "pointer", fontFamily: "inherit",
  },
  btnEliminar: {
    padding: "6px 10px", borderRadius: "7px", fontSize: "0.82rem",
    color: "#475569", background: "transparent", border: "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer", fontFamily: "inherit", marginLeft: "auto",
  },
  editForm: { display: "flex", flexDirection: "column", gap: "10px" },
  editLabel: { fontSize: "0.72rem", fontWeight: 600, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" },
  textarea: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", padding: "10px 12px", color: "#e2e8f0",
    fontSize: "0.85rem", lineHeight: "1.6", resize: "vertical", fontFamily: "inherit",
    outline: "none",
  },
  editActions: { display: "flex", gap: "8px" },
  btnGuardar: {
    padding: "8px 16px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
    color: "white", background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    border: "none", cursor: "pointer", fontFamily: "inherit",
  },
  btnCancelar: {
    padding: "8px 16px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 500,
    color: "#64748b", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontFamily: "inherit",
  },
};