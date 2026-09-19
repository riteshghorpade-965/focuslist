(() => {

    "use strict";


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const STORAGE_KEY = "focuslist_tasks_v2";
    const THEME_KEY = "focuslist_theme_v1";


    /* =====================================================
       APPLICATION STATE
    ===================================================== */

    const state = {

        tasks: [],

        status: "all",

        priority: "all",

        search: "",

        editingId: null

    };


    /* =====================================================
       DOM HELPERS
    ===================================================== */

    const $ = (selector, root = document) =>
        root.querySelector(selector);


    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];


    const elements = {

        taskInput: $("#taskInput"),

        priorityInput: $("#priorityInput"),

        addTaskBtn: $("#addTaskBtn"),

        inputError: $("#inputError"),

        searchInput: $("#searchInput"),

        priorityFilter: $("#priorityFilter"),

        taskList: $("#taskList"),

        emptyState: $("#emptyState"),

        emptyTitle: $("#emptyTitle"),

        emptyMessage: $("#emptyMessage"),

        emptyActionBtn: $("#emptyActionBtn"),

        totalTasks: $("#totalTasks"),

        completedTasks: $("#completedTasks"),

        pendingTasks: $("#pendingTasks"),

        allCount: $("#allCount"),

        activeCount: $("#activeCount"),

        completedCount: $("#completedCount"),

        pendingPill: $("#pendingPill"),

        focusPercent: $("#focusPercent"),

        focusMessage: $("#focusMessage"),

        ringValue: $("#ringValue"),

        focusRing: $("#focusRing"),

        sideProgressText: $("#sideProgressText"),

        sideProgressBar: $("#sideProgressBar"),

        sideProgressMessage: $("#sideProgressMessage"),

        listTitle: $("#listTitle"),

        dateChip: $("#dateChip"),

        liveStatus: $("#liveStatus"),

        editModal: $("#editModal"),

        editTaskInput: $("#editTaskInput"),

        editPriorityInput: $("#editPriorityInput"),

        closeModal: $("#closeModal"),

        cancelEdit: $("#cancelEdit"),

        saveEdit: $("#saveEdit"),

        themeBtn: $("#themeBtn"),

        exportBtn: $("#exportBtn"),

        clearCompletedBtn: $("#clearCompletedBtn")

    };



    /* =====================================================
       SECURITY / DATA CLEANING
    ===================================================== */

    function cleanTitle(value) {

        return value
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 140);

    }


    function escapeHTML(value) {

        return String(value).replace(
            /[&<>"']/g,
            character => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            })[character]
        );

    }



    /* =====================================================
       ID GENERATOR
    ===================================================== */

    function generateId() {

        return (
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .slice(2, 8)
        );

    }



    /* =====================================================
       ACCESSIBILITY ANNOUNCEMENTS
    ===================================================== */

    function announce(message) {

        elements.liveStatus.textContent = "";

        requestAnimationFrame(() => {

            elements.liveStatus.textContent =
                message;

        });

    }



    /* =====================================================
       LOCAL STORAGE
    ===================================================== */

    function saveTasks() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(state.tasks)
            );

        } catch {

            announce(
                "Unable to save tasks locally."
            );

        }

    }


    function loadTasks() {

        try {

            const raw =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    ) || "[]"
                );


            if (!Array.isArray(raw)) {

                state.tasks = [];

                return;

            }


            state.tasks = raw

                .filter(task =>
                    task &&
                    typeof task.title === "string" &&
                    typeof task.completed === "boolean" &&
                    ["high", "medium", "low"]
                        .includes(task.priority)
                )

                .map(task => ({

                    id:
                        String(
                            task.id ||
                            generateId()
                        ),

                    title:
                        cleanTitle(task.title),

                    priority:
                        task.priority,

                    completed:
                        task.completed,

                    createdAt:
                        Number(task.createdAt) ||
                        Date.now()

                }));

        } catch {

            state.tasks = [];

        }

    }



    /* =====================================================
       DATE
    ===================================================== */

    function formatDate(timestamp) {

        return new Intl.DateTimeFormat(
            undefined,
            {
                month: "short",
                day: "numeric"
            }
        ).format(timestamp);

    }



    /* =====================================================
       PRIORITY
    ===================================================== */

    function priorityLabel(priority) {

        return (
            priority.charAt(0).toUpperCase() +
            priority.slice(1)
        );

    }



    /* =====================================================
       FILTERING
    ===================================================== */

    function getFilteredTasks() {

        const search =
            state.search.toLowerCase();


        return state.tasks

            .filter(task => {

                const statusMatch =
                    state.status === "all" ||

                    (
                        state.status === "active" &&
                        !task.completed
                    ) ||

                    (
                        state.status === "completed" &&
                        task.completed
                    );


                const priorityMatch =
                    state.priority === "all" ||
                    task.priority === state.priority;


                const searchMatch =
                    !search ||
                    task.title
                        .toLowerCase()
                        .includes(search);


                return (
                    statusMatch &&
                    priorityMatch &&
                    searchMatch
                );

            })


            .sort((a, b) => {

                if (
                    Number(a.completed) !==
                    Number(b.completed)
                ) {

                    return (
                        Number(a.completed) -
                        Number(b.completed)
                    );

                }


                const priorityOrder = {

                    high: 0,
                    medium: 1,
                    low: 2

                };


                if (
                    priorityOrder[a.priority] !==
                    priorityOrder[b.priority]
                ) {

                    return (
                        priorityOrder[a.priority] -
                        priorityOrder[b.priority]
                    );

                }


                return b.createdAt - a.createdAt;

            });

    }



    /* =====================================================
       STATISTICS
    ===================================================== */

    function getStatistics() {

        const total =
            state.tasks.length;


        const completed =
            state.tasks.filter(
                task => task.completed
            ).length;


        const pending =
            total - completed;


        const percentage =
            total === 0
                ? 0
                : Math.round(
                    (completed / total) * 100
                );


        return {

            total,
            completed,
            pending,
            percentage

        };

    }



    /* =====================================================
       RENDER APPLICATION
    ===================================================== */

    function render() {

        const stats =
            getStatistics();


        const tasks =
            getFilteredTasks();



        /* ---------- Statistics ---------- */

        elements.totalTasks.textContent =
            stats.total;


        elements.completedTasks.textContent =
            stats.completed;


        elements.pendingTasks.textContent =
            stats.pending;


        elements.allCount.textContent =
            stats.total;


        elements.activeCount.textContent =
            stats.pending;


        elements.completedCount.textContent =
            stats.completed;


        elements.pendingPill.textContent =
            `${stats.pending} pending`;



        /* ---------- Focus Score ---------- */

        elements.focusPercent.textContent =
            `${stats.percentage}%`;


        elements.ringValue.textContent =
            `${stats.percentage}%`;


        elements.focusRing.style.setProperty(
            "--progress",
            `${stats.percentage}%`
        );


        elements.sideProgressText.textContent =
            `${stats.percentage}%`;


        elements.sideProgressBar.style.width =
            `${stats.percentage}%`;



        /* ---------- Messages ---------- */

        let message;


        if (stats.total === 0) {

            message =
                "Start with one small win.";

        }

        else if (stats.percentage === 100) {

            message =
                "Everything on the list is done. ✦";

        }

        else if (stats.percentage >= 70) {

            message =
                "You're in the final stretch.";

        }

        else if (stats.percentage >= 40) {

            message =
                "Good momentum. Keep going.";

        }

        else {

            message =
                "One task at a time.";

        }


        elements.focusMessage.textContent =
            message;


        elements.sideProgressMessage.textContent =
            message;



        /* ---------- Navigation ---------- */

        const titles = {

            all: "All tasks",

            active: "In progress",

            completed: "Completed"

        };


        elements.listTitle.textContent =
            titles[state.status];


        $$(".filter-btn").forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.filter ===
                state.status
            );

        });



        /* ---------- Tasks ---------- */

        elements.taskList.innerHTML =
            tasks.map(task => `

                <article
                    class="task ${task.completed ? "is-complete" : ""}"
                    data-id="${escapeHTML(task.id)}"
                >

                    <button
                        class="check-btn"
                        data-action="toggle"
                        type="button"
                        aria-label="${
                            task.completed
                                ? "Mark incomplete"
                                : "Mark complete"
                        } ${escapeHTML(task.title)}"
                    >
                        ${
                            task.completed
                                ? "✓"
                                : ""
                        }
                    </button>


                    <div class="task-main">

                        <div class="task-title">
                            ${escapeHTML(task.title)}
                        </div>


                        <div class="task-meta">

                            <span
                                class="
                                    priority-tag
                                    priority-${task.priority}
                                "
                            >
                                ${priorityLabel(task.priority)}
                            </span>

                            <span>•</span>

                            <span>
                                Added ${formatDate(task.createdAt)}
                            </span>

                            ${
                                task.completed
                                    ? `
                                        <span>•</span>
                                        <span>Completed</span>
                                      `
                                    : ""
                            }

                        </div>

                    </div>


                    <div class="task-actions">

                        <button
                            class="icon-btn"
                            data-action="edit"
                            type="button"
                            aria-label="Edit task"
                        >
                            ✎
                        </button>


                        <button
                            class="icon-btn delete"
                            data-action="delete"
                            type="button"
                            aria-label="Delete task"
                        >
                            ⌫
                        </button>

                    </div>

                </article>

            `).join("");



        /* ---------- Empty State ---------- */

        elements.emptyState.hidden =
            tasks.length !== 0;


        if (tasks.length === 0) {

            const hasFilters =
                state.search ||
                state.priority !== "all" ||
                state.status !== "all";


            elements.emptyTitle.textContent =
                hasFilters
                    ? "No matching tasks"
                    : "Your list is clear";


            elements.emptyMessage.textContent =
                hasFilters
                    ? "Try another search or filter."
                    : "Add your first task above and turn an intention into an action.";


            elements.emptyActionBtn.textContent =
                hasFilters
                    ? "Reset filters"
                    : "Create a task";

        }

    }



    /* =====================================================
       ADD TASK
    ===================================================== */

    function addTask() {

        const title =
            cleanTitle(
                elements.taskInput.value
            );


        if (!title) {

            elements.inputError.textContent =
                "Give your task a name first.";

            elements.taskInput.focus();

            return;

        }


        elements.inputError.textContent = "";


        state.tasks.unshift({

            id: generateId(),

            title,

            priority:
                elements.priorityInput.value,

            completed: false,

            createdAt: Date.now()

        });


        elements.taskInput.value = "";


        saveTasks();

        render();


        announce(
            `Added ${title}`
        );


        elements.taskInput.focus();

    }



    /* =====================================================
       COMPLETE TASK
    ===================================================== */

    function toggleTask(id) {

        const task =
            state.tasks.find(
                item => item.id === id
            );


        if (!task) return;


        task.completed =
            !task.completed;


        saveTasks();

        render();


        announce(
            task.completed
                ? `Completed ${task.title}`
                : `Reopened ${task.title}`
        );

    }



    /* =====================================================
       DELETE TASK
    ===================================================== */

    function deleteTask(id) {

        const task =
            state.tasks.find(
                item => item.id === id
            );


        if (!task) return;


        state.tasks =
            state.tasks.filter(
                item => item.id !== id
            );


        saveTasks();

        render();


        announce(
            `Deleted ${task.title}`
        );

    }



    /* =====================================================
       EDIT TASK
    ===================================================== */

    function openEditModal(id) {

        const task =
            state.tasks.find(
                item => item.id === id
            );


        if (!task) return;


        state.editingId = id;


        elements.editTaskInput.value =
            task.title;


        elements.editPriorityInput.value =
            task.priority;


        elements.editModal.hidden =
            false;


        elements.editTaskInput.focus();

    }


    function closeEditModal() {

        state.editingId = null;

        elements.editModal.hidden =
            true;

    }


    function saveEditedTask() {

        const task =
            state.tasks.find(
                item =>
                    item.id ===
                    state.editingId
            );


        const title =
            cleanTitle(
                elements.editTaskInput.value
            );


        if (!task || !title) return;


        task.title = title;

        task.priority =
            elements.editPriorityInput.value;


        saveTasks();

        render();

        closeEditModal();


        announce(
            "Task updated"
        );

    }



    /* =====================================================
       THEME
    ===================================================== */

    function applyTheme(theme) {

        document.documentElement
            .dataset.theme = theme;


        localStorage.setItem(
            THEME_KEY,
            theme
        );

    }


    function initializeTheme() {

        const savedTheme =
            localStorage.getItem(
                THEME_KEY
            );


        const systemTheme =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "dark"
                : "light";


        applyTheme(
            savedTheme ||
            systemTheme
        );

    }



    /* =====================================================
       EXPORT
    ===================================================== */

    function exportTasks() {

        const data = {

            app: "FocusList",

            exportedAt:
                new Date().toISOString(),

            tasks:
                state.tasks

        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        data,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;

        link.download =
            "focuslist-tasks.json";


        link.click();


        URL.revokeObjectURL(url);


        announce(
            "Tasks exported successfully"
        );

    }



    /* =====================================================
       CLEAR COMPLETED
    ===================================================== */

    function clearCompleted() {

        const count =
            state.tasks.filter(
                task => task.completed
            ).length;


        if (count === 0) {

            announce(
                "There are no completed tasks"
            );

            return;

        }


        state.tasks =
            state.tasks.filter(
                task => !task.completed
            );


        saveTasks();

        render();


        announce(
            `Cleared ${count} completed task${
                count === 1
                    ? ""
                    : "s"
            }`
        );

    }



    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    elements.addTaskBtn.addEventListener(
        "click",
        addTask
    );


    elements.taskInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                addTask();

            }

        }
    );


    elements.taskInput.addEventListener(
        "input",
        () => {

            elements.inputError.textContent =
                "";

        }
    );



    /* Search */

    elements.searchInput.addEventListener(
        "input",
        event => {

            state.search =
                event.target.value;

            render();

        }
    );



    /* Priority filter */

    elements.priorityFilter.addEventListener(
        "change",
        event => {

            state.priority =
                event.target.value;

            render();

        }
    );



    /* Status filters */

    $$(".filter-btn").forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    state.status =
                        button.dataset.filter;

                    render();

                }
            );

        }
    );



    /* Quick priority */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-quick-priority]"
                );


            if (!button) return;


            elements.priorityInput.value =
                button.dataset.quickPriority;

        }
    );



    /* Task list event delegation */

    elements.taskList.addEventListener(
        "click",
        event => {

            const action =
                event.target.closest(
                    "[data-action]"
                );


            const taskElement =
                event.target.closest(
                    "[data-id]"
                );


            if (!action || !taskElement) {
                return;
            }


            const id =
                taskElement.dataset.id;


            switch (
                action.dataset.action
            ) {

                case "toggle":

                    toggleTask(id);

                    break;


                case "edit":

                    openEditModal(id);

                    break;


                case "delete":

                    deleteTask(id);

                    break;

            }

        }
    );



    /* Modal */

    elements.closeModal.addEventListener(
        "click",
        closeEditModal
    );


    elements.cancelEdit.addEventListener(
        "click",
        closeEditModal
    );


    elements.saveEdit.addEventListener(
        "click",
        saveEditedTask
    );


    elements.editTaskInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                saveEditedTask();

            }

        }
    );


    elements.editModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                elements.editModal
            ) {

                closeEditModal();

            }

        }
    );



    /* Keyboard shortcuts */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !elements.editModal.hidden
            ) {

                closeEditModal();

            }


            if (
                event.key === "/" &&
                document.activeElement.tagName !==
                    "INPUT" &&
                document.activeElement.tagName !==
                    "SELECT"
            ) {

                event.preventDefault();

                elements.searchInput.focus();

            }

        }
    );



    /* Empty state */

    elements.emptyActionBtn.addEventListener(
        "click",
        () => {

            const hasFilters =
                state.search ||
                state.priority !== "all" ||
                state.status !== "all";


            if (hasFilters) {

                state.search = "";

                state.priority = "all";

                state.status = "all";


                elements.searchInput.value =
                    "";


                elements.priorityFilter.value =
                    "all";


                render();

            } else {

                elements.taskInput.focus();

            }

        }
    );



    /* Utility buttons */

    elements.clearCompletedBtn.addEventListener(
        "click",
        clearCompleted
    );


    elements.exportBtn.addEventListener(
        "click",
        exportTasks
    );


    elements.themeBtn.addEventListener(
        "click",
        () => {

            const current =
                document.documentElement
                    .dataset.theme;


            const next =
                current === "dark"
                    ? "light"
                    : "dark";


            applyTheme(next);


            announce(
                `${next} theme enabled`
            );

        }
    );



    /* Date */

    elements.dateChip.textContent =
        new Intl.DateTimeFormat(
            undefined,
            {
                weekday: "short",
                month: "short",
                day: "numeric"
            }
        ).format(new Date());



    /* =====================================================
       INITIALIZE
    ===================================================== */

    initializeTheme();

    loadTasks();

    render();

})();