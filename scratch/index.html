<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>空軍財務決策系統 | v11.0 簡約炫彩版</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Inter"', '"Noto Sans TC"', 'sans-serif'],
                    },
                    colors: {
                        glass: {
                            border: 'rgba(255, 255, 255, 0.5)',
                            surface: 'rgba(255, 255, 255, 0.65)',
                            input: 'rgba(255, 255, 255, 0.8)',
                        },
                        brand: {
                            primary: '#6366f1', // Indigo
                            secondary: '#ec4899', // Pink
                            accent: '#06b6d4', // Cyan
                        }
                    },
                    animation: {
                        'gradient-x': 'gradient-x 15s ease infinite',
                        'float': 'float 6s ease-in-out infinite',
                    },
                    keyframes: {
                        'gradient-x': {
                            '0%, 100%': { 'background-position': '0% 50%' },
                            '50%': { 'background-position': '100% 50%' },
                        },
                        'float': {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-10px)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body { 
            font-family: 'Inter', sans-serif; 
            color: #334155; 
            overflow: hidden;
            /* 炫彩背景 */
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradient-x 15s ease infinite;
        }

        /* 捲軸美化 (淺色系) */
        .scroller { overflow-y: auto; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
        .scroller::-webkit-scrollbar { width: 6px; }
        .scroller::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .scroller::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }

        /* 毛玻璃卡片 */
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
            border-radius: 16px;
        }

        /* 輸入框優化 */
        input, select {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #e2e8f0;
            color: #1e293b;
            border-radius: 8px;
            padding: 8px 12px;
            transition: all 0.2s;
            font-size: 13px;
            font-weight: 500;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            background: #fff;
        }

        /* 按鈕優化 */
        .btn {
            padding: 8px 16px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s;
            display: flex; align-items: center; justify-content: center; gap: 6px;
            cursor: pointer;
        }
        .btn-primary {
            background: #1e293b;
            color: #fff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .btn-primary:hover { background: #334155; transform: translateY(-1px); }
        .btn-secondary {
            background: #fff;
            color: #475569;
            border: 1px solid #e2e8f0;
        }
        .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
        
        /* 滑桿美化 */
        input[type=range] { -webkit-appearance: none; height: 6px; background: #e2e8f0; border-radius: 3px; border: none; padding: 0; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #6366f1; border-radius: 50%; cursor: pointer; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.1s; }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.1); }

        /* 圖表容器強制高度 */
        .chart-wrapper { position: relative; height: 260px; width: 100%; }
        
        /* 表格樣式 */
        .table-row { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
        .table-row:hover { background: rgba(255,255,255,0.5); }
        .table-cell { padding: 10px 16px; font-size: 13px; color: #475569; }
        .table-head { background: rgba(248, 250, 252, 0.8); font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; position: sticky; top: 0; backdrop-filter: blur(4px); }
    </style>
</head>
<body class="flex flex-col h-screen">

    <header class="h-16 flex items-center justify-between px-8 z-50 shrink-0">
        <div class="glass-card px-4 py-2 flex items-center gap-3">
            <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/30">AF</div>
            <div>
                <h1 class="font-bold text-slate-800 text-sm tracking-wide">空軍財務決策系統</h1>
                <p class="text-[10px] text-slate-500 font-medium">v11.0 Aurora Glass</p>
            </div>
        </div>
        
        <div class="glass-card px-2 py-1 flex gap-2">
            <button onclick="app.generateReport()" class="btn btn-primary bg-gradient-to-r from-indigo-500 to-purple-500 border-none">
                <span>✨</span> 生成決策報告
            </button>
            <button onclick="exportCSV()" class="btn btn-secondary">
                <span>📥</span> 匯出 CSV
            </button>
        </div>
    </header>

    <div class="flex flex-1 overflow-hidden p-6 gap-6 z-10">
        
        <aside class="w-[360px] glass-card flex flex-col shrink-0 overflow-hidden shadow-2xl">
            <div class="p-4 border-b border-slate-100 bg-white/30">
                <div class="grid grid-cols-2 gap-2 bg-slate-100/50 p-1 rounded-xl">
                    <button onclick="app.switchScenario('A')" id="btn-A" class="py-2 text-xs font-bold rounded-lg bg-white text-indigo-600 shadow-sm transition-all">方案 A</button>
                    <button onclick="app.switchScenario('B')" id="btn-B" class="py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 transition-all">方案 B</button>
                </div>
            </div>

            <div class="flex-1 scroller p-5 space-y-8">
                <div class="space-y-4">
                    <div class="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                        <span class="w-1 h-4 bg-indigo-500 rounded-full"></span> 階級與基本參數
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[11px] font-semibold text-slate-500 mb-1 block">目標階級</label><select id="targetRank"><option value="S2">少尉 (S2)</option><option value="S3">中尉 (S3)</option><option value="S4">上尉 (S4)</option><option value="M1">少校 (M1)</option><option value="M2">中校 (M2)</option><option value="M3">上校 (M3)</option><option value="G1">少將 (G1)</option></select></div>
                        <div><label class="text-[11px] font-semibold text-slate-500 mb-1 block">服役年數</label><input type="number" id="serviceYears" value="20" class="text-center font-bold text-indigo-600"></div>
                    </div>
                    <button onclick="app.applyAirForcePreset()" class="w-full py-2.5 rounded-lg border border-dashed border-indigo-300 text-indigo-500 text-xs font-bold hover:bg-indigo-50 transition">✈️ 帶入空軍加給預設值</button>
                    <div id="allowance-list" class="space-y-2"></div>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <span class="w-1 h-4 bg-emerald-500 rounded-full"></span> 投資策略
                    </div>
                    
                    <div class="bg-white/50 p-4 rounded-xl border border-white/60 shadow-sm">
                        <div class="flex justify-between items-center mb-3">
                            <label class="text-xs font-bold text-slate-600">每月薪資提撥率</label>
                            <span id="slider-val" class="text-lg font-bold text-emerald-600">30%</span>
                        </div>
                        <input type="range" id="investSlider" min="0" max="90" value="30" class="w-full" oninput="document.getElementById('slider-val').innerText = this.value + '%'; app.calc()">
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[11px] font-semibold text-slate-500 mb-1 block">年化報酬 (%)</label><input type="number" id="returnRate" value="6.0" class="text-center font-bold text-emerald-600"></div>
                        <div><label class="text-[11px] font-semibold text-slate-500 mb-1 block">通膨率 (%)</label><input type="number" id="inflationRate" value="2.0" class="text-center font-bold text-rose-500"></div>
                    </div>
                    
                    <div id="invest-list" class="space-y-2"></div>
                    <button onclick="app.addItem('invest-list')" class="w-full text-xs text-slate-400 hover:text-emerald-500 py-1 transition">+ 新增固定投資項目</button>
                </div>

                <div class="space-y-4 pb-4">
                    <div class="flex items-center gap-2 text-slate-600 font-bold text-sm">
                        <span class="w-1 h-4 bg-slate-400 rounded-full"></span> 支出與房產
                    </div>
                    <div id="expense-list" class="space-y-2"></div>
                    <button onclick="app.addItem('expense-list')" class="w-full text-xs text-slate-400 hover:text-indigo-500 py-1 transition mb-2">+ 新增生活支出</button>
                    
                    <div class="bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                        <label class="flex items-center gap-2 cursor-pointer mb-2">
                            <input type="checkbox" id="buyHouseToggle" class="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" onchange="app.calc()">
                            <span class="text-xs font-bold text-slate-700">啟用購屋模擬</span>
                        </label>
                        <div id="housing-inputs" class="grid grid-cols-2 gap-2 hidden transition-all">
                            <div><label class="text-[9px] text-slate-400">購屋年</label><input type="number" id="buyYear" value="10"></div>
                            <div><label class="text-[9px] text-slate-400">總價(萬)</label><input type="number" id="housePriceWan" value="1500" class="text-orange-500 font-bold"></div>
                            <div><label class="text-[9px] text-slate-400">頭期(%)</label><input type="number" id="downPaymentPct" value="20"></div>
                            <div><label class="text-[9px] text-slate-400">利率(%)</label><input type="number" id="mortgageRate" value="2.2"></div>
                            <div><label class="text-[9px] text-slate-400">年限</label><input type="number" id="loanTerm" value="30"></div>
                            <div><label class="text-[9px] text-slate-400">增值(%)</label><input type="number" id="houseAppreciation" value="1.5"></div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <main class="flex-1 flex flex-col gap-6 overflow-hidden">
            
            <div class="grid grid-cols-3 gap-6 shrink-0">
                <div class="glass-card p-5 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition"></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">預估淨資產 (Net Worth)</p>
                    <p id="kpi-asset" class="text-3xl font-black text-indigo-900 tracking-tight">--</p>
                    <div class="flex items-center gap-2 mt-2">
                        <span id="kpi-diff" class="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">--</span>
                        <span class="text-[10px] text-slate-400">vs 對照組</span>
                    </div>
                </div>
                
                <div class="glass-card p-5 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition"></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">投資 vs 現金比例</p>
                    <div class="flex items-baseline gap-2">
                        <p id="kpi-invest-ratio" class="text-3xl font-black text-emerald-600 tracking-tight">--</p>
                        <span class="text-xs text-slate-500 font-bold">投資部位</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                        <div id="bar-invest" class="h-full bg-emerald-500 rounded-full" style="width: 0%"></div>
                    </div>
                </div>

                <div class="glass-card p-5 relative overflow-hidden group">
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition"></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">終身俸預估 (月退)</p>
                    <p id="kpi-pension" class="text-3xl font-black text-sky-700 tracking-tight">--</p>
                    <div class="mt-2 text-xs text-slate-400" id="kpi-house">房產模組未啟用</div>
                </div>
            </div>

            <div class="flex-1 scroller space-y-6 pr-2 pb-6">
                
                <div class="grid grid-cols-2 gap-6">
                    <div class="glass-card p-5">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-sm font-bold text-slate-700 flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-indigo-500"></div> 資產累積對照</h3>
                        </div>
                        <div class="chart-wrapper"><canvas id="chart-asset"></canvas></div>
                    </div>
                    <div class="glass-card p-5">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-sm font-bold text-slate-700 flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-emerald-500"></div> 資產結構 (投資/現金/房產)</h3>
                        </div>
                        <div class="chart-wrapper"><canvas id="chart-wealth"></canvas></div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div class="glass-card p-5">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-sm font-bold text-slate-700 flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-orange-400"></div> 年度現金流分配</h3>
                        </div>
                        <div class="chart-wrapper"><canvas id="chart-flow"></canvas></div>
                    </div>
                    <div class="glass-card p-5">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-sm font-bold text-slate-700 flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-rose-400"></div> 通膨實質購買力</h3>
                        </div>
                        <div class="chart-wrapper"><canvas id="chart-inflation"></canvas></div>
                    </div>
                </div>

                <div class="glass-card overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/40">
                        <h3 class="font-bold text-slate-700 text-sm">詳細財務數據 (Financial Log)</h3>
                    </div>
                    <div class="overflow-x-auto max-h-80">
                        <table class="w-full text-left">
                            <thead class="table-head">
                                <tr>
                                    <th class="px-6 py-3">年度</th>
                                    <th class="px-6 py-3">階級</th>
                                    <th class="px-6 py-3 text-right">年收入</th>
                                    <th class="px-6 py-3 text-right text-rose-500">總支出</th>
                                    <th class="px-6 py-3 text-right text-emerald-600">投入投資</th>
                                    <th class="px-6 py-3 text-right text-indigo-600">投資滾存</th>
                                    <th class="px-6 py-3 text-right text-slate-500">現金結餘</th>
                                    <th class="px-6 py-3 text-right text-slate-900 font-black">總淨資產</th>
                                </tr>
                            </thead>
                            <tbody id="table-body" class="divide-y divide-slate-50"></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="h-10"></div> </div>
        </main>
    </div>

    <div id="reportModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm hidden z-[100] flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
        <div class="glass-card w-full max-w-2xl bg-white shadow-2xl transform scale-95 transition-transform duration-300 overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-slate-50">
                <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span class="text-2xl">📑</span> 戰略決策報告
                </h3>
                <button onclick="app.closeReport()" class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition flex items-center justify-center">✕</button>
            </div>
            <div id="reportContent" class="p-8 space-y-6 text-sm text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto"></div>
            <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onclick="app.closeReport()" class="btn btn-primary px-6">我了解了</button>
            </div>
        </div>
    </div>

<script>
/**
 * CORE LOGIC - V11.0
 * Fixed: Investment Compounding separation logic
 * Style: Clean, Colorful, Glassmorphism
 */
const APP = {
    data: { A: {}, B: {} },
    current: 'A',
    charts: {},
    ranks: ['S2','S3','S4','M1','M2','M3','G1'],
    salary: {
        'S2': {base:22750, add:28000, max:12}, 'S3': {base:25050, add:30000, max:12},
        'S4': {base:28880, add:35000, max:17}, 'M1': {base:32710, add:45000, max:22},
        'M2': {base:37310, add:55000, max:26}, 'M3': {base:41900, add:65000, max:30},
        'G1': {base:48030, add:70000, max:35}
    },

    N: (v) => { if(!v) return 0; const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? 0 : n; },
    F: (n) => Math.round(n).toLocaleString(),

    init: () => {
        // Chart.js 簡約風格設定
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#64748b';
        Chart.defaults.borderColor = 'rgba(203, 213, 225, 0.5)';

        const def = {
            targetRank: 'M2', serviceYears: 20, inflationRate: 2, salaryRaiseRate: 1, returnRate: 6,
            buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
            investSliderPct: 30,
            allowances: [], expenses: [{name:'基本開銷', val:12000}], investments: [{name:'儲蓄險', val:3000}]
        };
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        APP.data.B.returnRate = 4; APP.data.B.investSliderPct = 50; 
        
        document.body.addEventListener('input', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') APP.calc();
        });
        APP.renderInputs('A');
        setTimeout(APP.calc, 300); // 確保 Canvas 準備好
    },

    switchScenario: (s) => {
        APP.saveInputs(); APP.current = s;
        const btnA = document.getElementById('btn-A');
        const btnB = document.getElementById('btn-B');
        
        // 切換按鈕樣式 (白底 vs 灰底)
        if(s==='A') {
            btnA.className = "py-2 text-xs font-bold rounded-lg bg-white text-indigo-600 shadow-sm transition-all";
            btnB.className = "py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 transition-all";
        } else {
            btnB.className = "py-2 text-xs font-bold rounded-lg bg-white text-indigo-600 shadow-sm transition-all";
            btnA.className = "py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-700 transition-all";
        }
        
        APP.renderInputs(s);
        APP.calc();
    },

    saveInputs: () => {
        const d = APP.data[APP.current];
        const ids = ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation','investSlider'];
        ids.forEach(id => { const el = document.getElementById(id); if(el) d[id==='investSlider'?'investSliderPct':id] = id==='targetRank'?el.value:APP.N(el.value); });
        d.buyHouseToggle = document.getElementById('buyHouseToggle').checked;
        d.allowances = APP.readList('allowance-list');
        d.expenses = APP.readList('expense-list');
        d.investments = APP.readList('invest-list');
    },

    renderInputs: (s) => {
        const d = APP.data[s];
        ['targetRank','serviceYears','inflationRate','salaryRaiseRate','returnRate','buyYear','housePriceWan','downPaymentPct','mortgageRate','loanTerm','houseAppreciation'].forEach(k => document.getElementById(k).value = d[k]);
        document.getElementById('investSlider').value = d.investSliderPct;
        document.getElementById('slider-val').innerText = d.investSliderPct + '%';
        document.getElementById('buyHouseToggle').checked = d.buyHouseToggle;
        APP.renderList('allowance-list', d.allowances);
        APP.renderList('expense-list', d.expenses);
        APP.renderList('invest-list', d.investments);
        
        const hInputs = document.getElementById('housing-inputs');
        if(d.buyHouseToggle) { hInputs.classList.remove('hidden'); hInputs.classList.add('grid'); }
        else { hInputs.classList.add('hidden'); hInputs.classList.remove('grid'); }
    },

    renderList: (id, list) => {
        const c = document.getElementById(id); c.innerHTML = '';
        list.forEach(item => {
            let extra = id==='allowance-list' ? `<input type="number" class="w-10 text-center" value="${item.start||1}">-<input type="number" class="w-10 text-center" value="${item.end||20}">` : '';
            c.innerHTML += `<div class="flex gap-2 items-center mb-2"><input type="text" value="${item.name}" class="flex-1 min-w-0"><input type="number" value="${item.val}" class="w-20 text-right text-indigo-600 font-bold">${extra}<button onclick="this.parentElement.remove(); app.calc()" class="w-6 h-6 rounded-full bg-rose-100 text-rose-500 hover:bg-rose-200 flex items-center justify-center text-xs">✕</button></div>`;
        });
    },
    readList: (id) => {
        const arr = [];
        document.getElementById(id).querySelectorAll('div.flex').forEach(row => {
            const i = row.querySelectorAll('input');
            if(id==='allowance-list') arr.push({name:i[0].value, val:APP.N(i[1].value), start:APP.N(i[2].value), end:APP.N(i[3].value)});
            else arr.push({name:i[0].value, val:APP.N(i[1].value)});
        });
        return arr;
    },
    addItem: (id) => {
        const l = id==='allowance-list' ? APP.data[APP.current].allowances : (id==='expense-list'?APP.data[APP.current].expenses:APP.data[APP.current].investments);
        l.push({name:'項目', val:0, start:1, end:20}); APP.renderList(id, l); APP.calc();
    },
    applyAirForcePreset: () => {
        const d = APP.data[APP.current];
        d.allowances = [{name: '空勤(初)', val: 22000, start: 1, end: 5}, {name: '空勤(中)', val: 45000, start: 6, end: 15}, {name: '空勤(高)', val: 68000, start: 16, end: 25}];
        APP.renderList('allowance-list', d.allowances); APP.calc();
    },

    // --- CORE LOGIC ---
    runSim: (d) => {
        const N = APP.N;
        const years = N(d.serviceYears)||20;
        const inflation = N(d.inflationRate)/100;
        const raise = N(d.salaryRaiseRate)/100;
        const roi = N(d.returnRate)/100;
        const sliderPct = N(d.investSliderPct)/100;
        
        let rank = 'S2', rankY = 0, investPool = 0, cashPool = 0, house = 0, loan = 0, mPay = 0, hasHouse = false;
        const targetIdx = APP.ranks.indexOf(d.targetRank);
        const res = { years:[], netAsset:[], realAsset:[], house:[], loan:[], investPool:[], cashPool:[], mortgage:[], exp:[], inv:[], flow:[], logs:[] };
        const baseExp = d.expenses.reduce((s,x)=>s+N(x.val),0);
        const baseFixedInv = d.investments.reduce((s,x)=>s+N(x.val),0);

        for(let y=1; y<=years; y++) {
            const rInfo = APP.salary[rank]; const rIdx = APP.ranks.indexOf(rank);
            if(y>1 && y%4===0 && rIdx<targetIdx && rankY<rInfo.max) { rank = APP.ranks[rIdx+1]; rankY=0; } else rankY++;

            const payBase = (APP.salary[rank].base + APP.salary[rank].add) * Math.pow(1.015, rankY) * Math.pow(1+raise, y-1);
            let allow = 0; d.allowances.forEach(a => { if(y>=N(a.start) && y<=N(a.end)) allow+=N(a.val); });
            const netMonthly = Math.round((payBase + 15000 + allow)*0.95);

            let yMortgage = 0;
            if(d.buyHouseToggle && y===N(d.buyYear) && !hasHouse) {
                hasHouse = true; house = N(d.housePriceWan)*10000;
                const down = house*(N(d.downPaymentPct)/100);
                loan = house-down;
                if(cashPool>=down) cashPool-=down; else { const rem=down-cashPool; cashPool=0; investPool-=rem; }
                const r=N(d.mortgageRate)/100/12, n=N(d.loanTerm)*12;
                mPay = loan*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
            }
            if(hasHouse) {
                house *= (1+N(d.houseAppreciation)/100);
                if(loan>0) { yMortgage=mPay*12; loan-=(yMortgage-loan*(N(d.mortgageRate)/100)); if(loan<0)loan=0; }
            }

            const yIncome = netMonthly * 13.5;
            const yExp = baseExp * Math.pow(1+inflation, y-1) * 12;
            const yInvestInput = (netMonthly * sliderPct + baseFixedInv) * 12;
            const cashSurplus = yIncome - yExp - yInvestInput - yMortgage;

            investPool = investPool * (1+roi) + yInvestInput;
            cashPool = cashPool + cashSurplus;
            const netAsset = investPool + cashPool + house - loan;

            res.years.push('Y'+y);
            res.netAsset.push(netAsset); res.realAsset.push(netAsset/Math.pow(1+inflation, y));
            res.investPool.push(investPool); res.cashPool.push(cashPool);
            res.house.push(house); res.loan.push(loan);
            res.exp.push(yExp); res.inv.push(yInvestInput); res.mortgage.push(yMortgage); res.flow.push(cashSurplus);
            res.logs.push({y, rank, income:yIncome, exp:yExp, inv:yInvestInput, invPool:investPool, cashPool:cashPool, mortgage:yMortgage, flow:cashSurplus, net:netAsset});
        }
        res.pension = Math.round(APP.salary[rank].base * 2 * (0.55 + Math.max(0, years-20)*0.02));
        return res;
    },

    // --- VISUALIZATION ---
    calc: () => {
        APP.saveInputs();
        const resA = APP.runSim(APP.data.A);
        const resB = APP.runSim(APP.data.B);
        if(!resA || !resB) return;
        APP.currentResult = (APP.current === 'A') ? resA : resB;
        APP.updateUI(APP.currentResult, (APP.current === 'A') ? resB : resA);
    },

    updateUI: (res, comp) => {
        const last = res.netAsset.length-1;
        document.getElementById('kpi-asset').innerText = APP.F(res.netAsset[last]);
        document.getElementById('kpi-pension').innerText = APP.F(res.pension);
        
        const diff = res.netAsset[last] - comp.netAsset[last];
        const diffEl = document.getElementById('kpi-diff');
        diffEl.innerHTML = `${diff>=0?'+':''}${APP.F(diff)}`;
        diffEl.className = `text-xs font-bold px-2 py-0.5 rounded-full ${diff>=0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`;
        
        const totalL = res.investPool[last] + res.cashPool[last];
        if(totalL>0) {
            const ratio = Math.round((res.investPool[last]/totalL*100));
            document.getElementById('kpi-invest-ratio').innerText = ratio + '%';
            document.getElementById('bar-invest').style.width = ratio + '%';
        }

        const hDiv = document.getElementById('kpi-house');
        hDiv.innerHTML = APP.data[APP.current].buyHouseToggle ? `市值: ${APP.F(res.house[last])}` : "房產模組未啟用";

        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        res.logs.forEach(l => {
            tb.innerHTML += `<tr class="table-row"><td class="table-cell font-bold text-slate-400">Y${l.y}</td><td class="table-cell font-bold text-slate-800">${l.rank}</td><td class="table-cell text-right text-slate-600">${APP.F(l.income)}</td><td class="table-cell text-right text-rose-500">${APP.F(l.exp)}</td><td class="table-cell text-right text-emerald-600">${APP.F(l.inv)}</td><td class="table-cell text-right text-indigo-500 font-medium">${APP.F(l.invPool)}</td><td class="table-cell text-right text-slate-400">${APP.F(l.flow)}</td><td class="table-cell text-right font-black text-slate-800">${APP.F(l.net)}</td></tr>`;
        });

        APP.drawCharts(res, comp);
    },

    drawCharts: (res, comp) => {
        const commonOpt = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8, font: {family: "'Inter', sans-serif"} } } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { borderDash: [2, 4], color: '#f1f5f9' } }
            }
        };

        const ctxs = ['chart-asset', 'chart-flow', 'chart-wealth', 'chart-inflation'];
        ctxs.forEach(id => {
            if(APP.charts[id]) APP.charts[id].destroy();
            const cvs = document.getElementById(id);
            if(!cvs) return;

            let cfg;
            // 1. Asset Compare (Line) - 明亮對比色
            if(id === 'chart-asset') {
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '本方案', data: res.netAsset, borderColor: '#6366f1', borderWidth: 3, tension: 0.4, pointRadius: 0, fill: {target:'origin', above:'rgba(99, 102, 241, 0.1)'} },
                            { label: '對照組', data: comp.netAsset, borderColor: '#94a3b8', borderWidth: 2, borderDash: [5,5], pointRadius: 0 }
                        ]
                    }
                };
            } 
            // 2. Cashflow (Bar Stack) - 溫暖活力色
            else if(id === 'chart-flow') {
                cfg = {
                    type: 'bar',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '房貸', data: res.mortgage, backgroundColor: '#fbbf24' },
                            { label: '支出', data: res.exp, backgroundColor: '#f43f5e' },
                            { label: '投資', data: res.inv, backgroundColor: '#10b981' },
                            { label: '結餘', data: res.flow, backgroundColor: '#3b82f6' }
                        ]
                    },
                    options: { ...commonOpt, scales: { ...commonOpt.scales, x: { stacked: true }, y: { stacked: true } } }
                };
            } 
            // 3. Wealth Structure (Area) - 冷靜專業色
            else if(id === 'chart-wealth') {
                const liquid = res.netAsset.map((n, i) => n - res.house[i] + res.loan[i]);
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '房產市值', data: res.house, backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: '#f97316', fill: true, pointRadius: 0, borderWidth: 1, order: 3 },
                            { label: '投資池', data: res.investPool, backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', fill: true, pointRadius: 0, borderWidth: 2, order: 2 },
                            { label: '現金池', data: res.cashPool, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6', fill: true, pointRadius: 0, borderWidth: 1, order: 1 },
                            { label: '房貸', data: res.loan, borderColor: '#f43f5e', borderDash:[3,3], fill: false, pointRadius: 0, borderWidth: 2, order: 0 }
                        ]
                    },
                    options: { ...commonOpt, scales: { ...commonOpt.scales, y: { stacked: false } } }
                };
            } 
            // 4. Inflation (Line) - 警告與對比
            else {
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '名目資產', data: res.netAsset, borderColor: '#cbd5e1', borderWidth: 2, pointRadius: 0 },
                            { label: '實質購買力', data: res.realAsset, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true, borderWidth: 2, pointRadius: 0 }
                        ]
                    }
                };
            }
            // Merge Options
            if(!cfg.options) cfg.options = commonOpt;
            else if(!cfg.options.plugins) cfg.options = { ...commonOpt, ...cfg.options };

            APP.charts[id] = new Chart(cvs, cfg);
        });
    },

    generateReport: () => {
        if(!APP.currentResult) return;
        const r = APP.currentResult;
        const last = r.netAsset.length - 1;
        const modal = document.getElementById('reportModal');
        const content = document.getElementById('reportContent');
        
        modal.classList.remove('hidden');
        // Simple fade in effect
        setTimeout(() => { modal.classList.remove('opacity-0'); modal.children[0].classList.remove('scale-95'); }, 10);

        content.innerHTML = `
            <h4 class="text-indigo-600 font-bold border-b pb-2 mb-4 text-lg">財務戰略分析報告</h4>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <span class="text-xs text-indigo-400 font-bold block mb-1">預估最終淨資產</span>
                    <span class="text-2xl text-indigo-700 font-black">${APP.F(r.netAsset[last])}</span>
                </div>
                <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <span class="text-xs text-emerald-500 font-bold block mb-1">投資獲利貢獻</span>
                    <span class="text-2xl text-emerald-600 font-black">${APP.F(r.investPool[last])}</span>
                </div>
            </div>
            <div class="space-y-3 text-slate-600">
                <p>📊 <strong>資產結構分析：</strong><br>
                在 ${r.years.length} 年的職涯中，您的資產成長動力主要來自 <span class="font-bold text-emerald-600">投資複利</span>。
                目前的薪資提撥率為 <span class="font-bold text-slate-900">${APP.data[APP.current].investSliderPct}%</span>，
                年化報酬率設定為 <span class="font-bold text-slate-900">${APP.data[APP.current].returnRate}%</span>。</p>
                
                <p>📉 <strong>通膨影響評估：</strong><br>
                雖然名目資產達到了 ${APP.F(r.netAsset[last])}，但考慮 ${APP.data[APP.current].inflationRate}% 的通膨後，
                其實質購買力約為 <span class="font-bold text-orange-500">${APP.F(r.realAsset[last])}</span>。</p>
                
                <p>👴 <strong>退休保障：</strong><br>
                預估您的終身俸（月退）約為 <span class="font-bold text-sky-600">${APP.F(r.pension)}</span> 元。</p>
            </div>
        `;
    },
    
    closeReport: () => {
        const modal = document.getElementById('reportModal');
        modal.classList.add('opacity-0');
        modal.children[0].classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};

window.onload = APP.init;
window.app = APP;
