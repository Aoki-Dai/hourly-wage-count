/**
 * Visualizer クラス
 * 収入進捗の視覚化を管理する
 */
class Visualizer {
    /**
     * Visualizer を初期化する
     * @param {Object} elements - 視覚化に使用するDOM要素
     * @param {HTMLElement} elements.progressContainer - プログレスコンテナ要素
     * @param {HTMLElement} elements.progressBar - プログレスバー要素
     * @param {CurrencyFormatter} currencyFormatter - 通貨フォーマッター
     */
    constructor(elements, currencyFormatter) {
        this.elements = elements;
        this.currencyFormatter = currencyFormatter;
        this.maxEarnings = 0; // 目標収入（デフォルトは時給）
        this.currentEarnings = 0; // 現在の収入
        this.previousEarnings = 0; // 前回の収入（増加検出用）
        this.isInitialized = false;
        this.animationFrameId = null;
        this.lastUpdateTime = 0;
        this.visualizationType = 'bar'; // 'bar' または 'circle'
        this.animationInProgress = false; // アニメーション実行中フラグ
        this.earningsIncreaseThreshold = 1; // 収入増加アニメーションのしきい値
        this.particleContainer = null; // パーティクル用コンテナ
        
        // 追加の要素を取得
        this.progressLabel = document.getElementById('progress-label');
        this.barViewBtn = document.getElementById('bar-view-btn');
        this.circleViewBtn = document.getElementById('circle-view-btn');
        this.circleChartContainer = document.getElementById('circle-chart-container');
        this.circleProgress = document.getElementById('circle-progress');
        this.circleText = document.getElementById('circle-text');
        
        // SVGグラデーションの追加
        this.setupSVGGradient();
    }
    
    /**
     * SVGグラデーションを設定する
     */
    setupSVGGradient() {
        // SVG要素を取得
        const svg = document.getElementById('circle-chart-svg');
        if (!svg) return;
        
        // 既存のグラデーションを確認
        let defs = svg.querySelector('defs');
        if (!defs) {
            // defsがなければ作成
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.insertBefore(defs, svg.firstChild);
            
            // グラデーションを作成
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', 'gradient');
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('x2', '100%');
            gradient.setAttribute('y2', '0%');
            
            // グラデーションのストップを追加
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', '#4CAF50');
            
            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', '#2196F3');
            
            // グラデーションにストップを追加
            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            
            // defsにグラデーションを追加
            defs.appendChild(gradient);
        }
    }

    /**
     * 視覚化を初期化する
     * @param {string} initialMode - 初期視覚化モード ('bar' または 'circle')
     */
    initialize(initialMode = 'bar') {
        if (this.isInitialized) {
            return;
        }

        // 要素の存在確認
        if (!this.elements.progressContainer || !this.elements.progressBar) {
            console.error('Visualizer: 必要なDOM要素が見つかりません');
            return;
        }

        // パーティクルアニメーション用のコンテナを作成
        this.createParticleContainer();
        
        // 初期状態の設定
        this.reset();
        
        // タブ切り替えイベントリスナーを設定
        this.initializeEventListeners();
        
        // 保存された視覚化モードを設定
        this.setVisualizationType(initialMode);
        
        this.isInitialized = true;
        console.log('Visualizer が初期化されました');
    }
    
    /**
     * パーティクルアニメーション用のコンテナを作成する
     */
    createParticleContainer() {
        // 既存のコンテナを確認
        let container = document.getElementById('particle-container');
        
        if (!container) {
            // コンテナを作成
            container = document.createElement('div');
            container.id = 'particle-container';
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.pointerEvents = 'none';
            container.style.overflow = 'hidden';
            container.style.zIndex = '1000';
            
            // ビジュアライゼーションセクションに追加
            const visualizationSection = document.querySelector('.visualization-section');
            if (visualizationSection) {
                visualizationSection.style.position = 'relative';
                visualizationSection.appendChild(container);
            } else {
                document.body.appendChild(container);
            }
        }
        
        this.particleContainer = container;
    }
    
    /**
     * イベントリスナーを初期化する
     */
    initializeEventListeners() {
        // バー表示ボタンのクリックイベント
        if (this.barViewBtn) {
            this.barViewBtn.addEventListener('click', () => {
                this.setVisualizationType('bar');
            });
        }
        
        // 円グラフ表示ボタンのクリックイベント
        if (this.circleViewBtn) {
            this.circleViewBtn.addEventListener('click', () => {
                this.setVisualizationType('circle');
            });
        }
    }
    
