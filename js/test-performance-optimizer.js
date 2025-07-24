/**
 * PerformanceOptimizer のテスト
 */

function runPerformanceOptimizerTests() {
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

    console.log('=== PerformanceOptimizer テスト開始 ===');

    // DOM更新最適化のテスト
    test('DOM更新最適化 - 高頻度更新の制限', () => {
        let updateCount = 0;
        
        // 更新関数
        const updateFn = () => {
            updateCount++;
        };
        
        // 最適化された更新関数
        const optimizedUpdate = PerformanceOptimizer.optimizeDOMUpdates(updateFn, 100);
        
        // 高頻度で呼び出し
        for (let i = 0; i < 10; i++) {
            optimizedUpdate();
        }
        
        // 最適化により1回のみ実行されるはず
        assertEqual(updateCount, 1, '高頻度更新は制限される');
        
        // 十分な時間が経過した後の呼び出し（モック）
        setTimeout(() => {
            optimizedUpdate();
            assertEqual(updateCount, 2, '時間経過後は再度実行される');
        }, 150);
    });

    // デバウンス関数のテスト
    test('デバウンス関数 - 連続呼び出しの最適化', () => {
        let callCount = 0;
        
        // テスト用の関数
        const testFn = () => {
            callCount++;
        };
        
        // デバウンスされた関数
        const debouncedFn = PerformanceOptimizer.debounce(testFn, 50);
        
        // 連続して呼び出し
        debouncedFn();
        debouncedFn();
        debouncedFn();
        
        // 即時には実行されない
        assertEqual(callCount, 0, 'デバウンスにより即時実行されない');
        
        // 遅延後に1回だけ実行される（モック）
        setTimeout(() => {
            assertEqual(callCount, 1, 'デバウンス後に1回だけ実行される');
        }, 100);
    });

    // スロットル関数のテスト
    test('スロットル関数 - スクロールイベントの最適化', () => {
        let callCount = 0;
        
        // テスト用の関数
        const scrollHandler = () => {
            callCount++;
        };
        
        // スロットルされた関数
        const throttledScroll = PerformanceOptimizer.throttleScroll(scrollHandler);
        
        // 連続して呼び出し（スクロールイベントをシミュレート）
        throttledScroll();
        throttledScroll();
        throttledScroll();
        
        // requestAnimationFrameにより次のフレームまで遅延される
        assertEqual(callCount, 0, 'スロットルにより即時実行されない');
        
        // 次のフレームで1回だけ実行される（モック）
        // 注: 実際のテストでは非同期処理が必要
    });

    // バックグラウンド検出のテスト（モック）
    test('バックグラウンド検出 - 可視性変更イベント', () => {
        // モックオブジェクト
        const mockApp = {
            timerManager: {
                updateInterval: 1000,
                getUpdateInterval: function() { return this.updateInterval; },
                setUpdateInterval: function(interval) { this.updateInterval = interval; }
            }
        };
        
        const mockUIController = {};
        
        // PerformanceOptimizerインスタンス
        const optimizer = new PerformanceOptimizer(mockApp, mockUIController);
        
        // 初期状態
        optimizer.isPageVisible = true;
        optimizer.originalUpdateInterval = 1000;
        
        // バックグラウンドへの切り替えをシミュレート
        optimizer.isPageVisible = false;
        optimizer.adjustUpdateInterval();
        
        // 更新間隔が長くなっていることを確認
        assertEqual(mockApp.timerManager.updateInterval, optimizer.backgroundUpdateInterval, 'バックグラウンドでは更新間隔が長くなる');
        
        // フォアグラウンドへの復帰をシミュレート
        optimizer.isPageVisible = true;
        optimizer.adjustUpdateInterval();
        
        // 更新間隔が元に戻ることを確認
        assertEqual(mockApp.timerManager.updateInterval, optimizer.originalUpdateInterval, 'フォアグラウンドでは元の更新間隔に戻る');
    });

    // メモリ使用量モニタリングのテスト（モック）
    test('メモリ使用量モニタリング - 高メモリ使用時の最適化', () => {
        // モックオブジェクト
        const mockApp = {
            getState: () => ({ isRunning: true })
        };
        
        const mockUIController = {
            optimizationApplied: false,
            setOptimizedMode: function(enabled) {
                this.optimizationApplied = enabled;
            }
        };
        
        // PerformanceOptimizerインスタンス
        const optimizer = new PerformanceOptimizer(mockApp, mockUIController);
        
        // メモリ使用量が多い状況をシミュレート
        optimizer.performMemoryOptimization();
        
        // 最適化が適用されたことを確認
        assertTrue(mockUIController.optimizationApplied, 'メモリ使用量が多い場合は最適化が適用される');
    });

    // リソース解放のテスト
    test('リソース解放 - クリーンアップ処理', () => {
        // モックオブジェクト
        const mockApp = {
            timerManager: { intervalId: 123 },
            getState: () => ({ isRunning: true }),
            stop: function() {
                this.stopped = true;
            },
            stopped: false
        };
        
        // PerformanceOptimizerインスタンス
        const optimizer = new PerformanceOptimizer(mockApp, null);
        
        // タイマーをセット
        optimizer.inactivityTimeout = setTimeout(() => {}, 1000);
        optimizer.memoryUsageMonitorId = setInterval(() => {}, 1000);
        
        // クリーンアップを実行
        optimizer.cleanup();
        
        // タイマーがクリアされたことを確認
        assertFalse(!!optimizer.inactivityTimeout, '非アクティブタイマーがクリアされる');
        assertFalse(!!optimizer.memoryUsageMonitorId, 'メモリ使用量モニタリングタイマーがクリアされる');
        
        // アプリが停止されたことを確認
        assertTrue(mockApp.stopped, 'アプリケーションが停止される');
    });

    console.log(`=== PerformanceOptimizer テスト完了: ${testsPassed}/${totalTests} 成功 ===`);
    
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
            testButton.textContent = 'パフォーマンス最適化テスト実行';
            testButton.onclick = runPerformanceOptimizerTests;
            testButton.style.position = 'fixed';
            testButton.style.top = '250px';
            testButton.style.right = '10px';
            testButton.style.zIndex = '9999';
            document.body.appendChild(testButton);
        }
    });
}