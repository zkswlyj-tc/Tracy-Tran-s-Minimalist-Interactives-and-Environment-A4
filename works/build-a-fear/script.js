/* =========================================================
   BUILD-A-FEAR
   script.js

   Experience logic:
   - User answers the opening question: yes / no
   - Teddy can be dragged around inside the inspection box
   - Fear layers unlock in sequence
   - Story details appear without over-explaining
   - Sound design escalates: music box, room tone, ticking,
     breathing, heartbeat, panned whispers
   - Final scary bear flashes exactly where the teddy was left,
     glitches, then breaks out into a full-screen takeover
   - Ending asks a changed question, then loops back
   ========================================================= */


/* =========================================================
   ASSET PATHS
   ========================================================= */

const ASSET_PATH = "./assets/";

const ASSETS = {
  teddy: `${ASSET_PATH}teddy.png`,
  teddyShaded: `${ASSET_PATH}teddy_shaded.png`,
  teddyTore: `${ASSET_PATH}teddy_tore.png`,
  teddyShadedTore: `${ASSET_PATH}teddy_shaded_tore.png`,
  scaryBear: `${ASSET_PATH}bear_scary.png`,

  soundOn: `${ASSET_PATH}sound_on_1.png`,
  soundOff: `${ASSET_PATH}sound_off.png`
};


/* =========================================================
   DOM
   ========================================================= */

const app = document.getElementById("app");

const scene = document.getElementById("scene");
const teddyWrap = document.getElementById("teddyWrap");
const teddy = document.getElementById("teddy");

const globalGlitch = document.getElementById("globalGlitch");
const blackoutVeil = document.getElementById("blackoutVeil");

const finalTakeover = document.getElementById("finalTakeover");
const scaryBear = document.getElementById("scaryBear");

const topStatus = document.getElementById("topStatus");
const statusText = document.getElementById("statusText");

const meterFill = document.getElementById("meterFill");
const meterLabel = document.getElementById("meterLabel");
const editCount = document.getElementById("editCount");

const captionBox = document.getElementById("captionBox");
const captionText = document.getElementById("captionText");

/* Opening */
const primerScreen = document.getElementById("primerScreen");
const primerResponse = document.getElementById("primerResponse");
const bearYesBtn = document.getElementById("bearYesBtn");
const bearNoBtn = document.getElementById("bearNoBtn");

/* Intro */
const introOverlay = document.getElementById("introOverlay");
const beginBtn = document.getElementById("beginBtn");

/* Ending */
const endingScreen = document.getElementById("endingScreen");
const endingResponse = document.getElementById("endingResponse");
const leaveYesBtn = document.getElementById("leaveYesBtn");
const leaveNoBtn = document.getElementById("leaveNoBtn");

/* Tool rail */
const lightsBtn = document.getElementById("lightsBtn");
const shadingBtn = document.getElementById("shadingBtn");
const cutBtn = document.getElementById("cutBtn");
const lifeBtn = document.getElementById("lifeBtn");
const captionBtn = document.getElementById("captionBtn");

/* Controls */
const playBtn = document.getElementById("playBtn");
const soundBtn = document.getElementById("soundBtn");
const soundIcon = document.getElementById("soundIcon");


/* =========================================================
   AUDIO ELEMENTS
   ========================================================= */

const clickAudio = document.getElementById("clickAudio");
const thudAudio = document.getElementById("thudAudio");
const scissorsAudio = document.getElementById("scissorsAudio");

const heartAudio = document.getElementById("heartAudio");
const breatheAudio = document.getElementById("breatheAudio");
const clockAudio = document.getElementById("clockAudio");
const whisperAudio = document.getElementById("whisperAudio");
const creepyBgAudio = document.getElementById("creepyBgAudio");
const musicBoxAudio = document.getElementById("musicBoxAudio");
const kidsLaughAudio = document.getElementById("kidsLaughAudio");

const loopAudios = [
  heartAudio,
  breatheAudio,
  clockAudio,
  whisperAudio,
  creepyBgAudio,
  musicBoxAudio
].filter(Boolean);

const allAudios = [
  clickAudio,
  thudAudio,
  scissorsAudio,
  heartAudio,
  breatheAudio,
  clockAudio,
  whisperAudio,
  creepyBgAudio,
  musicBoxAudio,
  kidsLaughAudio
].filter(Boolean);


/* =========================================================
   WEB AUDIO — PANNED WHISPERS
   ========================================================= */

let audioContext = null;
let whisperSource = null;
let whisperPanner = null;
let whisperGain = null;
let whisperPanRAF = null;


/* =========================================================
   STATE
   ========================================================= */

const state = {
  primed: false,
  started: false,
  ending: false,
  finalShown: false,
  muted: false,

  openingAnswer: "",
  details: 0,
  unease: 0,

  edits: {
    lights: false,
    shadow: false,
    tear: false,
    heartbeat: false,
    recording: false
  },

  drag: {
    enabled: false,
    active: false,
    pointerId: null,

    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,

    grabOffsetX: 0,
    grabOffsetY: 0,

    raf: null
  },
timers: {
  openingDelay: null,
  ambientGlitch: null,
  falseMove: null,
  heartbeatIrregularity: null,

  kidsLaughTease: null,
  kidsLaughStop: null,

  finalHold: null,
  finalFlash: null,
  finalBreakout: null,
  blackout: null,
  endingReveal: null,
  loopBack: null
},

  musicRiseRAF: null
};


/* =========================================================
   EXPERIENCE COPY
   ========================================================= */

