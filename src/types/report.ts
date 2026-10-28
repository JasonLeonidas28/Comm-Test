export interface GeneralInfo {
  plantName: string;
  plantAddress: string;
  plantCoordinate: string;
  gmapsLink: string;
  evChargerType: string;
  snChargerUnit: string;
  idPlnKodeBilling: string;
  providerSim: string;
  installationVendor: string;
  picVendorContact: string;
  installationDate: string;
  commissioningDate: string;
  customer: string;
  vgreenLogo?: string;
  vendorLogo?: string;
}

export interface PhotoItem {
  id: string;
  label: string;
  sublabel?: string;
  highlightYellow?: boolean;
  imageData?: string; // base64 data URL
  caption?: string;
  measurementValue?: string; // e.g. "3.44 Ω" or "220 V"
  measurementUnit?: string;
  timestamp?: string;
}

export interface SignatureData {
  name: string;
  designation: string;
  company: string;
  signatureImage?: string; // base64 canvas
  date?: string;
}

export interface ApprovalSection {
  preparedBy: SignatureData;
  checkedBy: SignatureData;
  approvedBy: SignatureData;
  statement: string;
}

export interface GroundingDetails {
  testerModel?: string;
  testerSerialNo?: string;
  calibrationDate?: string;
  testMethod?: string;
  soilCondition?: string;
  electrodeDepthMeter?: string;
}

export interface CommissioningReport {
  id: string;
  tenantId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  generalInfo: GeneralInfo;
  
  // Section 1: Battery Swap Station (Visual Inspection)
  bssVisual: {
    frontViewOpen: PhotoItem;
    sideViewRight: PhotoItem;
    frontViewClose: PhotoItem;
    sideViewLeft: PhotoItem;
    proofFoundation40cm: PhotoItem;
    concreteFoundation20cm: PhotoItem;
    sticker: PhotoItem;
    namePlate: PhotoItem;
    acCableTermination: PhotoItem;
    groundingTermination: PhotoItem;
    acDcCableEntry: PhotoItem;
    visibleSafetySign: PhotoItem;
  };

  // Section 2: SIM Card
  simCardVisual: {
    kartuPerdana: PhotoItem;
    installedSimCard: PhotoItem;
    signalBar: PhotoItem;
    url: PhotoItem;
    userInterfaceLcd: PhotoItem;
  };

  // Section 3: Grounding System
  groundingVisual: {
    groundingRodConnection: PhotoItem;
    groundingConnectedEvCharger: PhotoItem;
    groundingRodToEarth1: PhotoItem;
    groundingRodToEarth2: PhotoItem;
    groundingBusbarPanelAc: PhotoItem;
    groundingCableRoute: PhotoItem;
    groundingTestOhm: PhotoItem;
  };
  groundingDetails?: GroundingDetails;

  // Section 4: KWH Meter & AC Panel
  kwhAndPanelVisual: {
    kwhMeter: PhotoItem;
    mcbPln: PhotoItem;
    acPanelFrontOpen: PhotoItem;
    acPanelSafetySign: PhotoItem;
    acPanelFrontClose: PhotoItem;
    acPanelPilotLamps: PhotoItem;
    acPanelSideRight: PhotoItem;
    acPanelLockingSystem: PhotoItem;
    acPanelSideLeft: PhotoItem;
    acPanelMcb: PhotoItem;
  };

  // Section 5: AC Panel Testing
  acPanelTesting: {
    panelWiring: PhotoItem;
    phaseMarking: PhotoItem;
    voltageRN: PhotoItem;
    voltageRG: PhotoItem;
    frequency: PhotoItem;
    voltageNG: PhotoItem;
    groundingToAcPanel: PhotoItem;
  };

  // Section 6: Cables
  cablesVisual: {
    cableSpec: PhotoItem;
    cableRouting1: PhotoItem;
    cableRouting2: PhotoItem;
    cableRouting3: PhotoItem;
    cableRouting4: PhotoItem;
  };

  punchlist?: PunchlistItem[];

  approval: ApprovalSection;
}

export interface PunchlistItem {
  id: string;
  description: string;
  severity: 'Minor' | 'Major';
  targetDate: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  photoData?: string;
  createdAt?: string;
}

