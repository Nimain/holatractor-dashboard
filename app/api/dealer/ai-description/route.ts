import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface GenerateDescriptionBody {
  storeName?: string;
  location?: string;
  city?: string;
  country?: string;
  specialty?: string;
  language?: "en" | "es" | "auto";
  variationIndex?: number;
}

// Generative agricultural copywriting models tailored for HolaTractor dealers
const DESCRIPTIONS_ES = {
  full_dealership: [
    "{NAME} es un concesionario agrícola integral y centro de distribución oficial en {LOCATION}, dedicado a proveer soluciones de mecanización avanzada para agricultores y empresas agropecuarias. Ofrecemos venta de tractores de alta eficiencia, implementos especializados, servicio técnico certificado y repuestos originales para garantizar máxima continuidad operativa en cada cosecha.",
    "Líder en maquinaria agrícola en {LOCATION}, {NAME} combina un amplio portafolio de tractores modernos y equipos agrícolas con asesoramiento agronómico especializado, financiamiento a medida y respaldo de posventa en campo los 360 días del año.",
    "{NAME} brinda soporte tecnológico y mecanización de alto rendimiento en {LOCATION}. Nos especializamos en la comercialización y servicio post-venta de tractores de última generación, implementos de siembra y cosecha, asegurando productividad, economía de combustible y confiabilidad insuperable.",
  ],
  machinery_sales: [
    "{NAME} se especializa en la provisión de tractores nuevos y seminuevos certificados en {LOCATION}. Nuestro catálogo abarca desde tractores utilitarios para economías regionales hasta unidades de alta potencia para labranza pesada y cosecha intensiva, respaldados por garantía oficial y entrega inmediata.",
    "Tu socio estratégico en maquinaria pesada agrícola en {LOCATION}. En {NAME} acercamos la última tecnología en potencia, transmisión hidráulica y confort de cabina, diseñados para maximizar las hectáreas trabajadas con el menor costo por hora.",
  ],
  service_maintenance: [
    "Centro técnico autorizado y taller especializado en {LOCATION}, {NAME} ofrece diagnóstico computarizado, mantenimiento preventivo en campo y stock permanente de repuestos legítimos para toda la flota de tractores y maquinaria agrícola de la región.",
    "{NAME} es el referente de servicio mecánico y posventa en {LOCATION}. Contamos con unidades móviles de asistencia técnica en finca, mecánicos certificados y repuestos garantizados para que tus tractores nunca se detengan durante la campaña agrícola.",
  ],
  leasing_rental: [
    "{NAME} ofrece soluciones flexibles de alquiler y leasing de tractores e implementos agrícolas en {LOCATION}. Permite a productores y contratistas acceder a flotas modernas sin inmovilizar capital, con mantenimiento integral incluido y tarifas competitivas por hectárea o temporada.",
    "Alquiler de tractores y maquinaria de primer nivel en {LOCATION}. En {NAME} facilitamos el crecimiento de tu operación agrícola con esquemas de arrendamiento ágiles, soporte mecánico continuo y disponibilidad inmediata durante picos de trabajo.",
  ],
  precision_ag: [
    "{NAME} lidera la transformación hacia la agricultura de precisión en {LOCATION}. Brindamos tractores equipados con telemetría GPS, autoguiado satelital y conectividad inteligente para optimizar insumos, reducir la huella de carbono y maximizar el rendimiento por hectárea.",
  ],
};