const COPY = {
  idle: {
    top: "after closing",
    status: "..."
  },

  answerYes: {
    top: "answer held",
    response: "Then inspect it from there."
  },

  answerNo: {
    top: "answer held",
    response: "Then take a closer look."
  },

  begin: {
    top: "inspection open",
    status: "Move it around. Check what stands out."
  },

  lights: {
    top: "detail 01",
    status: "It was found after the lights were off."
  },

  shadow: {
    top: "detail 02",
    status: "Nothing else was left with it."
  },

  tear: {
    top: "detail 03",
    status: "The tear was not in the intake photo."
  },

  heartbeat: {
    top: "detail 04",
    status: "The storage room is supposed to be empty."
  },

  recording: {
    top: "detail 05",
    status: "The security audio caught a child laughing."
  },

  finalSilence: {
    top: "",
    status: ""
  },

  endingYes: {
    response: "maybe."
  },

  endingNo: {
    response: "maybe that was enough."
  }
};

const UNEASE = {
  start: 4,
  lights: 20,
  shadow: 39,
  tear: 61,
  heartbeat: 82,
  recording: 100
};


/* =========================================================
   INIT
   ========================================================= */

window.addEventListener("load", init);

function init() {
  preloadImages([
    ASSETS.teddy,
    ASSETS.teddyShaded,
    ASSETS.teddyTore,
    ASSETS.teddyShadedTore,
    ASSETS.scaryBear
  ]);

  bindEvents();
  resetExperience({ firstLoad: true });
}

function bindEvents() {
  bearYesBtn.addEventListener("click", () => answerOpening("yes"));
  bearNoBtn.addEventListener("click", () => answerOpening("no"));

  beginBtn.addEventListener("click", beginExperience);
  playBtn.addEventListener("click", beginExperience);

  lightsBtn.addEventListener("click", revealLights);
  shadingBtn.addEventListener("click", revealShadow);
  cutBtn.addEventListener("click", revealTear);
  lifeBtn.addEventListener("click", revealHeartbeat);
  captionBtn.addEventListener("click", revealRecording);

  leaveYesBtn.addEventListener("click", () => answerEnding("yes"));
  leaveNoBtn.addEventListener("click", () => answerEnding("no"));

  soundBtn.addEventListener("click", toggleSound);

  teddyWrap.addEventListener("pointerdown", startDrag);
  teddyWrap.addEventListener("pointermove", moveDrag);
  teddyWrap.addEventListener("pointerup", endDrag);
  teddyWrap.addEventListener("pointercancel", endDrag);
  teddyWrap.addEventListener("lostpointercapture", endDrag);

  teddyWrap.addEventListener("keydown", nudgeTeddyWithKeyboard);

  window.addEventListener("resize", keepTeddyInsideScene);
}


/* =========================================================
   OPENING
   ========================================================= */

function answerOpening(answer) {
  if (state.primed || state.ending) return;

  unlockAudio();

  state.primed = true;
  state.openingAnswer = answer;

  playOneShot(clickAudio, 0.16, 0.98);

  if (answer === "yes") {
    primerResponse.textContent = COPY.answerYes.response;
  } else {
    primerResponse.textContent = COPY.answerNo.response;
  }

  setTopStatus("answer held");

  /*
    Start the music box nearly subliminally.
    The user should feel the tone before consciously noticing it.
  */
  startLoop(musicBoxAudio, 0.012, 0.96);
  fadeAudio(musicBoxAudio, 0.024, 1200);

  clearTimeout(state.timers.openingDelay);
  state.timers.openingDelay = setTimeout(() => {
    primerScreen.classList.add("hidden");
    introOverlay.classList.remove("hidden");
    playBtn.disabled = false;
  }, 1150);
}


/* =========================================================
   BEGIN
   ========================================================= */

function beginExperience() {
  if (!state.primed || state.started || state.ending) return;

  unlockAudio();

  state.started = true;
  state.drag.enabled = true;

  introOverlay.classList.add("hidden");
  playBtn.disabled = true;

  setTopStatus(COPY.begin.top);
  setStatus(COPY.begin.status);

  setUnease(UNEASE.start);
  setDetailCount(0);

  playOneShot(clickAudio, 0.14, 1);

  startLoop(creepyBgAudio, 0.014, 0.92);
  fadeAudio(creepyBgAudio, 0.03, 1600);

  startLoop(musicBoxAudio, 0.024, 0.96);
  beginMusicBoxCreep();

  centerTeddy();

  enableTool(lightsBtn);

 startAmbientGlitches();
startFalseMovementMoments();
startKidsLaughTeases();
}


/* =========================================================
   DETAILS / TOOL SEQUENCE
   ========================================================= */

function revealLights() {
  if (!canUse("lights")) return;

  state.edits.lights = true;
  state.details = 1;

  app.classList.add("lighted");
  markToolUsed(lightsBtn);

  setTopStatus(COPY.lights.top);
  setStatus(COPY.lights.status);

  setUnease(UNEASE.lights);
  setDetailCount(state.details);

  playOneShot(clickAudio, 0.14, 0.88);
  blinkSceneSoft();
  triggerGlitch(150);

  startLoop(clockAudio, 0.01, 0.94);
  fadeAudio(clockAudio, 0.026, 1400);

  fadeAudio(musicBoxAudio, 0.05, 1800);
  fadeAudio(creepyBgAudio, 0.05, 1500);

  enableTool(shadingBtn);
}

function revealShadow() {
  if (!canUse("shadow")) return;

  state.edits.shadow = true;
  state.details = 2;

  app.classList.add("shadowed");
  markToolUsed(shadingBtn);

  swapTeddy(ASSETS.teddyShaded);

  setTopStatus(COPY.shadow.top);
  setStatus(COPY.shadow.status);

  setUnease(UNEASE.shadow);
  setDetailCount(state.details);

  playOneShot(thudAudio, 0.2, 0.84);
  triggerGlitch(210);
  teddyFlinch();

  startLoop(breatheAudio, 0.016, 0.88);
  fadeAudio(breatheAudio, 0.05, 1600);

  fadeAudio(musicBoxAudio, 0.074, 1800);
  fadeAudio(creepyBgAudio, 0.078, 1600);
  fadeAudio(clockAudio, 0.04, 1400);

  enableTool(cutBtn);
}

