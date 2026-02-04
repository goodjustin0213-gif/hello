/**
 * 國軍財務戰情室 v27.0 - JS 核心驅動
 * 優化方向：學術模型精確度、財務穩定性驗證與 GitHub 部署相容性
 */

const APP = {
    currentTab: 'A',
    store: { A: {}, B: {} },
    charts: {},
    
    // 2025 薪資基準資料庫
    rankData: {
        '二兵': {b:10550, p:0}, '一兵': {b:11130, p:0}, '上兵': {b:12280, p:0},
        '下士': {b:14645, p:5500}, '中士': {b:16585, p:6200}, '上士': {b:18525, p:7000},
        '三等士官長': {b:22750, p:8200}, '二等士官長': {b:25050, p:9500}, '一等士官長': {b:28880, p:10800},
        '少尉': {b:22750, p:8500}, '中尉': {b:25050, p:9800}, '上尉': {b:28880, p:11500},
        '少校': {b:32710, p:23000}, '中校': {b:37310, p:26000}, '上校': {b:41900, p:32000}
    },
    ranks: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校'],

    init: () => {
        // 設定預設方案與參數
        const def = { cRank:'少尉', tRank:'中校', years:20, realPay:0, livingPct:50, fixed:5000, rate:30, roi:6, inf:2, buyHouse:false, buyYear:10, housePrice:1200, down:20, loanYears:30 };
        APP.store.A = JSON.parse(JSON.stringify(def));
        APP.store.B = JSON.parse(JSON.stringify(def));
        APP.store.B.livingPct = 30; // 策略方案預設節約
        
        APP.loadToUI('A');
        APP.update();
    },

    // 核心運算引擎：包含生活通膨與退伍金邏輯
    calculateScenario: (d) => {
        const years = d.years || 20;
        const roi = d.roi / 100;
        const inf = d.inf / 100;
        let inv = 0, cash = 0, currentRankIdx = APP.ranks.indexOf(d.cRank);
        let targetIdx = APP.ranks.indexOf(d.tRank);
        let hasHouse = false, loanBalance = 0, housePrice = 0;
        let budgetError = false;

        const res = { years: [], net: [], inv: [], cash: [], house: [], logs: [], hasError: false };

        for(let y=1; y <= years; y++) {
            // 晉升邏輯與年度累計
            if (y > 1 && y % 4 === 0 && currentRankIdx < targetIdx) currentRankIdx++;
            
            let rank = APP.ranks[currentRankIdx];
            let pay = d.realPay > 0 ? d.realPay * Math.pow(1.015, y-1) : (APP.rankData[rank].b + APP.rankData[rank].p + 15000);
            let annualInc = pay * 13.5;

            // [學術模型] 退伍金一次領模擬
            if (y === years && years >= 20) {
                const pension = pay * (100 + currentRankIdx * 5) * 0.45;
                annualInc += pension;
            }

            // [學術模型] 生活通膨 (Creep) 與支出審計
            const creepFactor = 1 + (currentRankIdx * 0.03); 
            const annualExp = (pay * (d.livingPct/100) * creepFactor + d.fixed) * 12 * Math.pow(1+inf, y-1);
            const annualInv = pay * (d.rate/100) * 12;

            // 房產購置邏輯：變現優先
            let mortPay = 0, downPaymentAmt = 0;
            if (d.buyHouse && y === d.buyYear && !hasHouse) {
                hasHouse = true; housePrice = d.housePrice * 10000;
                downPaymentAmt = housePrice * (d.down/100);
                loanBalance = housePrice - downPaymentAmt;
                if (cash >= downPaymentAmt) cash -= downPaymentAmt;
                else { inv -= (downPaymentAmt - cash); cash = 0; }
            }
            if (hasHouse && loanBalance > 0) {
                const r = 0.022/12, n = d.loanYears * 12;
                const pmt = loanBalance * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
                mortPay = pmt * 12;
                loanBalance -= (mortPay - (loanBalance * 0.022));
            }

            // 財務收支平衡審核
            if ((annualExp + annualInv + mortPay + downPaymentAmt) > annualInc && cash <= 0 && inv <= 0) budgetError = true;

            const surplus = annualInc - annualExp - annualInv - mortPay;
            inv = inv * (1 + roi) + annualInv;
            cash += surplus;
            const houseNet = hasHouse ? Math.max(0, housePrice - loanBalance) : 0;
            const net = inv + cash + houseNet;

            res.years.push(y); res.net.push(net); res.inv.push(inv); res.cash.push(cash); res.house.push(houseNet);
            res.logs.push({ y, rank, inc: annualInc, exp: annualExp, inv: annualInv, mort: mortPay + downPaymentAmt, net });
        }
        res.hasError = budgetError;
        return res;
    },

    update: () => {
        // 更新 KPI 與驗證警示
        const rA = APP.calculateScenario(APP.store.A);
        const rB = APP.calculateScenario(APP.store.B);
        const curr = APP.currentTab === 'A' ? rA : rB;
        
        document.getElementById('kpi-A').innerText = Math.round(rA.net.slice(-1)).toLocaleString();
        document.getElementById('kpi-B').innerText = Math.round(rB.net.slice(-1)).toLocaleString();
        
        const msg = document.getElementById('budget-msg');
        msg.innerText = curr.hasError ? "🚨 財務赤字：支出與投資超過總資產！" : "✅ 財務平衡驗證通過";
        msg.style.color = curr.hasError ? "#f43f5e" : "#10b981";

        APP.renderCharts(rA, rB);
    }
};
