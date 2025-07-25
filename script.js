// アプリケーション状態管理
class AppState {
  constructor() {
    this.words = [];
    this.conjugations = [];
    this.currentMode = "typing";
    this.gameState = this.createInitialGameState();
    this.domElements = {};
  }

  createInitialGameState() {
    return {
      wordList: [],
      currentIndex: 0,
      startTime: null,
      timerInterval: null,
      totalWords: 10,
      correctWords: 0
    };
  }

  resetGameState() {
    this.gameState = this.createInitialGameState();
  }
}

// データ読み込みクラス
class DataLoader {
  static async loadData() {
    try {
      const [wordsRes, conjRes] = await Promise.all([
        fetch('words.json'),
        fetch('conjugations.json')
      ]);
      
      if (!wordsRes.ok || !conjRes.ok) {
        throw new Error('データの読み込みに失敗しました');
      }
      
      const words = await wordsRes.json();
      const conjugations = await conjRes.json();
      
      return { words, conjugations };
    } catch (error) {
      console.error('データ読み込みエラー:', error);
      return { words: [], conjugations: [] };
    }
  }
}

// DOM要素管理クラス
class DOMManager {
  constructor() {
    this.elements = {};
  }

  updateReferences() {
    const elementIds = [
      'typing-section', 'conj-section', 'text-display', 'input',
      'timer', 'progress', 'wpm', 'result', 'conj-verb', 'conj-tense',
      'conj-form', 'conj-result', 'mode-select', 'start-btn', 'mode-container'
    ];

    elementIds.forEach(id => {
      this.elements[id] = document.getElementById(id);
    });
  }

  get(id) {
    return this.elements[id];
  }

  hideAllSections() {
    ['typing-section', 'conj-section'].forEach(sectionId => {
      const section = this.get(sectionId);
      if (section) {
        section.style.display = 'none';
      }
    });
  }

  showSection(sectionId) {
    const section = this.get(sectionId);
    if (section) {
      section.style.display = 'block';
    }
  }
}

// タイピングモードクラス
class TypingMode {
  constructor(appState, domManager) {
    this.appState = appState;
    this.dom = domManager;
    this.boundHandlers = {
      input: this.handleInput.bind(this),
      keydown: this.handleKeydown.bind(this)
    };
  }

  reset() {
    const textDisplay = this.dom.get('text-display');
    const input = this.dom.get('input');
    const result = this.dom.get('result');
    const timer = this.dom.get('timer');
    const progress = this.dom.get('progress');
    const wpm = this.dom.get('wpm');

    if (textDisplay) textDisplay.textContent = "Press Start to begin!";
    if (input) {
      input.value = "";
      input.disabled = true;
      this.removeEventListeners();
    }
    if (result) result.textContent = "";
    if (timer) timer.textContent = "⏱ 0.00s";
    if (progress) progress.textContent = "📊 0 / 10";
    if (wpm) wpm.textContent = "💨 0 WPM";
  }

  start() {
    if (this.appState.words.length === 0) {
      console.error('単語データが読み込まれていません');
      return;
    }

    // ゲーム状態をリセット
    this.appState.resetGameState();
    this.appState.gameState.wordList = this.shuffleArray([...this.appState.words]).slice(0, 10);
    this.appState.gameState.startTime = Date.now();

    const input = this.dom.get('input');
    const result = this.dom.get('result');

    if (input) {
      input.disabled = false;
      input.focus();
      this.addEventListeners();
    }
    if (result) result.textContent = "";

    this.displayCurrentWord();
    this.startTimer();
    this.updateProgress();
  }

  addEventListeners() {
    const input = this.dom.get('input');
    if (input) {
      input.addEventListener('input', this.boundHandlers.input);
      input.addEventListener('keydown', this.boundHandlers.keydown);
    }
  }

  removeEventListeners() {
    const input = this.dom.get('input');
    if (input) {
      input.removeEventListener('input', this.boundHandlers.input);
      input.removeEventListener('keydown', this.boundHandlers.keydown);
    }
  }

  displayCurrentWord() {
    const textDisplay = this.dom.get('text-display');
    if (textDisplay && this.appState.gameState.currentIndex < this.appState.gameState.wordList.length) {
      textDisplay.textContent = this.appState.gameState.wordList[this.appState.gameState.currentIndex];
    }
  }

  handleInput(e) {
    const currentWord = this.appState.gameState.wordList[this.appState.gameState.currentIndex];
    const typed = e.target.value.trim();

    if (typed === currentWord) {
      this.appState.gameState.correctWords++;
      this.appState.gameState.currentIndex++;
      e.target.value = "";

      if (this.appState.gameState.currentIndex >= this.appState.gameState.totalWords) {
        this.finish();
      } else {
        this.displayCurrentWord();
        this.updateProgress();
      }
    }
  }

