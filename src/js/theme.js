/* BATCAVE Theme Controller */

export function initTheme() {
  const savedTheme = localStorage.getItem('batcave-theme') || 'cyber';
  setTheme(savedTheme);
}

export function setTheme(themeName) {
  // themeName can be 'cyber' (default/root) or 'gothic'
  if (themeName === 'gothic') {
    document.documentElement.setAttribute('data-theme', 'gothic');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  
  localStorage.setItem('batcave-theme', themeName);
  
  // Update active state in theme buttons
  updateThemeButtonsUI(themeName);
  
  // Trigger system update event
  const themeEvent = new CustomEvent('batcave-theme-changed', { detail: { theme: themeName } });
  document.dispatchEvent(themeEvent);
}

function updateThemeButtonsUI(activeTheme) {
  const buttons = document.querySelectorAll('.theme-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-value') === activeTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
