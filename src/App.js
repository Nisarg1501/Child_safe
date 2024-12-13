import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Signup from "./componets/Signup";
import Login from "./componets/Login";
import ParentDashboard from "./componets/ParentDashboard";
import "./index.css";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import ChildDashboard from "./componets/childDashboard";
import { useEffect } from "react";
import Cookies from "js-cookie";
import ForgotPassword from "./componets/ForgotPassword";
import ResetPassword from "./componets/ResetPassword";
import ChildActivityReport from "./componets/ChildActivityReport";

const RoleFetcher = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const role = Cookies.get("role");
    const path = location.pathname;
    if (path.includes("/report/")) {
      return;
    }

    // Handle parent role
    if (role === "parent") {
      if (path === "/" || path === "/dashboard") {
        navigate("/dashboard");
      } else {
        navigate("/report");
      }
    }
    else if (role === "child") {
      navigate("/child-dashboard");
    }
    else {
      if (path === "/login") {
        navigate("/login");
      } else if (path === "/forgot-password") {
        navigate("/forgot-password");
      } else if (path?.startsWith("/reset-password")) {
        navigate(path);
      } else {
        navigate("/signup");
      }
    }
  }, [location.pathname]);

  return null;
};

function App() {
  return (
    <Router>
      <ToastContainer />
      <RoleFetcher />
      <Routes>
        <Route path="signup" element={<Signup />} />
        <Route path="login" element={<Login />} />
        <Route path="" element={<Login />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="child-dashboard" element={<ChildDashboard />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="report/:userId" element={<ChildActivityReport />} />
      </Routes>
    </Router>
  );
}

export default App;
