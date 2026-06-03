/* =========================================================
   THE LAPTOP KEPT EVERYTHING
   script.js
   Fullscreen semester laptop interactions
   ========================================================= */

/* ---------- GLOBAL STATE ---------- */

const state = {
  highestZ: 20,

  unlocked: {
    A2_TRACE_TETHER: false,
    A3_BUILD_A_FEAR: false,
    FINAL_SYSTEM_REPORT: false
  },

  flow: {
    readmeOpened: false,
    a1Opened: false,
    a1KeyFound: false,
    a2Opened: false,
    a2KeyFound: false,
    a3Opened: false,
    a3KeyFound: false
  }
};

const passwordPrompts = {
  A2_TRACE_TETHER: {
    question: "A2 is still locked. The laptop wants the word A1 left behind.",
    answer: "SCAR",
    bodyClass: "a2-unlocked"
  },
  


  A3_BUILD_A_FEAR: {
    question: "A3 is still locked. Enter the thing that tied the hand to memory.",
    answer: "TETHER",
    bodyClass: "a3-unlocked"
  },

  FINAL_SYSTEM_REPORT: {
    question: "Final report locked. Enter the thing the user built without proof.",
    answer: "SUSPICION",
    bodyClass: "final-unlocked"
  }
};
const folderRequirements = {
  A1_THE_GHOST: {
    allowed: () => true,
    message: ""
  },

  A2_TRACE_TETHER: {
    allowed: () => state.flow.a1KeyFound,
    message: "A2 is locked for now. Open A1, read the files, and find the key first."
  },

  A3_BUILD_A_FEAR: {
    allowed: () => state.flow.a2KeyFound,
    message: "A3 is still locked. The laptop wants you to finish A2 first."
  },

  FINAL_SYSTEM_REPORT: {
    allowed: () => state.flow.a3KeyFound,
    message: "Final report is locked. Finish A3 and find its key first."
  }
};

/* ---------- DOM ---------- */

const bootScreen = document.getElementById("boot-screen");
const bootButton = document.getElementById("boot-button");
const desktop = document.getElementById("desktop");
const windowsLayer = document.getElementById("windows-layer");
const systemStatus = document.getElementById("system-status");

const windowTemplate = document.getElementById("window-template");
const passwordTemplate = document.getElementById("password-template");
const workFrameTemplate = document.getElementById("work-frame-template");

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  bindBoot();
  bindDesktopIcons();
  bindFolderFileClicks(document);
  layoutDesktopIcons();
  makeDesktopIconsDraggable();
  updateLockedIconStates();
  updateProgress();
  startClock();
});

/* ---------- LOGIN / BOOT ---------- */

function bindBoot() {
  if (!bootScreen) return;

  const loginForm = document.getElementById("login-form");
  const loginInput = document.getElementById("login-password");
  const cancelButton = document.querySelector(".login-cancel");

  if (loginInput) {
    setTimeout(() => loginInput.focus(), 200);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      bootLaptop();
    });
  }

  if (bootButton) {
    bootButton.addEventListener("click", (event) => {
      event.preventDefault();
      bootLaptop();
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      if (loginInput) loginInput.value = "";
      setStatus("LOGIN / CANCELLED");
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !bootScreen.classList.contains("hidden")) {
      event.preventDefault();
      bootLaptop();
    }
  });
}

function bootLaptop() {
  bootScreen.classList.add("hidden");

  setTimeout(() => {
    bootScreen.style.display = "none";

    if (!state.flow.readmeOpened) {
      openFile("README_FIRST");
      state.flow.readmeOpened = true;
      setStatus("README_FIRST.txt / OPENED");
    }
  }, 300);

  setStatus("SEMESTER_OS / READY");
}

/* ---------- DESKTOP ICONS ---------- */

