import { useState } from "react";
import "./App.css";
import Navbar      from "./components/navbar";
import FileUploader from "./components/fileuploader";
import UploadHistory from "./components/uploadhistory";
import FAQAnalyzer  from "./components/faqanalyzer";
import FAQValidator from "./components/faqvalidator";
import Dashboard    from "./components/dashboard";

export default function App() {
  const [tab, setTab]             = useState("cargas");
  const [refreshCargas, setRefreshCargas] = useState(0);
  const [refreshFaqs, setRefreshFaqs]     = useState(0);

  const TAB_HEROES = {
    cargas: {
      tag:   "Gestión de archivos",
      title: "Historial de\nconversaciones",
      desc:  "Carga y organiza archivos de WhatsApp en formato CSV, JSON o TXT para su análisis posterior.",
      accent: "#38bdf8",
    },
    analisis: {
      tag:   "Inteligencia Artificial",
      title: "Extracción\nautomática de FAQs",
      desc:  "Gemini analiza tus conversaciones históricas y sugiere las preguntas frecuentes más relevantes.",
      accent: "#fbbf24",
    },
    validacion: {
      tag:   "Revisión humana",
      title: "Validación\ny edición",
      desc:  "Aprueba, rechaza o edita las FAQs sugeridas por IA antes de publicarlas.",
      accent: "#34d399",
    },
    metricas: {
      tag:   "Evaluación",
      title: "Desempeño\ndel sistema",
      desc:  "Precisión, cobertura y distribución de FAQs aprobadas por categoría.",
      accent: "#818cf8",
    },
  };

  const hero = TAB_HEROES[tab];

  return (
    <div className="page-bg">
      <Navbar tabActivo={tab} onTabChange={setTab} />

      <main style={styles.main}>
        {/* Hero dinámico por tab */}
        <div style={styles.hero}>
          <div style={styles.heroTag}>
            <span style={{ ...styles.heroDot, background: hero.accent, boxShadow: `0 0 8px ${hero.accent}` }} />
            {hero.tag}
          </div>
          <h1 style={styles.heroTitle}>
            {hero.title.split("\n").map((line, i) => (
              <span key={i}>
                {i === 1
                  ? <span style={{ ...styles.heroGradient, backgroundImage: `linear-gradient(90deg, ${hero.accent}, #818cf8)` }}>{line}</span>
                  : line}
                {i === 0 && <br />}
              </span>
            ))}
          </h1>
          <p style={styles.heroDesc}>{hero.desc}</p>
        </div>

        {/* Contenido por tab */}
        {tab === "cargas" && (
          <>
            <FileUploader onUploadSuccess={() => setRefreshCargas((k) => k + 1)} />
            <UploadHistory refresh={refreshCargas} />
          </>
        )}

        {tab === "analisis" && (
          <FAQAnalyzer onFaqsGuardadas={() => setRefreshFaqs((k) => k + 1)} />
        )}

        {tab === "validacion" && (
          <FAQValidator refresh={refreshFaqs} />
        )}

        {tab === "metricas" && (
          <Dashboard refresh={refreshCargas + refreshFaqs} />
        )}
      </main>
    </div>
  );
}

const styles = {
  main: {
    maxWidth: "960px", margin: "0 auto",
    padding: "40px 24px 80px",
    display: "flex", flexDirection: "column", gap: "24px",
  },
  hero: {
    padding: "44px 40px", borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(26,34,53,0.95) 100%)",
  },
  heroTag: {
    display: "inline-flex", alignItems: "center", gap: "7px",
    fontSize: "0.72rem", fontWeight: 600, color: "#64748b",
    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "18px",
  },
  heroDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    animation: "pulse 2s infinite", flexShrink: 0,
  },
  heroTitle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1,
    letterSpacing: "-0.03em", color: "#e2e8f0", marginBottom: "14px",
  },
  heroGradient: {
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroDesc: {
    color: "#64748b", fontSize: "0.95rem", lineHeight: "1.7", maxWidth: "500px",
  },
};