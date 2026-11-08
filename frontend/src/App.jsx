import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import JobDetail from './pages/JobDetail.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import CandidateProfile from './pages/candidate/Profile.jsx'
import CandidateApplications from './pages/candidate/Applications.jsx'
import EmployerDashboard from './pages/employer/Dashboard.jsx'
import JobForm from './pages/employer/JobForm.jsx'
import CompanyProfile from './pages/employer/CompanyProfile.jsx'
import Applicants from './pages/employer/Applicants.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminUsers from './pages/admin/Users.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/candidate/profile"
          element={
            <ProtectedRoute role="candidate">
              <CandidateProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/applications"
          element={
            <ProtectedRoute role="candidate">
              <CandidateApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employer/dashboard"
          element={
            <ProtectedRoute role="employer">
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs/new"
          element={
            <ProtectedRoute role="employer">
              <JobForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs/:id/edit"
          element={
            <ProtectedRoute role="employer">
              <JobForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/jobs/:id/applicants"
          element={
            <ProtectedRoute role="employer">
              <Applicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/company"
          element={
            <ProtectedRoute role="employer">
              <CompanyProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

function NotFound() {
  return (
    <div className="py-32 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <p className="mt-2 text-slate-500">Trang không tồn tại.</p>
    </div>
  )
}
