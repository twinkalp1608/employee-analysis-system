import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import "../../style/AdminHome.css";

const AdminHome = () => {
    const [stats, setStats] = useState(null);
    const [taskStats, setTaskStats] = useState({
  pending: 0,
  inProgress: 0,
  completed: 0
});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();


     const fetchTaskStats = async () => {

    try {

        const token = localStorage.getItem("token");

        const res = await axios.get(
            "http://https://employee-analysis-system-1.onrender.com//api/tasks",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const tasks = res.data;

        const pending = tasks.filter(t => t.status === "Pending").length;
        const overdue = tasks.filter(t => t.status === "Overdue").length;
        const inProgress = tasks.filter(t => t.status === "In Progress").length;
        const completed = tasks.filter(t => t.status === "Completed").length;

        setTaskStats({
            pending,
            inProgress,
            completed,
            overdue
        });

    } catch (err) {
        console.log(err);
    }
};

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://https://employee-analysis-system-1.onrender.com//api/admin/dashboard-stats", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching stats:", err);
                setError("Failed to load dashboard data");
                setLoading(false);
            }
        };
        fetchStats();
        fetchTaskStats();
    }, []);

    if (loading) return <div className="loading">Loading dashboard...</div>;
    if (error) return <div className="error">{error}</div>;

    const { counts, attendance, activities, monthlyAttendance = [], deptDistribution = [], desigDistribution = [] } = stats;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    const attendanceData = [
        { name: "Present", value: attendance.present, color: "#28a745" },
        { name: "Absent", value: attendance.absent, color: "#dc3545" },
        { name: "Leave", value: attendance.leave, color: "#ffc107" },
    ];

        const taskData = [
            { name: "Pending", value: taskStats.pending, color: "#ffc107" },
            { name: "In Progress", value: taskStats.inProgress, color: "#17a2b8" },
            { name: "Completed", value: taskStats.completed, color: "#28a745" },
            { name: "Overdue", value: taskStats.overdue, color: "#dc3545" },
        ];

    const cardItems = [
        { title: "Total Employees", count: counts.totalEmployees, icon: "👥", link: "/dashboard/employee" },
        { title: "Total HR", count: counts.totalHR, icon: "👩‍💼", link: "/dashboard/hr" },
        { title: "Total Departments", count: counts.totalDepartments, icon: "🏢", link: "/dashboard/organization/department" },
        { title: "Today's Attendance", count: attendance.present, icon: "📅", link: "/dashboard/attendance/list" },
        { title: "Pending Leaves", count: counts.pendingLeaves, icon: "📝", link: "/dashboard/leave", color: counts.pendingLeaves > 0 ? "text-danger" : "" },
        { title: "Monthly Payroll", count: `₹${counts.totalPayroll.toLocaleString()}`, icon: "💰", link: "/dashboard/payroll" },
    ];


   

    return (
        <div className="admin-home">
            <h2 className="dashboard-title">Dashboard Overview</h2>

            {/* 1. Summary Cards */}
            <div className="stat-cards">
                {cardItems.map((item, index) => (
                    <Link to={item.link} key={index} className="stat-card">
                        <div className="stat-icon">{item.icon}</div>
                        <div className="stat-info">
                            <h3>{item.title}</h3>
                            <p className={`stat-count ${item.color || ""}`}>{item.count}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="dashboard-main-content">
                <div className="left-section">
                    {/* Charts Grid */}
                    <div className="charts-grid-container">
                        <div className="chart-row">
                            {/* 2. Attendance Overview Section */}
                            <div className="chart-container mini-chart">
                                <h3>Today's Attendance</h3>
                                <div style={{ width: '100%', height: 230 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={attendanceData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={65}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                                label
                                            >
                                                {attendanceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>


                            {/* Task Progress Chart */}
<div className="chart-container mini-chart" onClick={() => navigate("/dashboard/task")}
  style={{ cursor: "pointer" }}>
    <h3>Task Progress</h3>
    <div style={{ width: '100%', height: 230 }}>
        <ResponsiveContainer>
            <PieChart>
                <Pie
                    data={taskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    dataKey="value"
                    label
                >
                    {taskData.map((entry, index) => (
                        <Cell key={`cell-task-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
        </ResponsiveContainer>
    </div>
</div>

                            {/* 6. 3 Month Attendance Bar Chart */}
                            <div className="chart-container wide-chart">
                                <h3>Last 3 Months Attendance</h3>
                                <div style={{ width: '100%', height: 230 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={monthlyAttendance}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                                            <Bar dataKey="present" fill="#28a745" name="Present" stackId="a" />
                                            <Bar dataKey="absent" fill="#dc3545" name="Absent" stackId="a" />
                                            <Bar dataKey="leave" fill="#ffc107" name="Leave" stackId="a" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="chart-column">
                            {/* 7. Department Distribution PieChart */}
                            <div className="chart-container half-chart">
                                <h3>Department-wise Distribution</h3>
                                <div style={{ width: '100%', height: 230 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={deptDistribution}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={65}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {deptDistribution && deptDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <br />
                            {/* 8. Designation Distribution PieChart */}
                            <div className="chart-container half-chart">
                                <h3>Designation-wise Distribution</h3>
                                <div style={{ width: '100%', height: 230 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={desigDistribution}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={65}
                                                fill="#82ca9d"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {desigDistribution && desigDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Recent Activities Section */}
                <div className="right-section activity-panel">
                    <h3>Recent Activities</h3>
                    <div className="activity-list">
                        {activities.length > 0 ? (
                            activities.map((act, index) => (
                                <div key={index} className="activity-item">
                                    <div className="activity-icon">
                                        {act.type.includes("Employee") ? "👤" : act.type.includes("Leave") ? "📝" : "🏢"}
                                    </div>
                                    <div className="activity-detail">
                                        <p className="activity-type">{act.type}</p>
                                        <p className="activity-info">{act.detail}</p>
                                        <span className="activity-date">{new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-activity">No recent activities found.</p>
                        )}
                    </div>

                    {/* 4. Quick Actions Section (Moved here) */}
                    <div className="quick-actions-sidebar">
                        <h3>Quick Actions</h3>
                        <div className="action-buttons-sidebar">
                            <button onClick={() => navigate("/dashboard/employee")} className="action-btn-sidebar">
                                <span className="btn-icon">➕</span> Add Employee
                            </button>
                            <button onClick={() => navigate("/dashboard/leave")} className="action-btn-sidebar">
                                <span className="btn-icon">📝</span> Approve Leaves
                            </button>
                            <button onClick={() => navigate("/dashboard/payroll")} className="action-btn-sidebar">
                                <span className="btn-icon">💵</span> Process Payroll
                            </button>
                            <button onClick={() => navigate("/dashboard/report")} className="action-btn-sidebar">
                                <span className="btn-icon">📊</span> View Reports
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHome;