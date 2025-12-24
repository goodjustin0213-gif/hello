/**
 * 空軍官校職涯財務決策支援系統
 * Core Logic Script v7.0 (Strategic Commander Final Fix)
 * * Update Log:
 * - Fix: chart.js stacking conflict in Wealth Composition chart.
 * - Fix: NaN errors using safeParseFloat().
 * - Add: 4 Strategic Charts & Air Force Presets.
 */

// =========================================================
// 1. 全域資料庫 (Global Data)
// =========================================================

const REAL_SALARY_STRUCTURE = {
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, promotion_years: 1, annual_growth: 0.015, max_years: 12 }, 
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, promotion_years: 3, annual_growth: 0.015, max_years: 12 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, promotion_years: 4, annual_growth: 0.015, max_years: 17 }, 
    'M1': { rank: '少校', base: 32710, pro_add: 45000, promotion_years: 4, annual_growth: 0.015, max_years: 22 }, 
    'M2': { rank: '中校', base: 37310, pro_add: 55000, promotion_years: 4, annual_growth: 0.015, max_years: 26 }, 
    'M3': { rank: '上校', base: 41900, pro_add: 65000, promotion_years: 6, annual_growth: 0.015, max_years: 30 }, 
    'G1': { rank: '少將', base: 48030, pro_add: 70000, promotion_years: 4, annual_growth: 0.01, max_years: 35 },
    'G2': { rank: '中將', base: 53390, pro_add: 80000, promotion_years: 3, annual_growth: 0.01, max_years: 38 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1', 'G2'];
const VOLUNTEER_ADDITION = 15000;
const PENSION_RATE = 0.14; 
const INDIVIDUAL_PENSION_RATIO = 0.35; 

// 系統狀態
let currentScenario = 'A';
let scenarioData = { A: {}, B: {} };
let charts = {};
let counters = { allow: 0, exp: 0, inv: 0 };
let currentResult = null; 

// =========================================================
// 2. 初始化與預設值 (Init)
// =========================================================

function initScenarioStore() {
    const defaultParams = {
        targetRank: 'M2', serviceYears: 20, inflationRate: 2.0, salaryRaiseRate: 1.0, returnRate: 6.0,
        buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
        investSliderPct: 30,
        allowances: [{val: 0, start: 1, end: 20, name: '無加給'}], 
        expenses: [{name: '基本開銷', val: 12000}, {name: '房租', val: 6000}],
        investments: [{name: '儲蓄險', val: 3000}]
    };
    scenarioData.A = JSON.parse(JSON.stringify(defaultParams));
    scenarioData.B = JSON.parse(JSON.stringify(defaultParams));
    
    // 設定 B 方案差異
    scenarioData.B.serviceYears = 25;
    scenarioData.B.returnRate = 4.0;
    scenarioData.B.investSliderPct = 40;
}

// 空軍專屬預設值
function applyAirForcePreset() {
    document.getElementById('custom-allowances-container').innerHTML = '';
    addCustomAllowance({name: '空勤加給(初)', val: 20000, start: 1, end: 5}, true);
    addCustomAllowance({name: '空勤加給(中)', val: 40000, start: 6, end: 15}, true);
    addCustomAllowance({name: '空勤加給(高)', val: 60000, start: 16, end: 25}, false); 
}

// =========================================================
// 3. UI 互動與資料處理 (Interaction)
// =========================================================

function switchScenario(scen) {
    try {
        saveInputsToMemory(currentScenario);
        currentScenario = scen;
        
        // 更新按鈕樣式 (戰術風格)
        const btnA = document.getElementById('btn-scen-A');
        const btnB = document.getElementById('btn-scen-B');
        const activeClass = "py-2 text-xs font-bold rounded-sm text-white bg-airforce shadow-[0_0_10px_rgba(0,48,135,0.4)] transition border border-blue-500/50";
        const inactiveClass = "py-2 text-xs font-bold rounded-sm text-slate-500 hover:text-slate-300 transition border border-slate-700";
        
        if(scen === 'A') { 
            btnA.className = activeClass; 
            btnB.className = inactiveClass; 
        } else { 
            btnB.className = activeClass; 
            btnA.className = inactiveClass; 
        }
        
        document.getElementById('current-scen-label').innerText = `EDITING: SCENARIO ${scen}`;
        loadMemoryToInputs(scen);
        orchestrateSimulation();
    } catch (e) { console.error("Switch Error:", e); }
}

// *** 關鍵防呆函式 ***
function safeParseFloat(val) {
    if(!val) return 0;
    const clean = String(val).replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

function collectList(className, valClass) {
    const arr = [];
    document.querySelectorAll('.' + className).forEach(row => {
        const name = row.querySelector('.item-name')?.value || '';
        const val = safeParseFloat(row.querySelector('.' + valClass).value);
        const start = row.querySelector('.allow-start') ? safeParseFloat(row.querySelector('.allow-start').value) : 0;
        const end = row.querySelector('.allow-end') ? (safeParseFloat(row.querySelector('.allow-end').value) || 99) : 99;
        if(className === 'allowance-row') arr.push({val, start, end, name});
        else arr.push({name, val});
    });
    return arr;
}

function saveInputsToMemory(scen) {
    scenarioData[scen] = {
        targetRank: document.getElementById('targetRank').value,
        serviceYears: safeParseFloat(document.getElementById('serviceYears').value) || 20,
        inflationRate: safeParseFloat(document.getElementById('inflationRate').value) || 2.0,
        salaryRaiseRate: safeParseFloat(document.getElementById('salaryRaiseRate').value) || 1.0,
        returnRate: safeParseFloat(document.getElementById('returnRate').value) || 6.0,
        buyHouseToggle: document.getElementById('buyHouseToggle').checked,
        buyYear: safeParseFloat(document.getElementById('buyYear').value) || 10,
        housePriceWan: safeParseFloat(document.getElementById('housePriceWan').value) || 1500,
        downPaymentPct: safeParseFloat(document.getElementById('downPaymentPct').value) || 20,
        mortgageRate: safeParseFloat(document.getElementById('mortgageRate').value) || 2.2,
        loanTerm: safeParseFloat(document.getElementById('loanTerm').value) || 30,
        houseAppreciation: safeParseFloat(document.getElementById('houseAppreciation').value) || 1.5,
        investSliderPct: safeParseFloat(document.getElementById('investSlider').value) || 30,
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
        if(document.getElementById(id)) document.getElementById(id).value = data[id==='investSlider'?'investSliderPct':id]; 
    });
    
    const toggle = document.getElementById('buyHouseToggle');
    const hInputs = document.getElementById('housing-inputs');
    toggle.checked = data.buyHouseToggle;
    if(toggle.checked) hInputs.classList.remove('hidden'); 
    else hInputs.classList.add('hidden');

    updateSliderDisplay(); 

    document.getElementById('custom-allowances-container').innerHTML = '';
    (data.allowances || []).forEach(a => addCustomAllowance(a, true));
    document.getElementById('expense-items-container').innerHTML = '';
    (data.expenses || []).forEach(a => addExpenseItem(a, true));
    document.getElementById('invest-items-container').innerHTML = '';
    (data.investments || []).forEach(a => addInvestItem(a, true));
}

function updateSliderDisplay() {
    const val = document.getElementById('investSlider').value;
    document.getElementById('slider-percent-display').innerText = val + '%';
    orchestrateSimulation();
}

function setRisk(level) {
    const el = document.getElementById('returnRate');
    if(level === 'low') el.value = 1.5; 
    if(level === 'mid') el.value = 5.0; 
    if(level === 'high') el.value = 9.0;
    orchestrateSimulation();
}

function toggleHousingModule() {
    const isChecked = document.getElementById('buyHouseToggle').checked;
    const inputs = document.getElementById('housing-inputs');
    if (isChecked) inputs.classList.remove('hidden'); 
    else inputs.classList.add('hidden');
    orchestrateSimulation();
}

// UI Builder Helpers
function createRowHtml(id, type, data) {
    const name = data?.name || (type === 'exp' ? '固定支出' : (type === 'inv' ? '定期定額' : '加給'));
    const val = data?.val || 0; 
    const valClass = type === 'exp' ? 'exp-val' : (type === 'inv' ? 'inv-val' : 'allow-val');
    const rowClass = type === 'exp' ? 'expense-row' : (type === 'inv' ? 'invest-row' : 'allowance-row');
    const inputBg = 'bg-navy-900 border border-navy-700 text-white';
    
    let extra = '';
    if(type === 'allow') {
        const s = data?.start || 1; const e = data?.end || 20;
        extra = `<div class="col-span-2"><input type="number" value="${s}" class="w-full ${inputBg} px-1 text-center allow-start text-[10px]"></div><div class="col-span-2"><input type="number" value="${e}" class="w-full ${inputBg} px-1 text-center allow-end text-[10px]"></div>`;
    }
    return `<div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-[10px] bg-navy-800 p-1 rounded-sm ${rowClass} border border-navy-700">
        <div class="col-span-${type==='allow'?4:7}"><input type="text" value="${name}" class="w-full bg-transparent border-b border-slate-600 px-1 item-name text-slate-300"></div>
        <div class="col-span-3"><input type="number" value="${val}" class="w-full bg-transparent border-b border-slate-600 px-1 text-right ${valClass} text-white"></div>
        ${extra}
        <div class="col-span-${type==='allow'?1:2} text-center"><button onclick="document.getElementById('${id}').remove(); orchestrateSimulation()" class="text-red-400 hover:text-red-300 font-bold">×</button></div>
    </div>`;
}

function addCustomAllowance(d, skipSim=false){ counters.allow++; document.getElementById('custom-allowances-container').insertAdjacentHTML('beforeend', createRowHtml(`allow-${counters.allow}`, 'allow', d)); if(!skipSim) orchestrateSimulation(); }
function addExpenseItem(d, skipSim=false){ counters.exp++; document.getElementById('expense-items-container').insertAdjacentHTML('beforeend', createRowHtml(`exp-${counters.exp}`, 'exp', d)); if(!skipSim) orchestrateSimulation(); }
function addInvestItem(d, skipSim=false){ counters.inv++; document.getElementById('invest-items-container').insertAdjacentHTML('beforeend', createRowHtml(`inv-${counters.inv}`, 'inv', d)); if(!skipSim) orchestrateSimulation(); }

// =========================================================
// 4. 核心運算引擎 (Core Engine - Safe Mode)
// =========================================================

function calculateScenarioData(params) {
    try {
        // Defensive Parsing: Ensure Numbers
        const p = {
            targetRank: params.targetRank,
            years: safeParseFloat(params.serviceYears) || 20,
            inflation: (safeParseFloat(params.inflationRate) || 2.0) / 100,
            raise: (safeParseFloat(params.salaryRaiseRate) || 1.0) / 100,
            returnRate: (safeParseFloat(params.returnRate) || 6.0) / 100,
            buyHouse: params.buyHouseToggle,
            buyYear: safeParseFloat(params.buyYear) || 99,
            housePrice: (safeParseFloat(params.housePriceWan) || 0) * 10000,
            downPct: (safeParseFloat(params.downPaymentPct) || 20) / 100,
            mortgageRate: (safeParseFloat(params.mortgageRate) || 2.2) / 100,
            loanTerm: safeParseFloat(params.loanTerm) || 30,
            houseGrowth: (safeParseFloat(params.houseAppreciation) || 1.5) / 100,
            investSliderPct: (safeParseFloat(params.investSliderPct) || 30) / 100,
            allowances: params.allowances || [],
            expenses: params.expenses || [],
            investments: params.investments || []
        };

        const baseMonthlyExp = p.expenses.reduce((sum, item) => sum + safeParseFloat(item.val), 0);
        const baseFixedInv = p.investments.reduce((sum, item) => sum + safeParseFloat(item.val), 0);

        let currentRank = 'S2', yearOfRank = 0, forceRetired = false;
        let liquidAsset = 0, houseValue = 0, loanBalance = 0, monthlyMortgagePayment = 0, hasBoughtHouse = false;
        const targetIdx = RANK_ORDER.indexOf(p.targetRank);
        
        const history = { 
            labels: [], netAsset: [], realAsset: [], logs: [], house: [], loan: [], 
            cashflow: { income: [], expense: [], invest: [], mortgage: [], surplus: [] }
        };
        
        let firstYearExp = 0, firstYearInv = 0, firstYearNet = 0;

        for (let y = 1; y <= p.years; y++) {
            // Rank Promotion Logic
            if (y > REAL_SALARY_STRUCTURE[currentRank].max_years) { forceRetired = true; break; }
            const rankIdx = RANK_ORDER.indexOf(currentRank);
            if (yearOfRank >= REAL_SALARY_STRUCTURE[currentRank].promotion_years && rankIdx < targetIdx) { 
                currentRank = RANK_ORDER[rankIdx + 1]; 
                yearOfRank = 0; 
            }

            const rankData = REAL_SALARY_STRUCTURE[currentRank];
            const base = (rankData.base + rankData.pro_add) * Math.pow(1 + rankData.annual_growth, y - 1) * Math.pow(1 + p.raise, y - 1);
            
            let allowance = 0; 
            p.allowances.forEach(a => { if(y >= a.start && y <= a.end) allowance += safeParseFloat(a.val); });
            
            const gross = base + VOLUNTEER_ADDITION + allowance;
            const netMonthly = Math.round(gross * (1 - PENSION_RATE * INDIVIDUAL_PENSION_RATIO));
            
            // Housing Logic
            let yearMortgageCost = 0;
            if (p.buyHouse && y === p.buyYear && !hasBoughtHouse) {
                hasBoughtHouse = true; 
                houseValue = p.housePrice;
                const downPay = Math.round(p.housePrice * p.downPct);
                loanBalance = p.housePrice - downPay; 
                liquidAsset -= downPay; 
                const r = p.mortgageRate/12, n = p.loanTerm*12;
                monthlyMortgagePayment = (r>0) ? Math.round(loanBalance*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1)) : Math.round(loanBalance/n);
            }
            if (hasBoughtHouse) {
                houseValue = Math.round(houseValue * (1 + p.houseGrowth));
                if (loanBalance > 0) { 
                    yearMortgageCost = monthlyMortgagePayment * 12; 
                    loanBalance -= (yearMortgageCost - (loanBalance * p.mortgageRate)); 
                    if(loanBalance < 0) loanBalance = 0; 
                }
            }

            // Cashflow
            const dynamicInvest = netMonthly * p.investSliderPct; 
            const totalMonthlyInv = dynamicInvest + baseFixedInv; 
            const currentMonthlyExp = baseMonthlyExp * Math.pow(1 + p.inflation, y - 1);

            if(y === 1) { firstYearExp = currentMonthlyExp; firstYearInv = totalMonthlyInv; firstYearNet = netMonthly; }

            const annualIncome = netMonthly * 13.5;
            const annualExpense = currentMonthlyExp * 12;
            const annualInvest = totalMonthlyInv * 12;
            const netCashFlow = annualIncome - annualExpense - annualInvest - yearMortgageCost;

            // Asset Accumulation
            liquidAsset = liquidAsset * (1 + p.returnRate) + annualInvest + netCashFlow;
            const netAsset = liquidAsset + houseValue - loanBalance;

            history.labels.push(`Y${y}`);
            history.netAsset.push(Math.round(netAsset));
            history.realAsset.push(Math.round(netAsset / Math.pow(1 + p.inflation, y)));
            history.house.push(Math.round(houseValue));
            history.loan.push(Math.round(loanBalance));
            
            history.cashflow.income.push(Math.round(annualIncome));
            history.cashflow.expense.push(Math.round(annualExpense));
            history.cashflow.invest.push(Math.round(annualInvest));
            history.cashflow.mortgage.push(Math.round(yearMortgageCost));
            history.cashflow.surplus.push(Math.round(netCashFlow));

            history.logs.push({ y, rank: REAL_SALARY_STRUCTURE[currentRank].rank, income: annualIncome, mortgage: yearMortgageCost, cashflow: netCashFlow, netAsset, invest: annualInvest, expense: annualExpense });
            yearOfRank++;
        }
        
        let pension = 0;
        if (history.labels.length >= 20) {
            pension = Math.round(REAL_SALARY_STRUCTURE[currentRank].base * Math.pow(1.015, history.labels.length-1) * 2 * (0.55 + (history.labels.length - 20) * 0.02));
        }
        return { history, pension, params: p, firstYearExp, firstYearInv, firstYearNet };
    } catch (e) {
        console.error("Calculation Error:", e);
        return null;
    }
}

