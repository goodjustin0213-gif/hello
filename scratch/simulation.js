/**
 * 國軍財務戰情室 v29.0 Core Logic (JS)
 * ---------------------------------------------------
 * [版本更新重點]
 * 1. 實領薪資校正 (Take-home Pay): 預設扣除 12% (退撫/健保/軍保/雜費)。
 * 2. 獎金校正 (Bonus Fix): 基數僅含本俸+專業，且設為 2.0 個月 (1.5年終+0.5考績)。
 * 3. 薪資滑桿 (Salary Slider): 允許使用者全盤下修/上調薪資水準 (70%~130%)。
 * 4. 論文案例 (Thesis Cases): 內建 C1~C4 四種情境一鍵載入。
 */

// 設定 Chart.js 全局樣式
Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#1e293b';
Chart.defaults.font.family = "'JetBrains Mono', 'Noto Sans TC', sans-serif";

const APP = {
    // 2025 薪資基準 (參考值：b=本俸, p=專業加給)
    rankData: {
        '二兵': {b:10550, p:0}, '一兵': {b:11130, p:0}, '上兵': {b:12280, p:0},
        '下士': {b:14645, p:3000}, '中士': {b:16585, p:3500}, '上士': {b:18525, p:4000},
        '三等士官長': {b:22750, p:5000}, '二等士官長': {b:25050, p:6000}, '一等士官長': {b:28880, p:7000},
        '少尉': {b:22750, p:5000}, '中尉': {b:25050, p:6000}, '上尉': {b:28880, p:8000},
        '少校': {b:32710, p:18000}, '中校': {b:37310, p:22000}, '上校': {b:41900, p:28000}
    },
    ranks: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校'],
    
    charts: {}, // 用於儲存圖表實例
    
    // 工具函式：數值處理與格式化
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 系統初始化 ---
    init: () => {
        // 1. 生成階級選單
        const opts = APP.ranks.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;
        
        // 2. 動態插入「薪資修正滑桿」 (無需手動修改 HTML)
        APP.injectSalarySlider();
        
        // 3. 預設載入案例一 (大成功)
        APP.loadCase(1);
    },

    // 動態插入滑桿元件
    injectSalarySlider: () => {
        // 尋找插入點 (CAREER 區塊)
        const targetGroup = document.querySelector('#career-group') || document.querySelector('.input-group'); 
        if (targetGroup && !document.getElementById('salaryLevel')) {
            const div = document.createElement('div');
            div.className = 'mb-2 pt-2 border-t border-slate-700';
            div.innerHTML = `
                <div class="flex justify-between mb-1">
                    <span class="text-xs text-amber-400">薪資修正係數 (行政/戰鬥)</span>
                    <span id="salaryLevelLabel" class="text-xs text-white">100%</span>
                </div>
                <input type="range" id="salaryLevel" min="70" max="130" value="100" class="w-full" oninput="APP.updateSalaryInput()">
                <p class="text-[10px] text-slate-500 mt-1">若覺得薪資太高(如行政職)，請往左拉至 80%~90%</p>
            `;
            // 插在標題之後
            targetGroup.insertBefore(div, targetGroup.children[1]);
        }
    },

    // 更新滑桿顯示數值
    updateSalaryInput: () => {
        const val = document.getElementById('salaryLevel').value;
        document.getElementById('salaryLevelLabel').innerText = val + '%';
        APP.update();
    },

    // 更新一般滑桿顯示數值
    updateInput: (id) => {
        document.getElementById(id + 'Label').innerText = document.getElementById(id).value + '%';
        APP.update();
    },

    // --- 論文案例載入器 (Scenario Loader) ---
    loadCase: (id) => {
        // 切換按鈕樣式
        document.querySelectorAll('.btn-case').forEach(b => b.classList.remove('active'));
        const btns = document.querySelectorAll('.btn-case');
        if(btns.length >= id) btns[id-1].classList.add('active');

        let p = {};
        switch(id) {
            case 1: // 大成功：積極投資 + 早期置產
                p = { cRank:'少尉', tRank:'上校', years:20, living:50, rate:30, roi:8.0, buy:true, bY:5, hP:1200, down:20 }; 
                break;
            case 2: // 小成功：穩健投資 + 租屋
                p = { cRank:'少尉', tRank:'中校', years:20, living:65, rate:15, roi:4.5, buy:false, bY:0, hP:0, down:0 }; 
                // living 65% 含租金
                break;
            case 3: // 小失敗：過度保守 + 通膨侵蝕
                p = { cRank:'少尉', tRank:'少校', years:20, living:85, rate:5, roi:1.5, buy:false, bY:0, hP:0, down:0 }; 
                break;
            case 4: // 大失敗：高槓桿置產 + 零投資
                p = { cRank:'少尉', tRank:'少校', years:20, living:40, rate:0, roi:0, buy:true, bY:1, hP:1500, down:10 }; 
                break;
        }

        // 填入數值到 UI
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
        
        // 更新顯示文字
        APP.updateInput('livingPct');
        APP.updateInput('investRate');
        
        // 重置薪資係數為 100%
        if(document.getElementById('salaryLevel')) {
            document.getElementById('salaryLevel').value = 100;
            document.getElementById('salaryLevelLabel').innerText = '100%';
        }
    },

    // --- 核心運算引擎 (Engine v29.0) ---
    update: () => {
        // 1. 讀取所有介面參數
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
            // 讀取薪資修正係數 (預設 1.0)
            salaryLevel: (APP.N(document.getElementById('salaryLevel')?.value) || 100) / 100
        };

        // 2. 變數初始化
        let inv = 0, cash = 0, hasHouse = false, houseVal = 0, loan = 0;
        let cIdx = APP.ranks.indexOf(d.cRank);
        let tIdx = APP.ranks.indexOf(d.tRank);
        let yrInR = 0;
        let maxMortgageRatio = 0;
        let hasError = false;

        const res = { years:[], net:[], inv:[], cash:[], house:[], logs:[] };

        // [重要設定] 實領扣除率 (Take-home Pay Ratio)
        // 假設扣除退撫、健保、軍保、主副食費約 12%，實領 88%
        const TAKE_HOME_RATIO = 0.88; 

        // 3. 逐年模擬
        for(let y=1; y<=d.years; y++) {
            // 晉升邏輯: 每4年升一階
            if (y > 1 && y % 4 === 0 && cIdx < tIdx) { cIdx++; yrInR = 0; } else yrInR++;
            let rName = APP.ranks[cIdx];
            const rInfo = APP.rankData[rName];

            // --- A. 薪資計算 (修正版) ---
            let grossMonthly = 0;
            if (d.realPay > 0) {
                // 手動輸入模式：假設每年微幅成長 1%
                grossMonthly = d.realPay * Math.pow(1.01, y-1);
            } else {
                // 自動計算模式：(本俸*年資係數 + 專業加給 + 1萬津貼) * 薪資修正係數
                // 年資係數：每年 1%
                const seniority = Math.pow(1.01, yrInR);
                grossMonthly = (rInfo.b * seniority + rInfo.p + 10000) * d.salaryLevel;
            }

            // 實領月薪 (Net Monthly) = 表定 * 0.88
            const netMonthly = grossMonthly * TAKE_HOME_RATIO;

            // 年終獎金 (Net Bonus)
            // 修正：基數僅含 (本俸+專業)，且係數降為 2.0 (1.5年終+0.5考績)
            // 獎金扣稅較少，假設實拿 95%
            const bonusBase = (rInfo.b + rInfo.p) * d.salaryLevel;
            const netBonus = (bonusBase * 2.0) * 0.95;

            // 年實領總額 (Cash In)
            let aInc = (netMonthly * 12) + netBonus;

            // --- B. 退伍金挹注 (Year 20) ---
            if (y === d.years && d.years >= 20) {
                // 退伍金基數 = 本俸 * 2
                // 總額 = 基數 * 年資 (簡易現值)
                const pensionBase = (rInfo.b * d.salaryLevel) * 2;
                const pensionTotal = pensionBase * d.years; 
                aInc += pensionTotal;
                rName += " (退伍)";
            }

            // --- C. 支出計算 (Lifestyle Creep) ---
            // 階級越高，生活通膨係數 (Creep) 越高
            const creep = 1 + (cIdx * 0.03);
            // 剛性支出預設 5000 也隨通膨成長
            const aExp = (netMonthly * (d.livingPct/100) * creep + 5000) * 12 * Math.pow(1 + d.inf/100, y-1);

            // --- D. 房產與變現 ---
            let mort = 0, downPay = 0;
            if (d.buyHouse && y === d.buyY && !hasHouse) {
                hasHouse = true; houseVal = d.hPrice * 10000;
                downPay = houseVal * (d.down/100);
                loan = houseVal - downPay;
                
                // 資產變現: 現金不夠賣股票 (Liquidation Logic)
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
                
                // 房貸負擔率 = 月房貸 / 實領月薪
                const ratio = (pmt / netMonthly) * 100;
                if (ratio > maxMortgageRatio) maxMortgageRatio = ratio;
            }

            // --- E. 投資投入 ---
            // 投資金額 = 實領月薪 * 提撥率
            const aInv = (netMonthly * (d.rate / 100) * 12);
            
            // --- F. 赤字審計 (Budget Audit) ---
            // 總支出 > 總收入 且 資產耗盡 = 赤字
            if ((aExp + aInv + mort + downPay) > aInc) {
                if ((cash + inv + aInc - aExp - aInv - mort - downPay) < 0) hasError = true;
            }

            // --- G. 結餘滾存 ---
            const surplus = aInc - aExp - aInv - mort;
            inv = inv * (1 + d.roi/100) + aInv;
            cash += surplus;
            
            const hNet = hasHouse ? Math.max(0, houseVal - loan) : 0;
            const net = inv + cash + hNet;

            res.years.push(y); res.net.push(net); res.inv.push(inv); res.cash.push(cash); res.house.push(hNet);
            res.logs.push({ y, rank: rName, inc: aInc, exp: aExp, inv: aInv, mort: mort+downPay, net });
        }

        // --- 4. 更新 UI 顯示 ---
        const net20 = res.net[res.net.length-1];
        document.getElementById('kpi-net20').innerText = APP.F(net20);
        
        // 80歲推估 (實質購買力)
        const realRoi = (1 + d.roi/100) / (1 + d.inf/100) - 1;
        const net80 = net20 * Math.pow(1 + realRoi, 38); // 假設從 42歲活到 80歲
        document.getElementById('kpi-net80').innerText = APP.F(net80);

        // 房貸壓力顯示
        const kpiMort = document.getElementById('kpi-mortgage');
        kpiMort.innerText = maxMortgageRatio.toFixed(1) + '%';
        kpiMort.className = maxMortgageRatio > 50 ? "kpi-val text-rose-500 animate-pulse" : "kpi-val text-emerald-400";

        // 警示框邏輯
        const alertBox = document.getElementById('budget-alert');
        if (hasError || maxMortgageRatio > 60) {
            alertBox.style.display = 'block';
            alertBox.style.backgroundColor = 'rgba(244, 63, 94, 0.2)';
            alertBox.style.color = '#f43f5e';
            alertBox.innerText = "⚠️ 風險警告：財務赤字或房貸負擔過重 (請下修支出/投資或調整薪資係數)";
        } else {
            alertBox.style.display = 'block';
            alertBox.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            alertBox.style.color = '#10b981';
            alertBox.innerText = "✅ 財務健康：現金流穩定 (實領制驗證通過)";
        }

        APP.drawCharts(res);
        APP.renderTable(res);
        
        // 控制房產區塊顯示
        document.getElementById('housing-area').className = d.buyHouse ? 'grid grid-cols-2 gap-2' : 'hidden';
    },

    // --- 繪圖函式 ---
    drawCharts: (r) => {
        const labels = r.years.map(y => 'Y'+y);
        
        // Chart 1: 淨資產成長
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ 
                    label: '淨資產 (實領制)', 
                    data: r.net, 
                    borderColor: '#38bdf8', 
                    borderWidth: 3, 
                    tension: 0.4, 
                    fill: true, 
                    backgroundColor: 'rgba(56, 189, 248, 0.1)' 
                }]
            }, 
            options: { responsive:true, maintainAspectRatio:false }
        });

        // Chart 2: 資產結構堆疊
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
            }, 
            options: { responsive:true, maintainAspectRatio:false, scales: { x:{stacked:true}, y:{stacked:true} } }
        });
    },

    // --- 表格渲染函式 ---
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
