/**
 * 軍官職涯財務戰情室 (Strategic Financial Command Center)
 * 核心邏輯腳本 v2.2 (Slider Edition)
 * * 主要功能：
 * 1. 投資槓桿滑桿 (Salary Percentage Slider)
 * 2. 混合投資運算 (Slider % + Fixed Items)
 * 3. 細項支出/加給管理
 * 4. AB 雙方案即時對照
 * 5. 購屋戰略模組 (資產負債表模擬)
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

// 狀態管理
let currentScenario = 'A';
let scenarioData = { A: {}, B: {} };
let charts = {};
// ID 計數器
let counters = { allow: 0, exp: 0, inv: 0 };

// =========================================================
// 2. 方案與列表管理 (Scenario & Lists)
// =========================================================

function initScenarioStore() {
    const defaultParams = {
        targetRank: 'M2', serviceYears: 20, inflationRate: 2.0, salaryRaiseRate: 1.0, returnRate: 6.0,
        buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
        investSliderPct: 30, // 滑桿預設值 (30%)
        allowances: [{val: 5000, start: 5, end: 10}],
        expenses: [{name: '基本開銷', val: 12000}, {name: '房租', val: 6000}],
        investments: [{name: '儲蓄險', val: 3000}] // 這裡只放固定金額項目
    };
    scenarioData.A = JSON.parse(JSON.stringify(defaultParams));
    scenarioData.B = JSON.parse(JSON.stringify(defaultParams));
    
    // 設定對照組差異
    scenarioData.B.serviceYears = 25;
    scenarioData.B.returnRate = 4.0; 
    scenarioData.B.investSliderPct = 40; // 對照組存比較多
}

function switchScenario(scen) {
    saveInputsToMemory(currentScenario);
    currentScenario = scen;
    document.getElementById('current-scen-label').innerText = `EDITING: ${scen}`;
    
    const btnA = document.getElementById('btn-scen-A');
    const btnB = document.getElementById('btn-scen-B');
    if(scen === 'A') {
        btnA.className = btnA.className.replace('tab-inactive', 'tab-active');
        btnB.className = btnB.className.replace('tab-active', 'tab-inactive');
    } else {
        btnB.className = btnB.className.replace('tab-inactive', 'tab-active');
        btnA.className = btnA.className.replace('tab-active', 'tab-inactive');
    }
    
    loadMemoryToInputs(scen);
    orchestrateSimulation();
}

function collectList(className, valClass) {
    const arr = [];
    document.querySelectorAll('.' + className).forEach(row => {
        const name = row.querySelector('.item-name')?.value || '';
        const val = parseInt(row.querySelector('.' + valClass).value) || 0;
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
        investSliderPct: document.getElementById('investSlider').value, // 儲存滑桿數值
        allowances: collectList('allowance-row', 'allow-val'),
        expenses: collectList('expense-row', 'exp-val'),
        investments: collectList('invest-row', 'inv-val')
    };
}

function loadMemoryToInputs(scen) {
    const data = scenarioData[scen];
    if(!data) return;
    
    const fields = ['targetRank', 'serviceYears', 'inflationRate', 'salaryRaiseRate', 'returnRate', 'buyYear', 'housePriceWan', 'downPaymentPct', 'mortgageRate', 'loanTerm', 'houseAppreciation', 'investSlider'];
    fields.forEach(id => { 
        // 對應 investSlider 到記憶體中的 investSliderPct
        if(document.getElementById(id)) document.getElementById(id).value = data[id==='investSlider'?'investSliderPct':id]; 
    });
    
    document.getElementById('buyHouseToggle').checked = data.buyHouseToggle;
    toggleHousingModule();
    updateSliderDisplay(); // 更新滑桿顯示文字

    // 重建列表
    document.getElementById('custom-allowances-container').innerHTML = '';
    (data.allowances || []).forEach(a => addCustomAllowance(a));
    document.getElementById('expense-items-container').innerHTML = '';
    (data.expenses || []).forEach(a => addExpenseItem(a));
    document.getElementById('invest-items-container').innerHTML = '';
    (data.investments || []).forEach(a => addInvestItem(a));
}

// =========================================================
// 3. UI Helpers (Slider & Lists)
// =========================================================

// 更新滑桿顯示與金額預估
function updateSliderDisplay() {
    const val = document.getElementById('investSlider').value;
    document.getElementById('slider-percent-display').innerText = val + '%';
    
    // 取得當前目標階級的概略月薪，做為使用者參考用 (非精確計算)
    const rank = document.getElementById('targetRank').value;
    const rData = REAL_SALARY_STRUCTURE[rank];
    // 粗估淨額: (本俸+專加+伙食+志願役) * 95%
    const estNet = (rData.base + rData.pro_add + rData.food_add + VOLUNTEER_ADDITION) * 0.95; 
    const estAmt = Math.round(estNet * (val/100));
    document.getElementById('slider-amount-display').innerText = formatMoney(estAmt);
    
    // 觸發運算
    orchestrateSimulation();
}

function setRisk(level) {
    const el = document.getElementById('returnRate');
    if(level === 'low') el.value = 1.5;
    if(level === 'mid') el.value = 5.0;
    if(level === 'high') el.value = 9.0;
    orchestrateSimulation();
}

function createRowHtml(id, type, data) {
    const name = data?.name || (type === 'exp' ? '固定支出' : (type === 'inv' ? '定期定額' : '加給'));
    const val = data?.val || 5000;
    const color = type === 'exp' ? 'blue' : (type === 'inv' ? 'green' : 'slate');
    const valClass = type === 'exp' ? 'exp-val' : (type === 'inv' ? 'inv-val' : 'allow-val');
    const rowClass = type === 'exp' ? 'expense-row' : (type === 'inv' ? 'invest-row' : 'allowance-row');
    
    let extra = '';
    if(type === 'allow') {
        const s = data?.start || 5; const e = data?.end || 10;
        extra = `<div class="col-span-2"><input type="number" value="${s}" class="w-full border-b border-slate-300 bg-transparent px-1 text-center allow-start"></div><div class="col-span-2"><input type="number" value="${e}" class="w-full border-b border-slate-300 bg-transparent px-1 text-center allow-end"></div>`;
    }
    return `<div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-[10px] bg-${color}-50 p-1 rounded ${rowClass}"><div class="col-span-${type==='allow'?4:7}"><input type="text" value="${name}" class="w-full border-b border-slate-300 bg-transparent px-1 item-name"></div><div class="col-span-3"><input type="number" value="${val}" class="w-full border-b border-slate-300 bg-transparent px-1 text-right ${valClass}"></div>${extra}<div class="col-span-${type==='allow'?1:2} text-center"><button onclick="document.getElementById('${id}').remove(); orchestrateSimulation()" class="text-red-400 hover:text-red-600 font-bold">×</button></div></div>`;
}

function addCustomAllowance(d){ counters.allow++; document.getElementById('custom-allowances-container').insertAdjacentHTML('beforeend', createRowHtml(`allow-${counters.allow}`, 'allow', d)); }
function addExpenseItem(d){ counters.exp++; document.getElementById('expense-items-container').insertAdjacentHTML('beforeend', createRowHtml(`exp-${counters.exp}`, 'exp', d)); orchestrateSimulation(); }
function addInvestItem(d){ counters.inv++; document.getElementById('invest-items-container').insertAdjacentHTML('beforeend', createRowHtml(`inv-${counters.inv}`, 'inv', d)); orchestrateSimulation(); }

// =========================================================
// 4. 核心模擬引擎 (Hybrid Calculation)
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
        investSliderPct: parseFloat(params.investSliderPct)/100 || 0, // 讀取滑桿百分比
        allowances: params.allowances || [],
        expenses: params.expenses || [],
        investments: params.investments || []
    };

    const baseMonthlyExp = p.expenses.reduce((sum, item) => sum + item.val, 0);
    const baseFixedInv = p.investments.reduce((sum, item) => sum + item.val, 0);

    let currentRank = 'S2', yearOfRank = 0, forceRetired = false;
    let liquidAsset = 0, houseValue = 0, loanBalance = 0, monthlyMortgagePayment = 0, hasBoughtHouse = false;
    const targetIdx = RANK_ORDER.indexOf(p.targetRank);
    const history = { labels: [], netAsset: [], realAsset: [], logs: [], house: [], loan: [] };
    
    // 用於顯示第一年的預估總投資額
    let totalSimulatedInvestFirstYear = 0; 

    for (let y = 1; y <= p.years; y++) {
        // 強制退伍與晉升邏輯
        if (y > REAL_SALARY_STRUCTURE[currentRank].max_years) { forceRetired = true; break; }
        const rankIdx = RANK_ORDER.indexOf(currentRank);
        if (yearOfRank >= REAL_SALARY_STRUCTURE[currentRank].promotion_years && rankIdx < targetIdx) { currentRank = RANK_ORDER[rankIdx + 1]; yearOfRank = 0; }

        // 薪資計算
        const rankData = REAL_SALARY_STRUCTURE[currentRank];
        const base = (rankData.base + rankData.pro_add) * Math.pow(1 + rankData.annual_growth, y - 1) * Math.pow(1 + p.raise, y - 1);
        let allowance = 0; p.allowances.forEach(a => { if(y >= a.start && y <= a.end) allowance += a.val; });
        const netMonthly = Math.round((base + rankData.food_add + VOLUNTEER_ADDITION + allowance) * (1 - PENSION_RATE * INDIVIDUAL_PENSION_RATIO));
        
        // 購屋邏輯
        let yearMortgageCost = 0;
        if (p.buyHouse && y === p.buyYear && !hasBoughtHouse) {
            hasBoughtHouse = true; houseValue = p.housePrice;
            const downPay = Math.round(p.housePrice * p.downPct);
            loanBalance = p.housePrice - downPay; liquidAsset -= downPay;
            const r = p.mortgageRate/12, n = p.loanTerm*12;
            monthlyMortgagePayment = (r>0) ? Math.round(loanBalance*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1)) : Math.round(loanBalance/n);
        }
        if (hasBoughtHouse) {
            houseValue = Math.round(houseValue * (1 + p.houseGrowth));
            if (loanBalance > 0) { yearMortgageCost = monthlyMortgagePayment * 12; loanBalance -= (yearMortgageCost - (loanBalance * p.mortgageRate)); if(loanBalance < 0) loanBalance = 0; }
        }

        // *** 混合投資邏輯 (Hybrid Calculation) ***
        // 1. 動態薪資提撥 (Slider): 隨薪資成長而增加
        const dynamicInvest = netMonthly * p.investSliderPct;
        // 2. 固定項目投資 (List): 保持固定金額 (使用者可手動調整清單)
        const fixedInvest = baseFixedInv;
        
        const totalMonthlyInv = dynamicInvest + fixedInvest;
        if(y === 1) totalSimulatedInvestFirstYear = totalMonthlyInv; // 紀錄第一年供顯示

        // 支出隨通膨成長
        const currentMonthlyExp = baseMonthlyExp * Math.pow(1 + p.inflation, y - 1);

        // 現金流匯總
        const annualIncome = netMonthly * 13.5;
        const annualExpense = currentMonthlyExp * 12;
        const annualInvest = totalMonthlyInv * 12;
        const netCashFlow = annualIncome - annualExpense - annualInvest - yearMortgageCost;

        // 複利滾存
        liquidAsset = liquidAsset * (1 + p.returnRate) + annualInvest + netCashFlow;
        const netAsset = liquidAsset + houseValue - loanBalance;

        history.labels.push(`Y${y}`);
        history.netAsset.push(Math.round(netAsset));
        history.realAsset.push(Math.round(netAsset / Math.pow(1 + p.inflation, y)));
        history.house.push(Math.round(houseValue));
        history.loan.push(Math.round(loanBalance));
        history.logs.push({ y, rank: REAL_SALARY_STRUCTURE[currentRank].rank, income: annualIncome, mortgage: yearMortgageCost, cashflow: netCashFlow, netAsset, invest: annualInvest, expense: annualExpense });
        yearOfRank++;
    }
    
    let pension = 0;
    if (history.labels.length >= 20) {
        pension = Math.round(REAL_SALARY_STRUCTURE[currentRank].base * Math.pow(1.015, history.labels.length-1) * 2 * (0.55 + (history.labels.length - 20) * 0.02));
    }
    
    // 返回 baseMonthlyInv 為第一年的總預估投資額
    return { history, pension, params: p, baseMonthlyExp, baseMonthlyInv: totalSimulatedInvestFirstYear };
}

// =========================================================
// 5. 運算指揮與 UI 更新
// =========================================================

function orchestrateSimulation() {
    saveInputsToMemory(currentScenario);
    const resA = calculateScenarioData(scenarioData.A);
    const resB = calculateScenarioData(scenarioData.B);
    updateUI((currentScenario === 'A') ? resA : resB, (currentScenario === 'A') ? resB : resA);
}
function forceRefresh() { orchestrateSimulation(); }

function updateUI(res, compareRes) {
    const h = res.history; const last = h.netAsset.length - 1;
    
    // 更新側邊欄金額 (顯示第一年預估值)
    document.getElementById('total-expense-display').innerText = formatMoney(res.baseMonthlyExp);
    document.getElementById('total-invest-display').innerText = formatMoney(res.baseMonthlyInv);
    
    // KPI
    const diff = h.netAsset[last] - compareRes.history.netAsset[compareRes.history.netAsset.length - 1];
    document.getElementById('total-asset').innerText = formatMoney(h.netAsset[last]);
    document.getElementById('comp-asset').innerHTML = `與方案 ${currentScenario==='A'?'B':'A'} 差異: <span class="${diff>=0?'text-green-500':'text-red-500'} font-bold">${(diff>=0?'+':'') + formatMoney(diff)}</span>`;
    document.getElementById('pension-monthly').innerText = res.pension > 0 ? formatMoney(res.pension) : "未達門檻";
    
    // Housing
    const hDiv = document.getElementById('housing-status-display');
    if (res.params.buyHouse) hDiv.innerHTML = `<div class="mt-2 text-xs text-slate-500 space-y-1"><div class="flex justify-between"><span>市值:</span> <span class="font-bold text-orange-700">${formatMoney(h.house[last])}</span></div><div class="flex justify-between"><span>剩貸:</span> <span class="font-bold text-red-600">-${formatMoney(h.loan[last])}</span></div></div>`;
    else hDiv.innerHTML = `<p class="text-xl font-bold text-slate-300 mt-2">未啟用購屋模組</p>`;

    // Warning
    const negYears = h.logs.filter(l => l.netAsset < 0).length;
    const sb = document.getElementById('status-bar');
    if(negYears>0) { sb.classList.remove('hidden'); document.getElementById('warn-scen').innerText = currentScenario; }
    else sb.classList.add('hidden');

    // Table
    const tbody = document.getElementById('event-log-body'); tbody.innerHTML = '';
    h.logs.forEach(l => tbody.insertAdjacentHTML('beforeend', `<tr><td class="px-4 py-3 text-slate-500">Y${l.y}</td><td class="px-4 py-3 font-bold text-military-900">${l.rank}</td><td class="px-4 py-3 text-right">${formatMoney(l.income)}</td><td class="px-4 py-3 text-right text-orange-500">${formatMoney(l.expense)}</td><td class="px-4 py-3 text-right text-green-600">${formatMoney(l.invest)}</td><td class="px-4 py-3 text-right font-bold ${l.cashflow<0?'text-red-600':'text-blue-600'}">${formatMoney(l.cashflow)}</td><td class="px-4 py-3 text-right font-bold">${formatMoney(l.netAsset)}</td></tr>`));

    renderCharts(res, compareRes);
}

function renderCharts(res, compRes) {
    Chart.defaults.font.family = '"Noto Sans TC", sans-serif';
    const h = res.history; const ch = compRes.history;

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
// 6. Helpers & Init
// =========================================================

function formatMoney(n) { return (isNaN(n) ? '--' : (n<0?'-':'')+'$'+Math.abs(Math.round(n)).toLocaleString('zh-TW')); }
function toggleHousingModule() { const c=document.getElementById('buyHouseToggle').checked; document.getElementById('housing-inputs').classList.toggle('opacity-50', !c); document.getElementById('housing-inputs').classList.toggle('pointer-events-none', !c); }
function exportCSV() {
    let csv = "\uFEFF年度,階級,稅後年收,房貸支出,總支出,總投資,現金流結餘,淨資產\n";
    document.querySelectorAll('#event-log-body tr').forEach(r => csv += Array.from(r.querySelectorAll('td')).map(c => c.innerText.replace(/[$,]/g, '')).join(',') + "\n");
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8;'})); a.download = 'report.csv'; a.click();
}

document.addEventListener('DOMContentLoaded', () => {
    initScenarioStore(); loadMemoryToInputs('A'); orchestrateSimulation();
    document.body.addEventListener('input', (e) => { if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT') orchestrateSimulation(); });
});
