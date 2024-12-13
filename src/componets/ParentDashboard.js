import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import "../css/dashboard.css";
import { fetchApi } from "../utils/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Link } from "react-router-dom";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBBtn,
  MDBAccordion,
  MDBAccordionItem,
  MDBIcon,
  MDBCardTitle,
  MDBCardText,
} from "mdb-react-ui-kit";
import Loader from "./Loader";

const ParentDashboard = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [dataArray, setDataArray] = useState();
  const [emailError, setEmailError] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [loader, setLoader] = useState(false);

  const [suggestionFormData, setSuggestionFormData] = useState({
    title: "",
    description: "",
    link: "",
    category: "",
  });
  const navigate = useNavigate();
  const [timeLimit, setTimeLimit] = useState({
    dailyLimit: "",
    weeklyLimit: "",
  });
  useEffect(() => {
    const cityName = Cookies.get("cityName");

    if (cityName) {
      setLocation(`City: ${cityName}`);
    } else {
      setLocation("Location not available");
    }
    getBlockedSites();
    const role = Cookies.get("role");
    if (role !== "parent") {
      navigate("/login");
    }
  }, []);
  const suggestionChange = (e) => {
    const { name, value } = e.target;
    setSuggestionFormData({ ...suggestionFormData, [name]: value });
  };
  const role = Cookies.get("role");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validateEmail = () => {
    if (!emailRegex.test(formData.email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getBlockedSites = async () => {
    try {
      const getResult = await fetchApi(
        "http://localhost:4000/api/parent/children-blocked-sites",
        "POST",
        {
          userId: Cookies.get("id"),
        }
      );
      setDataArray(getResult);
      toast.success(getResult.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAdd = async () => {
    if (formData?.name && formData?.email && formData?.password) {
      setLoader(true);
      const emailRegex = /^[^\s@]+@[^\s@]+\.(com)$/;
      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      try {
        if (!formData.email) {
          toast.error("Email address is required.");
          setLoader(false);
          return;
        }
        if (!formData.name) {
          toast.error("name is required.");
          setLoader(false);
          return;
        }
        if (/[\d]/.test(formData.name)) {
          toast.error("name should be valid");
          setLoader(false);
          return;
        }
        if (!emailRegex.test(formData.email)) {
          toast.error(
            "Please enter a valid email address and only get .com Domain"
          );
          setLoader(false);
          return;
        }

        if (!formData.password) {
          toast.error("Password is required.");
          setLoader(false);
          return;
        }

        if (!passwordRegex.test(formData.password)) {
          toast.error(
            "Password must be at least 8 characters long, include at least 1 number and 1 special character."
          );
          setLoader(false);
          return;
        }

        const postResult = await fetchApi(
          "http://localhost:4000/api/parent/add-child",
          "POST",
          {
            childName: formData?.name,
            childEmail: formData.email,
            childPassword: formData.password,
            parentEmail: Cookies.get("user_email"),
          }
        );
        setLoader(false);
        toast.success(postResult.message);
        await getBlockedSites();

        setFormData({ name: "", email: "", password: "" });
      } catch (error) {
        setLoader(false);

        toast.error(error.message);
      }
    } else {
      toast.error("Fields must not be empty");
    }
    setLoader(false);
  };

  const addWebsite = async (childId) => {
    if (website) {
      const postResult = await fetchApi(
        "http://localhost:4000/api/block-site",
        "POST",
        {
          child_id: childId,
          site_url: website,
          parent_id: Cookies.get("id"),
        }
      );
      await getBlockedSites();

      toast.success(postResult.message);
      setWebsite("");
    } else {
      toast.error("Enter a valid website");
    }
  };

  const deleteWebsite = async (siteId) => {
    const response = await fetch(
      `http://localhost:4000/api/parent/delete-blocked-site/${siteId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Parent-Email": Cookies.get("user_email"),
        },
      }
    );
    await getBlockedSites();

    toast.success(response.message);
  };

  const heleteUser = async (userId) => {
    const response = await fetch(
      `http://localhost:4000/api/parent/delete-child/${userId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Parent-Email": Cookies.get("user_email"),
        },
      }
    );

    await getBlockedSites();

    toast.success(response.message);
  };

  const signout = async () => {
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
      clearUserData();
      navigate("/login");
      toast.success("Logged out successfully");
    }
  };

  const clearUserData = () => {
    const cookiesToClear = [
      "user_email",
      "id",
      "location_lat",
      "location_lon",
      "role",
    ];

    cookiesToClear.forEach((cookie) => Cookies.remove(cookie));
  };

  const timeLimitChange = (e) => {
    const { name, value } = e.target;
    setTimeLimit({ ...timeLimit, [name]: value });
  };

  const handleSetTimeLimit = async (childId) => {
    if (!timeLimit.dailyLimit || !timeLimit.weeklyLimit) {
      toast.error("Please enter both daily and weekly time limits.");
      return;
    }

    try {
      const response = await fetchApi(
        "http://localhost:4000/api/parent/set-time-limit",
        "POST",
        {
          childId,
          dailyLimit: Number(timeLimit.dailyLimit), 
          weeklyLimit: Number(timeLimit.weeklyLimit), 
          parentId: Cookies.get("id"),
        }
      );
      toast.success(response.message);
      setTimeLimit({ dailyLimit: "", weeklyLimit: "" });
      await getBlockedSites();
    } catch (error) {
      toast.error(error);

      toast.error("Failed to set time limit.");
    }
  };

  const addSuggestion = async (childId) => {
    const { title, description, link } = suggestionFormData;

    if (!title || !description || !link) {
      toast.error("Please fill all the fields!");
      return;
    }

    try {
      const response = await fetchApi(
        "http://localhost:4000/api/parent/add-suggestion", // Your API URL
        "POST",
        {
          parentId: Cookies.get("id"), // Parent's ID from cookies
          childId, // Child's ID
          title,
          description,
          link,
        }
      );

      toast.success("Suggestion added successfully!");
      setSuggestionFormData({
        title: "",
        description: "",
        link: "",
        category: "",
      });
      // Optionally refresh the list of blocked sites or suggestions
    } catch (error) {
      toast.error("Failed to add suggestion!");
    }
  };

  return (
    role === "parent" && (
      <div className="dashboard-page">
        {loader && <Loader />}
        <div className="container">
          <header className="dashboard-header">
            <h2>Parental Control Dashboard</h2>
            <div className="header-buttons">
              <p>Location: {location}</p>
              <button className="btn btn-action" onClick={signout}>
                Logout
              </button>
              <PayPalScriptProvider
                options={{
                  "client-id":
                    "AVSkCcjzchqBmVwSv0yLxVD0vhiHcXClntmTyY6By0_mKvBLEp0IzYJd6UIU2_0vEvfgLJZ51suLEOS7",
                  currency: "USD",
                }}
              >
                <PayPalButtons
                  style={{ layout: "horizontal" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [
                        {
                          amount: {
                            value: "10.00", // Replace with the amount for your product/service
                          },
                        },
                      ],
                    });
                  }}
                  onApprove={(data, actions) => {
                    return actions.order.capture().then((details) => {
                      toast.success(
                        `Payment successful! Thank you, ${details.payer.name.given_name}`
                      );
                    });
                  }}
                  onError={(err) => {
                    toast.error("Payment failed. Please try again.");
                    console.error(err);
                  }}
                />
              </PayPalScriptProvider>
            </div>
          </header>

          <MDBContainer className="my-5">
            <MDBRow>
              <MDBCol md="4">
                <MDBCard>
                  <MDBCardBody>
                    <MDBCardTitle className="text-center">
                      Add Child
                    </MDBCardTitle>
                    <input
                      placeholder="Name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mb-3 w-100"
                      required
                    />
                    <input
                      placeholder="Email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={validateEmail}
                      className={`w-100 ${
                        emailError ? "is-invalid mb-0" : "mb-3"
                      }`}
                    />
                    {emailError && (
                      <div className="text-danger mb-3">{emailError}</div>
                    )}
                    <input
                      placeholder="Password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="mb-4 w-100"
                    />
                    <MDBBtn className="w-100" onClick={handleAdd}>
                      Add
                    </MDBBtn>
                  </MDBCardBody>
                </MDBCard>
              </MDBCol>

              <MDBCol md="8">
                <div
                  style={{
                    overflowY: "auto",
                    overflowX: "hidden",
                    maxHeight: "calc(100vh - 200px)",
                  }}
                >
                  <MDBAccordion initialActive={1}>
                    {dataArray?.children?.length > 0 ? (
                      dataArray?.children?.map((item) => (
                        <MDBAccordionItem
                          key={item._id}
                          collapseId={item._id}
                          headerTitle={item?.name}
                        >
                          <div className="d-flex justify-content-between mb-2">
                            <div>
                              <strong>Email:</strong> {item.email}
                            </div>

                            <div>
                              <MDBIcon
                                far
                                icon="trash-alt"
                                size="lg"
                                color="danger"
                                className="ms-2"
                                onClick={() => heleteUser(item._id)}
                              />
                            </div>
                          </div>
                          <div>
                            <strong>Active Minute:</strong>{" "}
                            {item.activeHours
                              ? `${item.activeHours.start}:00 - ${item.activeHours.end}:00`
                              : "Not set"}
                          </div>
                          <div className="my-3">
                            <strong>Set Time Limits</strong>
                            <div className="d-flex gap-2 mb-2">
                              <MDBInput
                                label="Daily Limit (minute)"
                                type="number"
                                name="dailyLimit"
                                value={timeLimit.dailyLimit}
                                onChange={timeLimitChange}
                                min="0"
                              />
                              <MDBInput
                                label="Weekly Limit (minute)"
                                type="number"
                                name="weeklyLimit"
                                value={timeLimit.weeklyLimit}
                                onChange={timeLimitChange}
                                min="0"
                              />
                              <MDBBtn
                                onClick={() => handleSetTimeLimit(item._id)}
                              >
                                Set Limits
                              </MDBBtn>
                            </div>
                          </div>

                          {/* Display Current Limits */}
                          <div>
                            <strong>Current Time Limits:</strong>
                            <ul>
                              <li>
                                <strong>Daily Limit:</strong>{" "}
                                {item.dailyLimit || "Not Set"} Minute
                              </li>
                              <li>
                                <strong>Weekly Limit:</strong>{" "}
                                {item.weeklyLimit || "Not Set"} Minute
                              </li>
                            </ul>
                          </div>
                          <div>
                            <strong>Websites:</strong>
                            <div className="d-flex justify-content-between gap-2">
                              <MDBInput
                                label="Add Website"
                                type="text"
                                value={website}
                                onChange={(e) =>
                                  setWebsite(e.target.value)
                                }
                              />
                              <MDBBtn
                                onClick={() => addWebsite(item._id)}
                              >
                                Add
                              </MDBBtn>
                            </div>
                            {item?.blocked_sites?.length > 0 ? (
                              <ul>
                                {item?.blocked_sites?.map((website) => (
                                  <li key={website._id}>
                                    {website?.site_url}
                                    <MDBIcon
                                      far
                                      icon="trash-alt"
                                      size="sm"
                                      color="danger"
                                      className="ms-2"
                                      onClick={() =>
                                        deleteWebsite(website._id)
                                      }
                                    />
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>No websites added yet.</p>
                            )}
                          </div>
                          <div className="my-3">
                            <strong>Add Content Suggestion</strong>
                            <div className="d-flex flex-column gap-2">
                              <MDBInput
                                label="Suggestion Title"
                                type="text"
                                name="title"
                                value={suggestionFormData.title}
                                onChange={suggestionChange}
                              />
                              <MDBInput
                                label="Description"
                                type="text"
                                name="description"
                                value={suggestionFormData.description}
                                onChange={suggestionChange}
                              />
                              <MDBInput
                                label="Link"
                                type="url"
                                name="link"
                                value={suggestionFormData.link}
                                onChange={suggestionChange}
                              />
                              <MDBBtn
                                onClick={() => addSuggestion(item._id)}
                              >
                                Add Suggestion
                              </MDBBtn>
                            </div>
                          </div>
                        </MDBAccordionItem>
                      ))
                    ) : (
                      <p>No child added yet</p>
                    )}
                  </MDBAccordion>
                </div>
              </MDBCol>
            </MDBRow>
          </MDBContainer>

          <MDBContainer>
            <MDBCol md="12">
              <MDBCard style={{ maxHeight: "300px", overflowY: "auto" }}>
                <MDBCardBody>
                  <MDBCardTitle>User List</MDBCardTitle>
                  {dataArray?.children?.length > 0 ? (
                    dataArray.children.map((user) => (
                      <MDBCardText key={user._id} className="border-bottom">
                        <strong>Name:</strong> {user.name} <br />
                        <strong>Last Login Location:</strong>
                        {user.lastLoginLocation !== null
                          ? `City: ${user.lastLoginLocation}`
                          : "Not available"}{" "}
                        <br />
                        <strong>Last Login Date:</strong>{" "}
                        {user.lastLoginDate
                          ? new Date(user.lastLoginDate).toLocaleString()
                          : "Not available"}{" "}
                        <br />
                        <Link to={`/report/${user._id}`}>
                          <MDBBtn color="primary" size="sm">
                            View Report
                          </MDBBtn>
                        </Link>
                      </MDBCardText>
                    ))
                  ) : (
                    <p>No child added yet</p>
                  )}
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
          </MDBContainer>
        </div>
        <footer className="bg-primary text-white text-center py-4 mt-5">
          <p>&copy; 2024 Parental Control Dashboard. All rights reserved.</p>
          <p>
            Developed by Your Name |{" "}
            <a href="/about" className="text-white">
              About
            </a>{" "}
            |{" "}
            <a href="/contact" className="text-white">
              Contact
            </a>
          </p>
        </footer>
      </div>
    )
  );
};

export default ParentDashboard;
