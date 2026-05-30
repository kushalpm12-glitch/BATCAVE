/* BATCAVE Navigation Controller */

export function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetModule = tab.getAttribute('data-target');
      switchModule(targetModule);
    });
  });
  
  // Set default module
  switchModule('dashboard');
}

export function switchModule(moduleName) {
  // Hide all modules
  const modules = document.querySelectorAll('.module-section');
  modules.forEach(mod => mod.classList.remove('active'));
  
  // Hide Cowl Focus mode container specifically
  const cowlContainer = document.querySelector('.cowl-focus-container');
  if (cowlContainer) cowlContainer.classList.remove('active');
  
  // Show target module
  const targetModuleElement = document.getElementById(`module-${moduleName}`);
  if (targetModuleElement) {
    targetModuleElement.classList.add('active');
  }
  
  // Update nav tabs active class
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-target') === moduleName) {
      tab.classList.add('active');
      // Highlight system coordinates corresponding to target
      updateSysCoordinates(tab.textContent.trim());
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Dispatch custom route event
  const routeEvent = new CustomEvent('batcave-route-changed', { detail: { module: moduleName } });
  document.dispatchEvent(routeEvent);
}

function updateSysCoordinates(tabLabel) {
  const coordElement = document.getElementById('sys-coordinates');
  if (!coordElement) return;
  
  // Random dynamic coordinate readout to simulate deep terminal scans
  const randLat = (Math.random() * 10 + 40).toFixed(4);
  const randLong = (Math.random() * 10 - 74).toFixed(4);
  coordElement.textContent = `SYS_LOC: [${tabLabel}] // LAT:${randLat}°N_LON:${randLong}°W`;
}
