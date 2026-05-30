import { initTheme, setTheme } from './theme.js';
import { initNavigation, switchModule } from './navigation.js';
import { calculateLevelFromXP, getRankDetails, updateSyncIntegrity, renderEvolvingCowlSVG, triggerLevelUpSequence } from './evolution.js';

// UPGRADES CONFIGURATION CONSTANTS
const UPGRADES = [
  { id: 'theme-gothic', cost: 2, name: 'Gothic Amber Theme' },
  { id: 'glow-boost', cost: 3, name: 'High-Intensity HUD Glow' },
  { id: 'focus-audio', cost: 4, name: 'Cowl Focus Soundscape' },
  { id: 'emergency-boost', cost: 3, name: 'Emergency Backup Battery' },
  { id: 'analytics-30', cost: 5, name: '30-Day Progress Radar' }
];

// DEFAULT STATE CONFIGURATION
const DEFAULT_STATE = {
  profile: {
    name: "BRUCE WAYNE",
    title: "VANGUARD STRATEGIST",
    slogan: "I AM VENGEANCE. I AM THE NIGHT."
  },
  stats: {
    totalXP: 120,
    currentLevel: 1,
    streak: 5,
    techPoints: 3 // Start V1 users with 3 TP to allow immediate customization testing
  },
  dailyMissions: [
    { id: 1, text: "Execute Physical Routine (Gym/Cardio)", completed: false },
    { id: 2, text: "Gather Intel (Read 30 minutes of technical articles)", completed: false },
    { id: 3, text: "Review active financial assets & budget", completed: false }
  ],
  habits: [
    { id: 1, text: "Hydration quota (4 Liters)", completed: false },
    { id: 2, text: "Sleep integrity (8 Hours sleep cycle)", completed: false },
    { id: 3, text: "Deep Focus Cowl Session (25 mins)", completed: false }
  ],
  badHabits: [
    { id: 1, text: "Refuse high-glycemic sugar triggers", breached: false },
    { id: 2, text: "De-activate screen doomscrolling", breached: false }
  ],
  weeklyAnalytics: {
    "Mon": [true, true, false],
    "Tue": [true, false, false],
    "Wed": [true, true, true],
    "Thu": [true, false, true],
    "Fri": [true, true, false],
    "Sat": [false, false, false],
    "Sun": [false, false, false]
  },
  unlockedUpgrades: [],
  equippedUpgrades: [],
  monthlyAnalytics: {}
};

let state = { ...DEFAULT_STATE };

// TIMER STATE FOR COWL FOCUS MODE
let focusTimerInterval = null;
let focusMinutesRemaining = 25;
let focusSecondsRemaining = 0;

// AUDIO SYNTHESIZER FOR COWL FOCUS SOUNDSCAPE
let audioCtx = null;
let noiseNode = null;

function playCowlSoundscape() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filter white noise to make it brown (deeper frequency, feels like machinery)
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    
    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220; // Deep industrial filter
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.22; // Low background hum
    
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    noiseNode.start(0);
  } catch (e) {
    console.warn("Web Audio compilation unsupported:", e);
  }
}

function stopCowlSoundscape() {
  if (noiseNode) {
    try { noiseNode.stop(); } catch (e) {}
    noiseNode = null;
  }
  if (audioCtx) {
    try { audioCtx.close(); } catch (e) {}
    audioCtx = null;
  }
}

