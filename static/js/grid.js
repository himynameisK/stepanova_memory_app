/* Режим "grid": все вопросы выводятся таблицей сразу.
 *
 * Используется в вариантах 3 (20 картинок → числа), 4 (20 чисел → слова),
 * 6 (25+25 смешанно, сложный уровень).
 *
 * Структура строки (3 колонки):
 *   - q.show === "image":  [картинка] [инпут-число] [—, после проверки слово/крест]
 *   - q.show === "number": [—, после проверки картинка/крест] [число] [инпут-слово]
 *
 * Пользователь заполняет всё и жмёт «Завершить». Без повтора (ТЗ).
 */
(function () {
  const Grid = {
    session: null,

    start(session) {
      this.session = session;
      this.render();
      const submit = document.getElementById("grid-submit");
      submit.disabled = false;
      submit.textContent = "Завершить и проверить";
      submit.onclick = () => this.submit();
    },

    render() {
      const rows = this.session.questions.map((q, i) => this.rowHtml(q, i));
      document.getElementById("grid-rows").innerHTML = rows.join("");
    },

    rowHtml(q, i) {
      const img = `<img src="/img/${encodeURIComponent(q.filename)}" alt="">`;
      const num = `<span class="big-number-sm">${q.number}</span>`;
      const numInput = `<input class="grid-input" data-i="${i}" type="number"
                              inputmode="numeric" autocomplete="off">`;
      const wordInput = `<input class="grid-input" data-i="${i}" type="text"
                              autocomplete="off" autocapitalize="characters">`;
      const empty = '<span class="placeholder">—</span>';

      let c1, c2, c3;
      if (q.show === "image") {
        c1 = img; c2 = numInput; c3 = empty;
      } else {
        c1 = empty; c2 = num; c3 = wordInput;
      }

      return `
        <div class="grid-row" data-i="${i}">
          <div class="grid-cell grid-cell-1">${c1}</div>
          <div class="grid-cell grid-cell-2">${c2}</div>
          <div class="grid-cell grid-cell-3">${c3}</div>
        </div>`;
    },

    async submit() {
      document.getElementById("grid-submit").disabled = true;

      const inputs = document.querySelectorAll(".grid-input");
      const answers = {};
      inputs.forEach((el) => { answers[el.dataset.i] = el.value.trim(); });

      // Параллельно проверяем все ответы
      const results = await Promise.all(
        this.session.questions.map(async (q, i) => {
          const answer = answers[i] || "";
          if (!answer) return { i, q, correct: false };
          try {
            const r = await App.checkAnswer(q.number, q.show, answer);
            return { i, q, correct: r.correct };
          } catch {
            return { i, q, correct: false };
          }
        })
      );

      let correct = 0;
      for (const r of results) {
        if (r.correct) correct++;
        this.applyResult(r.i, r.q, r.correct);
      }

      App.updateProgress(this.session.total, this.session.total);
      setTimeout(() => App.finish(correct, this.session.total), 1500);
    },

    applyResult(i, q, ok) {
      const row = document.querySelector(`.grid-row[data-i="${i}"]`);
      if (!row) return;
      const cell1 = row.querySelector(".grid-cell-1");
      const cell3 = row.querySelector(".grid-cell-3");
      const img = `<img src="/img/${encodeURIComponent(q.filename)}" alt="">`;

      if (q.show === "image") {
        // Картинка уже в c1, число вводил пользователь в c2.
        // В c3 показываем слово при успехе, крест при провале.
        cell3.innerHTML = ok
          ? `<span class="result-correct">${q.name}</span>`
          : '<span class="result-wrong">✗</span>';
      } else {
        // Число уже в c2, слово вводил пользователь в c3.
        // В c1 показываем картинку при успехе, крест при провале.
        cell1.innerHTML = ok ? img : '<span class="result-wrong">✗</span>';
        // А в c3 подсветим правильное слово (зелёным при успехе, серым при ошибке)
        cell3.innerHTML = ok
          ? `<span class="result-correct">${q.name}</span>`
          : `<span class="result-info">${q.name}</span>`;
      }
      row.querySelectorAll(".grid-input").forEach((el) => (el.disabled = true));
    },
  };

  App.modes.grid = Grid;
})();
