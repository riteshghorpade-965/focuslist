"use strict";

/* =========================
   FOCUSLIST
   State-driven task manager
========================= */

const STORAGE_KEY = "focuslist_tasks_v4";
const THEME_KEY = "focuslist_theme_v1";

const state = {
  tasks: [],
  statusFilter: "all",
  priorityFilter: "all",
  search: "",
  editingId: null,
  sprintInterval: null,
  sprintSeconds: 900
};

/* =========================
   DOM
========================= */

const el = {
  taskForm: document.getElementById("taskForm"),
  taskInput: document.getElementById("taskInput"),
  priorityInput: document.getElementById("priorityInput"),
  inputError: document.getElementById("inputError"),

  searchInput: document.getElementById("searchInput"),
  priorityFilter: document.getElementById("priorityFilter"),

  taskList: document.getElementById("taskList"),
  emptyState: document.getElementById("emptyState"),
  resetFiltersBtn: document.getElementById("resetFiltersBtn"),

  totalStat: document.getElementById("totalStat"),
  activeStat: document.getElementById("activeStat"),
  completedStat: document.getElementById("completedStat"),
  highStat: document.getElementById("highStat"),

  allCount: document.getElementById("allCount"),
  activeCountSide: document.getElementById("activeCountSide"),
  completedCountSide: document.getElementById("completedCountSide"),

  visibleCount: document.getElementById("visibleCount"),

  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  focusScore: document.getElementById("focusScore"),

  editModal: document.getElementById("editModal"),
  editInput: document.getElementById("editInput"),
  editPriority: document.getElementById("editPriority"),
  saveEditBtn: document.getElementById("saveEditBtn"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),

  themeBtn: document.getElementById("themeBtn"),
  exportBtn: document.getElementById("exportBtn"),
  clearCompletedBtn: document.getElementById("clearCompletedBtn"),

  smartPriorityBtn: document.getElementById("smartPriorityBtn"),

  focusSprintBtn: document.getElementById("focusSprintBtn"),
  sprintModal: document.getElementById("sprintModal"),
  sprintTimer: document.getElementById("sprintTimer"),
  sprintTaskName: document.getElementById("sprintTaskName"),
  stopSprintBtn: document.getElementById("stopSprintBtn"),
  closeSprintBtn: document.getElementById("closeSprintBtn"),

  statusMessage: document.getElementById("statusMessage")
};

/* =========================
   UTILITIES
========================= */

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cleanTitle(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function announce(message) {
  el.statusMessage.textContent = message;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(timestamp));
}

function priorityLabel(priority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/* =========================
   SMART PRIORITY
========================= */

function suggestPriority(title) {
  const text = title.toLowerCase();

  const highWords = [
    "urgent",
    "asap",
    "deadline",
    "exam",
    "submit",
    "submission",
    "interview",
    "important",
    "today",
    "critical",
    "final"
  ];

  const lowWords = [
    "later",
    "optional",
    "someday",
    "maybe",
    "read",
    "explore",
    "idea"
  ];

  if (highWords.some(word => text.includes(word))) {
    return "high";
  }

  if (lowWords.some(word => text.includes(word))) {
    return "low";
  }

  return "medium";
}

/* =========================
   STORAGE
========================= */

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  } catch (error) {
    announce("Could not save tasks.");
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      state.tasks = [];
      return;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      state.tasks = [];
      return;
    }

    state.tasks = parsed
      .filter(task =>
        task &&
        typeof task.title === "string" &&
        typeof task.completed === "boolean"
      )
      .map(task => ({
        id: String(task.id || generateId()),
        title: cleanTitle(task.title),
        priority: ["high", "medium", "low"].includes(task.priority)
          ? task.priority
          : "medium",
        completed: Boolean(task.completed),
        createdAt: Number(task.createdAt) || Date.now(),
        completedAt: task.completedAt || null
      }))
      .filter(task => task.title.length > 0);

  } catch (error) {
    state.tasks = [];
  }
}

/* =========================
   TASK CRUD
========================= */

function addTask(title, priority) {
  const clean = cleanTitle(title);

  if (!clean) {
    el.inputError.textContent = "Please enter a task.";
    el.taskInput.focus();
    return;
  }

  if (clean.length < 2) {
    el.inputError.textContent = "Task must contain at least 2 characters.";
    el.taskInput.focus();
    return;
  }

  el.inputError.textContent = "";

  const task = {
    id: generateId(),
    title: clean,
    priority: priority || "medium",
    completed: false,
    createdAt: Date.now(),
    completedAt: null
  };

  state.tasks.unshift(task);
  saveTasks();
  render();

  el.taskForm.reset();
  el.priorityInput.value = "medium";
  el.taskInput.focus();

  announce(`Task added: ${clean}`);
}

function toggleTask(id) {
  const task = state.tasks.find(item => item.id === id);

  if (!task) return;

  task.completed = !task.completed;
  task.completedAt = task.completed ? Date.now() : null;

  saveTasks();
  render();

  announce(
    task.completed
      ? `${task.title} completed`
      : `${task.title} marked active`
  );
}

