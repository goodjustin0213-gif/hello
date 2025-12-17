/**
 * 軍官職涯財務戰情室 (Strategic Financial Command Center)
 * 核心邏輯腳本 v2.1 (Itemized Edition)
 * * 主要功能：
 * 1. 支出/投資/加給的「細項列舉」管理
 * 2. AB 雙方案即時對照 (Scenario Comparison)
 * 3. 投資風險屬性快選 (Risk Profiling)
 * 4. 購屋戰略模組 (資產負債表模擬)
 * 5. 通膨與實質購買力分析
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
let currentScenario = 'A';
let scenarioData = { A: {}, B: {} };
let charts = {};
// 用於生成唯一 ID 的計數器
let counters = { allow: 0, exp: 0, inv: 0 };

// =========================================================
// 2. 方案與列表管理 (Scenario & List Management)
// =========================================================

function initScenarioStore() {
    // 預設參數 (Default Params)
    const defaultParams = {
        targetRank: 'M2', serviceYears: 20, inflationRate: 2.0, salaryRaiseRate: 1.0, returnRate: 6.0,
        buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
        // 預設細項列表
        allowances: [{val: 5000, start: 5, end: 10}],
        expenses: [{name: '生活費', val: 12000}, {name: '房租', val: 6000}],
        investments: [{name: '定期定額', val: 10000}]
    };
    scenarioData.A = JSON.parse(JSON.stringify(defaultParams));
    scenarioData.B = JSON.parse(JSON.stringify(defaultParams));
    
    // 讓 B 方案稍微不同，作為預設對照組
    scenarioData.B.serviceYears = 25;
    scenarioData.B.returnRate = 4.0; 
    scenarioData.B.investments[0].val = 15000;
}

function switchScenario(scen) {
    // 1. 儲存當前介面數據
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

    // 4. 載入新方案數據
    loadMemoryToInputs(scen);
    
    // 5. 執行運算
    orchestrateSimulation();
}

// 收集動態列表數據 (通用函數)
function collectList(className, valClass) {
    const arr = [];
    document.querySelectorAll('.' + className).forEach(row => {
        const name = row.querySelector('.item-name')?.value || '';
        const val = parseInt(row.querySelector('.' + valClass).value) || 0;
        
        // 加給專用欄位
        const start = row.querySelector('.allow-start') ? parseInt(row.querySelector('.allow-start').value) : 0;
        const end = row.querySelector('.allow-end') ? parseInt(row.querySelector('.allow-end').value) : 99;
        
        if(className === 'allowance-row') arr.push({val, start, end});
        else arr.push({name, val});
    });
    return arr;
}

function saveInputsToMemory(scen) {
    scenarioData[scen] = {
        targetRank: document.getElementById('targetRank').value,
        serviceYears: document.getElementById('serviceYears').value,
        inflationRate: document.getElementById('inflationRate').value,
        salaryRaiseRate: document.getElementById('salaryRaiseRate').value,
        returnRate: document.getElementById('returnRate').value,
        buyHouseToggle: document.getElementById('buyHouseToggle').checked,
        buyYear: document.getElementById('buyYear').value,
        housePriceWan: document.getElementById('housePriceWan').value,
        downPaymentPct: document.getElementById('downPaymentPct').value,
        mortgageRate: document.getElementById('mortgageRate').value,
        loanTerm: document.getElementById('loanTerm').value,
        houseAppreciation: document.getElementById('houseAppreciation').value,
        // 收集三個列表
        allowances: collectList('allowance-row', 'allow-val'),
        expenses: collectList('expense-row', 'exp-val'),
        investments: collectList('invest-row', 'inv-val')
    };
}

function loadMemoryToInputs(scen) {
    const data = scenarioData[scen];
    if(!data) return;
    
    const fields = ['targetRank', 'serviceYears', 'inflationRate', 'salaryRaiseRate', 'returnRate', 'buyYear', 'housePriceWan', 'downPaymentPct', 'mortgageRate', 'loanTerm', 'houseAppreciation'];
    fields.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = data[id]; });

    document.getElementById('buyHouseToggle').checked = data.buyHouseToggle;
    toggleHousingModule();

    // 還原列表 UI
    document.getElementById('custom-allowances-container').innerHTML = '';
    (data.allowances || []).forEach(a => addCustomAllowance(a));

    document.getElementById('expense-items-container').innerHTML = '';
    (data.expenses || []).forEach(a => addExpenseItem(a));

    document.getElementById('invest-items-container').innerHTML = '';
    (data.investments || []).forEach(a => addInvestItem(a));
}

function setRisk(level) {
    const el = document.getElementById('returnRate');
    const desc = document.getElementById('risk-desc');
    if(level === 'low') { el.value = 1.5; desc.innerText = "定存/儲蓄險等級"; }
    if(level === 'mid') { el.value = 5.0; desc.innerText = "ETF/股債平衡等級"; }
    if(level === 'high') { el.value = 9.0; desc.innerText = "全股票/積極成長等級"; }
    orchestrateSimulation();
}

// =========================================================
// 3. UI 建構器 (UI Builders for Dynamic Rows)
// =========================================================

function createRowHtml(id, type, data) {
    const name = data?.name || (type === 'exp' ? '固定支出' : (type === 'inv' ? '定期定額' : '加給'));
    const val = data?.val || 5000;
    const color = type === 'exp' ? 'blue' : (type === 'inv' ? 'green' : 'slate');
    const valClass = type === 'exp' ? 'exp-val' : (type === 'inv' ? 'inv-val' : 'allow-val');
    const rowClass = type === 'exp' ? 'expense-row' : (type === 'inv' ? 'invest-row' : 'allowance-row');
    
    let extraInputs = '';
    if(type === 'allow') {
        const s = data?.start || 5; const e = data?.end || 10;
        extraInputs = `
        <div class="col-span-2"><input type="number" value="${s}" class="w-full border-b border-slate-300 bg-transparent px-1 text-center allow-start"></div>
        <div class="col-span-2"><input type="number" value="${e}" class="w-full border-b border-slate-300 bg-transparent px-1 text-center allow-end"></div>`;
    }

    return `
    <div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-[10px] bg-${color}-50 p-1 rounded ${rowClass}">
        <div class="col-span-${type==='allow'?4:7}"><input type="text" value="${name}" class="w-full border-b border-slate-300 bg-transparent px-1 item-name"></div>
        <div class="col-span-3"><input type="number" value="${val}" class="w-full border-b border-slate-300 bg-transparent px-1 text-right ${valClass}"></div>
        ${extraInputs}
        <div class="col-span-${type==='allow'?1:2} text-center"><button onclick="document.getElementById('${id}').remove(); orchestrateSimulation()" class="text-red-400 hover:text-red-600 font-bold">×</button></div>
    </div>`;
}

function addCustomAllowance(data=null) {
    counters.allow++;
    document.getElementById('custom-allowances-container').insertAdjacentHTML('beforeend', createRowHtml(`allow-${counters.allow}`, 'allow', data));
}
function addExpenseItem(data=null) {
    counters.exp++;
    document.getElementById('expense-items-container').insertAdjacentHTML('beforeend', createRowHtml(`exp-${counters.exp}`, 'exp', data));
    // 新增時觸發計算，更新月支總額
    orchestrateSimulation();
}
function addInvestItem(data=null) {
    counters.inv++;
    document.getElementById('invest-items-container').insertAdjacentHTML('beforeend', createRowHtml(`inv-${counters.inv}`, 'inv', data));
    // 新增時觸發計算，更新月投總額
    orchestrateSimulation();
}

// =========================================================
// 4. 核心模擬引擎 (Core Simulation Engine)
// =========================================================

function calculateScenarioData(params) {
    const p = {
        targetRank: params.targetRank,
        years: parseInt(params.serviceYears) || 20,
        inflation: parseFloat(params.inflationRate)/100 || 0.02,
        raise: parseFloat(params.salaryRaiseRate)/100 || 0.01,
        returnRate: parseFloat(params.returnRate)/100 || 0.06,
        buyHouse: params.buyHouseToggle,
        buyYear: parseInt(params.buyYear) || 99,
        housePrice: (parseInt(params.housePriceWan) || 0) * 10000,
        downPct: parseFloat(params.downPaymentPct)/100 || 0.2,
        mortgageRate: parseFloat(params.mortgageRate)/100 || 0.022,
        loanTerm: parseInt(params.loanTerm) || 30,
        houseGrowth: parseFloat(params.houseAppreciation)/100 || 0.015,
        allowances: params.allowances || [],
        expenses: params.expenses || [],
        investments: params.investments || []
    };

    // 計算基礎月開銷與月投資總額
    const baseMonthlyExp = p.expenses.reduce((sum, item) => sum + item.val, 0);
    const baseMonthlyInv = p.investments.reduce((sum, item) => sum + item.val, 0);

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
        // 1. 強制退伍
        if (y > REAL_SALARY_STRUCTURE[currentRank].max_years) { forceRetired = true; break; }
        
        // 2. 晉升
        const rankIdx = RANK_ORDER.indexOf(currentRank);
        if (yearOfRank >= REAL_SALARY_STRUCTURE[currentRank].promotion_years && rankIdx < targetIdx) {
            currentRank = RANK_ORDER[rankIdx + 1];
            yearOfRank = 0;
        }

        // 3. 薪資
        const rankData = REAL_SALARY_STRUCTURE[currentRank];
        const policyFactor = Math.pow(1 + p.raise, y - 1);
        const seniorityFactor = Math.pow(1 + rankData.annual_growth, y - 1);
        const base = (rankData.base + rankData.pro_add) * seniorityFactor * policyFactor;
        let allowance = 0;
        p.allowances.forEach(a => { if(y >= a.start && y <= a.end) allowance += a.val; });
        const gross = base + rankData.food_add + VOLUNTEER_ADDITION + allowance;
        const netMonthly = Math.round(gross * (1 - PENSION_RATE * INDIVIDUAL_PENSION_RATIO));
        
        // 4. 購屋
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

        // 5. 現金流 (Item-based Logic)
        // 支出隨通膨成長 (Inflation adjusted expenses)
        const currentMonthlyExp = baseMonthlyExp * Math.pow(1 + p.inflation, y - 1);
        // 投資保持固定金額 (Fixed Amount Investment)
        const currentMonthlyInv = baseMonthlyInv;

        const annualIncome = (netMonthly * 13.5);
        const annualExpense = currentMonthlyExp * 12;
        const annualInvest = currentMonthlyInv * 12;
        const netCashFlow = annualIncome - annualExpense - annualInvest - yearMortgageCost;

        // 6. 複利
        liquidAsset = liquidAsset * (1 + p.returnRate) + annualInvest + netCashFlow;

        // 7. 紀錄
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
    
    // 終身俸
    let pension = 0;
    const actualYears = history.labels.length;
    if (actualYears >= 20) {
        const finalBase = REAL_SALARY_STRUCTURE[currentRank].base * Math.pow(1.015, actualYears-1);
        const ratio = 0.55 + (actualYears - 20) * 0.02;
        pension = Math.round(finalBase * 2 * ratio);
    }

    return { history, pension, forceRetired, actualYears, params: p, baseMonthlyExp, baseMonthlyInv };
}

// =========================================================
// 5. 運算指揮與 UI 更新 (Orchestration & UI)
// =========================================================

function orchestrateSimulation() {
    saveInputsToMemory(currentScenario);
    const resA = calculateScenarioData(scenarioData.A);
    const resB = calculateScenarioData(scenarioData.B);
    updateUI((currentScenario === 'A') ? resA : resB, (currentScenario === 'A') ? resB : resA);
}

function forceRefresh() { orchestrateSimulation(); }

function updateUI(res, compareRes) {
    const h = res.history;
    const last = h.netAsset.length - 1;
    const finalAsset = h.netAsset[last];
    
    // 更新側邊欄總計 (Total Display in Sidebar)
    document.getElementById('total-expense-display').innerText = formatMoney(res.baseMonthlyExp);
    document.getElementById('total-invest-display').innerText = formatMoney(res.baseMonthlyInv);

    // KPI 顯示
    const diff = finalAsset - compareRes.history.netAsset[compareRes.history.netAsset.length - 1];
    document.getElementById('total-asset').innerText = formatMoney(finalAsset);
    document.getElementById('comp-asset').innerHTML = `與方案 ${currentScenario==='A'?'B':'A'} 差異: <span class="${diff>=0?'text-green-500':'text-red-500'} font-bold">${(diff>=0?'+':'') + formatMoney(diff)}</span>`;
    
    document.getElementById('pension-monthly').innerText = res.pension > 0 ? formatMoney(res.pension) : "未達門檻";
    
    // 購屋狀態
    const hDiv = document.getElementById('housing-status-display');
    if (res.params.buyHouse) {
        hDiv.innerHTML = `<div class="mt-2 text-xs text-slate-500 space-y-1"><div class="flex justify-between"><span>市值:</span> <span class="font-bold text-orange-700">${formatMoney(h.house[last])}</span></div><div class="flex justify-between"><span>剩貸:</span> <span class="font-bold text-red-600">-${formatMoney(h.loan[last])}</span></div><div class="border-t pt-1 flex justify-between"><span>淨權益:</span> <span class="font-bold text-green-600">${formatMoney(h.house[last]-h.loan[last])}</span></div></div>`;
    } else { hDiv.innerHTML = `<p class="text-xl font-bold text-slate-300 mt-2">未啟用購屋模組</p>`; }

    // 表格更新
    const tbody = document.getElementById('event-log-body');
    tbody.innerHTML = '';
    h.logs.forEach(l => {
        tbody.insertAdjacentHTML('beforeend', `<tr><td class="px-4 py-3 font-mono text-slate-500">Y${l.y}</td><td class="px-4 py-3 font-bold text-military-900">${l.rank}</td><td class="px-4 py-3 text-right text-slate-700">${formatMoney(l.income)}</td><td class="px-4 py-3 text-right text-red-500">${l.mortgage > 0 ? formatMoney(l.mortgage) : '-'}</td><td class="px-4 py-3 text-right ${l.cashflow < 0 ? 'text-red-600 font-bold' : 'text-green-600'}">${formatMoney(l.cashflow)}</td><td class="px-4 py-3 text-right font-bold ${l.netAsset < 0 ? 'text-red-600' : 'text-military-900'}">${formatMoney(l.netAsset)}</td></tr>`);
    });

    renderAllCharts(res, compareRes);
}

function renderAllCharts(res, compRes) {
    Chart.defaults.font.family = '"Noto Sans TC", sans-serif';
    const h = res.history; const ch = compRes.history;

    // Chart 1: Asset Comparison
    if (charts.compare) charts.compare.destroy();
    const ctx1 = document.getElementById('assetCompareChart').getContext('2d');
    charts.compare = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: h.labels, 
            datasets: [
                { label: `方案 ${currentScenario}`, data: h.netAsset, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 3, fill: true, tension: 0.3 },
                { label: `方案 ${currentScenario==='A'?'B':'A'}`, data: ch.netAsset, borderColor: '#94a3b8', borderWidth: 2, borderDash: [5,5], fill: false, tension: 0.3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } }
    });

    // Chart 2: Inflation
    if (charts.inflation) charts.inflation.destroy();
    const ctx2 = document.getElementById('inflationChart').getContext('2d');
    charts.inflation = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: h.labels,
            datasets: [
                { label: '名目淨資產', data: h.netAsset, borderColor: '#94a3b8', borderWidth: 2 },
                { label: '實質購買力', data: h.realAsset, borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 3, fill: true }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } }
    });
}

// =========================================================
// 6. 輔助函數與初始化 (Helpers & Init)
// =========================================================

function formatMoney(num) {
    if (isNaN(num)) return '--';
    return (num < 0 ? '-' : '') + '$' + Math.abs(Math.round(num)).toLocaleString('zh-TW');
}
function toggleHousingModule() {
    const isChecked = document.getElementById('buyHouseToggle').checked;
    const inputs = document.getElementById('housing-inputs');
    if (isChecked) inputs.classList.remove('opacity-50', 'pointer-events-none');
    else inputs.classList.add('opacity-50', 'pointer-events-none');
}
function exportCSV() {
    let csv = "\uFEFF年度,階級,稅後年收,房貸支出,現金流結餘,淨資產\n";
    document.querySelectorAll('#event-log-body tr').forEach(row => {
        csv += Array.from(row.querySelectorAll('td')).map(c => c.innerText.replace(/[$,]/g, '')).join(',') + "\n";
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `軍旅財務報表_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

document.addEventListener('DOMContentLoaded', () => {
    initScenarioStore();
    loadMemoryToInputs('A');
    orchestrateSimulation();
    
    document.body.addEventListener('input', (e) => {
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') orchestrateSimulation();
    });
});
