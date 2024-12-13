import React, { useState } from "react";
import { toast } from "react-toastify";
import { fetchApi } from "../utils/api";
import "../css/login.css";
import { MDBCard, MDBCardBody, MDBCardTitle } from "mdb-react-ui-kit";
import Loader from "./Loader";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loader, setLoader] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    setLoader(true);
    try {
      const result = await fetchApi(
        "http://localhost:4000/api/forgot-password",
        "POST",
        { email }
      );
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="forgot-password-page">
      {loader && <Loader />}
      <div className="container-fluid">
        <div className="row no-gutter">
          <div className="col-md-6 d-flex align-items-center justify-content-center">
            <MDBCard className="login-card">
              <MDBCardBody>
                <MDBCardTitle className="text-center">
                  Forgot Password
                </MDBCardTitle>
                <form onSubmit={handleForgotPassword}>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={loader}
                  >
                    {loader ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>
              </MDBCardBody>
            </MDBCard>
          </div>
          <div className="col-md-6 d-none d-md-flex bg-image"></div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
