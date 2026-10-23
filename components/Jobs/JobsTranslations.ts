export interface TranslationDict {
  pageTitle: string;
  headerBadge: string;
  liveDb: string;
  mainHeading: string;
  subtitle: string;
  refresh: string;
  kpi: {
    totalJobs: string;
    totalJobsSub: string;
    activeJobs: string;
    activeJobsSub: string;
    suspiciousJobs: string;
    suspiciousJobsSub: string;
    deactivatedJobs: string;
    deactivatedJobsSub: string;
    totalArea: string;
    totalAreaSub: string;
  };
  tabs: {
    all: string;
    active: string;
    suspicious: string;
    deactivated: string;
  };
  searchPlaceholder: string;
  categories: {
    all: string;
    tillage: string;
    seeding: string;
    spraying: string;
    harvest: string;
    drone: string;
    transportation: string;
    transport: string;
    season: string;
    special: string;
  };
  tableHeaders: {
    jobStore: string;
    categoryCrop: string;
    machineryArea: string;
    compensation: string;
    riskLevel: string;
    status: string;
    actions: string;
  };
  tableRows: {
    crop: string;
    notSpecified: string;
    noLocation: string;
    hectares: string;
    totalPerJob: string;
    safe: string;
    suspicious: string;
    active: string;
    deactivated: string;
    viewDetails: string;
    deactivate: string;
    reactivate: string;
    deletePermanently: string;
    loading: string;
    noResults: string;
    rtkActive: string;
    standardGps: string;
  };
  deactivateModal: {
    title: string;
    subtitle: string;
    jobToSuspend: string;
    selectReason: string;
    orWriteReason: string;
    placeholder: string;
    cancel: string;
    confirm: string;
  };
  presetReasons: string[];
  inspectorModal: {
    store: string;
    rateHour: string;
    rateJob: string;
    area: string;
    description: string;
    specs: string;
    locationCrop: string;
    platformStatus: string;
    activePublished: string;
    deactivatedHidden: string;
    deactivationReason: string;
    by: string;
    close: string;
    deactivateJob: string;
    reactivateJob: string;
    telemetryTitle: string;
    rtkRequired: string;
    standardGpsRequired: string;
  };
  alerts: {
    deactivatedSuccess: (heading: string) => string;
    reactivatedSuccess: (heading: string) => string;
    deletedSuccess: string;
    confirmReactivate: (heading: string) => string;
    confirmDelete: (heading: string) => string;
    errorDeactivate: string;
    errorReactivate: string;
    errorDelete: string;
  };
}

