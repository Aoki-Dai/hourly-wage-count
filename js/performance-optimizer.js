/**
 * PerformanceOptimizer クラス
 * アプリケーションのパフォーマンス最適化を管理する
 */
class PerformanceOptimizer {
    /**
     * PerformanceOptimizer を初期化する
     * @param {WageCounterApp} app - WageCounterApp インスタンス
     * @param {UIController} uiController - UIController インスタンス
     */
    constructor(app, uiController) {
        this.app = app;
        this.uiController = uiController;
        this.isInitialized = false;
        this.isPageVisible = true;
        this.originalUpdateInterval = 1000; // デフォルトの更新間隔（ミリ秒）
        this.backgroundUpdateInterval = 5000; // バックグラウンド時の更新間隔（ミリ秒）
        this.inactivityTimeout = null; // 非アクティブ検出用タイマー
        this.inactivityDelay = 60000; // 非アクティブと判断する時間（ミリ秒）
        this.lastActivityTime = Date.now(); // 最後のユーザーアクティビティ時間
        this.memoryUsageMonitorId = null; // メモリ使用量モニタリング用タイマーID
        this.memoryCheckInterval = 300000; // メモリチェック間隔（5分）
    }

    /**
     * 最適化機能を初期化する
     */
    initialize() {
        if (this.isInitialized) {
            return;
        }

        // ページの可視性変更イベントを監視
        this.setupVisibilityChangeListener();
        
        // ユーザーアクティビティを監視
        this.setupUserActivityMonitoring();
        
        // 定期的なメモリ使用量のチェックを開始
        this.startMemoryUsageMonitoring();
        
        // リソースの解放を保証するためのイベントリスナーを設定
        this.setupResourceCleanupListeners();
        
        this.isInitialized = true;
        console.log('PerformanceOptimizer が初期化されました');
    }

    /**
     * ページの可視性変更イベントリスナーを設定する
     */
    setupVisibilityChangeListener() {
        // ページの可視性が変更されたときのイベントリスナー
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // 初期状態を設定
        this.isPageVisible = document.visibilityState === 'visible';
        
        // 初期状態に応じて更新間隔を設定
        this.adjustUpdateInterval();
    }
    
    /**
     * ページの可視性変更を処理する
     */
    handleVisibilityChange() {
        this.isPageVisible = document.visibilityState === 'visible';
        
        if (this.isPageVisible) {
            console.log('PerformanceOptimizer: ページがフォアグラウンドになりました');
            // フォアグラウンドに戻ったときの処理
            this.adjustUpdateInterval();
            
            // 表示を即時更新
            if (this.uiController) {
                this.uiController.updateDisplay(false);
            }
        } else {
            console.log('PerformanceOptimizer: ページがバックグラウンドになりました');
            // バックグラウンドに移行したときの処理
            this.adjustUpdateInterval();
        }
    }
    
    /**
     * 現在の状態に応じて更新間隔を調整する
     */
    adjustUpdateInterval() {
        if (!this.app || !this.app.timerManager) {
            return;
        }
        
        // 現在の更新間隔を保存（初回のみ）
        if (this.originalUpdateInterval === 1000) {
            this.originalUpdateInterval = this.app.timerManager.getUpdateInterval();
        }
        
        // ページが表示されていない場合は更新間隔を長くする
        if (!this.isPageVisible) {
            this.app.timerManager.setUpdateInterval(this.backgroundUpdateInterval);
        } else {
            // ページが表示されている場合は元の更新間隔に戻す
            this.app.timerManager.setUpdateInterval(this.originalUpdateInterval);
        }
    }
    