// =========================================================
// 5. 報表與圖表 (Visualization)
// =========================================================

function generateReport() {
    const res = currentResult; 
    if(!res) return;
    const h = res.history;
    const last = h.netAsset.length - 1;
    const netAsset = h.netAsset[last];
    const monthlySaveRate = res.firstYearNet > 0 ? Math.round((res.firstYearInv / res.firstYearNet) * 100) : 0;
    
    let analysis = `
        <div class="border-b border-slate-700 pb-2 mb-4"><h4 class="font-bold text-gold text-lg">戰略評估報告 (Assessment)</h4><p class="text-2xl font-black mt-2 ${netAsset > 0 ? 'text-green-400' : 'text-red-500'}">${netAsset > 0 ? 'STATUS: HEALTHY (財務健康)' : 'STATUS: CRITICAL (財務赤字)'}</p></div>
        <div class="space-y-4">
            <div class="bg-slate-800 p-3 rounded-sm border-l-2 border-blue-500"><span class="font-bold text-slate-300 block mb-1">儲蓄率分析 (Savings Rate)</span>目前首年儲蓄率約 <span class="font-bold text-blue-400 text-lg">${monthlySaveRate}%</span>。${monthlySaveRate < 20 ? '建議提升至 30% 以上以應對未來風險。' : '儲蓄習慣良好，請保持戰力。'}</div>
            <div class="bg-slate-800 p-3 rounded-sm border-l-2 border-gold"><span class="font-bold text-slate-300 block mb-1">資產預測 (Projection)</span>預計 ${res.params.years} 年後，您的名目淨資產將達到 <span class="font-bold text-gold text-lg">${formatMoney(netAsset)}</span>。</div>
            ${res.params.buyHouse ? `<div class="bg-slate-800 p-3 rounded-sm border-l-2 border-orange-500"><span class="font-bold text-slate-300 block mb-1">購屋評估 (Housing)</span>您設定了 ${res.params.housePrice/10000} 萬的房產。${h.logs[10] && h.logs[10].cashflow < 0 ? '<span class="text-red-400 font-bold">警告：購屋後現金流出現轉負風險。</span>' : '現金流尚可支撐房貸壓力。'}</div>` : ''}
        </div>`;
    document.getElementById('reportContent').innerHTML = analysis;
    document.getElementById('reportModal').classList.remove('hidden');
}
function closeReport() { document.getElementById('reportModal').classList.add('hidden'); }