// LOAD AND SAVE HELPERS
function loadState() {
  const saved = localStorage.getItem('batcave-state');
  if (saved) {
    try {
      state = JSON.parse(saved);
      // Ensure missing structure from schema upgrades is safely defaulted
      state.profile = { ...DEFAULT_STATE.profile, ...state.profile };
      state.stats = { ...DEFAULT_STATE.stats, ...state.stats };
      if (state.stats.techPoints === undefined) state.stats.techPoints = DEFAULT_STATE.stats.techPoints;
      if (!state.dailyMissions) state.dailyMissions = [...DEFAULT_STATE.dailyMissions];
      if (!state.habits) state.habits = [...DEFAULT_STATE.habits];
      if (!state.badHabits) state.badHabits = [...DEFAULT_STATE.badHabits];
      if (!state.weeklyAnalytics) state.weeklyAnalytics = { ...DEFAULT_STATE.weeklyAnalytics };
      if (!state.unlockedUpgrades) state.unlockedUpgrades = [];
      if (!state.equippedUpgrades) state.equippedUpgrades = [];
      if (!state.monthlyAnalytics) state.monthlyAnalytics = {};
    } catch (e) {
      state = { ...DEFAULT_STATE };
    }
  } else {
    state = { ...DEFAULT_STATE };
  }
}

function saveState() {
  localStorage.setItem('batcave-state', JSON.stringify(state));
}

// MAIN BOOT INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTheme();
  initNavigation();
  
  // Set saved equipped visual styles on boot
  if (state.equippedUpgrades.includes('theme-gothic')) {
    document.documentElement.setAttribute('data-theme', 'gothic');
  }
  if (state.equippedUpgrades.includes('glow-boost')) {
    document.documentElement.classList.add('glow-boost-active');
  }
  
  // Render initial HUD
  updateHUDView();
  
  // Hook up event listeners for inputs and buttons
  setupInteractiveEvents();
});

// CORE HUD RENDER COORDINATOR
function updateHUDView() {
  const xpDetails = calculateLevelFromXP(state.stats.totalXP);
  
  // Check for level ups!
  if (xpDetails.level > state.stats.currentLevel) {
    state.stats.currentLevel = xpDetails.level;
    saveState();
    
    const rank = getRankDetails(xpDetails.level);
    triggerLevelUpSequence(xpDetails.level, rank.label, () => {
      updateHUDView();
    });
    return;
  }
  
  state.stats.currentLevel = xpDetails.level;
  
  // Calculate synchronization metrics
  const completedMissions = state.dailyMissions.filter(m => m.completed).length;
  const completedHabits = state.habits.filter(h => h.completed).length;
  const totalMissions = state.dailyMissions.length;
  const totalHabits = state.habits.length;
  
  // Adjust targets if Emergency Backup Battery is active
  const isEmergencyActive = state.equippedUpgrades.includes('emergency-boost') && state.stats.streak === 0;
  const syncDetails = updateSyncIntegrity(
    completedMissions + completedHabits,
    totalMissions + totalHabits
  );
  
  // Render Dynamic Identity Banner
  renderIdentityBanner(xpDetails, syncDetails);
  
  // Render Reactor Progress Core
  renderReactorCore(xpDetails);
  
  // Render HUD Widgets
  renderDailyMissionsList();
  renderHabitsList();
  renderBadHabitsList();
  renderAnalyticsDotGrid();
  renderRDBay();
  
  // Populate dossier setups form fields with active state
  populateDossierForm();
}

// RENDER: IDENTITY BANNER
function renderIdentityBanner(xpDetails, syncDetails) {
  const avatarContainer = document.getElementById('avatar-container');
  if (avatarContainer) {
    avatarContainer.innerHTML = renderEvolvingCowlSVG(xpDetails.level);
  }
  
  const rank = getRankDetails(xpDetails.level);
  const rankBadge = document.getElementById('banner-rank-badge');
  if (rankBadge) {
    rankBadge.textContent = `${rank.label} // CL_LV.${xpDetails.level}`;
  }
  
  const bannerName = document.getElementById('banner-operator-name');
  if (bannerName) {
    bannerName.textContent = state.profile.name;
  }
  
  const bannerClass = document.getElementById('banner-operator-class');
  if (bannerClass) {
    bannerClass.textContent = state.profile.title;
  }
  
  // Update sync bar
  const syncFill = document.getElementById('sync-bar-fill');
  if (syncFill) {
    syncFill.style.width = `${syncDetails.syncPercentage}%`;
  }
  
  const syncPercentText = document.getElementById('sync-percent-text');
  if (syncPercentText) {
    syncPercentText.textContent = `${syncDetails.syncPercentage}%`;
  }
  
  // Update slogan quote
  const sloganText = document.getElementById('banner-slogan');
  if (sloganText) {
    sloganText.textContent = `"${state.profile.slogan}"`;
  }
  
  // Update telemetry header info
  const systemStatusMsg = document.getElementById('system-status-msg');
  if (systemStatusMsg) {
    systemStatusMsg.textContent = systemStatusMsg.classList.contains('notify-active') 
      ? systemStatusMsg.textContent 
      : syncDetails.bannerText;
  }
}

