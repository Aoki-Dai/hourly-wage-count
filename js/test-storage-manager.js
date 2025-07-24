/**
 * StorageManager のテスト
 */
function runStorageManagerTests() {
    console.log('StorageManager テストを実行中...');
    
    // テスト結果を表示するための要素
    const testResultsContainer = document.createElement('div');
    testResultsContainer.id = 'storage-manager-test-results';
    testResultsContainer.style.position = 'fixed';
    testResultsContainer.style.top = '10px';
    testResultsContainer.style.left = '10px';
    testResultsContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    testResultsContainer.style.padding = '10px';
    testResultsContainer.style.borderRadius = '5px';
    testResultsContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    testResultsContainer.style.maxWidth = '400px';
    testResultsContainer.style.maxHeight = '80vh';
    testResultsContainer.style.overflow = 'auto';
    testResultsContainer.style.zIndex = '9999';
    testResultsContainer.style.fontSize = '14px';
    testResultsContainer.style.fontFamily = 'monospace';
    
    document.body.appendChild(testResultsContainer);
    
    // テスト結果を追加する関数
    function addTestResult(name, passed, message = '') {
        const resultElement = document.createElement('div');
        resultElement.style.marginBottom = '5px';
        resultElement.style.padding = '5px';
        resultElement.style.borderLeft = `4px solid ${passed ? '#4CAF50' : '#f44336'}`;
        resultElement.style.backgroundColor = passed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
        
        resultElement.innerHTML = `
            <div style="font-weight: bold;">${passed ? '✅' : '❌'} ${name}</div>
            ${message ? `<div style="font-size: 12px; margin-top: 3px;">${message}</div>` : ''}
        `;
        
        testResultsContainer.appendChild(resultElement);
    }
    
    // テスト終了時の処理
    function finishTests() {
        const closeButton = document.createElement('button');
        closeButton.textContent = 'テスト結果を閉じる';
        closeButton.style.marginTop = '10px';
        closeButton.style.padding = '5px 10px';
        closeButton.style.backgroundColor = '#2196F3';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(testResultsContainer);
        });
        
        testResultsContainer.appendChild(closeButton);
    }
    
    // StorageManager インスタンスを作成
    const storageManager = new StorageManager();
    
    // テスト1: StorageManager が正しく初期化されるか
    try {
        addTestResult(
            'StorageManager 初期化',
            storageManager instanceof StorageManager,
            'StorageManager インスタンスが正しく作成されました'
        );
    } catch (e) {
        addTestResult('StorageManager 初期化', false, `エラー: ${e.message}`);
    }
    
    // テスト2: LocalStorage の利用可否を正しく検出するか
    try {
        const isAvailable = storageManager.isStorageAvailable();
        addTestResult(
            'LocalStorage 利用可否検出',
            true,
            `LocalStorage は${isAvailable ? '利用可能' : '利用不可'}です`
        );
    } catch (e) {
        addTestResult('LocalStorage 利用可否検出', false, `エラー: ${e.message}`);
    }
    
    // テスト3: 設定の保存と読み込み
    try {
        const testKey = 'test_key';
        const testValue = 'test_value_' + Date.now();
        
        // 設定を保存
        const saveResult = storageManager.saveSettings(testKey, testValue);
        
        // 保存結果を確認
        if (saveResult.success) {
            // 設定を読み込み
            const loadResult = storageManager.loadSettings(testKey);
            
            // 読み込み結果を確認
            if (loadResult.success && loadResult.value === testValue) {
                addTestResult(
                    '設定の保存と読み込み',
                    true,
                    `値 "${testValue}" が正しく保存・読み込みされました`
                );
            } else {
                addTestResult(
                    '設定の保存と読み込み',
                    false,
                    `読み込まれた値 "${loadResult.value}" が期待値 "${testValue}" と一致しません`
                );
            }
        } else {
            addTestResult(
                '設定の保存と読み込み',
                false,
                `設定の保存に失敗しました: ${saveResult.error}`
            );
        }
        
        // テスト用のキーを削除
        storageManager.removeSettings(testKey);
    } catch (e) {
        addTestResult('設定の保存と読み込み', false, `エラー: ${e.message}`);
    }
    
    // テスト4: オブジェクトの保存と読み込み
    try {
        const testKey = 'test_object';
        const testObject = {
            name: 'テストオブジェクト',
            value: Math.random(),
            timestamp: Date.now(),
            nested: {
                key: 'ネストされた値'
            }
        };
        
        // オブジェクトを保存
        const saveResult = storageManager.saveSettings(testKey, testObject);
        
        // 保存結果を確認
        if (saveResult.success) {
            // オブジェクトを読み込み
            const loadResult = storageManager.loadSettings(testKey);
            
            // 読み込み結果を確認
            if (
                loadResult.success && 
                loadResult.value && 
                loadResult.value.name === testObject.name &&
                loadResult.value.value === testObject.value &&
                loadResult.value.timestamp === testObject.timestamp &&
                loadResult.value.nested.key === testObject.nested.key
            ) {
                addTestResult(
                    'オブジェクトの保存と読み込み',
                    true,
                    'オブジェクトが正しく保存・読み込みされました'
                );
            } else {
                addTestResult(
                    'オブジェクトの保存と読み込み',
                    false,
                    '読み込まれたオブジェクトが期待値と一致しません'
                );
            }
        } else {
            addTestResult(
                'オブジェクトの保存と読み込み',
                false,
                `オブジェクトの保存に失敗しました: ${saveResult.error}`
            );
        }
        
        // テスト用のキーを削除
        storageManager.removeSettings(testKey);
    } catch (e) {
        addTestResult('オブジェクトの保存と読み込み', false, `エラー: ${e.message}`);
    }
    
    // テスト5: 設定の削除
    try {
        const testKey = 'test_remove';
        const testValue = 'delete_me';
        
        // 設定を保存
        storageManager.saveSettings(testKey, testValue);
        
        // 設定が存在することを確認
        const existsBeforeRemove = storageManager.hasSettings(testKey);
        
        // 設定を削除
        const removeResult = storageManager.removeSettings(testKey);
        
        // 削除後に設定が存在しないことを確認
        const existsAfterRemove = storageManager.hasSettings(testKey);
        
        if (removeResult.success && existsBeforeRemove && !existsAfterRemove) {
            addTestResult(
                '設定の削除',
                true,
                '設定が正しく削除されました'
            );
        } else {
            addTestResult(
                '設定の削除',
                false,
                `設定の削除に失敗しました: 削除前=${existsBeforeRemove}, 削除後=${existsAfterRemove}`
            );
        }
    } catch (e) {
        addTestResult('設定の削除', false, `エラー: ${e.message}`);
    }
    
    // テスト6: デフォルト値の処理
    try {
        const testKey = 'non_existent_key';
        const defaultValue = 'default_value';
        
        // 存在しないキーを読み込み（デフォルト値を指定）
        const loadResult = storageManager.loadSettings(testKey, defaultValue);
        
        if (loadResult.success && loadResult.value === defaultValue) {
            addTestResult(
                'デフォルト値の処理',
                true,
                `存在しないキーに対してデフォルト値 "${defaultValue}" が正しく返されました`
            );
        } else {
            addTestResult(
                'デフォルト値の処理',
                false,
                `デフォルト値の処理に失敗しました: ${loadResult.value} !== ${defaultValue}`
            );
        }
    } catch (e) {
        addTestResult('デフォルト値の処理', false, `エラー: ${e.message}`);
    }
    
    // テスト7: 全設定のクリア
    try {
        // テスト用のキーをいくつか保存
        const testKeys = ['clear_test_1', 'clear_test_2', 'clear_test_3'];
        testKeys.forEach(key => {
            storageManager.saveSettings(key, 'clear_me');
        });
        
        // すべての設定をクリア
        const clearResult = storageManager.clearAllSettings();
        
        // クリア後にキーが存在しないことを確認
        const allCleared = testKeys.every(key => !storageManager.hasSettings(key));
        
        if (clearResult.success && allCleared) {
            addTestResult(
                '全設定のクリア',
                true,
                'すべての設定が正しくクリアされました'
            );
        } else {
            addTestResult(
                '全設定のクリア',
                false,
                '設定のクリアに失敗しました'
            );
        }
    } catch (e) {
        addTestResult('全設定のクリア', false, `エラー: ${e.message}`);
    }
    
    // テスト8: 利用可能容量の確認
    try {
        const availableSpace = storageManager.getAvailableSpace();
        
        addTestResult(
            '利用可能容量の確認',
            true,
            `利用可能な容量: 約 ${Math.round(availableSpace / 1024)} KB`
        );
    } catch (e) {
        addTestResult('利用可能容量の確認', false, `エラー: ${e.message}`);
    }
    
    // テスト終了
    finishTests();
    console.log('StorageManager テストが完了しました');
}