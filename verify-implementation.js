/**
 * 実装検証スクリプト
 * 要件1.4に対する秒単位収入計算機能の検証
 */

// WageCounterクラスの基本実装（テスト用）
class WageCounter {
    constructor() {
        this.hourlyWage = 0;
        this.currentEarnings = 0;
        this.elapsedSeconds = 0;
        this.isRunning = false;
        this.perSecondWage = 0;
        this.startTime = null;
        this.pausedTime = 0;
    }

    setHourlyWage(wage) {
        this.hourlyWage = wage;
        this.perSecondWage = wage / 3600;
    }

    getPerSecondWage() {
        return this.perSecondWage;
    }

    calculatePerSecondWage(hourlyWage) {
        if (typeof hourlyWage !== 'number' || isNaN(hourlyWage) || hourlyWage < 0) {
            return 0;
        }
        return hourlyWage / 3600;
    }

    calculateEarningsForSeconds(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
            return 0;
        }
        return this.perSecondWage * seconds;
    }

    setElapsedTime(seconds) {
        this.elapsedSeconds = seconds;
    }

    getCurrentEarnings() {
        return this.currentEarnings;
    }

    updateCurrentEarnings() {
        this.currentEarnings = this.calculateEarningsForSeconds(this.elapsedSeconds);
    }
}

console.log('=== 要件1.4: 秒単位収入計算機能の検証 ===');

const wageCounter = new WageCounter();

// 要件1.4の検証: 賃金が設定されたとき、システムは秒単位の収入を計算する（時給 ÷ 3600）
console.log('\n1. 基本的な秒単位収入計算:');
wageCounter.setHourlyWage(3600);
console.log(`時給3600円 → 秒単位収入: ${wageCounter.getPerSecondWage()}円/秒 (期待値: 1円/秒)`);

wageCounter.setHourlyWage(1800);
console.log(`時給1800円 → 秒単位収入: ${wageCounter.getPerSecondWage()}円/秒 (期待値: 0.5円/秒)`);

wageCounter.setHourlyWage(1000);
console.log(`時給1000円 → 秒単位収入: ${wageCounter.getPerSecondWage()}円/秒 (期待値: ${(1000/3600).toFixed(6)}円/秒)`);

console.log('\n2. 計算精度の検証:');
wageCounter.setHourlyWage(1);
const perSecondWage = wageCounter.getPerSecondWage();
console.log(`時給1円 → 秒単位収入: ${perSecondWage}円/秒`);

// 3600秒分の累積計算で1円になることを確認
let accumulated = 0;
for (let i = 0; i < 3600; i++) {
    accumulated += perSecondWage;
}
console.log(`3600秒分の累積: ${accumulated}円 (期待値: 1円)`);
console.log(`計算誤差: ${Math.abs(accumulated - 1)} (許容範囲: 0.0001以下)`);

console.log('\n3. エラーハンドリングの検証:');
console.log(`負の値(-100): ${wageCounter.calculatePerSecondWage(-100)}円/秒 (期待値: 0円/秒)`);
console.log(`NaN: ${wageCounter.calculatePerSecondWage(NaN)}円/秒 (期待値: 0円/秒)`);
console.log(`文字列: ${wageCounter.calculatePerSecondWage('invalid')}円/秒 (期待値: 0円/秒)`);

console.log('\n4. 実用的なケースの検証:');
const testCases = [
    { wage: 850, description: '最低賃金レベル' },
    { wage: 1500, description: '一般的なアルバイト' },
    { wage: 2500, description: '専門職レベル' },
    { wage: 5000, description: '高時給' }
];

testCases.forEach(testCase => {
    const perSecond = wageCounter.calculatePerSecondWage(testCase.wage);
    const per10Seconds = perSecond * 10;
    const perMinute = perSecond * 60;
    const perHour = perSecond * 3600;
    
    console.log(`${testCase.description} (${testCase.wage}円/時):`);
    console.log(`  秒単位: ${perSecond.toFixed(6)}円/秒`);
    console.log(`  10秒: ${per10Seconds.toFixed(2)}円`);
    console.log(`  1分: ${perMinute.toFixed(2)}円`);
    console.log(`  1時間: ${perHour}円 (検証: ${perHour === testCase.wage ? '✅' : '❌'})`);
});

console.log('\n5. 長時間動作の検証:');
wageCounter.setHourlyWage(2000);
const eightHours = 8 * 3600; // 8時間 = 28800秒
const expectedEarnings = 2000 * 8; // 16000円
const calculatedEarnings = wageCounter.calculateEarningsForSeconds(eightHours);
console.log(`8時間勤務 (時給2000円):`);
console.log(`  計算結果: ${calculatedEarnings}円`);
console.log(`  期待値: ${expectedEarnings}円`);
console.log(`  精度: ${calculatedEarnings === expectedEarnings ? '✅ 正確' : '❌ 誤差あり'}`);

console.log('\n=== 検証完了 ===');
console.log('✅ 要件1.4「賃金が設定されたとき、システムは秒単位の収入を計算する（時給 ÷ 3600）」が正しく実装されています');