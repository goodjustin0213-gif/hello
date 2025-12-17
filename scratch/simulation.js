/**
 * 軍官職涯財務戰情室 (Strategic Financial Command Center)
 * 核心邏輯腳本 v2.0 (Flagship Edition)
 * * 主要功能：
 * 1. AB 雙方案即時對照 (Scenario Comparison)
 * 2. 投資風險屬性快選 (Risk Profiling)
 * 3. 購屋戰略模組 (資產負債表模擬)
 * 4. 通膨與實質購買力分析
 */

// =========================================================
// 1. 全域資料庫與狀態管理 (Global Data & State)
// =========================================================

// 薪資結構：依據 2025 年生效俸額表 (含預估)
const REAL_SALARY_STRUCTURE = {
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, food_add: 2840, promotion_years: 1, annual_growth: 0.015, max_years: 12 }, 
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, food_add: 2840, promotion_years: 3, annual_growth: 0.015, max_years: 12 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 17 }, 
    'M1': { rank: '少校', base: 32710, pro_add: 45000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 22 }, 
    'M2': { rank: '中校', base: 37310, pro_add: 55000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 26 }, 
    'M3': { rank: '上校', base: 41900, pro_add: 65000, food_add: 2840, promotion_years: 6, annual_growth: 0.015, max_years: 30 }, 
    'G1': { rank: '少將', base: 48030, pro_add: 70000, food_add: 2840, promotion_years: 4, annual_growth: 0.01, max_years: 35 }, 
    'G2': { rank: '中將', base: 53390, pro_add: 80000, food_add: 2840, promotion_years: 3, annual_growth: 0.01, max_years: 38 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1', 'G2'];
const VOLUNTEER_ADDITION = 15000;
const PENSION_RATE = 0.14; 
const INDIVIDUAL_PENSION_RATIO = 0.35; 

// 狀態管理容器
let currentScenario = 'A'; // 當前正在編輯的方案 ('A' or 'B')
let scenarioData = { A: {}, B: {} }; // 儲存 A 與 B 的參數
let charts = {}; // 圖表實例容器
let allowanceCounter = 0;

// =========================================================
// 2. 方案管理與互動邏輯 (Scenario Management)
// =========================================================

// 初始化：設定預設參數給 A 與 B
function initScenarioStore() {
    const defaultParams = {
        targetRank: 'M2', 
        serviceYears: 20, 
        inflationRate: 2.0, 
        salaryRaiseRate: 1.0,
        livingCostPercent: 40, 
        monthlySavingsPercent: 30, 
        returnRate: 6.0,
        buyHouseToggle: false, 
        buyYear: 10, 
        housePriceWan: 1500, 
        downPaymentPct: 20,
        mortgageRate: 2.2, 
        loanTerm: 30, 
        houseAppreciation: 1.5,
        allowances: [{val: 5000, start: 5, end: 10}]
    };

    // 深拷貝預設值，避免引用同一物件
    scenarioData.A = JSON.parse(JSON.stringify(defaultParams));
    scenarioData.B = JSON.parse(JSON.stringify(defaultParams));
    
    // 讓 B 方案預設稍微不同，以便演示對照效果
    scenarioData.B.serviceYears = 25;
    scenarioData.B.returnRate = 4.0; 
}

// 切換 A/B 方案
function switchScenario(scen) {
    // 1. 將當前 UI 上的數值存入當前方案的記憶體
    saveInputsToMemory(currentScenario);
    
    // 2. 切換上下文
    currentScenario = scen;
    document.getElementById('current-scen-label').innerText = `EDITING: ${scen}`;
    
    // 3. 更新按鈕樣式
    const btnA = document.getElementById('btn-scen-A');
    const btnB = document.getElementById('btn-scen-B');
    if(scen === 'A') {
        btnA.className = btnA.className.replace('tab-inactive', 'tab-active');
        btnB.className = btnB.className.replace('tab-active', 'tab-inactive');
    } else {
        btnB.className = btnB.className.replace('tab-inactive', 'tab-active');
        btnA.className = btnA.className.replace('tab-active', 'tab-inactive');
    }

    // 4. 將新方案的參數載入到 UI
    loadMemoryToInputs(scen);
    
    // 5. 重新執行模擬
    orchestrateSimulation();
}

// 將 UI 輸入值儲存至記憶體
function saveInputsToMemory(scen) {
    const allowances = [];
    document.querySelectorAll('.allowance-row').forEach(row => {
        allowances.push({
            val: parseInt(row.querySelector('.allow-val').value) || 0,
            start: parseInt(row.querySelector('.allow-start').value) || 0,
            end: parseInt(row.querySelector('.allow-end').value) || 99
        });
    });

    scenarioData[scen] = {
        targetRank: document.getElementById('targetRank').value,
        serviceYears: document.getElementById('serviceYears').value,
        inflationRate: document.getElementById('inflationRate').value,
        salaryRaiseRate: document.getElementById('salaryRaiseRate').value,
        livingCostPercent: document.getElementById('livingCostPercent').value,
        monthlySavingsPercent: document.getElementById('monthlySavingsPercent').value,
        returnRate: document.getElementById('returnRate').value,
        buyHouseToggle: document.getElementById('buyHouseToggle').checked,
        buyYear: document.getElementById('buyYear').value,
        housePriceWan: document.getElementById('housePriceWan').value,
        downPaymentPct: document.getElementById('downPaymentPct').value,
        mortgageRate: document.getElementById('mortgageRate').value,
        loanTerm: document.getElementById('loanTerm').value,
        houseAppreciation: document.getElementById('houseAppreciation').value,
        allowances: allowances
    };
}

// 將記憶體參數載入至 UI
function loadMemoryToInputs(scen) {
    const data = scenarioData[scen];
    if(!data) return;
    
    const fields = ['targetRank', 'serviceYears', 'inflationRate', 'salaryRaiseRate',
        'livingCostPercent', 'monthlySavingsPercent', 'returnRate', 'buyYear', 
        'housePriceWan', 'downPaymentPct', 'mortgageRate', 'loanTerm', 'houseAppreciation'];
    
    fields.forEach(id => {
        if(document.getElementById(id)) document.getElementById(id).value = data[id];
    });

    document.getElementById('buyHouseToggle').checked = data.buyHouseToggle;
    toggleHousingModule(); // 更新輸入框啟用狀態

    // 還原加給列表
    document.getElementById('custom-allowances-container').innerHTML = '';
    if(data.allowances && data.allowances.length > 0) {
        data.allowances.forEach(a => addCustomAllowance(a));
    }
}

// 設定投資屬性 (風險快選按鈕)
function setRisk(level) {
    const el = document.getElementById('returnRate');
    const desc = document.getElementById('risk-desc');
    if(level === 'low') { el.value = 1.5; desc.innerText = "定存/儲蓄險等級"; }
    if(level === 'mid') { el.value = 5.0; desc.innerText = "ETF/股債平衡等級"; }
    if(level === 'high') { el.value = 9.0; desc.innerText = "全股票/積極成長等級"; }
    
    // 數值改變後立即觸發運算
    orchestrateSimulation();
}

// =========================================================
// 3. 核心模擬引擎 (Simulation Engine)
// =========================================================

// 純函數：接收參數，返回該方案的完整模擬結果
function calculateScenarioData(params) {
    // 參數正規化
    const p = {
        targetRank: params.targetRank,
        years: parseInt(params.serviceYears) || 20,
        inflation: parseFloat(params.inflationRate)/100 || 0.02,
        raise: parseFloat(params.salaryRaiseRate)/100 || 0.01,
        livingPct: parseFloat(params.livingCostPercent)/100 || 0.4,
        investPct: parseFloat(params.monthlySavingsPercent)/100 || 0.3,
        returnRate: parseFloat(params.returnRate)/100 || 0.06,
        buyHouse: params.buyHouseToggle,
        buyYear: parseInt(params.buyYear) || 99,
        housePrice: (parseInt(params.housePriceWan) || 0) * 10000,
        downPct: parseFloat(params.downPaymentPct)/100 || 0.2,
        mortgageRate: parseFloat(params.mortgageRate)/100 || 0.022,
        loanTerm: parseInt(params.loanTerm) || 30,
        houseGrowth: parseFloat(params.houseAppreciation)/100 || 0.015,
        allowances: params.allowances || []
    };

    let currentRank = 'S2';
    let yearOfRank = 0;
    let forceRetired = false;
    let liquidAsset = 0;
    let houseValue = 0;
    let loanBalance = 0;
    let monthlyMortgagePayment = 0;
    let hasBoughtHouse = false;
    
    const targetIdx = RANK_ORDER.indexOf(p.targetRank);
    const history = { labels: [], netAsset: [], realAsset: [], liquid: [], house: [], loan: [], logs: [] };

    for (let y = 1; y <= p.years; y++) {
        // 1. 強制退伍檢查
        if (y > REAL_SALARY_STRUCTURE[currentRank].max_years) { forceRetired = true; break; }
        
        // 2. 晉升邏輯
        const rankIdx = RANK_ORDER.indexOf(currentRank);
        if (yearOfRank >= REAL_SALARY_STRUCTURE[currentRank].promotion_years && rankIdx < targetIdx) {
            currentRank = RANK_ORDER[rankIdx + 1];
            yearOfRank = 0;
        }

        // 3. 薪資計算
        const rankData = REAL_SALARY_STRUCTURE[currentRank];
        const policyFactor = Math.pow(1 + p.raise, y - 1);
        const seniorityFactor = Math.pow(1 + rankData.annual_growth, y - 1);
        const base = (rankData.base + rankData.pro_add) * seniorityFactor * policyFactor;
        
        let allowance = 0;
        p.allowances.forEach(a => { if(y >= a.start && y <= a.end) allowance += a.val; });
        
        const gross = base + rankData.food_add + VOLUNTEER_ADDITION + allowance;
        const netMonthly = Math.round(gross * (1 - PENSION_RATE * INDIVIDUAL_PENSION_RATIO));
        
        // 4. 購屋運算
        let yearMortgageCost = 0;
        if (p.buyHouse && y === p.buyYear && !hasBoughtHouse) {
            hasBoughtHouse = true;
            houseValue = p.housePrice;
            const downPay = Math.round(p.housePrice * p.downPct);
            loanBalance = p.housePrice - downPay;
            liquidAsset -= downPay;
            
            const r = p.mortgageRate / 12;
            const n = p.loanTerm * 12;
            monthlyMortgagePayment = (r > 0) ? Math.round(loanBalance * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1)) : Math.round(loanBalance / n);
        }

        if (hasBoughtHouse) {
            houseValue = Math.round(houseValue * (1 + p.houseGrowth));
            if (loanBalance > 0) {
                yearMortgageCost = monthlyMortgagePayment * 12;
                const yearlyInterest = loanBalance * p.mortgageRate;
                loanBalance -= (yearMortgageCost - yearlyInterest);
                if(loanBalance < 0) loanBalance = 0;
            }
        }

        // 5. 現金流與複利
        const annualIncome = (netMonthly * 13.5);
        const annualExpense = annualIncome * p.livingPct;
        const annualInvest = annualIncome * p.investPct;
        const netCashFlow = annualIncome - annualExpense - annualInvest - yearMortgageCost;

        liquidAsset = liquidAsset * (1 + p.returnRate) + annualInvest + netCashFlow;

        // 6. 紀錄
        const netAsset = liquidAsset + houseValue - loanBalance;
        const inflationFactor = Math.pow(1 + p.inflation, y);
        const realAsset = Math.round(netAsset / inflationFactor);

        history.labels.push(`Y${y}`);
        history.netAsset.push(Math.round(netAsset));
        history.realAsset.push(realAsset);
        history.liquid.push(Math.round(liquidAsset));
        history.house.push(Math.round(houseValue));
        history.loan.push(Math.round(loanBalance));
        history.logs.push({
            y, rank: REAL_SALARY_STRUCTURE[currentRank].rank,
            income: annualIncome, mortgage: yearMortgageCost, cashflow: netCashFlow, netAsset: netAsset
        });

        yearOfRank++;
    }
    
    // 終身俸試算
    let pension = 0;
    const actualYears = history.labels.length;
    if (actualYears >= 20) {
        const finalBase = REAL_SALARY_STRUCTURE[currentRank].base * Math.pow(1.015, actualYears-1);
        const ratio = 0.55 + (actualYears - 20) * 0.02;
        pension = Math.round(finalBase * 2 * ratio);
    }

    return { history, pension, forceRetired, actualYears, params: p };
}

