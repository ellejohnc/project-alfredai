import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  MapPin, 
  Clock, 
  User, 
  Building2,
  Mic,
  Eye,
  Send,
  ChevronRight,
  Scan,
  Shield,
  Zap,
  X,
  Wifi,
  WifiOff,
  MessageSquare,
  Download,
  Share2,
  Bell,
  Users,
  QrCode,
  Pencil,
  Calendar,
  Hash,
  Link2,
  Mail,
  Smartphone,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PDFReportPreview from "./inspection/PDFReportPreview";
import LazyImage from "@/components/ui/lazy-image";

// Import demo inspection images
import inspectionCrack from "@/assets/inspection-crack.jpg";
import inspectionWaterproofing from "@/assets/inspection-waterproofing.jpg";
import inspectionElectrical from "@/assets/inspection-electrical.jpg";
import inspectionStructure from "@/assets/inspection-structure.jpg";

type InspectionType = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
};

type ChecklistItem = {
  id: string;
  question: string;
  status: "pass" | "fail" | "pending";
  note?: string;
  category: string;
};

type DemoPhoto = {
  id: string;
  src: string;
  label: string;
  location: string;
  timestamp: string;
  gps: string;
  aiAnalysis: {
    detected: string;
    problem: string;
    severity: "high" | "medium" | "low";
    confidence: number;
  };
  comments?: { user: string; text: string; time: string }[];
};

type Notification = {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
  time: string;
};

const demoPhotos: DemoPhoto[] = [
  { 
    id: "1", 
    src: inspectionCrack, 
    label: "Wall Crack", 
    location: "Level 2 - Bathroom",
    timestamp: new Date().toLocaleTimeString(),
    gps: "-33.8688, 151.2093",
    aiAnalysis: {
      detected: "Structural crack in concrete wall",
      problem: "Hairline crack detected running vertically through wall panel. Potential water ingress point and may indicate foundation movement or settlement issues.",
      severity: "high",
      confidence: 94
    },
    comments: []
  },
  { 
    id: "2", 
    src: inspectionWaterproofing, 
    label: "Waterproofing", 
    location: "Level 1 - Bathroom",
    timestamp: new Date().toLocaleTimeString(),
    gps: "-33.8689, 151.2094",
    aiAnalysis: {
      detected: "Bathroom waterproofing membrane",
      problem: "Waterproofing membrane appears correctly installed with visible edge banding. Minor discoloration near drain area may indicate moisture accumulation.",
      severity: "low",
      confidence: 82
    },
    comments: []
  },
  { 
    id: "3", 
    src: inspectionElectrical, 
    label: "Electrical Panel", 
    location: "Ground Floor",
    timestamp: new Date().toLocaleTimeString(),
    gps: "-33.8687, 151.2092",
    aiAnalysis: {
      detected: "Main switchboard and cable management",
      problem: "Switchboard installation in progress. Cable runs are organized but require labeling. Junction box cover missing on secondary panel.",
      severity: "medium",
      confidence: 89
    },
    comments: []
  },
  { 
    id: "4", 
    src: inspectionStructure, 
    label: "Steel Structure", 
    location: "Level 3 - Frame",
    timestamp: new Date().toLocaleTimeString(),
    gps: "-33.8690, 151.2095",
    aiAnalysis: {
      detected: "Steel frame structural connections",
      problem: "Steel beam connections visible with some surface corrosion on diagonal brace. Missing bolts detected on secondary beam joint - requires immediate attention.",
      severity: "high",
      confidence: 91
    },
    comments: []
  },
];

const inspectionTypes: InspectionType[] = [
  { id: "walkthrough", name: "Site Walkthrough", icon: <Building2 className="w-4 h-4" />, color: "bg-blue-500", description: "General scoping visit" },
  { id: "prestart", name: "Pre-start Inspection", icon: <CheckCircle2 className="w-4 h-4" />, color: "bg-emerald-500", description: "Before works commence" },
  { id: "progress", name: "Progress Inspection", icon: <Clock className="w-4 h-4" />, color: "bg-amber-500", description: "Milestone verification" },
  { id: "defect", name: "Defect Inspection", icon: <AlertTriangle className="w-4 h-4" />, color: "bg-red-500", description: "Rectification check" },
  { id: "completion", name: "Practical Completion", icon: <Shield className="w-4 h-4" />, color: "bg-purple-500", description: "Final handover" },
  { id: "safety", name: "Safety & Compliance", icon: <Shield className="w-4 h-4" />, color: "bg-cyan-500", description: "OH&S review" },
];

// Inspection type-specific checklist templates
const inspectionTypeChecklists: Record<string, ChecklistItem[]> = {
  walkthrough: [
    { id: "w1", question: "Site access routes clear and safe?", status: "pending", category: "Access" },
    { id: "w2", question: "General site conditions acceptable?", status: "pending", category: "Site Condition" },
    { id: "w3", question: "Safety signage visible at entry points?", status: "pending", category: "Safety" },
    { id: "w4", question: "Temporary facilities operational?", status: "pending", category: "Facilities" },
  ],
  prestart: [
    { id: "p1", question: "Site establishment complete?", status: "pending", category: "Setup" },
    { id: "p2", question: "Permits and approvals displayed?", status: "pending", category: "Compliance" },
    { id: "p3", question: "Erosion and sediment controls in place?", status: "pending", category: "Environment" },
    { id: "p4", question: "Site fencing and hoarding secure?", status: "pending", category: "Safety" },
  ],
  progress: [
    { id: "pr1", question: "Works progressing to schedule?", status: "pending", category: "Schedule" },
    { id: "pr2", question: "Quality of workmanship acceptable?", status: "pending", category: "Quality" },
    { id: "pr3", question: "Materials stored correctly on site?", status: "pending", category: "Materials" },
    { id: "pr4", question: "Milestone requirements met?", status: "pending", category: "Progress" },
  ],
  defect: [
    { id: "d1", question: "All reported defects addressed?", status: "pending", category: "Defects" },
    { id: "d2", question: "Rectification work quality acceptable?", status: "pending", category: "Quality" },
    { id: "d3", question: "No new defects identified?", status: "pending", category: "Inspection" },
    { id: "d4", question: "Documentation of repairs complete?", status: "pending", category: "Documentation" },
  ],
  completion: [
    { id: "c1", question: "All works complete to specifications?", status: "pending", category: "Completion" },
    { id: "c2", question: "All services operational and tested?", status: "pending", category: "Services" },
    { id: "c3", question: "Site clean and debris removed?", status: "pending", category: "Cleanup" },
    { id: "c4", question: "All certifications and warranties provided?", status: "pending", category: "Documentation" },
  ],
  safety: [
    { id: "s1", question: "Fall protection systems in place?", status: "pending", category: "Fall Protection" },
    { id: "s2", question: "PPE requirements being followed?", status: "pending", category: "PPE" },
    { id: "s3", question: "Fire safety equipment accessible?", status: "pending", category: "Fire Safety" },
    { id: "s4", question: "Emergency exits clearly marked?", status: "pending", category: "Emergency" },
  ],
};

