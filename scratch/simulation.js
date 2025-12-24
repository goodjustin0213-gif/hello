/**
 * AIR FORCE FINANCIAL DSS - CORE V14.0 (Precision Edition)
 * Logic: Strict Accounting Flow (Income - Exp - Invest - Debt = Cash)
 */

const APP = {
    // 資料儲存
    data: { A: {}, B: {} },
    curr: 'A',
    charts: {},
    
    // 軍職薪資結構 (2025 基準，含本俸+專業加給)
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

    // --- 工具函式 ---
    // N: 強制轉數值 (防呆核心，移除逗號，空值回傳0)
    N: v => { 
        if(!v) return 0; 
        const n = parseFloat(String(v).replace(/,/g,'')); 
        return isNaN(n) ? 0 : n; 
    },
    // F: 金額格式化 (千分位)
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 初始化 ---
    init: () => {
        // Chart.js 全域設定
        Chart.defaults.font.family = "'Roboto Mono', 'Noto Sans TC', sans-serif";
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
        
        // 初始化 A/B 方案
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        APP.data.B.returnRate = 4; 
        APP.data.B.investSliderPct = 50;

        // 綁定全域輸入事件 (即時運算)
        document.body.addEventListener('input', e => {
            if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT') APP.calc();
        });

        // 初始載入
        APP.renderInputs('A');
        setTimeout(APP.calc, 200);
    },

    // --- 介面操作 ---
    switch: s => {
        APP.save(); 
        APP.curr = s;
        
        // 按鈕樣式切換
        const btnA = document.getElementById('btn-A');
        const btnB = document.getElementById('btn-B');
        const activeClass = 'btn btn-blue flex-1 shadow-inner';
        const inactiveClass = 'btn btn-white flex-1';
        
        if(s==='A') { btnA.className = activeClass; btnB.className = inactiveClass; }
        else { btnB.className = activeClass; btnA.className = inactiveClass; }
        
        APP.renderInputs(s); 
        APP.calc();
    },

    // 儲存當前畫面數據到記憶體
    save: () => {
        const d = APP.data[APP.curr];
        const ids = ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation','investSlider'];
        ids.forEach(k => {
            const el = document.getElementById(k); 
            if(el) d[k==='investSlider'?'investSliderPct':k] = k==='targetRank'?el.value:APP.N(el.value);
        });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        d.allowances = APP.readList('allowance-list');
        d.expenses = APP.readList('expense-list');
        d.investments = APP.readList('invest-list');
    },

    // 將記憶體數據寫回畫面
    renderInputs: s => {
        const d = APP.data[s];
        const ids = ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation'];
        ids.forEach(k => {
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

    // --- 列表管理 ---
    renderList: (id, list) => {
        const c = document.getElementById(id); 
        c.innerHTML = '';
        list.forEach(i => {
            let ex = id==='allowance-list' ? 
                `<input type="number" class="w-14 text-center border-slate-300" value="${i.start||1}">-<input type="number" class="w-14 text-center border-slate-300" value="${i.end||20}">` : '';
            c.innerHTML += `
            <div class="list-item">
                <input type="text" value="${i.name}" class="flex-1 min-w-0 border-slate-300">
                <input type="number" value="${i.val}" class="w-20 text-right font-bold text-slate-700 border-slate-300">
                ${ex}
                <button onclick="this.parentElement.remove();app.calc()" class="text-red-500 font-bold px-2 hover:bg-red-50 rounded">✕</button>
            </div>`;
        });
    },
    readList: id => {
        const arr = [];
        document.getElementById(id).querySelectorAll('.list-item').forEach(r => {
            const inputs = r.querySelectorAll('input');
            if(id==='allowance-list') {
                arr.push({name:inputs[0].value, val:APP.N(inputs[1].value), start:APP.N(inputs[2].value), end:APP.N(inputs[3].value)});
            } else {
                arr.push({name:inputs[0].value, val:APP.N(inputs[1].value)});
            }
        });
        return arr;
    },
    addItem: id => {
        const l = id==='allowance-list'?APP.data[APP.curr].allowances:(id==='expense-list'?APP.data[APP.curr].expenses:APP.data[APP.curr].investments);
        l.push({name:'項目', val:0, start:1, end:20}); 
        APP.renderList(id, l); 
        APP.calc();
    },
    loadAFData: () => {
        const d = APP.data[APP.curr];
        d.allowances = [
            {name:'空勤(初)',val:22000,start:1,end:5},
            {name:'空勤(中)',val:45000,start:6,end:15},
            {name:'空勤(高)',val:68000,start:16,end:25}
        ];
        APP.renderList('allowance-list', d.allowances); 
        APP.calc();
    },
    addExpenseItem: () => APP.addItem('expense-list'),
    addInvestItem: () => APP.addItem('invest-list'),

    // --- 核心運算 (Strict Accounting) ---
    run: d => {
        const N = APP.N;
        const years = N(d.serviceYears)||20, inf = N(d.inflationRate)/100, raise = N(d.salaryRaiseRate)/100, roi = N(d.returnRate)/100, pct = N(d.investSliderPct)/100;
        
        let rank = 'S2', rankY = 0;
        let invPool = 0;  // 投資池
        let cashPool = 0; // 現金池
        let houseVal = 0, loanBal = 0, mPay = 0, hasHouse = false;
        
        const targetIdx = APP.ranks.indexOf(d.targetRank);
        // 結果陣列
        const res = { years:[], net:[], invP:[], cashP:[], houseNet:[], log:[] };
        
        const baseExp = d.expenses.reduce((s,x)=>s+N(x.val),0);
        const baseInv = d.investments.reduce((s,x)=>s+N(x.val),0);

        for(let y=1; y<=years; y++) {
            // A. 晉升邏輯
            const rInfo = APP.salary[rank], rIdx = APP.ranks.indexOf(rank);
            if(y>1 && y%4===0 && rIdx<targetIdx && rankY<rInfo.m) { rank = APP.ranks[rIdx+1]; rankY=0; } else rankY++;

            // B. 收入計算
            const payBase = (APP.salary[rank].base + APP.salary[rank].add) * Math.pow(1.015, rankY) * Math.pow(1+raise, y-1);
            let allow = 0; 
            d.allowances.forEach(a => { if(y>=N(a.start) && y<=N(a.end)) allow+=N(a.val); });
            
            const gross = payBase + 15000 + allow; // 15000=志願役加給
            const netM = Math.round(gross * 0.95); // 稅後/退撫扣除

            // C. 房產處理
            let yMort = 0;
            if(d.buyHouseToggle && y===N(d.buyYear) && !hasHouse) {
                hasHouse = true; houseVal = N(d.housePriceWan)*10000;
                const down = houseVal*(N(d.downPaymentPct)/100); 
                loanBal = houseVal - down;
                
                // 支付頭期款：優先扣現金，不足扣投資
                if(cashPool >= down) { cashPool -= down; }
                else { 
                    const rem = down - cashPool; 
                    cashPool = 0; 
                    invPool -= rem; // 投資池被變現
                }
                
                const r=N(d.mortgageRate)/100/12, n=N(d.loanTerm)*12;
                mPay = loanBal*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
            }
            
            if(hasHouse) {
                houseVal *= (1+N(d.houseAppreciation)/100);
                if(loanBal > 0) {
                    yMort = mPay * 12;
                    // 簡易本金計算
                    const interest = loanBal * (N(d.mortgageRate)/100);
                    loanBal -= (yMort - interest);
                    if(loanBal < 0) loanBal = 0;
                }
            }

            // D. 現金流結算 (重點邏輯)
            const yInc = netM * 13.5;
            const yEx = baseExp * Math.pow(1+inf, y-1) * 12;
            const yInvIn = (netM * pct + baseInv) * 12; // 提撥進投資池的本金
            
            // 結餘 = 收入 - 支出 - 投資本金 - 房貸
            const ySurplus = yInc - yEx - yInvIn - yMort;

            // E. 資產池變動
            // 投資池：舊錢滾利 + 新本金
            invPool = invPool * (1+roi) + yInvIn;
            
            // 現金池：舊錢 + 結餘 (結餘為負則自動扣減)
            cashPool = cashPool + ySurplus;

            const houseNet = Math.max(0, houseVal - loanBal);
            const totalNet = invPool + cashPool + houseNet;

            // F. 存檔
            res.years.push(y);
            res.net.push(totalNet);
            res.invP.push(invPool);
            res.cashP.push(cashPool);
            res.houseNet.push(houseNet);
            
            res.log.push({
                y, rank, 
                inc: yInc, ex: yEx, invIn: yInvIn, mort: yMort, surplus: ySurplus,
                invVal: invPool, cashVal: cashPool, houseVal: houseVal, loan: loanBal, net: totalNet
            });
        }
        
        // 終身俸估算
        res.pension = Math.round(APP.salary[rank].base * 2 * (0.55 + Math.max(0, years-20)*0.02));
        return res;
    },

    // --- UI 更新 ---
    calc: () => {
        APP.save();
        const rA = APP.run(APP.data.A);
        const rB = APP.run(APP.data.B);
        APP.ui(APP.curr==='A'?rA:rB, APP.curr==='A'?rB:rA);
    },

    ui: (r, c) => {
        const l = r.net.length-1;
        document.getElementById('kpi-asset').innerText = APP.F(r.net[l]);
        document.getElementById('kpi-invest-gain').innerText = APP.F(r.invP[l]);
        document.getElementById('kpi-pension').innerText = APP.F(r.pension);
        
        // 警示偵測
        const alertBox = document.getElementById('alert-box');
        const hasDeficit = r.log.some(x => x.surplus < 0);
        if(hasDeficit) alertBox.classList.remove('hidden'); else alertBox.classList.add('hidden');

        // 表格渲染
        const tb = document.getElementById('table-body');
        tb.innerHTML = '';
        r.log.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.y}</td>
                <td class="font-bold text-slate-700">${row.rank}</td>
                <td>${APP.F(row.inc)}</td>
                <td class="text-red-600">${APP.F(row.ex)}</td>
                <td class="text-green-600 font-bold">${APP.F(row.invIn)}</td>
                <td class="text-slate-500">${APP.F(row.mort)}</td>
                <td class="${row.surplus<0?'text-red-600 font-black':'text-blue-700'}">${APP.F(row.surplus)}</td>
                <td class="text-gray-500">${APP.F(row.invVal)}</td>
                <td class="${row.cashVal<0?'text-red-600 font-bold':'text-gray-500'}">${APP.F(row.cashVal)}</td>
                <td class="text-gray-500">${APP.F(row.houseNet)}</td>
                <td class="text-slate-900 font-black bg-slate-100">${APP.F(row.net)}</td>
            `;
            tb.appendChild(tr);
        });

        APP.draw(r, c);
    },

    draw: (r, c) => {
        const labels = r.years.map(y => 'Y'+y);
        
        // 共用設定
        const opts = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8 } } },
            scales: { x: { grid: { display: false } } }
        };

        // 1. 資產趨勢圖 (Asset Line)
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '本方案淨資產', data: r.net, borderColor: '#2563eb', borderWidth: 3, tension: 0.3, pointRadius: 0 },
                    { label: '對照組淨資產', data: c.net, borderColor: '#94a3b8', borderWidth: 2, borderDash: [5,5], pointRadius: 0 }
                ]
            },
            options: opts
        });

        // 2. 資產結構圖 (Wealth Composition)
        // 這裡不使用堆疊，改用多條線呈現不同資產類別的消長
        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '投資總值 (複利)', data: r.invP, borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', fill: true, borderWidth: 2, pointRadius: 0 },
                    { label: '現金總值', data: r.cashP, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, borderWidth: 2, pointRadius: 0 },
                    { label: '房產淨值', data: r.houseNet, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', fill: true, borderWidth: 2, pointRadius: 0 }
                ]
            },
            options: opts
        });
    }
};

window.onload = APP.init;
window.app = APP;