function deleteTask(id) {
  const task = state.tasks.find(item => item.id === id);

  if (!task) return;

  state.tasks = state.tasks.filter(item => item.id !== id);

  saveTasks();
  render();

  announce(`Task deleted: ${task.title}`);
}

function openEditModal(id) {
  const task = state.tasks.find(item => item.id === id);

  if (!task) return;

  state.editingId = id;

  el.editInput.value = task.title;
  el.editPriority.value = task.priority;

  el.editModal.classList.remove("hidden");

  requestAnimationFrame(() => {
    el.editInput.focus();
    el.editInput.select();
  });
}

function closeEditModal() {
  state.editingId = null;
  el.editModal.classList.add("hidden");
}

function saveEditedTask() {
  const task = state.tasks.find(item => item.id === state.editingId);

  if (!task) return;

  const title = cleanTitle(el.editInput.value);

  if (!title) {
    el.editInput.focus();
    return;
  }

  task.title = title;
  task.priority = el.editPriority.value;

  saveTasks();
  render();
  closeEditModal();

  announce("Task updated");
}

/* =========================
   FILTERING
========================= */

function getFilteredTasks() {
  const query = state.search.toLowerCase().trim();

  return state.tasks.filter(task => {
    const matchesStatus =
      state.statusFilter === "all" ||
      (state.statusFilter === "active" && !task.completed) ||
      (state.statusFilter === "completed" && task.completed);

    const matchesPriority =
      state.priorityFilter === "all" ||
      task.priority === state.priorityFilter;

    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query);

    return matchesStatus && matchesPriority && matchesSearch;
  });
}

/* =========================
   RENDER
========================= */

function renderTasks() {
  const tasks = getFilteredTasks();

  el.taskList.innerHTML = "";

  if (tasks.length === 0) {
    el.emptyState.classList.add("visible");
    return;
  }

  el.emptyState.classList.remove("visible");

  const fragment = document.createDocumentFragment();

  tasks.forEach(task => {
    const article = document.createElement("article");

    article.className = `task-card ${task.completed ? "completed" : ""}`;

    article.dataset.id = task.id;

    article.innerHTML = `
      <button
        class="check-btn"
        data-action="toggle"
        aria-label="${task.completed ? "Mark task active" : "Complete task"}"
        title="${task.completed ? "Mark active" : "Complete"}"
      >
        ${task.completed ? "✓" : ""}
      </button>

      <div class="task-content">
        <p class="task-title">${escapeHTML(task.title)}</p>

        <div class="task-meta">
          <span class="priority-dot priority-${task.priority}"></span>
          <span>${priorityLabel(task.priority)} priority</span>
          <span>•</span>
          <span>${formatDate(task.createdAt)}</span>
        </div>
      </div>

      <div class="task-actions">
        <button
          class="task-action"
          data-action="edit"
          aria-label="Edit ${escapeHTML(task.title)}"
          title="Edit"
        >✎</button>

        <button
          class="task-action"
          data-action="delete"
          aria-label="Delete ${escapeHTML(task.title)}"
          title="Delete"
        >×</button>
      </div>
    `;

    fragment.appendChild(article);
  });

  el.taskList.appendChild(fragment);
}

function updateStatistics() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(task => task.completed).length;
  const active = total - completed;
  const high = state.tasks.filter(
    task => task.priority === "high" && !task.completed
  ).length;

  const percentage =
    total === 0 ? 0 : Math.round((completed / total) * 100);

  el.totalStat.textContent = total;
  el.activeStat.textContent = active;
  el.completedStat.textContent = completed;
  el.highStat.textContent = high;

  el.allCount.textContent = total;
  el.activeCountSide.textContent = active;
  el.completedCountSide.textContent = completed;

  el.focusScore.textContent = percentage;
  el.progressBar.style.width = `${percentage}%`;
  el.progressText.textContent = `${percentage}% complete`;

  const visible = getFilteredTasks().length;
  el.visibleCount.textContent =
    `${visible} ${visible === 1 ? "task" : "tasks"}`;
}

function updateActiveNav() {
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.status === state.statusFilter
    );
  });
}

function render() {
  renderTasks();
  updateStatistics();
  updateActiveNav();
}

/* =========================
   THEME
========================= */

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme === "dark") {
    document.documentElement.dataset.theme = "dark";
  }
}

function toggleTheme() {
  const isDark =
    document.documentElement.dataset.theme === "dark";

  if (isDark) {
    delete document.documentElement.dataset.theme;
    localStorage.setItem(THEME_KEY, "light");
    announce("Light mode enabled");
  } else {
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem(THEME_KEY, "dark");
    announce("Dark mode enabled");
  }
}

/* =========================
   EXPORT
========================= */

