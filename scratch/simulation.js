/**
 * 軍官職涯財務戰情室 (Strategic Financial Command Center)
 * 核心邏輯腳本 v2026.1
 */

// =========================================================
// 1. 全域資料庫與參數 (Global Data & Config)
// =========================================================

// 薪資結構：依據 2025 年生效俸額表 (含預估)
const REAL_SALARY_STRUCTURE = {
    'S2': { rank: '少尉', base: 22750, pro_add: 28000, food_add: 2840, promotion_years: 1, annual_growth: 0.015, max_years: 12 }, 
    'S3': { rank: '中尉', base: 25050, pro_add: 30000, food_add: 2840, promotion_years: 3, annual_growth: 0.015, max_years: 12 },
    'S4': { rank: '上尉', base: 28880, pro_add: 35000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 17 }, 
    'M1': { rank: '少校', base: 32710, pro_add: 45000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 22 }, 
    'M2': { rank: '中校', base: 37310, pro_add: 55000, food_add: 2840, promotion_years: 4, annual_growth: 0.015, max_years: 26 }, 
    'M3': { rank: '上校', base: 41900, pro_add: 65000, food_add: 2840, promotion_years: 6, annual_growth: 0.015, max_years: 30 }, 
    'G1': { rank: '少將', base: 48030, pro_add: 70000, food_add: 2840, promotion_years: 4, annual_growth: 0.01, max_years: 35 }, 
    'G2': { rank: '中將', base: 53390, pro_add: 80000, food_add: 2840, promotion_years: 3, annual_growth: 0.01, max_years: 38 }
};

const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1', 'G2'];
const VOLUNTEER_ADDITION = 15000; // 志願役加給
const PENSION_RATE = 0.14;        // 退撫基金提撥率
const INDIVIDUAL_PENSION_RATIO = 0.35; // 個人負擔比例

let assetChart, inflationChart;
let allowanceCounter = 0;

// =========================================================
// 2. 輔助功能函數 (Utility Functions)
// =========================================================

// 金額格式化 (e.g., $1,234,567)
function formatMoney(num) {
    if (isNaN(num)) return '--';
    const absNum = Math.abs(Math.round(num));
    return (num < 0 ? '-' : '') + '$' + absNum.toLocaleString('zh-TW');
}

// 切換購屋模組輸入框的啟用狀態
function toggleHousingModule() {
    const isChecked = document.getElementById('buyHouseToggle').checked;
    const inputs = document.getElementById('housing-inputs');
    if (isChecked) {
        inputs.classList.remove('opacity-50', 'pointer-events-none');
    } else {
        inputs.classList.add('opacity-50', 'pointer-events-none');
    }
    runSimulation();
}

// 動態新增「加給」欄位
function addCustomAllowance() {
    allowanceCounter++;
    const container = document.getElementById('custom-allowances-container');
    const id = `allow-${allowanceCounter}`;
    let defName = "職務加給", defVal = 5000, defStart = 5, defEnd = 10;
    
    const html = `
        <div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-[10px] bg-slate-50 p-1 rounded allowance-row">
            <div class="col-span-4"><input type="text" value="${defName}" class="w-full border-b border-slate-300 bg-transparent px-1 allow-name"></div>
            <div class="col-span-3"><input type="number" value="${defVal}" class="w-full border-b border-slate-300 bg-transparent px-1 text-right allow-val"></div>
            <div class="col-span-2"><input type="number" value="${defStart}" class="w-full border-b border-slate-300 bg-transparent px-1 text-center allow-start"></div>
            <div class="col-span-2"><input type="number" value="${defEnd}" class="w-full border-b border-slate-300 bg-transparent px-1 text-center allow-end"></div>
            <div class="col-span-1 text-center"><button onclick="document.getElementById('${id}').remove(); runSimulation()" class="text-red-400 hover:text-red-600 font-bold">×</button></div>
        </div>`;
    container.insertAdjacentHTML('beforeend', html);
}

// 讀取所有動態加給設定
function getAllowances() {
    const arr = [];
    document.querySelectorAll('.allowance-row').forEach(row => {
        arr.push({
            val: parseInt(row.querySelector('.allow-val').value) || 0,
            start: parseInt(row.querySelector('.allow-start').value) || 0,
            end: parseInt(row.querySelector('.allow-end').value) || 99
        });
    });
    return arr;
}

// =========================================================
// 3. 核心運算邏輯 (Core Simulation Engine)
// =========================================================

