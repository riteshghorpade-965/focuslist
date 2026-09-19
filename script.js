"use strict";

/* =========================
   FocusList - Task Manager
   Frontend-only + LocalStorage
   ========================= */

const STORAGE_KEY = "focuslist_tasks_v1";

let tasks = loadTasks();
let currentStatusFilter = "all";
let editingTaskId = null;

/* ---------- DOM Elements ---------- */

const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const inputError = document.getElementById("inputError");

const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyMessage = document.getElementById("emptyMessage");

const totalTasks = document.getElementById("totalTasks");
const completedTasks = document.getElementById("completedTasks");
const pendingTasks = document.getElementById("pendingTasks");

const allCount = document.getElementById("allCount");
const activeCount = document.getElementById("activeCount");
const completedCount = document.getElementById("completedCount");

const filterButtons = document.querySelectorAll(".filter-btn");

const editModal = document.getElementById("editModal");
const editTaskInput = document.getElementById("editTaskInput");
const editPriorityInput = document.getElementById("editPriorityInput");
const closeModal = document.getElementById("closeModal");
const cancelEdit = document.getElementById("cancelEdit");
const saveEdit = document.getElementById("saveEdit");


/* =========================
   LocalStorage
   ========================= */

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter(task =>
                task &&
                typeof task.id === "string" &&
                typeof task.title === "string"
            )
            .map(task => ({
                id: task.id,
                title: task.title.slice(0, 150),
                priority: ["high", "medium", "low"].includes(task.priority)
                    ? task.priority
                    : "medium",
                completed: Boolean(task.completed),
                createdAt: Number(task.createdAt) || Date.now()
            }));

    } catch (error) {
        console.error("Could not load tasks:", error);
        return [];
    }
}


function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks:", error);
    }
}


/* =========================
   Utility Functions
   ========================= */

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}


function cleanTitle(value) {
    return value.trim().replace(/\s+/g, " ");
}


function getPriorityLabel(priority) {
    const labels = {
        high: "High",
        medium: "Medium",
        low: "Low"
    };

    return labels[priority] || "Medium";
}


function getPriorityIcon(priority) {
    const icons = {
        high: "🔴",
        medium: "🟡",
        low: "🟢"
    };

    return icons[priority] || "🟡";
}


/* =========================
   Add Task
   ========================= */

function addTask() {

    const title = cleanTitle(taskInput.value);

    inputError.textContent = "";

    if (!title) {
        inputError.textContent = "Please enter a task title.";
        taskInput.focus();
        return;
    }

    if (title.length < 2) {
        inputError.textContent = "Task title must contain at least 2 characters.";
        taskInput.focus();
        return;
    }

    if (title.length > 150) {
        inputError.textContent = "Task title must be 150 characters or less.";
        taskInput.focus();
        return;
    }

    const newTask = {
        id: generateId(),
        title: title,
        priority: priorityInput.value,
        completed: false,
        createdAt: Date.now()
    };

    tasks.unshift(newTask);

    saveTasks();

    taskInput.value = "";
    priorityInput.value = "medium";

    render();

    taskInput.focus();
}


/* =========================
   Toggle Completion
   ========================= */

function toggleTask(taskId) {

    const task = tasks.find(item => item.id === taskId);

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    saveTasks();
    render();
}


/* =========================
   Delete Task
   ========================= */

function deleteTask(taskId) {

    const task = tasks.find(item => item.id === taskId);

    if (!task) {
        return;
    }

    const confirmed = window.confirm(
        `Delete "${task.title}"?`
    );

    if (!confirmed) {
        return;
    }

    tasks = tasks.filter(item => item.id !== taskId);

    saveTasks();
    render();
}


/* =========================
   Edit Task
   ========================= */

function openEditModal(taskId) {

    const task = tasks.find(item => item.id === taskId);

    if (!task) {
        return;
    }

    editingTaskId = taskId;

    editTaskInput.value = task.title;
    editPriorityInput.value = task.priority;

    editModal.classList.remove("hidden");

    setTimeout(() => {
        editTaskInput.focus();
        editTaskInput.select();
    }, 50);
}


function closeEditModal() {

    editingTaskId = null;

    editModal.classList.add("hidden");

    editTaskInput.value = "";
}


function saveEditedTask() {

    if (!editingTaskId) {
        return;
    }

    const title = cleanTitle(editTaskInput.value);

    if (!title) {
        editTaskInput.focus();
        return;
    }

    if (title.length < 2 || title.length > 150) {
        editTaskInput.focus();
        return;
    }

    const task = tasks.find(item => item.id === editingTaskId);

    if (!task) {
        closeEditModal();
        return;
    }

    task.title = title;
    task.priority = editPriorityInput.value;

    saveTasks();

    closeEditModal();
    render();
}


