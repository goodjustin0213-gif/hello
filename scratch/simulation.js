<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>空軍官校職涯財務決策支援系統 | v8.0 絕對修復版</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { background-color: #0f172a; color: #e2e8f0; font-family: sans-serif; overflow: hidden; }
        /* 捲軸設定 */
        .scroller { overflow-y: auto; scrollbar-width: thin; scrollbar-color: #475569 #0f172a; }
        .scroller::-webkit-scrollbar { width: 6px; }
        .scroller::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 3px; }
        /* 輸入框設定 */
        input, select { background-color: #1e293b; border: 1px solid #475569; color: white; padding: 4px; border-radius: 4px; width: 100%; }
        input:focus, select:focus { border-color: #f59e0b; outline: none; }
        /* 按鈕設定 */
        .btn { padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 12px; }
        .btn-primary { background-color: #3b82f6; color: white; }
        .btn-primary:hover { background-color: #2563eb; }
        .btn-outline { border: 1px solid #475569; color: #94a3b8; }
        .btn-outline:hover { border-color: #cbd5e1; color: white; }
        /* 布局 */
        .panel { background: rgba(30, 41, 59, 0.5); border: 1px solid #334155; border-radius: 8px; padding: 12px; }
    </style>
</head>
<body class="flex flex-col h-screen">

    <header class="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 shrink-0">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-900 flex items-center justify-center rounded text-white font-bold">AF</div>
            <h1 class="font-bold text-lg tracking-wider">空軍官校財務決策系統 v8.0</h1>
        </div>
        <div class="flex gap-2">
            <button onclick="window.print()" class="btn btn-outline">列印報告</button>
        </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
        <aside class="w-[360px] bg-slate-900 border-r border-slate-700 flex flex-col z-10 shrink-0">
            <div class="p-4 border-b border-slate-700 grid grid-cols-2 gap-2">
                <button onclick="app.switchScenario('A')" id="btn-A" class="btn btn-primary">方案 A</button>
                <button onclick="app.switchScenario('B')" id="btn-B" class="btn btn-outline">方案 B</button>
            </div>
            
            <div class="flex-1 scroller p-4 space-y-6">
                <section>
                    <h3 class="text-yellow-500 font-bold text-xs mb-2 border-l-4 border-yellow-500 pl-2">01. 階級與年資</h3>
                    <div class="grid grid-cols-2 gap-2 mb-2">
                        <div><label class="text-xs text-gray-400">目標階級</label><select id="targetRank"><option value="S2">少尉</option><option value="S3">中尉</option><option value="S4">上尉</option><option value="M1">少校</option><option value="M2">中校</option><option value="M3">上校</option><option value="G1">少將</option></select></div>
                        <div><label class="text-xs text-gray-400">服役年數</label><input type="number" id="serviceYears" value="20"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div><label class="text-xs text-gray-400">通膨率(%)</label><input type="number" id="inflationRate" value="2.0"></div>
                        <div><label class="text-xs text-gray-400">調薪率(%)</label><input type="number" id="salaryRaiseRate" value="1.0"></div>
                    </div>
                    <button onclick="app.addAirForcePay()" class="btn btn-outline w-full mt-2 text-blue-300 border-blue-800">✈️ 帶入空勤加給</button>
                    <div id="allowance-list" class="mt-2 space-y-1"></div>
                </section>

                <section>
                    <h3 class="text-blue-400 font-bold text-xs mb-2 border-l-4 border-blue-500 pl-2">02. 支出與投資</h3>
                    <div id="expense-list" class="space-y-1 mb-2"></div>
                    <button onclick="app.addItem('expense-list')" class="btn btn-outline w-full text-xs">+ 新增支出</button>
                    
                    <div class="mt-4 p-3 bg-slate-800 rounded border border-slate-600">
                        <label class="text-xs text-green-400 font-bold flex justify-between">薪資提撥比例 <span id="slider-val" class="text-white">30%</span></label>
                        <input type="range" id="investSlider" min="0" max="90" value="30" class="w-full mt-1" oninput="document.getElementById('slider-val').innerText = this.value + '%'; app.calc()">
                    </div>
                    <div id="invest-list" class="space-y-1 mt-2"></div>
                    <button onclick="app.addItem('invest-list')" class="btn btn-outline w-full text-xs">+ 固定投資</button>
                    
                    <div class="mt-2">
                        <label class="text-xs text-gray-400">年化報酬率 (%)</label>
                        <input type="number" id="returnRate" value="6.0" class="text-center font-bold text-blue-400">
                    </div>
                </section>

                <section>
                    <h3 class="text-orange-400 font-bold text-xs mb-2 border-l-4 border-orange-500 pl-2">03. 購屋設定</h3>
                    <div class="flex items-center gap-2 mb-2">
                        <input type="checkbox" id="buyHouseToggle" class="w-4 h-4" onchange="app.calc()">
                        <span class="text-xs">啟用購屋模擬</span>
                    </div>
                    <div id="housing-inputs" class="grid grid-cols-2 gap-2 hidden">
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

        <main class="flex-1 scroller p-6 bg-slate-950">
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="panel border-t-4 border-yellow-500">
                    <p class="text-xs text-gray-400">預估淨資產 (名目)</p>
                    <p id="kpi-asset" class="text-2xl font-bold text-white mt-1">--</p>
                </div>
                <div class="panel border-t-4 border-green-500">
                    <p class="text-xs text-gray-400">終身俸 (月退)</p>
                    <p id="kpi-pension" class="text-2xl font-bold text-green-400 mt-1">--</p>
                </div>
                <div class="panel border-t-4 border-orange-500">
                    <p class="text-xs text-gray-400">房產市值 / 剩貸</p>
                    <div id="kpi-house" class="text-sm font-bold text-gray-300 mt-1">未啟用</div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6 h-80">
                <div class="panel flex flex-col">
                    <h4 class="text-xs font-bold text-gray-300 mb-2">資產累積 (A vs B)</h4>
                    <div class="flex-1 relative"><canvas id="chart-asset"></canvas></div>
                </div>
                <div class="panel flex flex-col">
                    <h4 class="text-xs font-bold text-gray-300 mb-2">現金流結構 (Cashflow)</h4>
                    <div class="flex-1 relative"><canvas id="chart-flow"></canvas></div>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6 h-80">
                <div class="panel flex flex-col">
                    <h4 class="text-xs font-bold text-gray-300 mb-2">資產負債結構</h4>
                    <div class="flex-1 relative"><canvas id="chart-wealth"></canvas></div>
                </div>
                <div class="panel flex flex-col">
                    <h4 class="text-xs font-bold text-gray-300 mb-2">通膨實質購買力</h4>
                    <div class="flex-1 relative"><canvas id="chart-inflation"></canvas></div>
                </div>
            </div>

            <div class="panel overflow-hidden">
                <div class="overflow-x-auto max-h-96">
                    <table class="w-full text-xs text-left text-gray-300">
                        <thead class="bg-slate-800 text-gray-400 sticky top-0">
                            <tr><th class="p-2">年度</th><th class="p-2">階級</th><th class="p-2 text-right">年收</th><th class="p-2 text-right">總支</th><th class="p-2 text-right">總投</th><th class="p-2 text-right">房貸</th><th class="p-2 text-right">結餘</th><th class="p-2 text-right">淨資產</th></tr>
                        </thead>
                        <tbody id="table-body" class="divide-y divide-slate-700"></tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

<script>
// --- 核心邏輯 ---
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

    // 強力數值轉換：把任何垃圾都轉成數字，失敗就給 0
    N: (v) => {
        if(typeof v === 'string') v = v.replace(/,/g, '');
        const n = parseFloat(v);
        return isNaN(n) ? 0 : n;
    },

    F: (n) => n.toLocaleString('zh-TW', {maximumFractionDigits:0}),

    init: () => {
        // 預設資料
        const def = {
            targetRank: 'M2', serviceYears: 20, inflationRate: 2, salaryRaiseRate: 1, returnRate: 6,
            buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
            investSliderPct: 30,
            allowances: [], expenses: [{name:'基本開銷', val:12000}], investments: [{name:'儲蓄險', val:3000}]
        };
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        APP.data.B.returnRate = 4;
        
        // 綁定事件：只要有輸入框變動就重算
        document.body.addEventListener('input', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') APP.calc();
        });

        // 初始渲染
        APP.renderInputs('A');
        APP.calc();
    },

    switchScenario: (s) => {
        APP.saveInputs();
        APP.current = s;
        document.getElementById('btn-A').className = s==='A' ? 'btn btn-primary' : 'btn btn-outline';
        document.getElementById('btn-B').className = s==='B' ? 'btn btn-primary' : 'btn btn-outline';
        APP.renderInputs(s);
        APP.calc();
    },

    saveInputs: () => {
        const s = APP.current;
        const d = APP.data[s];
        // 讀取所有基礎欄位
        ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate',
         'buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation','investSliderPct']
         .forEach(k => {
             const el = document.getElementById(k === 'investSliderPct' ? 'investSlider' : k);
             if(el) d[k] = (k === 'targetRank') ? el.value : APP.N(el.value);
         });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        
        // 讀取列表
        d.allowances = APP.readList('allowance-list');
        d.expenses = APP.readList('expense-list');
        d.investments = APP.readList('invest-list');
    },

    renderInputs: (s) => {
        const d = APP.data[s];
        ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate',
         'buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation']
         .forEach(k => document.getElementById(k).value = d[k]);
        
        document.getElementById('investSlider').value = d.investSliderPct;
        document.getElementById('slider-val').innerText = d.investSliderPct + '%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        
        // 顯示/隱藏購屋
        document.getElementById('housing-inputs').className = d.buyHouseToggle ? "grid grid-cols-2 gap-2" : "hidden";
    },

    // 列表操作
    renderList: (id, list) => {
        const c = document.getElementById(id);
        c.innerHTML = '';
        list.forEach((item, idx) => {
            let extra = '';
            if(id === 'allowance-list') {
                extra = `<input type="number" class="w-12 text-center" value="${item.start||1}" onchange="app.calc()"> - <input type="number" class="w-12 text-center" value="${item.end||20}" onchange="app.calc()">`;
            }
            c.innerHTML += `
            <div class="flex gap-1 items-center mb-1">
                <input type="text" value="${item.name}" class="w-full text-xs bg-slate-800" onchange="app.calc()">
                <input type="number" value="${item.val}" class="w-20 text-right bg-slate-800" onchange="app.calc()">
                ${extra}
                <button onclick="this.parentElement.remove(); app.calc()" class="text-red-500 text-lg px-1">×</button>
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
        const c = document.getElementById(id);
        const isAllow = id === 'allowance-list';
        const html = `
        <div class="flex gap-1 items-center mb-1">
            <input type="text" value="新項目" class="w-full text-xs bg-slate-800">
            <input type="number" value="0" class="w-20 text-right bg-slate-800">
            ${isAllow ? `<input type="number" value="1" class="w-12 text-center"> - <input type="number" value="20" class="w-12 text-center">` : ''}
            <button onclick="this.parentElement.remove(); app.calc()" class="text-red-500 text-lg px-1">×</button>
        </div>`;
        c.insertAdjacentHTML('beforeend', html);
        APP.calc(); // Add 完馬上存
    },
    addAirForcePay: () => {
        const list = document.getElementById('allowance-list');
        list.innerHTML = ''; // 清空
        // 加入預設
        const presets = [
            {name: '空勤加給(初)', val: 22000, start: 1, end: 5},
            {name: '空勤加給(中)', val: 45000, start: 6, end: 15},
            {name: '空勤加給(高)', val: 68000, start: 16, end: 25}
        ];
        // 寫入畫面
        const d = APP.data[APP.current];
        d.allowances = presets; 
        APP.renderList('allowance-list', presets);
        APP.calc();
    },

    // --- 核心運算 ---
    runSim: (d) => {
        const N = APP.N;
        const years = N(d.serviceYears) || 20;
        const inflation = N(d.inflationRate) / 100;
        const raise = N(d.salaryRaiseRate) / 100;
        const roi = N(d.returnRate) / 100;
        const housePrice = N(d.housePriceWan) * 10000;
        
        let rank = 'S2', rankY = 0;
        const targetIdx = APP.ranks.indexOf(d.targetRank);
        
        let asset = 0, house = 0, loan = 0, mPay = 0;
        let hasHouse = false;
        
        const res = { years:[], netAsset:[], realAsset:[], house:[], loan:[], income:[], exp:[], inv:[], mortgage:[], flow:[], logs:[] };
        
        // 基礎支出與固定投資總和
        const baseExp = d.expenses.reduce((s, x) => s + N(x.val), 0);
        const baseInv = d.investments.reduce((s, x) => s + N(x.val), 0);

        for(let y=1; y<=years; y++) {
            // 晉升邏輯
            const rInfo = APP.salary[rank];
            const rIdx = APP.ranks.indexOf(rank);
            // 時間到且未達目標就升
            if(rankY >= rInfo.max && rIdx < APP.ranks.length-1) { /* 強制退伍或是卡階 */ }
            if(yearOfRank(rank, rankY) && rIdx < targetIdx) {
                rank = APP.ranks[rIdx+1];
                rankY = 0;
            } else {
                rankY++;
            }
            
            function yearOfRank(r, y) { return y >= APP.salary[r].max ? false : (y >= 1 && y%4===0); } // 簡化：每4年升一次，或者到頂

            // 薪資計算
            const currR = APP.salary[rank];
            // 複利調薪：(本俸+專加) * (1.015^年資) * (1+調薪率^年)
            const payBase = (currR.base + currR.add) * Math.pow(1.015, y) * Math.pow(1+raise, y);
            // 加給
            let allow = 0;
            d.allowances.forEach(a => { if(y >= N(a.start) && y <= N(a.end)) allow += N(a.val); });
            
            const gross = payBase + 15000 + allow; // +志願役
            const netMonthly = gross * 0.95; // 扣退撫健保概算
            
            // 購屋
            let yMortgage = 0;
            if(d.buyHouseToggle && y === N(d.buyYear) && !hasHouse) {
                hasHouse = true;
                house = housePrice;
                const down = house * (N(d.downPaymentPct)/100);
                loan = house - down;
                asset -= down;
                // 房貸
                const r = N(d.mortgageRate)/100/12;
                const n = N(d.loanTerm)*12;
                mPay = loan * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
            }
            
            if(hasHouse) {
                house *= (1 + N(d.houseAppreciation)/100);
                if(loan > 0) {
                    yMortgage = mPay * 12;
                    const interest = loan * (N(d.mortgageRate)/100);
                    loan -= (yMortgage - interest);
                    if(loan < 0) loan = 0;
                }
            }

            // 收支
            const yIncome = netMonthly * 13.5;
            const yExp = baseExp * Math.pow(1+inflation, y) * 12;
            // 投資 = (月薪 * %) + 固定投資
            const yInvest = (netMonthly * (N(d.investSliderPct)/100) + baseInv) * 12;
            
            const cashflow = yIncome - yExp - yInvest - yMortgage;
            asset = asset * (1+roi) + yInvest + cashflow;

            // 紀錄
            res.years.push('Y'+y);
            res.netAsset.push(Math.round(asset + house - loan));
            res.realAsset.push(Math.round((asset+house-loan) / Math.pow(1+inflation, y)));
            res.house.push(Math.round(house));
            res.loan.push(Math.round(loan));
            res.income.push(Math.round(yIncome));
            res.exp.push(Math.round(yExp));
            res.inv.push(Math.round(yInvest));
            res.mortgage.push(Math.round(yMortgage));
            res.flow.push(Math.round(cashflow));
            res.logs.push({y, rank, income:yIncome, exp:yExp, inv:yInvest, mortgage:yMortgage, flow:cashflow, net:Math.round(asset+house-loan)});
        }
        
        // 終身俸 (簡單算：本俸*2*替代率)
        const lastRank = APP.salary[rank];
        res.pension = Math.round(lastRank.base * 2 * (0.55 + (years-20)*0.02)); 
        
        return res;
    },

    calc: () => {
        APP.saveInputs();
        const resA = APP.runSim(APP.data.A);
        const resB = APP.runSim(APP.data.B);
        
        APP.updateUI((APP.current === 'A' ? resA : resB), (APP.current === 'A' ? resB : resA));
    },

    updateUI: (res, comp) => {
        const last = res.netAsset.length - 1;
        document.getElementById('kpi-asset').innerText = APP.F(res.netAsset[last]);
        document.getElementById('kpi-pension').innerText = APP.F(res.pension);
        
        const hDiv = document.getElementById('kpi-house');
        const hToggle = APP.data[APP.current].buyHouseToggle;
        if(hToggle) {
            hDiv.innerHTML = `值: <span class="text-orange-400">${APP.F(res.house[last])}</span> / 貸: <span class="text-red-400">${APP.F(res.loan[last])}</span>`;
        } else {
            hDiv.innerText = "未啟用";
        }
        
        document.getElementById('housing-inputs').className = hToggle ? "grid grid-cols-2 gap-2" : "hidden";

        // Table
        const tb = document.getElementById('table-body');
        tb.innerHTML = '';
        res.logs.forEach(l => {
            tb.innerHTML += `<tr class="border-b border-slate-800 hover:bg-slate-800">
                <td class="p-2 text-gray-400">Y${l.y}</td>
                <td class="p-2 font-bold text-white">${l.rank}</td>
                <td class="p-2 text-right">${APP.F(l.income)}</td>
                <td class="p-2 text-right text-gray-400">${APP.F(l.exp)}</td>
                <td class="p-2 text-right text-green-400">${APP.F(l.inv)}</td>
                <td class="p-2 text-right text-orange-400">${APP.F(l.mortgage)}</td>
                <td class="p-2 text-right font-bold ${l.flow<0?'text-red-500':'text-blue-400'}">${APP.F(l.flow)}</td>
                <td class="p-2 text-right font-bold text-white">${APP.F(l.net)}</td>
            </tr>`;
        });

        APP.drawCharts(res, comp);
    },

    drawCharts: (res, comp) => {
        // Destroy old
        if(APP.charts['asset']) APP.charts['asset'].destroy();
        if(APP.charts['flow']) APP.charts['flow'].destroy();
        if(APP.charts['wealth']) APP.charts['wealth'].destroy();
        if(APP.charts['inflation']) APP.charts['inflation'].destroy();

        const commonOpt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 10 } } }, scales: { x: { grid: { color: '#334155' } }, y: { grid: { color: '#334155' } } } };

        // 1. Asset Compare
        APP.charts['asset'] = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: res.years,
                datasets: [
                    { label: `方案 ${APP.current}`, data: res.netAsset, borderColor: '#3b82f6', borderWidth: 3, tension: 0.3 },
                    { label: `對照組`, data: comp.netAsset, borderColor: '#64748b', borderWidth: 2, borderDash: [5,5], tension: 0.3 }
                ]
            },
            options: commonOpt
        });

        // 2. Cashflow Stacked
        APP.charts['flow'] = new Chart(document.getElementById('chart-flow'), {
            type: 'bar',
            data: {
                labels: res.years,
                datasets: [
                    { label: '房貸', data: res.mortgage, backgroundColor: '#f97316' },
                    { label: '支出', data: res.exp, backgroundColor: '#64748b' },
                    { label: '投資', data: res.inv, backgroundColor: '#22c55e' },
                    { label: '結餘', data: res.flow, backgroundColor: '#3b82f6' }
                ]
            },
            options: { ...commonOpt, scales: { x: { stacked: true }, y: { stacked: true } } }
        });

        // 3. Wealth Structure (Fixed Stacking)
        // Liquid = Net - House + Loan
        const liquid = res.netAsset.map((n, i) => n - res.house[i] + res.loan[i]);
        APP.charts['wealth'] = new Chart(document.getElementById('chart-wealth'), {
            type: 'line',
            data: {
                labels: res.years,
                datasets: [
                    { label: '房貸', data: res.loan, borderColor: '#ef4444', borderWidth: 2, fill: false, order:0 },
                    { label: '房產', data: res.house, backgroundColor: 'rgba(249, 115, 22, 0.5)', fill: true, borderWidth:0, order:1 },
                    { label: '流動資產', data: liquid, backgroundColor: 'rgba(59, 130, 246, 0.5)', fill: true, borderWidth:0, order:2 }
                ]
            },
            options: { ...commonOpt, scales: { y: { stacked: false } } } // Important: stacked false for mixing line/area logic
        });

        // 4. Inflation
        APP.charts['inflation'] = new Chart(document.getElementById('chart-inflation'), {
            type: 'line',
            data: {
                labels: res.years,
                datasets: [
                    { label: '名目資產', data: res.netAsset, borderColor: '#cbd5e1', borderWidth: 2 },
                    { label: '實質購買力', data: res.realAsset, borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.2)', fill: true, borderWidth: 2 }
                ]
            },
            options: commonOpt
        });
    }
};

// Start
window.onload = APP.init;
window.app = APP; // Expose for HTML buttons
</script>
</body>
</html>
