// =========================================================
// 1. 資料來源與參數設定
// =========================================================

[cite_start]// 薪資結構：依據 114年1月1日生效俸額表 [cite: 1, 2]
// 停年參數：依據陸海空軍軍官士官任官條例 (採用法規允許之最快晉升標準，以便模擬將官職涯)
// 最大年限：依據陸海空軍軍官士官服役條例
const REAL_SALARY_STRUCTURE = {
    // 【尉官】
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, food_add: 2840, promotion_years: 1, annual_growth: 0.015, max_years: 12 }, 
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, food_add: 2840, promotion_years: 3, annual_growth: 0.015, max_years: 12 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 17 }, 
    
    // 【校官】
    'M1': { rank: '少校', base: 32710, pro_add: 45000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 22 }, 
    'M2': { rank: '中校', base: 37310, pro_add: 55000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 26 }, 
    'M3': { rank: '上校', base: 41900, pro_add: 65000, food_add: 2840, promotion_years: 6, annual_growth: 0.015, max_years: 30 }, 
    
    // 【將官】(本俸依據 Source 2，專業加給為推估值)
    'G1': { rank: '少將', base: 48030, pro_add: 70000, food_add: 2840, promotion_years: 4, annual_growth: 0.01, max_years: 35 }, 
    'G2': { rank: '中將', base: 53390, pro_add: 80000, food_add: 2840, promotion_years: 3, annual_growth: 0.01, max_years: 38 }, 
    'G3': { rank: '二級上將', base: 109520, pro_add: 90000, food_add: 2840, promotion_years: Infinity, annual_growth: 0.01, max_years: 42 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1', 'G2', 'G3'];

// 志願役人員固定加給 (NT$15,000)
const VOLUNTEER_ADDITION_2026 = 15000;

// 國軍退撫基金提撥率 (14%，其中個人負擔 35%)
const PENSION_RATE = 0.14; 
const INDIVIDUAL_PENSION_RATIO = 0.35; 

// 全域變數
let financialChartInstance;
let scenarioChartInstance;
let allowanceCounter = 0;
let lifeEventCounter = 0;

// =========================================================
// 2. 介面互動與輔助函數
// =========================================================

function formatCurrency(number) {
    if (isNaN(number)) return '--';
    const absNum = Math.abs(Math.round(number));
    const sign = number < 0 ? "-" : "";
    return `${sign}$${absNum.toLocaleString('zh-TW')}`;
}

// 新增階段性加給輸入框
function addCustomAllowance() {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const itemId = `custom-item-${allowanceCounter}`;
    
    let defaultName = "", defaultValue = 0, defaultStart = 1, defaultEnd = 5;
    if (allowanceCounter === 1 && container.children.length === 0) {
        defaultName = "主官加給(範例)"; defaultValue = 6000; defaultStart = 5; defaultEnd = 8;
    }

    const html = `
        <div id="${itemId}" class="grid grid-cols-12 gap-1 items-center allowance-row mb-2 text-xs">
            <div class="col-span-4"><input type="text" placeholder="項目" value="${defaultName}" class="w-full border rounded py-1 px-1 allow-name" oninput="runSimulation()"></div>
            <div class="col-span-3"><input type="number" placeholder="$" value="${defaultValue}" class="w-full border rounded py-1 px-1 allow-value" oninput="runSimulation()"></div>
            <div class="col-span-2"><input type="number" placeholder="始" value="${defaultStart}" class="w-full border rounded py-1 px-1 text-center allow-start" oninput="runSimulation()"></div>
            <div class="col-span-2"><input type="number" placeholder="末" value="${defaultEnd}" class="w-full border rounded py-1 px-1 text-center allow-end" oninput="runSimulation()"></div>
            <div class="col-span-1 text-center"><button onclick="document.getElementById('${itemId}').remove(); runSimulation()" class="text-red-500 font-bold">×</button></div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

// 新增人生大事輸入框
function addLifeEvent() {
    lifeEventCounter++;
    const container = document.getElementById('life-events-container');
    const itemId = `life-event-${lifeEventCounter}`;
    
    let defaultName = "", defaultValue = 0, defaultYear = 5;
    if (lifeEventCounter === 1 && container.children.length === 0) {
        defaultName = "結婚補助"; defaultValue = 50000; defaultYear = 6;
    } else if (lifeEventCounter === 2) {
        defaultName = "買車頭期"; defaultValue = -200000; defaultYear = 8;
    }

    const html = `
        <div id="${itemId}" class="grid grid-cols-12 gap-1 items-center life-event-row mb-2 text-xs">
            <div class="col-span-2 text-gray-500 pt-1 text-right pr-1">第</div>
            <div class="col-span-2"><input type="number" value="${defaultYear}" class="w-full border rounded py-1 px-1 text-center event-year" oninput="runSimulation()"></div>
            <div class="col-span-1 text-gray-500 pt-1">年</div>
            <div class="col-span-4"><input type="text" placeholder="事件" value="${defaultName}" class="w-full border rounded py-1 px-1 event-name" oninput="runSimulation()"></div>
            <div class="col-span-2"><input type="number" placeholder="$" value="${defaultValue}" class="w-full border rounded py-1 px-1 event-amount" oninput="runSimulation()"></div>
            <div class="col-span-1 text-center"><button onclick="document.getElementById('${itemId}').remove(); runSimulation()" class="text-red-500 font-bold">×</button></div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

// 收集動態輸入的資料
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
// 3. 核心模擬邏輯
// =========================================================

function runSimulation() {
    // 取得使用者參數
    const targetRank = document.getElementById('targetRank').value;
    const serviceYearsInput = parseInt(document.getElementById('serviceYears').value) || 20;
    const monthlySavings = parseInt(document.getElementById('monthlySavings').value) || 0;
    const returnRate = parseFloat(document.getElementById('returnRate').value) / 100 || 0;
    const livingCost = parseInt(document.getElementById('livingCost').value) || 0;
    const bonusMonths = (parseFloat(document.getElementById('yearEndBonus').value) || 0) + (parseFloat(document.getElementById('perfBonus').value) || 0);

    const { allowances, events } = getConfigs();
    const targetRankIndex = RANK_ORDER.indexOf(targetRank);

    // 變數初始化
    let currentAsset = 0;
    let currentRank = 'S2';
    let yearOfRank = 0;
    let forceRetired = false;
    let retiredYear = 0;
    
    // 圖表與報表數據容器
    const yearsLabel = [];
    const netIncomeData = [];
    const assetData = [];
    const eventLog = [];

    // --- 年度模擬迴圈 ---
    for (let year = 1; year <= serviceYearsInput; year++) {
        
        // A. 強制退伍檢查
        const currentRankData = REAL_SALARY_STRUCTURE[currentRank];
        if (year > currentRankData.max_years) {
            forceRetired = true;
            retiredYear = year - 1;
            break; // 停止模擬
        }

        yearsLabel.push(`第${year}年`);

        // B. 晉升邏輯
        const currentIndex = RANK_ORDER.indexOf(currentRank);
        if (yearOfRank >= currentRankData.promotion_years && currentIndex < targetRankIndex) {
            const nextRankIndex = currentIndex + 1;
            if (nextRankIndex <= targetRankIndex) {
                currentRank = RANK_ORDER[nextRankIndex];
                yearOfRank = 0;
            }
        }

        // C. 月薪計算
        // 1. 該年度適用之加給
        let yearAllowance = 0;
        allowances.forEach(conf => { if(year >= conf.start && year <= conf.end) yearAllowance += conf.amount; });

        // 2. 俸級成長係數
        const growthFactor = (1 + currentRankData.annual_growth) ** (year - 1);
        
        // 3. 退撫提撥基準 (本俸+專加) * 成長
        const pensionBase = (currentRankData.base + currentRankData.pro_add) * growthFactor;
        
        // 4. 稅前總月薪
        const grossMonthly = pensionBase + currentRankData.food_add + VOLUNTEER_ADDITION_2026 + yearAllowance;
        
        // 5. 扣除退撫金
        const pensionDeduction = pensionBase * PENSION_RATE * INDIVIDUAL_PENSION_RATIO;
        const netMonthly = Math.round(grossMonthly - pensionDeduction);

        // D. 年度現金流計算
        let annualIncome = netMonthly * 12;
        
        // 加入獎金 (年終+考績)
        const annualBonus = Math.round(pensionBase * bonusMonths);
        annualIncome += annualBonus;

        // 加入人生大事 (一次性收支)
        let eventEffect = 0;
        let eventDesc = "";
        events.forEach(e => {
            if (e.year === year) {
                eventEffect += e.amount;
                eventDesc += `${e.name}(${e.amount > 0 ? '+' : ''}${Math.round(e.amount/10000)}萬) `;
            }
        });
        annualIncome += eventEffect;

        // E. 支出與儲蓄
        const annualExpense = livingCost * 12;
        const fixedSavings = monthlySavings * 12;
        
        // 淨現金流 = 總收 - 總支 - 固定投資
        const netCashflow = annualIncome - annualExpense - fixedSavings;

        // F. 資產複利計算
        // 公式：去年資產*利率 + 今年投入固定儲蓄 + 剩餘現金(若是負數則扣資產)
        currentAsset = currentAsset * (1 + returnRate) + fixedSavings + netCashflow;

        // 數據儲存
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

    // --- 終身俸試算 ---
    let finalRankData = REAL_SALARY_STRUCTURE[currentRank];
    let actualServiceYears = forceRetired ? retiredYear : serviceYearsInput;
    let pensionMonthly = 0;
    let pensionEligible = actualServiceYears >= 20;

    if (pensionEligible) {
        // 簡易新制公式試算：基數 * 2 * (55% + 2% * (年資-20))
        const baseForPension = finalRankData.base * ((1 + finalRankData.annual_growth) ** (actualServiceYears - 1));
        const ratio = 0.55 + (actualServiceYears - 20) * 0.02;
        pensionMonthly = Math.round(baseForPension * 2 * ratio);
    }

    // --- 更新 UI 顯示 ---
    document.getElementById('total-asset').innerText = formatCurrency(currentAsset);
    
    // 更新終身俸卡片
    const pensionEl = document.getElementById('pension-monthly');
    const pensionSubEl = document.getElementById('pension-sub');
    if (pensionEligible) {
        pensionEl.innerText = formatCurrency(pensionMonthly);
        pensionEl.className = "text-2xl font-black text-green-700 mt-1";
        pensionSubEl.innerText = `服役 ${actualServiceYears} 年，符合資格`;
    } else {
        pensionEl.innerText = "未達門檻";
        pensionEl.className = "text-xl font-bold text-gray-400 mt-1";
        pensionSubEl.innerText = `僅服役 ${actualServiceYears} 年 (需 20 年)`;
    }

    // 更新狀態警示
    const statusText = document.getElementById('status-text');
    const statusBar = document.getElementById('status-bar');
    const finalStatusEl = document.getElementById('final-status');
    
    if (forceRetired) {
        statusBar.classList.remove('hidden');
        statusText.innerText = `警告：您在第 ${retiredYear} 年因達到【${REAL_SALARY_STRUCTURE[currentRank].rank}】最大服役年限而強制退伍。`;
        finalStatusEl.innerText = `強制退伍 (${REAL_SALARY_STRUCTURE[currentRank].rank})`;
        finalStatusEl.className = "text-xl font-bold text-red-600 mt-1";
    } else {
        statusBar.classList.add('hidden');
        finalStatusEl.innerText = `光榮退伍 (${REAL_SALARY_STRUCTURE[currentRank].rank})`;
        finalStatusEl.className = "text-xl font-bold text-indigo-600 mt-1";
    }

    // 更新事件表
    const tbody = document.getElementById('event-log-body');
    tbody.innerHTML = '';
    eventLog.forEach(log => {
        const row = `<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-4 py-2">第 ${log.year} 年</td>
            <td class="px-4 py-2 font-medium text-gray-900">${log.rank}</td>
            <td class="px-4 py-2 ${log.net < 0 ? 'text-red-600 font-bold' : 'text-green-600'}">${formatCurrency(log.net)}</td>
            <td class="px-4 py-2 text-xs">${log.event || '-'}</td>
            <td class="px-4 py-2 text-xs">${log.status}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    // 繪製圖表
    renderCharts(yearsLabel, netIncomeData, assetData, monthlySavings, actualServiceYears);
}

// =========================================================
// 4. 圖表繪製
// =========================================================

function renderCharts(labels, salaryData, assetData, monthlySavings, actualYears) {
    // 圖表 1: 薪資與資產
    if (financialChartInstance) financialChartInstance.destroy();
    const ctx1 = document.getElementById('financialChart').getContext('2d');
    financialChartInstance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: '月淨薪資 (含年增)', data: salaryData, borderColor: '#4F46E5', yAxisID: 'y1', tension: 0.1 },
                { label: '累積總資產', data: assetData, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, yAxisID: 'y2', tension: 0.3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y1: { position: 'left', title: {display: true, text: '月薪 (元)'} },
                y2: { position: 'right', title: {display: true, text: '總資產 (元)'}, grid: {drawOnChartArea: false} }
            }
        }
    });

    // 圖表 2: 投資情境
    if (scenarioChartInstance) scenarioChartInstance.destroy();
    
    // 計算簡單情境 (僅計算固定儲蓄的複利效果，不含現金流結餘)
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
    const lowData = calculateScenario(0.02);
    const midData = calculateScenario(baseRate);
    const highData = calculateScenario(0.08);

    const ctx2 = document.getElementById('scenarioChart').getContext('2d');
    scenarioChartInstance = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: '保守 (2%)', data: lowData, borderColor: '#F59E0B', tension: 0.2 },
                { label: `設定 (${(baseRate*100).toFixed(1)}%)`, data: midData, borderColor: '#3B82F6', borderWidth: 3, tension: 0.2 },
                { label: '積極 (8%)', data: highData, borderColor: '#EC4899', tension: 0.2 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false
        }
    });
}

// 系統初始化
document.addEventListener('DOMContentLoaded', () => {
    // 預設加一筆生活事件與加給
    addCustomAllowance();
    addLifeEvent();

    // 監聽所有輸入變更以即時更新
    document.body.addEventListener('input', (e) => {
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            runSimulation();
        }
    });

    // 初次執行
    runSimulation();
});
