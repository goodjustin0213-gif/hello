/**
 * 軍人職涯薪資規劃決策支援系統 - 核心邏輯 v19.0
 * 依據論文「3.3.3 模型設計方法」與「4.4 系統功能模組設計」實作
 * 特色：雙方案對照 (A/B Testing) + 嚴謹會計恆等式
 */

const APP = {
    // 資料儲存區 (分別儲存 A 案與 B 案參數)
    data: { A: {}, B: {} },
    curr: 'A', // 當前編輯的方案
    charts: {},

    // --- 資料層：2025 軍職薪資資料庫 (本俸+專業加給預估) ---
    // 依據論文 3.2.1 資料蒐集 [cite: 70-73]
    rankDB: {
        '二兵': {base: 10550, pro: 0}, '一兵': {base: 11130, pro: 0}, '上兵': {base: 12280, pro: 0},
        '下士': {base: 14645, pro: 5500}, '中士': {base: 16585, pro: 6200}, '上士': {base: 18525, pro: 7000},
        '三等士官長': {base: 22750, pro: 8200}, '二等士官長': {base: 25050, pro: 9500}, '一等士官長': {base: 28880, pro: 10800},
        '少尉': {base: 22750, pro: 8500}, '中尉': {base: 25050, pro: 9800}, '上尉': {base: 28880, pro: 11500},
        '少校': {base: 32710, pro: 23000}, '中校': {base: 37310, pro: 26000}, '上校': {base: 41900, pro: 32000},
        '少將': {base: 48030, pro: 40000}
    },
    rankOrder: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校','少將'],

    // --- 工具函式 ---
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 初始化 ---
    init: () => {
        // 設定 Chart.js 全域樣式
        Chart.defaults.font.family = "'Roboto Mono', 'Noto Sans TC', sans-serif";
        Chart.defaults.color = '#64748b';
        Chart.defaults.borderColor = '#e2e8f0';

        // 注入選單
        const opts = APP.rankOrder.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;

        // 預設參數 (依據論文 3.4.1 實例驗證設定) [cite: 114-118]
        const def = {
            currentRank: '少尉', targetRank: '中校', serviceYears: 20, 
            inflationRate: 2.0, salaryRaiseRate: 1.0, returnRate: 6.0,
            buyHouseToggle: false, buyYear: 10, housePriceWan: 1200, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
            investSliderPct: 30, // 預設投資 30%
            allowances: [], expenses: [{name:'生活費', val:15000}], investments: [{name:'儲蓄險', val:3000}]
        };
        
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        
        // 設定 B 案為對照組 (例如：不投資、純定存)
        APP.data.B.investSliderPct = 10; 
        APP.data.B.returnRate = 1.5; 

        // 綁定事件
        document.body.addEventListener('input', e => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') APP.calc();
        });
        document.getElementById('buyHouse').addEventListener('change', e => {
            document.getElementById('housing-opts').classList.toggle('hidden', !e.target.checked);
            APP.calc();
        });

        // 啟動
        APP.renderInputs('A');
        setTimeout(APP.calc, 200);
    },

    // --- 方案切換 (UI Layer) ---
    switch: s => {
        APP.save(); // 先儲存當前數據
        APP.curr = s;
        
        // 更新 Tab 樣式
        document.getElementById('btn-A').className = s==='A' ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
        document.getElementById('btn-B').className = s==='B' ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
        
        APP.renderInputs(s);
        APP.calc();
    },

    save: () => {
        const d = APP.data[APP.curr];
        ['currentRank','targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation','investSlider'].forEach(k => {
            const el = document.getElementById(k);
            if(el) d[k==='investSlider'?'investSliderPct':k] = k.includes('Rank')?el.value:APP.N(el.value);
        });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        d.allowances = APP.readList('allowance-list');
        d.expenses = APP.readList('expense-list');
        d.investments = APP.readList('invest-list');
    },

    renderInputs: s => {
        const d = APP.data[s];
        ['currentRank','targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation'].forEach(k => document.getElementById(k).value = d[k]);
        document.getElementById('investSlider').value = d.investSliderPct;
        document.getElementById('slider-val').innerText = d.investSliderPct+'%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        
        const h = document.getElementById('housing-opts');
        if(d.buyHouseToggle) h.classList.remove('hidden'); else h.classList.add('hidden');
    },

    // --- 列表管理 ---
    renderList: (id, list) => {
        const c = document.getElementById(id); c.innerHTML = '';
        list.forEach(i => {
            let ex = id==='allowance-list' ? `<input type="number" class="w-14 text-center border-slate-300" value="${i.start||1}">-<input type="number" class="w-14 text-center border-slate-300" value="${i.end||20}">` : '';
            c.innerHTML += `<div class="flex gap-1 mb-1 list-item"><input type="text" value="${i.name}" class="flex-1 border-slate-300"><input type="number" value="${i.val}" class="w-20 text-right font-bold text-slate-700 border-slate-300">${ex}<button onclick="this.parentElement.remove();app.calc()" class="text-red-400 px-2 font-bold">✕</button></div>`;
        });
    },
    readList: id => {
        const arr = [];
        document.getElementById(id).querySelectorAll('.list-item').forEach(r => {
            const inputs = r.querySelectorAll('input');
            if(id==='allowance-list') arr.push({name:inputs[0].value, val:APP.N(inputs[1].value), start:APP.N(inputs[2].value), end:APP.N(inputs[3].value)});
            else arr.push({name:inputs[0].value, val:APP.N(inputs[1].value)});
        });
        return arr;
    },
    addItem: id => {
        const l = id==='allowance-list'?APP.data[APP.curr].allowances:(id==='expense-list'?APP.data[APP.curr].expenses:APP.data[APP.curr].investments);
        l.push({name:'新項目', val:0, start:1, end:20}); APP.renderList(id, l); APP.calc();
    },
    loadDefaults: () => {
        const d = APP.data[APP.curr];
        // 國防部 (2024) 志願役勤務加給參考
        d.allowances = [
            {name:'志願役加給', val:15000, start:1, end:20},
            {name:'勤務加給', val:5000, start:1, end:20}
        ];
        APP.renderList('allowance-list', d.allowances); APP.calc();
    },

    // --- 邏輯層 (Logic Layer)：核心運算模型 ---
    // 包含：薪資成長、可支配所得、投資報酬、房貸負擔 [cite: 101-110]
    run: d => {
        const N = APP.N;
        const years = N(d.serviceYears)||20, inf = N(d.inflationRate)/100, raise = N(d.salaryRaiseRate)/100, roi = N(d.returnRate)/100, pct = N(d.investSliderPct)/100;
        
        let rank = d.currentRank, rankY = 0;
        let invPool = 0, cashPool = 0; // 資金池分離
        let house = 0, loan = 0, mPay = 0, hasHouse = false;
        
        const targetIdx = APP.rankOrder.indexOf(d.targetRank);
        const res = { years:[], net:[], invP:[], cashP:[], houseNet:[], flow:[], log:[] };
        const baseExp = d.expenses.reduce((s,x)=>s+N(x.val),0), baseInv = d.investments.reduce((s,x)=>s+N(x.val),0);

        for(let y=1; y<=years; y++) {
            // A. 薪資成長模型 (軍職特性)
            const rInfo = APP.rankDB[rank], rIdx = APP.rankOrder.indexOf(rank);
            // 晉升邏輯：簡易模擬每4年升一階，直到目標階級
            if(y>1 && y%4===0 && rIdx<targetIdx) { rank = APP.rankOrder[rIdx+1]; rankY=0; } else rankY++;

            // 薪資 = 本俸(含年資調升) + 專業加給 + 其他津貼
            const payBase = rInfo.base * Math.pow(1.015, rankY) * Math.pow(1+raise, y-1);
            let allow = 0; d.allowances.forEach(a => { if(y>=N(a.start) && y<=N(a.end)) allow+=N(a.val); });
            const netM = Math.round((payBase + rInfo.pro + allow)*0.95); // 扣除退撫健保

            // B. 房貸負擔能力模型
            let yMort = 0;
            if(d.buyHouseToggle && y===N(d.buyYear) && !hasHouse) {
                hasHouse = true; house = N(d.housePriceWan)*10000;
                const down = house*(N(d.downPaymentPct)/100); loan = house-down;
                // 優先扣現金，不足扣投資
                if(cashPool>=down) cashPool-=down; else { const r=down-cashPool; cashPool=0; invPool-=r; }
                // 本息均攤公式
                const r=N(d.mortgageRate)/100/12, n=N(d.loanTerm)*12; 
                mPay = loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
            }
            if(hasHouse) {
                house *= (1+N(d.houseAppreciation)/100);
                if(loan>0) { 
                    yMort=mPay*12; 
                    loan-=(yMort-loan*(N(d.mortgageRate)/100)); // 簡易本金攤還
                    if(loan<0)loan=0; 
                }
            }

            // C. 可支配所得模型 & 投資模擬
            const yInc = netM * 13.5; // 年收入 (含1.5個月年終)
            const yEx = baseExp * Math.pow(1+inf, y-1) * 12; // 支出隨通膨增加
            const yInvIn = (netM * pct + baseInv) * 12; // 投入投資池
            const ySur = yInc - yEx - yInvIn - yMort;   // 現金結餘

            // 複利滾存
            invPool = invPool * (1+roi) + yInvIn;
            cashPool += ySur;

            const houseNet = hasHouse ? Math.max(0, house-loan) : 0;
            const net = invPool + cashPool + houseNet;

            res.years.push('Y'+y); res.net.push(net); res.invP.push(invPool); res.cashP.push(cashPool); res.houseNet.push(houseNet); res.flow.push(ySur);
            res.log.push({y, rank, inc:yInc, ex:yEx, inv:yInvIn, mort:yMort, flow:ySur, invVal:invPool, cashVal:cashPool, houseNet, net});
        }
        return res;
    },

    // --- 應用層 (Application Layer)：圖表與報表 ---
    calc: () => {
        APP.save();
        // 雙方案模擬
        const rA = APP.run(APP.data.A);
        const rB = APP.run(APP.data.B);
        
        // 顯示當前方案 (A或B) 的詳細數據，但在比較圖顯示兩者
        const currR = APP.curr === 'A' ? rA : rB;
        
        // 1. KPI 更新
        const last = currR.net.length-1;
        document.getElementById('kpi-net-A').innerText = APP.F(rA.net[last]);
        document.getElementById('kpi-net-B').innerText = APP.F(rB.net[last]);
        const diff = rA.net[last] - rB.net[last];
        document.getElementById('kpi-diff').innerText = (diff>=0?'+':'') + APP.F(diff);
        document.getElementById('kpi-diff').className = `text-3xl font-black mono mt-1 ${diff>=0?'text-green-600':'text-red-600'}`;

        // 2. 房貸分析
        const analysis = document.getElementById('analysis-text');
        const hasDeficit = currR.flow.some(x => x < 0);
        if(hasDeficit) {
            analysis.innerHTML = `⚠️ <strong>現金流警示：</strong> 模擬顯示在部分年度出現資金缺口（紅色區塊）。這意味著您的收入扣除生活費與投資後，不足以支付房貸。`;
            analysis.className = "mt-4 p-3 bg-red-50 text-red-700 rounded border-l-4 border-red-500 text-xs";
        } else {
            analysis.innerHTML = `✅ <strong>財務健康：</strong> 年度現金結餘皆為正值，具備足夠的償債與儲蓄能力。`;
            analysis.className = "mt-4 p-3 bg-green-50 text-green-700 rounded border-l-4 border-green-500 text-xs";
        }

        // 3. 表格更新
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        currR.log.forEach(x => {
            tb.innerHTML += `<tr>
                <td class="p-3 text-slate-400 font-mono">${x.y}</td><td class="p-3 font-bold text-slate-700">${x.rank}</td>
                <td class="p-3 text-right">${APP.F(x.inc)}</td><td class="p-3 text-right text-red-500">${APP.F(x.ex)}</td>
                <td class="p-3 text-right text-emerald-600">${APP.F(x.inv)}</td>
                <td class="p-3 text-right font-bold ${x.flow<0?'text-red-600 bg-red-50':'text-blue-600 bg-blue-50'}">${APP.F(x.flow)}</td>
                <td class="p-3 text-right text-slate-500">${APP.F(x.invVal)}</td><td class="p-3 text-right font-black text-slate-800">${APP.F(x.net)}</td>
            </tr>`;
        });

        APP.draw(rA, rB);
    },

    draw: (rA, rB) => {
        const labels = rA.years;
        const currR = APP.curr === 'A' ? rA : rB;

        // Chart 1: 資產累積比較 (A vs B)
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '方案 A (主方案)', data: rA.net, borderColor: '#2563eb', borderWidth: 3, tension: 0.3, pointRadius: 0 },
                    { label: '方案 B (對照組)', data: rB.net, borderColor: '#94a3b8', borderWidth: 2, borderDash: [5,5], pointRadius: 0 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } }
        });

        // Chart 2: 資產結構 (僅顯示當前方案)
        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'line', // 使用 Line 模擬 Area
            data: {
                labels: labels,
                datasets: [
                    { label: '投資總值', data: currR.invP, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, pointRadius:0 },
                    { label: '現金總值', data: currR.cashP, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, pointRadius:0 },
                    { label: '房產淨值', data: currR.houseNet, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', fill: true, pointRadius:0 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { stacked: false } } }
        });

        // Chart 3: 現金流 (Bar)
        if(APP.charts.cashflow) APP.charts.cashflow.destroy();
        APP.charts.cashflow = new Chart(document.getElementById('chart-cashflow'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: '年度現金結餘', data: currR.flow, backgroundColor: currR.flow.map(v=>v<0?'#ef4444':'#3b82f6') }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

window.onload = APP.init;
