/**
 * Node.js用テストランナー
 * DOM依存部分を除いてテストを実行
 */

// TimerManagerクラスの定義（DOM依存部分を除く）
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

// WageCounterクラスの定義（DOM依存部分を除く）
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

    reset() {
        this.currentEarnings = 0;
        this.elapsedSeconds = 0;
        this.isRunning = false;
        this.startTime = null;
        this.pausedTime = 0;
        // 時給設定は維持する
    }

    /**
     * 時給から秒単位収入を計算する
     * @param {number} hourlyWage - 時給（円）
     * @returns {number} 秒単位の収入（円）
     */
    calculatePerSecondWage(hourlyWage) {
        if (typeof hourlyWage !== 'number' || isNaN(hourlyWage) || hourlyWage < 0) {
            return 0;
        }
        return hourlyWage / 3600; // 1時間 = 3600秒
    }

    /**
     * 指定された秒数での収入を計算する
     * @param {number} seconds - 秒数
     * @returns {number} 指定秒数での収入（円）
     */
    calculateEarningsForSeconds(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
            return 0;
        }
        return this.perSecondWage * seconds;
    }

    /**
     * 現在の経過時間に基づいて累積収入を更新する
     */
    updateCurrentEarnings() {
        this.currentEarnings = this.calculateEarningsForSeconds(this.elapsedSeconds);
    }

    /**
     * 経過時間を更新する（TimerManagerから呼び出される）
     * @param {number} elapsedSeconds - 経過秒数
     */
    updateElapsedTime(elapsedSeconds) {
        this.elapsedSeconds = elapsedSeconds;
        this.updateCurrentEarnings();
    }

    /**
     * カウンターを開始する
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            if (!this.startTime) {
                this.startTime = new Date();
            }
        }
    }

    /**
     * カウンターを停止する
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * 現在のセッション継続時間を取得する（表示用）
     * @returns {string} フォーマットされた時間文字列 (HH:MM:SS)
     */
    getFormattedElapsedTime() {
        const totalSeconds = this.elapsedSeconds;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * 経過時間を時間、分、秒に分解して取得する
     * @returns {Object} {hours: number, minutes: number, seconds: number}
     */
    getElapsedTimeBreakdown() {
        const totalSeconds = this.elapsedSeconds;
        return {
            hours: Math.floor(totalSeconds / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60
        };
    }
}

// テスト関数
function runWageCounterTests() {
    const wageCounter = new WageCounter();
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
        if (Math.abs(actual - expected) > 0.0001) { // 浮動小数点の比較には許容誤差を設定
            throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
        }
    }

    console.log('=== WageCounter テスト開始 ===');

    // 秒単位収入計算のテスト
    test('時給3600円の場合、秒単位収入は1円', () => {
        wageCounter.setHourlyWage(3600);
        assertEqual(wageCounter.getPerSecondWage(), 1, '3600円/時 = 1円/秒');
    });

    test('時給1800円の場合、秒単位収入は0.5円', () => {
        wageCounter.setHourlyWage(1800);
        assertEqual(wageCounter.getPerSecondWage(), 0.5, '1800円/時 = 0.5円/秒');
    });

    test('時給1000円の場合、秒単位収入は約0.2778円', () => {
        wageCounter.setHourlyWage(1000);
        assertEqual(wageCounter.getPerSecondWage(), 1000/3600, '1000円/時 ≈ 0.2778円/秒');
    });

    test('時給0円の場合、秒単位収入は0円', () => {
        wageCounter.setHourlyWage(0);
        assertEqual(wageCounter.getPerSecondWage(), 0, '0円/時 = 0円/秒');
    });

    test('時給1234.56円の場合、秒単位収入は約0.3429円', () => {
        wageCounter.setHourlyWage(1234.56);
        assertEqual(wageCounter.getPerSecondWage(), 1234.56/3600, '1234.56円/時 ≈ 0.3429円/秒');
    });

    // 精度テスト - 小数点以下の計算精度
    test('計算精度テスト - 小数点以下の精度', () => {
        wageCounter.setHourlyWage(1);
        const perSecondWage = wageCounter.getPerSecondWage();
        assertEqual(perSecondWage, 1/3600, '1円/時 ≈ 0.0002777円/秒');
        
        // 累積計算の精度テスト
        let accumulated = 0;
        for (let i = 0; i < 3600; i++) {
            accumulated += perSecondWage;
        }
        assertEqual(accumulated, 1, '3600秒分の累積は1円になる');
    });

    // calculatePerSecondWage メソッドのテスト
    test('calculatePerSecondWage - 正常な値', () => {
        assertEqual(wageCounter.calculatePerSecondWage(3600), 1, '3600円/時 = 1円/秒');
        assertEqual(wageCounter.calculatePerSecondWage(1800), 0.5, '1800円/時 = 0.5円/秒');
        assertEqual(wageCounter.calculatePerSecondWage(0), 0, '0円/時 = 0円/秒');
    });

    test('calculatePerSecondWage - 異常な値の処理', () => {
        assertEqual(wageCounter.calculatePerSecondWage(-100), 0, '負の値は0を返す');
        assertEqual(wageCounter.calculatePerSecondWage(NaN), 0, 'NaNは0を返す');
        assertEqual(wageCounter.calculatePerSecondWage('invalid'), 0, '文字列は0を返す');
        assertEqual(wageCounter.calculatePerSecondWage(null), 0, 'nullは0を返す');
        assertEqual(wageCounter.calculatePerSecondWage(undefined), 0, 'undefinedは0を返す');
    });

    // calculateEarningsForSeconds メソッドのテスト
    test('calculateEarningsForSeconds - 正常な計算', () => {
        wageCounter.setHourlyWage(3600); // 1円/秒
        assertEqual(wageCounter.calculateEarningsForSeconds(10), 10, '10秒で10円');
        assertEqual(wageCounter.calculateEarningsForSeconds(60), 60, '60秒で60円');
        assertEqual(wageCounter.calculateEarningsForSeconds(3600), 3600, '3600秒で3600円');
    });

    test('calculateEarningsForSeconds - 小数点計算', () => {
        wageCounter.setHourlyWage(1000); // 約0.2778円/秒
        const expected = (1000 / 3600) * 30; // 30秒分
        assertEqual(wageCounter.calculateEarningsForSeconds(30), expected, '30秒分の収入計算');
    });

    test('calculateEarningsForSeconds - 異常な値の処理', () => {
        wageCounter.setHourlyWage(1000);
        assertEqual(wageCounter.calculateEarningsForSeconds(-10), 0, '負の秒数は0を返す');
        assertEqual(wageCounter.calculateEarningsForSeconds(NaN), 0, 'NaNは0を返す');
        assertEqual(wageCounter.calculateEarningsForSeconds('invalid'), 0, '文字列は0を返す');
    });

    // updateCurrentEarnings メソッドのテスト
    test('updateCurrentEarnings - 累積収入の更新', () => {
        wageCounter.setHourlyWage(3600); // 1円/秒
        wageCounter.setElapsedTime(10);
        wageCounter.updateCurrentEarnings();
        assertEqual(wageCounter.getCurrentEarnings(), 10, '10秒経過で10円の収入');
        
        wageCounter.setElapsedTime(60);
        wageCounter.updateCurrentEarnings();
        assertEqual(wageCounter.getCurrentEarnings(), 60, '60秒経過で60円の収入');
    });

    // 高精度計算テスト
    test('高精度計算テスト - 長時間動作', () => {
        wageCounter.setHourlyWage(2500); // 一般的な時給
        const perSecondWage = wageCounter.getPerSecondWage();
        
        // 8時間（28800秒）の計算
        const eightHours = 8 * 3600;
        const expectedEarnings = 2500 * 8; // 20000円
        
        assertEqual(wageCounter.calculateEarningsForSeconds(eightHours), expectedEarnings, '8時間で20000円');
    });

    // 境界値テスト
    test('境界値テスト', () => {
        // 最小値
        wageCounter.setHourlyWage(0.01);
        assertEqual(wageCounter.getPerSecondWage(), 0.01/3600, '最小時給の秒単位計算');
        
        // 大きな値
        wageCounter.setHourlyWage(1000000);
        assertEqual(wageCounter.getPerSecondWage(), 1000000/3600, '高額時給の秒単位計算');
    });

    console.log(`=== テスト完了: ${testsPassed}/${totalTests} 成功 ===`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 すべてのテストが成功しました！');
        return true;
    } else {
        console.log('⚠️ 一部のテストが失敗しました');
        return false;
    }
}

// TimerManager テスト関数
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

// 経過時間追跡機能のテスト関数
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

    console.log(`=== 経過時間追跡機能テスト完了: ${testsPassed}/${totalTests} 成功 ===`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 すべてのテストが成功しました！');
        return true;
    } else {
        console.log('⚠️ 一部のテストが失敗しました');
        return false;
    }
}

// テストを実行
console.log('=== 全テスト実行開始 ===\n');
const wageCounterResult = runWageCounterTests();
console.log('');
const timerManagerResult = runTimerManagerTests();
console.log('');
const elapsedTimeResult = runElapsedTimeTests();

console.log('\n=== 全テスト結果 ===');
console.log(`WageCounter: ${wageCounterResult ? '成功' : '失敗'}`);
console.log(`TimerManager: ${timerManagerResult ? '成功' : '失敗'}`);
console.log(`ElapsedTime: ${elapsedTimeResult ? '成功' : '失敗'}`);

if (wageCounterResult && timerManagerResult && elapsedTimeResult) {
    console.log('🎉 すべてのテストが成功しました！');
} else {
    console.log('⚠️ 一部のテストが失敗しました');
    process.exit(1);
}