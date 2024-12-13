import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchApi } from "../utils/api";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { MDBCard, MDBCardBody, MDBCardTitle } from "mdb-react-ui-kit";
import "../css/login.css";
import Loader from "./Loader";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();
  const role = Cookies.get("role");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateCHeck = () => {
    if (!email) {
      toast.error("Email address is required.");
      return false;
    }

    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      toast.error("Password is required.");
      return false;
    }

    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateCHeck()) {
      return;
    }
    setLoader(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const cityName = await getCityName(latitude, longitude);

        try {
          const result = await fetchApi(
            "http://localhost:4000/api/login",
            "POST",
            {
              email: email,
              password: password,
              location: cityName,
            }
          );

          toast.success(result.message);
          Cookies.set("user_email", result.email, { expires: 7, path: "/" });
          Cookies.set("role", result.role, { expires: 7, path: "/" });

          Cookies.set("id", result.id, {
            expires: 7,
            path: "/",
          });

          Cookies.set("cityName", result.lastLoginLocation, {
            expires: 7,
            path: "/",
          });
          setLoader(false);

          try{
            chrome.runtime.sendMessage(
              { type: "SET_USER_ID", userId: result.id },
              (response) => {
                if (response && response.success) {
                  console.log("User ID sent to extension successfully.");
                } else {
                  console.error("Failed to send User ID to extension.");
                }
              }
            );
          } catch(error) {
            if (result.role === "child") {
              navigate("/child-dashboard");
            } else {
              navigate("/dashboard");
            }
          }

          if (result.role === "child") {
            navigate("/child-dashboard");
          } else {
            navigate("/dashboard");
          }
        } catch (error) {
          setLoader(false);
          toast.error(error.message);
        }
        setLoader(false);

      },
      (error) => {
        setLoader(false);

        toast.error("Location access is required for login.");
      }
    );

  };

  const getCityName = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      return data.city || data.locality || "Unknown Location";
    } catch (error) {
      toast.error("Failed to fetch city name");
      return "Unknown Location";
    }
  };

  return (
    role === undefined && (
      <div className="login-page">
        {loader && <Loader />}
        <div className="container-fluid">
          <div className="row no-gutter">
            <div className="col-md-6 d-flex align-items-center justify-content-center">
              <MDBCard className="login-card">
                <MDBCardBody>
                  <MDBCardTitle className="text-center">Login</MDBCardTitle>
                  <form onSubmit={handleLogin}>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block">
                      Login
                    </button>
                  </form>
                  <div className="d-flex justify-content-between mt-3">
                    <p>
                      Don't have an account? <Link to="/signup">Register</Link>
                    </p>
                    <p>
                      <Link
                        to="/forgot-password"
                        className="forgot-password-link"
                      >
                        Forgot Password?
                      </Link>
                    </p>
                  </div>
                </MDBCardBody>
              </MDBCard>
            </div>
            <div className="col-md-6 d-none d-md-flex bg-image"></div>
          </div>
        </div>
      </div>
    )
  );
};

export default Login;
