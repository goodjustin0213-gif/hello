// =========================================================
// 0. 插件註冊檢查 (關鍵修復：確保圖表能畫出輔助線)
// =========================================================
if (typeof Chart !== 'undefined') {
    // 設定全域字型
    Chart.defaults.font.family = "'Segoe UI', 'Helvetica', 'Arial', sans-serif";
    
    // 檢查並註冊 Annotation 插件
    if (window['chartjs-plugin-annotation']) {
        Chart.register(window['chartjs-plugin-annotation']);
    } else {
        console.warn("Chart.js Annotation Plugin 未載入，輔助線將無法顯示。");
    }
}

// =========================================================
// 1. 資料庫與常數定義 (114年新制參數)
// =========================================================
const SALARY_DB = {
    // 尉官
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, food_add: 2840, annual_growth: 0.015, promotion_years: 1, max_years: 12 },
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, food_add: 2840, annual_growth: 0.015, promotion_years: 3, max_years: 12 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 17 },
    // 校官
    'M1': { rank: '少校', base: 32710, pro_add: 45000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 22 },
    'M2': { rank: '中校', base: 37310, pro_add: 55000, food_add: 2840, annual_growth: 0.015, promotion_years: 4, max_years: 26 },
    'M3': { rank: '上校', base: 41900, pro_add: 65000, food_add: 2840, annual_growth: 0.015, promotion_years: 6, max_years: 30 },
    // 將官
    'G1': { rank: '少將', base: 48030, pro_add: 70000, food_add: 2840, annual_growth: 0.01, promotion_years: 4, max_years: 35 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1'];
const VOLUNTEER_ADDITION = 15000;       // 志願役加給
const PENSION_DEDUCTION_RATE = 0.049;   // 退撫自提費率

// 全域變數
let chart1Instance = null;
let chart2Instance = null;
let allowanceCounter = 0;

// =========================================================
// 2. UI 互動與格式化工具
// =========================================================

// 金額格式化 (加入千分位與正負號)
function formatMoney(num) {
    if (isNaN(num)) return '$0';
    const absVal = Math.abs(Math.round(num));
    return num < 0 ? `-$${absVal.toLocaleString()}` : `$${absVal.toLocaleString()}`;
}

// 同步滑桿與輸入框
function syncSlider(val) { 
    document.getElementById('returnRateSlider').value = val; 
    runSimulation(); 
}
function syncInput(val) { 
    document.getElementById('returnRate').value = val; 
    runSimulation(); 
}

// 動態新增加給欄位
function addCustomAllowance() {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const id = `allowance-${allowanceCounter}`;
    
    // 預設值邏輯：第一筆給外島，其餘給職務
    let defName = "職務加給", defVal = 5000, defStart = 5, defEnd = 10;
    if (allowanceCounter === 1) { defName = "外島加給"; defVal = 9790; defStart = 1; defEnd = 3; }

    const html = `
        <div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-xs bg-gray-50 p-1 rounded border border-gray-100 animate-fade-in">
            <div class="col-span-4"><input type="text" value="${defName}" class="w-full border-none bg-transparent px-1 allow-name text-gray-600 font-bold" placeholder="名稱" oninput="runSimulation()"></div>
            <div class="col-span-3"><input type="number" value="${defVal}" class="w-full border rounded px-1 allow-value h-6 text-right" placeholder="$" oninput="runSimulation()"></div>
            <div class="col-span-2"><input type="number" value="${defStart}" class="w-full border rounded px-1 text-center allow-start h-6" oninput="runSimulation()"></div>
            <div class="col-span-2"><input type="number" value="${defEnd}" class="w-full border rounded px-1 text-center allow-end h-6" oninput="runSimulation()"></div>
            <div class="col-span-1 text-center"><button onclick="document.getElementById('${id}').remove(); runSimulation()" class="text-red-400 hover:text-red-600 font-bold">×</button></div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
    runSimulation();
}

// =========================================================
// 3. 核心模擬引擎 (Complete Logic)
// =========================================================
function runSimulation() {
    // --- A. 讀取與轉換輸入參數 ---
    const targetRank = document.getElementById('targetRank').value;
    const serviceYears = parseInt(document.getElementById('serviceYears').value) || 20;
    
    // 百分比轉小數
    const livingCostPercent = parseInt(document.getElementById('livingCostPercent').value) / 100;
    const monthlyInvestPercent = parseInt(document.getElementById('monthlyInvestPercent').value) / 100;
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100;

    // 房貸參數
    const housePrice = parseInt(document.getElementById('housePriceWan').value) * 10000;
    const downPayPct = parseFloat(document.getElementById('downPaymentPercent').value) / 100;
    const mortgageRate = parseFloat(document.getElementById('mortgageRate').value) / 100;
    const loanYears = parseInt(document.getElementById('loanYears').value);
    const buyYear = parseInt(document.getElementById('buyHouseYear').value);

    // --- B. 計算 PMT 房貸月付金 ---
    const loanAmount = housePrice * (1 - downPayPct);
    const r_monthly = mortgageRate / 12;
    const n_months = loanYears * 12;
    let monthlyMortgage = 0;
    
    // [修正] 避免利率為 0 時除以零錯誤
    if (loanAmount > 0) {
        if (mortgageRate > 0) {
            monthlyMortgage = loanAmount * (r_monthly * Math.pow(1 + r_monthly, n_months)) / (Math.pow(1 + r_monthly, n_months) - 1);
        } else {
            monthlyMortgage = loanAmount / n_months;
        }
    }
    monthlyMortgage = Math.round(monthlyMortgage);

    // --- C. 模擬變數初始化 ---
    let currentAsset = 0;
    let currentRank = 'S2';
    let yearOfRank = 0;
    let forceRetired = false;
    let retiredYear = 0;

    // 讀取動態加給
    const allowances = [];
    document.querySelectorAll('#custom-allowances-container > div').forEach(row => {
        allowances.push({
            val: parseInt(row.querySelector('.allow-value').value) || 0,
            start: parseInt(row.querySelector('.allow-start').value) || 0,
            end: parseInt(row.querySelector('.allow-end').value) || 99
        });
    });

    // 決定模擬總年數 (至少跑完服役，若有房貸則延伸至還完)
    const mortgageEndYear = buyYear + loanYears - 1;
    const maxSimulationYear = Math.max(serviceYears, mortgageEndYear + 1);

    // 資料容器 (Arrays)
    const labels = [];
    const incomeData = [];
    const assetData = [];
    // 堆疊圖數據
    const stackExpense = [];
    const stackMortgage = [];
    const stackInvest = [];
    const stackSurplus = [];

    // --- D. 預算退休俸 (Shadow Simulation) ---
    // 跑一次虛擬晉升以取得退伍當下的本俸，用於計算終身俸
    let tempRank = 'S2';
    let tempYOR = 0;
    let finalBase = 0;
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
    
    // 計算終身俸 (新制簡易版)
    let pension = 0;
    if (serviceYears >= 20) {
        const ratio = 0.55 + (serviceYears - 20) * 0.02; 
        pension = Math.round(finalBase * 2 * Math.min(ratio, 0.95));
    }

    // 統計用變數
    let totalInvestSum = 0;
    let investMonthsCount = 0;

    // --- E. 執行逐年模擬 (Main Loop) ---
    for (let year = 1; year <= maxSimulationYear; year++) {
        
        let isActiveDuty = year <= serviceYears;
        let netMonthlyIncome = 0;
        let annualIncomeTotal = 0;

        // 強制退伍檢查
        if (isActiveDuty && year > SALARY_DB[currentRank].max_years) {
            forceRetired = true; retiredYear = year - 1; isActiveDuty = false;
        }

        // 1. 計算該年度月收入
        if (isActiveDuty) {
            // 晉升邏輯
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
            // 年收入 = 月薪*12 + 年終 (估2.5個月本俸)
            annualIncomeTotal = (netMonthlyIncome * 12) + Math.round(baseWage * 2.5); 
            yearOfRank++;
        } else {
            // 退伍後收入
            netMonthlyIncome = (serviceYears >= 20 || (forceRetired && retiredYear >= 20)) ? pension : 0;
            annualIncomeTotal = netMonthlyIncome * 12;
        }

        // 2. 支出分配 (依百分比動態計算)
        // 核心：薪水越高，花的越多，存的也越多
        let actualMonthlyExpense = Math.round(netMonthlyIncome * livingCostPercent);
        let actualMonthlyInvest = Math.round(netMonthlyIncome * monthlyInvestPercent);
        
        // 3. 房貸計算
        let isPayingMortgage = (year >= buyYear && year < (buyYear + loanYears));
        let actualMonthlyMortgage = isPayingMortgage ? monthlyMortgage : 0;

        // 4. 計算現金流結餘與赤字處理 (Deficit Handling)
        // 初步結餘 = 收入 - 支出 - 投資 - 房貸
        let actualMonthlySurplus = netMonthlyIncome - actualMonthlyExpense - actualMonthlyInvest - actualMonthlyMortgage;

        // [重要] 赤字防禦邏輯：錢不夠時，先砍投資，再吃老本
        if (actualMonthlySurplus < 0) {
            // A計畫: 減少投資金額來填補赤字
            if (actualMonthlyInvest + actualMonthlySurplus >= 0) {
                actualMonthlyInvest += actualMonthlySurplus; // 減少投資 (Surplus是負的，所以是相加)
                actualMonthlySurplus = 0;
            } else {
                // B計畫: 投資減到0還不夠 -> 變成真正的赤字 (會扣資產)
                let deficit = actualMonthlySurplus + actualMonthlyInvest; // 剩餘的負債
                actualMonthlyInvest = 0; 
                actualMonthlySurplus = deficit; // 保持負值，稍後從資產扣除
            }
        }

        // 統計平均投資 (僅統計服役期間)
        if (isActiveDuty) {
            totalInvestSum += actualMonthlyInvest;
            investMonthsCount++;
        }

        // 5. 資產變動計算
        // 扣除頭期款 (購屋當年)
        if (year === buyYear) currentAsset -= (housePrice * downPayPct);

        // 年現金流計算
        // 假設：年終獎金按同樣投資比例分配，剩下的年終直接存入資產
        let annualBonus = isActiveDuty ? (annualIncomeTotal - netMonthlyIncome * 12) : 0;
        let bonusInvest = annualBonus * monthlyInvestPercent;
        let bonusSave = annualBonus - bonusInvest; 

        // 總年投入 = (月投資*12) + 年終投資部分
        let totalAnnualInvest = (actualMonthlyInvest * 12) + bonusInvest;
        
        // 總年淨流 = (月結餘*12) + 年終剩餘部分
        // 注意：若 actualMonthlySurplus 是負的，這裡會正確地從資產中扣除 (吃老本)
        let totalAnnualNetCashflow = (actualMonthlySurplus * 12) + bonusSave;

        // 複利公式：(本金 * (1+r)) + 本金投入 + 淨現金流
        currentAsset = currentAsset * (1 + returnRate) + totalAnnualInvest + totalAnnualNetCashflow;

        // 6. 記錄圖表數據
        labels.push(`第${year}年`);
        incomeData.push(netMonthlyIncome);
        assetData.push(Math.round(currentAsset));

        // 堆疊圖數據處理 (確保圖表顯示美觀)
        stackExpense.push(actualMonthlyExpense);
        stackMortgage.push(actualMonthlyMortgage);
        stackInvest.push(actualMonthlyInvest);
        // 如果是赤字(負值)，圖表結餘顯示0 (實際上資產已扣，圖表不顯示負Bar)
        stackSurplus.push(Math.max(0, actualMonthlySurplus));
    }

    // 計算平均月投資額
    let avgInvest = investMonthsCount > 0 ? Math.round(totalInvestSum / investMonthsCount) : 0;

    // --- F. 更新畫面 ---
    updateUI(currentAsset, monthlyMortgage, pension, avgInvest, serviceYears, buyYear, loanYears);
    renderCharts(labels, incomeData, assetData, stackExpense, stackMortgage, stackInvest, stackSurplus, serviceYears);
    generateReport(currentAsset, pension, stackMortgage, stackInvest, incomeData, buyYear, loanYears, serviceYears, mortgageEndYear);
}

// =========================================================
// 4. 畫面更新函數
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
// 5. 圖表渲染 (Chart.js Configuration)
// =========================================================
function renderCharts(labels, income, asset, expense, mortgage, invest, surplus, serviceYears) {
    // 銷毀舊圖表實例 (防止重疊 bug)
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();

    // Chart 1: 資產與收入趨勢 (折線圖)
    const ctx1 = document.getElementById('financialChart').getContext('2d');
    chart1Instance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: '月收入', 
                    data: income, 
                    borderColor: '#3b82f6', // Blue
                    yAxisID: 'y', 
                    tension: 0.1, 
                    pointRadius: 1 
                },
                { 
                    label: '累積資產', 
                    data: asset, 
                    borderColor: '#10b981', // Green
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                    fill: true, 
                    yAxisID: 'y1', 
                    tension: 0.3, 
                    pointRadius: 0 
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { 
                annotation: { 
                    annotations: { 
                        line1: { 
                            type: 'line', 
                            xMin: serviceYears - 0.5, 
                            xMax: serviceYears - 0.5, 
                            borderColor: 'gray', 
                            borderWidth: 2, 
                            borderDash: [5, 5], 
                            label: { display: true, content: '退伍', position: 'start', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', font: {size: 10} } 
                        } 
                    } 
                } 
            },
            scales: { 
                y: { display: true, position: 'left', title: {display:true, text:'月收入'} }, 
                y1: { display: true, position: 'right', title: {display:true, text:'總資產'} } 
            }
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
                        // Tooltip 顯示當月總流向
                        footer: (items) => {
                            let total = 0; items.forEach(i => total += i.raw); 
                            return '當月總流向: ' + formatMoney(total);
                        }
                    } 
                },
                annotation: { 
                    annotations: { 
                        line1: { 
                            type: 'line', 
                            xMin: serviceYears - 0.5, 
                            xMax: serviceYears - 0.5, 
                            borderColor: 'gray', 
                            borderWidth: 2, 
                            borderDash: [5, 5]
                        } 
                    } 
                } 
            }
        }
    });
}

// =========================================================
// 6. 生成報告文字
// =========================================================
function generateReport(asset, pension, mortgageData, investData, incomeData, buyYear, loanYears, serviceYears, mortgageEndYear) {
    let maxMortgage = Math.max(...mortgageData);
    let lastIncome = incomeData[serviceYears-1] || 0;
    let maxInvest = Math.max(...investData);
    
    // 報告生成邏輯
    const html = `
        <div class="space-y-3">
            <p class="flex items-start gap-2">
                <span class="text-blue-500 font-bold">1.</span>
                <span><strong>動態收支分析：</strong>
                採用百分比配置，隨著您的階級與年資增長，生活品質與投資本金自動提升。
                <br>服役後期，您的月投資額最高可達 <span class="text-violet-700 font-bold">${formatMoney(maxInvest)}</span>。</span>
            </p>
            <p class="flex items-start gap-2">
                <span class="text-orange-500 font-bold">2.</span>
                <span><strong>房貸壓力檢測：</strong>
                最高房貸月付金為 <strong>${formatMoney(maxMortgage)}</strong>。
                ${maxMortgage > (lastIncome * 0.5) 
                    ? '<span class="text-red-600 font-bold block mt-1">⚠️ 警訊：佔比過高 (>50%)！建議增加頭期款或降低預算。</span>' 
                    : '<span class="text-green-600 font-bold block mt-1">✅ 安全：房貸在合理範圍內。</span>'}
                </span>
            </p>
            <p class="flex items-start gap-2">
                <span class="text-emerald-500 font-bold">3.</span>
                <span><strong>最終成果：</strong>
                模擬結束時（第 ${mortgageData.length} 年），預估累積淨資產為 <strong>${formatMoney(asset)}</strong>。
                ${pension > 0 ? `且享有月退俸 <strong>${formatMoney(pension)}</strong>。` : '因未滿20年，無終身俸。'}
                </span>
            </p>
        </div>
    `;
    document.getElementById('analysis-report').innerHTML = html;
}

// =========================================================
// 7. 初始化啟動
// =========================================================
document.addEventListener('DOMContentLoaded', () => { 
    addCustomAllowance(); // 新增預設加給
    
    // 綁定所有 input 和 select 變更事件
    document.body.addEventListener('input', (e) => { 
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') runSimulation(); 
    }); 
    
    // 延遲執行以確保 Chart.js 載入完成
    setTimeout(runSimulation, 200);
});