// RENDER: VERTICAL XP REACTOR CORE
function renderReactorCore(xpDetails) {
  const coreFill = document.getElementById('reactor-core-fill');
  if (coreFill) {
    coreFill.style.height = `${xpDetails.progressPercent}%`;
  }
  
  const levelText = document.getElementById('reactor-level-text');
  if (levelText) {
    levelText.textContent = `LV.${xpDetails.level}`;
  }
  
  const xpNumbers = document.getElementById('xp-numbers-readout');
  if (xpNumbers) {
    xpNumbers.textContent = `${xpDetails.currentXP}/${xpDetails.nextLevelXP} XP`;
  }
  
  const diagStreak = document.getElementById('diag-streak-value');
  if (diagStreak) {
    diagStreak.textContent = `${state.stats.streak} DAYS`;
  }
}

// RENDER: DAILY MISSIONS
function renderDailyMissionsList() {
  const container = document.getElementById('daily-missions-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.dailyMissions.forEach(m => {
    const div = document.createElement('div');
    div.className = `mission-item ${m.completed ? 'completed' : ''}`;
    
    div.innerHTML = `
      <div class="item-left">
        <div class="custom-checkbox" data-id="${m.id}"></div>
        <span class="item-text">${m.text}</span>
      </div>
      <button class="delete-item-btn" data-id="${m.id}">×</button>
    `;
    
    div.querySelector('.custom-checkbox').addEventListener('click', () => {
      toggleMission(m.id);
    });
    
    div.querySelector('.delete-item-btn').addEventListener('click', () => {
      deleteMission(m.id);
    });
    
    container.appendChild(div);
  });
}

// RENDER: HABITS
function renderHabitsList() {
  const container = document.getElementById('habits-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.habits.forEach(h => {
    const div = document.createElement('div');
    div.className = `mission-item ${h.completed ? 'completed' : ''}`;
    
    div.innerHTML = `
      <div class="item-left">
        <div class="custom-checkbox" data-id="${h.id}"></div>
        <span class="item-text">${h.text}</span>
      </div>
      <button class="delete-item-btn" data-id="${h.id}">×</button>
    `;
    
    div.querySelector('.custom-checkbox').addEventListener('click', () => {
      toggleHabit(h.id);
    });
    
    div.querySelector('.delete-item-btn').addEventListener('click', () => {
      deleteHabit(h.id);
    });
    
    container.appendChild(div);
  });
}

// RENDER: BAD HABITS
function renderBadHabitsList() {
  const container = document.getElementById('bad-habits-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.badHabits.forEach(b => {
    const div = document.createElement('div');
    div.className = `vice-card ${b.breached ? 'breached' : ''}`;
    
    div.innerHTML = `
      <div class="vice-header">
        <span class="vice-name">${b.text}</span>
        <span class="vice-status contained">CONTAINED</span>
        <span class="vice-status alarm">BREACH DETECTED</span>
      </div>
      <div class="vice-bar">
        <div class="vice-bar-fill"></div>
      </div>
      <div class="vice-footer">
        <span>SECURITY LOCKDOWN ACTIVE</span>
        <button class="relapse-btn" data-id="${b.id}">
          ${b.breached ? 'RE-SECURE BLOCK' : 'SIGNAL BREACH (RELAPSE)'}
        </button>
      </div>
    `;
    
    div.querySelector('.relapse-btn').addEventListener('click', () => {
      toggleBadHabitBreach(b.id);
    });
    
    container.appendChild(div);
  });
}

