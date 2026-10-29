import { cn } from "@/lib/utils";
import type { BillItem, TradeId } from "./takeoffData";

interface Props {
  trade: TradeId;
  items: BillItem[];
  /** How many items have been "found" so far (for the measuring animation) */
  revealed?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  sheetLabel: string;
  className?: string;
}

const L = "stroke-current";
const TXT = { className: "fill-current", stroke: "none" } as const;

/** Text in CAD lettering */
function T({ x, y, s = 8, a = "middle", w, o, r, children }: { x: number; y: number; s?: number; a?: "start" | "middle" | "end"; w?: number; o?: number; r?: number; children: React.ReactNode }) {
  return (
    <text x={x} y={y} {...TXT} fontSize={s} textAnchor={a} fontWeight={w} opacity={o} fontFamily="ui-monospace, 'Courier New', monospace" letterSpacing="0.4" transform={r !== undefined ? `rotate(${r} ${x} ${y})` : undefined}>
      {children}
    </text>
  );
}

/** Dimension chain with architectural ticks. Horizontal when y1===y2. */
function Dim({ pts, at, vertical, labels }: { pts: number[]; at: number; vertical?: boolean; labels: string[] }) {
  return (
    <g strokeWidth="0.5">
      <line {...(vertical ? { x1: at, x2: at, y1: pts[0], y2: pts[pts.length - 1] } : { y1: at, y2: at, x1: pts[0], x2: pts[pts.length - 1] })} />
      {pts.map((p, i) => (
        <g key={i}>
          {vertical ? <line x1={at - 4} y1={p + 4} x2={at + 4} y2={p - 4} strokeWidth="1" /> : <line x1={p - 4} y1={at + 4} x2={p + 4} y2={at - 4} strokeWidth="1" />}
          {vertical ? <line x1={at - 6} y1={p} x2={at + 6} y2={p} /> : <line x1={p} y1={at - 6} x2={p} y2={at + 6} />}
        </g>
      ))}
      {labels.map((t, i) => {
        const m = (pts[i] + pts[i + 1]) / 2;
        return vertical ? <T key={i} x={at - 4} y={m} s={7} r={-90}>{t}</T> : <T key={i} x={m} y={at - 3} s={7}>{t}</T>;
      })}
    </g>
  );
}

function Bubble({ x, y, t }: { x: number; y: number; t: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="8" strokeWidth="0.8" />
      <T x={x} y={y + 3} s={8} w={700}>{t}</T>
    </g>
  );
}

function NorthArrow({ x, y }: { x: number; y: number }) {
  return (
    <g strokeWidth="0.8">
      <circle cx={x} cy={y} r="13" />
      <path d={`M${x} ${y - 12} L${x + 5} ${y + 8} L${x} ${y + 4} Z`} className="fill-current" />
      <path d={`M${x} ${y - 12} L${x - 5} ${y + 8} L${x} ${y + 4} Z`} />
      <T x={x} y={y - 16} s={8} w={700}>N</T>
    </g>
  );
}

function ScaleBar({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g strokeWidth="0.6">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x + i * 20} y={y} width="20" height="4" className={i % 2 ? "fill-none" : "fill-current"} />
      ))}
      {[0, 2, 4, 8].map((m, i) => <T key={m} x={x + i * 20 + (i === 3 ? 20 : 0)} y={y + 12} s={6}>{m}</T>)}
      <T x={x + 40} y={y - 4} s={6.5}>{label}</T>
    </g>
  );
}

/** Section / detail callout */
function SectionMark({ x, y, n, sheet, dir = 1 }: { x: number; y: number; n: string; sheet: string; dir?: 1 | -1 }) {
  return (
    <g strokeWidth="0.7">
      <circle cx={x} cy={y} r="9" />
      <line x1={x - 9} y1={y} x2={x + 9} y2={y} />
      <path d={`M${x - 9} ${y} A9 9 0 0 ${dir > 0 ? 1 : 0} ${x + 9} ${y} Z`} className="fill-current" opacity="0.85" />
      <T x={x} y={y + (dir > 0 ? 7 : -2)} s={5.5} o={1}>{dir > 0 ? sheet : n}</T>
      <T x={x} y={y + (dir > 0 ? -2 : 7)} s={6} w={700}>{dir > 0 ? n : sheet}</T>
    </g>
  );
}

function Window({ x, y, len, v }: { x: number; y: number; len: number; v?: boolean }) {
  // opening in a 8-thick wall, glazing lines
  return v ? (
    <g strokeWidth="0.6">
      <rect x={x} y={y} width="8" height={len} className="fill-card" />
      <line x1={x + 3} y1={y} x2={x + 3} y2={y + len} />
      <line x1={x + 5} y1={y} x2={x + 5} y2={y + len} />
    </g>
  ) : (
    <g strokeWidth="0.6">
      <rect x={x} y={y} width={len} height="8" className="fill-card" />
      <line x1={x} y1={y + 3} x2={x + len} y2={y + 3} />
      <line x1={x} y1={y + 5} x2={x + len} y2={y + 5} />
    </g>
  );
}

