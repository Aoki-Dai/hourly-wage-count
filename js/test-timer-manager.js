/**
 * TimerManager クラスのテスト
 * タイマー機能のテスト
 */

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

    // 経過時間計算のテスト（非同期）
    test('経過時間計算（短時間）', (done) => {
        const timer = new TimerManager(() => {});
        
        timer.start();
        
        // 100ms後に確認
        setTimeout(() => {
            const elapsed = timer.getElapsedSeconds();
            assertTrue(elapsed >= 0, '経過時間は0以上');
            timer.reset();
            
            if (done) done();
        }, 100);
    });

    // 一時停止・再開のテスト
    test('一時停止・再開機能', (done) => {
        const timer = new TimerManager(() => {});
        
        timer.start();
        
        setTimeout(() => {
            timer.stop(); // 一時停止
            const pausedElapsed = timer.getElapsedSeconds();
            
            setTimeout(() => {
                timer.start(); // 再開
                
                setTimeout(() => {
                    const resumedElapsed = timer.getElapsedSeconds();
                    assertTrue(resumedElapsed >= pausedElapsed, '再開後の経過時間は一時停止時以上');
                    timer.reset();
                    
                    if (done) done();
                }, 50);
            }, 50);
        }, 50);
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

    // コールバック実行のテスト（非同期）
    test('コールバック実行テスト', (done) => {
        let callbackCount = 0;
        const callback = () => { callbackCount++; };
        const timer = new TimerManager(callback);
        
        timer.setUpdateInterval(100); // 100msに設定
        timer.start();
        
        // 250ms後に確認（2-3回実行されるはず）
        setTimeout(() => {
            timer.stop();
            assertTrue(callbackCount >= 2, `コールバックが複数回実行される (実行回数: ${callbackCount})`);
            timer.reset();
            
            if (done) done();
        }, 250);
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

// 非同期テストのヘルパー関数
function runAsyncTests() {
    return new Promise((resolve) => {
        const asyncTests = [];
        let completedTests = 0;
        
        // 非同期テストを順次実行
        function runNextTest() {
            if (asyncTests.length === 0) {
                resolve();
                return;
            }
            
            const test = asyncTests.shift();
            test(() => {
                completedTests++;
                runNextTest();
            });
        }
        
        runNextTest();
    });
}

// テストを実行（ブラウザで利用可能な場合）
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // テスト実行用のボタンを追加（開発時のみ）
        if (window.location.search.includes('test=true')) {
            const testButton = document.createElement('button');
            testButton.textContent = 'TimerManagerテスト実行';
            testButton.onclick = runTimerManagerTests;
            testButton.style.position = 'fixed';
            testButton.style.top = '90px';
            testButton.style.right = '10px';
            testButton.style.zIndex = '9999';
            document.body.appendChild(testButton);
        }
    });
}