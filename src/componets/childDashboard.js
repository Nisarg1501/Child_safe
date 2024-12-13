import React, { useState, useEffect, useCallback, useRef } from "react";
import "../css/childDashboard.css";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
  MDBBtn,
  MDBIcon,
  MDBSpinner,
} from "mdb-react-ui-kit";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../utils/api";

const ChildDashboard = () => {
  const navigate = useNavigate();
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const role = Cookies.get("role");
  const childId = Cookies.get("id");

  const staticSuggestion = [
    {
      title: "Learn Math with Fun Games",
      description:
        "Explore interactive games that make learning math fun and engaging.",
      link: "https://www.coolmathgames.com/",
    },
    {
      title: "Science Experiments at Home",
      description:
        "Discover easy and exciting science experiments you can try at home.",
      link: "https://sciencebob.com/category/experiments/",
    },
    {
      title: "Reading and Writing Practice",
      description: "Access reading materials and writing prompts for kids.",
      link: "https://www.storynory.com/",
    },
    {
      title: "Explore World Geography",
      description:
        "Learn about different countries and cultures with interactive maps.",
      link: "https://kids.nationalgeographic.com/",
    },
  ];

  // Fetch dynamic suggestions from API
  const getDynamicSuggestions = useCallback(async () => {
    if (!childId) {
      setError("Child ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetchApi(
        "http://localhost:4000/api/child/content-suggestions",
        "POST",
        { childId }
      );

      if (response?.suggestions?.length > 0) {
        setDynamicSuggestions(response.suggestions);
      }
    } catch (error) {
      setError("Failed to fetch suggestions. Showing static content.");
      setDynamicSuggestions(staticSuggestion);
      toast.error("Failed to fetch suggestions");
    } finally {
      setIsLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    getDynamicSuggestions();
  }, [getDynamicSuggestions]);

  const logout = () => {

    try {
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage(
          { type: "REMOVE_USER_ID", userId: Cookies.get("id") },
          (response) => {
            if (response?.success) {
              console.log("User ID removed from the extension successfully.");
            } else {
              console.error("Failed to remove User ID from the extension.");
            }
          }
        );
      } else {
        console.warn("Chrome runtime messaging is not available.");
      }
    } catch (error) {
      console.error(
        "An error occurred while sending the message to the extension:",
        error.message
      );
    } finally {
      Cookies.remove("user_email");
      Cookies.remove("id");
      Cookies.remove("role");
      navigate("/login");
      toast.success("Logged out successfully");
    }
  };

  const suggestionsToDisplay =
    dynamicSuggestions.length > 0
      ? dynamicSuggestions
      : staticSuggestion;
  return (
    role === "child" && (
      <div className="child-dashboard-page">
        <header className="child-dashboard-header">
          <h2>Welcome to Your Learning Dashboard</h2>
          <MDBBtn color="danger" onClick={logout}>
            <MDBIcon fas icon="sign-out-alt" className="me-2" />
            Logout
          </MDBBtn>
        </header>

        <MDBContainer className="my-5">
          <h4>Recommended Activities</h4>
          {isLoading ? (
            <div className="d-flex justify-content-center">
              <MDBSpinner size="lg" role="status" />
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <MDBRow>
              {suggestionsToDisplay.map((item, index) => (
                <MDBCol md="6" lg="4" key={index} className="mb-4">
                  <MDBCard className="h-100">
                    <MDBCardBody>
                      <MDBCardTitle>{item.title}</MDBCardTitle>
                      <MDBCardText>{item.description}</MDBCardText>
                      <MDBBtn
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="success"
                      >
                        Learn More
                      </MDBBtn>
                    </MDBCardBody>
                  </MDBCard>
                </MDBCol>
              ))}
            </MDBRow>
          )}
        </MDBContainer>
      </div>
    )
  );
};

export default ChildDashboard;
