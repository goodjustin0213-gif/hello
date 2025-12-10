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

// 格式化金額 (例如: $1,234,567)
function formatMoney(num) {
    if (isNaN(num)) return '--';
    const sign = num < 0 ? "-" : "";
    return `${sign}$${Math.abs(Math.round(num)).toLocaleString()}`;
}

// 滑桿與輸入框同步 (投資報酬率)
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
    
    // 預設範例值
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
// 3. 核心模擬引擎
// =========================================================
function runSimulation() {
    // --- A. 讀取參數 ---
    const targetRank = document.getElementById('targetRank').value;
    const serviceYears = parseInt(document.getElementById('serviceYears').value) || 20;
    
    // 生活與投資
    const livingCost = parseInt(document.getElementById('livingCost').value) || 0;
    const bonusMonths = parseFloat(document.getElementById('totalBonusMonths').value) || 0;
    const monthlyInvest = parseInt(document.getElementById('monthlyInvest').value) || 0;
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0;

    // 房貸參數
    const housePrice = parseInt(document.getElementById('housePriceWan').value) * 10000 || 0;
    const downPayPct = parseFloat(document.getElementById('downPaymentPercent').value) / 100 || 0;
    const mortgageRate = parseFloat(document.getElementById('mortgageRate').value) / 100 || 0;
    const buyYear = parseInt(document.getElementById('buyHouseYear').value) || 999;
    const loanYears = 30; // 固定 30 年房貸

    // --- B. 計算房貸 (本息均攤 PMT) ---
    // Formula: P * [ r(1+r)^n / ((1+r)^n - 1) ]
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

    // --- C. 年資模擬迴圈 ---
    let currentAsset = 0;
    let currentRank = 'S2';
    let yearOfRank = 0;
    let forceRetired = false;
    let retiredYear = 0;

    const labels = [];
    const salaryData = [];
    const assetData = [];
    const burdenData = [];

    // 收集加給設定
    const allowances = [];
    document.querySelectorAll('#custom-allowances-container > div').forEach(row => {
        allowances.push({
            val: parseInt(row.querySelector('.allow-value').value) || 0,
            start: parseInt(row.querySelector('.allow-start').value) || 0,
            end: parseInt(row.querySelector('.allow-end').value) || 99
        });
    });

    for (let year = 1; year <= serviceYears; year++) {
        // 1. 強制退伍檢查
        if (year > SALARY_DB[currentRank].max_years) {
            forceRetired = true;
            retiredYear = year - 1;
            break;
        }

        // 2. 晉升邏輯
        const rankIdx = RANK_ORDER.indexOf(currentRank);
        const targetIdx = RANK_ORDER.indexOf(targetRank);
        if (yearOfRank >= SALARY_DB[currentRank].promotion_years && rankIdx < targetIdx) {
            currentRank = RANK_ORDER[rankIdx + 1];
            yearOfRank = 0;
        }

        // 3. 薪資計算 (含俸級成長)
        const rankData = SALARY_DB[currentRank];
        const growth = Math.pow(1 + rankData.annual_growth, year - 1);
        const baseWage = (rankData.base + rankData.pro_add) * growth;
        
        // 加給總和
        let extra = 0;
        allowances.forEach(a => { if (year >= a.start && year <= a.end) extra += a.val; });

        const grossMonthly = baseWage + rankData.food_add + VOLUNTEER_ADDITION + extra;
        const netMonthly = Math.round(grossMonthly * (1 - PENSION_DEDUCTION_RATE));

        // 4. 年度收支計算
        const annualBonus = Math.round(baseWage * bonusMonths);
        let annualIncome = (netMonthly * 12) + annualBonus;

        // 房貸支出判斷
        let yearMortgageCost = 0;
        let isPayingMortgage = false;
        if (year >= buyYear && year < (buyYear + loanYears)) {
            yearMortgageCost = monthlyMortgage * 12;
            isPayingMortgage = true;
        }

        // 扣除頭期款 (購屋當年)
        if (year === buyYear) currentAsset -= (housePrice * downPayPct);

        // 淨現金流 = 年收入 - 生活費 - 房貸 - 定期定額投資
        const annualExpense = livingCost * 12;
        const fixedInvest = monthlyInvest * 12;
        const netCashflow = annualIncome - annualExpense - yearMortgageCost - fixedInvest;

        // 5. 資產複利運算
        // 假設現金流在年底產生，僅本金與固定投資享受完整複利 (簡化模型)
        currentAsset = currentAsset * (1 + returnRate) + fixedInvest + netCashflow;

        // 6. 數據記錄
        labels.push(`第${year}年`);
        salaryData.push(netMonthly);
        assetData.push(Math.round(currentAsset));

        // 房貸負擔率 (房貸/月收入)
        let burdenRate = 0;
        if (isPayingMortgage) {
            burdenRate = (monthlyMortgage / (annualIncome/12)) * 100;
        }
        burdenData.push(burdenRate.toFixed(1));

        yearOfRank++;
    }

    // --- D. 終身俸試算 ---
    let actualYears = forceRetired ? retiredYear : serviceYears;
    let pension = 0;
    if (actualYears >= 20) {
        // 簡易新制公式：最後在職本俸 * 2 * (55% + 2% * (年資-20))
        // 這裡假設本俸隨年資成長率增加
        const finalBase = SALARY_DB[currentRank].base * Math.pow(1 + SALARY_DB[currentRank].annual_growth, actualYears - 1);
        const ratio = 0.55 + (actualYears - 20) * 0.02; 
        pension = Math.round(finalBase * 2 * Math.min(ratio, 0.95)); // 上限 95%
    }

    // --- E. 更新 UI 與報告 ---
    updateDashboard(currentAsset, monthlyMortgage, pension, forceRetired, currentRank);
    generateHealthReport(currentAsset, pension, burdenData, buyYear, housePrice, loanAmount, loanYears, actualYears);
    renderCharts(labels, salaryData, assetData, burdenData);
}