// =========================================================
// 4. 運算指揮中心 (Orchestration)
// =========================================================

// 協調 A 與 B 方案的運算並更新介面
function orchestrateSimulation() {
    // 1. 將當前介面數值存入當前方案 (A or B)
    saveInputsToMemory(currentScenario);
    
    // 2. 計算方案 A
    const resA = calculateScenarioData(scenarioData.A);
    
    // 3. 計算方案 B
    const resB = calculateScenarioData(scenarioData.B);
    
    // 4. 根據「目前正在編輯哪個方案」來決定 UI 顯示的主角
    const currentRes = (currentScenario === 'A') ? resA : resB;
    const compareRes = (currentScenario === 'A') ? resB : resA; // 另一個方案作為對照組
    
    updateUI(currentRes, compareRes);
}

// 強制刷新 (給按鈕用)
function forceRefresh() {
    orchestrateSimulation();
}

// =========================================================
// 5. UI 更新與繪圖 (UI Update & Charts)
// =========================================================

function updateUI(res, compareRes) {
    const h = res.history;
    const last = h.netAsset.length - 1;
    const finalAsset = h.netAsset[last];
    const finalReal = h.realAsset[last];
    
    // 計算與對照組的差異
    const compLast = compareRes.history.netAsset.length - 1;
    const compFinal = compareRes.history.netAsset[compLast];
    const diff = finalAsset - compFinal;
    const diffText = (diff >= 0 ? '+' : '') + formatMoney(diff);
    
    // 更新 KPI 文字
    document.getElementById('remain-percent').innerText = (100 - (res.params.livingPct*100) - (res.params.investPct*100)).toFixed(0);
    document.getElementById('total-asset').innerText = formatMoney(finalAsset);
    document.getElementById('comp-asset').innerHTML = `與方案 ${currentScenario==='A'?'B':'A'} 差異: <span class="${diff>=0?'text-green-500':'text-red-500'} font-bold">${diffText}</span>`;
    
    document.getElementById('pension-monthly').innerText = res.pension > 0 ? formatMoney(res.pension) : "未達門檻";
    document.getElementById('pension-monthly').className = res.pension > 0 ? "text-3xl font-serif font-black text-green-700" : "text-xl font-bold text-slate-400";
    
    // 更新購屋狀態文字
    const hDiv = document.getElementById('housing-status-display');
    if (res.params.buyHouse) {
        const eq = h.house[last] - h.loan[last];
        hDiv.innerHTML = `
            <div class="mt-2 text-xs text-slate-500 space-y-1">
                <div class="flex justify-between"><span>市值:</span> <span class="font-bold text-orange-700">${formatMoney(h.house[last])}</span></div>
                <div class="flex justify-between"><span>剩貸:</span> <span class="font-bold text-red-600">-${formatMoney(h.loan[last])}</span></div>
                <div class="border-t pt-1 flex justify-between"><span>淨權益:</span> <span class="font-bold text-green-600">${formatMoney(eq)}</span></div>
            </div>`;
    } else {
        hDiv.innerHTML = `<p class="text-xl font-bold text-slate-300 mt-2">未啟用購屋模組</p>`;
    }

    // 破產風險警示
    const negYears = h.logs.filter(l => l.netAsset < 0).length;
    const statusBar = document.getElementById('status-bar');
    if(negYears > 0) {
        statusBar.classList.remove('hidden');
        document.getElementById('warn-scen').innerText = currentScenario;
    } else {
        statusBar.classList.add('hidden');
    }

    // 更新表格
    const tbody = document.getElementById('event-log-body');
    tbody.innerHTML = '';
    h.logs.forEach(l => {
        const row = `<tr>
            <td class="px-4 py-3 font-mono text-slate-500">Y${l.y}</td>
            <td class="px-4 py-3 font-bold text-military-900">${l.rank}</td>
            <td class="px-4 py-3 text-right text-slate-700">${formatMoney(l.income)}</td>
            <td class="px-4 py-3 text-right text-red-500">${l.mortgage > 0 ? formatMoney(l.mortgage) : '-'}</td>
            <td class="px-4 py-3 text-right ${l.cashflow < 0 ? 'text-red-600 font-bold' : 'text-green-600'}">${formatMoney(l.cashflow)}</td>
            <td class="px-4 py-3 text-right font-bold ${l.netAsset < 0 ? 'text-red-600' : 'text-military-900'}">${formatMoney(l.netAsset)}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    renderAllCharts(res, compareRes);
}

function renderAllCharts(res, compRes) {
    Chart.defaults.font.family = '"Noto Sans TC", sans-serif';
    
    const h = res.history;
    const ch = compRes.history;

    // Chart 1: 雙方案資產比較 (Asset Comparison)
    if (charts.compare) charts.compare.destroy();
    const ctx1 = document.getElementById('assetCompareChart').getContext('2d');
    charts.compare = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: h.labels, 
            datasets: [
                { 
                    label: `方案 ${currentScenario} (當前)`, 
                    data: h.netAsset, 
                    borderColor: '#3b82f6', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    borderWidth: 3, 
                    fill: true,
                    tension: 0.3
                },
                { 
                    label: `方案 ${currentScenario==='A'?'B':'A'} (對照)`, 
                    data: ch.netAsset, 
                    borderColor: '#94a3b8', 
                    borderWidth: 2, 
                    borderDash: [5,5], 
                    fill: false,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false }
        }
    });

    // Chart 2: 通膨侵蝕分析 (Inflation Analysis) - 僅顯示當前方案
    if (charts.inflation) charts.inflation.destroy();
    const ctx2 = document.getElementById('inflationChart').getContext('2d');
    charts.inflation = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: h.labels,
            datasets: [
                { label: '名目淨資產 (帳面數字)', data: h.netAsset, borderColor: '#94a3b8', borderWidth: 2 },
                { label: '實質購買力 (折現後)', data: h.realAsset, borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 3, fill: true }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false }
        }
    });
}

// =========================================================
// 6. 工具函數 (Helpers)
// =========================================================

function formatMoney(num) {
    if (isNaN(num)) return '--';
    const absNum = Math.abs(Math.round(num));
    return (num < 0 ? '-' : '') + '$' + absNum.toLocaleString('zh-TW');
}

function toggleHousingModule() {
    const isChecked = document.getElementById('buyHouseToggle').checked;
    const inputs = document.getElementById('housing-inputs');
    if (isChecked) inputs.classList.remove('opacity-50', 'pointer-events-none');
    else inputs.classList.add('opacity-50', 'pointer-events-none');
}

function addCustomAllowance(data = null) {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const id = `allow-${allowanceCounter}`;
    let defName = "職務加給", defVal = 5000, defStart = 5, defEnd = 10;
    if(data) { defVal = data.val; defStart = data.start; defEnd = data.end; }
    
    const html = `
        <div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-[10px] bg-slate-50 p-1 rounded allowance-row">
            <div class="col-span-4"><input type="text" value="${defName}" class="w-full border-b border-slate-300 bg-transparent px-1 allow-name"></div>
            <div class="col-span-3"><input type="number" value="${defVal}" class="w-full border-b border-slate-300 bg-transparent px-1 text-right allow-val"></div>
            <div class="col-span-2"><input type="number" value="${defStart}" class="w-full border-b border-slate-300 bg-transparent px-1 text-center allow-start"></div>
            <div class="col-span-2"><input type="number" value="${defEnd}" class="w-full border-b border-slate-300 bg-transparent px-1 text-center allow-end"></div>
            <div class="col-span-1 text-center"><button onclick="document.getElementById('${id}').remove(); orchestrateSimulation()" class="text-red-400 hover:text-red-600 font-bold">×</button></div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

function exportCSV() {
    let csv = "\uFEFF年度,階級,稅後年收,房貸支出,現金流結餘,淨資產\n";
    const rows = document.querySelectorAll('#event-log-body tr');
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        const line = Array.from(cols).map(c => c.innerText.replace(/[$,]/g, '')).join(',');
        csv += line + "\n";
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `軍旅財務報表_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

// =========================================================
// 7. 系統初始化 (Initialization)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    initScenarioStore(); // 初始化 A/B 方案預設值
    addCustomAllowance(); // UI 初始化
    
    // 監聽所有輸入變更，實現「即時試算」
    document.body.addEventListener('input', (e) => {
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            orchestrateSimulation();
        }
    });
    
    // 初次執行
    orchestrateSimulation();
});