function GcPlan() {
  const H = "url(#hatch-wall)";
  return (
    <g className={L} fill="none">
      {/* grids */}
      <g strokeWidth="0.4" strokeDasharray="14 3 2 3" opacity="0.7">
        {[70, 303, 435, 590].map((x) => <line key={x} x1={x} y1="48" x2={x} y2="402" />)}
        {[60, 223, 390].map((y) => <line key={y} x1="58" y1={y} x2="604" y2={y} />)}
      </g>
      {/* external wall: hatched poché */}
      <path d="M66 56 H594 V394 H66 Z M76 66 V384 H584 V66 Z" fill={H} fillRule="evenodd" strokeWidth="1.3" />
      {/* internal walls */}
      <rect x="300" y="66" width="6" height="318" fill={H} strokeWidth="0.9" />
      <rect x="76" y="220" width="508" height="6" fill={H} strokeWidth="0.9" />
      <rect x="432" y="226" width="5" height="158" fill={H} strokeWidth="0.8" />
      <rect x="250" y="226" width="5" height="158" fill={H} strokeWidth="0.8" />
      {/* windows */}
      <Window x={120} y={56} len={110} />
      <Window x={360} y={56} len={150} />
      <Window x={66} y={110} len={70} v />
      <Window x={66} y={270} len={60} v />
      <Window x={586} y={260} len={50} v />
      <Window x={470} y={386} len={50} />
      {/* doors: leaf + swing */}
      <g strokeWidth="0.7">
        <rect x="156" y="386" width="44" height="8" className="fill-card" stroke="none" />
        <line x1="160" y1="390" x2="160" y2="350" strokeWidth="1.2" />
        <path d="M160 350 A40 40 0 0 1 200 390" strokeDasharray="3 2" />
        <rect x="586" y="138" width="8" height="44" className="fill-card" stroke="none" />
        <line x1="590" y1="140" x2="552" y2="140" strokeWidth="1.2" />
        <path d="M552 140 A38 38 0 0 0 590 178" strokeDasharray="3 2" />
        <rect x="210" y="220" width="34" height="6" className="fill-card" stroke="none" />
        <line x1="212" y1="226" x2="212" y2="258" strokeWidth="1" />
        <path d="M212 258 A32 32 0 0 0 244 226" strokeDasharray="3 2" />
        <rect x="380" y="220" width="30" height="6" className="fill-card" stroke="none" />
        <line x1="408" y1="226" x2="408" y2="254" strokeWidth="1" />
        <path d="M408 254 A28 28 0 0 1 380 226" strokeDasharray="3 2" />
      </g>
      {/* kitchen */}
      <g strokeWidth="0.7">
        <rect x="400" y="70" width="180" height="24" />
        <rect x="440" y="74" width="34" height="16" rx="3" />
        <circle cx="520" cy="82" r="5" /><circle cx="534" cy="82" r="5" /><circle cx="520" cy="82" r="1.5" />
        <rect x="430" y="140" width="110" height="30" />
        <line x1="430" y1="150" x2="540" y2="150" strokeDasharray="2 2" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={440 + i * 26} y="178" width="14" height="12" rx="3" />)}
      </g>
      {/* living */}
      <g strokeWidth="0.7">
        <rect x="110" y="150" width="120" height="34" rx="4" />
        <line x1="110" y1="160" x2="230" y2="160" />
        <rect x="140" y="110" width="60" height="26" rx="2" />
      </g>
      {/* bed 1 */}
      <g strokeWidth="0.7">
        <rect x="120" y="290" width="80" height="86" />
        <rect x="126" y="294" width="30" height="16" rx="3" /><rect x="164" y="294" width="30" height="16" rx="3" />
        <line x1="120" y1="318" x2="200" y2="318" strokeDasharray="3 2" />
        <rect x="84" y="232" width="160" height="22" strokeDasharray="5 2" />
        <T x={164} y={246} s={6}>BIR</T>
      </g>
      {/* ensuite */}
      <g strokeWidth="0.7">
        <rect x="262" y="234" width="64" height="64" />
        <line x1="262" y1="234" x2="326" y2="298" /><line x1="326" y1="234" x2="262" y2="298" />
        <circle cx="294" cy="266" r="3" />
        <path d="M352 360 h22 v18 h-22 z M356 350 q7 -12 14 0 v10 h-14 z" />
        <rect x="380" y="234" width="46" height="22" /><ellipse cx="403" cy="245" rx="12" ry="7" />
        <path d="M262 300 l64 0" strokeDasharray="1 2" />
      </g>
      {/* laundry */}
      <g strokeWidth="0.7">
        <rect x="530" y="234" width="48" height="26" /><rect x="540" y="238" width="18" height="16" rx="2" />
        <rect x="446" y="234" width="38" height="38" /><circle cx="465" cy="253" r="14" />
      </g>
      {/* slab edge thickening / footing (dashed below) */}
      <path d="M58 48 H602 V402 H58 Z" strokeWidth="0.6" strokeDasharray="8 4" opacity="0.8" />
      {/* room tags */}
      {([["LIVING", 185, 205, "32.4 m²"], ["KITCHEN / DINING", 445, 205, "41.8 m²"], ["BED 1", 165, 368, "15.2 m²"], ["ENSUITE", 345, 330, "7.9 m²"], ["LAUNDRY", 510, 330, "6.1 m²"]] as const).map(([t, x, y, a]) => (
        <g key={t}>
          <T x={x} y={y} s={8} w={700}>{t}</T>
          <T x={x} y={y + 9} s={6.5} o={0.75}>{a} · FFL 100.450</T>
        </g>
      ))}
      {/* dims */}
      <Dim pts={[70, 303, 435, 590]} at={34} labels={["7 180", "4 060", "4 760"]} />
      <Dim pts={[60, 223, 390]} at={628} vertical labels={["5 020", "5 140"]} />
      <Dim pts={[60, 390]} at={642} vertical labels={["10 160"]} />
      {/* grid bubbles */}
      {[70, 303, 435, 590].map((x, i) => <Bubble key={x} x={x} y={16} t={String(i + 1)} />)}
      {[60, 223, 390].map((y, i) => <Bubble key={y} x={48} y={y} t={"ABC"[i]} />)}
      <SectionMark x={612} y={300} n="1" sheet="A-301" />
      <line x1="590" y1="300" x2="603" y2="300" strokeWidth="1.4" />
      {/* leaders */}
      <g strokeWidth="0.5">
        <path d="M120 400 L100 425 H40" />
        <T x={40} y={422} s={6.5} a="start">SL72 MESH · 100 SLAB ON 0.2 VB</T>
        <path d="M300 300 L262 425" />
        <T x={190} y={433} s={6.5} a="start">90 STUD · 10 PB · WET AREA FC</T>
      </g>
      <NorthArrow x={690} y={70} />
      <ScaleBar x={655} y={130} label="1:100" />
      <T x={690} y={180} s={7} w={700}>GROUND FLOOR</T>
      <T x={690} y={190} s={7} w={700}>PLAN</T>
      <g strokeWidth="0.4" opacity="0.85">
        <rect x="652" y="210" width="96" height="100" />
        <T x={656} y={222} s={6.5} a="start" w={700}>NOTES</T>
        {["1. ALL DIMS IN mm.", "2. DO NOT SCALE.", "3. VERIFY ON SITE.", "4. SLAB TO ENG. S-101.", "5. WET AREAS TO", "   AS 3740.", "6. GLAZING AS 1288."].map((n, i) => (
          <T key={i} x={656} y={234 + i * 10} s={6} a="start">{n}</T>
        ))}
      </g>
    </g>
  );
}

