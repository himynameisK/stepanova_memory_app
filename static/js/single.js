/* Режим "single": показывает один вопрос за раз.
 *
 * Используется в вариантах 1 (картинка → число), 2 (число → слово),
 * 5 (чередование картинок и чисел, сложный уровень).
 *
 * Вопрос определяет, что показывать (поле q.show):
 *   "image"  — в столбце 1 картинка, пользователь вводит число
 *   "number" — в столбце 2 число, пользователь вводит слово
 *
 * Результат (3-й столбец) показывает либо правильный ответ, либо красный крест.
 */
(function () {
  const Single = {
    session: null,
    index: 0,
    attempts: 0,
    correct: 0,
    locked: false,

    start(session) {
      this.session = session;
      this.index = 0;
      this.attempts = 0;
      this.correct = 0;
      this.locked = false;

      const submit = document.getElementById("single-submit");
      const input = document.getElementById("single-input");
      submit.onclick = () => this.submit();
      input.onkeydown = (e) => {
        if (e.key === "Enter") this.submit();
      };

      this.renderQuestion();
    },

    currentQuestion() {
      return this.session.questions[this.index];
    },

    renderQuestion() {
      const q = this.currentQuestion();
      const col1 = document.getElementById("single-col1"); // картинка
      const col2 = document.getElementById("single-col2"); // число
      const col3 = document.getElementById("single-col3"); // слово / результат

      // Сбрасываем все колонки
      col1.innerHTML = '<span class="placeholder">—</span>';
      col2.innerHTML = '<span class="placeholder">—</span>';
      col3.innerHTML = '<span class="placeholder">Ожидание ответа…</span>';

      if (q.show === "image") {
        col1.innerHTML = `<img src="/img/${encodeURIComponent(q.filename)}" alt="">`;
      } else {
        col2.innerHTML = `<span class="big-number">${q.number}</span>`;
      }

      this.attempts = 0;
      this.locked = false;
      const input = document.getElementById("single-input");
      input.value = "";
      input.disabled = false;
      input.placeholder = q.show === "image" ? "Введите число" : "Введите слово";
      input.type = q.show === "image" ? "number" : "text";
      document.getElementById("single-submit").disabled = false;
      document.getElementById("single-attempts").textContent = "";
      input.focus();

      App.updateProgress(this.index, this.session.total);
    },

    async submit() {
      if (this.locked) return;
      const input = document.getElementById("single-input");
      const answer = input.value.trim();
      if (!answer) return;

      const q = this.currentQuestion();
      let result;
      try {
        result = await App.checkAnswer(q.number, q.show, answer);
      } catch (e) {
        alert("Ошибка проверки: " + e.message);
        return;
      }
      this.attempts++;

      const col1 = document.getElementById("single-col1");
      const col2 = document.getElementById("single-col2");
      const col3 = document.getElementById("single-col3");

      if (result.correct) {
        this.correct++;
        // Открываем недостающую колонку
        if (q.show === "image") {
          col3.innerHTML = `<span class="result-correct">${q.name}</span>`;
        } else {
          col1.innerHTML = `<img src="/img/${encodeURIComponent(q.filename)}" alt="">`;
        }
        this.lockAndAdvance(1000);
        return;
      }

      // Неверный ответ — крест либо в col3 (если показывали картинку),
      // либо в col1 (если показывали число)
      const wrongCol = q.show === "image" ? col3 : col1;
      wrongCol.innerHTML = '<span class="result-wrong">✗</span>';

      const max = this.session.max_attempts;
      if (this.attempts >= max) {
        // Показываем правильный ответ, потом переходим дальше
        document.getElementById("single-attempts").textContent =
          `Правильный ответ: ${result.expected}`;
        this.lockAndAdvance(2000);
      } else {
        document.getElementById("single-attempts").textContent =
          `Попытка ${this.attempts} из ${max}. Попробуйте ещё раз.`;
        input.value = "";
        input.focus();
      }
    },

    lockAndAdvance(delay) {
      this.locked = true;
      document.getElementById("single-input").disabled = true;
      document.getElementById("single-submit").disabled = true;
      setTimeout(() => {
        this.index++;
        App.updateProgress(this.index, this.session.total);
        if (this.index >= this.session.total) {
          App.finish(this.correct, this.session.total);
        } else {
          this.renderQuestion();
        }
      }, delay);
    },
  };

  App.modes.single = Single;
})();
