/**
 * AIR FORCE FINANCIAL DSS - CORE V22.0 (Reality Check)
 * 特色：
 * 1. 實領月薪校正 (Override Logic)
 * 2. 年資加給運算 (Seniority Logic)
 * 3. 嚴格列表同步 (Sync Logic)
 */

const APP = {
    data: { A: {}, B: {} },
    curr: 'A',
    charts: {},

    // 資料庫：2025 預估本俸 (不含加給，加給由使用者校正或系統估算)
    // 來源：依據現行俸表結構簡化
    rankDB: {
        '二兵': {base: 10550, max: 1}, '一兵': {base: 11130, max: 1}, '上兵': {base: 12280, max: 10},
        '下士': {base: 14645, max: 10}, '中士': {base: 16585, max: 12}, '上士': {base: 18525, max: 20},
        '三等士官長': {base: 22750, max: 24}, '二等士官長': {base: 25050, max: 26}, '一等士官長': {base: 28880, max: 30},
        '少尉': {base: 22750, max: 10}, '中尉': {base: 25050, max: 12}, '上尉': {base: 28880, max: 17},
        '少校': {base: 32710, max: 22}, '中校': {base: 37310, max: 26}, '上校': {base: 41900, max: 30},
        '少將': {base: 48030, max: 35}
    },
    rankOrder: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校','少將'],

    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    init: () => {
        Chart.defaults.font.family = "'Noto Sans TC', sans-serif";
        Chart.defaults.color = '#64748b';

        // 注入選單
        const opts = APP.rankOrder.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;

        // 初始化 A/B 案
        const def = {
            currentRank: '少尉', targetRank: '中校', 
            pastYears: 0, // 新增：已服役年資
            futureYears: 20, 
            realMonthlyPay: 0, // 新增：實領校正
            inflation: 2.0, roi: 6.0,
            buyHouseToggle: false, buyYear: 10, housePrice: 1200, downPayment: 20, loanRate: 2.2, loanYears: 30,
            investRate: 30, totalExpense: 18000,
            allowances: [], investments: []
        };
        
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        // B 案差異：低投資回報
        APP.data.B.investRate = 10; APP.data.B.roi = 1.5;

        // 綁定事件 (自動存檔與重算)
        document.body.addEventListener('input', e => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') APP.calc();
        });
        document.getElementById('buyHouse').addEventListener('change', e => {
            document.getElementById('housing-opts').classList.toggle('hidden', !e.target.checked);
            APP.calc();
        });

        APP.renderInputs('A');
        setTimeout(APP.calc, 200);
    },

    // --- 介面邏輯 ---
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
        // 儲存所有 ID 對應的欄位
        ['currentRank','targetRank','pastYears','futureYears','realMonthlyPay','totalExpense','investRate','roi','inflation','buyYear','housePrice','downPayment','loanRate','loanYears'].forEach(k => {
            const el = document.getElementById(k);
            if(el) d[k] = k.includes('Rank') ? el.value : APP.N(el.value);
        });
        d.buyHouseToggle = document.getElementById('buyHouse').checked;
        d.allowances = APP.readList('allowance-list');
        d.investments = APP.readList('invest-list');
    },

    renderInputs: s => {
        const d = APP.data[s];
        ['currentRank','targetRank','pastYears','futureYears','realMonthlyPay','totalExpense','investRate','roi','inflation','buyYear','housePrice','downPayment','loanRate','loanYears'].forEach(k => {
            const el = document.getElementById(k);
            if(el) el.value = d[k];
        });
        document.getElementById('buyHouse').checked = d.buyHouseToggle;
        document.getElementById('housing-opts').className = d.buyHouseToggle ? "space-y-2 pl-2 border-l-2 border-slate-300" : "hidden";
        
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('invest-list', d.investments);
    },

    // --- 列表邏輯 ---
    addItem: (id) => {
        APP.save(); // 關鍵：先存檔
        const list = id==='allowance-list' ? APP.data[APP.curr].allowances : APP.data[APP.curr].investments;
        list.push({name:'新項目', val:0});
        APP.renderList(id, list);
        APP.calc();
    },
    
    renderList: (id, list) => {
        const c = document.getElementById(id); c.innerHTML = '';
        list.forEach((i, idx) => {
            c.innerHTML += `
            <div class="list-item">
                <input type="text" value="${i.name}" class="flex-1 border-slate-300 text-sm">
                <input type="number" value="${i.val}" class="w-20 text-right border-slate-300 text-sm font-bold text-slate-700">
                <button onclick="app.delItem('${id}',${idx})" class="text-red-400 font-bold px-2">✕</button>
            </div>`;
        });
    },
    
    delItem: (id, idx) => {
        APP.save();
        const list = id==='allowance-list' ? APP.data[APP.curr].allowances : APP.data[APP.curr].investments;
        list.splice(idx, 1);
        APP.renderList(id, list);
        APP.calc();
    },

    readList: id => {
        const arr = [];
        document.getElementById(id).querySelectorAll('.list-item').forEach(r => {
            const inputs = r.querySelectorAll('input');
            arr.push({name:inputs[0].value, val:APP.N(inputs[1].value)});
        });
        return arr;
    },

    // --- 核心運算 (Reality Check Engine) ---
    run: d => {
        const N = APP.N;
        const years = N(d.futureYears)||20;
        const startYears = N(d.pastYears); // 已服役年資
        const inf = N(d.inflation)/100, roi = N(d.roi)/100, pct = N(d.investRate)/100;
        
        let rank = d.currentRank;
        let rankY = startYears; // 當前年資
        
        // 薪資校正邏輯
        const userRealPay = N(d.realMonthlyPay);
        const dbStartBase = APP.rankDB[rank].base;
        // 如果使用者有輸入實領薪資，計算「校正係數 (Correction Factor)」
        // 假設實領 50000，資料庫本俸 22750，係數 = 2.19
        // 未來每一年我們都用本俸 * 係數來估算，這樣比純用資料庫準
        let correctionFactor = 1.0;
        // 基本加給總和
        let manualAllowances = d.allowances.reduce((s,x)=>s+N(x.val),0);
        
        if (userRealPay > 0) {
            // 如果輸入實領，我們假設 (本俸 + 固定加給) * 係數 = 實領
            // 這裡簡化：係數 = 實領 / 本俸 (把所有加給都當作薪資倍率處理)
            correctionFactor = userRealPay / dbStartBase;
        }

        let invPool = 0, cashPool = 0;
        let house = 0, loan = 0, mPay = 0, hasHouse = false;
        
        const targetIdx = APP.rankOrder.indexOf(d.targetRank);
        const res = { years:[], net:[], invP:[], cashP:[], houseNet:[], log:[] };
        
        // 總支出 (含通膨)
        const baseExp = N(d.totalExpense);
        const baseInv = d.investments.reduce((s,x)=>s+N(x.val),0);

        for(let y=1; y<=years; y++) {
            // A. 晉升
            const rInfo = APP.rankDB[rank], rIdx = APP.rankOrder.indexOf(rank);
            if(y>1 && y%4===0 && rIdx<targetIdx) { rank = APP.rankOrder[rIdx+1]; } // 晉升
            
            // 年資增加 (影響年功俸)
            // 假設每年本俸依年資自然成長 1.5%
            const payBase = rInfo.base * Math.pow(1.015, (rankY + y));
            
            // B. 收入計算
            let monthIncome = 0;
            if (userRealPay > 0) {
                // 使用校正模式：薪資 = 本俸 * 係數
                monthIncome = payBase * correctionFactor;
            } else {
                // 使用資料庫模式：薪資 = 本俸 + 專業 + 志願役(預設15000) + 手動加給
                // 這裡假設專業加給平均約本俸 30%
                const pro = rInfo.pro || (payBase * 0.3);
                monthIncome = payBase + pro + 15000 + manualAllowances;
            }
            
            const annualIncome = monthIncome * 13.5;

            // C. 房產
            let yMort = 0;
            if(d.buyHouseToggle && y===N(d.buyYear) && !hasHouse) {
                hasHouse = true; house = N(d.housePrice)*10000;
                const down = house*(N(d.downPayment)/100); loan = house-down;
                if(cashPool>=down) cashPool-=down; else { const r=down-cashPool; cashPool=0; invPool-=r; }
                const r=N(d.loanRate)/100/12, n=N(d.loanYears)*12; 
                mPay = loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
            }
            if(hasHouse) {
                // 房產不計增值以求保守
                if(loan>0) { yMort=mPay*12; loan-=(yMort-loan*(N(d.loanRate)/100)); if(loan<0)loan=0; }
            }

            // D. 支出與分配
            const yEx = baseExp * Math.pow(1+inf, y-1) * 12; // 通膨
            const yInvIn = (monthIncome * pct + baseInv) * 12; 
            const ySur = annualIncome - yEx - yInvIn - yMort;

            // E. 滾存
            invPool = invPool * (1+roi) + yInvIn;
            cashPool += ySur;

            const houseNet = hasHouse ? Math.max(0, house-loan) : 0;
            const net = invPool + cashPool + houseNet;

            res.years.push(y); res.net.push(net); res.invP.push(invPool); res.cashP.push(cashPool); res.houseNet.push(houseNet);
            res.log.push({y, rank, inc:annualIncome, ex:yEx, inv:yInvIn, mort:yMort, cash:cashPool, net});
        }
        return res;
    },

    // --- UI ---
    calc: () => {
        APP.save();
        const rA = APP.run(APP.data.A);
        const rB = APP.run(APP.data.B);
        const currR = APP.curr === 'A' ? rA : rB;
        
        const last = currR.net.length-1;
        document.getElementById('kpi-net-A').innerText = APP.F(rA.net[rA.net.length-1]);
        document.getElementById('kpi-net-B').innerText = APP.F(rB.net[rB.net.length-1]);
        const diff = rA.net[rA.net.length-1] - rB.net[rB.net.length-1];
        document.getElementById('kpi-diff').innerText = (diff>=0?'+':'') + APP.F(diff);
        document.getElementById('kpi-diff').className = `text-3xl font-black mt-1 mono ${diff>=0?'text-emerald-600':'text-red-600'}`;

        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        currR.log.forEach(x => {
            tb.innerHTML += `<tr>
                <td class="p-3 text-center text-slate-400 font-mono">${x.y}</td>
                <td class="p-3 font-bold text-slate-700">${x.rank}</td>
                <td class="p-3 text-right text-blue-600">${APP.F(x.inc)}</td>
                <td class="p-3 text-right text-red-500">${APP.F(x.ex)}</td>
                <td class="p-3 text-right text-emerald-600">${APP.F(x.inv)}</td>
                <td class="p-3 text-right text-orange-500">${APP.F(x.mort)}</td>
                <td class="p-3 text-right font-black text-slate-800">${APP.F(x.net)}</td>
            </tr>`;
        });

        APP.draw(rA, rB);
    },

    draw: (rA, rB) => {
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
            type: 'bar',
            data: {
                labels: currR.years.map(y=>'Y'+y),
                datasets: [
                    { label: '房產淨值', data: currR.houseNet, backgroundColor: '#f97316', stack: 's1' },
                    { label: '投資', data: currR.invP, backgroundColor: '#10b981', stack: 's1' },
                    { label: '現金', data: currR.cashP, backgroundColor: '#3b82f6', stack: 's1' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

window.onload = APP.init;
