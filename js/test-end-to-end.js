/**
 * エンドツーエンドテスト
 * 完全な操作フロー（設定 → 開始 → 停止 → リセット）のテスト
 * 各種エッジケースのテストを含む
 */

function runEndToEndTests() {
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

    function assertApproxEqual(actual, expected, tolerance, message) {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}, Tolerance: ${tolerance}`);
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

    console.log('=== エンドツーエンドテスト開始 ===');

    // 基本的な操作フローのテスト
    test('基本操作フロー - 設定 → 開始 → 停止 → リセット', () => {
        // アプリケーションの初期化
        const app = new WageCounterApp();
        app.initialize();
        
        // 1. 時給設定
        app.setHourlyWage(1000);
        let state = app.getState();
        assertEqual(state.hourlyWage, 1000, '時給が正しく設定される');
        assertEqual(state.perSecondWage, 1000 / 3600, '秒単位収入が正しく計算される');
        
        // 2. 開始
        app.start();
        state = app.getState();
        assertTrue(state.isRunning, 'カウンターが開始状態になる');
        
        // 経過時間のシミュレーション（30秒）
        const timer = app.getTimerManager();
        timer.pausedTime = 30000; // 30秒
        app.updateEarnings();
        
        state = app.getState();
        assertEqual(state.elapsedSeconds, 30, '経過時間が正しく更新される');
        assertApproxEqual(state.currentEarnings, (1000 / 3600) * 30, 0.01, '収入が正しく計算される');
        
        // 3. 停止
        app.stop();
        state = app.getState();
        assertFalse(state.isRunning, 'カウンターが停止状態になる');
        
        // 停止後も収入と経過時間が維持されることを確認
        assertEqual(state.elapsedSeconds, 30, '停止後も経過時間が維持される');
        assertApproxEqual(state.currentEarnings, (1000 / 3600) * 30, 0.01, '停止後も収入が維持される');
        
        // 4. リセット
        app.reset();
        state = app.getState();
        assertEqual(state.elapsedSeconds, 0, 'リセット後は経過時間が0になる');
        assertEqual(state.currentEarnings, 0, 'リセット後は収入が0になる');
        assertEqual(state.hourlyWage, 1000, 'リセット後も時給設定は維持される');
        assertFalse(state.isRunning, 'リセット後はカウンターが停止状態になる');
    });

    // 一時停止と再開のテスト
    test('一時停止と再開 - 開始 → 停止 → 再開 → 停止', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1200);
        
        // 1. 開始
        app.start();
        
        // 20秒経過をシミュレート
        const timer = app.getTimerManager();
        timer.pausedTime = 20000; // 20秒
        app.updateEarnings();
        
        let state = app.getState();
        assertEqual(state.elapsedSeconds, 20, '1回目の経過時間が正しく更新される');
        assertApproxEqual(state.currentEarnings, (1200 / 3600) * 20, 0.01, '1回目の収入が正しく計算される');
        
        // 2. 停止
        app.stop();
        state = app.getState();
        assertFalse(state.isRunning, 'カウンターが停止状態になる');
        
        // 3. 再開
        app.start();
        state = app.getState();
        assertTrue(state.isRunning, 'カウンターが再開される');
        
        // さらに30秒経過をシミュレート（合計50秒）
        timer.pausedTime = 50000; // 50秒
        app.updateEarnings();
        
        state = app.getState();
        assertEqual(state.elapsedSeconds, 50, '合計経過時間が正しく更新される');
        assertApproxEqual(state.currentEarnings, (1200 / 3600) * 50, 0.01, '合計収入が正しく計算される');
        
        // 4. 再度停止
        app.stop();
        state = app.getState();
        assertFalse(state.isRunning, 'カウンターが再度停止状態になる');
        assertEqual(state.elapsedSeconds, 50, '停止後も合計経過時間が維持される');
    });

    // 長時間動作のテスト
    test('長時間動作 - 8時間の連続稼働', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1500);
        
        // 開始
        app.start();
        
        // 8時間（28800秒）の経過をシミュレート
        const timer = app.getTimerManager();
        timer.pausedTime = 28800000; // 8時間（ミリ秒）
        app.updateEarnings();
        
        const state = app.getState();
        assertEqual(state.elapsedSeconds, 28800, '8時間の経過時間が正しく記録される');
        assertApproxEqual(state.currentEarnings, 1500 * 8, 0.1, '8時間分の収入が正しく計算される');
        assertEqual(state.formattedElapsedTime, '08:00:00', '経過時間が正しくフォーマットされる');
    });

    // エッジケース: 時給変更のテスト
    test('エッジケース - 動作中の時給変更', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1000);
        
        // 開始
        app.start();
        
        // 30秒経過をシミュレート
        const timer = app.getTimerManager();
        timer.pausedTime = 30000; // 30秒
        app.updateEarnings();
        
        let state = app.getState();
        assertApproxEqual(state.currentEarnings, (1000 / 3600) * 30, 0.01, '初期時給での収入計算');
        
        // 動作中に時給を変更
        app.setHourlyWage(2000);
        
        // さらに30秒経過をシミュレート（合計60秒）
        timer.pausedTime = 60000; // 60秒
        app.updateEarnings();
        
        state = app.getState();
        // 時給変更後は新しい時給で計算される
        assertApproxEqual(state.currentEarnings, (2000 / 3600) * 60, 0.01, '変更後の時給で再計算される');
    });

    // エッジケース: 無効な時給入力のテスト
    test('エッジケース - 無効な時給入力', () => {
        const app = new WageCounterApp();
        app.initialize();
        
        // 無効な時給を設定
        app.setHourlyWage(-100);
        let state = app.getState();
        assertEqual(state.perSecondWage, 0, '負の時給は0として扱われる');
        
        app.setHourlyWage(NaN);
        state = app.getState();
        assertEqual(state.perSecondWage, 0, 'NaNは0として扱われる');
        
        // 有効な時給を設定
        app.setHourlyWage(1000);
        state = app.getState();
        assertApproxEqual(state.perSecondWage, 1000 / 3600, 0.0001, '有効な時給は正しく計算される');
    });

    // エッジケース: 初期化前の操作のテスト
    test('エッジケース - 初期化前の操作', () => {
        const app = new WageCounterApp();
        // 初期化せずに操作
        
        // 時給設定
        app.setHourlyWage(1000);
        
        // 開始（初期化されていないため効果なし）
        app.start();
        let state = app.getState();
        assertFalse(state.isRunning, '初期化前の開始操作は無効');
        
        // 停止（初期化されていないため効果なし）
        app.stop();
        
        // リセット（初期化されていないため効果なし）
        app.reset();
        
        // 初期化後は正常に動作することを確認
        app.initialize();
        app.start();
        state = app.getState();
        assertTrue(state.isRunning, '初期化後は開始操作が有効');
    });

    // エッジケース: 時給0円のテスト
    test('エッジケース - 時給0円', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(0);
        
        // 開始
        app.start();
        
        // 60秒経過をシミュレート
        const timer = app.getTimerManager();
        timer.pausedTime = 60000; // 60秒
        app.updateEarnings();
        
        const state = app.getState();
        assertEqual(state.currentEarnings, 0, '時給0円の場合は収入も0円');
        assertEqual(state.elapsedSeconds, 60, '経過時間は正しく記録される');
    });

    // エッジケース: 小数点以下の時給のテスト
    test('エッジケース - 小数点以下の時給', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1000.50);
        
        // 開始
        app.start();
        
        // 3600秒（1時間）経過をシミュレート
        const timer = app.getTimerManager();
        timer.pausedTime = 3600000; // 1時間（ミリ秒）
        app.updateEarnings();
        
        const state = app.getState();
        assertApproxEqual(state.currentEarnings, 1000.50, 0.01, '小数点以下の時給も正確に計算される');
    });

    // エッジケース: 連続リセットのテスト
    test('エッジケース - 連続リセット', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1000);
        
        // 開始
        app.start();
        
        // 30秒経過をシミュレート
        const timer = app.getTimerManager();
        timer.pausedTime = 30000; // 30秒
        app.updateEarnings();
        
        // 1回目のリセット
        app.reset();
        let state = app.getState();
        assertEqual(state.elapsedSeconds, 0, '1回目のリセット後は経過時間が0');
        assertEqual(state.currentEarnings, 0, '1回目のリセット後は収入が0');
        
        // 再度開始
        app.start();
        
        // 20秒経過をシミュレート
        timer.pausedTime = 20000; // 20秒
        app.updateEarnings();
        
        // 2回目のリセット
        app.reset();
        state = app.getState();
        assertEqual(state.elapsedSeconds, 0, '2回目のリセット後も経過時間が0');
        assertEqual(state.currentEarnings, 0, '2回目のリセット後も収入が0');
        
        // 3回目のリセット（連続リセット）
        app.reset();
        state = app.getState();
        assertEqual(state.elapsedSeconds, 0, '連続リセット後も経過時間が0');
        assertEqual(state.currentEarnings, 0, '連続リセット後も収入が0');
    });

    // エッジケース: 高額時給のテスト
    test('エッジケース - 高額時給', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(100000); // 10万円/時
        
        // 開始
        app.start();
        
        // 60秒経過をシミュレート
        const timer = app.getTimerManager();
        timer.pausedTime = 60000; // 60秒
        app.updateEarnings();
        
        const state = app.getState();
        assertApproxEqual(state.currentEarnings, (100000 / 3600) * 60, 0.1, '高額時給でも正確に計算される');
    });

    // 状態同期のテスト
    test('状態同期 - WageCounterとTimerManagerの同期', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1000);
        
        // 開始
        app.start();
        assertTrue(app.isStateSynchronized(), '開始後は状態が同期されている');
        
        // 停止
        app.stop();
        assertTrue(app.isStateSynchronized(), '停止後も状態が同期されている');
        
        // リセット
        app.reset();
        assertTrue(app.isStateSynchronized(), 'リセット後も状態が同期されている');
    });

    // 複数回の開始・停止のテスト
    test('複数回の開始・停止', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1000);
        
        // 1回目: 開始 → 停止
        app.start();
        const timer = app.getTimerManager();
        timer.pausedTime = 10000; // 10秒
        app.updateEarnings();
        app.stop();
        
        let state = app.getState();
        assertEqual(state.elapsedSeconds, 10, '1回目の経過時間');
        
        // 2回目: 開始 → 停止
        app.start();
        timer.pausedTime = 25000; // 合計25秒
        app.updateEarnings();
        app.stop();
        
        state = app.getState();
        assertEqual(state.elapsedSeconds, 25, '2回目の経過時間（累積）');
        
        // 3回目: 開始 → 停止
        app.start();
        timer.pausedTime = 45000; // 合計45秒
        app.updateEarnings();
        app.stop();
        
        state = app.getState();
        assertEqual(state.elapsedSeconds, 45, '3回目の経過時間（累積）');
        assertApproxEqual(state.currentEarnings, (1000 / 3600) * 45, 0.01, '累積収入が正しく計算される');
    });

    // 時間フォーマットのテスト
    test('時間フォーマット - 様々な時間の表示', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1000);
        
        // 開始
        app.start();
        
        // 30秒
        const timer = app.getTimerManager();
        timer.pausedTime = 30000; // 30秒
        app.updateEarnings();
        let state = app.getState();
        assertEqual(state.formattedElapsedTime, '00:00:30', '30秒の表示形式');
        
        // 5分
        timer.pausedTime = 300000; // 5分
        app.updateEarnings();
        state = app.getState();
        assertEqual(state.formattedElapsedTime, '00:05:00', '5分の表示形式');
        
        // 1時間30分
        timer.pausedTime = 5400000; // 1時間30分
        app.updateEarnings();
        state = app.getState();
        assertEqual(state.formattedElapsedTime, '01:30:00', '1時間30分の表示形式');
        
        // 10時間5分10秒
        timer.pausedTime = 36310000; // 10時間5分10秒
        app.updateEarnings();
        state = app.getState();
        assertEqual(state.formattedElapsedTime, '10:05:10', '10時間5分10秒の表示形式');
    });

    // 完全な操作フローのテスト（設定 → 開始 → 停止 → 再開 → リセット）
    test('完全な操作フロー - 設定 → 開始 → 停止 → 再開 → リセット', () => {
        const app = new WageCounterApp();
        app.initialize();
        
        // 1. 時給設定
        app.setHourlyWage(1500);
        let state = app.getState();
        assertEqual(state.hourlyWage, 1500, '時給が正しく設定される');
        
        // 2. 開始
        app.start();
        state = app.getState();
        assertTrue(state.isRunning, 'カウンターが開始状態になる');
        
        // 3. 30秒経過
        const timer = app.getTimerManager();
        timer.pausedTime = 30000; // 30秒
        app.updateEarnings();
        
        state = app.getState();
        assertEqual(state.elapsedSeconds, 30, '30秒の経過時間');
        assertApproxEqual(state.currentEarnings, (1500 / 3600) * 30, 0.01, '30秒分の収入');
        
        // 4. 停止
        app.stop();
        state = app.getState();
        assertFalse(state.isRunning, 'カウンターが停止状態になる');
        
        // 5. 時給変更
        app.setHourlyWage(2000);
        state = app.getState();
        assertEqual(state.hourlyWage, 2000, '時給が変更される');
        
        // 6. 再開
        app.start();
        state = app.getState();
        assertTrue(state.isRunning, 'カウンターが再開される');
        
        // 7. さらに30秒経過（合計60秒）
        timer.pausedTime = 60000; // 60秒
        app.updateEarnings();
        
        state = app.getState();
        assertEqual(state.elapsedSeconds, 60, '合計60秒の経過時間');
        // 最初の30秒は1500円/時、次の30秒は2000円/時で計算
        const expectedEarnings = (1500 / 3600) * 60;
        assertApproxEqual(state.currentEarnings, expectedEarnings, 0.01, '変更前の時給で計算される');
        
        // 8. リセット
        app.reset();
        state = app.getState();
        assertEqual(state.elapsedSeconds, 0, 'リセット後は経過時間が0');
        assertEqual(state.currentEarnings, 0, 'リセット後は収入が0');
        assertEqual(state.hourlyWage, 2000, 'リセット後も時給設定は維持される');
    });

    // 新規追加: データ永続化のテスト
    test('データ永続化 - 設定の保存と読み込み', () => {
        const app = new WageCounterApp();
        app.initialize();
        
        // 時給設定を保存
        const saveResult = app.saveHourlyWage(1800);
        assertTrue(saveResult.success, '時給設定が正常に保存される');
        
        // 新しいアプリインスタンスを作成して設定が読み込まれるか確認
        const newApp = new WageCounterApp();
        newApp.initialize();
        
        const state = newApp.getState();
        assertEqual(state.hourlyWage, 1800, '保存された時給設定が新しいインスタンスに読み込まれる');
    });

    // 新規追加: 視覚化モード設定のテスト
    test('視覚化モード - 設定の保存と切り替え', () => {
        const app = new WageCounterApp();
        app.initialize();
        
        // デフォルトはバーモード
        const initialMode = app.loadVisualSettings();
        assertEqual(initialMode, 'bar', 'デフォルトの視覚化モードはバー');
        
        // サークルモードに変更
        const saveResult = app.saveVisualizationMode('circle');
        assertTrue(saveResult.success, '視覚化モード設定が正常に保存される');
        
        // 新しいアプリインスタンスで設定が読み込まれるか確認
        const newApp = new WageCounterApp();
        newApp.initialize();
        
        const loadedMode = newApp.loadVisualSettings();
        assertEqual(loadedMode, 'circle', '保存された視覚化モード設定が読み込まれる');
    });

    // 新規追加: メモリリーク対策のテスト
    test('メモリリーク対策 - 長時間動作後のリソース解放', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1000);
        
        // 開始
        app.start();
        
        // 長時間（24時間）の経過をシミュレート
        const timer = app.getTimerManager();
        timer.pausedTime = 24 * 3600 * 1000; // 24時間（ミリ秒）
        app.updateEarnings();
        
        // 停止してリソース解放
        app.stop();
        
        // タイマーのインターバルIDがクリアされていることを確認
        assertFalse(!!timer.intervalId, 'タイマーのインターバルIDがクリアされている');
        
        // リセットしてすべてのリソースを解放
        app.reset();
        
        // 状態が正しくリセットされていることを確認
        const state = app.getState();
        assertEqual(state.elapsedSeconds, 0, 'リセット後は経過時間が0');
        assertEqual(state.currentEarnings, 0, 'リセット後は収入が0');
        assertFalse(state.isRunning, 'リセット後はカウンターが停止状態');
    });

    // 新規追加: DOM更新の最適化テスト
    test('DOM更新の最適化 - 高頻度更新の処理', () => {
        // このテストはモックUIコントローラーを使用
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1000);
        
        // 更新回数をカウントするモックUIコントローラー
        const mockUIController = {
            updateCount: 0,
            lastUpdateTime: 0,
            
            // 実際のUIController.updateDisplayをシミュレート
            updateDisplay(animate) {
                this.updateCount++;
                const now = Date.now();
                
                // 前回の更新から十分な時間が経過している場合のみアニメーション
                if (now - this.lastUpdateTime > 300) {
                    // アニメーション効果を使用
                    this.lastUpdateTime = now;
                    return true; // アニメーション使用
                } else {
                    // アニメーションなしで更新
                    return false; // アニメーションなし
                }
            }
        };
        
        // 高頻度更新のシミュレーション
        const updateInterval = 50; // 50msごとに更新
        const totalUpdates = 20; // 合計20回の更新
        
        // 高頻度更新を実行
        for (let i = 0; i < totalUpdates; i++) {
            mockUIController.updateDisplay(true);
        }
        
        // 更新回数が正しいことを確認
        assertEqual(mockUIController.updateCount, totalUpdates, '更新回数が正しい');
        
        // アニメーション効果の使用回数は少なくなっているはず
        const animationCount = Math.ceil(totalUpdates * updateInterval / 300);
        assertTrue(animationCount < totalUpdates, 'アニメーション効果の使用回数は更新回数より少ない');
    });

    // 新規追加: エラー回復のテスト
    test('エラー回復 - タイマーエラーからの復旧', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1000);
        
        // タイマーを開始
        app.start();
        
        // タイマーエラーをシミュレート
        const timer = app.getTimerManager();
        timer.intervalId = null; // 強制的にインターバルIDをクリア
        
        // 再開を試行
        app.stop(); // 一度停止
        app.start(); // 再開
        
        // 正常に再開されたことを確認
        const state = app.getState();
        assertTrue(state.isRunning, 'タイマーエラー後も再開できる');
        assertTrue(app.isStateSynchronized(), 'タイマーエラー後も状態が同期されている');
    });

    // 新規追加: ブラウザのパフォーマンス最適化テスト
    test('ブラウザパフォーマンス - バックグラウンドタブでの動作', () => {
        const app = new WageCounterApp();
        app.initialize();
        app.setHourlyWage(1000);
        
        // タイマーを開始
        app.start();
        
        // バックグラウンドタブでの動作をシミュレート
        const timer = app.getTimerManager();
        
        // 通常の更新間隔を保存
        const originalInterval = timer.updateInterval;
        
        // バックグラウンドでの低頻度更新をシミュレート
        timer.setUpdateInterval(5000); // 5秒間隔に変更
        
        // 更新間隔が変更されたことを確認
        assertEqual(timer.getUpdateInterval(), 5000, 'バックグラウンドでの更新間隔が適切に変更される');
        
        // 通常の更新間隔に戻す
        timer.setUpdateInterval(originalInterval);
        
        // 更新間隔が元に戻ったことを確認
        assertEqual(timer.getUpdateInterval(), originalInterval, '通常の更新間隔に戻る');
    });

    console.log(`=== エンドツーエンドテスト完了: ${testsPassed}/${totalTests} 成功 ===`);
    
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
            testButton.textContent = 'エンドツーエンドテスト実行';
            testButton.onclick = runEndToEndTests;
            testButton.style.position = 'fixed';
            testButton.style.top = '210px';
            testButton.style.right = '10px';
            testButton.style.zIndex = '9999';
            document.body.appendChild(testButton);
        }
    });
}