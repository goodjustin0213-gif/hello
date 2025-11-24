// =========================================================
// MOCK DATA: 國軍軍官薪資結構 (請替換為真實數據)
// 數據結構：階級代碼 (S2, S3, S4, M1...)
// 包含：base (本俸), pro_add (專業加給), food_add (伙食津貼)
// =========================================================
const REAL_SALARY_STRUCTURE = {
    // 數據已更新為更貼近現實的模擬值 (僅供測試)
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
 * @param {number} number 
 * @returns {string} NT$ XXX,XXX
 */
function formatCurrency(number) {
    if (isNaN(number) || number === 0) return '--';
    return `NT$ ${Math.round(number).toLocaleString('zh-TW')}`;
}

/**
 * 根據階級和年資計算當前月薪總額 (包含年度基礎成長)
 */
function calculateMonthlySalary(rankCode, year) {
    const data = REAL_SALARY_STRUCTURE[rankCode];
    if (!data) return 0;
    
    // 薪資總額 = 本俸 + 專業加給 + 伙食津貼
    let monthlyTotal = data.base + data.pro_add + data.food_add;
    
    // 考慮年度基礎成長 (服務年資越長，薪資越高)
    monthlyTotal *= (1 + data.annual_growth) ** (year - 1);
    
    return Math.round(monthlyTotal);
}

/**
 * 執行核心財務模擬運算
 */
function runSimulation() {
    // 1. 取得使用者輸入參數
    const startRank = document.getElementById('startRank').value;
    const serviceYears = parseInt(document.getElementById('serviceYears').value);
    const savingsRate = parseFloat(document.getElementById('savingsRate').value) / 100; // 儲蓄比例
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100; // 投資報酬率
    const livingCost = parseInt(document.getElementById('livingCost').value);
    const loanRate = parseFloat(document.getElementById('loanRate').value) / 100; // 房貸利率

    if (!serviceYears || isNaN(savingsRate) || isNaN(returnRate) || isNaN(livingCost)) {
        document.getElementById('simulation-status').innerText = '請確認所有數值輸入正確。';
        document.getElementById('simulation-status').classList.remove('hidden');
        return;
    }
    document.getElementById('simulation-status').classList.add('hidden');

    // 2. 核心計算迴圈初始化
    let currentAsset = 0;
    let currentRank = startRank;
    let yearOfRank = 0; 
    let totalCashFlow = 0;
    
    const years = [];
    const monthlySalaryData = [];
    const totalAssetData = [];
    
    for (let year = 1; year <= serviceYears; year++) {
        years.push(`第 ${year} 年`);

        // 檢查晉升
        const currentRankData = REAL_SALARY_STRUCTURE[currentRank];
        if (yearOfRank >= currentRankData.promotion_years && currentRankData.promotion_years !== Infinity) {
            const currentIndex = RANK_ORDER.indexOf(currentRank);
            if (currentIndex < RANK_ORDER.length - 1) {
                currentRank = RANK_ORDER[currentIndex + 1];
                yearOfRank = 0; // 晉升後年數重置
            }
        }
        
        // 獲取當前月薪 (使用計算函數)
        let monthlySalary = calculateMonthlySalary(currentRank, year);
        monthlySalaryData.push(monthlySalary);

        // 年度儲蓄與投資金額 (從淨收入中提撥)
        const annualSalary = monthlySalary * 12;
        const annualLivingCost = livingCost * 12;

        // 計算可支配淨收入 (年薪 - 生活費)
        const annualNetIncome = annualSalary - annualLivingCost;
        
        // 年度儲蓄/投資總額
        const annualSavingsInvestment = annualNetIncome * savingsRate;

        // 更新總現金流 (用於平均現金流計算)
        const annualRemainingCash = annualNetIncome * (1 - savingsRate);
        totalCashFlow += annualRemainingCash;

        // 資產累積計算 (複利公式)
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
    // 使用房貸公式反推可負擔總額
    const monthlyRate = loanRate / 12;
    const loanMonths = 240; // 假設 20 年期
    const maxAffordableLoan = maxMonthlyPayment * ((Math.pow(1 + monthlyRate, loanMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, loanMonths)));
    document.getElementById('afford-loan').innerText = formatCurrency(maxAffordableLoan);

    // 4. 繪製圖表
    renderFinancialChart(years, monthlySalaryData, totalAssetData);
    renderScenarioChart(years, monthlySalaryData, livingCost, savingsRate);
}

/**
 * 繪製薪資與資產走勢圖
 */
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

/**
 * 繪製不同情境比較圖 (不同投資報酬率)
 */
function renderScenarioChart(years, baseSalaryData, livingCost, savingsRate) {
    if (scenarioChartInstance) scenarioChartInstance.destroy();

    const lowRate = 0.02; // 低報酬情境 (例如：定存/低風險)
    const highRate = 0.08; // 高報酬情境 (例如：積極型投資)
    const baseRate = parseFloat(document.getElementById('returnRate').value) / 100;

    const calcScenarioAsset = (rate) => {
        let asset = 0;
        const data = [];
        
        for (let i = 0; i < baseSalaryData.length; i++) {
            const monthlySalary = baseSalaryData[i];
            const annualSalary = monthlySalary * 12;
            const annualLivingCost = livingCost * 12;
            const annualNetIncome = annualSalary - annualLivingCost;
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

// 系統啟動時，自動運行一次模擬以顯示預設圖表
document.addEventListener('DOMContentLoaded', () => {
    runSimulation();
});
