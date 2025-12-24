<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>空軍財務決策系統 | v12.0 水彩印象版</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Zen+Maru+Gothic:wght@400;700&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        serif: ['"Playfair Display"', 'serif'], // 標題用優雅襯線體
                        sans: ['"Zen Maru Gothic"', 'sans-serif'], // 內文用圓體
                    },
                    colors: {
                        paint: {
                            blue: '#a8edea',
                            pink: '#fed6e3',
                            purple: '#e2d1c3',
                            dark: '#4a4e69',
                            text: '#22223b',
                        }
                    },
                    animation: {
                        'blob': 'blob 10s infinite',
                    },
                    keyframes: {
                        blob: {
                            '0%': { transform: 'translate(0px, 0px) scale(1)' },
                            '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                            '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                            '100%': { transform: 'translate(0px, 0px) scale(1)' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        /* 水彩流動背景 */
        body {
            background-color: #fdfbf7;
            font-family: "Zen Maru Gothic", sans-serif;
            color: #4a4e69;
            overflow: hidden;
            position: relative;
        }
        
        /* 背景色塊 (模擬水彩暈染) */
        .watercolor-bg {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: -2;
            background-image: 
                radial-gradient(at 0% 0%, hsla(253,16%,7%,0) 0, transparent 50%), 
                radial-gradient(at 50% 0%, hsla(225,39%,30%,0) 0, transparent 50%), 
                radial-gradient(at 100% 0%, hsla(339,49%,30%,0) 0, transparent 50%);
            background: 
                radial-gradient(at 10% 10%, #ff9a9e 0px, transparent 50%),
                radial-gradient(at 90% 0%, #fad0c4 0px, transparent 50%),
                radial-gradient(at 20% 80%, #a18cd1 0px, transparent 50%),
                radial-gradient(at 80% 80%, #fbc2eb 0px, transparent 50%),
                radial-gradient(at 50% 50%, #ffffff 0px, transparent 60%);
            filter: blur(60px);
            opacity: 0.8;
            animation: blob 20s infinite alternate;
        }

        /* 紙張紋理 (Noise) */
        .paper-texture {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: -1;
            opacity: 0.4;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E");
            pointer-events: none;
        }

        /* 卡片樣式：白紙質感 */
        .art-card {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 24px;
            box-shadow: 
                0 4px 6px -1px rgba(0, 0, 0, 0.02),
                0 10px 20px -5px rgba(50, 50, 93, 0.05),
                inset 0 0 20px rgba(255, 255, 255, 0.5);
        }

        /* 捲軸 */
        .scroller { overflow-y: auto; scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
        .scroller::-webkit-scrollbar { width: 5px; }
        .scroller::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 10px; }

        /* 輸入元件 */
        input, select {
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid transparent;
            border-bottom: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 12px;
            font-family: "Zen Maru Gothic", sans-serif;
            color: #4a4e69;
            transition: all 0.3s;
            font-weight: 700;
        }
        input:focus, select:focus {
            outline: none;
            background: #fff;
            border-bottom-color: #845ec2;
            box-shadow: 0 4px 12px rgba(132, 94, 194, 0.1);
        }

        /* 滑桿 */
        input[type=range] { -webkit-appearance: none; height: 8px; background: rgba(255,255,255,0.8); border-radius: 4px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); }
        input[type=range]::-webkit-slider-thumb { 
            -webkit-appearance: none; width: 22px; height: 22px; 
            background: #845ec2; border: 3px solid #fff; 
            border-radius: 50%; cursor: pointer; 
            box-shadow: 0 2px 6px rgba(132, 94, 194, 0.4); 
            transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.1); }

        /* 按鈕 - 水彩暈染感 */
        .btn-art {
            background-image: linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            padding: 8px 16px;
            box-shadow: 0 4px 15px rgba(161, 140, 209, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-art:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(161, 140, 209, 0.6); }
        
        .btn-outline-art {
            background: rgba(255,255,255,0.5);
            border: 2px solid #a18cd1;
            color: #845ec2;
            border-radius: 12px;
            font-weight: 700;
            padding: 6px 14px;
            transition: all 0.2s;
        }
        .btn-outline-art:hover { background: #a18cd1; color: white; }

        /* 表格 */
        .table-row:last-child td { border-bottom: none; }
        .table-row td { padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.03); }
        .chart-wrapper { position: relative; height: 260px; width: 100%; }
    </style>
</head>
<body class="flex flex-col h-screen">
    
    <div class="watercolor-bg"></div>
    <div class="paper-texture"></div>

    <header class="h-20 flex items-center justify-between px-8 z-50 shrink-0">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-white/80 rounded-2xl flex items-center justify-center shadow-sm backdrop-blur-sm border border-white/50">
                <span class="text-2xl">✈️</span>
            </div>
            <div>
                <h1 class="font-serif text-2xl font-bold text-slate-800 tracking-tight">Financial Palette</h1>
                <p class="text-xs text-slate-500 font-bold tracking-widest uppercase">Air Force Academy DSS</p>
            </div>
        </div>
        <div class="flex gap-3">
            <button onclick="app.generateReport()" class="btn-art flex items-center gap-2">
                <span>✦</span> 分析報告
            </button>
            <button onclick="exportCSV()" class="bg-white/60 hover:bg-white text-slate-600 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm border border-white">
                匯出數據
            </button>
        </div>
    </header>

    <div class="flex flex-1 overflow-hidden p-6 gap-8 z-10">
        
        <aside class="w-[380px] art-card flex flex-col shrink-0 overflow-hidden">
            <div class="p-6 pb-2">
                <div class="grid grid-cols-2 gap-3 bg-slate-100/50 p-1.5 rounded-2xl">
                    <button onclick="app.switchScenario('A')" id="btn-A" class="py-2.5 text-sm font-bold rounded-xl bg-white text-indigo-600 shadow-sm transition-all">方案 A</button>
                    <button onclick="app.switchScenario('B')" id="btn-B" class="py-2.5 text-sm font-bold rounded-xl text-slate-400 hover:text-slate-600 transition-all">方案 B</button>
                </div>
            </div>

            <div class="flex-1 scroller px-6 py-4 space-y-8">
                <div class="space-y-4">
                    <h3 class="font-serif text-lg font-bold text-slate-700 border-b-2 border-indigo-100 pb-1 inline-block">基本參數</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="text-xs font-bold text-slate-400 mb-1.5 block">目標階級</label><select id="targetRank"><option value="S2">少尉</option><option value="S3">中尉</option><option value="S4">上尉</option><option value="M1">少校</option><option value="M2">中校</option><option value="M3">上校</option><option value="G1">少將</option></select></div>
                        <div><label class="text-xs font-bold text-slate-400 mb-1.5 block">服役年數</label><input type="number" id="serviceYears" value="20" class="text-center"></div>
                    </div>
                    <button onclick="app.applyAirForcePreset()" class="w-full py-3 rounded-xl bg-indigo-50 border-2 border-indigo-100 text-indigo-400 text-xs font-bold hover:bg-indigo-100 hover:text-indigo-600 transition">✈️ 載入空勤加給</button>
                    <div id="allowance-list" class="space-y-2"></div>
                </div>

                <div class="space-y-4">
                    <h3 class="font-serif text-lg font-bold text-slate-700 border-b-2 border-pink-100 pb-1 inline-block">投資畫布</h3>
                    <div class="bg-gradient-to-br from-white/80 to-white/40 p-5 rounded-2xl border border-white shadow-sm">
                        <div class="flex justify-between items-center mb-3">
                            <label class="text-sm font-bold text-slate-600">薪資提撥率</label>
                            <span id="slider-val" class="text-2xl font-serif font-black text-indigo-400">30%</span>
                        </div>
                        <input type="range" id="investSlider" min="0" max="90" value="30" class="w-full" oninput="document.getElementById('slider-val').innerText = this.value + '%'; app.calc()">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="text-xs font-bold text-slate-400 mb-1.5 block">年化報酬率 (%)</label><input type="number" id="returnRate" value="6.0" class="text-center text-emerald-500"></div>
                        <div><label class="text-xs font-bold text-slate-400 mb-1.5 block">通膨率 (%)</label><input type="number" id="inflationRate" value="2.0" class="text-center text-rose-400"></div>
                    </div>
                    <div id="invest-list" class="space-y-2"></div>
                    <button onclick="app.addItem('invest-list')" class="w-full text-xs text-slate-400 font-bold hover:text-indigo-500 py-1 transition">+ 新增固定投資</button>
                </div>

                <div class="space-y-4 pb-4">
                    <h3 class="font-serif text-lg font-bold text-slate-700 border-b-2 border-orange-100 pb-1 inline-block">房產與支出</h3>
                    <div id="expense-list" class="space-y-2"></div>
                    <button onclick="app.addItem('expense-list')" class="w-full text-xs text-slate-400 font-bold hover:text-indigo-500 py-1 transition mb-2">+ 新增生活支出</button>
                    
                    <div class="bg-white/40 p-4 rounded-2xl border border-white/60">
                        <label class="flex items-center gap-3 cursor-pointer mb-3">
                            <input type="checkbox" id="buyHouseToggle" class="w-5 h-5 accent-indigo-500" onchange="app.calc()">
                            <span class="text-sm font-bold text-slate-600">啟用購屋模擬</span>
                        </label>
                        <div id="housing-inputs" class="grid grid-cols-2 gap-3 hidden transition-all">
                            <div><label class="text-[10px] font-bold text-slate-400">購屋年</label><input type="number" id="buyYear" value="10"></div>
                            <div><label class="text-[10px] font-bold text-slate-400">總價(萬)</label><input type="number" id="housePriceWan" value="1500" class="text-orange-500"></div>
                            <div><label class="text-[10px] font-bold text-slate-400">頭期(%)</label><input type="number" id="downPaymentPct" value="20"></div>
                            <div><label class="text-[10px] font-bold text-slate-400">利率(%)</label><input type="number" id="mortgageRate" value="2.2"></div>
                            <div><label class="text-[10px] font-bold text-slate-400">年限</label><input type="number" id="loanTerm" value="30"></div>
                            <div><label class="text-[10px] font-bold text-slate-400">增值(%)</label><input type="number" id="houseAppreciation" value="1.5"></div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <main class="flex-1 flex flex-col gap-6 overflow-hidden">
            
            <div class="grid grid-cols-3 gap-6 shrink-0">
                <div class="art-card p-6 flex flex-col justify-between relative overflow-hidden">
                    <div class="absolute -right-6 -top-6 w-32 h-32 bg-indigo-200/40 rounded-full blur-3xl"></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">預估淨資產 (Net Worth)</p>
                    <p id="kpi-asset" class="font-serif text-4xl font-bold text-indigo-900 mt-2">--</p>
                    <div class="flex items-center gap-2 mt-2">
                        <span id="kpi-diff" class="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-400">--</span>
                    </div>
                </div>
                
                <div class="art-card p-6 flex flex-col justify-between relative overflow-hidden">
                    <div class="absolute -right-6 -top-6 w-32 h-32 bg-emerald-200/40 rounded-full blur-3xl"></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">終身俸 (月退)</p>
                    <p id="kpi-pension" class="font-serif text-4xl font-bold text-emerald-800 mt-2">--</p>
                    <p class="text-xs text-slate-400 mt-1">退休生活保障</p>
                </div>

                <div class="art-card p-6 flex flex-col justify-between relative overflow-hidden">
                    <div class="absolute -right-6 -top-6 w-32 h-32 bg-orange-200/40 rounded-full blur-3xl"></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">房產狀態</p>
                    <div id="kpi-house" class="mt-2 text-sm font-bold text-slate-500">未啟用</div>
                    <p class="text-xs text-slate-400 mt-auto">市值 vs 剩餘貸款</p>
                </div>
            </div>

            <div class="flex-1 scroller space-y-6 pr-2 pb-6">
                
                <div class="grid grid-cols-2 gap-6">
                    <div class="art-card p-6">
                        <h4 class="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-indigo-400"></span> 資產累積比較
                        </h4>
                        <div class="chart-wrapper"><canvas id="chart-asset"></canvas></div>
                    </div>
                    <div class="art-card p-6">
                        <h4 class="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-400"></span> 資產結構 (水彩堆疊)
                        </h4>
                        <div class="chart-wrapper"><canvas id="chart-wealth"></canvas></div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div class="art-card p-6">
                        <h4 class="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-orange-300"></span> 年度現金流
                        </h4>
                        <div class="chart-wrapper"><canvas id="chart-flow"></canvas></div>
                    </div>
                    <div class="art-card p-6">
                        <h4 class="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-rose-300"></span> 通膨實質價值
                        </h4>
                        <div class="chart-wrapper"><canvas id="chart-inflation"></canvas></div>
                    </div>
                </div>

                <div class="art-card overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 bg-white/40">
                        <h3 class="font-serif font-bold text-slate-700">詳細財務日誌</h3>
                    </div>
                    <div class="overflow-x-auto max-h-80">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-slate-50/80 text-slate-500 font-bold text-xs uppercase tracking-wider sticky top-0 backdrop-blur-sm">
                                <tr>
                                    <th class="px-6 py-3">年度</th>
                                    <th class="px-6 py-3">階級</th>
                                    <th class="px-6 py-3 text-right">年收入</th>
                                    <th class="px-6 py-3 text-right text-rose-400">總支出</th>
                                    <th class="px-6 py-3 text-right text-emerald-500">投入投資</th>
                                    <th class="px-6 py-3 text-right text-indigo-500">投資滾存</th>
                                    <th class="px-6 py-3 text-right text-slate-400">現金結餘</th>
                                    <th class="px-6 py-3 text-right text-slate-800">淨資產</th>
                                </tr>
                            </thead>
                            <tbody id="table-body" class="text-sm text-slate-600"></tbody>
                        </table>
                    </div>
                </div>
                
                <div class="h-10"></div>
            </div>
        </main>
    </div>

    <div id="reportModal" class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm hidden z-[100] flex items-center justify-center p-4 transition-opacity duration-300 opacity-0">
        <div class="art-card w-full max-w-2xl bg-white shadow-2xl transform scale-95 transition-transform duration-300 overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-indigo-50/30">
                <h3 class="font-serif text-2xl font-bold text-indigo-900 flex items-center gap-2">
                    戰略決策報告
                </h3>
                <button onclick="app.closeReport()" class="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition flex items-center justify-center">✕</button>
            </div>
            <div id="reportContent" class="p-8 space-y-6 text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto"></div>
            <div class="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                <button onclick="app.closeReport()" class="btn-art px-8">Close</button>
            </div>
        </div>
    </div>

<script>
/**
 * WATERCOLOR EDITION CORE (v12.0)
 * Logic: Investment/Cash Separation
 * Style: Morandi / Pastel Colors for Charts
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
    F: (n) => Math.round(n).toLocaleString('en-US'),

    init: () => {
        // Chart.js 水彩風格設定 (莫蘭迪色)
        Chart.defaults.font.family = "'Zen Maru Gothic', sans-serif";
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = 'rgba(226, 232, 240, 0.6)';

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
        setTimeout(APP.calc, 300);
    },

    switchScenario: (s) => {
        APP.saveInputs(); APP.current = s;
        const btnA = document.getElementById('btn-A');
        const btnB = document.getElementById('btn-B');
        
        if(s==='A') {
            btnA.className = "py-2.5 text-sm font-bold rounded-xl bg-white text-indigo-600 shadow-sm transition-all";
            btnB.className = "py-2.5 text-sm font-bold rounded-xl text-slate-400 hover:text-slate-600 transition-all";
        } else {
            btnB.className = "py-2.5 text-sm font-bold rounded-xl bg-white text-indigo-600 shadow-sm transition-all";
            btnA.className = "py-2.5 text-sm font-bold rounded-xl text-slate-400 hover:text-slate-600 transition-all";
        }
        APP.renderInputs(s); APP.calc();
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
            let extra = id==='allowance-list' ? `<input type="number" class="w-12 text-center border-slate-200" value="${item.start||1}">-<input type="number" class="w-12 text-center border-slate-200" value="${item.end||20}">` : '';
            c.innerHTML += `<div class="flex gap-2 items-center mb-2"><input type="text" value="${item.name}" class="flex-1 min-w-0 bg-transparent border-b-2 border-slate-100 focus:bg-white text-slate-600"><input type="number" value="${item.val}" class="w-20 text-right font-bold text-slate-700 bg-transparent border-b-2 border-slate-100 focus:bg-white">${extra}<button onclick="this.parentElement.remove(); app.calc()" class="w-7 h-7 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-500 font-bold transition">✕</button></div>`;
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
        l.push({name:'新項目', val:0, start:1, end:20}); APP.renderList(id, l); APP.calc();
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
        diffEl.className = `text-xs font-bold px-3 py-1 rounded-full ${diff>=0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`;

        const hDiv = document.getElementById('kpi-house');
        if(APP.data[APP.current].buyHouseToggle) {
            hDiv.innerHTML = `市值 <span class="font-bold text-orange-400">${APP.F(res.house[last])}</span> / 貸 <span class="font-bold text-rose-400">-${APP.F(res.loan[last])}</span>`;
        } else {
            hDiv.innerText = "房產模組未啟用";
        }

        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        res.logs.forEach(l => {
            tb.innerHTML += `<tr class="table-row"><td class="table-cell font-bold text-slate-400">Y${l.y}</td><td class="table-cell font-bold text-slate-800">${l.rank}</td><td class="table-cell text-right text-slate-600 font-medium">${APP.F(l.income)}</td><td class="table-cell text-right text-rose-400">${APP.F(l.exp)}</td><td class="table-cell text-right text-emerald-500 font-bold">${APP.F(l.inv)}</td><td class="table-cell text-right text-indigo-500">${APP.F(l.invPool)}</td><td class="table-cell text-right text-slate-400">${APP.F(l.flow)}</td><td class="table-cell text-right font-black text-slate-700">${APP.F(l.net)}</td></tr>`;
        });

        APP.drawCharts(res, comp);
    },

    drawCharts: (res, comp) => {
        // 水彩風格配色 (Pastel Watercolors)
        // Asset: Purple / Gray
        // Wealth: Blue / Green / Orange
        // Flow: Yellow / Red / Green / Blue
        // Inflation: Gray / Orange

        const commonOpt = {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1000, easing: 'easeOutQuart' },
            plugins: { legend: { labels: { usePointStyle: true, boxWidth: 8, font: {family: "'Zen Maru Gothic'", size: 11} } } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { borderDash: [4, 8], color: '#f1f5f9' }, ticks: { font: {family: "'Zen Maru Gothic'", size: 10}, color: '#94a3b8' } }
            }
        };

        const ctxs = ['chart-asset', 'chart-flow', 'chart-wealth', 'chart-inflation'];
        ctxs.forEach(id => {
            if(APP.charts[id]) APP.charts[id].destroy();
            const cvs = document.getElementById(id);
            if(!cvs) return;

            let cfg;
            if(id === 'chart-asset') {
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '本方案', data: res.netAsset, borderColor: '#a18cd1', backgroundColor: 'rgba(161, 140, 209, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointRadius: 0 },
                            { label: '對照組', data: comp.netAsset, borderColor: '#cbd5e1', borderWidth: 2, borderDash: [5,5], pointRadius: 0 }
                        ]
                    }
                };
            } else if(id === 'chart-flow') {
                cfg = {
                    type: 'bar',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '房貸', data: res.mortgage, backgroundColor: '#fcd34d', borderRadius: 4 },
                            { label: '支出', data: res.exp, backgroundColor: '#fda4af', borderRadius: 4 },
                            { label: '投資', data: res.inv, backgroundColor: '#6ee7b7', borderRadius: 4 },
                            { label: '結餘', data: res.flow, backgroundColor: '#a5b4fc', borderRadius: 4 }
                        ]
                    },
                    options: { ...commonOpt, scales: { ...commonOpt.scales, x: { stacked: true }, y: { stacked: true } } }
                };
            } else if(id === 'chart-wealth') {
                const liquid = res.netAsset.map((n, i) => n - res.house[i] + res.loan[i]);
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '房產市值', data: res.house, backgroundColor: 'rgba(253, 186, 116, 0.2)', borderColor: '#fdba74', fill: true, pointRadius: 0, borderWidth: 1, order: 3 },
                            { label: '投資池', data: res.investPool, backgroundColor: 'rgba(110, 231, 183, 0.2)', borderColor: '#6ee7b7', fill: true, pointRadius: 0, borderWidth: 2, order: 2 },
                            { label: '現金池', data: res.cashPool, backgroundColor: 'rgba(165, 180, 252, 0.2)', borderColor: '#818cf8', fill: true, pointRadius: 0, borderWidth: 1, order: 1 },
                            { label: '房貸', data: res.loan, borderColor: '#fda4af', borderDash:[3,3], fill: false, pointRadius: 0, borderWidth: 2, order: 0 }
                        ]
                    },
                    options: { ...commonOpt, scales: { ...commonOpt.scales, y: { stacked: false } } }
                };
            } else {
                cfg = {
                    type: 'line',
                    data: {
                        labels: res.years,
                        datasets: [
                            { label: '名目資產', data: res.netAsset, borderColor: '#94a3b8', borderWidth: 2, pointRadius: 0 },
                            { label: '實質購買力', data: res.realAsset, borderColor: '#fca5a5', backgroundColor: 'rgba(252, 165, 165, 0.1)', fill: true, borderWidth: 2, pointRadius: 0 }
                        ]
                    }
                };
            }
            // Apply common options
            if(!cfg.options) cfg.options = commonOpt;
            else if(!cfg.options.plugins) cfg.options = { ...commonOpt, ...cfg.options };

            APP.charts[id] = new Chart(cvs, cfg);
        });
    },

    generateReport: () => {
        if(!APP.currentResult) return;
        const r = APP.currentResult;
        const last = r.netAsset.length - 1;
        const invRatio = Math.round((r.investPool[last] / r.netAsset[last]) * 100) || 0;
        
        const html = `
            <h4 class="font-serif text-xl font-bold text-slate-700 border-b border-slate-100 pb-3 mb-6">財務戰略分析報告</h4>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                    <span class="text-xs font-bold text-indigo-400 block mb-1">預估最終淨資產</span>
                    <span class="text-3xl font-serif font-black text-indigo-700">${APP.F(r.netAsset[last])}</span>
                </div>
                <div class="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                    <span class="text-xs font-bold text-emerald-500 block mb-1">投資獲利貢獻</span>
                    <span class="text-3xl font-serif font-black text-emerald-600">${APP.F(r.investPool[last])}</span>
                </div>
            </div>

            <div class="space-y-4 text-slate-600 font-medium">
                <p>🎨 <strong>資產結構分析：</strong><br>
                在 ${r.years.length} 年的職涯規劃中，您的資產成長動力主要來自 <span class="text-emerald-600 font-bold">投資複利</span>。
                目前的薪資提撥率設定為 <span class="text-slate-800 font-bold">${APP.data[APP.current].investSliderPct}%</span>，
                年化報酬率設定為 <span class="text-slate-800 font-bold">${APP.data[APP.current].returnRate}%</span>。
                最終投資部位佔總資產約 <span class="text-indigo-600 font-bold">${invRatio}%</span>。</p>
                
                <p>📉 <strong>通膨影響評估：</strong><br>
                雖然名目資產達到了 ${APP.F(r.netAsset[last])}，但考慮到 ${APP.data[APP.current].inflationRate}% 的通貨膨脹，
                其實質購買力約為 <span class="text-rose-500 font-bold">${APP.F(r.realAsset[last])}</span>。
                這提醒我們必須持續保持高於通膨的投資回報。</p>
                
                <p>👴 <strong>退休保障：</strong><br>
                依據目前的階級晉升路徑，預估您的終身俸（月退）約為 <span class="text-sky-600 font-bold">${APP.F(r.pension)}</span> 元。</p>
            </div>
        `;
        document.getElementById('reportContent').innerHTML = html;
        const modal = document.getElementById('reportModal');
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); modal.children[0].classList.remove('scale-95'); }, 10);
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
