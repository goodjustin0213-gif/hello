// =========================================================
// MOCK DATA: 國軍軍官薪資結構 (請替換為真實數據)
// =========================================================
const REAL_SALARY_STRUCTURE = {
    'S2': { rank: '少尉', base: 26000, pro_add: 28000, food_add: 2840, promotion_years: 3, annual_growth: 0.015 },
    'S3': { rank: '中尉', base: 28000, pro_add: 30000, food_add: 2840, promotion_years: 4, annual_growth: 0.015 },
    'S4': { rank: '上尉', base: 31000, pro_add: 35000, food_add: 2840, promotion_years: 7, annual_growth: 0.015 },
    'M1': { rank: '少校', base: 38000, pro_add: 45000, food_add: 2840, promotion_years: 6, annual_growth: 0.015 },
    'M2': { rank: '中校', base: 45000, pro_add: 55000, food_add: 2840, promotion_years: 6, annual_growth: 0.015 },
    'M3': { rank: '上校', base: 52000, pro_add: 65000, food_add: 2840, promotion_years: Infinity, annual_growth: 0.015 },
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3'];
let financialChartInstance;
let scenarioChartInstance;

// --- 輔助函數 ---

function formatCurrency(number) {
    if (isNaN(number) || number === 0) return '--';
    return `NT$ ${Math.round(number).toLocaleString('zh-TW')}`;
}

/**
 * 根據階級、年資、及額外津貼計算當前月薪總額
 */
function calculateMonthlySalary(rankCode, year, extraAdd, specialAdd) {
    const data = REAL_SALARY_STRUCTURE[rankCode];
    if (!data) return 0;
    
    // 基礎月薪 = 本俸 + 專業加給 + 伙食津貼 + 額外加給 + 特殊津貼
    let monthlyTotal = data.base + data.pro_add + data.food_add + extraAdd + specialAdd;
    
    // 考慮年度基礎成長
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
    
    // 獲取額外津貼的數值
    const extraProAdd = parseInt(document.getElementById('extraProAdd').value) || 0;
    const specialAllowance = parseInt(document.getElementById('specialAllowance').value) || 0;
    
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
        
        // 獲取當前月薪 (傳入額外加給和津貼數值)
        let monthlySalary = calculateMonthlySalary(currentRank, year, extraProAdd, specialAllowance);
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

// 系統啟動時，自動運行一次模擬以顯示預設圖表
document.addEventListener('DOMContentLoaded', () => {
    runSimulation();
});
