// Mock browser environment
global.document = {
  addEventListener: () => {}
};
global.window = {
  location: {
    search: ''
  }
};

// Define required classes for testing
class StorageManager {
  constructor() {
    this.storage = {};
  }

  isStorageAvailable() {
    return true;
  }

  saveSettings(key, value) {
    this.storage[key] = value;
    return { success: true };
  }

  loadSettings(key, defaultValue = null) {
    return {
      value: this.storage[key] !== undefined ? this.storage[key] : defaultValue,
      success: true
    };
  }
}

class InputValidator {
  constructor() {
    this.MIN_WAGE = 0;
    this.MAX_WAGE = 1000000;
  }

  validateWage(input) {
    if (input === '' || input == null) {
      return { isValid: false, error: '時給を入力してください', value: null };
    }

    const numValue = parseFloat(input);

    if (isNaN(numValue)) {
      return { isValid: false, error: '有効な数値を入力してください', value: null };
    }

    if (numValue < this.MIN_WAGE) {
      return { isValid: false, error: '時給は0円以上で入力してください', value: null };
    }

    if (numValue > this.MAX_WAGE) {
      return { isValid: false, error: `時給は${this.MAX_WAGE.toLocaleString()}円以下で入力してください`, value: null };
    }

    return { isValid: true, error: null, value: numValue };
  }

  showError() {}
  hideError() {}
}

class CurrencyFormatter {
  constructor(currency = '¥', locale = 'ja-JP') {
    this.currency = currency;
    this.locale = locale;
  }

  format(amount, showDecimals = false) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return `${this.currency}0`;
    }
    const roundedAmount = showDecimals ? Math.round(amount * 100) / 100 : Math.floor(amount);
    return `${this.currency}${roundedAmount}`;
  }

  formatSimple(amount) {
    return this.format(amount, false);
  }

  formatDetailed(amount) {
    return this.format(amount, true);
  }
}

class Visualizer {
  constructor() {
    this.isInitialized = true;
    this.maxEarnings = 0;
  }

  initialize() {}
  setMaxEarnings(value) { this.maxEarnings = value; }
  updateProgress() {}
  reset() {}
  setVisualizationMode() {}
}

// Define WageCounter class
class WageCounter {
  constructor() {
    this.hourlyWage = 0;           // 時給（円）
    this.currentEarnings = 0;      // 現在の累積収入
    this.elapsedSeconds = 0;       // 経過秒数
    this.isRunning = false;        // カウンター動作状態
    this.perSecondWage = 0;        // 秒単位の収入
    this.startTime = null;         // 開始時刻
    this.pausedTime = 0;           // 一時停止時の累積時間
  }

  setHourlyWage(wage) {
    this.hourlyWage = wage;
    this.perSecondWage = wage / 3600; // 時給を秒単位に変換
  }

  getHourlyWage() {
    return this.hourlyWage;
  }

  getCurrentEarnings() {
    return this.currentEarnings;
  }

  setCurrentEarnings(earnings) {
    this.currentEarnings = earnings;
  }

  getElapsedTime() {
    return this.elapsedSeconds;
  }

  setElapsedTime(seconds) {
    this.elapsedSeconds = seconds;
  }

  getPerSecondWage() {
    return this.perSecondWage;
  }

  calculatePerSecondWage(hourlyWage) {
    if (typeof hourlyWage !== 'number' || isNaN(hourlyWage) || hourlyWage < 0) {
      return 0;
    }
    return hourlyWage / 3600; // 1時間 = 3600秒
  }

