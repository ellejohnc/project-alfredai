// Mock data for Event Seating Assignment Demo

import type { Guest, LayoutPreset, FloorMarker, Table, SeatingLayout } from './types';

// 30 Mock Guests across 8 companies
export const mockGuests: Guest[] = [
  // Acme Corp - 5 guests (1 VIP, 1 Sponsor)
  { id: 'g1', name: 'James Wilson', company: 'Acme Corp', tier: 'vip', email: 'james@acme.com' },
  { id: 'g2', name: 'Jane Smith', company: 'Acme Corp', tier: 'sponsor', email: 'sarah@acme.com' },
  { id: 'g3', name: 'David Lee', company: 'Acme Corp', tier: 'standard', email: 'david@acme.com' },
  { id: 'g4', name: 'Emily Watson', company: 'Acme Corp', tier: 'standard', email: 'emily@acme.com' },
  { id: 'g5', name: 'Robert Kim', company: 'Acme Corp', tier: 'standard', email: 'robert@acme.com' },
  
  // TechStart Inc - 4 guests (1 VIP)
  { id: 'g6', name: 'Michael Brown', company: 'TechStart Inc', tier: 'vip', email: 'mike@techstart.com' },
  { id: 'g7', name: 'Lisa Zhang', company: 'TechStart Inc', tier: 'standard', email: 'lisa@techstart.com' },
  { id: 'g8', name: 'Kevin Patel', company: 'TechStart Inc', tier: 'standard', email: 'kevin@techstart.com' },
  { id: 'g9', name: 'Amanda Foster', company: 'TechStart Inc', tier: 'standard', email: 'amanda@techstart.com' },
  
  // Global Finance - 4 guests (1 Sponsor)
  { id: 'g10', name: 'Jennifer Martinez', company: 'Global Finance', tier: 'sponsor', email: 'jen@globalfin.com' },
  { id: 'g11', name: 'Thomas Anderson', company: 'Global Finance', tier: 'standard', email: 'tom@globalfin.com' },
  { id: 'g12', name: 'Nicole Taylor', company: 'Global Finance', tier: 'standard', email: 'nicole@globalfin.com' },
  { id: 'g13', name: 'Christopher Wright', company: 'Global Finance', tier: 'standard', email: 'chris@globalfin.com' },
  
  // Creative Studios - 3 guests (1 VIP)
  { id: 'g14', name: 'Maria Garcia', company: 'Creative Studios', tier: 'vip', email: 'maria@creative.com' },
  { id: 'g15', name: 'Daniel Moore', company: 'Creative Studios', tier: 'standard', email: 'daniel@creative.com' },
  { id: 'g16', name: 'Rachel Adams', company: 'Creative Studios', tier: 'standard', email: 'rachel@creative.com' },
  
  // Health Plus - 4 guests (1 Sponsor)
  { id: 'g17', name: 'William Clark', company: 'Health Plus', tier: 'sponsor', email: 'will@healthplus.com' },
  { id: 'g18', name: 'Sophia Johnson', company: 'Health Plus', tier: 'standard', email: 'sophia@healthplus.com' },
  { id: 'g19', name: 'Alexander Davis', company: 'Health Plus', tier: 'standard', email: 'alex@healthplus.com' },
  { id: 'g20', name: 'Olivia White', company: 'Health Plus', tier: 'standard', email: 'olivia@healthplus.com' },
  
  // Legal Partners - 3 guests (1 VIP)
  { id: 'g21', name: 'Benjamin Hall', company: 'Legal Partners', tier: 'vip', email: 'ben@legalp.com' },
  { id: 'g22', name: 'Victoria Young', company: 'Legal Partners', tier: 'standard', email: 'victoria@legalp.com' },
  { id: 'g23', name: 'Samuel King', company: 'Legal Partners', tier: 'standard', email: 'samuel@legalp.com' },
  
  // Green Energy - 4 guests (1 Sponsor)
  { id: 'g24', name: 'Elizabeth Scott', company: 'Green Energy', tier: 'sponsor', email: 'liz@greenenergy.com' },
  { id: 'g25', name: 'Matthew Green', company: 'Green Energy', tier: 'standard', email: 'matt@greenenergy.com' },
  { id: 'g26', name: 'Ashley Baker', company: 'Green Energy', tier: 'standard', email: 'ashley@greenenergy.com' },
  { id: 'g27', name: 'Joshua Nelson', company: 'Green Energy', tier: 'standard', email: 'josh@greenenergy.com' },
  
  // Media Group - 3 guests
  { id: 'g28', name: 'Emma Thompson', company: 'Media Group', tier: 'standard', email: 'emma@mediagroup.com' },
  { id: 'g29', name: 'Ryan Mitchell', company: 'Media Group', tier: 'standard', email: 'ryan@mediagroup.com' },
  { id: 'g30', name: 'Hannah Roberts', company: 'Media Group', tier: 'standard', email: 'hannah@mediagroup.com' },
];