function revealTear() {
  if (!canUse("tear")) return;

  state.edits.tear = true;
  state.details = 3;

  app.classList.add("cut");
  markToolUsed(cutBtn);

  swapTeddy(ASSETS.teddyShadedTore);

  setTopStatus(COPY.tear.top);
  setStatus(COPY.tear.status);

  setUnease(UNEASE.tear);
  setDetailCount(state.details);

  playOneShot(scissorsAudio, 0.35, 0.94);

  setTimeout(() => {
    playOneShot(thudAudio, 0.16, 0.7);
  }, 230);

  hardSceneFlicker();
  triggerGlitch(340);

  fadeAudio(musicBoxAudio, 0.098, 1800);
  fadeAudio(creepyBgAudio, 0.112, 1600);
  fadeAudio(breatheAudio, 0.066, 1600);
  fadeAudio(clockAudio, 0.056, 1600);

  enableTool(lifeBtn);
}

function revealHeartbeat() {
  if (!canUse("heartbeat")) return;

  state.edits.heartbeat = true;
  state.details = 4;

  app.classList.add("pulsing");
  markToolUsed(lifeBtn);

  setTopStatus(COPY.heartbeat.top);
  setStatus(COPY.heartbeat.status);

  setUnease(UNEASE.heartbeat);
  setDetailCount(state.details);

  playOneShot(thudAudio, 0.22, 0.78);
  teddyFlinch();
  triggerGlitch(260);

  startLoop(heartAudio, 0.08, 0.84);
  fadeAudio(heartAudio, 0.13, 1600);

  startWhispers(0.03);
  fadeWhispers(0.078, 1800);

  startIrregularHeartbeat();

  fadeAudio(musicBoxAudio, 0.128, 2000);
  fadeAudio(creepyBgAudio, 0.144, 1800);
  fadeAudio(breatheAudio, 0.09, 1600);
  fadeAudio(clockAudio, 0.068, 1600);

  enableTool(captionBtn);
}

function revealRecording() {
  if (!canUse("recording")) return;

  state.edits.recording = true;
  state.details = 5;
  state.ending = true;

  app.classList.add("captioned");
  markToolUsed(captionBtn);
  lockAllTools();

  setTopStatus(COPY.recording.top);
  setStatus(COPY.recording.status);

  setUnease(UNEASE.recording);
  setDetailCount(state.details);

  playOneShot(clickAudio, 0.12, 0.72);
  teddyFlinch();
  triggerGlitch(330);

  fadeWhispers(0.15, 1800);
  fadeAudio(heartAudio, 0.17, 1700);
  fadeAudio(musicBoxAudio, 0.18, 2200);
  fadeAudio(creepyBgAudio, 0.19, 1800);
  fadeAudio(breatheAudio, 0.11, 1800);
  fadeAudio(clockAudio, 0.086, 1800);

  beginFinalSequence();
  
}


/* =========================================================
   FINAL SEQUENCE
   ========================================================= */

function beginFinalSequence() {
  clearFinalTimers();
  stopKidsLaughTeases();
  /*
    Hold long enough for the final story detail to sink in.
    The user should stare at the teddy they helped transform.
  */
  state.timers.finalHold = setTimeout(() => {
    setTopStatus(COPY.finalSilence.top);
    setStatus(COPY.finalSilence.status);

    app.classList.add("maxed");

    /*
      Pull the audio almost away.
      This quiet makes the final visual hit much harder.
    */
    fadeAudio(musicBoxAudio, 0.01, 520);
    fadeAudio(creepyBgAudio, 0.006, 520);
    fadeAudio(heartAudio, 0.018, 520);
    fadeAudio(breatheAudio, 0.004, 520);
    fadeAudio(clockAudio, 0.004, 520);
    fadeWhispers(0.008, 520);

    state.timers.finalFlash = setTimeout(() => {
      triggerScaryBearFlash();
    }, 720);
  }, 2100);
}

function triggerScaryBearFlash() {
  const teddyRect = teddyWrap.getBoundingClientRect();

  const teddyCenterX = teddyRect.left + teddyRect.width / 2;
  const teddyCenterY = teddyRect.top + teddyRect.height / 2;

  finalTakeover.style.setProperty("--scary-left", `${teddyCenterX}px`);
  finalTakeover.style.setProperty("--scary-top", `${teddyCenterY}px`);
  finalTakeover.style.setProperty("--scary-width", `${teddyRect.width}px`);

  finalTakeover.classList.remove("hidden");
  finalTakeover.classList.add("active", "origin-flash");

  playOneShot(thudAudio, 0.34, 0.62);

  /*
    Hide the normal teddy after the scary version starts to strobe,
    so it feels like a replacement rather than a separate overlay.
  */
  setTimeout(() => {
    teddy.style.opacity = "0";
  }, 90);

  state.timers.finalBreakout = setTimeout(() => {
    triggerFullTakeover();
  }, 820);
}

function triggerFullTakeover() {
  triggerGlitch(1850);

  app.classList.add("final-glitch");

  finalTakeover.classList.remove("origin-flash");
  finalTakeover.classList.add("screen-break");

playFullKidsLaugh();  fadeWhispers(0.055, 300);

  state.timers.blackout = setTimeout(() => {
    blackoutVeil.classList.add("active");
  }, 2500);

  state.timers.endingReveal = setTimeout(() => {
    revealEndingQuestion();
  }, 3320);
}

