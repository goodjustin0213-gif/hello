// ==========================================
// 1. 核心計算邏輯 (Pure Logic)
// ==========================================
/**
 * 計算每月財務分配
 * @param {number} salary - 月薪
 * @param {number} investRate - 投資比例 (0.3 代表 30%)
 * @param {number} expenseRate - 支出比例 (0.5 代表 50%)
 * @returns {Object} 包含各項金額與每月數據陣列
 */
function calculateFinance(salary, investRate, expenseRate) {
    // 強制轉為整數 (無條件捨去或四捨五入，這邊示範無條件捨去)
    const investAmount = Math.floor(salary * investRate);
    const expenseAmount = Math.floor(salary * expenseRate);
    const remaining = salary - investAmount - expenseAmount;

    // 產生 12 個月的數據陣列 (若未來有獎金變動可在這裡調整)
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
    
    return {
        amounts: {
            salary: salary,
            invest: investAmount,
            expense: expenseAmount,
            remaining: remaining
        },
        chartData: {
            labels: months,
            investSeries: new Array(12).fill(investAmount),
            expenseSeries: new Array(12).fill(expenseAmount),
            remainingSeries: new Array(12).fill(remaining)
        }
    };
}

// ==========================================
// 2. 圖表渲染邏輯 (View / Chart.js)
// ==========================================
let financeChartInstance = null; // 用來儲存圖表實例，以便銷毀重繪

/**
 * 繪製或更新圖表
 * @param {string} canvasId - HTML canvas 元素的 ID
 * @param {Object} data - 由 calculateFinance 返回的 chartData
 */
function renderChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // 如果圖表已存在，先銷毀它 (防止舊圖表疊加)
    if (financeChartInstance) {
        financeChartInstance.destroy();
    }

    financeChartInstance = new Chart(ctx, {
        type: 'bar', // 長條圖
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: '投資金額',
                    data: data.investSeries,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: '支出金額',
                    data: data.expenseSeries,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                },
                {
                    label: '結餘/儲蓄',
                    data: data.remainingSeries,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 讓圖表適應容器高度
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: '金額 (TWD)' }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// ==========================================
// 3. 主控制流程 (Controller)
// ==========================================
// 假設您的 HTML 按鈕上有 onclick="runCalculation()"
function runCalculation() {
    // 1. 獲取 DOM 元素值
    const salaryInput = document.getElementById('salary').value;
    const investInput = document.getElementById('investRate').value;
    const expenseInput = document.getElementById('expenseRate').value;

    // 2. 轉換數值
    const salary = parseFloat(salaryInput) || 0;
    const investRate = (parseFloat(investInput) || 0) / 100;
    const expenseRate = (parseFloat(expenseInput) || 0) / 100;

    // 3. 呼叫計算邏輯
    const result = calculateFinance(salary, investRate, expenseRate);

    // 4. 更新 UI (範例：更新某個文字區塊)
    console.log("計算結果:", result.amounts); // 開發者工具查看
    
    // 5. 繪製圖表
    // 確保 HTML 中有 <canvas id="myChart"></canvas>
    renderChart('myChart', result.chartData);
}
