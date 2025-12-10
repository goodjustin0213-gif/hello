// =========================================================
// 1. 核心資料庫 (114年/2025年 新制參數)
// =========================================================
const SALARY_DB = {
    // 尉官 (依據法規最快晉升標準)
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, food_add: 2840, annual_growth: 0.015, promotion_years: 1, max_years: 12 },
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, food_add: 2840, annual_growth: 0.015, promotion_years: 3, max_years: 12 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 17 },
    
    // 校官
    'M1': { rank: '少校', base: 32710, pro_add: 45000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 22 },
    'M2': { rank: '中校', base: 37310, pro_add: 55000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 26 },
    'M3': { rank: '上校', base: 41900, pro_add: 65000, food_add: 2840, annual_growth: 0.015, promotion_years: 6, max_years: 30 },
    
    // 將官 (少將)
    'G1': { rank: '少將', base: 48030, pro_add: 70000, food_add: 2840, annual_growth: 0.01, promotion_years: 4, max_years: 35 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1'];
const VOLUNTEER_ADDITION = 15000;       // 志願役加給
const PENSION_DEDUCTION_RATE = 0.049;   // 退撫自提約 4.9%

// 全域變數
let chart1Instance, chart2Instance;
let allowanceCounter = 0;

// =========================================================
// 2. UI 互動與輔助功能
// =========================================================

// 格式化金額
function formatMoney(num) {
    if (isNaN(num)) return '--';
    const sign = num < 0 ? "-" : "";
    return `${sign}$${Math.abs(Math.round(num)).toLocaleString()}`;
}

// 滑桿與輸入框同步
function syncSlider(val) {
    document.getElementById('returnRateSlider').value = val;
    runSimulation();
}
function syncInput(val) {
    document.getElementById('returnRate').value = val;
    runSimulation();
}

// 動態新增自訂加給
function addCustomAllowance() {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const id = `allowance-${allowanceCounter}`;
    
    let defName = "職務加給", defVal = 5000, defStart = 5, defEnd = 10;
    if (allowanceCounter === 1) { defName = "外島加給"; defVal = 9790; defStart = 1; defEnd = 3; }

    const html = `
        <div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-xs bg-gray-50 p-1 rounded border border-gray-100">
            <div class="col-span-4">
                <input type="text" value="${defName}" class="w-full border-none bg-transparent px-1 allow-name text-gray-600 font-bold focus:ring-0" placeholder="名稱" oninput="runSimulation()">
            </div>
            <div class="col-span-3">
                <input type="number" value="${defVal}" class="w-full border rounded px-1 allow-value h-6 text-right" placeholder="$" oninput="runSimulation()">
            </div>
            <div class="col-span-2">
                <input type="number" value="${defStart}" class="w-full border rounded px-1 text-center allow-start h-6" oninput="runSimulation()">
            </div>
            <div class="col-span-2">
                <input type="number" value="${defEnd}" class="w-full border rounded px-1 text-center allow-end h-6" oninput="runSimulation()">
            </div>
            <div class="col-span-1 text-center">
                <button onclick="document.getElementById('${id}').remove(); runSimulation()" class="text-red-400 hover:text-red-600 font-bold text-lg leading-none">&times;</button>
            </div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

// =========================================================
// 3. 核心模擬引擎 (含通膨與延伸邏輯)
// =========================================================
function runSimulation() {
    // --- A. 讀取輸入參數 ---
    const targetRank = document.getElementById('targetRank').value;
    const serviceYears = parseInt(document.getElementById('serviceYears').value) || 20;
    const monthlyInvest = parseInt(document.getElementById('monthlyInvest').value) || 0;
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0;
    const livingCostBase = parseInt(document.getElementById('livingCost').value) || 0;
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100 || 0; // 通膨率
    const bonusMonths = parseFloat(document.getElementById('totalBonusMonths').value) || 0;

    // 房貸參數
    const housePrice = parseInt(document.getElementById('housePriceWan').value) * 10000 || 0;
    const downPayPct = parseFloat(document.getElementById('downPaymentPercent').value) / 100 || 0;
    const mortgageRate = parseFloat(document.getElementById('mortgageRate').value) / 100 || 0;
    const loanYears = parseInt(document.getElementById('loanYears').value) || 30; // 預設30年
    const buyYear = parseInt(document.getElementById('buyHouseYear').value) || 999;

    // --- B. 計算 PMT 月付金 (本息平均攤還) ---
    const loanAmount = housePrice * (1 - downPayPct);
    const r_monthly = mortgageRate / 12;
    const n_months = loanYears * 12;
    let monthlyMortgage = 0;
    
    if (loanAmount > 0) {
        if (mortgageRate > 0) {
            monthlyMortgage = loanAmount * (r_monthly * Math.pow(1 + r_monthly, n_months)) / (Math.pow(1 + r_monthly, n_months) - 1);
        } else {
            monthlyMortgage = loanAmount / n_months;
        }
    }
    monthlyMortgage = Math.round(monthlyMortgage);

    // --- C. 模擬初始化 ---
    let currentAsset = 0;
    let currentRank = 'S2';
    let yearOfRank = 0;
    let forceRetired = false;
    let retiredYear = 0;
    
    // 收集加給設定
    const allowances = [];
    document.querySelectorAll('#custom-allowances-container > div').forEach(row => {
        allowances.push({
            val: parseInt(row.querySelector('.allow-value').value) || 0,
            start: parseInt(row.querySelector('.allow-start').value) || 0,
            end: parseInt(row.querySelector('.allow-end').value) || 99
        });
    });

    // 決定模擬總長度：至少跑完服役年，若有房貸，則跑到房貸還完的那一年
    const mortgageEndYear = buyYear + loanYears - 1;
    const maxSimulationYear = Math.max(serviceYears, mortgageEndYear + 1); 

    const labels = [];
    const incomeData = [];
    const assetData = [];
    const burdenData = [];

    // --- D. 預先計算退休金 ---
    // 先跑一次虛擬晉升來決定最後的退休金基準
    let tempRank = 'S2';
    let tempYOR = 0;
    let finalBase = 0;
    for(let y=1; y<=serviceYears; y++) {
        if (y > SALARY_DB[tempRank].max_years) break; // 模擬強制退伍
        let rIdx = RANK_ORDER.indexOf(tempRank);
        let tIdx = RANK_ORDER.indexOf(targetRank);
        if (tempYOR >= SALARY_DB[tempRank].promotion_years && rIdx < tIdx) {
            tempRank = RANK_ORDER[rIdx + 1];
            tempYOR = 0;
        }
        const rd = SALARY_DB[tempRank];
        const g = Math.pow(1 + rd.annual_growth, y - 1);
        finalBase = rd.base * g; 
        tempYOR++;
    }
    
    // 計算月退俸 (簡易公式)
    let pension = 0;
    if (serviceYears >= 20) {
        const ratio = 0.55 + (serviceYears - 20) * 0.02; 
        pension = Math.round(finalBase * 2 * Math.min(ratio, 0.95));
    }

    // --- E. 正式逐年模擬 (含退伍後) ---
    for (let year = 1; year <= maxSimulationYear; year++) {
        
        // 1. 判斷身分 (服役中 vs 退伍後)
        let isActiveDuty = year <= serviceYears;
        let netMonthlyIncome = 0;
        let annualIncomeTotal = 0;

        // 強制退伍檢查 (僅在服役期間檢查)
        if (isActiveDuty) {
            if (year > SALARY_DB[currentRank].max_years) {
                forceRetired = true;
                retiredYear = year - 1;
                isActiveDuty = false; // 轉為退伍狀態
            }
        }

        if (isActiveDuty) {
            // --- 服役期間薪資計算 ---
            // 晉升邏輯
            const rankIdx = RANK_ORDER.indexOf(currentRank);
            const targetIdx = RANK_ORDER.indexOf(targetRank);
            if (yearOfRank >= SALARY_DB[currentRank].promotion_years && rankIdx < targetIdx) {
                currentRank = RANK_ORDER[rankIdx + 1];
                yearOfRank = 0;
            }

            const rankData = SALARY_DB[currentRank];
            const growth = Math.pow(1 + rankData.annual_growth, year - 1);
            const baseWage = (rankData.base + rankData.pro_add) * growth;
            
            let extra = 0;
            allowances.forEach(a => { if (year >= a.start && year <= a.end) extra += a.val; });

            const grossMonthly = baseWage + rankData.food_add + VOLUNTEER_ADDITION + extra;
            netMonthlyIncome = Math.round(grossMonthly * (1 - PENSION_DEDUCTION_RATE));
            const annualBonus = Math.round(baseWage * bonusMonths);
            annualIncomeTotal = (netMonthlyIncome * 12) + annualBonus;
            yearOfRank++;

        } else {
            // --- 退伍後：領退休金 ---
            if (serviceYears >= 20 && !forceRetired) {
                netMonthlyIncome = pension; // 領終身俸
            } else if (forceRetired && retiredYear >= 20) {
                 netMonthlyIncome = pension; // 強制退伍但滿20年
            } else {
                netMonthlyIncome = 0; // 無終身俸 (假設無其他收入)
            }
            annualIncomeTotal = netMonthlyIncome * 12;
        }

        // 2. 支出計算 (含通膨)
        // 生活費隨通膨每年增加
        const inflationFactor = Math.pow(1 + inflationRate, year - 1);
        const currentYearLivingCost = Math.round(livingCostBase * inflationFactor);
        const annualExpense = currentYearLivingCost * 12;

        // 房貸支出
        let yearMortgageCost = 0;
        let isPayingMortgage = false;
        if (year >= buyYear && year < (buyYear + loanYears)) {
            yearMortgageCost = monthlyMortgage * 12;
            isPayingMortgage = true;
        }

        // 扣除頭期款 (購屋當年)
        if (year === buyYear) currentAsset -= (housePrice * downPayPct);

        // 3. 現金流與資產
        const fixedInvest = monthlyInvest * 12;
        // 淨現金流
        const netCashflow = annualIncomeTotal - annualExpense - yearMortgageCost - fixedInvest;

        // 複利滾存
        currentAsset = currentAsset * (1 + returnRate) + fixedInvest + netCashflow;

        // 4. 數據記錄
        labels.push(`第${year}年${isActiveDuty ? '' : '(退)'}`);
        incomeData.push(netMonthlyIncome);
        assetData.push(Math.round(currentAsset));

        // 負擔率計算
        let burdenRate = 0;
        if (isPayingMortgage) {
            if (annualIncomeTotal > 0) {
                burdenRate = (monthlyMortgage * 12 / annualIncomeTotal) * 100;
            } else {
                burdenRate = 100; // 無收入還有房貸
            }
        }
        burdenData.push(burdenRate.toFixed(1));
    }

    // --- F. 輸出結果 ---
    updateUI(currentAsset, monthlyMortgage, pension, forceRetired, currentRank, burdenData, serviceYears, buyYear, loanYears);
    renderCharts(labels, incomeData, assetData, burdenData, serviceYears);
    generateReport(currentAsset, pension, burdenData, buyYear, housePrice, loanAmount, loanYears, serviceYears, mortgageEndYear);
}

// =========================================================
// 4. 更新 UI 與報告
// =========================================================
function updateUI(asset, mortgage, pension, forceRetired, rank, burdenData, serviceYears, buyYear, loanYears) {
    document.getElementById('total-asset').innerText = formatMoney(asset);
    document.getElementById('monthly-mortgage').innerText = formatMoney(mortgage);
    
    const pensionEl = document.getElementById('pension-monthly');
    if (pension > 0) {
        pensionEl.innerText = formatMoney(pension);
        pensionEl.className = "text-2xl font-black text-green-700 mt-1";
    } else {
        pensionEl.innerText = "未達門檻";
        pensionEl.className = "text-xl font-bold text-gray-400 mt-1";
    }

    const statusEl = document.getElementById('final-status');
    const mortgageEnd = buyYear + loanYears;
    const yearsAfterRetire = mortgageEnd - serviceYears;
    
    if (yearsAfterRetire > 0) {
        statusEl.innerHTML = `<span class="text-red-600">⚠️ 退伍後仍需繳 ${yearsAfterRetire} 年</span>`;
    } else {
        statusEl.innerHTML = `<span class="text-green-600">✅ 退伍前已還清</span>`;
    }
}

function generateReport(asset, pension, burdenData, buyYear, housePrice, loanAmount, loanYears, serviceYears, mortgageEndYear) {
    // 找出退伍後的負擔率最高點
    let maxBurden = 0;
    let postRetireBurden = 0;
    burdenData.forEach((v, i) => {
        const val = parseFloat(v);
        if (val > maxBurden) maxBurden = val;
        if ((i + 1) > serviceYears && val > postRetireBurden) postRetireBurden = val;
    });

    let advice = "";
    if (postRetireBurden > 50) {
        advice = `<span class="text-red-600 font-bold">🚨 危險警示：退伍後房貸壓力過大！</span><br>您退伍後的月退俸可能有超過一半都要拿去繳房貸。這會嚴重擠壓退休生活品質。建議：1. 延後退伍 2. 降低購屋預算 3. 提高頭期款。`;
    } else if (postRetireBurden > 30) {
        advice = `<span class="text-orange-600 font-bold">⚠️ 注意：退伍後手頭較緊</span><br>退伍後房貸佔月退俸比例偏高，建議服役期間多存錢，或使用部分退休金提前還款。`;
    } else {
        advice = `<span class="text-green-600 font-bold">✅ 安全：財務結構穩健</span><br>無論服役中或退伍後，您的收入都能輕鬆覆蓋房貸。`;
    }

    const html = `
        <div class="space-y-4">
            <p><strong>1. 資產狀況：</strong>模擬結束時（第 ${burdenData.length} 年），預估累積淨資產為 <strong>${formatMoney(asset)}</strong>。</p>
            <p><strong>2. 房貸銜接：</strong>您預計在服役第 <strong>${buyYear}</strong> 年購屋，房貸將持續到第 <strong>${mortgageEndYear}</strong> 年。<br>這意味著 <span class="bg-yellow-100 px-1 rounded text-yellow-800 font-bold">退伍後，您仍需繳納房貸 ${Math.max(0, mortgageEndYear - serviceYears)} 年</span>。</p>
            <p><strong>3. 專家建議：</strong>${advice}</p>
        </div>
    `;
    document.getElementById('analysis-report').innerHTML = html;
}

// =========================================================
// 5. 圖表繪製 (使用 Chart.js)
// =========================================================
function renderCharts(labels, income, asset, burden, serviceYears) {
    // 銷毀舊圖表
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();

    // 1. 資產趨勢圖
    const ctx1 = document.getElementById('financialChart').getContext('2d');
    chart1Instance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: '月收入(薪資/退休金)', data: income, borderColor: '#3b82f6', yAxisID: 'y', tension: 0.1, pointRadius: 2 },
                { label: '累積淨資產', data: asset, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, yAxisID: 'y1', tension: 0.3, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                annotation: {
                    annotations: {
                        line1: { type: 'line', xMin: serviceYears - 0.5, xMax: serviceYears - 0.5, borderColor: 'gray', borderWidth: 2, borderDash: [5, 5], label: { display: true, content: '退伍', position: 'start' } }
                    }
                }
            },
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: {display:true, text:'月收入'} },
                y1: { type: 'linear', display: true, position: 'right', title: {display:true, text:'總資產'} }
            }
        }
    });

    // 2. 房貸壓力圖
    const ctx2 = document.getElementById('burdenChart').getContext('2d');
    chart2Instance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ 
                label: '房貸負擔率 (%)', 
                data: burden, 
                backgroundColor: burden.map(v => v > 50 ? '#ef4444' : (v > 30 ? '#f97316' : '#22c55e'))
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100, title: {display:true, text:'佔月收入 %'} } },
            plugins: { 
                annotation: { 
                    annotations: { 
                        line1: { type: 'line', yMin: 30, yMax: 30, borderColor: 'orange', borderWidth: 2, borderDash: [5, 5], label: {content: '30%警戒', display: true} },
                        line2: { type: 'line', xMin: serviceYears - 0.5, xMax: serviceYears - 0.5, borderColor: 'gray', borderWidth: 2, borderDash: [5, 5], label: { content: '退伍', display: true } }
                    } 
                } 
            }
        }
    });
}

// =========================================================
// 6. 系統初始化
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    addCustomAllowance(); // 預設增加一個加給範例
    
    // 為所有輸入框綁定事件以即時運算
    document.body.addEventListener('input', (e) => {
        // 排除 slider，因為它有自己的 oninput 事件處理
        if((e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') && e.target.id !== 'returnRateSlider') {
            runSimulation();
        }
    });

    // 初次執行
    runSimulation();
});