  handleKeydown(e) {
    if (e.key === "Enter") {
      const currentWord = this.appState.gameState.wordList[this.appState.gameState.currentIndex];
      const input = this.dom.get('input');
      const typed = input ? input.value.trim() : '';
      
      if (typed !== currentWord) {
        this.showError();
      }
    }
  }

  showError() {
    const textDisplay = this.dom.get('text-display');
    if (textDisplay) {
      textDisplay.style.color = "red";
      setTimeout(() => {
        textDisplay.style.color = "black";
      }, 200);
    }
  }

  startTimer() {
    this.appState.gameState.timerInterval = setInterval(() => {
      const elapsed = (Date.now() - this.appState.gameState.startTime) / 1000;
      const timer = this.dom.get('timer');
      const wpm = this.dom.get('wpm');
      
      if (timer) {
        timer.textContent = `⏱ ${elapsed.toFixed(2)}s`;
      }
      
      // WPM計算
      const wordsTyped = this.appState.gameState.correctWords;
      const minutes = elapsed / 60;
      const wpmValue = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
      
      if (wpm) {
        wpm.textContent = `💨 ${wpmValue} WPM`;
      }
    }, 100);
  }

  updateProgress() {
    const progress = this.dom.get('progress');
    if (progress) {
      progress.textContent = `📊 ${this.appState.gameState.currentIndex} / ${this.appState.gameState.totalWords}`;
    }
  }

