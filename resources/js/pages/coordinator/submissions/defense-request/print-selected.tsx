import React from "react";
import type { DefenseRequestSummary } from "./show-all-requests";

type PrintSelectedProps = {
  rows: DefenseRequestSummary[];
};

export const PrintSelected: React.FC<PrintSelectedProps> = ({ rows }) => (
  <div style={{ fontFamily: "Arial, sans-serif", padding: 32 }}>
    <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
      <img src="/grad_logo.png" alt="Graduate School Logo" style={{ height: 60, marginRight: 20 }} />
      <div>
        <h1 style={{ fontSize: 22, margin: 0, fontWeight: 700 }}>Graduate School</h1>
        <div style={{ fontSize: 14, color: "#555" }}>University of the Immaculate Conception</div>
        <div style={{ fontSize: 13, color: "#888" }}>Defense Requests Report</div>
      </div>
    </div>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ background: "#f5f5f5" }}>
          <th style={{ border: "1px solid #ddd", padding: 8 }}>Presenter</th>
          <th style={{ border: "1px solid #ddd", padding: 8 }}>Program</th>
          <th style={{ border: "1px solid #ddd", padding: 8 }}>Thesis Title</th>
          <th style={{ border: "1px solid #ddd", padding: 8 }}>Date of Defense</th>
          <th style={{ border: "1px solid #ddd", padding: 8 }}>Mode</th>
          <th style={{ border: "1px solid #ddd", padding: 8 }}>Status</th>
          <th style={{ border: "1px solid #ddd", padding: 8 }}>Priority</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td style={{ border: "1px solid #ddd", padding: 8 }}>
              {r.first_name} {r.middle_name ? r.middle_name + " " : ""}{r.last_name}
            </td>
            <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.program}</td>
            <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.thesis_title}</td>
            <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.date_of_defense}</td>
            <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.mode_defense}</td>
            <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.status}</td>
            <td style={{ border: "1px solid #ddd", padding: 8 }}>{r.priority}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ marginTop: 32, fontSize: 12, color: "#888" }}>
      Printed on: {new Date().toLocaleString()}
    </div>
  </div>
);

export default PrintSelected;