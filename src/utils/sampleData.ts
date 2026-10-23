import { CommissioningReport } from '../types/report';

export const DEFAULT_VGREEN_LOGO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="95" viewBox="0 0 260 95">
    <g transform="translate(15, 8)">
      <path d="M 30 15 C 45 28 65 38 60 62 C 56 72 42 72 35 64 C 27 56 22 40 30 15 Z" fill="#52be2b" />
      <path d="M 22 28 C 30 38 38 50 30 65" stroke="#ffffff" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M 12 42 C 16 58 26 70 42 70" stroke="#338a16" stroke-width="4" stroke-linecap="round" fill="none" />
    </g>
    <text x="105" y="48" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" letter-spacing="3" fill="#0f172a">V-GREEN</text>
    <text x="105" y="68" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" letter-spacing="1.5" fill="#16a34a">INDONESIA</text>
  </svg>`
)}`;

export const DEFAULT_VENDOR_LOGO = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="95" viewBox="0 0 260 95">
    <rect x="15" y="15" width="65" height="65" rx="12" fill="#1e3a8a"/>
    <path d="M 32 32 L 48 62 L 64 32" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="95" y="48" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" letter-spacing="2" fill="#1e3a8a">DHJ</text>
    <text x="95" y="68" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" letter-spacing="0.5" fill="#64748b">DUTA HITA JAYA</text>
  </svg>`
)}`;

export function createEmptyReport(): CommissioningReport {
  return {
    id: `report-${Date.now()}`,
    title: 'Pre-Commissioning Report - BSS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    generalInfo: {
      plantName: '',
      plantAddress: '',
      plantCoordinate: '',
      gmapsLink: '',
      evChargerType: 'BSS 12 SLOT 3 PHASE',
      snChargerUnit: '',
      idPlnKodeBilling: '',
      providerSim: '',
      installationVendor: '',
      picVendorContact: '',
      installationDate: '',
      commissioningDate: '',
      customer: '',
      vgreenLogo: DEFAULT_VGREEN_LOGO,
      vendorLogo: '',
    },
    bssVisual: {
      frontViewOpen: { id: 'frontViewOpen', label: 'FRONT VIEW (OPEN)' },
      sideViewRight: { id: 'sideViewRight', label: 'SIDE VIEW (RIGHT)' },
      frontViewClose: { id: 'frontViewClose', label: 'FRONT VIEW (CLOSE)' },
      sideViewLeft: { id: 'sideViewLeft', label: 'SIDE VIEW (LEFT)' },
      proofFoundation40cm: {
        id: 'proofFoundation40cm',
        label: 'PROOF OF BSS FOUNDATION AT 40 CM DEPTH',
        sublabel: '*Fill if installed',
        highlightYellow: true,
      },
      concreteFoundation20cm: {
        id: 'concreteFoundation20cm',
        label: 'COMPLETED CONCRETE FOUNDATION FOR BSS 20CM HEIGHT FROM GROUND',
        sublabel: '*Fill if installed',
        highlightYellow: true,
      },
      sticker: {
        id: 'sticker',
        label: 'STICKER',
        sublabel: '*Fill if installed',
      },
      namePlate: { id: 'namePlate', label: 'NAME PLATE' },
      acCableTermination: { id: 'acCableTermination', label: 'AC CABLE TERMINATION' },
      groundingTermination: { id: 'groundingTermination', label: 'GROUNDING TERMINATION' },
      acDcCableEntry: { id: 'acDcCableEntry', label: 'AC-DC CABLE ENTRY TO PANEL' },
      visibleSafetySign: { id: 'visibleSafetySign', label: 'VISIBLE SAFETY SIGN' },
    },
    simCardVisual: {
      kartuPerdana: { id: 'kartuPerdana', label: 'KARTU PERDANA' },
      installedSimCard: { id: 'installedSimCard', label: 'INSTALLED SIM CARD' },
      signalBar: { id: 'signalBar', label: 'SIGNAL BAR' },
      url: { id: 'url', label: 'URL' },
      userInterfaceLcd: { id: 'userInterfaceLcd', label: 'USER INTERFACE (LCD)' },
    },
    groundingVisual: {
      groundingRodConnection: { id: 'groundingRodConnection', label: 'GROUNDING ROD CONNECTION' },
      groundingConnectedEvCharger: { id: 'groundingConnectedEvCharger', label: 'GROUNDING CONNECTED TO EV CHARGER' },
      groundingRodToEarth1: {
        id: 'groundingRodToEarth1',
        label: 'GROUNDING ROD TO EARTH',
        sublabel: 'Titik 1 (Insert 2 pics if use 2 spots)',
      },
      groundingRodToEarth2: {
        id: 'groundingRodToEarth2',
        label: 'GROUNDING ROD TO EARTH',
        sublabel: 'Titik 2 (Opsional jika 2 spot)',
      },
      groundingBusbarPanelAc: { id: 'groundingBusbarPanelAc', label: 'GROUNDING BUSBAR IN PANEL AC' },
      groundingCableRoute: { id: 'groundingCableRoute', label: 'GROUNDING CABLE ROUTE' },
      groundingTestOhm: {
        id: 'groundingTestOhm',
        label: 'GROUNDING TEST (OHM)',
        measurementValue: '',
        measurementUnit: 'Ω',
      },
    },
    kwhAndPanelVisual: {
      kwhMeter: { id: 'kwhMeter', label: 'KWH METER' },
      mcbPln: { id: 'mcbPln', label: 'MCB PLN' },
      acPanelFrontOpen: { id: 'acPanelFrontOpen', label: 'FRONT VIEW (OPEN)' },
      acPanelSafetySign: { id: 'acPanelSafetySign', label: 'SAFETY SIGN' },
      acPanelFrontClose: { id: 'acPanelFrontClose', label: 'FRONT VIEW (CLOSE)' },
      acPanelPilotLamps: { id: 'acPanelPilotLamps', label: 'PILOT LAMPS' },
      acPanelSideRight: { id: 'acPanelSideRight', label: 'SIDE VIEW (RIGHT)' },
      acPanelLockingSystem: { id: 'acPanelLockingSystem', label: 'LOCKING SYSTEM' },
      acPanelSideLeft: { id: 'acPanelSideLeft', label: 'SIDE VIEW (LEFT)' },
      acPanelMcb: { id: 'acPanelMcb', label: 'MCB' },
    },
    acPanelTesting: {
      panelWiring: { id: 'panelWiring', label: 'PANEL WIRING' },
      phaseMarking: { id: 'phaseMarking', label: 'PHASE MARKING' },
      voltageRN: { id: 'voltageRN', label: 'VOLTAGE (R-N)', measurementValue: '220', measurementUnit: 'V' },
      voltageRG: { id: 'voltageRG', label: 'VOLTAGE (R-G)', measurementValue: '220', measurementUnit: 'V' },
      frequency: { id: 'frequency', label: 'FREQUENCY', measurementValue: '50', measurementUnit: 'Hz' },
      voltageNG: { id: 'voltageNG', label: 'VOLTAGE (N-G)', measurementValue: '1.2', measurementUnit: 'V' },
      groundingToAcPanel: { id: 'groundingToAcPanel', label: 'GROUNDING TO AC PANEL' },
    },
    cablesVisual: {
      cableSpec: { id: 'cableSpec', label: 'CABLE SPEC' },
      cableRouting1: { id: 'cableRouting1', label: 'CABLE ROUTING #1' },
      cableRouting2: { id: 'cableRouting2', label: 'CABLE ROUTING #2' },
      cableRouting3: { id: 'cableRouting3', label: 'CABLE ROUTING #3' },
      cableRouting4: { id: 'cableRouting4', label: 'CABLE ROUTING #4' },
    },
    punchlist: [],
    approval: {
      statement:
        'This commissioning report has been prepared truthfully based on field inspections and testing results. All information contained in this report has been compiled by actual conditions and is accountable.',
      preparedBy: {
        name: '',
        designation: 'Project Manager',
        company: 'Vendor',
        date: '',
      },
      checkedBy: {
        name: '',
        designation: 'Setup Specialist',
        company: 'Vgreen Indonesia',
        date: '',
      },
      approvedBy: {
        name: 'Ade Lutfian',
        designation: 'Head of Setup and Operations',
        company: 'Vgreen Indonesia',
        date: '',
      },
    },
  };
}

