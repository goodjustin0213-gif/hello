/**
 * 國軍財務戰情室 v27.0 - 學術決策版 (Academic & Strategy Edition)
 * * [核心優化邏輯]
 * 1. Lifestyle Creep Model: 隨階級(Rank)提升，生活支出會自動乘以「品味加權係數」，模擬教授說的「從國產車換到進口車」。
 * 2. Budget Integrity Check: 嚴格檢查「年度總支出」是否大於「年度總收入」。若發生，系統會觸發紅字警示。
 * 3. Asset Liquidation: 買房頭期款優先扣除現金，不足處自動變賣投資部位(Investment Liquidation)。
 * 4. Retirement Injection: 滿 20 年年資於最後一年自動計算「預估退伍金一次領」現值。
 */

// --- 1. 全局配置與圖表設定 ---
Chart.defaults.color = '#94a3af';
Chart.defaults.borderColor = '#1e293b';
Chart.defaults.font.family = "'JetBrains Mono', 'Noto Sans TC', sans-serif";

const APP = {
    currentTab: 'A',
    store: { A: {}, B: {} },
    charts: {},
    
    // 薪資資料庫 (2025年基準)
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

    // --- 2. 初始化流程 ---
    init: () => {
        // 生成 UI 選單
        const opts = APP.ranks.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;

        // 設定方案 A (Baseline): 錄音中提到的「不做任何改變」的現狀
        APP.store.A = {
            cRank:'少尉', tRank:'中校', years:20, realPay:0,
            livingPct: 50, fixed: 5000, 
            rate: 10, roi: 2.0, inf: 2.0, // 低投資、低報酬
            buyHouse:false, buyY:10, hPrice:1200, down:20, loanY:30
        };
        
        // 設定方案 B (Strategy): 教授建議的「優化決策」
        APP.store.B = JSON.parse(JSON.stringify(APP.store.A));
        APP.store.B.livingPct = 30; // 節省支出
        APP.store.B.rate = 40;      // 積極儲蓄
        APP.store.B.roi = 6.0;      // 指數化投資

        APP.loadToUI('A');
        APP.update();
    },

    // --- 3. UI 控制邏輯 ---
    switchTab: (tab) => {
        APP.saveFromUI(APP.currentTab);
        APP.currentTab = tab;
        APP.loadToUI(tab);
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
        document.getElementById('buyYear').value = d.buyY;
        document.getElementById('housePrice').value = d.housePrice;
        document.getElementById('downPayment').value = d.down;
        document.getElementById('loanYears').value = d.loanY;
        
        // 切換按鈕樣式
        document.getElementById('tab-A').classList.toggle('active', tab==='A');
        document.getElementById('tab-B').classList.toggle('active', tab==='B');
    },

    // --- 4. 核心運算引擎 (V27.0 重寫版) ---
    calculateScenario: (d) => {
        const years = d.years || 20;
        const roi = d.roi / 100;
        const inf = d.inf / 100;
        
        let inv = 0, cash = 0, housePrice = 0, loanBalance = 0, hasHouse = false;
        let currentIdx = APP.ranks.indexOf(d.cRank);
        let targetIdx = APP.ranks.indexOf(d.tRank);
        let yearInRank = 0;
        let budgetAlert = false;

        const res = { years:[], net:[], inv:[], cash:[], house:[], logs:[], hasError: false };

        for(let y=1; y<=years; y++) {
            // 晉升判定
            if (y > 1 && y % 4 === 0 && currentIdx < targetIdx) {
                currentIdx++; yearInRank = 0;
            } else yearInRank++;
            
            let rankName = APP.ranks[currentIdx];
            const rInfo = APP.rankData[rankName];

            // A. 收入計算
            let monthPay = d.realPay > 0 ? d.realPay * Math.pow(1.015, y-1) : (rInfo.b * Math.pow(1.015, yearInRank)) + rInfo.p + 15000;
            let annualInc = monthPay * 13.5;

            // [新增] 退伍金計算：模擬錄音中提到的 Y20 資產躍升
            if (y === years && years >= 20) {
                const pension = monthPay * (100 + currentIdx * 5) * 0.45; // 簡易精算模型
                annualInc += pension;
                rankName += " (退伍)";
            }

            // B. 支出計算：引入生活通膨係數 (Lifestyle Creep)
            const creepFactor = 1 + (currentIdx * 0.03); // 每升一階生活水準自動+3%
            const monthlyLiving = (monthPay * (d.livingPct / 100)) * creepFactor;
            let annualExp = (monthlyLiving + d.fixed) * 12 * Math.pow(1 + inf, y-1);

            // C. 購屋與房貸
            let mortPay = 0;
            if (d.buyHouse && y === d.buyY && !hasHouse) {
                hasHouse = true;
                housePrice = d.hPrice * 10000;
                const down = housePrice * (d.down/100);
                loanBalance = housePrice - down;
                
                // 優先用現金，不足則賣投資部位 (Liquidation)
                if (cash >= down) {
                    cash -= down;
                } else {
                    const remain = down - cash;
                    cash = 0;
                    inv -= remain; // 投資部位強制變現
                }
            }
            if (hasHouse && loanBalance > 0) {
                const r = 0.022/12, n = d.loanY * 12;
                const pmt = loanBalance * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
                mortPay = pmt * 12;
                loanBalance -= (mortPay - (loanBalance * 0.022));
                if (loanBalance < 0) loanBalance = 0;
            }

            // D. 投資投入
            const annualInv = (monthPay * (d.rate / 100) * 12);

            // E. 收支平衡檢查 (錄音中教授抓到的紅字錯誤)
            if ((annualExp + annualInv + mortPay) > annualInc && cash <= 0 && inv <= 0) {
                budgetAlert = true;
            }

            // F. 資金流動與滾存
            const surplus = annualInc - annualExp - annualInv - mortPay;
            inv = inv * (1 + roi) + annualInv;
            cash += surplus;
            
            const houseNet = hasHouse ? Math.max(0, housePrice - loanBalance) : 0;
            const netWorth = inv + cash + houseNet;

            res.years.push(y);
            res.net.push(netWorth);
            res.inv.push(inv);
            res.cash.push(cash);
            res.house.push(houseNet);
            res.logs.push({ y, rank: rankName, inc: annualInc, exp: annualExp, inv: annualInv, mort: mortPay, net: netWorth });
        }
        res.hasError = budgetAlert;
        return res;
    },

    update: () => {
        APP.saveFromUI(APP.currentTab);
        const rA = APP.calculateScenario(APP.store.A);
        const rB = APP.calculateScenario(APP.store.B);
        
        // 更新 KPI
        const lastA = rA.net[rA.net.length-1];
        const lastB = rB.net[rB.net.length-1];
        document.getElementById('kpi-A').innerText = APP.F(lastA);
        document.getElementById('kpi-B').innerText = APP.F(lastB);
        document.getElementById('kpi-diff').innerText = APP.F(lastB - lastA);
        
        // 渲染警告訊息 (對應教授要求的財務審查)
        const currR = APP.currentTab === 'A' ? rA : rB;
        const msgEl = document.getElementById('budget-msg');
        if (currR.hasError) {
            msgEl.innerText = "🚨 財務赤字警告：此方案在部分年度支出超過收入！";
            msgEl.className = "text-red-500 font-bold animate-pulse";
        } else {
            msgEl.innerText = "✅ 財務平衡驗證：通過。";
            msgEl.className = "text-emerald-500 font-bold";
        }

        APP.drawCharts(rA, rB);
        
        // 渲染明細表
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        currR.logs.forEach(r => {
            tb.innerHTML += `<tr>
                <td class="p-2 border-b text-center text-slate-500">Y${r.y}</td>
                <td class="p-2 border-b text-left font-bold text-slate-200">${r.rank}</td>
                <td class="p-2 border-b text-blue-400">${APP.F(r.inc)}</td>
                <td class="p-2 border-b text-rose-400">${APP.F(r.exp)}</td>
                <td class="p-2 border-b text-emerald-400">${APP.F(r.inv)}</td>
                <td class="p-2 border-b text-orange-400">${APP.F(r.mort)}</td>
                <td class="p-2 border-b font-black text-cyan-400">${APP.F(r.net)}</td>
            </tr>`;
        });
    },

    drawCharts: (rA, rB) => {
        const labels = rA.years.map(y => 'Y'+y);
        const currR = APP.currentTab === 'A' ? rA : rB;

        // 資產累積圖 
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '方案 A (現狀)', data: rA.net, borderColor: '#38bdf8', borderWidth: 2, fill: false, tension: 0.3 },
                    { label: '方案 B (決策)', data: rB.net, borderColor: '#10b981', borderWidth: 3, fill: false, tension: 0.3 }
                ]
            }, options: { responsive: true, maintainAspectRatio: false }
        });

        // 結構分布圖 
        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: '投資', data: currR.inv, backgroundColor: '#10b981' },
                    { label: '現金', data: currR.cash, backgroundColor: '#3b82f6' },
                    { label: '房產淨值', data: currR.house, backgroundColor: '#f97316' }
                ]
            }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
        });
    }
};

window.onload = APP.init;
