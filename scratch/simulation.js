/**
 * AIR FORCE FINANCIAL DSS - CORE V11.0
 * Style: Aurora Glass (Clean/Modern)
 * Logic: Investment/Cash Separation + Robust Error Handling
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

    // --- 工具函式：強力防呆 ---
    N: (v) => {
        if(!v) return 0;
        const n = parseFloat(String(v).replace(/,/g, ''));
        return isNaN(n) ? 0 : n;
    },
    F: (n) => Math.round(n).toLocaleString('en-US'),

    // --- 初始化 ---
    init: () => {
        // 設定 Chart.js 簡約風格
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#64748b'; // Slate-500
        Chart.defaults.borderColor = '#e2e8f0'; // Slate-200

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
        APP.data.B.returnRate = 4; 
        APP.data.B.investSliderPct = 50; 

        document.body.addEventListener('input', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') APP.calc();
        });

        APP.renderInputs('A');
        // 延遲執行以確保 Canvas 渲染正確
        setTimeout(APP.calc, 300);
    },

    // --- 介面互動 ---
    switchScenario: (s) => {
        APP.saveInputs();
        APP.current = s;
        
        // 更新按鈕狀態
        const btnA = document.getElementById('btn-A');
        const btnB = document.getElementById('btn-B');
        const activeClass = "py-2 text-xs font-bold rounded-lg bg-white text-indigo-600 shadow-sm transition-all";
        const inactiveClass = "py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 transition-all";
        
        if(s === 'A') {
            btnA.className = activeClass;
            btnB.className = inactiveClass;
        } else {
            btnB.className = activeClass;
            btnA.className = inactiveClass;
        }
        
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
        ids.forEach(k => { if(document.getElementById(k)) document.getElementById(k).value = d[k]; });
        
        document.getElementById('investSlider').value = d.investSliderPct;
        document.getElementById('slider-val').innerText = d.investSliderPct + '%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        
        const hInputs = document.getElementById('housing-inputs');
        if(d.buyHouseToggle) {
            hInputs.classList.remove('hidden');
            hInputs.classList.add('grid');
        } else {
            hInputs.classList.add('hidden');
            hInputs.classList.remove('grid');
        }
    },

    // --- 列表管理 ---
    renderList: (id, list) => {
        const c = document.getElementById(id);
        c.innerHTML = '';
        list.forEach(item => {
            let extra = id==='allowance-list' ? 
                `<input type="number" class="w-12 text-center bg-white/50 border-slate-200" value="${item.start||1}">-<input type="number" class="w-12 text-center bg-white/50 border-slate-200" value="${item.end||20}">` : '';
            c.innerHTML += `
            <div class="flex gap-2 items-center mb-2 animate-float" style="animation-duration: 0s;">
                <input type="text" value="${item.name}" class="flex-1 min-w-0 text-xs border-transparent border-b-slate-200 bg-transparent focus:bg-white">
                <input type="number" value="${item.val}" class="w-20 text-right font-bold text-indigo-600 border-transparent border-b-slate-200 bg-transparent focus:bg-white">
                ${extra}
                <button onclick="this.parentElement.remove(); app.calc()" class="w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition flex items-center justify-center text-xs">✕</button>
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
    applyAirForcePreset: () => {
        const d = APP.data[APP.current];
        // 空勤加給預設值 (模擬)
        d.allowances = [
            {name: '空勤加給(初)', val: 22000, start: 1, end: 5},
            {name: '空勤加給(中)', val: 45000, start: 6, end: 15},
            {name: '空勤加給(高)', val: 68000, start: 16, end: 25}
        ];
        APP.renderList('allowance-list', d.allowances);
        APP.calc();
    },

    // --- 核心運算引擎 (資金池分離邏輯) ---
    runSim: (d) => {
        const N = APP.N;
        const years = N(d.serviceYears) || 20;
        const inflation = N(d.inflationRate) / 100;
        const raise = N(d.salaryRaiseRate) / 100;
        const roi = N(d.returnRate) / 100;
        const sliderPct = N(d.investSliderPct) / 100;
        
        let rank = 'S2', rankY = 0;
        const targetIdx = APP.ranks.indexOf(d.targetRank);
        
        // 兩個獨立的資產池
        let investPool = 0; // 投資池 (會滾複利)
        let cashPool = 0;   // 現金池 (不滾利，視為活存)
        
        let house = 0, loan = 0, mPay = 0, hasHouse = false;
        
        const res = { years:[], netAsset:[], realAsset:[], house:[], loan:[], investPool:[], cashPool:[], mortgage:[], exp:[], inv:[], flow:[], logs:[] };
        
        const baseExp = d.expenses.reduce((s, x) => s + N(x.val), 0);
        const baseFixedInv = d.investments.reduce((s, x) => s + N(x.val), 0);

        for(let y=1; y<=years; y++) {
            // 晉升邏輯
            const rInfo = APP.salary[rank];
            const rIdx = APP.ranks.indexOf(rank);
            if(y > 1 && y % 4 === 0 && rIdx < targetIdx && rankY < rInfo.max) { 
                rank = APP.ranks[rIdx+1]; 
                rankY = 0; 
            } else rankY++;

            // 薪資計算
            const payBase = (APP.salary[rank].base + APP.salary[rank].add) * Math.pow(1.015, rankY) * Math.pow(1+raise, y-1);
            let allow = 0;
            d.allowances.forEach(a => { if(y >= N(a.start) && y <= N(a.end)) allow += N(a.val); });
            const gross = payBase + 15000 + allow; // 志願役加給
            const netMonthly = Math.round(gross * 0.95); // 概算扣除

            // 購屋邏輯
            let yMortgage = 0;
            if(d.buyHouseToggle && y === N(d.buyYear) && !hasHouse) {
                hasHouse = true;
                house = N(d.housePriceWan) * 10000;
                const down = house * (N(d.downPaymentPct)/100);
                loan = house - down;
                
                // 頭期款扣除順序：先扣現金，再扣投資
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
            
            // 投入投資 = (月薪 * 比例) + 固定投資
            const yInvestInput = (netMonthly * sliderPct + baseFixedInv) * 12;
            
            // 現金結餘 = 收入 - 支出 - 拿去投資的 - 房貸
            const cashSurplus = yIncome - yExp - yInvestInput - yMortgage;

            // 資產滾存
            investPool = investPool * (1 + roi) + yInvestInput; // 只有這池有 ROI
            cashPool = cashPool + cashSurplus; // 這裡不計息

            const netAsset = investPool + cashPool + house - loan;

            res.years.push('Y'+y);
            res.netAsset.push(netAsset);
            res.realAsset.push(netAsset / Math.pow(1+inflation, y));
            res.investPool.push(investPool);
            res.cashPool.push(cashPool);
            res.house.push(house);
            res.loan.push(loan);
            res.exp.push(yExp);
            res.inv.push(yInvestInput);
            res.mortgage.push(yMortgage);
            res.flow.push(cashSurplus);
            res.logs.push({y, rank, income:yIncome, exp:yExp, inv:yInvestInput, invPool:investPool, cashPool:cashPool, mortgage:yMortgage, flow:cashSurplus, net:netAsset});
        }
        
        res.pension = Math.round(APP.salary[rank].base * 2 * (0.55 + Math.max(0, years-20)*0.02)); 
        return res;
    },

    // --- 圖表與 UI 更新 ---
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
        
        const diff = res.netAsset[last] - comp.netAsset[last];
        const diffEl = document.getElementById('kpi-diff');
        diffEl.innerHTML = `${diff>=0?'+':''}${APP.F(diff)}`;
        diffEl.className = `text-xs font-bold px-2 py-0.5 rounded-full ${diff>=0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`;
        
        const totalL = res.investPool[last] + res.cashPool[last];
        if(totalL > 0) {
            const ratio = Math.round((res.investPool[last]/totalL*100));
            document.getElementById('kpi-invest-ratio').innerText = ratio + '%';
            document.getElementById('bar-invest').style.width = ratio + '%';
        }

        const hDiv = document.getElementById('kpi-house');
        if(APP.data[APP.current].buyHouseToggle) {
            hDiv.innerHTML = `市值 <span class="font-bold text-orange-500">${APP.F(res.house[last])}</span> / 貸 <span class="font-bold text-rose-500">-${APP.F(res.loan[last])}</span>`;
        } else {
            hDiv.innerText = "房產模組未啟用";
        }

        const tb = document.getElementById('table-body');
        tb.innerHTML = '';
        res.logs.forEach(l => {
            tb.innerHTML += `
            <tr class="table-row">
                <td class="table-cell font-bold text-slate-400">Y${l.y}</td>
                <td class="table-cell font-bold text-indigo-900">${l.rank}</td>
                <td class="table-cell text-right font-medium text-slate-600">${APP.F(l.income)}</td>
                <td class="table-cell text-right text-rose-500">${APP.F(l.exp)}</td>
                <td class="table-cell text-right text-emerald-600 font-bold">${APP.F(l.inv)}</td>
                <td class="table-cell text-right text-indigo-600">${APP.F(l.invPool)}</td>
                <td class="table-cell text-right text-slate-400">${APP.F(l.flow)}</td>
                <td class="table-cell text-right font-black text-slate-800">${APP.F(l.net)}</td>
            </tr>`;
        });

        APP.drawCharts(res, comp);
    },

    drawCharts: (res, comp) => {
        const ctxs = ['chart-asset', 'chart-flow', 'chart-wealth', 'chart-inflation'];
        ctxs.forEach(id => {
            if(APP.charts[id]) APP.charts[id].destroy();
            const cvs = document.getElementById(id);
            if(!cvs) return;

            let cfg;
            // 1. 資產對照 (Line) - Indigo vs Gray
            if(id === 'chart-asset') {
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '本方案', data: res.netAsset, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointRadius: 0 },
                            { label: '對照組', data: comp.netAsset, borderColor: '#94a3b8', borderWidth: 2, borderDash: [5,5], pointRadius: 0 }
                        ]
                    }
                };
            } 
            // 2. 現金流堆疊 (Stacked Bar) - 清新色系
            else if(id === 'chart-flow') {
                cfg = {
                    type: 'bar',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '房貸', data: res.mortgage, backgroundColor: '#fbbf24', borderRadius: 2 },
                            { label: '支出', data: res.exp, backgroundColor: '#f43f5e', borderRadius: 2 },
                            { label: '投資', data: res.inv, backgroundColor: '#10b981', borderRadius: 2 },
                            { label: '結餘', data: res.flow, backgroundColor: '#6366f1', borderRadius: 2 }
                        ]
                    },
                    options: { scales: { x: { stacked: true }, y: { stacked: true } } }
                };
            } 
            // 3. 資產結構 (Area) - 明亮透明
            else if(id === 'chart-wealth') {
                const liquid = res.netAsset.map((n, i) => n - res.house[i] + res.loan[i]);
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '房產市值', data: res.house, backgroundColor: 'rgba(251, 191, 36, 0.2)', borderColor: '#f59e0b', fill: true, pointRadius: 0, borderWidth: 1, order: 3 },
                            { label: '投資池', data: res.investPool, backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', fill: true, pointRadius: 0, borderWidth: 2, order: 2 },
                            { label: '現金池', data: res.cashPool, backgroundColor: 'rgba(99, 102, 241, 0.2)', borderColor: '#6366f1', fill: true, pointRadius: 0, borderWidth: 1, order: 1 },
                            { label: '房貸', data: res.loan, borderColor: '#f43f5e', borderDash:[3,3], fill: false, pointRadius: 0, borderWidth: 2, order: 0 }
                        ]
                    },
                    options: { scales: { y: { stacked: false } } }
                };
            } 
            // 4. 通膨 (Line)
            else {
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '名目資產', data: res.netAsset, borderColor: '#64748b', borderWidth: 2, pointRadius: 0 },
                            { label: '實質購買力', data: res.realAsset, borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.1)', fill: true, borderWidth: 2, pointRadius: 0 }
                        ]
                    }
                };
            }

            // 通用配置
            if(!cfg.options) cfg.options = {};
            cfg.options.responsive = true;
            cfg.options.maintainAspectRatio = false;
            cfg.options.animation = { duration: 800, easing: 'easeOutQuart' };
            cfg.options.plugins = { legend: { labels: { usePointStyle: true, boxWidth: 8, font: {family: "'Inter', sans-serif"} } } };
            
            // 確保有 Scales 物件
            if(!cfg.options.scales) cfg.options.scales = {};
            const commonScales = { 
                x: { grid: { display: false }, ticks: { font: {size: 10} } }, 
                y: { grid: { borderDash: [4, 4], color: '#f1f5f9' }, ticks: { font: {size: 10} } } 
            };
            cfg.options.scales = { ...commonScales, ...cfg.options.scales };

            APP.charts[id] = new Chart(cvs, cfg);
        });
    },

    // --- 報告生成 ---
    generateReport: () => {
        if(!APP.currentResult) return;
        const r = APP.currentResult;
        const last = r.netAsset.length - 1;
        const invRatio = Math.round((r.investPool[last] / r.netAsset[last]) * 100) || 0;
        
        const html = `
            <h4 class="text-indigo-600 font-bold border-b pb-2 mb-4 text-lg">財務戰略分析報告</h4>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <span class="text-xs text-indigo-400 font-bold block mb-1">預估最終淨資產</span>
                    <span class="text-2xl text-indigo-700 font-black">${APP.F(r.netAsset[last])}</span>
                </div>
                <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <span class="text-xs text-emerald-500 font-bold block mb-1">投資獲利貢獻</span>
                    <span class="text-2xl text-emerald-600 font-black">${APP.F(r.investPool[last])}</span>
                </div>
            </div>

            <div class="space-y-4 text-slate-600">
                <p>📊 <strong>資產結構分析：</strong><br>
                在 ${r.years.length} 年的職涯規劃中，您的資產成長動力主要來自 <span class="font-bold text-emerald-600">投資複利</span>。
                目前的薪資提撥率設定為 <span class="font-bold text-slate-900">${APP.data[APP.current].investSliderPct}%</span>，
                年化報酬率設定為 <span class="font-bold text-slate-900">${APP.data[APP.current].returnRate}%</span>。
                最終投資部位佔總資產約 <span class="font-bold text-indigo-600">${invRatio}%</span>。</p>
                
                <p>📉 <strong>通膨影響評估：</strong><br>
                雖然名目資產達到了 ${APP.F(r.netAsset[last])}，但考慮到 ${APP.data[APP.current].inflationRate}% 的通貨膨脹，
                其實質購買力約為 <span class="font-bold text-rose-500">${APP.F(r.realAsset[last])}</span>。
                這提醒我們必須持續保持高於通膨的投資回報。</p>
                
                <p>👴 <strong>退休保障：</strong><br>
                依據目前的階級晉升路徑，預估您的終身俸（月退）約為 <span class="font-bold text-sky-600">${APP.F(r.pension)}</span> 元。</p>
            </div>
        `;
        document.getElementById('reportContent').innerHTML = html;
        const modal = document.getElementById('reportModal');
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); modal.children[0].classList.remove('scale-95'); }, 10);
    },
    
    closeReport: () => {
        const modal = document.getElementById('reportModal');
        modal.classList.add('opacity-0');
        modal.children[0].classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};

// 啟動應用
window.onload = APP.init;
window.app = APP;