function bindDesktopIcons() {
  const icons = document.querySelectorAll(".desktop-icon");

  icons.forEach((icon) => {
    icon.addEventListener("click", () => {
      const label = icon.querySelector("span")?.textContent || "SELECTED";
      setStatus(label);
    });

    icon.addEventListener("dblclick", () => {
      handleIconOpen(icon);
    });
  });
}

function handleIconOpen(icon) {
  if (icon.dataset.justDragged === "true") return;

  const type = icon.dataset.type;

  if (type === "txt") {
    openFile(icon.dataset.file);
    return;
  }

  if (type === "folder") {
    const folderName = icon.dataset.folder;

    if (!canOpenFolder(folderName)) return;

    openFolder(folderName);
    return;
  }

  if (type === "locked-folder") {
    const folderName = icon.dataset.folder;

    if (!canOpenFolder(folderName)) return;

    if (state.unlocked[folderName]) {
      unlockDesktopIcon(icon);
      openFolder(folderName);
    } else {
      openPasswordWindow(folderName);
    }

    return;
  }

  if (type === "trash") {
    openFile(icon.dataset.file);
    return;
  }
}

/* ---------- DESKTOP ICON LAYOUT ---------- */

function layoutDesktopIcons() {
  const icons = document.querySelectorAll(".desktop-icon");

  const startX = 28;
  const startY = 28;
  const gapY = 132;
  const gapX = 126;
  const maxRows = Math.max(3, Math.floor((window.innerHeight - 130) / gapY));

  icons.forEach((icon, index) => {
    const savedX = sessionStorage.getItem(`icon-${index}-x`);
    const savedY = sessionStorage.getItem(`icon-${index}-y`);

    if (savedX !== null && savedY !== null) {
      icon.style.left = `${savedX}px`;
      icon.style.top = `${savedY}px`;
      return;
    }

    const col = Math.floor(index / maxRows);
    const row = index % maxRows;

    icon.style.left = `${startX + col * gapX}px`;
    icon.style.top = `${startY + row * gapY}px`;
  });
}

/* ---------- DRAGGABLE DESKTOP ICONS ---------- */

function makeDesktopIconsDraggable() {
  const icons = document.querySelectorAll(".desktop-icon");

  icons.forEach((icon, index) => {
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;

    icon.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;

      dragging = true;
      moved = false;

      const rect = icon.getBoundingClientRect();

      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;

      startX = event.clientX;
      startY = event.clientY;

      icon.classList.add("dragging");
      icon.style.zIndex = ++state.highestZ;

      event.preventDefault();
    });

    document.addEventListener("mousemove", (event) => {
      if (!dragging) return;

      const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
      if (distance > 4) moved = true;

      const desktopRect = desktop.getBoundingClientRect();

      let x = event.clientX - desktopRect.left - offsetX;
      let y = event.clientY - desktopRect.top - offsetY;

      x = Math.max(0, Math.min(x, desktopRect.width - icon.offsetWidth));
      y = Math.max(0, Math.min(y, desktopRect.height - icon.offsetHeight));

      icon.style.left = `${x}px`;
      icon.style.top = `${y}px`;

      sessionStorage.setItem(`icon-${index}-x`, x);
      sessionStorage.setItem(`icon-${index}-y`, y);
    });

    document.addEventListener("mouseup", () => {
      if (!dragging) return;

      dragging = false;
      icon.classList.remove("dragging");

      icon.dataset.justDragged = moved ? "true" : "false";

      setTimeout(() => {
        icon.dataset.justDragged = "false";
      }, 140);
    });
  });
}

/* ---------- OPEN FILES ---------- */