function WindowsElevation() {
  const Frame = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} strokeWidth="1.8" />
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} strokeWidth="0.6" />
      <line x1={x} y1={y + h + 3} x2={x + w} y2={y + h + 3} strokeWidth="1.2" />
    </g>
  );
  return (
    <g className={L} fill="none">
      {/* brick cladding hatch */}
      <path d="M60 370 V50 H710 V370 Z" fill="url(#hatch-brick)" strokeWidth="2.4" />
      {/* openings cut back to card */}
      {([[90, 230, 150, 130], [290, 110, 90, 70], [410, 110, 90, 70], [540, 110, 70, 90], [290, 60, 210, 34], [290, 230, 210, 130], [640, 120, 50, 90]] as const).map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} className="fill-card" stroke="none" />
      ))}
      {/* roof */}
      <path d="M40 50 L385 14 L730 50 Z" fill="url(#hatch-roof)" strokeWidth="1.6" />
      <line x1="40" y1="50" x2="730" y2="50" strokeWidth="2" />
      <path d="M40 50 v8 h690 v-8" strokeWidth="0.8" />
      {/* ground */}
      <line x1="20" y1="370" x2="740" y2="370" strokeWidth="3" />
      {Array.from({ length: 36 }).map((_, i) => <line key={i} x1={24 + i * 20} y1="378" x2={34 + i * 20} y2="370" strokeWidth="0.5" />)}
      {/* level lines */}
      <g strokeWidth="0.4" strokeDasharray="10 3 2 3">
        {[[50, "RL 103.150 CEILING"], [230, "RL 101.550 HEAD"], [360, "RL 100.450 FFL"]].map(([y, t]) => (
          <g key={y as number}>
            <line x1="20" y1={y as number} x2="740" y2={y as number} />
          </g>
        ))}
      </g>
      {([[50, "▽ RL 103.150 CLG"], [230, "▽ RL 101.550 HD"], [360, "▽ RL 100.450 FFL"]] as const).map(([y, t]) => (
        <T key={y} x={22} y={y - 3} s={6} a="start">{t}</T>
      ))}
      {/* W01 sliding */}
      <Frame x={90} y={230} w={150} h={130} />
      <line x1="165" y1="234" x2="165" y2="356" strokeWidth="1.2" />
      <path d="M110 295 h40 m-6 -5 l6 5 -6 5" strokeWidth="0.8" />
      <path d="M220 295 h-40 m6 -5 l-6 5 6 5" strokeWidth="0.8" />
      <T x={127} y={340} s={6} o={0.7}>F</T><T x={202} y={340} s={6} o={0.7}>S</T>
      {/* W02 awnings */}
      {[290, 410].map((x) => (
        <g key={x}><Frame x={x} y={110} w={90} h={70} /><path d={`M${x + 4} 176 L${x + 45} 114 L${x + 86} 176`} strokeWidth="0.6" strokeDasharray="4 3" /></g>
      ))}
      {/* W03 tilt & turn */}
      <Frame x={540} y={110} w={70} h={90} />
      <path d="M544 196 L575 114 L606 196 M544 114 L606 155 L544 196" strokeWidth="0.6" strokeDasharray="4 3" />
      <path d="M530 100 q10 -10 20 0 q10 -10 20 0 q10 -10 20 0 q10 -10 20 0 q10 10 0 20 q10 10 0 20 q10 10 0 20 q10 10 0 20 q-10 10 -20 0 q-10 10 -20 0 q-10 10 -20 0 q-10 10 -20 0 q-10 -10 0 -20 q-10 -10 0 -20 q-10 -10 0 -20 q-10 -10 0 -20" strokeWidth="0.9" />
      <path d="M612 92 l8 -14 l8 14 z" strokeWidth="0.8" /><T x={620} y={90} s={7} w={700}>C</T>
      {/* W04 highlights */}
      <Frame x={290} y={60} w={210} h={34} />
      <line x1="360" y1="60" x2="360" y2="94" strokeWidth="1.2" /><line x1="430" y1="60" x2="430" y2="94" strokeWidth="1.2" />
      {/* W05 stacker */}
      <Frame x={290} y={230} w={210} h={130} />
      <line x1="360" y1="234" x2="360" y2="356" strokeWidth="1.2" /><line x1="430" y1="234" x2="430" y2="356" strokeWidth="1.2" />
      <path d="M305 295 h40 m-6 -5 l6 5 -6 5 M375 295 h40 m-6 -5 l6 5 -6 5" strokeWidth="0.8" />
      {/* W06 louvre */}
      <Frame x={640} y={120} w={50} h={90} />
      {Array.from({ length: 8 }).map((_, i) => <line key={i} x1="644" y1={130 + i * 10} x2="686" y2={128 + i * 10} strokeWidth="0.7" />)}
      {/* window tags (hexagon) */}
      {([["W01", 165, 220], ["W02", 335, 102], ["W02", 455, 102], ["W03", 575, 212], ["W04", 395, 104], ["W05", 395, 220], ["W06", 665, 222]] as const).map(([t, x, y], i) => (
        <g key={i}>
          <path d={`M${x - 13} ${y} l5 -7 h16 l5 7 l-5 7 h-16 z`} className="fill-card" strokeWidth="0.8" />
          <T x={x} y={y + 3} s={7.5} w={700}>{t}</T>
        </g>
      ))}
      {/* dims */}
      <Dim pts={[90, 240, 290, 500]} at={396} labels={["1 500", "", "2 100"]} />
      <Dim pts={[230, 360]} at={76} vertical labels={["1 300"]} />
      <Dim pts={[110, 180]} at={282} vertical labels={["700"]} />
      {/* leaders + notes */}
      <g strokeWidth="0.5">
        <path d="M612 160 L640 260 H700" /><T x={700} y={257} s={6} a="end">REV C: W03 CHANGED</T>
        <T x={700} y={266} s={6} a="end">AWNING → TILT&TURN</T>
        <path d="M100 360 L70 300 H30" /><T x={30} y={297} s={6} a="start">DGU 6/12/6</T>
      </g>
      <T x={385} y={418} s={8} w={700}>NORTH ELEVATION</T>
      <T x={385} y={428} s={6.5} o={0.8}>SCALE 1:100 @ A1</T>
      <SectionMark x={320} y={414} n="2" sheet="A-701" />
    </g>
  );
}

