import React from 'react';

const ExamEligibilityWidget: React.FC<{ simple?: boolean }> = ({ simple }) => {
  // Replace this with your real eligibility logic:
  const eligible = true; // or false

  if (simple) {
    return (
      <span className={`font-bold text-2xl ${eligible ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}`}>
        {eligible ? "Eligible" : "Not Eligible"}
      </span>
    );
  }

  // (Optional: keep the full widget for other uses)
  return (
    <div className="border-sidebar-border/70 dark:border-sidebar-border aspect-video rounded-xl border p-5 flex flex-col justify-between bg-white dark:bg-zinc-900">
      <h3 className="text-[13px] font-medium mb-2">Exam Eligibility</h3>
      
    </div>
  );
};

export default ExamEligibilityWidget;