// =========================================================
// MOCK DATA: 國軍軍官薪資結構 (請替換為真實數據)
// =========================================================
const REAL_SALARY_STRUCTURE = {
    // 尉/校級軍官
    'S2': { rank: '少尉', base: 26000, pro_add: 28000, food_add: 2840, promotion_years: 3, annual_growth: 0.015 },
    'S3': { rank: '中尉', base: 28000, pro_add: 30000, food_add: 2840, promotion_years: 4, annual_growth: 0.015 },
    'S4': { rank: '上尉', base: 31000, pro_add: 35000, food_add: 2840, promotion_years: 7, annual_growth: 0.015 },
    'M1': { rank: '少校', base: 38000, pro_add: 45000, food_add: 2840, promotion_years: 6, annual_growth: 0.015 },
    'M2': { rank: '中校', base: 45000, pro_add: 55000, food_add: 2840, promotion_years: 6, annual_growth: 0.015 },
    'M3': { rank: '上校', base: 52000, pro_add: 65000, food_add: 2840, promotion_years: 5, annual_growth: 0.015 },
    // 將級軍官 (模擬數據)
    'S5': { rank: '少將', base: 60000, pro_add: 75000, food_add: 2840, promotion_years: 4, annual_growth: 0.015 },
    'S6': { rank: '中將', base: 70000, pro_add: 85000, food_add: 2840, promotion_years: 3, annual_growth: 0.015 },
    'S7': { rank: '上將', base: 80000, pro_add: 95000, food_add: 2840, promotion_years: Infinity, annual_growth: 0.015 },
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'S5', 'S6', 'S7'];
// 2026年起志願役人員固定加給 (NT$30,000)
const VOLUNTEER_ADDITION_2026 = 30000; 

let financialChartInstance;
let scenarioChartInstance;
let allowanceCounter = 0; // 用於追蹤自訂加給項目的 ID

// --- 輔助函數 ---

function formatCurrency(number) {
    if (isNaN(number) || number === 0) return '--';
    return `NT$ ${Math.round(number).toLocaleString('zh-TW')}`;
}

/**
 * 新增一組自訂加給輸入框 (名稱+金額)
 */
function addCustomAllowance() {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const itemId = `custom-item-${allowanceCounter}`;

    const newAllowanceHtml = `
        <div id="${itemId}" class="flex space-x-2 items-center">
            <input type="text" placeholder="項目名稱 (例如: 超時加給)" class="w-2/3 border rounded-md py-1 px-2 text-sm">
            <input type="number" placeholder="金額 (元/月)" value="0" class="w-1/3 border rounded-md py-1 px-2 text-sm allowance-value">
            <button type="button" onclick="document.getElementById('${itemId}').remove()" class="text-red-500 hover:text-red-700 text-lg font-bold">
                &times;
            </button>
        </div>
    `;
    requestAnimationFrame(() => {
        container.insertAdjacentHTML('beforeend', newAllowanceHtml);
    });
}

/**
 * 計算所有自訂加給輸入框的總和 (避免空值錯誤)
 */
function calculateCustomAllowanceTotal() {
    const allowanceInputs = document.querySelectorAll('.allowance-value');
    let total = 0;
    allowanceInputs.forEach(input => {
        // 使用 parseInt(input.value) || 0 來確保即使輸入為空或無效，也能得到 0
        const value = parseInt(input.value) || 0; 
        total += value;
    });
    return total;
}

/**
 * 根據階級、年資、及自訂津貼計算當前月薪總額
 */
function calculateMonthlySalary(rankCode, year, customAdd) {
    const data = REAL_SALARY_STRUCTURE[rankCode];
    if (!data) return 0;
    
    // 1. 基礎月薪 (本俸 + 專業加給 + 伙食津貼)
    let monthlyTotal = data.base + data.pro_add + data.food_add;
    
    // 2. 加上 2026年起志願役固定加給 (NT$30,000)
    monthlyTotal += VOLUNTEER_ADDITION_2026;
    
    // 3. 加上使用者輸入的所有自訂加給
    monthlyTotal += customAdd;
    
    // 4. 考慮年度基礎成長
    monthlyTotal *= (1 + data.annual_growth) ** (year - 1);
    
    return Math.round(monthlyTotal);
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
                    label: '每月薪資總額 (NT$)',
                    data: salaryData,
                    borderColor: 'rgb(79, 70, 229)', 
                    yAxisID: 'y1',
                    fill: false,
                    tension: 0.1
                },
                {
                    label: '累積資產總額 (NT$)',
                    data: assetData,
                    borderColor: 'rgb(20, 184, 166)', 
                    yAxisID: 'y2',
                    fill: true,
                    backgroundColor: 'rgba(20, 184, 166, 0.2)',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: '月薪總額 (元)' }
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: '累積資產總額 (元)' },
                    grid: { drawOnChartArea: false }
                }
            },
            plugins: { title: { display: true, text: '軍旅生涯財務預測 (薪資與資產累積)' } }
        }
    });
}