export const jobsTranslations: Record<"en" | "es", TranslationDict> = {
  en: {
    pageTitle: "Job Postings / Moderation",
    headerBadge: "Fraud Control & Compliance",
    liveDb: "Render PostgreSQL Live",
    mainHeading: "Job Postings Moderation & Control",
    subtitle:
      "Monitor agricultural job postings published by dealers and tractor owners. Detect anomalous rates and immediately suspend fraudulent job offers.",
    refresh: "Refresh",
    kpi: {
      totalJobs: "Total Jobs",
      totalJobsSub: "All-time postings",
      activeJobs: "Active in App",
      activeJobsSub: "Visible to operators",
      suspiciousJobs: "Suspicious",
      suspiciousJobsSub: "Detected anomalies",
      deactivatedJobs: "Deactivated",
      deactivatedJobsSub: "Blocked / Hidden",
      totalArea: "Total Area",
      totalAreaSub: "Offered acreage",
    },
    tabs: {
      all: "All",
      active: "Active",
      suspicious: "Suspicious",
      deactivated: "Deactivated",
    },
    searchPlaceholder: "Search by job, tractor, store, crop...",
    categories: {
      all: "All Categories",
      tillage: "Tillage & Soil Prep",
      seeding: "Seeding & Planting",
      spraying: "Crop Care & Spraying",
      harvest: "Harvesting",
      drone: "Agricultural Drone",
      transportation: "In-Field Hauling",
      transport: "In-Field Hauling",
      season: "Full Season Work",
      special: "Specialized Tasks",
    },
    tableHeaders: {
      jobStore: "Job & Store",
      categoryCrop: "Category / Crop",
      machineryArea: "Machinery & Area",
      compensation: "Compensation",
      riskLevel: "Risk Level",
      status: "Status",
      actions: "Actions",
    },
    tableRows: {
      crop: "Crop",
      notSpecified: "Not specified",
      noLocation: "No location",
      hectares: "Hectares",
      totalPerJob: "Total / job",
      safe: "Safe",
      suspicious: "Suspicious",
      active: "Active",
      deactivated: "Deactivated",
      viewDetails: "View full details",
      deactivate: "Deactivate",
      reactivate: "Reactivate",
      deletePermanently: "Delete permanently",
      loading: "Loading job postings in real time...",
      noResults: "No job postings matched the selected filters.",
      rtkActive: "RTK GPS (±2cm)",
      standardGps: "Standard GPS",
    },
    deactivateModal: {
      title: "Deactivate Job Posting",
      subtitle: "Immediately hides the posting from mobile operators",
      jobToSuspend: "Job to suspend",
      selectReason: "Select suspicion reason or policy violation:",
      orWriteReason: "Or provide a detailed custom reason:",
      placeholder: "Detail why this job posting violates safety standards...",
      cancel: "Cancel",
      confirm: "Confirm Deactivation",
    },
    presetReasons: [
      "Hourly or job compensation rate outside verified market range",
      "Machinery or specs cannot be verified with dealer or store",
      "Suspected non-agricultural content / external suspicious contact links",
      "Inconsistent plot location coordinates or unreachable farm",
      "Operator complaints of fraudulent or misleading job terms",
    ],
    inspectorModal: {
      store: "Posting Store",
      rateHour: "Rate / Hour",
      rateJob: "Fixed Job Rate",
      area: "Surface Area",
      description: "Job Description",
      specs: "Tractor Specifications",
      locationCrop: "Location & Crop",
      platformStatus: "Platform Status",
      activePublished: "Active & Published",
      deactivatedHidden: "Deactivated / Hidden",
      deactivationReason: "Suspension Reason",
      by: "by",
      close: "Close",
      deactivateJob: "Deactivate Job",
      reactivateJob: "Reactivate Job",
      telemetryTitle: "GNSS Guidance & Autosteer",
      rtkRequired: "Dual-Band RTK Active (±2cm centimeter accuracy)",
      standardGpsRequired: "Standard Sub-meter GPS Guidance",
    },
    alerts: {
      deactivatedSuccess: (heading: string) => `Job "${heading}" deactivated successfully.`,
      reactivatedSuccess: (heading: string) => `Job "${heading}" reactivated successfully.`,
      deletedSuccess: "Job posting permanently purged from database.",
      confirmReactivate: (heading: string) =>
        `Do you want to reactivate the job "${heading}" for all operators?`,
      confirmDelete: (heading: string) =>
        `⚠️ Permanently DELETE job "${heading}"? This action cannot be undone.`,
      errorDeactivate: "Error deactivating job:",
      errorReactivate: "Error reactivating job:",
      errorDelete: "Error deleting job:",
    },
  },
  es: {
    pageTitle: "Ofertas de Trabajo / Moderación",
    headerBadge: "Control & Anti-Fraude",
    liveDb: "Render PostgreSQL en Vivo",
    mainHeading: "Moderación de Vacantes y Labores",
    subtitle:
      "Supervisa ofertas agrícolas publicadas por concesionarios y propietarios. Detecta precios anómalos o sospechosos y desactiva vacantes fraudulentas al instante.",
    refresh: "Actualizar",
    kpi: {
      totalJobs: "Total Vacantes",
      totalJobsSub: "Historial acumulado",
      activeJobs: "Activas en App",
      activeJobsSub: "Visibles para operadores",
      suspiciousJobs: "Sospechosas",
      suspiciousJobsSub: "Anomalías detectadas",
      deactivatedJobs: "Desactivadas",
      deactivatedJobsSub: "Bloqueadas / Ocultas",
      totalArea: "Área Total",
      totalAreaSub: "Superficie ofertada",
    },
    tabs: {
      all: "Todas",
      active: "Activas",
      suspicious: "Sospechosas",
      deactivated: "Desactivadas",
    },
    searchPlaceholder: "Buscar por labor, tractor, tienda, cultivo...",
    categories: {
      all: "Todas las Categorías",
      tillage: "Preparación de Suelo",
      seeding: "Siembra y Plantación",
      spraying: "Cuidado / Pulverización",
      harvest: "Cosecha y Recolección",
      drone: "Dron Agrícola",
      transportation: "Transporte de Campo",
      transport: "Transporte de Campo",
      season: "Temporada Completa",
      special: "Labores Especiales",
    },
    tableHeaders: {
      jobStore: "Labor & Tienda",
      categoryCrop: "Categoría / Cultivo",
      machineryArea: "Maquinaria & Área",
      compensation: "Compensación",
      riskLevel: "Nivel de Riesgo",
      status: "Estado",
      actions: "Acciones",
    },
    tableRows: {
      crop: "Cultivo",
      notSpecified: "No especificado",
      noLocation: "Sin ubicación",
      hectares: "Hectáreas",
      totalPerJob: "Total / labor",
      safe: "Segura",
      suspicious: "Sospechosa",
      active: "Activa",
      deactivated: "Desactivada",
      viewDetails: "Ver ficha completa",
      deactivate: "Desactivar",
      reactivate: "Reactivar",
      deletePermanently: "Eliminar permanentemente",
      loading: "Cargando vacantes en tiempo real...",
      noResults: "No se encontraron ofertas que coincidan con los filtros seleccionados.",
      rtkActive: "Piloto RTK (±2cm)",
      standardGps: "GPS Estándar",
    },
    deactivateModal: {
      title: "Desactivar Oferta de Trabajo",
      subtitle: "Bloquea la visibilidad inmediata para los operadores",
      jobToSuspend: "Vacante a suspender",
      selectReason: "Selecciona motivo de sospecha o infracción:",
      orWriteReason: "O escribe un motivo detallado:",
      placeholder: "Detalla por qué esta labor infringe las normas...",
      cancel: "Cancelar",
      confirm: "Confirmar Desactivación",
    },
    presetReasons: [
      "Tarifa horaria o por labor fuera de rango de mercado",
      "Maquinaria o especificaciones no verificables con el concesionario",
      "Sospecha de contenido no agrícola / enlaces o números de contacto sospechosos",
      "Ubicación de parcela o coordenadas inconsistentes",
      "Reporte de operadores por solicitud fraudulenta o engañosa",
    ],
    inspectorModal: {
      store: "Tienda Emisora",
      rateHour: "Tarifa / Hora",
      rateJob: "Tarifa Fija Labor",
      area: "Superficie",
      description: "Descripción de la labor",
      specs: "Especificaciones Tractor",
      locationCrop: "Ubicación y Cultivo",
      platformStatus: "Estado en Plataforma",
      activePublished: "Activa y Publicada",
      deactivatedHidden: "Desactivada / Oculta",
      deactivationReason: "Motivo de baja",
      by: "por",
      close: "Cerrar",
      deactivateJob: "Desactivar Oferta",
      reactivateJob: "Reactivar Oferta",
      telemetryTitle: "Guiado GNSS y Piloto Automático",
      rtkRequired: "RTK Doble Banda Activo (Precisión centimétrica ±2cm)",
      standardGpsRequired: "Guiado GPS Estándar Submétrico",
    },
    alerts: {
      deactivatedSuccess: (heading: string) => `Labor "${heading}" desactivada correctamente.`,
      reactivatedSuccess: (heading: string) => `Labor "${heading}" reactivada con éxito.`,
      deletedSuccess: "Vacante eliminada de la base de datos.",
      confirmReactivate: (heading: string) =>
        `¿Deseas reactivar la vacante "${heading}" para todos los operadores?`,
      confirmDelete: (heading: string) =>
        `⚠️ ¿Eliminar PERMANENTEMENTE la vacante "${heading}"? Esta acción no se puede deshacer.`,
      errorDeactivate: "Error al desactivar la vacante:",
      errorReactivate: "Error al reactivar la vacante:",
      errorDelete: "Error al eliminar la vacante:",
    },
  },
};
