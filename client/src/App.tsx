import { Navigate, Route, Routes } from 'react-router';
import { GuestOnly, RequireRole, RootRedirect } from './auth/guards';
import { AppLayout } from './layouts/AppLayout';
import { CenterLayout } from './layouts/CenterLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { LoginPage } from './pages/LoginPage';
import { AssetFormPage } from './pages/customer/AssetFormPage';
import { AssetPage } from './pages/customer/AssetPage';
import { HomeDetailPage } from './pages/customer/HomeDetailPage';
import { DashboardPage } from './pages/customer/DashboardPage';
import { HomesPage } from './pages/customer/HomesPage';
import { RemindersPage } from './pages/customer/RemindersPage';
import { CenterRequestPage } from './pages/center/CenterRequestPage';
import { CenterRequestsPage } from './pages/center/CenterRequestsPage';
import { CenterSettingsPage } from './pages/center/CenterSettingsPage';
import { TeamPage } from './pages/center/TeamPage';
import { CustomerRequestPage } from './pages/customer/CustomerRequestPage';
import { CustomerRequestsPage } from './pages/customer/CustomerRequestsPage';
import { RequestServicePage } from './pages/customer/RequestServicePage';
import { TechnicianJobPage } from './pages/technician/TechnicianJobPage';
import { TechnicianJobsPage } from './pages/technician/TechnicianJobsPage';
import { RegisterChoicePage } from './pages/RegisterChoicePage';
import { RegisterCustomerPage } from './pages/RegisterCustomerPage';
import { RegisterServiceCenterPage } from './pages/RegisterServiceCenterPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterChoicePage />} />
        <Route path="/register/customer" element={<RegisterCustomerPage />} />
        <Route path="/register/service-center" element={<RegisterServiceCenterPage />} />
      </Route>

      <Route element={<RequireRole role="customer" />}>
        <Route element={<CustomerLayout />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/app/homes" element={<HomesPage />} />
          <Route path="/app/reminders" element={<RemindersPage />} />
          <Route path="/app/requests" element={<CustomerRequestsPage />} />
          <Route path="/app/requests/:requestId" element={<CustomerRequestPage />} />
          <Route path="/app/assets/:assetId/request" element={<RequestServicePage />} />
          <Route path="/app/homes/:homeId" element={<HomeDetailPage />} />
          <Route path="/app/homes/:homeId/assets/new" element={<AssetFormPage />} />
          <Route path="/app/assets/:assetId" element={<AssetPage />} />
          <Route path="/app/assets/:assetId/edit" element={<AssetFormPage />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="center_staff" />}>
        <Route element={<CenterLayout />}>
          <Route path="/center" element={<CenterRequestsPage />} />
          <Route path="/center/requests/:requestId" element={<CenterRequestPage />} />
          <Route path="/center/team" element={<TeamPage />} />
          <Route path="/center/settings" element={<CenterSettingsPage />} />
          <Route path="/center/technicians" element={<Navigate to="/center/team" replace />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="technician" />}>
        <Route element={<AppLayout nav={[{ to: '/technician', label: 'My jobs', match: (p) => p.startsWith('/technician') }]} />}>
          <Route path="/technician" element={<TechnicianJobsPage />} />
          <Route path="/technician/jobs/:requestId" element={<TechnicianJobPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