  finish() {
    if (this.appState.gameState.timerInterval) {
      clearInterval(this.appState.gameState.timerInterval);
    }
    
    const totalTime = (Date.now() - this.appState.gameState.startTime) / 1000;
    const wpmValue = Math.round((this.appState.gameState.correctWords / (totalTime / 60)));
    
    const input = this.dom.get('input');
    const textDisplay = this.dom.get('text-display');
    const result = this.dom.get('result');

    if (input) input.disabled = true;
    if (textDisplay) textDisplay.textContent = "🎉 Complete!";
    
    if (result) {
      result.innerHTML = `
        <div class="success">
          ✅ Time: ${totalTime.toFixed(2)}s<br>
          🚀 Speed: ${wpmValue} WPM<br>
          🎯 Accuracy: ${Math.round((this.appState.gameState.correctWords / this.appState.gameState.totalWords) * 100)}%
        </div>
      `;
    }

    this.removeEventListeners();
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// 活用モードクラス
class ConjugationMode {
  constructor(appState, domManager) {
    this.appState = appState;
    this.dom = domManager;
    this.currentAnswers = null;
  }

  reset() {
    const conjVerb = this.dom.get('conj-verb');
    const conjTense = this.dom.get('conj-tense');
    const conjForm = this.dom.get('conj-form');
    const conjResult = this.dom.get('conj-result');

    if (conjVerb) conjVerb.textContent = "Select a verb to conjugate";
    if (conjTense) conjTense.textContent = "";
    if (conjForm) conjForm.innerHTML = "";
    if (conjResult) conjResult.textContent = "";
  }

  start() {
    if (this.appState.conjugations.length === 0) {
      console.error('活用データが読み込まれていません');
      return;
    }

    const item = this.appState.conjugations[Math.floor(Math.random() * this.appState.conjugations.length)];
    const { verb, answers } = item;
    this.currentAnswers = answers;

    const conjVerb = this.dom.get('conj-verb');
    const conjTense = this.dom.get('conj-tense');
    const conjForm = this.dom.get('conj-form');
    const conjResult = this.dom.get('conj-result');

    if (conjVerb) conjVerb.textContent = verb;
    if (conjTense) conjTense.textContent = "";
    if (conjResult) conjResult.textContent = "";
    if (conjForm) conjForm.innerHTML = "";

    this.createConjugationTable();
  }

  createConjugationTable() {
    const conjForm = this.dom.get('conj-form');
    if (!conjForm || !this.currentAnswers) return;

    const colNames = Object.keys(this.currentAnswers);
    if (colNames.length === 0) {
      const conjResult = this.dom.get('conj-result');
      if (conjResult) {
        conjResult.textContent = "❌ Error: No conjugation data";
      }
      return;
    }

    const rowNames = Object.keys(this.currentAnswers[colNames[0]]);

    // テーブル作成
    const table = this.createTable(colNames, rowNames);
    conjForm.appendChild(table);

    // 送信ボタン作成
    const submitBtn = this.createSubmitButton();
    conjForm.appendChild(submitBtn);

    // フォーカス設定と Enter キーナビゲーション
    this.setupInputNavigation();

    // 送信ハンドラー設定
    this.setupSubmitHandler(colNames, rowNames);
  }

  createTable(colNames, rowNames) {
    const table = document.createElement("table");

    // ヘッダー行
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const emptyTh = document.createElement("th");
    emptyTh.textContent = "Person";
    headerRow.appendChild(emptyTh);
    
    colNames.forEach(colName => {
      const th = document.createElement("th");
      th.textContent = colName;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // ボディ行
    const tbody = document.createElement("tbody");
    rowNames.forEach(rowName => {
      const tr = document.createElement("tr");
      
      // 行名セル
      const tdRowName = document.createElement("td");
      tdRowName.textContent = rowName;
      tdRowName.style.fontWeight = "600";
      tr.appendChild(tdRowName);

      // 入力セル
      colNames.forEach(colName => {
        const td = document.createElement("td");
        const inputEl = document.createElement("input");
        inputEl.name = `${rowName}_${colName}`;
        inputEl.autocomplete = "off";
        inputEl.placeholder = "...";
        td.appendChild(inputEl);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
  }

  createSubmitButton() {
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "✔ Check Answers";
    submitBtn.style.marginTop = "20px";
    return submitBtn;
  }

  setupInputNavigation() {
    const conjForm = this.dom.get('conj-form');
    if (!conjForm) return;

    const firstInput = conjForm.querySelector("input");
    if (firstInput) firstInput.focus();

    const inputs = conjForm.querySelectorAll('input[name]');
    inputs.forEach((inputEl, i) => {
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (i + 1 < inputs.length) {
            inputs[i + 1].focus();
          } else {
            conjForm.requestSubmit();
          }
        }
      });
    });
  }

  setupSubmitHandler(colNames, rowNames) {
    const conjForm = this.dom.get('conj-form');
    if (!conjForm) return;

    conjForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.checkAnswers(colNames, rowNames);
    });
  }

  checkAnswers(colNames, rowNames) {
    const conjForm = this.dom.get('conj-form');
    const conjResult = this.dom.get('conj-result');
    
    if (!conjForm || !conjResult) return;

    const formData = new FormData(conjForm);
    let correct = 0;
    let total = 0;
    let errors = [];

    rowNames.forEach(rowName => {
      colNames.forEach(colName => {
        const key = `${rowName}_${colName}`;
        const correctAnswer = this.currentAnswers[colName][rowName].toLowerCase();
        const userInput = (formData.get(key) || "").trim().toLowerCase();
        total++;
        
        if (userInput === correctAnswer) {
          correct++;
        } else {
          errors.push(`${rowName} ${colName}: "${correctAnswer}"`);
        }
      });
    });

    if (correct === total) {
      conjResult.innerHTML = '<div class="success">🎉 Perfect! All answers correct!</div>';
    } else {
      conjResult.innerHTML = `
        <div class="error">
          ❌ ${total - correct} error(s)<br>
          <small>Corrections: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}</small>
        </div>
      `;
    }
  }
}

// メインアプリケーションクラス
class TypingConjugationApp {
  constructor() {
    this.appState = new AppState();
    this.domManager = new DOMManager();
    this.typingMode = new TypingMode(this.appState, this.domManager);
    this.conjugationMode = new ConjugationMode(this.appState, this.domManager);
  }

  async init() {
    try {
      // データ読み込み
      const { words, conjugations } = await DataLoader.loadData();
      this.appState.words = words;
      this.appState.conjugations = conjugations;

      // DOM要素の参照を更新
      this.domManager.updateReferences();

      // イベントリスナー設定
      this.setupEventListeners();

      // 初期状態設定
      this.switchMode();
      
      console.log('アプリケーションが正常に初期化されました');
    } catch (error) {
      console.error('アプリケーションの初期化に失敗しました:', error);
    }
  }

  setupEventListeners() {
    const modeSelect = this.domManager.get('mode-select');
    const startBtn = this.domManager.get('start-btn');

    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        this.appState.currentMode = e.target.value;
        this.switchMode();
      });
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startCurrentMode();
      });
    }
  }

  switchMode() {
    this.domManager.hideAllSections();
    
    if (this.appState.currentMode === "typing") {
      this.domManager.showSection('typing-section');
      this.typingMode.reset();
    } else if (this.appState.currentMode === "conjugation") {
      this.domManager.showSection('conj-section');
      this.conjugationMode.reset();
    }
  }

  startCurrentMode() {
    if (this.appState.currentMode === "typing") {
      this.typingMode.start();
    } else if (this.appState.currentMode === "conjugation") {
      this.conjugationMode.start();
    }
  }
}

// アプリケーションの初期化
window.addEventListener("DOMContentLoaded", async () => {
  const app = new TypingConjugationApp();
  await app.init();
});