function SteelPlan() {
  const gx = [84, 244, 404, 564];
  const gy = [64, 384];
  const UB = ({ x1, y1, x2, y2, w = 5 }: { x1: number; y1: number; x2: number; y2: number; w?: number }) => (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w - 2.4} className="stroke-card" />
    </g>
  );
  return (
    <g className={L} fill="none">
      {gx.map((x, i) => (
        <g key={x}>
          <line x1={x} y1="30" x2={x} y2="410" strokeWidth="0.45" strokeDasharray="14 3 2 3" />
          <Bubble x={x} y={20} t={String(i + 1)} />
        </g>
      ))}
      {gy.map((y, i) => (
        <g key={y}>
          <line x1="50" y1={y} x2="610" y2={y} strokeWidth="0.45" strokeDasharray="14 3 2 3" />
          <Bubble x={36} y={y} t={"AB"[i]} />
        </g>
      ))}
      {/* rafters on each grid (double line UB) */}
      {gx.map((x) => <UB key={x} x1={x} y1={64} x2={x} y2={384} w={6} />)}
      {/* edge beams / eaves */}
      {gy.map((y) => <UB key={y} x1={84} y1={y} x2={564} y2={y} w={4.5} />)}
      {/* purlins */}
      {[112, 172, 232, 292, 352].map((y) => <line key={y} x1="84" y1={y} x2="564" y2={y} strokeWidth="0.9" strokeDasharray="7 3" />)}
      {/* bridging */}
      {[164, 324, 484].map((x) => <line key={x} x1={x} y1="64" x2={x} y2="384" strokeWidth="0.4" strokeDasharray="2 3" />)}
      {/* columns: UC section symbol */}
      {gx.flatMap((x) => gy.map((y) => (
        <g key={`${x}-${y}`} strokeWidth="0.8">
          <rect x={x - 9} y={y - 9} width="18" height="18" className="fill-card" />
          <path d={`M${x - 7} ${y - 7} h14 v3 h-5.5 v8 h5.5 v3 h-14 v-3 h5.5 v-8 h-5.5 z`} className="fill-current" stroke="none" />
        </g>
      )))}
      {/* rod bracing */}
      <path d="M90 70 L238 378 M238 70 L90 378" strokeWidth="0.9" />
      <path d="M410 70 L558 378 M558 70 L410 378" strokeWidth="0.9" />
      {/* mezzanine */}
      <rect x="420" y="250" width="150" height="130" strokeWidth="1.3" strokeDasharray="10 4" />
      {Array.from({ length: 7 }).map((_, i) => <line key={i} x1={420 + i * 21} y1="250" x2={420 + i * 21} y2="380" strokeWidth="0.35" />)}
      <T x={495} y={312} s={7} w={700}>MEZZANINE</T>
      <T x={495} y={322} s={6}>250PFC JOISTS @ 600 · 5 kPa</T>
      {/* member callouts */}
      <g className="fill-card" strokeWidth="0.5">
        <rect x="124" y="94" width="80" height="12" />
        <rect x="314" y="170" width="12" height="80" />
      </g>
      <T x={164} y={103} s={7}>Z200-19 @1200</T>
      <T x={323} y={210} s={7} r={-90}>360UB44.7 R1</T>
      <T x={164} y={230} s={6.5}>Ø16 ROD X-BRACE</T>
      <T x={84} y={400} s={6} o={0.85}>C1 310UC118</T>
      <T x={540} y={376} s={6} o={0.85}>C4 310UC118</T>
      {/* dims */}
      <Dim pts={gx} at={436} labels={["8 000", "8 000", "8 000"]} />
      <Dim pts={gy} at={636} vertical labels={["16 000"]} />
      <Dim pts={[64, 112, 172, 232, 292, 352, 384]} at={604} vertical labels={["", "1 200", "1 200", "1 200", "1 200", ""]} />
      <SectionMark x={164} y={44} n="3" sheet="S-301" dir={-1} />
      <NorthArrow x={690} y={70} />
      <ScaleBar x={655} y={130} label="1:200" />
      <T x={690} y={180} s={7} w={700}>ROOF FRAMING</T>
      <T x={690} y={190} s={7} w={700}>PLAN</T>
      <g strokeWidth="0.4" opacity="0.85">
        <rect x="652" y="210" width="96" height="110" />
        <T x={656} y={222} s={6.5} a="start" w={700}>STEEL NOTES</T>
        {["1. GRADE 300PLUS", "   TO AS/NZS 3679.", "2. BOLTS 8.8/S U.N.O.", "3. HDG ALL EXT.", "4. SHOP DWGS TO", "   ENG. FOR REVIEW.", "5. WELDS SP CAT."].map((n, i) => (
          <T key={i} x={656} y={234 + i * 10} s={6} a="start">{n}</T>
        ))}
      </g>
    </g>
  );
}

