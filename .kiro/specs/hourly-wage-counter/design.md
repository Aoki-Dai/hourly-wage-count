# 設計文書

## 概要

時給カウンターアプリケーションは、ユーザーが設定した時給に基づいて秒単位の収入をリアルタイムで計算・表示するWebアプリケーションです。シンプルで直感的なUIを提供し、作業時間と収入を視覚的に追跡できます。

## アーキテクチャ

### 技術スタック
- **フロントエンド**: HTML5, CSS3, JavaScript (Vanilla JS)
- **状態管理**: ローカル状態管理（クラスベース）
- **視覚化**: Canvas API または CSS アニメーション
- **データ永続化**: LocalStorage（セッション間での設定保持）

### アーキテクチャパターン
- **MVC パターン**: Model（データ管理）、View（UI表示）、Controller（ユーザー操作処理）
- **イベント駆動**: タイマーベースの更新とユーザーイベント処理
- **レスポンシブデザイン**: モバイルとデスクトップ対応

## コンポーネントとインターフェース

### 1. WageCounter クラス（Model）
```javascript
class WageCounter {
  constructor()
  setHourlyWage(wage)
  start()
  stop()
  reset()
  getCurrentEarnings()
  getElapsedTime()
  getPerSecondWage()
}
```

### 2. TimerManager クラス（Core Logic）
```javascript
class TimerManager {
  constructor(callback)
  start()
  stop()
  reset()
  getElapsedSeconds()
}
```

### 3. UIController クラス（Controller）
```javascript
class UIController {
  constructor()
  initializeEventListeners()
  updateDisplay()
  updateVisualization()
  handleWageInput()
  handleStartStop()
  handleReset()
}
```

### 4. Visualizer クラス（View）
```javascript
class Visualizer {
  constructor(canvasElement)
  updateProgress(earnings, maxEarnings)
  animateEarnings()
  reset()
}
```

## データモデル

### AppState
```javascript
{
  hourlyWage: number,           // 時給（円）
  currentEarnings: number,      // 現在の累積収入
  elapsedSeconds: number,       // 経過秒数
  isRunning: boolean,          // カウンター動作状態
  perSecondWage: number,       // 秒単位の収入
  startTime: Date,             // 開始時刻
  pausedTime: number           // 一時停止時の累積時間
}
```

### Settings
```javascript
{
  hourlyWage: number,          // 保存された時給
  currency: string,            // 通貨記号（デフォルト: "¥"）
  updateInterval: number       // 更新間隔（ミリ秒、デフォルト: 1000）
}
```

## エラーハンドリング

### 入力検証
- **時給入力**: 正の数値のみ受け入れ、無効な値に対してはエラーメッセージ表示
- **範囲チェック**: 時給は0円以上、1,000,000円以下に制限
- **数値フォーマット**: 小数点以下2桁まで対応

### エラー状態
```javascript
const ErrorTypes = {
  INVALID_WAGE: 'invalid_wage',
  TIMER_ERROR: 'timer_error',
  STORAGE_ERROR: 'storage_error'
}
```

### エラー処理戦略
- **グレースフルデグラデーション**: LocalStorage が利用できない場合はセッション内のみで動作
- **ユーザーフィードバック**: エラーメッセージは日本語で分かりやすく表示
- **自動復旧**: タイマーエラー時は自動的に再開を試行

## テスト戦略

### 単体テスト
- **WageCounter クラス**: 計算ロジックの正確性
- **TimerManager クラス**: タイマー機能の動作
- **入力検証**: 各種入力パターンのテスト

### 統合テスト
- **UI操作フロー**: 開始→停止→リセットの一連の操作
- **データ永続化**: LocalStorage への保存・読み込み
- **視覚化更新**: リアルタイム表示の同期

### ユーザビリティテスト
- **レスポンシブ対応**: 各種デバイスサイズでの表示確認
- **アクセシビリティ**: キーボード操作とスクリーンリーダー対応
- **パフォーマンス**: 長時間動作時のメモリ使用量

## UI/UX 設計

### レイアウト構成
1. **ヘッダー**: アプリタイトル
2. **設定エリア**: 時給入力フィールド
3. **メイン表示**: 現在の収入と経過時間
4. **コントロール**: 開始/停止/リセットボタン
5. **視覚化エリア**: プログレスバーまたはチャート

### 視覚化オプション
- **プログレスバー**: 目標収入に対する進捗表示
- **円形チャート**: 時間経過の視覚的表現
- **数値カウンター**: アニメーション付きの収入表示

### カラーパレット
- **プライマリ**: #2196F3（青）- 信頼感
- **セカンダリ**: #4CAF50（緑）- 収入・成功
- **アクセント**: #FF9800（オレンジ）- 注意・アクション
- **背景**: #F5F5F5（ライトグレー）
- **テキスト**: #333333（ダークグレー）

## パフォーマンス考慮事項

### 最適化戦略
- **タイマー効率化**: requestAnimationFrame の使用検討
- **DOM更新最小化**: 変更が必要な要素のみ更新
- **メモリ管理**: イベントリスナーの適切な削除

### レスポンシブ対応
- **ブレークポイント**: 768px（タブレット）、480px（モバイル）
- **フォントサイズ**: 相対単位（rem, em）の使用
- **タッチ対応**: ボタンサイズ最小44px×44px