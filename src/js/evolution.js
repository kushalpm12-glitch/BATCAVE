/* BATCAVE Evolution & Progression Engine */

export const RANKS = [
  { minLevel: 1, maxLevel: 4, label: "VIGILANTE", iconClass: "cowl-level-1" },
  { minLevel: 5, maxLevel: 9, label: "SPECIALIST", iconClass: "cowl-level-2" },
  { minLevel: 10, maxLevel: 14, label: "DETECTIVE", iconClass: "cowl-level-3" },
  { minLevel: 15, maxLevel: 19, label: "ENFORCER", iconClass: "cowl-level-4" },
  { minLevel: 20, maxLevel: Infinity, label: "THE DARK KNIGHT", iconClass: "cowl-level-5" }
];

export function getRankDetails(level) {
  return RANKS.find(r => level >= r.minLevel && level <= r.maxLevel) || RANKS[0];
}

export function calculateLevelFromXP(totalXP) {
  const xpPerLevel = 1000;
  const level = Math.floor(totalXP / xpPerLevel) + 1;
  const currentXP = totalXP % xpPerLevel;
  return { level, currentXP, nextLevelXP: xpPerLevel, progressPercent: (currentXP / xpPerLevel) * 100 };
}

export function updateSyncIntegrity(completedCount, totalCount) {
  const syncPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Update document root state based on Sync Integrity
  const docRoot = document.documentElement;
  docRoot.classList.remove('state-overdrive', 'state-decay');
  
  let syncState = 'standard';
  let bannerText = 'SYSTEM INTEGRITY: STABLE | NOMINAL WORKLOAD DETECTED';
  
  if (syncPercentage >= 80) {
    docRoot.classList.add('state-overdrive');
    syncState = 'overdrive';
    bannerText = 'SYSTEM INTEGRITY: OPTIMAL | OPERATIVE PEAK PERFORMANCE SECURED';
  } else if (syncPercentage < 40 && totalCount > 0) {
    docRoot.classList.add('state-decay');
    syncState = 'decay';
    bannerText = 'SYSTEM DECAY DETECTED | INITIATE RE-ALIGNMENT ROUTINES IMMEDIATELY';
  }
  
  return { syncPercentage, syncState, bannerText };
}

// Fullscreen level up event sequence
export function triggerLevelUpSequence(newLevel, rankLabel, callback) {
  const overlay = document.getElementById('level-up-overlay');
  const consoleBox = document.getElementById('levelup-console-box');
  
  if (!overlay || !consoleBox) {
    if (callback) callback();
    return;
  }
  
  overlay.style.display = 'flex';
  consoleBox.innerHTML = '';
  
  const logs = [
    `[SYSTEM INITIALIZING LEVEL-UP PROTOCOLS...]`,
    `[INFO] SECURITY THRESHOLD CROSSED. DETECTING EXPANSION IN OPERATIVE INTELLIGENCE.`,
    `[CORE] DOWNLOADING VIGILANTE FRAMEWORK v${newLevel}.0...`,
    `[CORE] RE-CALIBRATING UTILITY BELT CHANNELS...`,
    `[CORE] INTEGRATION COMPLETE. CLEARANCE UPGRADED TO LEVEL ${newLevel}!`,
    `[SECURITY] CURRENT CLEARANCE RANK STATUS: [${rankLabel}]`,
    `[SYSTEM] OPERATIONAL HUD BOOTING ONLINE... READY FOR ACTIVE DUTY.`
  ];
  
  let lineIdx = 0;
  
  function typeLine() {
    if (lineIdx < logs.length) {
      const p = document.createElement('p');
      p.className = 'levelup-terminal-line';
      if (logs[lineIdx].startsWith('[CORE]') || logs[lineIdx].startsWith('[SECURITY]')) {
        p.classList.add('highlight');
      }
      p.textContent = logs[lineIdx];
      consoleBox.appendChild(p);
      consoleBox.scrollTop = consoleBox.scrollHeight;
      lineIdx++;
      setTimeout(typeLine, 400);
    } else {
      // Show exit instructions
      const exitMsg = document.createElement('p');
      exitMsg.className = 'levelup-terminal-line';
      exitMsg.style.marginTop = '10px';
      exitMsg.style.color = 'var(--text-secondary)';
      exitMsg.textContent = '>> CLICK ANYWHERE ON MAINFRAME TO ENGAGE MODULES...';
      consoleBox.appendChild(exitMsg);
      
      // Allow close
      const closeHandler = () => {
        overlay.style.display = 'none';
        overlay.removeEventListener('click', closeHandler);
        if (callback) callback();
      };
      overlay.addEventListener('click', closeHandler);
    }
  }
  
  // Audio effect toggle (visual flash fallback)
  document.body.style.filter = 'brightness(2) contrast(1.5)';
  setTimeout(() => {
    document.body.style.filter = '';
    typeLine();
  }, 150);
}

// EVOLVING VECTOR COWL GRAPHIC ACCORDING TO RANK
export function renderEvolvingCowlSVG(level) {
  // Level-based glow and scanning states
  let glowIntensity = "0.5";
  let scanClass = "cowl-glitch-low";
  
  if (level >= 5) {
    glowIntensity = "0.7";
    scanClass = "cowl-scan-mid";
  }
  if (level >= 10) {
    glowIntensity = "0.9";
    scanClass = "cowl-sonar-high";
  }
  
  return `
    <svg class="avatar-cowl ${scanClass}" viewBox="0 0 100 100" style="filter: drop-shadow(0 0 5px rgba(var(--accent-rgb), ${glowIntensity}));">
      <!-- Minimalist Evolving Cowl Outline -->
      <path d="M 50 12 
               L 65 30 
               L 59 34 
               L 63 60 
               L 68 85 
               L 50 88 
               L 32 85 
               L 37 60 
               L 41 34 
               L 35 30 Z" 
            stroke="var(--accent-color)" 
            stroke-width="2" 
            fill="none" 
            stroke-linejoin="miter" />
      
      <!-- Eyes slot -->
      <path d="M 38 48 H 62 L 50 51 Z" fill="var(--bg-primary)" stroke="var(--accent-color)" stroke-width="1" />
      
      <!-- Eyes Glow vector (grows as rank increases) -->
      ${level >= 5 ? `<polygon points="41,49 47,49 44,51" fill="var(--accent-color)" />` : ''}
      ${level >= 5 ? `<polygon points="59,49 53,49 56,51" fill="var(--accent-color)" />` : ''}
      
      <!-- Sonar circles for Detective Rank+ -->
      ${level >= 10 ? `
        <circle cx="50" cy="50" r="30" stroke="var(--accent-color)" stroke-width="0.5" stroke-dasharray="2 3" opacity="0.3" />
        <circle cx="50" cy="50" r="40" stroke="var(--accent-color)" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.2" />
      ` : ''}
      
      <!-- Armored face panel lines for Enforcer+ -->
      ${level >= 15 ? `
        <line x1="50" y1="12" x2="50" y2="88" stroke="var(--accent-color)" stroke-width="0.5" opacity="0.2" />
        <line x1="37" y1="60" x2="63" y2="60" stroke="var(--accent-color)" stroke-width="0.5" opacity="0.3" />
      ` : ''}
    </svg>
  `;
}
