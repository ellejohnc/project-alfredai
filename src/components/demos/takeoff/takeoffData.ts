export type TradeId = "gc" | "windows" | "steel" | "concrete" | "civil" | "mep" | "painting" | "drywall" | "scaffolding";

export interface Mark { x: number; y: number; w: number; h: number }

export interface BillItem {
  id: string;
  code: string;
  description: string;
  qty: number;
  unit: string;
  confidence: number;
  sheet: string;
  method: string;
  marks: Mark[];
  flag?: string;
}

export interface Sheet { id: string; title: string; type: string; use: string; needed: boolean }

export interface TradeDemo {
  id: TradeId;
  label: string;
  short: string;
  project: string;
  /** Time saving shown on the card. Empty until real figures exist. */
  result: string;
  /** One line for the "Built for your trade" card. */
  summary: string;
  sheets: Sheet[];
  items: BillItem[];
  exports: string[];
}

export const RUN_DEPTHS = [
  { id: "quick", label: "Quick", time: "≈ 20–30 min", reads: "Plans only, other views limited", spec: "Specification not read" },
  { id: "standard", label: "Standard", time: "≈ 40–60 min", reads: "The relevant sheets for this trade", spec: "Relevant spec clauses cited" },
  { id: "thorough", label: "Thorough", time: "≈ 90–120 min", reads: "Full set, every view cross-checked", spec: "Spec read line by line" },
] as const;

/** Every time in RUN_DEPTHS is measured against a set this size. */
export const RUN_TIME_BASIS = 500;

export type DepthId = (typeof RUN_DEPTHS)[number]["id"];

