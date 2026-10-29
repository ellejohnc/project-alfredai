import { Routes, Route } from "react-router-dom";
import { PartnerPortalProvider } from "@/contexts/PartnerPortalProvider";
import PortalGuard from "@/components/portal/PortalGuard";
import PortalLayout from "@/components/portal/PortalLayout";
import AgreementGuard from "@/components/portal/AgreementGuard";
import PortalAuth from "@/pages/partners/portal/PortalAuth";
import PortalHome from "@/pages/partners/portal/PortalHome";
import GetStarted from "@/pages/partners/portal/GetStarted";
import BrandIdentity from "@/pages/partners/portal/BrandIdentity";
import FollowSupport from "@/pages/partners/portal/FollowSupport";
import SalesKit from "@/pages/partners/portal/SalesKit";
import Playbook from "@/pages/partners/portal/Playbook";
import ProductTraining from "@/pages/partners/portal/ProductTraining";
import Certification from "@/pages/partners/portal/Certification";
import RegisterDeal from "@/pages/partners/portal/RegisterDeal";
import MyEarnings from "@/pages/partners/portal/MyEarnings";
import PaymentDetails from "@/pages/partners/portal/PaymentDetails";
import PartnerAgreement from "@/pages/partners/portal/PartnerAgreement";
import PortalSupport from "@/pages/partners/portal/PortalSupport";
import PortalAdmin from "@/pages/partners/portal/PortalAdmin";
import ChangePassword from "@/pages/partners/portal/ChangePassword";
import DIYAccess from "@/pages/partners/portal/DIYAccess";
import ProfileSettings from "@/pages/partners/portal/ProfileSettings";

export default function PartnerPortal() {
  return (
    <PartnerPortalProvider>
      <Routes>
        <Route path="sign-in" element={<PortalAuth />} />
        <Route element={<PortalGuard />}>
          <Route path="change-password" element={<ChangePassword />} />
          <Route element={<PortalLayout />}>

            <Route index element={<PortalHome />} />
            <Route path="get-started" element={<GetStarted />} />
            <Route path="agreement" element={<PartnerAgreement />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="support" element={<PortalSupport />} />
            <Route path="admin" element={<PortalAdmin />} />

            <Route element={<AgreementGuard />}>
              <Route path="brand" element={<BrandIdentity />} />
              <Route path="follow-support" element={<FollowSupport />} />
              <Route path="sales-kit" element={<SalesKit />} />
              <Route path="playbook" element={<Playbook />} />
              <Route path="training" element={<ProductTraining />} />
              <Route path="training/certification" element={<Certification />} />
              <Route path="register-deal" element={<RegisterDeal />} />
              <Route path="earnings" element={<MyEarnings />} />
              <Route path="payment-details" element={<PaymentDetails />} />
              <Route path="diy-access" element={<DIYAccess />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </PartnerPortalProvider>
  );
}
