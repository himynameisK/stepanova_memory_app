/* Админ-панель: статистика по упражнениям, история тренировок, справочник.
 *
 * Источники данных:
 *   GET /api/exercises — список упражнений с конфигом
 *   GET /api/images    — справочник {номер: {name, filename}}
 *   GET /api/results   — массив результатов (history)
 */
(function () {
  const Admin = {
    exercises: [],
    results: [],

    async init() {
      try {
        [this.exercises, this.results] = await Promise.all([
          fetch("/api/exercises").then((r) => r.json()),
          fetch("/api/results").then((r) => r.json()),
        ]);
      } catch (e) {
        console.error("Не удалось загрузить данные:", e);
      }
      this.renderStats();
      this.renderFilter();
      this.renderResults();
      this.renderImages();
      this.bindActions();
    },

    bindActions() {
      document.getElementById("clear-results-btn").onclick = async () => {
        if (!confirm("Очистить всю историю тренировок?")) return;
        await fetch("/api/results", { method: "DELETE" });
        this.results = [];
        this.renderStats();
        this.renderResults();
      };
      document.getElementById("filter-exercise").onchange = () => this.renderResults();
    },

    // ─── Статистика ────────────────────────────────────────────────────────
    renderStats() {
      const container = document.getElementById("stats-container");
      if (!this.exercises.length) {
        container.innerHTML = '<p class="placeholder">Нет упражнений</p>';
        return;
      }

      const byExercise = {};
      for (const r of this.results) {
        const id = r.exercise_id || "unknown";
        (byExercise[id] = byExercise[id] || []).push(r);
      }

      container.innerHTML = this.exercises
        .map((ex) => {
          const rs = byExercise[ex.id] || [];
          const runs = rs.length;
          const avg =
            runs > 0
              ? Math.round(
                  rs.reduce((s, r) => s + (r.percentage || 0), 0) / runs
                )
              : 0;
          const best = runs > 0 ? Math.max(...rs.map((r) => r.percentage || 0)) : 0;
          return `
            <div class="stat-row">
              <div class="stat-row__title">${ex.title}</div>
              <div class="stat-row__values">
                <span><b>${runs}</b> прохождений</span>
                <span>средний: <b>${avg}%</b></span>
                <span>лучший: <b>${best}%</b></span>
              </div>
            </div>`;
        })
        .join("");
    },

    // ─── Фильтр ────────────────────────────────────────────────────────────
    renderFilter() {
      const sel = document.getElementById("filter-exercise");
      sel.innerHTML =
        '<option value="">Все упражнения</option>' +
        this.exercises.map((e) => `<option value="${e.id}">${e.title}</option>`).join("");
    },

    // ─── История ───────────────────────────────────────────────────────────
    renderResults() {
      const filter = document.getElementById("filter-exercise").value;
      const list = document.getElementById("results-list");
      const filtered = filter
        ? this.results.filter((r) => r.exercise_id === filter)
        : this.results;

      if (!filtered.length) {
        list.innerHTML = '<p class="placeholder">Нет записей</p>';
        return;
      }

      const exerciseTitle = (id) => {
        const ex = this.exercises.find((e) => e.id === id);
        return ex ? ex.title : id || "—";
      };

      const rows = filtered
        .slice()
        .reverse()
        .map((r) => {
          const date = r.timestamp ? new Date(r.timestamp).toLocaleString("ru-RU") : "—";
          return `
            <tr>
              <td>${date}</td>
              <td>${exerciseTitle(r.exercise_id)}</td>
              <td>${r.level === "hard" ? "сложный" : "простой"}</td>
              <td>${r.correct} / ${r.total}</td>
              <td>${r.percentage}%</td>
            </tr>`;
        })
        .join("");

      list.innerHTML = `
        <table class="results-table">
          <thead>
            <tr><th>Дата</th><th>Упражнение</th><th>Уровень</th><th>Верно</th><th>%</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    },

    // ─── Справочник изображений ────────────────────────────────────────────
    async renderImages() {
      const container = document.getElementById("images-list");
      let images;
      try {
        images = await fetch("/api/images").then((r) => r.json());
      } catch (e) {
        container.innerHTML = '<p class="error">Не удалось загрузить</p>';
        return;
      }
      const numbers = Object.keys(images).map(Number).sort((a, b) => a - b);
      document.getElementById("images-count").textContent = numbers.length;

      container.innerHTML = numbers
        .map((n) => {
          const im = images[n];
          return `
            <div class="image-card">
              <div class="image-preview">
                <img src="/img/${encodeURIComponent(im.filename)}" alt="${im.name}" loading="lazy">
              </div>
              <div class="image-info"><strong>${n}</strong> — ${im.name}</div>
            </div>`;
        })
        .join("");
    },
  };

  window.addEventListener("DOMContentLoaded", () => Admin.init());
})();