// RENDER: PROGRESS ANALYTICS GRID (Supports unlocked 30-Day Radar Upgrade)
function renderAnalyticsDotGrid() {
  const container = document.getElementById('progress-analytics-grid');
  if (!container) return;
  
  container.innerHTML = '';
  
  const labelCol = document.createElement('div');
  labelCol.className = 'grid-label-column';
  labelCol.innerHTML = `
    <span class="grid-sector-label">SEC.ALPHA (PHYS)</span>
    <span class="grid-sector-label">SEC.BETA (MIND)</span>
    <span class="grid-sector-label">SEC.GAMMA (CRAFT)</span>
  `;
  container.appendChild(labelCol);
  
  const show30Days = state.equippedUpgrades.includes('analytics-30');
  
  if (show30Days) {
    // Configure full 30-day analytics grid
    const weeklyContainer = document.querySelector('.weekly-grid');
    if (weeklyContainer) {
      weeklyContainer.style.gridTemplateColumns = `140px repeat(30, 1fr)`;
      weeklyContainer.style.minWidth = `1500px`;
    }
    
    // Ensure monthly data is populated
    if (!state.monthlyAnalytics || Object.keys(state.monthlyAnalytics).length === 0) {
      state.monthlyAnalytics = {};
      for (let i = 1; i <= 30; i++) {
        state.monthlyAnalytics[`D${i}`] = [Math.random() > 0.4, Math.random() > 0.4, false];
      }
    }
    
    for (let i = 1; i <= 30; i++) {
      const dayKey = `D${i}`;
      const col = document.createElement('div');
      col.className = 'grid-day-column';
      
      const dayHeader = document.createElement('span');
      dayHeader.className = 'grid-day-header';
      dayHeader.textContent = `D${i}`;
      col.appendChild(dayHeader);
      
      const completions = state.monthlyAnalytics[dayKey] || [false, false, false];
      completions.forEach((completed, idx) => {
        const node = document.createElement('span');
        node.className = `grid-node ${completed ? 'active' : ''}`;
        const sectorNames = ["Alpha (Physical)", "Beta (Mind)", "Gamma (Craft)"];
        node.setAttribute('data-tooltip', `Day ${i}: Sector ${sectorNames[idx]} - ${completed ? 'SECURED' : 'UNSECURED'}`);
        
        node.addEventListener('click', () => {
          state.monthlyAnalytics[dayKey][idx] = !state.monthlyAnalytics[dayKey][idx];
          awardXP(state.monthlyAnalytics[dayKey][idx] ? 10 : -10);
          saveState();
          updateHUDView();
        });
        col.appendChild(node);
      });
      container.appendChild(col);
    }
  } else {
    // Standard 7-day Weekly Grid
    const weeklyContainer = document.querySelector('.weekly-grid');
    if (weeklyContainer) {
      weeklyContainer.style.gridTemplateColumns = `140px repeat(7, 1fr)`;
      weeklyContainer.style.minWidth = `800px`;
    }
    
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    days.forEach(day => {
      const col = document.createElement('div');
      col.className = 'grid-day-column';
      
      const dayHeader = document.createElement('span');
      dayHeader.className = 'grid-day-header';
      dayHeader.textContent = day;
      col.appendChild(dayHeader);
      
      const completions = state.weeklyAnalytics[day] || [false, false, false];
      completions.forEach((completed, idx) => {
        const node = document.createElement('span');
        node.className = `grid-node ${completed ? 'active' : ''}`;
        const sectorNames = ["Alpha (Physical)", "Beta (Mind)", "Gamma (Craft)"];
        node.setAttribute('data-tooltip', `${day}: Sector ${sectorNames[idx]} - ${completed ? 'SECURED' : 'UNSECURED'}`);
        
        node.addEventListener('click', () => {
          state.weeklyAnalytics[day][idx] = !state.weeklyAnalytics[day][idx];
          awardXP(state.weeklyAnalytics[day][idx] ? 10 : -10);
          saveState();
          updateHUDView();
        });
        col.appendChild(node);
      });
      col.appendChild(node);
      container.appendChild(col);
    });
  }
}