const DESCRIPTIONS_EN = {
  full_dealership: [
    "{NAME} is a premier authorized agricultural dealership in {LOCATION}, delivering cutting-edge tractor technology, high-precision implements, certified technical servicing, and genuine OEM parts to maximize agricultural yields across every growing season.",
    "As a leading agricultural machinery hub in {LOCATION}, {NAME} provides farmers and contractors with an extensive inventory of high-performance tractors, dedicated agronomic advisory, tailored financing, and 24/7 field-support services.",
    "{NAME} stands at the forefront of agricultural mechanization in {LOCATION}. We offer end-to-end sales, leasing, and maintenance solutions designed to maximize uptime, enhance fuel economy, and empower modern farming operations.",
  ],
  machinery_sales: [
    "{NAME} specializes in premium new and certified pre-owned tractors in {LOCATION}. From compact utility tractors for specialty crops to heavy-duty high-horsepower machines for extensive tillage and harvest, we offer unmatched performance and guaranteed reliability.",
    "Your trusted machinery partner in {LOCATION}. At {NAME}, we deliver industry-leading tractors engineered for durability, hydraulic efficiency, and superior operator comfort to drive farm productivity forward.",
  ],
  service_maintenance: [
    "Certified agricultural workshop and parts depot in {LOCATION}, {NAME} delivers comprehensive mechanical diagnostics, mobile in-field maintenance, and genuine replacement parts to keep agricultural machinery operating at peak performance.",
    "Reliable maintenance and field service in {LOCATION}. {NAME} operates rapid-response mobile service units and maintains extensive stock of genuine spares, ensuring zero downtime during critical planting and harvesting windows.",
  ],
  leasing_rental: [
    "{NAME} delivers flexible tractor leasing and agricultural equipment rentals in {LOCATION}. Helping farmers scale their capacity seamlessly with well-maintained equipment, comprehensive service coverage, and competitive seasonal rates.",
  ],
  precision_ag: [
    "{NAME} pioneers smart precision agriculture in {LOCATION}. Offering GPS-guided tractors, ISOBUS telematics, and automated farming solutions that optimize seed, fertilizer, and fuel usage for sustainable farming.",
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body: GenerateDescriptionBody = await request.json();
    const rawName = (body.storeName || "").trim();
    const storeName = rawName || "HolaTractor Dealer Hub";
    const rawCity = (body.city || "").trim();
    const rawCountry = (body.country || "").trim();
    const rawLocation = (body.location || "").trim();
    
    let locationStr = rawCity || rawLocation || (rawCountry ? rawCountry : "Santa Cruz, Bolivia");
    if (rawCity && rawCountry && !locationStr.includes(rawCountry)) {
      locationStr = `${rawCity}, ${rawCountry}`;
    }

    const specialty = (body.specialty || "full_dealership") as keyof typeof DESCRIPTIONS_ES;
    const requestedLang = body.language || "auto";

    // Auto-detect language if 'auto'
    let lang = requestedLang;
    if (lang === "auto") {
      const lowerLoc = locationStr.toLowerCase();
      if (
        lowerLoc.includes("bolivia") ||
        lowerLoc.includes("argentina") ||
        lowerLoc.includes("mexico") ||
        lowerLoc.includes("chile") ||
        lowerLoc.includes("colombia") ||
        lowerLoc.includes("peru") ||
        lowerLoc.includes("paraguay") ||
        lowerLoc.includes("santa cruz") ||
        lowerLoc.includes("buenos aires")
      ) {
        lang = "es";
      } else {
        lang = "en";
      }
    }

    const index = Math.abs(Number(body.variationIndex) || 0);

    // 1. Try Gemini API if key is present
    const geminiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const prompt = `Write a professional, attractive, high-converting 2-sentence description for an agricultural dealer store on the HolaTractor platform.
Store Name: ${storeName}
Location: ${locationStr}
Category / Specialty: ${specialty}
Language: ${lang === "es" ? "Spanish" : "English"}

Requirements:
- Emphasize farm productivity, quality machinery, and dependable service.
- Keep it natural, polished, and ready to publish directly on the store profile.
- Return ONLY the final text without quotes, markdown headers, or bullets.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 180,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const generatedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (generatedText && generatedText.length > 20) {
            return NextResponse.json({
              success: true,
              description: generatedText.replace(/^["']|["']$/g, "").trim(),
              provider: "gemini",
              specialty,
              language: lang,
            });
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini generation fallback:", geminiErr);
      }
    }

    // 2. High-quality structured fallback generator
    const dict = lang === "es" ? DESCRIPTIONS_ES : DESCRIPTIONS_EN;
    const pool = dict[specialty] || dict.full_dealership;
    const selectedTemplate = pool[index % pool.length];

    const finalDescription = selectedTemplate
      .replace(/{NAME}/g, storeName)
      .replace(/{LOCATION}/g, locationStr);

    return NextResponse.json({
      success: true,
      description: finalDescription,
      provider: "tractor_ai_synthesizer",
      specialty,
      language: lang,
    });
  } catch (error: any) {
    console.error("[/api/dealer/ai-description] Error:", error?.message);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate description",
        description: "Official authorized dealer store providing modern agricultural tractors, genuine attachments, and certified maintenance support.",
      },
      { status: 500 }
    );
  }
}
