(function () {
  const savedTheme = localStorage.getItem("meetflowTheme") || "light";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("meetflowTheme", theme);

    const toggles = document.querySelectorAll("[data-theme-toggle]");
    for (let i = 0; i < toggles.length; i++) {
      const icon = toggles[i].querySelector("i");
      toggles[i].setAttribute("title", theme === "dark" ? "Light theme" : "Dark theme");

      if (icon) {
        icon.className = theme === "dark" ? "bi bi-sun" : "bi bi-moon-stars";
      }
    }
  }

  applyTheme(savedTheme);

  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(localStorage.getItem("meetflowTheme") || savedTheme);

    const toggles = document.querySelectorAll("[data-theme-toggle]");
    for (let i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener("click", function () {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        applyTheme(currentTheme === "dark" ? "light" : "dark");
      });
    }
  });
})();