function openFile(fileId) {
  const template = document.getElementById(`file-${fileId}`);

  if (!template) {
    openTextNotice("MISSING FILE", `The file "${fileId}" could not be found.`);
    return;
  }

  markFileVisited(fileId);

  const content = template.content.cloneNode(true);

  const title =
    content.querySelector("h2")?.textContent ||
    `${fileId}.txt`;

  createWindow(title, content);
}
function markFileVisited(fileId) {
  if (fileId === "README_FIRST") {
    state.flow.readmeOpened = true;
  }

  if (fileId === "A1_KEY") {
    state.flow.a1KeyFound = true;
    setStatus("KEY FOUND / A2 CAN BE UNLOCKED");
    pulseDesktopFolder("A2_TRACE_TETHER");
  }

  if (fileId === "A2_KEY") {
    state.flow.a2KeyFound = true;
    setStatus("KEY FOUND / A3 CAN BE UNLOCKED");
    pulseDesktopFolder("A3_BUILD_A_FEAR");
  }

  if (fileId === "A3_KEY") {
    state.flow.a3KeyFound = true;
    setStatus("KEY FOUND / FINAL REPORT CAN BE UNLOCKED");
    pulseDesktopFolder("FINAL_SYSTEM_REPORT");
  }
}
function pulseDesktopFolder(folderId) {
  const icon = document.querySelector(`.desktop-icon[data-folder="${folderId}"]`);

  if (!icon) return;

  icon.classList.add("available-next");

  setTimeout(() => {
    icon.classList.remove("available-next");
  }, 1600);
}
/* ---------- OPEN FOLDERS ---------- */

function openFolder(folderId) {
  if (!canOpenFolder(folderId)) return;

  const template = document.getElementById(`folder-${folderId}`);

  if (!template) {
    openTextNotice("MISSING FOLDER", `The folder "${folderId}" could not be found.`);
    return;
  }

  markFolderVisited(folderId);

  const folderContent = document.createElement("div");
  folderContent.className = "folder-grid";
  folderContent.appendChild(template.content.cloneNode(true));

  const win = createWindow(folderId, folderContent);
  bindFolderFileClicks(win);

  setStatus(`${folderId} / OPEN`);
}
function markFolderVisited(folderId) {
  if (folderId === "A1_THE_GHOST") {
    state.flow.a1Opened = true;
  }

  if (folderId === "A2_TRACE_TETHER") {
    state.flow.a2Opened = true;
  }

  if (folderId === "A3_BUILD_A_FEAR") {
    state.flow.a3Opened = true;
  }
}

function bindFolderFileClicks(scope) {
  const fileItems = scope.querySelectorAll(".file-item");

  fileItems.forEach((file) => {
    if (file.dataset.bound === "true") return;
    file.dataset.bound = "true";

    file.addEventListener("click", () => {
      const label = file.querySelector("span")?.textContent || "FILE";
      setStatus(label);
    });

    file.addEventListener("dblclick", () => {
      const type = file.dataset.type;

      if (type === "txt" || type === "key" || type === "image") {
        openFile(file.dataset.file);
        return;
      }

      if (type === "exe") {
        openWork(file);
        return;
      }

      if (type === "folder") {
        openFolder(file.dataset.folder);
      }
    });
  });
}
function canOpenFolder(folderName) {
  const requirement = folderRequirements[folderName];

  if (!requirement) return true;

  if (requirement.allowed()) return true;

  openTextNotice(
    "NOT YET",
    requirement.message
  );

  setStatus(`${folderName} / NOT YET`);

  return false;
}

/* ---------- PASSWORD WINDOWS ---------- */

function openPasswordWindow(folderId) {
  const passwordData = passwordPrompts[folderId];

  if (!passwordData) {
    openTextNotice("LOCKED", "This folder is locked.");
    return;
  }

  const content = passwordTemplate.content.cloneNode(true);

  const form = content.querySelector(".password-form");
  const question = content.querySelector(".password-question");
  const input = content.querySelector(".password-input");
  const error = content.querySelector(".password-error");

  question.textContent = passwordData.question;

  const win = createWindow("PASSWORD REQUIRED", content);

  const activeInput = win.querySelector(".password-input");
  const activeForm = win.querySelector(".password-form");
  const activeError = win.querySelector(".password-error");

  setTimeout(() => {
    if (activeInput) activeInput.focus();
  }, 120);

  activeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const typed = activeInput.value.trim().toUpperCase();

    if (typed === passwordData.answer) {
      unlockFolder(folderId);
      win.remove();

      openTextNotice(
        "ACCESS GRANTED",
        `${folderId} unlocked.\n\nThe laptop remembered the key. Go back to the desktop and open the folder.`
      );
    } else {
      activeError.textContent = "wrong key. open the previous reflection file.";
      activeInput.value = "";
      activeInput.focus();
    }
  });

  setStatus(`${folderId} / LOCKED`);
}

