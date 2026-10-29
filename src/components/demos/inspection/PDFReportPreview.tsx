import { useState } from "react";
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Hash,
  FileText,
  Shield,
  Camera,
  Zap,
  XCircle,
  Users
} from "lucide-react";

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

type ChecklistItem = {
  id: string;
  question: string;
  status: "pass" | "fail" | "pending";
  note?: string;
  category: string;
};

type PersonPresent = {
  name: string;
  role: string;
  company: string;
};

type ProjectInfo = {
  name: string;
  address: string;
  client: string;
  builder: string;
  inspector: string;
  company: string;
  milestone: string;
  projectId: string;
};

interface PDFReportPreviewProps {
  projectInfo: ProjectInfo;
  inspectionType: string;
  attachedPhotos: DemoPhoto[];
  checklist: ChecklistItem[];
  personsPresent: PersonPresent[];
  editedFindings: Record<string, string>;
  signatureAdded: boolean;
  contentId?: string;
}

export default function PDFReportPreview({
  projectInfo,
  inspectionType,
  attachedPhotos,
  checklist,
  personsPresent,
  editedFindings,
  signatureAdded,
  contentId = "pdf-report-content"
}: PDFReportPreviewProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const passedCount = checklist.filter(c => c.status === "pass").length;
  const failedCount = checklist.filter(c => c.status === "fail").length;
  const pendingCount = checklist.filter(c => c.status === "pending").length;
  const highSeverityCount = attachedPhotos.filter(p => p.aiAnalysis.severity === "high").length;
  const mediumSeverityCount = attachedPhotos.filter(p => p.aiAnalysis.severity === "medium").length;
  const lowSeverityCount = attachedPhotos.filter(p => p.aiAnalysis.severity === "low").length;

  const handleImageError = (photoId: string) => {
    setImageErrors(prev => ({ ...prev, [photoId]: true }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-500";
      case "medium": return "bg-amber-500";
      case "low": return "bg-blue-500";
      default: return "bg-slate-500";
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-50 border-red-200";
      case "medium": return "bg-amber-50 border-amber-200";
      case "low": return "bg-blue-50 border-blue-200";
      default: return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-inner border border-slate-300 max-h-[600px] overflow-y-auto">
      <div id={contentId} className="p-6 space-y-6 bg-white" style={{ fontFamily: "'Times New Roman', serif" }}>
        
        {/* Page 1: Cover & Summary */}
        <div className="space-y-6">
          {/* Header with Logo Area */}
          <div className="flex items-start justify-between border-b-2 border-orange-500 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{projectInfo.company}</h1>
                  <p className="text-xs text-slate-500">Building Inspection Services</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Report ID</p>
              <p className="font-mono font-bold text-slate-800">INS-{projectInfo.projectId}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date().toLocaleDateString('en-AU', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>

          {/* Report Title */}
          <div className="text-center py-6 bg-gradient-to-r from-slate-50 to-orange-50 rounded-lg border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              {inspectionType || "Defect Inspection"} Report
            </h2>
            <p className="text-lg text-orange-600 font-semibold">{projectInfo.name}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4" />
              <span>{projectInfo.address}</span>
            </div>
          </div>

          {/* Project Information Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Project Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Project ID:</span>
                  <span className="font-medium text-slate-800">{projectInfo.projectId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-medium text-slate-800">{projectInfo.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Builder:</span>
                  <span className="font-medium text-slate-800">{projectInfo.builder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Milestone:</span>
                  <span className="font-medium text-slate-800">{projectInfo.milestone}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Inspection Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Inspector:</span>
                  <span className="font-medium text-slate-800">{projectInfo.inspector}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Company:</span>
                  <span className="font-medium text-slate-800">{projectInfo.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-medium text-slate-800">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time:</span>
                  <span className="font-medium text-slate-800">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Persons Present */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Persons Present During Inspection
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {personsPresent.map((person, i) => (
                <div key={i} className="p-3 bg-white rounded border border-slate-200">
                  <p className="font-medium text-slate-800 text-sm">{person.name}</p>
                  <p className="text-xs text-slate-500">{person.role}</p>
                  <p className="text-xs text-orange-600">{person.company}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Executive Summary
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Camera className="w-4 h-4 text-slate-600" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{attachedPhotos.length || 4}</p>
                <p className="text-xs text-slate-500">Photos Captured</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-emerald-600">{passedCount}</p>
                <p className="text-xs text-slate-500">Items Passed</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-red-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{failedCount}</p>
                <p className="text-xs text-slate-500">Items Failed</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-amber-200">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-slate-500">Pending Review</p>
              </div>
            </div>
            
            {/* AI Detection Summary */}
            <div className="p-3 bg-white rounded border border-orange-200">
              <p className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> AI-Detected Issues Summary
              </p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-slate-600">{highSeverityCount} High Severity</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600">{mediumSeverityCount} Medium</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-slate-600">{lowSeverityCount} Low</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Divider */}
        <div className="border-t-2 border-dashed border-slate-300 my-6 relative">
          <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-xs text-slate-400">Page 2</span>
        </div>

        {/* Page 2: Photo Documentation */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Camera className="w-5 h-5 text-orange-500" /> Photo Documentation & AI Analysis
          </h3>

          {(attachedPhotos.length > 0 ? attachedPhotos : [
            {
              id: "demo1",
              src: "/inspection-crack.jpg",
              label: "Wall Crack",
              location: "Level 2 - Bathroom",
              timestamp: new Date().toLocaleTimeString(),
              gps: "-33.8688, 151.2093",
              aiAnalysis: {
                detected: "Structural crack in concrete wall",
                problem: "Hairline crack detected running vertically through wall panel. Potential water ingress point.",
                severity: "high" as const,
                confidence: 94
              },
              comments: [{ user: "John Smith", text: "Recommend structural assessment", time: "10:45 AM" }]
            },
            {
              id: "demo2",
              src: "/inspection-waterproofing.jpg",
              label: "Waterproofing",
              location: "Level 1 - Bathroom",
              timestamp: new Date().toLocaleTimeString(),
              gps: "-33.8689, 151.2094",
              aiAnalysis: {
                detected: "Bathroom waterproofing membrane",
                problem: "Waterproofing membrane appears correctly installed. Minor discoloration near drain.",
                severity: "low" as const,
                confidence: 82
              },
              comments: []
            }
          ]).map((photo, index) => (
            <div key={photo.id} className={`p-4 rounded-lg border ${getSeverityBgColor(photo.aiAnalysis.severity)}`}>
              <div className="flex gap-4">
                {/* Photo Thumbnail */}
                <div className="w-48 flex-shrink-0">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-white shadow-md bg-slate-200">
                    {!imageErrors[photo.id] ? (
                      <img 
                        src={photo.src} 
                        alt={photo.label}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(photo.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <span className="text-slate-400 text-xs">Image {index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{photo.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{photo.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      <span className="font-mono text-[10px]">{photo.gps}</span>
                    </div>
                  </div>
                </div>

                {/* Photo Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">
                        Photo {index + 1}: {photo.label}
                      </h4>
                      <p className="text-sm text-slate-600">{photo.aiAnalysis.detected}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${getSeverityColor(photo.aiAnalysis.severity)} text-white text-xs font-bold uppercase`}>
                      {photo.aiAnalysis.severity} Priority
                    </div>
                  </div>

                  {/* AI Analysis Box */}
                  <div className="p-3 bg-white rounded border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-semibold text-orange-600">AI Analysis ({photo.aiAnalysis.confidence}% confidence)</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {editedFindings[photo.id] || photo.aiAnalysis.problem}
                    </p>
                  </div>

                  {/* Inspector Comments */}
                  {photo.comments && photo.comments.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 mb-2">Inspector Comments</p>
                      {photo.comments.map((comment, ci) => (
                        <div key={ci} className="text-sm text-slate-700">
                          <span className="font-medium">{comment.user}:</span> {comment.text}
                          <span className="text-xs text-slate-400 ml-2">({comment.time})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className={`w-4 h-4 ${
                      photo.aiAnalysis.severity === "high" ? "text-red-500" :
                      photo.aiAnalysis.severity === "medium" ? "text-amber-500" :
                      "text-blue-500"
                    }`} />
                    <span className="text-slate-600">
                      <strong>Recommendation:</strong> {
                        photo.aiAnalysis.severity === "high" 
                          ? "Immediate attention required. Schedule rectification within 48 hours."
                          : photo.aiAnalysis.severity === "medium"
                          ? "Address before next milestone. Schedule within 1 week."
                          : "Monitor during next inspection. No immediate action required."
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Page Divider */}
        <div className="border-t-2 border-dashed border-slate-300 my-6 relative">
          <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-xs text-slate-400">Page 3</span>
        </div>

        {/* Page 3: Checklist Results */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-orange-500" /> Inspection Checklist Results
          </h3>

          {/* Group by category */}
          {Array.from(new Set(checklist.map(c => c.category))).map(category => (
            <div key={category} className="space-y-2">
              <h4 className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded">
                {category}
              </h4>
              {checklist.filter(c => c.category === category).map((item) => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded border ${
                    item.status === "pass" ? "bg-emerald-50 border-emerald-200" :
                    item.status === "fail" ? "bg-red-50 border-red-200" :
                    "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-slate-800">{item.question}</p>
                      {item.note && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {item.note}
                        </p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      item.status === "pass" ? "bg-emerald-500 text-white" :
                      item.status === "fail" ? "bg-red-500 text-white" :
                      "bg-slate-400 text-white"
                    }`}>
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Page Divider */}
        <div className="border-t-2 border-dashed border-slate-300 my-6 relative">
          <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-xs text-slate-400">Page 4</span>
        </div>

        {/* Page 4: Signature & Certification */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" /> Certification & Sign-off
          </h3>

          {/* Disclaimer */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Disclaimer & Scope</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              This inspection report represents the findings observed at the time of inspection. The inspection 
              was conducted in accordance with applicable building codes and standards. Areas that were 
              inaccessible, covered, or concealed were not inspected. This report does not constitute a 
              warranty or guarantee regarding the condition of the property or the performance of any 
              systems or components.
            </p>
          </div>

          {/* Signature Block */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 border-2 border-slate-300 rounded-lg">
              <p className="text-xs font-bold text-slate-500 uppercase mb-4">Lead Inspector</p>
              {signatureAdded ? (
                <div className="space-y-2">
                  <div className="h-16 flex items-center justify-center border-b-2 border-slate-800">
                    <span className="text-2xl italic text-slate-700" style={{ fontFamily: 'cursive' }}>
                      {projectInfo.inspector}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{projectInfo.inspector}</p>
                  <p className="text-xs text-slate-500">{projectInfo.company}</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Digitally signed on {new Date().toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="h-24 border-2 border-dashed border-slate-300 rounded flex items-center justify-center">
                  <span className="text-sm text-slate-400">Signature Pending</span>
                </div>
              )}
            </div>

            <div className="p-4 border-2 border-slate-300 rounded-lg">
              <p className="text-xs font-bold text-slate-500 uppercase mb-4">Site Supervisor Acknowledgment</p>
              <div className="h-24 border-2 border-dashed border-slate-300 rounded flex items-center justify-center">
                <span className="text-sm text-slate-400">Pending Client Sign-off</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Report generated by alfred ai Inspection Platform • {new Date().toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Document ID: INS-{projectInfo.projectId}-{Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