/* =========================
   Filtering
   ========================= */

function getFilteredTasks() {

    const searchTerm = cleanTitle(searchInput.value).toLowerCase();
    const selectedPriority = priorityFilter.value;

    return tasks.filter(task => {

        const matchesSearch =
            task.title.toLowerCase().includes(searchTerm);

        const matchesStatus =
            currentStatusFilter === "all" ||
            (currentStatusFilter === "active" && !task.completed) ||
            (currentStatusFilter === "completed" && task.completed);

        const matchesPriority =
            selectedPriority === "all" ||
            task.priority === selectedPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });
}


/* =========================
   Render Tasks
   ========================= */

function render() {

    updateStatistics();

    const filteredTasks = getFilteredTasks();

    taskList.innerHTML = "";

    if (filteredTasks.length === 0) {

        taskList.style.display = "none";
        emptyState.style.display = "block";

        if (tasks.length === 0) {

            emptyTitle.textContent = "No tasks yet";

            emptyMessage.textContent =
                "Add your first task and start getting things done.";

        } else {

            emptyTitle.textContent = "No matching tasks";

            emptyMessage.textContent =
                "Try changing your search or filters.";
        }

        return;
    }

    taskList.style.display = "flex";
    emptyState.style.display = "none";

    filteredTasks.forEach(task => {

        const card = document.createElement("article");

        card.className = "task-card";

        if (task.completed) {
            card.classList.add("completed");
        }

        card.dataset.taskId = task.id;

        /* Completion button */

        const checkbox = document.createElement("button");

        checkbox.className = "checkbox";

        checkbox.type = "button";

        checkbox.setAttribute(
            "aria-label",
            task.completed
                ? `Mark ${task.title} as active`
                : `Mark ${task.title} as completed`
        );

        checkbox.setAttribute(
            "aria-pressed",
            String(task.completed)
        );

        checkbox.textContent = task.completed ? "✓" : "";

        checkbox.addEventListener("click", () => {
            toggleTask(task.id);
        });


        /* Task content */

        const content = document.createElement("div");

        content.className = "task-content";


        const title = document.createElement("div");

        title.className = "task-title";

        title.textContent = task.title;


        const meta = document.createElement("div");

        meta.className = "task-meta";


        const priorityBadge = document.createElement("span");

        priorityBadge.className =
            `priority-badge priority-${task.priority}`;

        priorityBadge.textContent =
            `${getPriorityIcon(task.priority)} ${getPriorityLabel(task.priority)}`;

        meta.appendChild(priorityBadge);

        content.appendChild(title);
        content.appendChild(meta);


        /* Actions */

        const actions = document.createElement("div");

        actions.className = "task-actions";


        const editButton = document.createElement("button");

        editButton.type = "button";

        editButton.className = "action-btn edit-btn";

        editButton.textContent = "✎";

        editButton.setAttribute(
            "aria-label",
            `Edit ${task.title}`
        );

        editButton.addEventListener("click", () => {
            openEditModal(task.id);
        });


        const deleteButton = document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className = "action-btn delete-btn";

        deleteButton.textContent = "🗑";

        deleteButton.setAttribute(
            "aria-label",
            `Delete ${task.title}`
        );

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });


        actions.appendChild(editButton);
        actions.appendChild(deleteButton);


        card.appendChild(checkbox);
        card.appendChild(content);
        card.appendChild(actions);

        taskList.appendChild(card);
    });
}


/* =========================
   Statistics
   ========================= */

function updateStatistics() {

    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const pending = total - completed;

    totalTasks.textContent = total;
    completedTasks.textContent = completed;
    pendingTasks.textContent = pending;

    allCount.textContent = total;

    activeCount.textContent = pending;

    completedCount.textContent = completed;
}


/* =========================
   Event Listeners
   ========================= */

addTaskBtn.addEventListener("click", addTask);


taskInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }
});


taskInput.addEventListener("input", () => {
    inputError.textContent = "";
});


searchInput.addEventListener("input", render);


priorityFilter.addEventListener("change", render);


filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        currentStatusFilter =
            button.dataset.status;

        render();
    });
});


closeModal.addEventListener(
    "click",
    closeEditModal
);


cancelEdit.addEventListener(
    "click",
    closeEditModal
);


saveEdit.addEventListener(
    "click",
    saveEditedTask
);


editTaskInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        event.preventDefault();
        saveEditedTask();
    }

    if (event.key === "Escape") {
        closeEditModal();
    }
});


editModal.addEventListener("click", event => {

    if (event.target === editModal) {
        closeEditModal();
    }
});


document.addEventListener("keydown", event => {

    if (
        event.key === "Escape" &&
        !editModal.classList.contains("hidden")
    ) {
        closeEditModal();
    }
});


/* =========================
   Initial Render
   ========================= */

render();