function revealEndingQuestion() {
  stopAllLoops(650);

  app.classList.remove("final-glitch", "maxed");
  finalTakeover.classList.remove("active", "screen-break");

  endingScreen.classList.remove("hidden");
  endingResponse.textContent = "";

  setTimeout(() => {
    finalTakeover.classList.add("hidden");
    blackoutVeil.classList.remove("active");
  }, 240);
}


/* =========================================================
   ENDING QUESTION + LOOP
   ========================================================= */

function answerEnding(answer) {
  if (!state.ending || !state.finalShown) {
    state.finalShown = true;
  }

  playOneShot(clickAudio, 0.14, 0.92);

  endingResponse.textContent =
    answer === "yes"
      ? COPY.endingYes.response
      : COPY.endingNo.response;

  state.timers.loopBack = setTimeout(() => {
    blackoutVeil.classList.add("active");

    setTimeout(() => {
      resetExperience({ firstLoad: false });
      app.classList.add("loop-return");

      setTimeout(() => {
        blackoutVeil.classList.remove("active");

        setTimeout(() => {
          app.classList.remove("loop-return");
        }, 1500);
      }, 220);
    }, 700);
  }, 1000);
}


/* =========================================================
   RESET
   ========================================================= */

function resetExperience({ firstLoad = false } = {}) {
  clearAllTimers();
  cancelAnimationFrame(state.musicRiseRAF);
  stopWhisperPan();

  state.primed = false;
  state.started = false;
  state.ending = false;
  state.finalShown = false;

  state.openingAnswer = "";
  state.details = 0;
  state.unease = 0;

  state.edits = {
    lights: false,
    shadow: false,
    tear: false,
    heartbeat: false,
    recording: false
  };

  state.drag.enabled = false;
  state.drag.active = false;
  state.drag.pointerId = null;

  resetAudio();

  app.classList.remove(
    "lighted",
    "shadowed",
    "cut",
    "pulsing",
    "captioned",
    "maxed",
    "final-glitch",
    "loop-return"
  );

  globalGlitch.classList.remove("active");

  finalTakeover.classList.remove(
    "active",
    "origin-flash",
    "screen-break"
  );

  finalTakeover.classList.add("hidden");

  teddy.src = ASSETS.teddy;
  teddy.style.opacity = "1";
  teddy.classList.remove("switching");

  teddyWrap.classList.remove("is-dragging");

  primerScreen.classList.remove("hidden");
  introOverlay.classList.add("hidden");
  endingScreen.classList.add("hidden");

  primerResponse.textContent = "";
  endingResponse.textContent = "";

  captionBox.classList.remove("active");
  captionText.textContent = "";

  playBtn.disabled = true;

  lockAllTools();
  resetToolButtons();

  setTopStatus(COPY.idle.top);
  setStatus(COPY.idle.status);
  setUnease(0);
  setDetailCount(0);

  centerTeddy();

  if (firstLoad) {
    blackoutVeil.classList.remove("active");
  }
}
/* =========================================================
   KIDS LAUGH — FAINT TEASES THROUGHOUT
   ========================================================= */

function startKidsLaughTeases() {
  stopKidsLaughTeases();

  const scheduleNextLaugh = () => {
    if (!state.started || state.ending || state.muted) return;

    const delay = getKidsLaughDelay();

    state.timers.kidsLaughTease = setTimeout(() => {
      playTinyKidsLaugh();

      scheduleNextLaugh();
    }, delay);
  };

  scheduleNextLaugh();
}

function stopKidsLaughTeases() {
  clearTimeout(state.timers.kidsLaughTease);
  clearTimeout(state.timers.kidsLaughStop);

  state.timers.kidsLaughTease = null;
  state.timers.kidsLaughStop = null;

  if (kidsLaughAudio) {
    kidsLaughAudio.pause();
    kidsLaughAudio.currentTime = 0;
    kidsLaughAudio.volume = 0;
  }
}

function getKidsLaughDelay() {
  /*
    Early on: very rare, almost subconscious.
    Later: closer together, but still not frequent enough to feel repetitive.
  */

  if (state.details >= 4) {
    return randomBetween(7000, 12000);
  }

  if (state.details >= 2) {
    return randomBetween(10000, 17000);
  }

  return randomBetween(14000, 24000);
}

function getKidsLaughTeaseVolume() {
  /*
    The laugh becomes a little easier to catch as tension rises,
    but it should remain quiet until the final reveal.
  */

  if (state.details >= 4) return 0.085;
  if (state.details >= 2) return 0.055;
  return 0.032;
}

function getKidsLaughClipLength() {
  /*
    Only tiny fragments.
    Enough to suggest a presence, not enough to confirm it.
  */

  if (state.details >= 4) {
    return randomBetween(420, 700);
  }

  if (state.details >= 2) {
    return randomBetween(280, 520);
  }

  return randomBetween(180, 360);
}

function playTinyKidsLaugh() {
  if (!kidsLaughAudio || state.muted || state.ending) return;

  const clipLength = getKidsLaughClipLength();
  const teaseVolume = getKidsLaughTeaseVolume();

  try {
    kidsLaughAudio.pause();

    /*
      Start from a slightly varied part of the audio when possible,
      so the snippets do not feel identical every time.
    */
    const duration = Number.isFinite(kidsLaughAudio.duration)
      ? kidsLaughAudio.duration
      : 0;

    if (duration > 1) {
      const maxStart = Math.max(0, duration - 0.8);
      kidsLaughAudio.currentTime = randomBetween(0, maxStart);
    } else {
      kidsLaughAudio.currentTime = 0;
    }

    kidsLaughAudio.volume = 0;
    kidsLaughAudio.playbackRate = randomBetween(0.92, 1.04);

    const playPromise = kidsLaughAudio.play();

    if (playPromise) {
      playPromise.catch(() => {});
    }

    fadeAudio(kidsLaughAudio, teaseVolume, 140);

    clearTimeout(state.timers.kidsLaughStop);
    state.timers.kidsLaughStop = setTimeout(() => {
      fadeAudio(kidsLaughAudio, 0, 180);

      setTimeout(() => {
        kidsLaughAudio.pause();
      }, 200);
    }, clipLength);
  } catch {}
}
function playFullKidsLaugh() {
  if (!kidsLaughAudio || state.muted) return;

  try {
    clearTimeout(state.timers.kidsLaughStop);

    kidsLaughAudio.pause();
    kidsLaughAudio.currentTime = 0;
    kidsLaughAudio.volume = 0;
    kidsLaughAudio.playbackRate = 0.96;

    const playPromise = kidsLaughAudio.play();

    if (playPromise) {
      playPromise.catch(() => {});
    }

    fadeAudio(kidsLaughAudio, 0.78, 220);
  } catch {}
}