function exportTasks() {
  if (state.tasks.length === 0) {
    announce("There are no tasks to export.");
    return;
  }

  const data = {
    app: "FocusList",
    exportedAt: new Date().toISOString(),
    tasks: state.tasks
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "focuslist-tasks.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  announce("Tasks exported");
}

/* =========================
   FOCUS SPRINT
========================= */

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const remaining = (seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${remaining}`;
}

function startFocusSprint() {
  const task = state.tasks.find(item => !item.completed);

  if (!task) {
    announce("Add an active task before starting a sprint.");
    alert("Add an active task first.");
    return;
  }

  stopFocusSprint(false);

  state.sprintSeconds = 900;

  el.sprintTaskName.textContent = task.title;
  el.sprintTimer.textContent = formatTimer(state.sprintSeconds);
  el.sprintModal.classList.remove("hidden");

  announce(`Focus Sprint started for ${task.title}`);

  state.sprintInterval = setInterval(() => {
    state.sprintSeconds--;

    el.sprintTimer.textContent =
      formatTimer(state.sprintSeconds);

    if (state.sprintSeconds <= 0) {
      stopFocusSprint(false);

      el.sprintTaskName.textContent =
        "Sprint completed. Great work!";

      el.sprintTimer.textContent = "00:00";

      announce("Focus Sprint completed");

      setTimeout(() => {
        el.sprintModal.classList.add("hidden");
      }, 1800);
    }
  }, 1000);
}

function stopFocusSprint(closeModal = true) {
  if (state.sprintInterval) {
    clearInterval(state.sprintInterval);
    state.sprintInterval = null;
  }

  if (closeModal) {
    el.sprintModal.classList.add("hidden");
    announce("Focus Sprint stopped");
  }
}

/* =========================
   RESET FILTERS
========================= */

function resetFilters() {
  state.statusFilter = "all";
  state.priorityFilter = "all";
  state.search = "";

  el.searchInput.value = "";
  el.priorityFilter.value = "all";

  render();
}

/* =========================
   EVENT LISTENERS
========================= */

el.taskForm.addEventListener("submit", event => {
  event.preventDefault();

  addTask(
    el.taskInput.value,
    el.priorityInput.value
  );
});

el.taskInput.addEventListener("input", () => {
  el.inputError.textContent = "";
});

el.searchInput.addEventListener("input", event => {
  state.search = event.target.value;
  render();
});

el.priorityFilter.addEventListener("change", event => {
  state.priorityFilter = event.target.value;
  render();
});

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    state.statusFilter = button.dataset.status;
    render();
  });
});

/* Task event delegation */

el.taskList.addEventListener("click", event => {
  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) return;

  const card = actionButton.closest(".task-card");

  if (!card) return;

  const id = card.dataset.id;
  const action = actionButton.dataset.action;

  if (action === "toggle") {
    toggleTask(id);
  }

  if (action === "edit") {
    openEditModal(id);
  }

  if (action === "delete") {
    deleteTask(id);
  }
});

/* Edit modal */

el.saveEditBtn.addEventListener("click", saveEditedTask);
el.closeModalBtn.addEventListener("click", closeEditModal);
el.cancelEditBtn.addEventListener("click", closeEditModal);

el.editInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    saveEditedTask();
  }
});

/* Theme / export */

el.themeBtn.addEventListener("click", toggleTheme);
el.exportBtn.addEventListener("click", exportTasks);

/* Clear completed */

el.clearCompletedBtn.addEventListener("click", () => {
  const completed = state.tasks.filter(task => task.completed).length;

  if (!completed) {
    announce("No completed tasks to clear.");
    return;
  }

  state.tasks = state.tasks.filter(task => !task.completed);

  saveTasks();
  render();

  announce(`${completed} completed tasks cleared`);
});

/* Smart Priority */

el.smartPriorityBtn.addEventListener("click", () => {
  const title = cleanTitle(el.taskInput.value);

  if (!title) {
    el.taskInput.focus();
    el.inputError.textContent =
      "Enter a task title first.";
    return;
  }

  const suggested = suggestPriority(title);

  el.priorityInput.value = suggested;

  el.inputError.textContent =
    `Suggested ${suggested} priority`;

  announce(`Smart Priority suggested ${suggested} priority`);
});

/* Focus Sprint */

el.focusSprintBtn.addEventListener(
  "click",
  startFocusSprint
);

el.stopSprintBtn.addEventListener(
  "click",
  () => stopFocusSprint(true)
);

el.closeSprintBtn.addEventListener(
  "click",
  () => stopFocusSprint(true)
);

el.resetFiltersBtn.addEventListener(
  "click",
  resetFilters
);

/* Keyboard shortcuts */

document.addEventListener("keydown", event => {
  if (
    event.key === "/" &&
    document.activeElement.tagName !== "INPUT" &&
    document.activeElement.tagName !== "SELECT" &&
    document.activeElement.tagName !== "TEXTAREA"
  ) {
    event.preventDefault();
    el.searchInput.focus();
  }

  if (event.key === "Escape") {
    closeEditModal();

    if (state.sprintInterval) {
      stopFocusSprint(true);
    }
  }
});

/* Close modal by clicking backdrop */

el.editModal.addEventListener("click", event => {
  if (event.target === el.editModal) {
    closeEditModal();
  }
});

el.sprintModal.addEventListener("click", event => {
  if (event.target === el.sprintModal) {
    stopFocusSprint(true);
  }
});

/* =========================
   INITIALIZE
========================= */

loadTheme();
loadTasks();
render();