function runSimulation() {
    // A. 讀取使用者參數 (Inputs)
    const params = {
        targetRank: document.getElementById('targetRank').value,
        years: parseInt(document.getElementById('serviceYears').value) || 20,
        inflation: (parseFloat(document.getElementById('inflationRate').value) || 0) / 100,
        raise: (parseFloat(document.getElementById('salaryRaiseRate').value) || 0) / 100,
        livingPct: (parseFloat(document.getElementById('livingCostPercent').value) || 0) / 100,
        investPct: (parseFloat(document.getElementById('monthlySavingsPercent').value) || 0) / 100,
        returnRate: (parseFloat(document.getElementById('returnRate').value) || 0) / 100,
        
        // 購屋相關參數
        buyHouse: document.getElementById('buyHouseToggle').checked,
        buyYear: parseInt(document.getElementById('buyYear').value) || 99,
        housePrice: (parseInt(document.getElementById('housePriceWan').value) || 0) * 10000,
        downPct: (parseFloat(document.getElementById('downPaymentPct').value) || 0) / 100,
        mortgageRate: (parseFloat(document.getElementById('mortgageRate').value) || 0) / 100,
        loanTerm: parseInt(document.getElementById('loanTerm').value) || 30,
        houseGrowth: (parseFloat(document.getElementById('houseAppreciation').value) || 0) / 100,
    };

    // 更新 UI 上的「剩餘百分比」
    document.getElementById('remain-percent').innerText = (100 - (params.livingPct*100) - (params.investPct*100)).toFixed(0);

    // B. 初始化變數
    let currentRank = 'S2'; // 起始階級：少尉
    let yearOfRank = 0;
    let forceRetired = false;
    
    // 資產與負債狀態
    let liquidAsset = 0; // 流動資產 (現金+股票)
    let houseValue = 0;  // 房產市值
    let loanBalance = 0; // 剩餘房貸本金
    let monthlyMortgagePayment = 0; // 月還款額 (本息均攤)
    let hasBoughtHouse = false;

    const targetIdx = RANK_ORDER.indexOf(params.targetRank);
    
    // 歷史數據紀錄 (for Charts & Table)
    const history = { labels: [], netAsset: [], realAsset: [], liquid: [], house: [], loan: [], logs: [] };

    // C. 年度模擬迴圈
    for (let y = 1; y <= params.years; y++) {
        // 1. 強制退伍檢查
        if (y > REAL_SALARY_STRUCTURE[currentRank].max_years) { forceRetired = true; break; }
        
        // 2. 晉升邏輯
        const rankIdx = RANK_ORDER.indexOf(currentRank);
        if (yearOfRank >= REAL_SALARY_STRUCTURE[currentRank].promotion_years && rankIdx < targetIdx) {
            currentRank = RANK_ORDER[rankIdx + 1];
            yearOfRank = 0;
        }

        // 3. 薪資計算 (含政策調薪 + 年資成長)
        const rankData = REAL_SALARY_STRUCTURE[currentRank];
        const policyFactor = Math.pow(1 + params.raise, y - 1); // 政策調薪複利
        const seniorityFactor = Math.pow(1 + rankData.annual_growth, y - 1); // 年資俸級成長
        
        // 計算本俸與加給
        const base = (rankData.base + rankData.pro_add) * seniorityFactor * policyFactor;
        let allowance = 0;
        getAllowances().forEach(a => { if(y >= a.start && y <= a.end) allowance += a.val; });
        
        const gross = base + rankData.food_add + VOLUNTEER_ADDITION + allowance;
        const netMonthly = Math.round(gross * (1 - PENSION_RATE * INDIVIDUAL_PENSION_RATIO));
        
        // 4. 購屋模組邏輯
        let yearMortgageCost = 0;
        
        // 觸發購屋事件 (Buy Trigger)
        if (params.buyHouse && y === params.buyYear && !hasBoughtHouse) {
            hasBoughtHouse = true;
            houseValue = params.housePrice; // 買入時的市值
            const downPay = Math.round(params.housePrice * params.downPct);
            loanBalance = params.housePrice - downPay;
            liquidAsset -= downPay; // 頭期款從流動資產扣除
            
            // 計算房貸月還款 (PMT公式)
            const r = params.mortgageRate / 12;
            const n = params.loanTerm * 12;
            if (r > 0) {
                monthlyMortgagePayment = Math.round(loanBalance * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1));
            } else {
                monthlyMortgagePayment = Math.round(loanBalance / n);
            }
        }

        // 持有期間計算
        if (hasBoughtHouse) {
            // 房產增值
            houseValue = Math.round(houseValue * (1 + params.houseGrowth));
            
            // 房貸償還 (年結)
            if (loanBalance > 0) {
                yearMortgageCost = monthlyMortgagePayment * 12;
                
                // 簡單利息計算
                const yearlyInterest = loanBalance * params.mortgageRate;
                const principalRepaid = yearMortgageCost - yearlyInterest;
                
                loanBalance -= principalRepaid;
                if(loanBalance < 0) loanBalance = 0;
            }
        }

        // 5. 現金流計算 (Cash Flow)
        const annualIncome = (netMonthly * 13.5); // 估算含年終約 13.5 個月
        const annualExpense = annualIncome * params.livingPct; // 生活支出 (隨薪資成長)
        const annualInvest = annualIncome * params.investPct; // 投資本金
        
        // 淨現金流 = 收入 - 支出 - 投資 - 房貸
        const netCashFlow = annualIncome - annualExpense - annualInvest - yearMortgageCost;

        // 6. 資產複利運算 (Asset Compound)
        // 流動資產滾存 + 新增投資 + 剩餘結餘
        liquidAsset = liquidAsset * (1 + params.returnRate) + annualInvest + netCashFlow;

        // 7. 數據紀錄
        const netAsset = liquidAsset + houseValue - loanBalance; // 淨資產 = 流動 + 房產 - 負債
        
        // 計算實質購買力 (折現至第1年)
        const inflationFactor = Math.pow(1 + params.inflation, y);
        const realAsset = Math.round(netAsset / inflationFactor);

        history.labels.push(`Y${y}`);
        history.netAsset.push(Math.round(netAsset));
        history.realAsset.push(realAsset);
        history.liquid.push(Math.round(liquidAsset));
        history.house.push(Math.round(houseValue));
        history.loan.push(Math.round(loanBalance)); 
        
        history.logs.push({
            y, rank: REAL_SALARY_STRUCTURE[currentRank].rank,
            income: annualIncome,
            mortgage: yearMortgageCost,
            cashflow: netCashFlow,
            netAsset: netAsset
        });

        yearOfRank++;
    }

    // D. 終身俸試算 (Pension)
    let pension = 0;
    const actualYears = history.labels.length;
    if (actualYears >= 20) {
        // 簡化版概算
        const finalBase = REAL_SALARY_STRUCTURE[currentRank].base * Math.pow(1.015, actualYears-1);
        const ratio = 0.55 + (actualYears - 20) * 0.02;
        pension = Math.round(finalBase * 2 * ratio);
    }

    updateUI(history, pension, forceRetired, currentRank, actualYears, params);
}

