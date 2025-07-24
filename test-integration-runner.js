// Mock browser environment
global.document = {
  addEventListener: () => {}
};
global.window = {
  location: {
    search: ''
  }
};

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

    this.isInitialized = true;
    console.log('WageCounterApp が初期化されました');
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
}

// Run integration tests
console.log('Running Integration tests...');

function runIntegrationTests() {
  let testsPassed = 0;
  let totalTests = 0;

  function test(description, testFn) {
    totalTests++;
    try {
      testFn();
      console.log(`✅ ${description}`);
      testsPassed++;
    } catch (error) {
      console.error(`❌ ${description}: ${error.message}`);
    }
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
    }
  }

  function assertTrue(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function assertFalse(condition, message) {
    if (condition) {
      throw new Error(message);
    }
  }

  console.log('=== タイマーと WageCounter の統合テスト開始 ===');

  // 基本的な初期化テスト
  test('WageCounterApp の初期化', () => {
    const app = new WageCounterApp();
    app.initialize();
    
    assertTrue(app.isInitialized, '初期化フラグが設定される');
    assertTrue(app.timerManager instanceof TimerManager, 'TimerManagerが初期化される');
    assertTrue(app.wageCounter instanceof WageCounter, 'WageCounterが初期化される');
  });

  // 時給設定テスト
  test('時給設定の伝播', () => {
    const app = new WageCounterApp();
    app.initialize();
    
    app.setHourlyWage(1000);
    assertEqual(app.wageCounter.getHourlyWage(), 1000, '時給が正しく設定される');
    assertEqual(app.wageCounter.getPerSecondWage(), 1000 / 3600, '秒単位の収入が計算される');
  });

  // 開始・停止の同期テスト
  test('開始・停止の同期', () => {
    const app = new WageCounterApp();
    app.initialize();
    
    // 開始
    app.start();
    assertTrue(app.wageCounter.getIsRunning(), 'WageCounterが開始状態になる');
    assertTrue(app.timerManager.getIsRunning(), 'TimerManagerが開始状態になる');
    assertTrue(app.isStateSynchronized(), '状態が同期されている');
    
    // 停止
    app.stop();
    assertFalse(app.wageCounter.getIsRunning(), 'WageCounterが停止状態になる');
    assertFalse(app.timerManager.getIsRunning(), 'TimerManagerが停止状態になる');
    assertTrue(app.isStateSynchronized(), '状態が同期されている');
  });

  // リセットの同期テスト
  test('リセットの同期', () => {
    const app = new WageCounterApp();
    app.initialize();
    app.setHourlyWage(1000);
    
    // 開始して状態を作る
    app.start();
    
    // 手動で経過時間と収入を設定
    app.wageCounter.updateElapsedTime(10);
    
    // リセット
    app.reset();
    
    // 状態確認
    assertEqual(app.wageCounter.getElapsedTime(), 0, '経過時間がリセットされる');
    assertEqual(app.wageCounter.getCurrentEarnings(), 0, '収入がリセットされる');
    assertFalse(app.wageCounter.getIsRunning(), 'WageCounterが停止状態になる');
    assertFalse(app.timerManager.getIsRunning(), 'TimerManagerが停止状態になる');
    assertEqual(app.wageCounter.getHourlyWage(), 1000, '時給設定は維持される');
  });

  // 収入更新テスト
  test('収入自動更新', () => {
    const app = new WageCounterApp();
    app.initialize();
    app.setHourlyWage(3600); // 1円/秒
    
    // 手動で経過時間を設定
    app.timerManager.pausedTime = 5000; // 5秒
    
    // 収入更新
    app.updateEarnings();
    
    // 状態確認
    assertEqual(app.wageCounter.getElapsedTime(), 5, '経過時間が更新される');
    assertEqual(app.wageCounter.getCurrentEarnings(), 5, '収入が更新される');
  });

  // 状態取得テスト
  test('状態取得', () => {
    const app = new WageCounterApp();
    app.initialize();
    app.setHourlyWage(1000);
    
    // 手動で経過時間と収入を設定
    app.wageCounter.updateElapsedTime(60); // 1分
    
    // 状態取得
    const state = app.getState();
    
    // 状態確認
    assertEqual(state.hourlyWage, 1000, '時給が取得できる');
    assertEqual(state.elapsedSeconds, 60, '経過時間が取得できる');
    assertEqual(state.currentEarnings, 1000 / 60, '収入が取得できる');
    assertEqual(state.formattedElapsedTime, '00:01:00', 'フォーマットされた時間が取得できる');
  });

  // コールバック実行テスト - 非同期テストは省略
  test('タイマーコールバック実行', () => {
    const app = new WageCounterApp();
    app.initialize();
    app.setHourlyWage(3600); // 1円/秒
    
    // 手動で経過時間を設定して収入更新をシミュレート
    app.timerManager.pausedTime = 3000; // 3秒
    app.updateEarnings();
    
    // 状態確認
    assertEqual(app.wageCounter.getElapsedTime(), 3, '経過時間が更新される');
    assertEqual(app.wageCounter.getCurrentEarnings(), 3, '収入が更新される');
    
    // クリーンアップ
    app.reset();
  });

  console.log(`=== タイマーと WageCounter の統合テスト完了: ${testsPassed}/${totalTests} 成功 ===`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 すべてのテストが成功しました！');
    return true;
  } else {
    console.log('⚠️ 一部のテストが失敗しました');
    return false;
  }
}

// Run tests
runIntegrationTests();