// =========================================================
// 4. 更新儀表板與報告
// =========================================================
function updateDashboard(asset, mortgage, pension, forceRetired, rank) {
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
    if (forceRetired) {
        statusEl.innerText = `強制退伍 (${SALARY_DB[rank].rank})`;
        statusEl.className = "text-lg font-bold text-red-600 mt-2";
    } else {
        statusEl.innerText = `光榮退伍 (${SALARY_DB[rank].rank})`;
        statusEl.className = "text-lg font-bold text-blue-600 mt-2";
    }
}

function generateHealthReport(asset, pension, burdenData, buyYear, housePrice, loanAmount, loanYears, actualYears) {
    const maxBurden = Math.max(...burdenData);
    
    // 風險評估邏輯
    let burdenAnalysis = "";
    if (maxBurden > 50) burdenAnalysis = `<span class="text-red-600 font-bold">⚠️ 極高風險 (最高 ${maxBurden}%)</span>：房貸超過月薪一半，生活將非常拮据，建議增加頭期款或降低購屋預算。`;
    else if (maxBurden > 30) burdenAnalysis = `<span class="text-orange-600 font-bold">⚠️ 負擔偏重 (最高 ${maxBurden}%)</span>：房貸佔比略高，需嚴格控管其他娛樂支出。`;
    else if (maxBurden > 0) burdenAnalysis = `<span class="text-green-600 font-bold">✅ 安全範圍 (最高 ${maxBurden}%)</span>：財務結構健康，可輕鬆負擔。`;
    else burdenAnalysis = `<span class="text-gray-500">無購屋計畫或全額付清。</span>`;

    const html = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 class="font-bold text-blue-800 text-base mb-2 flex items-center gap-2">
                    📊 資產與退休評估
                </h4>
                <ul class="list-disc list-inside space-y-2 text-gray-700">
                    <li>您將服役 <strong>${actualYears}</strong> 年，預計累積資產為 <strong class="text-blue-700">${formatMoney(asset)}</strong>。</li>
                    <li>${pension > 0 
                        ? `恭喜！您符合終身俸資格，預估月退俸為 <strong class="text-green-700">${formatMoney(pension)}</strong>。這筆穩定的被動收入是軍旅生涯最大的紅利。` 
                        : `<span class="text-red-500 font-bold">注意！服役未滿 20 年，無法領取終身俸。</span> 若這是您的長期目標，請重新規劃服役長度或晉升路徑。`}
                    </li>
                </ul>
            </div>
            <div class="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <h4 class="font-bold text-orange-800 text-base mb-2 flex items-center gap-2">
                    🏠 購屋能力診斷
                </h4>
                <ul class="list-disc list-inside space-y-2 text-gray-700">
                    <li>預計於第 <strong>${buyYear}</strong> 年購入 <strong>${formatMoney(housePrice)}</strong> 房產。</li>
                    <li>貸款總額 <strong>${formatMoney(loanAmount)}</strong>，分 <strong>${loanYears}</strong> 年償還。</li>
                    <li><strong>房貸壓力評估：</strong>${burdenAnalysis}</li>
                </ul>
            </div>
        </div>
    `;
    document.getElementById('analysis-report').innerHTML = html;
}

// =========================================================
// 5. 圖表繪製
// =========================================================
function renderCharts(labels, salary, asset, burden) {
    // 銷毀舊圖表
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();

    const ctx1 = document.getElementById('financialChart').getContext('2d');
    chart1Instance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: '月淨薪資', 
                    data: salary, 
                    borderColor: '#3b82f6', 
                    yAxisID: 'y', 
                    tension: 0.1 
                },
                { 
                    label: '累積資產', 
                    data: asset, 
                    borderColor: '#10b981', 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                    fill: true, 
                    yAxisID: 'y1', 
                    tension: 0.3 
                }
            ]
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: {display:true, text:'月薪'} },
                y1: { type: 'linear', display: true, position: 'right', title: {display:true, text:'資產'} }
            }
        }
    });

    const ctx2 = document.getElementById('burdenChart').getContext('2d');
    chart2Instance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: '房貸負擔率 (%)', 
                    data: burden, 
                    backgroundColor: burden.map(v => v > 40 ? '#ef4444' : (v > 30 ? '#f97316' : '#22c55e'))
                }
            ]
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100, title: {display:true, text:'佔月薪比例 %'} } },
            plugins: { 
                annotation: { 
                    annotations: { 
                        line1: { type: 'line', yMin: 30, yMax: 30, borderColor: 'orange', borderWidth: 2, borderDash: [5, 5] } 
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
    // 預設增加一個加給範例
    addCustomAllowance();
    
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
