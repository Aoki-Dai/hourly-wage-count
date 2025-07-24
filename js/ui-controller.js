/**
 * UIController クラス
 * ユーザーインターフェースとイベント処理を管理する
 */
class UIController {
    /**
     * UIController を初期化する
     * @param {WageCounterApp} app - WageCounterApp インスタンス
     */
    constructor(app) {
        this.app = app;
        this.validator = app.getValidator();
        this.currencyFormatter = app.getCurrencyFormatter();
        this.elements = {};
        this.updateInterval = 100; // 表示更新間隔（ミリ秒）
        this.displayUpdateIntervalId = null;
        this.visualizer = null; // Visualizer インスタンス
        this.isInitialized = false;
    }

    /**
     * DOM要素を取得し、UIを初期化する
     */
    initialize() {
        if (this.isInitialized) {
            return;
        }

        // DOM要素の取得
        this.elements = {
            hourlyWageInput: document.getElementById('hourly-wage'),
            wageError: document.getElementById('wage-error'),
            currentEarnings: document.getElementById('current-earnings'),
            elapsedTime: document.getElementById('elapsed-time'),
            startStopBtn: document.getElementById('start-stop-btn'),
            resetBtn: document.getElementById('reset-btn'),
            progressBar: document.getElementById('progress-bar'),
            progressContainer: document.getElementById('progress-container'),
            progressLabel: document.getElementById('progress-label')
        };
        
        // 要素の存在確認
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);
        
        if (missingElements.length > 0) {
            console.error('以下のDOM要素が見つかりません:', missingElements);
            return;
        }
        
        console.log('UIController: すべてのDOM要素が正常に取得されました');
        
        // Visualizerの初期化
        this.initializeVisualizer();
        
        // イベントリスナーを設定
        this.initializeEventListeners();
        
        // ストレージの利用可否を確認
        this.checkStorageAvailability();
        
        // LocalStorageから設定を読み込み
        this.loadSettingsFromStorage();
        
        // 初期状態の設定
        this.initializeUIState();
        
        // 表示更新タイマーを開始
        this.startDisplayUpdateTimer();
        
