// Mock browser environment
global.document = {
  addEventListener: () => {}
};
global.window = {
  location: {
    search: ''
  }
};

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

  /**
   * タイマーを開始する
   */
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

  /**
   * タイマーを停止する
   */
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

  /**
   * タイマーをリセットする
   */
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

  /**
   * 経過秒数を取得する
   * @returns {number} 経過秒数
   */
  getElapsedSeconds() {
    let totalElapsed = this.pausedTime;

    // 現在動作中の場合は、開始時刻からの経過時間を追加
    if (this.isRunning && this.startTime) {
      totalElapsed += Date.now() - this.startTime;
    }

    // ミリ秒を秒に変換
    return Math.floor(totalElapsed / 1000);
  }

  /**
   * タイマーの動作状態を取得する
   * @returns {boolean} 動作中かどうか
   */
  getIsRunning() {
    return this.isRunning;
  }

  /**
   * 更新間隔を設定する
   * @param {number} interval - 更新間隔（ミリ秒）
   */
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

  /**
   * 更新間隔を取得する
   * @returns {number} 更新間隔（ミリ秒）
   */
  getUpdateInterval() {
    return this.updateInterval;
  }

  /**
   * 経過時間を時間、分、秒に分解して取得する
   * @returns {Object} {hours: number, minutes: number, seconds: number}
   */
  getElapsedTimeBreakdown() {
    const totalSeconds = this.getElapsedSeconds();
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }

  /**
   * フォーマットされた経過時間を取得する
   * @returns {string} フォーマットされた時間文字列 (HH:MM:SS)
   */
  getFormattedElapsedTime() {
    const breakdown = this.getElapsedTimeBreakdown();
    return `${breakdown.hours.toString().padStart(2, '0')}:${breakdown.minutes.toString().padStart(2, '0')}:${breakdown.seconds.toString().padStart(2, '0')}`;
  }
}

// Import test functions
const testCode = require('./js/test-timer-manager.js');

// Run tests
console.log('Running TimerManager tests...');
runTimerManagerTests();

function runTimerManagerTests() {
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

  console.log('=== TimerManager テスト開始 ===');

  // 基本的な初期化テスト
  test('TimerManager の初期化', () => {
    const callback = () => {};
    const timer = new TimerManager(callback);
    
    assertEqual(timer.getIsRunning(), false, '初期状態では動作していない');
    assertEqual(timer.getElapsedSeconds(), 0, '初期状態では経過時間は0');
    assertEqual(timer.getUpdateInterval(), 1000, 'デフォルトの更新間隔は1000ms');
  });

  // コールバック関数のテスト
  test('コールバック関数の設定', () => {
    let callbackCalled = false;
    const callback = () => { callbackCalled = true; };
    const timer = new TimerManager(callback);
    
    // コールバックが設定されていることを確認
    assertTrue(typeof timer.callback === 'function', 'コールバック関数が設定されている');
  });

  // 開始機能のテスト
  test('タイマー開始機能', () => {
    const timer = new TimerManager(() => {});
    
    timer.start();
    assertTrue(timer.getIsRunning(), 'start()後は動作状態になる');
    
    // 重複開始のテスト
    timer.start(); // 2回目の開始
    assertTrue(timer.getIsRunning(), '重複開始でも動作状態を維持');
    
    timer.reset(); // クリーンアップ
  });

  // 停止機能のテスト
  test('タイマー停止機能', () => {
    const timer = new TimerManager(() => {});
    
    // 開始していない状態での停止
    timer.stop();
    assertFalse(timer.getIsRunning(), '開始していない状態での停止は何もしない');
    
    // 正常な停止
    timer.start();
    timer.stop();
    assertFalse(timer.getIsRunning(), 'stop()後は停止状態になる');
  });

  // リセット機能のテスト
  test('タイマーリセット機能', () => {
    const timer = new TimerManager(() => {});
    
    timer.start();
    timer.reset();
    
    assertFalse(timer.getIsRunning(), 'reset()後は停止状態になる');
    assertEqual(timer.getElapsedSeconds(), 0, 'reset()後は経過時間が0になる');
  });

  // 更新間隔設定のテスト
  test('更新間隔の設定', () => {
    const timer = new TimerManager(() => {});
    
    timer.setUpdateInterval(500);
    assertEqual(timer.getUpdateInterval(), 500, '更新間隔が正しく設定される');
    
    timer.setUpdateInterval(-100);
    assertEqual(timer.getUpdateInterval(), 500, '負の値は設定されない');
    
    timer.setUpdateInterval('invalid');
    assertEqual(timer.getUpdateInterval(), 500, '無効な値は設定されない');
  });

  // エラーハンドリングのテスト
  test('エラーハンドリング', () => {
    // コールバックなしでの初期化
    const timer1 = new TimerManager(null);
    timer1.start();
    assertTrue(timer1.getIsRunning(), 'コールバックがnullでも動作する');
    timer1.reset();
    
    // undefinedコールバック
    const timer2 = new TimerManager(undefined);
    timer2.start();
    assertTrue(timer2.getIsRunning(), 'コールバックがundefinedでも動作する');
    timer2.reset();
    
    // 非関数コールバック
    const timer3 = new TimerManager('not a function');
    timer3.start();
    assertTrue(timer3.getIsRunning(), '非関数コールバックでも動作する');
    timer3.reset();
  });

  console.log(`=== TimerManager テスト完了: ${testsPassed}/${totalTests} 成功 ===`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 すべてのテストが成功しました！');
    return true;
  } else {
    console.log('⚠️ 一部のテストが失敗しました');
    return false;
  }
}