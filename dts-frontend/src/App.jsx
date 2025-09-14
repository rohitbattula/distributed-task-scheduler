import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthProvider.jsx";
import Header from "./components/Header.jsx";
import Welcome from "./pages/Welcome.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Forgot from "./pages/Forgot.jsx";
import Reset from "./pages/Reset.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import JobsList from "./pages/JobsList.jsx";
import JobNew from "./pages/JobNew.jsx";
import JobDetail from "./pages/JobDetail.jsx";
import NotFound from "./pages/NotFound.jsx";

function RequireAuth({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { token } = useAuth();
  return (
    <>
      <Header />
      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" replace /> : <Welcome />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset-password" element={<Reset />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/jobs"
          element={
            <RequireAuth>
              <JobsList />
            </RequireAuth>
          }
        />
        <Route
          path="/jobs/new"
          element={
            <RequireAuth>
              <JobNew />
            </RequireAuth>
          }
        />
        <Route
          path="/jobs/:jobId"
          element={
            <RequireAuth>
              <JobDetail />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
