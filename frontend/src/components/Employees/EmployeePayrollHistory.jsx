import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../style/EmployeePayrollHistory.css";

const EmployeePayrollHistory = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);

  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    fetchPayrollHistory();
  }, []);

  const fetchPayrollHistory = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "https://employee-analysis-system-1.onrender.com/api/employee/payroll/history",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = res.data?.payrolls || [];
      setPayrolls(data);
      setFilteredPayrolls(data);
    } catch (error) {
      console.log("Error fetching payroll history:", error);
      setPayrolls([]);
      setFilteredPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let updated = [...payrolls];

    if (monthFilter) {
      updated = updated.filter((item) => item.month === monthFilter);
    }

    if (statusFilter) {
      updated = updated.filter((item) => item.status === statusFilter);
    }

    if (searchText.trim()) {
      updated = updated.filter((item) =>
        item.paymentMode
          ?.toLowerCase()
          .includes(searchText.trim().toLowerCase())
      );
    }

    setFilteredPayrolls(updated);
  };

  const handleReset = () => {
    setMonthFilter("");
    setStatusFilter("");
    setSearchText("");
    setFilteredPayrolls(payrolls);
  };

  const summary = useMemo(() => {
    const totalPayslips = payrolls.length;
    const paidCount = payrolls.filter((item) => item.status === "Paid").length;
    const pendingCount = payrolls.filter(
      (item) => item.status === "Pending"
    ).length;
    const lastNetSalary = payrolls.length > 0 ? payrolls[0].netSalary || 0 : 0;

    return { totalPayslips, paidCount, pendingCount, lastNetSalary };
  }, [payrolls]);

  return (
    <div className="employee-payroll-history-page">
      <div className="employee-payroll-history-header">
        <h2>Payroll History</h2>
        <p>View your previous payroll records month-wise.</p>
      </div>

      <div className="employee-payroll-summary-grid">
        <div className="employee-payroll-summary-card total-card">
          <h4>Total Payslips</h4>
          <h3>{summary.totalPayslips}</h3>
        </div>

        <div className="employee-payroll-summary-card paid-card">
          <h4>Paid</h4>
          <h3>{summary.paidCount}</h3>
        </div>

        <div className="employee-payroll-summary-card pending-card">
          <h4>Pending</h4>
          <h3>{summary.pendingCount}</h3>
        </div>

        <div className="employee-payroll-summary-card salary-card">
          <h4>Last Net Salary</h4>
          <h3>₹ {summary.lastNetSalary}</h3>
        </div>
      </div>

      <div className="employee-payroll-filter-card">
        <div className="employee-payroll-filter-row">
          <div className="employee-payroll-filter-field">
            <label>Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="">All Months</option>
              {months.map((month, index) => (
                <option key={index} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="employee-payroll-filter-field">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="employee-payroll-filter-field">
            <label>Search Payment Mode</label>
            <input
              type="text"
              placeholder="Search payment mode"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="employee-payroll-filter-buttons">
            <button onClick={handleFilter} className="apply-filter-btn">
              Apply
            </button>
            <button onClick={handleReset} className="reset-filter-btn">
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="employee-payroll-history-table-card">
        {loading ? (
          <p className="employee-payroll-loading">Loading payroll history...</p>
        ) : filteredPayrolls.length === 0 ? (
          <p className="employee-payroll-no-data">No payroll records found.</p>
        ) : (
          <div className="employee-payroll-table-wrapper">
            <table className="employee-payroll-history-table">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Month</th>
                  <th>Gross</th>
                  <th>Deduction</th>
                  <th>Net</th>
                  <th>Status</th>
                  <th>Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((item, index) => (
                  <tr key={item._id || index}>
                    <td>{index + 1}</td>
                    <td>{item.month}</td>
                    <td>₹ {item.grossSalary || 0}</td>
                    <td>₹ {item.totalDeduction || 0}</td>
                    <td className="net-salary-cell">₹ {item.netSalary || 0}</td>
                    <td>
                      <span
                        className={
                          item.status === "Paid"
                            ? "status-badge paid"
                            : "status-badge pending"
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.paymentMode || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePayrollHistory;