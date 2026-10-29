import { lazy, Suspense, useEffect, memo, useCallback, useState } from "react";
import ContactsAdmin from '@/pages/admin/contacts/ContactsAdmin';
import ContactRecordPage from '@/pages/admin/contacts/ContactRecordPage';
import { useWebVitals } from "@/hooks/useWebVitals";
import { captureUTMParams } from "@/lib/utmTracking";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "next-themes";
import ScrollToTopOnNavigate from "./components/ScrollToTopOnNavigate";
import SubpageBackButton from "./components/navigation/SubpageBackButton";
import AlfredIntelligenceLoader from "./components/loading/AlfredIntelligenceLoader";
import { setPageLoading, pageLoadingStore } from "./lib/pageLoading";
import { ChatProvider } from "./contexts/ChatProvider";
import { useChatContext } from "./contexts/ChatContext";
import { AdminAuthProvider } from "./contexts/AdminAuthProvider";
import { UserAuthProvider } from "./contexts/UserAuthProvider";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load all pages for better initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetailPage = lazy(() => import("./pages/products/ProductDetailPage"));
const AxiomPage = lazy(() => import("./pages/products/AxiomPage"));
const ButlerPage = lazy(() => import("./pages/products/ButlerPage"));
const WatchPage = lazy(() => import("./pages/products/WatchPage"));
const OmegaPage = lazy(() => import("./pages/products/OmegaPage"));
const EVAPage = lazy(() => import("./pages/products/EVAPage"));
const AOSPage = lazy(() => import("./pages/products/AOSPage"));
const UseCasesIndex = lazy(() => import("./pages/products/UseCasesIndex"));
const UseCaseDetail = lazy(() => import("./pages/products/UseCaseDetail"));
const Solutions = lazy(() => import("./pages/Solutions"));
const ConstructionEstimatingSoftware = lazy(() => import("./pages/solutions/ConstructionEstimatingSoftware"));
const EmailPresendIntelligence = lazy(() => import("./pages/solutions/EmailPresendIntelligence"));
const AiForConstruction = lazy(() => import("./pages/solutions/AiForConstruction"));
const BestAiForConstruction = lazy(() => import("./pages/solutions/learn/BestAiForConstruction"));
const AiConstructionEstimating = lazy(() => import("./pages/solutions/learn/AiConstructionEstimating"));
const ConstructionAiSoftwareOperations = lazy(() => import("./pages/solutions/learn/ConstructionAiSoftwareOperations"));
const ConstructionProjectManagementSoftware = lazy(() => import("./pages/solutions/ConstructionProjectManagementSoftware"));
const ImpactStudies = lazy(() => import("./pages/ImpactStudies"));
const CaseStudiesPage = lazy(() => import("./pages/impact/CaseStudiesPage"));
const ROIBreakdownsPage = lazy(() => import("./pages/impact/ROIBreakdownsPage"));
const TestimonialsPage = lazy(() => import("./pages/impact/TestimonialsPage"));
const ReduceAdminPage = lazy(() => import("./pages/impact/ReduceAdminPage"));
const RevenuePerHeadPage = lazy(() => import("./pages/impact/RevenuePerHeadPage"));
const ExecutionPage = lazy(() => import("./pages/impact/ExecutionPage"));
const ScaleWithoutHiringPage = lazy(() => import("./pages/impact/ScaleWithoutHiringPage"));
const Resources = lazy(() => import("./pages/Resources"));
const DemosPage = lazy(() => import("./pages/resources/DemosPage"));
const WebinarsPage = lazy(() => import("./pages/resources/WebinarsPage"));
const WebinarAgenticPage = lazy(() => import("./pages/resources/webinar-agentic/WebinarAgenticPage"));
const GuidesPage = lazy(() => import("./pages/resources/GuidesPage"));
const GuideDetailPage = lazy(() => import("./pages/resources/GuideDetailPage"));
const AutomatingConstructionTakeoffs = lazy(() => import("./pages/resources/guides/AutomatingConstructionTakeoffs"));
const AiForConstructionProjectManagement = lazy(() => import("./pages/resources/guides/AiForConstructionProjectManagement"));

