// =========================================================
// 1. 資料庫與全域參數 (114年新制)
// =========================================================
const SALARY_DB = {
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, food_add: 2840, annual_growth: 0.015, promotion_years: 1, max_years: 12 },
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, food_add: 2840, annual_growth: 0.015, promotion_years: 3, max_years: 12 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 17 },
    'M1': { rank: '少校', base: 32710, pro_add: 45000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 22 },
    'M2': { rank: '中校', base: 37310, pro_add: 55000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 26 },
    'M3': { rank: '上校', base: 41900, pro_add: 65000, food_add: 2840, annual_growth: 0.015, promotion_years: 6, max_years: 30 },
    'G1': { rank: '少將', base: 48030, pro_add: 70000, food_add: 2840, annual_growth: 0.01, promotion_years: 4, max_years: 35 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1'];
const VOLUNTEER_ADDITION = 15000;       // 志願役加給
const PENSION_DEDUCTION_RATE = 0.049;   // 退撫自提

let chart1Instance, chart2Instance;
let allowanceCounter = 0;

// =========================================================
// 2. UI 互動輔助函數
// =========================================================
function syncSlider(val) { document.getElementById('returnRateSlider').value = val; runSimulation(); }
function syncInput(val) { document.getElementById('returnRate').value = val; runSimulation(); }
function formatMoney(num) { 
    if(isNaN(num)) return '$0';
    return num < 0 ? `-$${Math.abs(Math.round(num)).toLocaleString()}` : `$${Math.round(num).toLocaleString()}`; 
}

// 動態新增加給
function addCustomAllowance() {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const id = `allowance-${allowanceCounter}`;
    
    // 預設範例：第一筆給外島加給，其餘給職務加給
    let defName = "職務加給", defVal = 5000, defStart = 5, defEnd = 10;
    if (allowanceCounter === 1) { defName = "外島加給"; defVal = 9790; defStart = 1; defEnd = 3; }

    const html = `
        <div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-xs bg-gray-50 p-1 rounded border border-gray-100">
            <div class="col-span-4">
                <input type="text" value="${defName}" class="w-full border-none bg-transparent px-1 allow-name text-gray-600 font-bold" placeholder="名稱" oninput="runSimulation()">
            </div>
            <div class="col-span-3">
                <input type="number" value="${defVal}" class="w-full border rounded px-1 allow-value h-6" placeholder="$" oninput="runSimulation()">
            </div>
            <div class="col-span-2">
                <input type="number" value="${defStart}" class="w-full border rounded px-1 text-center allow-start h-6" oninput="runSimulation()">
            </div>
            <div class="col-span-2">
                <input type="number" value="${defEnd}" class="w-full border rounded px-1 text-center allow-end h-6" oninput="runSimulation()">
            </div>
            <div class="col-span-1 text-center">
                <button onclick="document.getElementById('${id}').remove(); runSimulation()" class="text-red-400 hover:text-red-600 font-bold">×</button>
            </div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

// =========================================================
// 3. 核心模擬引擎 (百分比驅動邏輯)
// =========================================================
function runSimulation() {
    // --- A. 讀取輸入 ---
    const targetRank = document.getElementById('targetRank').value;
    const serviceYears = parseInt(document.getElementById('serviceYears').value) || 20;
    
    // [重要改動] 讀取百分比而非固定金額
    const livingCostPercent = parseInt(document.getElementById('livingCostPercent').value) / 100; 
    const monthlyInvestPercent = parseInt(document.getElementById('monthlyInvestPercent').value) / 100;
    
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100;
    
    // 房貸參數
    const housePrice = parseInt(document.getElementById('housePriceWan').value) * 10000;
    const downPayPct = parseFloat(document.getElementById('downPaymentPercent').value) / 100;
    const mortgageRate = parseFloat(document.getElementById('mortgageRate').value) / 100;
    const loanYears = parseInt(document.getElementById('loanYears').value);
    const buyYear = parseInt(document.getElementById('buyHouseYear').value);

    // --- B. 計算房貸 PMT ---
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

    // --- C. 初始化模擬變數 ---
    let currentAsset = 0;
    let currentRank = 'S2';
    let yearOfRank = 0;
    let forceRetired = false;
    let retiredYear = 0;
    
    // 讀取加給
    const allowances = [];
    document.querySelectorAll('#custom-allowances-container > div').forEach(row => {
        allowances.push({
            val: parseInt(row.querySelector('.allow-value').value) || 0,
            start: parseInt(row.querySelector('.allow-start').value) || 0,
            end: parseInt(row.querySelector('.allow-end').value) || 99
        });
    });

    // 決定模擬時間長度
    const mortgageEndYear = buyYear + loanYears - 1;
    const maxSimulationYear = Math.max(serviceYears, mortgageEndYear + 1);

    // 準備圖表數據容器
    const labels = [];
    const incomeData = [];      // 總收入線
    const assetData = [];       // 資產線
    
    // 堆疊長條圖專用數據
    const stackExpense = [];
    const stackMortgage = [];
    const stackInvest = [];
    const stackSurplus = [];

    // --- D. 預先計算退休金 ---
    let tempRank = 'S2';
    let tempYOR = 0;
    let finalBase = 0;
    // 跑一次虛擬晉升算最後本俸
    for(let y=1; y<=serviceYears; y++) {
        if (y > SALARY_DB[tempRank].max_years) break;
        let rIdx = RANK_ORDER.indexOf(tempRank);
        let tIdx = RANK_ORDER.indexOf(targetRank);
        if (tempYOR >= SALARY_DB[tempRank].promotion_years && rIdx < tIdx) { 
            tempRank = RANK_ORDER[rIdx + 1]; tempYOR = 0; 
        }
        const rd = SALARY_DB[tempRank];
        finalBase = rd.base * Math.pow(1 + rd.annual_growth, y - 1);
        tempYOR++;
    }
    // 計算退休俸
    let pension = 0;
    if (serviceYears >= 20) {
        const ratio = 0.55 + (serviceYears - 20) * 0.02; 
        pension = Math.round(finalBase * 2 * Math.min(ratio, 0.95));
    }

    // 用於計算平均投資額
    let totalInvestSum = 0;
    let investMonthsCount = 0;

    // --- E. 逐年模擬迴圈 ---
    for (let year = 1; year <= maxSimulationYear; year++) {
        let isActiveDuty = year <= serviceYears;
        let netMonthlyIncome = 0;
        let annualIncomeTotal = 0;

        // 強制退伍判斷
        if (isActiveDuty && year > SALARY_DB[currentRank].max_years) {
            forceRetired = true; retiredYear = year - 1; isActiveDuty = false;
        }

        // 1. 計算該年度月收入
        if (isActiveDuty) {
            // 晉升與薪資成長
            const rankIdx = RANK_ORDER.indexOf(currentRank);
            const targetIdx = RANK_ORDER.indexOf(targetRank);
            if (yearOfRank >= SALARY_DB[currentRank].promotion_years && rankIdx < targetIdx) {
                currentRank = RANK_ORDER[rankIdx + 1]; yearOfRank = 0;
            }
            const rankData = SALARY_DB[currentRank];
            const growth = Math.pow(1 + rankData.annual_growth, year - 1);
            const baseWage = (rankData.base + rankData.pro_add) * growth;
            
            let extra = 0;
            allowances.forEach(a => { if (year >= a.start && year <= a.end) extra += a.val; });
            
            const grossMonthly = baseWage + rankData.food_add + VOLUNTEER_ADDITION + extra;
            netMonthlyIncome = Math.round(grossMonthly * (1 - PENSION_DEDUCTION_RATE));
            annualIncomeTotal = (netMonthlyIncome * 12) + Math.round(baseWage * 2.5); // 加年終
            yearOfRank++;
        } else {
            // 退伍後
            netMonthlyIncome = (serviceYears >= 20 || (forceRetired && retiredYear >= 20)) ? pension : 0;
            annualIncomeTotal = netMonthlyIncome * 12;
        }

        // 2. 依百分比計算支出與投資 (動態計算)
        // 核心邏輯：隨薪資增加，生活品質與投資額都上升
        let actualMonthlyExpense = Math.round(netMonthlyIncome * livingCostPercent);
        let actualMonthlyInvest = Math.round(netMonthlyIncome * monthlyInvestPercent);
        
        // 房貸判斷
        let isPayingMortgage = (year >= buyYear && year < (buyYear + loanYears));
        let actualMonthlyMortgage = isPayingMortgage ? monthlyMortgage : 0;

        // 3. 計算結餘 (Surplus) 與 赤字處理
        // 月結餘 = 收入 - 支出 - 投資 - 房貸
        let actualMonthlySurplus = netMonthlyIncome - actualMonthlyExpense - actualMonthlyInvest - actualMonthlyMortgage;

        // 若結餘為負 (入不敷出)，邏輯處理：
        if (actualMonthlySurplus < 0) {
            // 先嘗試減少投資金額來填補
            if (actualMonthlyInvest + actualMonthlySurplus >= 0) {
                actualMonthlyInvest += actualMonthlySurplus; // 投資減少
                actualMonthlySurplus = 0;
            } else {
                // 投資減到0還不夠，則變成真正的赤字 (會扣資產)
                let deficit = actualMonthlySurplus + actualMonthlyInvest;
                actualMonthlyInvest = 0;
                actualMonthlySurplus = deficit; 
            }
        }

        // 累計平均投資額 (僅統計服役期間)
        if (isActiveDuty) {
            totalInvestSum += actualMonthlyInvest;
            investMonthsCount++;
        }

        // 4. 資產計算
        // 扣除頭期款
        if (year === buyYear) currentAsset -= (housePrice * downPayPct);

        // 年度總現金流 (含年終)
        // 假設：年終獎金的投資比例與月薪相同，剩下的年終直接存入資產
        let annualBonus = isActiveDuty ? (annualIncomeTotal - netMonthlyIncome * 12) : 0;
        let bonusInvest = annualBonus * monthlyInvestPercent;
        let bonusSave = annualBonus - bonusInvest; 
        
        let totalAnnualInvest = (actualMonthlyInvest * 12) + bonusInvest;
        let totalAnnualNetCashflow = (actualMonthlySurplus * 12) + bonusSave;

        // 複利公式：(本金 * 報酬率) + 本金投入 + 淨現金流
        currentAsset = currentAsset * (1 + returnRate) + totalAnnualInvest + totalAnnualNetCashflow;

        // 5. 記錄圖表數據
        labels.push(`第${year}年`);
        incomeData.push(netMonthlyIncome);
        assetData.push(Math.round(currentAsset));

        // 堆疊圖數據 (確保不顯示負值，負值已反映在資產線)
        stackExpense.push(actualMonthlyExpense);
        stackMortgage.push(actualMonthlyMortgage);
        stackInvest.push(actualMonthlyInvest);
        stackSurplus.push(Math.max(0, actualMonthlySurplus)); 
    }

    // 計算平均月投資額
    let avgInvest = investMonthsCount > 0 ? Math.round(totalInvestSum / investMonthsCount) : 0;

    // --- F. 更新 UI 與 繪圖 ---
    updateUI(currentAsset, monthlyMortgage, pension, avgInvest, serviceYears, buyYear, loanYears);
    renderCharts(labels, incomeData, assetData, stackExpense, stackMortgage, stackInvest, stackSurplus, serviceYears);
    generateReport(currentAsset, pension, stackMortgage, stackInvest, incomeData, buyYear, loanYears, serviceYears, mortgageEndYear);
}

// =========================================================
// 4. 更新畫面數值
// =========================================================
function updateUI(asset, mortgage, pension, avgInvest, serviceYears, buyYear, loanYears) {
    document.getElementById('total-asset').innerText = formatMoney(asset);
    document.getElementById('monthly-mortgage').innerText = formatMoney(mortgage);
    document.getElementById('avg-invest').innerText = formatMoney(avgInvest);
    
    const pensionEl = document.getElementById('pension-monthly');
    pensionEl.innerText = pension > 0 ? formatMoney(pension) : "未達門檻";
    pensionEl.className = pension > 0 ? "text-2xl font-black text-green-700 mt-1" : "text-xl font-bold text-gray-400 mt-1";

    const statusEl = document.getElementById('final-status');
    const mortgageEnd = buyYear + loanYears;
    const yearsAfterRetire = mortgageEnd - serviceYears;
    statusEl.innerHTML = yearsAfterRetire > 0 
        ? `<span class="text-red-600">⚠️ 退伍後仍需繳 ${yearsAfterRetire} 年</span>` 
        : `<span class="text-green-600">✅ 退伍前已還清</span>`;
}

// =========================================================
// 5. 圖表渲染 (Chart.js)
// =========================================================
function renderCharts(labels, income, asset, expense, mortgage, invest, surplus, serviceYears) {
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();

    // Chart 1: 資產趨勢圖 (折線)
    const ctx1 = document.getElementById('financialChart').getContext('2d');
    chart1Instance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: '月收入', data: income, borderColor: '#3b82f6', yAxisID: 'y', tension: 0.1, pointRadius: 1 },
                { label: '累積資產', data: asset, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, yAxisID: 'y1', tension: 0.3, pointRadius: 0 }
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
            scales: { y: { display: true, position: 'left' }, y1: { display: true, position: 'right' } }
        }
    });

    // Chart 2: 每月現金流結構 (堆疊長條圖)
    const ctx2 = document.getElementById('cashflowChart').getContext('2d');
    chart2Instance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: '生活支出', data: expense, backgroundColor: '#9ca3af' }, // 灰
                { label: '房貸支出', data: mortgage, backgroundColor: '#f97316' }, // 橘
                { label: '實際投資', data: invest, backgroundColor: '#8b5cf6' },   // 紫
                { label: '現金結餘', data: surplus, backgroundColor: '#34d399' }   // 綠
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { 
                x: { stacked: true }, 
                y: { stacked: true, title: {display:true, text:'金額 ($)'} } 
            },
            plugins: { 
                tooltip: { 
                    callbacks: { 
                        footer: (items) => {
                            let total = 0; items.forEach(i => total += i.raw); 
                            return '月總流出: ' + formatMoney(total);
                        }
                    } 
                } 
            }
        }
    });
}

// =========================================================
// 6. 生成文字報告
// =========================================================
function generateReport(asset, pension, mortgageData, investData, incomeData, buyYear, loanYears, serviceYears, mortgageEndYear) {
    let maxMortgage = Math.max(...mortgageData);
    let lastIncome = incomeData[serviceYears-1];
    let maxInvest = Math.max(...investData);
    
    const html = `
        <div class="space-y-3">
            <p><strong>1. 動態收支分析：</strong>
               採用百分比配置，隨著您的階級與年資增長，您的生活品質（支出）與投資本金將自動提升。
               <br>在服役後期，您的平均月投資額可達 <span class="text-violet-700 font-bold">${formatMoney(maxInvest)}</span>。
            </p>
            <p><strong>2. 房貸壓力測試：</strong>
               最高房貸月付金為 <strong>${formatMoney(maxMortgage)}</strong>。
               ${maxMortgage > (lastIncome * 0.5) ? '<span class="text-red-600 font-bold">警訊：房貸佔比過高！</span>' : '<span class="text-green-600">房貸在安全範圍內。</span>'}
            </p>
            <p><strong>3. 資產累積：</strong>
               預估最終資產為 <strong>${formatMoney(asset)}</strong>。
            </p>
        </div>
    `;
    document.getElementById('analysis-report').innerHTML = html;
}

// =========================================================
// 7. 初始化監聽
// =========================================================
document.addEventListener('DOMContentLoaded', () => { 
    addCustomAllowance(); 
    document.body.addEventListener('input', (e) => { 
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') runSimulation(); 
    }); 
    runSimulation(); 
});
