import React, { useState } from "react";
import { toast } from "react-toastify";
import { MDBCard, MDBCardBody, MDBCardTitle } from "mdb-react-ui-kit";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "./Loader"; 
import "../css/reset-password.css";
import { fetchApi } from "../utils/api";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  // Password validation regex (min 8 chars, at least 1 number and 1 special character)
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Validation function
  const validatationCheck = () => {
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

    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatationCheck()) {
      return;
    }
    setLoader(true);

    try {
      const result = await fetchApi(
        `http://localhost:4000/api/reset-password/${token}`,
        "POST",
        { password }
      );
      toast.success(result.message);
      navigate("/login");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="reset-password-page">
      {loader && <Loader />}
      <div className="container-fluid">
        <div className="row no-gutter">
          <div className="col-md-6 d-flex align-items-center justify-content-center">
            <MDBCard className="login-card">
              <MDBCardBody>
                <MDBCardTitle className="text-center">
                  Reset Password
                </MDBCardTitle>
                <form onSubmit={handleResetPassword}>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={loader}
                  >
                    {loader ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
