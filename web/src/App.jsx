import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import Prescriptions from './pages/Prescriptions';
import Billing from './pages/Billing';
import Medicines from './pages/Medicines';
import LabTests from './pages/LabTests';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import FollowUps from './pages/FollowUps';
import PatientPortal from './pages/PatientPortal';
import Settings from './pages/Settings';
import DoctorProfile from './pages/DoctorProfile';
import NotFound from './pages/NotFound';
// New AI-powered healthcare pages
import HealthRecords from './pages/HealthRecords';
import FamilyAccounts from './pages/FamilyAccounts';
import MedicineReminders from './pages/MedicineReminders';
import Vaccinations from './pages/Vaccinations';
import AIHealthAssistant from './pages/AIHealthAssistant';
import AILabAnalyzer from './pages/AILabAnalyzer';
import VoicePrescription from './pages/VoicePrescription';
import ClinicalDecisionSupport from './pages/ClinicalDecisionSupport';
import EMRTemplates from './pages/EMRTemplates';
import ESignaturePage from './pages/ESignature';
import Memberships from './pages/Memberships';
import HealthPackages from './pages/HealthPackages';
import Campaigns from './pages/Campaigns';
import Referrals from './pages/Referrals';
import AuditLogs from './pages/AuditLogs';
import BranchManagement from './pages/BranchManagement';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { isLoggedIn } from './utils/auth';

// Patient Portal (public pages - no auth)
import SymptomChecker from './pages/portal/SymptomChecker';
import BookAppointment from './pages/portal/BookAppointment';
import MyRecords from './pages/portal/MyRecords';
import HealthTips from './pages/portal/HealthTips';
import MedicationReminder from './pages/portal/MedicationReminder';
import TrackAppointment from './pages/portal/TrackAppointment';
import Pricing from './pages/portal/Pricing';
import VideoCall from './pages/portal/VideoCall';
import FindDoctor from './pages/portal/FindDoctor';
import DoctorPublicProfile from './pages/portal/DoctorPublicProfile';
import LandingPage from './pages/portal/LandingPage';

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/home" replace />;
}

function PublicOnly({ children }) {
  return isLoggedIn() ? <Navigate to="/" replace /> : children;
}

// Opt in to React Router v7 behavior now to silence the deprecation warnings.
const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};

export default function App() {
  return (
    <AuthProvider>
    <ErrorBoundary>
    <Router future={routerFutureFlags}>
      <Toaster
        position="top-right"
        toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }}
      />
      <Routes>
        {/* Patient Portal - Public (no auth) */}
        <Route path="/home" element={<LandingPage />} />
        <Route path="/symptom-checker" element={<SymptomChecker />} />
        <Route path="/book/:doctorId" element={<BookAppointment />} />
        <Route path="/book" element={<BookAppointment />} />
        <Route path="/my-records" element={<MyRecords />} />
        <Route path="/health-tips" element={<HealthTips />} />
        <Route path="/my-medications" element={<MedicationReminder />} />
        <Route path="/track/:appointmentId" element={<TrackAppointment />} />
        <Route path="/track" element={<TrackAppointment />} />
        <Route path="/video/:appointmentId" element={<VideoCall />} />
        <Route path="/find-doctor" element={<FindDoctor />} />
        <Route path="/doctor/:doctorId" element={<DoctorPublicProfile />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Auth pages */}
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="billing" element={<Billing />} />
          <Route path="medicines" element={<Medicines />} />
          <Route path="lab-tests" element={<LabTests />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="reports" element={<Reports />} />
          <Route path="follow-ups" element={<FollowUps />} />
          <Route path="patient-portal" element={<PatientPortal />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="settings" element={<Settings />} />
          {/* New AI Healthcare Platform Routes */}
          <Route path="health-records" element={<HealthRecords />} />
          <Route path="family-accounts" element={<FamilyAccounts />} />
          <Route path="medicine-reminders" element={<MedicineReminders />} />
          <Route path="vaccinations" element={<Vaccinations />} />
          <Route path="ai-assistant" element={<AIHealthAssistant />} />
          <Route path="ai-lab-analyzer" element={<AILabAnalyzer />} />
          <Route path="voice-prescription" element={<VoicePrescription />} />
          <Route path="clinical-support" element={<ClinicalDecisionSupport />} />
          <Route path="emr-templates" element={<EMRTemplates />} />
          <Route path="e-signature" element={<ESignaturePage />} />
          <Route path="memberships" element={<Memberships />} />
          <Route path="health-packages" element={<HealthPackages />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="branches" element={<BranchManagement />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    </ErrorBoundary>
    </AuthProvider>
  );
}
