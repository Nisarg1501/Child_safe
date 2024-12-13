import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/login.css";
import { fetchApi } from "../utils/api";
import { toast } from "react-toastify";
import { MDBCard, MDBCardBody, MDBCardTitle } from "mdb-react-ui-kit";
import Cookies from "js-cookie";
import Loader from "./Loader";

const Signup = () => {


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const role = Cookies.get("role");

  const emailRegex = /^[^\s@]+@[^\s@]+\.(com)$/;

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validataionCheck = () => {
    if (!email) {
      toast.error("Email addres is required.");
      return false;
    }

    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address and only get .com Domain");
      return false;
    }
    if (!password) {
      toast.error("Password is required.");
      return false;
    }
    if (!passwordRegex.test(password)) {
      toast.error(
        "Password must be at least 8 characters long, include at least 1 number and 1 special character."
      );
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleRegister = (e) => {
    e.preventDefault();

    if (!validataionCheck()) {
      return;
    }

    setLoading(true);
    const data = {
      email: email,
      password: password,
    };

    fetchApi("http://localhost:4000/api/register", "POST", data)
      .then((result) => {
        setLoading(false);
        toast.success(result.message);
        navigate("/login");
      })
      .catch((error) => {
        setLoading(false);
        toast.error(error.message);
      });
  };

  return (
    role === undefined && (
      <div className="login-page">
        {loading && <Loader />}
        <div className="container-fluid">
          <div className="row no-gutter">
            <div className="col-md-6 d-flex align-items-center justify-content-center">
              <MDBCard className="login-card">
                <MDBCardBody>
                  <MDBCardTitle className="text-center">Register</MDBCardTitle>
                  <form onSubmit={handleRegister}>
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

                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">
                      Register
                    </button>
                  </form>

                  <div className="text-center mt-3">
                    <p>
                      Already have an account? <Link to="/login">Login</Link>
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

export default Signup;
