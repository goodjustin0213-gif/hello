/**
 * AIR FORCE FINANCIAL DSS - CORE V18.0
 * Logic: Strict Accounting Flow + Detailed Navigation
 * Features: 
 * 1. Current Rank Start
 * 2. Separate Investment/Cash Pools
 * 3. Inflation impact on Expenses
 */

const APP = {
    charts: {},
    
    // --- 資料層：2025 軍職薪資資料庫 (本俸+專業加給預估) ---
    rankDB: {
        // 士兵
        '二兵': {base: 10550, pro: 0}, 
        '一兵': {base: 11130, pro: 0}, 
        '上兵': {base: 12280, pro: 0},
        // 士官
        '下士': {base: 14645, pro: 5500}, 
        '中士': {base: 16585, pro: 6200}, 
        '上士': {base: 18525, pro: 7000},
        '三等長': {base: 22750, pro: 8200}, 
        '二等長': {base: 25050, pro: 9500}, 
        '一等長': {base: 28880, pro: 10800},
        // 軍官
        '少尉': {base: 22750, pro: 8500}, 
        '中尉': {base: 25050, pro: 9800}, 
        '上尉': {base: 28880, pro: 11500},
        '少校': {base: 32710, pro: 23000}, 
        '中校': {base: 37310, pro: 26000}, 
        '上校': {base: 41900, pro: 32000},
        '少將': {base: 48030, pro: 40000}
    },

    // 階級晉升順序
    rankOrder: [
        '二兵','一兵','上兵',
        '下士','中士','上士','三等長','二等長','一等長',
        '少尉','中尉','上尉','少校','中校','上校','少將'
    ],

    // --- 工具函式 ---
    // N: 強制轉數值 (防呆核心)
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    // F: 金額格式化
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 初始化 ---
    init: () => {
        // Chart.js 全域設定
        Chart.defaults.font.family = "'Noto Sans TC', sans-serif";
        Chart.defaults.color = '#64748b';
        Chart.defaults.borderColor = '#e2e8f0';

        // 1. 注入「目前階級」選單
        const sel = document.getElementById('currentRank');
        APP.rankOrder.forEach(r => sel.add(new Option(r, r)));
        sel.value = '少尉'; // 預設值

        // 2. 綁定購屋顯示邏輯
        document.getElementById('buyHouse').addEventListener('change', e => {
            const opts = document.getElementById('housing-opts');
            const report = document.getElementById('housing-report');
            if(e.target.checked) {
                opts.classList.remove('hidden');
                if(report) report.classList.remove('hidden');
            } else {
                opts.classList.add('hidden');
                if(report) report.classList.add('hidden');
            }
            APP.calc();
        });

        // 3. 綁定所有輸入框的即時運算
        document.body.addEventListener('input', e => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                APP.calc();
            }
        });

        // 4. 初次執行
        APP.calc();
    },

    // 載入預設加給
    loadDefaults: () => {
        const div = document.getElementById('allowance-container');
        div.innerHTML = `
            <div class="flex justify-between items-center text-xs mb-1 bg-white p-2 border rounded shadow-sm">
                <span class="font-bold text-slate-700">志願役加給</span>
                <input type="number" id="vol-add" value="15000" class="border rounded px-2 py-1 w-20 text-right text-blue-600 font-bold">
            </div>
            <div class="flex justify-between items-center text-xs bg-white p-2 border rounded shadow-sm">
                <span class="font-bold text-slate-700">勤務/地域加給</span>
                <input type="number" id="duty-add" value="5000" class="border rounded px-2 py-1 w-20 text-right text-blue-600 font-bold">
            </div>
        `;
        APP.calc();
    },

    // --- 核心運算引擎 ---
    calc: () => {
        // 1. 讀取參數
        const currentRank = document.getElementById('currentRank').value;
        const years = APP.N(document.getElementById('serviceYears').value);
        const monthlyExpense = APP.N(document.getElementById('totalExpense').value); // 初始月支出
        
        // 戰略參數
        const investRate = APP.N(document.getElementById('investRate').value) / 100;
        const roi = APP.N(document.getElementById('roi').value) / 100;
        const inflation = APP.N(document.getElementById('inflation').value) / 100;

        // 加給
        const volAdd = document.getElementById('vol-add') ? APP.N(document.getElementById('vol-add').value) : 0;
        const dutyAdd = document.getElementById('duty-add') ? APP.N(document.getElementById('duty-add').value) : 0;

        // 購屋
        const isBuy = document.getElementById('buyHouse').checked;
        const buyYear = APP.N(document.getElementById('buyYear').value);
        const housePrice = APP.N(document.getElementById('housePrice').value) * 10000;
        const loanYears = APP.N(document.getElementById('loanYears').value);
        const loanRate = 0.022; // 房貸利率預設 2.2%

        // 2. 變數初始化
        let rankIdx = APP.rankOrder.indexOf(currentRank);
        let rankY = 0; // 該階級已停年數
        
        let invPool = 0;  // 投資資產 (複利)
        let cashPool = 0; // 現金資產 (無息)
        
        let houseVal = 0, loanBal = 0, monthlyMortgage = 0;
        let hasBought = false;

        const d = { years:[], net:[], inv:[], real:[], flow:[] }; // 圖表數據
        const rows = []; // 表格數據

        // 3. 逐年模擬
        for(let y=1; y<=years; y++) {
            
            // --- A. 晉升邏輯 ---
            // 簡易模型：每4年升一階 (若未達頂)
            if(y > 1 && y % 4 === 0 && rankIdx < APP.rankOrder.length - 1) {
                rankIdx++;
                rankY = 0;
            } else {
                rankY++;
            }
            const rName = APP.rankOrder[rankIdx];
            const rData = APP.rankDB[rName];

            // --- B. 收入計算 ---
            // 本俸隨年資微調 (年功俸概念)
            const basePay = rData.base * Math.pow(1.015, rankY);
            const monthIncome = basePay + rData.pro + volAdd + dutyAdd;
            const annualIncome = monthIncome * 13.5; // 含1.5個月年終

            // --- C. 房貸計算 ---
            let annualMortgage = 0;
            if(isBuy && y === buyYear && !hasBought) {
                hasBought = true;
                houseVal = housePrice;
                const down = housePrice * 0.2; // 頭期款 20%
                loanBal = housePrice - down;
                
                // 支付頭期款：優先扣現金，不足扣投資
                if(cashPool >= down) {
                    cashPool -= down;
                } else {
                    const diff = down - cashPool;
                    cashPool = 0;
                    invPool -= diff; // 變賣投資資產
                }

                // 計算月還款 (本息均攤)
                const r = loanRate/12, n = loanYears*12;
                monthlyMortgage = loanBal * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
            }

            if(hasBought && loanBal > 0) {
                annualMortgage = monthlyMortgage * 12;
                // 簡易扣除本金
                loanBal -= (annualMortgage - loanBal * loanRate);
                if(loanBal < 0) loanBal = 0;
            }

            // --- D. 支出與投資分配 (會計恆等式) ---
            // 支出隨通膨成長
            const currentMonthlyExpense = monthlyExpense * Math.pow(1+inflation, y-1);
            const annualExpense = currentMonthlyExpense * 12;
            
            // 強制提撥投資
            const investAmount = monthIncome * investRate * 12;
            
            // 現金結餘 = 收入 - 支出 - 投資 - 房貸
            const cashSurplus = annualIncome - annualExpense - investAmount - annualMortgage;

            // --- E. 資產滾存 ---
            // 投資池：本金投入 + 複利回報
            invPool = invPool * (1 + roi) + investAmount;
            
            // 現金池：累積結餘 (若為負值，代表負債)
            cashPool += cashSurplus;

            // 總淨資產 = 投資 + 現金 + (房產 - 房貸)
            const houseNet = hasBought ? Math.max(0, houseVal - loanBal) : 0;
            const netAsset = invPool + cashPool + houseNet;
            
            // 實質購買力 (折現)
            const realAsset = netAsset / Math.pow(1+inflation, y);

            // --- F. 紀錄 ---
            d.years.push(y);
            d.net.push(netAsset);
            d.inv.push(invPool);
            d.real.push(realAsset);
            d.flow.push(cashSurplus);

            rows.push({
                y, rank: rName, inc: annualIncome, ex: annualExpense, 
                inv: investAmount, mort: annualMortgage, flow: cashSurplus, net: netAsset
            });
        }

        // --- 4. 更新 UI ---
        APP.updateUI(rows, d, invPool, cashPool);
    },

    // --- UI 更新與繪圖 ---
    updateUI: (rows, d, invTotal, cashTotal) => {
        const last = rows.length - 1;
        
        // KPI 更新
        document.getElementById('kpi-net').innerText = APP.F(d.net[last]);
        document.getElementById('kpi-invest').innerText = APP.F(invTotal);
        document.getElementById('kpi-real').innerText = APP.F(d.real[last]);
        
        // 終身俸簡易估算
        const finalBase = APP.rankDB[rows[last].rank].base;
        const pension = finalBase * 2 * (0.55 + Math.max(0, rows.length-20)*0.02);
        document.getElementById('kpi-pension').innerText = APP.F(pension);

        // 表格更新
        const tb = document.getElementById('table-body');
        tb.innerHTML = rows.map(r => `
            <tr class="hover:bg-blue-50/50 transition border-b border-slate-50">
                <td class="p-4 font-mono text-slate-400">Y${r.y}</td>
                <td class="p-4 font-bold text-slate-700">${r.rank}</td>
                <td class="p-4 text-right text-slate-600">${APP.F(r.inc)}</td>
                <td class="p-4 text-right text-red-400">${APP.F(r.ex)}</td>
                <td class="p-4 text-right text-emerald-600 font-bold">${APP.F(r.inv)}</td>
                <td class="p-4 text-right ${r.flow<0?'text-red-600 font-black':'text-blue-600'}">${APP.F(r.flow)}</td>
                <td class="p-4 text-right font-black text-slate-800">${APP.F(r.net)}</td>
            </tr>
        `).join('');

        // 購屋報告
        const rpt = document.getElementById('housing-msg');
        if(rpt) {
            const hasDeficit = d.flow.some(v => v < 0);
            const parent = document.getElementById('housing-report');
            if(document.getElementById('buyHouse').checked) {
                parent.classList.remove('hidden');
                if(hasDeficit) {
                    parent.className = "card bg-red-50 border-l-4 border-red-500 mb-6";
                    rpt.innerHTML = `⚠️ <strong>現金流警示：</strong> 在購屋後的某些年份，您的現金結餘為負值。這表示薪資扣除生活費與投資後，不足以支付房貸。建議降低投資比例或延後購屋。`;
                } else {
                    parent.className = "card bg-green-50 border-l-4 border-green-500 mb-6";
                    rpt.innerHTML = `✅ <strong>財務健康：</strong> 您的現金流足以負擔此購屋計畫，且保有正向儲蓄。`;
                }
            } else {
                parent.classList.add('hidden');
            }
        }

        APP.drawCharts(d);
    },

    drawCharts: (d) => {
        const labels = d.years.map(y => 'Y'+y);
        
        // 圖表 1: 資產趨勢
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '名目淨資產', data: d.net, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', fill: true, borderWidth: 3, tension: 0.3 },
                    { label: '實質購買力', data: d.real, borderColor: '#64748b', borderDash: [5,5], borderWidth: 2, tension: 0.3 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } }
        });

        // 圖表 2: 現金流結餘
        if(APP.charts.cashflow) APP.charts.cashflow.destroy();
        APP.charts.cashflow = new Chart(document.getElementById('chart-cashflow'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ 
                    label: '年度現金結餘', 
                    data: d.flow, 
                    backgroundColor: d.flow.map(v => v<0 ? '#ef4444' : '#10b981'),
                    borderRadius: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

// 系統啟動
window.onload = APP.init;