function orchestrateSimulation() {
    try {
        saveInputsToMemory(currentScenario);
        const resA = calculateScenarioData(scenarioData.A);
        const resB = calculateScenarioData(scenarioData.B);
        if (!resA || !resB) return;
        currentResult = (currentScenario === 'A') ? resA : resB;
        updateUI(currentResult, (currentScenario === 'A') ? resB : resA);
    } catch (e) { console.error(e); }
}
function forceRefresh() { orchestrateSimulation(); }

function updateUI(res, compareRes) {
    const h = res.history; const last = h.netAsset.length - 1;
    document.getElementById('total-expense-display').innerText = formatMoney(res.firstYearExp);
    document.getElementById('total-invest-display').innerText = formatMoney(res.firstYearInv);
    const diff = h.netAsset[last] - compareRes.history.netAsset[compareRes.history.netAsset.length - 1];
    document.getElementById('total-asset').innerText = formatMoney(h.netAsset[last]);
    document.getElementById('comp-asset').innerHTML = `與方案 ${currentScenario==='A'?'B':'A'} 差異: <span class="${diff>=0?'text-green-400':'text-red-500'} font-bold">${(diff>=0?'+':'') + formatMoney(diff)}</span>`;
    document.getElementById('pension-monthly').innerText = res.pension > 0 ? formatMoney(res.pension) : "未達門檻";
    
    const hDiv = document.getElementById('housing-status-display');
    if (res.params.buyHouse) hDiv.innerHTML = `<div class="mt-1 text-xs text-slate-400"><div class="flex justify-between"><span>市值:</span> <span class="font-bold text-orange-400">${formatMoney(h.house[last])}</span></div><div class="flex justify-between"><span>剩貸:</span> <span class="font-bold text-red-400">-${formatMoney(h.loan[last])}</span></div></div>`;
    else hDiv.innerHTML = `<p class="text-sm text-slate-500 mt-1">未啟用</p>`;

    const negYears = h.logs.filter(l => l.netAsset < 0).length;
    const sb = document.getElementById('status-bar');
    if(negYears>0) { sb.classList.remove('hidden'); document.getElementById('warn-scen').innerText = currentScenario; } else sb.classList.add('hidden');

    const tbody = document.getElementById('event-log-body'); tbody.innerHTML = '';
    h.logs.forEach(l => tbody.insertAdjacentHTML('beforeend', `<tr class="hover:bg-slate-800 transition border-b border-slate-800"><td class="px-4 py-2 text-slate-500">Y${l.y}</td><td class="px-4 py-2 font-bold text-slate-200">${l.rank}</td><td class="px-4 py-2 text-right text-slate-300">${formatMoney(l.income)}</td><td class="px-4 py-2 text-right text-orange-400">${formatMoney(l.mortgage)}</td><td class="px-4 py-2 text-right text-slate-500">${formatMoney(l.expense)}</td><td class="px-4 py-2 text-right text-green-400">${formatMoney(l.invest)}</td><td class="px-4 py-2 text-right font-bold ${l.cashflow<0?'text-red-500':'text-blue-400'}">${formatMoney(l.cashflow)}</td><td class="px-4 py-2 text-right font-bold text-white">${formatMoney(l.netAsset)}</td></tr>`));

    renderCharts(res, compareRes);
}

