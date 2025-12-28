<script lang="ts">
    interface Props {
        projects: string[];
        projectRoot: string;
        dates: string[];
        selectedProject: string;
        selectedDate: string;
        onProjectChange: (project: string) => void;
        onDateChange: (date: string) => void;
    }

    let {
        projects,
        projectRoot,
        dates,
        selectedProject,
        selectedDate,
        onProjectChange,
        onDateChange,
    }: Props = $props();

    // Current calendar month (YYYYMM format)
    let currentMonth = $state(() => {
        if (selectedDate && selectedDate.length === 8) {
            return selectedDate.slice(0, 6);
        }
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    });

    // Set of dates that have daily logs (for quick lookup)
    const datesSet = $derived(new Set(dates));

    // Calendar data for current month
    const calendarData = $derived(() => {
        const monthStr =
            typeof currentMonth === "function" ? currentMonth() : currentMonth;
        const year = parseInt(monthStr.slice(0, 4), 10);
        const month = parseInt(monthStr.slice(4, 6), 10);

        // First day of month
        const firstDay = new Date(year, month - 1, 1);
        const startDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, ...

        // Days in month
        const daysInMonth = new Date(year, month, 0).getDate();

        // Build calendar grid (6 weeks max)
        const weeks: (number | null)[][] = [];
        let week: (number | null)[] = [];

        // Fill empty cells before first day
        for (let i = 0; i < startDayOfWeek; i++) {
            week.push(null);
        }

        // Fill days
        for (let day = 1; day <= daysInMonth; day++) {
            week.push(day);
            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
        }

        // Fill remaining empty cells
        if (week.length > 0) {
            while (week.length < 7) {
                week.push(null);
            }
            weeks.push(week);
        }

        return { year, month, weeks };
    });

    function formatMonthDisplay(): string {
        const monthStr =
            typeof currentMonth === "function" ? currentMonth() : currentMonth;
        const year = monthStr.slice(0, 4);
        const month = monthStr.slice(4, 6);
        return `${year}年${parseInt(month, 10)}月`;
    }

    function prevMonth() {
        const monthStr =
            typeof currentMonth === "function" ? currentMonth() : currentMonth;
        const year = parseInt(monthStr.slice(0, 4), 10);
        const month = parseInt(monthStr.slice(4, 6), 10);

        let newYear = year;
        let newMonth = month - 1;
        if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        currentMonth = `${newYear}${String(newMonth).padStart(2, "0")}`;
    }

    function nextMonth() {
        const monthStr =
            typeof currentMonth === "function" ? currentMonth() : currentMonth;
        const year = parseInt(monthStr.slice(0, 4), 10);
        const month = parseInt(monthStr.slice(4, 6), 10);

        let newYear = year;
        let newMonth = month + 1;
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }
        currentMonth = `${newYear}${String(newMonth).padStart(2, "0")}`;
    }

    function getDateStr(day: number): string {
        const { year, month } = calendarData();
        return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
    }

    function hasLog(day: number): boolean {
        return datesSet.has(getDateStr(day));
    }

    function isToday(day: number): boolean {
        const now = new Date();
        const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        return getDateStr(day) === todayStr;
    }

    function isSelected(day: number): boolean {
        return getDateStr(day) === selectedDate;
    }

    function handleDayClick(day: number) {
        if (hasLog(day)) {
            onDateChange(getDateStr(day));
        }
    }

    const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
</script>