function SideNotes({ title, sub, scale, heading, notes }: { title: string; sub: string; scale: string; heading: string; notes: string[] }) {
  return (
    <g>
      <NorthArrow x={690} y={70} />
      <ScaleBar x={655} y={130} label={scale} />
      <T x={690} y={180} s={7} w={700}>{title}</T>
      <T x={690} y={190} s={7} w={700}>{sub}</T>
      <g strokeWidth="0.4" opacity="0.85">
        <rect x="652" y="210" width="96" height={20 + notes.length * 10} />
        <T x={656} y={222} s={6.5} a="start" w={700}>{heading}</T>
        {notes.map((n, i) => <T key={i} x={656} y={234 + i * 10} s={6} a="start">{n}</T>)}
      </g>
    </g>
  );
}

function ConcretePlan() {
  const gx = [80, 240, 400, 560];
  const gy = [70, 224, 380];
  return (
    <g className={L} fill="none">
      {gx.map((x, i) => <g key={x}><line x1={x} y1="40" x2={x} y2="410" strokeWidth="0.45" strokeDasharray="14 3 2 3" /><Bubble x={x} y={24} t={String(i + 1)} /></g>)}
      {gy.map((y, i) => <g key={y}><line x1="50" y1={y} x2="600" y2={y} strokeWidth="0.45" strokeDasharray="14 3 2 3" /><Bubble x={36} y={y} t={"ABC"[i]} /></g>)}
      <rect x="74" y="64" width="492" height="322" strokeWidth="2" />
      <rect x="82" y="72" width="476" height="306" strokeWidth="0.6" strokeDasharray="6 3" />
      {/* pour breaks */}
      <line x1="240" y1="64" x2="240" y2="386" strokeWidth="1.4" strokeDasharray="12 4" />
      <line x1="403" y1="64" x2="403" y2="386" strokeWidth="1.4" strokeDasharray="12 4" />
      {([["POUR 1", 160], ["POUR 2", 320], ["POUR 3", 480]] as const).map(([t, x]) => <g key={t}><T x={x} y={150} s={9} w={700}>{t}</T><T x={x} y={160} s={6.5} o={0.75}>150 SLAB N32 · SL92</T></g>)}
      {/* thickening */}
      <rect x="320" y="72" width="14" height="306" fill="url(#hatch-wall)" strokeWidth="0.7" />
      <T x={327} y={300} s={6.5} r={-90}>THICKENING TH1 — DEPTH ?</T>
      {/* pads */}
      {gx.flatMap((x) => gy.map((y) => <rect key={`${x}${y}`} x={x - 10} y={y - 10} width="20" height="20" strokeWidth="0.9" strokeDasharray="3 2" />))}
      {[[240, 224], [400, 224]].map(([x, y]) => <T key={x} x={x} y={y + 22} s={6}>PF1</T>)}
      <Dim pts={gx} at={436} labels={["8 000", "8 000", "8 000"]} />
      <Dim pts={[70, 380]} at={620} vertical labels={["15 500"]} />
      <SectionMark x={160} y={410} n="1" sheet="S-301" />
      <SideNotes title="SLAB & POUR" sub="PLAN" scale="1:200" heading="NOTES" notes={["1. N32 U.N.O.", "2. COVER 40 TOP.", "3. SL92 MESH,", "   LAP 2 SQUARES.", "4. CJ TYPE A AT", "   POUR BREAKS.", "5. CURE 7 DAYS."]} />
    </g>
  );
}

