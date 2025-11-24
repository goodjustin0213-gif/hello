// =========================================================
// MOCK DATA: 國軍軍官薪資結構 (請替換為真實數據)
// 單位：新台幣 (元) / 月
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

/**
 * 格式化數字為新台幣貨幣格式
 */
function formatCurrency(number) {
    if (isNaN(number) || number === 0) return '--';
    return `NT$ ${Math.round(number).toLocaleString('zh-TW')}`;
}

/**
 * 根據階級和年資計算當前月薪總額
 */
function calculateMonthlySalary(rankCode, year) {
    const data = REAL_SALARY_STRUCTURE[rankCode];
    if (!data) return 0;
    
    let monthlyTotal = data.base + data.pro_add + data.food_add;
    monthlyTotal *= (1 + data.annual_growth) ** (year - 1);
    
    return Math.round(monthlyTotal);
}

/**
 * 執行核心財務模擬運算
 */
function runSimulation() {
    // 1. 取得使用者輸入參數
    const targetRank = document.getElementById('targetRank').value; // 讀取最終目標階級
    const serviceYears = parseInt(document.getElementById('serviceYears').value);
    const savingsRate = parseFloat(document.getElementById('savingsRate').value) / 100;
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100;
    const livingCost = parseInt(document.getElementById('livingCost').value);
    const loanRate = parseFloat(document.getElementById('loanRate').value) / 100;

    if (!serviceYears || isNaN(savingsRate) || isNaN(returnRate) || isNaN(livingCost)) {
        document.getElementById('simulation-status').innerText = '請確認所有數值輸入正確。';
        document.getElementById('simulation-status').classList.remove('hidden');
        return;
    }
    document.getElementById('simulation-status').classList.add('hidden');

    // 2. 核心計算迴圈初始化
    let currentAsset = 0;
    let currentRank = 'S2'; // 固定起始階級為 少尉 (S2)
    let yearOfRank = 0; 
    let totalCashFlow = 0;
    
    const years = [];
    const monthlySalaryData = [];
    const totalAssetData = [];
    
    // 獲取目標階級在排序中的索引，用於限制最高晉升位階
    const targetRankIndex = RANK_ORDER.indexOf(targetRank); 

    for (let year = 1; year <= serviceYears; year++) {
        years.push(`第 ${year} 年`);

        // 檢查晉升邏輯：
        const currentRankData = REAL_SALARY_STRUCTURE[currentRank];
        const currentIndex = RANK_ORDER.indexOf(currentRank);
        
        // 條件：1. 達到當前階級的服役年限 AND 2. 當前階級仍在目標階級之前
        if (yearOfRank >= currentRankData.promotion_years && currentIndex < targetRankIndex) {
            
            const nextRankIndex = currentIndex + 1;
            if (nextRankIndex <= targetRankIndex) { 
                currentRank = RANK_ORDER[nextRankIndex];
                yearOfRank = 0; // 晉升後年數重置
            }
        }
        
        // 獲取當前月薪
        let monthlySalary = calculateMonthlySalary(currentRank, year);
        monthlySalaryData.push(monthlySalary);

        // 財務計算
        const annualSalary = monthlySalary * 12;
        const annualLivingCost = livingCost * 12;
        const annualNetIncome = annualSalary - annualLivingCost;
        const annualSavingsInvestment = annualNetIncome * savingsRate;
        const annualRemainingCash = annualNetIncome * (1 - savingsRate);
        
        totalCashFlow += annualRemainingCash;
        currentAsset = currentAsset * (1 + returnRate) + annualSavingsInvestment;
        totalAssetData.push(currentAsset);
        
        yearOfRank++; 
    }

    // 3. 輸出核心數據
    const finalAsset = totalAssetData[totalAssetData.length - 1];
    const avgMonthlyCashFlow = totalCashFlow / serviceYears / 12;
    
    document.getElementById('total-asset').innerText = formatCurrency(finalAsset);
    document.getElementById('avg-cashflow').innerText = formatCurrency(avgMonthlyCashFlow);
    
    // 簡化置產能力評估 (假設每月房貸不超過每月淨現金流的 40%)
    const maxMonthlyPayment = avgMonthlyCashFlow * 0.4;
    const monthlyRate = loanRate / 12;
    const loanMonths = 240; // 假設 20 年期
    const maxAffordableLoan = maxMonthlyPayment * ((Math.pow(1 + monthlyRate, loanMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, loanMonths)));
    document.getElementById('afford-loan').innerText = formatCurrency(maxAffordableLoan);

    // 4. 繪製圖表
    renderFinancialChart(years, monthlySalaryData, totalAssetData);
    renderScenarioChart(years, monthlySalaryData, livingCost, savingsRate);
}

// ... [其他輔助函數 renderFinancialChart, renderScenarioChart 保持不變] ...

// 系統啟動時，自動運行一次模擬以顯示預設圖表
document.addEventListener('DOMContentLoaded', () => {
    runSimulation();
});