// Photo-based checklist items triggered by AI analysis
const photoBasedChecklists: Record<string, ChecklistItem[]> = {
  "Wall Crack": [
    { id: "ph-crack-1", question: "Crack width measured and documented?", status: "pending", category: "Structure" },
    { id: "ph-crack-2", question: "Movement monitoring points marked?", status: "pending", category: "Structure" },
    { id: "ph-crack-3", question: "Structural engineer assessment required?", status: "pending", category: "Structure" },
  ],
  "Waterproofing": [
    { id: "ph-wp-1", question: "Waterproofing membrane integrity verified?", status: "pending", category: "Waterproofing" },
    { id: "ph-wp-2", question: "Drain connections properly sealed?", status: "pending", category: "Waterproofing" },
    { id: "ph-wp-3", question: "Flood test completed successfully?", status: "pending", category: "Waterproofing" },
  ],
  "Electrical Panel": [
    { id: "ph-elec-1", question: "All circuits properly labeled?", status: "pending", category: "Electrical" },
    { id: "ph-elec-2", question: "RCD protection operational?", status: "pending", category: "Electrical" },
    { id: "ph-elec-3", question: "Compliance certificate obtained?", status: "pending", category: "Electrical" },
  ],
  "Steel Structure": [
    { id: "ph-steel-1", question: "All bolted connections verified?", status: "pending", category: "Structure" },
    { id: "ph-steel-2", question: "Corrosion protection applied?", status: "pending", category: "Structure" },
    { id: "ph-steel-3", question: "Welding quality inspected?", status: "pending", category: "Structure" },
  ],
};

// Default fallback checklist
const defaultChecklist: ChecklistItem[] = [
  { id: "default-1", question: "General site conditions acceptable?", status: "pending", category: "Site Condition" },
  { id: "default-2", question: "Safety requirements met?", status: "pending", category: "Safety" },
];

// Generate dynamic checklist based on inspection type and photos
const generateContextualChecklist = (
  inspectionType: string | null,
  photos: DemoPhoto[]
): ChecklistItem[] => {
  // Start with inspection type base checklist
  const baseChecklist = inspectionType 
    ? inspectionTypeChecklists[inspectionType] || []
    : [];
  
  // Add photo-specific items (deduplicated by question)
  const photoItems: ChecklistItem[] = [];
  const addedQuestions = new Set<string>();
  
  // Track high severity photo labels for auto-fail
  const highSeverityLabels = photos
    .filter(p => p.aiAnalysis.severity === "high")
    .map(p => p.label);
  
  photos.forEach(photo => {
    const items = photoBasedChecklists[photo.label];
    if (items) {
      items.forEach(item => {
        // Avoid duplicate questions
        if (!addedQuestions.has(item.question)) {
          addedQuestions.add(item.question);
          
          // Check if this relates to a high severity finding
          const isHighSeverity = highSeverityLabels.includes(photo.label);
          
          photoItems.push({
            ...item,
            id: `${item.id}-${photo.id}`, // Unique ID per photo
            status: isHighSeverity ? "fail" : "pending",
            note: isHighSeverity ? `AI detected high severity issue in ${photo.label}` : undefined,
          });
        }
      });
    }
  });
  
  // Combine base + photo items, or use fallback if nothing available
  const combinedChecklist = [...baseChecklist, ...photoItems];
  
  if (combinedChecklist.length === 0) {
    return defaultChecklist;
  }
  
  return combinedChecklist;
};

const projectInfo = {
  name: "Lakeside Apartments",
  address: "42 Marina Drive, Capital Region NSW 2000",
  client: "Harbour View Developments Pty Ltd",
  builder: "Premium Constructions",
  inspector: "John Smith",
  company: "QA Inspections Co",
  milestone: "Stage 4 - Internal Fitout",
  projectId: "PRJ-2024-0847",
};

const personsPresent = [
  { name: "John Smith", role: "Lead Inspector", company: "QA Inspections" },
  { name: "Jane Smith", role: "Site Supervisor", company: "Premium Constructions" },
  { name: "Mike Johnson", role: "Project Manager", company: "Harbour View Dev" },
];