function renderCharts(res, compRes) {
    Chart.defaults.font.family = '"JetBrains Mono", "Noto Sans TC", sans-serif';
    Chart.defaults.color = '#94a3b8';
    const h = res.history; const ch = compRes.history;

    // 1. Asset Compare (Line)
    if (charts.compare) charts.compare.destroy();
    const ctx1 = document.getElementById('assetCompareChart').getContext('2d');
    charts.compare = new Chart(ctx1, { type: 'line', data: { labels: h.labels, datasets: [{ label: `方案 ${currentScenario}`, data: h.netAsset, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 }, { label: `方案 ${currentScenario==='A'?'B':'A'}`, data: ch.netAsset, borderColor: '#64748b', borderWidth: 2, borderDash: [5,5], fill: false, tension: 0.3, pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#334155' } }, y: { grid: { color: '#334155' } } } } });

    // 2. Cashflow DNA (Stacked Bar)
    if (charts.cashflow) charts.cashflow.destroy();
    const ctxCF = document.getElementById('cashflowChart').getContext('2d');
    charts.cashflow = new Chart(ctxCF, { type: 'bar', data: { labels: h.labels, datasets: [ { label: '房貸', data: h.cashflow.mortgage, backgroundColor: '#f97316' }, { label: '生活', data: h.cashflow.expense, backgroundColor: '#64748b' }, { label: '投資', data: h.cashflow.invest, backgroundColor: '#22c55e' }, { label: '結餘', data: h.cashflow.surplus, backgroundColor: '#3b82f6' } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: '#334155' } } }, plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } } } });

    // 3. Wealth Composition (Area / Line) - Fixed Stacking
    if (charts.wealth) charts.wealth.destroy();
    const ctxW = document.getElementById('wealthChart').getContext('2d');
    const liquidData = h.netAsset.map((net, i) => net - h.house[i] + h.loan[i]);
    charts.wealth = new Chart(ctxW, { 
        type: 'line', 
        data: { 
            labels: h.labels, 
            datasets: [ 
                { label: '房貸餘額', data: h.loan, type: 'line', borderColor: '#ef4444', borderWidth: 2, borderDash: [5,5], fill: false, order: 0 }, 
                { label: '流動資產', data: liquidData, backgroundColor: 'rgba(59, 130, 246, 0.5)', fill: true, borderWidth: 0, order: 2, stack: 'assets' }, 
                { label: '房產市值', data: h.house, backgroundColor: 'rgba(249, 115, 22, 0.5)', fill: true, borderWidth: 0, order: 1, stack: 'assets' } 
            ] 
        }, 
        options: { 
            responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, 
            scales: { y: { stacked: false, grid: { color: '#334155' } } }, // Key fix: disable global stacked
            plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } } 
        } 
    });

    // 4. Inflation Chart
    if (charts.inflation) charts.inflation.destroy();
    const ctx2 = document.getElementById('inflationChart').getContext('2d');
    charts.inflation = new Chart(ctx2, { type: 'line', data: { labels: h.labels, datasets: [{ label: '名目', data: h.netAsset, borderColor: '#cbd5e1', borderWidth: 2, pointRadius: 0 }, { label: '實質', data: h.realAsset, borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 2, fill: true, pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { color: '#334155' } }, y: { grid: { color: '#334155' } } } } });
}

function formatMoney(n) { return (isNaN(n) ? '--' : (n<0?'-':'')+'$'+Math.abs(Math.round(n)).toLocaleString('zh-TW')); }
function exportCSV() {
    let csv = "\uFEFF年度,階級,稅後年收,房貸支出,總支出,總投資,現金流結餘,淨資產\n";
    document.querySelectorAll('#event-log-body tr').forEach(r => csv += Array.from(r.querySelectorAll('td')).map(c => c.innerText.replace(/[$,]/g, '')).join(',') + "\n");
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8;'})); a.download = 'report.csv'; a.click();
}

document.addEventListener('DOMContentLoaded', () => {
    initScenarioStore(); loadMemoryToInputs('A'); orchestrateSimulation();
    document.body.addEventListener('input', (e) => { if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT') orchestrateSimulation(); });
});