  calculateEarningsForSeconds(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      return 0;
    }
    return this.perSecondWage * seconds;
  }

  updateCurrentEarnings() {
    this.currentEarnings = this.calculateEarningsForSeconds(this.elapsedSeconds);
  }

  getIsRunning() {
    return this.isRunning;
  }

  setIsRunning(running) {
    this.isRunning = running;
  }

  getStartTime() {
    return this.startTime;
  }

  setStartTime(time) {
    this.startTime = time;
  }

  getPausedTime() {
    return this.pausedTime;
  }

  setPausedTime(time) {
    this.pausedTime = time;
  }

  updateElapsedTime(elapsedSeconds) {
    this.elapsedSeconds = elapsedSeconds;
    this.updateCurrentEarnings();
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      if (!this.startTime) {
        this.startTime = new Date();
      }
    }
  }

  stop() {
    this.isRunning = false;
  }

  getFormattedElapsedTime() {
    const totalSeconds = this.elapsedSeconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getElapsedTimeBreakdown() {
    const totalSeconds = this.elapsedSeconds;
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }

  reset() {
    this.currentEarnings = 0;
    this.elapsedSeconds = 0;
    this.isRunning = false;
    this.startTime = null;
    this.pausedTime = 0;
    // 時給設定は維持する
  }
}

// Define TimerManager class
class TimerManager {
  constructor(callback) {
    this.callback = callback;           // タイマー更新時のコールバック関数
    this.intervalId = null;             // setInterval のID
    this.isRunning = false;             // タイマー動作状態
    this.startTime = null;              // 開始時刻
    this.pausedTime = 0;                // 一時停止時の累積時間（ミリ秒）
    this.updateInterval = 1000;         // 更新間隔（ミリ秒）
  }

  start() {
    if (this.isRunning) {
      return; // 既に動作中の場合は何もしない
    }

    this.isRunning = true;
    this.startTime = Date.now();

    // 1秒間隔でコールバックを実行
    this.intervalId = setInterval(() => {
      if (this.callback && typeof this.callback === 'function') {
        this.callback();
      }
    }, this.updateInterval);

    console.log('TimerManager: タイマーを開始しました');
  }

  stop() {
    if (!this.isRunning) {
      return; // 動作していない場合は何もしない
    }

    this.isRunning = false;
    
    // 現在までの経過時間を累積時間に追加
    if (this.startTime) {
      this.pausedTime += Date.now() - this.startTime;
    }

    // インターバルをクリア
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('TimerManager: タイマーを停止しました');
  }

  reset() {
    // タイマーが動作中の場合は停止
    if (this.isRunning) {
      this.stop();
    }

    // 状態をリセット
    this.startTime = null;
    this.pausedTime = 0;
    this.isRunning = false;

    console.log('TimerManager: タイマーをリセットしました');
  }

  getElapsedSeconds() {
    let totalElapsed = this.pausedTime;

    // 現在動作中の場合は、開始時刻からの経過時間を追加
    if (this.isRunning && this.startTime) {
      totalElapsed += Date.now() - this.startTime;
    }

    // ミリ秒を秒に変換
    return Math.floor(totalElapsed / 1000);
  }

  getIsRunning() {
    return this.isRunning;
  }

  setUpdateInterval(interval) {
    if (typeof interval === 'number' && interval > 0) {
      this.updateInterval = interval;
      
      // 動作中の場合は再起動
      if (this.isRunning) {
        this.stop();
        this.start();
      }
    }
  }

  getUpdateInterval() {
    return this.updateInterval;
  }

  getElapsedTimeBreakdown() {
    const totalSeconds = this.getElapsedSeconds();
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }

  getFormattedElapsedTime() {
    const breakdown = this.getElapsedTimeBreakdown();
    return `${breakdown.hours.toString().padStart(2, '0')}:${breakdown.minutes.toString().padStart(2, '0')}:${breakdown.seconds.toString().padStart(2, '0')}`;
  }
}

// Define WageCounterApp class for integration
class WageCounterApp {
  constructor() {
    this.wageCounter = new WageCounter();
    this.validator = new InputValidator();
    this.currencyFormatter = new CurrencyFormatter();
    this.storageManager = new StorageManager();
    this.timerManager = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) {
      return;
    }

    // TimerManagerを初期化（コールバックで収入を自動更新）
    this.timerManager = new TimerManager(() => {
      this.updateEarnings();
    });

    // 保存された設定を読み込む
    this.loadSavedSettings();

