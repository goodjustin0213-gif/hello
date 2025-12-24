/**
 * AIR FORCE FINANCIAL DSS - CORE V15.0
 * 全中文階級精算引擎
 */

const APP = {
    data: { A: {}, B: {} },
    curr: 'A',
    charts: {},
    
    // 全中文階級薪資與晉升資料
    rankData: {
        '二兵': {base: 6530,  add: 30000, max: 1},
        '一兵': {base: 7120,  add: 31000, max: 1},
        '上兵': {base: 7710,  add: 32000, max: 10},
        '下士': {base: 14645, add: 26000, max: 2},
        '中士': {base: 16585, add: 28000, max: 3},
        '上士': {base: 18525, add: 30000, max: 15},
        '三等士官長': {base: 22750, add: 33000, max: 20},
        '二等士官長': {base: 25050, add: 35000, max: 25},
        '一等士官長': {base: 28880, add: 38000, max: 30},
        '少尉': {base: 22750, add: 28000, max: 2},
        '中尉': {base: 25050, add: 30000, max: 3},
        '上尉': {base: 28880, add: 35000, max: 15},
        '少校': {base: 32710, add: 45000, max: 20},
        '中校': {base: 37310, add: 55000, max: 24},
        '上校': {base: 41900, add: 65000, max: 28},
        '少將': {base: 48030, add: 75000, max: 35}
    },

    ranks: [
        '二兵','一兵','上兵',
        '下士','中士','上士','三等士官長','二等士官長','一等士官長',
        '少尉','中尉','上尉','少校','中校','上校','少將'
    ],

    N: v => { const n = parseFloat(String(v).replace(/,/g,'')); return isNaN(n)?0:n; },
    F: n => Math.round(n).toLocaleString('en-US'),

    init: () => {
        // 注入選單
        const sel = document.getElementById('targetRank');
        sel.innerHTML = APP.ranks.map(r => `<option value="${r}">${r}</option>`).join('');

        const def = {
            targetRank:'上尉', serviceYears:20, inflationRate:2, salaryRaiseRate:1, returnRate:6,
            buyHouseToggle:false, buyYear:10, housePriceWan:1500, downPaymentPct:20, mortgageRate:2.2, loanTerm:30, houseAppreciation:1.5,
            investSliderPct:30, allowances:[], expenses:[{name:'生活開銷',val:12000}], investments:[{name:'儲蓄險',val:3000}]
        };
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        APP.data.B.returnRate = 4;

        APP.renderInputs('A');
        setTimeout(APP.calc, 200);
    },

    switch: s => {
        APP.save(); APP.curr = s;
        document.getElementById('btn-A').className = s==='A' ? 'btn-blue' : 'btn-white text-slate-500';
        document.getElementById('btn-B').className = s==='B' ? 'btn-blue' : 'btn-white text-slate-500';
        APP.renderInputs(s); APP.calc();
    },

    save: () => {
        const d = APP.data[APP.curr];
        ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation','investSlider'].forEach(k => {
            const el = document.getElementById(k === 'investSlider' ? 'investSlider' : k);
            if(el) d[k==='investSlider'?'investSliderPct':k] = k==='targetRank'?el.value:APP.N(el.value);
        });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        d.allowances = APP.readList('allowance-list');
        d.expenses = APP.readList('expense-list');
        d.investments = APP.readList('invest-list');
    },

    renderInputs: s => {
        const d = APP.data[s];
        ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation'].forEach(k => document.getElementById(k).value = d[k]);
        document.getElementById('investSlider').value = d.investSliderPct;
        document.getElementById('slider-val').innerText = d.investSliderPct+'%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        document.getElementById('housing-inputs').className = d.buyHouseToggle ? "grid grid-cols-2 gap-2 mt-3" : "hidden";
    },

    renderList: (id, list) => {
        const c = document.getElementById(id); c.innerHTML = '';
        list.forEach(i => {
            let ex = id==='allowance-list' ? `<input type="number" class="w-10 text-center" value="${i.start||1}">-<input type="number" class="w-10 text-center" value="${i.end||20}">` : '';
            c.innerHTML += `<div class="list-item flex gap-2 mb-1"><input type="text" value="${i.name}" class="flex-1"><input type="number" value="${i.val}" class="w-16 text-right">${ex}<button onclick="this.parentElement.remove();app.calc()" class="text-rose-400">✕</button></div>`;
        });
    },

    readList: id => {
        const arr = [];
        document.getElementById(id).querySelectorAll('.list-item').forEach(r => {
            const i = r.querySelectorAll('input');
            if(id==='allowance-list') arr.push({name:i[0].value, val:APP.N(i[1].value), start:APP.N(i[2].value), end:APP.N(i[3].value)});
            else arr.push({name:i[0].value, val:APP.N(i[1].value)});
        });
        return arr;
    },

    addItem: id => {
        const l = id==='allowance-list'?APP.data[APP.curr].allowances:(id==='expense-list'?APP.data[APP.curr].expenses:APP.data[APP.current].investments);
        l.push({name:'項目', val:0, start:1, end:20}); APP.renderList(id, l); APP.calc();
    },

    loadAFData: () => {
        const presets = [{name:'空勤加給', val:25000, start:1, end:20}];
        APP.data[APP.curr].allowances = presets; APP.renderList('allowance-list', presets); APP.calc();
    },

    run: d => {
        const years = APP.N(d.serviceYears)||20, inf = APP.N(d.inflationRate)/100, raise = APP.N(d.salaryRaiseRate)/100, roi = APP.N(d.returnRate)/100, pct = APP.N(d.investSliderPct)/100;
        let rank = d.targetRank.includes('兵')?'二兵':(d.targetRank.includes('士')?'下士':'少尉'), rankY = 0, invP = 0, cashP = 0, house = 0, loan = 0, mPay = 0, hasHouse = false;
        const targetIdx = APP.ranks.indexOf(d.targetRank);
        const res = { years:[], net:[], invP:[], cashP:[], houseNet:[], log:[] };
        const baseExp = d.expenses.reduce((s,x)=>s+APP.N(x.val),0), baseInv = d.investments.reduce((s,x)=>s+APP.N(x.val),0);

        for(let y=1; y<=years; y++) {
            const rInfo = APP.rankData[rank];
            if(y>1 && rankY>=rInfo.max && APP.ranks.indexOf(rank)<targetIdx) { rank = APP.ranks[APP.ranks.indexOf(rank)+1]; rankY=0; } else rankY++;

            const pay = (APP.rankData[rank].base + APP.rankData[rank].add) * Math.pow(1.015, Math.min(rankY,10)) * Math.pow(1+raise, y-1);
            let allow = 0; d.allowances.forEach(a => { if(y>=APP.N(a.start) && y<=APP.N(a.end)) allow+=APP.N(a.val); });
            const netM = Math.round((pay + 15000 + allow) * 0.95);

            let yMort = 0;
            if(d.buyHouseToggle && y===APP.N(d.buyYear) && !hasHouse) {
                hasHouse = true; house = APP.N(d.housePriceWan)*10000;
                const down = house*(APP.N(d.downPaymentPct)/100); loan = house-down;
                if(cashP>=down) cashP-=down; else { const r=down-cashP; cashP=0; invP-=r; }
                const r=APP.N(d.mortgageRate)/100/12, n=APP.N(d.loanTerm)*12; mPay = loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
            }
            if(hasHouse) {
                house *= (1+APP.N(d.houseAppreciation)/100);
                if(loan>0) { yMort=mPay*12; loan-=(yMort-loan*(APP.N(d.mortgageRate)/100)); if(loan<0)loan=0; }
            }

            const yInc = netM * 13.5, yEx = baseExp*Math.pow(1+inf, y-1)*12, yInvIn = (netM*pct + baseInv)*12, ySur = yInc-yEx-yInvIn-yMort;
            invP = invP*(1+roi)+yInvIn; cashP += ySur;
            const net = invP + cashP + Math.max(0, house-loan);

            res.log.push({y, rank, inc:yInc, ex:yEx, inv:yInvIn, mort:yMort, flow:ySur, invP, cash:cashP, hNet:Math.max(0,house-loan), net});
            res.years.push(y); res.net.push(net); res.invP.push(invP); res.cashP.push(cashP); res.houseNet.push(Math.max(0,house-loan));
        }
        res.pension = Math.round(APP.rankData[rank].base * 2 * (0.55 + Math.max(0, years-20)*0.02));
        return res;
    },

    calc: () => {
        APP.save();
        const rA = APP.run(APP.data.A), rB = APP.run(APP.data.B);
        APP.ui(APP.curr==='A'?rA:rB, APP.curr==='A'?rB:rA);
    },

    ui: (r, c) => {
        const last = r.log.length-1;
        document.getElementById('kpi-asset').innerText = APP.F(r.net[last]);
        document.getElementById('kpi-invest').innerText = APP.F(r.invP[last]);
        document.getElementById('kpi-pension').innerText = APP.F(r.pension);
        
        const diff = r.net[last]-c.net[last];
        document.getElementById('kpi-diff').innerHTML = `差異: <span class="${diff>=0?'text-emerald-500':'text-rose-500'}">${diff>0?'+':''}${APP.F(diff)}</span>`;

        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        r.log.forEach(x => {
            tb.innerHTML += `<tr><td>${x.y}</td><td class="font-bold">${x.rank}</td><td>${APP.F(x.inc)}</td><td class="text-rose-400">${APP.F(x.ex)}</td><td class="text-emerald-500">${APP.F(x.inv)}</td><td class="${x.flow<0?'text-rose-500':''}">${APP.F(x.flow)}</td><td>${APP.F(x.invP)}</td><td>${APP.F(x.cash)}</td><td>${APP.F(x.hNet)}</td><td class="bg-indigo-50 font-bold">${APP.F(x.net)}</td></tr>`;
        });
        APP.draw(r, c);
    },

    draw: (r, c) => {
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: r.years.map(y=>'Y'+y),
                datasets: [
                    { label: '本方案', data: r.net, borderColor: '#818cf8', borderWidth: 3, fill: true, backgroundColor: 'rgba(129, 140, 248, 0.1)', tension: 0.4, pointRadius: 0 },
                    { label: '對照組', data: c.net, borderColor: '#cbd5e1', borderDash: [5,5], tension: 0.4, pointRadius: 0 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'line',
            data: {
                labels: r.years.map(y=>'Y'+y),
                datasets: [
                    { label: '投資', data: r.invP, borderColor: '#6ee7b7', fill: true, backgroundColor: 'rgba(110, 231, 183, 0.2)', pointRadius: 0 },
                    { label: '現金', data: r.cashP, borderColor: '#93c5fd', fill: true, backgroundColor: 'rgba(147, 197, 253, 0.2)', pointRadius: 0 },
                    { label: '房產', data: r.houseNet, borderColor: '#fdba74', fill: true, backgroundColor: 'rgba(253, 186, 116, 0.2)', pointRadius: 0 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { stacked: true } } }
        });
    }
};

window.onload = APP.init;
window.app = APP;
