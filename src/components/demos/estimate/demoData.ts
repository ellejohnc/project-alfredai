// Mock data for Drawings to Estimate Demo
import type { 
  UploadedDocument, 
  ExtractedItem, 
  TradeBreakdown, 
  EstimateSummary,
  ScopeConfirmation 
} from './types';

// Sample project details
export const PROJECT_NAME = "Commercial Office Fit-Out — Level 4, 123 Commerce Street";
export const PROJECT_ADDRESS = "123 Commerce Street, Capital Region NSW 2000";

// Sample uploaded documents for demo
export const sampleDocuments: UploadedDocument[] = [
  { id: 'dwg-1', name: 'A-001_Ground_Floor_Plan.pdf', type: 'drawing', detectedType: 'plan', sheetLabel: 'A-001', uploadProgress: 100, size: '2.4 MB' },
  { id: 'dwg-2', name: 'A-002_Level_1_Plan.pdf', type: 'drawing', detectedType: 'plan', sheetLabel: 'A-002', uploadProgress: 100, size: '2.1 MB' },
  { id: 'dwg-3', name: 'A-003_Level_2_Plan.pdf', type: 'drawing', detectedType: 'plan', sheetLabel: 'A-003', uploadProgress: 100, size: '2.3 MB' },
  { id: 'dwg-4', name: 'A-004_Roof_Plan.pdf', type: 'drawing', detectedType: 'plan', sheetLabel: 'A-004', uploadProgress: 100, size: '1.8 MB' },
  { id: 'dwg-5', name: 'A-101_Section_AA.pdf', type: 'drawing', detectedType: 'section', sheetLabel: 'A-101', uploadProgress: 100, size: '1.5 MB' },
  { id: 'dwg-6', name: 'A-102_Section_BB.pdf', type: 'drawing', detectedType: 'section', sheetLabel: 'A-102', uploadProgress: 100, size: '1.4 MB' },
  { id: 'dwg-7', name: 'A-103_Section_CC.pdf', type: 'drawing', detectedType: 'section', sheetLabel: 'A-103', uploadProgress: 100, size: '1.6 MB' },
  { id: 'dwg-8', name: 'A-201_North_Elevation.pdf', type: 'drawing', detectedType: 'elevation', sheetLabel: 'A-201', uploadProgress: 100, size: '1.2 MB' },
  { id: 'dwg-9', name: 'A-202_South_Elevation.pdf', type: 'drawing', detectedType: 'elevation', sheetLabel: 'A-202', uploadProgress: 100, size: '1.1 MB' },
  { id: 'dwg-10', name: 'A-203_East_Elevation.pdf', type: 'drawing', detectedType: 'elevation', sheetLabel: 'A-203', uploadProgress: 100, size: '1.3 MB' },
  { id: 'dwg-11', name: 'A-301_Joinery_Details.pdf', type: 'drawing', detectedType: 'detail', sheetLabel: 'A-301', uploadProgress: 100, size: '0.9 MB' },
  { id: 'dwg-12', name: 'A-302_Stair_Details.pdf', type: 'drawing', detectedType: 'detail', sheetLabel: 'A-302', uploadProgress: 100, size: '0.8 MB' },
  { id: 'scope-1', name: 'Scope_Brief_v2.docx', type: 'scope', uploadProgress: 100, size: '156 KB' },
  { id: 'sched-1', name: 'Room_Finish_Schedule.xlsx', type: 'schedule', uploadProgress: 100, size: '89 KB' },
];

// Default scope confirmation
export const defaultScopeConfirmation: ScopeConfirmation = {
  includedTrades: [],
  exclusions: [],
  assumptions: [],
  measurementBasis: 'gfa',
};

// Available trades for selection
export const availableTrades = [
  { id: 'structural', label: 'Structural', description: 'Steel framing, concrete works' },
  { id: 'mechanical', label: 'Mechanical', description: 'HVAC, ventilation systems' },
  { id: 'electrical', label: 'Electrical', description: 'Power, lighting, data' },
  { id: 'hydraulic', label: 'Hydraulic', description: 'Plumbing, drainage, gas' },
  { id: 'fire', label: 'Fire Services', description: 'Sprinklers, detection, egress' },
  { id: 'facade', label: 'Façade', description: 'Glazing, cladding, curtain walls' },
  { id: 'fitout', label: 'Internal Fit-Out', description: 'Partitions, ceilings, floors' },
  { id: 'joinery', label: 'Joinery', description: 'Custom cabinetry, millwork' },
];

