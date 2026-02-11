/**
 * 國軍財務戰情室 v29.0 (Real-World Calibration)
 * 修正：
 * 1. 薪資過高問題：引入 Deductions (扣除額) 邏輯，模擬「實領薪資」。
 * 2. 獎金校正：下修為 2.0 個月 (考績乙等模擬)。
 * 3. 戰鬥/行政差異：新增 salaryLevel 滑桿，允許使用者全盤下修薪資。
 */

Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#1e293b';

const APP = {
    // 2025 薪資基準 (參考值，將透過 Slider 進行動態下修)
    rankData: {
        '二兵': {b:10550, p:0}, '一兵': {b:11130, p:0}, '上兵': {b:12280, p:0},
        '下士': {b:14645, p:3000}, '中士': {b:16585, p:3500}, '上士': {b:18525, p:4000},
        '三等士官長': {b:22750, p:5000}, '二等士官長': {b:25050, p:6000}, '一等士官長': {b:28880, p:7000},
        '少尉': {b:22750, p:5000}, '中尉': {b:25050, p:6000}, '上尉': {b:28880, p:8000},
        '少校': {b:32710, p:18000}, '中校': {b:37310, p:22000}, '上校': {b:41900, p:28000}
    },
    ranks: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校'],
    
    charts: {},
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    init: () => {
        // 1. 生成階級
        const opts = APP.ranks.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;
        
        // 2. 插入「薪資修正滑桿」到 UI (動態插入，無需改 HTML)
        APP.injectSalarySlider();

        // 3. 載入預設
        APP.loadCase(1);
    },

    // 動態插入薪資修正滑桿 (解決 HTML 未更新問題)
    injectSalarySlider: () => {
        const target = document.querySelector('.input-group label.text-cyan-400').parentNode;
        if (!document.getElementById('salaryLevel')) {
            const div = document.createElement('div');
            div.className = 'mb-2 pt-2 border-t border-slate-700';
            div.innerHTML = `
                <div class="flex justify-between mb-1">
                    <span class="text-xs text-amber-400">薪資修正係數 (行政/戰鬥)</span>
                    <span id="salaryLevelLabel" class="text-xs text-white">100%</span>
                </div>
                <input type="range" id="salaryLevel" min="70" max="130" value="100" oninput="APP.updateSalaryInput()">
                <p class="text-[10px] text-slate-500">若覺得薪資太高，請將此拉低至 80%~90%</p>
            `;
            target.insertBefore(div, target.children[1]);
        }
    },

    updateSalaryInput: () => {
        document.getElementById('salaryLevelLabel').innerText = document.getElementById('salaryLevel').value + '%';
        APP.update();
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

    update: () => {
        // 讀取 UI
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
            realPay: APP.N(document.getElementById('realPay').value),
            // 新增：薪資修正係數
            salaryLevel: (APP.N(document.getElementById('salaryLevel').value) || 100) / 100
        };

        let inv = 0, cash = 0, hasHouse = false, houseVal = 0, loan = 0;
        let cIdx = APP.ranks.indexOf(d.cRank);
        let tIdx = APP.ranks.indexOf(d.tRank);
        let yrInR = 0;
        let maxMortgageRatio = 0;
        let hasError = false;

        const res = { years:[], net:[], inv:[], cash:[], house:[], logs:[] };

        // 參數校正：實領扣除率 (勞健保、退撫、雜費)
        // 預設打 88 折 (扣 12%)
        const TAKE_HOME_RATIO = 0.88; 

        for(let y=1; y<=d.years; y++) {
            if (y > 1 && y % 4 === 0 && cIdx < tIdx) { cIdx++; yrInR = 0; } else yrInR++;
            let rName = APP.ranks[cIdx];
            const rInfo = APP.rankData[rName];

            // --- 薪資計算核心修正 ---
            
            // 1. 基礎月薪 (Gross Monthly)
            // 包含：本俸 + 專業加給 + 志願役加給(10000)
            // 應用「薪資修正係數 (salaryLevel)」
            let grossMonthly = 0;
            if (d.realPay > 0) {
                grossMonthly = d.realPay * Math.pow(1.01, y-1); // 若手動輸入，假設年增1%
            } else {
                // 依據年資微調 (每年 1%)
                const seniority = Math.pow(1.01, yrInR);
                grossMonthly = (rInfo.b * seniority + rInfo.p + 10000) * d.salaryLevel;
            }

            // 2. 實領月薪 (Net Monthly) - 扣除退撫保險
            const netMonthly = grossMonthly * TAKE_HOME_RATIO;

            // 3. 年終獎金 (Net Bonus)
            // 校正：僅以 (本俸+專業) 為基數，且設為 2.0 個月 (較保守)
            // 並同樣打折模擬扣稅
            const bonusBase = (rInfo.b + rInfo.p) * d.salaryLevel;
            const netBonus = (bonusBase * 2.0) * 0.95; // 獎金扣稅較少，設 5%

            // 4. 年實領總額 (Total Annual Net Cash)
            let aInc = (netMonthly * 12) + netBonus;

            // --- 退伍金修正 ---
            if (y === d.years && d.years >= 20) {
                // 退伍金以「本俸」為基數 * 2 * 年資
                // 這是最接近真實的一次領算法
                const pensionBase = (rInfo.b * d.salaryLevel) * 2;
                const pensionTotal = pensionBase * d.years; 
                aInc += pensionTotal;
                rName += " (退伍)";
            }

            // --- 支出與投資 ---
            const creep = 1 + (cIdx * 0.03);
            const aExp = (netMonthly * (d.livingPct/100) * creep + 5000) * 12 * Math.pow(1 + d.inf/100, y-1);

            // 房產
            let mort = 0, downPay = 0;
            if (d.buyHouse && y === d.buyY && !hasHouse) {
                hasHouse = true; houseVal = d.hPrice * 10000;
                downPay = houseVal * (d.down/100);
                loan = houseVal - downPay;
                if (cash >= downPay) cash -= downPay; else { inv -= (downPay - cash); cash = 0; }
            }
            if (hasHouse && loan > 0) {
                const r = 0.022/12, n = d.loanY * 12;
                const pmt = loan * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
                mort = pmt * 12;
                loan -= (mort - loan * 0.022);
                
                const ratio = (pmt / netMonthly) * 100; // 使用實領月薪計算負擔率
                if (ratio > maxMortgageRatio) maxMortgageRatio = ratio;
            }

            // 投資 (基於實領月薪)
            const aInv = (netMonthly * (d.rate / 100) * 12);
            
            // 審計
            if ((aExp + aInv + mort + downPay) > aInc && (cash + inv + aInc - aExp - aInv - mort - downPay) < 0) hasError = true;

            const surplus = aInc - aExp - aInv - mort;
            inv = inv * (1 + d.roi/100) + aInv;
            cash += surplus;
            const hNet = hasHouse ? Math.max(0, houseVal - loan) : 0;
            const net = inv + cash + hNet;

            res.years.push(y); res.net.push(net); res.inv.push(inv); res.cash.push(cash); res.house.push(hNet);
            res.logs.push({ y, rank: rName, inc: aInc, exp: aExp, inv: aInv, mort: mort+downPay, net });
        }

        // --- 輸出 ---
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
            alertBox.innerText = "⚠️ 風險警告：財務赤字或房貸過重 (請嘗試下修支出)";
        } else {
            alertBox.style.display = 'block';
            alertBox.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            alertBox.style.color = '#10b981';
            alertBox.innerText = "✅ 財務健康：現金流穩定 (實領制驗證通過)";
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
                datasets: [{ label: '淨資產 (實領制)', data: r.net, borderColor: '#38bdf8', borderWidth:3, tension:0.4, fill:true, backgroundColor:'rgba(56, 189, 248, 0.1)' }]
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
