/**
 * アプリケーション検証スクリプト
 * 最終統合とポリッシュのための動作確認を行う
 */

// 検証結果を表示する要素
let verificationResultsElement = null;

/**
 * 検証結果を表示する
 * @param {string} message - 表示するメッセージ
 * @param {boolean} isSuccess - 成功かどうか
 */
function showVerificationResult(message, isSuccess = true) {
    if (!verificationResultsElement) {
        verificationResultsElement = document.createElement('div');
        verificationResultsElement.id = 'verification-results';
        verificationResultsElement.style.position = 'fixed';
        verificationResultsElement.style.top = '10px';
        verificationResultsElement.style.right = '10px';
        verificationResultsElement.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        verificationResultsElement.style.padding = '10px';
        verificationResultsElement.style.borderRadius = '5px';
        verificationResultsElement.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        verificationResultsElement.style.maxWidth = '300px';
        verificationResultsElement.style.maxHeight = '80vh';
        verificationResultsElement.style.overflowY = 'auto';
        verificationResultsElement.style.zIndex = '1000';
        document.body.appendChild(verificationResultsElement);
    }

    const resultElement = document.createElement('div');
    resultElement.style.color = isSuccess ? '#4CAF50' : '#f44336';
    resultElement.style.marginBottom = '5px';
    resultElement.style.fontSize = '0.9rem';
    resultElement.textContent = message;
    verificationResultsElement.appendChild(resultElement);
}

/**
 * アプリケーションの基本機能を検証する
 */
function verifyBasicFunctionality() {
    try {
        // アプリケーションが初期化されているか確認
        if (!window.wageCounterApp || !window.wageCounterApp.isInitialized) {
            showVerificationResult('❌ アプリケーションが正しく初期化されていません', false);
            return;
        }

        showVerificationResult('✅ アプリケーションが正しく初期化されています');

        // 時給設定機能の検証
        const testWage = 1500;
        window.wageCounterApp.setHourlyWage(testWage);
        const currentWage = window.wageCounterApp.wageCounter.getHourlyWage();
        
        if (currentWage === testWage) {
            showVerificationResult(`✅ 時給設定機能が正常に動作しています (${testWage}円)`);
        } else {
            showVerificationResult(`❌ 時給設定機能に問題があります (期待値: ${testWage}, 実際: ${currentWage})`, false);
        }

        // 秒単位収入計算の検証
        const perSecondWage = window.wageCounterApp.wageCounter.getPerSecondWage();
        const expectedPerSecondWage = testWage / 3600;
        
        if (Math.abs(perSecondWage - expectedPerSecondWage) < 0.0001) {
            showVerificationResult(`✅ 秒単位収入計算が正常に動作しています (${perSecondWage.toFixed(6)}円/秒)`);
        } else {
            showVerificationResult(`❌ 秒単位収入計算に問題があります (期待値: ${expectedPerSecondWage}, 実際: ${perSecondWage})`, false);
        }

        // 通貨フォーマットの検証
        const formatter = window.wageCounterApp.getCurrencyFormatter();
        const formattedAmount = formatter.format(12345.67, true);
        
        if (formattedAmount === '¥12,345.67') {
            showVerificationResult('✅ 通貨フォーマット機能が正常に動作しています');
        } else {
            showVerificationResult(`❌ 通貨フォーマット機能に問題があります (期待値: ¥12,345.67, 実際: ${formattedAmount})`, false);
        }

        // LocalStorage機能の検証
        const storageManager = window.wageCounterApp.getStorageManager();
        const testKey = 'verification_test';
        const testValue = 'test_value_' + Date.now();
        
        const saveResult = storageManager.saveSettings(testKey, testValue);
        const loadResult = storageManager.loadSettings(testKey);
        
        if (saveResult.success && loadResult.success && loadResult.value === testValue) {
            showVerificationResult('✅ データ永続化機能が正常に動作しています');
        } else {
            showVerificationResult('❌ データ永続化機能に問題があります', false);
        }
        
        // クリーンアップ
        storageManager.removeSettings(testKey);
        
        showVerificationResult('✅ 基本機能の検証が完了しました');
    } catch (e) {
        showVerificationResult(`❌ 検証中にエラーが発生しました: ${e.message}`, false);
        console.error('検証エラー:', e);
    }
}

/**
 * UIコンポーネントを検証する
 */