// Available exclusions
export const availableExclusions = [
  { id: 'furniture', label: 'Furniture, Fixtures & Equipment (FF&E)' },
  { id: 'landscaping', label: 'Landscaping & External Works' },
  { id: 'art', label: 'Artwork & Signage' },
  { id: 'av', label: 'Audio Visual Equipment' },
  { id: 'security', label: 'Security Systems' },
  { id: 'it', label: 'IT Infrastructure' },
];

// Available assumptions
export const availableAssumptions = [
  { id: 'finishes', label: 'Standard commercial-grade finishes' },
  { id: 'suppliers', label: 'Local suppliers and materials' },
  { id: 'hours', label: 'Standard working hours (no overtime)' },
  { id: 'access', label: 'Normal site access conditions' },
  { id: 'approvals', label: 'All approvals in place prior to start' },
  { id: 'design', label: 'Design documentation is complete' },
];

// Measurement basis options
export const measurementBasisOptions = [
  { id: 'gfa', label: 'GFA', description: 'Gross Floor Area' },
  { id: 'nla', label: 'NLA', description: 'Net Lettable Area' },
  { id: 'custom', label: 'Custom', description: 'Custom measurement' },
];

// Sample extracted items from schedule
export const sampleExtractedItems: ExtractedItem[] = [
  { id: 'ext-1', category: 'room', label: 'Open Plan Office', value: '450 m²', source: 'Room Schedule', confidence: 0.95 },
  { id: 'ext-2', category: 'room', label: 'Meeting Rooms (x6)', value: '120 m²', source: 'Room Schedule', confidence: 0.92 },
  { id: 'ext-3', category: 'room', label: 'Executive Offices (x4)', value: '80 m²', source: 'Room Schedule', confidence: 0.94 },
  { id: 'ext-4', category: 'room', label: 'Breakout Areas', value: '60 m²', source: 'Room Schedule', confidence: 0.91 },
  { id: 'ext-5', category: 'room', label: 'Kitchen/Café', value: '45 m²', source: 'Room Schedule', confidence: 0.93 },
  { id: 'ext-6', category: 'room', label: 'Bathrooms', value: '35 m²', source: 'Room Schedule', confidence: 0.96 },
  { id: 'ext-7', category: 'room', label: 'Reception', value: '40 m²', source: 'Room Schedule', confidence: 0.94 },
  { id: 'ext-8', category: 'room', label: 'Server Room', value: '15 m²', source: 'Room Schedule', confidence: 0.97 },
  { id: 'ext-9', category: 'finish', label: 'Carpet Tiles', value: 'Interface - Embodied Beauty', source: 'Finish Schedule', confidence: 0.88 },
  { id: 'ext-10', category: 'finish', label: 'Vinyl Flooring', value: 'Altro Ensemble - Misty Grey', source: 'Finish Schedule', confidence: 0.85 },
  { id: 'ext-11', category: 'finish', label: 'Ceiling Tiles', value: 'Armstrong Optima - White', source: 'Finish Schedule', confidence: 0.90 },
  { id: 'ext-12', category: 'finish', label: 'Wall Paint', value: 'Dulux - Lexicon Quarter', source: 'Finish Schedule', confidence: 0.92 },
  { id: 'ext-13', category: 'finish', label: 'Feature Wall', value: 'Acoustic Timber Panels', source: 'Finish Schedule', confidence: 0.82 },
  { id: 'ext-14', category: 'quantity', label: 'Glass Partitions', value: '85 LM', source: 'BOQ', confidence: 0.89 },
  { id: 'ext-15', category: 'quantity', label: 'Solid Partitions', value: '120 LM', source: 'BOQ', confidence: 0.91 },
  { id: 'ext-16', category: 'quantity', label: 'Doors', value: '32 No.', source: 'Door Schedule', confidence: 0.95 },
  { id: 'ext-17', category: 'spec', label: 'HVAC Requirement', value: 'VAV System - 4 pipe FCU', source: 'Scope Brief', confidence: 0.78 },
  { id: 'ext-18', category: 'spec', label: 'Lighting', value: 'LED panels - 400 lux average', source: 'Scope Brief', confidence: 0.84 },
];

