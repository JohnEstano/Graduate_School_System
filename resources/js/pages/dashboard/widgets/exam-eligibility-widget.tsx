import React from 'react';

const ExamEligibilityWidget: React.FC = () => {
  return (
    <div className="border-sidebar-border/70 dark:border-sidebar-border aspect-video rounded-xl border p-5 flex flex-col justify-between bg-white dark:bg-zinc-900">
      <h3 className="text-[13px] font-medium mb-2">Exam Eligibility</h3>
      <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
        <p className="mb-2">
          Placeholder content. This widget will later show the student&apos;s eligibility
          status for upcoming comprehensive / qualifying exams.
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>GPA check</li>
          <li>Completed prerequisites</li>
          <li>Defense stage status</li>
        </ul>
      </div>
    </div>
  );
};

export default ExamEligibilityWidget;