<aside class="sidebar">
    <div class="sidebar-section">
        <h3>📂 プロジェクト</h3>
        <ul class="project-list">
            {#each projects as project}
                <li>
                    <button
                        class="project-item"
                        class:active={project === selectedProject}
                        onclick={() => onProjectChange(project)}
                    >
                        <span class="project-name">{project}</span>
                        <span class="project-path"
                            >({projectRoot}/projects/{project})</span
                        >
                    </button>
                </li>
            {/each}
        </ul>
        {#if projects.length === 0}
            <p class="empty">プロジェクトがありません</p>
        {/if}
    </div>

    <div class="sidebar-section calendar-section">
        <h3>📅 カレンダー</h3>

        <div class="calendar">
            <div class="calendar-header">
                <button class="nav-btn" onclick={prevMonth}>◀</button>
                <span class="month-label">{formatMonthDisplay()}</span>
                <button class="nav-btn" onclick={nextMonth}>▶</button>
            </div>

            <div class="weekday-row">
                {#each WEEKDAYS as day, i}
                    <span class="weekday" class:weekend={i === 0 || i === 6}
                        >{day}</span
                    >
                {/each}
            </div>

            <div class="calendar-grid">
                {#each calendarData().weeks as week}
                    {#each week as day}
                        {#if day === null}
                            <span class="day-cell empty-cell"></span>
                        {:else}
                            <button
                                class="day-cell"
                                class:has-log={hasLog(day)}
                                class:today={isToday(day)}
                                class:selected={isSelected(day)}
                                class:disabled={!hasLog(day)}
                                onclick={() => handleDayClick(day)}
                                disabled={!hasLog(day)}
                            >
                                {day}
                            </button>
                        {/if}
                    {/each}
                {/each}
            </div>

            <div class="calendar-legend">
                <span class="legend-item">
                    <span class="legend-dot has-log"></span> 日報あり
                </span>
            </div>
        </div>
    </div>
</aside>

<style>
    .sidebar {
        width: 260px;
        min-height: 100vh;
        background: rgba(20, 20, 30, 0.95);
        border-right: 1px solid var(--glass-border);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .sidebar-section h3 {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-secondary);
        margin: 0 0 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--glass-border);
    }

    .project-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .project-name {
        font-weight: 500;
    }

    .project-path {
        font-size: 0.65rem;
        color: var(--text-secondary);
        opacity: 0.5;
        display: block;
        margin-top: 0.15rem;
        word-break: break-all;
        font-family: "SF Mono", "Monaco", "Menlo", monospace;
    }

    .project-item {
        width: 100%;
        padding: 0.625rem 0.75rem;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        font-size: 0.875rem;
        transition: background 0.2s;
    }

    .project-item:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .project-item.active {
        background: var(--primary);
        color: white;
    }

    /* Calendar styles */
    .calendar {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        padding: 0.75rem;
    }

    .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .nav-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        font-size: 0.75rem;
        border-radius: 4px;
        transition: all 0.2s;
    }

    .nav-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
    }

    .month-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    .weekday-row {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        margin-bottom: 4px;
    }

    .weekday {
        text-align: center;
        font-size: 0.625rem;
        color: var(--text-secondary);
        padding: 0.25rem 0;
    }

    .weekday.weekend {
        color: var(--accent);
        opacity: 0.7;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
    }

    .day-cell {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        border-radius: 4px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--text-secondary);
        cursor: default;
        transition: all 0.15s;
    }

    .day-cell.empty-cell {
        background: transparent;
    }

    .day-cell.disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .day-cell.has-log {
        background: rgba(99, 102, 241, 0.2);
        color: var(--text-primary);
        cursor: pointer;
        border-color: rgba(99, 102, 241, 0.3);
    }

    .day-cell.has-log:hover {
        background: rgba(99, 102, 241, 0.35);
        border-color: var(--primary);
    }

    .day-cell.today {
        border-color: var(--accent);
        font-weight: 600;
    }

    .day-cell.selected {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
    }

    .calendar-legend {
        margin-top: 0.75rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--glass-border);
        display: flex;
        justify-content: center;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.625rem;
        color: var(--text-secondary);
    }

    .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
    }

    .legend-dot.has-log {
        background: rgba(99, 102, 241, 0.4);
        border: 1px solid rgba(99, 102, 241, 0.6);
    }

    .empty {
        font-size: 0.75rem;
        color: var(--text-secondary);
        text-align: center;
        padding: 1rem;
    }
</style>
