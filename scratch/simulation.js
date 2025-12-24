/**
 * 空軍官校職涯財務決策支援系統
 * Core Logic Script v6.0 (Strategic Commander Edition)
 * * Update Log:
 * - 全面修復 NaN 運算錯誤 (強制數值轉換)
 * - 新增 4 種戰略分析圖表 (Cashflow, Wealth Structure)
 * - 強化空軍專屬加給預設值
 */

// =========================================================
// 1. 全域資料庫 (Global Data)
// =========================================================

// 薪資結構表 (依據 2025 年生效俸額表)
const REAL_SALARY_STRUCTURE = {
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, promotion_years: 1, annual_growth: 0.015, max_years: 12 }, 
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, promotion_years: 3, annual_growth: 0.015, max_years: 12 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, promotion_years: 4, annual_growth: 0.015, max_years: 17 }, 
    'M1': { rank: '少校', base: 32710, pro_add: 45000, promotion_years: 4, annual_growth: 0.015, max_years: 22 }, 
    'M2': { rank: '中校', base: 37310, pro_add: 55000, promotion_years: 4, annual_growth: 0.015, max_years: 26 }, 
    'M3': { rank: '上校', base: 41900, pro_add: 65000, promotion_years: 6, annual_growth: 0.015, max_years: 30 }, 
    'G1': { rank: '少將', base: 48030, pro_add: 70000, promotion_years: 4, annual_growth: 0.01, max_years: 35 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1'];
const VOLUNTEER_ADDITION = 15000; // 志願役加給
const PENSION_RATE = 0.14;        // 退撫費率
const INDIVIDUAL_PENSION_RATIO = 0.35; // 個人負擔比率 (35%)

// 系統狀態
let currentScenario = 'A';
let scenarioData = { A: {}, B: {} };
let charts = {}; // 存放 Chart.js 實例
let counters = { allow: 0, exp: 0, inv: 0 };
let currentResult = null; // 儲存當前計算結果供報表使用

// =========================================================
// 2. 初始化與預設值 (Initialization)
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
    
    // 設定對照組 B 的差異
    scenarioData.B.serviceYears = 25;
    scenarioData.B.returnRate = 4.0;
    scenarioData.B.investSliderPct = 40;
}

// 空軍專屬預設值按鈕
function applyAirForcePreset() {
    document.getElementById('custom-allowances-container').innerHTML = '';
    // 模擬空勤加給隨年資調整
    addCustomAllowance({name: '空勤加給(初)', val: 20000, start: 1, end: 5}, true);
    addCustomAllowance({name: '空勤加給(中)', val: 40000, start: 6, end: 15}, true);
    addCustomAllowance({name: '空勤加給(高)', val: 60000, start: 16, end: 25}, false); 
}

// =========================================================
// 3. UI 互動邏輯 (Interaction)
// =========================================================

