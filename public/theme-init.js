// Applies the last-used theme before the app loads, so there's no flash of
// the wrong colors. The saved setting is re-applied once the app starts.
(function () {
  try {
    var mode = localStorage.getItem("khm-theme");
    if (mode === "light" || mode === "dark" || mode === "system") {
      document.documentElement.setAttribute("data-theme", mode);
    }
  } catch (e) {}
})();
