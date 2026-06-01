/* Главный контроллер тренажёра.
 *
 * Управляет переключением экранов, запросами к API и общим состоянием
 * сессии. Конкретные рендеры (single / grid) подключаются через App.modes.
 */
(function () {
  const App = {
    exercises: [],
    current: null,    // ExerciseConfig текущего запущенного упражнения
    session: null,    // структура сессии с сервера
    progress: 0,      // сколько вопросов отвечено (для single)
    correct: 0,       // сколько верных
    modes: {},        // регистрируются файлами single.js / grid.js

    // ─── API клиент ────────────────────────────────────────────────────────
    async api(path, opts = {}) {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...opts,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },

    // ─── Жизненный цикл ────────────────────────────────────────────────────
    async init() {
      try {
        this.exercises = await this.api("/api/exercises");
        this.renderStart();
      } catch (e) {
        document.getElementById("exercise-list").innerHTML =
          `<p class="error">Не удалось загрузить упражнения: ${e.message}</p>`;
      }
    },

    renderStart() {
      const list = document.getElementById("exercise-list");
      list.innerHTML = this.exercises
        .map(
          (ex) => `
          <button class="exercise-card" data-id="${ex.id}">
            <div class="exercise-card__title">${ex.title}</div>
            <div class="exercise-card__desc">${ex.description}</div>
            <div class="exercise-card__meta">
              <span class="badge badge-${ex.level}">${ex.level === "hard" ? "сложный" : "простой"}</span>
              <span class="badge">${ex.count} вопросов</span>
              <span class="badge">${ex.max_attempts === 1 ? "без повтора" : ex.max_attempts + " попытки"}</span>
            </div>
          </button>`
        )
        .join("");
      list.querySelectorAll(".exercise-card").forEach((btn) => {
        btn.addEventListener("click", () => this.start(btn.dataset.id));
      });
    },

    async start(exerciseId) {
      this.current = this.exercises.find((e) => e.id === exerciseId);
      if (!this.current) return;
      try {
        this.session = await this.api("/api/session", {
          method: "POST",
          body: { exercise_id: exerciseId },
        });
      } catch (e) {
        alert("Не удалось начать упражнение: " + e.message);
        return;
      }
      this.progress = 0;
      this.correct = 0;
      this.showScreen(this.session.layout === "grid" ? "grid-screen" : "single-screen");
      this.updateProgress(0, this.session.total);
      this.modes[this.session.layout].start(this.session);
    },

    // ─── Управление экранами ──────────────────────────────────────────────
    showScreen(id) {
      ["start-screen", "single-screen", "grid-screen", "results-screen"].forEach((s) => {
        document.getElementById(s).classList.toggle("hidden", s !== id);
      });
      document
        .getElementById("progress-bar-wrap")
        .classList.toggle("hidden", id !== "single-screen" && id !== "grid-screen");
    },

    updateProgress(done, total) {
      document.getElementById("progress-text").textContent = `Вопрос ${done} из ${total}`;
      const pct = total > 0 ? (done / total) * 100 : 0;
      document.getElementById("progress-fill").style.width = `${pct}%`;
    },

    // ─── Завершение упражнения ────────────────────────────────────────────
    async finish(correct, total) {
      this.correct = correct;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      document.getElementById("results-title").textContent =
        `${this.current.title} — результаты`;
      document.getElementById("correct-count").textContent = correct;
      document.getElementById("total-count").textContent = total;
      document.getElementById("percentage").textContent = pct + "%";
      this.showScreen("results-screen");

      // Сохраняем результат на сервер (не блокируем UI)
      this.api("/api/results", {
        method: "POST",
        body: {
          exercise_id: this.current.id,
          title: this.current.title,
          level: this.current.level,
          correct,
          total,
          timestamp: new Date().toISOString(),
        },
      }).catch((e) => console.error("Сохранение результата:", e));
    },

    repeatExercise() {
      if (this.current) this.start(this.current.id);
    },

    goToStart() {
      this.current = null;
      this.session = null;
      this.showScreen("start-screen");
    },

    // ─── Проверка ответа через API ────────────────────────────────────────
    async checkAnswer(number, show, answer) {
      return this.api("/api/check", {
        method: "POST",
        body: { number, show, answer },
      });
    },
  };

  window.App = App;
})();
