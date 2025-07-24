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

// Run tests
console.log('Running Elapsed Time tests...');

function runElapsedTimeTests() {
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

  console.log('=== 経過時間追跡機能テスト開始 ===');

  // WageCounter の経過時間機能テスト
  test('WageCounter - 経過時間の更新', () => {
    const wageCounter = new WageCounter();
    wageCounter.setHourlyWage(3600); // 1円/秒
    
    wageCounter.updateElapsedTime(10);
    assertEqual(wageCounter.getElapsedTime(), 10, '経過時間が正しく更新される');
    assertEqual(wageCounter.getCurrentEarnings(), 10, '経過時間に基づいて収入が更新される');
    
    wageCounter.updateElapsedTime(60);
    assertEqual(wageCounter.getElapsedTime(), 60, '経過時間が再度更新される');
    assertEqual(wageCounter.getCurrentEarnings(), 60, '収入も連動して更新される');
  });

  test('WageCounter - フォーマットされた経過時間', () => {
    const wageCounter = new WageCounter();
    
    wageCounter.setElapsedTime(0);
    assertEqual(wageCounter.getFormattedElapsedTime(), '00:00:00', '0秒は00:00:00');
    
    wageCounter.setElapsedTime(59);
    assertEqual(wageCounter.getFormattedElapsedTime(), '00:00:59', '59秒は00:00:59');
    
    wageCounter.setElapsedTime(60);
    assertEqual(wageCounter.getFormattedElapsedTime(), '00:01:00', '60秒は00:01:00');
    
    wageCounter.setElapsedTime(3661);
    assertEqual(wageCounter.getFormattedElapsedTime(), '01:01:01', '3661秒は01:01:01');
    
    wageCounter.setElapsedTime(7323);
    assertEqual(wageCounter.getFormattedElapsedTime(), '02:02:03', '7323秒は02:02:03');
  });

  test('WageCounter - 経過時間の分解', () => {
    const wageCounter = new WageCounter();
    
    wageCounter.setElapsedTime(3661); // 1時間1分1秒
    const breakdown = wageCounter.getElapsedTimeBreakdown();
    
    assertEqual(breakdown.hours, 1, '時間が正しく分解される');
    assertEqual(breakdown.minutes, 1, '分が正しく分解される');
    assertEqual(breakdown.seconds, 1, '秒が正しく分解される');
    
    wageCounter.setElapsedTime(7323); // 2時間2分3秒
    const breakdown2 = wageCounter.getElapsedTimeBreakdown();
    
    assertEqual(breakdown2.hours, 2, '時間が正しく分解される（2時間）');
    assertEqual(breakdown2.minutes, 2, '分が正しく分解される（2分）');
    assertEqual(breakdown2.seconds, 3, '秒が正しく分解される（3秒）');
  });

  test('WageCounter - 開始・停止状態管理', () => {
    const wageCounter = new WageCounter();
    
    assertFalse(wageCounter.getIsRunning(), '初期状態では停止している');
    
    wageCounter.start();
    assertTrue(wageCounter.getIsRunning(), 'start()後は動作状態になる');
    assertTrue(wageCounter.getStartTime() instanceof Date, '開始時刻が記録される');
    
    wageCounter.stop();
    assertFalse(wageCounter.getIsRunning(), 'stop()後は停止状態になる');
    
    wageCounter.reset();
    assertFalse(wageCounter.getIsRunning(), 'reset()後は停止状態');
    assertEqual(wageCounter.getElapsedTime(), 0, 'reset()後は経過時間が0');
  });

  // TimerManager の経過時間機能テスト
  test('TimerManager - フォーマットされた経過時間', () => {
    const timer = new TimerManager(() => {});
    
    // 内部状態を直接設定してテスト
    timer.pausedTime = 0;
    assertEqual(timer.getFormattedElapsedTime(), '00:00:00', '0秒は00:00:00');
    
    timer.pausedTime = 59000; // 59秒
    assertEqual(timer.getFormattedElapsedTime(), '00:00:59', '59秒は00:00:59');
    
    timer.pausedTime = 60000; // 60秒
    assertEqual(timer.getFormattedElapsedTime(), '00:01:00', '60秒は00:01:00');
    
    timer.pausedTime = 3661000; // 1時間1分1秒
    assertEqual(timer.getFormattedElapsedTime(), '01:01:01', '3661秒は01:01:01');
  });

  test('TimerManager - 経過時間の分解', () => {
    const timer = new TimerManager(() => {});
    
    timer.pausedTime = 3661000; // 1時間1分1秒
    const breakdown = timer.getElapsedTimeBreakdown();
    
    assertEqual(breakdown.hours, 1, '時間が正しく分解される');
    assertEqual(breakdown.minutes, 1, '分が正しく分解される');
    assertEqual(breakdown.seconds, 1, '秒が正しく分解される');
  });

  // 統合テスト - TimerManager と WageCounter の連携
  test('統合テスト - TimerManager と WageCounter の基本連携', () => {
    const wageCounter = new WageCounter();
    wageCounter.setHourlyWage(3600); // 1円/秒
    
    let updateCount = 0;
    const timer = new TimerManager(() => {
      updateCount++;
      const elapsedSeconds = timer.getElapsedSeconds();
      wageCounter.updateElapsedTime(elapsedSeconds);
    });
    
    // 初期状態の確認
    assertEqual(wageCounter.getElapsedTime(), 0, '初期経過時間は0');
    assertEqual(wageCounter.getCurrentEarnings(), 0, '初期収入は0');
    
    // タイマー開始
    timer.start();
    wageCounter.start();
    
    assertTrue(timer.getIsRunning(), 'TimerManagerが動作中');
    assertTrue(wageCounter.getIsRunning(), 'WageCounterが動作中');
    
    // クリーンアップ
    timer.reset();
    wageCounter.reset();
  });

  test('統合テスト - 一時停止・再開の時間管理', () => {
    const wageCounter = new WageCounter();
    wageCounter.setHourlyWage(1800); // 0.5円/秒
    
    const timer = new TimerManager(() => {
      const elapsedSeconds = timer.getElapsedSeconds();
      wageCounter.updateElapsedTime(elapsedSeconds);
    });
    
    // 開始
    timer.start();
    wageCounter.start();
    
    // 一時停止
    timer.stop();
    wageCounter.stop();
    
    assertFalse(timer.getIsRunning(), 'TimerManagerが停止状態');
    assertFalse(wageCounter.getIsRunning(), 'WageCounterが停止状態');
    
    // 再開
    timer.start();
    wageCounter.start();
    
    assertTrue(timer.getIsRunning(), 'TimerManagerが再開');
    assertTrue(wageCounter.getIsRunning(), 'WageCounterが再開');
    
    // クリーンアップ
    timer.reset();
    wageCounter.reset();
  });

  test('統合テスト - リセット時の状態管理', () => {
    const wageCounter = new WageCounter();
    wageCounter.setHourlyWage(2000);
    
    const timer = new TimerManager(() => {
      const elapsedSeconds = timer.getElapsedSeconds();
      wageCounter.updateElapsedTime(elapsedSeconds);
    });
    
    // 開始して状態を作る
    timer.start();
    wageCounter.start();
    wageCounter.updateElapsedTime(10); // 10秒経過をシミュレート
    
    // リセット前の状態確認
    assertEqual(wageCounter.getElapsedTime(), 10, 'リセット前は10秒');
    assertTrue(wageCounter.getCurrentEarnings() > 0, 'リセット前は収入がある');
    
    // リセット実行
    timer.reset();
    wageCounter.reset();
    
    // リセット後の状態確認
    assertEqual(timer.getElapsedSeconds(), 0, 'TimerManagerの経過時間がリセット');
    assertEqual(wageCounter.getElapsedTime(), 0, 'WageCounterの経過時間がリセット');
    assertEqual(wageCounter.getCurrentEarnings(), 0, '収入がリセット');
    assertFalse(timer.getIsRunning(), 'TimerManagerが停止状態');
    assertFalse(wageCounter.getIsRunning(), 'WageCounterが停止状態');
    
    // 時給設定は維持されることを確認
    assertEqual(wageCounter.getHourlyWage(), 2000, '時給設定は維持される');
  });

  // 境界値テスト
  test('境界値テスト - 長時間動作', () => {
    const wageCounter = new WageCounter();
    wageCounter.setHourlyWage(1000);
    
    // 24時間（86400秒）をシミュレート
    const twentyFourHours = 24 * 3600;
    wageCounter.updateElapsedTime(twentyFourHours);
    
    assertEqual(wageCounter.getElapsedTime(), twentyFourHours, '24時間の経過時間');
    assertEqual(wageCounter.getCurrentEarnings(), 24000, '24時間で24000円');
    assertEqual(wageCounter.getFormattedElapsedTime(), '24:00:00', '24時間のフォーマット');
    
    const breakdown = wageCounter.getElapsedTimeBreakdown();
    assertEqual(breakdown.hours, 24, '24時間');
    assertEqual(breakdown.minutes, 0, '0分');
    assertEqual(breakdown.seconds, 0, '0秒');
  });

  test('精度テスト - 秒単位の正確性', () => {
    const wageCounter = new WageCounter();
    wageCounter.setHourlyWage(3600); // 1円/秒
    
    // 1秒ずつ増加させて精度をテスト
    for (let i = 1; i <= 10; i++) {
      wageCounter.updateElapsedTime(i);
      assertEqual(wageCounter.getElapsedTime(), i, `${i}秒の経過時間`);
      assertEqual(wageCounter.getCurrentEarnings(), i, `${i}秒で${i}円の収入`);
    }
  });

  console.log(`=== 経過時間追跡機能テスト完了: ${testsPassed}/${totalTests} 成功 ===`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 すべてのテストが成功しました！');
    return true;
  } else {
    console.log('⚠️ 一部のテストが失敗しました');
    return false;
  }
}

runElapsedTimeTests();