/* =========================================================
   DRAG LOGIC
   ========================================================= */

function centerTeddy() {
  if (!scene || !teddyWrap) return;

  const sceneRect = scene.getBoundingClientRect();

  const centerX = sceneRect.width / 2;
  const centerY = sceneRect.height / 2;

  state.drag.currentX = centerX;
  state.drag.currentY = centerY;
  state.drag.targetX = centerX;
  state.drag.targetY = centerY;

  applyTeddyPosition(centerX, centerY);
}

function startDrag(event) {
  if (!state.started || !state.drag.enabled || state.ending) return;

  event.preventDefault();

  const sceneRect = scene.getBoundingClientRect();
  const teddyRect = teddyWrap.getBoundingClientRect();

  state.drag.active = true;
  state.drag.pointerId = event.pointerId;

  teddyWrap.classList.add("is-dragging");
  teddyWrap.setPointerCapture(event.pointerId);

  const teddyCenterX = teddyRect.left - sceneRect.left + teddyRect.width / 2;
  const teddyCenterY = teddyRect.top - sceneRect.top + teddyRect.height / 2;

  state.drag.grabOffsetX =
    event.clientX - sceneRect.left - teddyCenterX;

  state.drag.grabOffsetY =
    event.clientY - sceneRect.top - teddyCenterY;

  teddyGrabTwitch();
  runDragFrame();
}

function moveDrag(event) {
  if (!state.drag.active || event.pointerId !== state.drag.pointerId) return;

  event.preventDefault();

  const sceneRect = scene.getBoundingClientRect();

  const rawX =
    event.clientX -
    sceneRect.left -
    state.drag.grabOffsetX;

  const rawY =
    event.clientY -
    sceneRect.top -
    state.drag.grabOffsetY;

  const constrained = constrainTeddy(rawX, rawY);

  state.drag.targetX = constrained.x;
  state.drag.targetY = constrained.y;

  runDragFrame();
}

function endDrag(event) {
  if (!state.drag.active) return;

  if (
    event &&
    event.pointerId !== undefined &&
    state.drag.pointerId !== null &&
    event.pointerId !== state.drag.pointerId
  ) {
    return;
  }

  state.drag.active = false;
  state.drag.pointerId = null;

  teddyWrap.classList.remove("is-dragging");

  teddyReleaseShiver();

  if (state.edits.heartbeat && Math.random() > 0.54) {
    triggerGlitch(120);
  }
}

function runDragFrame() {
  if (state.drag.raf) return;

  const step = () => {
    state.drag.raf = null;

    const resistance = getDragResistance();

    state.drag.currentX = lerp(
      state.drag.currentX,
      state.drag.targetX,
      resistance
    );

    state.drag.currentY = lerp(
      state.drag.currentY,
      state.drag.targetY,
      resistance
    );

    applyTeddyPosition(
      state.drag.currentX,
      state.drag.currentY
    );

    const stillMoving =
      Math.abs(state.drag.currentX - state.drag.targetX) > 0.4 ||
      Math.abs(state.drag.currentY - state.drag.targetY) > 0.4;

    if (state.drag.active || stillMoving) {
      state.drag.raf = requestAnimationFrame(step);
    }
  };

  state.drag.raf = requestAnimationFrame(step);
}

function getDragResistance() {
  if (state.edits.recording) return 0.14;
  if (state.edits.heartbeat) return 0.18;
  if (state.edits.tear) return 0.22;
  if (state.edits.shadow) return 0.26;
  return 0.34;
}

function constrainTeddy(x, y) {
  const sceneRect = scene.getBoundingClientRect();
  const teddyRect = teddyWrap.getBoundingClientRect();

  const teddyWidth = teddyRect.width || 260;
  const teddyHeight = teddyRect.height || 320;

  const padding = 26;

  const minX = teddyWidth / 2 + padding;
  const maxX = sceneRect.width - teddyWidth / 2 - padding;

  const minY = teddyHeight / 2 + padding;
  const maxY = sceneRect.height - teddyHeight / 2 - padding;

  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY)
  };
}

function applyTeddyPosition(x, y) {
  teddyWrap.style.left = `${x}px`;
  teddyWrap.style.top = `${y}px`;

  const sceneRect = scene.getBoundingClientRect();

  const xPercent = sceneRect.width
    ? (x / sceneRect.width) * 100
    : 50;

  const yPercent = sceneRect.height
    ? (y / sceneRect.height) * 100
    : 50;

  scene.style.setProperty("--bear-x", `${xPercent}%`);
  scene.style.setProperty("--bear-y", `${yPercent}%`);
}

function keepTeddyInsideScene() {
  if (!scene || !teddyWrap) return;

  const constrained = constrainTeddy(
    state.drag.currentX || scene.getBoundingClientRect().width / 2,
    state.drag.currentY || scene.getBoundingClientRect().height / 2
  );

  state.drag.currentX = constrained.x;
  state.drag.currentY = constrained.y;
  state.drag.targetX = constrained.x;
  state.drag.targetY = constrained.y;

  applyTeddyPosition(constrained.x, constrained.y);
}