function switchScenario(scen) {
    saveInputsToMemory(currentScenario);
    currentScenario = scen;
    
    // 更新按鈕樣式
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

// =========================================================
// 4. 資料存取與 DOM 操作 (Data Handling)
// =========================================================

function collectList(className, valClass) {
    const arr = [];
    document.querySelectorAll('.' + className).forEach(row => {
        const name = row.querySelector('.item-name')?.value || '';
        // 關鍵修復：強制轉 Number 避免 NaN
        const val = Number(row.querySelector('.' + valClass).value) || 0; 
        const start = row.querySelector('.allow-start') ? (Number(row.querySelector('.allow-start').value) || 0) : 0;
        const end = row.querySelector('.allow-end') ? (Number(row.querySelector('.allow-end').value) || 99) : 99;
        
        if(className === 'allowance-row') arr.push({val, start, end, name});
        else arr.push({name, val});
    });
    return arr;
}

function saveInputsToMemory(scen) {
    scenarioData[scen] = {
        targetRank: document.getElementById('targetRank').value,
        serviceYears: Number(document.getElementById('serviceYears').value) || 20,
        inflationRate: Number(document.getElementById('inflationRate').value) || 2.0,
        salaryRaiseRate: Number(document.getElementById('salaryRaiseRate').value) || 1.0,
        returnRate: Number(document.getElementById('returnRate').value) || 6.0,
        buyHouseToggle: document.getElementById('buyHouseToggle').checked,
        buyYear: Number(document.getElementById('buyYear').value) || 10,
        housePriceWan: Number(document.getElementById('housePriceWan').value) || 1500,
        downPaymentPct: Number(document.getElementById('downPaymentPct').value) || 20,
        mortgageRate: Number(document.getElementById('mortgageRate').value) || 2.2,
        loanTerm: Number(document.getElementById('loanTerm').value) || 30,
        houseAppreciation: Number(document.getElementById('houseAppreciation').value) || 1.5,
        investSliderPct: Number(document.getElementById('investSlider').value) || 30,
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

    // 重建列表
    document.getElementById('custom-allowances-container').innerHTML = '';
    (data.allowances || []).forEach(a => addCustomAllowance(a, true));
    document.getElementById('expense-items-container').innerHTML = '';
    (data.expenses || []).forEach(a => addExpenseItem(a, true));
    document.getElementById('invest-items-container').innerHTML = '';
    (data.investments || []).forEach(a => addInvestItem(a, true));
}

// 動態新增列
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
// 5. 核心運算引擎 (Core Simulation Engine)
// =========================================================

function calculateScenarioData(params) {
    // 1. 防禦性複製參數，確保所有輸入都是數值
    const p = {
        targetRank: params.targetRank,
        years: Number(params.serviceYears) || 20,
        inflation: (Number(params.inflationRate) || 2.0) / 100,
        raise: (Number(params.salaryRaiseRate) || 1.0) / 100,
        returnRate: (Number(params.returnRate) || 6.0) / 100,
        buyHouse: params.buyHouseToggle,
        buyYear: Number(params.buyYear) || 99,
        housePrice: (Number(params.housePriceWan) || 0) * 10000,
        downPct: (Number(params.downPaymentPct) || 20) / 100,
        mortgageRate: (Number(params.mortgageRate) || 2.2) / 100,
        loanTerm: Number(params.loanTerm) || 30,
        houseGrowth: (Number(params.houseAppreciation) || 1.5) / 100,
        investSliderPct: (Number(params.investSliderPct) || 30) / 100,
        allowances: params.allowances || [],
        expenses: params.expenses || [],
        investments: params.investments || []
    };

    const baseMonthlyExp = p.expenses.reduce((sum, item) => sum + (Number(item.val) || 0), 0);
    const baseFixedInv = p.investments.reduce((sum, item) => sum + (Number(item.val) || 0), 0);

    let currentRank = 'S2', yearOfRank = 0, forceRetired = false;
    let liquidAsset = 0, houseValue = 0, loanBalance = 0, monthlyMortgagePayment = 0, hasBoughtHouse = false;
    const targetIdx = RANK_ORDER.indexOf(p.targetRank);
    
    // 初始化數據陣列
    const history = { 
        labels: [], netAsset: [], realAsset: [], logs: [], house: [], loan: [], 
        cashflow: { income: [], expense: [], invest: [], mortgage: [], surplus: [] }
    };
    
    let firstYearExp = 0, firstYearInv = 0, firstYearNet = 0;

    // 2. 逐年模擬迴圈
    for (let y = 1; y <= p.years; y++) {
        // A. 階級與退伍判斷
        if (y > REAL_SALARY_STRUCTURE[currentRank].max_years) { forceRetired = true; break; }
        const rankIdx = RANK_ORDER.indexOf(currentRank);
        if (yearOfRank >= REAL_SALARY_STRUCTURE[currentRank].promotion_years && rankIdx < targetIdx) { 
            currentRank = RANK_ORDER[rankIdx + 1]; 
            yearOfRank = 0; 
        }

        // B. 薪資計算 (本俸+專加) * 複利成長
        const rankData = REAL_SALARY_STRUCTURE[currentRank];
        const base = (rankData.base + rankData.pro_add) * Math.pow(1 + rankData.annual_growth, y - 1) * Math.pow(1 + p.raise, y - 1);
        
        // 加給計算 (檢查年份區間)
        let allowance = 0; 
        p.allowances.forEach(a => { if(y >= a.start && y <= a.end) allowance += (Number(a.val) || 0); });
        
        // 應領與實領 (扣退撫)
        const gross = base + VOLUNTEER_ADDITION + allowance;
        const netMonthly = Math.round(gross * (1 - PENSION_RATE * INDIVIDUAL_PENSION_RATIO));
        
        // C. 購屋邏輯
        let yearMortgageCost = 0;
        if (p.buyHouse && y === p.buyYear && !hasBoughtHouse) {
            hasBoughtHouse = true; 
            houseValue = p.housePrice;
            const downPay = Math.round(p.housePrice * p.downPct);
            loanBalance = p.housePrice - downPay; 
            liquidAsset -= downPay; // 扣除頭期款
            
            // 本息均攤公式
            const r = p.mortgageRate/12, n = p.loanTerm*12;
            monthlyMortgagePayment = (r>0) ? Math.round(loanBalance*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1)) : Math.round(loanBalance/n);
        }
        if (hasBoughtHouse) {
            houseValue = Math.round(houseValue * (1 + p.houseGrowth));
            if (loanBalance > 0) { 
                yearMortgageCost = monthlyMortgagePayment * 12; 
                // 概算本金償還 (簡化計算，不精確拆分利息本金)
                loanBalance -= (yearMortgageCost - (loanBalance * p.mortgageRate)); 
                if(loanBalance < 0) loanBalance = 0; 
            }
        }

        // D. 投資與支出計算
        const dynamicInvest = netMonthly * p.investSliderPct; 
        const totalMonthlyInv = dynamicInvest + baseFixedInv; 
        const currentMonthlyExp = baseMonthlyExp * Math.pow(1 + p.inflation, y - 1);

        if(y === 1) { firstYearExp = currentMonthlyExp; firstYearInv = totalMonthlyInv; firstYearNet = netMonthly; }

        // E. 年度現金流結算 (13.5 個月)
        const annualIncome = netMonthly * 13.5;
        const annualExpense = currentMonthlyExp * 12;
        const annualInvest = totalMonthlyInv * 12;
        const netCashFlow = annualIncome - annualExpense - annualInvest - yearMortgageCost;

        // F. 資產複利滾存
        liquidAsset = liquidAsset * (1 + p.returnRate) + annualInvest + netCashFlow;
        const netAsset = liquidAsset + houseValue - loanBalance;

        // G. 紀錄數據
        history.labels.push(`Y${y}`);
        history.netAsset.push(Math.round(netAsset));
        history.realAsset.push(Math.round(netAsset / Math.pow(1 + p.inflation, y)));
        history.house.push(Math.round(houseValue));
        history.loan.push(Math.round(loanBalance));
        
        // 紀錄詳細現金流結構供圖表使用
        history.cashflow.income.push(Math.round(annualIncome));
        history.cashflow.expense.push(Math.round(annualExpense));
        history.cashflow.invest.push(Math.round(annualInvest));
        history.cashflow.mortgage.push(Math.round(yearMortgageCost));
        history.cashflow.surplus.push(Math.round(netCashFlow));

        history.logs.push({ 
            y, rank: REAL_SALARY_STRUCTURE[currentRank].rank, 
            income: annualIncome, mortgage: yearMortgageCost, 
            cashflow: netCashFlow, netAsset, invest: annualInvest, expense: annualExpense 
        });
        
        yearOfRank++;
    }
    
    // H. 終身俸試算 (概估)
    let pension = 0;
    if (history.labels.length >= 20) {
        pension = Math.round(REAL_SALARY_STRUCTURE[currentRank].base * Math.pow(1.015, history.labels.length-1) * 2 * (0.55 + (history.labels.length - 20) * 0.02));
    }
    return { history, pension, params: p, firstYearExp, firstYearInv, firstYearNet };
}

// =========================================================
// 6. UI 更新與圖表繪製 (Visualization)
// =========================================================

function orchestrateSimulation() {
    saveInputsToMemory(currentScenario);
    const resA = calculateScenarioData(scenarioData.A);
    const resB = calculateScenarioData(scenarioData.B);
    currentResult = (currentScenario === 'A') ? resA : resB;
    updateUI(currentResult, (currentScenario === 'A') ? resB : resA);
}
function forceRefresh() { orchestrateSimulation(); }

function updateUI(res, compareRes) {
    const h = res.history; const last = h.netAsset.length - 1;
    
    // 更新側邊欄數字
    document.getElementById('total-expense-display').innerText = formatMoney(res.firstYearExp);
    document.getElementById('total-invest-display').innerText = formatMoney(res.firstYearInv);
    
    // 更新頂部 KPI
    const diff = h.netAsset[last] - compareRes.history.netAsset[compareRes.history.netAsset.length - 1];
    document.getElementById('total-asset').innerText = formatMoney(h.netAsset[last]);
    document.getElementById('comp-asset').innerHTML = `與方案 ${currentScenario==='A'?'B':'A'} 差異: <span class="${diff>=0?'text-green-400':'text-red-500'} font-bold">${(diff>=0?'+':'') + formatMoney(diff)}</span>`;
    document.getElementById('pension-monthly').innerText = res.pension > 0 ? formatMoney(res.pension) : "未達門檻";
    
    const hDiv = document.getElementById('housing-status-display');
    if (res.params.buyHouse) hDiv.innerHTML = `<div class="mt-1 text-xs text-slate-400"><div class="flex justify-between"><span>市值:</span> <span class="font-bold text-orange-400">${formatMoney(h.house[last])}</span></div><div class="flex justify-between"><span>剩貸:</span> <span class="font-bold text-red-400">-${formatMoney(h.loan[last])}</span></div></div>`;
    else hDiv.innerHTML = `<p class="text-sm text-slate-500 mt-1">未啟用</p>`;

    // 狀態警示
    const negYears = h.logs.filter(l => l.netAsset < 0).length;
    const sb = document.getElementById('status-bar');
    if(negYears>0) { sb.classList.remove('hidden'); document.getElementById('warn-scen').innerText = currentScenario; } 
    else sb.classList.add('hidden');

    // 表格渲染
    const tbody = document.getElementById('event-log-body'); tbody.innerHTML = '';
    h.logs.forEach(l => tbody.insertAdjacentHTML('beforeend', `<tr class="hover:bg-slate-800 transition border-b border-slate-800"><td class="px-4 py-2 text-slate-500">Y${l.y}</td><td class="px-4 py-2 font-bold text-slate-200">${l.rank}</td><td class="px-4 py-2 text-right text-slate-300">${formatMoney(l.income)}</td><td class="px-4 py-2 text-right text-orange-400">${formatMoney(l.mortgage)}</td><td class="px-4 py-2 text-right text-slate-500">${formatMoney(l.expense)}</td><td class="px-4 py-2 text-right text-green-400">${formatMoney(l.invest)}</td><td class="px-4 py-2 text-right font-bold ${l.cashflow<0?'text-red-500':'text-blue-400'}">${formatMoney(l.cashflow)}</td><td class="px-4 py-2 text-right font-bold text-white">${formatMoney(l.netAsset)}</td></tr>`));

    renderCharts(res, compareRes);
}

function renderCharts(res, compRes) {
    Chart.defaults.font.family = '"JetBrains Mono", "Noto Sans TC", sans-serif';
    Chart.defaults.color = '#94a3b8';
    const h = res.history; const ch = compRes.history;

    // 1. Asset Compare Chart (Line)
    if (charts.compare) charts.compare.destroy();
    const ctx1 = document.getElementById('assetCompareChart').getContext('2d');
    charts.compare = new Chart(ctx1, { type: 'line', data: { labels: h.labels, datasets: [{ label: `方案 ${currentScenario}`, data: h.netAsset, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 }, { label: `方案 ${currentScenario==='A'?'B':'A'}`, data: ch.netAsset, borderColor: '#64748b', borderWidth: 2, borderDash: [5,5], fill: false, tension: 0.3, pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#334155' } }, y: { grid: { color: '#334155' } } } } });

    // 2. Cashflow DNA (Stacked Bar)
    if (charts.cashflow) charts.cashflow.destroy();
    const ctxCF = document.getElementById('cashflowChart').getContext('2d');
    charts.cashflow = new Chart(ctxCF, { type: 'bar', data: { labels: h.labels, datasets: [ { label: '房貸', data: h.cashflow.mortgage, backgroundColor: '#f97316' }, { label: '生活', data: h.cashflow.expense, backgroundColor: '#64748b' }, { label: '投資', data: h.cashflow.invest, backgroundColor: '#22c55e' }, { label: '結餘', data: h.cashflow.surplus, backgroundColor: '#3b82f6' } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: '#334155' } } }, plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } } } });

    // 3. Wealth Composition (Stacked Area / Line)
    if (charts.wealth) charts.wealth.destroy();
    const ctxW = document.getElementById('wealthChart').getContext('2d');
    // 計算流動資產 = 淨資產 - 房產市值 + 房貸 (反推)
    const liquidData = h.netAsset.map((net, i) => net - h.house[i] + h.loan[i]);
    charts.wealth = new Chart(ctxW, { type: 'line', data: { labels: h.labels, datasets: [ { label: '房貸餘額', data: h.loan, type: 'line', borderColor: '#ef4444', borderWidth: 2, borderDash: [5,5], fill: false, order: 0 }, { label: '流動資產', data: liquidData, backgroundColor: 'rgba(59, 130, 246, 0.5)', fill: true, borderWidth: 0, order: 2 }, { label: '房產市值', data: h.house, backgroundColor: 'rgba(249, 115, 22, 0.5)', fill: true, borderWidth: 0, order: 1 } ] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { stacked: true, grid: { color: '#334155' } } }, plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } } } });

    // 4. Inflation Chart
    if (charts.inflation) charts.inflation.destroy();
    const ctx2 = document.getElementById('inflationChart').getContext('2d');
    charts.inflation = new Chart(ctx2, { type: 'line', data: { labels: h.labels, datasets: [{ label: '名目', data: h.netAsset, borderColor: '#cbd5e1', borderWidth: 2, pointRadius: 0 }, { label: '實質', data: h.realAsset, borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 2, fill: true, pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { color: '#334155' } }, y: { grid: { color: '#334155' } } } } });
}

