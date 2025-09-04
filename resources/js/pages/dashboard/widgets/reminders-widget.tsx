const RemindersWidget = () => (
    <div className="border-sidebar-border/70 dark:border-sidebar-border aspect-video rounded-xl border p-5 flex flex-col justify-between bg-white dark:bg-zinc-900">
        <h3 className="text-[13px] font-medium mb-2">Reminders</h3>
        <ul className="list-disc pl-4 text-xs text-gray-700 dark:text-gray-300">
            <li>Review pending defense requests promptly.</li>
            <li>Confirm upcoming defense schedules.</li>
            <li>Update priorities for urgent requests.</li>
        </ul>
    </div>
);

export default RemindersWidget;