function nudgeTeddyWithKeyboard(event) {
  if (!state.started || state.ending) return;

  const step = 18;

  let dx = 0;
  let dy = 0;

  if (event.key === "ArrowLeft") dx = -step;
  if (event.key === "ArrowRight") dx = step;
  if (event.key === "ArrowUp") dy = -step;
  if (event.key === "ArrowDown") dy = step;

  if (!dx && !dy) return;

  event.preventDefault();

  const constrained = constrainTeddy(
    state.drag.currentX + dx,
    state.drag.currentY + dy
  );

  state.drag.targetX = constrained.x;
  state.drag.targetY = constrained.y;

  runDragFrame();
}


/* =========================================================
   DRAG FEEDBACK
   ========================================================= */

function teddyGrabTwitch() {
  teddyWrap.animate(
    [
      { transform: "translate(-50%, -50%) scale(1)" },
      { transform: "translate(-50%, -50%) scale(1.018)" },
      { transform: "translate(-50%, -50%) scale(1)" }
    ],
    {
      duration: 260,
      easing: "ease-out"
    }
  );
}

function teddyReleaseShiver() {
  const strength =
    state.edits.recording ? 6 :
    state.edits.heartbeat ? 4 :
    state.edits.tear ? 3 :
    1;

  teddyWrap.animate(
    [
      { transform: "translate(-50%, -50%) rotate(0deg)" },
      { transform: `translate(-50%, -50%) rotate(${strength * -0.32}deg)` },
      { transform: `translate(-50%, -50%) rotate(${strength * 0.22}deg)` },
      { transform: "translate(-50%, -50%) rotate(0deg)" }
    ],
    {
      duration: 440,
      easing: "ease-out"
    }
  );
}


/* =========================================================
   TOOL HELPERS
   ========================================================= */

function canUse(tool) {
  return (
    state.started &&
    !state.ending &&
    !state.edits[tool]
  );
}

function enableTool(button) {
  if (!button) return;
  button.disabled = false;
}

function lockAllTools() {
  [
    lightsBtn,
    shadingBtn,
    cutBtn,
    lifeBtn,
    captionBtn
  ].forEach((button) => {
    button.disabled = true;
  });
}

function markToolUsed(button) {
  if (!button) return;

  button.disabled = true;
  button.classList.add("active");
}

function resetToolButtons() {
  [
    lightsBtn,
    shadingBtn,
    cutBtn,
    lifeBtn,
    captionBtn
  ].forEach((button) => {
    button.classList.remove("active");
  });
}


/* =========================================================
   UI HELPERS
   ========================================================= */

function setTopStatus(text) {
  topStatus.textContent = text;
}

function setStatus(text) {
  statusText.textContent = text;
}

function setUnease(value) {
  state.unease = clamp(Math.round(value), 0, 100);

  document.documentElement.style.setProperty(
    "--reading",
    `${state.unease}%`
  );

  meterFill.style.width = `${state.unease}%`;
  meterLabel.textContent = `unease / ${state.unease}%`;
}

function setDetailCount(value) {
  editCount.textContent = `details / ${value}`;
}

function swapTeddy(src) {
  teddy.classList.add("switching");

  setTimeout(() => {
    teddy.src = src;

    requestAnimationFrame(() => {
      teddy.classList.remove("switching");
    });
  }, 220);
}


/* =========================================================
   VISUAL EVENTS
   ========================================================= */

function triggerGlitch(duration = 280) {
  globalGlitch.classList.add("active");

  setTimeout(() => {
    globalGlitch.classList.remove("active");
  }, duration);
}

function blinkSceneSoft() {
  scene.animate(
    [
      { filter: "brightness(1)" },
      { filter: "brightness(0.84)" },
      { filter: "brightness(1)" }
    ],
    {
      duration: 620,
      easing: "ease-out"
    }
  );
}

function hardSceneFlicker() {
  scene.animate(
    [
      { filter: "brightness(1) contrast(1)" },
      { filter: "brightness(0.52) contrast(1.32)" },
      { filter: "brightness(1.18) contrast(0.92)" },
      { filter: "brightness(0.72) contrast(1.28)" },
      { filter: "brightness(1) contrast(1)" }
    ],
    {
      duration: 720,
      easing: "steps(2)"
    }
  );
}

function teddyFlinch() {
  teddyWrap.animate(
    [
      { transform: "translate(-50%, -50%) scale(1)" },
      { transform: "translate(-50%, -50%) scale(1.018) rotate(-0.45deg)" },
      { transform: "translate(-50%, -50%) scale(1)" }
    ],
    {
      duration: 620,
      easing: "ease-out"
    }
  );
}


/* =========================================================
   AMBIENT HORROR MOMENTS
   ========================================================= */

function startAmbientGlitches() {
  stopAmbientGlitches();

  const schedule = () => {
    if (!state.started || state.ending) return;

    const delay = randomBetween(5900, 11800);

    state.timers.ambientGlitch = setTimeout(() => {
      const chance =
        state.details <= 1 ? 0.18 :
        state.details <= 3 ? 0.44 :
        0.74;

      if (Math.random() < chance) {
        triggerGlitch(randomBetween(110, 320));
        scratchScene();
      }

      schedule();
    }, delay);
  };

  schedule();
}

function stopAmbientGlitches() {
  clearTimeout(state.timers.ambientGlitch);
  state.timers.ambientGlitch = null;
}

