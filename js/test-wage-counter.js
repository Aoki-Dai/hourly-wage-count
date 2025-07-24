/**
 * WageCounter クラスのテスト
 * 秒単位収入計算機能のテスト
 */

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

// テストを実行（ブラウザで利用可能な場合）
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // テスト実行用のボタンを追加（開発時のみ）
        if (window.location.search.includes('test=true')) {
            const testButton = document.createElement('button');
            testButton.textContent = 'WageCounterテスト実行';
            testButton.onclick = runWageCounterTests;
            testButton.style.position = 'fixed';
            testButton.style.top = '50px';
            testButton.style.right = '10px';
            testButton.style.zIndex = '9999';
            document.body.appendChild(testButton);
        }
    });
}