/**
 * 國軍財務戰情室 v28.1 (Debugged Edition)
 * 修正重點：
 * 1. 實領校正改採「比例連動制」，保留晉升跳薪紅利。
 * 2. 年收入算法拆解為 (月薪*12) + ((本俸+專業)*2.5)，修正獎金高估問題。
 * 3. 優化退伍金基數算法。
 */

Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#1e293b';

const APP = {
    // 2025 薪資結構參考 (單位：元)
    // b: 本俸 (Base), p: 專業加給 (Prof)
    rankData: {
        '二兵': {b:10550, p:0}, '一兵': {b:11130, p:0}, '上兵': {b:12280, p:0},
        '下士': {b:14645, p:5500}, '中士': {b:16585, p:6200}, '上士': {b:18525, p:7000},
        '三等士官長': {b:22750, p:8200}, '二等士官長': {b:25050, p:9500}, '一等士官長': {b:28880, p:10800},
        '少尉': {b:22750, p:8500}, '中尉': {b:25050, p:9800}, '上尉': {b:28880, p:11500},
        '少校': {b:32710, p:23000}, '中校': {b:37310, p:26000}, '上校': {b:41900, p:32000}
    },
    ranks: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校'],
    
    charts: {},
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    init: () => {
        const opts = APP.ranks.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;
        APP.loadCase(1);
    },

    updateInput: (id) => {
        document.getElementById(id + 'Label').innerText = document.getElementById(id).value + '%';
        APP.update();
    },

    loadCase: (id) => {
        // 重置按鈕
        document.querySelectorAll('.btn-case').forEach(b => b.classList.remove('active'));
        const btns = document.querySelectorAll('.btn-case');
        if(btns.length >= id) btns[id-1].classList.add('active');

        let p = {};
        switch(id) {
            case 1: p = { cRank:'少尉', tRank:'上校', years:20, living:50, rate:30, roi:8.0, buy:true, bY:5, hP:1200, down:20 }; break;
            case 2: p = { cRank:'少尉', tRank:'中校', years:20, living:65, rate:15, roi:4.5, buy:false, bY:0, hP:0, down:0 }; break;
            case 3: p = { cRank:'少尉', tRank:'少校', years:20, living:85, rate:5, roi:1.5, buy:false, bY:0, hP:0, down:0 }; break;
            case 4: p = { cRank:'少尉', tRank:'少校', years:20, living:40, rate:0, roi:0, buy:true, bY:1, hP:1500, down:10 }; break;
        }

        document.getElementById('currentRank').value = p.cRank;
        document.getElementById('targetRank').value = p.tRank;
        document.getElementById('years').value = p.years;
        document.getElementById('livingPct').value = p.living;
        document.getElementById('investRate').value = p.rate;
        document.getElementById('roi').value = p.roi;
        document.getElementById('buyHouse').checked = p.buy;
        
        if (p.buy) {
            document.getElementById('buyYear').value = p.bY;
            document.getElementById('housePrice').value = p.hP;
            document.getElementById('downPayment').value = p.down;
        }
        APP.updateInput('livingPct');
        APP.updateInput('investRate');
    },

    // --- 嚴格偵錯後的運算引擎 ---
    update: () => {
        const d = {
            cRank: document.getElementById('currentRank').value,
            tRank: document.getElementById('targetRank').value,
            years: APP.N(document.getElementById('years').value),
            livingPct: APP.N(document.getElementById('livingPct').value),
            rate: APP.N(document.getElementById('investRate').value),
            roi: APP.N(document.getElementById('roi').value),
            inf: APP.N(document.getElementById('inflation').value),
            buyHouse: document.getElementById('buyHouse').checked,
            buyY: APP.N(document.getElementById('buyYear').value),
            hPrice: APP.N(document.getElementById('housePrice').value),
            down: APP.N(document.getElementById('downPayment').value),
            loanY: APP.N(document.getElementById('loanYears').value),
            realPay: APP.N(document.getElementById('realPay').value)
        };

        let inv = 0, cash = 0, hasHouse = false, houseVal = 0, loan = 0;
        let cIdx = APP.ranks.indexOf(d.cRank);
        let tIdx = APP.ranks.indexOf(d.tRank);
        let yrInR = 0;
        let maxMortgageRatio = 0;
        let hasError = false;

        // [Debug 1] 計算實領薪資的校正比例 (Scaling Factor)
        // 若使用者有輸入 realPay，我們計算它與系統標準薪資的倍率
        // 並將此倍率應用在未來的每一年，保留晉升跳薪的結構
        let salaryScale = 1.0;
        if (d.realPay > 0) {
            const startR = APP.rankData[d.cRank];
            // 系統標準月薪 = 本俸 + 專業 + 10000(志願役概估)
            const standardStart = startR.b + startR.p + 10000;
            salaryScale = d.realPay / standardStart;
        }

        const res = { years:[], net:[], inv:[], cash:[], house:[], logs:[] };

        for(let y=1; y<=d.years; y++) {
            // 晉升邏輯 (每4年一升)
            if (y > 1 && y % 4 === 0 && cIdx < tIdx) { cIdx++; yrInR = 0; } else yrInR++;
            let rName = APP.ranks[cIdx];
            const rInfo = APP.rankData[rName];

            // [Debug 2] 嚴格薪資計算
            // 基礎薪資成長 (年資俸點概念，每年 1.5%)
            // 這裡將 1.5% 僅應用在本俸的成長模擬
            const growthFactor = Math.pow(1.015, yrInR); 
            
            // 結構拆解
            const basePay = rInfo.b * growthFactor * salaryScale; // 本俸 (含成長與校正)
            const profPay = rInfo.p * salaryScale;                // 專業加給 (含校正)
            const fixedAllow = 10000 * salaryScale;               // 志願役/伙食津貼 (含校正)

            const monthlyPay = basePay + profPay + fixedAllow;

            // [Debug 2 修正] 年收入 = 月薪*12 + 獎金
            // 獎金通常只算 (本俸+專業)，約 2.5 個月 (1.5年終 + 1.0考績)
            // 這樣比原本直接 * 13.5 更精確，避免高估雜項加給的獎金
            const bonus = (basePay + profPay) * 2.5; 
            let aInc = (monthlyPay * 12) + bonus;

            // [Debug 3] 退伍金嚴格試算
            if (y === d.years && d.years >= 20) {
                // 退伍金基數 = 本俸 * 2
                // 領取總額 = 基數 * 年資 (簡易現值模擬)
                const pensionBase = basePay * 2;
                const pensionTotal = pensionBase * d.years * 1.2; // 1.2 為舊制/新制混合調節係數
                aInc += pensionTotal;
                rName += " (退伍)";
            }

            // 支出計算 (含生活通膨係數)
            const creep = 1 + (cIdx * 0.03);
            const aExp = (monthlyPay * (d.livingPct/100) * creep + 5000) * 12 * Math.pow(1 + d.inf/100, y-1);

            // 房產購置
            let mort = 0, downPay = 0;
            if (d.buyHouse && y === d.buyY && !hasHouse) {
                hasHouse = true; houseVal = d.hPrice * 10000;
                downPay = houseVal * (d.down/100);
                loan = houseVal - downPay;
                if (cash >= downPay) cash -= downPay; 
                else { 
                    const diff = downPay - cash;
                    cash = 0; 
                    inv -= diff; 
                }
            }
            
            if (hasHouse && loan > 0) {
                const r = 0.022/12, n = d.loanY * 12;
                const pmt = loan * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
                mort = pmt * 12;
                loan -= (mort - loan * 0.022);
                
                const ratio = (pmt / monthlyPay) * 100;
                if (ratio > maxMortgageRatio) maxMortgageRatio = ratio;
            }

            const aInv = (monthlyPay * (d.rate / 100) * 12);
            
            // 赤字審計
            if ((aExp + aInv + mort + downPay) > aInc) {
                if ((cash + inv + aInc - aExp - aInv - mort - downPay) < 0) hasError = true;
            }

            const surplus = aInc - aExp - aInv - mort;
            inv = inv * (1 + d.roi/100) + aInv;
            cash += surplus;
            const hNet = hasHouse ? Math.max(0, houseVal - loan) : 0;
            const net = inv + cash + hNet;

            res.years.push(y); res.net.push(net); res.inv.push(inv); res.cash.push(cash); res.house.push(hNet);
            res.logs.push({ y, rank: rName, inc: aInc, exp: aExp, inv: aInv, mort: mort+downPay, net });
        }

        // 輸出 KPI
        const net20 = res.net[res.net.length-1];
        document.getElementById('kpi-net20').innerText = APP.F(net20);
        
        const realRoi = (1 + d.roi/100) / (1 + d.inf/100) - 1;
        const net80 = net20 * Math.pow(1 + realRoi, 38);
        document.getElementById('kpi-net80').innerText = APP.F(net80);

        const kpiMort = document.getElementById('kpi-mortgage');
        kpiMort.innerText = maxMortgageRatio.toFixed(1) + '%';
        kpiMort.className = maxMortgageRatio > 50 ? "kpi-val text-rose-500 animate-pulse" : "kpi-val text-emerald-400";

        const alertBox = document.getElementById('budget-alert');
        if (hasError || maxMortgageRatio > 60) {
            alertBox.style.display = 'block';
            alertBox.style.backgroundColor = 'rgba(244, 63, 94, 0.2)';
            alertBox.style.color = '#f43f5e';
            alertBox.innerText = "⚠️ 風險警告：此方案出現財務赤字或房貸負擔過重";
        } else {
            alertBox.style.display = 'block';
            alertBox.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            alertBox.style.color = '#10b981';
            alertBox.innerText = "✅ 財務健康：通過壓力測試";
        }

        APP.drawCharts(res);
        APP.renderTable(res);
        document.getElementById('housing-area').className = d.buyHouse ? 'grid grid-cols-2 gap-2' : 'hidden';
    },

    drawCharts: (r) => {
        const labels = r.years.map(y => 'Y'+y);
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: '淨資產成長', data: r.net, borderColor: '#38bdf8', borderWidth: 3, tension: 0.4, fill: true, backgroundColor: 'rgba(56, 189, 248, 0.1)' }]
            }, options: { responsive:true, maintainAspectRatio:false }
        });

        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: '金融資產', data: r.inv, backgroundColor: '#10b981' },
                    { label: '現金', data: r.cash, backgroundColor: '#3b82f6' },
                    { label: '房產淨值', data: r.house, backgroundColor: '#f97316' }
                ]
            }, options: { responsive:true, maintainAspectRatio:false, scales: { x:{stacked:true}, y:{stacked:true} } }
        });
    },

    renderTable: (r) => {
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        r.logs.forEach(l => {
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
    }
};

window.onload = APP.init;