function startFalseMovementMoments() {
  stopFalseMovementMoments();

  const schedule = () => {
    if (!state.started || state.ending) return;

    const delay = randomBetween(4600, 9000);

    state.timers.falseMove = setTimeout(() => {
      if (state.details >= 2) {
        almostMovedMoment();
      }

      schedule();
    }, delay);
  };

  schedule();
}

function stopFalseMovementMoments() {
  clearTimeout(state.timers.falseMove);
  state.timers.falseMove = null;
}

function almostMovedMoment() {
  if (state.drag.active) return;

  teddyWrap.animate(
    [
      { transform: "translate(-50%, -50%) scale(1)" },
      { transform: "translate(calc(-50% + 1px), calc(-50% - 1px)) scale(1.006)" },
      { transform: "translate(-50%, -50%) scale(1)" }
    ],
    {
      duration: 170,
      easing: "steps(2)"
    }
  );

  if (Math.random() > 0.56) {
    triggerGlitch(100);
  }
}

function scratchScene() {
  scene.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: "translate(-2px, 1px)" },
      { transform: "translate(2px, -1px)" },
      { transform: "translate(0, 0)" }
    ],
    {
      duration: 220,
      easing: "steps(2)"
    }
  );
}


/* =========================================================
   AUDIO CORE
   ========================================================= */

function unlockAudio() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    setupWhisperPanner();
  } catch {
    /* HTML audio fallback still works. */
  }
}

function playOneShot(audio, volume = 0.2, rate = 1) {
  if (!audio || state.muted) return;

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = clamp(volume, 0, 1);
    audio.playbackRate = rate;

    const playPromise = audio.play();

    if (playPromise) {
      playPromise.catch(() => {});
    }
  } catch {}
}

function startLoop(audio, volume = 0.02, rate = 1) {
  if (!audio) return;

  try {
    audio.loop = true;
    audio.playbackRate = rate;
    audio.volume = state.muted ? 0 : clamp(volume, 0, 1);

    if (audio.paused) {
      audio.currentTime = 0;

      const playPromise = audio.play();

      if (playPromise) {
        playPromise.catch(() => {});
      }
    }
  } catch {}
}

function fadeAudio(audio, targetVolume, duration = 1000) {
  if (!audio) return;

  const startVolume = Number.isFinite(audio.volume)
    ? audio.volume
    : 0;

  const endVolume = state.muted
    ? 0
    : clamp(targetVolume, 0, 1);

  const startTime = performance.now();

  const step = (now) => {
    const progress = clamp((now - startTime) / duration, 0, 1);
    const eased = easeOutCubic(progress);

    audio.volume =
      startVolume +
      (endVolume - startVolume) * eased;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

function stopAllLoops(duration = 800) {
  loopAudios.forEach((audio) => {
    fadeAudio(audio, 0, duration);
  });

  fadeWhispers(0, duration);

  setTimeout(() => {
    loopAudios.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      audio.playbackRate = 1;
    });
  }, duration + 80);
}

function resetAudio() {
  stopWhisperPan();

  allAudios.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
    audio.playbackRate = 1;
    audio.muted = state.muted;
  });

  if (whisperGain && audioContext) {
    whisperGain.gain.setValueAtTime(
      0,
      audioContext.currentTime
    );
  }
}


/* =========================================================
   MUSIC BOX — LOW, THEN SLOWLY RISING
   ========================================================= */

function beginMusicBoxCreep() {
  cancelAnimationFrame(state.musicRiseRAF);

  const startTime = performance.now();

  const animate = (now) => {
    if (!state.started || state.ending || state.muted) return;

    const elapsed = now - startTime;
    const longRise = clamp(elapsed / 52000, 0, 1);
    const detailBoost = state.details * 0.011;

    const target = clamp(
      0.024 + longRise * 0.056 + detailBoost,
      0,
      0.19
    );

    musicBoxAudio.volume +=
      (target - musicBoxAudio.volume) * 0.018;

    state.musicRiseRAF = requestAnimationFrame(animate);
  };

  state.musicRiseRAF = requestAnimationFrame(animate);
}


/* =========================================================
   WHISPERS — PANNING
   ========================================================= */

function setupWhisperPanner() {
  if (!audioContext || !whisperAudio || whisperSource) return;

  try {
    whisperSource = audioContext.createMediaElementSource(whisperAudio);
    whisperPanner = audioContext.createStereoPanner();
    whisperGain = audioContext.createGain();

    whisperGain.gain.value = 0;

    whisperSource
      .connect(whisperPanner)
      .connect(whisperGain)
      .connect(audioContext.destination);
  } catch {
    whisperSource = null;
    whisperPanner = null;
    whisperGain = null;
  }
}

function startWhispers(volume = 0.04) {
  if (!whisperAudio || state.muted) return;

  unlockAudio();

  try {
    whisperAudio.loop = true;
    whisperAudio.currentTime = 0;
    whisperAudio.playbackRate = 0.92;

    if (whisperGain && whisperPanner) {
      whisperAudio.volume = 1;
      fadeWhispers(volume, 900);
      animateWhisperPan();
    } else {
      whisperAudio.volume = volume;
    }

    const playPromise = whisperAudio.play();

    if (playPromise) {
      playPromise.catch(() => {});
    }
  } catch {}
}

function fadeWhispers(targetVolume, duration = 1000) {
  if (!whisperGain || !audioContext) {
    if (whisperAudio) {
      fadeAudio(whisperAudio, targetVolume, duration);
    }
    return;
  }

  const now = audioContext.currentTime;
  const target = state.muted
    ? 0
    : clamp(targetVolume, 0, 1);

  whisperGain.gain.cancelScheduledValues(now);
  whisperGain.gain.setTargetAtTime(
    target,
    now,
    Math.max(duration / 3200, 0.04)
  );
}

