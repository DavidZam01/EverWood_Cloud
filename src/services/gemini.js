const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Parsea un CSV con columnas fecha, usuario, mensaje
 */
export function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] || "").replace(/^"|"$/g, "").trim();
    });
    return row;
  }).filter((r) => r.mensaje && r.mensaje.length > 0);
}

/**
 * Llama a Groq con un bloque de conversaciones y retorna FAQs sugeridas
 */
export async function extraerFAQs(conversaciones) {
  const muestra = conversaciones
    .slice(0, 120)
    .map((c) => `[${c.usuario || "Usuario"}]: ${c.mensaje}`)
    .join("\n");

  const prompt = `Eres un experto en análisis de atención al cliente.
Analiza las siguientes conversaciones históricas de WhatsApp de la empresa Everwood y extrae las preguntas frecuentes (FAQs) más importantes.

CONVERSACIONES:
${muestra}

Responde ÚNICAMENTE con un JSON válido con este formato exacto, sin texto adicional, sin bloques de código markdown:
{
  "faqs": [
    {
      "pregunta": "¿Pregunta frecuente?",
      "respuesta": "Respuesta sugerida clara y concisa.",
      "frecuencia": 5,
      "categoria": "Envíos"
    }
  ],
  "resumen": "Breve resumen del tipo de conversaciones analizadas."
}

Reglas:
- Genera entre 5 y 12 FAQs
- Ordénalas de mayor a menor frecuencia estimada
- Categorías cortas: Envíos, Pagos, Productos, Soporte, Devoluciones, General
- Las respuestas deben ser útiles y profesionales
- NO incluyas bloques de código ni texto fuera del JSON`;

  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2048,
  };

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Error al llamar a Groq");
  }

  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content || "";
  const clean = rawText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error("La IA no devolvió un JSON válido. Intenta de nuevo.");
  }
}

/**
 * Agrupa FAQs por categoría
 */
export function agruparPorCategoria(faqs) {
  const grupos = {};
  faqs.forEach((faq) => {
    const cat = faq.categoria || "General";
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(faq);
  });
  return grupos;
}