    /**
     * ユーザーアクティビティ監視を設定する
     */
    setupUserActivityMonitoring() {
        // ユーザーアクティビティを検出するイベント
        const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
        
        // イベントリスナーを設定
        activityEvents.forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.handleUserActivity();
            }, { passive: true }); // パフォーマンス向上のためpassiveオプションを使用
        });
        
        // 初期状態でアクティビティタイマーを開始
        this.resetInactivityTimer();
    }
    
    /**
     * ユーザーアクティビティを処理する
     */
    handleUserActivity() {
        this.lastActivityTime = Date.now();
        
        // 非アクティブ状態から復帰した場合
        if (this.app && this.app.timerManager && 
            this.app.timerManager.getUpdateInterval() !== this.originalUpdateInterval) {
            // 更新間隔を元に戻す
            this.app.timerManager.setUpdateInterval(this.originalUpdateInterval);
        }
        
        // 非アクティブタイマーをリセット
        this.resetInactivityTimer();
    }
    
    /**
     * 非アクティブタイマーをリセットする
     */
    resetInactivityTimer() {
        // 既存のタイマーをクリア
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
        }
        
        // 新しいタイマーを設定
        this.inactivityTimeout = setTimeout(() => {
            this.handleUserInactivity();
        }, this.inactivityDelay);
    }
    
    /**
     * ユーザーの非アクティブ状態を処理する
     */
    handleUserInactivity() {
        console.log('PerformanceOptimizer: ユーザーが非アクティブになりました');
        
        // アプリが動作中の場合のみ最適化
        if (this.app && this.app.timerManager && this.app.getState().isRunning) {
            // 更新間隔を長くして負荷を減らす
            const currentInterval = this.app.timerManager.getUpdateInterval();
            const inactiveInterval = Math.min(3000, currentInterval * 2); // 最大3秒まで
            
            this.app.timerManager.setUpdateInterval(inactiveInterval);
        }
    }
    
    /**
     * メモリ使用量のモニタリングを開始する
     */
    startMemoryUsageMonitoring() {
        // メモリ使用量のモニタリングが利用可能かチェック
        if (window.performance && window.performance.memory) {
            this.memoryUsageMonitorId = setInterval(() => {
                this.checkMemoryUsage();
            }, this.memoryCheckInterval);
            
            console.log('PerformanceOptimizer: メモリ使用量モニタリングを開始しました');
        }
    }
    
    /**
     * メモリ使用量をチェックする
     */
    checkMemoryUsage() {
        if (!window.performance || !window.performance.memory) {
            return;
        }
        
        try {
            const memoryInfo = window.performance.memory;
            const usedHeapSize = memoryInfo.usedJSHeapSize;
            const totalHeapSize = memoryInfo.totalJSHeapSize;
            const heapLimit = memoryInfo.jsHeapSizeLimit;
            
            // ヒープ使用率を計算
            const heapUsageRatio = usedHeapSize / heapLimit;
            
            console.log(`PerformanceOptimizer: メモリ使用状況 - 使用中: ${Math.round(usedHeapSize / (1024 * 1024))}MB, 合計: ${Math.round(totalHeapSize / (1024 * 1024))}MB, 上限: ${Math.round(heapLimit / (1024 * 1024))}MB`);
            
            // メモリ使用量が多い場合は最適化を実行
            if (heapUsageRatio > 0.7) { // 70%以上使用している場合
                console.warn('PerformanceOptimizer: メモリ使用量が多いため、最適化を実行します');
                this.performMemoryOptimization();
            }
            
            // 定期的なガベージコレクションのヒント（長時間実行時のメモリリーク対策）
            if (this.app && this.app.getState().isRunning && 
                this.app.getState().elapsedSeconds > 3600) { // 1時間以上実行している場合
                
                // 未使用オブジェクトの参照を解放
                if (this.uiController && this.uiController.clearAnimationCache) {
                    this.uiController.clearAnimationCache();
                }
            }
        } catch (e) {
            console.warn('PerformanceOptimizer: メモリ使用量チェック中にエラーが発生しました', e);
        }
    }
    
    /**
     * メモリ最適化を実行する
     */
    performMemoryOptimization() {
        // 未使用のオブジェクトへの参照を解放
        if (this.app && this.app.getState().isRunning) {
            // 一時的なオブジェクトをクリア
            if (this.uiController) {
                // アニメーション関連の一時オブジェクトをクリア
                if (this.uiController.clearAnimationCache) {
                    this.uiController.clearAnimationCache();
                }
                
                // 表示更新を最適化モードに切り替え
                if (this.uiController.setOptimizedMode) {
                    this.uiController.setOptimizedMode(true);
                }
            }
            
            // ガベージコレクションのヒント
            if (window.gc) {
                try {
                    window.gc(); // 明示的なGC要求（デバッグモードでのみ動作）
                } catch (e) {
                    // GCが利用できない場合は無視
                }
            }
        }
    }
    
    /**
     * リソース解放のためのイベントリスナーを設定する
     */
    setupResourceCleanupListeners() {
        // ページ離脱時のクリーンアップ
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // タブ閉じる/切り替え時のクリーンアップ
        window.addEventListener('pagehide', () => {
            this.cleanup();
        });
    }
    
    /**
     * リソースを解放する
     */
    cleanup() {
        // タイマーをクリア
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }
        
        if (this.memoryUsageMonitorId) {
            clearInterval(this.memoryUsageMonitorId);
            this.memoryUsageMonitorId = null;
        }
        
        // アプリケーションのタイマーを停止
        if (this.app && this.app.timerManager) {
            // 動作中の場合は停止
            if (this.app.getState().isRunning) {
                this.app.stop();
            }
        }
        
        console.log('PerformanceOptimizer: リソースを解放しました');
    }
    
    /**
     * DOM更新を最適化する
     * @param {Function} updateFn - 更新関数
     * @param {number} minInterval - 最小更新間隔（ミリ秒）
     * @returns {Function} 最適化された更新関数
     */
    static optimizeDOMUpdates(updateFn, minInterval = 100) {
        let lastUpdateTime = 0;
        let pendingUpdate = false;
        let rafId = null;
        
        return function(...args) {
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTime;
            
            // 前回の更新から十分な時間が経過している場合は即時更新
            if (timeSinceLastUpdate >= minInterval) {
                lastUpdateTime = now;
                return updateFn.apply(this, args);
            }
            
            // 更新がすでに予約されている場合は何もしない
            if (pendingUpdate) {
                return;
            }
            
            // 次のフレームでの更新を予約
            pendingUpdate = true;
            
            rafId = requestAnimationFrame(() => {
                lastUpdateTime = Date.now();
                pendingUpdate = false;
                rafId = null;
                updateFn.apply(this, args);
            });
            
            return rafId;
        };
    }
    
    /**
     * 最適化されたイベントリスナーを作成する
     * @param {Function} handler - イベントハンドラ関数
     * @param {number} delay - デバウンス遅延（ミリ秒）
     * @returns {Function} 最適化されたイベントハンドラ
     */
    static debounce(handler, delay = 100) {
        let timeoutId = null;
        
        return function(...args) {
            const context = this;
            
            // 既存のタイマーをクリア
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            // 新しいタイマーを設定
            timeoutId = setTimeout(() => {
                handler.apply(context, args);
                timeoutId = null;
            }, delay);
        };
    }
    
    /**
     * 最適化されたスクロールイベントリスナーを作成する
     * @param {Function} handler - スクロールイベントハンドラ
     * @returns {Function} 最適化されたスクロールイベントハンドラ
     */
    static throttleScroll(handler) {
        let rafId = null;
        let lastArgs = null;
        
        return function(...args) {
            lastArgs = args;
            
            if (rafId) {
                return;
            }
            
            rafId = requestAnimationFrame(() => {
                handler.apply(this, lastArgs);
                rafId = null;
            });
        };
    }
}