const BlogPage = lazy(() => import("./pages/resources/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/resources/BlogPostPage"));
const Explained = lazy(() => import("./pages/Explained"));
const ExplainedDetail = lazy(() => import("./pages/ExplainedDetail"));
const DIYQuotePage = lazy(() => import("./pages/explained/DIYQuotePage"));
const ProposalPage = lazy(() => import("./pages/ProposalPage"));
const ProposalSSAPage = lazy(() => import("./pages/ProposalSSAPage"));
const PaymentThankYou = lazy(() => import("./pages/PaymentThankYou"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const Signup = lazy(() => import("./pages/Signup"));
const VoiceDemo = lazy(() => import("./pages/VoiceDemo"));
const PersonalizedResults = lazy(() => import("./pages/PersonalizedResults"));
const Auth = lazy(() => import("./pages/Auth"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ShortLinkRedirect = lazy(() => import("./pages/ShortLinkRedirect"));

// Compare pages
const ComparePage = lazy(() => import("./pages/compare"));
const VsMonday = lazy(() => import("./pages/compare/VsMonday"));
const VsNotion = lazy(() => import("./pages/compare/VsNotion"));
const VsAsana = lazy(() => import("./pages/compare/VsAsana"));
const VsClickup = lazy(() => import("./pages/compare/VsClickup"));
const VsZapier = lazy(() => import("./pages/compare/VsZapier"));
const VsMake = lazy(() => import("./pages/compare/VsMake"));
const VsN8n = lazy(() => import("./pages/compare/VsN8n"));

const VsPipedrive = lazy(() => import("./pages/compare/VsPipedrive"));
const VsGoHighLevel = lazy(() => import("./pages/compare/VsGoHighLevel"));
const VsProcore = lazy(() => import("./pages/compare/VsProcore"));
const VsProcurePro = lazy(() => import("./pages/compare/VsProcurePro"));
const VsConstructionEnterprise = lazy(() => import("./pages/compare/VsConstructionEnterprise"));
const VsConstructionBuilders = lazy(() => import("./pages/compare/VsConstructionBuilders"));
const VsBuildpass = lazy(() => import("./pages/compare/VsBuildpass"));
const VsJobber = lazy(() => import("./pages/compare/VsJobber"));
const VsChatGPT = lazy(() => import("./pages/compare/VsChatGPT"));
const VsClaude = lazy(() => import("./pages/compare/VsClaude"));

// Company pages
const AboutPage = lazy(() => import("./pages/company/AboutPage"));
const CareersPage = lazy(() => import("./pages/company/CareersPage"));
const PressPage = lazy(() => import("./pages/company/PressPage"));
const PartnersPage = lazy(() => import("./pages/company/PartnersPage"));
const PartnerPortal = lazy(() => import("./pages/partners/portal/PartnerPortal"));
const InvestorsPage = lazy(() => import("./pages/company/InvestorsPage"));

// Help pages
const ContactPage = lazy(() => import("./pages/ContactPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const BookDemoPage = lazy(() => import("./pages/BookDemoPage"));
const BookPage = lazy(() => import("./pages/BookPage"));
const BookingConfirmationPage = lazy(() => import("./pages/BookingConfirmationPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const DocumentationPage = lazy(() => import("./pages/DocumentationPage"));
const DocumentationDetailPage = lazy(() => import("./pages/DocumentationDetailPage"));
const SitemapPage = lazy(() => import("./pages/SitemapPage"));

// Legal pages
const PrivacyPolicyPage = lazy(() => import("./pages/legal/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/legal/TermsOfServicePage"));
const TrustCenterPage = lazy(() => import("./pages/legal/TrustCenterPage"));
const ServicesAgreementPage = lazy(() => import("./pages/legal/ServicesAgreementPage"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ResetPassword = lazy(() => import("./pages/admin/ResetPassword"));
const WebinarsAdmin = lazy(() => import("./pages/admin/content/WebinarsAdmin"));
const GuidesAdmin = lazy(() => import("./pages/admin/content/GuidesAdmin"));
const BlogAdmin = lazy(() => import("./pages/admin/content/BlogAdmin"));
const TestimonialsAdmin = lazy(() => import("./pages/admin/content/TestimonialsAdmin"));
const FAQsAdmin = lazy(() => import("./pages/admin/content/FAQsAdmin"));
const DocsAdmin = lazy(() => import("./pages/admin/content/DocsAdmin"));
const JobsAdmin = lazy(() => import("./pages/admin/content/JobsAdmin"));
const UsersAdmin = lazy(() => import("./pages/admin/settings/UsersAdmin"));
const ScheduledJobsAdmin = lazy(() => import("./pages/admin/settings/ScheduledJobsAdmin"));
const KeywordTrackingAdmin = lazy(() => import("./pages/admin/settings/KeywordTrackingAdmin"));
const UserSettingsAdmin = lazy(() => import("./pages/admin/settings/UserSettingsAdmin"));
const ActivityCombinedAdmin = lazy(() => import("./pages/admin/settings/ActivityCombinedAdmin"));
const EmailsCombinedAdmin = lazy(() => import("./pages/admin/settings/EmailsCombinedAdmin"));
const NewsletterSubscribersAdmin = lazy(() => import("./pages/admin/settings/NewsletterSubscribersAdmin"));
const AcceptInvite = lazy(() => import("./pages/admin/AcceptInvite"));
const LeadsInbox = lazy(() => import("./pages/admin/content/UnifiedLeadsInbox"));
const LeadsBookedAdmin = lazy(() => import("./pages/admin/content/LeadsBookedAdmin"));
const LeadDetailPage = lazy(() => import("./pages/admin/leads/LeadRecordRoute"));

const InvestorLeadsAdmin = lazy(() => import("./pages/admin/content/InvestorLeadsAdmin"));
const MeetingsAdmin = lazy(() => import("./pages/admin/content/MeetingsAdmin"));
const DiscoveryMeetingsAdmin = lazy(() => import("./pages/admin/content/DiscoveryMeetingsAdmin"));
const SolutionMeetingsAdmin = lazy(() => import("./pages/admin/content/SolutionMeetingsAdmin"));
const PersonalCalendarsMeetingsAdmin = lazy(() => import("./pages/admin/content/PersonalCalendarsMeetingsAdmin"));
const GHLSubmissionsAdmin = lazy(() => import("./pages/admin/content/GHLSubmissionsAdmin"));
const GHLSyncStatusAdmin = lazy(() => import("./pages/admin/content/GHLSyncStatusAdmin"));
const SystemHealthAdmin = lazy(() => import("./pages/admin/content/SystemHealthAdmin"));
const AnalyticsDashboard = lazy(() => import("./pages/admin/content/AnalyticsDashboard"));
const BounceDashboard = lazy(() => import("./pages/admin/content/BounceDashboard"));
const SalesFiguresAdmin = lazy(() => import("./pages/admin/content/SalesFiguresAdmin"));
const QuotesAdmin = lazy(() => import("./pages/admin/content/QuotesAdmin"));
const DataTidyUpAdmin = lazy(() => import("./pages/admin/content/DataTidyUpAdmin"));
const DemoLeadsAdmin = lazy(() => import("./pages/admin/content/DemoLeadsAdmin"));
const WebinarLeadsAdmin = lazy(() => import("./pages/admin/content/WebinarLeadsAdmin"));
const AlphaDigitalLeadsAdmin = lazy(() => import("./pages/admin/content/AlphaDigitalLeadsAdmin"));
const MetaLeadsAdmin = lazy(() => import("./pages/admin/content/MetaLeadsAdmin"));
const B2BMatchmakingLeadsAdmin = lazy(() => import("./pages/admin/content/B2BMatchmakingLeadsAdmin"));
const ArchivedLeadsAdmin = lazy(() => import("./pages/admin/content/ArchivedLeadsAdmin"));

const WebhookLogsAdmin = lazy(() => import("./pages/admin/content/WebhookLogsAdmin"));
const JobApplicationsAdmin = lazy(() => import("./pages/admin/content/JobApplicationsAdmin"));
const SystemCombinedAdmin = lazy(() => import("./pages/admin/settings/SystemCombinedAdmin"));
const ConnectorsAdmin = lazy(() => import("./pages/admin/settings/ConnectorsAdmin"));
const SearchAnalyticsAdmin = lazy(() => import("./pages/admin/settings/SearchAnalyticsAdmin"));
const ThemeSettingsAdmin = lazy(() => import("./pages/admin/settings/ThemeSettingsAdmin"));
const ExportRequestsAdmin = lazy(() => import("./pages/admin/settings/ExportRequestsAdmin"));
const BlogApiAdmin = lazy(() => import("./pages/admin/settings/BlogApiAdmin"));
const HandoverQueueAdmin = lazy(() => import("./pages/admin/content/HandoverQueueAdmin"));
const DocumentsAdmin = lazy(() => import("./pages/admin/content/DocumentsAdmin"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const PurchaseBillDemoPage = lazy(() => import("./pages/PurchaseBillDemoPage"));
const TechnicalReportDemoPage = lazy(() => import("./pages/TechnicalReportDemoPage"));
const VendorComplianceDemoPage = lazy(() => import("./pages/VendorComplianceDemoPage"));
const DrawingsToEstimateDemoPage = lazy(() => import("./pages/AiTakeoffDemoPage"));
const TradesPlatformAdsDemoPage = lazy(() => import("./pages/TradesPlatformAdsDemoPage"));
const GenericDemoPage = lazy(() => import("./pages/GenericDemoPage"));

// Lazy load heavy global components
// Single source of truth for where the assistant exists — see src/lib/chatRoutes.ts
import { isChatAvailable } from '@/lib/chatRoutes';
const ChatAssistant = lazy(() => import("./components/chat/ChatAssistant"));
const BookingChatModal = lazy(() => import("./components/BookingChatModal"));
const CommandPalette = lazy(() => import("./components/CommandPalette"));
const ScrollToTop = lazy(() => import("./components/mobile/ScrollToTop"));

const UpdateNotification = lazy(() => import("./components/UpdateNotification"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// v2 "From Information to Intelligence" loading transition — see
// src/components/loading/AlfredIntelligenceLoader.tsx. Memoized to prevent
// re-renders; signals the shell so the back button hides while it is up.
// The Suspense fallback only signals; LoaderOverlay (always mounted) does the
// drawing so it can stay up for a minimum time and fade into the new page.
const PageLoader = memo(() => {
  useEffect(() => {
    setPageLoading(true);
    return () => setPageLoading(false);
  }, []);
  return null;
});

const LOADER_MIN_MS = 2000;
const LOADER_FADE_MS = 500;

const LoaderOverlay = memo(() => {
  const [phase, setPhase] = useState<'hidden' | 'shown' | 'fading'>('hidden');
  useEffect(() => {
    let shownAt = 0;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      clearTimeout(holdTimer);
      clearTimeout(fadeTimer);
      if (pageLoadingStore.get()) {
        if (!shownAt) shownAt = Date.now();
        setPhase('shown');
      } else if (shownAt) {
        const wait = Math.max(0, LOADER_MIN_MS - (Date.now() - shownAt));
        holdTimer = setTimeout(() => {
          setPhase('fading');
          fadeTimer = setTimeout(() => {
            shownAt = 0;
            setPhase('hidden');
          }, LOADER_FADE_MS);
        }, wait);
      }
    };
    sync();
    const unsub = pageLoadingStore.subscribe(sync);
    return () => {
      unsub();
      clearTimeout(holdTimer);
      clearTimeout(fadeTimer);
    };
  }, []);

  if (phase === 'hidden') return null;
  return (
    <div
      className="fixed inset-0 z-[60] bg-background flex items-center justify-center px-6 overflow-hidden transition-opacity ease-out motion-reduce:transition-none"
      style={{ opacity: phase === 'fading' ? 0 : 1, transitionDuration: `${LOADER_FADE_MS}ms`, pointerEvents: phase === 'fading' ? 'none' : 'auto' }}
      role="status"
      aria-label="Loading page"
    >
      <AlfredIntelligenceLoader done={phase === 'fading'} />
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
});
LoaderOverlay.displayName = 'LoaderOverlay';

PageLoader.displayName = 'PageLoader';

// Inner component that uses the chat context - memoized for performance
const AppContent = memo(() => {
  // toggleAssistant and openBooking were dropped from this destructure on
  // 26 Aug: MobileBottomNav was the only caller and it was removed on 25 Aug,
  // leaving them bound and unused. no-unused-vars is off in this project, so
  // nothing would have said so.
  const { activeChat, bookingSource, openAssistant, closeAssistant, closeBooking } = useChatContext();
  const location = useLocation();
  const { setTheme } = useTheme();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isInvestorsRoute = location.pathname === '/investors';
  const isDiyQuoteRoute = location.pathname === '/explained/pricing/diy-quote';
  const isDemoRoute = location.pathname.startsWith('/demos/');
  const isProposalRoute = location.pathname.startsWith('/proposal/');
  const isBookRoute = location.pathname === '/book';
  const isIsolatedRoute = location.pathname === '/resources/webinars/agenticbusiness';
  const isPartnerPortalRoute = location.pathname.startsWith('/partners/portal');

  
  // Defer non-critical global components until after initial paint
  const [globalsReady, setGlobalsReady] = useState(false);
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(() => setGlobalsReady(true), { timeout: 3000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const t = setTimeout(() => setGlobalsReady(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);
  
  // Track Core Web Vitals (only on non-admin routes) — deferred to not block paint
  useWebVitals(!isAdminRoute);

  // Capture UTM params on first load (once per session)
  useEffect(() => {
    captureUTMParams();
  }, []);
  
  // Force light mode on non-admin routes
  useEffect(() => {
    if (!isAdminRoute) {
      setTheme('light');
    }
  }, [isAdminRoute, setTheme]);

  // Memoized callbacks for chat components
  const handleAssistantOpenChange = useCallback((open: boolean) => {
    if (open) openAssistant();
    else closeAssistant();
  }, [openAssistant, closeAssistant]);
  
  return (
    <>
      <ScrollToTopOnNavigate />
      <SubpageBackButton />
      <LoaderOverlay />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/axiom" element={<AxiomPage />} />
          <Route path="/products/butler" element={<ButlerPage />} />
          <Route path="/products/watch" element={<WatchPage />} />
          <Route path="/products/omega" element={<OmegaPage />} />
          <Route path="/products/reo" element={<Navigate to="/products/omega" replace />} />
          <Route path="/products/eva" element={<EVAPage />} />
          <Route path="/products/aos" element={<AOSPage />} />
          <Route path="/products/accountable-os" element={<AOSPage />} />
          <Route path="/products/use-cases" element={<UseCasesIndex />} />
          <Route path="/products/use-cases/:useCaseId" element={<UseCaseDetail />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/ai-construction-takeoff" element={<ConstructionEstimatingSoftware />} />
          <Route path="/solutions/ai-takeoff" element={<ConstructionEstimatingSoftware />} />
          <Route path="/solutions/email-presend-intelligence" element={<EmailPresendIntelligence />} />
          <Route path="/solutions/construction-estimating-software" element={<Navigate to="/solutions/ai-takeoff" replace />} />
          <Route path="/solutions/ai-for-construction" element={<AiForConstruction />} />
          <Route path="/solutions/ai-for-construction/best-ai-for-construction" element={<BestAiForConstruction />} />
          <Route path="/solutions/ai-for-construction/estimating" element={<AiConstructionEstimating />} />
          <Route path="/solutions/ai-for-construction/operations" element={<ConstructionAiSoftwareOperations />} />
          <Route path="/solutions/construction-project-management-software" element={<ConstructionProjectManagementSoftware />} />
          <Route path="/impact-studies" element={<ImpactStudies />} />
          <Route path="/impact-studies/case-studies" element={<CaseStudiesPage />} />
          <Route path="/impact-studies/roi-breakdowns" element={<ROIBreakdownsPage />} />
          <Route path="/impact-studies/testimonials" element={<TestimonialsPage />} />
          <Route path="/impact-studies/reduce-admin" element={<ReduceAdminPage />} />
          <Route path="/impact-studies/revenue-per-head" element={<RevenuePerHeadPage />} />
          <Route path="/impact-studies/execution" element={<ExecutionPage />} />
          <Route path="/impact-studies/scale-without-hiring" element={<ScaleWithoutHiringPage />} />
          <Route path="/roi-calculator" element={<Navigate to="/impact-studies" replace />} />
          {/* Legacy impact routes - redirect to new paths */}
          <Route path="/impact/case-studies" element={<Navigate to="/impact-studies/case-studies" replace />} />
          <Route path="/impact/roi-breakdowns" element={<Navigate to="/impact-studies/roi-breakdowns" replace />} />
          <Route path="/impact/reduce-admin" element={<Navigate to="/impact-studies/reduce-admin" replace />} />
          <Route path="/impact/scale-without-hiring" element={<Navigate to="/impact-studies/scale-without-hiring" replace />} />
          <Route path="/impact/revenue-per-head" element={<Navigate to="/impact-studies/revenue-per-head" replace />} />
          <Route path="/impact/execution" element={<Navigate to="/impact-studies/execution" replace />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/resources/demos" element={<DemosPage />} />
          <Route path="/resources/demos/:demoId" element={<DemosPage />} />
          <Route path="/resources/webinars/agenticbusiness" element={<WebinarAgenticPage />} />
          <Route path="/resources/webinars" element={<WebinarsPage />} />
          <Route path="/resources/guides" element={<GuidesPage />} />
          <Route path="/resources/guides/automating-construction-takeoffs" element={<AutomatingConstructionTakeoffs />} />
          <Route path="/resources/guides/ai-for-construction-project-management" element={<AiForConstructionProjectManagement />} />

          <Route path="/resources/guides/:id" element={<GuideDetailPage />} />
          <Route path="/resources/blog" element={<BlogPage />} />
          <Route path="/resources/blog/:slug" element={<BlogPostPage />} />
          <Route path="/explained" element={<Explained />} />
          <Route path="/explained/contact" element={<Navigate to="/contact" replace />} />
          <Route path="/explained/pricing/diy-quote" element={<DIYQuotePage />} />
          <Route path="/explained/:slug" element={<ExplainedDetail />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/voice-demo" element={<VoiceDemo />} />
          <Route path="/demos/purchase-bill-intake" element={<PurchaseBillDemoPage />} />
          <Route path="/demos/technical-report-agent" element={<TechnicalReportDemoPage />} />
          <Route path="/demos/drawings-to-estimate" element={<DrawingsToEstimateDemoPage />} />
          <Route path="/demos/ai-takeoff" element={<DrawingsToEstimateDemoPage />} />
          <Route path="/demos/vendor-compliance" element={<VendorComplianceDemoPage />} />
          <Route path="/resources/demos/trades-platform/ads" element={<TradesPlatformAdsDemoPage />} />
          <Route path="/demos/:demoId" element={<GenericDemoPage />} />
          <Route path="/results/:sessionId" element={<PersonalizedResults />} />
          {/* Auth route */}
          <Route path="/auth" element={<Auth />} />
          {/* OAuth consent route for MCP client authorization */}
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

          {/* Compare routes */}
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/compare/vs-monday" element={<VsMonday />} />
          <Route path="/compare/vs-notion" element={<VsNotion />} />
          <Route path="/compare/vs-asana" element={<VsAsana />} />
          <Route path="/compare/vs-clickup" element={<VsClickup />} />
          <Route path="/compare/vs-zapier" element={<VsZapier />} />
          <Route path="/compare/vs-make" element={<VsMake />} />
          <Route path="/compare/vs-n8n" element={<VsN8n />} />
          <Route path="/compare/vs-lovable" element={<Navigate to="/compare" replace />} />
          <Route path="/compare/vs-pipedrive" element={<VsPipedrive />} />
          <Route path="/compare/vs-gohighlevel" element={<VsGoHighLevel />} />
          <Route path="/compare/vs-procore" element={<VsProcore />} />
          <Route path="/compare/vs-procurepro" element={<VsProcurePro />} />
          <Route path="/compare/vs-construction-enterprise" element={<VsConstructionEnterprise />} />
          <Route path="/compare/vs-construction-builders" element={<VsConstructionBuilders />} />
          <Route path="/compare/vs-buildpass" element={<VsBuildpass />} />
          <Route path="/compare/vs-jobber" element={<VsJobber />} />
          <Route path="/compare/vs-chatgpt" element={<VsChatGPT />} />
          <Route path="/compare/vs-claude" element={<VsClaude />} />
          {/* Company routes */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/press" element={<PressPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/partners/portal/*" element={<PartnerPortal />} />
          <Route path="/investors" element={<InvestorsPage />} />
          {/* Help routes */}
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/book-demo" element={<BookDemoPage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/booked" element={<BookingConfirmationPage />} />
          <Route path="/booking-confirmed" element={<Navigate to="/booked" replace />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/documentation/:slug" element={<DocumentationDetailPage />} />
          {/* Sitemap route */}
          <Route path="/sitemap.xml" element={<SitemapPage />} />
          {/* Legal routes */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/trust" element={<TrustCenterPage />} />
          <Route path="/legal/services-agreement" element={<ServicesAgreementPage />} />
          <Route path="/services-agreement" element={<ServicesAgreementPage />} />
          <Route path="/unsubscribe" element={<UnsubscribePage />} />
          <Route path="/status" element={<StatusPage />} />
          {/* Payment thank you */}
          <Route path="/payment/thank-you" element={<PaymentThankYou />} />
          {/* Proposal page (encrypted access) */}
          <Route path="/proposal/:quoteId" element={<ProposalPage />} />
          <Route path="/proposal/:quoteId/ssa" element={<ProposalSSAPage />} />
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />
          <Route path="/admin/accept-invite" element={<AcceptInvite />} />
          <Route path="/admin" element={<AdminDashboard />}>
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="bounce" element={<BounceDashboard />} />
            <Route path="sales-figures" element={<SalesFiguresAdmin />} />
            <Route path="leads" element={<LeadsInbox />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="leads-all" element={<Navigate to="/admin/leads" replace />} />
            <Route path="leads-legacy" element={<Navigate to="/admin/leads" replace />} />
            <Route path="leads-inbox" element={<Navigate to="/admin/leads" replace />} />
            <Route path="leads-booked" element={<LeadsBookedAdmin />} />
            <Route path="leads-booked/:id" element={<LeadDetailPage />} />
            <Route path="investor-leads" element={<InvestorLeadsAdmin />} />
            <Route path="investor-leads/:id" element={<LeadDetailPage />} />
            <Route path="meetings" element={<MeetingsAdmin />} />
            <Route path="discovery-meetings" element={<DiscoveryMeetingsAdmin />} />
            <Route path="solution-meetings" element={<SolutionMeetingsAdmin />} />
            <Route path="personal-meetings" element={<PersonalCalendarsMeetingsAdmin />} />
            <Route path="ghl-submissions" element={<GHLSubmissionsAdmin />} />
            <Route path="ghl-sync" element={<GHLSyncStatusAdmin />} />
            <Route path="system-health" element={<SystemHealthAdmin />} />
            <Route path="demo-leads" element={<DemoLeadsAdmin />} />
            <Route path="demo-leads/:id" element={<LeadDetailPage />} />
            <Route path="webinar-leads" element={<WebinarLeadsAdmin />} />
            <Route path="webinar-leads/:id" element={<LeadDetailPage />} />
            <Route path="alpha-digital-leads" element={<AlphaDigitalLeadsAdmin />} />
            <Route path="alpha-digital-leads/:id" element={<LeadDetailPage />} />
            <Route path="meta-leads" element={<MetaLeadsAdmin />} />
            <Route path="meta-leads/:id" element={<LeadDetailPage />} />
            <Route path="b2b-matchmaking-leads" element={<B2BMatchmakingLeadsAdmin />} />
            <Route path="b2b-matchmaking-leads/:id" element={<LeadDetailPage />} />
            <Route path="contacts" element={<ContactsAdmin />} />
            <Route path="contacts/:key" element={<ContactRecordPage />} />
            <Route path="archived-leads" element={<ArchivedLeadsAdmin />} />
            <Route path="archived-leads/:id" element={<LeadDetailPage />} />

            <Route path="webhook-logs" element={<WebhookLogsAdmin />} />

            <Route path="job-applications" element={<JobApplicationsAdmin />} />
            <Route path="quotes" element={<QuotesAdmin />} />
            <Route path="quotes/tidy-up" element={<DataTidyUpAdmin />} />
            <Route path="tidy-up" element={<DataTidyUpAdmin />} />
            <Route path="handover-queue" element={<HandoverQueueAdmin />} />
            <Route path="documents" element={<DocumentsAdmin />} />
            <Route path="registrations" element={<Navigate to="/admin/webinar-leads" replace />} />
            <Route path="webinars" element={<WebinarsAdmin />} />
            <Route path="webinars/new" element={<WebinarsAdmin />} />
            <Route path="webinars/:id" element={<WebinarsAdmin />} />
            <Route path="guides" element={<GuidesAdmin />} />
            <Route path="guides/new" element={<GuidesAdmin />} />
            <Route path="guides/:id" element={<GuidesAdmin />} />
            <Route path="blog" element={<BlogAdmin />} />
            <Route path="blog/new" element={<BlogAdmin />} />
            <Route path="blog/:id" element={<BlogAdmin />} />
            <Route path="testimonials" element={<TestimonialsAdmin />} />
            <Route path="testimonials/new" element={<TestimonialsAdmin />} />
            <Route path="testimonials/:id" element={<TestimonialsAdmin />} />
            <Route path="faqs" element={<FAQsAdmin />} />
            <Route path="faqs/new" element={<FAQsAdmin />} />
            <Route path="faqs/:id" element={<FAQsAdmin />} />
            <Route path="docs" element={<DocsAdmin />} />
            <Route path="docs/new" element={<DocsAdmin />} />
            <Route path="docs/:id" element={<DocsAdmin />} />
            <Route path="jobs" element={<JobsAdmin />} />
            <Route path="jobs/new" element={<JobsAdmin />} />
            <Route path="jobs/:id" element={<JobsAdmin />} />
            <Route path="settings/users" element={<UsersAdmin />} />
            <Route path="settings/activity" element={<ActivityCombinedAdmin />} />
            <Route path="settings/jobs" element={<ScheduledJobsAdmin />} />
            <Route path="settings/emails" element={<EmailsCombinedAdmin />} />
            <Route path="settings/newsletter" element={<NewsletterSubscribersAdmin />} />
            <Route path="settings/system" element={<SystemCombinedAdmin />} />
            <Route path="settings/search-analytics" element={<SearchAnalyticsAdmin />} />
            <Route path="seo/keyword-tracking" element={<KeywordTrackingAdmin />} />
            <Route path="settings/account" element={<UserSettingsAdmin />} />
            <Route path="settings/theme" element={<ThemeSettingsAdmin />} />
            <Route path="settings/export-requests" element={<ExportRequestsAdmin />} />
            <Route path="settings/blog-api" element={<BlogApiAdmin />} />
            <Route path="connectors" element={<ConnectorsAdmin />} />
          </Route>
          {/* Short link redirect — must be above catch-all */}
          <Route path="/go/:code" element={<ShortLinkRedirect />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      
      {/* Global Chat Components - deferred until after initial paint, hidden on admin/investors/DIY/demo routes */}
      {globalsReady && !isAdminRoute && !isInvestorsRoute && !isDiyQuoteRoute && !isDemoRoute && !isProposalRoute && !isBookRoute && !isIsolatedRoute && (
        <Suspense fallback={null}>
          {/* isChatAvailable covers every route flag above plus the partner
              portal — the same predicate Header.tsx calls to decide whether to
              offer the button, so the two can no longer disagree about whether
              clicking it will do anything. */}
          {isChatAvailable(location.pathname) && (
            <ChatAssistant 
              isOpen={activeChat === "assistant"} 
              onOpenChange={handleAssistantOpenChange} 
            />
          )}
          <BookingChatModal 
            isOpen={activeChat === "booking"} 
            onClose={closeBooking}
            source={bookingSource}
          />
          <CommandPalette />
          <ScrollToTop />
        </Suspense>
      )}
      
      {/* Show ScrollToTop on investors page */}
      {globalsReady && isInvestorsRoute && (
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
      )}
      
      {/* Update notification for all users - deferred */}
      {globalsReady && (
        <Suspense fallback={null}>
          <UpdateNotification />
        </Suspense>
      )}
    </>
  );
});

AppContent.displayName = 'AppContent';

const App = memo(() => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme={undefined}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AdminAuthProvider>
                <UserAuthProvider>
                  <ChatProvider>
                    <AppContent />
                  </ChatProvider>
                </UserAuthProvider>
              </AdminAuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;