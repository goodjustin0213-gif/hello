/**
 * 國軍財務戰情室 v28.0 (Thesis Edition) - Core Logic
 * 專為論文案例模擬設計，包含：
 * 1. Case Loader: 快速切換 5.2-5.5 章節之四種情境
 * 2. Age 80 Projection: 依據實質報酬率推算晚年資產
 * 3. Mortgage Stress Test: 房貸負擔率監測與赤字警示
 */

// 全局圖表設定
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#1e293b';
Chart.defaults.font.family = "'JetBrains Mono', 'Noto Sans TC', sans-serif";

const APP = {
    // 薪資資料庫 (本俸+專業加給參考)
    rankData: {
        '二兵': {b:10550, p:0}, '一兵': {b:11130, p:0}, '上兵': {b:12280, p:0},
        '下士': {b:14645, p:5500}, '中士': {b:16585, p:6200}, '上士': {b:18525, p:7000},
        '三等士官長': {b:22750, p:8200}, '二等士官長': {b:25050, p:9500}, '一等士官長': {b:28880, p:10800},
        '少尉': {b:22750, p:8500}, '中尉': {b:25050, p:9800}, '上尉': {b:28880, p:11500},
        '少校': {b:32710, p:23000}, '中校': {b:37310, p:26000}, '上校': {b:41900, p:32000}
    },
    ranks: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校'],
    
    charts: {}, // 圖表實例儲存

    // 工具函式
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 初始化 ---
    init: () => {
        // 生成階級選單
        const opts = APP.ranks.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;
        
        // 預設載入案例一 (大成功情境)
        APP.loadCase(1);
    },

    updateInput: (id) => {
        document.getElementById(id + 'Label').innerText = document.getElementById(id).value + '%';
        APP.update();
    },

    // --- [核心功能] 論文案例載入器 ---
    loadCase: (id) => {
        // 按鈕樣式切換
        document.querySelectorAll('.btn-case').forEach(b => b.classList.remove('active'));
        // 注意：這裡假設 HTML 中的按鈕順序對應 index 0-3
        const buttons = document.querySelectorAll('.btn-case');
        if(buttons.length >= id) buttons[id-1].classList.add('active');

        let p = {};
        switch(id) {
            case 1: // 5.2 大成功 (積極投資 + 合理置產)
                p = { cRank:'少尉', tRank:'上校', years:20, living:50, rate:30, roi:8.0, buy:true, bY:5, hP:1200, down:20 };
                break;
            case 2: // 5.3 小成功 (穩健投資 + 租屋)
                p = { cRank:'少尉', tRank:'中校', years:20, living:65, rate:15, roi:4.5, buy:false, bY:0, hP:0, down:0 };
                // 註：Living 65% 隱含了長期租金支出
                break;
            case 3: // 5.4 小失敗 (過度保守 + 通膨侵蝕)
                p = { cRank:'少尉', tRank:'少校', years:20, living:85, rate:5, roi:1.5, buy:false, bY:0, hP:0, down:0 };
                break;
            case 4: // 5.5 大失敗 (高槓桿置產 + 零投資)
                p = { cRank:'少尉', tRank:'少校', years:20, living:40, rate:0, roi:0, buy:true, bY:1, hP:1500, down:10 };
                // 註：第一年買、總價高、低頭期 = 災難性房貸負擔
                break;
        }

        // 將參數填回 UI
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

        // 更新 Label 並觸發計算
        APP.updateInput('livingPct');
        APP.updateInput('investRate');
    },

    // --- 運算引擎 ---
    update: () => {
        // 1. 讀取 UI 數值
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

        // 2. 初始化變數
        let inv = 0, cash = 0, hasHouse = false, houseVal = 0, loan = 0;
        let cIdx = APP.ranks.indexOf(d.cRank);
        let tIdx = APP.ranks.indexOf(d.tRank);
        let yrInR = 0;
        let maxMortgageRatio = 0; // 記錄最大房貸負擔率
        let hasError = false;     // 赤字標記

        const res = { years:[], net:[], inv:[], cash:[], house:[], logs:[] };

        // 3. 逐年模擬迴圈
        for(let y=1; y<=d.years; y++) {
            // 晉升邏輯 (每4年一升)
            if (y > 1 && y % 4 === 0 && cIdx < tIdx) { cIdx++; yrInR = 0; } else yrInR++;
            let rName = APP.ranks[cIdx];
            const rInfo = APP.rankData[rName];

            // 收入計算
            let mPay = d.realPay > 0 ? d.realPay * Math.pow(1.015, y-1) : (rInfo.b * Math.pow(1.015, yrInR) + rInfo.p + 15000);
            let aInc = mPay * 13.5;

            // 退伍金挹注 (Year 20)
            if (y === d.years && d.years >= 20) {
                // 模擬一次領退伍金現值 (約 400-600萬)
                const pension = mPay * (100 + cIdx * 5) * 0.45;
                aInc += pension;
                rName += " (退伍)";
            }

            // 支出計算 (含生活通膨係數)
            // 階級越高，消費係數 (Creep) 越高
            const creep = 1 + (cIdx * 0.03);
            const aExp = (mPay * (d.livingPct/100) * creep + 5000) * 12 * Math.pow(1 + d.inf/100, y-1);

            // 房產購置與房貸
            let mort = 0, downPay = 0;
            if (d.buyHouse && y === d.buyY && !hasHouse) {
                hasHouse = true; houseVal = d.hPrice * 10000;
                downPay = houseVal * (d.down/100);
                loan = houseVal - downPay;
                
                // 資產變現邏輯: 現金不足賣股票
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
                
                // 計算房貸負擔率 (壓力測試)
                const ratio = (pmt / mPay) * 100;
                if (ratio > maxMortgageRatio) maxMortgageRatio = ratio;
            }

            // 投資投入
            const aInv = (mPay * (d.rate / 100) * 12);
            
            // 赤字審計: 總支出 > 總收入 且 資產耗盡
            if ((aExp + aInv + mort + downPay) > aInc) {
                if ((cash + inv + aInc - aExp - aInv - mort - downPay) < 0) hasError = true;
            }

            // 結餘滾存
            const surplus = aInc - aExp - aInv - mort;
            inv = inv * (1 + d.roi/100) + aInv;
            cash += surplus;
            const hNet = hasHouse ? Math.max(0, houseVal - loan) : 0;
            const net = inv + cash + hNet;

            res.years.push(y); res.net.push(net); res.inv.push(inv); res.cash.push(cash); res.house.push(hNet);
            res.logs.push({ y, rank: rName, inc: aInc, exp: aExp, inv: aInv, mort: mort+downPay, net });
        }

        // 4. 更新 KPI 顯示
        const net20 = res.net[res.net.length-1];
        document.getElementById('kpi-net20').innerText = APP.F(net20);
        
        // [論文重點] 80歲資產推估 (實質購買力)
        // 假設從 42 歲活到 80 歲，共 38 年
        // 實質報酬率 = (1+名目) / (1+通膨) - 1
        const realRoi = (1 + d.roi/100) / (1 + d.inf/100) - 1;
        const yearsPostService = 38;
        // 僅計算資產複利，不計退伍後工作收入，以凸顯理財重要性
        const net80 = net20 * Math.pow(1 + realRoi, yearsPostService);
        document.getElementById('kpi-net80').innerText = APP.F(net80);

        // 房貸壓力 KPI
        const kpiMort = document.getElementById('kpi-mortgage');
        kpiMort.innerText = maxMortgageRatio.toFixed(1) + '%';
        // 若超過 50% 顯示紅字警示
        kpiMort.className = maxMortgageRatio > 50 ? "kpi-val text-rose-500 animate-pulse" : "kpi-val text-emerald-400";

        // 預算警示框
        const alertBox = document.getElementById('budget-alert');
        if (hasError || maxMortgageRatio > 60) {
            alertBox.style.display = 'block';
            alertBox.style.backgroundColor = 'rgba(244, 63, 94, 0.2)';
            alertBox.style.color = '#f43f5e';
            alertBox.innerText = "⚠️ 風險警告：此方案出現財務赤字或房貸負擔過重 (符合案例四特徵)";
        } else {
            alertBox.style.display = 'block';
            alertBox.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
            alertBox.style.color = '#10b981';
            alertBox.innerText = "✅ 財務健康：通過壓力測試，現金流穩定。";
        }

        // 5. 繪圖與製表
        APP.drawCharts(res);
        APP.renderTable(res);
        
        // 控制房產區塊顯示
        document.getElementById('housing-area').className = d.buyHouse ? 'grid grid-cols-2 gap-2' : 'hidden';
    },

    drawCharts: (r) => {
        const labels = r.years.map(y => 'Y'+y);
        
        // Chart 1: 淨資產成長
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ 
                    label: '淨資產 (Net Worth)', 
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