function unlockFolder(folderId) {
  state.unlocked[folderId] = true;

  const desktopIcon = document.querySelector(
    `.desktop-icon[data-folder="${folderId}"]`
  );

  if (desktopIcon) {
    unlockDesktopIcon(desktopIcon);
  }

  updateProgress();
  applyBodyStates();

  setStatus(`${folderId} / UNLOCKED`);
}

function unlockDesktopIcon(icon) {
  icon.classList.remove("locked");
  icon.dataset.type = "folder";

  const img = icon.querySelector("img");
  if (img) {
    img.src = "assets/icons/folder.png";
  }
}

function updateLockedIconStates() {
  const lockedIcons = document.querySelectorAll(".desktop-icon[data-type='locked-folder']");

  lockedIcons.forEach((icon) => {
    const folderName = icon.dataset.folder;

    if (state.unlocked[folderName]) {
      unlockDesktopIcon(icon);
    }
  });
}

/* ---------- WORK / EXE WINDOWS ---------- */

function openWork(file) {
  const src = file.dataset.src;
  const title = file.dataset.work || "RUNNING_EXPERIENCE";

  if (!src) {
    openTextNotice("MISSING EXPERIENCE", "This .exe file has no source path.");
    return;
  }

  const content = workFrameTemplate.content.cloneNode(true);
  const iframe = content.querySelector(".work-frame");

  iframe.src = src;
  iframe.title = title;

  const win = createWindow(`${title}.exe`, content);
  win.classList.add("fullscreen", "work-window");

  setStatus(`RUNNING ${title}.exe`);
}

/* ---------- WINDOW CREATION ---------- */

function createWindow(title, content) {
  const clone = windowTemplate.content.cloneNode(true);

  const win = clone.querySelector(".window");
  const header = clone.querySelector(".window-header");
  const titleEl = clone.querySelector(".window-title");
  const body = clone.querySelector(".window-body");
  const closeBtn = clone.querySelector(".window-close");
  const fullscreenBtn = clone.querySelector(".window-fullscreen");

  titleEl.textContent = title;
  body.appendChild(content);

  const pos = getWindowPosition();

  win.style.left = `${pos.x}px`;
  win.style.top = `${pos.y}px`;
  win.style.zIndex = ++state.highestZ;

  windowsLayer.appendChild(win);

  win.addEventListener("mousedown", () => {
    bringToFront(win);
  });

  closeBtn.addEventListener("click", () => {
    win.remove();
  });

  fullscreenBtn.addEventListener("click", () => {
    win.classList.toggle("fullscreen");
    win.classList.toggle("full");
    bringToFront(win);
  });

  makeDraggable(win, header);

  return win;
}

function bringToFront(win) {
  win.style.zIndex = ++state.highestZ;
}

function getWindowPosition() {
  const layerRect = windowsLayer.getBoundingClientRect();

  const baseX = 34;
  const baseY = 28;
  const offset = (state.highestZ % 7) * 24;

  return {
    x: Math.min(baseX + offset, Math.max(20, layerRect.width - 480)),
    y: Math.min(baseY + offset, Math.max(20, layerRect.height - 340))
  };
}

/* ---------- DRAGGABLE WINDOWS ---------- */