// Sample room schedule table data for extraction visualization
export const roomScheduleTable = {
  headers: ['Room No.', 'Room Name', 'Area (m²)', 'Floor Finish', 'Wall Finish', 'Ceiling'],
  rows: [
    ['L4-01', 'Reception', '40', 'Vinyl', 'Paint + Feature', '2.7m Plaster'],
    ['L4-02', 'Open Plan Office', '450', 'Carpet Tile', 'Paint', '2.7m Grid'],
    ['L4-03', 'Meeting Room 1', '20', 'Carpet Tile', 'Paint + Glass', '2.7m Grid'],
    ['L4-04', 'Meeting Room 2', '20', 'Carpet Tile', 'Paint + Glass', '2.7m Grid'],
    ['L4-05', 'Meeting Room 3', '20', 'Carpet Tile', 'Paint + Glass', '2.7m Grid'],
    ['L4-06', 'Board Room', '40', 'Carpet Tile', 'Timber Panel', '2.7m Plaster'],
    ['L4-07', 'Executive Office 1', '20', 'Carpet Tile', 'Paint + Glass', '2.7m Grid'],
    ['L4-08', 'Executive Office 2', '20', 'Carpet Tile', 'Paint + Glass', '2.7m Grid'],
    ['L4-09', 'Kitchen/Café', '45', 'Vinyl', 'Paint + Tile', '2.7m Plaster'],
    ['L4-10', 'Breakout', '60', 'Carpet Tile', 'Paint', '2.7m Grid'],
  ],
};

