import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import Careers from "./Pages/Careers";
import ApplyJob from "./Pages/ApplyJob";
import "leaflet/dist/leaflet.css";
import ForgotPassword from "./Pages/ForgotPassword";
import Dashboard from "./Pages/Dashboard";
import HrDashboard from "./Pages/HrDashboard";
import AddEmployee from "./components/admin/AddEmployee";
import EmployeeView from "./components/admin/EmployeeView";
import EditEmployee from "./components/admin/EditEmployee";
import Department from "./components/admin/Department";
import EmployeeDashboard from "./Pages/EmployeeDashboard";
import AdminLeave from "./components/admin/AdminLeave";
// import EmployeeApplyLeave from "./components/Employees/EmployeeApplyLeave";
import AdminPayroll from "./components/admin/AdminPayroll";
// import EmployeeTasks from "./components/Employees/EmployeeTask";
import Performance from "./components/admin/Performance";
// import EmployeeMarkAttendance from "./components/Employees/EmployeeMarkAttendance";
// import EmployeeAttendanceRequest from "./components/Employees/EmployeeAttendanceRequest";
// import EmployeeSurvey from "./components/Employees/EmployeeSurvey";



// Private Route
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/apply-job/:jobId" element={<ApplyJob />} />

      {/* Dashboard with nested routes */}
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* Other standalone routes */}
      <Route path="/hrdashboard/*" element={<HrDashboard />} />
      <Route path="/add-employee" element={<AddEmployee />} />
      <Route path="/employee/:id" element={<EmployeeView />} />
      <Route path="/employee/edit/:id" element={<EditEmployee />} />
      <Route path="/department" element={<Department/>}/>
<Route
  path="/employee-dashboard/*"
  element={
    <PrivateRoute>
      <EmployeeDashboard />
    </PrivateRoute>
  }
/>      {/* <Route path="/employee/attendance" element={<EmployeeMarkAttendance />} /> */}
      {/* <Route path="/employee-dashboard/attendance-request" element={<EmployeeAttendanceRequest />} /> */}
<Route path="/admin/leaves" element={<AdminLeave/>}/>
      {/* <Route path="/employee/apply-leave" element={<EmployeeApplyLeave />} /> */}
      <Route path="/employee/payroll" element={<AdminPayroll />} />
      {/* <Route path="/employee/tasks" element={<EmployeeTasks />} /> */}
      {/* <Route
        path="/employee/engagement"
        element={
          <PrivateRoute>
            <EmployeeSurvey />
          </PrivateRoute>
        }
      /> */}
      <Route path="/performance" element={<Performance />} />

    
    </Routes>
  );
}
