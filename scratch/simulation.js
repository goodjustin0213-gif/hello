// =========================================================
// 核心資料庫 (依據 114年1月1日生效俸額表更新)
// =========================================================
const SALARY_DB = {
    // 尉官資料 
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, food_add: 2840, annual_growth: 0.015, promotion_years: 1, max_years: 12 },
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, food_add: 2840, annual_growth: 0.015, promotion_years: 3, max_years: 12 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 17 },
    
    // 校官資料 
    'M1': { rank: '少校', base: 32710, pro_add: 45000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 22 },
    'M2': { rank: '中校', base: 37310, pro_add: 55000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 26 },
    'M3': { rank: '上校', base: 41900, pro_add: 65000, food_add: 2840, annual_growth: 0.015, promotion_years: 6, max_years: 30 },
    
    // 將官資料 (少將) 
    'G1': { rank: '少將', base: 48030, pro_add: 70000, food_add: 2840, annual_growth: 0.01, promotion_years: 4, max_years: 35 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1'];
const VOLUNTEER_ADDITION = 15000;
const PENSION_DEDUCTION_RATE = 0.049; // 個人負擔約4.9%

let chart1Instance, chart2Instance;
let allowanceCounter = 0;

// --- 輔助函數 ---
function formatMoney(num) {
    return num < 0 ? `-$${Math.abs(Math.round(num)).toLocaleString()}` : `$${Math.round(num).toLocaleString()}`;
}

function addCustomAllowance() {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const id = `allowance-${allowanceCounter}`;
    let defName = "職務加給", defVal = 5000, defStart = 5, defEnd = 10;
    if (allowanceCounter === 1) { defName = "外島加給"; defVal = 9790; defStart = 1; defEnd = 3; }

    const html = `
        <div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-xs">
            <div class="col-span-4"><input type="text" value="${defName}" class="w-full border rounded px-1 allow-name"></div>
            <div class="col-span-3"><input type="number" value="${defVal}" class="w-full border rounded px-1 allow-value"></div>
            <div class="col-span-2"><input type="number" value="${defStart}" class="w-full border rounded px-1 text-center allow-start"></div>
            <div class="col-span-2"><input type="number" value="${defEnd}" class="w-full border rounded px-1 text-center allow-end"></div>
            <div class="col-span-1 text-center"><button onclick="document.getElementById('${id}').remove();" class="text-red-500 font-bold">×</button></div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

// --- 核心運算 ---
function runSimulation() {
    // 1. 取得參數
    const targetRank = document.getElementById('targetRank').value;
    const serviceYears = parseInt(document.getElementById('serviceYears').value);
    const monthlyInvest = parseInt(document.getElementById('monthlyInvest').value);
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100;
    const livingCost = parseInt(document.getElementById('livingCost').value);
    const bonusMonths = parseFloat(document.getElementById('totalBonusMonths').value);

    // 房貸參數
    const housePrice = parseInt(document.getElementById('housePriceWan').value) * 10000;
    const downPayPct = parseFloat(document.getElementById('downPaymentPercent').value) / 100;
    const mortgageRate = parseFloat(document.getElementById('mortgageRate').value) / 100;
    const loanYears = parseInt(document.getElementById('loanYears').value);
    const buyYear = parseInt(document.getElementById('buyHouseYear').value);

    // 2. 房貸計算 (本息均攤公式)
    // Formula: P * [ r(1+r)^n / ((1+r)^n - 1) ]
    const loanAmount = housePrice * (1 - downPayPct);
    const r_monthly = mortgageRate / 12;
    const n_months = loanYears * 12;
    let monthlyMortgage = 0;
    if (mortgageRate > 0) {
        monthlyMortgage = loanAmount * (r_monthly * Math.pow(1 + r_monthly, n_months)) / (Math.pow(1 + r_monthly, n_months) - 1);
    } else {
        monthlyMortgage = loanAmount / n_months;
    }
    monthlyMortgage = Math.round(monthlyMortgage);

    // 3. 迴圈模擬
    let currentAsset = 0;
    let currentRank = 'S2';
    let yearOfRank = 0;
    let forceRetired = false;
    let retiredYear = 0;

    const labels = [];
    const salaryData = [];     // 月薪
    const disposableData = []; // 可支配所得 (月)
    const assetData = [];      // 累積資產
    const burdenData = [];     // 房貸負擔率

    // 加給設定
    const allowances = [];
    document.querySelectorAll('#custom-allowances-container > div').forEach(row => {
        allowances.push({
            val: parseInt(row.querySelector('.allow-value').value) || 0,
            start: parseInt(row.querySelector('.allow-start').value) || 0,
            end: parseInt(row.querySelector('.allow-end').value) || 99
        });
    });

    for (let year = 1; year <= serviceYears; year++) {
        // 強制退伍檢查
        if (year > SALARY_DB[currentRank].max_years) {
            forceRetired = true;
            retiredYear = year - 1;
            break;
        }

        // 晉升邏輯
        const rankIdx = RANK_ORDER.indexOf(currentRank);
        const targetIdx = RANK_ORDER.indexOf(targetRank);
        if (yearOfRank >= SALARY_DB[currentRank].promotion_years && rankIdx < targetIdx) {
            currentRank = RANK_ORDER[rankIdx + 1];
            yearOfRank = 0;
        }

        // 薪資計算
        const rankData = SALARY_DB[currentRank];
        const growth = Math.pow(1 + rankData.annual_growth, year - 1);
        const baseWage = (rankData.base + rankData.pro_add) * growth;
        
        // 加給總和
        let extra = 0;
        allowances.forEach(a => { if (year >= a.start && year <= a.end) extra += a.val; });

        const grossMonthly = baseWage + rankData.food_add + VOLUNTEER_ADDITION + extra;
        const netMonthly = Math.round(grossMonthly * (1 - PENSION_DEDUCTION_RATE));

        // 年收入計算
        const annualBonus = Math.round(baseWage * bonusMonths);
        let annualIncome = (netMonthly * 12) + annualBonus;

        // 房貸支出 (如果當年需繳房貸)
        let yearMortgageCost = 0;
        let isPayingMortgage = false;
        if (year >= buyYear && year < (buyYear + loanYears)) {
            yearMortgageCost = monthlyMortgage * 12;
            isPayingMortgage = true;
        }

        // 頭期款支出 (購屋當年)
        if (year === buyYear) {
            currentAsset -= (housePrice * downPayPct);
        }

        // 現金流
        const annualExpense = livingCost * 12;
        const fixedInvest = monthlyInvest * 12;
        const netCashflow = annualIncome - annualExpense - yearMortgageCost - fixedInvest;

        // 複利運算: Future Value = Principal * (1 + r)^n + Contributions
        // 這裡採年度結算制
        currentAsset = currentAsset * (1 + returnRate) + fixedInvest + netCashflow;

        // 數據記錄
        labels.push(`第${year}年`);
        salaryData.push(netMonthly);
        assetData.push(Math.round(currentAsset));
        
        // 可支配所得 (扣除房貸與基本生活費後)
        const monthlyDisposable = (annualIncome - yearMortgageCost - annualExpense) / 12;
        disposableData.push(Math.round(monthlyDisposable));

        // 房貸負擔率 (房貸 / 月收入)
        let burdenRate = 0;
        if (isPayingMortgage) {
            // 分母用 (年收/12) 代表平均月收入
            burdenRate = (monthlyMortgage / (annualIncome/12)) * 100;
        }
        burdenData.push(burdenRate.toFixed(1));

        yearOfRank++;
    }

    // 4. 終身俸試算
    let actualYears = forceRetired ? retiredYear : serviceYears;
    let pension = 0;
    if (actualYears >= 20) {
        const finalBase = SALARY_DB[currentRank].base * Math.pow(1.015, actualYears - 1);
        const ratio = 0.55 + (actualYears - 20) * 0.02; // 55% + 2%
        pension = Math.round(finalBase * 2 * Math.min(ratio, 0.95));
    }

    // 5. 更新 UI
    updateUI(currentAsset, monthlyMortgage, pension, forceRetired, currentRank, retiredYear, actualYears);
    
    // 6. 生成報告
    generateReport(currentAsset, pension, burdenData, buyYear, housePrice, loanAmount, loanYears, actualYears);

    // 7. 繪圖
    renderCharts(labels, salaryData, assetData, burdenData);
}

function updateUI(asset, mortgage, pension, forceRetired, rank, retiredYear, actualYears) {
    document.getElementById('total-asset').innerText = formatMoney(asset);
    document.getElementById('monthly-mortgage').innerText = formatMoney(mortgage);
    
    const pensionEl = document.getElementById('pension-monthly');
    if (pension > 0) {
        pensionEl.innerText = formatMoney(pension);
        pensionEl.className = "text-xl font-black text-green-700 mt-1";
    } else {
        pensionEl.innerText = "未達門檻";
        pensionEl.className = "text-lg font-bold text-gray-400 mt-1";
    }

    const statusEl = document.getElementById('final-status');
    if (forceRetired) {
        statusEl.innerText = `強制退伍 (${SALARY_DB[rank].rank})`;
        statusEl.className = "text-lg font-bold text-red-600 mt-1";
    } else {
        statusEl.innerText = `光榮退伍 (${SALARY_DB[rank].rank})`;
        statusEl.className = "text-lg font-bold text-blue-600 mt-1";
    }
}

function generateReport(asset, pension, burdenData, buyYear, housePrice, loanAmount, loanYears, actualYears) {
    const maxBurden = Math.max(...burdenData);
    const avgBurden = burdenData.filter(x => x > 0).reduce((a,b) => parseFloat(a)+parseFloat(b), 0) / (loanYears || 1);
    
    let burdenAnalysis = "";
    if (maxBurden > 50) burdenAnalysis = `<span class="text-red-600 font-bold">極高風險 (最高 ${maxBurden}%)</span>，建議降低房價或提高頭期款。`;
    else if (maxBurden > 30) burdenAnalysis = `<span class="text-orange-600 font-bold">偏重 (最高 ${maxBurden}%)</span>，會壓縮生活品質。`;
    else burdenAnalysis = `<span class="text-green-600 font-bold">安全範圍 (最高 ${maxBurden}%)</span>，財務結構健康。`;

    const html = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 class="font-bold text-blue-700">📌 資產與退休評估</h4>
                <ul class="list-disc list-inside mt-1 text-gray-600">
                    <li>服役 <strong>${actualYears}</strong> 年後，預計累積資產為 <strong>${formatMoney(asset)}</strong>。</li>
                    <li>${pension > 0 ? `符合終身俸資格，預估月退俸為 <strong>${formatMoney(pension)}</strong>，提供了極佳的退休保障。` : `<span class="text-red-500">未滿 20 年，無法領取終身俸，建議重新規劃服役長度。</span>`}</li>
                    <li>長期複利效果顯著，建議保持每月定期定額投資。</li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-orange-700">🏠 購屋能力分析</h4>
                <ul class="list-disc list-inside mt-1 text-gray-600">
                    <li>預計於第 <strong>${buyYear}</strong> 年購入 <strong>${formatMoney(housePrice)}</strong> 房產。</li>
                    <li>貸款金額 <strong>${formatMoney(loanAmount)}</strong>，分 <strong>${loanYears}</strong> 年償還。</li>
                    <li>房貸負擔率評估：${burdenAnalysis}</li>
                </ul>
            </div>
        </div>
    `;
    document.getElementById('analysis-report').innerHTML = html;
}

function renderCharts(labels, salary, asset, burden) {
    // Chart 1: 薪資與資產
    if (chart1Instance) chart1Instance.destroy();
    const ctx1 = document.getElementById('financialChart').getContext('2d');
    chart1Instance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: '月淨薪資', data: salary, borderColor: '#3b82f6', yAxisID: 'y', tension: 0.1 },
                { label: '累積資產', data: asset, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, yAxisID: 'y1', tension: 0.3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: {display:true, text:'月薪'} },
                y1: { type: 'linear', display: true, position: 'right', title: {display:true, text:'資產'} }
            }
        }
    });

    // Chart 2: 房貸負擔
    if (chart2Instance) chart2Instance.destroy();
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
            responsive: true, maintainAspectRatio: false,
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

// 初始化
window.onload = function() {
    addCustomAllowance(); // 預設一個加給
    runSimulation();
};