// Company colors for grouping visualization
export const companyColors: Record<string, string> = {
  'Acme Corp': 'hsl(var(--chart-1))',
  'TechStart Inc': 'hsl(var(--chart-2))',
  'Global Finance': 'hsl(var(--chart-3))',
  'Creative Studios': 'hsl(var(--chart-4))',
  'Health Plus': 'hsl(var(--chart-5))',
  'Legal Partners': 'hsl(210, 70%, 50%)',
  'Green Energy': 'hsl(150, 60%, 45%)',
  'Media Group': 'hsl(330, 60%, 50%)',
};

// Tier badge colors
export const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  vip: { bg: 'hsl(45, 93%, 47%)', text: 'hsl(0, 0%, 0%)', border: 'hsl(45, 93%, 60%)' },
  sponsor: { bg: 'hsl(270, 60%, 50%)', text: 'hsl(0, 0%, 100%)', border: 'hsl(270, 60%, 65%)' },
  standard: { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', border: 'hsl(var(--border))' },
};

// Floor marker configurations
const createStageMarker = (x: number, y: number): FloorMarker => ({
  id: 'marker-stage',
  type: 'stage',
  x,
  y,
  width: 200,
  height: 60,
  label: 'STAGE',
  color: 'hsl(220, 15%, 25%)',
});

const createEntranceMarker = (x: number, y: number): FloorMarker => ({
  id: 'marker-entrance',
  type: 'entrance',
  x,
  y,
  width: 40,
  height: 60,
  label: 'Entry',
  color: 'hsl(140, 60%, 40%)',
});

const createBarMarker = (x: number, y: number): FloorMarker => ({
  id: 'marker-bar',
  type: 'bar',
  x,
  y,
  width: 80,
  height: 40,
  label: 'BAR',
  color: 'hsl(25, 70%, 45%)',
});

const createDanceFloorMarker = (x: number, y: number): FloorMarker => ({
  id: 'marker-dancefloor',
  type: 'dance-floor',
  x,
  y,
  width: 120,
  height: 120,
  label: 'Dance Floor',
  color: 'hsl(280, 50%, 40%)',
});

// Helper to create round table
const createRoundTable = (id: string, num: number, x: number, y: number, seats = 8, opts: Partial<Table> = {}): Table => ({
  id,
  type: 'round',
  tableNumber: num,
  seats,
  x,
  y,
  ...opts,
});

// Helper to create rectangular table
const createRectTable = (id: string, num: number, x: number, y: number, seats = 10, opts: Partial<Table> = {}): Table => ({
  id,
  type: 'rectangular',
  tableNumber: num,
  seats,
  x,
  y,
  ...opts,
});

