// =========================================================
// DATA SOURCE: 114年1月1日生效 志願役現役軍人俸額表
// =========================================================
const REAL_SALARY_STRUCTURE = {
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, food_add: 2840, promotion_years: 3, annual_growth: 0.015 },
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, food_add: 2840, promotion_years: 4, annual_growth: 0.015 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, food_add: 2840, promotion_years: 7, annual_growth: 0.015 },
    'M1': { rank: '少校', base: 32710, pro_add: 45000, food_add: 2840, promotion_years: 6, annual_growth: 0.015 },
    'M2': { rank: '中校', base: 37310, pro_add: 55000, food_add: 2840, promotion_years: 6, annual_growth: 0.015 },
    'M3': { rank: '上校', base: 41900, pro_add: 65000, food_add: 2840, promotion_years: Infinity, annual_growth: 0.015 },
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3'];

// 志願役人員固定加給 (NT$15,000)
const VOLUNTEER_ADDITION_2026 = 15000;

// 國軍退撫基金提撥率 (假設 14%，其中個人負擔 35%)
const PENSION_RATE = 0.14; 
const INDIVIDUAL_PENSION_RATIO = 0.35; // 個人負擔總提撥率的 35% (約 4.9%)

let financialChartInstance;
let scenarioChartInstance;
let allowanceCounter = 0; // 用於追蹤自訂加給項目的 ID

// --- 輔助函數 ---

function formatCurrency(number) {
    if (isNaN(number) || number === 0) return '--';
    // 處理負數顯示 (例如透支時)
    const absNum = Math.abs(Math.round(number));
    const sign = number < 0 ? "-" : "";
    return `${sign}NT$ ${absNum.toLocaleString('zh-TW')}`;
}

/**
 * 新增一組自訂加給輸入框 (名稱+金額)
 */
function addCustomAllowance() {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const itemId = `custom-item-${allowanceCounter}`;

    // 優化: 初始值給予範例
    let defaultName = "";
    let defaultValue = 0;
    if (allowanceCounter === 1 && container.children.length === 0) {
        defaultName = "領導加給 (範例)";
        defaultValue = 5000;
    }

    const newAllowanceHtml = `
        <div id="${itemId}" class="flex space-x-2 items-center">
            <input type="text" placeholder="項目名稱 (例如: 超時加給)" value="${defaultName}" class="w-2/3 border rounded-md py-1 px-2 text-sm" oninput="runSimulation()">
            <input type="number" placeholder="金額 (元/月)" value="${defaultValue}" class="w-1/3 border rounded-md py-1 px-2 text-sm allowance-value" oninput="runSimulation()">
            <button type="button" onclick="document.getElementById('${itemId}').remove(); runSimulation();" class="text-red-500 hover:text-red-700 text-lg font-bold">
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
        const value = parseInt(input.value) || 0; 
        total += value;
    });
    return total;
}

/**
 * 根據階級、年資、及自訂津貼計算當前月薪總額
 * 淨薪資 = (總收入) - (本俸+專業加給的提撥基數) * 個人退撫提撥率
 */
function calculateMonthlySalary(rankCode, year, customAdd) {
    const data = REAL_SALARY_STRUCTURE[rankCode];
    if (!data) return 0;
    
    // 1. 提撥基準: 本俸 + 專業加給
    const pensionBase = data.base + data.pro_add;
    
    // 2. 稅前總收入 (本俸 + 專業加給 + 伙食津貼 + 志願役加給 + 自訂加給總和)
    let monthlyTotal = pensionBase + data.food_add + VOLUNTEER_ADDITION_2026 + customAdd;
    
    // 3. 考慮年度基礎成長 (提撥前先成長)
    monthlyTotal *= (1 + data.annual_growth) ** (year - 1);
    
    // 4. 扣除個人退撫基金提撥額
    // 提撥基數隨年資成長
    const actualPensionDeduction = pensionBase * PENSION_RATE * INDIVIDUAL_PENSION_RATIO * ((1 + data.annual_growth) ** (year - 1));

    // 實際每月淨薪資 (可支配所得)
    const netMonthlySalary = monthlyTotal - actualPensionDeduction;
    
    return Math.round(netMonthlySalary);
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
                    label: '每月淨薪資總額 (NT$)', 
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
                    title: { display: true, text: '月淨薪資總額 (元)' }
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: '累積資產總額 (元)' },
                    grid: { drawOnChartArea: false }
                }
            },
            plugins: { title: { display: true, text: '軍旅生涯財務預測 (淨薪資與資產累積)' } }
        }
    });
}

function renderScenarioChart(years, baseSalaryData, livingCost, monthlySavings) {
    if (scenarioChartInstance) scenarioChartInstance.destroy();

    const lowRate = 0.02; 
    const highRate = 0.08; 
    const baseRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0;

    const calcScenarioAsset = (rate) => {
        let asset = 0;
        const data = [];
        
        for (let i = 0; i < baseSalaryData.length; i++) {
            // 固定儲蓄模式下，資產累積只看固定投入的錢 + 複利
            const annualSavingsInvestment = monthlySavings * 12;
            
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
    
    // 修改：取得固定儲蓄金額 (Monthly Savings Amount)
    const monthlySavings = parseInt(document.getElementById('monthlySavings').value) || 0;
    
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0;
    const livingCost = parseInt(document.getElementById('livingCost').value) || 0;
    
    // 獲取所有自訂加給的總和
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
        
        // 獲取當前月薪 (已扣除退撫基金提撥額)
        let monthlySalary = calculateMonthlySalary(currentRank, year, customAllowance);
        monthlySalaryData.push(monthlySalary);

        // 財務計算
        const annualSalary = monthlySalary * 12;
        const annualLivingCost = livingCost * 12;
        const annualNetIncome = annualSalary - annualLivingCost; // 這裡不設為0，允許計算出負的現金流以示警
        
        // 修改：固定儲蓄金額制
        const annualSavingsInvestment = monthlySavings * 12;
        
        // 剩餘現金 = 淨收入 - 固定投資
        const annualRemainingCash = annualNetIncome - annualSavingsInvestment;
        
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
    renderScenarioChart(years, monthlySalaryData, livingCost, monthlySavings);
}

// 系統啟動時的初始化
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('custom-allowances-container');
    
    if (container.children.length === 0) {
        addCustomAllowance();
    }
    
    // 為所有固定的 input/select 參數新增即時更新監聽
    document.querySelectorAll('#input-parameters input:not(.allowance-value), #input-parameters select').forEach(element => {
        // 使用 change 和 input 確保數字欄位和下拉選單都能即時反應
        element.addEventListener('change', runSimulation);
        element.addEventListener('input', runSimulation);
    });

    // 運行初始模擬
    runSimulation();
});
