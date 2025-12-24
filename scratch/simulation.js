/**
 * AIR FORCE FINANCIAL DSS - CORE V23.0 (Emergency Fix)
 * 修復重點：
 * 1. 補完 rankDB 所有欄位，防止 NaN。
 * 2. 強制轉型 APP.N() 應用於所有輸入。
 * 3. 實領月薪校正邏輯優化。
 */

const APP = {
    charts: {},

    // 完整資料庫：確保每個階級都有 base (本俸) 和 pro (專業加給)
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
    rankOrder: ['二兵','一兵','上兵','下士','中士','上士','三等士官長','二等士官長','一等士官長','少尉','中尉','上尉','少校','中校','上校','少將'],

    // 工具：強制轉數字，若非數字則回傳 0
    N: v => parseFloat(String(v).replace(/,/g,'')) || 0,
    F: n => Math.round(n).toLocaleString('en-US'),

    init: () => {
        Chart.defaults.font.family = "'Noto Sans TC', sans-serif";
        Chart.defaults.color = '#64748b';

        // 1. 注入選單
        const opts = APP.rankOrder.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('currentRank').innerHTML = opts;
        document.getElementById('targetRank').innerHTML = opts;
        
        // 2. 設定預設值
        document.getElementById('currentRank').value = '少尉';
        document.getElementById('targetRank').value = '中校';

        // 3. 綁定事件
        document.body.addEventListener('input', e => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') APP.calc();
        });
        document.getElementById('buyHouse').addEventListener('change', e => {
            document.getElementById('housing-opts').classList.toggle('hidden', !e.target.checked);
            APP.calc();
        });

        // 4. 初次計算
        APP.calc();
    },

    // --- 列表操作 ---
    addItem: (id) => {
        const c = document.getElementById(id);
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <input type="text" value="新項目" class="flex-1 border-slate-300 text-sm p-2 rounded border">
            <input type="number" value="0" class="w-24 text-right border-slate-300 text-sm font-bold text-slate-700 p-2 rounded border">
            <button onclick="this.parentElement.remove();APP.calc()" class="text-red-400 font-bold px-2">✕</button>
        `;
        c.appendChild(div);
        // 不需存檔，直接由 DOM 讀取，避免邏輯錯誤
    },

    // --- 核心運算 ---
    calc: () => {
        // 1. 讀取所有參數 (強制轉型)
        const currentRank = document.getElementById('currentRank').value;
        const targetRank = document.getElementById('targetRank').value;
        const years = APP.N(document.getElementById('serviceYears').value);
        const realPay = APP.N(document.getElementById('realPay').value);
        
        const baseExpense = APP.N(document.getElementById('totalExpense').value);
        const investRate = APP.N(document.getElementById('investRate').value) / 100;
        const roi = APP.N(document.getElementById('roi').value) / 100;
        const inflation = APP.N(document.getElementById('inflation').value) / 100;

        // 讀取列表總和
        let extraExp = 0;
        document.querySelectorAll('#expense-list .list-item input[type=number]').forEach(i => extraExp += APP.N(i.value));
        
        let extraInv = 0;
        document.querySelectorAll('#invest-list .list-item input[type=number]').forEach(i => extraInv += APP.N(i.value));

        // 購屋參數
        const buyHouse = document.getElementById('buyHouse').checked;
        const buyYear = APP.N(document.getElementById('buyYear').value);
        const housePrice = APP.N(document.getElementById('housePrice').value) * 10000;
        const downPct = APP.N(document.getElementById('downPayment').value) / 100;
        const loanYears = APP.N(document.getElementById('loanYears').value);
        const loanRate = 0.022; // 2.2%

        // 2. 模擬變數
        let rankIdx = APP.rankOrder.indexOf(currentRank);
        let targetIdx = APP.rankOrder.indexOf(targetRank);
        let rankY = 0;
        
        let invPool = 0, cashPool = 0;
        let houseVal = 0, loanBal = 0, hasBought = false, mPay = 0;

        const data = { years:[], net:[], inv:[], cash:[], house:[] };
        const rows = [];

        // 3. 逐年計算
        for(let y=1; y<=years; y++) {
            // A. 晉升邏輯
            if(y > 1 && y % 4 === 0 && rankIdx < targetIdx) {
                rankIdx++; rankY = 0;
            } else rankY++;
            
            const rName = APP.rankOrder[rankIdx];
            const rInfo = APP.rankDB[rName] || {base:20000, pro:0}; // 防呆 fallback

            // B. 收入計算
            // 如果有填實領，就用實領當基準，每年微幅成長
            // 如果沒填，就用資料庫算
            let monthInc = 0;
            if (realPay > 0) {
                monthInc = realPay * Math.pow(1.015, y-1); // 假設每年自然成長1.5%
            } else {
                // 公式：本俸 * 年資加成 + 專業 + 志願役(15000)
                const base = rInfo.base * Math.pow(1.015, rankY);
                monthInc = base + rInfo.pro + 15000;
            }
            const annualInc = monthInc * 13.5;

            // C. 房貸
            let yearMort = 0;
            if(buyHouse && y === buyYear && !hasBought) {
                hasBought = true;
                houseVal = housePrice;
                const down = housePrice * downPct;
                loanBal = housePrice - down;
                
                if(cashPool >= down) cashPool -= down;
                else { invPool -= (down - cashPool); cashPool = 0; }

                const r = loanRate/12, n = loanYears*12;
                mPay = loanBal * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
            }
            if(hasBought && loanBal > 0) {
                yearMort = mPay * 12;
                loanBal -= (yearMort - loanBal*loanRate);
                if(loanBal < 0) loanBal = 0;
            }

            // D. 支出與投資
            const totalMonthlyExp = baseExpense + extraExp;
            const annualExp = totalMonthlyExp * 12 * Math.pow(1+inflation, y-1);
            
            const annualInvInput = (monthInc * investRate * 12) + (extraInv * 12);
            
            const cashSurplus = annualInc - annualExp - annualInvInput - yearMort;

            // E. 滾存
            invPool = invPool * (1+roi) + annualInvInput;
            cashPool += cashSurplus;
            const houseNet = hasBought ? Math.max(0, houseVal - loanBal) : 0;
            const net = invPool + cashPool + houseNet;

            // F. 紀錄
            data.years.push(y);
            data.net.push(net);
            data.inv.push(invPool);
            data.cash.push(cashPool);
            data.house.push(houseNet);

            rows.push({
                y, rank: rName, inc: annualInc, ex: annualExp, 
                inv: annualInvInput, mort: yearMort, net
            });
        }

        APP.updateUI(rows, data, invPool);
    },

    updateUI: (rows, data, invTotal) => {
        const last = data.net.length-1;
        document.getElementById('kpi-net').innerText = APP.F(data.net[last]);
        document.getElementById('kpi-invest').innerText = APP.F(invTotal);
        
        // 終身俸估算
        const lastRank = rows[last].rank;
        const base = APP.rankDB[lastRank].base;
        const pen = base * 2 * (0.55 + Math.max(0, rows.length-20)*0.02);
        document.getElementById('kpi-pension').innerText = APP.F(pen);

        // 表格
        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        rows.forEach(r => {
            tb.innerHTML += `<tr>
                <td class="p-3 text-center text-slate-400">Y${r.y}</td>
                <td class="p-3 font-bold text-slate-700">${r.rank}</td>
                <td class="p-3 text-right text-blue-600">${APP.F(r.inc)}</td>
                <td class="p-3 text-right text-red-500">${APP.F(r.ex)}</td>
                <td class="p-3 text-right text-emerald-600">${APP.F(r.inv)}</td>
                <td class="p-3 text-right text-orange-500">${APP.F(r.mort)}</td>
                <td class="p-3 text-right font-black text-slate-800">${APP.F(r.net)}</td>
            </tr>`;
        });

        APP.draw(data);
    },

    draw: (d) => {
        const labels = d.years.map(y => 'Y'+y);
        
        if(APP.charts.asset) APP.charts.asset.destroy();
        APP.charts.asset = new Chart(document.getElementById('chart-asset'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ 
                    label: '淨資產', data: d.net, 
                    borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', 
                    fill: true, borderWidth: 3 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        if(APP.charts.wealth) APP.charts.wealth.destroy();
        APP.charts.wealth = new Chart(document.getElementById('chart-wealth'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: '房產', data: d.house, backgroundColor: '#fb923c', stack: '1' },
                    { label: '投資', data: d.inv, backgroundColor: '#10b981', stack: '1' },
                    { label: '現金', data: d.cash, backgroundColor: '#3b82f6', stack: '1' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

window.onload = APP.init;
