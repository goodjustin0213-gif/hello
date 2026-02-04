/**
 * 國軍財務戰情室 v27.0 - 核心運算引擎
 * 依據教授指導修正：學術嚴謹度、收支審計、階級通膨、資產變現
 */

// 1. 全局圖表設定
Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#1e293b';
Chart.defaults.font.family = "'JetBrains Mono', 'Noto Sans TC', sans-serif";

const APP = {
    currentTab: 'A',
    store: { A: {}, B: {} },
    charts: {},

    // 2025 薪資基準 (本俸+專業加給，僅供參考)
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

    // --- 初始化 ---
    init: () => {
        const opts = APP.ranks.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;

        // 預設參數：A案(現狀保守), B案(策略優化)
        const def = {
            cRank:'少尉', tRank:'中校', years:20, realPay:0,
            livingPct: 50, fixed: 5000, 
            rate: 10, roi: 2.0, inf: 2.0, 
            buyHouse:false, buyY:10, hPrice:1200, down:20, loanY:30
        };
        
        APP.store.A = JSON.parse(JSON.stringify(def));
        APP.store.B = JSON.parse(JSON.stringify(def));
        // B案預設差異：節約(30%) + 高儲蓄(40%) + 指數投資(6%)
        APP.store.B.livingPct = 30; 
        APP.store.B.rate = 40; 
        APP.store.B.roi = 6.0; 

        APP.loadToUI('A');
        APP.update();
    },

    // --- UI 互動 ---
    switchTab: (tab) => {
        APP.saveFromUI(APP.currentTab);
        APP.currentTab = tab;
        APP.loadToUI(tab);
        APP.update();
    },

    setLiving: (val) => {
        document.getElementById('livingPct').value = val;
        APP.updateInput('livingPct');
    },

    updateInput: (id) => {
        document.getElementById(id + 'Label').innerText = document.getElementById(id).value + '%';
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
        if(d.buyHouse) {
            d.buyY = APP.N(document.getElementById('buyYear').value);
            d.hPrice = APP.N(document.getElementById('housePrice').value);
            d.down = APP.N(document.getElementById('downPayment').value);
            d.loanY = APP.N(document.getElementById('loanYears').value);
        }
    },

    loadToUI: (tab) => {
        const d = APP.store[tab];
        // 簡單的 DOM 賦值
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
        document.getElementById('housePrice').value = d.hPrice;
        document.getElementById('downPayment').value = d.down;
        document.getElementById('loanYears').value = d.loanY;

        // 切換樣式
        document.getElementById('tab-A').className = `tab-btn ${tab==='A'?'active':''}`;
        document.getElementById('tab-B').className = `tab-btn ${tab==='B'?'active':''}`;
        document.getElementById('housing-area').className = d.buyHouse ? 'grid grid-cols-2 gap-2' : 'hidden';
    },

    // --- 核心計算引擎 (Academic Engine) ---
    calculateScenario: (d) => {
        const years = d.years || 20;
        const roi = d.roi / 100;
        const inf = d.inf / 100;
        
        let inv = 0, cash = 0, hasHouse = false, houseVal = 0, loan = 0;
        let cIdx = APP.ranks.indexOf(d.cRank);
        let tIdx = APP.ranks.indexOf(d.tRank);
        let yrInR = 0;
        let hasError = false; // 預算紅字標記

        const res = { years:[], net:[], inv:[], cash:[], house:[], logs:[], hasError: false };

        for(let y=1; y<=years; y++) {
            // A. 晉升模擬 (每4年升一階)
            if (y > 1 && y % 4 === 0 && cIdx < tIdx) { cIdx++; yrInR = 0; } else yrInR++;
            let rName = APP.ranks[cIdx];
            const rInfo = APP.rankData[rName];

            // B. 收入計算 (含年資微調 1.5%)
            let mPay = d.realPay > 0 ? d.realPay * Math.pow(1.015, y-1) : (rInfo.b * Math.pow(1.015, yrInR) + rInfo.p + 15000);
            let aInc = mPay * 13.5;

            // [邏輯修正] 退伍金挹注 (Retirement Injection)
            // 模擬滿20年退伍時，領取約 450-500萬 (視階級而定) 的現值
            if (y === years && years >= 20) {
                const pension = mPay * (100 + cIdx * 5) * 0.45; 
                aInc += pension;
                rName += " (退伍金)";
            }

            // [邏輯修正] 生活通膨 (Lifestyle Creep)
            // 階級越高，基礎消費係數 (Creep Factor) 越高，模擬換車/升級消費
            const creep = 1 + (cIdx * 0.04); 
            const mLiving = (mPay * (d.livingPct / 100)) * creep;
            const aExp = (mLiving + d.fixed) * 12 * Math.pow(1 + inf, y-1);

            // C. 房產與變現 (Asset Liquidation)
            let mort = 0, downPay = 0;
            if (d.buyHouse && y === d.buyY && !hasHouse) {
                hasHouse = true; houseVal = d.hPrice * 10000;
                downPay = houseVal * (d.down/100);
                loan = houseVal - downPay;
                
                // 優先扣現金，不足則自動賣股票 (避免資產虛增)
                if (cash >= downPay) cash -= downPay;
                else { 
                    const diff = downPay - cash;
                    cash = 0; 
                    inv -= diff; // 強制變現
                }
            }
            if (hasHouse && loan > 0) {
                const r = 0.022/12, n = d.loanY * 12;
                const pmt = loan * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
                mort = pmt * 12;
                loan -= (mort - loan * 0.022);
                if (loan < 0) loan = 0;
            }

            const aInv = (mPay * (d.rate / 100) * 12);

            // [邏輯修正] 預算審計 (Budget Audit)
            // 教授指出：若年度總支出 > 年度總收入，即為預算紅字
            if ((aExp + aInv + mort + downPay) > aInc) {
                // 若連累計資產 (現金+股票) 都不夠抵扣，則標記為嚴重赤字
                if (cash + inv + (aInc - aExp - aInv - mort - downPay) < 0) hasError = true;
            }

            // D. 結餘滾存
            const surplus = aInc - aExp - aInv - mort;
            inv = inv * (1 + roi) + aInv;
            cash += surplus;

            const hNet = hasHouse ? Math.max(0, houseVal - loan) : 0;
            const net = inv + cash + hNet;

            res.years.push(y); res.net.push(net); res.inv.push(inv); res.cash.push(cash); res.house.push(hNet);
            res.logs.push({ y, rank: rName, inc: aInc, exp: aExp, inv: aInv, mort: mort+downPay, net });
        }
        res.hasError = hasError;
        return res;
    },

    // --- 更新與繪圖 ---
    update: () => {
        APP.saveFromUI(APP.currentTab);
        const rA = APP.calculateScenario(APP.store.A);
        const rB = APP.calculateScenario(APP.store.B);
        
        // KPI 更新
        document.getElementById('kpi-A').innerText = APP.F(rA.net[rA.net.length-1]);
        document.getElementById('kpi-B').innerText = APP.F(rB.net[rB.net.length-1]);
        document.getElementById('kpi-diff').innerText = APP.F(rB.net[rB.net.length-1] - rA.net[rA.net.length-1]);

        // 警示框更新
        const curr = APP.currentTab === 'A' ? rA : rB;
        const alertBox = document.getElementById('budget-alert');
        if(curr.hasError) {
            alertBox.style.display = 'block';
            alertBox.style.backgroundColor = 'rgba(244, 63, 94, 0.2)';
            alertBox.style.color = '#f43f5e';
            alertBox.style.border = '1px solid #f43f5e';
            alertBox.innerText = "⚠️ 嚴重警告：此方案出現財務赤字 (支出>收入)，請降低消費或投資比例！";
        } else {
            alertBox.style.display = 'block';
            alertBox.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            alertBox.style.color = '#10b981';
            alertBox.style.border = '1px solid #10b981';
            alertBox.innerText = "✅ 財務健康：各年度收支平衡。";
        }

        APP.drawCharts(rA, rB);
        
        // 表格更新
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        curr.logs.forEach(l => {
            tb.innerHTML += `<tr>
                <td style="text-align:center">Y${l.y}</td>
                <td style="text-align:left; font-weight:bold">${l.rank}</td>
                <td style="color:#38bdf8">${APP.F(l.inc)}</td>
                <td style="color:#f43f5e">${APP.F(l.exp)}</td>
                <td style="color:#10b981">${APP.F(l.inv)}</td>
                <td style="color:#f59e0b">${APP.F(l.mort)}</td>
                <td style="color:#fff; font-weight:bold">${APP.F(l.net)}</td>
            </tr>`;
        });
    },

    drawCharts: (rA, rB) => {
        const labels = rA.years.map(y => 'Y'+y);
        const curr = APP.currentTab === 'A' ? rA : rB;

        // Chart 1: 資產曲線
        const ctx1 = document.getElementById('chart-asset').getContext('2d');
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '方案 A', data: rA.net, borderColor: '#38bdf8', borderWidth:2, tension:0.3 },
                    { label: '方案 B', data: rB.net, borderColor: '#10b981', borderWidth:2, tension:0.3 }
                ]
            }, options: { responsive:true, maintainAspectRatio:false }
        });

        // Chart 2: 資產結構
        const ctx2 = document.getElementById('chart-wealth').getContext('2d');
        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: '金融資產', data: curr.inv, backgroundColor: '#10b981' },
                    { label: '現金', data: curr.cash, backgroundColor: '#3b82f6' },
                    { label: '房產淨值', data: curr.house, backgroundColor: '#f97316' }
                ]
            }, options: { responsive:true, maintainAspectRatio:false, scales: { x:{stacked:true}, y:{stacked:true} } }
        });
    }
};

window.onload = APP.init;