// RENDER: WAYNE TECH R&D UPGRADES
function renderRDBay() {
  const tpCounter = document.getElementById('rd-tp-counter');
  if (tpCounter) {
    tpCounter.textContent = `${state.stats.techPoints || 0} TP`;
  }
  
  UPGRADES.forEach(u => {
    const card = document.getElementById(`card-${u.id}`);
    if (!card) return;
    
    const isUnlocked = state.unlockedUpgrades.includes(u.id);
    const isEquipped = state.equippedUpgrades.includes(u.id);
    const button = card.querySelector('.upgrade-btn');
    
    card.classList.remove('locked', 'unlocked', 'equipped');
    
    if (isEquipped) {
      card.classList.add('equipped');
      if (button) {
        button.textContent = 'EQUIPPED';
        button.disabled = false;
      }
    } else if (isUnlocked) {
      card.classList.add('unlocked');
      if (button) {
        button.textContent = 'EQUIP';
        button.disabled = false;
      }
    } else {
      card.classList.add('locked');
      if (button) {
        button.textContent = `UNLOCK (${u.cost} TP)`;
        button.disabled = false;
      }
    }
  });
}

// DISPLAY HUD NOTIFICATION TOAST
function showHUDNotification(message) {
  const statusMsg = document.getElementById('system-status-msg');
  if (statusMsg) {
    statusMsg.textContent = message;
    statusMsg.classList.add('notify-active');
    statusMsg.style.color = 'var(--accent-color)';
    statusMsg.style.textShadow = 'var(--accent-glow)';
    
    setTimeout(() => {
      statusMsg.classList.remove('notify-active');
      statusMsg.style.color = '';
      statusMsg.style.textShadow = '';
      updateHUDView(); // Restores sync message
    }, 5000);
  }
}

// SET FORM CREDENTIALS IN DOSSIER SETUPS
function populateDossierForm() {
  const nameInp = document.getElementById('dossier-nickname');
  if (nameInp) nameInp.value = state.profile.name;
  
  const titleInp = document.getElementById('dossier-title');
  if (titleInp) titleInp.value = state.profile.title;
  
  const sloganInp = document.getElementById('dossier-slogan');
  if (sloganInp) sloganInp.value = state.profile.slogan;
}

// LOGIC: MISSION MANAGEMENT & STATE CHANGES
function awardXP(amount) {
  const oldXP = state.stats.totalXP;
  state.stats.totalXP = Math.max(0, state.stats.totalXP + amount);
  
  // Award Tech Points (TP) on 100 XP boundaries
  const oldTPs = Math.floor(oldXP / 100);
  const newTPs = Math.floor(state.stats.totalXP / 100);
  
  if (newTPs > oldTPs) {
    const gained = newTPs - oldTPs;
    state.stats.techPoints += gained;
    showHUDNotification(`[R&D BAY] +${gained} TECH POINT GENERATED // CLEARANCE EXPANDED`);
  }
}

function toggleMission(id) {
  const mission = state.dailyMissions.find(m => m.id === id);
  if (!mission) return;
  
  mission.completed = !mission.completed;
  awardXP(mission.completed ? 20 : -20);
  
  saveState();
  updateHUDView();
}

function deleteMission(id) {
  state.dailyMissions = state.dailyMissions.filter(m => m.id !== id);
  saveState();
  updateHUDView();
}

function toggleHabit(id) {
  const habit = state.habits.find(h => h.id === id);
  if (!habit) return;
  
  habit.completed = !habit.completed;
  awardXP(habit.completed ? 10 : -10);
  
  saveState();
  updateHUDView();
}