    this.isInitialized = true;
    console.log('WageCounterApp が初期化されました');
  }
  
  loadSavedSettings() {
    const result = this.storageManager.loadSettings('hourlyWage', 0);
    
    if (result.success && result.value > 0) {
      const validationResult = this.validator.validateWage(result.value);
      if (validationResult.isValid) {
        this.setHourlyWage(validationResult.value);
      }
    }
    
    return this.loadVisualSettings();
  }
  
  loadVisualSettings() {
    const visualModeResult = this.storageManager.loadSettings('visualizationMode', 'bar');
    
    if (visualModeResult.success) {
      return visualModeResult.value;
    }
    
    return 'bar';
  }
  
  saveHourlyWage(wage) {
    if (!this.storageManager) {
      return { success: false, error: 'storage_manager_not_initialized' };
    }
    
    const validationResult = this.validator.validateWage(wage);
    if (!validationResult.isValid) {
      return { success: false, error: 'invalid_wage', message: validationResult.error };
    }
    
    this.setHourlyWage(validationResult.value);
    
    return this.storageManager.saveSettings('hourlyWage', validationResult.value);
  }
  
  saveVisualizationMode(mode) {
    if (!this.storageManager) {
      return { success: false, error: 'storage_manager_not_initialized' };
    }
    
    if (mode !== 'bar' && mode !== 'circle') {
      return { success: false, error: 'invalid_mode' };
    }
    
    return this.storageManager.saveSettings('visualizationMode', mode);
  }

  setHourlyWage(wage) {
    this.wageCounter.setHourlyWage(wage);
  }

  start() {
    if (!this.isInitialized) {
      this.initialize();
    }

    // 両方のコンポーネントを同期して開始
    this.wageCounter.start();
    this.timerManager.start();
    
    console.log('WageCounterApp: カウンターを開始しました');
  }

  stop() {
    if (!this.isInitialized) {
      return;
    }

    // 両方のコンポーネントを同期して停止
    this.timerManager.stop();
    this.wageCounter.stop();
    
    console.log('WageCounterApp: カウンターを停止しました');
  }

  reset() {
    if (!this.isInitialized) {
      return;
    }

    // 両方のコンポーネントを同期してリセット
    this.timerManager.reset();
    this.wageCounter.reset();
    
    console.log('WageCounterApp: カウンターをリセットしました');
  }

  updateEarnings() {
    if (!this.isInitialized) {
      return;
    }

    const elapsedSeconds = this.timerManager.getElapsedSeconds();
    this.wageCounter.updateElapsedTime(elapsedSeconds);
  }

  getState() {
    return {
      isRunning: this.wageCounter.getIsRunning(),
      hourlyWage: this.wageCounter.getHourlyWage(),
      currentEarnings: this.wageCounter.getCurrentEarnings(),
      elapsedSeconds: this.wageCounter.getElapsedTime(),
      formattedElapsedTime: this.wageCounter.getFormattedElapsedTime(),
      perSecondWage: this.wageCounter.getPerSecondWage()
    };
  }

  isStateSynchronized() {
    if (!this.isInitialized) {
      return true; // 初期化前は同期されているとみなす
    }

    const timerRunning = this.timerManager.getIsRunning();
    const counterRunning = this.wageCounter.getIsRunning();
    
    return timerRunning === counterRunning;
  }

  getWageCounter() {
    return this.wageCounter;
  }

  getTimerManager() {
    return this.timerManager;
  }
  
  getValidator() {
    return this.validator;
  }
  
  getCurrencyFormatter() {
    return this.currencyFormatter;
  }
  
  getStorageManager() {
    return this.storageManager;
  }
}

// Import the test function
const fs = require('fs');
const path = require('path');

// Read the test file
const testFilePath = path.join(__dirname, 'js', 'test-end-to-end.js');
const testFileContent = fs.readFileSync(testFilePath, 'utf8');

// Execute the test file content
eval(testFileContent);

// Run end-to-end tests
console.log('Running End-to-End tests...');
runEndToEndTests();