function verifyUIComponents() {
    try {
        // 必要なUI要素が存在するか確認
        const requiredElements = [
            { id: 'hourly-wage', name: '時給入力フィールド' },
            { id: 'current-earnings', name: '累積収入表示' },
            { id: 'elapsed-time', name: '経過時間表示' },
            { id: 'start-stop-btn', name: '開始/停止ボタン' },
            { id: 'reset-btn', name: 'リセットボタン' },
            { id: 'progress-bar', name: 'プログレスバー' },
            { id: 'circle-chart-svg', name: '円グラフ' }
        ];
        
        let allElementsExist = true;
        
        requiredElements.forEach(element => {
            const domElement = document.getElementById(element.id);
            if (domElement) {
                showVerificationResult(`✅ ${element.name}が正しく配置されています`);
            } else {
                showVerificationResult(`❌ ${element.name}が見つかりません`, false);
                allElementsExist = false;
            }
        });
        
        if (allElementsExist) {
            showVerificationResult('✅ すべてのUI要素が正しく配置されています');
        }
        
        // レスポンシブデザインの検証
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta && viewportMeta.content.includes('width=device-width')) {
            showVerificationResult('✅ レスポンシブデザイン設定が正しく構成されています');
        } else {
            showVerificationResult('❌ レスポンシブデザイン設定に問題があります', false);
        }
        
        // アクセシビリティの検証
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            showVerificationResult('✅ スキップリンクが実装されています');
        } else {
            showVerificationResult('❌ スキップリンクが見つかりません', false);
        }
        
        const ariaLabels = document.querySelectorAll('[aria-label]');
        if (ariaLabels.length > 0) {
            showVerificationResult(`✅ ARIA属性が実装されています (${ariaLabels.length}箇所)`);
        } else {
            showVerificationResult('❌ ARIA属性が見つかりません', false);
        }
        
        showVerificationResult('✅ UIコンポーネントの検証が完了しました');
    } catch (e) {
        showVerificationResult(`❌ UI検証中にエラーが発生しました: ${e.message}`, false);
        console.error('UI検証エラー:', e);
    }
}

/**
 * パフォーマンス最適化を検証する
 */
function verifyPerformanceOptimization() {
    try {
        // パフォーマンス最適化コンポーネントが存在するか確認
        if (!window.performanceOptimizer) {
            showVerificationResult('❌ パフォーマンス最適化コンポーネントが見つかりません', false);
            return;
        }
        
        showVerificationResult('✅ パフォーマンス最適化コンポーネントが正しく初期化されています');
        
        // 可視性変更ハンドラーの検証
        if (typeof window.performanceOptimizer.handleVisibilityChange === 'function') {
            showVerificationResult('✅ ページ可視性変更ハンドラーが実装されています');
        } else {
            showVerificationResult('❌ ページ可視性変更ハンドラーが見つかりません', false);
        }
        
        // メモリ使用量モニタリングの検証
        if (typeof window.performanceOptimizer.checkMemoryUsage === 'function') {
            showVerificationResult('✅ メモリ使用量モニタリングが実装されています');
        } else {
            showVerificationResult('❌ メモリ使用量モニタリングが見つかりません', false);
        }
        
        // DOM更新最適化の検証
        if (typeof PerformanceOptimizer.optimizeDOMUpdates === 'function') {
            showVerificationResult('✅ DOM更新最適化機能が実装されています');
        } else {
            showVerificationResult('❌ DOM更新最適化機能が見つかりません', false);
        }
        
        showVerificationResult('✅ パフォーマンス最適化の検証が完了しました');
    } catch (e) {
        showVerificationResult(`❌ パフォーマンス検証中にエラーが発生しました: ${e.message}`, false);
        console.error('パフォーマンス検証エラー:', e);
    }
}

/**
 * アプリケーション全体の検証を実行する
 */
function verifyApplication() {
    showVerificationResult('🔍 アプリケーション検証を開始します...');
    
    // 基本機能の検証
    verifyBasicFunctionality();
    
    // UIコンポーネントの検証
    verifyUIComponents();
    
    // パフォーマンス最適化の検証
    verifyPerformanceOptimization();
    
    showVerificationResult('✅ アプリケーション検証が完了しました');
}

// テストモードの場合に検証ボタンを追加
if (window.location.search.includes('test=true')) {
    document.addEventListener('DOMContentLoaded', function() {
        const testControls = document.getElementById('test-controls');
        if (testControls) {
            const verifyButton = document.createElement('button');
            verifyButton.id = 'verify-application';
            verifyButton.className = 'control-btn primary';
            verifyButton.style.fontSize = '0.8rem';
            verifyButton.style.padding = '0.5rem';
            verifyButton.style.width = '100%';
            verifyButton.style.marginTop = '10px';
            verifyButton.style.backgroundColor = '#2196F3';
            verifyButton.textContent = 'アプリケーション検証実行';
            
            verifyButton.addEventListener('click', function() {
                verifyApplication();
            });
            
            testControls.appendChild(verifyButton);
        }
    });
}