// Layout Presets
export const layoutPresets: LayoutPreset[] = [
  {
    id: 'banquet-rounds',
    name: 'Banquet Rounds',
    description: 'Classic formal dinner setup with round tables',
    capacity: 80,
    tableCount: 10,
    layout: {
      id: 'banquet-layout',
      name: 'Banquet Rounds',
      tables: [
        createRoundTable('t1', 1, 100, 150, 8, { isVip: true }),
        createRoundTable('t2', 2, 280, 150, 8, { isVip: true }),
        createRoundTable('t3', 3, 460, 150, 8),
        createRoundTable('t4', 4, 100, 300, 8),
        createRoundTable('t5', 5, 280, 300, 8),
        createRoundTable('t6', 6, 460, 300, 8),
        createRoundTable('t7', 7, 100, 450, 8),
        createRoundTable('t8', 8, 280, 450, 8),
        createRoundTable('t9', 9, 460, 450, 8),
        createRoundTable('t10', 10, 280, 600, 8, { isSponsor: true }),
      ],
      markers: [
        createStageMarker(180, 30),
        createEntranceMarker(520, 580),
      ],
      canvasWidth: 600,
      canvasHeight: 700,
    },
  },
  {
    id: 'classroom',
    name: 'Classroom Style',
    description: 'Rows facing stage for presentations',
    capacity: 48,
    tableCount: 6,
    layout: {
      id: 'classroom-layout',
      name: 'Classroom Style',
      tables: [
        createRectTable('t1', 1, 80, 180, 8),
        createRectTable('t2', 2, 320, 180, 8),
        createRectTable('t3', 3, 80, 300, 8),
        createRectTable('t4', 4, 320, 300, 8),
        createRectTable('t5', 5, 80, 420, 8),
        createRectTable('t6', 6, 320, 420, 8),
      ],
      markers: [
        createStageMarker(150, 40),
        { id: 'marker-screen', type: 'screen', x: 200, y: 100, width: 100, height: 20, label: 'Screen', color: 'hsl(220, 10%, 30%)' },
      ],
      canvasWidth: 550,
      canvasHeight: 550,
    },
  },
  {
    id: 'u-shape',
    name: 'U-Shape Conference',
    description: 'Conference-style layout for meetings',
    capacity: 32,
    tableCount: 4,
    layout: {
      id: 'ushape-layout',
      name: 'U-Shape Conference',
      tables: [
        createRectTable('t1', 1, 150, 100, 10, { rotation: 0 }),
        createRectTable('t2', 2, 50, 250, 6, { rotation: 90 }),
        createRectTable('t3', 3, 350, 250, 6, { rotation: 90 }),
        createRectTable('t4', 4, 150, 400, 10, { rotation: 0 }),
      ],
      markers: [
        { id: 'marker-podium', type: 'podium', x: 200, y: 250, width: 60, height: 40, label: 'Podium', color: 'hsl(210, 50%, 40%)' },
      ],
      canvasWidth: 500,
      canvasHeight: 520,
    },
  },
  {
    id: 'cocktail',
    name: 'Cocktail Reception',
    description: 'Standing/high-top tables for networking',
    capacity: 60,
    tableCount: 8,
    layout: {
      id: 'cocktail-layout',
      name: 'Cocktail Reception',
      tables: [
        createRoundTable('t1', 1, 100, 120, 6),
        createRoundTable('t2', 2, 250, 120, 6),
        createRoundTable('t3', 3, 400, 120, 6),
        createRoundTable('t4', 4, 100, 280, 8),
        createRoundTable('t5', 5, 400, 280, 8),
        createRoundTable('t6', 6, 100, 440, 6),
        createRoundTable('t7', 7, 250, 440, 6),
        createRoundTable('t8', 8, 400, 440, 6),
      ],
      markers: [
        createBarMarker(210, 260),
        createEntranceMarker(480, 520),
      ],
      canvasWidth: 550,
      canvasHeight: 580,
    },
  },
  {
    id: 'gala-dinner',
    name: 'Gala Dinner',
    description: 'Premium layout with dance floor and VIP tables',
    capacity: 100,
    tableCount: 12,
    layout: {
      id: 'gala-layout',
      name: 'Gala Dinner',
      tables: [
        // VIP row near stage
        createRoundTable('t1', 1, 100, 180, 8, { isVip: true }),
        createRoundTable('t2', 2, 280, 180, 8, { isVip: true }),
        createRoundTable('t3', 3, 460, 180, 8, { isVip: true }),
        // Middle section
        createRoundTable('t4', 4, 100, 340, 8),
        createRoundTable('t5', 5, 460, 340, 8),
        // Around dance floor
        createRoundTable('t6', 6, 100, 500, 8),
        createRoundTable('t7', 7, 460, 500, 8),
        // Back row
        createRoundTable('t8', 8, 100, 660, 8, { isSponsor: true }),
        createRoundTable('t9', 9, 230, 660, 8),
        createRoundTable('t10', 10, 360, 660, 8),
        createRoundTable('t11', 11, 490, 660, 10),
        createRoundTable('t12', 12, 280, 800, 10, { isSponsor: true }),
      ],
      markers: [
        createStageMarker(180, 40),
        createDanceFloorMarker(220, 400),
        createBarMarker(500, 800),
        createEntranceMarker(30, 750),
      ],
      canvasWidth: 600,
      canvasHeight: 900,
    },
  },
  {
    id: 'theater',
    name: 'Theater / Auditorium',
    description: 'Maximum capacity with rows of seating',
    capacity: 120,
    tableCount: 15,
    layout: {
      id: 'theater-layout',
      name: 'Theater / Auditorium',
      tables: [
        // Row 1
        createRectTable('t1', 1, 60, 150, 8),
        createRectTable('t2', 2, 230, 150, 8),
        createRectTable('t3', 3, 400, 150, 8),
        // Row 2
        createRectTable('t4', 4, 60, 250, 8),
        createRectTable('t5', 5, 230, 250, 8),
        createRectTable('t6', 6, 400, 250, 8),
        // Row 3
        createRectTable('t7', 7, 60, 350, 8),
        createRectTable('t8', 8, 230, 350, 8),
        createRectTable('t9', 9, 400, 350, 8),
        // Row 4
        createRectTable('t10', 10, 60, 450, 8),
        createRectTable('t11', 11, 230, 450, 8),
        createRectTable('t12', 12, 400, 450, 8),
        // Row 5
        createRectTable('t13', 13, 60, 550, 8),
        createRectTable('t14', 14, 230, 550, 8),
        createRectTable('t15', 15, 400, 550, 8),
      ],
      markers: [
        createStageMarker(180, 30),
        { id: 'marker-screen', type: 'screen', x: 200, y: 90, width: 160, height: 25, label: 'Screen', color: 'hsl(220, 10%, 30%)' },
        createEntranceMarker(500, 600),
        createEntranceMarker(20, 600),
      ],
      canvasWidth: 560,
      canvasHeight: 680,
    },
  },
];

// AI Suggested prompts
export const aiSuggestions = [
  "Seat all VIPs near the stage",
  "Group colleagues from the same company together",
  "Auto-assign remaining unseated guests",
  "Optimize for networking - mix companies per table",
  "Place sponsors at reserved tables",
  "Clear all seat assignments",
];

// Get unique companies from guests
export const getUniqueCompanies = (guests: Guest[]): string[] => {
  return [...new Set(guests.map(g => g.company))].sort();
};

// Get guests by tier
export const getGuestsByTier = (guests: Guest[], tier: Guest['tier']): Guest[] => {
  return guests.filter(g => g.tier === tier);
};

// Get guests by company
export const getGuestsByCompany = (guests: Guest[], company: string): Guest[] => {
  return guests.filter(g => g.company === company);
};

// Get unseated guests
export const getUnseatedGuests = (guests: Guest[]): Guest[] => {
  return guests.filter(g => !g.isSeated);
};

// Get seated guests
export const getSeatedGuests = (guests: Guest[]): Guest[] => {
  return guests.filter(g => g.isSeated);
};