function renderScenarioChart(years, baseSalaryData, livingCost, savingsRate) {
    if (scenarioChartInstance) scenarioChartInstance.destroy();

    const lowRate = 0.02; 
    const highRate = 0.08; 
    const baseRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0;

    const calcScenarioAsset = (rate) => {
        let asset = 0;
        const data = [];
        
        for (let i = 0; i < baseSalaryData.length; i++) {
            const monthlySalary = baseSalaryData[i];
            const annualSalary = monthlySalary * 12;
            const annualLivingCost = livingCost * 12;
            const annualNetIncome = Math.max(0, annualSalary - annualLivingCost); 
            const annualSavingsInvestment = annualNetIncome * savingsRate;
            
            asset = asset * (1 + rate) + annualSavingsInvestment;
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
                {
                    label: `低風險資產累積 (報酬率 ${lowRate * 100}%)`,
                    data: lowAsset,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    tension: 0.2,
                },
                {
                    label: `您的假設情境 (報酬率 ${baseRate * 100}%)`,
                    data: baseAsset,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderWidth: 3,
                    tension: 0.2,
                },
                {
                    label: `高風險資產累積 (報酬率 ${highRate * 100}%)`,
                    data: highAsset,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    tension: 0.2,
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: { y: { title: { display: true, text: '累積資產總額 (元)' } } },
            plugins: { title: { display: true, text: '不同投資報酬率下的資產累積情境比較' } }
        }
    });
}

/**
 * 執行核心財務模擬運算 (主要函數)
 */
function runSimulation() {
    // 1. 取得使用者輸入參數
    const targetRank = document.getElementById('targetRank').value;
    const serviceYears = parseInt(document.getElementById('serviceYears').value) || 0;
    const savingsRate = parseFloat(document.getElementById('savingsRate').value) / 100 || 0;
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0;
    const livingCost = parseInt(document.getElementById('livingCost').value) || 0;
    
    // 獲取所有自訂加給的總和 (已修復，確保計算不會出錯)
    const customAllowance = calculateCustomAllowanceTotal(); 
    
    if (serviceYears < 10 || isNaN(serviceYears) || isNaN(livingCost)) {
        document.getElementById('simulation-status').innerText = '請確認服役年數與支出輸入正確。';
        document.getElementById('simulation-status').classList.remove('hidden');
        return;
    }
    document.getElementById('simulation-status').classList.add('hidden');

    // 2. 核心計算迴圈初始化
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

        // 檢查晉升邏輯：
        const currentRankData = REAL_SALARY_STRUCTURE[currentRank];
        const currentIndex = RANK_ORDER.indexOf(currentRank);
        
        if (yearOfRank >= currentRankData.promotion_years && currentIndex < targetRankIndex) {
            
            const nextRankIndex = currentIndex + 1;
            if (nextRankIndex <= targetRankIndex) { 
                currentRank = RANK_ORDER[nextRankIndex];
                yearOfRank = 0; 
            }
        }
        
        // 獲取當前月薪
        let monthlySalary = calculateMonthlySalary(currentRank, year, customAllowance);
        monthlySalaryData.push(monthlySalary);

        // 財務計算
        const annualSalary = monthlySalary * 12;
        const annualLivingCost = livingCost * 12;
        
        const annualNetIncome = Math.max(0, annualSalary - annualLivingCost); 
        
        const annualSavingsInvestment = annualNetIncome * savingsRate;
        const annualRemainingCash = annualNetIncome * (1 - savingsRate);
        
        totalCashFlow += annualRemainingCash;
        currentAsset = currentAsset * (1 + returnRate) + annualSavingsInvestment;
        totalAssetData.push(currentAsset);
        
        yearOfRank++; 
    }

    // 3. 輸出核心數據
    const finalAsset = totalAssetData[totalAssetData.length - 1] || 0;
    const avgMonthlyCashFlow = totalCashFlow / serviceYears / 12 || 0;
    
    document.getElementById('total-asset').innerText = formatCurrency(finalAsset);
    document.getElementById('avg-cashflow').innerText = formatCurrency(avgMonthlyCashFlow);
    
    // 4. 繪製圖表
    renderFinancialChart(years, monthlySalaryData, totalAssetData);
    renderScenarioChart(years, monthlySalaryData, livingCost, savingsRate);
}

// 系統啟動時的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 檢查自訂加給容器是否為空，如果為空，則預設新增一個輸入框
    const container = document.getElementById('custom-allowances-container');
    if (container && container.children.length === 0) {
        addCustomAllowance();
    }
    // 運行初始模擬
    runSimulation();
});
