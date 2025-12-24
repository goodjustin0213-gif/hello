/**
 * 軍人職涯薪資規劃決策支援系統 - 核心邏輯層 (Logic Layer)
 * 依照論文「3.3.3 模型設計方法」與「4.4 系統功能模組設計」實作
 */

const APP = {
    charts: {}, // 儲存圖表實例

    // --- 資料層 (Data Layer) ---
    // 依據論文 [cite: 71, 76] 建立軍職薪資資料庫
    // 數據來源：參考國防部 2024 薪給簡表 (預估值)
    // 結構：base (本俸), pro (專業加給平均)
    rankDB: {
        '二兵': {base: 10550, pro: 0},
        '一兵': {base: 11130, pro: 0},
        '上兵': {base: 12280, pro: 0},
        '下士': {base: 14645, pro: 5500},
        '中士': {base: 16585, pro: 6200},
        '上士': {base: 18525, pro: 7000},
        '三等士官長': {base: 22750, pro: 8200},
        '二等士官長': {base: 25050, pro: 9500},
        '一等士官長': {base: 28880, pro: 10800},
        '少尉': {base: 22750, pro: 8500},
        '中尉': {base: 25050, pro: 9800},
        '上尉': {base: 28880, pro: 11500},
        '少校': {base: 32710, pro: 23000},
        '中校': {base: 37310, pro: 26000},
        '上校': {base: 41900, pro: 32000},
        '少將': {base: 48030, pro: 40000}
    },

    // 階級晉升順序
    rankOrder: [
        '二兵','一兵','上兵',
        '下士','中士','上士','三等士官長','二等士官長','一等士官長',
        '少尉','中尉','上尉','少校','中校','上校','少將'
    ],

    // --- 工具函式 ---
    // 強制轉數值 (防呆)
    N: v => {
        if (!v) return 0;
        const n = parseFloat(String(v).replace(/,/g, ''));
        return isNaN(n) ? 0 : n;
    },
    // 千分位格式化
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- 初始化 (Application Layer) ---
    init: () => {
        // 設定 Chart.js 全域字體
        Chart.defaults.font.family = "'Noto Sans TC', sans-serif";
        Chart.defaults.color = '#64748b';

        // 1. 初始化下拉選單
        const sel = document.getElementById('startRank');
        APP.rankOrder.forEach(r => sel.add(new Option(r, r)));
        sel.value = '少尉'; // 預設起始階級 [cite: 115]

        // 2. 綁定事件：所有輸入框變動時重新運算 [cite: 229]
        document.body.addEventListener('input', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                // 如果是滑桿，更新顯示數值
                if (e.target.id === 'investRate') {
                    document.getElementById('investRateVal').innerText = e.target.value + '%';
                }
                APP.calc();
            }
        });

        // 3. 綁定購屋開關顯示邏輯
        document.getElementById('buyHouse').addEventListener('change', e => {
            document.getElementById('housing-opts').classList.toggle('hidden', !e.target.checked);
            APP.calc();
        });

        // 4. 初次執行運算
        APP.calc();
    },

    // --- 功能模組：載入預設值 ---
    loadDefaults: () => {
        const container = document.getElementById('allowance-container');
        // 依照論文資料需求：勤務津貼與加給 [cite: 72]
        container.innerHTML = `
            <div class="flex justify-between items-center text-xs mb-1">
                <span class="font-bold text-gray-600">志願役加給</span>
                <input type="number" id="vol-allowance" value="15000" class="border rounded p-1 w-20 text-right bg-gray-50">
            </div>
            <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-gray-600">勤務/地域加給</span>
                <input type="number" id="duty-allowance" value="5000" class="border rounded p-1 w-20 text-right">
            </div>
        `;
        APP.calc(); // 載入後重算
    },

    // --- 邏輯層 (Logic Layer) 核心運算 ---
    calc: () => {
        // --- 1. 資料輸入 (Input) [cite: 96] ---
        const startRank = document.getElementById('startRank').value;
        const years = APP.N(document.getElementById('serviceYears').value);
        
        // 支出參數
        const livingCost = APP.N(document.getElementById('livingCost').value);
        const fixedCost = APP.N(document.getElementById('fixedCost').value);
        
        // 投資參數
        const investRate = APP.N(document.getElementById('investRate').value) / 100;
        const roi = APP.N(document.getElementById('roi').value) / 100;

        // 額外加給 (若尚未載入則為 0)
        const volAdd = document.getElementById('vol-allowance') ? APP.N(document.getElementById('vol-allowance').value) : 0;
        const dutyAdd = document.getElementById('duty-allowance') ? APP.N(document.getElementById('duty-allowance').value) : 0;

        // 購屋參數
        const isBuy = document.getElementById('buyHouse').checked;
        const buyYear = APP.N(document.getElementById('buyYear').value);
        const housePrice = APP.N(document.getElementById('housePrice').value) * 10000;
        const loanYears = APP.N(document.getElementById('loanYears').value);
        const loanRate = APP.N(document.getElementById('loanRate').value) / 100;

        // --- 2. 變數初始化 ---
        let rankIdx = APP.rankOrder.indexOf(startRank);
        let rankY = 0;      // 該階級已停年數
        let invPool = 0;    // 累積投資資產 (複利)
        let cashPool = 0;   // 累積現金資產 (無息)
        let houseVal = 0;   // 房產價值
        let loanBal = 0;    // 剩餘貸款
        let hasBought = false; // 是否已購屋狀態

        // 用於圖表的數據陣列
        const chartData = { years:[], income:[], disposable:[], netAsset:[], cashflow:[], invest:[] };
        const tableRows = [];

        // --- 3. 逐年模擬迴圈 ---
        for (let y = 1; y <= years; y++) {
            
            // --- A. 薪資成長模型 [cite: 102] ---
            // 簡易晉升邏輯：每4年升一階，直到該體系頂端 (士兵/士官/軍官)
            // 實務上應更複雜，此處為模擬用
            if (y > 1 && y % 4 === 0 && rankIdx < APP.rankOrder.length - 1) {
                // 簡單判斷：避免士兵直接跳軍官，但在同一列表下暫且允許順序晉升
                rankIdx++;
                rankY = 0;
            } else {
                rankY++;
            }
            
            const rName = APP.rankOrder[rankIdx];
            const rData = APP.rankDB[rName];

            // 本俸隨年資調升 (假設每年約 1.5% 年功俸成長)
            const basePay = rData.base * Math.pow(1.015, rankY);
            
            // 月收入 = 本俸 + 專業加給 + 志願役加給 + 勤務加給
            const monthlyIncome = basePay + rData.pro + volAdd + dutyAdd;
            
            // 年收入 (含 1.5 個月年終)
            const annualIncome = monthlyIncome * 13.5;

            // --- B. 房貸負擔能力模型 [cite: 108, 204] ---
            let annualMortgage = 0;
            let monthlyMortgage = 0;

            if (isBuy && y === buyYear && !hasBought) {
                hasBought = true;
                houseVal = housePrice;
                const downPayment = housePrice * 0.2; // 假設頭期款 20%
                loanBal = housePrice - downPayment;
                
                // 支付頭期款 (優先扣現金，不足扣投資)
                if (cashPool >= downPayment) {
                    cashPool -= downPayment;
                } else {
                    const remain = downPayment - cashPool;
                    cashPool = 0;
                    invPool -= remain; // 變賣資產
                }

                // 計算每月還款額 (本息均攤公式) [cite: 109]
                // PMT = P * [ r(1+r)^n / ((1+r)^n - 1) ]
                const r = loanRate / 12;
                const n = loanYears * 12;
                monthlyMortgage = loanBal * (r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
            }

            if (hasBought && loanBal > 0) {
                // 如果非購屋當年，重新計算或沿用月還款 (此處簡化為沿用當年計算值)
                // 為了精確，需在迴圈外儲存固定還款額，這裡重新計算當年應還
                const r = loanRate / 12;
                // 注意：本息均攤是固定的，這裡簡化計算年支出
                if (monthlyMortgage === 0) { 
                     // 若是買房後續年份，需依原始貸款額計算 PMT (這裡簡化處理：假設利率不變，PMT固定)
                     // 實作上應在買房那年存下 monthlyMortgage 變數
                     const nTotal = loanYears * 12;
                     // 這裡為了演示，我們假設 annualMortgage 在買房後每年固定
                     // 需要一個變數存 fixedMonthlyMortgage
                }
            }
            
            // 修正：在迴圈外存儲固定還款額
            if (hasBought && APP.fixedMonthlyMortgage === undefined) {
                 const r = loanRate / 12;
                 const n = loanYears * 12;
                 const originalLoan = housePrice * 0.8;
                 APP.fixedMonthlyMortgage = originalLoan * (r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
            }
            
            if (hasBought && loanBal > 0) {
                annualMortgage = APP.fixedMonthlyMortgage * 12;
                // 扣除本金 (簡易計算：年還款 - 年利息)
                const annualInterest = loanBal * loanRate;
                const principalPaid = annualMortgage - annualInterest;
                loanBal -= principalPaid;
                if (loanBal < 0) loanBal = 0;
            }

            // --- C. 可支配所得模型 [cite: 103] ---
            // 可支配所得 = 總收入 - 固定支出 - 生活支出
            const annualLivingExp = (livingCost + fixedCost) * 12;
            const annualDisposable = annualIncome - annualLivingExp;

            // --- D. 投資報酬率模擬模型 [cite: 105, 200] ---
            // 投資金額 = 月薪 * 提撥率
            const investAmount = monthlyIncome * investRate * 12;
            
            // 現金結餘 = 可支配所得 - 投資金額 - 房貸支出
            const cashSurplus = annualDisposable - investAmount - annualMortgage;

            // 資產滾存 (複利計算 FV)
            invPool = invPool * (1 + roi) + investAmount;
            cashPool += cashSurplus; // 現金不計息

            // 總淨資產 = 投資 + 現金 + (房產市值 - 剩餘貸款)
            const currentHouseVal = hasBought ? housePrice : 0; // 簡化：房產不計增值以保守估計，或可加 houseAppreciation
            const houseNet = Math.max(0, currentHouseVal - loanBal);
            const netAsset = invPool + cashPool + houseNet;

            // --- 4. 數據儲存 (供應用層顯示) ---
            chartData.years.push(y);
            chartData.income.push(annualIncome);
            chartData.disposable.push(annualDisposable); // 論文圖 3.1: 薪資成長
            chartData.netAsset.push(netAsset);           // 論文圖 3.1: 累積資產
            chartData.cashflow.push(cashSurplus);        // 用於分析現金流壓力
            chartData.invest.push(invPool);

            tableRows.push({
                y, rank: rName, 
                inc: annualIncome, 
                cost: annualLivingExp, 
                disp: annualDisposable, 
                inv: investAmount, 
                mort: annualMortgage, 
                net: netAsset
            });
        }
        
        // 清除暫存變數
        APP.fixedMonthlyMortgage = undefined;

        // --- 5. 輸出結果 (應用層) [cite: 67] ---
        APP.updateUI(tableRows, chartData, invPool, cashPool, loanBal);
    },

    // --- 應用層 (UI & Visualization) ---
    updateUI: (rows, data, invTotal, cashTotal, loanBal) => {
        // 1. 更新 KPI 數字
        document.getElementById('kpi-net-asset').innerText = APP.F(data.netAsset[data.netAsset.length-1]);
        document.getElementById('kpi-invest-gain').innerText = APP.F(invTotal);
        
        // 計算平均每月可支配所得
        const avgDisp = data.disposable.reduce((a,b)=>a+b,0) / data.disposable.length / 12;
        document.getElementById('kpi-disposable').innerText = APP.F(avgDisp);

        // 終身俸估算 (最後一年本俸 * 2 * 60% 概算)
        // 依據論文 [cite: 43] 退休制度具穩定性
        const finalRankName = rows[rows.length-1].rank;
        const finalBase = APP.rankDB[finalRankName].base;
        // 假設服役20年起支 55%，每多一年+2%
        const years = rows.length;
        const pensionRate = 0.55 + Math.max(0, years-20)*0.02;
        const monthlyPension = finalBase * 2 * Math.min(pensionRate, 0.95);
        document.getElementById('kpi-pension').innerText = APP.F(monthlyPension);

        // 2. 更新表格
        const tbody = document.getElementById('data-table-body');
        tbody.innerHTML = rows.map(r => `
            <tr>
                <td class="p-3 font-mono text-gray-500">第 ${r.y} 年</td>
                <td class="p-3 font-bold text-gray-800">${r.rank}</td>
                <td class="p-3 text-right">${APP.F(r.inc)}</td>
                <td class="p-3 text-right text-red-500">${APP.F(r.cost)}</td>
                <td class="p-3 text-right font-bold text-blue-600 bg-blue-50">${APP.F(r.disp)}</td>
                <td class="p-3 text-right text-emerald-600">${APP.F(r.inv)}</td>
                <td class="p-3 text-right text-orange-600">${APP.F(r.mort)}</td>
                <td class="p-3 text-right font-black text-gray-800">${APP.F(r.net)}</td>
            </tr>
        `).join('');

        // 3. 繪製圖表 [cite: 90]
        APP.drawCharts(data);

        // 4. 房貸壓力分析報告 [cite: 206]
        const analysisDiv = document.getElementById('housing-analysis');
        if (document.getElementById('buyHouse').checked) {
            const hasDeficit = data.cashflow.some(c => c < 0);
            analysisDiv.classList.remove('hidden');
            if (hasDeficit) {
                analysisDiv.innerHTML = `⚠️ <strong>風險提示：</strong> 模擬結果顯示，在購屋後的某些年份，您的現金結餘出現赤字（透支）。建議降低房屋總價、提高頭期款比例，或減少生活支出以避免財務危機。`;
                analysisDiv.className = "mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border-l-4 border-red-500";
            } else {
                analysisDiv.innerHTML = `✅ <strong>評估結果：</strong> 您的財務狀況足以負擔此購屋計畫，現金流均為正值。`;
                analysisDiv.className = "mt-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm border-l-4 border-green-500";
            }
        } else {
            analysisDiv.classList.add('hidden');
        }
    },

    drawCharts: (d) => {
        const commonOpts = { 
            responsive: true, 
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false }
        };

        // 圖表 1: 薪資與可支配所得 (Salary Growth Model)
        if (APP.charts.salary) APP.charts.salary.destroy();
        APP.charts.salary = new Chart(document.getElementById('chart-salary'), {
            type: 'line',
            data: {
                labels: d.years,
                datasets: [
                    { label: '年總收入', data: d.income, borderColor: '#9ca3af', borderDash:[5,5], fill:false, tension:0.1 },
                    { label: '可支配所得', data: d.disposable, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill:true, borderWidth:2 }
                ]
            },
            options: commonOpts
        });

        // 圖表 2: 資產累積 (Investment Simulation)
        if (APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: d.years,
                datasets: [
                    { label: '淨資產累積', data: d.netAsset, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill:true, borderWidth:3 }
                ]
            },
            options: commonOpts
        });

        // 圖表 3: 現金流壓力 (Housing Affordability)
        if (APP.charts.cashflow) APP.charts.cashflow.destroy();
        APP.charts.cashflow = new Chart(document.getElementById('chart-cashflow'), {
            type: 'bar',
            data: {
                labels: d.years,
                datasets: [{ 
                    label: '年度現金結餘', 
                    data: d.cashflow, 
                    backgroundColor: d.cashflow.map(v => v < 0 ? '#ef4444' : '#f97316') // 負值顯紅 [cite: 132]
                }]
            },
            options: commonOpts
        });
    }
};

// 系統啟動
window.onload = APP.init;
