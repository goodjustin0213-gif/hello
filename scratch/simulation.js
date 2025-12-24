<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>空軍戰略指揮系統 | v10.0 終極天網版</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Black+Ops+One&family=Noto+Sans+TC:wght@400;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        cyber: { 
                            dark: '#050a14', 
                            panel: 'rgba(10, 25, 47, 0.85)', 
                            cyan: '#00f3ff', 
                            green: '#0aff0a', 
                            orange: '#ffaa00', 
                            red: '#ff003c' 
                        },
                    },
                    fontFamily: {
                        mono: ['"Share Tech Mono"', 'monospace'],
                        display: ['"Black Ops One"', 'cursive'],
                        sans: ['"Noto Sans TC"', 'sans-serif'],
                    },
                    animation: {
                        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'scan': 'scanline 8s linear infinite',
                        'flash': 'flash 0.5s',
                    },
                    keyframes: {
                        scanline: { '0%': { backgroundPosition: '0% 0%' }, '100%': { backgroundPosition: '0% 100%' } },
                        flash: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } }
                    }
                }
            }
        }
    </script>
    <style>
        body { 
            background-color: #020408; color: #00f3ff; font-family: 'Share Tech Mono', monospace; overflow: hidden; 
            background-image: 
                linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
            background-size: 30px 30px;
        }
        
        /* 霓虹捲軸 */
        .scroller::-webkit-scrollbar { width: 6px; height: 6px; }
        .scroller::-webkit-scrollbar-track { background: #050a14; }
        .scroller::-webkit-scrollbar-thumb { background: #00f3ff; border-radius: 3px; box-shadow: 0 0 10px #00f3ff; }

        /* 賽博輸入框 */
        input, select { 
            background-color: rgba(0, 20, 40, 0.9); 
            border: 1px solid #005566; 
            color: #00f3ff; 
            padding: 6px; 
            font-family: 'Share Tech Mono', monospace;
            transition: 0.3s;
            text-shadow: 0 0 2px rgba(0, 243, 255, 0.5);
        }
        input:focus, select:focus { 
            border-color: #00f3ff; 
            box-shadow: 0 0 15px rgba(0, 243, 255, 0.3); 
            outline: none; 
            background-color: rgba(0, 40, 80, 0.9);
        }
        select option { background: #050a14; color: #00f3ff; }

        /* 霓虹滑桿 */
        input[type=range] { -webkit-appearance: none; height: 4px; background: #003344; border: none; }
        input[type=range]::-webkit-slider-thumb { 
            -webkit-appearance: none; width: 16px; height: 16px; 
            background: #00f3ff; box-shadow: 0 0 15px #00f3ff, 0 0 30px #00f3ff; 
            border-radius: 50%; cursor: pointer; margin-top: -6px; 
        }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; background: #003344; }

        /* 玻璃面板 */
        .cyber-panel {
            background: rgba(6, 12, 25, 0.8);
            border: 1px solid rgba(0, 243, 255, 0.2);
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0, 243, 255, 0.02);
            backdrop-filter: blur(5px);
            position: relative;
        }
        /* 角落裝飾 */
        .cyber-panel::before { content: ''; position: absolute; top: -1px; left: -1px; width: 10px; height: 10px; border-top: 2px solid #00f3ff; border-left: 2px solid #00f3ff; }
        .cyber-panel::after { content: ''; position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px; border-bottom: 2px solid #00f3ff; border-right: 2px solid #00f3ff; }

        /* 按鈕特效 */
        .btn-cyber {
            background: linear-gradient(45deg, transparent 5%, #00f3ff 5%);
            color: #000;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 6px 0px 0px #005566;
            transition: 0.2s;
            clip-path: polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%);
        }
        .btn-cyber:hover { background: linear-gradient(45deg, transparent 5%, #fff 5%); box-shadow: 6px 0px 0px #00f3ff; text-shadow: 0 0 5px #fff; }
        .btn-cyber:active { transform: translateY(2px); box-shadow: 2px 0px 0px #005566; }

        .btn-outline-cyber {
            background: transparent;
            border: 1px solid #00f3ff;
            color: #00f3ff;
            box-shadow: 0 0 5px #00f3ff;
        }
        .btn-outline-cyber:hover { background: rgba(0, 243, 255, 0.1); box-shadow: 0 0 15px #00f3ff; }

        /* 終端機文字 */
        .terminal-log { font-family: 'Share Tech Mono', monospace; font-size: 11px; line-height: 1.4; }
        .log-entry { border-bottom: 1px solid rgba(0, 243, 255, 0.1); padding: 2px 0; display: flex; justify-content: space-between; }
        .log-entry:hover { background: rgba(0, 243, 255, 0.1); }
    </style>
</head>
<body class="flex flex-col h-screen">

    <header class="h-16 bg-cyber-dark border-b border-cyber-cyan/30 flex items-center justify-between px-6 shrink-0 z-50 relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwMDAwIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDAsIDI0MywgMjU1LCAwLjEpIiAvPjwvc3ZnPg==')] opacity-50"></div>
        
        <div class="flex items-center gap-4 z-10">
            <div class="w-10 h-10 border-2 border-cyber-cyan flex items-center justify-center rounded-sm bg-cyber-cyan/10 shadow-[0_0_15px_#00f3ff]">
                <span class="font-display text-xl text-cyber-cyan">AF</span>
            </div>
            <div>
                <h1 class="font-display text-2xl tracking-widest text-white text-shadow-glow">SKYNET FINANCIAL</h1>
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></span>
                    <p class="text-[10px] text-cyber-cyan/70 tracking-[0.3em]">SYSTEM ONLINE // v10.0</p>
                </div>
            </div>
        </div>
        <div class="flex gap-4 z-10">
            <button onclick="app.generateReport()" class="btn-cyber px-4 py-2 text-xs">生成戰略報告</button>
        </div>
    </header>

    <div class="flex flex-1 overflow-hidden relative z-10">
        <aside class="w-[380px] bg-cyber-dark/95 border-r border-cyber-cyan/20 flex flex-col z-20 backdrop-blur-md">
            <div class="p-4 border-b border-cyber-cyan/20">
                <div class="grid grid-cols-2 gap-2">
                    <button onclick="app.switchScenario('A')" id="btn-A" class="btn-outline-cyber py-2 text-xs font-bold rounded-sm bg-cyber-cyan/20 text-white">方案 ALPHA</button>
                    <button onclick="app.switchScenario('B')" id="btn-B" class="btn-outline-cyber py-2 text-xs font-bold rounded-sm border-cyber-cyan/30 text-gray-500">方案 BRAVO</button>
                </div>
                <div class="text-[10px] text-center text-cyber-cyan/50 mt-2 font-mono tracking-widest" id="current-scen-label">EDITING: ALPHA PROTOCOL</div>
            </div>

            <div class="flex-1 overflow-y-auto scroller p-5 space-y-8">
                <div class="space-y-3">
                    <h3 class="text-cyber-orange text-xs font-bold uppercase tracking-widest border-l-2 border-cyber-orange pl-3 flex items-center gap-2">
                        <span class="w-1.5 h-1.5 bg-cyber-orange animate-ping"></span> 01. 階級參數
                    </h3>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-cyber-cyan/60 block mb-1">目標階級</label><select id="targetRank"><option value="S2">少尉 (2LT)</option><option value="S3">中尉 (1LT)</option><option value="S4">上尉 (CPT)</option><option value="M1">少校 (MAJ)</option><option value="M2">中校 (LTC)</option><option value="M3">上校 (COL)</option><option value="G1">少將 (BG)</option></select></div>
                        <div><label class="text-[10px] text-cyber-cyan/60 block mb-1">服役年數</label><input type="number" id="serviceYears" value="20" class="text-center font-bold"></div>
                    </div>
                    <button onclick="app.applyAirForcePreset()" class="w-full py-2 border border-cyber-cyan/30 text-cyber-cyan/80 text-[10px] hover:bg-cyber-cyan/10 transition uppercase tracking-wider">>> 初始化空勤加給參數 <<</button>
                    <div id="allowance-list" class="space-y-1"></div>
                    <button onclick="app.addCustomAllowance()" class="text-[10px] text-cyber-cyan/50 hover:text-white block w-full text-center border-t border-cyber-cyan/10 pt-1">+ 自訂加給項目</button>
                </div>

                <div class="space-y-3">
                    <h3 class="text-cyber-green text-xs font-bold uppercase tracking-widest border-l-2 border-cyber-green pl-3 flex items-center gap-2">
                        <span class="w-1.5 h-1.5 bg-cyber-green animate-ping"></span> 02. 投資核心
                    </h3>
                    <div class="p-3 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-1 text-[9px] text-cyber-green/50 border-b border-l border-cyber-cyan/20">AUTO-COMPOUND</div>
                        <div class="flex justify-between items-end mb-2">
                            <label class="text-[11px] font-bold text-white">薪資提撥率</label>
                            <span id="slider-val" class="text-2xl font-display text-cyber-cyan text-shadow-glow">30%</span>
                        </div>
                        <input type="range" id="investSlider" min="0" max="90" value="30" class="w-full" oninput="document.getElementById('slider-val').innerText = this.value + '%'; app.calc()">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-cyber-cyan/60 block mb-1">年化報酬 (%)</label><input type="number" id="returnRate" value="6.0" class="text-center font-bold text-cyber-green border-cyber-green/30"></div>
                        <div><label class="text-[10px] text-cyber-cyan/60 block mb-1">通膨率 (%)</label><input type="number" id="inflationRate" value="2.0" class="text-center text-cyber-red border-cyber-red/30"></div>
                    </div>
                    <div id="invest-list" class="space-y-1"></div>
                    <button onclick="app.addItem('invest-list')" class="text-[10px] text-cyber-cyan/50 hover:text-white block w-full text-center border-t border-cyber-cyan/10 pt-1">+ 新增固定投資</button>
                </div>

                <div class="space-y-3">
                    <h3 class="text-cyber-cyan text-xs font-bold uppercase tracking-widest border-l-2 border-cyber-cyan pl-3">03. 支出與房產</h3>
                    <div id="expense-list" class="space-y-1"></div>
                    <button onclick="app.addItem('expense-list')" class="text-[10px] text-cyber-cyan/50 hover:text-white block w-full text-center border-t border-cyber-cyan/10 pt-1 mb-2">+ 新增支出</button>
                    
                    <div class="flex items-center gap-2 p-2 bg-cyber-cyan/5 border border-cyber-cyan/20">
                        <input type="checkbox" id="buyHouseToggle" class="w-4 h-4" onchange="app.calc()">
                        <span class="text-xs font-bold text-cyber-orange">啟用房產戰略模擬</span>
                    </div>
                    <div id="housing-inputs" class="hidden grid grid-cols-2 gap-2 p-2 border-x border-b border-cyber-cyan/20 bg-black/20">
                        <div><label class="text-[9px] text-gray-500">購屋年</label><input type="number" id="buyYear" value="10"></div>
                        <div><label class="text-[9px] text-gray-500">總價(萬)</label><input type="number" id="housePriceWan" value="1500" class="text-cyber-orange"></div>
                        <div><label class="text-[9px] text-gray-500">頭期(%)</label><input type="number" id="downPaymentPct" value="20"></div>
                        <div><label class="text-[9px] text-gray-500">利率(%)</label><input type="number" id="mortgageRate" value="2.2"></div>
                        <div><label class="text-[9px] text-gray-500">年限</label><input type="number" id="loanTerm" value="30"></div>
                        <div><label class="text-[9px] text-gray-500">增值(%)</label><input type="number" id="houseAppreciation" value="1.5"></div>
                    </div>
                </div>
                <div class="h-20"></div>
            </div>
        </aside>

        <main class="flex-1 scroller p-6 relative overflow-y-auto">
            <div id="status-bar" class="hidden mb-6 cyber-panel border-l-4 border-l-cyber-red p-4 flex items-start animate-pulse">
                <span class="text-2xl mr-4 text-cyber-red">⚠️</span>
                <div>
                    <h4 class="font-display text-cyber-red text-lg tracking-widest">WARNING: CRITICAL DEFICIT DETECTED</h4>
                    <p class="text-white/70 text-sm font-mono">財務赤字警告：請立即調整支出結構或提升投資回報。</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="cyber-panel p-5 bg-gradient-to-br from-cyber-cyan/5 to-transparent">
                    <p class="text-[10px] text-cyber-cyan/60 uppercase tracking-[0.2em] mb-1">PROJECTED NET WORTH</p>
                    <p id="kpi-asset" class="text-4xl font-display text-white text-shadow-glow tracking-wide">--</p>
                    <div class="flex justify-between items-end mt-2 border-t border-cyber-cyan/20 pt-2">
                        <span class="text-xs text-cyber-cyan/50">VS 对照组</span>
                        <span id="kpi-diff" class="text-sm font-mono font-bold">--</span>
                    </div>
                </div>
                <div class="cyber-panel p-5 bg-gradient-to-br from-cyber-green/5 to-transparent">
                    <p class="text-[10px] text-cyber-green/60 uppercase tracking-[0.2em] mb-1">ESTIMATED PENSION (MONTHLY)</p>
                    <p id="kpi-pension" class="text-4xl font-display text-cyber-green text-shadow-glow tracking-wide">--</p>
                    <div class="mt-2 border-t border-cyber-green/20 pt-2 text-right">
                        <span class="text-[10px] text-cyber-green/50">LIFETIME SUPPORT</span>
                    </div>
                </div>
                <div class="cyber-panel p-5 bg-gradient-to-br from-cyber-orange/5 to-transparent">
                    <p class="text-[10px] text-cyber-orange/60 uppercase tracking-[0.2em] mb-1">WEALTH DISTRIBUTION</p>
                    <div class="flex justify-between items-end">
                        <div>
                            <span class="text-[10px] text-gray-500 block">投資部位</span>
                            <span id="kpi-invest-pool" class="text-xl font-mono text-white">--</span>
                        </div>
                        <div class="text-right">
                            <span class="text-[10px] text-gray-500 block">現金部位</span>
                            <span id="kpi-cash-pool" class="text-xl font-mono text-gray-400">--</span>
                        </div>
                    </div>
                    <div class="w-full h-1 bg-gray-800 mt-2 rounded overflow-hidden flex">
                        <div id="bar-invest" class="h-full bg-cyber-green shadow-[0_0_10px_#0aff0a]" style="width: 0%"></div>
                        <div id="bar-cash" class="h-full bg-gray-600" style="width: 0%"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="cyber-panel p-4 h-[300px] flex flex-col">
                    <div class="flex justify-between items-center mb-2 border-b border-cyber-cyan/10 pb-1">
                        <h4 class="text-xs font-bold text-cyber-cyan uppercase tracking-widest">01 // ASSET COMPARISON</h4>
                        <span class="w-2 h-2 bg-cyber-cyan rounded-full animate-pulse"></span>
                    </div>
                    <div class="flex-1 relative w-full"><canvas id="chart-asset"></canvas></div>
                </div>
                <div class="cyber-panel p-4 h-[300px] flex flex-col">
                    <div class="flex justify-between items-center mb-2 border-b border-cyber-orange/10 pb-1">
                        <h4 class="text-xs font-bold text-cyber-orange uppercase tracking-widest">02 // CASHFLOW DNA</h4>
                        <span class="w-2 h-2 bg-cyber-orange rounded-full animate-pulse"></span>
                    </div>
                    <div class="flex-1 relative w-full"><canvas id="chart-flow"></canvas></div>
                </div>
                <div class="cyber-panel p-4 h-[300px] flex flex-col">
                    <div class="flex justify-between items-center mb-2 border-b border-cyber-green/10 pb-1">
                        <h4 class="text-xs font-bold text-cyber-green uppercase tracking-widest">03 // WEALTH STRUCTURE</h4>
                        <span class="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></span>
                    </div>
                    <div class="flex-1 relative w-full"><canvas id="chart-wealth"></canvas></div>
                </div>
                <div class="cyber-panel p-4 h-[300px] flex flex-col">
                    <div class="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest">04 // REAL PURCHASING POWER</h4>
                        <span class="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
                    </div>
                    <div class="flex-1 relative w-full"><canvas id="chart-inflation"></canvas></div>
                </div>
            </div>

            <div class="cyber-panel mb-20">
                <div class="bg-black/40 p-2 border-b border-cyber-cyan/20 flex justify-between items-center">
                    <h4 class="text-cyber-cyan text-xs font-mono">>> SYSTEM_LOG // CALCULATION_MATRIX</h4>
                    <span class="text-[9px] text-cyber-cyan/50 blink">REC ●</span>
                </div>
                <div class="h-64 overflow-y-auto scroller bg-black/20 p-2 font-mono text-xs">
                    <table class="w-full text-left">
                        <thead class="text-cyber-cyan/60 border-b border-cyber-cyan/10">
                            <tr><th class="py-2">YEAR</th><th class="py-2">RANK</th><th class="py-2 text-right">INCOME</th><th class="py-2 text-right text-cyber-red">EXPENSE</th><th class="py-2 text-right text-cyber-green">INVESTED</th><th class="py-2 text-right">CASH</th><th class="py-2 text-right text-white">NET WORTH</th></tr>
                        </thead>
                        <tbody id="table-body" class="text-gray-400"></tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <div id="reportModal" class="fixed inset-0 bg-black/90 hidden z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
        <div class="cyber-panel w-full max-w-2xl bg-cyber-dark border border-cyber-cyan shadow-[0_0_50px_rgba(0,243,255,0.2)] animate-scan">
            <div class="p-6 border-b border-cyber-cyan/30 flex justify-between items-center">
                <h3 class="text-2xl font-display text-cyber-cyan text-shadow-glow">MISSION REPORT</h3>
                <button onclick="document.getElementById('reportModal').classList.add('hidden')" class="text-cyber-cyan hover:text-white text-xl">✕</button>
            </div>
            <div id="reportContent" class="p-8 space-y-6 text-sm text-gray-300 font-mono leading-relaxed h-[60vh] overflow-y-auto scroller"></div>
            <div class="p-4 border-t border-cyber-cyan/30 flex justify-end bg-black/20">
                <button onclick="document.getElementById('reportModal').classList.add('hidden')" class="btn-cyber px-6 py-2">ACKNOWLEDGE</button>
            </div>
        </div>
    </div>

<script>
// --- V10.0 ENGINE ---
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
        const def = {
            targetRank: 'M2', serviceYears: 20, inflationRate: 2, salaryRaiseRate: 1, returnRate: 6,
            buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
            investSliderPct: 30,
            allowances: [], expenses: [{name:'生活費', val:12000}], investments: [{name:'儲蓄險', val:3000}]
        };
        APP.data.A = JSON.parse(JSON.stringify(def));
        APP.data.B = JSON.parse(JSON.stringify(def));
        APP.data.B.returnRate = 4; APP.data.B.investSliderPct = 50; 
        
        document.body.addEventListener('input', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') APP.calc();
        });
        APP.renderInputs('A');
        setTimeout(APP.calc, 200); // Wait for Chart.js
    },

    switchScenario: (s) => {
        APP.saveInputs(); APP.current = s;
        document.getElementById('btn-A').className = s==='A' ? 'btn-cyber px-4 py-2 w-full text-white' : 'btn-outline-cyber px-4 py-2 w-full text-gray-500';
        document.getElementById('btn-B').className = s==='B' ? 'btn-cyber px-4 py-2 w-full text-white' : 'btn-outline-cyber px-4 py-2 w-full text-gray-500';
        document.getElementById('current-scen-label').innerText = `EDITING: ${s==='A'?'ALPHA':'BRAVO'} PROTOCOL`;
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
        document.getElementById('housing-inputs').className = d.buyHouseToggle ? "grid grid-cols-2 gap-2 p-2 border-x border-b border-cyber-cyan/20 bg-black/20" : "hidden";
    },

    renderList: (id, list) => {
        const c = document.getElementById(id); c.innerHTML = '';
        list.forEach(item => {
            let extra = id==='allowance-list' ? `<input type="number" class="w-10 text-center !bg-black !border-cyber-cyan/30" value="${item.start||1}">-<input type="number" class="w-10 text-center !bg-black !border-cyber-cyan/30" value="${item.end||20}">` : '';
            c.innerHTML += `<div class="flex gap-1 items-center mb-1"><input type="text" value="${item.name}" class="w-full text-xs !bg-transparent border-b !border-cyber-cyan/20"><input type="number" value="${item.val}" class="w-20 text-right !bg-transparent border-b !border-cyber-cyan/20 font-mono text-cyber-orange">${extra}<button onclick="this.parentElement.remove(); app.calc()" class="text-cyber-red hover:text-white px-2">×</button></div>`;
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
    addCustomAllowance: () => APP.addItem('allowance-list'),

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
            res.logs.push({y, rank, income:yIncome, exp:yExp, inv:yInvestInput, invPool:investPool, cashPool:cashPool, flow:cashSurplus, net:netAsset});
        }
        res.pension = Math.round(APP.salary[rank].base * 2 * (0.55 + Math.max(0, years-20)*0.02));
        return res;
    },

    // --- VISUALIZATION ---
    calc: () => {
        APP.saveInputs();
        const resA = APP.runSim(APP.data.A);
        const resB = APP.runSim(APP.data.B);
        APP.updateUI(APP.current==='A'?resA:resB, APP.current==='A'?resB:resA);
    },

    updateUI: (res, comp) => {
        const last = res.netAsset.length-1;
        document.getElementById('kpi-asset').innerText = APP.F(res.netAsset[last]);
        document.getElementById('kpi-pension').innerText = APP.F(res.pension);
        document.getElementById('kpi-invest-pool').innerText = APP.F(res.investPool[last]);
        document.getElementById('kpi-cash-pool').innerText = APP.F(res.cashPool[last]);
        
        const diff = res.netAsset[last] - comp.netAsset[last];
        document.getElementById('kpi-diff').innerHTML = `差異: <span class="${diff>=0?'text-cyber-green':'text-cyber-red'}">${diff>0?'+':''}${APP.F(diff)}</span>`;
        
        const totalL = res.investPool[last] + res.cashPool[last];
        if(totalL>0) {
            document.getElementById('bar-invest').style.width = (res.investPool[last]/totalL*100) + '%';
            document.getElementById('bar-cash').style.width = (res.cashPool[last]/totalL*100) + '%';
        }

        const hDiv = document.getElementById('kpi-house');
        hDiv.innerHTML = APP.data[APP.current].buyHouseToggle ? `<span class="text-cyber-orange">${APP.F(res.house[last])}</span> / <span class="text-cyber-red">-${APP.F(res.loan[last])}</span>` : "未啟用";

        const sb = document.getElementById('status-bar');
        const neg = res.logs.some(l=>l.net<0 || l.flow<0);
        if(neg) sb.classList.remove('hidden'); else sb.classList.add('hidden');

        const tb = document.getElementById('table-body'); tb.innerHTML = '';
        res.logs.forEach(l => {
            tb.innerHTML += `<tr class="log-entry"><td class="py-1 text-gray-500">Y${l.y}</td><td class="font-bold text-cyber-cyan">${l.rank}</td><td class="text-right text-gray-300">${APP.F(l.income)}</td><td class="text-right text-cyber-red/70">${APP.F(l.exp)}</td><td class="text-right text-cyber-green/70">${APP.F(l.inv)}</td><td class="text-right text-gray-500">${APP.F(l.flow)}</td><td class="text-right font-bold text-white">${APP.F(l.net)}</td></tr>`;
        });

        APP.drawCharts(res, comp);
    },

    drawCharts: (res, comp) => {
        // Chart Global Config
        Chart.defaults.color = '#00f3ff';
        Chart.defaults.borderColor = 'rgba(0, 243, 255, 0.1)';
        Chart.defaults.font.family = '"Share Tech Mono"';

        const chartConfig = (type, labels, datasets, stacked=false) => ({
            type, data: { labels, datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 1000, easing: 'easeOutQuart' },
                scales: { x: { grid: { display: false } }, y: { stacked, grid: { color: 'rgba(0, 243, 255, 0.05)' } } },
                plugins: { legend: { labels: { usePointStyle: true, boxWidth: 6 } } }
            }
        });

        const ctxs = ['chart-asset', 'chart-flow', 'chart-wealth', 'chart-inflation'];
        ctxs.forEach(id => {
            if(APP.charts[id]) APP.charts[id].destroy();
            const cvs = document.getElementById(id);
            if(!cvs) return;

            let cfg;
            if(id === 'chart-asset') {
                cfg = chartConfig('line', res.years, [
                    { label: '目前方案', data: res.netAsset, borderColor: '#00f3ff', borderWidth: 2, tension: 0.4, pointRadius: 0, fill: {target:'origin', above:'rgba(0, 243, 255, 0.05)'} },
                    { label: '對照組', data: comp.netAsset, borderColor: '#4b5563', borderWidth: 2, borderDash: [4,4], pointRadius: 0 }
                ]);
            } else if(id === 'chart-flow') {
                cfg = chartConfig('bar', res.years, [
                    { label: '房貸', data: res.mortgage, backgroundColor: '#ffaa00' },
                    { label: '支出', data: res.exp, backgroundColor: '#ff003c' },
                    { label: '投資', data: res.inv, backgroundColor: '#0aff0a' },
                    { label: '結餘', data: res.flow, backgroundColor: '#00f3ff' }
                ], true);
            } else if(id === 'chart-wealth') {
                // FIXED STACKING LOGIC FOR WEALTH
                const liquid = res.netAsset.map((n, i) => n - res.house[i] + res.loan[i]);
                cfg = chartConfig('line', res.years, [
                    { label: '房產市值', data: res.house, backgroundColor: 'rgba(255, 170, 0, 0.3)', borderColor: '#ffaa00', fill: true, pointRadius: 0, order: 2 },
                    { label: '流動資產', data: liquid, backgroundColor: 'rgba(0, 243, 255, 0.3)', borderColor: '#00f3ff', fill: true, pointRadius: 0, order: 1 },
                    { label: '房貸負債', data: res.loan, borderColor: '#ff003c', borderDash:[5,5], fill: false, pointRadius: 0, order: 0 }
                ]); // Stacking turned off in options for this specific mix
                cfg.options.scales.y.stacked = false; 
            } else {
                cfg = chartConfig('line', res.years, [
                    { label: '名目資產', data: res.netAsset, borderColor: '#4b5563', borderWidth: 2, pointRadius: 0 },
                    { label: '實質購買力', data: res.realAsset, borderColor: '#ffaa00', backgroundColor: 'rgba(255, 170, 0, 0.1)', fill: true, borderWidth: 2, pointRadius: 0 }
                ]);
            }
            APP.charts[id] = new Chart(cvs, cfg);
        });
    },

    generateReport: () => {
        const res = APP.data.A; // 簡易版取 A 的參數
        const r = APP.runSim(res);
        const last = r.netAsset.length - 1;
        const html = `
            <h4 class="text-cyber-cyan border-b border-cyber-cyan/30 pb-2 mb-4">MISSION DEBRIEFING // ${new Date().toLocaleDateString()}</h4>
            <p>戰略目標：<span class="text-white font-bold">${res.targetRank}</span> / 服役 <span class="text-white">${res.serviceYears}</span> 年</p>
            <p>最終淨資產：<span class="text-3xl text-cyber-green block mt-2 mb-4">${APP.F(r.netAsset[last])}</span></p>
            <div class="grid grid-cols-2 gap-4 text-xs border border-cyber-cyan/20 p-4 mb-4">
                <div><span class="text-gray-500">投資滾存：</span><br><span class="text-white text-lg">${APP.F(r.investPool[last])}</span></div>
                <div><span class="text-gray-500">現金積累：</span><br><span class="text-white text-lg">${APP.F(r.cashPool[last])}</span></div>
                <div><span class="text-gray-500">通膨後價值：</span><br><span class="text-cyber-orange text-lg">${APP.F(r.realAsset[last])}</span></div>
                <div><span class="text-gray-500">終身俸：</span><br><span class="text-cyber-cyan text-lg">${APP.F(r.pension)} / 月</span></div>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed">
                系統評估：依據目前的投資提撥率 <span class="text-white">${res.investSliderPct}%</span> 與年化報酬率 <span class="text-white">${res.returnRate}%</span>，
                您的資產結構中，投資收益佔比約 <span class="text-white">${Math.round(r.investPool[last]/r.netAsset[last]*100)}%</span>。
                ${r.pension > 40000 ? '終身俸保障充足，退休生活無虞。' : '建議延長服役年限以提高終身俸基數。'}
            </p>
        `;
        document.getElementById('reportContent').innerHTML = html;
        document.getElementById('reportModal').classList.remove('hidden');
    }
};

window.onload = APP.init;
window.app = APP;
</script>
</body>
</html>