function deleteHabit(id) {
  state.habits = state.habits.filter(h => h.id !== id);
  saveState();
  updateHUDView();
}

function toggleBadHabitBreach(id) {
  const vice = state.badHabits.find(b => b.id === id);
  if (!vice) return;
  
  vice.breached = !vice.breached;
  
  if (vice.breached) {
    awardXP(-50);
    state.stats.streak = 0;
  } else {
    awardXP(30);
  }
  
  saveState();
  updateHUDView();
}

// LOGIC: WAYNE TECH R&D PURCHASE & EQUIP
function handleUpgradeAction(id) {
  const upgrade = UPGRADES.find(u => u.id === id);
  if (!upgrade) return;
  
  const isUnlocked = state.unlockedUpgrades.includes(id);
  const isEquipped = state.equippedUpgrades.includes(id);
  
  if (isEquipped) {
    // Un-equip
    state.equippedUpgrades = state.equippedUpgrades.filter(uid => uid !== id);
    
    if (id === 'theme-gothic') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('batcave-theme');
    }
    if (id === 'glow-boost') {
      document.documentElement.classList.remove('glow-boost-active');
    }
    
    showHUDNotification(`[R&D] DE-EQUIPPED: ${upgrade.name}`);
    saveState();
    updateHUDView();
  } else if (isUnlocked) {
    // Equip
    state.equippedUpgrades.push(id);
    
    if (id === 'theme-gothic') {
      document.documentElement.setAttribute('data-theme', 'gothic');
      localStorage.setItem('batcave-theme', 'gothic');
    }
    if (id === 'glow-boost') {
      document.documentElement.classList.add('glow-boost-active');
    }
    
    showHUDNotification(`[R&D] EQUIPPED: ${upgrade.name}`);
    saveState();
    updateHUDView();
  } else {
    // Purchase (Check TP balance)
    if ((state.stats.techPoints || 0) >= upgrade.cost) {
      state.stats.techPoints -= upgrade.cost;
      state.unlockedUpgrades.push(id);
      state.equippedUpgrades.push(id);
      
      if (id === 'theme-gothic') {
        document.documentElement.setAttribute('data-theme', 'gothic');
        localStorage.setItem('batcave-theme', 'gothic');
      }
      if (id === 'glow-boost') {
        document.documentElement.classList.add('glow-boost-active');
      }
      
      showHUDNotification(`[R&D] UNLOCKED & INSTALLED: ${upgrade.name}`);
      saveState();
      updateHUDView();
    } else {
      showHUDNotification(`[R&D BLOCKED] INSUFFICIENT TECH POINTS FOR ${upgrade.name.toUpperCase()}`);
    }
  }
}

