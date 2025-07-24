/**
 * 入力バリデーション機能のテスト
 * ブラウザのコンソールで実行可能
 */

function runValidationTests() {
    const validator = new InputValidator();
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
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message} - Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
        }
    }

    console.log('=== 入力バリデーションテスト開始 ===');

    // 有効な入力のテスト
    test('有効な整数時給 (1000)', () => {
        const result = validator.validateWage('1000');
        assertEqual(result.isValid, true, '1000円は有効');
        assertEqual(result.value, 1000, '値が正しく変換される');
        assertEqual(result.error, null, 'エラーなし');
    });

    test('有効な小数時給 (1500.50)', () => {
        const result = validator.validateWage('1500.50');
        assertEqual(result.isValid, true, '1500.50円は有効');
        assertEqual(result.value, 1500.50, '小数値が正しく変換される');
        assertEqual(result.error, null, 'エラーなし');
    });

    test('境界値テスト - 最小値 (0)', () => {
        const result = validator.validateWage('0');
        assertEqual(result.isValid, true, '0円は有効');
        assertEqual(result.value, 0, '最小値が正しく処理される');
    });

    test('境界値テスト - 最大値 (1000000)', () => {
        const result = validator.validateWage('1000000');
        assertEqual(result.isValid, true, '1000000円は有効');
        assertEqual(result.value, 1000000, '最大値が正しく処理される');
    });

    // 無効な入力のテスト
    test('空文字入力', () => {
        const result = validator.validateWage('');
        assertEqual(result.isValid, false, '空文字は無効');
        assertEqual(result.value, null, '値はnull');
        assertEqual(result.error, '時給を入力してください', '適切なエラーメッセージ');
    });

    test('null入力', () => {
        const result = validator.validateWage(null);
        assertEqual(result.isValid, false, 'nullは無効');
        assertEqual(result.value, null, '値はnull');
    });

    test('非数値入力 (abc)', () => {
        const result = validator.validateWage('abc');
        assertEqual(result.isValid, false, '文字列は無効');
        assertEqual(result.error, '有効な数値を入力してください', '適切なエラーメッセージ');
    });

    test('負の値 (-100)', () => {
        const result = validator.validateWage('-100');
        assertEqual(result.isValid, false, '負の値は無効');
        assertEqual(result.error, '時給は0円以上で入力してください', '適切なエラーメッセージ');
    });

    test('上限超過 (1000001)', () => {
        const result = validator.validateWage('1000001');
        assertEqual(result.isValid, false, '上限超過は無効');
        assertEqual(result.error, '時給は1,000,000円以下で入力してください', '適切なエラーメッセージ');
    });

    test('小数点以下3桁 (1000.123)', () => {
        const result = validator.validateWage('1000.123');
        assertEqual(result.isValid, false, '小数点以下3桁は無効');
        assertEqual(result.error, '時給は小数点以下2桁まで入力してください', '適切なエラーメッセージ');
    });

    // エラー表示機能のテスト
    test('エラー表示機能', () => {
        // テスト用のDOM要素を作成
        const errorElement = document.createElement('div');
        
        validator.showError(errorElement, 'テストエラー');
        assertEqual(errorElement.textContent, 'テストエラー', 'エラーメッセージが設定される');
        assertEqual(errorElement.style.display, 'block', 'エラー要素が表示される');
        assertEqual(errorElement.getAttribute('aria-live'), 'polite', 'アクセシビリティ属性が設定される');
        
        validator.hideError(errorElement);
        assertEqual(errorElement.textContent, '', 'エラーメッセージがクリアされる');
        assertEqual(errorElement.style.display, 'none', 'エラー要素が非表示になる');
        assertEqual(errorElement.getAttribute('aria-live'), null, 'アクセシビリティ属性が削除される');
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

// テストを実行（ブラウザで利用可能な場合）
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // テスト実行用のボタンを追加（開発時のみ）
        if (window.location.search.includes('test=true')) {
            const testButton = document.createElement('button');
            testButton.textContent = 'バリデーションテスト実行';
            testButton.onclick = runValidationTests;
            testButton.style.position = 'fixed';
            testButton.style.top = '10px';
            testButton.style.right = '10px';
            testButton.style.zIndex = '9999';
            document.body.appendChild(testButton);
        }
    });
}