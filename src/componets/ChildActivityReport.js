import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  MDBContainer,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBBtn,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
  MDBSpinner,
} from "mdb-react-ui-kit";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import "../css/ChildActivityReport.css";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ChildActivityReport = () => {
  const { userId } = useParams();
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoader] = useState(true);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchChildData = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/user-activity/${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch activity data");
        }
        const data = await response.json();

        const aggregatedData = data.reduce((acc, activity) => {
          acc[activity.url] = (acc[activity.url] || 0) + activity.timeSpent;
          return acc;
        }, {});

        const labels = Object.keys(aggregatedData);
        const times = Object.values(aggregatedData);

        setChartData({
          labels,
          datasets: [
            {
              label: "Time Spent (seconds)",
              data: times,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        });

        setActivityData(data);
        setLoader(false);
      } catch (err) {
        setLoader(false);
      }
    };
    fetchChildData();
  }, [userId]);

  const exportToExcel = () => {
      const ws = XLSX.utils.json_to_sheet(activityData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Activity Report");
      XLSX.writeFile(wb, `child_activity_report_${userId}.xlsx`);
  };

  if (loading)
    return (
      <MDBContainer className="text-center my-5">
        <MDBSpinner grow color="primary" />
        <p>Loading...</p>
      </MDBContainer>
    );

  return (
    <MDBContainer className="my-5">
      <MDBCol>
        <MDBCard className="shadow-lg">
          <MDBCardBody>
            <MDBCardTitle className="text-center mb-4 text-uppercase text-primary">
              Child Activity Report
            </MDBCardTitle>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <MDBBtn color="success" onClick={exportToExcel}>
                Export to Excel
              </MDBBtn>
              <Link to="/dashboard">
                <MDBBtn outline color="dark">
                  Back to Dashboard
                </MDBBtn>
              </Link>
            </div>

            <div className="table-responsive">
            <MDBTable bordered hover className="table-striped">
              <MDBTableHead dark>
                <tr>
                  <th>#</th> 
                  <th>URL</th>
                  <th>Time Spent (seconds)</th>
                  <th>Timestamp</th>
                </tr>
              </MDBTableHead>
              <MDBTableBody>
                {activityData.map((activity, index) => (
                  <tr key={activity._id}>
                    <td>{index + 1}</td> 
                    <td>{activity.url}</td>
                    <td>{activity.timeSpent.toFixed(2)}</td>
                    <td>{new Date(activity.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </MDBTableBody>
            </MDBTable>
            </div>
            {chartData && (
              <div className="chart-container mb-4">
                <h5 className="text-center mb-3 text-secondary">
                  Time Spent on Sites
                </h5>
                <Bar data={chartData} options={{ responsive: true }} />
              </div>
            )}
          </MDBCardBody>
        </MDBCard>
      </MDBCol>
    </MDBContainer>
  );
};

export default ChildActivityReport;
