/**
 * AIR FORCE FINANCIAL DSS - CORE V13.0 (Data First Edition)
 * Focus: Stability, Performance, Correct Calculation
 */

const APP = {
    // 資料儲存區
    data: { A: {}, B: {} },
    curr: 'A',
    charts: {},
    
    // 軍職薪資結構 (2025基準)
    ranks: ['S2','S3','S4','M1','M2','M3','G1'],
    salary: {
        'S2': {b:22750, a:28000, m:12}, 
        'S3': {b:25050, a:30000, m:12},
        'S4': {b:28880, a:35000, m:17}, 
        'M1': {b:32710, a:45000, m:22},
        'M2': {b:37310, a:55000, m:26}, 
        'M3': {b:41900, a:65000, m:30},
        'G1': {b:48030, a:70000, m:35}
    },

    // --- 工具函式 ---
    // N: 強制轉數值 (防呆核心)
    N: v => { 
        if(!v) return 0; 
        const n = parseFloat(String(v).replace(/,/g,'')); 
        return isNaN(n) ? 0 : n; 
    },
    // F: 千分位格式化
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 初始化 ---
    init: () => {
        // 全域圖表設定
        Chart.defaults.font.family = "'Noto Sans TC', sans-serif";
        Chart.defaults.color = '#64748b';
        Chart.defaults.borderColor = '#e2e8f0';

        // 預設參數
        const def = {
            targetRank:'M2', serviceYears:20, inflationRate:2, salaryRaiseRate:1, returnRate:6,
            buyHouseToggle:false, buyYear:10, housePriceWan:1500, downPaymentPct:20, mortgageRate:2.2, loanTerm:30, houseAppreciation:1.5,
            investSliderPct:30, 
            allowances:[], 
            expenses:[{name:'生活費',val:12000}], 
            investments:[{name:'儲蓄險',val:3000}]
        };
        
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        APP.data.B.returnRate = 4; 
        APP.data.B.investSliderPct = 50;

        // 綁定全域輸入事件 (即時運算)
        document.body.addEventListener('input', e => {
            if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT') APP.calc();
        });

        APP.renderInputs('A');
        
        // 延遲一下確保畫面渲染完畢再畫圖
        setTimeout(APP.calc, 200);
    },

    // --- 介面操作 ---
    switch: s => {
        APP.save(); 
        APP.curr = s;
        
        // 按鈕樣式切換
        const btnA = document.getElementById('btn-A');
        const btnB = document.getElementById('btn-B');
        if(s==='A') {
            btnA.className = 'py-2 text-sm font-bold rounded-md bg-white text-indigo-600 shadow-sm';
            btnB.className = 'py-2 text-sm font-bold rounded-md text-slate-500';
        } else {
            btnB.className = 'py-2 text-sm font-bold rounded-md bg-white text-indigo-600 shadow-sm';
            btnA.className = 'py-2 text-sm font-bold rounded-md text-slate-500';
        }
        
        APP.renderInputs(s); 
        APP.calc();
    },

    // 儲存當前畫面數據
    save: () => {
        const d = APP.data[APP.curr];
        ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation','investSlider'].forEach(k => {
            const el = document.getElementById(k); 
            if(el) d[k==='investSlider'?'investSliderPct':k] = k==='targetRank'?el.value:APP.N(el.value);
        });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        d.allowances = APP.readList('allowance-list'); // 讀取加給列表
        d.expenses = APP.readList('expense-list');     // 讀取支出列表
        d.investments = APP.readList('invest-list');   // 讀取固定投資
    },

    // 渲染數據到畫面
    renderInputs: s => {
        const d = APP.data[s];
        ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation'].forEach(k => {
            const el = document.getElementById(k);
            if(el) el.value = d[k];
        });
        
        document.getElementById('investSlider').value = d.investSliderPct;
        document.getElementById('slider-val').innerText = d.investSliderPct+'%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        
        const h = document.getElementById('housing-inputs');
        if(d.buyHouseToggle) { h.classList.remove('hidden'); h.classList.add('grid'); } 
        else { h.classList.add('hidden'); h.classList.remove('grid'); }
    },

    // --- 動態列表管理 ---
    renderList: (id, list) => {
        const c = document.getElementById(id); 
        c.innerHTML = '';
        list.forEach(i => {
            // 加給項目多兩個欄位：開始年、結束年
            let ex = id==='allowance-list' ? 
                `<input type="number" class="w-12 text-center" value="${i.start||1}">-<input type="number" class="w-12 text-center" value="${i.end||20}">` : '';
            c.innerHTML += `
            <div class="list-item">
                <input type="text" value="${i.name}" class="flex-1 min-w-0">
                <input type="number" value="${i.val}" class="w-20 text-right font-bold text-slate-700">
                ${ex}
                <button onclick="this.parentElement.remove();app.calc()" class="text-red-400 font-bold px-2 hover:bg-red-50 rounded">✕</button>
            </div>`;
        });
    },
    
    readList: id => {
        const arr = [];
        document.getElementById(id).querySelectorAll('.list-item').forEach(r => {
            const i = r.querySelectorAll('input');
            if(id==='allowance-list') {
                arr.push({name:i[0].value, val:APP.N(i[1].value), start:APP.N(i[2].value), end:APP.N(i[3].value)});
            } else {
                arr.push({name:i[0].value, val:APP.N(i[1].value)});
            }
        });
        return arr;
    },
    
    addItem: id => {
        const l = id==='allowance-list'?APP.data[APP.curr].allowances:(id==='expense-list'?APP.data[APP.curr].expenses:APP.data[APP.curr].investments);
        l.push({name:'新項目', val:0, start:1, end:20}); 
        APP.renderList(id, l); 
        APP.calc();
    },
    
    presetAirForce: () => {
        const d = APP.data[APP.curr];
        d.allowances = [
            {name:'空勤(初)',val:22000,start:1,end:5},
            {name:'空勤(中)',val:45000,start:6,end:15},
            {name:'空勤(高)',val:68000,start:16,end:25}
        ];
        APP.renderList('allowance-list', d.allowances); 
        APP.calc();
    },

    // --- 核心運算邏輯 (Investment Pool Algorithm) ---
    run: d => {
        const N = APP.N;
        const years = N(d.serviceYears)||20, inf = N(d.inflationRate)/100, raise = N(d.salaryRaiseRate)/100, roi = N(d.returnRate)/100, pct = N(d.investSliderPct)/100;
        
        let rank = 'S2', rankY = 0;
        let invPool = 0, cashPool = 0; // 資金池分離
        let house = 0, loan = 0, hasHouse = false;
        
        const targetIdx = APP.ranks.indexOf(d.targetRank);
        const res = { years:[], net:[], real:[], house:[], loan:[], invPool:[], cashPool:[], inc:[], exp:[], inv:[], mort:[], flow:[], logs:[] };
        
        const baseExp = d.expenses.reduce((s,x)=>s+N(x.val),0);
        const baseInv = d.investments.reduce((s,x)=>s+N(x.val),0);

        for(let y=1; y<=years; y++) {
            // 1. 晉升
            const rInfo = APP.salary[rank], rIdx = APP.ranks.indexOf(rank);
            if(y>1 && y%4===0 && rIdx<targetIdx && rankY<rInfo.max) { rank = APP.ranks[rIdx+1]; rankY=0; } else rankY++;

            // 2. 收入
            const payBase = (APP.salary[rank].base + APP.salary[rank].add) * Math.pow(1.015, rankY) * Math.pow(1+raise, y-1);
            let allow = 0; 
            d.allowances.forEach(a => { if(y>=N(a.start) && y<=N(a.end)) allow+=N(a.val); });
            const netM = Math.round((payBase + 15000 + allow)*0.95);

            // 3. 房產與房貸
            let yMort = 0, mPay = 0;
            if(d.buyHouseToggle && y===N(d.buyYear) && !hasHouse) {
                hasHouse = true; house = N(d.housePriceWan)*10000;
                const down = house*(N(d.downPaymentPct)/100); loan = house-down;
                // 頭期款扣款順序：現金 -> 投資
                if(cashPool>=down) cashPool-=down; else { const r=down-cashPool; cashPool=0; invPool-=r; }
                
                const r=N(d.mortgageRate)/100/12, n=N(d.loanTerm)*12; 
                mPay = loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
            }
            if(hasHouse) {
                house *= (1+N(d.houseAppreciation)/100);
                if(loan>0) { 
                    // 簡化：重新計算當期本息 (若需精確應紀錄當年mPay)
                    const r=N(d.mortgageRate)/100/12, n=N(d.loanTerm)*12; 
                    if(mPay===0) mPay = loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1) || 0;
                    yMort=mPay*12; 
                    loan-=(yMort-loan*(N(d.mortgageRate)/100)); 
                    if(loan<0)loan=0; 
                }
            }

            // 4. 收支分配
            const yInc = netM * 13.5;
            const yEx = baseExp * Math.pow(1+inf, y-1) * 12;
            const yInvIn = (netM * pct + baseInv) * 12; // 投入投資池
            const ySur = yInc - yEx - yInvIn - yMort;   // 投入現金池

            // 5. 滾存
            invPool = invPool * (1+roi) + yInvIn;
            cashPool = cashPool + ySur;
            const net = invPool + cashPool + house - loan;

            // 6. 紀錄
            res.years.push('Y'+y); res.net.push(net); res.real.push(net/Math.pow(1+inf, y));
            res.invPool.push(invPool); res.cashPool.push(cashPool); res.house.push(house); res.loan.push(loan);
            res.inc.push(yInc); res.exp.push(yEx); res.inv.push(yInvIn); res.mort.push(yMort); res.flow.push(ySur);
            res.logs.push({y, rank, inc:yInc, exp:yEx, inv:yInvIn, invP:invPool, cash:cashPool, flow:ySur, net});
        }
        res.pension = Math.round(APP.salary[rank].base * 2 * (0.55 + Math.max(0, years-20)*0.02));
        return res;
    },

    // --- 繪圖與 UI 更新 ---
    calc: () => {
        APP.save();
        const rA = APP.run(APP.data.A), rB = APP.run(APP.data.B);
        APP.ui(APP.curr==='A'?rA:rB, APP.curr==='A'?rB:rA);
    },

    ui: (r, c) => {
        const l = r.net.length-1;
        // KPI 更新
        document.getElementById('kpi-asset').innerText = APP.F(r.net[l]);
        document.getElementById('kpi-pension').innerText = APP.F(r.pension);
        const diff = r.net[l] - c.net[l];
        document.getElementById('kpi-diff').innerHTML = `與對照組差異: <span class="${diff>=0?'text-emerald-600':'text-rose-600'}">${diff>0?'+':''}${APP.F(diff)}</span>`;
        
        const hDiv = document.getElementById('kpi-house');
        hDiv.innerHTML = APP.data[APP.curr].buyHouseToggle ? 
            `市值 <span class="text-orange-500">${APP.F(r.house[l])}</span> / 貸 <span class="text-rose-500">-${APP.F(r.loan[l])}</span>` : "未啟用";

        // 表格更新
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        r.logs.forEach(x => {
            tb.innerHTML += `<tr class="border-b border-slate-100 hover:bg-slate-50"><td class="py-2 px-6 text-slate-400 font-bold">Y${x.y}</td><td class="font-bold text-indigo-700">${x.rank}</td><td class="text-right">${APP.F(x.inc)}</td><td class="text-right text-red-400">${APP.F(x.exp)}</td><td class="text-right text-emerald-500 font-bold">${APP.F(x.inv)}</td><td class="text-right text-indigo-500">${APP.F(x.invP)}</td><td class="text-right text-slate-400">${APP.F(x.flow)}</td><td class="text-right font-black text-slate-800 px-6">${APP.F(x.net)}</td></tr>`;
        });

        APP.chart(r, c);
    },

    chart: (r, c) => {
        // 色票定義
        const C = { p: '#a8edea', s: '#fed6e3', t: '#e2d1c3', i: '#6366f1', e: '#10b981', r: '#f43f5e', o: '#f97316' };
        
        const mkChart = (id, type, data, opt={}) => {
            if(APP.charts[id]) APP.charts[id].destroy();
            const cvs = document.getElementById(id);
            if(!cvs) return;
            APP.charts[id] = new Chart(cvs, {
                type, data: { labels: r.years, datasets: data },
                options: { 
                    responsive: true, maintainAspectRatio: false, 
                    plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8 } } },
                    scales: { x: { grid: { display: false } }, y: { grid: { borderDash: [4, 4] } } },
                    ...opt 
                }
            });
        };

        // 1. 資產對照 (Line)
        mkChart('chart-asset', 'line', [
            { label: '本方案', data: r.net, borderColor: C.i, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderWidth: 3, fill: true, tension: 0.4, pointRadius: 0 },
            { label: '對照組', data: c.net, borderColor: '#cbd5e1', borderWidth: 2, borderDash: [5,5], pointRadius: 0 }
        ]);

        // 2. 資產結構 (Line - 不堆疊，用層級覆蓋模擬)
        // 使用 Area Chart 模擬堆疊視覺，但數據是獨立的
        const liq = r.net.map((n,i) => n - r.house[i] + r.loan[i]);
        mkChart('chart-wealth', 'line', [
            { label: '房產市值', data: r.house, backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: C.o, fill: true, pointRadius: 0, order: 3 },
            { label: '投資滾存', data: r.invPool, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: C.e, fill: true, pointRadius: 0, order: 2 },
            { label: '現金積累', data: r.cashPool, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: C.i, fill: true, pointRadius: 0, order: 1 },
            { label: '房貸', data: r.loan, borderColor: C.r, borderDash:[3,3], fill: false, pointRadius: 0, order: 0 }
        ], { scales: { y: { stacked: false } } });

        // 3. 現金流 (Bar - Stacked)
        mkChart('chart-flow', 'bar', [
            { label: '房貸', data: r.mort, backgroundColor: '#fbbf24' },
            { label: '支出', data: r.exp, backgroundColor: '#fda4af' },
            { label: '投資', data: r.inv, backgroundColor: '#6ee7b7' },
            { label: '結餘', data: r.flow, backgroundColor: '#818cf8' }
        ], { scales: { x: { stacked: true }, y: { stacked: true } } });

        // 4. 通膨 (Line)
        mkChart('chart-inflation', 'line', [
            { label: '名目資產', data: r.net, borderColor: '#94a3b8', borderWidth: 2, pointRadius: 0 },
            { label: '實質價值', data: r.real, borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.05)', fill: true, borderWidth: 2, pointRadius: 0 }
        ]);
    }
};

window.onload = APP.init;
window.app = APP;