    /**
     * 視覚化タイプを設定する
     * @param {string} type - 視覚化タイプ ('bar' または 'circle')
     */
    setVisualizationType(type) {
        if (type !== 'bar' && type !== 'circle') return;
        
        // 同じタイプの場合は何もしない
        if (this.visualizationType === type) return;
        
        const previousType = this.visualizationType;
        this.visualizationType = type;
        
        // 前の視覚化要素を取得
        const previousElement = previousType === 'bar' ? this.elements.progressContainer : this.circleChartContainer;
        
        // 新しい視覚化要素を取得
        const newElement = type === 'bar' ? this.elements.progressContainer : this.circleChartContainer;
        
        // アニメーションのためにトランジションクラスを追加
        if (previousElement) {
            previousElement.classList.add('viz-transition-out');
        }
        
        if (newElement) {
            // 新しい要素を表示
            newElement.style.display = 'block';
            newElement.classList.add('viz-transition-in');
            
            // トランジション後にクラスを削除
            setTimeout(() => {
                if (previousElement) {
                    previousElement.classList.remove('viz-transition-out');
                    previousElement.style.display = 'none';
                }
                
                newElement.classList.remove('viz-transition-in');
            }, 300);
        }
        
        // ボタンのアクティブ状態を更新
        if (this.barViewBtn) {
            this.barViewBtn.classList.toggle('active', type === 'bar');
        }
        
        if (this.circleViewBtn) {
            this.circleViewBtn.classList.toggle('active', type === 'circle');
        }
        
        // 現在の進捗を再描画
        this.updateProgress(this.currentEarnings, true);
        
        console.log(`Visualizer: 視覚化タイプを ${type} に変更しました`);
    }
    
    /**
     * 視覚化モードを設定する（UIController から呼び出される）
     * @param {string} mode - 視覚化モード ('bar' または 'circle')
     */
    setVisualizationMode(mode) {
        this.setVisualizationType(mode);
    }

    /**
     * 目標収入を設定する（デフォルトは時給）
     * @param {number} maxEarnings - 目標収入
     */
    setMaxEarnings(maxEarnings) {
        if (typeof maxEarnings === 'number' && maxEarnings > 0) {
            this.maxEarnings = maxEarnings;
        }
    }

    /**
     * 収入進捗を更新する
     * @param {number} earnings - 現在の収入
     * @param {boolean} animate - アニメーション効果を使用するかどうか
     */
    updateProgress(earnings, animate = true) {
        if (!this.isInitialized) {
            return;
        }

        // 収入の増加を検出
        const earningsIncrease = earnings - this.previousEarnings;
        
        this.currentEarnings = earnings;
        
        // 進捗率の計算（最大100%）
        const progressPercentage = this.maxEarnings > 0 
            ? Math.min((earnings / this.maxEarnings) * 100, 100) 
            : 0;
        
        // 現在の視覚化タイプに応じて更新
        if (this.visualizationType === 'bar') {
            // プログレスバーの更新
            if (animate) {
                this.animateProgress(progressPercentage);
            } else {
                this.elements.progressBar.style.width = `${progressPercentage}%`;
            }
        } else if (this.visualizationType === 'circle') {
            // 円グラフの更新
            this.updateCircleChart(progressPercentage, animate);
        }
        
        // 収入が一定以上増加した場合、視覚的フィードバックを表示
        if (animate && earningsIncrease >= this.earningsIncreaseThreshold) {
            this.showEarningsIncreaseEffect(earningsIncrease);
        }
        
        // 前回の収入を更新
        this.previousEarnings = earnings;
        
        // アクセシビリティ属性の更新
        this.updateAriaAttributes(progressPercentage);
    }
    
    /**
     * 収入増加時の視覚的フィードバックを表示する
     * @param {number} increase - 増加した収入
     */
    showEarningsIncreaseEffect(increase) {
        // 既に別のアニメーションが実行中の場合はスキップ
        if (this.animationInProgress) return;
        
        this.animationInProgress = true;
        
        // 増加量に応じてパーティクル数を決定（最小3、最大15）
        const particleCount = Math.min(Math.max(Math.floor(increase * 3), 3), 15);
        
        // 収入表示要素の位置を取得
        const earningsElement = document.getElementById('current-earnings');
        if (!earningsElement || !this.particleContainer) {
            this.animationInProgress = false;
            return;
        }
        
        // 収入表示要素の位置情報
        const rect = earningsElement.getBoundingClientRect();
        const containerRect = this.particleContainer.getBoundingClientRect();
        
        // パーティクルの開始位置（収入表示の中心）
        const startX = rect.left + rect.width / 2 - containerRect.left;
        const startY = rect.top + rect.height / 2 - containerRect.top;
        
        // パーティクルを作成
        for (let i = 0; i < particleCount; i++) {
            this.createParticle(startX, startY);
        }
        
        // 収入表示要素にパルスエフェクトを追加
        earningsElement.classList.add('earnings-pulse');
        
        // 一定時間後にアニメーション状態をリセット
        setTimeout(() => {
            earningsElement.classList.remove('earnings-pulse');
            this.animationInProgress = false;
        }, 1000);
    }
    