        this.isInitialized = true;
        console.log('UIController が初期化されました');
    }
    
    /**
     * ストレージの利用可否を確認する
     * @returns {boolean} ストレージが利用可能かどうか
     */
    checkStorageAvailability() {
        const storageManager = this.app.storageManager;
        
        if (!storageManager) {
            console.error('UIController: StorageManagerが初期化されていません');
            return false;
        }
        
        // ストレージが利用できない場合はインジケーターを表示
        if (!storageManager.isStorageAvailable()) {
            console.warn('UIController: LocalStorageが利用できません');
            this.showStorageUnavailableIndicator();
            
            // プライベートブラウジングモードの検出を試みる
            this.detectPrivateBrowsingMode();
            
            return false;
        } else {
            console.log('UIController: LocalStorageが利用可能です');
            this.hideStorageUnavailableIndicator();
            return true;
        }
    }
    
    /**
     * プライベートブラウジングモードを検出する
     * 注: この検出は完全ではなく、ブラウザによって異なる
     */
    detectPrivateBrowsingMode() {
        try {
            // Safari のプライベートモード検出
            if (window.safari && window.safari.pushNotification) {
                const privateMode = window.safari.pushNotification.toString() === '[object SafariRemoteNotification]';
                if (privateMode) {
                    console.log('UIController: Safari のプライベートブラウジングモードを検出しました');
                    this.showPrivateBrowsingNotice();
                }
            }
            
            // Firefox のプライベートモード検出（間接的な方法）
            if (navigator.userAgent.includes('Firefox')) {
                const db = indexedDB.open('test');
                db.onerror = () => {
                    console.log('UIController: Firefox のプライベートブラウジングモードを検出しました');
                    this.showPrivateBrowsingNotice();
                };
            }
            
            // Chrome のプライベートモード検出（間接的な方法）
            if (navigator.userAgent.includes('Chrome')) {
                const fs = window.RequestFileSystem || window.webkitRequestFileSystem;
                if (fs) {
                    fs(window.TEMPORARY, 100, 
                        () => {}, // 通常モード
                        () => {
                            console.log('UIController: Chrome のプライベートブラウジングモードを検出しました');
                            this.showPrivateBrowsingNotice();
                        }
                    );
                }
            }
        } catch (e) {
            console.warn('UIController: プライベートブラウジングモードの検出中にエラーが発生しました', e);
        }
    }
    
    /**
     * プライベートブラウジングモードの通知を表示する
     */
    showPrivateBrowsingNotice() {
        // 既存の通知を確認
        let notice = document.getElementById('private-browsing-notice');
        
        if (!notice) {
            // 通知を作成
            notice = document.createElement('div');
            notice.id = 'private-browsing-notice';
            notice.className = 'storage-notice';
            notice.innerHTML = '<span class="icon">ℹ️</span> プライベートブラウジングモードでは設定が保存されません';
            notice.title = 'プライベートブラウジングモードでは、ブラウザの仕様によりLocalStorageが制限されています。アプリは引き続き使用できますが、設定はブラウザを閉じると失われます。';
            
            // スタイルを設定
            notice.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
            notice.style.color = '#0D47A1';
            notice.style.padding = '5px 10px';
            notice.style.borderRadius = '4px';
            notice.style.fontSize = '0.8rem';
            notice.style.marginTop = '5px';
            notice.style.display = 'flex';
            notice.style.alignItems = 'center';
            notice.style.justifyContent = 'center';
            
            // アイコンのスタイル
            const iconSpan = notice.querySelector('.icon');
            if (iconSpan) {
                iconSpan.style.marginRight = '5px';
            }
            
            // 時給入力セクションの後に追加
            const wageInputSection = document.querySelector('.wage-input-section');
            if (wageInputSection) {
                wageInputSection.appendChild(notice);
            }
        }
    }
    
    /**
     * Visualizerを初期化する
     */
    initializeVisualizer() {
        const visualElements = {
            progressContainer: this.elements.progressContainer,
            progressBar: this.elements.progressBar,
            progressLabel: this.elements.progressLabel,
            circleChartContainer: document.getElementById('circle-chart-container'),
            circleProgress: document.getElementById('circle-progress'),
            circleText: document.getElementById('circle-text'),
            barViewBtn: document.getElementById('bar-view-btn'),
            circleViewBtn: document.getElementById('circle-view-btn')
        };
        
        this.visualizer = new Visualizer(visualElements, this.currencyFormatter);
        
        // 保存された視覚化モードを読み込む
        // グローバル変数から初期モードを取得（WageCounterApp.loadVisualSettings で設定）
        const savedMode = window.initialVisualizationMode || 'bar';
        
        // Visualizerを初期化し、保存されたモードを設定
        this.visualizer.initialize(savedMode);
        
        // 視覚化モード切り替えボタンのイベントリスナーを設定
        if (visualElements.barViewBtn && visualElements.circleViewBtn) {
            visualElements.barViewBtn.addEventListener('click', () => {
                this.visualizer.setVisualizationMode('bar');
                this.app.saveVisualizationMode('bar');
            });
            
            visualElements.circleViewBtn.addEventListener('click', () => {
                this.visualizer.setVisualizationMode('circle');
                this.app.saveVisualizationMode('circle');
            });
            
            // 初期状態のボタンのアクティブ状態を設定
            visualElements.barViewBtn.classList.toggle('active', savedMode === 'bar');
            visualElements.circleViewBtn.classList.toggle('active', savedMode === 'circle');
        }
        
        // 初期状態では時給を目標収入として設定
        const hourlyWage = parseFloat(this.elements.hourlyWageInput.value) || 0;
        if (hourlyWage > 0) {
            this.visualizer.setMaxEarnings(hourlyWage);
        }
    }

    /**
     * イベントリスナーを設定する
     */
    initializeEventListeners() {
        // 時給入力のバリデーション処理
        this.elements.hourlyWageInput.addEventListener('input', this.handleWageInput.bind(this));
        
        // 入力フィールドからフォーカスが外れたときの処理
        this.elements.hourlyWageInput.addEventListener('blur', this.handleWageInputBlur.bind(this));
        
        // 開始/停止ボタンのクリックイベント
        this.elements.startStopBtn.addEventListener('click', this.handleStartStop.bind(this));
        
        // リセットボタンのクリックイベント
        this.elements.resetBtn.addEventListener('click', this.handleReset.bind(this));
        
        // キーボードナビゲーションのサポート
        this.setupKeyboardNavigation();
    }
    
    /**
     * キーボードナビゲーションのサポートを設定する
     */
    setupKeyboardNavigation() {
        // Enter キーでボタンをクリックできるようにする
        document.addEventListener('keydown', (event) => {
            // スペースキーまたはEnterキーが押された場合
            if ((event.key === ' ' || event.key === 'Enter') && document.activeElement) {
                const activeElement = document.activeElement;
                
                // タブ切り替えボタンの場合
                if (activeElement.classList.contains('viz-tab-btn')) {
                    event.preventDefault();
                    activeElement.click();
                }
            }
            
            // Escキーでリセット確認ダイアログを表示
            if (event.key === 'Escape') {
                const currentState = this.app.getState();
                if (currentState.isRunning || currentState.currentEarnings > 0) {
                    if (confirm('カウンターをリセットしますか？')) {
                        this.handleReset();
                    }
                }
            }
        });
        
        // 時給入力フィールドでEnterキーを押したときの処理
        this.elements.hourlyWageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                
                // 入力値のバリデーション
                const validationResult = this.validator.validateWage(this.elements.hourlyWageInput.value);
                
                if (validationResult.isValid) {
                    // 有効な場合は開始ボタンにフォーカスを移動
                    this.elements.startStopBtn.focus();
                } else {
                    // 無効な場合はエラーメッセージを表示
                    this.validator.showError(this.elements.wageError, validationResult.error);
                }
            }
        });
        
        // 視覚化タブのキーボードナビゲーション
        const barViewBtn = document.getElementById('bar-view-btn');
        const circleViewBtn = document.getElementById('circle-view-btn');
        
        if (barViewBtn && circleViewBtn) {
            // 左右矢印キーでタブ間を移動
            barViewBtn.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    circleViewBtn.focus();
                    circleViewBtn.click();
                }
            });
            
            circleViewBtn.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    barViewBtn.focus();
                    barViewBtn.click();
                }
            });
        }
    }

    /**
     * 時給入力の変更イベントを処理する
     * @param {Event} event - 入力イベント
     */
    handleWageInput(event) {
        const inputValue = event.target.value;
        console.log('UIController: 時給入力が変更されました:', inputValue);
        
        // バリデーション実行
        const validationResult = this.validator.validateWage(inputValue);
        
        if (validationResult.isValid) {
            // 有効な入力の場合
            this.validator.hideError(this.elements.wageError);
            
            // WageCounterAppのメソッドを使用して時給を設定・保存
            const saveResult = this.app.saveHourlyWage(validationResult.value);
            
            if (!saveResult.success) {
                console.warn('UIController: 設定の保存に失敗しました:', saveResult.error);
                
                // ストレージエラーの場合は控えめに通知
                if (saveResult.error === 'storage_error' || saveResult.error === 'storage_unavailable') {
                    this.showTemporaryError(saveResult.message || '設定の保存に失敗しました', 'storage');
                }
            }
            
            // 開始ボタンを有効化
            this.elements.startStopBtn.disabled = false;
        } else {
            // 無効な入力の場合
            this.validator.showError(this.elements.wageError, validationResult.error);
            
            // 開始ボタンを無効化（有効な時給が設定されていない場合）
            const currentState = this.app.getState();
            if (currentState.hourlyWage <= 0) {
                this.elements.startStopBtn.disabled = true;
            }
        }
    }

    /**
     * 時給入力からフォーカスが外れたときの処理
     * @param {Event} event - ブラーイベント
     */
    handleWageInputBlur(event) {
        // 空の場合はエラーを表示
        if (event.target.value === '') {
            this.validator.showError(this.elements.wageError, '時給を入力してください');
            this.elements.startStopBtn.disabled = true;
        }
    }

    /**
     * 開始/停止ボタンのクリックイベントを処理する
     */
    handleStartStop() {
        const currentState = this.app.getState();
        
        if (currentState.isRunning) {
            // 停止
            this.app.stop();
            this.updateStartStopButton(false);
            
            // リセットボタンを有効化
            this.elements.resetBtn.disabled = false;
        } else {
            // 開始前に時給が設定されているかチェック
            if (currentState.hourlyWage <= 0) {
                this.validator.showError(this.elements.wageError, '時給を設定してからカウンターを開始してください');
                return;
            }
            
            // 開始
            this.app.start();
            this.updateStartStopButton(true);
            
            // 動作中はリセットボタンを無効化
            this.elements.resetBtn.disabled = true;
        }
        
        console.log('UIController: 開始/停止ボタンがクリックされました - 状態:', currentState.isRunning ? '停止' : '開始');
    }

    /**
     * リセットボタンのクリックイベントを処理する
     */
    handleReset() {
        // 動作中の場合は確認
        const currentState = this.app.getState();
        if (currentState.isRunning) {
            if (!confirm('カウンターが動作中です。リセットしますか？')) {
                return;
            }
        }
        
        this.app.reset();
        
        // UIを初期状態に戻す
        this.updateStartStopButton(false);
        this.elements.currentEarnings.textContent = this.currencyFormatter.formatSimple(0);
        this.elements.currentEarnings.title = '';
        this.elements.elapsedTime.textContent = '00:00:00';
        
        // Visualizerをリセット
        if (this.visualizer && this.visualizer.isInitialized) {
            this.visualizer.reset();
        }
        
        // リセットボタンを有効化
        this.elements.resetBtn.disabled = false;
        
        // 時給が設定されていない場合は開始ボタンを無効化
        if (!this.elements.hourlyWageInput.value || parseFloat(this.elements.hourlyWageInput.value) <= 0) {
            this.elements.startStopBtn.disabled = true;
        } else {
            this.elements.startStopBtn.disabled = false;
        }
        
        console.log('UIController: リセットボタンがクリックされました');
    }

    /**
     * 開始/停止ボタンの表示を更新する
     * @param {boolean} isRunning - 動作中かどうか
     */
    updateStartStopButton(isRunning) {
        if (isRunning) {
            this.elements.startStopBtn.textContent = '停止';
            this.elements.startStopBtn.classList.remove('start');
            this.elements.startStopBtn.classList.add('running', 'stop');
        } else {
            this.elements.startStopBtn.textContent = '開始';
            this.elements.startStopBtn.classList.remove('running', 'stop');
            this.elements.startStopBtn.classList.add('start');
        }
    }

    /**
     * LocalStorageから設定を読み込む
     */
    loadSettingsFromStorage() {
        // StorageManagerを取得
        const storageManager = this.app.storageManager;
        
        if (!storageManager) {
            console.error('UIController: StorageManagerが初期化されていません');
            return;
        }
        
        // 時給設定を読み込む
        const result = storageManager.loadSettings('hourlyWage', null);
        
        if (result.success && result.value !== null) {
            const parsedWage = parseFloat(result.value);
            this.elements.hourlyWageInput.value = parsedWage;
            
            // 読み込んだ値のバリデーション
            const validationResult = this.validator.validateWage(parsedWage);
            if (validationResult.isValid) {
                this.app.setHourlyWage(validationResult.value);
                console.log('UIController: 保存された時給を読み込みました:', validationResult.value);
            } else {
                console.warn('UIController: 保存された時給が無効です:', parsedWage);
                this.elements.hourlyWageInput.value = '';
            }
        } else if (!result.success) {
            // エラーメッセージを表示（ただし、ユーザーエクスペリエンスを妨げないよう控えめに）
            console.warn('UIController: 設定の読み込みに失敗しました:', result.error);
            
            // ストレージエラーの場合はUIに通知
            if (result.error === 'storage_error' || result.error === 'storage_unavailable') {
                // エラーを表示（一時的に表示して自動的に消える）
                this.showTemporaryError(result.message || '設定の読み込みに失敗しました', 'storage');
            }
        }
        
        // 視覚化モード設定は WageCounterApp の loadVisualSettings メソッドで読み込まれる
    }
    
    /**
     * 一時的なエラーメッセージを表示する
     * @param {string} message - エラーメッセージ
     * @param {string} errorType - エラータイプ
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showTemporaryError(message, errorType = 'storage', duration = 3000) {
        this.showError(message, errorType);
        
        // 一定時間後にエラーを消す
        setTimeout(() => {
            this.clearError();
        }, duration);
    }

    /**
     * 初期UIの状態を設定する
     */
    initializeUIState() {
        // アプリケーションの現在の状態を取得
        const state = this.app.getState();
        
        // 初期状態では開始ボタンを無効化（時給が設定されていない場合）
        if (!this.elements.hourlyWageInput.value || parseFloat(this.elements.hourlyWageInput.value) <= 0) {
            this.elements.startStopBtn.disabled = true;
        } else {
            this.elements.startStopBtn.disabled = false;
        }
        
        // 初期状態のボタンクラス設定
        this.updateStartStopButton(state.isRunning);
        this.elements.resetBtn.disabled = state.isRunning;
        
        // 初期表示の更新
        this.updateDisplay(false); // アニメーションなしで初期表示
        
        // 状態監視を開始
        this.startStateMonitoring();
    }
    
    /**
     * アプリケーション状態の監視を開始する
     */
    startStateMonitoring() {
        // 前回の状態を保存
        this.previousState = this.app.getState();
        
        // 状態監視タイマー
        setInterval(() => {
            const currentState = this.app.getState();
            
            // 状態が変化した場合のみ処理
            if (this.hasStateChanged(currentState, this.previousState)) {
                this.handleStateChange(currentState, this.previousState);
                this.previousState = {...currentState};
            }
            
            // 状態の同期を確認
            if (!this.app.isStateSynchronized()) {
                console.warn('UIController: アプリケーション状態の同期が取れていません');
                this.synchronizeState();
            }
        }, 500); // 500msごとに状態を確認
    }
    
    /**
     * 状態が変化したかどうかを確認する
     * @param {Object} newState - 新しい状態
     * @param {Object} oldState - 以前の状態
     * @returns {boolean} 状態が変化したかどうか
     */
    hasStateChanged(newState, oldState) {
        return (
            newState.isRunning !== oldState.isRunning ||
            newState.hourlyWage !== oldState.hourlyWage ||
            newState.currentEarnings !== oldState.currentEarnings ||
            newState.elapsedSeconds !== oldState.elapsedSeconds
        );
    }
    
    /**
     * アプリケーション状態とUIを同期する
     */
    synchronizeState() {
        const state = this.app.getState();
        
        // UIを現在の状態に合わせて更新
        this.updateStartStopButton(state.isRunning);
        this.elements.resetBtn.disabled = state.isRunning;
        this.updateDisplay(false); // アニメーションなしで更新
        
        console.log('UIController: アプリケーション状態とUIを同期しました');
    }

    /**
     * 表示更新タイマーを開始する
     */
    startDisplayUpdateTimer() {
        // 既存のタイマーをクリア
        if (this.displayUpdateIntervalId) {
            clearInterval(this.displayUpdateIntervalId);
        }
        
        // 前回の更新時刻を記録
        this.lastUpdateTime = Date.now();
        
        // 最適化された更新関数を作成
        this.optimizedUpdateDisplay = PerformanceOptimizer.optimizeDOMUpdates((useAnimation) => {
            const state = this.app.getState();
            if (state.isRunning) {
                this.updateDisplay(useAnimation);
            }
        }, 100); // 最小更新間隔を100msに設定
        
        // 定期的な表示更新（アプリが動作中の場合のみ）
        this.displayUpdateIntervalId = setInterval(() => {
            const state = this.app.getState();
            const currentTime = Date.now();
            
            if (state.isRunning) {
                // 更新間隔に基づいてアニメーション効果を調整
                // 頻繁な更新ではアニメーションを省略し、一定間隔でのみアニメーション効果を適用
                const timeSinceLastUpdate = currentTime - this.lastUpdateTime;
                const useAnimation = timeSinceLastUpdate >= 1000; // 1秒以上経過していればアニメーション効果を使用
                
                // 最適化された更新関数を使用
                this.optimizedUpdateDisplay(useAnimation);
                
                // アニメーション効果を使用した場合は最終更新時刻を更新
                if (useAnimation) {
                    this.lastUpdateTime = currentTime;
                }
            }
        }, this.updateInterval);
    }
    
    /**
     * アニメーションキャッシュをクリアする（メモリ最適化用）
     */
    clearAnimationCache() {
        // アニメーション関連の一時オブジェクトをクリア
        this.lastUpdateTime = Date.now();
        
        // 不要なクラスを削除
        if (this.elements.currentEarnings) {
            this.elements.currentEarnings.classList.remove('value-changed');
        }
        
        if (this.elements.progressBar) {
            this.elements.progressBar.classList.remove('progress-updating');
        }
        
        // Visualizerのアニメーションキャッシュもクリア
        if (this.visualizer && typeof this.visualizer.clearAnimationCache === 'function') {
            this.visualizer.clearAnimationCache();
        }
    }
    
    /**
     * 最適化モードを設定する（メモリ使用量が多い場合に呼び出される）
     * @param {boolean} enabled - 最適化モードを有効にするかどうか
     */
    setOptimizedMode(enabled) {
        if (enabled) {
            // 更新間隔を長くする
            this.updateInterval = 200; // 200msに延長
            
            // 表示更新タイマーを再起動
            this.startDisplayUpdateTimer();
            
            // アニメーション効果を最小限に
            if (this.visualizer) {
                this.visualizer.setMinimalAnimations(true);
            }
            
            console.log('UIController: 最適化モードを有効化しました');
        } else {
            // 通常モードに戻す
            this.updateInterval = 100; // 通常の100msに戻す
            
            // 表示更新タイマーを再起動
            this.startDisplayUpdateTimer();
            
            // 通常のアニメーション効果に戻す
            if (this.visualizer) {
                this.visualizer.setMinimalAnimations(false);
            }
            
            console.log('UIController: 通常モードに戻しました');
        }
    }

    /**
     * 表示を更新する
     * @param {boolean} animate - アニメーション効果を使用するかどうか
     */
    updateDisplay(animate = true) {
        const state = this.app.getState();
        const prevEarnings = this.elements.currentEarnings.textContent;
        
        // 収入表示の更新（通貨フォーマッターを使用）
        const formattedEarnings = this.currencyFormatter.formatSimple(state.currentEarnings);
        
        // アニメーション効果を使用する場合
        if (animate && prevEarnings !== formattedEarnings) {
            this.animateValueChange(this.elements.currentEarnings, formattedEarnings);
        } else {
            this.elements.currentEarnings.textContent = formattedEarnings;
        }
        
        // 経過時間表示の更新
        this.elements.elapsedTime.textContent = state.formattedElapsedTime;
        
        // Visualizerを使用してプログレスバーを更新
        if (this.visualizer && this.visualizer.isInitialized) {
            // 時給が変更された場合は目標収入も更新
            if (state.hourlyWage > 0 && this.visualizer.maxEarnings !== state.hourlyWage) {
                this.visualizer.setMaxEarnings(state.hourlyWage);
            }
            
            // 収入進捗を更新
            this.visualizer.updateProgress(state.currentEarnings, animate);
        }
        
        // 収入表示にツールチップで詳細表示を追加
        if (state.currentEarnings > 0) {
            this.elements.currentEarnings.title = `詳細: ${this.currencyFormatter.formatDetailed(state.currentEarnings)}`;
        } else {
            this.elements.currentEarnings.title = '';
        }
        
        // アクセシビリティのためのARIA属性更新
        this.updateAriaAttributes(state);
    }
    
    /**
     * 値の変更をアニメーション効果で表示する
     * @param {HTMLElement} element - 対象要素
     * @param {string} newValue - 新しい値
     */
    animateValueChange(element, newValue) {
        // 値が変わったことを視覚的に示すためのクラスを追加
        element.classList.add('value-changed');
        
        // 値を更新
        element.textContent = newValue;
        
        // アニメーション効果を適用（少し遅延させて変化を認識しやすくする）
        setTimeout(() => {
            element.classList.remove('value-changed');
        }, 300);
    }
    
    /**
     * アクセシビリティのためのARIA属性を更新する
     * @param {Object} state - アプリケーションの状態
     */
    updateAriaAttributes(state) {
        // 収入表示のARIA属性
        this.elements.currentEarnings.setAttribute('aria-live', 'polite');
        this.elements.currentEarnings.setAttribute('aria-label', `現在の累積収入: ${this.currencyFormatter.formatDetailed(state.currentEarnings)}円`);
        
        // 経過時間表示のARIA属性
        this.elements.elapsedTime.setAttribute('aria-live', 'polite');
        this.elements.elapsedTime.setAttribute('aria-label', `経過時間: ${state.formattedElapsedTime}`);
        
        // プログレスバーのARIA属性
        if (this.elements.progressBar) {
            const oneHourEarnings = state.hourlyWage;
            const progressPercentage = oneHourEarnings > 0 ? Math.min((state.currentEarnings / oneHourEarnings) * 100, 100) : 0;
            
            this.elements.progressBar.setAttribute('aria-valuenow', Math.round(progressPercentage));
            this.elements.progressBar.setAttribute('aria-valuemin', '0');
            this.elements.progressBar.setAttribute('aria-valuemax', '100');
            this.elements.progressBar.setAttribute('aria-label', `1時間あたりの収入に対する進捗: ${Math.round(progressPercentage)}%`);
        }
        
        // ボタンの状態に応じたARIA属性の更新
        if (this.elements.startStopBtn) {
            // 動作状態に応じたアクセシブルな説明
            const startStopLabel = state.isRunning ? 
                '時給カウンターを停止する' : 
                '時給カウンターを開始する';
            this.elements.startStopBtn.setAttribute('aria-label', startStopLabel);
            
            // 無効状態の理由を説明
            if (this.elements.startStopBtn.disabled) {
                this.elements.startStopBtn.setAttribute('aria-disabled', 'true');
                this.elements.startStopBtn.setAttribute('aria-describedby', 'wage-error');
            } else {
                this.elements.startStopBtn.removeAttribute('aria-disabled');
                this.elements.startStopBtn.removeAttribute('aria-describedby');
            }
        }
        
        // リセットボタンの状態に応じたARIA属性の更新
        if (this.elements.resetBtn) {
            this.elements.resetBtn.setAttribute('aria-label', '時給カウンターをリセットする');
            
            if (this.elements.resetBtn.disabled) {
                this.elements.resetBtn.setAttribute('aria-disabled', 'true');
                this.elements.resetBtn.setAttribute('aria-describedby', 'reset-disabled-description');
            } else {
                this.elements.resetBtn.removeAttribute('aria-disabled');
                this.elements.resetBtn.removeAttribute('aria-describedby');
            }
        }
        
        // 視覚化タブのARIA属性の更新
        const barViewBtn = document.getElementById('bar-view-btn');
        const circleViewBtn = document.getElementById('circle-view-btn');
        
        if (barViewBtn && circleViewBtn) {
            // 現在選択されているタブを設定
            const isBarActive = barViewBtn.classList.contains('active');
            barViewBtn.setAttribute('aria-selected', isBarActive ? 'true' : 'false');
            circleViewBtn.setAttribute('aria-selected', !isBarActive ? 'true' : 'false');
            
            // タブパネルの関連付け
            const progressContainer = document.getElementById('progress-container');
            const circleChartContainer = document.getElementById('circle-chart-container');
            
            if (progressContainer && circleChartContainer) {
                progressContainer.setAttribute('aria-hidden', isBarActive ? 'false' : 'true');
                circleChartContainer.setAttribute('aria-hidden', !isBarActive ? 'false' : 'true');
            }
        }
    }

    /**
     * エラー状態を表示する
     * @param {string} message - エラーメッセージ
     * @param {string} errorType - エラータイプ（'wage', 'timer', 'storage'）
     */
    showError(message, errorType = 'wage') {
        if (this.elements.wageError) {
            this.validator.showError(this.elements.wageError, message);
            
            // エラータイプに応じたクラスを追加
            this.elements.wageError.className = 'error-message';
            this.elements.wageError.classList.add(`error-${errorType}`);
            
            // エラー状態に応じてUIを調整
            this.updateUIForErrorState(errorType);
        }
    }

    /**
     * エラー表示をクリアする
     */
    clearError() {
        if (this.elements.wageError) {
            this.validator.hideError(this.elements.wageError);
            
            // エラー状態からUIを復帰
            this.restoreUIFromErrorState();
        }
    }
    
    /**
     * エラー状態に応じてUIを調整する
     * @param {string} errorType - エラータイプ
     */
    updateUIForErrorState(errorType) {
        switch (errorType) {
            case 'wage':
                // 時給入力エラー時は開始ボタンを無効化
                this.elements.startStopBtn.disabled = true;
                this.elements.hourlyWageInput.classList.add('input-error');
                break;
                
            case 'timer':
                // タイマーエラー時は警告表示
                this.elements.elapsedTime.classList.add('time-error');
                break;
                
            case 'storage':
                // ストレージエラー時は通知のみ（機能は継続）
                console.warn('UIController: ストレージエラーが発生しましたが、アプリは継続動作します');
                
                // ストレージエラー表示用のクラスを追加
                if (this.elements.wageError) {
                    this.elements.wageError.classList.add('storage-error');
                }
                
                // ストレージが利用できない場合は、その旨をユーザーに通知
                const storageManager = this.app.storageManager;
                if (storageManager && !storageManager.isStorageAvailable()) {
                    // 設定保存機能が無効であることを示すインジケーターを表示
                    this.showStorageUnavailableIndicator();
                }
                break;
                
            default:
                // その他のエラー
                break;
        }
    }
    
    /**
     * ストレージ利用不可のインジケーターを表示する
     */
    showStorageUnavailableIndicator() {
        // 既存のインジケーターを確認
        let indicator = document.getElementById('storage-unavailable-indicator');
        
        if (!indicator) {
            // インジケーターを作成
            indicator = document.createElement('div');
            indicator.id = 'storage-unavailable-indicator';
            indicator.className = 'storage-indicator';
            indicator.innerHTML = '<span class="icon">⚠️</span> 設定の保存機能は現在利用できません';
            indicator.title = 'ブラウザの設定またはプライベートモードにより、設定の保存機能が利用できません。アプリは引き続き使用できますが、設定は保存されません。';
            
            // スタイルを設定
            indicator.style.backgroundColor = 'rgba(255, 193, 7, 0.2)';
            indicator.style.color = '#856404';
            indicator.style.padding = '5px 10px';
            indicator.style.borderRadius = '4px';
            indicator.style.fontSize = '0.8rem';
            indicator.style.marginTop = '5px';
            indicator.style.display = 'flex';
            indicator.style.alignItems = 'center';
            indicator.style.justifyContent = 'center';
            
            // アイコンのスタイル
            const iconSpan = indicator.querySelector('.icon');
            if (iconSpan) {
                iconSpan.style.marginRight = '5px';
            }
            
            // 時給入力セクションの後に追加
            const wageInputSection = document.querySelector('.wage-input-section');
            if (wageInputSection) {
                wageInputSection.appendChild(indicator);
            } else {
                // フォールバックとして本体に追加
                document.body.appendChild(indicator);
            }
        }
    }
    
    /**
     * ストレージ利用不可のインジケーターを非表示にする
     */
    hideStorageUnavailableIndicator() {
        const indicator = document.getElementById('storage-unavailable-indicator');
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }
    
    /**
     * エラー状態からUIを復帰する
     */
    restoreUIFromErrorState() {
        // 各要素のエラー状態をクリア
        this.elements.hourlyWageInput.classList.remove('input-error');
        this.elements.elapsedTime.classList.remove('time-error');
        
        if (this.elements.wageError) {
            this.elements.wageError.classList.remove('storage-error');
        }
        
        // 時給が有効な場合は開始ボタンを有効化
        const validationResult = this.validator.validateWage(this.elements.hourlyWageInput.value);
        if (validationResult.isValid) {
            this.elements.startStopBtn.disabled = false;
        }
        
        // ストレージが利用可能になった場合はインジケーターを非表示
        const storageManager = this.app.storageManager;
        if (storageManager && storageManager.isStorageAvailable()) {
            this.hideStorageUnavailableIndicator();
        }
    }
    
    /**
     * アプリケーション状態の変更を処理する
     * @param {Object} newState - 新しい状態
     * @param {Object} oldState - 以前の状態
     */
    handleStateChange(newState, oldState) {
        // 状態変化に応じてUIを更新
        
        // 動作状態の変化
        if (newState.isRunning !== oldState.isRunning) {
            this.updateStartStopButton(newState.isRunning);
            this.elements.resetBtn.disabled = newState.isRunning;
        }
        
        // 時給の変化
        if (newState.hourlyWage !== oldState.hourlyWage) {
            // 時給表示の更新
            if (this.elements.hourlyWageInput.value !== String(newState.hourlyWage)) {
                this.elements.hourlyWageInput.value = newState.hourlyWage;
            }
        }
        
        // 収入の変化
        if (newState.currentEarnings !== oldState.currentEarnings) {
            const formattedEarnings = this.currencyFormatter.formatSimple(newState.currentEarnings);
            const currentDisplayedEarnings = this.elements.currentEarnings.textContent;
            
            if (formattedEarnings !== currentDisplayedEarnings) {
                this.animateValueChange(this.elements.currentEarnings, formattedEarnings);
            }
        }
        
        // 経過時間の変化
        if (newState.elapsedSeconds !== oldState.elapsedSeconds) {
            this.elements.elapsedTime.textContent = newState.formattedElapsedTime;
        }
    }

    /**
     * 表示更新間隔を設定する
     * @param {number} interval - 更新間隔（ミリ秒）
     */
    setUpdateInterval(interval) {
        if (typeof interval === 'number' && interval > 0) {
            this.updateInterval = interval;
            this.startDisplayUpdateTimer(); // タイマーを再起動
        }
    }

    /**
     * UIControllerを破棄する（クリーンアップ）
     */
    destroy() {
        // タイマーをクリア
        if (this.displayUpdateIntervalId) {
            clearInterval(this.displayUpdateIntervalId);
            this.displayUpdateIntervalId = null;
        }
        
        // Visualizerを破棄
        if (this.visualizer) {
            this.visualizer.destroy();
            this.visualizer = null;
        }
        
        // イベントリスナーを削除（メモリリーク防止）
        if (this.isInitialized) {
            this.elements.hourlyWageInput.removeEventListener('input', this.handleWageInput);
            this.elements.hourlyWageInput.removeEventListener('blur', this.handleWageInputBlur);
            this.elements.startStopBtn.removeEventListener('click', this.handleStartStop);
            this.elements.resetBtn.removeEventListener('click', this.handleReset);
        }
        
        console.log('UIController: 破棄されました');
    }
}