export const TRADES: Record<TradeId, TradeDemo> = {
  gc: {
    id: "gc",
    label: "General Contractor",
    short: "Builder",
    project: "Sample two-storey residence — Lot 12 (illustrative)",
    result: "10 days → 10 hours per project",
    summary: "Slabs, footings, framing, linings, finishes and wet areas.",
    sheets: [
      { id: "A-101", title: "Ground floor plan", type: "Floor plan · 1:100", use: "Room areas, wall lengths, openings", needed: true },
      { id: "A-301", title: "Elevations", type: "Elevation · 1:100", use: "Wall heights, cladding areas", needed: true },
      { id: "S-101", title: "Slab plan", type: "Structural · 1:100", use: "Slab volume, mesh, thickenings", needed: true },
      { id: "S-002", title: "Footing details", type: "Structural detail · 1:20", use: "Strip and pad footing sizes", needed: true },
      { id: "A-601", title: "Finish schedule", type: "Schedule", use: "Floor, wall and ceiling finishes", needed: true },
      { id: "SPEC", title: "Specification", type: "Specification", use: "Concrete grades, finishes, standards", needed: true },
      { id: "L-001", title: "Landscape plan", type: "Landscape", use: "Not needed for this scope", needed: false },
    ],
    items: [
      { id: "g1", code: "03.10", description: "Ground slab 100mm, N32 concrete", qty: 142.6, unit: "m³", confidence: 97, sheet: "S-101", method: "Slab outline × thickness from section, thickenings added", marks: [{ x: 70, y: 60, w: 520, h: 330 }] },
      { id: "g2", code: "03.20", description: "SL82 reinforcing mesh incl. laps", qty: 486, unit: "m²", confidence: 94, sheet: "S-101", method: "Slab area + 10% lap allowance per spec 3.4", marks: [{ x: 70, y: 60, w: 520, h: 330 }] },
      { id: "g3", code: "03.30", description: "Strip footings 450 × 600", qty: 38.4, unit: "m³", confidence: 91, sheet: "S-002", method: "Perimeter run × detail section F1", marks: [{ x: 66, y: 56, w: 528, h: 8 }, { x: 66, y: 386, w: 528, h: 8 }] },
      { id: "g4", code: "06.10", description: "90mm stud wall framing", qty: 312, unit: "lm", confidence: 89, sheet: "A-101", method: "Wall centrelines traced on plan", marks: [{ x: 300, y: 60, w: 6, h: 330 }, { x: 70, y: 220, w: 520, h: 6 }] },
      { id: "g5", code: "09.20", description: "Plasterboard 10mm, walls & ceilings", qty: 1148, unit: "m²", confidence: 88, sheet: "A-601", method: "Wall lengths × 2.55m height + ceiling areas", marks: [{ x: 76, y: 66, w: 220, h: 150 }, { x: 310, y: 66, w: 274, h: 150 }] },
      { id: "g6", code: "09.60", description: "Floor tiling, wet areas", qty: 46.8, unit: "m²", confidence: 72, sheet: "A-601", method: "Finish schedule tag T1 — Ensuite area unclear", marks: [{ x: 310, y: 232, w: 120, h: 152 }], flag: "Finish tag missing on Ensuite" },
      { id: "g7", code: "08.10", description: "External doors", qty: 4, unit: "no.", confidence: 96, sheet: "A-101", method: "Door symbols counted, cross-checked on elevations", marks: [{ x: 160, y: 384, w: 40, h: 12 }, { x: 586, y: 140, w: 12, h: 40 }] },
      { id: "g8", code: "07.40", description: "Waterproofing membrane", qty: 38.2, unit: "m²", confidence: 68, sheet: "SPEC", method: "Spec 7.2 calls for upturns — height not shown", marks: [{ x: 440, y: 232, w: 144, h: 152 }], flag: "Upturn height not on drawings" },
    ],
    exports: ["Excel bill of quantities", "CSV for your estimating system", "PDF marked-up drawings"],
  },
  windows: {
    id: "windows",
    label: "Windows Fabricator",
    short: "Windows & doors",
    project: "Example coastal residence (illustrative)",
    result: "3 hours → 30 minutes per take-off",
    summary: "Every opening, size, system, glass and hardware.",
    sheets: [
      { id: "A-101", title: "Ground & upper floor plans", type: "Floor plan · 1:100", use: "14 openings counted, room names and facing", needed: true },
      { id: "A-301", title: "Elevations — North & East", type: "Elevation · 1:100", use: "Panel layout, operation, head heights", needed: true },
      { id: "A-302", title: "Elevations — South & West", type: "Elevation · 1:100", use: "W03 changed to tilt & turn in Rev C", needed: true },
      { id: "A-501", title: "Window & door schedule", type: "Schedule", use: "9 types, 14 units: sizes, systems, glass", needed: true },
      { id: "NatHERS", title: "Energy rating report", type: "Report", use: "U-value and SHGC per opening", needed: true },
      { id: "S-001", title: "Structural notes", type: "Notes", use: "Wind classification N3, coastal", needed: true },
      { id: "A-002…", title: "Cover, roof, landscape, services", type: "Various", use: "Not needed for glazing", needed: false },
    ],
    items: [
      { id: "w1", code: "W01", description: "Sliding door 2-panel, 2400 × 2100, 6.38 lam", qty: 2, unit: "no.", confidence: 98, sheet: "A-501", method: "Schedule type matched to plan tags and N elevation", marks: [{ x: 90, y: 230, w: 150, h: 130 }] },
      { id: "w2", code: "W02", description: "Awning window 1200 × 900, double glazed", qty: 5, unit: "no.", confidence: 95, sheet: "A-301", method: "Counted on elevations, sizes from schedule", marks: [{ x: 290, y: 110, w: 90, h: 70 }, { x: 410, y: 110, w: 90, h: 70 }] },
      { id: "w3", code: "W03", description: "Tilt & turn 900 × 1200 (Rev C)", qty: 1, unit: "no.", confidence: 74, sheet: "A-302", method: "Rev C cloud on elevation; schedule still shows casement", marks: [{ x: 540, y: 110, w: 70, h: 90 }], flag: "Schedule and elevation disagree" },
      { id: "w4", code: "W04", description: "Fixed highlight 1800 × 450", qty: 3, unit: "no.", confidence: 92, sheet: "A-301", method: "Head height 2700 from section A-401", marks: [{ x: 290, y: 60, w: 210, h: 34 }] },
      { id: "w5", code: "W05", description: "Stacker door 3-panel 3600 × 2400", qty: 1, unit: "no.", confidence: 90, sheet: "A-501", method: "Opening size, frame size kept apart (−20mm)", marks: [{ x: 290, y: 230, w: 210, h: 130 }] },
      { id: "w6", code: "W06", description: "Louvre window 600 × 1200, bathroom", qty: 2, unit: "no.", confidence: 70, sheet: "A-101", method: "Glass type not in schedule — NatHERS lists clear", marks: [{ x: 640, y: 120, w: 50, h: 90 }], flag: "Glass type not specified" },
      { id: "w7", code: "HW", description: "Coastal hardware, 316 stainless", qty: 14, unit: "sets", confidence: 93, sheet: "S-001", method: "N3 coastal → marine-grade hardware rule", marks: [] },
    ],
    exports: ["Excel window & door list", "CSV for V6 / your quoting system", "PDF schedule with drawing evidence"],
  },
  steel: {
    id: "steel",
    label: "Steelwork Fabricator",
    short: "Structural steel",
    project: "Sample warehouse & office, 1,200 m² (illustrative)",
    result: "3 days → 3 hours per take-off",
    summary: "Members, tonnage, purlins, bracing, plates and bolts.",
    sheets: [
      { id: "S-201", title: "Roof framing plan", type: "Framing plan · 1:200", use: "Rafters, purlins, bracing on grid", needed: true },
      { id: "S-202", title: "Column layout", type: "Framing plan · 1:200", use: "Column marks and base plates", needed: true },
      { id: "S-301", title: "Connection details", type: "Detail · 1:10", use: "Bolts, plates, welds per connection", needed: true },
      { id: "S-401", title: "Member schedule", type: "Schedule", use: "Section sizes and grades", needed: true },
      { id: "S-001", title: "General notes", type: "Notes", use: "Grade 300PLUS, HDG finish, 8.8/S bolts", needed: true },
      { id: "A-001", title: "Architectural set", type: "Various", use: "Not needed for steel", needed: false },
    ],
    items: [
      { id: "s1", code: "C1", description: "Columns 310UB40.4, 300PLUS", qty: 4.85, unit: "t", confidence: 97, sheet: "S-202", method: "12 columns × 8.4m × 40.4 kg/m + 5% fittings", marks: [{ x: 76, y: 56, w: 16, h: 16 }, { x: 236, y: 56, w: 16, h: 16 }, { x: 396, y: 56, w: 16, h: 16 }, { x: 556, y: 56, w: 16, h: 16 }, { x: 76, y: 376, w: 16, h: 16 }, { x: 236, y: 376, w: 16, h: 16 }, { x: 396, y: 376, w: 16, h: 16 }, { x: 556, y: 376, w: 16, h: 16 }] },
      { id: "s2", code: "R1", description: "Rafters 360UB44.7", qty: 6.12, unit: "t", confidence: 95, sheet: "S-201", method: "Rafter runs on grids 1–4 at roof pitch 5°", marks: [{ x: 80, y: 60, w: 8, h: 328 }, { x: 240, y: 60, w: 8, h: 328 }, { x: 400, y: 60, w: 8, h: 328 }, { x: 560, y: 60, w: 8, h: 328 }] },
      { id: "s3", code: "P1", description: "Purlins Z200-19 @ 1200 crs", qty: 1420, unit: "lm", confidence: 92, sheet: "S-201", method: "Spacing note × bay lengths, laps added", marks: [{ x: 84, y: 110, w: 480, h: 4 }, { x: 84, y: 170, w: 480, h: 4 }, { x: 84, y: 230, w: 480, h: 4 }, { x: 84, y: 290, w: 480, h: 4 }] },
      { id: "s4", code: "B1", description: "Roof bracing, 20mm rod", qty: 16, unit: "no.", confidence: 88, sheet: "S-201", method: "Cross-bracing symbols counted in end bays", marks: [{ x: 90, y: 64, w: 146, h: 320 }] },
      { id: "s5", code: "BP1", description: "Base plates 250 × 250 × 16", qty: 12, unit: "no.", confidence: 90, sheet: "S-301", method: "Detail 3 applied to every column mark", marks: [] },
      { id: "s6", code: "M20", description: "Bolts M20 8.8/S, HDG", qty: 216, unit: "no.", confidence: 71, sheet: "S-301", method: "Bolt count per detail — knee connection uses 6 or 8?", marks: [{ x: 230, y: 50, w: 28, h: 28 }], flag: "Knee detail shows two bolt groups" },
      { id: "s7", code: "PFC", description: "Mezzanine beams 250PFC", qty: 1.38, unit: "t", confidence: 67, sheet: "S-201", method: "Mezzanine outline found, member size cut off at sheet edge", marks: [{ x: 420, y: 250, w: 150, h: 130 }], flag: "Member tag cut off on sheet" },
    ],
    exports: ["Excel member & tonnage list", "CSV for your fabrication software", "PDF marked-up framing plans"],
  },
  concrete: {
    id: "concrete",
    label: "Concrete Contractor",
    short: "Concrete",
    project: "Sample commercial ground slab, 1,850 m² (illustrative)",
    result: "",
    summary: "Slab volumes, pours, edge beams, pads, reo and formwork.",
    sheets: [
      { id: "S-101", title: "Slab & pour plan", type: "Structural · 1:200", use: "Slab outline, pour breaks, thickenings", needed: true },
      { id: "S-102", title: "Footing plan", type: "Structural · 1:200", use: "Pad and strip footing marks", needed: true },
      { id: "S-301", title: "Slab & edge details", type: "Structural detail · 1:20", use: "Edge beam and thickening sizes", needed: true },
      { id: "S-001", title: "Structural notes", type: "Notes", use: "Concrete grades, cover, reo laps", needed: true },
      { id: "A-001…", title: "Architectural set", type: "Various", use: "Not needed for concrete", needed: false },
    ],
    items: [
      { id: "c1", code: "SL1", description: "Ground slab 150mm, N32 — pours 1–3", qty: 277.5, unit: "m³", confidence: 96, sheet: "S-101", method: "Pour areas × 150 from section 1/S-301", marks: [{ x: 80, y: 70, w: 480, h: 310 }] },
      { id: "c2", code: "EB1", description: "Edge beam 300 × 600", qty: 30.2, unit: "m³", confidence: 93, sheet: "S-301", method: "Slab perimeter 168m × detail 2 section", marks: [{ x: 74, y: 64, w: 492, h: 8 }, { x: 74, y: 378, w: 492, h: 8 }] },
      { id: "c3", code: "PF1", description: "Pad footings 1200 × 1200 × 600", qty: 13.8, unit: "m³", confidence: 95, sheet: "S-102", method: "16 pads counted on grid × detail size", marks: [{ x: 230, y: 214, w: 20, h: 20 }, { x: 390, y: 214, w: 20, h: 20 }] },
      { id: "c4", code: "RF1", description: "SL92 mesh incl. laps", qty: 2035, unit: "m²", confidence: 92, sheet: "S-001", method: "Slab area + 10% lap per note 4", marks: [{ x: 80, y: 70, w: 480, h: 310 }] },
      { id: "c5", code: "FW1", description: "Edge formwork", qty: 168, unit: "lm", confidence: 90, sheet: "S-101", method: "Slab perimeter traced on plan", marks: [{ x: 74, y: 64, w: 8, h: 322 }, { x: 558, y: 64, w: 8, h: 322 }] },
      { id: "c6", code: "TH1", description: "Slab thickening under wall line", qty: 4.6, unit: "m³", confidence: 69, sheet: "S-301", method: "Thickening shown on plan, depth not dimensioned", marks: [{ x: 320, y: 70, w: 14, h: 310 }], flag: "Thickening depth not dimensioned" },
      { id: "c7", code: "PB", description: "Pour breaks / construction joints", qty: 2, unit: "no.", confidence: 74, sheet: "S-101", method: "Joint between pours 2 & 3 differs from note", marks: [{ x: 400, y: 70, w: 6, h: 310 }], flag: "Joint type differs from the notes" },
    ],
    exports: ["Excel pour & volume schedule", "CSV for your estimating system", "PDF marked-up slab plans"],
  },
  civil: {
    id: "civil",
    label: "Civil Contractor",
    short: "Civil works",
    project: "Sample 24-lot subdivision, stage 1 (illustrative)",
    result: "",
    summary: "Earthworks, pavements, kerbs, stormwater pipes and pits.",
    sheets: [
      { id: "C-101", title: "General arrangement", type: "Civil plan · 1:500", use: "Road alignment, lots, extents", needed: true },
      { id: "C-201", title: "Bulk earthworks", type: "Civil plan · 1:500", use: "Cut and fill areas, depths", needed: true },
      { id: "C-301", title: "Stormwater layout", type: "Civil plan · 1:500", use: "Pipe runs, sizes, pits", needed: true },
      { id: "C-501", title: "Typical sections", type: "Detail · 1:50", use: "Pavement layers, kerb profile", needed: true },
      { id: "SPEC", title: "Civil specification", type: "Specification", use: "Compaction, materials, testing", needed: true },
      { id: "L-001", title: "Landscape set", type: "Landscape", use: "Not needed for civil scope", needed: false },
    ],
    items: [
      { id: "v1", code: "EW1", description: "Bulk cut to spoil", qty: 3420, unit: "m³", confidence: 91, sheet: "C-201", method: "Cut zone area × average depth from contours", marks: [{ x: 80, y: 70, w: 200, h: 110 }] },
      { id: "v2", code: "EW2", description: "Engineered fill, compacted", qty: 2160, unit: "m³", confidence: 89, sheet: "C-201", method: "Fill zone area × average depth, 95% compaction", marks: [{ x: 380, y: 260, w: 200, h: 120 }] },
      { id: "v3", code: "PV1", description: "Road pavement, 300mm base + AC", qty: 2880, unit: "m²", confidence: 95, sheet: "C-501", method: "Road length 360m × 8m carriageway", marks: [{ x: 60, y: 200, w: 560, h: 44 }] },
      { id: "v4", code: "KB1", description: "Barrier kerb & channel", qty: 720, unit: "lm", confidence: 94, sheet: "C-101", method: "Both road edges traced", marks: [{ x: 60, y: 196, w: 560, h: 4 }, { x: 60, y: 244, w: 560, h: 4 }] },
      { id: "v5", code: "SW1", description: "Stormwater pipe 375 RCP", qty: 186, unit: "lm", confidence: 92, sheet: "C-301", method: "Pipe run measured pit to pit", marks: [{ x: 100, y: 260, w: 420, h: 6 }] },
      { id: "v6", code: "PT1", description: "Kerb inlet pits", qty: 6, unit: "no.", confidence: 96, sheet: "C-301", method: "Pit symbols counted, cross-checked on long section", marks: [{ x: 94, y: 254, w: 16, h: 16 }, { x: 234, y: 254, w: 16, h: 16 }, { x: 374, y: 254, w: 16, h: 16 }, { x: 514, y: 254, w: 16, h: 16 }] },
      { id: "v7", code: "SW2", description: "Stormwater pipe — lot connection", qty: 48, unit: "lm", confidence: 66, sheet: "C-301", method: "Pipe shown, size label missing", marks: [{ x: 520, y: 120, w: 6, h: 136 }], flag: "Pipe size missing on drawing" },
    ],
    exports: ["Excel schedule of quantities", "CSV for your estimating system", "PDF marked-up civil plans"],
  },
  mep: {
    id: "mep",
    label: "MEP Contractor",
    short: "Mechanical, electrical, plumbing",
    project: "Sample two-level office fit-out, 900 m² (illustrative)",
    result: "",
    summary: "Ducts, diffusers, lights, power points, cable and pipework.",
    sheets: [
      { id: "M-101", title: "Mechanical layout", type: "Services plan · 1:100", use: "Duct runs, diffusers, AC units", needed: true },
      { id: "E-101", title: "Lighting & power", type: "Services plan · 1:100", use: "Light fittings, power points, boards", needed: true },
      { id: "H-101", title: "Hydraulics layout", type: "Services plan · 1:100", use: "Pipe runs, fixtures, hot water", needed: true },
      { id: "E-601", title: "Fitting schedule", type: "Schedule", use: "Fitting types and wattages", needed: true },
      { id: "SPEC", title: "Services specification", type: "Specification", use: "Cable types, pipe materials", needed: true },
      { id: "A-001…", title: "Architectural set", type: "Various", use: "Ceiling heights only", needed: false },
    ],
    items: [
      { id: "m1", code: "DU1", description: "Supply duct, galvanised, 400 dia.", qty: 64, unit: "lm", confidence: 93, sheet: "M-101", method: "Duct centreline traced from AC unit", marks: [{ x: 90, y: 120, w: 480, h: 10 }] },
      { id: "m2", code: "DF1", description: "Ceiling diffusers 600 × 600", qty: 18, unit: "no.", confidence: 97, sheet: "M-101", method: "Diffuser symbols counted", marks: [{ x: 140, y: 140, w: 16, h: 16 }, { x: 260, y: 140, w: 16, h: 16 }, { x: 380, y: 140, w: 16, h: 16 }, { x: 500, y: 140, w: 16, h: 16 }] },
      { id: "m3", code: "LT1", description: "LED panel lights 600 × 600", qty: 42, unit: "no.", confidence: 95, sheet: "E-101", method: "Fitting type L1 counted, matched to schedule", marks: [{ x: 100, y: 190, w: 470, h: 60 }] },
      { id: "m4", code: "GPO", description: "Double power points", qty: 56, unit: "no.", confidence: 91, sheet: "E-101", method: "Power point symbols counted along walls", marks: [{ x: 80, y: 370, w: 480, h: 10 }] },
      { id: "m5", code: "CB1", description: "TPS cable 2.5mm², power circuits", qty: 1240, unit: "lm", confidence: 72, sheet: "E-101", method: "Route estimated — circuit routing not drawn", marks: [{ x: 80, y: 290, w: 480, h: 70 }], flag: "Cable routes not drawn" },
      { id: "m6", code: "HW1", description: "Copper pipe 20mm, hot & cold", qty: 96, unit: "lm", confidence: 89, sheet: "H-101", method: "Pipe runs traced from riser to fixtures", marks: [{ x: 440, y: 260, w: 120, h: 6 }, { x: 554, y: 260, w: 6, h: 110 }] },
      { id: "m7", code: "FX1", description: "Basins & WCs", qty: 8, unit: "no.", confidence: 70, sheet: "H-101", method: "Fixtures counted; one wet room shows no fixtures", marks: [{ x: 460, y: 300, w: 90, h: 60 }], flag: "Fixtures missing in one wet room" },
    ],
    exports: ["Excel services schedule", "CSV for your estimating system", "PDF marked-up services plans"],
  },
  painting: {
    id: "painting",
    label: "Painting Contractor",
    short: "Painting & coatings",
    project: "Sample 12-unit apartment block (illustrative)",
    result: "",
    summary: "Wall, ceiling, door and trim areas by room and paint system.",
    sheets: [
      { id: "A-101", title: "Typical unit plan", type: "Floor plan · 1:50", use: "Wall lengths, rooms, openings", needed: true },
      { id: "A-301", title: "Sections", type: "Section · 1:50", use: "Ceiling heights", needed: true },
      { id: "A-601", title: "Finish schedule", type: "Schedule", use: "Paint system per surface", needed: true },
      { id: "A-501", title: "Door schedule", type: "Schedule", use: "Door count and sizes", needed: true },
      { id: "SPEC", title: "Painting specification", type: "Specification", use: "Coats, primers, sheen levels", needed: true },
      { id: "S-001…", title: "Structural & services", type: "Various", use: "Not needed for painting", needed: false },
    ],
    items: [
      { id: "p1", code: "PW1", description: "Internal walls, 2 coats low sheen", qty: 2184, unit: "m²", confidence: 94, sheet: "A-101", method: "Wall lengths × 2.7m height, openings deducted", marks: [{ x: 76, y: 66, w: 508, h: 318 }] },
      { id: "p2", code: "PC1", description: "Ceilings, 2 coats flat", qty: 744, unit: "m²", confidence: 96, sheet: "A-601", method: "Room areas from plan, 12 units", marks: [{ x: 90, y: 80, w: 200, h: 130 }, { x: 320, y: 80, w: 250, h: 130 }] },
      { id: "p3", code: "PW2", description: "Wet area walls, semi-gloss", qty: 312, unit: "m²", confidence: 88, sheet: "A-601", method: "Above-tile area only per finish schedule", marks: [{ x: 320, y: 236, w: 110, h: 140 }] },
      { id: "p4", code: "DR1", description: "Doors & frames, enamel both sides", qty: 96, unit: "no.", confidence: 95, sheet: "A-501", method: "8 doors per unit × 12, from door schedule", marks: [{ x: 200, y: 214, w: 40, h: 14 }, { x: 380, y: 214, w: 40, h: 14 }] },
      { id: "p5", code: "TR1", description: "Skirting & architraves", qty: 1460, unit: "lm", confidence: 87, sheet: "A-101", method: "Wall perimeter + door openings", marks: [{ x: 76, y: 380, w: 508, h: 6 }] },
      { id: "p6", code: "FE1", description: "Feature wall, living", qty: 12, unit: "walls", confidence: 68, sheet: "A-601", method: "Plan tags a feature wall, colour not in schedule", marks: [{ x: 90, y: 66, w: 200, h: 10 }], flag: "Feature colour not in schedule" },
      { id: "p7", code: "EX1", description: "Balcony soffits, exterior system", qty: 86, unit: "m²", confidence: 71, sheet: "A-301", method: "Soffit shown on section, finish not scheduled", marks: [{ x: 440, y: 236, w: 140, h: 140 }], flag: "Soffit finish not scheduled" },
    ],
    exports: ["Excel painting schedule by room", "CSV for your quoting system", "PDF marked-up plans"],
  },
  drywall: {
    id: "drywall",
    label: "Drywall & Insulation Contractor",
    short: "Drywall & insulation",
    project: "Sample two-storey commercial building, 2,200 m² (illustrative)",
    result: "",
    summary: "Partitions, linings, ceilings, insulation and fire-rated systems.",
    sheets: [
      { id: "A-101", title: "Typical floor plan", type: "Floor plan · 1:100", use: "Partition runs, rooms, openings", needed: true },
      { id: "A-301", title: "Sections", type: "Section · 1:50", use: "Wall and ceiling heights", needed: true },
      { id: "A-501", title: "Partition schedule", type: "Schedule", use: "Partition types, studs, linings", needed: true },
      { id: "A-601", title: "Reflected ceiling plan", type: "RCP · 1:100", use: "Ceiling types, grid, access panels", needed: true },
      { id: "F-101", title: "Fire rating plan", type: "Plan · 1:100", use: "FRLs per wall", needed: true },
      { id: "SPEC", title: "Specification", type: "Specification", use: "Systems, insulation R-values, standards", needed: true },
      { id: "S-001…", title: "Structural & services", type: "Various", use: "Not needed for linings", needed: false },
    ],
    items: [
      { id: "d1", code: "PT1", description: "Partition 64mm studs, 2 × 10mm plasterboard each side", qty: 386, unit: "lm", confidence: 93, sheet: "A-101", method: "Partition centrelines traced on plan, PT1 tags matched to schedule", marks: [{ x: 300, y: 66, w: 8, h: 318 }, { x: 76, y: 216, w: 508, h: 8 }] },
      { id: "d2", code: "LW1", description: "Wall linings 13mm plasterboard, full height", qty: 2148, unit: "m²", confidence: 91, sheet: "A-101", method: "Partition lengths × 2.7m height, openings deducted", marks: [{ x: 76, y: 66, w: 220, h: 146 }, { x: 314, y: 66, w: 266, h: 146 }] },
      { id: "d3", code: "CL1", description: "Suspended ceiling, 600 × 600 grid & tiles", qty: 1050, unit: "m²", confidence: 95, sheet: "A-601", method: "Ceiling areas measured on the RCP, bulkheads excluded", marks: [{ x: 90, y: 80, w: 200, h: 120 }, { x: 330, y: 80, w: 240, h: 120 }] },
      { id: "d4", code: "CE1", description: "Ceiling insulation R3.5 polyester batts", qty: 1050, unit: "m²", confidence: 90, sheet: "SPEC", method: "Ceiling area × R-value from spec 5.3", marks: [{ x: 90, y: 80, w: 200, h: 120 }, { x: 330, y: 80, w: 240, h: 120 }] },
      { id: "d5", code: "IW1", description: "Acoustic insulation to partitions, 75mm", qty: 1240, unit: "m²", confidence: 89, sheet: "A-501", method: "Partition areas × schedule type S2", marks: [{ x: 304, y: 70, w: 4, h: 310 }, { x: 80, y: 220, w: 500, h: 4 }] },
      { id: "d6", code: "FR1", description: "Fire-rated wall system, 120/120/60", qty: 74, unit: "lm", confidence: 68, sheet: "F-101", method: "Plan note says 120/120/60; schedule shows 90/90/60", marks: [{ x: 320, y: 66, w: 10, h: 318 }], flag: "FRL differs between plan and schedule" },
      { id: "d7", code: "CN1", description: "Cornice 90mm shadowline", qty: 1216, unit: "lm", confidence: 92, sheet: "A-101", method: "Wall perimeter per room, openings deducted", marks: [{ x: 76, y: 380, w: 508, h: 6 }] },
      { id: "d8", code: "AP1", description: "Ceiling access panels 600 × 600", qty: 14, unit: "no.", confidence: 71, sheet: "A-601", method: "Panels counted over services; two rooms show none", marks: [{ x: 474, y: 228, w: 66, h: 66 }], flag: "Access panels missing in two rooms" },
    ],
    exports: ["Excel lining & insulation schedule", "CSV for your estimating system", "PDF marked-up plans"],
  },
  scaffolding: {
    id: "scaffolding",
    label: "Scaffolding Contractor",
    short: "Scaffolding",
    project: "Sample 6-storey apartment building, façade access (illustrative)",
    result: "",
    summary: "Bays, lifts, decks, ties, barriers and hire duration.",
    sheets: [
      { id: "SC-001", title: "Scaffold layout plan", type: "Layout plan · 1:100", use: "Bay grid, bay widths, ladder and stair bays", needed: true },
      { id: "SC-002", title: "Scaffold elevations", type: "Elevation · 1:100", use: "Lift heights, deck levels, tie pattern", needed: true },
      { id: "SC-003", title: "Tie & base details", type: "Detail · 1:20", use: "Base plates, sole boards, tie types and spacing", needed: true },
      { id: "A-201", title: "Building elevations", type: "Elevation · 1:100", use: "Façade heights, setbacks and balcony lines", needed: true },
      { id: "A-101", title: "Floor plans", type: "Floor plan · 1:100", use: "Access doors, plant and pedestrian routes", needed: true },
      { id: "SPEC", title: "Scaffolding specification", type: "Specification", use: "AS/NZS 1576 duty class, tie pattern, exclusions", needed: true },
      { id: "L-001", title: "Landscape set", type: "Landscape", use: "Not needed for access", needed: false },
    ],
    items: [
      { id: "f1", code: "SC1", description: "Perimeter scaffold, light duty, 1.2m wide", qty: 612, unit: "m²", confidence: 95, sheet: "SC-002", method: "Perimeter 102m × 6 lifts × 1.0m lift height", marks: [{ x: 70, y: 60, w: 520, h: 330 }] },
      { id: "f2", code: "SC2", description: "Working decks, 3 planks per lift", qty: 612, unit: "m²", confidence: 93, sheet: "SC-002", method: "Deck levels counted on elevation, bay widths from plan", marks: [{ x: 70, y: 60, w: 520, h: 8 }] },
      { id: "f3", code: "SC3", description: "Guard rails and toe boards, full length", qty: 204, unit: "lm", confidence: 94, sheet: "SC-002", method: "Perimeter run × top and mid rail on every lift edge", marks: [{ x: 70, y: 380, w: 520, h: 6 }] },
      { id: "f4", code: "SC4", description: "Through ties into brickwork, 4 per bay", qty: 168, unit: "no.", confidence: 88, sheet: "SC-003", method: "Tie pattern per bay per lift, from spec 4.1", marks: [{ x: 230, y: 110, w: 16, h: 16 }, { x: 390, y: 230, w: 16, h: 16 }] },
      { id: "f5", code: "SC5", description: "Access gate 900mm, ground lift", qty: 2, unit: "no.", confidence: 96, sheet: "SC-001", method: "Gate symbols counted on the layout plan", marks: [{ x: 150, y: 376, w: 40, h: 12 }] },
      { id: "f6", code: "SC6", description: "Base plates and sole boards", qty: 34, unit: "no.", confidence: 90, sheet: "SC-003", method: "Standard count on the bay grid × base detail type", marks: [{ x: 76, y: 386, w: 16, h: 16 }, { x: 236, y: 386, w: 16, h: 16 }] },
      { id: "f7", code: "SC7", description: "Scaffold hire, 12 weeks", qty: 12, unit: "weeks", confidence: 71, sheet: "SPEC", method: "Hire period taken from the specification — programme differs", marks: [{ x: 440, y: 232, w: 144, h: 152 }], flag: "Hire period differs from the programme" },
      { id: "f8", code: "SC8", description: "Debris mesh wrap, full height", qty: 612, unit: "m²", confidence: 66, sheet: "A-201", method: "Mesh called for in the spec, not drawn on the elevations", marks: [{ x: 310, y: 66, w: 274, h: 320 }], flag: "Mesh not shown on elevations" },
    ],
    exports: ["Excel bay & lift schedule", "CSV for your hire system", "PDF marked-up elevations"],
  },
};

export const TRADE_ORDER: TradeId[] = ["gc", "windows", "steel", "concrete", "civil", "mep", "painting", "drywall", "scaffolding"];

/** The three trades with a full live demo — they get the standout cards everywhere. */
export const FEATURED_TRADES: TradeId[] = ["gc", "windows", "steel"];

/** Trades listed without a full demo card — no "See the demo" link, "Book a demo" instead. */
export const SUPPORTING_TRADES: TradeId[] = ["concrete", "civil", "mep", "painting", "drywall", "scaffolding"];

export function isFeaturedTrade(v: string | null | undefined): v is TradeId {
  return !!v && (FEATURED_TRADES as string[]).includes(v);
}

export function isTradeId(v: string | null | undefined): v is TradeId {
  return !!v && (TRADE_ORDER as string[]).includes(v);
}
