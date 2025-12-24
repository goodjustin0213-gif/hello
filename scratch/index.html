<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>空軍官校職涯財務決策支援系統 | v5.0 戰略指揮版</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Noto+Serif+TC:wght@700;900&family=Ma+Shan+Zheng&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        navy: { 950: '#020617', 900: '#0f172a', 800: '#1e293b', 700: '#334155', 600: '#475569' },
                        gold: { DEFAULT: '#cca43b', light: '#fcd34d', glow: 'rgba(204, 164, 59, 0.5)' },
                        airforce: '#003087',
                    },
                    fontFamily: {
                        sans: ['"Noto Sans TC"', 'sans-serif'],
                        mono: ['"JetBrains Mono"', 'monospace'],
                        hand: ['"Ma Shan Zheng"', 'cursive'],
                    },
                    backgroundImage: {
                        'tactical-grid': "radial-gradient(#334155 1px, transparent 1px)",
                    }
                }
            }
        }
    </script>
    <style>
        /* 1. 基礎設定與背景網格 */
        body { 
            background-color: #0f172a; 
            color: #e2e8f0; 
            overflow: hidden; 
            background-image: radial-gradient(#1e293b 1px, transparent 1px);
            background-size: 20px 20px;
        }

        /* 2. 捲軸美化 */
        .scroller { scrollbar-width: thin; scrollbar-color: #475569 #0f172a; }
        .scroller::-webkit-scrollbar { width: 6px; }
        .scroller::-webkit-scrollbar-track { background: #020617; }
        .scroller::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 3px; }

        /* 3. 專業級輸入框與選單 (修復顯示問題) */
        input, select {
            appearance: none; /* 移除預設外觀 */
            background-color: #1e293b; 
            border: 1px solid #475569; 
            color: white; 
            transition: all 0.2s;
        }
        /* 強制設定 option 顏色，解決瀏覽器白底問題 */
        select option {
            background-color: #0f172a;
            color: white;
            padding: 10px;
        }
        /* 自訂下拉箭頭 */
        select {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 0.5rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            padding-right: 2.5rem;
        }
        input:focus, select:focus {
            border-color: #cca43b;
            outline: none;
            box-shadow: 0 0 8px rgba(204, 164, 59, 0.3);
        }

        /* 4. 滑桿樣式 */
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { 
            -webkit-appearance: none; 
            height: 16px; width: 16px; 
            border-radius: 50%; 
            background: #cca43b; 
            cursor: pointer; 
            margin-top: -6px; 
            border: 2px solid #fff; 
            box-shadow: 0 0 10px rgba(204, 164, 59, 0.8);
        }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; background: #475569; border-radius: 2px; }

        /* 5. 特效與動畫 */
        .red-ink { font-family: 'Ma Shan Zheng', cursive; color: #ef4444; position: absolute; z-index: 50; pointer-events: none; text-shadow: 1px 1px 0px rgba(0,0,0,0.8); transform: rotate(-2deg); mix-blend-mode: normal; }
        
        .glass-panel {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        }
        
        .modal-bg { background-color: rgba(2, 6, 23, 0.9); backdrop-filter: blur(5px); }
    </style>
</head>
<body class="flex flex-col h-screen">

    <header class="bg-navy-950 h-16 flex items-center justify-between px-6 border-b border-navy-700 shadow-lg z-50 shrink-0 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
        
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-gradient-to-br from-airforce to-navy-900 rounded border border-white/10 flex items-center justify-center text-white font-black text-lg shadow-[0_0_15px_rgba(0,48,135,0.5)]">
                AF
            </div>
            <div>
                <h1 class="text-white text-lg font-bold tracking-widest uppercase">空軍官校職涯財務決策支援系統</h1>
                <div class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></span>
                    <p class="text-slate-400 text-[10px] tracking-[0.3em] font-mono">STRATEGIC COMMAND v5.0</p>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <button onclick="generateReport()" class="bg-gold hover:bg-yellow-600 text-navy-950 px-4 py-1.5 rounded-sm text-xs font-bold transition flex items-center gap-2 shadow-[0_0_10px_rgba(204,164,59,0.3)] border border-yellow-400/50">
                <span>📊</span> 產生決策報告
            </button>
            <button onclick="exportCSV()" class="bg-navy-800 hover:bg-navy-700 text-slate-300 border border-slate-600 px-4 py-1.5 rounded-sm text-xs transition">
                📥 匯出數據
            </button>
        </div>
    </header>

    <div class="flex flex-1 overflow-hidden z-10">
        
        <aside class="w-[400px] bg-navy-900/95 border-r border-navy-700 flex flex-col z-20 shadow-2xl shrink-0 backdrop-blur-md">
            <div class="p-4 border-b border-navy-800">
                <div class="grid grid-cols-2 gap-1 bg-navy-950 p-1 rounded border border-navy-700">
                    <button onclick="switchScenario('A')" id="btn-scen-A" class="py-2 text-xs font-bold rounded-sm text-white bg-airforce shadow-[0_0_10px_rgba(0,48,135,0.4)] transition flex items-center justify-center gap-2">
                        <span>A</span> 主方案 (Main)
                    </button>
                    <button onclick="switchScenario('B')" id="btn-scen-B" class="py-2 text-xs font-bold rounded-sm text-slate-500 hover:text-slate-300 transition flex items-center justify-center gap-2">
                        <span>B</span> 對照組 (Alt)
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto scroller p-5 space-y-8 relative">
                
                <div class="space-y-3 relative">
                    <h3 class="text-gold text-xs font-bold uppercase tracking-wider border-l-2 border-gold pl-2">01. 階級與年資</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] text-slate-400 block mb-1">目標階級</label>
                            <select id="targetRank" class="w-full text-sm p-2 rounded-sm cursor-pointer hover:border-gold transition-colors">
                                <option value="S2">少尉 (S2)</option>
                                <option value="S3">中尉 (S3)</option>
                                <option value="S4">上尉 (S4)</option>
                                <option value="M1">少校 (M1)</option>
                                <option value="M2">中校 (M2)</option>
                                <option value="M3">上校 (M3)</option>
                                <option value="G1">少將 (G1)</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400 block mb-1">服役年數</label>
                            <input type="number" id="serviceYears" value="20" class="w-full text-sm p-2 rounded-sm text-center">
                        </div>
                    </div>
                    
                    <div class="flex gap-2 pt-1">
                        <button onclick="applyAirForcePreset()" class="flex-1 py-1.5 bg-airforce/20 border border-airforce/50 text-blue-300 text-[10px] rounded-sm hover:bg-airforce/40 transition">
                            ✈️ 帶入空勤加給
                        </button>
                    </div>

                    <div id="custom-allowances-container" class="space-y-2 pt-1"></div>
                    <button onclick="addCustomAllowance()" class="w-full py-1.5 border border-dashed border-slate-600 text-slate-500 text-[10px] rounded-sm hover:bg-navy-800 hover:text-slate-300 transition">
                        + 自訂職務加給
                    </button>
                </div>

                <div class="space-y-3 relative">
                    <h3 class="text-blue-400 text-xs font-bold uppercase tracking-wider border-l-2 border-blue-500 pl-2 flex justify-between">
                        02. 生活消費
                        <span class="text-white font-mono" id="total-expense-display">--</span>
                    </h3>
                    <div id="expense-items-container" class="space-y-2"></div>
                    <button onclick="addExpenseItem()" class="w-full py-1.5 border border-dashed border-slate-600 text-slate-500 text-[10px] rounded-sm hover:bg-navy-800 hover:text-slate-300 transition">
                        + 新增支出 (通膨)
                    </button>
                </div>

                <div class="space-y-3 relative">
                    <h3 class="text-green-400 text-xs font-bold uppercase tracking-wider border-l-2 border-green-500 pl-2 flex justify-between">
                        03. 投資理財
                        <span class="text-white font-mono" id="total-invest-display">--</span>
                    </h3>
                    
                    <div class="bg-navy-800 p-3 rounded-sm border border-navy-600 relative">
                        <div class="flex justify-between items-end mb-2">
                            <label class="text-[11px] font-bold text-green-400">薪資提撥比例</label>
                            <span id="slider-percent-display" class="text-xl font-mono font-bold text-white">30%</span>
                        </div>
                        <input type="range" id="investSlider" min="0" max="90" step="1" value="30" class="w-full" oninput="updateSliderDisplay()">
                        <p class="text-[9px] text-slate-500 mt-1 text-center">金額隨年資與階級自動成長</p>
                    </div>

                    <div id="invest-items-container" class="space-y-2"></div>
                    <button onclick="addInvestItem()" class="w-full py-1.5 border border-dashed border-slate-600 text-slate-500 text-[10px] rounded-sm hover:bg-navy-800 hover:text-slate-300 transition">
                        + 固定金額投資
                    </button>

                    <div class="bg-navy-800 p-2 rounded-sm border border-navy-600 flex items-center justify-between">
                        <label class="text-[10px] text-slate-400">預期年化報酬率</label>
                        <div class="flex gap-2">
                            <input type="number" id="returnRate" value="6.0" step="0.5" class="w-16 text-center text-sm p-1 rounded-sm bg-navy-950 border-navy-500 font-bold text-blue-400">
                            <div class="flex gap-0.5">
                                <button onclick="setRisk('low')" class="px-2 py-1 text-[9px] bg-navy-700 hover:bg-navy-600 text-slate-300">保</button>
                                <button onclick="setRisk('mid')" class="px-2 py-1 text-[9px] bg-navy-700 hover:bg-navy-600 text-blue-300">穩</button>
                                <button onclick="setRisk('high')" class="px-2 py-1 text-[9px] bg-navy-700 hover:bg-navy-600 text-red-300">衝</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-3 relative pb-10">
                    <div class="flex justify-between items-center">
                        <h3 class="text-orange-400 text-xs font-bold uppercase tracking-wider border-l-2 border-orange-500 pl-2">04. 購屋戰略</h3>
                        <label class="inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="buyHouseToggle" class="sr-only peer" onchange="toggleHousingModule()">
                            <div class="w-9 h-5 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>
                    <div id="housing-inputs" class="space-y-2 hidden transition-all">
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[9px] text-slate-500">購屋年(N)</label><input type="number" id="buyYear" value="10" class="w-full text-xs p-1.5 rounded-sm"></div>
                            <div><label class="text-[9px] text-slate-500">總價(萬)</label><input type="number" id="housePriceWan" value="1500" class="w-full text-xs p-1.5 rounded-sm text-orange-400 font-bold"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[9px] text-slate-500">頭期(%)</label><input type="number" id="downPaymentPct" value="20" class="w-full text-xs p-1.5 rounded-sm"></div>
                            <div><label class="text-[9px] text-slate-500">利率(%)</label><input type="number" id="mortgageRate" value="2.2" step="0.1" class="w-full text-xs p-1.5 rounded-sm"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[9px] text-slate-500">年限(年)</label><input type="number" id="loanTerm" value="30" class="w-full text-xs p-1.5 rounded-sm"></div>
                            <div><label class="text-[9px] text-slate-500">增值(%)</label><input type="number" id="houseAppreciation" value="1.5" step="0.1" class="w-full text-xs p-1.5 rounded-sm"></div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <main class="flex-1 overflow-y-auto scroller p-6 relative">
            
            <div id="status-bar" class="hidden mb-4 glass-panel border-l-4 border-red-500 p-3 rounded flex items-start animate-pulse relative">
                <span class="text-xl mr-3">⚠️</span>
                <div>
                    <h4 class="font-bold text-red-400 text-sm">戰略風險警告 (方案 <span id="warn-scen">A</span>)</h4>
                    <p class="text-slate-300 text-xs">偵測到財務赤字，請調整支出或投資策略。</p>
                </div>
                <div class="red-ink text-xl right-20 top-2 rotate-[-5deg]">注意赤字!</div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6">
                <div class="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="glass-panel p-4 rounded border-t-4 border-gold relative overflow-hidden group">
                        <div class="absolute right-[-10px] top-[-10px] text-[80px] text-gold opacity-10 rotate-12 font-serif">$</div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">預估淨資產 (方案A)</p>
                        <div class="flex items-baseline gap-2 mt-2">
                            <p id="total-asset" class="text-2xl font-mono font-bold text-white shadow-glow">--</p>
                            <span class="text-[10px] bg-slate-700 px-1 rounded text-slate-300">名目</span>
                        </div>
                        <p id="comp-asset" class="text-xs text-slate-400 mt-2">--</p>
                        <div class="red-ink text-2xl right-2 top-8 rotate-[10deg] opacity-80">目標!</div>
                    </div>

                    <div class="glass-panel p-4 rounded border-t-4 border-green-500 relative">
                        <div class="absolute right-[-10px] top-[-10px] text-[80px] text-green-500 opacity-10 rotate-12 font-serif">P</div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">終身俸 (月退)</p>
                        <div class="flex items-baseline gap-2 mt-2">
                            <p id="pension-monthly" class="text-2xl font-mono font-bold text-green-400">--</p>
                        </div>
                        <p class="text-[10px] text-slate-400 mt-2">依服役年資試算</p>
                        <div class="red-ink text-sm right-2 bottom-2 rotate-[-5deg] opacity-80">退休保障</div>
                    </div>

                    <div class="glass-panel p-4 rounded border-t-4 border-orange-500 relative">
                        <div class="absolute right-[-10px] top-[-10px] text-[80px] text-orange-500 opacity-10 rotate-12 font-serif">H</div>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">房產戰略</p>
                        <div id="housing-status-display" class="mt-2">
                            <p class="text-lg font-bold text-slate-500">未啟用購屋模組</p>
                        </div>
                    </div>
                </div>

                <div class="xl:col-span-4 glass-panel p-3 rounded flex flex-col relative">
                    <h4 class="text-xs font-bold text-slate-300 mb-2 border-b border-slate-700 pb-1">首年收支分配 (可支配所得)</h4>
                    <div class="flex-1 relative min-h-[140px]">
                        <canvas id="distributionChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div class="glass-panel p-4 rounded">
                    <h4 class="text-sm font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2 flex justify-between">
                        <span>📊 雙方案資產對照</span>
                        <div class="flex gap-2 text-[10px]">
                            <span class="flex items-center gap-1 text-slate-400"><span class="w-2 h-2 rounded-full bg-blue-500"></span> A</span>
                            <span class="flex items-center gap-1 text-slate-400"><span class="w-2 h-2 rounded-full bg-slate-500"></span> B</span>
                        </div>
                    </h4>
                    <div class="h-60"><canvas id="assetCompareChart"></canvas></div>
                </div>
                
                <div class="glass-panel p-4 rounded">
                    <h4 class="text-sm font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2 flex justify-between">
                        <span>📉 通膨侵蝕分析 (方案A)</span>
                        <span class="text-[10px] text-slate-400">名目 vs 實質</span>
                    </h4>
                    <div class="h-60"><canvas id="inflationChart"></canvas></div>
                </div>
            </div>

            <div class="glass-panel rounded overflow-hidden mb-10 relative">
                <div class="bg-navy-950/50 p-3 border-b border-slate-700">
                    <h4 class="text-white text-sm font-bold font-serif tracking-wide">📑 方案 A 財務明細 (Tactical Log)</h4>
                </div>
                <div class="overflow-x-auto max-h-[500px]">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-navy-900 text-slate-400 font-bold border-b border-slate-700 sticky top-0 z-10">
                            <tr>
                                <th class="px-4 py-3 whitespace-nowrap bg-navy-900">年度</th>
                                <th class="px-4 py-3 whitespace-nowrap bg-navy-900">階級</th>
                                <th class="px-4 py-3 text-right bg-navy-900">稅後年收</th>
                                <th class="px-4 py-3 text-right bg-navy-900">房貸</th>
                                <th class="px-4 py-3 text-right bg-navy-900">總支出</th>
                                <th class="px-4 py-3 text-right bg-navy-900">總投資</th>
                                <th class="px-4 py-3 text-right bg-navy-900">現金流</th>
                                <th class="px-4 py-3 text-right bg-navy-900">淨資產</th>
                            </tr>
                        </thead>
                        <tbody id="event-log-body" class="divide-y divide-slate-800 font-mono text-slate-300"></tbody>
                    </table>
                </div>
                <div class="red-ink text-lg right-10 top-2 rotate-[5deg] z-20 text-white opacity-90">關鍵數據</div>
            </div>
        </main>
    </div>

    <div id="reportModal" class="fixed inset-0 modal-bg hidden z-50 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-[scaleIn_0.3s_ease-out]">
            <div class="bg-navy-950 p-4 flex justify-between items-center border-b border-gold">
                <h3 class="text-gold font-bold text-lg flex items-center gap-2">
                    <span>📑</span> 決策分析報告 (Decision Report)
                </h3>
                <button onclick="closeReport()" class="text-slate-400 hover:text-white">✕</button>
            </div>
            <div class="p-6 overflow-y-auto max-h-[70vh]">
                <div id="reportContent" class="space-y-4 text-sm text-slate-300 leading-relaxed"></div>
            </div>
            <div class="p-4 bg-navy-900 border-t border-slate-700 flex justify-end">
                <button onclick="closeReport()" class="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition">關閉</button>
            </div>
        </div>
    </div>

    <script>
        // 1. Data Config
        const REAL_SALARY_STRUCTURE = {
            'S2': { rank: '少尉', base: 22750, pro_add: 28000, promotion_years: 1, annual_growth: 0.015, max_years: 12 }, 
            'S3': { rank: '中尉', base: 25050, pro_add: 30000, promotion_years: 3, annual_growth: 0.015, max_years: 12 },
            'S4': { rank: '上尉', base: 28880, pro_add: 35000, promotion_years: 4, annual_growth: 0.015, max_years: 17 }, 
            'M1': { rank: '少校', base: 32710, pro_add: 45000, promotion_years: 4, annual_growth: 0.015, max_years: 22 }, 
            'M2': { rank: '中校', base: 37310, pro_add: 55000, promotion_years: 4, annual_growth: 0.015, max_years: 26 }, 
            'M3': { rank: '上校', base: 41900, pro_add: 65000, promotion_years: 6, annual_growth: 0.015, max_years: 30 }, 
            'G1': { rank: '少將', base: 48030, pro_add: 70000, promotion_years: 4, annual_growth: 0.01, max_years: 35 }
        };
        const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1'];
        const VOLUNTEER_ADDITION = 15000;
        const PENSION_RATE = 0.14; 
        const INDIVIDUAL_PENSION_RATIO = 0.35; 

        let currentScenario = 'A';
        let scenarioData = { A: {}, B: {} };
        let charts = {};
        let counters = { allow: 0, exp: 0, inv: 0 };
        let currentResult = null; 

        // 2. Init
        function initScenarioStore() {
            const defaultParams = {
                targetRank: 'M2', serviceYears: 20, inflationRate: 2.0, salaryRaiseRate: 1.0, returnRate: 6.0,
                buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
                investSliderPct: 30,
                allowances: [{val: 0, start: 1, end: 20, name: '無加給'}], 
                expenses: [{name: '基本開銷', val: 12000}, {name: '房租', val: 6000}],
                investments: [{name: '儲蓄險', val: 3000}]
            };
            scenarioData.A = JSON.parse(JSON.stringify(defaultParams));
            scenarioData.B = JSON.parse(JSON.stringify(defaultParams));
            scenarioData.B.serviceYears = 25;
            scenarioData.B.returnRate = 4.0;
            scenarioData.B.investSliderPct = 40;
        }

        // 3. Air Force Preset
        function applyAirForcePreset() {
            document.getElementById('custom-allowances-container').innerHTML = '';
            addCustomAllowance({name: '空勤加給(初)', val: 20000, start: 1, end: 5}, true);
            addCustomAllowance({name: '空勤加給(中)', val: 40000, start: 6, end: 15}, true);
            addCustomAllowance({name: '空勤加給(高)', val: 60000, start: 16, end: 25}, false); 
        }

        // 4. Scenario Switching
        function switchScenario(scen) {
            saveInputsToMemory(currentScenario);
            currentScenario = scen;
            document.getElementById('current-scen-label').innerText = `EDITING: ${scen}`;
            const btnA = document.getElementById('btn-scen-A');
            const btnB = document.getElementById('btn-scen-B');
            const activeClass = "py-2 text-xs font-bold rounded-sm text-white bg-airforce shadow transition flex items-center justify-center gap-2 border border-blue-500/50";
            const inactiveClass = "py-2 text-xs font-bold rounded-sm text-slate-500 hover:text-slate-300 transition flex items-center justify-center gap-2 border border-slate-700";
            if(scen === 'A') { btnA.className = activeClass; btnB.className = inactiveClass; } 
            else { btnB.className = activeClass; btnA.className = inactiveClass; }
            loadMemoryToInputs(scen);
            orchestrateSimulation();
        }

        // 5. Data Handling
        function collectList(className, valClass) {
            const arr = [];
            document.querySelectorAll('.' + className).forEach(row => {
                const name = row.querySelector('.item-name')?.value || '';
                const val = parseInt(row.querySelector('.' + valClass).value) || 0;
                const start = row.querySelector('.allow-start') ? parseInt(row.querySelector('.allow-start').value) : 0;
                const end = row.querySelector('.allow-end') ? parseInt(row.querySelector('.allow-end').value) : 99;
                if(className === 'allowance-row') arr.push({val, start, end, name});
                else arr.push({name, val});
            });
            return arr;
        }

        function saveInputsToMemory(scen) {
            scenarioData[scen] = {
                targetRank: document.getElementById('targetRank').value,
                serviceYears: document.getElementById('serviceYears').value,
                inflationRate: document.getElementById('inflationRate').value,
                salaryRaiseRate: document.getElementById('salaryRaiseRate').value,
                returnRate: document.getElementById('returnRate').value,
                buyHouseToggle: document.getElementById('buyHouseToggle').checked,
                buyYear: document.getElementById('buyYear').value,
                housePriceWan: document.getElementById('housePriceWan').value,
                downPaymentPct: document.getElementById('downPaymentPct').value,
                mortgageRate: document.getElementById('mortgageRate').value,
                loanTerm: document.getElementById('loanTerm').value,
                houseAppreciation: document.getElementById('houseAppreciation').value,
                investSliderPct: document.getElementById('investSlider').value,
                allowances: collectList('allowance-row', 'allow-val'),
                expenses: collectList('expense-row', 'exp-val'),
                investments: collectList('invest-row', 'inv-val')
            };
        }

        function loadMemoryToInputs(scen) {
            const data = scenarioData[scen];
            if(!data) return;
            const fields = ['targetRank', 'serviceYears', 'inflationRate', 'salaryRaiseRate', 'returnRate', 'buyYear', 'housePriceWan', 'downPaymentPct', 'mortgageRate', 'loanTerm', 'houseAppreciation', 'investSlider'];
            fields.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = data[id==='investSlider'?'investSliderPct':id]; });
            
            const toggle = document.getElementById('buyHouseToggle');
            const hInputs = document.getElementById('housing-inputs');
            toggle.checked = data.buyHouseToggle;
            if(toggle.checked) hInputs.classList.remove('hidden'); else hInputs.classList.add('hidden');

            updateSliderDisplay(); 

            document.getElementById('custom-allowances-container').innerHTML = '';
            (data.allowances || []).forEach(a => addCustomAllowance(a, true));
            document.getElementById('expense-items-container').innerHTML = '';
            (data.expenses || []).forEach(a => addExpenseItem(a, true));
            document.getElementById('invest-items-container').innerHTML = '';
            (data.investments || []).forEach(a => addInvestItem(a, true));
        }

        // 6. Logic
        function updateSliderDisplay() {
            const val = document.getElementById('investSlider').value;
            document.getElementById('slider-percent-display').innerText = val + '%';
            orchestrateSimulation();
        }

        function setRisk(level) {
            const el = document.getElementById('returnRate');
            if(level === 'low') el.value = 1.5; if(level === 'mid') el.value = 5.0; if(level === 'high') el.value = 9.0;
            orchestrateSimulation();
        }

        function toggleHousingModule() {
            const isChecked = document.getElementById('buyHouseToggle').checked;
            const inputs = document.getElementById('housing-inputs');
            if (isChecked) inputs.classList.remove('hidden'); else inputs.classList.add('hidden');
            orchestrateSimulation();
        }

        function createRowHtml(id, type, data) {
            const name = data?.name || (type === 'exp' ? '固定支出' : (type === 'inv' ? '定期定額' : '加給'));
            const val = data?.val || 0; 
            const valClass = type === 'exp' ? 'exp-val' : (type === 'inv' ? 'inv-val' : 'allow-val');
            const rowClass = type === 'exp' ? 'expense-row' : (type === 'inv' ? 'invest-row' : 'allowance-row');
            
            let extra = '';
            if(type === 'allow') {
                const s = data?.start || 1; const e = data?.end || 20;
                extra = `<div class="col-span-2"><input type="number" value="${s}" class="w-full bg-navy-900 border border-navy-700 text-white px-1 text-center allow-start text-[10px]"></div><div class="col-span-2"><input type="number" value="${e}" class="w-full bg-navy-900 border border-navy-700 text-white px-1 text-center allow-end text-[10px]"></div>`;
            }
            return `<div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-[10px] bg-navy-800 p-1 rounded-sm ${rowClass} border border-navy-700"><div class="col-span-${type==='allow'?4:7}"><input type="text" value="${name}" class="w-full bg-transparent border-b border-slate-600 px-1 item-name text-slate-300"></div><div class="col-span-3"><input type="number" value="${val}" class="w-full bg-transparent border-b border-slate-600 px-1 text-right ${valClass} text-white"></div>${extra}<div class="col-span-${type==='allow'?1:2} text-center"><button onclick="document.getElementById('${id}').remove(); orchestrateSimulation()" class="text-red-400 hover:text-red-300 font-bold">×</button></div></div>`;
        }

        function addCustomAllowance(d, skipSim=false){ counters.allow++; document.getElementById('custom-allowances-container').insertAdjacentHTML('beforeend', createRowHtml(`allow-${counters.allow}`, 'allow', d)); if(!skipSim) orchestrateSimulation(); }
        function addExpenseItem(d, skipSim=false){ counters.exp++; document.getElementById('expense-items-container').insertAdjacentHTML('beforeend', createRowHtml(`exp-${counters.exp}`, 'exp', d)); if(!skipSim) orchestrateSimulation(); }
        function addInvestItem(d, skipSim=false){ counters.inv++; document.getElementById('invest-items-container').insertAdjacentHTML('beforeend', createRowHtml(`inv-${counters.inv}`, 'inv', d)); if(!skipSim) orchestrateSimulation(); }

        // --- Core Simulation ---
        function calculateScenarioData(params) {
            const p = {
                targetRank: params.targetRank,
                years: parseInt(params.serviceYears) || 20,
                inflation: parseFloat(params.inflationRate)/100 || 0.02,
                raise: parseFloat(params.salaryRaiseRate)/100 || 0.01,
                returnRate: parseFloat(params.returnRate)/100 || 0.06,
                buyHouse: params.buyHouseToggle,
                buyYear: parseInt(params.buyYear) || 99,
                housePrice: (parseInt(params.housePriceWan) || 0) * 10000,
                downPct: parseFloat(params.downPaymentPct)/100 || 0.2,
                mortgageRate: parseFloat(params.mortgageRate)/100 || 0.022,
                loanTerm: parseInt(params.loanTerm) || 30,
                houseGrowth: parseFloat(params.houseAppreciation)/100 || 0.015,
                investSliderPct: parseFloat(params.investSliderPct)/100 || 0,
                allowances: params.allowances || [],
                expenses: params.expenses || [],
                investments: params.investments || []
            };

            const baseMonthlyExp = p.expenses.reduce((sum, item) => sum + (item.val || 0), 0);
            const baseFixedInv = p.investments.reduce((sum, item) => sum + (item.val || 0), 0);

            let currentRank = 'S2', yearOfRank = 0, forceRetired = false;
            let liquidAsset = 0, houseValue = 0, loanBalance = 0, monthlyMortgagePayment = 0, hasBoughtHouse = false;
            const targetIdx = RANK_ORDER.indexOf(p.targetRank);
            const history = { labels: [], netAsset: [], realAsset: [], logs: [], house: [], loan: [] };
            
            let firstYearExp = 0, firstYearInv = 0, firstYearNet = 0;

            for (let y = 1; y <= p.years; y++) {
                if (y > REAL_SALARY_STRUCTURE[currentRank].max_years) { forceRetired = true; break; }
                const rankIdx = RANK_ORDER.indexOf(currentRank);
                if (yearOfRank >= REAL_SALARY_STRUCTURE[currentRank].promotion_years && rankIdx < targetIdx) { currentRank = RANK_ORDER[rankIdx + 1]; yearOfRank = 0; }

                const rankData = REAL_SALARY_STRUCTURE[currentRank];
                const base = (rankData.base + rankData.pro_add) * Math.pow(1 + rankData.annual_growth, y - 1) * Math.pow(1 + p.raise, y - 1);
                
                // Allowances
                let allowance = 0; 
                p.allowances.forEach(a => { if(y >= a.start && y <= a.end) allowance += (a.val || 0); });
                
                // Income Calc (No Food Add)
                const gross = base + VOLUNTEER_ADDITION + allowance;
                const netMonthly = Math.round(gross * (1 - PENSION_RATE * INDIVIDUAL_PENSION_RATIO));
                
                // Housing
                let yearMortgageCost = 0;
                if (p.buyHouse && y === p.buyYear && !hasBoughtHouse) {
                    hasBoughtHouse = true; houseValue = p.housePrice;
                    const downPay = Math.round(p.housePrice * p.downPct);
                    loanBalance = p.housePrice - downPay; liquidAsset -= downPay;
                    const r = p.mortgageRate/12, n = p.loanTerm*12;
                    monthlyMortgagePayment = (r>0) ? Math.round(loanBalance*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1)) : Math.round(loanBalance/n);
                }
                if (hasBoughtHouse) {
                    houseValue = Math.round(houseValue * (1 + p.houseGrowth));
                    if (loanBalance > 0) { yearMortgageCost = monthlyMortgagePayment * 12; loanBalance -= (yearMortgageCost - (loanBalance * p.mortgageRate)); if(loanBalance < 0) loanBalance = 0; }
                }

                // Investment & Expense
                const dynamicInvest = netMonthly * p.investSliderPct; 
                const totalMonthlyInv = dynamicInvest + baseFixedInv; 
                const currentMonthlyExp = baseMonthlyExp * Math.pow(1 + p.inflation, y - 1);

                if(y === 1) {
                    firstYearExp = currentMonthlyExp;
                    firstYearInv = totalMonthlyInv;
                    firstYearNet = netMonthly;
                }

                const annualIncome = netMonthly * 13.5;
                const annualExpense = currentMonthlyExp * 12;
                const annualInvest = totalMonthlyInv * 12;
                const netCashFlow = annualIncome - annualExpense - annualInvest - yearMortgageCost;

                liquidAsset = liquidAsset * (1 + p.returnRate) + annualInvest + netCashFlow;
                const netAsset = liquidAsset + houseValue - loanBalance;

                history.labels.push(`Y${y}`);
                history.netAsset.push(Math.round(netAsset));
                history.realAsset.push(Math.round(netAsset / Math.pow(1 + p.inflation, y)));
                history.house.push(Math.round(houseValue));
                history.loan.push(Math.round(loanBalance));
                history.logs.push({ y, rank: REAL_SALARY_STRUCTURE[currentRank].rank, income: annualIncome, mortgage: yearMortgageCost, cashflow: netCashFlow, netAsset, invest: annualInvest, expense: annualExpense });
                yearOfRank++;
            }
            
            let pension = 0;
            if (history.labels.length >= 20) {
                pension = Math.round(REAL_SALARY_STRUCTURE[currentRank].base * Math.pow(1.015, history.labels.length-1) * 2 * (0.55 + (history.labels.length - 20) * 0.02));
            }
            return { history, pension, params: p, firstYearExp, firstYearInv, firstYearNet };
        }

        // --- 7. Report Generation ---
        function generateReport() {
            const res = currentResult; // Use stored result
            if(!res) return;
            const h = res.history;
            const last = h.netAsset.length - 1;
            const netAsset = h.netAsset[last];
            const monthlySaveRate = Math.round((res.firstYearInv / res.firstYearNet) * 100);
            
            let analysis = `
                <div class="border-b border-slate-700 pb-2 mb-4">
                    <h4 class="font-bold text-gold text-lg">戰略評估報告 (Assessment)</h4>
                    <p class="text-2xl font-black mt-2 ${netAsset > 0 ? 'text-green-400' : 'text-red-500'}">
                        ${netAsset > 0 ? 'STATUS: HEALTHY (財務健康)' : 'STATUS: CRITICAL (財務赤字)'}
                    </p>
                </div>
                <div class="space-y-4">
                    <div class="bg-slate-800 p-3 rounded-sm border-l-2 border-blue-500">
                        <span class="font-bold text-slate-300 block mb-1">儲蓄率分析 (Savings Rate)</span>
                        目前首年儲蓄率約 <span class="font-bold text-blue-400 text-lg">${monthlySaveRate}%</span>。
                        ${monthlySaveRate < 20 ? '建議提升至 30% 以上以應對未來風險。' : '儲蓄習慣良好，請保持戰力。'}
                    </div>
                    <div class="bg-slate-800 p-3 rounded-sm border-l-2 border-gold">
                        <span class="font-bold text-slate-300 block mb-1">資產預測 (Projection)</span>
                        預計 ${res.params.years} 年後，您的名目淨資產將達到 <span class="font-bold text-gold text-lg">${formatMoney(netAsset)}</span>。
                        但考慮通膨後，實質購買力約為 ${formatMoney(h.realAsset[last])}。
                    </div>
                    ${res.params.buyHouse ? `
                    <div class="bg-slate-800 p-3 rounded-sm border-l-2 border-orange-500">
                        <span class="font-bold text-slate-300 block mb-1">購屋評估 (Housing)</span>
                        您設定了 ${res.params.housePrice/10000} 萬的房產。
                        ${h.logs[10] && h.logs[10].cashflow < 0 ? '<span class="text-red-400 font-bold">警告：購屋後現金流出現轉負風險，建議降低總價或延後購屋。</span>' : '現金流尚可支撐房貸壓力。'}
                    </div>` : ''}
                </div>
            `;
            
            document.getElementById('reportContent').innerHTML = analysis;
            document.getElementById('reportModal').classList.remove('hidden');
        }

        function closeReport() {
            document.getElementById('reportModal').classList.add('hidden');
        }

        // --- 8. Core UI Update ---
        function orchestrateSimulation() {
            saveInputsToMemory(currentScenario);
            const resA = calculateScenarioData(scenarioData.A);
            const resB = calculateScenarioData(scenarioData.B);
            
            currentResult = (currentScenario === 'A') ? resA : resB;
            
            updateUI(currentResult, (currentScenario === 'A') ? resB : resA);
        }
        function forceRefresh() { orchestrateSimulation(); }

        function updateUI(res, compareRes) {
            const h = res.history; const last = h.netAsset.length - 1;
            
            document.getElementById('total-expense-display').innerText = formatMoney(res.firstYearExp);
            document.getElementById('total-invest-display').innerText = formatMoney(res.firstYearInv);
            
            const diff = h.netAsset[last] - compareRes.history.netAsset[compareRes.history.netAsset.length - 1];
            document.getElementById('total-asset').innerText = formatMoney(h.netAsset[last]);
            document.getElementById('comp-asset').innerHTML = `與方案 ${currentScenario==='A'?'B':'A'} 差異: <span class="${diff>=0?'text-success':'text-alert'} font-bold">${(diff>=0?'+':'') + formatMoney(diff)}</span>`;
            document.getElementById('pension-monthly').innerText = res.pension > 0 ? formatMoney(res.pension) : "未達門檻";
            
            const hDiv = document.getElementById('housing-status-display');
            if (res.params.buyHouse) hDiv.innerHTML = `<div class="mt-2 text-xs text-slate-400 space-y-1"><div class="flex justify-between"><span>市值:</span> <span class="font-bold text-orange-400">${formatMoney(h.house[last])}</span></div><div class="flex justify-between"><span>剩貸:</span> <span class="font-bold text-red-400">-${formatMoney(h.loan[last])}</span></div></div>`;
            else hDiv.innerHTML = `<p class="text-xl font-bold text-slate-500 mt-2">未啟用</p>`;

            const negYears = h.logs.filter(l => l.netAsset < 0).length;
            const sb = document.getElementById('status-bar');
            if(negYears>0) { sb.classList.remove('hidden'); document.getElementById('warn-scen').innerText = currentScenario; } else sb.classList.add('hidden');

            const tbody = document.getElementById('event-log-body'); tbody.innerHTML = '';
            h.logs.forEach(l => tbody.insertAdjacentHTML('beforeend', `<tr class="hover:bg-slate-800 transition border-b border-slate-800"><td class="px-4 py-3 text-slate-500">Y${l.y}</td><td class="px-4 py-3 font-bold text-slate-200">${l.rank}</td><td class="px-4 py-3 text-right text-slate-300">${formatMoney(l.income)}</td><td class="px-4 py-3 text-right text-orange-400">${formatMoney(l.mortgage)}</td><td class="px-4 py-3 text-right text-slate-500">${formatMoney(l.expense)}</td><td class="px-4 py-3 text-right text-green-400">${formatMoney(l.invest)}</td><td class="px-4 py-3 text-right font-bold ${l.cashflow<0?'text-red-500':'text-blue-400'}">${formatMoney(l.cashflow)}</td><td class="px-4 py-3 text-right font-bold text-white">${formatMoney(l.netAsset)}</td></tr>`));

            renderCharts(res, compareRes);
        }

        function renderCharts(res, compRes) {
            Chart.defaults.font.family = '"JetBrains Mono", "Noto Sans TC", sans-serif';
            Chart.defaults.color = '#94a3b8';
            const h = res.history; const ch = compRes.history;

            if (charts.compare) charts.compare.destroy();
            const ctx1 = document.getElementById('assetCompareChart').getContext('2d');
            charts.compare = new Chart(ctx1, { type: 'line', data: { labels: h.labels, datasets: [{ label: `方案 ${currentScenario}`, data: h.netAsset, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, fill: true, tension: 0.3, pointRadius: 0 }, { label: `方案 ${currentScenario==='A'?'B':'A'}`, data: ch.netAsset, borderColor: '#64748b', borderWidth: 2, borderDash: [5,5], fill: false, tension: 0.3, pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#334155' } }, y: { grid: { color: '#334155' } } } } });

            if (charts.inflation) charts.inflation.destroy();
            const ctx2 = document.getElementById('inflationChart').getContext('2d');
            charts.inflation = new Chart(ctx2, { type: 'line', data: { labels: h.labels, datasets: [{ label: '名目', data: h.netAsset, borderColor: '#cbd5e1', borderWidth: 2, pointRadius: 0 }, { label: '實質', data: h.realAsset, borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 2, fill: true, pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { grid: { color: '#334155' } }, y: { grid: { color: '#334155' } } } } });

            if (charts.distribution) charts.distribution.destroy();
            const ctx3 = document.getElementById('distributionChart').getContext('2d');
            const totalIn = res.firstYearNet;
            const exp = res.firstYearExp;
            const inv = res.firstYearInv;
            const remain = Math.max(0, totalIn - exp - inv);
            charts.distribution = new Chart(ctx3, { type: 'doughnut', data: { labels: ['生活支出', '投資理財', '現金結餘'], datasets: [{ data: [exp, inv, remain], backgroundColor: ['#3b82f6', '#10b981', '#64748b'], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 }, color: '#cbd5e1' } } } } });
        }

        function formatMoney(n) { return (isNaN(n) ? '--' : (n<0?'-':'')+'$'+Math.abs(Math.round(n)).toLocaleString('zh-TW')); }
        function exportCSV() {
            let csv = "\uFEFF年度,階級,稅後年收,房貸支出,總支出,總投資,現金流結餘,淨資產\n";
            document.querySelectorAll('#event-log-body tr').forEach(r => csv += Array.from(r.querySelectorAll('td')).map(c => c.innerText.replace(/[$,]/g, '')).join(',') + "\n");
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8;'})); a.download = 'report.csv'; a.click();
        }

        document.addEventListener('DOMContentLoaded', () => {
            initScenarioStore(); loadMemoryToInputs('A'); orchestrateSimulation();
            document.body.addEventListener('input', (e) => { if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT') orchestrateSimulation(); });
        });
    </script>
</body>
</html>
