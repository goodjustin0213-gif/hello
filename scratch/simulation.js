/**
 * 國軍財務戰情室 PRO v26.0 (Commander Edition) - Core Logic
 * * [版本更新日誌 v26.0]
 * 1. 新增 Lifestyle Tiers (生活型態分級)：節約(30%) / 一般(50%) / 享樂(70%)
 * 2. 新增 Retirement Benefit (退伍金模擬)：滿20年退伍時，模擬一次性退伍金挹注。
 * 3. 優化 Liquidation Logic (變現邏輯)：買房頭期款現金不足時，自動變賣投資部位。
 * 4. 優化 Alpha Calculation (效益分析)：計算 Plan B (優化案) 相較於 Plan A (現狀) 的超額報酬。
 */

// --- 1. 全局圖表設定 (深色戰情風格) ---
Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#334155';
Chart.defaults.font.family = "'JetBrains Mono', 'Noto Sans TC', sans-serif";

const APP = {
    currentTab: 'A',       // 目前顯示的分頁
    store: { A: {}, B: {} }, // 資料暫存區
    charts: {},            // 圖表實例
    
    // --- 2. 薪資資料庫 (2025年參考標準：本俸+專業加給) ---
    rankData: {
        '二兵': {b:10550, p:0}, '一兵': {b:11130, p:0}, '上兵': {b:12280, p:0},
        '下士': {b:14645, p:5500}, '中士': {b:16585, p:6200}, '上士': {b:18525, p:7000},
        '三等士官長': {b:22750, p:8200}, '二等士官長': {b:25050, p:9500}, '一等士官長': {b:28880, p:10800},
        '少尉': {b:22750, p:8500}, '中尉': {b:25050, p:9800}, '上尉': {b:28880, p:11500},
        '少校': {b:32710, p:23000}, '中校': {b:37310, p:26000}, '上校': {b:41900, p:32000}
    },
    ranks: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校'],

    // 工具函式
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 3. 初始化 ---
    init: () => {
        // 生成階級選單
        const opts = APP.ranks.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;

        // 設定預設參數
        // Plan A (現狀/保守)：一般消費(50%)、低投資(10%)、定存報酬(2%)
        const def = {
            cRank:'少尉', tRank:'中校', years:20, realPay:0,
            livingPct: 50, fixed: 5000, 
            rate: 10, roi: 2.0, inf: 2.0, 
            buyHouse:false, buyY:10, hPrice:1200, down:20, loanY:30
        };
        
        APP.store.A = JSON.parse(JSON.stringify(def)); 
        
        // Plan B (優化/積極)：節約消費(30%)、高儲蓄(40%)、指數投資報酬(6%)
        APP.store.B = JSON.parse(JSON.stringify(def)); 
        APP.store.B.livingPct = 30; 
        APP.store.B.rate = 40;      
        APP.store.B.roi = 6.0;      

        APP.loadToUI('A');
        APP.update();
    },

    // --- 4. UI 互動邏輯 ---
    switchTab: (tab) => {
        APP.saveFromUI(APP.currentTab);
        APP.currentTab = tab;
        
        // 更新 Tab 樣式
        document.getElementById('tab-A').className = `tab-btn ${tab==='A'?'active':''}`;
        document.getElementById('tab-B').className = `tab-btn ${tab==='B'?'active':''}`;
        
        APP.loadToUI(tab);
        APP.update();
    },

    // [新增] 生活型態快速設定
    setLifestyle: (type) => {
        let val = 50;
        if(type === 'frugal') val = 30;  // 節約
        if(type === 'normal') val = 50;  // 一般
        if(type === 'yolo') val = 70;    // 享樂
        
        document.getElementById('livingPct').value = val;
        APP.updateInput('livingPct'); // 更新顯示並重算
    },

    updateInput: (id) => {
        const val = document.getElementById(id).value;
        // 更新滑桿旁的文字標籤
        document.getElementById(id + 'Label').innerText = val + '%';
        APP.update();
    },

    saveFromUI: (tab) => {
        const d = APP.store[tab];
        d.cRank = document.getElementById('currentRank').value;
        d.tRank = document.getElementById('targetRank').value;
        d.years = APP.N(document.getElementById('years').value);
        d.realPay = APP.N(document.getElementById('realPay').value);
        
        d.livingPct = APP.N(document.getElementById('livingPct').value);
        d.fixed = APP.N(document.getElementById('fixedCost').value);
        
        d.rate = APP.N(document.getElementById('investRate').value);
        d.roi = APP.N(document.getElementById('roi').value);
        d.inf = APP.N(document.getElementById('inflation').value);
        
        d.buyHouse = document.getElementById('buyHouse').checked;
        d.buyY = APP.N(document.getElementById('buyYear').value);
        d.hPrice = APP.N(document.getElementById('housePrice').value);
        d.down = APP.N(document.getElementById('downPayment').value);
        d.loanY = APP.N(document.getElementById('loanYears').value);
    },

    loadToUI: (tab) => {
        const d = APP.store[tab];
        document.getElementById('currentRank').value = d.cRank;
        document.getElementById('targetRank').value = d.tRank;
        document.getElementById('years').value = d.years;
        document.getElementById('realPay').value = d.realPay;
        
        document.getElementById('livingPct').value = d.livingPct;
        document.getElementById('livingPctLabel').innerText = d.livingPct + '%';
        document.getElementById('fixedCost').value = d.fixed;
        
        document.getElementById('investRate').value = d.rate;
        document.getElementById('investRateLabel').innerText = d.rate + '%';
        document.getElementById('roi').value = d.roi;
        document.getElementById('inflation').value = d.inf;
        
        document.getElementById('buyHouse').checked = d.buyHouse;
        // 控制房產區塊顯示
        document.getElementById('housing-area').className = d.buyHouse ? 'block space-y-2 text-sm border-t border-slate-700 pt-2' : 'hidden';
        document.getElementById('buyYear').value = d.buyY;
        document.getElementById('housePrice').value = d.hPrice;
        document.getElementById('downPayment').value = d.down;
        document.getElementById('loanYears').value = d.loanY;
        
        // 更新生活型態按鈕的 Active 狀態
        document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active'));
        if(d.livingPct <= 30) document.querySelectorAll('.tier-btn')[0].classList.add('active');
        else if(d.livingPct >= 70) document.querySelectorAll('.tier-btn')[2].classList.add('active');
        else document.querySelectorAll('.tier-btn')[1].classList.add('active');
    },

    // --- 5. 核心運算引擎 (Engine) ---
    calculateScenario: (d) => {
        const years = d.years || 20;
        const inflation = d.inf / 100;
        const roi = d.roi / 100;
        const investPct = d.rate / 100;
        const livingPct = d.livingPct / 100;
        
        let inv = 0, cash = 0, house = 0, loan = 0, hasHouse = false;
        let currentRankIdx = APP.ranks.indexOf(d.cRank);
        const targetIdx = APP.ranks.indexOf(d.tRank);
        let yearInRank = 0;

        const res = { years:[], net:[], inv:[], cash:[], house:[], logs:[] };

        for(let y=1; y<=years; y++) {
            // A. 晉升邏輯：每4年升一階，直到目標階級
            if (y > 1 && y % 4 === 0 && currentRankIdx < targetIdx) {
                currentRankIdx++; yearInRank = 0;
            } else yearInRank++;
            
            let rName = APP.ranks[currentRankIdx];
            const rInfo = APP.rankData[rName];

            // B. 收入計算
            let monthPay = 0;
            if (d.realPay > 0) monthPay = d.realPay * Math.pow(1.015, y-1); 
            else {
                // 本俸(年資成長) + 專業加給 + 志願役加給(15000)
                const base = rInfo.b * Math.pow(1.015, yearInRank);
                monthPay = base + rInfo.p + 15000; 
            }
            let annualInc = monthPay * 13.5;

            // [核心修正] 退伍金挹注 (Retirement Benefit)
            // 假設滿20年退伍，模擬領取一次性退伍金或其現值
            if (y === years && years >= 20) {
                // 簡易估算模型：月薪 * 基數(約100+) * 折現係數
                // 目的：讓資產負債表在退伍年有正確的躍升
                const pensionFactor = 100 + (currentRankIdx * 10); 
                const pension = monthPay * pensionFactor * 0.4; // 保守估計約 400-600萬
                annualInc += pension;
                rName += " (含退伍金)";
            }

            // C. 買房事件 (Asset Acquisition)
            let mortPay = 0;
            if (d.buyHouse && y === d.buyY && !hasHouse) {
                hasHouse = true; 
                house = d.hPrice * 10000;
                const down = house * (d.down/100);
                loan = house - down;
                
                // [核心修正] 資產平衡 (Rebalancing)
                // 優先使用現金付頭期，不足則變賣投資部位
                if(cash >= down) {
                    cash -= down;
                } else { 
                    const remain = down - cash;
                    cash = 0; 
                    inv -= remain; // 賣股變現
                    // 若 inv 變負值，代表破產 (此處暫不擋，讓圖表顯示負債)
                }
            }
            
            // 房貸攤還 (本息均攤)
            if (hasHouse && loan > 0) {
                const r = 0.022/12, n = d.loanY*12;
                const pmt = loan * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
                mortPay = pmt * 12;
                loan -= (mortPay - loan*0.022); 
                if(loan<0) loan=0;
            }

            // D. 支出計算 (Living Expense)
            // 生活費隨薪資比例成長 (生活方式通膨)
            const livingAmt = monthPay * livingPct; 
            const annualExp = (livingAmt + d.fixed) * 12 * Math.pow(1+inflation, y-1);
            
            // E. 投資投入
            const annualInv = (monthPay * investPct * 12);
            
            // F. 年度結餘 (Surplus)
            const surplus = annualInc - annualExp - annualInv - mortPay;

            // G. 複利滾存
            inv = inv * (1+roi) + annualInv;
            cash += surplus;
            
            // 計算淨資產
            const houseNet = hasHouse ? Math.max(0, house-loan) : 0;
            const net = inv + cash + houseNet;

            // 紀錄數據
            res.years.push(y); 
            res.net.push(net); 
            res.inv.push(inv); 
            res.cash.push(cash); 
            res.house.push(houseNet);
            res.logs.push({ y, rank: rName, inc: annualInc, exp: annualExp, inv: annualInv, mort: mortPay, net });
        }
        return res;
    },

    // --- 6. 畫面更新 ---
    update: () => {
        APP.saveFromUI(APP.currentTab);
        
        // 分別計算 A/B 兩案
        const rA = APP.calculateScenario(APP.store.A);
        const rB = APP.calculateScenario(APP.store.B);
        
        const lastA = rA.net[rA.net.length-1];
        const lastB = rB.net[rB.net.length-1];
        
        // 更新 KPI
        document.getElementById('kpi-A').innerText = APP.F(lastA);
        document.getElementById('kpi-B').innerText = APP.F(lastB);
        
        // 計算 Alpha (效益差額：Plan B - Plan A)
        const alpha = lastB - lastA;
        // 若當前在 A 分頁，顯示 B 相對 A 的優勢；若在 B 分頁亦同
        document.getElementById('kpi-diff').innerText = (alpha>=0?'+':'') + APP.F(alpha);
        
        // 繪圖
        APP.drawCharts(rA, rB);
        
        // 繪製表格 (只顯示當前 Tab)
        const currR = APP.currentTab === 'A' ? rA : rB;
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        currR.logs.forEach(r => {
            tb.innerHTML += `<tr>
                <td class="p-2 text-center text-slate-500">${r.y}</td>
                <td class="p-2 text-left font-bold text-slate-300">${r.rank}</td>
                <td class="p-2 text-blue-400">${APP.F(r.inc)}</td>
                <td class="p-2 text-rose-400">${APP.F(r.exp)}</td>
                <td class="p-2 text-emerald-400">${APP.F(r.inv)}</td>
                <td class="p-2 text-orange-400">${APP.F(r.mort)}</td>
                <td class="p-2 font-bold text-white pr-4">${APP.F(r.net)}</td>
            </tr>`;
        });
        
        // 控制房產區塊顯示
        const buy = document.getElementById('buyHouse').checked;
        document.getElementById('housing-area').className = buy ? 'block space-y-2 text-sm border-t border-slate-700 pt-2' : 'hidden';
    },

    drawCharts: (rA, rB) => {
        const labels = rA.years.map(y => 'Y'+y);
        const currR = APP.currentTab === 'A' ? rA : rB;

        // 圖表 1: 資產成長比較
        const ctx1 = document.getElementById('chart-asset').getContext('2d');
        if(APP.charts.asset) APP.charts.asset.destroy();
        
        // 建立漸層背景
        const gradA = ctx1.createLinearGradient(0,0,0,300); 
        gradA.addColorStop(0, 'rgba(56, 189, 248, 0.2)'); 
        gradA.addColorStop(1, 'rgba(56, 189, 248, 0)');

        APP.charts.asset = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { 
                        label: 'Plan A (保守)', 
                        data: rA.net, 
                        borderColor: '#38bdf8', // Light Blue
                        backgroundColor: gradA, 
                        fill: true, 
                        tension: 0.4 
                    },
                    { 
                        label: 'Plan B (積極)', 
                        data: rB.net, 
                        borderColor: '#94a3b8', // Slate
                        borderDash:[5,5], 
                        tension: 0.4 
                    }
                ]
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { labels: { color: '#94a3b8' } } }, 
                scales: { 
                    x: { grid: { color: '#1e293b' } }, 
                    y: { grid: { color: '#1e293b' }, ticks: { callback: v => v/10000 + '萬' } } 
                } 
            }
        });

        // 圖表 2: 資產結構堆疊圖
        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'bar',
            data: {
                labels: currR.years.map(y=>'Y'+y),
                datasets: [
                    { label: '金融資產', data: currR.inv, backgroundColor: '#10b981' }, // Emerald
                    { label: '現金', data: currR.cash, backgroundColor: '#3b82f6' }, // Blue
                    { label: '房產淨值', data: currR.house, backgroundColor: '#f97316' } // Orange
                ]
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    x: { stacked: true, grid: { display: false } }, 
                    y: { stacked: true, grid: { color: '#1e293b' }, ticks: { callback: v => v/10000 + '萬' } } 
                } 
            }
        });
    }
};

window.onload = APP.init;
