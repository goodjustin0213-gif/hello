<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>空軍官校財務決策系統 | v8.1 邏輯修正版</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { background-color: #0f172a; color: #e2e8f0; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
        .scroller { overflow-y: auto; scrollbar-width: thin; scrollbar-color: #475569 #0f172a; }
        .scroller::-webkit-scrollbar { width: 6px; }
        .scroller::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 3px; }
        
        input, select { background-color: #1e293b; border: 1px solid #475569; color: white; padding: 4px 8px; border-radius: 4px; width: 100%; font-size: 13px; }
        input:focus, select:focus { border-color: #fbbf24; outline: none; }
        
        /* 強化滑桿樣式 */
        input[type=range] { -webkit-appearance: none; height: 6px; background: #334155; border-radius: 3px; border:none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #fbbf24; border-radius: 50%; cursor: pointer; border: 2px solid #fff; }

        .btn { padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 12px; text-align: center; }
        .btn-primary { background-color: #2563eb; color: white; }
        .btn-primary:hover { background-color: #1d4ed8; }
        .btn-outline { border: 1px solid #475569; color: #94a3b8; }
        .btn-outline:hover { border-color: #cbd5e1; color: white; background: #334155; }
        
        .panel { background: rgba(30, 41, 59, 0.6); border: 1px solid #334155; border-radius: 8px; padding: 12px; backdrop-filter: blur(4px); }
    </style>
</head>
<body class="flex flex-col h-screen">

    <header class="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 shrink-0 shadow-lg z-20">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-600 flex items-center justify-center rounded text-white font-black text-sm shadow-lg shadow-blue-500/50">AF</div>
            <div>
                <h1 class="font-bold text-base tracking-wider text-white">空軍財務戰情室 v8.1</h1>
                <p class="text-[10px] text-gray-400">邏輯修正：投資複利分離運算</p>
            </div>
        </div>
        <div class="flex gap-2">
            <button onclick="window.print()" class="btn btn-outline">🖨️ 列印報表</button>
        </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
        <aside class="w-[340px] bg-slate-900 border-r border-slate-700 flex flex-col z-10 shrink-0 shadow-xl">
            <div class="p-4 border-b border-slate-700 grid grid-cols-2 gap-2 bg-slate-800/50">
                <button onclick="app.switchScenario('A')" id="btn-A" class="btn btn-primary shadow-lg">方案 A</button>
                <button onclick="app.switchScenario('B')" id="btn-B" class="btn btn-outline">方案 B</button>
            </div>
            
            <div class="flex-1 scroller p-4 space-y-6">
                <section>
                    <h3 class="text-amber-400 font-bold text-xs mb-3 border-l-4 border-amber-500 pl-2 uppercase">01. 階級參數</h3>
                    <div class="grid grid-cols-2 gap-3 mb-3">
                        <div><label class="text-[10px] text-gray-400 block mb-1">目標階級</label><select id="targetRank"><option value="S2">少尉</option><option value="S3">中尉</option><option value="S4">上尉</option><option value="M1">少校</option><option value="M2">中校</option><option value="M3">上校</option><option value="G1">少將</option></select></div>
                        <div><label class="text-[10px] text-gray-400 block mb-1">服役年數</label><input type="number" id="serviceYears" value="20"></div>
                    </div>
                    <button onclick="app.addAirForcePay()" class="btn btn-outline w-full text-blue-300 border-blue-900 hover:bg-blue-900/30">✈️ 帶入空勤加給</button>
                    <div id="allowance-list" class="mt-2 space-y-1"></div>
                </section>

                <section>
                    <h3 class="text-emerald-400 font-bold text-xs mb-3 border-l-4 border-emerald-500 pl-2 uppercase">02. 投資策略 (關鍵)</h3>
                    
                    <div class="p-4 bg-slate-800 rounded-lg border border-slate-600 shadow-inner mb-3">
                        <label class="text-xs font-bold text-white flex justify-between mb-2">
                            <span>薪資提撥比例</span>
                            <span id="slider-val" class="text-emerald-400 text-lg">30%</span>
                        </label>
                        <input type="range" id="investSlider" min="0" max="90" value="30" class="w-full cursor-pointer" oninput="document.getElementById('slider-val').innerText = this.value + '%'; app.calc()">
                        <p class="text-[10px] text-gray-500 mt-2 text-center">注意：只有此比例資金會進入複利滾存</p>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-3">
                        <div><label class="text-[10px] text-gray-400 block mb-1">年化報酬率 (%)</label><input type="number" id="returnRate" value="6.0" class="text-center font-bold text-emerald-400 border-emerald-900/50"></div>
                        <div><label class="text-[10px] text-gray-400 block mb-1">通膨率 (%)</label><input type="number" id="inflationRate" value="2.0" class="text-center text-red-400 border-red-900/50"></div>
                    </div>

                    <div id="invest-list" class="space-y-1"></div>
                    <button onclick="app.addItem('invest-list')" class="btn btn-outline w-full mt-2 text-[10px]">+ 新增固定投資</button>
                </section>

                <section>
                    <h3 class="text-blue-400 font-bold text-xs mb-3 border-l-4 border-blue-500 pl-2 uppercase">03. 支出與房產</h3>
                    <div id="expense-list" class="space-y-1 mb-2"></div>
                    <button onclick="app.addItem('expense-list')" class="btn btn-outline w-full text-[10px] mb-4">+ 新增支出</button>
                    
                    <div class="flex items-center gap-2 mb-2 p-2 bg-slate-800 rounded">
                        <input type="checkbox" id="buyHouseToggle" class="w-4 h-4 rounded" onchange="app.calc()">
                        <span class="text-xs font-bold">啟用購屋模擬</span>
                    </div>
                    <div id="housing-inputs" class="grid grid-cols-2 gap-2 hidden p-2 bg-slate-800/50 rounded">
                        <div><label class="text-[10px] text-gray-400">購屋年</label><input type="number" id="buyYear" value="10"></div>
                        <div><label class="text-[10px] text-gray-400">總價(萬)</label><input type="number" id="housePriceWan" value="1500"></div>
                        <div><label class="text-[10px] text-gray-400">頭期(%)</label><input type="number" id="downPaymentPct" value="20"></div>
                        <div><label class="text-[10px] text-gray-400">利率(%)</label><input type="number" id="mortgageRate" value="2.2"></div>
                        <div><label class="text-[10px] text-gray-400">年限</label><input type="number" id="loanTerm" value="30"></div>
                        <div><label class="text-[10px] text-gray-400">增值(%)</label><input type="number" id="houseAppreciation" value="1.5"></div>
                    </div>
                </section>
                <div class="h-10"></div>
            </div>
        </aside>

        <main class="flex-1 scroller p-6 bg-slate-950 relative">
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="panel border-t-4 border-emerald-500 bg-gradient-to-b from-slate-800 to-slate-900">
                    <p class="text-xs text-gray-400 uppercase tracking-widest">預估淨資產 (Net Worth)</p>
                    <p id="kpi-asset" class="text-3xl font-black text-white mt-1 drop-shadow-md">--</p>
                    <p id="kpi-diff" class="text-xs mt-2 text-gray-500">--</p>
                </div>
                <div class="panel border-t-4 border-blue-500 bg-gradient-to-b from-slate-800 to-slate-900">
                    <p class="text-xs text-gray-400 uppercase tracking-widest">投資 vs 現金佔比</p>
                    <div class="flex items-end gap-2 mt-1">
                        <span id="kpi-invest-ratio" class="text-2xl font-bold text-blue-400">--</span>
                        <span class="text-xs text-gray-500 mb-1">投資部位</span>
                    </div>
                </div>
                <div class="panel border-t-4 border-orange-500 bg-gradient-to-b from-slate-800 to-slate-900">
                    <p class="text-xs text-gray-400 uppercase tracking-widest">房產狀態</p>
                    <div id="kpi-house" class="text-sm font-bold text-gray-300 mt-2">未啟用</div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6 h-80">
                <div class="panel flex flex-col shadow-lg">
                    <h4 class="text-xs font-bold text-gray-300 mb-2 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-500"></span> 資產累積對照 (A vs B)</h4>
                    <div class="flex-1 relative"><canvas id="chart-asset"></canvas></div>
                </div>
                <div class="panel flex flex-col shadow-lg">
                    <h4 class="text-xs font-bold text-gray-300 mb-2 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500"></span> 資產結構 (投資 vs 現金)</h4>
                    <div class="flex-1 relative"><canvas id="chart-structure"></canvas></div>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6 h-80">
                <div class="panel flex flex-col shadow-lg">
                    <h4 class="text-xs font-bold text-gray-300 mb-2 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-orange-500"></span> 現金流分配 (Cashflow)</h4>
                    <div class="flex-1 relative"><canvas id="chart-flow"></canvas></div>
                </div>
                <div class="panel flex flex-col shadow-lg">
                    <h4 class="text-xs font-bold text-gray-300 mb-2 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-yellow-500"></span> 通膨實質購買力</h4>
                    <div class="flex-1 relative"><canvas id="chart-inflation"></canvas></div>
                </div>
            </div>

            <div class="panel overflow-hidden border border-slate-700 shadow-xl">
                <div class="overflow-x-auto max-h-96">
                    <table class="w-full text-xs text-left text-gray-300">
                        <thead class="bg-slate-800 text-gray-400 sticky top-0 font-bold uppercase tracking-wider">
                            <tr>
                                <th class="p-3">年度</th>
                                <th class="p-3">階級</th>
                                <th class="p-3 text-right">年收入</th>
                                <th class="p-3 text-right text-red-300">總支出</th>
                                <th class="p-3 text-right text-green-300">投入投資</th>
                                <th class="p-3 text-right text-blue-300">投資滾存</th>
                                <th class="p-3 text-right text-gray-400">現金結餘</th>
                                <th class="p-3 text-right text-white font-bold">總淨資產</th>
                            </tr>
                        </thead>
                        <tbody id="table-body" class="divide-y divide-slate-700/50 font-mono"></tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

<script>
const APP = {
    data: { A: {}, B: {} },
    current: 'A',
    charts: {},
    ranks: ['S2','S3','S4','M1','M2','M3','G1'],
    salary: {
        'S2': {base:22750, add:28000, max:12}, 'S3': {base:25050, add:30000, max:12},
        'S4': {base:28880, add:35000, max:17}, 'M1': {base:32710, add:45000, max:22},
        'M2': {base:37310, add:55000, max:26}, 'M3': {base:41900, add:65000, max:30},
        'G1': {base:48030, add:70000, max:35}
    },

    // 強制數值轉換，避免 NaN
    N: (v) => {
        if(!v) return 0;
        const n = parseFloat(String(v).replace(/,/g, ''));
        return isNaN(n) ? 0 : n;
    },
    F: (n) => Math.round(n).toLocaleString(),

    init: () => {
        const def = {
            targetRank: 'M2', serviceYears: 20, inflationRate: 2, salaryRaiseRate: 1, returnRate: 6,
            buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
            investSliderPct: 30,
            allowances: [], expenses: [{name:'基本開銷', val:12000}], investments: [{name:'儲蓄險', val:3000}]
        };
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        APP.data.B.returnRate = 4;
        APP.data.B.investSliderPct = 50; // 預設 B 方案存比較多，顯示差異
        
        document.body.addEventListener('input', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') APP.calc();
        });
        APP.renderInputs('A');
        APP.calc();
    },

    switchScenario: (s) => {
        APP.saveInputs();
        APP.current = s;
        document.getElementById('btn-A').className = s==='A' ? 'btn btn-primary shadow-lg' : 'btn btn-outline';
        document.getElementById('btn-B').className = s==='B' ? 'btn btn-primary shadow-lg' : 'btn btn-outline';
        APP.renderInputs(s);
        APP.calc();
    },

    saveInputs: () => {
        const d = APP.data[APP.current];
        const ids = ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation','investSlider'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(!el) return;
            const key = id === 'investSlider' ? 'investSliderPct' : id;
            d[key] = id === 'targetRank' ? el.value : APP.N(el.value);
        });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        d.allowances = APP.readList('allowance-list');
        d.expenses = APP.readList('expense-list');
        d.investments = APP.readList('invest-list');
    },

    renderInputs: (s) => {
        const d = APP.data[s];
        const ids = ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation'];
        ids.forEach(k => document.getElementById(k).value = d[k]);
        
        document.getElementById('investSlider').value = d.investSliderPct;
        document.getElementById('slider-val').innerText = d.investSliderPct + '%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        document.getElementById('housing-inputs').className = d.buyHouseToggle ? "grid grid-cols-2 gap-2 mt-2" : "hidden";
    },

    renderList: (id, list) => {
        const c = document.getElementById(id);
        c.innerHTML = '';
        list.forEach(item => {
            let extra = id === 'allowance-list' ? 
                `<input type="number" class="w-12 text-center bg-slate-900 border border-slate-600" value="${item.start||1}">-<input type="number" class="w-12 text-center bg-slate-900 border border-slate-600" value="${item.end||20}">` : '';
            c.innerHTML += `
            <div class="flex gap-1 items-center mb-1">
                <input type="text" value="${item.name}" class="w-full text-xs bg-slate-800 border-none">
                <input type="number" value="${item.val}" class="w-20 text-right bg-slate-800 border-none font-mono">
                ${extra}
                <button onclick="this.parentElement.remove(); app.calc()" class="text-red-400 hover:text-red-200 px-1">✕</button>
            </div>`;
        });
    },
    readList: (id) => {
        const arr = [];
        document.getElementById(id).querySelectorAll('div.flex').forEach(row => {
            const inputs = row.querySelectorAll('input');
            const name = inputs[0].value;
            const val = APP.N(inputs[1].value);
            if(id === 'allowance-list') {
                arr.push({name, val, start: APP.N(inputs[2].value), end: APP.N(inputs[3].value)});
            } else {
                arr.push({name, val});
            }
        });
        return arr;
    },
    addItem: (id) => {
        const list = id === 'allowance-list' ? APP.data[APP.current].allowances : (id==='expense-list'?APP.data[APP.current].expenses:APP.data[APP.current].investments);
        list.push({name:'新項目', val:0, start:1, end:20});
        APP.renderList(id, list);
        APP.calc();
    },
    addAirForcePay: () => {
        const d = APP.data[APP.current];
        d.allowances = [
            {name: '空勤加給(初)', val: 22000, start: 1, end: 5},
            {name: '空勤加給(中)', val: 45000, start: 6, end: 15},
            {name: '空勤加給(高)', val: 68000, start: 16, end: 25}
        ];
        APP.renderList('allowance-list', d.allowances);
        APP.calc();
    },

    // --- 核心運算：修正分離池邏輯 ---
    runSim: (d) => {
        const N = APP.N;
        const years = N(d.serviceYears) || 20;
        const inflation = N(d.inflationRate) / 100;
        const raise = N(d.salaryRaiseRate) / 100; // 調薪率 (這裡我假設每年1%政府調薪)
        const roi = N(d.returnRate) / 100;
        const sliderPct = N(d.investSliderPct) / 100;
        
        let rank = 'S2', rankY = 0;
        const targetIdx = APP.ranks.indexOf(d.targetRank);
        
        // 兩個獨立資產池
        let investPool = 0; // 投資池 (會滾利息)
        let cashPool = 0;   // 現金池 (不滾利息，或低利)
        
        let house = 0, loan = 0, mPay = 0, hasHouse = false;
        
        const res = { years:[], netAsset:[], realAsset:[], house:[], loan:[], investPool:[], cashPool:[], income:[], exp:[], inv:[], mortgage:[], flow:[], logs:[] };
        
        const baseExp = d.expenses.reduce((s, x) => s + N(x.val), 0);
        const baseFixedInv = d.investments.reduce((s, x) => s + N(x.val), 0);

        for(let y=1; y<=years; y++) {
            // 晉升
            const rInfo = APP.salary[rank];
            const rIdx = APP.ranks.indexOf(rank);
            if(y > 1 && y % 4 === 0 && rIdx < targetIdx && rankY < rInfo.max) {
                rank = APP.ranks[rIdx+1];
                rankY = 0;
            } else rankY++;

            // 薪資 = (本俸+專加) * 年資複利 * 調薪複利
            const payBase = (APP.salary[rank].base + APP.salary[rank].add) * Math.pow(1.015, rankY) * Math.pow(1+raise, y-1);
            let allow = 0;
            d.allowances.forEach(a => { if(y >= N(a.start) && y <= N(a.end)) allow += N(a.val); });
            const gross = payBase + 15000 + allow; 
            const netMonthly = gross * 0.95; 

            // 購屋
            let yMortgage = 0;
            if(d.buyHouseToggle && y === N(d.buyYear) && !hasHouse) {
                hasHouse = true;
                house = N(d.housePriceWan) * 10000;
                const down = house * (N(d.downPaymentPct)/100);
                loan = house - down;
                // 頭期款優先從現金池扣，不夠再從投資池扣
                if(cashPool >= down) {
                    cashPool -= down;
                } else {
                    const remain = down - cashPool;
                    cashPool = 0;
                    investPool -= remain;
                }
                const r = N(d.mortgageRate)/100/12;
                const n = N(d.loanTerm)*12;
                mPay = loan * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
            }
            if(hasHouse) {
                house *= (1 + N(d.houseAppreciation)/100);
                if(loan > 0) {
                    yMortgage = mPay * 12;
                    loan -= (yMortgage - loan*(N(d.mortgageRate)/100));
                    if(loan < 0) loan = 0;
                }
            }

            // 金流計算
            const yIncome = netMonthly * 13.5;
            const yExp = baseExp * Math.pow(1+inflation, y-1) * 12;
            
            // 投資投入 = (月薪 * %) + 固定投資額
            const yInvestInput = (netMonthly * sliderPct + baseFixedInv) * 12;
            
            // 現金結餘 = 收入 - 支出 - 拿去投資的錢 - 房貸
            const cashSurplus = yIncome - yExp - yInvestInput - yMortgage;

            // *** 關鍵修正：分池滾存 ***
            // 1. 投資池：舊錢滾利息 + 新投入資金
            investPool = investPool * (1 + roi) + yInvestInput;
            
            // 2. 現金池：舊錢不動 (假設0利率) + 新結餘
            cashPool = cashPool + cashSurplus;

            // 總資產
            const netAsset = investPool + cashPool + house - loan;

            res.years.push('Y'+y);
            res.netAsset.push(netAsset);
            res.realAsset.push(netAsset / Math.pow(1+inflation, y));
            res.investPool.push(investPool);
            res.cashPool.push(cashPool);
            res.house.push(house);
            res.loan.push(loan);
            res.income.push(yIncome);
            res.exp.push(yExp);
            res.inv.push(yInvestInput);
            res.mortgage.push(yMortgage);
            res.flow.push(cashSurplus);
            res.logs.push({y, rank, income:yIncome, exp:yExp, inv:yInvestInput, invPool:investPool, mortgage:yMortgage, flow:cashSurplus, net:netAsset});
        }
        
        // 終身俸
        res.pension = Math.round(APP.salary[rank].base * 2 * (0.55 + Math.max(0, years-20)*0.02)); 
        return res;
    },

    calc: () => {
        APP.saveInputs();
        const resA = APP.runSim(APP.data.A);
        const resB = APP.runSim(APP.data.B);
        APP.updateUI(APP.current === 'A' ? resA : resB, APP.current === 'A' ? resB : resA);
    },

    updateUI: (res, comp) => {
        const last = res.netAsset.length - 1;
        document.getElementById('kpi-asset').innerText = APP.F(res.netAsset[last]);
        const diff = res.netAsset[last] - comp.netAsset[last];
        document.getElementById('kpi-diff').innerHTML = `與對照組差異: <span class="${diff>=0?'text-green-400':'text-red-400'} font-bold">${diff>0?'+':''}${APP.F(diff)}</span>`;
        document.getElementById('kpi-pension').innerText = APP.F(res.pension);
        
        // 投資佔比 KPI
        const totalLiquid = res.investPool[last] + res.cashPool[last];
        const ratio = totalLiquid > 0 ? Math.round((res.investPool[last] / totalLiquid)*100) : 0;
        document.getElementById('kpi-invest-ratio').innerText = ratio + '%';

        const hDiv = document.getElementById('kpi-house');
        if(APP.data[APP.current].buyHouseToggle) {
            hDiv.innerHTML = `市值: <span class="text-orange-400">${APP.F(res.house[last])}</span> / 貸: <span class="text-red-400">${APP.F(res.loan[last])}</span>`;
        } else {
            hDiv.innerText = "未啟用";
        }

        const tb = document.getElementById('table-body');
        tb.innerHTML = '';
        res.logs.forEach(l => {
            tb.innerHTML += `<tr class="border-b border-slate-800 hover:bg-slate-800/50 transition">
                <td class="p-2 text-gray-500">Y${l.y}</td>
                <td class="p-2 font-bold text-slate-300">${l.rank}</td>
                <td class="p-2 text-right text-slate-300">${APP.F(l.income)}</td>
                <td class="p-2 text-right text-red-300/70">${APP.F(l.exp)}</td>
                <td class="p-2 text-right text-emerald-400">${APP.F(l.inv)}</td>
                <td class="p-2 text-right text-blue-300">${APP.F(l.invPool)}</td>
                <td class="p-2 text-right ${l.flow<0?'text-red-500 font-bold':'text-gray-400'}">${APP.F(l.flow)}</td>
                <td class="p-2 text-right font-bold text-white">${APP.F(l.net)}</td>
            </tr>`;
        });

        APP.drawCharts(res, comp);
    },

    drawCharts: (res, comp) => {
        const ctxs = ['chart-asset', 'chart-flow', 'chart-wealth', 'chart-inflation'];
        ctxs.forEach(id => {
            if(APP.charts[id]) APP.charts[id].destroy();
            const canvas = document.getElementById(id);
            if(!canvas) return;
            
            let config = {};
            const labels = res.years;
            
            if(id === 'chart-asset') {
                config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: '目前方案', data: res.netAsset, borderColor: '#3b82f6', borderWidth: 3, tension: 0.3 },
                            { label: '對照方案', data: comp.netAsset, borderColor: '#64748b', borderWidth: 2, borderDash: [5,5], tension: 0.3 }
                        ]
                    }
                };
            } else if(id === 'chart-flow') {
                config = {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: '房貸', data: res.mortgage, backgroundColor: '#f97316' },
                            { label: '支出', data: res.exp, backgroundColor: '#ef4444' },
                            { label: '投入投資', data: res.inv, backgroundColor: '#10b981' },
                            { label: '現金結餘', data: res.flow, backgroundColor: '#3b82f6' }
                        ]
                    },
                    options: { scales: { x: { stacked: true }, y: { stacked: true } } }
                };
            } else if(id === 'chart-wealth') {
                config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: '投資滾存 (複利)', data: res.investPool, backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', fill: true, tension: 0.4 },
                            { label: '現金積累 (無息)', data: res.cashPool, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6', fill: true, tension: 0.4 },
                            { label: '房產淨值', data: res.house.map((h,i)=>h-res.loan[i]), backgroundColor: 'rgba(249, 115, 22, 0.2)', borderColor: '#f97316', fill: true }
                        ]
                    },
                    options: { scales: { y: { stacked: true } } }
                };
            } else {
                config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: '名目資產', data: res.netAsset, borderColor: '#94a3b8', borderWidth: 2 },
                            { label: '實質購買力', data: res.realAsset, borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', fill: true, borderWidth: 3 }
                        ]
                    }
                };
            }
            
            // 通用設定
            if(!config.options) config.options = {};
            config.options.responsive = true;
            config.options.maintainAspectRatio = false;
            config.options.plugins = { legend: { labels: { color: '#94a3b8', boxWidth: 10, font: {size: 10} } } };
            config.options.scales = config.options.scales || {};
            config.options.scales.x = { ...config.options.scales.x, grid: { color: '#1e293b' }, ticks: { color: '#64748b' } };
            config.options.scales.y = { ...config.options.scales.y, grid: { color: '#1e293b' }, ticks: { color: '#64748b' } };

            APP.charts[id] = new Chart(canvas, config);
        });
    }
};

window.onload = APP.init;
window.app = APP;
</script>
</body>
</html>