    /**
     * パーティクルを作成する
     * @param {number} x - 開始X座標
     * @param {number} y - 開始Y座標
     */
    createParticle(x, y) {
        if (!this.particleContainer) return;
        
        // パーティクル要素を作成
        const particle = document.createElement('div');
        particle.className = 'money-particle';
        
        // ランダムな色を選択（緑または青）
        const colors = ['#4CAF50', '#2196F3'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // パーティクルのスタイルを設定
        particle.style.position = 'absolute';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${Math.random() * 10 + 5}px`;
        particle.style.height = `${Math.random() * 10 + 5}px`;
        particle.style.backgroundColor = color;
        particle.style.borderRadius = '50%';
        particle.style.opacity = '0.8';
        particle.style.pointerEvents = 'none';
        
        // コンテナに追加
        this.particleContainer.appendChild(particle);
        
        // ランダムな方向と速度を設定
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        // アニメーションの開始時間
        const startTime = Date.now();
        const duration = Math.random() * 1000 + 500; // 500ms～1500ms
        
        // アニメーションフレームを実行
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                // アニメーション終了
                this.particleContainer.removeChild(particle);
                return;
            }
            
            // 位置を更新
            const currentX = x + vx * elapsed / 20;
            const currentY = y + vy * elapsed / 20 - (progress * 20); // 上向きの力を加える
            
            // 透明度を徐々に下げる
            const opacity = 0.8 * (1 - progress);
            
            // スタイルを更新
            particle.style.left = `${currentX}px`;
            particle.style.top = `${currentY}px`;
            particle.style.opacity = `${opacity}`;
            
            // 次のフレームをリクエスト
            requestAnimationFrame(animate);
        };
        
        // アニメーションを開始
        requestAnimationFrame(animate);
    }
    
    /**
     * 円グラフを更新する
     * @param {number} percentage - 進捗率
     * @param {boolean} animate - アニメーション効果を使用するかどうか
     */
    updateCircleChart(percentage, animate = true) {
        if (!this.circleProgress || !this.circleText) return;
        
        // 円周の計算（2πr）
        const circumference = 2 * Math.PI * 45; // r=45
        
        // 進捗に応じたストロークの長さを計算
        const strokeLength = (percentage / 100) * circumference;
        const strokeGap = circumference - strokeLength;
        
        // ストロークの長さを設定
        if (animate) {
            // アニメーション効果を追加
            this.circleProgress.classList.add('animating');
            setTimeout(() => {
                this.circleProgress.classList.remove('animating');
            }, 300);
        }
        
        this.circleProgress.setAttribute('stroke-dasharray', `${strokeLength} ${strokeGap}`);
        
        // テキストを更新
        this.circleText.textContent = `${Math.round(percentage)}%`;
    }

    /**
     * プログレスバーをアニメーションで更新する
     * @param {number} targetPercentage - 目標進捗率
     */
    animateProgress(targetPercentage) {
        // 現在の幅を取得
        const currentWidth = parseFloat(this.elements.progressBar.style.width) || 0;
        
        // 現在時刻を記録
        const now = Date.now();
        
        // 前回の更新から十分な時間が経過している場合のみアニメーション
        if (now - this.lastUpdateTime > 300) {
            // アニメーションクラスを追加
            this.elements.progressBar.classList.add('progress-updating');
            
            // 幅を更新
            this.elements.progressBar.style.width = `${targetPercentage}%`;
            
            // アニメーション完了後にクラスを削除
            setTimeout(() => {
                this.elements.progressBar.classList.remove('progress-updating');
            }, 300);
            
            this.lastUpdateTime = now;
        } else {
            // 頻繁な更新の場合はアニメーションなしで更新
            this.elements.progressBar.style.width = `${targetPercentage}%`;
        }
    }

    /**
     * アクセシビリティ属性を更新する
     * @param {number} progressPercentage - 進捗率
     */
    updateAriaAttributes(progressPercentage) {
        if (!this.elements.progressBar) return;
        
        const roundedPercentage = Math.round(progressPercentage);
        
        this.elements.progressBar.setAttribute('aria-valuenow', roundedPercentage);
        this.elements.progressBar.setAttribute('aria-valuemin', '0');
        this.elements.progressBar.setAttribute('aria-valuemax', '100');
        
        // 収入情報を含めたラベル
        const formattedEarnings = this.currencyFormatter 
            ? this.currencyFormatter.formatSimple(this.currentEarnings)
            : `¥${this.currentEarnings}`;
            
        const formattedMax = this.currencyFormatter 
            ? this.currencyFormatter.formatSimple(this.maxEarnings)
            : `¥${this.maxEarnings}`;
            
        this.elements.progressBar.setAttribute(
            'aria-label', 
            `収入進捗: ${formattedEarnings}/${formattedMax} (${roundedPercentage}%)`
        );
        
        // プログレスラベルを更新
        if (this.progressLabel) {
            this.progressLabel.textContent = `${roundedPercentage}% (${formattedEarnings}/${formattedMax})`;
        }
    }

    /**
     * 視覚化をリセットする
     */
    reset() {
        this.currentEarnings = 0;
        this.previousEarnings = 0;
        
        // プログレスバーをリセット
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = '0%';
        }
        
        // 円グラフをリセット
        if (this.circleProgress) {
            this.circleProgress.setAttribute('stroke-dasharray', '0 283');
        }
        
        if (this.circleText) {
            this.circleText.textContent = '0%';
        }
        
        // プログレスラベルをリセット
        if (this.progressLabel) {
            this.progressLabel.textContent = '0%';
        }
        
        // パーティクルをクリア
        if (this.particleContainer) {
            this.particleContainer.innerHTML = '';
        }
        
        // アニメーション状態をリセット
        this.animationInProgress = false;
        
        // アクセシビリティ属性を更新
        this.updateAriaAttributes(0);
        
        // アニメーションをキャンセル
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * アニメーションキャッシュをクリアする（メモリ最適化用）
     */
    clearAnimationCache() {
        // アニメーション関連の一時オブジェクトをクリア
        this.animationInProgress = false;
        
        // アニメーションフレームをキャンセル
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // パーティクルをクリア
        if (this.particleContainer) {
            this.particleContainer.innerHTML = '';
        }
        
        // トランジションクラスを削除
        if (this.elements.progressContainer) {
            this.elements.progressContainer.classList.remove('viz-transition-in', 'viz-transition-out');
        }
        
        if (this.circleChartContainer) {
            this.circleChartContainer.classList.remove('viz-transition-in', 'viz-transition-out');
        }
        
        if (this.circleProgress) {
            this.circleProgress.classList.remove('animating');
        }
    }
    
    /**
     * 最小限のアニメーションモードを設定する（メモリ使用量が多い場合に呼び出される）
     * @param {boolean} enabled - 最小限のアニメーションモードを有効にするかどうか
     */
    setMinimalAnimations(enabled) {
        if (enabled) {
            // パーティクル効果を無効化
            this.earningsIncreaseThreshold = 100; // 非常に高い閾値に設定して実質無効化
            
            // パーティクルをクリア
            if (this.particleContainer) {
                this.particleContainer.innerHTML = '';
            }
            
            console.log('Visualizer: 最小限のアニメーションモードを有効化しました');
        } else {
            // 通常のアニメーション効果に戻す
            this.earningsIncreaseThreshold = 1; // 通常の閾値に戻す
            
            console.log('Visualizer: 通常のアニメーションモードに戻しました');
        }
    }

    /**
     * Visualizer を破棄する（クリーンアップ）
     */
    destroy() {
        // アニメーションをキャンセル
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // イベントリスナーを削除
        if (this.barViewBtn) {
            this.barViewBtn.removeEventListener('click', this.setVisualizationType);
        }
        
        if (this.circleViewBtn) {
            this.circleViewBtn.removeEventListener('click', this.setVisualizationType);
        }
        
        // パーティクルをクリア
        if (this.particleContainer) {
            this.particleContainer.innerHTML = '';
            
            // パーティクルコンテナを削除
            const parent = this.particleContainer.parentNode;
            if (parent) {
                parent.removeChild(this.particleContainer);
            }
            
            this.particleContainer = null;
        }
        
        this.isInitialized = false;
        console.log('Visualizer: 破棄されました');
    }
}