function CivilPlan() {
  return (
    <g className={L} fill="none">
      {/* contours */}
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M40 ${60 + i * 28} C200 ${40 + i * 30} 420 ${90 + i * 26} 630 ${60 + i * 30}`} strokeWidth="0.4" opacity="0.6" />)}
      {[0, 1, 2].map((i) => <T key={i} x={620} y={56 + i * 30} s={5.5} a="end" o={0.7}>RL {(42.5 - i * 0.5).toFixed(1)}</T>)}
      {/* cut / fill zones */}
      <rect x="80" y="70" width="200" height="110" fill="url(#hatch-wall)" strokeWidth="0.9" strokeDasharray="6 3" />
      <T x={180} y={128} s={8} w={700}>CUT ZONE</T>
      <rect x="380" y="260" width="200" height="120" fill="url(#hatch-roof)" strokeWidth="0.9" strokeDasharray="6 3" />
      <T x={480} y={324} s={8} w={700}>FILL ZONE</T>
      {/* road */}
      <rect x="60" y="200" width="560" height="44" strokeWidth="0.5" className="fill-card" />
      <line x1="60" y1="198" x2="620" y2="198" strokeWidth="2" />
      <line x1="60" y1="246" x2="620" y2="246" strokeWidth="2" />
      <line x1="60" y1="222" x2="620" y2="222" strokeWidth="0.6" strokeDasharray="14 8" />
      <T x={340} y={218} s={8} w={700}>ROAD 1 — 8.0 CARRIAGEWAY</T>
      {/* stormwater */}
      <line x1="100" y1="263" x2="520" y2="263" strokeWidth="2.2" strokeDasharray="16 4 2 4" />
      {[100, 240, 380, 520].map((x, i) => <g key={x}><rect x={x - 7} y="256" width="14" height="14" className="fill-card" strokeWidth="1" /><line x1={x - 7} y1="256" x2={x + 7} y2="270" strokeWidth="0.6" /><T x={x} y={284} s={6}>KIP {i + 1}</T></g>)}
      <T x={310} y={258} s={6}>375 RCP @ 1.0%</T>
      <line x1="523" y1="120" x2="523" y2="256" strokeWidth="1.6" strokeDasharray="10 3 2 3" />
      <T x={536} y={180} s={6} r={-90}>Ø ? — LOT CONN.</T>
      {/* lots */}
      {[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x={70 + i * 100} y="300" width="100" height="90" strokeWidth="0.5" opacity={i > 2 ? 0.4 : 1} /><T x={120 + i * 100} y={350} s={7}>LOT {101 + i}</T></g>)}
      <Dim pts={[60, 620]} at={30} labels={["360 000 (STAGE 1)"]} />
      <SideNotes title="GENERAL" sub="ARRANGEMENT" scale="1:500" heading="CIVIL NOTES" notes={["1. FILL TO 95%", "   STD COMPACTION.", "2. PAVEMENT TO", "   DETAIL C-501.", "3. RCP CLASS 2", "   U.N.O.", "4. PIT LIDS CLASS D."]} />
    </g>
  );
}

function MepPlan() {
  return (
    <g className={L} fill="none">
      <path d="M70 60 H590 V390 H70 Z M78 68 V382 H582 V68 Z" fill="url(#hatch-wall)" fillRule="evenodd" strokeWidth="1.2" />
      <rect x="430" y="270" width="5" height="112" fill="url(#hatch-wall)" strokeWidth="0.7" />
      <rect x="435" y="270" width="147" height="5" fill="url(#hatch-wall)" strokeWidth="0.7" />
      {/* AC unit + duct */}
      <rect x="82" y="104" width="30" height="40" strokeWidth="1" /><path d="M82 104 L112 144 M112 104 L82 144" strokeWidth="0.5" />
      <T x={97} y={98} s={6}>AC-1</T>
      <rect x="112" y="120" width="458" height="10" strokeWidth="1.2" />
      <line x1="112" y1="125" x2="570" y2="125" strokeWidth="0.4" strokeDasharray="4 3" />
      <T x={340} y={116} s={6.5}>Ø400 SA DUCT</T>
      {[148, 268, 388, 508].map((x) => <g key={x} strokeWidth="0.7"><line x1={x} y1="130" x2={x} y2="140" /><rect x={x - 8} y="140" width="16" height="16" /><path d={`M${x - 8} 140 L${x + 8} 156 M${x + 8} 140 L${x - 8} 156`} strokeWidth="0.4" /></g>)}
      {/* lights */}
      {Array.from({ length: 12 }).map((_, i) => <g key={i} strokeWidth="0.6"><rect x={110 + (i % 6) * 76} y={196 + Math.floor(i / 6) * 32} width="22" height="22" /><circle cx={121 + (i % 6) * 76} cy={207 + Math.floor(i / 6) * 32} r="5" /></g>)}
      <T x={340} y={190} s={6}>L1 LED 600×600 (TYP.)</T>
      {/* power points */}
      {Array.from({ length: 10 }).map((_, i) => <g key={i} strokeWidth="0.7"><circle cx={96 + i * 48} cy={374} r="4" /><line x1={92 + i * 48} y1="374" x2={100 + i * 48} y2="374" /></g>)}
      <T x={250} y={364} s={6}>DGPO @ 300 AFL</T>
      {/* board */}
      <rect x="82" y="300" width="22" height="34" strokeWidth="1" className="fill-current" opacity="0.6" /><T x={93} y={346} s={6}>DB-1</T>
      <T x={250} y={320} s={6.5} o={0.75}>CIRCUITS C1–C8 — ROUTES NOT SHOWN</T>
      {/* hydraulics */}
      <line x1="440" y1="263" x2="560" y2="263" strokeWidth="1.4" strokeDasharray="8 3" />
      <line x1="557" y1="263" x2="557" y2="370" strokeWidth="1.4" strokeDasharray="8 3" />
      <T x={500} y={258} s={6}>20 Cu HW/CW</T>
      <g strokeWidth="0.7"><ellipse cx="470" cy="320" rx="10" ry="7" /><rect x="490" y="330" width="16" height="24" rx="6" /></g>
      <T x={505} y={300} s={6.5} w={700}>WC / AMENITIES</T>
      <SideNotes title="SERVICES" sub="LAYOUT" scale="1:100" heading="LEGEND" notes={["⊠ SUPPLY DIFFUSER", "▢ L1 LED PANEL", "⊖ DOUBLE GPO", "▮ DISTRIBUTION BD", "--- HW / CW PIPE", "SEE E-601 SCHED."]} />
    </g>
  );
}

function PaintingPlan() {
  const H = "url(#hatch-wall)";
  return (
    <g className={L} fill="none">
      <path d="M66 56 H594 V394 H66 Z M76 66 V384 H584 V66 Z" fill={H} fillRule="evenodd" strokeWidth="1.3" />
      <rect x="300" y="66" width="6" height="150" fill={H} strokeWidth="0.9" />
      <rect x="76" y="216" width="508" height="6" fill={H} strokeWidth="0.9" />
      <rect x="432" y="222" width="5" height="162" fill={H} strokeWidth="0.8" />
      <rect x="250" y="222" width="5" height="162" fill={H} strokeWidth="0.8" />
      {/* feature wall */}
      <line x1="90" y1="70" x2="290" y2="70" strokeWidth="3.5" />
      <T x={190} y={86} s={6.5}>FEATURE WALL — COLOUR ?</T>
      {/* doors */}
      {[200, 380].map((x) => <g key={x} strokeWidth="0.8"><rect x={x} y="216" width="40" height="6" className="fill-card" stroke="none" /><line x1={x + 2} y1="222" x2={x + 2} y2="258" strokeWidth="1.1" /><path d={`M${x + 2} 258 A36 36 0 0 0 ${x + 40} 222`} strokeDasharray="3 2" /></g>)}
      {/* balcony */}
      <rect x="440" y="236" width="140" height="140" strokeWidth="0.6" strokeDasharray="6 3" />
      {/* room tags with finish codes */}
      {([["LIVING", 190, 150, "PW1 · PC1"], ["KITCHEN / DINING", 445, 150, "PW1 · PC1"], ["BED 1", 160, 310, "PW1 · PC1"], ["BATH", 345, 300, "PW2 · PC2"], ["BALCONY", 510, 300, "SOFFIT ?"]] as const).map(([t, x, y, f]) => (
        <g key={t}><T x={x} y={y} s={8} w={700}>{t}</T><T x={x} y={y + 10} s={6.5} o={0.75}>{f}</T></g>
      ))}
      <T x={330} y={404} s={6.5}>SKIRTING 68 · ARCHITRAVE 42 · ENAMEL</T>
      <Dim pts={[66, 303, 594]} at={34} labels={["6 200", "7 300"]} />
      <Dim pts={[56, 219, 394]} at={628} vertical labels={["4 400", "4 600"]} />
      <SideNotes title="TYPICAL UNIT" sub="PLAN" scale="1:50" heading="FINISHES" notes={["PW1 WALL LOW SHEEN", "PW2 WET SEMI-GLOSS", "PC1 CEILING FLAT", "DR  DOOR ENAMEL", "CLG HT 2 700", "x12 UNITS"]} />
    </g>
  );
}

function DrywallPlan() {
  const H = "url(#hatch-wall)";
  return (
    <g className={L} fill="none">
      <path d="M66 56 H594 V394 H66 Z M76 66 V384 H584 V66 Z" fill={H} fillRule="evenodd" strokeWidth="1.3" />
      {/* partitions */}
      <rect x="300" y="66" width="8" height="318" fill={H} strokeWidth="0.9" />
      <rect x="76" y="216" width="508" height="8" fill={H} strokeWidth="0.9" />
      <rect x="470" y="224" width="6" height="160" fill={H} strokeWidth="0.8" />
      {/* fire-rated wall */}
      <rect x="320" y="66" width="10" height="318" fill="url(#hatch-roof)" strokeWidth="1.6" />
      <T x={325} y={306} s={6.5} r={-90}>FRL 120/120/60 — SCHED ?</T>
      {/* suspended ceiling grid (reflected) */}
      <g strokeWidth="0.35" opacity="0.8">
        {Array.from({ length: 9 }).map((_, i) => <line key={`v${i}`} x1={94 + i * 22} y1="84" x2={94 + i * 22} y2="196" />)}
        {Array.from({ length: 5 }).map((_, i) => <line key={`h${i}`} x1="94" y1={84 + i * 22} x2="286" y2={84 + i * 22} />)}
        {Array.from({ length: 11 }).map((_, i) => <line key={`w${i}`} x1={334 + i * 22} y1="84" x2={334 + i * 22} y2="196" />)}
        {Array.from({ length: 5 }).map((_, i) => <line key={`x${i}`} x1="334" y1={84 + i * 22} x2="566" y2={84 + i * 22} />)}
      </g>
      {/* access panel symbols */}
      <g strokeWidth="0.7">
        <rect x="478" y="232" width="14" height="14" className="fill-card" />
        <line x1="478" y1="232" x2="492" y2="246" /><line x1="492" y1="232" x2="478" y2="246" />
        <rect x="508" y="262" width="14" height="14" className="fill-card" />
        <line x1="508" y1="262" x2="522" y2="276" /><line x1="522" y1="262" x2="508" y2="276" />
      </g>
      <T x={505} y={288} s={6}>AP 600×600 (TYP.)</T>
      {/* partition type tags */}
      {([["PT1", 306, 200], ["PT1", 200, 212], ["PT2", 480, 216]] as const).map(([t, x, y]) => (
        <g key={`${t}${x}`} className="fill-card">
          <path d={`M${x - 13} ${y} l5 -7 h16 l5 7 l-5 7 h-16 z`} strokeWidth="0.8" />
          <T x={x} y={y + 3} s={7.5} w={700}>{t}</T>
        </g>
      ))}
      {/* room tags */}
      {([["OPEN OFFICE", 190, 150, "CL1 · CE1"], ["MEETING", 445, 150, "CL1 · CE1"], ["WORKSHOP", 190, 310, "CL1 · CE1"], ["AMENITIES", 390, 310, "CL1 · CE1"], ["PLANT", 525, 310, "AP ?"]] as const).map(([t, x, y, f]) => (
        <g key={t}><T x={x} y={y} s={8} w={700}>{t}</T><T x={x} y={y + 10} s={6.5} o={0.75}>{f}</T></g>
      ))}
      <T x={330} y={404} s={6.5}>PT1 64 STUD · 2×10 PB EA SIDE · IW1 75 ACOUSTIC</T>
      <Dim pts={[66, 303, 594]} at={34} labels={["7 100", "8 400"]} />
      <Dim pts={[56, 219, 394]} at={628} vertical labels={["4 850", "5 250"]} />
      <Dim pts={[76, 308, 320, 594]} at={420} labels={["6 900", "400", "8 100"]} />
      <SideNotes title="PARTITION" sub="LAYOUT" scale="1:100" heading="NOTES" notes={["1. PARTITIONS TO", "   SCHED A-501.", "2. FRL WALLS TO", "   PLAN F-101.", "3. CE1 R3.5 CEILING.", "4. IW1 75 ACOUSTIC.", "5. SEAL AT HEAD", "   & JUNCTIONS."]} />
    </g>
  );
}

const SHEET_META: Record<TradeId, { project: string; title: string; dwg: string; scale: string }> = {
  gc: { project: "RESIDENCE — LOT 14", title: "GROUND FLOOR PLAN", dwg: "J2417", scale: "1:100" },
  windows: { project: "TOWNHOUSES — STAGE 2", title: "NORTH ELEVATION", dwg: "J2388", scale: "1:100" },
  steel: { project: "WAREHOUSE — UNIT 3", title: "ROOF FRAMING PLAN", dwg: "J2402", scale: "1:200" },
  concrete: { project: "COMMERCIAL SLAB — BLDG A", title: "SLAB & POUR PLAN", dwg: "J2431", scale: "1:200" },
  civil: { project: "SUBDIVISION — STAGE 1", title: "GENERAL ARRANGEMENT", dwg: "J2440", scale: "1:500" },
  mep: { project: "OFFICE FIT-OUT — L1", title: "SERVICES LAYOUT", dwg: "J2452", scale: "1:100" },
  painting: { project: "APARTMENTS — 12 UNITS", title: "TYPICAL UNIT PLAN", dwg: "J2463", scale: "1:50" },
  drywall: { project: "COMMERCIAL BLDG — L1", title: "PARTITION LAYOUT", dwg: "J2474", scale: "1:100" },
  scaffolding: { project: "APARTMENTS — 6 STOREYS", title: "SCAFFOLD ELEVATION", dwg: "J2485", scale: "1:100" },
};

export function TakeoffBlueprint({ trade, items, revealed = items.length, selectedId, onSelect, sheetLabel, className }: Props) {
  const shown = items.slice(0, revealed);
  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border bg-card text-foreground/80", className)}>
      <svg viewBox="0 0 760 470" className="block h-auto w-full" role="img" aria-label={`Drawing ${sheetLabel} with AI take-off markups`}>
        <defs>
          <pattern id={`grid-${trade}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" className="stroke-current" strokeWidth="0.25" opacity="0.15" />
          </pattern>
          <pattern id="hatch-wall" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" className="stroke-current" strokeWidth="0.7" />
          </pattern>
          <pattern id="hatch-brick" width="24" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 8H24M0 4H24M6 0V4M18 4V8" fill="none" className="stroke-current" strokeWidth="0.3" opacity="0.45" />
          </pattern>
          <pattern id="hatch-roof" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 8H8" fill="none" className="stroke-current" strokeWidth="0.35" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="760" height="470" fill={`url(#grid-${trade})`} />
        <rect x="6" y="6" width="748" height="458" fill="none" className="stroke-current" strokeWidth="1.4" />
        <rect x="10" y="10" width="740" height="450" fill="none" className="stroke-current" strokeWidth="0.4" />
        {trade === "gc" && <GcPlan />}
        {trade === "windows" && <WindowsElevation />}
        {trade === "steel" && <SteelPlan />}
        {trade === "concrete" && <ConcretePlan />}
        {trade === "civil" && <CivilPlan />}
        {trade === "mep" && <MepPlan />}
        {trade === "painting" && <PaintingPlan />}
        {trade === "drywall" && <DrywallPlan />}
        {/* title block */}
        <g className="stroke-current fill-card" strokeWidth="0.7">
          <rect x="560" y="396" width="190" height="64" />
          <line x1="560" y1="408" x2="750" y2="408" />
          <line x1="560" y1="422" x2="750" y2="422" />
          <line x1="560" y1="436" x2="690" y2="436" />
          <line x1="690" y1="422" x2="690" y2="460" />
          <line x1="625" y1="436" x2="625" y2="460" />
        </g>
        <g className="fill-current" fontFamily="ui-monospace, 'Courier New', monospace">
          <text x="564" y="405" fontSize="6" fontWeight="700">alfred ai · SAMPLE — NOT FOR CONSTRUCTION</text>
          <text x="564" y="418" fontSize="7.5" fontWeight="700">{SHEET_META[trade].project}</text>
          <text x="564" y="432" fontSize="7">{SHEET_META[trade].title}</text>
          <text x="564" y="444" fontSize="5.5" opacity="0.7">JOB · SCALE</text>
          <text x="564" y="455" fontSize="7">{SHEET_META[trade].dwg} · {SHEET_META[trade].scale}</text>
          <text x="629" y="444" fontSize="5.5" opacity="0.7">REV · DRN · CHK</text>
          <text x="629" y="455" fontSize="7">C · AI · —</text>
          <text x="694" y="432" fontSize="5.5" opacity="0.7">SHEET</text>
          <text x="720" y="452" fontSize="14" fontWeight="700" textAnchor="middle">{sheetLabel}</text>
        </g>
        {/* AI markups */}
        {shown.map((it) =>
          it.marks.map((m, i) => {
            const active = selectedId === it.id;
            const flagged = !!it.flag;
            return (
              <rect
                key={`${it.id}-${i}`}
                x={m.x} y={m.y} width={m.w} height={m.h} rx="2"
                className={cn(
                  "cursor-pointer transition-all duration-300",
                  flagged ? "fill-warning/15 stroke-warning" : "fill-primary/10 stroke-primary",
                  active && (flagged ? "fill-warning/35" : "fill-primary/30"),
                )}
                strokeWidth={active ? 2.5 : 1.2}
                strokeDasharray={flagged ? "5 3" : undefined}
                onClick={() => onSelect?.(it.id)}
              >
                <title>{`${it.code} · ${it.description}`}</title>
              </rect>
            );
          }),
        )}
      </svg>
    </div>
  );
}
