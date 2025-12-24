/**
 * 軍人職涯薪資規劃決策支援系統 - 核心邏輯 v20.0 (絕對修正版)
 * 修正重點：
 * 1. 支出運算邏輯整合 (固定輸入 + 動態列表)
 * 2. 階級名稱全中文化 (符合國軍編制)
 * 3. 圖表座標軸自動校正
 */

const APP = {
    data: { A: {}, B: {} },
    curr: 'A',
    charts: {},

    // --- 1. 資料層：2025 軍職薪資資料庫 (本俸+專業加給預估) ---
    // 修正：階級名稱改為全稱
    rankDB: {
        '二兵': {base: 10550, pro: 0}, 
        '一兵': {base: 11130, pro: 0}, 
        '上兵': {base: 12280, pro: 0},
        '下士': {base: 14645, pro: 5500}, 
        '中士': {base: 16585, pro: 6200}, 
        '上士': {base: 18525, pro: 7000},
        '三等士官長': {base: 22750, pro: 8200}, 
        '二等士官長': {base: 25050, pro: 9500}, 
        '一等士官長': {base: 28880, pro: 10800},
        '少尉': {base: 22750, pro: 8500}, 
        '中尉': {base: 25050, pro: 9800}, 
        '上尉': {base: 28880, pro: 11500},
        '少校': {base: 32710, pro: 23000}, 
        '中校': {base: 37310, pro: 26000}, 
        '上校': {base: 41900, pro: 32000},
        '少將': {base: 48030, pro: 40000}
    },
    rankOrder: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校','少將'],

    // --- 工具函式 ---
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 初始化 ---
    init: () => {
        Chart.defaults.font.family = "'Noto Sans TC', sans-serif";
        Chart.defaults.color = '#64748b';

        // 注入選單
        const opts = APP.rankOrder.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;

        // 預設參數 (修正：加入獨立的 baseLiving 與 baseFixed 欄位)
        const def = {
            currentRank: '少尉', targetRank: '中校', serviceYears: 20, 
            inflationRate: 2.0, salaryRaiseRate: 1.0, returnRate: 6.0,
            buyHouseToggle: false, buyYear: 10, housePriceWan: 1200, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
            investSliderPct: 30,
            baseLiving: 15000, 
            baseFixed: 5000,
            allowances: [], expenses: [], investments: [] 
        };
        
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        
        // B 案預設參數差異
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

    // --- 介面互動 ---
    switch: s => {
        APP.save(); 
        APP.curr = s;
        document.getElementById('btn-A').className = s==='A' ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
        document.getElementById('btn-B').className = s==='B' ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
        APP.renderInputs(s);
        APP.calc();
    },

    save: () => {
        const d = APP.data[APP.curr];
        // 儲存一般欄位 (含 baseLiving, baseFixed)
        ['currentRank','targetRank','serviceYears','inflationRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','investSlider','baseLiving','baseFixed'].forEach(k => {
            const el = document.getElementById(k==='housePriceWan'?'housePrice':(k==='investSlider'?'investRate':k));
            if(el) d[k==='investSlider'?'investSliderPct':k] = k.includes('Rank')?el.value:APP.N(el.value);
        });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        d.allowances = APP.readList('allowance-list');
        d.expenses = APP.readList('expense-list');
        d.investments = APP.readList('invest-list');
    },

    renderInputs: s => {
        const d = APP.data[s];
        ['currentRank','targetRank','serviceYears','inflationRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','baseLiving','baseFixed'].forEach(k => {
            const el = document.getElementById(k==='housePriceWan'?'housePrice':k);
            if(el) el.value = d[k];
        });
        document.getElementById('investRate').value = d.investSliderPct;
        document.getElementById('investRateVal').innerText = d.investSliderPct+'%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        
        const h = document.getElementById('housing-opts');
        if(d.buyHouseToggle) h.classList.remove('hidden'); else h.classList.add('hidden');
    },

    // --- 動態列表處理 ---
    renderList: (id, list) => {
        const c = document.getElementById(id); c.innerHTML = '';
        list.forEach(i => {
            let ex = id==='allowance-list' ? `<input type="number" class="w-14 text-center bg-gray-50 text-xs" value="${i.start||1}">-<input type="number" class="w-14 text-center bg-gray-50 text-xs" value="${i.end||20}">` : '';
            c.innerHTML += `<div class="list-item"><input type="text" value="${i.name}" class="flex-1"><input type="number" value="${i.val}" class="w-20 text-right font-bold text-slate-700">${ex}<button onclick="this.parentElement.remove();app.calc()" class="text-red-400 font-bold px-2">✕</button></div>`;
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
        d.allowances = [{name:'志願役加給', val:15000, start:1, end:20}, {name:'勤務加給', val:5000, start:1, end:20}];
        APP.renderList('allowance-list', d.allowances); APP.calc();
    },

    // --- 核心邏輯層 (Logic Layer) ---
    run: d => {
        const N = APP.N;
        const years = N(d.serviceYears)||20, inf = 2.0/100, roi = N(d.returnRate)/100, pct = N(d.investSliderPct)/100;
        
        let rank = d.currentRank, rankY = 0;
        let invPool = 0, cashPool = 0;
        let house = 0, loan = 0, mPay = 0, hasHouse = false;
        
        const targetIdx = APP.rankOrder.indexOf(d.targetRank);
        const res = { years:[], net:[], invP:[], cashP:[], houseNet:[], flow:[], log:[] };
        
        // **修正重點**：正確計算總月支出 (基本生活+固定+列表額外)
        const staticMonthlyExp = N(d.baseLiving) + N(d.baseFixed);
        const dynamicMonthlyExp = d.expenses.reduce((s,x)=>s+N(x.val),0);
        const totalStartMonthlyExp = staticMonthlyExp + dynamicMonthlyExp;

        // 固定月投資
        const dynamicMonthlyInv = d.investments.reduce((s,x)=>s+N(x.val),0);

        for(let y=1; y<=years; y++) {
            // A. 晉升
            const rInfo = APP.rankDB[rank], rIdx = APP.rankOrder.indexOf(rank);
            if(y>1 && y%4===0 && rIdx<targetIdx) { rank = APP.rankOrder[rIdx+1]; rankY=0; } else rankY++;

            // B. 薪資
            const payBase = rInfo.base * Math.pow(1.015, rankY);
            let allow = 0; d.allowances.forEach(a => { if(y>=N(a.start) && y<=N(a.end)) allow+=N(a.val); });
            const netM = Math.round((payBase + rInfo.pro + allow)*0.95);

            // C. 房產
            let yMort = 0;
            if(d.buyHouseToggle && y===N(d.buyYear) && !hasHouse) {
                hasHouse = true; house = N(d.housePriceWan)*10000;
                const down = house*(N(d.downPaymentPct)/100); loan = house-down;
                if(cashPool>=down) cashPool-=down; else { const r=down-cashPool; cashPool=0; invPool-=r; }
                const r=N(d.mortgageRate)/100/12, n=N(d.loanTerm)*12; mPay = loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
            }
            if(hasHouse) {
                house *= (1+N(d.houseAppreciation)/100);
                if(loan>0) { yMort=mPay*12; loan-=(yMort-loan*(N(d.mortgageRate)/100)); if(loan<0)loan=0; }
            }

            // D. 金流 (含通膨影響)
            const yInc = netM * 13.5;
            // 支出隨通膨指數成長
            const yEx = totalStartMonthlyExp * Math.pow(1+inf, y-1) * 12; 
            // 投資投入 = (薪資提撥 + 固定投資)
            const yInvIn = (netM * pct + dynamicMonthlyInv) * 12; 
            // 結餘
            const ySur = yInc - yEx - yInvIn - yMort;

            // E. 滾存
            invPool = invPool * (1+roi) + yInvIn;
            cashPool += ySur;

            const houseNet = hasHouse ? Math.max(0, house-loan) : 0;
            const net = invPool + cashPool + houseNet;

            res.years.push('Y'+y); res.net.push(net); res.invP.push(invPool); res.cashP.push(cashPool); res.houseNet.push(houseNet); res.flow.push(ySur);
            res.log.push({y, rank, inc:yInc, ex:yEx, inv:yInvIn, mort:yMort, flow:ySur, invVal:invPool, net});
        }
        return res;
    },

    // --- 應用層 (UI) ---
    calc: () => {
        APP.save();
        const rA = APP.run(APP.data.A);
        const rB = APP.run(APP.data.B);
        const currR = APP.curr === 'A' ? rA : rB;
        
        // KPI
        const last = currR.net.length-1;
        document.getElementById('kpi-net-A').innerText = APP.F(rA.net[rA.net.length-1]);
        document.getElementById('kpi-net-B').innerText = APP.F(rB.net[rB.net.length-1]);
        const diff = rA.net[rA.net.length-1] - rB.net[rB.net.length-1];
        document.getElementById('kpi-diff').innerText = (diff>=0?'+':'') + APP.F(diff);
        document.getElementById('kpi-diff').className = `text-3xl font-black mt-2 mono ${diff>=0?'text-emerald-600':'text-red-600'}`;

        // Table
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        currR.log.forEach(x => {
            tb.innerHTML += `<tr>
                <td class="p-3 font-mono text-slate-400">${x.y}</td>
                <td class="p-3 font-bold text-slate-700">${x.rank}</td>
                <td class="p-3 text-right">${APP.F(x.inc)}</td>
                <td class="p-3 text-right text-red-500">${APP.F(x.ex)}</td>
                <td class="p-3 text-right text-emerald-600">${APP.F(x.inv)}</td>
                <td class="p-3 text-right font-bold ${x.flow<0?'text-red-600 bg-red-50':'text-blue-600 bg-blue-50'}">${APP.F(x.flow)}</td>
                <td class="p-3 text-right text-slate-500">${APP.F(x.invVal)}</td>
                <td class="p-3 text-right font-black text-slate-800">${APP.F(x.net)}</td>
            </tr>`;
        });

        APP.draw(rA, rB);
    },

    draw: (rA, rB) => {
        // 自動校正 X 軸長度，取兩者最長年限，避免圖表錯誤
        const maxLen = Math.max(rA.years.length, rB.years.length);
        const labels = Array.from({length: maxLen}, (_, i) => `Y${i+1}`);
        
        const currR = APP.curr === 'A' ? rA : rB;

        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '方案 A', data: rA.net, borderColor: '#2563eb', borderWidth: 3, tension: 0.3 },
                    { label: '方案 B', data: rB.net, borderColor: '#94a3b8', borderWidth: 2, borderDash: [5,5] }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'line',
            data: {
                labels: currR.years,
                datasets: [
                    { label: '投資', data: currR.invP, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, pointRadius:0 },
                    { label: '現金', data: currR.cashP, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, pointRadius:0 },
                    { label: '房產', data: currR.houseNet, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', fill: true, pointRadius:0 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

window.onload = APP.init;
