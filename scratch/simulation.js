// =========================================================
// 1. 資料庫與全域參數 (Data & Config)
// =========================================================

// 薪資結構：依據 114年1月1日生效俸額表 & 專業加給表
const REAL_SALARY_STRUCTURE = {
    // 【尉官】
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, food_add: 2840, promotion_years: 1, annual_growth: 0.015, max_years: 12 }, 
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, food_add: 2840, promotion_years: 3, annual_growth: 0.015, max_years: 12 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 17 }, 
    
    // 【校官】
    'M1': { rank: '少校', base: 32710, pro_add: 45000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 22 }, 
    'M2': { rank: '中校', base: 37310, pro_add: 55000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 26 }, 
    'M3': { rank: '上校', base: 41900, pro_add: 65000, food_add: 2840, promotion_years: 6, annual_growth: 0.015, max_years: 30 }, 
    
    // 【將官】
    'G1': { rank: '少將', base: 48030, pro_add: 70000, food_add: 2840, promotion_years: 4, annual_growth: 0.01, max_years: 35 }, 
    'G2': { rank: '中將', base: 53390, pro_add: 80000, food_add: 2840, promotion_years: 3, annual_growth: 0.01, max_years: 38 }, 
    'G3': { rank: '二級上將', base: 109520, pro_add: 90000, food_add: 2840, promotion_years: Infinity, annual_growth: 0.01, max_years: 42 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1', 'G2', 'G3'];

// 志願役人員固定加給 (NT$15,000, 預估 2026 水準)
const VOLUNTEER_ADDITION_2026 = 15000;

// 國軍退撫基金提撥率 (14%，其中個人負擔 35%)
const PENSION_RATE = 0.14; 
const INDIVIDUAL_PENSION_RATIO = 0.35; 

// Chart.js 實例與計數器
let financialChartInstance;
let scenarioChartInstance;
let allowanceCounter = 0;
let lifeEventCounter = 0;

// =========================================================
// 2. 介面互動與輔助函數 (UI Helpers)
// =========================================================

// 格式化金額顯示
function formatCurrency(number) {
    if (isNaN(number)) return '--';
    const absNum = Math.abs(Math.round(number));
    const sign = number < 0 ? "-" : "";
    return `${sign}$${absNum.toLocaleString('zh-TW')}`;
}

// 動態新增「特殊加給」輸入欄位
function addCustomAllowance() {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const itemId = `custom-item-${allowanceCounter}`;
    
    let defaultName = "", defaultValue = 0, defaultStart = 1, defaultEnd = 5;
    // 第一次點擊給個範例值
    if (allowanceCounter === 1 && container.children.length === 0) {
        defaultName = "主官加給"; defaultValue = 6000; defaultStart = 5; defaultEnd = 8;
    }

    const html = `
        <div id="${itemId}" class="grid grid-cols-12 gap-1 items-center allowance-row mb-2 text-xs bg-white p-1 rounded border border-gray-200 shadow-sm">
            <div class="col-span-4"><input type="text" placeholder="項目" value="${defaultName}" class="w-full border-b border-gray-300 py-1 px-1 allow-name focus:outline-none" oninput="runSimulation()"></div>
            <div class="col-span-3"><input type="number" placeholder="$" value="${defaultValue}" class="w-full border-b border-gray-300 py-1 px-1 allow-value focus:outline-none text-right" oninput="runSimulation()"></div>
            <div class="col-span-2"><input type="number" placeholder="始" value="${defaultStart}" class="w-full border-b border-gray-300 py-1 px-1 text-center allow-start bg-gray-50 focus:outline-none" oninput="runSimulation()"></div>
            <div class="col-span-2"><input type="number" placeholder="末" value="${defaultEnd}" class="w-full border-b border-gray-300 py-1 px-1 text-center allow-end bg-gray-50 focus:outline-none" oninput="runSimulation()"></div>
            <div class="col-span-1 text-center"><button onclick="document.getElementById('${itemId}').remove(); runSimulation()" class="text-red-400 hover:text-red-600 font-bold">×</button></div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

// 動態新增「人生大事」輸入欄位
function addLifeEvent() {
    lifeEventCounter++;
    const container = document.getElementById('life-events-container');
    const itemId = `life-event-${lifeEventCounter}`;
    
    let defaultName = "", defaultValue = 0, defaultYear = 5;
    // 預設範例
    if (lifeEventCounter === 1 && container.children.length === 0) {
        defaultName = "結婚補助"; defaultValue = 50000; defaultYear = 6;
    } else if (lifeEventCounter === 2) {
        defaultName = "買車頭期"; defaultValue = -200000; defaultYear = 8;
    }

    const html = `
        <div id="${itemId}" class="grid grid-cols-12 gap-1 items-center life-event-row mb-2 text-xs bg-white p-1 rounded border border-red-100 shadow-sm">
            <div class="col-span-2 text-gray-400 pt-1 text-right pr-1 font-bold">Y</div>
            <div class="col-span-2"><input type="number" value="${defaultYear}" class="w-full border-b border-gray-300 py-1 px-1 text-center event-year bg-red-50" oninput="runSimulation()"></div>
            <div class="col-span-4 pl-2"><input type="text" placeholder="事件" value="${defaultName}" class="w-full border-b border-gray-300 py-1 px-1 event-name" oninput="runSimulation()"></div>
            <div class="col-span-3"><input type="number" placeholder="$" value="${defaultValue}" class="w-full border-b border-gray-300 py-1 px-1 event-amount text-right font-bold text-gray-700" oninput="runSimulation()"></div>
            <div class="col-span-1 text-center"><button onclick="document.getElementById('${itemId}').remove(); runSimulation()" class="text-red-400 hover:text-red-600 font-bold">×</button></div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

// 收集 DOM 中的動態輸入資料
function getConfigs() {
    const allowances = [];
    document.querySelectorAll('.allowance-row').forEach(row => {
        const amount = parseInt(row.querySelector('.allow-value').value) || 0;
        const start = parseInt(row.querySelector('.allow-start').value) || 1;
        const end = parseInt(row.querySelector('.allow-end').value) || 99;
        if(amount !== 0) allowances.push({amount, start, end});
    });

    const events = [];
    document.querySelectorAll('.life-event-row').forEach(row => {
        const year = parseInt(row.querySelector('.event-year').value) || 0;
        const amount = parseInt(row.querySelector('.event-amount').value) || 0;
        const name = row.querySelector('.event-name').value || '未命名';
        if(amount !== 0 && year > 0) events.push({year, amount, name});
    });

    return { allowances, events };
}

// =========================================================
// 3. 核心模擬運算邏輯 (Simulation Logic)
// =========================================================

function runSimulation() {
    // A. 讀取使用者輸入參數
    const targetRank = document.getElementById('targetRank').value;
    const serviceYearsInput = parseInt(document.getElementById('serviceYears').value) || 20;
    const monthlySavings = parseInt(document.getElementById('monthlySavings').value) || 0;
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0;
    const livingCost = parseInt(document.getElementById('livingCost').value) || 0;
    const bonusMonths = (parseFloat(document.getElementById('yearEndBonus').value) || 0) + (parseFloat(document.getElementById('perfBonus').value) || 0);

    const { allowances, events } = getConfigs();
    const targetRankIndex = RANK_ORDER.indexOf(targetRank);

    // B. 初始化變數
    let currentAsset = 0;
    let currentRank = 'S2'; // 起始階級：少尉
    let yearOfRank = 0;     // 停年計數器
    let forceRetired = false;
    let retiredYear = 0;
    
    // C. 準備數據容器
    const yearsLabel = [];
    const netIncomeData = [];
    const assetData = [];
    const eventLog = [];

    // --- 年度迴圈開始 ---
    for (let year = 1; year <= serviceYearsInput; year++) {
        
        // 1. 強制退伍檢查 (最大服役年限)
        const currentRankData = REAL_SALARY_STRUCTURE[currentRank];
        if (year > currentRankData.max_years) {
            forceRetired = true;
            retiredYear = year - 1;
            break; 
        }

        yearsLabel.push(`Y${year}`);

        // 2. 晉升邏輯 (檢查停年與目標階級)
        const currentIndex = RANK_ORDER.indexOf(currentRank);
        if (yearOfRank >= currentRankData.promotion_years && currentIndex < targetRankIndex) {
            const nextRankIndex = currentIndex + 1;
            // 確保不會超過目標設定
            if (nextRankIndex <= targetRankIndex) {
                currentRank = RANK_ORDER[nextRankIndex];
                yearOfRank = 0; // 晉升後停年歸零
            }
        }

        // 3. 薪資計算
        // 計算當年適用的加給總額
        let yearAllowance = 0;
        allowances.forEach(conf => { if(year >= conf.start && year <= conf.end) yearAllowance += conf.amount; });

        // 年資俸額成長
        const growthFactor = (1 + currentRankData.annual_growth) ** (year - 1);
        const pensionBase = (currentRankData.base + currentRankData.pro_add) * growthFactor;
        
        // 稅前月薪與實領月薪
        const grossMonthly = pensionBase + currentRankData.food_add + VOLUNTEER_ADDITION_2026 + yearAllowance;
        const pensionDeduction = pensionBase * PENSION_RATE * INDIVIDUAL_PENSION_RATIO;
        const netMonthly = Math.round(grossMonthly - pensionDeduction);

        // 4. 年度現金流計算 (Cash Flow)
        let annualIncome = netMonthly * 12;
        const annualBonus = Math.round(pensionBase * bonusMonths);
        annualIncome += annualBonus;

        // 計算人生大事的影響
        let eventEffect = 0;
        let eventDesc = "";
        events.forEach(e => {
            if (e.year === year) {
                eventEffect += e.amount;
                eventDesc += `${e.name}(${e.amount > 0 ? '+' : ''}${Math.round(e.amount/10000)}萬) `;
            }
        });
        annualIncome += eventEffect;

        // 5. 支出與結餘
        const annualExpense = livingCost * 12;
        const fixedSavings = monthlySavings * 12; // 優先提撥投資
        const netCashflow = annualIncome - annualExpense - fixedSavings;

        // 6. 資產複利運算 (Compound Interest)
        // 本金複利 + 每年固定投入 + 當年現金流結餘(若為負則從資產扣除)
        currentAsset = currentAsset * (1 + returnRate) + fixedSavings + netCashflow;

        // 7. 紀錄數據
        netIncomeData.push(netMonthly); 
        assetData.push(Math.round(currentAsset));
        
        eventLog.push({
            year: year,
            rank: REAL_SALARY_STRUCTURE[currentRank].rank,
            net: netCashflow,
            event: eventDesc,
            status: netCashflow < 0 ? '⚠️ 透支' : '✅ 結餘'
        });

        yearOfRank++;
    }
    // --- 年度迴圈結束 ---

    // D. 終身俸試算 (Pension)
    let finalRankData = REAL_SALARY_STRUCTURE[currentRank];
    let actualServiceYears = forceRetired ? retiredYear : serviceYearsInput;
    let pensionMonthly = 0;
    let pensionEligible = actualServiceYears >= 20;

    if (pensionEligible) {
        // 俸率公式：55% + 2% * (年資-20)
        const baseForPension = finalRankData.base * ((1 + finalRankData.annual_growth) ** (actualServiceYears - 1));
        const ratio = 0.55 + (actualServiceYears - 20) * 0.02;
        // 退俸 = 基數 * 2 * 俸率 (簡化版概算)
        pensionMonthly = Math.round(baseForPension * 2 * ratio);
    }

    // E. 更新 UI 顯示 (DOM Updates)
    document.getElementById('total-asset').innerText = formatCurrency(currentAsset);
    
    // 終身俸區塊
    const pensionEl = document.getElementById('pension-monthly');
    const pensionSubEl = document.getElementById('pension-sub');
    if (pensionEligible) {
        pensionEl.innerText = formatCurrency(pensionMonthly);
        pensionEl.className = "text-3xl font-serif font-black text-green-700 mt-1";
        pensionSubEl.innerText = `服役 ${actualServiceYears} 年，符合資格`;
    } else {
        pensionEl.innerText = "未達門檻";
        pensionEl.className = "text-xl font-bold text-gray-400 mt-1";
        pensionSubEl.innerText = `僅服役 ${actualServiceYears} 年 (需 20 年)`;
    }

    // 狀態警示區塊
    const statusText = document.getElementById('status-text');
    const statusBar = document.getElementById('status-bar');
    const finalStatusEl = document.getElementById('final-status');
    
    if (forceRetired) {
        statusBar.classList.remove('hidden');
        statusText.innerText = `警告：您在第 ${retiredYear} 年因達到【${REAL_SALARY_STRUCTURE[currentRank].rank}】最大服役年限而強制退伍。`;
        finalStatusEl.innerText = `強制退伍 (${REAL_SALARY_STRUCTURE[currentRank].rank})`;
        finalStatusEl.className = "text-xl font-bold text-military-red mt-1";
    } else {
        statusBar.classList.add('hidden');
        finalStatusEl.innerText = `光榮退伍 (${REAL_SALARY_STRUCTURE[currentRank].rank})`;
        finalStatusEl.className = "text-xl font-bold text-military-900 mt-1";
    }

    // 事件紀錄表 (Table)
    const tbody = document.getElementById('event-log-body');
    tbody.innerHTML = '';
    eventLog.forEach(log => {
        const row = `<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-4 py-2 font-mono text-gray-500">Y${log.year}</td>
            <td class="px-4 py-2 font-bold text-military-900">${log.rank}</td>
            <td class="px-4 py-2 ${log.net < 0 ? 'text-red-600 font-bold' : 'text-green-600'}">${formatCurrency(log.net)}</td>
            <td class="px-4 py-2 text-xs text-gray-600">${log.event || '-'}</td>
            <td class="px-4 py-2 text-xs">${log.status}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    // 呼叫圖表繪製
    renderCharts(yearsLabel, netIncomeData, assetData, monthlySavings, actualServiceYears);
}

// =========================================================
// 4. 圖表繪製函數 (Charts Visualization)
// =========================================================

function renderCharts(labels, salaryData, assetData, monthlySavings, actualYears) {
    Chart.defaults.font.family = '"Noto Sans TC", sans-serif';

    // 圖表 1: 薪資與資產趨勢
    if (financialChartInstance) financialChartInstance.destroy();
    const ctx1 = document.getElementById('financialChart').getContext('2d');
    financialChartInstance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { 
                    label: '月淨薪資', 
                    data: salaryData, 
                    borderColor: '#1a2e45', 
                    backgroundColor:'#1a2e45', 
                    yAxisID: 'y1', 
                    tension: 0.1 
                },
                { 
                    label: '累積資產', 
                    data: assetData, 
                    borderColor: '#c5a065', 
                    backgroundColor: 'rgba(197, 160, 101, 0.1)', 
                    fill: true, 
                    yAxisID: 'y2', 
                    tension: 0.3 
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y1: { position: 'left', title: {display: true, text: '月薪 (元)'}, grid: { color: '#f3f4f6' } },
                y2: { position: 'right', title: {display: true, text: '總資產 (元)'}, grid: {drawOnChartArea: false} }
            }
        }
    });

    // 圖表 2: 投資情境分析 (Scenario Analysis)
    if (scenarioChartInstance) scenarioChartInstance.destroy();
    
    // 內部輔助函數：計算純投資複利 (不含生活結餘)
    const calculateScenario = (rate) => {
        let val = 0;
        const data = [];
        for(let i=0; i<actualYears; i++) {
            val = val * (1 + rate) + (monthlySavings * 12);
            data.push(val);
        }
        return data;
    }
    
    const baseRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0.05;
    const lowData = calculateScenario(0.02); // 保守
    const midData = calculateScenario(baseRate); // 目前設定
    const highData = calculateScenario(0.08); // 積極

    const ctx2 = document.getElementById('scenarioChart').getContext('2d');
    scenarioChartInstance = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: '保守 (2%)', data: lowData, borderColor: '#64748b', tension: 0.2, pointRadius: 0 },
                { label: `目前設定 (${(baseRate*100).toFixed(1)}%)`, data: midData, borderColor: '#3b82f6', borderWidth: 3, tension: 0.2 },
                { label: '積極 (8%)', data: highData, borderColor: '#f43f5e', tension: 0.2, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top' } }
        }
    });
}

// =========================================================
// 5. 系統初始化 (Initialization)
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    // 預設各加一筆範例
    addCustomAllowance();
    addLifeEvent();
    
    // 監聽所有輸入變更以即時更新 (Input Listener)
    document.body.addEventListener('input', (e) => {
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            runSimulation();
        }
    });

    // 初次執行模擬
    runSimulation();
});