// Generate realistic technical placeholder image for demo
function createPlaceholderSvg(title: string, color = '#0284c7', sub = 'INSPECTION PHOTO'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <rect width="600" height="450" fill="#f1f5f9"/>
    <rect x="20" y="20" width="560" height="410" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="8"/>
    <circle cx="300" cy="180" r="50" fill="${color}" opacity="0.15"/>
    <path d="M280 180 L295 195 L325 165" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="300" y="260" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#1e293b" text-anchor="middle">${title}</text>
    <text x="300" y="290" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#64748b" text-anchor="middle">${sub}</text>
    <rect x="40" y="380" width="520" height="30" fill="#0f172a" opacity="0.8" rx="4"/>
    <text x="50" y="400" font-family="monospace" font-size="11" fill="#38bdf8">V-GREEN COMM TEST • VERIFIED ON-SITE</text>
    <text x="540" y="400" font-family="monospace" font-size="11" fill="#94a3b8" text-anchor="end">18/09/2026</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createSampleReport(): CommissioningReport {
  const base = createEmptyReport();
  return {
    ...base,
    id: 'sample-kja-apparel',
    title: 'Pre-Commissioning Report - KJA APPAREL',
    generalInfo: {
      plantName: 'KJA APPAREL',
      plantAddress: 'Jln. Bumi Sani Permai, Setiamekar, Kec. Tambun Sel., Kabupaten Bekasi, Jawa Barat 17510',
      plantCoordinate: '-6.257321, 107.034567',
      gmapsLink: 'https://maps.app.goo.gl/3tXiVGPNWe1B74n56',
      evChargerType: 'BSS 12 SLOT 3 PHASE',
      snChargerUnit: 'BSS-26051341000745',
      idPlnKodeBilling: '532810098765',
      providerSim: 'Telkomsel / 081298765432',
      installationVendor: 'DUTA HITA JAYA (DHJ)',
      picVendorContact: 'Hendra Saputra (0812-3344-5566)',
      installationDate: '18/09/2026',
      commissioningDate: '19/09/2026',
      customer: 'KJA APPAREL',
      vgreenLogo: DEFAULT_VGREEN_LOGO,
      vendorLogo: DEFAULT_VENDOR_LOGO,
    },
    bssVisual: {
      frontViewOpen: {
        id: 'frontViewOpen',
        label: 'FRONT VIEW (OPEN)',
        imageData: createPlaceholderSvg('FRONT VIEW (OPEN)', '#0284c7', 'Battery Swap Cabinet Internal'),
        timestamp: '18/09/2026 10:15',
      },
      sideViewRight: {
        id: 'sideViewRight',
        label: 'SIDE VIEW (RIGHT)',
        imageData: createPlaceholderSvg('SIDE VIEW (RIGHT)', '#0284c7', 'Right Enclosure & Clearance'),
        timestamp: '18/09/2026 10:18',
      },
      frontViewClose: {
        id: 'frontViewClose',
        label: 'FRONT VIEW (CLOSE)',
        imageData: createPlaceholderSvg('FRONT VIEW (CLOSE)', '#0284c7', 'Front Door & BSS Slots'),
        timestamp: '18/09/2026 10:20',
      },
      sideViewLeft: {
        id: 'sideViewLeft',
        label: 'SIDE VIEW (LEFT)',
        imageData: createPlaceholderSvg('SIDE VIEW (LEFT)', '#0284c7', 'Left Enclosure & Ventilation'),
        timestamp: '18/09/2026 10:22',
      },
      proofFoundation40cm: {
        id: 'proofFoundation40cm',
        label: 'PROOF OF BSS FOUNDATION AT 40 CM DEPTH',
        sublabel: '*Fill if installed',
        highlightYellow: true,
        imageData: createPlaceholderSvg('PROOF OF BSS FOUNDATION 40CM', '#eab308', 'Depth measurement confirmed'),
        timestamp: '18/09/2026 09:30',
      },
      concreteFoundation20cm: {
        id: 'concreteFoundation20cm',
        label: 'COMPLETED CONCRETE FOUNDATION FOR BSS 20CM HEIGHT FROM GROUND',
        sublabel: '*Fill if installed',
        highlightYellow: true,
        imageData: createPlaceholderSvg('CONCRETE FOUNDATION 20CM', '#eab308', 'Plinth Height Level Check'),
        timestamp: '18/09/2026 09:45',
      },
      sticker: {
        id: 'sticker',
        label: 'STICKER',
        sublabel: '*Fill if installed',
        imageData: createPlaceholderSvg('STICKER V-GREEN & VINFAST', '#059669', 'Branding & Warning Stickers'),
        timestamp: '18/09/2026 11:00',
      },
      namePlate: {
        id: 'namePlate',
        label: 'NAME PLATE',
        imageData: createPlaceholderSvg('NAME PLATE SPECIFICATION', '#059669', 'Model, Ratings, Serial Number'),
        timestamp: '18/09/2026 11:05',
      },
      acCableTermination: {
        id: 'acCableTermination',
        label: 'AC CABLE TERMINATION',
        imageData: createPlaceholderSvg('AC CABLE TERMINATION', '#ea580c', 'Tightened & Insulated Lugs'),
        timestamp: '18/09/2026 11:15',
      },
      groundingTermination: {
        id: 'groundingTermination',
        label: 'GROUNDING TERMINATION',
        imageData: createPlaceholderSvg('GROUNDING TERMINATION', '#16a34a', 'Yellow/Green PE Cable Bonded'),
        timestamp: '18/09/2026 11:20',
      },
      acDcCableEntry: {
        id: 'acDcCableEntry',
        label: 'AC-DC CABLE ENTRY TO PANEL',
        imageData: createPlaceholderSvg('AC-DC CABLE ENTRY TO PANEL', '#ea580c', 'Cable Glands & Protection Conduit'),
        timestamp: '18/09/2026 11:30',
      },
      visibleSafetySign: {
        id: 'visibleSafetySign',
        label: 'VISIBLE SAFETY SIGN',
        imageData: createPlaceholderSvg('VISIBLE SAFETY SIGN', '#dc2626', 'High Voltage Warning Sign'),
        timestamp: '18/09/2026 11:35',
      },
    },
    simCardVisual: {
      kartuPerdana: {
        id: 'kartuPerdana',
        label: 'KARTU PERDANA',
        imageData: createPlaceholderSvg('KARTU PERDANA TELKOMSEL', '#dc2626', 'SIM Starter Pack & ICCID'),
        timestamp: '18/09/2026 12:00',
      },
      installedSimCard: {
        id: 'installedSimCard',
        label: 'INSTALLED SIM CARD',
        imageData: createPlaceholderSvg('INSTALLED SIM CARD', '#0284c7', 'SIM In Router/Controller Slot'),
        timestamp: '18/09/2026 12:05',
      },
      signalBar: {
        id: 'signalBar',
        label: 'SIGNAL BAR',
        imageData: createPlaceholderSvg('SIGNAL BAR (4G LTE)', '#16a34a', 'Signal Strength 4-5 Bars'),
        timestamp: '18/09/2026 12:10',
      },
      url: {
        id: 'url',
        label: 'URL',
        imageData: createPlaceholderSvg('URL / SERVER CONNECTION', '#2563eb', 'BSS Cloud Backend Connected'),
        timestamp: '18/09/2026 12:15',
      },
      userInterfaceLcd: {
        id: 'userInterfaceLcd',
        label: 'USER INTERFACE (LCD)',
        imageData: createPlaceholderSvg('USER INTERFACE (LCD)', '#0d9488', 'Screen Ready For Swap Operations'),
        timestamp: '18/09/2026 12:20',
      },
    },
    groundingVisual: {
      groundingRodConnection: {
        id: 'groundingRodConnection',
        label: 'GROUNDING ROD CONNECTION',
        imageData: createPlaceholderSvg('GROUNDING ROD CONNECTION', '#16a34a', 'Clamp & Rod Inspection'),
        timestamp: '18/09/2026 13:00',
      },
      groundingConnectedEvCharger: {
        id: 'groundingConnectedEvCharger',
        label: 'GROUNDING CONNECTED TO EV CHARGER',
        imageData: createPlaceholderSvg('GROUNDING TO EV CHARGER', '#16a34a', 'Main Body Ground Lug'),
        timestamp: '18/09/2026 13:05',
      },
      groundingRodToEarth1: {
        id: 'groundingRodToEarth1',
        label: 'GROUNDING ROD TO EARTH',
        sublabel: 'Titik 1 (Insert 2 pics if use 2 spots)',
        imageData: createPlaceholderSvg('GROUNDING ROD PIT SPOT 1', '#16a34a', 'Deep driven copper rod'),
        timestamp: '18/09/2026 13:10',
      },
      groundingRodToEarth2: {
        id: 'groundingRodToEarth2',
        label: 'GROUNDING ROD TO EARTH',
        sublabel: 'Titik 2 (Opsional jika 2 spot)',
        imageData: createPlaceholderSvg('GROUNDING ROD PIT SPOT 2', '#16a34a', 'Interconnected grounding pit'),
        timestamp: '18/09/2026 13:12',
      },
      groundingBusbarPanelAc: {
        id: 'groundingBusbarPanelAc',
        label: 'GROUNDING BUSBAR IN PANEL AC',
        imageData: createPlaceholderSvg('GROUNDING BUSBAR IN PANEL AC', '#16a34a', 'All PE Wires Securely Screwed'),
        timestamp: '18/09/2026 13:15',
      },
      groundingCableRoute: {
        id: 'groundingCableRoute',
        label: 'GROUNDING CABLE ROUTE',
        imageData: createPlaceholderSvg('GROUNDING CABLE ROUTE', '#16a34a', 'Conduit pathway to earth pit'),
        timestamp: '18/09/2026 13:20',
      },
      groundingTestOhm: {
        id: 'groundingTestOhm',
        label: 'GROUNDING TEST (OHM)',
        measurementValue: '3.44',
        measurementUnit: 'Ω',
        imageData: createPlaceholderSvg('EARTH TESTER: 3.44 Ω', '#16a34a', 'Digital Earth Clamp Reading'),
        timestamp: '18/09/2026 13:25',
      },
    },
    kwhAndPanelVisual: {
      kwhMeter: {
        id: 'kwhMeter',
        label: 'KWH METER',
        imageData: createPlaceholderSvg('KWH METER PLN', '#0284c7', 'PLN Digital Meter Display'),
        timestamp: '18/09/2026 14:00',
      },
      mcbPln: {
        id: 'mcbPln',
        label: 'MCB PLN',
        imageData: createPlaceholderSvg('MCB PLN 3-PHASE / 1-PHASE', '#0284c7', 'Sealed PLN Breaker'),
        timestamp: '18/09/2026 14:05',
      },
      acPanelFrontOpen: {
        id: 'acPanelFrontOpen',
        label: 'FRONT VIEW (OPEN)',
        imageData: createPlaceholderSvg('AC PANEL FRONT OPEN', '#475569', 'Internal Breakers & Contactor'),
        timestamp: '18/09/2026 14:10',
      },
      acPanelSafetySign: {
        id: 'acPanelSafetySign',
        label: 'SAFETY SIGN',
        imageData: createPlaceholderSvg('PANEL SAFETY SIGN', '#dc2626', 'Awas Listrik Tegangan Tinggi'),
        timestamp: '18/09/2026 14:15',
      },
      acPanelFrontClose: {
        id: 'acPanelFrontClose',
        label: 'FRONT VIEW (CLOSE)',
        imageData: createPlaceholderSvg('AC PANEL FRONT CLOSE', '#475569', 'Panel Door Closed & Clean'),
        timestamp: '18/09/2026 14:20',
      },
      acPanelPilotLamps: {
        id: 'acPanelPilotLamps',
        label: 'PILOT LAMPS',
        imageData: createPlaceholderSvg('PILOT LAMPS (R-S-T / ON)', '#16a34a', 'Indicator Lights ON'),
        timestamp: '18/09/2026 14:25',
      },
      acPanelSideRight: {
        id: 'acPanelSideRight',
        label: 'SIDE VIEW (RIGHT)',
        imageData: createPlaceholderSvg('AC PANEL SIDE RIGHT', '#475569', 'Enclosure & Wall Mount'),
        timestamp: '18/09/2026 14:30',
      },
      acPanelLockingSystem: {
        id: 'acPanelLockingSystem',
        label: 'LOCKING SYSTEM',
        imageData: createPlaceholderSvg('LOCKING SYSTEM', '#475569', 'Key Lock & Master Key Padlock'),
        timestamp: '18/09/2026 14:35',
      },
      acPanelSideLeft: {
        id: 'acPanelSideLeft',
        label: 'SIDE VIEW (LEFT)',
        imageData: createPlaceholderSvg('AC PANEL SIDE LEFT', '#475569', 'Cable Entry Gland Clearance'),
        timestamp: '18/09/2026 14:40',
      },
      acPanelMcb: {
        id: 'acPanelMcb',
        label: 'MCB',
        imageData: createPlaceholderSvg('MAIN MCB / RCBO', '#475569', 'MCB Rated Trip Current'),
        timestamp: '18/09/2026 14:45',
      },
    },
    acPanelTesting: {
      panelWiring: {
        id: 'panelWiring',
        label: 'PANEL WIRING',
        imageData: createPlaceholderSvg('PANEL WIRING DIAGRAM', '#4f46e5', 'Neat Cable Ties & Terminals'),
        timestamp: '18/09/2026 15:00',
      },
      phaseMarking: {
        id: 'phaseMarking',
        label: 'PHASE MARKING',
        imageData: createPlaceholderSvg('PHASE MARKING (R-S-T-N-PE)', '#0284c7', 'Color heat shrink & label tags'),
        timestamp: '18/09/2026 15:05',
      },
      voltageRN: {
        id: 'voltageRN',
        label: 'VOLTAGE (R-N)',
        measurementValue: '228',
        measurementUnit: 'V',
        imageData: createPlaceholderSvg('VOLTAGE (R-N): 228 V', '#0284c7', 'Multimeter True-RMS Reading'),
        timestamp: '18/09/2026 15:10',
      },
      voltageRG: {
        id: 'voltageRG',
        label: 'VOLTAGE (R-G)',
        measurementValue: '227',
        measurementUnit: 'V',
        imageData: createPlaceholderSvg('VOLTAGE (R-G): 227 V', '#0284c7', 'Multimeter True-RMS Reading'),
        timestamp: '18/09/2026 15:15',
      },
      frequency: {
        id: 'frequency',
        label: 'FREQUENCY',
        measurementValue: '50.1',
        measurementUnit: 'Hz',
        imageData: createPlaceholderSvg('FREQUENCY: 50.1 Hz', '#0284c7', 'Grid Frequency Test'),
        timestamp: '18/09/2026 15:20',
      },
      voltageNG: {
        id: 'voltageNG',
        label: 'VOLTAGE (N-G)',
        measurementValue: '1.1',
        measurementUnit: 'V',
        imageData: createPlaceholderSvg('VOLTAGE (N-G): 1.1 V', '#16a34a', 'Neutral-Ground Voltage < 2V OK'),
        timestamp: '18/09/2026 15:25',
      },
      groundingToAcPanel: {
        id: 'groundingToAcPanel',
        label: 'GROUNDING TO AC PANEL',
        imageData: createPlaceholderSvg('GROUNDING TO AC PANEL', '#16a34a', 'Continuity & Torque Checked'),
        timestamp: '18/09/2026 15:30',
      },
    },
    cablesVisual: {
      cableSpec: {
        id: 'cableSpec',
        label: 'CABLE SPEC',
        imageData: createPlaceholderSvg('CABLE SPEC (NYYHY 4x16mm²)', '#334155', 'Embossed Cable Marking Inspection'),
        timestamp: '18/09/2026 16:00',
      },
      cableRouting1: {
        id: 'cableRouting1',
        label: 'CABLE ROUTING #1',
        imageData: createPlaceholderSvg('CABLE ROUTING (TRENCH / TRAY)', '#334155', 'Tray support and cable ties'),
        timestamp: '18/09/2026 16:05',
      },
      cableRouting2: {
        id: 'cableRouting2',
        label: 'CABLE ROUTING #2',
        imageData: createPlaceholderSvg('CABLE ROUTING (CONDUIT BEND)', '#334155', 'Flexible metal conduit to BSS'),
        timestamp: '18/09/2026 16:10',
      },
      cableRouting3: {
        id: 'cableRouting3',
        label: 'CABLE ROUTING #3',
        imageData: createPlaceholderSvg('CABLE ROUTING (WALL PENETRATION)', '#334155', 'Wall sleeve and firestop foam'),
        timestamp: '18/09/2026 16:15',
      },
      cableRouting4: {
        id: 'cableRouting4',
        label: 'CABLE ROUTING #4',
        imageData: createPlaceholderSvg('CABLE ROUTING (ENTRY POINT)', '#334155', 'Weatherproof seal at cabinet inlet'),
        timestamp: '18/09/2026 16:20',
      },
    },
    punchlist: [
      {
        id: 'sample-punch-1',
        description: 'Pemasangan klem pengikat tambahan pada pipa flexible conduit rute kabel grounding ke earth pit.',
        severity: 'Minor',
        targetDate: '25/09/2026',
        status: 'Resolved',
        createdAt: '18/09/2026',
      },
    ],
    approval: {
      statement:
        'This commissioning report has been prepared truthfully based on field inspections and testing results. All information contained in this report has been compiled by actual conditions and is accountable.',
      preparedBy: {
        name: 'Hendra Saputra',
        designation: 'Project Manager',
        company: 'DUTA HITA JAYA (DHJ)',
        date: '18/09/2026',
        signatureImage: createSignatureSvg('Hendra S.'),
      },
      checkedBy: {
        name: 'Budi Raharjo',
        designation: 'Setup Specialist',
        company: 'Vgreen Indonesia',
        date: '19/09/2026',
        signatureImage: createSignatureSvg('Budi R.'),
      },
      approvedBy: {
        name: 'Ade Lutfian',
        designation: 'Head of Setup and Operations',
        company: 'Vgreen Indonesia',
        date: '19/09/2026',
        signatureImage: createSignatureSvg('Ade Lutfian'),
      },
    },
  };
}

function createSignatureSvg(name: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="80" viewBox="0 0 220 80">
    <path d="M 20 50 Q 50 15, 80 45 T 130 30 T 170 55 T 200 40" stroke="#1d4ed8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M 60 40 Q 80 70, 110 50" stroke="#1d4ed8" stroke-width="2" fill="none"/>
    <text x="110" y="74" font-family="system-ui, sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${name}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
