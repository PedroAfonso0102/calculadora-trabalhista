const themeManager = {
  init() {
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (!this.themeToggleBtn) {
      console.warn('Theme toggle button not found.');
      return;
    }

    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

    this.applyTheme(this.getTheme());
  },

  getTheme() {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  },

  setTheme(theme) {
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  },

  toggleTheme() {
    const currentTheme = this.getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  },

  applyTheme(theme) {
    const htmlEl = document.documentElement;
    if (theme === 'dark') {
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('dark');
    }
  }
};

export default themeManager;
