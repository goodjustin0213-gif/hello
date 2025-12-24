/**
 * SKYNET FINANCIAL CORE v10.0
 * Target: Air Force Academy DSS
 * Style: Cyberpunk / Tactical
 * Logic: Investment/Cash Separation + Robust NaN Handling
 */

const APP = {
    data: { A: {}, B: {} },
    current: 'A',
    charts: {},
    ranks: ['S2','S3','S4','M1','M2','M3','G1'],
    salary: {
        'S2': {base:22750, add:28000, max:12}, 
        'S3': {base:25050, add:30000, max:12},
        'S4': {base:28880, add:35000, max:17}, 
        'M1': {base:32710, add:45000, max:22},
        'M2': {base:37310, add:55000, max:26}, 
        'M3': {base:41900, add:65000, max:30},
        'G1': {base:48030, add:70000, max:35}
    },

    // --- UTILS: ROBUST PARSING ---
    N: (v) => {
        if(!v) return 0;
        const n = parseFloat(String(v).replace(/,/g, ''));
        return isNaN(n) ? 0 : n;
    },
    F: (n) => Math.round(n).toLocaleString('en-US'),

    // --- INIT ---
    init: () => {
        // 設定 Chart.js 賽博風格預設值
        Chart.defaults.font.family = '"Share Tech Mono", monospace';
        Chart.defaults.color = 'rgba(0, 243, 255, 0.5)';
        Chart.defaults.borderColor = 'rgba(0, 243, 255, 0.1)';

        const def = {
            targetRank: 'M2', serviceYears: 20, inflationRate: 2, salaryRaiseRate: 1, returnRate: 6,
            buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
            investSliderPct: 30,
            allowances: [], 
            expenses: [{name:'基本開銷', val:12000}], 
            investments: [{name:'儲蓄險', val:3000}]
        };
        
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        APP.data.B.returnRate = 4; // 對照組差異
        APP.data.B.investSliderPct = 50; 

        document.body.addEventListener('input', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') APP.calc();
        });

        APP.renderInputs('A');
        setTimeout(APP.calc, 300); // 確保 Canvas 載入
    },

    // --- UI INTERACTION ---
    switchScenario: (s) => {
        APP.saveInputs();
        APP.current = s;
        // 更新按鈕樣式 (Cyberpunk Style)
        const activeClass = "btn-outline-cyber py-2 text-xs font-bold rounded-sm bg-cyber-cyan/20 text-white shadow-[0_0_10px_#00f3ff]";
        const inactiveClass = "btn-outline-cyber py-2 text-xs font-bold rounded-sm border-cyber-cyan/30 text-gray-500 hover:text-white";
        
        document.getElementById('btn-A').className = s==='A' ? activeClass : inactiveClass;
        document.getElementById('btn-B').className = s==='B' ? activeClass : inactiveClass;
        document.getElementById('current-scen-label').innerText = `EDITING: ${s==='A'?'ALPHA':'BRAVO'} PROTOCOL`;
        
        APP.renderInputs(s);
        APP.calc();
    },

    saveInputs: () => {
        const d = APP.data[APP.current];
        const ids = ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation','investSlider'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) d[id==='investSlider'?'investSliderPct':id] = id==='targetRank' ? el.value : APP.N(el.value);
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
        
        const hInputs = document.getElementById('housing-inputs');
        hInputs.classList.toggle('hidden', !d.buyHouseToggle);
        if(d.buyHouseToggle) hInputs.classList.add('grid');
    },

    // --- LIST MANAGERS ---
    renderList: (id, list) => {
        const c = document.getElementById(id);
        c.innerHTML = '';
        list.forEach(item => {
            let extra = id==='allowance-list' ? 
                `<input type="number" class="w-10 text-center !bg-black !border-cyber-cyan/30 text-cyber-cyan" value="${item.start||1}">-<input type="number" class="w-10 text-center !bg-black !border-cyber-cyan/30 text-cyber-cyan" value="${item.end||20}">` : '';
            c.innerHTML += `
            <div class="flex gap-1 items-center mb-1 animate-flash">
                <input type="text" value="${item.name}" class="w-full text-xs !bg-transparent border-b !border-cyber-cyan/20 text-gray-300">
                <input type="number" value="${item.val}" class="w-20 text-right !bg-transparent border-b !border-cyber-cyan/20 font-mono text-cyber-orange">
                ${extra}
                <button onclick="this.parentElement.remove(); app.calc()" class="text-cyber-red hover:text-white px-2 font-bold">×</button>
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
        list.push({name:'New Item', val:0, start:1, end:20});
        APP.renderList(id, list);
        APP.calc();
    },
    applyAirForcePreset: () => {
        const d = APP.data[APP.current];
        d.allowances = [
            {name: '空勤(初)', val: 22000, start: 1, end: 5},
            {name: '空勤(中)', val: 45000, start: 6, end: 15},
            {name: '空勤(高)', val: 68000, start: 16, end: 25}
        ];
        APP.renderList('allowance-list', d.allowances);
        APP.calc();
    },
    addCustomAllowance: () => APP.addItem('allowance-list'),

    // --- CORE LOGIC (SEPARATED POOLS) ---
    runSim: (d) => {
        const N = APP.N;
        const years = N(d.serviceYears) || 20;
        const inflation = N(d.inflationRate) / 100;
        const raise = N(d.salaryRaiseRate) / 100;
        const roi = N(d.returnRate) / 100;
        const sliderPct = N(d.investSliderPct) / 100;
        
        let rank = 'S2', rankY = 0;
        const targetIdx = APP.ranks.indexOf(d.targetRank);
        
        // 分離資金池：投資(複利) vs 現金(不計息)
        let investPool = 0; 
        let cashPool = 0;   
        
        let house = 0, loan = 0, mPay = 0, hasHouse = false;
        
        const res = { years:[], netAsset:[], realAsset:[], house:[], loan:[], investPool:[], cashPool:[], mortgage:[], exp:[], inv:[], flow:[], logs:[] };
        
        const baseExp = d.expenses.reduce((s, x) => s + N(x.val), 0);
        const baseFixedInv = d.investments.reduce((s, x) => s + N(x.val), 0);

        for(let y=1; y<=years; y++) {
            // Rank
            const rInfo = APP.salary[rank];
            const rIdx = APP.ranks.indexOf(rank);
            if(y > 1 && y % 4 === 0 && rIdx < targetIdx && rankY < rInfo.max) { 
                rank = APP.ranks[rIdx+1]; 
                rankY = 0; 
            } else rankY++;

            // Income
            const payBase = (APP.salary[rank].base + APP.salary[rank].add) * Math.pow(1.015, rankY) * Math.pow(1+raise, y-1);
            let allow = 0;
            d.allowances.forEach(a => { if(y >= N(a.start) && y <= N(a.end)) allow += N(a.val); });
            const gross = payBase + 15000 + allow; 
            const netMonthly = Math.round(gross * 0.95); 

            // Housing
            let yMortgage = 0;
            if(d.buyHouseToggle && y === N(d.buyYear) && !hasHouse) {
                hasHouse = true;
                house = N(d.housePriceWan) * 10000;
                const down = house * (N(d.downPaymentPct)/100);
                loan = house - down;
                
                // Pay down payment from Cash first, then Invest
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

            // Cashflow Logic
            const yIncome = netMonthly * 13.5;
            const yExp = baseExp * Math.pow(1+inflation, y-1) * 12;
            
            // Allocation
            const yInvestInput = (netMonthly * sliderPct + baseFixedInv) * 12; // To Investment
            const cashSurplus = yIncome - yExp - yInvestInput - yMortgage;    // To Cash

            // Compounding
            investPool = investPool * (1 + roi) + yInvestInput;
            cashPool = cashPool + cashSurplus;

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
            res.logs.push({y, rank, income:yIncome, exp:yExp, inv:yInvestInput, invPool:investPool, cashPool:cashPool, mortgage:yMortgage, flow:cashSurplus, net:netAsset});
        }
        res.pension = Math.round(APP.salary[rank].base * 2 * (0.55 + Math.max(0, years-20)*0.02)); 
        return res;
    },

    // --- VISUALIZATION ---
    calc: () => {
        APP.saveInputs();
        const resA = APP.runSim(APP.data.A);
        const resB = APP.runSim(APP.data.B);
        if(!resA || !resB) return;
        APP.currentResult = (APP.current === 'A') ? resA : resB;
        APP.updateUI(APP.currentResult, (APP.current === 'A') ? resB : resA);
    },

    updateUI: (res, comp) => {
        const last = res.netAsset.length - 1;
        document.getElementById('kpi-asset').innerText = APP.F(res.netAsset[last]);
        document.getElementById('kpi-pension').innerText = APP.F(res.pension);
        document.getElementById('kpi-invest-pool').innerText = APP.F(res.investPool[last]);
        document.getElementById('kpi-cash-pool').innerText = APP.F(res.cashPool[last]);
        
        const diff = res.netAsset[last] - comp.netAsset[last];
        const diffEl = document.getElementById('kpi-diff');
        diffEl.innerHTML = `${diff>=0?'+':''}${APP.F(diff)}`;
        diffEl.className = `text-sm font-mono font-bold ${diff>=0 ? 'text-cyber-green' : 'text-cyber-red'}`;

        // Progress Bars
        const totalL = res.investPool[last] + res.cashPool[last];
        if(totalL > 0) {
            document.getElementById('bar-invest').style.width = (res.investPool[last]/totalL*100) + '%';
            document.getElementById('bar-cash').style.width = (res.cashPool[last]/totalL*100) + '%';
        }

        // Status Bar
        const sb = document.getElementById('status-bar');
        const neg = res.logs.some(l => l.net < 0 || l.flow < 0);
        if(neg) sb.classList.remove('hidden'); else sb.classList.add('hidden');

        // Terminal Log
        const tb = document.getElementById('table-body');
        tb.innerHTML = '';
        res.logs.forEach(l => {
            tb.innerHTML += `<tr class="log-entry"><td class="py-1 text-gray-500">Y${l.y}</td><td class="font-bold text-cyber-cyan">${l.rank}</td><td class="text-right text-gray-300">${APP.F(l.income)}</td><td class="text-right text-cyber-red/70">${APP.F(l.exp)}</td><td class="text-right text-cyber-green/70">${APP.F(l.inv)}</td><td class="text-right text-gray-500">${APP.F(l.flow)}</td><td class="text-right font-bold text-white">${APP.F(l.net)}</td></tr>`;
        });

        APP.drawCharts(res, comp);
    },

    drawCharts: (res, comp) => {
        // Shared Options
        const commonOpt = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800, easing: 'easeOutQuart' },
            plugins: { legend: { labels: { color: 'rgba(0, 243, 255, 0.6)', font: { family: 'Share Tech Mono' }, boxWidth: 8 } } },
            scales: {
                x: { grid: { display: false }, ticks: { color: 'rgba(0, 243, 255, 0.4)', font: { size: 9 } } },
                y: { grid: { color: 'rgba(0, 243, 255, 0.05)' }, ticks: { color: 'rgba(0, 243, 255, 0.4)', font: { size: 9 } } }
            }
        };

        const ctxs = ['chart-asset', 'chart-flow', 'chart-wealth', 'chart-inflation'];
        ctxs.forEach(id => {
            if(APP.charts[id]) APP.charts[id].destroy();
            const cvs = document.getElementById(id);
            if(!cvs) return;

            let cfg;
            // 1. Asset Compare
            if(id === 'chart-asset') {
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: 'ALPHA (CURR)', data: res.netAsset, borderColor: '#00f3ff', borderWidth: 2, tension: 0.3, pointRadius: 0, fill: {target:'origin', above:'rgba(0, 243, 255, 0.05)'} },
                            { label: 'BRAVO (COMP)', data: comp.netAsset, borderColor: '#4b5563', borderWidth: 2, borderDash: [4,4], pointRadius: 0 }
                        ]
                    }
                };
            } 
            // 2. Cashflow Stack
            else if(id === 'chart-flow') {
                cfg = {
                    type: 'bar',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: 'MORTGAGE', data: res.mortgage, backgroundColor: '#ffaa00' },
                            { label: 'EXPENSE', data: res.exp, backgroundColor: '#ff003c' },
                            { label: 'INVEST', data: res.inv, backgroundColor: '#0aff0a' },
                            { label: 'SURPLUS', data: res.flow, backgroundColor: '#00f3ff' }
                        ]
                    },
                    options: { ...commonOpt, scales: { ...commonOpt.scales, x: { stacked: true }, y: { stacked: true } } }
                };
            } 
            // 3. Wealth Structure
            else if(id === 'chart-wealth') {
                const liquid = res.netAsset.map((n, i) => n - res.house[i] + res.loan[i]); // Recalculate pure liquid
                // Note: We use Invest Pool & Cash Pool for area, House for area, Loan for line
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: 'HOUSE VALUE', data: res.house, backgroundColor: 'rgba(255, 170, 0, 0.1)', borderColor: '#ffaa00', fill: true, pointRadius: 0, borderWidth: 1, order: 3 },
                            { label: 'INVEST POOL', data: res.investPool, backgroundColor: 'rgba(10, 255, 10, 0.1)', borderColor: '#0aff0a', fill: true, pointRadius: 0, borderWidth: 1, order: 2 },
                            { label: 'CASH POOL', data: res.cashPool, backgroundColor: 'rgba(0, 243, 255, 0.1)', borderColor: '#00f3ff', fill: true, pointRadius: 0, borderWidth: 1, order: 1 },
                            { label: 'LOAN', data: res.loan, borderColor: '#ff003c', borderDash:[3,3], fill: false, pointRadius: 0, borderWidth: 2, order: 0 }
                        ]
                    },
                    options: { ...commonOpt, scales: { ...commonOpt.scales, y: { stacked: false } } } // Overlap logic
                };
            } 
            // 4. Inflation
            else {
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: 'NOMINAL', data: res.netAsset, borderColor: '#4b5563', borderWidth: 1, pointRadius: 0 },
                            { label: 'REAL (PPI)', data: res.realAsset, borderColor: '#ffaa00', backgroundColor: 'rgba(255, 170, 0, 0.1)', fill: true, borderWidth: 2, pointRadius: 0 }
                        ]
                    }
                };
            }
            // Merge Options
            if(!cfg.options) cfg.options = commonOpt;
            else if(!cfg.options.plugins) cfg.options = { ...commonOpt, ...cfg.options };

            APP.charts[id] = new Chart(cvs, cfg);
        });
    },

    generateReport: () => {
        if(!APP.currentResult) return;
        const r = APP.currentResult;
        const last = r.netAsset.length - 1;
        const invPct = Math.round((r.investPool[last] / r.netAsset[last]) * 100) || 0;
        
        const html = `
            <h4 class="text-cyber-cyan border-b border-cyber-cyan/30 pb-2 mb-4 font-display tracking-widest text-lg">MISSION DEBRIEFING // ${new Date().toLocaleDateString()}</h4>
            
            <div class="grid grid-cols-2 gap-6 mb-6">
                <div class="bg-black/30 p-4 border border-cyber-green/20">
                    <span class="text-gray-500 text-xs block mb-1">FINAL NET WORTH</span>
                    <span class="text-3xl text-white font-bold text-shadow-glow">${APP.F(r.netAsset[last])}</span>
                </div>
                <div class="bg-black/30 p-4 border border-cyber-cyan/20">
                    <span class="text-gray-500 text-xs block mb-1">REAL VALUE (ADJ.)</span>
                    <span class="text-3xl text-cyber-orange font-bold">${APP.F(r.realAsset[last])}</span>
                </div>
            </div>

            <p class="text-gray-300 leading-relaxed mb-4">
                <strong class="text-white">COMMANDER'S ASSESSMENT:</strong><br>
                Based on current parameters (Invest Rate: <span class="text-cyber-green">${APP.data[APP.current].investSliderPct}%</span>, ROI: <span class="text-cyber-green">${APP.data[APP.current].returnRate}%</span>), 
                your portfolio structure at year ${APP.data[APP.current].serviceYears} consists of <span class="text-white font-bold">${invPct}%</span> investment assets.
            </p>

            <ul class="list-disc pl-5 text-gray-400 space-y-2 marker:text-cyber-cyan">
                <li>Estimated Monthly Pension: <span class="text-white font-bold">${APP.F(r.pension)}</span></li>
                <li>Total Investment Growth: <span class="text-cyber-green">${APP.F(r.investPool[last])}</span></li>
                <li>Cash Reserves: <span class="text-cyber-cyan">${APP.F(r.cashPool[last])}</span></li>
            </ul>
        `;
        document.getElementById('reportContent').innerHTML = html;
        document.getElementById('reportModal').classList.remove('hidden');
    }
};

// Start
window.onload = APP.init;
window.app = APP;
