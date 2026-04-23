import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { CartPanel } from "@/components/CartPanel";
import { SiteChatWidget } from "@/components/SiteChatWidget";

// Eagerly loaded — every user sees these first
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Pricing from "@/pages/Pricing";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import Tools from "@/pages/Tools";
import Resources from "@/pages/Resources";

// Lazy — heavy bundles (three.js, pdf, canvas) or rarely-visited routes
const Request = lazy(() => import("@/pages/Request"));
const ClientPortal = lazy(() => import("@/pages/ClientPortal"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("@/pages/PaymentCancel"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Refunds = lazy(() => import("@/pages/Refunds"));
const Security = lazy(() => import("@/pages/Security"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminCrm = lazy(() => import("@/pages/AdminCrm"));
const AdminViewAsClient = lazy(() => import("@/pages/AdminViewAsClient"));
const OnboardingIntake = lazy(() => import("@/pages/OnboardingIntake"));
const CarmSecurityCalculator = lazy(() => import("@/pages/CarmSecurityCalculator"));
const CustomsCalculator = lazy(() => import("@/pages/CustomsCalculator"));
const CustomsClearance = lazy(() => import("@/pages/CustomsClearance"));
const ClearanceCheckout = lazy(() => import("@/pages/ClearanceCheckout"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const CompleteOrder = lazy(() => import("@/pages/CompleteOrder"));
import BusinessNumberBN from "@/pages/services/BusinessNumberBN";
import GstHstRegistration from "@/pages/services/GstHstRegistration";
import CustomsClearanceCanada from "@/pages/services/CustomsClearanceCanada";
import ImportComplianceReview from "@/pages/services/ImportComplianceReview";
import HsCodeClassification from "@/pages/services/HsCodeClassification";
import CarmRegistration from "@/pages/services/CarmRegistration";
import RppBondCoordination from "@/pages/services/RppBondCoordination";
import B13ExportDeclaration from "@/pages/services/B13ExportDeclaration";
import NonResidentImporter from "@/pages/services/NonResidentImporter";
import NotFound from "@/pages/not-found";

// Blog — split out since these are new, rarely-visited on first load
const BlogIndex = lazy(() => import("@/pages/BlogIndex"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));

// Heavy tools and rarely-visited routes — lazy loaded so they don't ship on every page paint.
const HsCodeFinder = lazy(() => import("@/pages/tools/HsCodeFinder"));
const HsClassificationOrder = lazy(() => import("@/pages/order/HsClassificationOrder"));
const OrderConfirmation = lazy(() => import("@/pages/order/OrderConfirmation"));
const FreightQuote = lazy(() => import("@/pages/tools/FreightQuote"));
const ShipmentTracking = lazy(() => import("@/pages/tools/ShipmentTracking"));
const ContainerCalculator = lazy(() => import("@/pages/tools/ContainerCalculator"));
const TruckLoadPlanner = lazy(() => import("@/pages/tools/TruckLoadPlanner"));
const HowToImportIntoCanada = lazy(() => import("@/pages/resources/HowToImportIntoCanada"));
const CustomsClearanceUnder2500 = lazy(() => import("@/pages/resources/CustomsClearanceUnder2500"));
const WhatIsSimaDuty = lazy(() => import("@/pages/resources/WhatIsSimaDuty"));
const WhatIsCarm = lazy(() => import("@/pages/resources/WhatIsCarm"));
const HsCodeVsTariffTreatment = lazy(() => import("@/pages/resources/HsCodeVsTariffTreatment"));
const IncotermsForCanadianImporters = lazy(() => import("@/pages/resources/IncotermsForCanadianImporters"));
const FclVsLclCostComparison = lazy(() => import("@/pages/resources/FclVsLclCostComparison"));
const B13ExportDeclarationExplained = lazy(() => import("@/pages/resources/B13ExportDeclarationExplained"));
const WhenDoYouNeedCfiaApproval = lazy(() => import("@/pages/resources/WhenDoYouNeedCfiaApproval"));

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location]);
  return null;
}

function RouterFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div
        className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouterFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/services" component={Services} />
        <Route path="/services/business-number-bn" component={BusinessNumberBN} />
        <Route path="/services/gst-hst-registration" component={GstHstRegistration} />
        <Route path="/services/customs-clearance-canada" component={CustomsClearanceCanada} />
        <Route path="/services/import-compliance-review" component={ImportComplianceReview} />
        <Route path="/services/hs-code-classification-canada" component={HsCodeClassification} />
        <Route path="/services/carm-registration-canada" component={CarmRegistration} />
        <Route path="/services/rpp-bond-coordination" component={RppBondCoordination} />
        <Route path="/services/b13-export-declaration" component={B13ExportDeclaration} />
        <Route path="/services/non-resident-importer-canada" component={NonResidentImporter} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/tools" component={Tools} />
        <Route path="/tools/hs-code-finder" component={HsCodeFinder} />
        <Route path="/order/hs-classification" component={HsClassificationOrder} />
        <Route path="/order-confirmation" component={OrderConfirmation} />
        <Route path="/tools/freight-quote" component={FreightQuote} />
        <Route path="/tools/shipment-tracking" component={ShipmentTracking} />
        <Route path="/tools/container-calculator" component={ContainerCalculator} />
        <Route path="/tools/truck-load-planner" component={TruckLoadPlanner} />
        <Route path="/resources" component={Resources} />
        <Route path="/resources/how-to-import-into-canada" component={HowToImportIntoCanada} />
        <Route path="/resources/customs-clearance-under-2500" component={CustomsClearanceUnder2500} />
        <Route path="/resources/what-is-sima-duty" component={WhatIsSimaDuty} />
        <Route path="/resources/what-is-carm" component={WhatIsCarm} />
        <Route path="/resources/hs-code-vs-tariff-treatment" component={HsCodeVsTariffTreatment} />
        <Route path="/resources/incoterms-for-canadian-importers" component={IncotermsForCanadianImporters} />
        <Route path="/resources/fcl-vs-lcl-cost-comparison" component={FclVsLclCostComparison} />
        <Route path="/resources/b13-export-declaration-explained" component={B13ExportDeclarationExplained} />
        <Route path="/resources/when-do-you-need-cfia-approval" component={WhenDoYouNeedCfiaApproval} />
        <Route path="/faq" component={FAQ} />
        <Route path="/request" component={Request} />
        <Route path="/contact" component={Contact} />
        <Route path="/about" component={About} />
        <Route path="/blog" component={BlogIndex} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/portal" component={ClientPortal} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/payment-cancel" component={PaymentCancel} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/refunds" component={Refunds} />
        <Route path="/security" component={Security} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/crm" component={AdminCrm} />
        <Route path="/admin/view-as-client" component={AdminViewAsClient} />
        <Route path="/onboarding/:token" component={OnboardingIntake} />
        <Route path="/carm-security-calculator" component={CarmSecurityCalculator} />
        <Route path="/customs-calculator" component={CustomsCalculator} />
        <Route path="/canadian-customs-clearance" component={CustomsClearance} />
        <Route path="/canadian-customs-clearance/checkout" component={ClearanceCheckout} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/complete-order" component={CompleteOrder} />
        <Route component={NotFound} />
      </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LocaleProvider>
        <CurrencyProvider>
          <CartProvider>
            <Toaster />
            <CartPanel />
            <SiteChatWidget />
            <Router />
          </CartProvider>
        </CurrencyProvider>
        </LocaleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