// Generate trade breakdown with line items
export const generateTradeBreakdown = (
  floorArea: number = 845,
  specGrade: 'basic' | 'standard' | 'premium' = 'standard'
): TradeBreakdown[] => {
  const gradeMultiplier = specGrade === 'basic' ? 0.8 : specGrade === 'premium' ? 1.3 : 1.0;
  
  return [
    {
      id: 'demolition',
      name: 'Demolition & Strip-Out',
      total: Math.round(45000 * gradeMultiplier),
      itemCount: 4,
      items: [
        { id: 'dem-1', trade: 'Demolition', description: 'Existing partition removal', quantity: floorArea * 0.4, unit: 'm²', rate: 25, total: Math.round(floorArea * 0.4 * 25), confidence: 'high', isEditable: true },
        { id: 'dem-2', trade: 'Demolition', description: 'Ceiling tile removal', quantity: floorArea, unit: 'm²', rate: 15, total: Math.round(floorArea * 15), confidence: 'high', isEditable: true },
        { id: 'dem-3', trade: 'Demolition', description: 'Floor covering removal', quantity: floorArea, unit: 'm²', rate: 12, total: Math.round(floorArea * 12), confidence: 'medium', isEditable: true },
        { id: 'dem-4', trade: 'Demolition', description: 'Skip bins & waste disposal', quantity: 8, unit: 'No.', rate: 850, total: 6800, confidence: 'high', isEditable: true },
      ],
    },
    {
      id: 'partitions',
      name: 'Partitions & Doors',
      total: Math.round(185000 * gradeMultiplier),
      itemCount: 6,
      items: [
        { id: 'part-1', trade: 'Partitions', description: 'Glass partitions - full height', quantity: 85, unit: 'LM', rate: Math.round(950 * gradeMultiplier), total: Math.round(85 * 950 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'part-2', trade: 'Partitions', description: 'Solid plasterboard partitions', quantity: 120, unit: 'LM', rate: Math.round(280 * gradeMultiplier), total: Math.round(120 * 280 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'part-3', trade: 'Partitions', description: 'Acoustic partitions to meeting rooms', quantity: 45, unit: 'LM', rate: Math.round(420 * gradeMultiplier), total: Math.round(45 * 420 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'part-4', trade: 'Doors', description: 'Solid core timber doors', quantity: 24, unit: 'No.', rate: Math.round(1800 * gradeMultiplier), total: Math.round(24 * 1800 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'part-5', trade: 'Doors', description: 'Frameless glass doors', quantity: 6, unit: 'No.', rate: Math.round(3200 * gradeMultiplier), total: Math.round(6 * 3200 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'part-6', trade: 'Doors', description: 'Fire rated doors', quantity: 2, unit: 'No.', rate: Math.round(2800 * gradeMultiplier), total: Math.round(2 * 2800 * gradeMultiplier), confidence: 'high', isEditable: true },
      ],
    },
    {
      id: 'ceilings',
      name: 'Ceilings',
      total: Math.round(95000 * gradeMultiplier),
      itemCount: 4,
      items: [
        { id: 'ceil-1', trade: 'Ceilings', description: 'Suspended grid ceiling - standard', quantity: floorArea * 0.7, unit: 'm²', rate: Math.round(85 * gradeMultiplier), total: Math.round(floorArea * 0.7 * 85 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'ceil-2', trade: 'Ceilings', description: 'Plasterboard bulkheads', quantity: 120, unit: 'm²', rate: Math.round(145 * gradeMultiplier), total: Math.round(120 * 145 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'ceil-3', trade: 'Ceilings', description: 'Feature timber ceiling', quantity: 45, unit: 'm²', rate: Math.round(320 * gradeMultiplier), total: Math.round(45 * 320 * gradeMultiplier), confidence: 'low', isEditable: true },
        { id: 'ceil-4', trade: 'Ceilings', description: 'Acoustic panels to open plan', quantity: 80, unit: 'm²', rate: Math.round(180 * gradeMultiplier), total: Math.round(80 * 180 * gradeMultiplier), confidence: 'medium', isEditable: true },
      ],
    },
    {
      id: 'flooring',
      name: 'Floor Finishes',
      total: Math.round(125000 * gradeMultiplier),
      itemCount: 5,
      items: [
        { id: 'floor-1', trade: 'Flooring', description: 'Carpet tiles - general office', quantity: floorArea * 0.65, unit: 'm²', rate: Math.round(95 * gradeMultiplier), total: Math.round(floorArea * 0.65 * 95 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'floor-2', trade: 'Flooring', description: 'Vinyl flooring - wet areas', quantity: 80, unit: 'm²', rate: Math.round(120 * gradeMultiplier), total: Math.round(80 * 120 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'floor-3', trade: 'Flooring', description: 'Entrance matting', quantity: 15, unit: 'm²', rate: Math.round(280 * gradeMultiplier), total: Math.round(15 * 280 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'floor-4', trade: 'Flooring', description: 'Floor preparation & leveling', quantity: floorArea, unit: 'm²', rate: 18, total: Math.round(floorArea * 18), confidence: 'medium', isEditable: true },
        { id: 'floor-5', trade: 'Flooring', description: 'Skirting - aluminium', quantity: 380, unit: 'LM', rate: Math.round(45 * gradeMultiplier), total: Math.round(380 * 45 * gradeMultiplier), confidence: 'high', isEditable: true },
      ],
    },
    {
      id: 'joinery',
      name: 'Joinery & Millwork',
      total: Math.round(165000 * gradeMultiplier),
      itemCount: 5,
      items: [
        { id: 'join-1', trade: 'Joinery', description: 'Reception desk - custom', quantity: 1, unit: 'Item', rate: Math.round(28000 * gradeMultiplier), total: Math.round(28000 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'join-2', trade: 'Joinery', description: 'Kitchen joinery - complete', quantity: 1, unit: 'Item', rate: Math.round(45000 * gradeMultiplier), total: Math.round(45000 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'join-3', trade: 'Joinery', description: 'Storage cupboards', quantity: 12, unit: 'No.', rate: Math.round(3200 * gradeMultiplier), total: Math.round(12 * 3200 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'join-4', trade: 'Joinery', description: 'Credenza units to offices', quantity: 4, unit: 'No.', rate: Math.round(4500 * gradeMultiplier), total: Math.round(4 * 4500 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'join-5', trade: 'Joinery', description: 'Feature shelving - breakout', quantity: 1, unit: 'Item', rate: Math.round(12000 * gradeMultiplier), total: Math.round(12000 * gradeMultiplier), confidence: 'low', isEditable: true },
      ],
    },
    {
      id: 'mechanical',
      name: 'Mechanical Services',
      total: Math.round(220000 * gradeMultiplier),
      itemCount: 4,
      items: [
        { id: 'mech-1', trade: 'Mechanical', description: 'VAV boxes and controls', quantity: 18, unit: 'No.', rate: Math.round(4800 * gradeMultiplier), total: Math.round(18 * 4800 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'mech-2', trade: 'Mechanical', description: 'Fan coil units to perimeter', quantity: 12, unit: 'No.', rate: Math.round(6500 * gradeMultiplier), total: Math.round(12 * 6500 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'mech-3', trade: 'Mechanical', description: 'Ductwork modifications', quantity: 1, unit: 'Item', rate: Math.round(35000 * gradeMultiplier), total: Math.round(35000 * gradeMultiplier), confidence: 'low', isEditable: true },
        { id: 'mech-4', trade: 'Mechanical', description: 'BMS integration', quantity: 1, unit: 'Item', rate: Math.round(18000 * gradeMultiplier), total: Math.round(18000 * gradeMultiplier), confidence: 'missing', isEditable: true },
      ],
    },
    {
      id: 'electrical',
      name: 'Electrical Services',
      total: Math.round(195000 * gradeMultiplier),
      itemCount: 6,
      items: [
        { id: 'elec-1', trade: 'Electrical', description: 'LED panel lighting', quantity: 180, unit: 'No.', rate: Math.round(320 * gradeMultiplier), total: Math.round(180 * 320 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'elec-2', trade: 'Electrical', description: 'Feature pendant lighting', quantity: 12, unit: 'No.', rate: Math.round(850 * gradeMultiplier), total: Math.round(12 * 850 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'elec-3', trade: 'Electrical', description: 'Power outlets - floor boxes', quantity: 45, unit: 'No.', rate: Math.round(480 * gradeMultiplier), total: Math.round(45 * 480 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'elec-4', trade: 'Electrical', description: 'Power outlets - wall mounted', quantity: 65, unit: 'No.', rate: Math.round(180 * gradeMultiplier), total: Math.round(65 * 180 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'elec-5', trade: 'Electrical', description: 'Data cabling - Cat6A', quantity: 120, unit: 'Points', rate: Math.round(185 * gradeMultiplier), total: Math.round(120 * 185 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'elec-6', trade: 'Electrical', description: 'Distribution board upgrade', quantity: 1, unit: 'Item', rate: Math.round(12000 * gradeMultiplier), total: Math.round(12000 * gradeMultiplier), confidence: 'low', isEditable: true },
      ],
    },
    {
      id: 'hydraulic',
      name: 'Hydraulic Services',
      total: Math.round(85000 * gradeMultiplier),
      itemCount: 4,
      items: [
        { id: 'hyd-1', trade: 'Hydraulic', description: 'Kitchen plumbing - complete', quantity: 1, unit: 'Item', rate: Math.round(18000 * gradeMultiplier), total: Math.round(18000 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'hyd-2', trade: 'Hydraulic', description: 'Bathroom modifications', quantity: 1, unit: 'Item', rate: Math.round(25000 * gradeMultiplier), total: Math.round(25000 * gradeMultiplier), confidence: 'medium', isEditable: true },
        { id: 'hyd-3', trade: 'Hydraulic', description: 'Hot water system', quantity: 1, unit: 'No.', rate: Math.round(8500 * gradeMultiplier), total: Math.round(8500 * gradeMultiplier), confidence: 'high', isEditable: true },
        { id: 'hyd-4', trade: 'Hydraulic', description: 'Fire hydrant modifications', quantity: 1, unit: 'Item', rate: Math.round(12000 * gradeMultiplier), total: Math.round(12000 * gradeMultiplier), confidence: 'missing', isEditable: true },
      ],
    },
  ];
};

// Generate estimate summary
export const generateEstimateSummary = (
  floorArea: number = 845,
  specGrade: 'basic' | 'standard' | 'premium' = 'standard',
  revisionCount: number = 0
): EstimateSummary => {
  const trades = generateTradeBreakdown(floorArea, specGrade);
  const totalAmount = trades.reduce((sum, trade) => sum + trade.total, 0);
  
  // Add preliminaries, margins, and contingency
  const preliminaries = Math.round(totalAmount * 0.08);
  const margin = Math.round(totalAmount * 0.06);
  const contingency = Math.round(totalAmount * 0.05);
  const grandTotal = totalAmount + preliminaries + margin + contingency;
  
  // Calculate confidence based on line item distribution
  const allItems = trades.flatMap(t => t.items);
  const confidenceScore = allItems.reduce((sum, item) => {
    const weight = item.confidence === 'high' ? 1 : item.confidence === 'medium' ? 0.7 : item.confidence === 'low' ? 0.4 : 0.1;
    return sum + weight;
  }, 0) / allItems.length;
  
  return {
    projectName: PROJECT_NAME,
    totalAmount: grandTotal,
    squareMetreRate: Math.round(grandTotal / floorArea),
    overallConfidence: Math.round(confidenceScore * 100),
    generatedAt: new Date().toISOString(),
    revisionCount,
    floorArea,
    specGrade,
  };
};

// Assumption notes for the estimate
export const estimateAssumptions = [
  'Pricing based on standard commercial-grade finishes as per finish schedule.',
  'Normal working hours assumed (7am - 5pm, Monday to Friday).',
  'Site access via existing goods lift and loading dock.',
  'Base building services are operational and require modification only.',
  'All design documentation is complete and approved.',
  'Builder\'s preliminaries at 8%, margin at 6%, contingency at 5%.',
  'Excludes FF&E, signage, artwork, and loose furniture.',
  'Subject to site inspection and detailed measurement.',
];
