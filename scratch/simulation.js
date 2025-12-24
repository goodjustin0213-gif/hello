/**
 * AIR FORCE FINANCIAL DSS - CORE V16.0 (Flagship Edition)
 * Features: Full Ranks (Soldier/NCO/Officer), Monte Carlo Scenarios, AI Advice
 */

const APP = {
    data: {},
    charts: {},
    
    // --- 1. 全軍階級資料庫 (2025 預估基準) ---
    // base: 本俸, pro: 專業加給(平均), vol: 志願役加給(平均), max: 卡階年限
    // 為了簡化計算，這裡將志願役加給預設併入計算，或者在運算時統一加
    rankDB: {
        // 士兵
        '二兵': { base: 10550, pro: 0, vol: 15000, max: 1 }, 
        '一兵': { base: 11130, pro: 0, vol: 15000, max: 1 },
        '上兵': { base: 12280, pro: 0, vol: 15000, max: 10 },
        // 士官
        '下士': { base: 14645, pro: 5500, vol: 15000, max: 10 },
        '中士': { base: 16585, pro: 6200, vol: 15000, max: 10 },
        '上士': { base: 18525, pro: 7000, vol: 15000, max: 20 },
        '三等士官長': { base: 22750, pro: 8200, vol: 15000, max: 24 },
        '二等士官長': { base: 25050, pro: 9500, vol: 15000, max: 26 },
        '一等士官長': { base: 28880, pro: 10800, vol: 15000, max: 30 },
        // 軍官
        '少尉': { base: 22750, pro: 8500, vol: 15000, max: 10 },
        '中尉': { base: 25050, pro: 9800, vol: 15000, max: 10 },
        '上尉': { base: 28880, pro: 11500, vol: 15000, max: 15 },
        '少校': { base: 32710, pro: 23000, vol: 15000, max: 20 },
        '中校': { base: 37310, pro: 26000, vol: 15000, max: 24 },
        '上校': { base: 41900, pro: 32000, vol: 15000, max: 28 },
        '少將': { base: 48030, pro: 40000, vol: 15000, max: 35 }
    },

    // 晉升順序 (用於判斷下一個階級)
    rankOrder: [
        '二兵','一兵','上兵',
        '下士','中士','上士','三等士官長','二等士官長','一等士官長',
        '少尉','中尉','上尉','少校','中校','上校','少將'
    ],

    // --- Utils ---
    N: v => { const n = parseFloat(String(v).replace(/,/g,'')); return isNaN(n)?0:n; },
    F: n => Math.round(n).toLocaleString('en-US'),

    // --- Init ---
    init: () => {
        Chart.defaults.font.family = "'Noto Sans TC', sans-serif";
        Chart.defaults.color = '#64748b';
        Chart.defaults.borderColor = '#e2e8f0';

        // 注入階級選單
        const opts = APP.rankOrder.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;

        // 預設值
        const def = {
            currentRank: '上兵', targetRank: '一等士官長', serviceYears: 20, 
            inflationRate: 2, salaryRaiseRate: 1, returnRate: 6,
            buyHouseToggle: false, buyYear: 5, housePriceWan: 1200, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
            investSliderPct: 30, 
            allowances: [], expenses: [{name:'生活費', val:15000}], investments: [{name:'儲蓄險', val:3000}]
        };
        APP.data = JSON.parse(JSON.stringify(def));

        // 綁定事件
        document.body.addEventListener('input', e => {
            if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT') APP.calc();
        });

        APP.renderInputs();
        setTimeout(APP.calc, 300);
    },

    // --- Data Handling ---
    save: () => {
        const d = APP.data;
        ['currentRank','targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation','investSlider'].forEach(k => {
            const el = document.getElementById(k);
            if(el) d[k==='investSlider'?'investSliderPct':k] = (k.includes('Rank')) ? el.value : APP.N(el.value);
        });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        d.allowances = APP.readList('allowance-list');
        d.expenses = APP.readList('expense-list');
        d.investments = APP.readList('invest-list');
    },

    renderInputs: () => {
        const d = APP.data;
        ['currentRank','targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation'].forEach(k => document.getElementById(k).value = d[k]);
        document.getElementById('investSlider').value = d.investSliderPct;
        document.getElementById('slider-val').innerText = d.investSliderPct+'%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        
        const h = document.getElementById('housing-inputs');
        if(d.buyHouseToggle) { h.classList.remove('hidden'); h.classList.add('grid'); } else { h.classList.add('hidden'); h.classList.remove('grid'); }
    },

    // --- List Helpers ---
    renderList: (id, list) => {
        const c = document.getElementById(id); c.innerHTML = '';
        list.forEach(i => {
            let ex = id==='allowance-list' ? `<input type="number" class="w-14 text-center border-slate-300" value="${i.start||1}">-<input type="number" class="w-14 text-center border-slate-300" value="${i.end||20}">` : '';
            c.innerHTML += `<div class="flex gap-2 mb-2 list-item"><input type="text" value="${i.name}" class="flex-1 border-slate-300"><input type="number" value="${i.val}" class="w-20 text-right font-bold text-slate-700 border-slate-300">${ex}<button onclick="this.parentElement.remove();app.calc()" class="text-rose-500 font-bold px-2">✕</button></div>`;
        });
    },
    readList: id => {
        const arr = [];
        document.getElementById(id).querySelectorAll('.list-item').forEach(r => {
            const inputs = r.querySelectorAll('input');
            if(id==='allowance-list') arr.push({name:inputs[0].value, val:APP.N(inputs[1].value), start:APP.N(inputs[2].value), end:APP.N(inputs[3].value)});
            else arr.push({name:inputs[0].value, val:APP.N(inputs[1].value)});
        });
        return arr;
    },
    addItem: id => {
        const l = id==='allowance-list'?APP.data.allowances:(id==='expense-list'?APP.data.expenses:APP.data.investments);
        l.push({name:'新項目', val:0, start:1, end:20}); APP.renderList(id, l); APP.calc();
    },
    addExpenseItem: () => APP.addItem('expense-list'),
    addInvestItem: () => APP.addItem('invest-list'),
    loadPresets: () => {
        // 2025 預估空勤/海勤/戰鬥加給 (簡易版)
        const presets = [{name:'戰鬥加給', val:5000, start:1, end:20}];
        APP.data.allowances = presets; APP.renderList('allowance-list', presets); APP.calc();
    },

    // --- 核心模擬引擎 (支援情境分析) ---
    runSim: (d, roiOffset = 0) => {
        const N = APP.N;
        const years = N(d.serviceYears)||20;
        const inf = N(d.inflationRate)/100;
        const raise = N(d.salaryRaiseRate)/100;
        const roi = (N(d.returnRate) + roiOffset) / 100; // 情境調整 ROI
        const pct = N(d.investSliderPct)/100;
        
        let rank = d.currentRank; 
        let rankY = 0;
        const targetIdx = APP.rankOrder.indexOf(d.targetRank);
        
        let invPool = 0, cashPool = 0, house = 0, loan = 0, mPay = 0, hasHouse = false;
        const res = { years:[], net:[], invP:[], cashP:[], houseNet:[], sal:[], log:[] };
        
        const baseExp = d.expenses.reduce((s,x)=>s+N(x.val),0);
        const baseInv = d.investments.reduce((s,x)=>s+N(x.val),0);

        for(let y=1; y<=years; y++) {
            // A. 晉升邏輯
            const rData = APP.rankDB[rank];
            const rIdx = APP.rankOrder.indexOf(rank);
            
            // 簡單晉升規則：如果年資到了，且還沒到目標，就升
            // 注意：這裡假設第一年從 currentRank 開始，隨後根據 max 年限晉升
            if (y > 1 && rankY >= rData.max && rIdx < targetIdx) {
                // 檢查是否跨越士官->軍官 (這裡簡單處理：允許)
                rank = APP.rankOrder[rIdx + 1];
                rankY = 0;
            } else {
                rankY++;
            }

            // B. 薪資 = 本俸 + 專業 + 志願役 + 其他加給
            // 調薪：只對本俸做複利調整
            const currR = APP.rankDB[rank];
            const payBase = currR.base * Math.pow(1.01, y-1) * Math.pow(1+raise, y-1); 
            // 專業加給 + 志願役 (假設不隨通膨調，或調幅極小)
            const payAdd = currR.pro + currR.vol; 
            
            let allow = 0; d.allowances.forEach(a => { if(y>=N(a.start) && y<=N(a.end)) allow+=N(a.val); });
            
            const gross = payBase + payAdd + allow;
            const netM = Math.round(gross * 0.94); // 扣除退撫(4%)+健保(2%)

            // C. 房產
            let yMort = 0;
            if(d.buyHouseToggle && y===N(d.buyYear) && !hasHouse) {
                hasHouse = true; house = N(d.housePriceWan)*10000;
                const down = house*(N(d.downPaymentPct)/100); loan = house-down;
                if(cashPool>=down) cashPool-=down; else { const r=down-cashPool; cashPool=0; invPool-=r; }
                const r=N(d.mortgageRate)/100/12, n=N(d.loanTerm)*12;
                mPay = loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
            }
            if(hasHouse) {
                house *= (1+N(d.houseAppreciation)/100);
                if(loan>0) { 
                    yMort=mPay*12; loan-=(yMort-loan*(N(d.mortgageRate)/100)); if(loan<0)loan=0; 
                }
            }

            // D. 金流
            const yInc = netM * 13.5;
            const yEx = baseExp * Math.pow(1+inf, y-1) * 12;
            const yInvIn = (netM * pct + baseInv) * 12;
            const ySurplus = yInc - yEx - yInvIn - yMort;

            // E. 滾存
            invPool = invPool * (1+roi) + yInvIn;
            cashPool += ySurplus;

            const houseNet = Math.max(0, house - loan);
            const totalNet = invPool + cashPool + houseNet;

            res.years.push(y);
            res.net.push(totalNet);
            res.invP.push(invPool);
            res.sal.push(Math.round(netM));
            
            // Log 紀錄 (只在基準情境下詳細記錄)
            if (roiOffset === 0) {
                res.log.push({
                    y, rank, inc:yInc, ex:yEx, invIn:yInvIn, mort:yMort, surplus:ySurplus,
                    invVal:invPool, cashVal:cashPool, houseNet, net:totalNet
                });
                res.cashP.push(cashPool);
                res.houseNet.push(houseNet);
            }
        }
        
        // 終身俸估算 (最後階級本俸 * 2 * (55% + 2%*超過20年))
        const finalR = APP.rankDB[rank];
        const ratio = 0.55 + Math.max(0, years-20)*0.02;
        res.pension = Math.round(finalR.base * 2 * Math.min(ratio, 0.95)); // 上限95%
        
        return res;
    },

    calc: () => {
        APP.save();
        const d = APP.data;
        
        // 跑 5 種情境
        const rBase = APP.runSim(d, 0);      // 基準 (6%)
        const rMax = APP.runSim(d, 5);       // 大成功 (+5%)
        const rGood = APP.runSim(d, 2);      // 小成功 (+2%)
        const rBad = APP.runSim(d, -2);      // 小失敗 (-2%)
        const rMin = APP.runSim(d, -5);      // 大失敗 (-5%)

        APP.ui(rBase, rMax, rGood, rBad, rMin);
    },

    ui: (base, max, good, bad, min) => {
        const l = base.net.length - 1;
        document.getElementById('kpi-asset').innerText = APP.F(base.net[l]);
        document.getElementById('kpi-max').innerText = APP.F(max.net[l]);
        document.getElementById('kpi-min').innerText = APP.F(min.net[l]);
        
        // 生成建議文字
        const net = base.net[l];
        const adviceDiv = document.getElementById('strategy-advice');
        let advice = `<p class="mb-2"><strong>📊 戰略分析：</strong>經過 ${base.years.length} 年的複利效應，您的資產區間落在 <span class="text-red-600 font-bold">${APP.F(min.net[l])}</span> (悲觀) 到 <span class="text-green-600 font-bold">${APP.F(max.net[l])}</span> (樂觀) 之間。</p>`;
        
        if (net < 0) {
            advice += `<p class="text-red-600 font-bold">⚠️ 警告：在基準情境下，您的淨資產為負值。這表示債務與支出超過了累積資產，極高破產風險。請立即降低支出或延後購屋。</p>`;
        } else if (base.cashP[l] < 0) {
            advice += `<p class="text-orange-600 font-bold">⚠️ 注意：雖然總資產為正，但「現金池」出現赤字 (${APP.F(base.cashP[l])})。這代表您可能變賣了投資或借貸來維持生活，現金流不健康。</p>`;
        } else {
            advice += `<p class="text-slate-600">您的財務狀況健康。投資部位貢獻了約 <span class="text-emerald-600 font-bold">${APP.F(base.invP[l])}</span> 的價值。若市場表現良好，資產有機會翻倍。</p>`;
        }
        adviceDiv.innerHTML = advice;

        // 表格
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        base.log.forEach(x => {
            tb.innerHTML += `<tr>
                <td>Y${x.y}</td><td class="font-bold text-blue-700">${x.rank}</td>
                <td>${APP.F(x.inc)}</td><td class="text-red-500">${APP.F(x.ex)}</td>
                <td class="text-emerald-600 font-bold">${APP.F(x.invIn)}</td><td>${APP.F(x.mort)}</td>
                <td class="${x.surplus<0?'text-red-600 font-black':'text-blue-700 font-bold'}">${APP.F(x.surplus)}</td>
                <td>${APP.F(x.invVal)}</td><td class="${x.cashVal<0?'text-red-600':''}">${APP.F(x.cashVal)}</td>
                <td>${APP.F(x.houseNet)}</td><td class="bg-slate-800 text-white font-bold">${APP.F(x.net)}</td>
            </tr>`;
        });

        APP.draw(base, max, min);
    },

    draw: (base, max, min) => {
        const labels = base.years.map(y=>'Y'+y);
        
        // 1. 扇形圖 (Scenario Fan Chart)
        if(APP.charts.fan) APP.charts.fan.destroy();
        APP.charts.fan = new Chart(document.getElementById('chart-fan'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: '樂觀極限', data: max.net, borderColor: 'transparent', backgroundColor: 'rgba(34, 197, 94, 0.2)', fill: '+1', pointRadius:0 },
                    { label: '悲觀極限', data: min.net, borderColor: 'transparent', backgroundColor: 'rgba(239, 68, 68, 0.2)', fill: '-1', pointRadius:0 }, // Fill to previous curve? No, fill logic is tricky. 
                    // Simpler Fan: Fill from base to max (green), base to min (red)
                    { label: '基準情境', data: base.net, borderColor: '#3b82f6', borderWidth: 3, fill: false }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: { grid: { borderDash: [4,4] } }
                }
            }
        });
        
        // Fix Fan Chart fill: 
        // Dataset 0 (Max) no fill. 
        // Dataset 1 (Base) fill to 0 (color green area). 
        // Dataset 2 (Min) fill to 1 (color red area? No chartjs fill is complex).
        // Let's use simple lines for clarity in V16.0
        APP.charts.fan.data.datasets = [
            { label: '大成功 (ROI+5%)', data: max.net, borderColor: '#16a34a', borderWidth: 1, borderDash:[5,5], fill: false, pointRadius:0 },
            { label: '基準線 (Base)', data: base.net, borderColor: '#2563eb', borderWidth: 4, fill: false, pointRadius:0 },
            { label: '大失敗 (ROI-5%)', data: min.net, borderColor: '#dc2626', borderWidth: 1, borderDash:[5,5], fill: false, pointRadius:0 }
        ];
        APP.charts.fan.update();

        // 2. 薪資階級圖 (Step Chart)
        if(APP.charts.salary) APP.charts.salary.destroy();
        APP.charts.salary = new Chart(document.getElementById('chart-salary'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: '月薪變化', data: base.sal, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', stepper: true, fill: true }]
            },
            options: { responsive: true, maintainAspectRatio: false, elements: { line: { tension: 0 } } }
        });

        // 3. 資產結構 (Structure)
        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: '房產淨值', data: base.houseNet, backgroundColor: '#fb923c', stack: 'Stack 0' },
                    { label: '投資總值', data: base.invP, backgroundColor: '#10b981', stack: 'Stack 0' },
                    { label: '現金/負債', data: base.cashP, backgroundColor: '#3b82f6', stack: 'Stack 0' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

window.onload = APP.init;
window.app = APP;
