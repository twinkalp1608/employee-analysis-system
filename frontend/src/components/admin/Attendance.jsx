import { Outlet } from "react-router-dom";
import "../../style/Attendance.css";

const Attendance = () => {
  return (
    <div className="attendance-container">
      <Outlet />
    </div>
  );
};

export default Attendance;