export default function SiteInspectionDemo() {
  const [step, setStep] = useState<"select" | "capture" | "checklist" | "report">("select");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<DemoPhoto | null>(null);
  const [attachedPhotos, setAttachedPhotos] = useState<DemoPhoto[]>([]);
  const [editedFindings, setEditedFindings] = useState<Record<string, string>>({});
  const [amendmentText, setAmendmentText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "pending">("synced");
  const [isBurstMode, setIsBurstMode] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const [showCameraMode, setShowCameraMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
  const [signatureAdded, setSignatureAdded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [reportShared, setReportShared] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // Simulate offline toggle
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setIsOnline(prev => {
          if (prev) {
            addNotification("warning", "Connection lost. Working offline.");
          } else {
            addNotification("success", "Back online. Syncing data...");
            setSyncStatus("syncing");
            setTimeout(() => setSyncStatus("synced"), 2000);
          }
          return !prev;
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsAnalyzing(false);
            return 100;
          }
          return prev + 12;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  // Burst capture simulation
  useEffect(() => {
    if (isBurstMode) {
      const interval = setInterval(() => {
        setBurstCount(prev => prev + 1);
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isBurstMode]);

  const addNotification = (type: "warning" | "info" | "success", message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      time: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [notification, ...prev].slice(0, 5));
  };

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    addNotification("info", `Starting ${inspectionTypes.find(t => t.id === typeId)?.name}`);
    setTimeout(() => setStep("capture"), 500);
  };

  const handleAttachSampleImage = (photo: DemoPhoto) => {
    setSelectedPhoto({
      ...photo,
      timestamp: new Date().toLocaleTimeString(),
    });
    setShowImagePicker(false);
    setShowCameraMode(false);
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setEditedFindings(prev => ({
      ...prev,
      [photo.id]: photo.aiAnalysis.problem
    }));
    setSyncStatus("syncing");
    setTimeout(() => setSyncStatus("synced"), 1500);
  };

  const handleBurstCapture = () => {
    setIsBurstMode(!isBurstMode);
    if (isBurstMode) {
      addNotification("info", `Captured ${burstCount} photos in burst mode. AI selecting best shots...`);
      setBurstCount(0);
      // Simulate AI picking best photo
      setTimeout(() => {
        const randomPhoto = demoPhotos[Math.floor(Math.random() * demoPhotos.length)];
        handleAttachSampleImage(randomPhoto);
      }, 1000);
    }
  };

  const handleConfirmPhoto = () => {
    if (selectedPhoto) {
      setAttachedPhotos(prev => [...prev, selectedPhoto]);
      setSelectedPhoto(null);
      setAmendmentText("");
      addNotification("success", `Photo added: ${selectedPhoto.label}`);
      
      // Check for high severity and send notification
      if (selectedPhoto.aiAnalysis.severity === "high") {
        setTimeout(() => {
          addNotification("warning", "High severity defect detected. Admin notified.");
        }, 1000);
      }
    }
  };

  const handleApplyAmendment = () => {
    if (selectedPhoto && amendmentText.trim()) {
      const currentFinding = editedFindings[selectedPhoto.id] || selectedPhoto.aiAnalysis.problem;
      setEditedFindings(prev => ({
        ...prev,
        [selectedPhoto.id]: `${currentFinding} [User note: ${amendmentText}]`
      }));
      setAmendmentText("");
      addNotification("info", "Finding updated with your notes");
    }
  };

  const handleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      addNotification("info", "Voice recording started...");
      setTimeout(() => {
        setAmendmentText("Crack appears to have extended since last inspection. Recommend urgent structural assessment.");
        setIsRecording(false);
        addNotification("success", "Voice transcribed successfully");
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  const handleAddComment = (photoId: string) => {
    if (commentText.trim()) {
      setAttachedPhotos(prev => prev.map(p => 
        p.id === photoId 
          ? { 
              ...p, 
              comments: [...(p.comments || []), { 
                user: projectInfo.inspector, 
                text: commentText, 
                time: new Date().toLocaleTimeString() 
              }]
            }
          : p
      ));
      setCommentText("");
      setShowCommentInput(null);
      addNotification("success", "Comment added to photo");
    }
  };

  const handleContinueToChecklist = () => {
    const dynamicChecklist = generateContextualChecklist(selectedType, attachedPhotos);
    setChecklist(dynamicChecklist);
    addNotification("info", `Generated ${dynamicChecklist.length} checklist items based on inspection type and photos`);
    setStep("checklist");
  };

  const handleChecklistUpdate = (id: string, status: "pass" | "fail") => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, status } : item
    ));
    if (status === "fail") {
      addNotification("warning", "Item marked as failed. Add note recommended.");
    }
  };

  const handleGenerateReport = () => {
    addNotification("info", "Generating inspection report...");
    setStep("report");
  };

  const handleShareReport = (method: string) => {
    addNotification("success", `Report shared via ${method}`);
    setShowShareModal(false);
    setReportShared(true);
  };

  const handleDownloadPDF = async () => {
    addNotification("info", "Generating PDF report...");
    
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = 15;
      const reportId = `${projectInfo.projectId}-${Date.now()}`;
      
      // Helper to add page footer
      const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text("Generated by alfred ai Inspection Platform", margin, pageHeight - 10);
        doc.text(`Report ID: ${reportId}`, pageWidth - margin - 55, pageHeight - 10);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      };
      
      // Helper to check page break
      const checkPageBreak = (neededHeight: number) => {
        if (yPos + neededHeight > pageHeight - 25) {
          addFooter();
          doc.addPage();
          yPos = 15;
          return true;
        }
        return false;
      };
      
      // ===== HEADER WITH LOGO =====
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Logo circle
      doc.setFillColor(249, 115, 22); // orange-500
      doc.circle(margin + 10, 17.5, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("A", margin + 7, 21);
      
      // Title
      doc.setFontSize(20);
      doc.text("SITE INSPECTION REPORT", margin + 28, 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("alfred ai Inspection Platform", margin + 28, 28);
      
      // Date in header
      doc.setFontSize(9);
      doc.text(new Date().toLocaleDateString('en-AU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }), pageWidth - margin - 55, 20);
      
      yPos = 45;
      
      // ===== TWO COLUMN LAYOUT FOR PROJECT & INSPECTOR =====
      const colWidth = (contentWidth - 10) / 2;
      const col1X = margin;
      const col2X = margin + colWidth + 10;
      
      // Project Details Box
      doc.setFillColor(249, 250, 251); // gray-50
      doc.setDrawColor(229, 231, 235); // gray-200
      doc.roundedRect(col1X, yPos, colWidth, 52, 3, 3, 'FD');
      
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("PROJECT DETAILS", col1X + 5, yPos + 8);
      
      doc.setTextColor(55, 65, 81); // gray-700
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      let pY = yPos + 16;
      doc.setFont("helvetica", "bold");
      doc.text(projectInfo.name, col1X + 5, pY);
      doc.setFont("helvetica", "normal");
      pY += 6;
      doc.text(`ID: ${projectInfo.projectId}`, col1X + 5, pY); pY += 5;
      doc.text(projectInfo.address, col1X + 5, pY); pY += 5;
      doc.text(`Client: ${projectInfo.client}`, col1X + 5, pY); pY += 5;
      doc.text(`Builder: ${projectInfo.builder}`, col1X + 5, pY); pY += 5;
      const typeName = inspectionTypes.find(t => t.id === selectedType)?.name || "Pre-start Inspection";
      doc.text(`Type: ${typeName}`, col1X + 5, pY);
      
      // Inspector Details Box
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(col2X, yPos, colWidth, 52, 3, 3, 'FD');
      
      doc.setTextColor(249, 115, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("INSPECTOR DETAILS", col2X + 5, yPos + 8);
      
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(9);
      let iY = yPos + 16;
      doc.setFont("helvetica", "bold");
      doc.text(projectInfo.inspector, col2X + 5, iY);
      doc.setFont("helvetica", "normal");
      iY += 6;
      doc.text(projectInfo.company, col2X + 5, iY); iY += 8;
      
      doc.setFont("helvetica", "bold");
      doc.text("Persons Present:", col2X + 5, iY);
      doc.setFont("helvetica", "normal");
      iY += 5;
      personsPresent.forEach(p => {
        doc.text(`• ${p.name} (${p.role})`, col2X + 5, iY);
        iY += 4;
      });
      
      yPos += 60;
      
      // ===== SUMMARY STATS BAR =====
      const passCount = checklist.filter(c => c.status === "pass").length;
      const failCount = checklist.filter(c => c.status === "fail").length;
      const pendingCount = checklist.filter(c => c.status === "pending").length;
      const photosToUse = attachedPhotos.length > 0 ? attachedPhotos : demoPhotos;
      const highCount = photosToUse.filter(p => p.aiAnalysis.severity === "high").length;
      
      const statBoxWidth = (contentWidth - 15) / 4;
      const stats = [
        { label: "Photos", value: photosToUse.length.toString(), color: [59, 130, 246] as [number, number, number] },
        { label: "Passed", value: passCount.toString(), color: [34, 197, 94] as [number, number, number] },
        { label: "Failed", value: failCount.toString(), color: [239, 68, 68] as [number, number, number] },
        { label: "High Risk", value: highCount.toString(), color: [220, 38, 38] as [number, number, number] },
      ];
      
      stats.forEach((stat, i) => {
        const x = margin + i * (statBoxWidth + 5);
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.roundedRect(x, yPos, statBoxWidth, 18, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, x + statBoxWidth / 2, yPos + 10, { align: 'center' });
        doc.setFontSize(7);
        doc.text(stat.label.toUpperCase(), x + statBoxWidth / 2, yPos + 15, { align: 'center' });
      });
      
      yPos += 28;
      
      // ===== CHECKLIST RESULTS =====
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("CHECKLIST RESULTS", margin, yPos);
      yPos += 6;
      
      // Checklist table
      const checkColWidth = [contentWidth * 0.6, contentWidth * 0.2, contentWidth * 0.2];
      
      // Header row
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, yPos, contentWidth, 7, 'F');
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Item", margin + 3, yPos + 5);
      doc.text("Category", margin + checkColWidth[0] + 3, yPos + 5);
      doc.text("Status", margin + checkColWidth[0] + checkColWidth[1] + 3, yPos + 5);
      yPos += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      checklist.forEach((item, idx) => {
        checkPageBreak(6);
        if (idx % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, yPos - 1, contentWidth, 6, 'F');
        }
        doc.setTextColor(55, 65, 81);
        const truncatedQ = item.question.length > 50 ? item.question.substring(0, 47) + "..." : item.question;
        doc.text(truncatedQ, margin + 3, yPos + 3);
        doc.text(item.category, margin + checkColWidth[0] + 3, yPos + 3);
        
        // Status badge
        const statusColors: Record<string, [number, number, number]> = {
          pass: [34, 197, 94],
          fail: [239, 68, 68],
          pending: [156, 163, 175]
        };
        const statusLabels: Record<string, string> = { pass: "PASS", fail: "FAIL", pending: "PENDING" };
        doc.setFillColor(...statusColors[item.status]);
        const badgeX = margin + checkColWidth[0] + checkColWidth[1] + 3;
        doc.roundedRect(badgeX, yPos - 0.5, 18, 5, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.text(statusLabels[item.status], badgeX + 9, yPos + 3, { align: 'center' });
        doc.setFontSize(8);
        yPos += 6;
      });
      
      yPos += 10;
      
      // ===== AI-DETECTED ISSUES WITH PHOTOS =====
      checkPageBreak(60);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("AI-DETECTED ISSUES & PHOTOS", margin, yPos);
      yPos += 8;
      
      // Photo grid - 2 columns
      const photoWidth = (contentWidth - 8) / 2;
      const photoHeight = 50;
      
      for (let i = 0; i < photosToUse.length; i += 2) {
        checkPageBreak(photoHeight + 30);
        
        for (let j = 0; j < 2 && (i + j) < photosToUse.length; j++) {
          const photo = photosToUse[i + j];
          const x = margin + j * (photoWidth + 8);
          
          // Photo container
          doc.setDrawColor(229, 231, 235);
          doc.setFillColor(243, 244, 246);
          doc.roundedRect(x, yPos, photoWidth, photoHeight + 25, 2, 2, 'FD');
          
          // Photo placeholder with gradient effect
          doc.setFillColor(156, 163, 175);
          doc.roundedRect(x + 3, yPos + 3, photoWidth - 6, photoHeight - 6, 2, 2, 'F');
          
          // Photo label overlay
          doc.setFillColor(0, 0, 0);
          doc.rect(x + 3, yPos + photoHeight - 15, photoWidth - 6, 12, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.text(photo.label, x + 6, yPos + photoHeight - 6);
          doc.setFont("helvetica", "normal");
          doc.text(photo.location, x + photoWidth - 8, yPos + photoHeight - 6, { align: 'right' });
          
          // Severity badge
          const severityColors: Record<string, [number, number, number]> = {
            high: [220, 38, 38],
            medium: [249, 115, 22],
            low: [234, 179, 8]
          };
          doc.setFillColor(...severityColors[photo.aiAnalysis.severity]);
          doc.roundedRect(x + 3, yPos + 3, 22, 6, 1, 1, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(5);
          doc.text(photo.aiAnalysis.severity.toUpperCase(), x + 14, yPos + 7, { align: 'center' });
          
          // Issue text below photo
          doc.setTextColor(55, 65, 81);
          doc.setFontSize(6);
          doc.setFont("helvetica", "bold");
          const truncatedDetected = photo.aiAnalysis.detected.length > 40 
            ? photo.aiAnalysis.detected.substring(0, 37) + "..." 
            : photo.aiAnalysis.detected;
          doc.text(truncatedDetected, x + 3, yPos + photoHeight + 5);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(5);
          const truncatedProblem = photo.aiAnalysis.problem.length > 80 
            ? photo.aiAnalysis.problem.substring(0, 77) + "..." 
            : photo.aiAnalysis.problem;
          doc.text(truncatedProblem, x + 3, yPos + photoHeight + 10, { maxWidth: photoWidth - 6 });
          doc.setTextColor(120, 120, 120);
          doc.text(`Confidence: ${photo.aiAnalysis.confidence}%  |  GPS: ${photo.gps}`, x + 3, yPos + photoHeight + 20);
        }
        yPos += photoHeight + 35;
      }
      
      // ===== QR CODE & SIGNATURE SECTION =====
      checkPageBreak(45);
      yPos += 5;
      
      // QR Code box
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, yPos, 35, 40, 2, 2, 'FD');
      
      // QR Code pattern (simulated)
      doc.setFillColor(30, 41, 59);
      const qrX = margin + 5;
      const qrY = yPos + 5;
      const qrSize = 25;
      const cellSize = qrSize / 7;
      
      // Corner squares
      doc.rect(qrX, qrY, cellSize * 2, cellSize * 2, 'F');
      doc.rect(qrX + cellSize * 5, qrY, cellSize * 2, cellSize * 2, 'F');
      doc.rect(qrX, qrY + cellSize * 5, cellSize * 2, cellSize * 2, 'F');
      
      // Random pattern for QR look
      const pattern = [
        [0,0,1,1,0,1,0],
        [0,0,0,1,1,0,0],
        [1,1,0,1,0,1,1],
        [0,1,1,0,1,0,1],
        [1,0,1,0,1,1,0],
        [0,0,1,1,0,0,0],
        [0,0,0,1,0,0,0]
      ];
      pattern.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          if (cell && !((ri < 2 && ci < 2) || (ri < 2 && ci > 4) || (ri > 4 && ci < 2))) {
            doc.rect(qrX + ci * cellSize, qrY + ri * cellSize, cellSize * 0.9, cellSize * 0.9, 'F');
          }
        });
      });
      
      doc.setFontSize(5);
      doc.setTextColor(100, 100, 100);
      doc.text("Scan for digital report", margin + 17.5, yPos + 37, { align: 'center' });
      
      // Signature area
      const sigX = margin + 45;
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(sigX, yPos, contentWidth - 45, 40, 2, 2, 'FD');
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("INSPECTOR SIGN-OFF", sigX + 5, yPos + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("I confirm this inspection was conducted in accordance with", sigX + 5, yPos + 15);
      doc.text("relevant Australian Standards and project specifications.", sigX + 5, yPos + 20);
      
      // Signature line
      doc.setDrawColor(180, 180, 180);
      doc.line(sigX + 5, yPos + 32, sigX + 60, yPos + 32);
      doc.setFontSize(6);
      doc.text("Signature", sigX + 5, yPos + 36);
      doc.line(sigX + 70, yPos + 32, sigX + 115, yPos + 32);
      doc.text("Date", sigX + 70, yPos + 36);
      
      // Add footer to last page
      addFooter();
      
      // Save the PDF
      doc.save(`Inspection_Report_${projectInfo.projectId}.pdf`);
      addNotification("success", "PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      addNotification("warning", "Failed to generate PDF");
    }
  };

  const resetDemo = () => {
    setStep("select");
    setSelectedType(null);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setChecklist([]);
    setSelectedPhoto(null);
    setAttachedPhotos([]);
    setEditedFindings({});
    setAmendmentText("");
    setShowImagePicker(false);
    setNotifications([]);
    setSignatureAdded(false);
    setReportShared(false);
    setShowCameraMode(false);
    setShowPDFPreview(false);
  };

  const highSeverityCount = attachedPhotos.filter(p => p.aiAnalysis.severity === "high").length;
  const mediumSeverityCount = attachedPhotos.filter(p => p.aiAnalysis.severity === "medium").length;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white via-slate-50 to-orange-50 rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
      >
        {/* Header with Status Indicators - Compact on mobile */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Scan className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-bold text-sm md:text-lg truncate">Site Inspection</h3>
                <p className="text-white/80 text-[10px] md:text-sm truncate">AI-Powered Quality Assurance</p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {/* Sync Status */}
              <div className={`px-2 py-1 md:px-3 md:py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1 md:gap-1.5 ${
                syncStatus === "synced" ? "bg-emerald-500/30" :
                syncStatus === "syncing" ? "bg-amber-500/30" :
                "bg-red-500/30"
              }`}>
                {syncStatus === "syncing" ? (
                  <RefreshCw className="w-3 h-3 text-white animate-spin" />
                ) : (
                  isOnline ? <Wifi className="w-3 h-3 text-white" /> : <WifiOff className="w-3 h-3 text-white" />
                )}
                <span className="text-white text-[10px] md:text-xs font-medium">
                  {!isOnline ? "Offline" : syncStatus === "syncing" ? "Syncing" : "Synced"}
                </span>
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 md:px-3 md:py-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-red-500 text-white text-[8px] md:text-[10px] flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-64 md:w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                        <p className="font-semibold text-slate-800 text-sm">Notifications</p>
                      </div>
                      <div className="max-h-48 md:max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-slate-500">No notifications</p>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className="px-3 py-2 border-b border-slate-100 last:border-0">
                              <div className="flex items-start gap-2">
                                <div className={`w-2 h-2 rounded-full mt-1 ${
                                  n.type === "warning" ? "bg-amber-500" :
                                  n.type === "success" ? "bg-emerald-500" :
                                  "bg-blue-500"
                                }`} />
                                <div className="min-w-0">
                                  <p className="text-xs md:text-sm text-slate-700 break-words">{n.message}</p>
                                  <p className="text-[10px] text-slate-400">{n.time}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {step !== "select" && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetDemo}
                  className="text-white hover:bg-white/20 h-7 w-7 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps - Compact on mobile */}
        <div className="px-2 py-2 md:px-6 md:py-4 border-b border-slate-200 bg-white/50">
          <div className="flex items-center justify-between">
            {[
              { full: "Select Type", short: "Select\nType" },
              { full: "Capture & Review", short: "Capture &\nReview" },
              { full: "Checklist", short: "Checklist" },
              { full: "Report", short: "Report" }
            ].map((item, i) => {
              const stepIndex = ["select", "capture", "checklist", "report"].indexOf(step);
              const isActive = i === stepIndex;
              const isCompleted = i < stepIndex;
              
              return (
                <div key={item.full} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-sm font-semibold transition-all ${
                      isCompleted ? "bg-emerald-500 text-white" :
                      isActive ? "bg-orange-500 text-white" :
                      "bg-slate-200 text-slate-500"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> : i + 1}
                    </div>
                    <span className={`text-[9px] md:text-xs mt-0.5 md:mt-1 font-medium text-center whitespace-pre-line leading-tight ${isActive ? "text-orange-600" : "text-slate-500"}`}>
                      {item.short}
                    </span>
                  </div>
                  {i < 3 && (
                    <div className={`w-4 sm:w-12 md:w-20 h-0.5 mx-0.5 md:mx-2 ${
                      isCompleted ? "bg-emerald-500" : "bg-slate-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        {/* Content Area - Reduced padding on mobile */}
        <div className="p-3 md:p-6 min-h-[400px] md:min-h-[500px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Inspection Type */}
            {step === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h4 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">Select Inspection Type</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6">
                  {inspectionTypes.map((type, index) => (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSelectType(type.id)}
                      className={`p-2.5 md:p-4 rounded-xl border-2 transition-all text-left hover:scale-[1.02] ${
                        selectedType === type.id 
                          ? "border-orange-500 bg-orange-50" 
                          : "border-slate-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${type.color} flex items-center justify-center text-white flex-shrink-0`}>
                          {type.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm md:text-base truncate">{type.name}</p>
                          <p className="text-[10px] md:text-xs text-slate-500 truncate">{type.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Project Info */}
                <div className="p-2.5 md:p-4 rounded-xl bg-slate-100 border border-slate-200 mb-3 md:mb-4">
                  <p className="text-xs md:text-sm font-medium text-slate-600 mb-2 md:mb-3 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Project Details
                  </p>
                  <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                    <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                      <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-700 truncate">{projectInfo.projectId}</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                      <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-700 truncate">{projectInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 min-w-0 col-span-2 sm:col-span-1">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-700 text-[10px] md:text-xs truncate">{projectInfo.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                      <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-700 truncate">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Persons Present */}
                <div className="p-2.5 md:p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-xs md:text-sm font-medium text-blue-800 mb-2 md:mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 md:w-4 md:h-4" /> Persons Present
                  </p>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {personsPresent.map((person, i) => (
                      <div key={i} className="px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-white border border-blue-200 text-[10px] md:text-xs">
                        <span className="font-medium text-slate-800">{person.name}</span>
                        <span className="text-slate-500 hidden sm:inline"> • {person.role}</span>
                      </div>
                    ))}
                    <button className="px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-blue-100 border border-blue-300 text-[10px] md:text-xs text-blue-700 hover:bg-blue-200">
                      + Add
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Photo Capture & AI Review */}
            {step === "capture" && (
              <motion.div
                key="capture"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-800">Capture & Review Photos</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{attachedPhotos.length} photos</span>
                    {highSeverityCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        {highSeverityCount} critical
                      </span>
                    )}
                  </div>
                </div>

                {/* Mode Toggle - Compact on mobile */}
                {!selectedPhoto && !showImagePicker && (
                  <div className="flex gap-1.5 md:gap-2 mb-4 flex-wrap">
                    <Button 
                      variant={showCameraMode ? "outline" : "default"}
                      size="sm"
                      onClick={() => { setShowCameraMode(false); setShowImagePicker(true); }}
                      className={`text-xs md:text-sm ${!showCameraMode ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                    >
                      <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Sample Images</span>
                      <span className="sm:hidden">Samples</span>
                    </Button>
                    <Button 
                      variant={showCameraMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowCameraMode(true)}
                      className={`text-xs md:text-sm ${showCameraMode ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                    >
                      <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                      Camera
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs md:text-sm hidden sm:flex">
                      <QrCode className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                      QR
                    </Button>
                  </div>
                )}

                {/* Camera Mode */}
                {showCameraMode && !selectedPhoto && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4"
                  >
                    <div className="relative aspect-video rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center mx-auto mb-3">
                            <Camera className="w-8 h-8 text-white/60" />
                          </div>
                          <p className="text-white/60 text-sm">Camera Preview</p>
                          {isBurstMode && (
                            <motion.p 
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 0.5 }}
                              className="text-orange-400 text-sm mt-2"
                            >
                              Burst: {burstCount} photos
                            </motion.p>
                          )}
                        </div>
                      </div>
                      
                      {/* GPS & Timestamp Overlay */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between">
                        <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                          <span className="text-white text-xs flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> -33.8688, 151.2093
                          </span>
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                          <span className="text-white text-xs flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Burst Mode Indicator */}
                      {isBurstMode && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-red-500/80 backdrop-blur-sm animate-pulse">
                          <span className="text-white text-xs flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-white" /> BURST MODE
                          </span>
                        </div>
                      )}

                      {/* AI Hint */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute bottom-4 left-4 right-4 px-3 py-2 rounded-lg bg-orange-500/90 backdrop-blur-sm"
                      >
                        <span className="text-white text-xs flex items-center gap-1.5">
                          <Zap className="w-3 h-3" /> AI: Point camera at defects for auto-detection
                        </span>
                      </motion.div>
                    </div>

                    {/* Camera Controls */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <Button variant="outline" size="lg" className="rounded-full">
                        <Mic className="w-5 h-5" />
                      </Button>
                      <Button 
                        size="lg" 
                        onClick={() => handleAttachSampleImage(demoPhotos[Math.floor(Math.random() * demoPhotos.length)])}
                        className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 p-0"
                      >
                        <Camera className="w-7 h-7" />
                      </Button>
                      <Button 
                        variant={isBurstMode ? "default" : "outline"}
                        size="lg" 
                        onClick={handleBurstCapture}
                        className={`rounded-full ${isBurstMode ? "bg-red-500 hover:bg-red-600" : ""}`}
                      >
                        {isBurstMode ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-2">
                      Tap center to capture • Hold right button for burst mode
                    </p>
                  </motion.div>
                )}

                {/* Image Picker Modal */}
                <AnimatePresence>
                  {showImagePicker && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                      onClick={() => setShowImagePicker(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"
                      >
                        <h5 className="text-lg font-semibold text-slate-800 mb-2">Select Sample Image</h5>
                        <p className="text-sm text-slate-500 mb-4">Choose an image to demonstrate AI analysis</p>
                        <div className="grid grid-cols-2 gap-3">
                          {demoPhotos.filter(p => !attachedPhotos.find(a => a.id === p.id)).map((photo) => (
                            <button
                              key={photo.id}
                              onClick={() => handleAttachSampleImage(photo)}
                              className="relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-orange-500 transition-all"
                            >
                              <LazyImage 
                                src={photo.src} 
                                alt={photo.label}
                                className="w-full aspect-video object-cover"
                                wrapperClassName="w-full aspect-video"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-3">
                                <span className="text-white font-medium text-sm">{photo.label}</span>
                                <span className="text-white/70 text-xs">{photo.location}</span>
                              </div>
                              {/* Severity indicator */}
                              <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                                photo.aiAnalysis.severity === "high" ? "bg-red-500" :
                                photo.aiAnalysis.severity === "medium" ? "bg-amber-500" :
                                "bg-emerald-500"
                              }`} />
                            </button>
                          ))}
                        </div>
                        {demoPhotos.filter(p => !attachedPhotos.find(a => a.id === p.id)).length === 0 && (
                          <p className="text-center text-slate-500 py-8">All sample images have been attached</p>
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full mt-4"
                          onClick={() => setShowImagePicker(false)}
                        >
                          Cancel
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI Analysis View */}
                {selectedPhoto && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                  >
                    {isAnalyzing ? (
                      <div className="rounded-xl bg-slate-100 p-8 flex flex-col items-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 mb-4"
                        />
                        <h5 className="font-semibold text-slate-800 mb-1">AI Analyzing Image...</h5>
                        <p className="text-sm text-slate-500 mb-3">Detecting issues and categorizing findings</p>
                        <div className="w-48 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <motion.div 
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${analysisProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                        {/* Image with Metadata Watermark */}
                        <div className="relative">
                          <LazyImage 
                            src={selectedPhoto.src} 
                            alt={selectedPhoto.label}
                            className="w-full aspect-video object-cover"
                            wrapperClassName="w-full aspect-video"
                          />
                          {/* Watermark Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <div className="flex items-center justify-between text-white text-xs">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {selectedPhoto.gps}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {selectedPhoto.timestamp}
                                </span>
                              </div>
                              <span className="font-mono">{selectedPhoto.label.replace(/\s/g, '_')}_001.jpg</span>
                            </div>
                          </div>
                          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                            <span className="text-white text-xs font-medium">{selectedPhoto.location}</span>
                          </div>
                          <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full ${
                            selectedPhoto.aiAnalysis.severity === "high" ? "bg-red-500" :
                            selectedPhoto.aiAnalysis.severity === "medium" ? "bg-amber-500" :
                            "bg-blue-500"
                          }`}>
                            <span className="text-white text-xs font-medium uppercase">{selectedPhoto.aiAnalysis.severity} Priority</span>
                          </div>
                        </div>

                        {/* AI Findings */}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                              <Zap className="w-3 h-3 text-orange-600" />
                            </div>
                            <span className="font-semibold text-slate-800">AI Detection</span>
                            <span className="text-xs text-slate-500 ml-auto">{selectedPhoto.aiAnalysis.confidence}% confidence</span>
                          </div>

                          <div className="bg-slate-50 rounded-lg p-3 mb-4">
                            <p className="text-sm font-medium text-slate-700 mb-1">{selectedPhoto.aiAnalysis.detected}</p>
                            <p className="text-sm text-slate-600">
                              {editedFindings[selectedPhoto.id] || selectedPhoto.aiAnalysis.problem}
                            </p>
                          </div>

                          {/* Amendment Input */}
                          <div className="border-t border-slate-200 pt-3 md:pt-4">
                            <p className="text-[10px] md:text-xs font-medium text-slate-500 uppercase mb-2">Correct or Enrich Findings</p>
                            <div className="flex gap-1.5 md:gap-2 mb-2 md:mb-3">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  value={amendmentText}
                                  onChange={(e) => setAmendmentText(e.target.value)}
                                  placeholder="Add note..."
                                  className="w-full px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-slate-200 text-xs md:text-sm focus:outline-none focus:border-orange-500"
                                />
                              </div>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={handleVoiceRecord}
                                className={`h-8 w-8 md:h-9 md:w-9 ${isRecording ? "bg-red-100 border-red-300 text-red-600" : ""}`}
                              >
                                <Mic className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isRecording ? "animate-pulse" : ""}`} />
                              </Button>
                              <Button 
                                size="icon"
                                onClick={handleApplyAmendment}
                                disabled={!amendmentText.trim()}
                                className="bg-orange-500 hover:bg-orange-600 h-8 w-8 md:h-9 md:w-9"
                              >
                                <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </Button>
                            </div>
                            {isRecording && (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[10px] md:text-xs text-red-600 flex items-center gap-1"
                              >
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                Recording...
                              </motion.p>
                            )}
                          </div>

                          {/* Confirm Button */}
                          <div className="flex gap-2 mt-3 md:mt-4">
                            <Button 
                              variant="outline" 
                              className="flex-1 text-xs md:text-sm h-9 md:h-10"
                              onClick={() => setSelectedPhoto(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm h-9 md:h-10"
                              onClick={handleConfirmPhoto}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                              <span className="hidden sm:inline">Confirm & Attach</span>
                              <span className="sm:hidden">Confirm</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Attached Photos with Comments */}
                {attachedPhotos.length > 0 && !selectedPhoto && !showCameraMode && (
                  <div className="mb-4">
                    <p className="text-xs md:text-sm font-medium text-slate-600 mb-2">Attached Photos ({attachedPhotos.length})</p>
                    <div className="space-y-2 md:space-y-3">
                      {attachedPhotos.map((photo, i) => (
                        <motion.div 
                          key={photo.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                        >
                          <div className="flex gap-2 md:gap-4 p-2 md:p-3">
                            <div className="relative flex-shrink-0">
                              <LazyImage 
                                src={photo.src} 
                                alt={photo.label}
                                className="w-16 h-16 md:w-24 md:h-24 rounded-lg object-cover"
                                wrapperClassName="w-16 h-16 md:w-24 md:h-24 rounded-lg"
                              />
                              <div className={`absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center ${
                                photo.aiAnalysis.severity === "high" ? "bg-red-500" :
                                photo.aiAnalysis.severity === "medium" ? "bg-amber-500" :
                                "bg-emerald-500"
                              }`}>
                                {photo.aiAnalysis.severity === "high" || photo.aiAnalysis.severity === "medium" ? (
                                  <AlertTriangle className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                ) : (
                                  <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-800 text-sm md:text-base truncate">{photo.label}</p>
                                  <p className="text-[10px] md:text-xs text-slate-500 truncate">{photo.location} • {photo.timestamp}</p>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] md:text-xs font-medium flex-shrink-0 ${
                                  photo.aiAnalysis.severity === "high" ? "bg-red-100 text-red-700" :
                                  photo.aiAnalysis.severity === "medium" ? "bg-amber-100 text-amber-700" :
                                  "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {photo.aiAnalysis.severity === "high" ? "HIGH" : 
                                   photo.aiAnalysis.severity === "medium" ? "MED" : "LOW"}
                                </span>
                              </div>
                              <p className="text-xs md:text-sm text-slate-600 mt-1 line-clamp-2">
                                {editedFindings[photo.id] || photo.aiAnalysis.problem}
                              </p>
                              
                              {/* Comments */}
                              {photo.comments && photo.comments.length > 0 && (
                                <div className="mt-1.5 md:mt-2 space-y-1">
                                  {photo.comments.map((c, ci) => (
                                    <div key={ci} className="text-[10px] md:text-xs bg-slate-50 rounded px-2 py-1">
                                      <span className="font-medium text-slate-700">{c.user}:</span>{" "}
                                      <span className="text-slate-600">{c.text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Add Comment */}
                              {showCommentInput === photo.id ? (
                                <div className="flex gap-1.5 mt-1.5 md:mt-2">
                                  <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Comment..."
                                    className="flex-1 px-2 py-1 text-[10px] md:text-xs rounded border border-slate-200 focus:outline-none focus:border-orange-500"
                                  />
                                  <Button size="sm" onClick={() => handleAddComment(photo.id)} className="h-6 md:h-7 px-1.5 md:px-2 bg-orange-500 hover:bg-orange-600">
                                    <Send className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setShowCommentInput(photo.id)}
                                  className="flex items-center gap-1 text-[10px] md:text-xs text-orange-600 hover:text-orange-700 mt-1.5 md:mt-2"
                                >
                                  <MessageSquare className="w-2.5 h-2.5 md:w-3 md:h-3" /> Add comment
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                {!selectedPhoto && !showCameraMode && (
                  <div className="flex justify-between gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setShowImagePicker(true); }} className="text-xs md:text-sm">
                      <Upload className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                      Add More
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleContinueToChecklist}
                      disabled={attachedPhotos.length === 0}
                      className="bg-orange-500 hover:bg-orange-600 text-xs md:text-sm"
                    >
                      <span className="hidden sm:inline">Continue to Checklist</span>
                      <span className="sm:hidden">Continue</span>
                      <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Checklist */}
            {step === "checklist" && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
                  <h4 className="text-base md:text-lg font-semibold text-slate-800">Inspection Checklist</h4>
                  <div className="flex gap-1 md:gap-2 flex-wrap justify-end">
                    <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-medium">
                      {checklist.filter(c => c.status === "pass").length} Pass
                    </span>
                    <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-red-100 text-red-700 text-[10px] md:text-xs font-medium">
                      {checklist.filter(c => c.status === "fail").length} Fail
                    </span>
                    <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] md:text-xs font-medium">
                      {checklist.filter(c => c.status === "pending").length} Pending
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                  {checklist.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-2.5 md:p-4 rounded-xl bg-white border border-slate-200 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                            <span className="px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs bg-slate-100 text-slate-600">{item.category}</span>
                          </div>
                          <p className="font-medium text-slate-800 text-sm md:text-base">{item.question}</p>
                          {item.note && (
                            <p className="text-xs md:text-sm text-red-600 mt-1">⚠️ {item.note}</p>
                          )}
                        </div>
                        <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleChecklistUpdate(item.id, "pass")}
                            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                              item.status === "pass" 
                                ? "bg-emerald-500 text-white" 
                                : "bg-slate-100 text-slate-600 hover:bg-emerald-100"
                            }`}
                          >
                            Pass
                          </button>
                          <button
                            onClick={() => handleChecklistUpdate(item.id, "fail")}
                            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                              item.status === "fail" 
                                ? "bg-red-500 text-white" 
                                : "bg-slate-100 text-slate-600 hover:bg-red-100"
                            }`}
                          >
                            Fail
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep("capture")}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleGenerateReport}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Generate Report <FileText className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Report Preview */}
            {step === "report" && (
              <motion.div
                key="report"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-800">Inspection Report</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant={showPDFPreview ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setShowPDFPreview(!showPDFPreview)}
                      className={showPDFPreview ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {showPDFPreview ? "Hide PDF" : "Preview PDF"}
                    </Button>
                    {signatureAdded && (
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center">
                        Signed
                      </span>
                    )}
                    {reportShared && (
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center">
                        Shared
                      </span>
                    )}
                  </div>
                </div>

                {/* PDF Preview Mode */}
                <AnimatePresence mode="wait">
                  {showPDFPreview ? (
                    <motion.div
                      key="pdf-preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4"
                    >
                      <div className="bg-slate-800 px-4 py-3 rounded-t-xl flex items-center justify-between">
                        <span className="text-white font-medium text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Inspection_Report_{projectInfo.projectId}.pdf
                        </span>
                        <Button 
                          size="sm" 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-3 gap-2"
                          onClick={handleDownloadPDF}
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </Button>
                      </div>
                      <PDFReportPreview
                        projectInfo={projectInfo}
                        inspectionType={inspectionTypes.find(t => t.id === selectedType)?.name || "Defect Inspection"}
                        attachedPhotos={attachedPhotos}
                        checklist={checklist}
                        personsPresent={personsPresent}
                        editedFindings={editedFindings}
                        signatureAdded={signatureAdded}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="summary-view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {/* Report Summary Card */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden mb-4">
                        <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
                          <span className="text-white font-medium text-sm">Inspection_Report_{projectInfo.projectId}.pdf</span>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-white hover:bg-white/10 h-7 px-2"
                              onClick={() => setShowPDFPreview(true)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 px-3 gap-1.5"
                              onClick={handleDownloadPDF}
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-4">
                          {/* Report Header */}
                          <div className="pb-4 border-b border-slate-200">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-bold text-slate-800">{inspectionTypes.find(t => t.id === selectedType)?.name || "Defect Inspection"} Report</h5>
                                <p className="text-sm text-slate-500">{projectInfo.name} - {projectInfo.address}</p>
                              </div>
                              <div className="text-right text-xs text-slate-500">
                                <p>{new Date().toLocaleDateString()}</p>
                                <p>{new Date().toLocaleTimeString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* Inspector & Project Info */}
                          <div className="grid grid-cols-2 gap-4 text-sm pb-4 border-b border-slate-200">
                            <div>
                              <p className="text-slate-500 text-xs uppercase mb-1">Inspector</p>
                              <p className="font-medium text-slate-800">{projectInfo.inspector}</p>
                              <p className="text-slate-600">{projectInfo.company}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs uppercase mb-1">Client</p>
                              <p className="font-medium text-slate-800">{projectInfo.client}</p>
                              <p className="text-slate-600">{projectInfo.builder}</p>
                            </div>
                          </div>

                          {/* Summary Stats - Compact labels for mobile */}
                          <div className="grid grid-cols-5 gap-1 md:gap-2">
                            <div className="text-center p-1 md:p-2 rounded-lg bg-slate-50">
                              <p className="text-base md:text-xl font-bold text-slate-800">{attachedPhotos.length || 4}</p>
                              <p className="text-[8px] md:text-[10px] text-slate-500">Photos</p>
                            </div>
                            <div className="text-center p-1 md:p-2 rounded-lg bg-emerald-50">
                              <p className="text-base md:text-xl font-bold text-emerald-600">
                                {checklist.filter(c => c.status === "pass").length}
                              </p>
                              <p className="text-[8px] md:text-[10px] text-slate-500">Pass</p>
                            </div>
                            <div className="text-center p-1 md:p-2 rounded-lg bg-red-50">
                              <p className="text-base md:text-xl font-bold text-red-600">
                                {checklist.filter(c => c.status === "fail").length}
                              </p>
                              <p className="text-[8px] md:text-[10px] text-slate-500">Fail</p>
                            </div>
                            <div className="text-center p-1 md:p-2 rounded-lg bg-amber-50">
                              <p className="text-base md:text-xl font-bold text-amber-600">{highSeverityCount + mediumSeverityCount}</p>
                              <p className="text-[8px] md:text-[10px] text-slate-500">Issues</p>
                            </div>
                            <div className="text-center p-1 md:p-2 rounded-lg bg-slate-50">
                              <p className="text-base md:text-xl font-bold text-slate-600">
                                {attachedPhotos.reduce((acc, p) => acc + (p.comments?.length || 0), 0)}
                              </p>
                              <p className="text-[8px] md:text-[10px] text-slate-500">Notes</p>
                            </div>
                          </div>

                          {/* Photo Thumbnails Preview */}
                          {attachedPhotos.length > 0 && (
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                              <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <Camera className="w-4 h-4" /> Captured Photos
                              </p>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {attachedPhotos.map((photo, i) => (
                                  <div key={photo.id} className="relative flex-shrink-0">
                                    <img 
                                      src={photo.src} 
                                      alt={photo.label}
                                      className="w-20 h-16 object-cover rounded-lg border-2 border-white shadow"
                                    />
                                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${
                                      photo.aiAnalysis.severity === "high" ? "bg-red-500" :
                                      photo.aiAnalysis.severity === "medium" ? "bg-amber-500" :
                                      "bg-blue-500"
                                    }`}>
                                      {i + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* AI Detected Issues */}
                          {attachedPhotos.length > 0 && (
                            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                              <p className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> AI-Detected Issues
                              </p>
                              <ul className="text-sm text-orange-700 space-y-1">
                                {attachedPhotos.map(p => (
                                  <li key={p.id} className="flex items-start gap-2">
                                    <span className={`w-2 h-2 rounded-full mt-1.5 ${
                                      p.aiAnalysis.severity === "high" ? "bg-red-500" :
                                      p.aiAnalysis.severity === "medium" ? "bg-amber-500" :
                                      "bg-blue-500"
                                    }`} />
                                    <span>{p.aiAnalysis.detected} in {p.location} ({p.aiAnalysis.confidence}% confidence)</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Digital Signature */}
                          <div className="p-3 rounded-lg border border-slate-200">
                            <p className="text-xs font-medium text-slate-500 uppercase mb-2">Digital Signature</p>
                            {signatureAdded ? (
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">{projectInfo.inspector}</p>
                                  <p className="text-xs text-slate-500">Signed {new Date().toLocaleString()}</p>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setSignatureAdded(true);
                                  addNotification("success", "Report signed successfully");
                                }}
                                className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-orange-400 hover:text-orange-600 transition-colors"
                              >
                                <Pencil className="w-5 h-5 mx-auto mb-1" />
                                <span className="text-sm">Tap to sign</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Download & Share Options - Compact on mobile */}
                <div className="mb-3 md:mb-4">
                  {/* Prominent Download Button */}
                  <Button 
                    onClick={handleDownloadPDF}
                    className="w-full mb-2 md:mb-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-4 md:py-6 text-sm md:text-base font-semibold shadow-lg shadow-emerald-500/25"
                  >
                    <Download className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                    Download PDF Report
                  </Button>
                  
                  {/* Share Options Grid */}
                  <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                    <Button 
                      variant={showPDFPreview ? "default" : "outline"} 
                      className={`flex-col h-auto py-2 md:py-3 ${showPDFPreview ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                      onClick={() => setShowPDFPreview(!showPDFPreview)}
                    >
                      <FileText className="w-4 h-4 md:w-5 md:h-5 mb-0.5 md:mb-1" />
                      <span className="text-[9px] md:text-xs">{showPDFPreview ? "Hide" : "Preview"}</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-auto py-2 md:py-3" onClick={() => setShowShareModal(true)}>
                      <Mail className="w-4 h-4 md:w-5 md:h-5 mb-0.5 md:mb-1" />
                      <span className="text-[9px] md:text-xs">Email</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-auto py-2 md:py-3" onClick={() => handleShareReport("Procore")}>
                      <Building2 className="w-4 h-4 md:w-5 md:h-5 mb-0.5 md:mb-1" />
                      <span className="text-[9px] md:text-xs">Procore</span>
                    </Button>
                    <Button variant="outline" className="flex-col h-auto py-2 md:py-3" onClick={() => handleShareReport("Link")}>
                      <Link2 className="w-4 h-4 md:w-5 md:h-5 mb-0.5 md:mb-1" />
                      <span className="text-[9px] md:text-xs">Link</span>
                    </Button>
                  </div>
                </div>

                {/* Share Modal */}
                <AnimatePresence>
                  {showShareModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                      onClick={() => setShowShareModal(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl p-4 md:p-6 max-w-sm w-full shadow-2xl"
                      >
                        <h5 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">Share Report</h5>
                        <div className="space-y-2 md:space-y-3">
                          {personsPresent.map((person, i) => (
                            <label key={i} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                              <input type="checkbox" defaultChecked className="rounded w-3.5 h-3.5 md:w-4 md:h-4" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 text-xs md:text-sm truncate">{person.name}</p>
                                <p className="text-[10px] md:text-xs text-slate-500 truncate">{person.role}</p>
                              </div>
                              <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 flex-shrink-0" />
                            </label>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-3 md:mt-4">
                          <Button variant="outline" className="flex-1 text-xs md:text-sm h-8 md:h-10" onClick={() => setShowShareModal(false)}>
                            Cancel
                          </Button>
                          <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-xs md:text-sm h-8 md:h-10" onClick={() => handleShareReport("Email")}>
                            <Send className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
                            Send
                          </Button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStep("checklist")} className="text-xs md:text-sm">
                    Back
                  </Button>
                  <Button 
                    size="sm"
                    onClick={resetDemo}
                    disabled={!signatureAdded}
                    className="bg-emerald-500 hover:bg-emerald-600 text-xs md:text-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                    <span className="hidden sm:inline">Complete Inspection</span>
                    <span className="sm:hidden">Complete</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
