/**
 * TimerManager と WageCounter の統合テスト
 * WageCounterApp クラスのテスト
 */

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

    console.log('=== TimerManager と WageCounter の統合テスト開始 ===');

    // WageCounterApp の基本機能テスト
    test('WageCounterApp - 初期化', () => {
        const app = new WageCounterApp();
        
        // 初期化前の状態
        assertFalse(app.isInitialized, '初期化前はisInitializedがfalse');
        
        // 初期化実行
        app.initialize();
        assertTrue(app.isInitialized, '初期化後はisInitializedがtrue');
        
        // 重複初期化のテスト
        app.initialize(); // 2回目の初期化
        assertTrue(app.isInitialized, '重複初期化でも問題なし');
        
        // インスタンスの取得テスト
        assertTrue(app.getWageCounter() instanceof WageCounter, 'WageCounterインスタンスが取得できる');
        assertTrue(app.getTimerManager() instanceof TimerManager, 'TimerManagerインスタンスが取得できる');
        assertTrue(app.getValidator() instanceof InputValidator, 'InputValidatorインスタンスが取得できる');
    });

    test('WageCounterApp - 時給設定', () => {
        const app = new WageCounterApp();
        
        app.setHourlyWage(2000);
        const state = app.getState();
        
        assertEqual(state.hourlyWage, 2000, '時給が正しく設定される');
        assertEqual(state.perSecondWage, 2000/3600, '秒単位収入が正しく計算される');
    });

    test('WageCounterApp - 開始・停止・リセット', () => {
        const app = new WageCounterApp();
        app.setHourlyWage(3600); // 1円/秒
        
        // 初期状態
        let state = app.getState();
        assertFalse(state.isRunning, '初期状態では停止している');
        assertEqual(state.currentEarnings, 0, '初期収入は0');
        assertEqual(state.elapsedSeconds, 0, '初期経過時間は0');
        
        // 開始
        app.start();
        state = app.getState();
        assertTrue(state.isRunning, '開始後は動作状態になる');
        
        // 停止
        app.stop();
        state = app.getState();
        assertFalse(state.isRunning, '停止後は停止状態になる');
        
        // リセット
        app.reset();
        state = app.getState();
        assertFalse(state.isRunning, 'リセット後は停止状態');
        assertEqual(state.currentEarnings, 0, 'リセット後は収入が0');
        assertEqual(state.elapsedSeconds, 0, 'リセット後は経過時間が0');
        assertEqual(state.hourlyWage, 3600, 'リセット後も時給は維持される');
    });

    test('WageCounterApp - 状態同期確認', () => {
        const app = new WageCounterApp();
        
        // 初期化前は同期されているとみなす
        assertTrue(app.isStateSynchronized(), '初期化前は同期されている');
        
        app.initialize();
        assertTrue(app.isStateSynchronized(), '初期化後も同期されている');
        
        app.start();
        assertTrue(app.isStateSynchronized(), '開始後も同期されている');
        
        app.stop();
        assertTrue(app.isStateSynchronized(), '停止後も同期されている');
        
        app.reset();
        assertTrue(app.isStateSynchronized(), 'リセット後も同期されている');
    });

    test('WageCounterApp - 収入自動計算', () => {
        const app = new WageCounterApp();
        app.setHourlyWage(3600); // 1円/秒
        
        // 手動で経過時間を設定して収入計算をテスト
        app.initialize();
        
        // TimerManagerの経過時間を直接設定（テスト用）
        const timer = app.getTimerManager();
        timer.pausedTime = 10000; // 10秒
        
        // 収入更新を実行
        app.updateEarnings();
        
        const state = app.getState();
        assertEqual(state.elapsedSeconds, 10, '経過時間が正しく更新される');
        assertEqual(state.currentEarnings, 10, '収入が自動計算される');
    });

    // 統合シナリオテスト
    test('統合シナリオ - 完全な操作フロー', () => {
        const app = new WageCounterApp();
        
        // 1. 時給設定
        app.setHourlyWage(1800); // 0.5円/秒
        let state = app.getState();
        assertEqual(state.hourlyWage, 1800, '時給設定完了');
        
        // 2. 開始
        app.start();
        state = app.getState();
        assertTrue(state.isRunning, 'カウンター開始');
        assertTrue(app.isStateSynchronized(), '状態が同期されている');
        
        // 3. 経過時間シミュレート（20秒）
        const timer = app.getTimerManager();
        timer.pausedTime = 20000; // 20秒
        app.updateEarnings();
        
        state = app.getState();
        assertEqual(state.elapsedSeconds, 20, '20秒経過');
        assertEqual(state.currentEarnings, 10, '20秒で10円の収入');
        assertEqual(state.formattedElapsedTime, '00:00:20', 'フォーマットされた時間表示');
        
        // 4. 一時停止
        app.stop();
        state = app.getState();
        assertFalse(state.isRunning, 'カウンター停止');
        assertEqual(state.currentEarnings, 10, '停止時も収入は維持');
        
        // 5. 再開
        app.start();
        state = app.getState();
        assertTrue(state.isRunning, 'カウンター再開');
        
        // 6. さらに経過時間シミュレート（合計40秒）
        timer.pausedTime = 40000; // 40秒
        app.updateEarnings();
        
        state = app.getState();
        assertEqual(state.elapsedSeconds, 40, '40秒経過');
        assertEqual(state.currentEarnings, 20, '40秒で20円の収入');
        
        // 7. リセット
        app.reset();
        state = app.getState();
        assertFalse(state.isRunning, 'リセット後は停止');
        assertEqual(state.currentEarnings, 0, 'リセット後は収入0');
        assertEqual(state.elapsedSeconds, 0, 'リセット後は経過時間0');
        assertEqual(state.hourlyWage, 1800, '時給は維持される');
    });

    test('統合シナリオ - エラー処理', () => {
        const app = new WageCounterApp();
        
        // 初期化前の操作
        app.stop(); // 初期化前の停止は何もしない
        app.reset(); // 初期化前のリセットは何もしない
        app.updateEarnings(); // 初期化前の更新は何もしない
        
        // 状態確認（エラーが発生しないことを確認）
        const state = app.getState();
        assertEqual(state.isRunning, false, '初期化前の操作でエラーが発生しない');
    });

    test('統合シナリオ - 長時間動作', () => {
        const app = new WageCounterApp();
        app.setHourlyWage(2500); // 一般的な時給
        
        app.initialize();
        app.start();
        
        // 8時間（28800秒）の動作をシミュレート
        const timer = app.getTimerManager();
        timer.pausedTime = 28800000; // 8時間（ミリ秒）
        app.updateEarnings();
        
        const state = app.getState();
        assertEqual(state.elapsedSeconds, 28800, '8時間の経過時間');
        assertEqual(state.currentEarnings, 20000, '8時間で20000円の収入');
        assertEqual(state.formattedElapsedTime, '08:00:00', '8時間のフォーマット表示');
        
        app.reset();
    });

    test('統合シナリオ - 精度テスト', () => {
        const app = new WageCounterApp();
        app.setHourlyWage(1000); // 約0.2778円/秒
        
        app.initialize();
        app.start();
        
        const timer = app.getTimerManager();
        
        // 1秒ずつ増加させて精度をテスト
        for (let i = 1; i <= 10; i++) {
            timer.pausedTime = i * 1000; // i秒
            app.updateEarnings();
            
            const state = app.getState();
            assertEqual(state.elapsedSeconds, i, `${i}秒の経過時間`);
            
            const expectedEarnings = (1000 / 3600) * i;
            assertTrue(Math.abs(state.currentEarnings - expectedEarnings) < 0.01, 
                      `${i}秒での収入計算精度`);
        }
        
        app.reset();
    });

    console.log(`=== 統合テスト完了: ${testsPassed}/${totalTests} 成功 ===`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 すべてのテストが成功しました！');
        return true;
    } else {
        console.log('⚠️ 一部のテストが失敗しました');
        return false;
    }
}

// テストを実行（ブラウザで利用可能な場合）
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // テスト実行用のボタンを追加（開発時のみ）
        if (window.location.search.includes('test=true')) {
            const testButton = document.createElement('button');
            testButton.textContent = '統合テスト実行';
            testButton.onclick = runIntegrationTests;
            testButton.style.position = 'fixed';
            testButton.style.top = '170px';
            testButton.style.right = '10px';
            testButton.style.zIndex = '9999';
            document.body.appendChild(testButton);
        }
    });
}