function makeDraggable(win, handle) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.addEventListener("mousedown", (event) => {
    if (event.target.closest("button")) return;

    if (win.classList.contains("fullscreen") || win.classList.contains("full")) {
      return;
    }

    dragging = true;
    bringToFront(win);

    const rect = win.getBoundingClientRect();

    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    document.body.classList.add("dragging-window");
    event.preventDefault();
  });

  document.addEventListener("mousemove", (event) => {
    if (!dragging) return;

    const layerRect = windowsLayer.getBoundingClientRect();

    let x = event.clientX - layerRect.left - offsetX;
    let y = event.clientY - layerRect.top - offsetY;

    x = Math.max(0, Math.min(x, layerRect.width - win.offsetWidth));
    y = Math.max(0, Math.min(y, layerRect.height - win.offsetHeight));

    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;

    dragging = false;
    document.body.classList.remove("dragging-window");
  });
}

/* ---------- NOTICES ---------- */

function openTextNotice(title, message) {
  const article = document.createElement("article");
  article.className = "text-file";

  const heading = document.createElement("h2");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  article.appendChild(heading);
  article.appendChild(paragraph);

  createWindow(title, article);
}

/* ---------- BODY STATES ---------- */

function applyBodyStates() {
  document.body.classList.toggle("a2-unlocked", state.unlocked.A2_TRACE_TETHER);
  document.body.classList.toggle("state-a2", state.unlocked.A2_TRACE_TETHER);

  document.body.classList.toggle("a3-unlocked", state.unlocked.A3_BUILD_A_FEAR);
  document.body.classList.toggle("state-a3", state.unlocked.A3_BUILD_A_FEAR);

  document.body.classList.toggle("final-unlocked", state.unlocked.FINAL_SYSTEM_REPORT);
}

function updateProgress() {
  // Password progress UI has been removed from the taskbar.
  // The keys now only reveal inside reflection key files.
}

/* ---------- SYSTEM STATUS ---------- */

function setStatus(text) {
  if (!systemStatus) return;
  systemStatus.textContent = text;
}

/* ---------- SYSTEM CLOCK ---------- */

function startClock() {
  const clock = document.getElementById("system-clock");
  if (!clock) return;

  function updateClock() {
    const now = new Date();

    clock.textContent = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  updateClock();
  setInterval(updateClock, 1000 * 30);
}

/* ---------- SMALL ATMOSPHERE EFFECT ---------- */

document.addEventListener("mousemove", (event) => {
  if (!state.unlocked.A2_TRACE_TETHER) return;
  if (Math.random() > 0.93) return;

  const scar = document.createElement("span");
  scar.className = "scar-pixel";
  scar.style.left = `${event.clientX}px`;
  scar.style.top = `${event.clientY}px`;

  document.body.appendChild(scar);

  setTimeout(() => {
    scar.style.opacity = "0";
    scar.style.transition = "opacity 900ms linear";
  }, 80);

  setTimeout(() => {
    scar.remove();
  }, 1100);
});

/* ---------- WINDOW SHORTCUTS ---------- */

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const windows = [...document.querySelectorAll(".window")];
    if (!windows.length) return;

    const topWindow = windows.sort((a, b) => {
      return Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0);
    })[0];

    topWindow.remove();
  }
});

/* ---------- RELAYOUT ICONS ON RESIZE ---------- */

window.addEventListener("resize", () => {
  const icons = document.querySelectorAll(".desktop-icon");

  icons.forEach((icon, index) => {
    const desktopRect = desktop.getBoundingClientRect();

    const currentX = parseFloat(icon.style.left) || 0;
    const currentY = parseFloat(icon.style.top) || 0;

    const safeX = Math.max(0, Math.min(currentX, desktopRect.width - icon.offsetWidth));
    const safeY = Math.max(0, Math.min(currentY, desktopRect.height - icon.offsetHeight));

    icon.style.left = `${safeX}px`;
    icon.style.top = `${safeY}px`;

    sessionStorage.setItem(`icon-${index}-x`, safeX);
    sessionStorage.setItem(`icon-${index}-y`, safeY);
  });
});