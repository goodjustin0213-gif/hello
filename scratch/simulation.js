/**
 * 國軍財務戰情室核心邏輯 v24.0 (Final Stable)
 * 特色：
 * 1. 所見即所得 (WYSIWYG)：直接讀取介面數值，杜絕暫存不同步問題。
 * 2. 暴力防呆：所有輸入強制轉型，空值自動補 0。
 * 3. 雙軌運算：同時計算 A/B 兩案並繪製比較圖。
 */

const APP = {
    currentTab: 'A',
    // 資料暫存區 (用於切換 Tab 時保存數據)
    store: { A: {}, B: {} },
    charts: {},

    // --- 資料層：2025 軍職薪資資料庫 (本俸+專業加給預估) ---
    rankDB: {
        '二兵': {b:10550, p:0}, '一兵': {b:11130, p:0}, '上兵': {b:12280, p:0},
        '下士': {b:14645, p:5500}, '中士': {b:16585, p:6200}, '上士': {b:18525, p:7000},
        '三等士官長': {b:22750, p:8200}, '二等士官長': {b:25050, p:9500}, '一等士官長': {b:28880, p:10800},
        '少尉': {b:22750, p:8500}, '中尉': {b:25050, p:9800}, '上尉': {b:28880, p:11500},
        '少校': {b:32710, p:23000}, '中校': {b:37310, p:26000}, '上校': {b:41900, p:32000}, '少將': {b:48030, p:40000}
    },
    ranks: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校','少將'],

    // --- 工具函式 ---
    // N: 強制轉數值，移除逗號，空值回傳 0
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    // F: 金額千分位格式化
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 初始化 ---
    init: () => {
        // Chart.js 全域設定
        Chart.defaults.font.family = "'Noto Sans TC', sans-serif";
        Chart.defaults.color = '#64748b';
        Chart.defaults.borderColor = '#e2e8f0';

        // 1. 注入階級選單
        const opts = APP.ranks.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;

        // 2. 初始化 A/B 案預設值
        const def = {
            cRank:'少尉', tRank:'中校', years:20, realPay:0,
            living:15000, fixed:5000, 
            rate:30, roi:6, inf:2,
            buyHouse:false, buyY:10, hPrice:1200, down:20, loanY:30,
            listAllow: [], listExp: [], listInv: []
        };
        
        // 深拷貝預設值
        APP.store.A = JSON.parse(JSON.stringify(def));
        APP.store.B = JSON.parse(JSON.stringify(def));
        
        // 設定 B 案差異 (對照組)
        APP.store.B.roi = 1.5; // 定存利率
        APP.store.B.rate = 10; // 低儲蓄率

        // 載入 A 案到介面
        APP.loadToUI('A');
        
        // 啟動第一次運算
        APP.update();
    },

    // --- 介面操作邏輯 ---
    
    // 切換方案 A/B
    switchTab: (tab) => {
        APP.saveFromUI(APP.currentTab); // 切換前先將目前畫面存入暫存
        APP.currentTab = tab;
        
        // 更新按鈕樣式
        document.getElementById('tab-A').className = tab==='A' ? 'tab active' : 'tab';
        document.getElementById('tab-B').className = tab==='B' ? 'tab active' : 'tab';
        
        APP.loadToUI(tab); // 載入新方案數據
        APP.update();
    },

    // 從 UI 讀取資料存入 Store (暫存)
    saveFromUI: (tab) => {
        const d = APP.store[tab];
        // 讀取一般欄位
        d.cRank = document.getElementById('currentRank').value;
        d.tRank = document.getElementById('targetRank').value;
        d.years = APP.N(document.getElementById('years').value);
        d.realPay = APP.N(document.getElementById('realPay').value);
        
        d.living = APP.N(document.getElementById('livingCost').value);
        d.fixed = APP.N(document.getElementById('fixedCost').value);
        
        d.rate = APP.N(document.getElementById('investRate').value);
        d.roi = APP.N(document.getElementById('roi').value);
        d.inf = APP.N(document.getElementById('inflation').value);
        
        d.buyHouse = document.getElementById('buyHouse').checked;
        d.buyY = APP.N(document.getElementById('buyYear').value);
        d.hPrice = APP.N(document.getElementById('housePrice').value);
        d.down = APP.N(document.getElementById('downPayment').value);
        d.loanY = APP.N(document.getElementById('loanYears').value);

        // 讀取動態列表
        d.listAllow = APP.readList('list-allowance');
        d.listExp = APP.readList('list-expense');
        d.listInv = APP.readList('list-invest');
    },

    // 將 Store 資料填回 UI
    loadToUI: (tab) => {
        const d = APP.store[tab];
        // 回填一般欄位
        document.getElementById('currentRank').value = d.cRank;
        document.getElementById('targetRank').value = d.tRank;
        document.getElementById('years').value = d.years;
        document.getElementById('realPay').value = d.realPay;
        
        document.getElementById('livingCost').value = d.living;
        document.getElementById('fixedCost').value = d.fixed;
        
        document.getElementById('investRate').value = d.rate;
        document.getElementById('rateLabel').innerText = d.rate + '%';
        document.getElementById('roi').value = d.roi;
        document.getElementById('inflation').value = d.inf;
        
        document.getElementById('buyHouse').checked = d.buyHouse;
        document.getElementById('housing-area').className = d.buyHouse ? 'space-y-2 text-sm' : 'hidden';
        document.getElementById('buyYear').value = d.buyY;
        document.getElementById('housePrice').value = d.hPrice;
        document.getElementById('downPayment').value = d.down;
        document.getElementById('loanYears').value = d.loanY;

        // 回填動態列表
        APP.renderList('list-allowance', d.listAllow);
        APP.renderList('list-expense', d.listExp);
        APP.renderList('list-invest', d.listInv);
    },

    // --- 動態列表管理 ---
    
    // 新增項目
    add: (id) => {
        const c = document.getElementById(id);
        const div = document.createElement('div');
        div.className = 'item-row';
        div.innerHTML = `
            <input type="text" class="border p-1 text-sm rounded flex-1" value="項目">
            <input type="number" class="border p-1 text-sm rounded w-20 text-right" value="0" oninput="APP.update()">
            <div class="btn-del" onclick="this.parentElement.remove(); APP.update()">✕</div>
        `;
        c.appendChild(div);
        APP.update(); // 新增後立即運算
    },
    
    // 渲染列表 (用於 loadToUI)
    renderList: (id, list) => {
        const c = document.getElementById(id); c.innerHTML = '';
        list.forEach(i => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <input type="text" class="border p-1 text-sm rounded flex-1" value="${i.n}">
                <input type="number" class="border p-1 text-sm rounded w-20 text-right" value="${i.v}" oninput="APP.update()">
                <div class="btn-del" onclick="this.parentElement.remove(); APP.update()">✕</div>
            `;
            c.appendChild(div);
        });
    },

    // 讀取列表 (用於 saveFromUI)
    readList: (id) => {
        const arr = [];
        document.getElementById(id).querySelectorAll('.item-row').forEach(row => {
            const inputs = row.querySelectorAll('input');
            arr.push({ n: inputs[0].value, v: APP.N(inputs[1].value) });
        });
        return arr;
    },

    // --- 核心運算引擎 (The Engine) ---
    calculateScenario: (d) => {
        // 1. 參數解構
        const years = d.years || 20;
        const inflation = d.inf / 100;
        const roi = d.roi / 100;
        const investPct = d.rate / 100;
        
        let rank = d.cRank;
        let inv = 0, cash = 0, house = 0, loan = 0, hasHouse = false;
        
        // 階級索引
        const targetIdx = APP.ranks.indexOf(d.tRank);
        let currentRankIdx = APP.ranks.indexOf(rank);
        let yearInRank = 0;

        // 計算各列表總和
        const sumAllow = d.listAllow.reduce((a,b)=>a+b.v,0);
        // 總月支出 = 基本 + 固定 + 額外列表
        const sumExp = d.listExp.reduce((a,b)=>a+b.v,0) + d.living + d.fixed;
        // 固定月投資
        const sumInv = d.listInv.reduce((a,b)=>a+b.v,0);

        const res = { years:[], net:[], inv:[], cash:[], house:[], logs:[] };

        // 2. 逐年模擬
        for(let y=1; y<=years; y++) {
            // A. 晉升邏輯 (每4年升一階，直到目標)
            if (y > 1 && y % 4 === 0 && currentRankIdx < targetIdx) {
                currentRankIdx++; yearInRank = 0;
            } else yearInRank++;
            
            const rName = APP.ranks[currentRankIdx];
            const rInfo = APP.rankData[rName];

            // B. 收入計算
            let monthPay = 0;
            if (d.realPay > 0) {
                // 若有填實領，以此為基準隨年資微幅成長
                monthPay = d.realPay * Math.pow(1.015, y-1); 
            } else {
                // 資料庫模式：本俸(年資成長) + 專業 + 1.5萬志願役 + 列表加給
                const base = rInfo.b * Math.pow(1.015, yearInRank);
                monthPay = base + rInfo.p + 15000 + sumAllow;
            }
            const annualInc = monthPay * 13.5;

            // C. 房貸計算
            let mortPay = 0;
            if (d.buyHouse && y === d.buyY && !hasHouse) {
                hasHouse = true; house = d.hPrice * 10000;
                const down = house * (d.down/100);
                loan = house - down;
                // 付頭期 (優先扣現金)
                if(cash >= down) cash -= down;
                else { inv -= (down-cash); cash = 0; }
            }
            if (hasHouse && loan > 0) {
                // 本息均攤公式
                const r = 0.022/12; // 房貸利率固定 2.2% 簡化計算
                const n = d.loanY*12;
                const pmt = loan * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
                mortPay = pmt * 12;
                loan -= (mortPay - loan*0.022); // 簡扣本金
                if(loan<0) loan=0;
            }

            // D. 支出與分配 (會計恆等式)
            const annualExp = sumExp * 12 * Math.pow(1+inflation, y-1); // 支出隨通膨增加
            const annualInv = (monthPay * investPct * 12) + (sumInv * 12); // 投資 = 提撥 + 定投
            const surplus = annualInc - annualExp - annualInv - mortPay;   // 結餘

            // E. 滾存
            inv = inv * (1+roi) + annualInv;
            cash += surplus; // 結餘計入現金池 (負值即負債)
            const houseNet = hasHouse ? Math.max(0, house-loan) : 0;
            const net = inv + cash + houseNet;

            // F. 紀錄
            res.years.push(y); res.net.push(net); res.inv.push(inv); res.cash.push(cash); res.house.push(houseNet);
            res.logs.push({ y, rank: rName, inc: annualInc, exp: annualExp, inv: annualInv, mort: mortPay, net });
        }
        return res;
    },

    // --- 主更新入口 ---
    update: () => {
        // 1. 將當前 UI 狀態存入 Store
        APP.saveFromUI(APP.currentTab);
        
        // 2. 分別運算 A 案與 B 案
        const rA = APP.calculateScenario(APP.store.A);
        const rB = APP.calculateScenario(APP.store.B);
        
        // 3. 顯示 KPI
        const lastA = rA.net.length-1;
        const lastB = rB.net.length-1;
        document.getElementById('kpi-A').innerText = APP.F(rA.net[lastA]);
        document.getElementById('kpi-B').innerText = APP.F(rB.net[lastB]);
        const diff = rA.net[lastA] - rB.net[lastB];
        const diffEl = document.getElementById('kpi-diff');
        diffEl.innerText = (diff>=0?'+':'') + APP.F(diff);
        diffEl.className = `kpi-val ${diff>=0 ? 'text-emerald-600' : 'text-red-600'}`;
        
        // 4. 繪製圖表
        APP.drawCharts(rA, rB);
        
        // 5. 繪製表格 (僅顯示當前 Tab 的數據)
        const currR = APP.currentTab === 'A' ? rA : rB;
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        currR.logs.forEach(r => {
            tb.innerHTML += `<tr>
                <td class="p-2 border-b text-center text-gray-500 font-mono">Y${r.y}</td>
                <td class="p-2 border-b font-bold text-gray-700">${r.rank}</td>
                <td class="p-2 border-b text-right text-blue-600">${APP.F(r.inc)}</td>
                <td class="p-2 border-b text-right text-red-500">${APP.F(r.exp)}</td>
                <td class="p-2 border-b text-right text-green-600">${APP.F(r.inv)}</td>
                <td class="p-2 border-b text-right text-orange-500">${APP.F(r.mort)}</td>
                <td class="p-2 border-b text-right font-black text-gray-800">${APP.F(r.net)}</td>
            </tr>`;
        });
        
        // 控制購屋區塊顯示
        const buy = document.getElementById('buyHouse').checked;
        document.getElementById('housing-area').className = buy ? 'space-y-2 text-sm mt-2' : 'hidden';
    },

    // --- 圖表繪製 ---
    drawCharts: (rA, rB) => {
        // 取兩者最長年份，避免 X 軸不對齊
        const maxLen = Math.max(rA.years.length, rB.years.length);
        const labels = Array.from({length: maxLen}, (_, i) => `Y${i+1}`);
        const currR = APP.currentTab === 'A' ? rA : rB;

        // Chart 1: 資產對照 (Line)
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '方案 A', data: rA.net, borderColor: '#2563eb', borderWidth: 3, tension: 0.3, pointRadius:0 },
                    { label: '方案 B', data: rB.net, borderColor: '#94a3b8', borderWidth: 2, borderDash: [5,5], pointRadius:0 }
                ]
            }, options: { responsive: true, maintainAspectRatio: false }
        });

        // Chart 2: 資產結構 (Bar - Stacked)
        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'bar',
            data: {
                labels: currR.years.map(y=>'Y'+y),
                datasets: [
                    { label: '房產淨值', data: currR.house, backgroundColor: '#f97316', stack: '1' },
                    { label: '投資累積', data: currR.inv, backgroundColor: '#10b981', stack: '1' },
                    { label: '現金結餘', data: currR.cash, backgroundColor: '#3b82f6', stack: '1' }
                ]
            }, options: { responsive: true, maintainAspectRatio: false, scales: { x: {stacked: true}, y: {stacked: true} } }
        });
    }
};

// 系統啟動
window.onload = APP.init;
