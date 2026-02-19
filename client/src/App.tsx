import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { CartPanel } from "@/components/CartPanel";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Pricing from "@/pages/Pricing";
import Tools from "@/pages/Tools";
import Resources from "@/pages/Resources";
import FAQ from "@/pages/FAQ";
import Request from "@/pages/Request";
import Contact from "@/pages/Contact";
import ClientPortal from "@/pages/ClientPortal";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refunds from "@/pages/Refunds";
import AdminDashboard from "@/pages/AdminDashboard";
import CarmSecurityCalculator from "@/pages/CarmSecurityCalculator";
import CustomsCalculator from "@/pages/CustomsCalculator";
import CustomsClearance from "@/pages/CustomsClearance";
import ClearanceCheckout from "@/pages/ClearanceCheckout";
import BusinessNumberBN from "@/pages/services/BusinessNumberBN";
import GstHstRegistration from "@/pages/services/GstHstRegistration";
import CustomsClearanceCanada from "@/pages/services/CustomsClearanceCanada";
import ImportComplianceReview from "@/pages/services/ImportComplianceReview";
import HsCodeClassification from "@/pages/services/HsCodeClassification";
import CarmRegistration from "@/pages/services/CarmRegistration";
import RppBondCoordination from "@/pages/services/RppBondCoordination";
import B13ExportDeclaration from "@/pages/services/B13ExportDeclaration";
import NonResidentImporter from "@/pages/services/NonResidentImporter";
import FreightQuote from "@/pages/tools/FreightQuote";
import ShipmentTracking from "@/pages/tools/ShipmentTracking";
import HowToImportIntoCanada from "@/pages/resources/HowToImportIntoCanada";
import CustomsClearanceUnder2500 from "@/pages/resources/CustomsClearanceUnder2500";
import WhatIsSimaDuty from "@/pages/resources/WhatIsSimaDuty";
import WhatIsCarm from "@/pages/resources/WhatIsCarm";
import HsCodeVsTariffTreatment from "@/pages/resources/HsCodeVsTariffTreatment";
import IncotermsForCanadianImporters from "@/pages/resources/IncotermsForCanadianImporters";
import FclVsLclCostComparison from "@/pages/resources/FclVsLclCostComparison";
import B13ExportDeclarationExplained from "@/pages/resources/B13ExportDeclarationExplained";
import WhenDoYouNeedCfiaApproval from "@/pages/resources/WhenDoYouNeedCfiaApproval";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
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
        <Route path="/tools/freight-quote" component={FreightQuote} />
        <Route path="/tools/shipment-tracking" component={ShipmentTracking} />
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
        <Route path="/portal" component={ClientPortal} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/payment-cancel" component={PaymentCancel} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/refunds" component={Refunds} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/carm-security-calculator" component={CarmSecurityCalculator} />
        <Route path="/customs-calculator" component={CustomsCalculator} />
        <Route path="/canadian-customs-clearance" component={CustomsClearance} />
        <Route path="/canadian-customs-clearance/checkout" component={ClearanceCheckout} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <CartPanel />
          <Router />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
