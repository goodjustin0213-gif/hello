/**
 * AIR FORCE FINANCIAL DSS - CORE V21.0 (Fixed)
 * 修正重點：列表同步邏輯、總支出驗算、A/B 切換穩定性
 */

const APP = {
    data: { A: {}, B: {} },
    curr: 'A',
    charts: {},

    // 階級全中文資料庫 (2025 預估)
    rankDB: {
        '二兵': {base: 10550, pro: 0}, '一兵': {base: 11130, pro: 0}, '上兵': {base: 12280, pro: 0},
        '下士': {base: 14645, pro: 5500}, '中士': {base: 16585, pro: 6200}, '上士': {base: 18525, pro: 7000},
        '三等士官長': {base: 22750, pro: 8200}, '二等士官長': {base: 25050, pro: 9500}, '一等士官長': {base: 28880, pro: 10800},
        '少尉': {base: 22750, pro: 8500}, '中尉': {base: 25050, pro: 9800}, '上尉': {base: 28880, pro: 11500},
        '少校': {base: 32710, pro: 23000}, '中校': {base: 37310, pro: 26000}, '上校': {base: 41900, pro: 32000},
        '少將': {base: 48030, pro: 40000}
    },
    rankOrder: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校','少將'],

    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    init: () => {
        Chart.defaults.font.family = "'Noto Sans TC', sans-serif";
        Chart.defaults.color = '#64748b';

        // 注入階級選單
        const opts = APP.rankOrder.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;

        // 初始化資料結構 (確保欄位齊全)
        const def = {
            currentRank: '少尉', targetRank: '中校', serviceYears: 20, 
            inflationRate: 2.0, salaryRaiseRate: 1.0, returnRate: 6.0,
            buyHouseToggle: false, buyYear: 10, housePriceWan: 1200, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
            investSliderPct: 30, baseLiving: 15000, baseFixed: 5000,
            allowances: [], expenses: [], investments: []
        };
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        
        // B 案預設差異
        APP.data.B.investSliderPct = 10;
        APP.data.B.returnRate = 1.5;

        // 綁定所有輸入框變動事件 -> 自動存檔並重算
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

    // --- 方案切換與資料存取 ---
    switch: s => {
        APP.save(); // 切換前強制存檔
        APP.curr = s;
        document.getElementById('btn-A').className = s==='A' ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
        document.getElementById('btn-B').className = s==='B' ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
        APP.renderInputs(s);
        APP.calc();
    },

    // 核心修正：save 必須讀取所有 DOM 狀態
    save: () => {
        const d = APP.data[APP.curr];
        ['currentRank','targetRank','serviceYears','inflationRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','investSlider','baseLiving','baseFixed'].forEach(k => {
            const el = document.getElementById(k==='housePriceWan'?'housePrice':(k==='investSlider'?'investSlider':k));
            if(el) d[k==='investSlider'?'investSliderPct':k] = k.includes('Rank')?el.value:APP.N(el.value);
        });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        
        // 儲存動態列表
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
        document.getElementById('investSlider').value = d.investSliderPct;
        document.getElementById('investRateVal').innerText = d.investSliderPct+'%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        
        const h = document.getElementById('housing-opts');
        if(d.buyHouseToggle) h.classList.remove('hidden'); else h.classList.add('hidden');
    },

    // --- 列表操作 (修正重點：操作前先 Save，操作後再 Render) ---
    addItem: (id) => {
        APP.save(); // 關鍵：先存當前畫面，避免新增時覆蓋掉剛剛打的字
        const list = id==='allowance-list' ? APP.data[APP.curr].allowances : (id==='expense-list' ? APP.data[APP.curr].expenses : APP.data[APP.curr].investments);
        
        // 預設值
        let newItem = {name:'新項目', val:0};
        if(id==='allowance-list') newItem = {name:'加給項目', val:5000, start:1, end:20};
        else if(id==='expense-list') newItem = {name:'額外支出', val:3000};
        else newItem = {name:'定期定額', val:3000};
        
        list.push(newItem);
        APP.renderList(id, list);
        APP.calc();
    },

    deleteItem: (id, idx) => {
        APP.save();
        const list = id==='allowance-list' ? APP.data[APP.curr].allowances : (id==='expense-list' ? APP.data[APP.curr].expenses : APP.data[APP.curr].investments);
        list.splice(idx, 1);
        APP.renderList(id, list);
        APP.calc();
    },

    renderList: (id, list) => {
        const c = document.getElementById(id); c.innerHTML = '';
        list.forEach((i, idx) => {
            let ex = id==='allowance-list' ? `<input type="number" class="w-14 text-center text-xs bg-slate-50" value="${i.start||1}">-<input type="number" class="w-14 text-center text-xs bg-slate-50" value="${i.end||20}">` : '';
            c.innerHTML += `
            <div class="list-item">
                <input type="text" value="${i.name}" class="flex-1 border-slate-300 text-sm">
                <input type="number" value="${i.val}" class="w-20 text-right font-bold text-slate-700 border-slate-300 text-sm">
                ${ex}
                <div class="btn-del" onclick="app.deleteItem('${id}', ${idx})">✕</div>
            </div>`;
        });
    },

    readList: id => {
        const arr = [];
        const container = document.getElementById(id);
        if (!container) return [];
        container.querySelectorAll('.list-item').forEach(r => {
            const inputs = r.querySelectorAll('input');
            if(id==='allowance-list') arr.push({name:inputs[0].value, val:APP.N(inputs[1].value), start:APP.N(inputs[2].value), end:APP.N(inputs[3].value)});
            else arr.push({name:inputs[0].value, val:APP.N(inputs[1].value)});
        });
        return arr;
    },

    loadDefaults: () => {
        const d = APP.data[APP.curr];
        d.allowances = [{name:'志願役加給', val:15000, start:1, end:20}, {name:'勤務加給', val:5000, start:1, end:20}];
        APP.renderList('allowance-list', d.allowances); APP.calc();
    },

    // --- 核心運算 ---
    run: d => {
        const N = APP.N;
        const years = N(d.serviceYears)||20, inf = 2.0/100, roi = N(d.returnRate)/100, pct = N(d.investSliderPct)/100;
        
        let rank = d.currentRank, rankY = 0;
        let invPool = 0, cashPool = 0;
        let house = 0, loan = 0, mPay = 0, hasHouse = false;
        
        const targetIdx = APP.rankOrder.indexOf(d.targetRank);
        const res = { years:[], net:[], invP:[], cashP:[], houseNet:[], flow:[], log:[] };
        
        // 修正：總支出計算 (基本+固定+列表)
        const staticMonthlyExp = N(d.baseLiving) + N(d.baseFixed);
        const dynamicMonthlyExp = d.expenses.reduce((s,x)=>s+N(x.val),0);
        const totalBaseMonthlyExp = staticMonthlyExp + dynamicMonthlyExp;
        
        // 即時顯示總支出供驗算
        if(d === APP.data[APP.curr]) {
            document.getElementById('disp-total-exp').innerText = APP.F(totalBaseMonthlyExp);
        }

        const dynamicInv = d.investments.reduce((s,x)=>s+N(x.val),0);
        if(d === APP.data[APP.curr]) {
             // 簡易估算第一年投資額 (月薪未定，先顯示固定部分)
             document.getElementById('disp-total-inv').innerText = APP.F(dynamicInv) + " + " + pct*100 + "%薪";
        }

        for(let y=1; y<=years; y++) {
            const rInfo = APP.rankDB[rank], rIdx = APP.rankOrder.indexOf(rank);
            if(y>1 && y%4===0 && rIdx<targetIdx) { rank = APP.rankOrder[rIdx+1]; rankY=0; } else rankY++;

            const payBase = rInfo.base * Math.pow(1.015, rankY);
            let allow = 0; d.allowances.forEach(a => { if(y>=N(a.start) && y<=N(a.end)) allow+=N(a.val); });
            const netM = Math.round((payBase + rInfo.pro + allow)*0.95);

            // 房產
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

            // 金流
            const yInc = netM * 13.5;
            const yEx = totalBaseMonthlyExp * Math.pow(1+inf, y-1) * 12; // 支出隨通膨
            const yInvIn = (netM * pct + dynamicInv) * 12; 
            const ySur = yInc - yEx - yInvIn - yMort;

            invPool = invPool * (1+roi) + yInvIn;
            cashPool += ySur;

            const houseNet = hasHouse ? Math.max(0, house-loan) : 0;
            const net = invPool + cashPool + houseNet;

            res.years.push('Y'+y); res.net.push(net); res.invP.push(invPool); res.cashP.push(cashPool); res.houseNet.push(houseNet); res.flow.push(ySur);
            res.log.push({y, rank, inc:yInc, ex:yEx, inv:yInvIn, mort:yMort, flow:ySur, invVal:invPool, net});
        }
        return res;
    },

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
        document.getElementById('kpi-diff').className = `text-3xl font-black mt-1 mono ${diff>=0?'text-emerald-600':'text-red-600'}`;

        // Table
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        currR.log.forEach(x => {
            tb.innerHTML += `<tr class="hover:bg-slate-50 transition border-b border-slate-50">
                <td class="p-3 text-center font-mono text-slate-400">${x.y}</td>
                <td class="p-3 font-bold text-slate-700">${x.rank}</td>
                <td class="p-3 text-right text-slate-600">${APP.F(x.inc)}</td>
                <td class="p-3 text-right text-red-500">${APP.F(x.ex)}</td>
                <td class="p-3 text-right text-emerald-600 font-medium">${APP.F(x.inv)}</td>
                <td class="p-3 text-right font-bold ${x.flow<0?'text-red-600':'text-blue-600'}">${APP.F(x.flow)}</td>
                <td class="p-3 text-right text-slate-500">${APP.F(x.invVal)}</td>
                <td class="p-3 text-right font-black text-slate-800">${APP.F(x.net)}</td>
            </tr>`;
        });

        APP.draw(rA, rB);
    },

    draw: (rA, rB) => {
        // 修正：座標軸對齊最長年份
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
