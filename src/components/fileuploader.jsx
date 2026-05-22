import { useState } from "react";
import { supabase } from "../supabase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const ALLOWED_EXTENSIONS = [".csv", ".json", ".txt"];

export default function FileUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    processFile(selected);
  }

  function processFile(selected) {
    if (!selected) return;
    const ext = "." + selected.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFile(null);
      setStatus({ type: "error", msg: "Formato no permitido. Solo se aceptan: CSV, JSON, TXT." });
      return;
    }
    setFile(selected);
    setStatus({ type: "info", msg: `Archivo listo: ${selected.name}` });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    processFile(dropped);
  }

  async function handleUpload() {
    if (!file) {
      setStatus({ type: "error", msg: "No se seleccionó ningún archivo." });
      return;
    }
    setLoading(true);
    setStatus({ type: "info", msg: "Subiendo archivo..." });

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("conversaciones")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("conversaciones").getPublicUrl(fileName);
      const downloadURL = data.publicUrl;

      await addDoc(collection(db, "cargas"), {
        nombre: file.name,
        tipo: file.type || "desconocido",
        tamaño: file.size,
        fechaCarga: serverTimestamp(),
        responsable: "Grupo Everwood",
        estado: "cargado",
        observaciones: "Carga exitosa",
        url: downloadURL,
      });

      setStatus({ type: "success", msg: `"${file.name}" cargado correctamente.` });
      setFile(null);
      document.getElementById("fileInput").value = "";
      onUploadSuccess();
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", msg: "Error al cargar el archivo. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  const dropZoneStyle = {
    ...styles.dropZone,
    ...(dragging ? styles.dropZoneActive : {}),
    ...(file ? styles.dropZoneHasFile : {}),
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.iconWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div>
          <h2 style={styles.title}>Cargar archivo</h2>
          <p style={styles.desc}>Formatos admitidos: <span style={styles.tag}>CSV</span> <span style={styles.tag}>JSON</span> <span style={styles.tag}>TXT</span></p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        style={dropZoneStyle}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput").click()}
      >
        <input
          id="fileInput"
          type="file"
          accept=".csv,.json,.txt"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        {file ? (
          <div style={styles.fileInfo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span style={styles.fileName}>{file.name}</span>
            <span style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "10px" }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span style={styles.dropText}>Arrastra un archivo aquí</span>
            <span style={styles.dropSub}>o haz clic para explorar</span>
          </>
        )}
      </div>

      {/* Status */}
      {status && (
        <div style={{ ...styles.alert, ...styles[`alert_${status.type}`] }}>
          <span style={styles.alertDot(status.type)} />
          {status.msg}
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleUpload}
        disabled={loading || !file}
        style={{ ...styles.button, ...(loading || !file ? styles.buttonDisabled : {}) }}
      >
        {loading ? (
          <span style={styles.btnInner}>
            <span style={styles.spinner} />
            Subiendo...
          </span>
        ) : (
          <span style={styles.btnInner}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
              <path d="M5 19h14"/>
            </svg>
            Subir archivo
          </span>
        )}
      </button>
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
    background: "rgba(56,189,248,0.1)",
    border: "1px solid rgba(56,189,248,0.2)",
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
    marginBottom: "4px",
  },
  desc: { color: "#64748b", fontSize: "0.83rem", display: "flex", alignItems: "center", gap: "6px" },
  tag: {
    background: "rgba(56,189,248,0.1)",
    color: "#38bdf8",
    padding: "1px 7px",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 600,
    fontFamily: "monospace",
  },
  dropZone: {
    border: "1.5px dashed rgba(255,255,255,0.12)",
    borderRadius: "12px",
    padding: "32px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all .2s",
    marginBottom: "20px",
    background: "rgba(255,255,255,0.02)",
    minHeight: "120px",
  },
  dropZoneActive: {
    borderColor: "#38bdf8",
    background: "rgba(56,189,248,0.05)",
  },
  dropZoneHasFile: {
    borderColor: "rgba(52,211,153,0.4)",
    background: "rgba(52,211,153,0.04)",
  },
  dropText: { color: "#94a3b8", fontSize: "0.9rem", fontWeight: 500 },
  dropSub: { color: "#475569", fontSize: "0.78rem", marginTop: "4px" },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  fileName: { color: "#e2e8f0", fontWeight: 500, fontSize: "0.9rem" },
  fileSize: { color: "#64748b", fontSize: "0.78rem" },
  alert: {
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "0.85rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid",
  },
  alert_success: { background: "rgba(52,211,153,0.08)", color: "#34d399", borderColor: "rgba(52,211,153,0.2)" },
  alert_error:   { background: "rgba(248,113,113,0.08)", color: "#f87171", borderColor: "rgba(248,113,113,0.2)" },
  alert_info:    { background: "rgba(56,189,248,0.08)",  color: "#38bdf8", borderColor: "rgba(56,189,248,0.2)"  },
  alertDot: (type) => ({
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
    background: type === "success" ? "#34d399" : type === "error" ? "#f87171" : "#38bdf8",
  }),
  button: {
    width: "100%",
    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    color: "white",
    border: "none",
    padding: "13px 28px",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity .2s, transform .1s",
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  btnInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
};