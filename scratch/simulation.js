/**
 * 空軍官校職涯財務決策支援系統
 * Core Logic Script v8.1 (Logic Fixed Edition)
 * * Key Fix:
 * - 分離「投資池 (Invest Pool)」與「現金池 (Cash Pool)」運算。
 * - 投資池享受複利 (ROI)，現金池不計息。
 * - 修正滑桿調整後資產無變化的邏輯錯誤。
 */

const APP = {
    // 資料儲存容器
    data: { A: {}, B: {} },
    current: 'A',
    charts: {}, // 存放 Chart.js 實例
    
    // 薪資常數
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
    
    // 強力數值轉換 (防呆核心)：把任何輸入轉成數字，失敗就給 0
    N: (v) => {
        if(!v) return 0;
        // 移除逗號等非數字字符
        const clean = String(v).replace(/,/g, '');
        const n = parseFloat(clean);
        return isNaN(n) ? 0 : n;
    },

    // 格式化金錢
    F: (n) => Math.round(n).toLocaleString('zh-TW'),

    // --- 初始化 ---
    init: () => {
        const def = {
            targetRank: 'M2', serviceYears: 20, inflationRate: 2, salaryRaiseRate: 1, returnRate: 6,
            buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
            investSliderPct: 30,
            allowances: [], 
            expenses: [{name:'基本開銷', val:12000}], 
            investments: [{name:'儲蓄險', val:3000}]
        };
        
        // 深拷貝預設值
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        APP.data.B.returnRate = 4; // B 方案預設較保守
        
        // 綁定全域輸入事件，實現即時運算
        document.body.addEventListener('input', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') APP.calc();
        });

        // 初始畫面渲染
        APP.renderInputs('A');
        
        // 延遲一下確保 DOM 完全載入後執行第一次運算
        setTimeout(APP.calc, 100);
    },

    // --- 介面操作 ---
    
    switchScenario: (s) => {
        APP.saveInputs(); // 切換前先存檔
        APP.current = s;
        
        // 切換按鈕樣式
        document.getElementById('btn-A').className = s==='A' ? 'btn btn-primary shadow-lg' : 'btn btn-outline';
        document.getElementById('btn-B').className = s==='B' ? 'btn btn-primary shadow-lg' : 'btn btn-outline';
        
        APP.renderInputs(s);
        APP.calc();
    },

    // 從 UI 讀取資料到記憶體
    saveInputs: () => {
        const d = APP.data[APP.current];
        const ids = ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation','investSlider'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                // 特殊處理滑桿的 key 名稱
                const key = id === 'investSlider' ? 'investSliderPct' : id;
                d[key] = id === 'targetRank' ? el.value : APP.N(el.value);
            }
        });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        d.allowances = APP.readList('allowance-list');
        d.expenses = APP.readList('expense-list');
        d.investments = APP.readList('invest-list');
    },

    // 從記憶體渲染資料到 UI
    renderInputs: (s) => {
        const d = APP.data[s];
        const ids = ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation'];
        ids.forEach(k => {
            const el = document.getElementById(k);
            if(el) el.value = d[k];
        });
        
        document.getElementById('investSlider').value = d.investSliderPct;
        document.getElementById('slider-val').innerText = d.investSliderPct + '%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        
        document.getElementById('housing-inputs').className = d.buyHouseToggle ? "grid grid-cols-2 gap-2 mt-2 bg-slate-800/50 p-2 rounded" : "hidden";
    },

    // 列表渲染 (加給、支出、投資)
    renderList: (id, list) => {
        const c = document.getElementById(id);
        c.innerHTML = '';
        list.forEach(item => {
            let extra = '';
            if (id === 'allowance-list') {
                extra = `<input type="number" class="w-12 text-center bg-slate-900 border border-slate-600" value="${item.start||1}">-<input type="number" class="w-12 text-center bg-slate-900 border border-slate-600" value="${item.end||20}">`;
            }
            c.innerHTML += `
            <div class="flex gap-1 items-center mb-1">
                <input type="text" value="${item.name}" class="w-full text-xs bg-slate-800 border-none">
                <input type="number" value="${item.val}" class="w-20 text-right bg-slate-800 border-none font-mono text-yellow-400">
                ${extra}
                <button onclick="this.parentElement.remove(); app.calc()" class="text-red-400 hover:text-red-200 px-1 font-bold">✕</button>
            </div>`;
        });
    },

    // 讀取列表資料
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

    // 新增項目
    addItem: (id) => {
        const list = id === 'allowance-list' ? APP.data[APP.current].allowances : (id==='expense-list'?APP.data[APP.current].expenses:APP.data[APP.current].investments);
        list.push({name:'新項目', val:0, start:1, end:20});
        APP.renderList(id, list);
        APP.calc();
    },

    // 空軍加給預設值
    addAirForcePay: () => {
        const d = APP.data[APP.current];
        d.allowances = [
            {name: '空勤(初)', val: 22000, start: 1, end: 5},
            {name: '空勤(中)', val: 45000, start: 6, end: 15},
            {name: '空勤(高)', val: 68000, start: 16, end: 25}
        ];
        APP.renderList('allowance-list', d.allowances);
        APP.calc();
    },

    // --- 核心運算引擎 (v8.1 邏輯修正版) ---
    runSim: (d) => {
        const N = APP.N;
        const years = N(d.serviceYears) || 20;
        const inflation = N(d.inflationRate) / 100;
        const raise = N(d.salaryRaiseRate) / 100; 
        const roi = N(d.returnRate) / 100;
        const sliderPct = N(d.investSliderPct) / 100; // 薪資提撥比例
        
        let rank = 'S2', rankY = 0;
        const targetIdx = APP.ranks.indexOf(d.targetRank);
        
        // *** 關鍵修正：資金池分離 ***
        let investPool = 0; // 投資池 (複利滾存)
        let cashPool = 0;   // 現金池 (無息累積)
        
        let house = 0, loan = 0, mPay = 0, hasHouse = false;
        
        const res = { years:[], netAsset:[], realAsset:[], house:[], loan:[], investPool:[], cashPool:[], mortgage:[], exp:[], inv:[], flow:[], logs:[] };
        
        const baseExp = d.expenses.reduce((s, x) => s + N(x.val), 0);
        const baseFixedInv = d.investments.reduce((s, x) => s + N(x.val), 0);

        for(let y=1; y<=years; y++) {
            // 1. 晉升與調薪
            const rInfo = APP.salary[rank];
            const rIdx = APP.ranks.indexOf(rank);
            if(y > 1 && y % 4 === 0 && rIdx < targetIdx && rankY < rInfo.max) { 
                rank = APP.ranks[rIdx+1]; 
                rankY = 0; 
            } else {
                rankY++;
            }

            // 薪資計算 = (本俸+專加) * 年資複利 * 調薪複利
            const payBase = (APP.salary[rank].base + APP.salary[rank].add) * Math.pow(1.015, rankY) * Math.pow(1+raise, y-1);
            
            // 計算加給
            let allow = 0;
            d.allowances.forEach(a => { if(y >= N(a.start) && y <= N(a.end)) allow += N(a.val); });
            
            const gross = payBase + 15000 + allow; // +志願役加給
            const netMonthly = Math.round(gross * 0.95); // 扣除退撫健保概算

            // 2. 購屋運算
            let yMortgage = 0;
            if(d.buyHouseToggle && y === N(d.buyYear) && !hasHouse) {
                hasHouse = true;
                house = N(d.housePriceWan) * 10000;
                const down = house * (N(d.downPaymentPct)/100);
                loan = house - down;
                
                // 頭期款扣款順序：先扣現金，不夠扣投資
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
                house *= (1 + N(d.houseAppreciation)/100); // 房產增值
                if(loan > 0) {
                    yMortgage = mPay * 12;
                    // 簡易本金償還計算
                    const interest = loan * (N(d.mortgageRate)/100);
                    loan -= (yMortgage - interest);
                    if(loan < 0) loan = 0;
                }
            }

            // 3. 現金流分配 (關鍵邏輯)
            const yIncome = netMonthly * 13.5; // 年薪 (含年終)
            const yExp = baseExp * Math.pow(1+inflation, y-1) * 12; // 支出 (含通膨)
            
            // 投入投資池的金額 = (月薪 x 提撥比例) + 固定投資額
            const yInvestInput = (netMonthly * sliderPct + baseFixedInv) * 12;
            
            // 剩下的進現金池 = 收入 - 支出 - 拿去投資的錢 - 房貸
            const cashSurplus = yIncome - yExp - yInvestInput - yMortgage;

            // 4. 資產滾存
            // 投資池：滾複利 (ROI) + 新投入
            investPool = investPool * (1 + roi) + yInvestInput;
            
            // 現金池：不滾利 (0%) + 新結餘
            cashPool = cashPool + cashSurplus;

            const netAsset = investPool + cashPool + house - loan;

            // 5. 紀錄歷史
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
        
        // 終身俸試算
        const lastRank = APP.salary[rank];
        res.pension = Math.round(lastRank.base * 2 * (0.55 + Math.max(0, years-20)*0.02)); 
        
        return res;
    },

    // --- 更新 UI ---
    calc: () => {
        APP.saveInputs();
        const resA = APP.runSim(APP.data.A);
        const resB = APP.runSim(APP.data.B);
        APP.updateUI(APP.current === 'A' ? resA : resB, APP.current === 'A' ? resB : resA);
    },

    updateUI: (res, comp) => {
        const last = res.netAsset.length - 1;
        document.getElementById('kpi-asset').innerText = APP.F(res.netAsset[last]);
        document.getElementById('kpi-invest-pool').innerText = APP.F(res.investPool[last]);
        
        const diff = res.netAsset[last] - comp.netAsset[last];
        document.getElementById('kpi-diff').innerHTML = `差異: <span class="${diff>=0?'text-green-400':'text-red-400'}">${APP.F(diff)}</span>`;
        document.getElementById('kpi-pension').innerText = APP.F(res.pension);
        
        const hDiv = document.getElementById('kpi-house');
        if(APP.data[APP.current].buyHouseToggle) {
            hDiv.innerHTML = `值: <span class="text-orange-400">${APP.F(res.house[last])}</span> / 貸: <span class="text-red-400">${APP.F(res.loan[last])}</span>`;
        } else {
            hDiv.innerText = "未啟用";
        }

        // Table
        const tb = document.getElementById('table-body');
        tb.innerHTML = '';
        res.logs.forEach(l => {
            tb.innerHTML += `<tr class="border-b border-slate-800 hover:bg-slate-800/50 transition">
                <td class="p-2 text-gray-500">Y${l.y}</td>
                <td class="p-2 font-bold text-slate-300">${l.rank}</td>
                <td class="p-2 text-right text-slate-300">${APP.F(l.income)}</td>
                <td class="p-2 text-right text-red-300/70">${APP.F(l.exp)}</td>
                <td class="p-2 text-right text-emerald-400">${APP.F(l.inv)}</td>
                <td class="p-2 text-right text-blue-300">${APP.F(l.invPool)}</td>
                <td class="p-2 text-right ${l.flow<0?'text-red-500 font-bold':'text-gray-400'}">${APP.F(l.flow)}</td>
                <td class="p-2 text-right font-bold text-white">${APP.F(l.net)}</td>
            </tr>`;
        });

        APP.drawCharts(res, comp);
    },

    drawCharts: (res, comp) => {
        // 全域設定
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = '#334155';

        const ctxs = ['chart-asset', 'chart-flow', 'chart-wealth', 'chart-inflation'];
        ctxs.forEach(id => {
            if(APP.charts[id]) APP.charts[id].destroy();
            const canvas = document.getElementById(id);
            if(!canvas) return;
            
            let config = {};
            const labels = res.years;
            
            // 1. 資產對照 (Line)
            if(id === 'chart-asset') {
                config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: '本方案', data: res.netAsset, borderColor: '#3b82f6', borderWidth: 3, tension: 0.3 },
                            { label: '對照組', data: comp.netAsset, borderColor: '#64748b', borderWidth: 2, borderDash: [5,5], tension: 0.3 }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                };
            } 
            // 2. 現金流堆疊 (Stacked Bar)
            else if(id === 'chart-flow') {
                config = {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: '房貸', data: res.mortgage, backgroundColor: '#f97316' },
                            { label: '支出', data: res.exp, backgroundColor: '#ef4444' },
                            { label: '投入投資', data: res.inv, backgroundColor: '#10b981' },
                            { label: '現金結餘', data: res.flow, backgroundColor: '#3b82f6' }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
                };
            } 
            // 3. 資產結構 (Line/Area) - 修正堆疊邏輯
            else if(id === 'chart-wealth') {
                config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: '投資滾存', data: res.investPool, backgroundColor: 'rgba(16, 185, 129, 0.3)', borderColor: '#10b981', fill: true, tension: 0.4 },
                            { label: '現金積累', data: res.cashPool, backgroundColor: 'rgba(59, 130, 246, 0.3)', borderColor: '#3b82f6', fill: true, tension: 0.4 },
                            { label: '房產淨值', data: res.house.map((h,i)=>h-res.loan[i]), backgroundColor: 'rgba(249, 115, 22, 0.3)', borderColor: '#f97316', fill: true }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { stacked: true } } }
                };
            } 
            // 4. 通膨分析 (Line)
            else {
                config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: '名目資產', data: res.netAsset, borderColor: '#cbd5e1', borderWidth: 2 },
                            { label: '實質購買力', data: res.realAsset, borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', fill: true, borderWidth: 3 }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                };
            }
            APP.charts[id] = new Chart(canvas, config);
        });
    }
};

// 程式啟動入口
window.onload = APP.init;
window.app = APP; // 讓 HTML 按鈕可以呼叫 APP 函式
