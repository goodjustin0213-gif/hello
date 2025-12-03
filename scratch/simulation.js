// =========================================================
// DATA SOURCE: 114年1月1日生效 志願役現役軍人俸額表
// =========================================================
const REAL_SALARY_STRUCTURE = {
    // 校官與尉官資料 (依據 source: 2 更新本俸)
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, food_add: 2840, promotion_years: 3, annual_growth: 0.015 },
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, food_add: 2840, promotion_years: 4, annual_growth: 0.015 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, food_add: 2840, promotion_years: 7, annual_growth: 0.015 },
    'M1': { rank: '少校', base: 32710, pro_add: 45000, food_add: 2840, promotion_years: 6, annual_growth: 0.015 },
    'M2': { rank: '中校', base: 37310, pro_add: 55000, food_add: 2840, promotion_years: 6, annual_growth: 0.015 },
    'M3': { rank: '上校', base: 41900, pro_add: 65000, food_add: 2840, promotion_years: 6, annual_growth: 0.015 },

    // 新增將官階級 (本俸依據 source: 2，專業加給為推估值，因文件未列出)
    'G1': { rank: '少將', base: 48030, pro_add: 70000, food_add: 2840, promotion_years: 4, annual_growth: 0.01 },
    'G2': { rank: '中將', base: 53390, pro_add: 80000, food_add: 2840, promotion_years: 3, annual_growth: 0.01 },
    'G3': { rank: '二級上將', base: 109520, pro_add: 90000, food_add: 2840, promotion_years: Infinity, annual_growth: 0.01 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1', 'G2', 'G3'];

// 志願役人員固定加給 (NT$15,000)
const VOLUNTEER_ADDITION_2026 = 15000;

// 國軍退撫基金提撥率 (假設 14%，其中個人負擔 35%)
const PENSION_RATE = 0.14; 
const INDIVIDUAL_PENSION_RATIO = 0.35; 

let financialChartInstance;
let scenarioChartInstance;
let allowanceCounter = 0;

// --- 輔助函數 ---

function formatCurrency(number) {
    if (isNaN(number) || number === 0) return '--';
    const absNum = Math.abs(Math.round(number));
    const sign = number < 0 ? "-" : "";
    return `${sign}NT$ ${absNum.toLocaleString('zh-TW')}`;
}

/**
 * 新增一組自訂加給輸入框 (名稱 + 金額 + 起始年 + 結束年)
 */
function addCustomAllowance() {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const itemId = `custom-item-${allowanceCounter}`;
    const maxYears = document.getElementById('serviceYears').value;

    // 範例預設值
    let defaultName = "";
    let defaultValue = 0;
    let defaultStart = 1;
    let defaultEnd = maxYears;
    
    // 如果是第一筆，給個範例引導使用者
    if (allowanceCounter === 1 && container.children.length === 0) {
        defaultName = "外島加給 (範例)";
        defaultValue = 9790;
        defaultStart = 1;
        defaultEnd = 3; // 假設只去3年
    }

    const newAllowanceHtml = `
        <div id="${itemId}" class="grid grid-cols-12 gap-1 items-center allowance-row mb-2">
            <div class="col-span-4">
                <input type="text" placeholder="項目" value="${defaultName}" class="w-full border rounded-md py-1 px-2 text-sm allow-name" oninput="runSimulation()">
            </div>
            <div class="col-span-3">
                <input type="number" placeholder="金額" value="${defaultValue}" class="w-full border rounded-md py-1 px-2 text-sm allow-value" oninput="runSimulation()">
            </div>
            <div class="col-span-2">
                <input type="number" placeholder="始" value="${defaultStart}" min="1" class="w-full border rounded-md py-1 px-1 text-sm text-center allow-start" oninput="runSimulation()">
            </div>
            <div class="col-span-2">
                <input type="number" placeholder="末" value="${defaultEnd}" min="1" class="w-full border rounded-md py-1 px-1 text-sm text-center allow-end" oninput="runSimulation()">
            </div>
            <div class="col-span-1 text-center">
                <button type="button" onclick="document.getElementById('${itemId}').remove(); runSimulation();" class="text-red-500 hover:text-red-700 font-bold text-lg">
                    &times;
                </button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', newAllowanceHtml);
}

/**
 * 獲取所有自訂加給的設定 (回傳陣列)
 */
function getCustomAllowancesConfig() {
    const rows = document.querySelectorAll('.allowance-row');
    const configs = [];
    
    rows.forEach(row => {
        const amount = parseInt(row.querySelector('.allow-value').value) || 0;
        const start = parseInt(row.querySelector('.allow-start').value) || 1;
        const end = parseInt(row.querySelector('.allow-end').value) || 100;
        
        if (amount > 0) {
            configs.push({ amount, start, end });
        }
    });
    return configs;
}

/**
 * 計算某一年度的額外加給總和
 * 邏輯：檢查當前年份是否在設定的 start 與 end 之間
 */
function calculateYearlyAllowance(year, allowanceConfigs) {
    let total = 0;
    allowanceConfigs.forEach(config => {
        if (year >= config.start && year <= config.end) {
            total += config.amount;
        }
    });
    return total;
}

/**
 * 根據階級、年資、及「該年度」的自訂津貼計算當前月薪總額
 */
function calculateMonthlySalary(rankCode, year, currentYearAllowance) {
    const data = REAL_SALARY_STRUCTURE[rankCode];
    if (!data) return 0;
    
    const pensionBase = data.base + data.pro_add;
    
    // 稅前總收入 (本俸 + 專業 + 伙食 + 志願役1.5萬 + 該年自訂加給)
    let monthlyTotal = pensionBase + data.food_add + VOLUNTEER_ADDITION_2026 + currentYearAllowance;
    
    // 考慮年度基礎成長 (本俸與專業加給隨年資成長)
    monthlyTotal *= (1 + data.annual_growth) ** (year - 1);
    
    // 扣除退撫 (基準也隨年資成長)
    const actualPensionDeduction = pensionBase * PENSION_RATE * INDIVIDUAL_PENSION_RATIO * ((1 + data.annual_growth) ** (year - 1));

    return Math.round(monthlyTotal - actualPensionDeduction);
}

function renderFinancialChart(years, salaryData, assetData) {
    if (financialChartInstance) financialChartInstance.destroy();
    const ctx = document.getElementById('financialChart').getContext('2d');
    financialChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: '每月淨薪資 (含加給)', 
                    data: salaryData,
                    borderColor: 'rgb(79, 70, 229)', yAxisID: 'y1', fill: false, tension: 0.1
                },
                {
                    label: '累積資產',
                    data: assetData,
                    borderColor: 'rgb(20, 184, 166)', yAxisID: 'y2', fill: true, backgroundColor: 'rgba(20, 184, 166, 0.2)', tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y1: { type: 'linear', display: true, position: 'left', title: { display: true, text: '月淨薪資 (元)' } },
                y2: { type: 'linear', display: true, position: 'right', title: { display: true, text: '累積資產 (元)' }, grid: { drawOnChartArea: false } }
            },
        }
    });
}

function renderScenarioChart(years, baseSalaryData, livingCost, monthlySavings) {
    if (scenarioChartInstance) scenarioChartInstance.destroy();
    const lowRate = 0.02; const highRate = 0.08;
    const baseRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0;

    const calcScenarioAsset = (rate) => {
        let asset = 0;
        const data = [];
        for (let i = 0; i < baseSalaryData.length; i++) {
            // 定額儲蓄制：每年固定存入 (monthlySavings * 12) + 複利
            asset = asset * (1 + rate) + (monthlySavings * 12);
            data.push(asset);
        }
        return data;
    };
    
    const baseAsset = calcScenarioAsset(baseRate);
    const lowAsset = calcScenarioAsset(lowRate);
    const highAsset = calcScenarioAsset(highRate); 

    const ctx = document.getElementById('scenarioChart').getContext('2d');
    scenarioChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                { label: `低風險 (${lowRate * 100}%)`, data: lowAsset, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)', tension: 0.2 },
                { label: `您的設定 (${baseRate * 100}%)`, data: baseAsset, borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)', borderWidth: 3, tension: 0.2 },
                { label: `高風險 (${highRate * 100}%)`, data: highAsset, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)', tension: 0.2 }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: { y: { title: { display: true, text: '累積資產 (元)' } } }
        }
    });
}

function runSimulation() {
    const targetRank = document.getElementById('targetRank').value;
    const serviceYears = parseInt(document.getElementById('serviceYears').value) || 0;
    const monthlySavings = parseInt(document.getElementById('monthlySavings').value) || 0;
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0;
    const livingCost = parseInt(document.getElementById('livingCost').value) || 0;
    
    // 1. 取得所有加給的設定 (陣列)
    const allowanceConfigs = getCustomAllowancesConfig();
    
    if (serviceYears < 10 || isNaN(serviceYears)) {
        return; // 基本錯誤檢查
    }

    let currentAsset = 0;
    let currentRank = 'S2'; 
    let yearOfRank = 0; 
    let totalCashFlow = 0;
    
    const years = [];
    const monthlySalaryData = [];
    const totalAssetData = [];
    const targetRankIndex = RANK_ORDER.indexOf(targetRank);

    for (let year = 1; year <= serviceYears; year++) {
        years.push(`第 ${year} 年`);

        // 2. 晉升邏輯
        const currentRankData = REAL_SALARY_STRUCTURE[currentRank];
        const currentIndex = RANK_ORDER.indexOf(currentRank);
        
        if (yearOfRank >= currentRankData.promotion_years && currentIndex < targetRankIndex) {
            const nextRankIndex = currentIndex + 1;
            if (nextRankIndex <= targetRankIndex) { 
                currentRank = RANK_ORDER[nextRankIndex];
                yearOfRank = 0; 
            }
        }
        
        // 3. 計算該年度適用的加給總額
        const currentYearAllowance = calculateYearlyAllowance(year, allowanceConfigs);

        // 4. 計算月薪 (帶入該年度的加給)
        let monthlySalary = calculateMonthlySalary(currentRank, year, currentYearAllowance);
        monthlySalaryData.push(monthlySalary);

        // 5. 財務計算 (定額儲蓄制)
        const annualSalary = monthlySalary * 12;
        const annualLivingCost = livingCost * 12;
        const annualSavingsInvestment = monthlySavings * 12;
        const annualNetIncome = annualSalary - annualLivingCost;
        const annualRemainingCash = annualNetIncome - annualSavingsInvestment;
        
        totalCashFlow += annualRemainingCash;
        currentAsset = currentAsset * (1 + returnRate) + annualSavingsInvestment;
        totalAssetData.push(currentAsset);
        
        yearOfRank++; 
    }

    const finalAsset = totalAssetData[totalAssetData.length - 1] || 0;
    const avgMonthlyCashFlow = totalCashFlow / serviceYears / 12 || 0;
    
    document.getElementById('total-asset').innerText = formatCurrency(finalAsset);
    document.getElementById('avg-cashflow').innerText = formatCurrency(avgMonthlyCashFlow);
    
    renderFinancialChart(years, monthlySalaryData, totalAssetData);
    renderScenarioChart(years, monthlySalaryData, livingCost, monthlySavings);
}

// 系統啟動與事件綁定
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('custom-allowances-container');
    if (container.children.length === 0) {
        addCustomAllowance(); // 預設新增一筆
    }
    
    // 綁定輸入事件以即時更新
    document.querySelectorAll('#input-parameters input, #input-parameters select').forEach(element => {
        element.addEventListener('change', runSimulation);
        element.addEventListener('input', runSimulation);
    });

    runSimulation();
});
