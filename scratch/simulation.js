/**
 * 國軍財務戰情室 PRO v25.0 (Tactical Edition) - Core Logic
 * * 主要更新：
 * 1. 引入 Chart.js 深色模式設定
 * 2. 支出邏輯重構：改為「薪資百分比」連動
 * 3. 房產邏輯：支援現金不足時自動變賣投資部位
 */

// --- 1. 全局圖表設定 (深色風格) ---
Chart.defaults.color = '#64748b'; // 文字顏色 (Slate-500)
Chart.defaults.borderColor = '#334155'; // 格線顏色 (Slate-700)
Chart.defaults.font.family = "'JetBrains Mono', 'Noto Sans TC', sans-serif";

const APP = {
    currentTab: 'A',       // 目前顯示的分頁
    store: { A: {}, B: {} }, // 資料暫存區
    charts: {},            // 圖表實例

    // --- 2. 2025 薪資結構資料庫 (本俸 + 專業加給參考值) ---
    rankData: {
        '二兵': {b:10550, p:0}, '一兵': {b:11130, p:0}, '上兵': {b:12280, p:0},
        '下士': {b:14645, p:5500}, '中士': {b:16585, p:6200}, '上士': {b:18525, p:7000},
        '三等士官長': {b:22750, p:8200}, '二等士官長': {b:25050, p:9500}, '一等士官長': {b:28880, p:10800},
        '少尉': {b:22750, p:8500}, '中尉': {b:25050, p:9800}, '上尉': {b:28880, p:11500},
        '少校': {b:32710, p:23000}, '中校': {b:37310, p:26000}, '上校': {b:41900, p:32000}, '少將': {b:48030, p:40000}
    },
    ranks: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校','少將'],

    // 工具函式：數值格式化
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 3. 初始化 ---
    init: () => {
        // 產生階級選單
        const opts = APP.ranks.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;

        // 設定預設參數
        const def = {
            cRank:'少尉', tRank:'中校', years:20, realPay:0,
            livingPct: 30, // [核心變更] 改為百分比，預設 30%
            fixed: 5000,   // 剛性支出 (保險/孝親)
            rate: 30,      // 投資提撥率
            roi: 6,        // 年化報酬率
            inf: 2,        // 通膨率
            buyHouse:false, buyY:10, hPrice:1200, down:20, loanY:30, // 房產參數
            listExp: []    // 額外支出列表
        };
        
        // 複製預設值給 A/B 兩案
        APP.store.A = JSON.parse(JSON.stringify(def));
        APP.store.B = JSON.parse(JSON.stringify(def));
        
        // 設定 B 案 (對照組) 預設值：保守定存族，花費較高
        APP.store.B.roi = 1.2; 
        APP.store.B.rate = 20; 
        APP.store.B.livingPct = 40; 

        APP.loadToUI('A');
        APP.update();
    },

    // --- 4. 介面操作邏輯 ---
    switchTab: (tab) => {
        APP.saveFromUI(APP.currentTab); // 切換前先存檔
        APP.currentTab = tab;
        
        // 更新按鈕樣式
        document.getElementById('tab-A').className = `s-btn ${tab==='A'?'active':''}`;
        document.getElementById('tab-B').className = `s-btn ${tab==='B'?'active':''}`;
        
        APP.loadToUI(tab); // 讀取新分頁數據
        APP.update();
    },

    saveFromUI: (tab) => {
        const d = APP.store[tab];
        // 讀取 DOM 數值
        d.cRank = document.getElementById('currentRank').value;
        d.tRank = document.getElementById('targetRank').value;
        d.years = APP.N(document.getElementById('years').value);
        d.realPay = APP.N(document.getElementById('realPay').value);
        
        d.livingPct = APP.N(document.getElementById('livingPct').value); // 百分比
        d.fixed = APP.N(document.getElementById('fixedCost').value);
        
        d.rate = APP.N(document.getElementById('investRate').value);
        d.roi = APP.N(document.getElementById('roi').value);
        d.inf = APP.N(document.getElementById('inflation').value);
        
        d.buyHouse = document.getElementById('buyHouse').checked;
        d.buyY = APP.N(document.getElementById('buyYear').value);
        d.hPrice = APP.N(document.getElementById('housePrice').value);
        d.down = APP.N(document.getElementById('downPayment').value);
        d.loanY = APP.N(document.getElementById('loanYears').value);

        d.listExp = APP.readList('list-expense');
    },

    loadToUI: (tab) => {
        const d = APP.store[tab];
        // 將數值回填 DOM
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
        document.getElementById('housing-area').className = d.buyHouse ? 'space-y-3 pt-2 border-t border-slate-700' : 'hidden';
        document.getElementById('buyYear').value = d.buyY;
        document.getElementById('housePrice').value = d.hPrice;
        document.getElementById('downPayment').value = d.down;
        document.getElementById('loanYears').value = d.loanY;

        APP.renderList('list-expense', d.listExp);
    },

    // --- 5. 動態列表處理 ---
    add: (id) => {
        const c = document.getElementById(id);
        const div = document.createElement('div');
        div.className = 'flex gap-2 mb-2 items-center';
        div.innerHTML = `
            <input type="text" class="flex-1" value="項目" placeholder="名稱">
            <input type="number" class="w-20 text-right" value="0" oninput="APP.update()">
            <button class="text-rose-500 hover:text-rose-400 px-2" onclick="this.parentElement.remove(); APP.update()">✕</button>
        `;
        c.appendChild(div);
        APP.update();
    },
    
    renderList: (id, list) => {
        const c = document.getElementById(id); c.innerHTML = '';
        list.forEach(i => {
            const div = document.createElement('div');
            div.className = 'flex gap-2 mb-2 items-center';
            div.innerHTML = `
                <input type="text" class="flex-1" value="${i.n}">
                <input type="number" class="w-20 text-right" value="${i.v}" oninput="APP.update()">
                <button class="text-rose-500 hover:text-rose-400 px-2" onclick="this.parentElement.remove(); APP.update()">✕</button>
            `;
            c.appendChild(div);
        });
    },

    readList: (id) => {
        const arr = [];
        document.getElementById(id).querySelectorAll('div').forEach(row => {
            const inputs = row.querySelectorAll('input');
            if(inputs.length >= 2) arr.push({ n: inputs[0].value, v: APP.N(inputs[1].value) });
        });
        return arr;
    },

    // --- 6. 核心運算引擎 (Engine) ---
    calculateScenario: (d) => {
        const years = d.years || 20;
        const inflation = d.inf / 100;
        const roi = d.roi / 100;
        const investPct = d.rate / 100;
        const livingPct = d.livingPct / 100; // [變更點] 讀取生活費百分比
        
        let rank = d.cRank;
        let inv = 0, cash = 0, house = 0, loan = 0, hasHouse = false;
        
        const rankIdx = APP.ranks.indexOf(rank);
        const targetIdx = APP.ranks.indexOf(d.tRank);
        let currentRankIdx = rankIdx;
        let yearInRank = 0;

        const sumExpList = d.listExp.reduce((a,b)=>a+b.v,0);
        const res = { years:[], net:[], inv:[], cash:[], house:[], logs:[] };

        for(let y=1; y<=years; y++) {
            // 晉升邏輯：每4年升一階，直到目標階級
            if (y > 1 && y % 4 === 0 && currentRankIdx < targetIdx) {
                currentRankIdx++; yearInRank = 0;
            } else yearInRank++;
            
            const rName = APP.ranks[currentRankIdx];
            const rInfo = APP.rankData[rName];

            // A. 收入計算
            let monthPay = 0;
            if (d.realPay > 0) {
                // 若有輸入實領薪資，假設每年微幅成長 1.5%
                monthPay = d.realPay * Math.pow(1.015, y-1); 
            } else {
                // 自動計算：本俸(隨年資成長) + 專業加給 + 志願役加給(15000)
                const base = rInfo.b * Math.pow(1.015, yearInRank);
                monthPay = base + rInfo.p + 15000;
            }
            const annualInc = monthPay * 13.5; // 年薪約 13.5 個月

            // B. 房產處理
            let mortPay = 0;
            if (d.buyHouse && y === d.buyY && !hasHouse) {
                hasHouse = true; 
                house = d.hPrice * 10000; // 轉為元
                const down = house * (d.down/100); // 頭期款
                loan = house - down;

                // 支付頭期款邏輯：先扣現金，不夠再賣股票
                if(cash >= down) {
                    cash -= down;
                } else { 
                    const remain = down - cash;
                    cash = 0; 
                    inv -= remain; // 從投資帳戶扣除
                }
            }
            if (hasHouse && loan > 0) {
                // 本息均攤計算
                const r = 0.022/12, n = d.loanY*12; // 2.2% 利率
                const pmt = loan * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
                mortPay = pmt * 12;
                // 簡易扣除本金 (模擬)
                loan -= (mortPay - loan*0.022); 
                if(loan<0) loan=0;
            }

            // C. 支出計算 (核心變更)
            // 生活費是月薪的 %，模擬「賺越多花越多」的人性
            const livingAmt = monthPay * livingPct; 
            const totalMonthExp = livingAmt + d.fixed + sumExpList;
            
            // 加計通膨
            const annualExp = totalMonthExp * 12 * Math.pow(1+inflation, y-1);
            
            // D. 投資投入
            const annualInv = (monthPay * investPct * 12);
            
            // E. 年度結餘
            const surplus = annualInc - annualExp - annualInv - mortPay;

            // F. 複利滾存
            inv = inv * (1+roi) + annualInv;
            cash += surplus; // 結餘存入現金
            
            // 計算淨資產 (投資 + 現金 + 房屋淨值)
            const houseNet = hasHouse ? Math.max(0, house-loan) : 0;
            const net = inv + cash + houseNet;

            // 紀錄數據
            res.years.push(y); 
            res.net.push(net); 
            res.inv.push(inv); 
            res.cash.push(cash); 
            res.house.push(houseNet);
            res.logs.push({ 
                y, rank: rName, inc: annualInc, exp: annualExp, 
                inv: annualInv, mort: mortPay, net 
            });
        }
        return res;
    },

    // --- 7. 更新畫面與圖表 ---
    update: () => {
        APP.saveFromUI(APP.currentTab);
        
        // 分別計算兩案
        const rA = APP.calculateScenario(APP.store.A);
        const rB = APP.calculateScenario(APP.store.B);
        
        // 更新 KPI 卡片
        const lastA = rA.net.length-1;
        const lastB = rB.net.length-1;
        document.getElementById('kpi-A').innerText = APP.F(rA.net[lastA]);
        document.getElementById('kpi-B').innerText = APP.F(rB.net[lastB]);
        
        // 計算 Alpha (效益差額)
        const diff = rA.net[lastA] - rB.net[lastB];
        const diffEl = document.getElementById('kpi-diff');
        diffEl.innerText = (diff>=0?'+':'') + APP.F(diff);
        diffEl.className = diff >= 0 ? 'stat-value text-emerald-400' : 'stat-value text-rose-400';
        
        // 繪製圖表
        APP.drawCharts(rA, rB);
        
        // 更新表格 (只顯示當前 Tab)
        const currR = APP.currentTab === 'A' ? rA : rB;
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        currR.logs.forEach(r => {
            tb.innerHTML += `<tr>
                <td class="pl-4 text-slate-500">Y${r.y}</td>
                <td class="text-left font-bold text-white">${r.rank}</td>
                <td class="text-blue-400">${APP.F(r.inc)}</td>
                <td class="text-rose-400">${APP.F(r.exp)}</td>
                <td class="text-emerald-400">${APP.F(r.inv)}</td>
                <td class="text-orange-400">${APP.F(r.mort)}</td>
                <td class="pr-4 font-black text-cyan-400">${APP.F(r.net)}</td>
            </tr>`;
        });
        
        // 房產區域顯示開關
        const buy = document.getElementById('buyHouse').checked;
        document.getElementById('housing-area').className = buy ? 'space-y-3 pt-2 border-t border-slate-700 mt-2 block' : 'hidden';
    },

    drawCharts: (rA, rB) => {
        const labels = rA.years.map(y => 'Y'+y);
        const currR = APP.currentTab === 'A' ? rA : rB;

        // Chart 1: 資產成長曲線
        const ctx1 = document.getElementById('chart-asset').getContext('2d');
        if(APP.charts.asset) APP.charts.asset.destroy();
        
        // 漸層效果
        const gradientA = ctx1.createLinearGradient(0, 0, 0, 400);
        gradientA.addColorStop(0, 'rgba(6, 182, 212, 0.5)'); // Cyan
        gradientA.addColorStop(1, 'rgba(6, 182, 212, 0)');

        APP.charts.asset = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { 
                        label: 'Plan A (主案)', 
                        data: rA.net, 
                        borderColor: '#22d3ee', 
                        backgroundColor: gradientA,
                        borderWidth: 2, 
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    },
                    { 
                        label: 'Plan B (對照)', 
                        data: rB.net, 
                        borderColor: '#64748b', 
                        borderWidth: 2, 
                        borderDash: [5,5], 
                        tension: 0.4,
                        pointRadius: 0
                    }
                ]
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { color: '#94a3b8', font: {family: 'JetBrains Mono'} } },
                    tooltip: { 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                        titleColor: '#fff', 
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b' } },
                    y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', callback: v => v/10000 + '萬' } }
                }
            }
        });

        // Chart 2: 資產堆疊圖
        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'bar',
            data: {
                labels: currR.years.map(y=>'Y'+y),
                datasets: [
                    { label: '投資', data: currR.inv, backgroundColor: '#10b981', stack: '1' },
                    { label: '現金', data: currR.cash, backgroundColor: '#3b82f6', stack: '1' },
                    { label: '房產淨值', data: currR.house, backgroundColor: '#f97316', stack: '1' }
                ]
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position:'bottom', labels: { boxWidth: 12, padding: 20 } } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: '#1e293b' }, ticks: { callback: v => v/10000 + '萬' } }
                }
            }
        });
    }
};

window.onload = APP.init;
