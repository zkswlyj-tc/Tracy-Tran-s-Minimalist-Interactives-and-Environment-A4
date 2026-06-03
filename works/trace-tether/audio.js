
let ambientLoop; // 'Rest You Sleeping Giant - Old Tape Loops.mp3'
let filter;      // The "Muffle" constraint
let mainOsc;     // The low-frequency hum of the web
let noiseGen;    // The 'dust' and 'crackle' of the suitcase
let anchorOsc;   // The pure sine wave for the Button
let reverb;

function initAudioSystem() {
  // 1. Core Audio Setup
  userStartAudio();

  // 2. Filter
  filter = new p5.LowPass();
  filter.freq(200); 

  // 3. Load ambient tape loop
  ambientLoop = loadSound('assets/Rest You Sleeping Giant - Old Tape Loops.mp3', 
    () => {
      console.log("Memory Buffering Complete. Cued at 20s.");
      ambientLoop.disconnect();
      ambientLoop.connect(filter);
      filter.connect(reverb);
      /**
       * loop([startTime], [rate], [amp], [cueTime], [duration])
       * Jump to 20 seconds immediately. 
       * Note: Browser may block this until the first click.
       */
      ambientLoop.loop(0, 1, 0.15, 20); 
    },
    (err) => {
      console.error("Audio failed to load. Check file path or local server status.", err);
    }
  );

  // 4. Generative Synthesis (The 'Fate' sounds)
  mainOsc = new p5.Oscillator('sawtooth');
  mainOsc.start();
  mainOsc.amp(0);

  anchorOsc = new p5.Oscillator('sine');
  anchorOsc.start();
  anchorOsc.amp(0);

  noiseGen = new p5.Noise('brown');
  noiseGen.start();
  noiseGen.amp(0);

  // 5. Reverb (The 'Void' depth)
  reverb = new p5.Reverb();
  reverb.process(mainOsc, 4, 2);
  reverb.process(anchorOsc, 6, 2);
  reverb.process(filter, 5, 1);
}

/**
 * clarifyAudio()
 * Triggered when the user clicks past the Hint Fiction loading screen.
 */
function clarifyAudio() {
  // Safety: If autoplay was blocked, start the loop now at 20s
  if (ambientLoop && !ambientLoop.isPlaying()) {
    ambientLoop.loop(0, 1, 0.15, 20);
  }

  if (ambientLoop && ambientLoop.isLoaded()) {
    ambientLoop.setVolume(0.4, 2); // Fade up to 40% over 2 seconds
    filter.freq(450, 2);           // Slightly unmuffle as enter the intro
  }
}

/**
 * playOpenSound()
 * Triggered when the suitcase is clicked open.
 */
function playOpenSound() {
  if (ambientLoop && ambientLoop.isLoaded()) {
    ambientLoop.setVolume(0.5, 4); // Ambient music reaches standard volume
  }
  
  // Haptic feedback 'thump'
  noiseGen.amp(0.4, 0.01);
  noiseGen.amp(0.02, 0.3);
}

/**
 * updateAudio(items)
 */
function updateAudio(items) {
  let anyDragging = false;
  let totalDistance = 0;
  let anchorDist = 0;
  let dragVelocity = 0;

  for (let item of items) {
    if (item.isDragging) {
      anyDragging = true;
      let d = dist(item.pos.x, item.pos.y, width/2, height/2);
      totalDistance += d;
      dragVelocity = abs(mouseX - pmouseX);
      
      if (item.label === "ANC_00") anchorDist = d;
    }
  }

  if (anyDragging) {
    let freq = map(totalDistance, 0, width, 40, 120);
    mainOsc.freq(freq, 0.1);
    mainOsc.amp(0.08, 0.2);

    let nAmp = map(dragVelocity, 0, 50, 0.02, 0.15);
    noiseGen.amp(nAmp, 0.05);

    if (anchorDist > 0) {
      let cutoff = map(anchorDist, 0, 400, 450, 6000);
      filter.freq(cutoff, 0.1); 
      
      anchorOsc.freq(220, 0.1);
      anchorOsc.amp(0.2, 0.1);
    }
  } else {
    mainOsc.amp(0, 0.8);
    noiseGen.amp(0.01, 0.8);
    anchorOsc.amp(0, 0.8);
    
    if (opened) filter.freq(450, 1.5);
  }
}