// 報表生成與匯出
function generateReport() {
    const res = currentResult; 
    if(!res) return;
    const h = res.history;
    const last = h.netAsset.length - 1;
    const netAsset = h.netAsset[last];
    const monthlySaveRate = Math.round((res.firstYearInv / res.firstYearNet) * 100);
    
    let analysis = `
        <div class="border-b border-slate-700 pb-2 mb-4"><h4 class="font-bold text-gold text-lg">戰略評估報告 (Assessment)</h4><p class="text-2xl font-black mt-2 ${netAsset > 0 ? 'text-green-400' : 'text-red-500'}">${netAsset > 0 ? 'STATUS: HEALTHY (財務健康)' : 'STATUS: CRITICAL (財務赤字)'}</p></div>
        <div class="space-y-4">
            <div class="bg-slate-800 p-3 rounded-sm border-l-2 border-blue-500"><span class="font-bold text-slate-300 block mb-1">儲蓄率分析</span>目前首年儲蓄率約 <span class="font-bold text-blue-400 text-lg">${monthlySaveRate}%</span>。${monthlySaveRate < 20 ? '建議提升至 30% 以上。' : '儲蓄習慣良好。'}</div>
            <div class="bg-slate-800 p-3 rounded-sm border-l-2 border-gold"><span class="font-bold text-slate-300 block mb-1">資產預測</span>預計 ${res.params.years} 年後，名目淨資產達 <span class="font-bold text-gold text-lg">${formatMoney(netAsset)}</span>。</div>
            ${res.params.buyHouse ? `<div class="bg-slate-800 p-3 rounded-sm border-l-2 border-orange-500"><span class="font-bold text-slate-300 block mb-1">購屋評估</span>房價設定 ${res.params.housePrice/10000} 萬。${h.logs[10] && h.logs[10].cashflow < 0 ? '<span class="text-red-400 font-bold">警告：現金流可能轉負。</span>' : '現金流尚可。'}</div>` : ''}
        </div>`;
    document.getElementById('reportContent').innerHTML = analysis;
    document.getElementById('reportModal').classList.remove('hidden');
}
function closeReport() { document.getElementById('reportModal').classList.add('hidden'); }

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