// =========================================================
// 4. UI 更新與圖表繪製 (UI Updates & Charts)
// =========================================================

function updateUI(history, pension, forceRetired, rank, years, params) {
    const last = history.netAsset.length - 1;
    const finalAsset = history.netAsset[last];
    const finalReal = history.realAsset[last];

    // 1. KPI 顯示
    document.getElementById('total-asset').innerText = formatMoney(finalAsset);
    document.getElementById('real-asset-val').innerText = `≒ 實質購買力：${formatMoney(finalReal)} (已扣除 ${params.years} 年通膨)`;
    
    // 終身俸
    const pEl = document.getElementById('pension-monthly');
    if (pension > 0) {
        pEl.innerText = formatMoney(pension);
        pEl.className = "text-3xl font-serif font-black text-green-700";
        document.getElementById('pension-sub').innerText = "符合終身俸資格";
    } else {
        pEl.innerText = "未達門檻";
        pEl.className = "text-xl font-bold text-slate-400";
        document.getElementById('pension-sub').innerText = `年資 ${years} 年 (需 20 年)`;
    }

    // 購屋狀態卡片
    const hDiv = document.getElementById('housing-status-display');
    if (params.buyHouse) {
        const finalHouse = history.house[last];
        const finalLoan = history.loan[last];
        const equity = finalHouse - finalLoan;
        hDiv.innerHTML = `
            <div class="mt-2 text-xs text-slate-500 space-y-1">
                <div class="flex justify-between"><span>房產市值:</span> <span class="font-bold text-orange-700">${formatMoney(finalHouse)}</span></div>
                <div class="flex justify-between"><span>剩餘房貸:</span> <span class="font-bold text-red-600">-${formatMoney(finalLoan)}</span></div>
                <div class="border-t pt-1 flex justify-between"><span>淨權益:</span> <span class="font-bold text-green-600">${formatMoney(equity)}</span></div>
            </div>
        `;
    } else {
        hDiv.innerHTML = `<p class="text-xl font-bold text-slate-300 mt-2">未啟用購屋模組</p>`;
    }

    // 破產風險警示
    const negYears = history.logs.filter(l => l.netAsset < 0).length;
    const statusBar = document.getElementById('status-bar');
    if (negYears > 0) {
        statusBar.classList.remove('hidden');
        document.getElementById('status-text').innerText = `警告：在模擬過程中有 ${negYears} 個年度出現淨資產為負（破產風險），建議調整購屋預算或支出比例。`;
    } else {
        statusBar.classList.add('hidden');
    }

    // 更新紀錄表格
    const tbody = document.getElementById('event-log-body');
    tbody.innerHTML = '';
    history.logs.forEach(l => {
        const row = `<tr>
            <td class="px-4 py-3 font-mono text-slate-500">Y${l.y}</td>
            <td class="px-4 py-3 font-bold text-military-900">${l.rank}</td>
            <td class="px-4 py-3 text-right text-slate-700">${formatMoney(l.income)}</td>
            <td class="px-4 py-3 text-right text-red-500">${l.mortgage > 0 ? formatMoney(l.mortgage) : '-'}</td>
            <td class="px-4 py-3 text-right ${l.cashflow < 0 ? 'text-red-600 font-bold' : 'text-green-600'}">${formatMoney(l.cashflow)}</td>
            <td class="px-4 py-3 text-right font-bold ${l.netAsset < 0 ? 'text-red-600' : 'text-military-900'}">${formatMoney(l.netAsset)}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    renderCharts(history);
}

function renderCharts(h) {
    Chart.defaults.font.family = '"Noto Sans TC", sans-serif';

    // Chart 1: 資產結構堆疊圖 (Asset Structure)
    if (assetChart) assetChart.destroy();
    const ctx1 = document.getElementById('assetStructureChart').getContext('2d');
    assetChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: h.labels,
            datasets: [
                { label: '房貸負債', data: h.loan.map(v => -v), borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.2)', fill: true, order: 1 },
                { label: '房產市值', data: h.house, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.2)', fill: true, order: 2 },
                { label: '流動資產', data: h.liquid, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)', fill: true, order: 3 },
                { label: '淨資產總額', data: h.netAsset, type: 'line', borderColor: '#0f172a', borderWidth: 2, borderDash: [5,5], fill: false, order: 0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: { y: { stacked: true } }
        }
    });

    // Chart 2: 通膨侵蝕分析 (Inflation Analysis)
    if (inflationChart) inflationChart.destroy();
    const ctx2 = document.getElementById('inflationChart').getContext('2d');
    inflationChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: h.labels,
            datasets: [
                { label: '名目淨資產 (帳面數字)', data: h.netAsset, borderColor: '#94a3b8', borderWidth: 2, tension: 0.3 },
                { label: '實質購買力 (扣除通膨)', data: h.realAsset, borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 3, fill: true, tension: 0.3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false }
        }
    });
}

// =========================================================
// 5. 資料存取與匯出 (Data Persistence & Export)
// =========================================================

// 儲存設定至 LocalStorage
function saveData() {
    const inputs = document.querySelectorAll('input, select');
    const data = {};
    inputs.forEach(el => {
        if(el.id) data[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    localStorage.setItem('militaryPlanData', JSON.stringify(data));
    alert('✅ 戰略參數已儲存至瀏覽器！');
}

// 從 LocalStorage 載入設定
function loadData() {
    const saved = localStorage.getItem('militaryPlanData');
    if(saved) {
        const data = JSON.parse(saved);
        for(let key in data) {
            const el = document.getElementById(key);
            if(el) {
                if(el.type === 'checkbox') el.checked = data[key];
                else el.value = data[key];
            }
        }
        toggleHousingModule(); // 確保 UI 狀態正確
    }
}

// 匯出 CSV 報表
function exportCSV() {
    let csv = "\uFEFF年度,階級,稅後年收,房貸支出,現金流結餘,淨資產\n";
    const rows = document.querySelectorAll('#event-log-body tr');
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        const line = Array.from(cols).map(c => c.innerText.replace(/[$,]/g, '')).join(',');
        csv += line + "\n";
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `軍旅財務戰略報表_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

// =========================================================
// 6. 初始化監聽 (Initialization)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    loadData(); // 自動載入上次紀錄
    addCustomAllowance(); // 預設加一筆加給
    
    // 監聽所有輸入變更，實現「即時試算」
    document.body.addEventListener('input', (e) => {
        if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            runSimulation();
        }
    });
    
    // 初次執行
    runSimulation();
});
