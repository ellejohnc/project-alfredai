// Event Seating Assignment Types

export type TableType = 'round' | 'rectangular';

export type GuestTier = 'vip' | 'sponsor' | 'standard';

export type FloorMarkerType = 
  | 'stage' 
  | 'entrance' 
  | 'exit' 
  | 'bar' 
  | 'dance-floor'
  | 'screen'
  | 'podium'
  | 'dj-booth'
  | 'vip-zone';

export type SeatStatus = 'empty' | 'assigned' | 'selected' | 'hover' | 'drop-target';

export type EditorMode = 'layout' | 'assignment';

export type AutoAssignStrategy = 'random' | 'by-company' | 'by-tier' | 'smart-mix';

export interface Table {
  id: string;
  type: TableType;
  tableNumber: number;
  seats: number;
  x: number;
  y: number;
  rotation?: number;
  isLocked?: boolean;
  isVip?: boolean;
  isSponsor?: boolean;
  isAccessible?: boolean;
  companyName?: string;
  color?: string;
  notes?: string;
}

export interface Seat {
  id: string;
  tableId: string;
  seatNumber: number;
  assignedGuest?: Guest;
  isAccessible?: boolean;
}

export interface Guest {
  id: string;
  name: string;
  company: string;
  email: string;
  avatar?: string;
  tier: GuestTier;
  dietaryNotes?: string;
  seatPreference?: string;
  isSeated?: boolean;
  assignedSeatId?: string;
  assignedTableId?: string;
}

export interface FloorMarker {
  id: string;
  type: FloorMarkerType;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  color?: string;
  rotation?: number;
}

export interface SeatingLayout {
  id: string;
  name: string;
  description?: string;
  tables: Table[];
  markers: FloorMarker[];
  gridSize?: number;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface SeatingAssignment {
  guestId: string;
  tableId: string;
  seatId: string;
  seatNumber: number;
  assignedAt: Date;
}

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  capacity: number;
  tableCount: number;
  layout: SeatingLayout;
  thumbnail?: string;
}

export interface SeatingStats {
  totalTables: number;
  roundTables: number;
  rectangularTables: number;
  totalSeats: number;
  seatedGuests: number;
  unseatedGuests: number;
  vipTables: number;
  sponsorTables: number;
  floorMarkers: number;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  isPanning: boolean;
  selectedTableId: string | null;
  selectedSeatId: string | null;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AIAction[];
}

export interface AIAction {
  type: 'assign' | 'swap' | 'clear' | 'suggest';
  label: string;
  data?: Record<string, unknown>;
}

export interface DragItem {
  type: 'guest' | 'table';
  id: string;
  data: Guest | Table;
}
