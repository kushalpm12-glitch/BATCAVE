import { initTheme, setTheme } from './theme.js';
import { initNavigation, switchModule } from './navigation.js';
import { calculateLevelFromXP, getRankDetails, updateSyncIntegrity, renderEvolvingCowlSVG, triggerLevelUpSequence } from './evolution.js';

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
    streak: 5
  },
  dailyMissions: [
    { id: 1, text: "Execute Apex Physical Patrol (Gym/Cardio)", completed: false },
    { id: 2, text: "Gather Intel (Read 30 minutes of technical articles)", completed: false },
    { id: 3, text: "Review active financial ledger assets", completed: false }
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
  }
};

let state = { ...DEFAULT_STATE };

// TIMER STATE FOR COWL FOCUS MODE
let focusTimerInterval = null;
let focusMinutesRemaining = 25;
let focusSecondsRemaining = 0;

// LOAD AND SAVE HELPERS
function loadState() {
  const saved = localStorage.getItem('batcave-state');
  if (saved) {
    try {
      state = JSON.parse(saved);
      // Ensure missing structure from schema upgrades is safely defaulted
      state.profile = { ...DEFAULT_STATE.profile, ...state.profile };
      state.stats = { ...DEFAULT_STATE.stats, ...state.stats };
      if (!state.dailyMissions) state.dailyMissions = [...DEFAULT_STATE.dailyMissions];
      if (!state.habits) state.habits = [...DEFAULT_STATE.habits];
      if (!state.badHabits) state.badHabits = [...DEFAULT_STATE.badHabits];
      if (!state.weeklyAnalytics) state.weeklyAnalytics = { ...DEFAULT_STATE.weeklyAnalytics };
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
    const oldLevel = state.stats.currentLevel;
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
    systemStatusMsg.textContent = syncDetails.bannerText;
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
    
    // Checkbox toggle handler
    div.querySelector('.custom-checkbox').addEventListener('click', () => {
      toggleMission(m.id);
    });
    
    // Delete item handler
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

// RENDER: PROGRESS ANALYTICS GRID
function renderAnalyticsDotGrid() {
  const container = document.getElementById('progress-analytics-grid');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Grid labels
  const labelCol = document.createElement('div');
  labelCol.className = 'grid-label-column';
  labelCol.innerHTML = `
    <span class="grid-sector-label">SEC.ALPHA (PHYS)</span>
    <span class="grid-sector-label">SEC.BETA (MIND)</span>
    <span class="grid-sector-label">SEC.GAMMA (CRAFT)</span>
  `;
  container.appendChild(labelCol);
  
  // Weekly columns
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  days.forEach(day => {
    const col = document.createElement('div');
    col.className = 'grid-day-column';
    
    const dayHeader = document.createElement('span');
    dayHeader.className = 'grid-day-header';
    dayHeader.textContent = day;
    col.appendChild(dayHeader);
    
    // Add 3 nodes per day (one for each sector)
    const completions = state.weeklyAnalytics[day] || [false, false, false];
    completions.forEach((completed, idx) => {
      const node = document.createElement('span');
      node.className = `grid-node ${completed ? 'active' : ''}`;
      
      const sectorNames = ["Alpha (Physical)", "Beta (Mind)", "Gamma (Craft)"];
      node.setAttribute('data-tooltip', `${day}: Sector ${sectorNames[idx]} - ${completed ? 'SECURED' : 'UNSECURED'}`);
      
      // Interactive node toggle to allow historic calibration
      node.addEventListener('click', () => {
        state.weeklyAnalytics[day][idx] = !state.weeklyAnalytics[day][idx];
        
        // Award historic validation XP
        if (state.weeklyAnalytics[day][idx]) {
          awardXP(10);
        } else {
          awardXP(-10);
        }
        
        saveState();
        updateHUDView();
      });
      
      col.appendChild(node);
    });
    
    container.appendChild(col);
  });
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
  state.stats.totalXP = Math.max(0, state.stats.totalXP + amount);
}

function toggleMission(id) {
  const mission = state.dailyMissions.find(m => m.id === id);
  if (!mission) return;
  
  mission.completed = !mission.completed;
  
  // XP Rewards: +20 XP for daily missions, -20 XP if unchecked
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
  
  // XP Rewards: +10 XP for daily habits
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
    // Relapsed: Loss of 50 XP and reset streak
    awardXP(-50);
    state.stats.streak = 0;
  } else {
    // Re-secured: Earn 30 XP
    awardXP(30);
  }
  
  saveState();
  updateHUDView();
}

// INTERACTIVE BUTTONS AND FORM LISTENERS
function setupInteractiveEvents() {
  // Theme Toggle Buttons
  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.getAttribute('data-value');
      setTheme(selectedTheme);
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
      
      // Auto redirect to main dashboard after saving profile
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
  // Reset and activate Cowl display
  clearInterval(focusTimerInterval);
  focusMinutesRemaining = 25;
  focusSecondsRemaining = 0;
  
  const timerDigits = document.getElementById('cowl-timer-digits');
  const cowlContainer = document.querySelector('.cowl-focus-container');
  if (cowlContainer) cowlContainer.classList.add('active');
  
  updateTimerUI();
  
  focusTimerInterval = setInterval(() => {
    if (focusSecondsRemaining === 0) {
      if (focusMinutesRemaining === 0) {
        // Complete Cowl Timer!
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
  
  if (completedSuccessfully) {
    // Earn 50 XP for completing a deep focus cowl session
    awardXP(50);
    
    // Add success streak validation
    state.stats.streak++;
    
    // Complete first habit automatically if focus session is in habits
    const focusHabit = state.habits.find(h => h.text.toLowerCase().includes('cowl'));
    if (focusHabit) {
      focusHabit.completed = true;
    }
    
    saveState();
    updateHUDView();
    
    // Exit Cowl timer to show updated reactor core state
    switchModule('dashboard');
  }
}