function animateWhisperPan() {
  if (!whisperPanner || !audioContext) return;

  cancelAnimationFrame(whisperPanRAF);

  const start = performance.now();

  const step = (now) => {
    if (!state.started && !state.ending) return;

    const t = (now - start) / 1000;

    const slowDrift = Math.sin(t * 0.68) * 0.72;
    const nervousRipple = Math.sin(t * 2.18 + 1.2) * 0.2;
    const panicSkew = state.edits.recording
      ? Math.sin(t * 4.6) * 0.06
      : 0;

    const pan = clamp(
      slowDrift + nervousRipple + panicSkew,
      -1,
      1
    );

    whisperPanner.pan.setTargetAtTime(
      pan,
      audioContext.currentTime,
      0.08
    );

    whisperPanRAF = requestAnimationFrame(step);
  };

  whisperPanRAF = requestAnimationFrame(step);
}

function stopWhisperPan() {
  cancelAnimationFrame(whisperPanRAF);
  whisperPanRAF = null;

  if (whisperGain && audioContext) {
    whisperGain.gain.setTargetAtTime(
      0,
      audioContext.currentTime,
      0.08
    );
  }
}


/* =========================================================
   HEARTBEAT IRREGULARITY
   ========================================================= */

function startIrregularHeartbeat() {
  stopIrregularHeartbeat();

  const pulse = () => {
    if (!state.started || !state.edits.heartbeat || state.ending) return;

    const delay = randomBetween(1300, 2700);

    state.timers.heartbeatIrregularity = setTimeout(() => {
      if (heartAudio) {
        heartAudio.playbackRate = randomBetween(0.78, 1.12);

        const current = heartAudio.volume || 0.1;
        fadeAudio(heartAudio, Math.max(0.058, current * 0.62), 180);

        setTimeout(() => {
          const target = state.edits.recording ? 0.17 : 0.13;
          fadeAudio(heartAudio, target, 420);
        }, 220);
      }

      pulse();
    }, delay);
  };

  pulse();
}

function stopIrregularHeartbeat() {
  clearTimeout(state.timers.heartbeatIrregularity);
  state.timers.heartbeatIrregularity = null;
}


/* =========================================================
   SOUND TOGGLE
   ========================================================= */

function toggleSound() {
  state.muted = !state.muted;

  allAudios.forEach((audio) => {
    audio.muted = state.muted;

    if (state.muted) {
      audio.volume = 0;
    }
  });

  if (whisperGain && audioContext) {
    whisperGain.gain.setTargetAtTime(
      state.muted ? 0 : currentWhisperTarget(),
      audioContext.currentTime,
      0.08
    );
  }

  soundIcon.src = state.muted
    ? ASSETS.soundOff
    : ASSETS.soundOn;

 if (!state.muted && state.started && !state.ending) {
  restoreCurrentSoundStage();
  startKidsLaughTeases();
}
}

function restoreCurrentSoundStage() {
  startLoop(musicBoxAudio, currentMusicTarget(), 0.96);
  startLoop(creepyBgAudio, currentCreepyTarget(), 0.92);

  if (state.edits.lights) {
    startLoop(clockAudio, currentClockTarget(), 0.94);
  }

  if (state.edits.shadow) {
    startLoop(breatheAudio, currentBreathTarget(), 0.88);
  }

  if (state.edits.heartbeat) {
    startLoop(heartAudio, currentHeartTarget(), 0.88);
    startWhispers(currentWhisperTarget());
  }
}

function currentMusicTarget() {
  if (state.edits.recording) return 0.18;
  if (state.edits.heartbeat) return 0.128;
  if (state.edits.tear) return 0.098;
  if (state.edits.shadow) return 0.074;
  if (state.edits.lights) return 0.05;
  return 0.024;
}

function currentCreepyTarget() {
  if (state.edits.recording) return 0.19;
  if (state.edits.heartbeat) return 0.144;
  if (state.edits.tear) return 0.112;
  if (state.edits.shadow) return 0.078;
  if (state.edits.lights) return 0.05;
  return 0.03;
}

function currentClockTarget() {
  if (state.edits.recording) return 0.086;
  if (state.edits.heartbeat) return 0.068;
  if (state.edits.tear) return 0.056;
  if (state.edits.shadow) return 0.04;
  return 0.026;
}

function currentBreathTarget() {
  if (state.edits.recording) return 0.11;
  if (state.edits.heartbeat) return 0.09;
  if (state.edits.tear) return 0.066;
  return 0.05;
}

function currentHeartTarget() {
  return state.edits.recording ? 0.17 : 0.13;
}

function currentWhisperTarget() {
  return state.edits.recording ? 0.15 : 0.078;
}


/* =========================================================
   TIMER CLEANUP
   ========================================================= */

function clearFinalTimers() {
  clearTimeout(state.timers.finalHold);
  clearTimeout(state.timers.finalFlash);
  clearTimeout(state.timers.finalBreakout);
  clearTimeout(state.timers.blackout);
  clearTimeout(state.timers.endingReveal);
  clearTimeout(state.timers.loopBack);
}

function clearAllTimers() {
  Object.values(state.timers).forEach((timer) => {
    clearTimeout(timer);
  });

state.timers = {
  openingDelay: null,
  ambientGlitch: null,
  falseMove: null,
  heartbeatIrregularity: null,

  kidsLaughTease: null,
  kidsLaughStop: null,

  finalHold: null,
  finalFlash: null,
  finalBreakout: null,
  blackout: null,
  endingReveal: null,
  loopBack: null
};

  stopAmbientGlitches();
  stopFalseMovementMoments();
  stopIrregularHeartbeat();
  stopKidsLaughTeases();
}


/* =========================================================
   PRELOAD
   ========================================================= */

function preloadImages(paths) {
  paths.forEach((src) => {
    const image = new Image();
    image.src = src;
  });
}


/* =========================================================
   UTILS
   ========================================================= */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}