// INTERACTIVE BUTTONS AND FORM LISTENERS
function setupInteractiveEvents() {
  // Theme Toggle Buttons in Settings
  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.getAttribute('data-value');
      
      // Sync R&D upgrade theme status if Gothic is manual chosen
      if (selectedTheme === 'gothic' && !state.unlockedUpgrades.includes('theme-gothic')) {
        showHUDNotification(`[HUD BLOCKED] GOTHIC AMBER UNLOCK REQUIRED IN R&D DIVISION`);
        return;
      }
      
      setTheme(selectedTheme);
      
      if (selectedTheme === 'gothic') {
        if (!state.equippedUpgrades.includes('theme-gothic')) state.equippedUpgrades.push('theme-gothic');
      } else {
        state.equippedUpgrades = state.equippedUpgrades.filter(uid => uid !== 'theme-gothic');
      }
      saveState();
    });
  });
  
  // R&D Upgrade Clicks
  const upgradeButtons = document.querySelectorAll('.upgrade-btn');
  upgradeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const upgradeId = btn.getAttribute('data-id');
      handleUpgradeAction(upgradeId);
    });
  });
  
  // Forms: Add Mission
  const addMissionForm = document.getElementById('add-mission-form');
  if (addMissionForm) {
    addMissionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('mission-input');
      if (!input || !input.value.trim()) return;
      
      const newMission = {
        id: Date.now(),
        text: input.value.trim(),
        completed: false
      };
      
      state.dailyMissions.push(newMission);
      input.value = '';
      
      saveState();
      updateHUDView();
    });
  }
  
  // Forms: Add Habit
  const addHabitForm = document.getElementById('add-habit-form');
  if (addHabitForm) {
    addHabitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('habit-input');
      if (!input || !input.value.trim()) return;
      
      const newHabit = {
        id: Date.now(),
        text: input.value.trim(),
        completed: false
      };
      
      state.habits.push(newHabit);
      input.value = '';
      
      saveState();
      updateHUDView();
    });
  }
  
  // Dossier Save profile credentials
  const dossierForm = document.getElementById('dossier-config-form');
  if (dossierForm) {
    dossierForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('dossier-nickname').value.trim();
      const title = document.getElementById('dossier-title').value.trim();
      const slogan = document.getElementById('dossier-slogan').value.trim();
      
      state.profile.name = name || "BRUCE WAYNE";
      state.profile.title = title || "VANGUARD STRATEGIST";
      state.profile.slogan = slogan || "I AM VENGEANCE. I AM THE NIGHT.";
      
      saveState();
      updateHUDView();
      switchModule('dashboard');
    });
  }
  
  // Focus cowl mode start
  const startCowlBtn = document.getElementById('start-cowl-btn');
  if (startCowlBtn) {
    startCowlBtn.addEventListener('click', () => {
      switchModule('cowl-timer');
      startCowlFocusSession();
    });
  }
  
  // Focus cowl stop
  const stopCowlBtn = document.getElementById('stop-cowl-btn');
  if (stopCowlBtn) {
    stopCowlBtn.addEventListener('click', () => {
      stopCowlFocusSession(false);
      switchModule('dashboard');
    });
  }
}

// COWL FOCUS TIMER CLOCK OPERATION
function startCowlFocusSession() {
  clearInterval(focusTimerInterval);
  focusMinutesRemaining = 25;
  focusSecondsRemaining = 0;
  
  const cowlContainer = document.querySelector('.cowl-focus-container');
  if (cowlContainer) cowlContainer.classList.add('active');
  
  // Play dynamic white noise low hum if the Cowl Focus Soundscape upgrade is equipped
  if (state.equippedUpgrades.includes('focus-audio')) {
    playCowlSoundscape();
  }
  
  updateTimerUI();
  
  focusTimerInterval = setInterval(() => {
    if (focusSecondsRemaining === 0) {
      if (focusMinutesRemaining === 0) {
        clearInterval(focusTimerInterval);
        stopCowlFocusSession(true);
        return;
      }
      focusMinutesRemaining--;
      focusSecondsRemaining = 59;
    } else {
      focusSecondsRemaining--;
    }
    updateTimerUI();
  }, 1000);
}

function updateTimerUI() {
  const timerDigits = document.getElementById('cowl-timer-digits');
  if (!timerDigits) return;
  
  const mins = focusMinutesRemaining.toString().padStart(2, '0');
  const secs = focusSecondsRemaining.toString().padStart(2, '0');
  timerDigits.textContent = `${mins}:${secs}`;
}

function stopCowlFocusSession(completedSuccessfully = false) {
  clearInterval(focusTimerInterval);
  focusTimerInterval = null;
  
  // Shut off synthesizer brown noise loop
  stopCowlSoundscape();
  
  if (completedSuccessfully) {
    awardXP(50);
    state.stats.streak++;
    
    const focusHabit = state.habits.find(h => h.text.toLowerCase().includes('cowl'));
    if (focusHabit) {
      focusHabit.completed = true;
    }
    
    saveState();
    updateHUDView();
    switchModule('dashboard');
  }
}
