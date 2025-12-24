<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>軍人職涯薪資規劃決策支援系統 | v3.1 戰術儀表板 (Final)</title>
    
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
                        navy: { 900: '#0f172a', 800: '#1e293b', 700: '#334155', 600: '#475569' },
                        gold: { DEFAULT: '#d4af37', light: '#fcd34d' },
                        alert: '#ef4444',
                        success: '#10b981',
                    },
                    fontFamily: {
                        sans: ['"Noto Sans TC"', 'sans-serif'],
                        serif: ['"Noto Serif TC"', 'serif'],
                        mono: ['"JetBrains Mono"', 'monospace'],
                        hand: ['"Ma Shan Zheng"', 'cursive'],
                    },
                    boxShadow: {
                        'tactical': '0 4px 6px -1px rgba(15, 23, 42, 0.3), 0 2px 4px -1px rgba(15, 23, 42, 0.15)',
                        'glow': '0 0 10px rgba(212, 175, 55, 0.3)',
                    }
                }
            }
        }
    </script>
    <style>
        body { background-color: #f1f5f9; color: #1e293b; overflow: hidden; }
        
        /* 自定義捲軸 */
        .scroller { scrollbar-width: thin; scrollbar-color: #475569 #0f172a; }
        .scroller::-webkit-scrollbar { width: 6px; }
        .scroller::-webkit-scrollbar-track { background: #0f172a; }
        .scroller::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 3px; }

        /* 紅墨水動畫 */
        @keyframes floatInk { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-3px) rotate(-1deg); } }
        .red-ink { 
            font-family: 'Ma Shan Zheng', cursive; 
            color: #dc2626; 
            position: absolute; 
            z-index: 50; 
            pointer-events: none; 
            text-shadow: 1px 1px 0px rgba(255,255,255,0.8);
            animation: floatInk 4s ease-in-out infinite;
        }
        .ink-circle { border: 2px solid #dc2626; border-radius: 95% 4% 92% 5% / 4% 95% 6% 95%; position: absolute; z-index: 49; pointer-events: none; opacity: 0.8; }
        .ink-arrow { position: absolute; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 15px solid #dc2626; transform: rotate(150deg); z-index: 49; pointer-events: none;}

        /* 輸入元件優化 */
        input[type=number], select { background-color: #1e293b; border: 1px solid #475569; color: white; transition: all 0.2s; }
        input[type=number]:focus, select:focus { border-color: #d4af37; outline: none; box-shadow: 0 0 5px rgba(212, 175, 55, 0.5); }
        
        /* Slider */
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #d4af37; cursor: pointer; margin-top: -7px; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 4px; background: #475569; border-radius: 2px; }
        
        .card { background: white; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .stat-value { font-family: 'JetBrains Mono', monospace; font-weight: 700; }
    </style>
</head>
<body class="flex flex-col h-screen">

    <header class="bg-navy-900 h-16 flex items-center justify-between px-6 border-b-2 border-gold shadow-tactical z-30 shrink-0">
        <div class="flex items-center gap-4 relative">
            <div class="w-10 h-10 bg-gradient-to-br from-gold to-yellow-600 rounded flex items-center justify-center text-navy-900 font-serif font-black text-xl shadow-glow">
                DSS
            </div>
            <div>
                <h1 class="text-white text-lg font-bold tracking-widest uppercase">軍人職涯薪資規劃決策支援系統</h1>
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p class="text-slate-400 text-[10px] tracking-[0.2em] font-mono">SYSTEM ONLINE | v3.1</p>
                </div>
            </div>
            <div class="red-ink text-xl -right-20 top-8 rotate-[-5deg]">極機密</div>
            <div class="ink-circle w-28 h-10 -right-24 top-6 rotate-[-2deg]"></div>
        </div>
        <div class="flex items-center gap-3">
            <button onclick="exportCSV()" class="bg-navy-800 hover:bg-navy-700 text-gold border border-gold/30 px-4 py-1.5 rounded text-xs font-bold transition flex items-center gap-2 group">
                <span>📥</span> <span class="group-hover:text-white transition">匯出決策報表</span>
            </button>
        </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
        
        <aside class="w-[400px] bg-navy-900 border-r border-navy-700 flex flex-col z-20 shadow-2xl shrink-0">
            <div class="p-4 border-b border-navy-800 bg-navy-900/50 backdrop-blur">
                <div class="grid grid-cols-2 gap-1 bg-navy-800 p-1 rounded">
                    <button onclick="switchScenario('A')" id="btn-scen-A" class="py-2 text-xs font-bold rounded text-white bg-blue-600 shadow transition flex items-center justify-center gap-2">
                        <span>A</span> 主方案 (Main)
                    </button>
                    <button onclick="switchScenario('B')" id="btn-scen-B" class="py-2 text-xs font-bold rounded text-slate-400 hover:text-white transition flex items-center justify-center gap-2">
                        <span>B</span> 對照組 (Comp)
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto scroller p-4 space-y-6 relative">
                
                <div class="space-y-3 relative">
                    <h3 class="text-gold text-xs font-bold uppercase tracking-wider border-l-2 border-gold pl-2">01. 階級與年資參數</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] text-slate-400 block mb-1">目標階級</label>
                            <select id="targetRank" class="w-full text-sm p-1.5 rounded bg-navy-800 border-navy-600">
                                <option value="S2">少尉 (S2)</option>
                                <option value="S3">中尉 (S3)</option>
                                <option value="S4">上尉 (S4)</option>
                                <option value="M1">少校 (M1)</option>
                                <option value="M2">中校 (M2)</option>
                                <option value="M3">上校 (M3)</option>
                                <option value="G1">少將 (G1)</option>
                                <option value="G2">中將 (G2)</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400 block mb-1">服役年數</label>
                            <input type="number" id="serviceYears" value="20" class="w-full text-sm p-1.5 rounded bg-navy-800 border-navy-600 text-center">
                        </div>
                    </div>
                    <div class="red-ink text-sm right-2 top-8 rotate-[15deg]">目標設高!</div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] text-slate-400 block mb-1">年通膨率 (%)</label>
                            <input type="number" id="inflationRate" value="2.0" step="0.1" class="w-full text-sm p-1.5 rounded bg-navy-800 border-red-900/50 text-red-400 text-center">
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-400 block mb-1">軍職調薪率 (%)</label>
                            <input type="number" id="salaryRaiseRate" value="1.0" step="0.1" class="w-full text-sm p-1.5 rounded bg-navy-800 border-blue-900/50 text-blue-400 text-center">
                        </div>
                    </div>
                    
                    <div id="custom-allowances-container" class="space-y-2 pt-2"></div>
                    <button onclick="addCustomAllowance()" class="w-full py-1 border border-dashed border-slate-600 text-slate-500 text-[10px] rounded hover:bg-navy-800 hover:text-slate-300 transition">
                        + 新增職務/外島加給
                    </button>
                </div>

                <div class="space-y-3 relative">
                    <h3 class="text-blue-400 text-xs font-bold uppercase tracking-wider border-l-2 border-blue-500 pl-2 flex justify-between">
                        02. 生活消費明細
                        <span class="text-white font-mono" id="total-expense-display">--</span>
                    </h3>
                    <div id="expense-items-container" class="space-y-2"></div>
                    <button onclick="addExpenseItem()" class="w-full py-1 border border-dashed border-slate-600 text-slate-500 text-[10px] rounded hover:bg-navy-800 hover:text-slate-300 transition">
                        + 新增支出 (自動通膨)
                    </button>
                    <div class="red-ink text-lg right-0 top-12 rotate-[-5deg]">省點花!</div>
                </div>

                <div class="space-y-3 relative">
                    <h3 class="text-green-400 text-xs font-bold uppercase tracking-wider border-l-2 border-green-500 pl-2 flex justify-between">
                        03. 投資理財配置
                        <span class="text-white font-mono" id="total-invest-display">--</span>
                    </h3>
                    
                    <div class="bg-navy-800 p-3 rounded border border-navy-700 relative overflow-hidden group">
                        <div class="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                        <div class="flex justify-between items-end mb-2 relative z-10">
                            <label class="text-[11px] font-bold text-green-400">薪資提撥比例</label>
                            <span id="slider-percent-display" class="text-xl font-mono font-bold text-white">30%</span>
                        </div>
                        <input type="range" id="investSlider" min="0" max="90" step="1" value="30" class="w-full relative z-10" oninput="updateSliderDisplay()">
                        <div class="flex justify-between text-[9px] text-slate-500 mt-1">
                            <span>0%</span>
                            <span>月薪佔比 (隨薪資成長)</span>
                            <span>90%</span>
                        </div>
                        <div class="red-ink text-xl left-2 top-8 rotate-[-10deg] opacity-90">重點!</div>
                        <div class="ink-circle w-20 h-12 left-0 top-6 border-red-500"></div>
                    </div>

                    <p class="text-[10px] text-slate-500">額外固定金額投資</p>
                    <div id="invest-items-container" class="space-y-2"></div>
                    <button onclick="addInvestItem()" class="w-full py-1 border border-dashed border-slate-600 text-slate-500 text-[10px] rounded hover:bg-navy-800 hover:text-slate-300 transition">
                        + 新增固定項目
                    </button>

                    <div class="bg-navy-800 p-2 rounded border border-navy-700 flex items-center justify-between">
                        <label class="text-[10px] text-slate-400">年化報酬率</label>
                        <div class="flex gap-2">
                            <input type="number" id="returnRate" value="6.0" step="0.5" class="w-14 text-center text-sm p-1 rounded bg-navy-900 border-navy-600 font-bold text-blue-400">
                            <div class="flex gap-0.5">
                                <button onclick="setRisk('low')" class="px-2 py-1 text-[9px] bg-navy-700 hover:bg-navy-600 text-slate-300 rounded-l">保</button>
                                <button onclick="setRisk('mid')" class="px-2 py-1 text-[9px] bg-navy-700 hover:bg-navy-600 text-blue-300">穩</button>
                                <button onclick="setRisk('high')" class="px-2 py-1 text-[9px] bg-navy-700 hover:bg-navy-600 text-red-300 rounded-r">衝</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-3 relative">
                    <div class="flex justify-between items-center">
                        <h3 class="text-orange-400 text-xs font-bold uppercase tracking-wider border-l-2 border-orange-500 pl-2">04. 購屋戰略模組</h3>
                        <label class="inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="buyHouseToggle" class="sr-only peer" onchange="toggleHousingModule()">
                            <div class="w-9 h-5 bg-navy-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                    </div>
                    <div id="housing-inputs" class="space-y-2 hidden transition-all">
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[9px] text-slate-500">購屋年(N)</label><input type="number" id="buyYear" value="10" class="w-full text-xs p-1.5 rounded bg-navy-800 border-navy-600"></div>
                            <div><label class="text-[9px] text-slate-500">總價(萬)</label><input type="number" id="housePriceWan" value="1500" class="w-full text-xs p-1.5 rounded bg-navy-800 border-navy-600 text-orange-400 font-bold"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[9px] text-slate-500">頭期(%)</label><input type="number" id="downPaymentPct" value="20" class="w-full text-xs p-1.5 rounded bg-navy-800 border-navy-600"></div>
                            <div><label class="text-[9px] text-slate-500">利率(%)</label><input type="number" id="mortgageRate" value="2.2" step="0.1" class="w-full text-xs p-1.5 rounded bg-navy-800 border-navy-600"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[9px] text-slate-500">年限(年)</label><input type="number" id="loanTerm" value="30" class="w-full text-xs p-1.5 rounded bg-navy-800 border-navy-600"></div>
                            <div><label class="text-[9px] text-slate-500">增值(%)</label><input type="number" id="houseAppreciation" value="1.5" step="0.1" class="w-full text-xs p-1.5 rounded bg-navy-800 border-navy-600"></div>
                        </div>
                    </div>
                    <div class="red-ink text-sm right-10 top-0 rotate-[5deg]">慎重!</div>
                </div>

                <div class="h-10"></div> </div>
        </aside>

        <main class="flex-1 overflow-y-auto scroller bg-slate-100 p-6 relative">
            
            <div id="status-bar" class="hidden mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded shadow-sm flex items-start animate-pulse relative">
                <span class="text-xl mr-3">⚠️</span>
                <div>
                    <h4 class="font-bold text-red-800 text-sm">戰略風險警告 (方案 <span id="warn-scen">A</span>)</h4>
                    <p class="text-red-600 text-xs">偵測到財務赤字，請調整支出或投資策略。</p>
                </div>
                <div class="red-ink text-xl right-20 top-2 rotate-[-5deg]">注意赤字!</div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6">
                
                <div class="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="card p-4 border-t-4 border-gold relative overflow-hidden">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">預估淨資產 (方案A)</p>
                        <div class="flex items-baseline gap-2 mt-1">
                            <p id="total-asset" class="text-2xl stat-value text-navy-900">--</p>
                            <span class="text-[10px] bg-slate-100 px-1 rounded text-slate-500">名目</span>
                        </div>
                        <p id="comp-asset" class="text-xs text-slate-400 mt-2">--</p>
                        <div class="red-ink text-2xl right-2 top-8 rotate-[10deg]">夠了嗎?</div>
                        <div class="ink-circle w-24 h-16 right-0 top-6"></div>
                    </div>

                    <div class="card p-4 border-t-4 border-green-500 relative">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">終身俸 (月退)</p>
                        <div class="flex items-baseline gap-2 mt-1">
                            <p id="pension-monthly" class="text-2xl stat-value text-green-600">--</p>
                        </div>
                        <p class="text-[10px] text-slate-400 mt-2">以目前本俸為基準</p>
                        <div class="red-ink text-sm right-2 bottom-2 rotate-[-5deg]">養老命脈</div>
                    </div>

                    <div class="card p-4 border-t-4 border-orange-500 relative">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">房產戰略</p>
                        <div id="housing-status-display" class="mt-1">
                            <p class="text-lg font-bold text-slate-300">未啟用</p>
                        </div>
                    </div>
                </div>

                <div class="xl:col-span-4 card p-3 flex flex-col relative">
                    <h4 class="text-xs font-bold text-navy-900 mb-2">首年收支分配 (月)</h4>
                    <div class="flex-1 relative min-h-[140px]">
                        <canvas id="distributionChart"></canvas>
                    </div>
                    <div class="red-ink text-sm left-0 bottom-2 rotate-[5deg] z-10">錢去哪了?</div>
                    <div class="ink-arrow left-10 bottom-6 rotate-[45deg] z-10"></div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div class="card p-4 relative">
                    <h4 class="text-sm font-bold text-navy-900 mb-4 border-b pb-2 flex justify-between">
                        <span>📊 雙方案資產對照</span>
                        <div class="flex gap-2 text-[10px]">
                            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-600"></span> A</span>
                            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-slate-400"></span> B</span>
                        </div>
                    </h4>
                    <div class="h-60"><canvas id="assetCompareChart"></canvas></div>
                    <div class="red-ink text-lg left-1/2 top-12 rotate-[-5deg] opacity-60">差距很大!</div>
                </div>
                
                <div class="card p-4">
                    <h4 class="text-sm font-bold text-navy-900 mb-4 border-b pb-2 flex justify-between">
                        <span>📉 通膨侵蝕分析 (方案A)</span>
                        <span class="text-[10px] text-slate-400">名目 vs 實質</span>
                    </h4>
                    <div class="h-60"><canvas id="inflationChart"></canvas></div>
                </div>
            </div>

            <div class="card overflow-hidden relative mb-10">
                <div class="bg-navy-800 p-3 flex justify-between items-center">
                    <h4 class="text-white text-sm font-bold font-serif">📑 方案 A 財務明細 (Event Log)</h4>
                </div>
                <div class="overflow-x-auto max-h-[500px]">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th class="px-4 py-3 whitespace-nowrap bg-slate-50">年度</th>
                                <th class="px-4 py-3 whitespace-nowrap bg-slate-50">階級</th>
                                <th class="px-4 py-3 whitespace-nowrap text-right bg-slate-50">稅後年收</th>
                                <th class="px-4 py-3 whitespace-nowrap text-right bg-slate-50">房貸</th>
                                <th class="px-4 py-3 whitespace-nowrap text-right bg-slate-50">總支出</th>
                                <th class="px-4 py-3 whitespace-nowrap text-right bg-slate-50">總投資</th>
                                <th class="px-4 py-3 whitespace-nowrap text-right bg-slate-50">現金流</th>
                                <th class="px-4 py-3 whitespace-nowrap text-right bg-slate-50">淨資產</th>
                            </tr>
                        </thead>
                        <tbody id="event-log-body" class="divide-y divide-slate-100 font-mono"></tbody>
                    </table>
                </div>
                <div class="red-ink text-lg right-20 top-2 rotate-[5deg] z-20">這張表要印!</div>
            </div>

        </main>
    </div>

    <script>
        // --- 1. Global Data ---
        // 移除 food_add 以修正 NaN 問題
        const REAL_SALARY_STRUCTURE = {
            'S2': { rank: '少尉', base: 22750, pro_add: 28000, promotion_years: 1, annual_growth: 0.015, max_years: 12 }, 
            'S3': { rank: '中尉', base: 25050, pro_add: 30000, promotion_years: 3, annual_growth: 0.015, max_years: 12 },
            'S4': { rank: '上尉', base: 28880, pro_add: 35000, promotion_years: 4, annual_growth: 0.015, max_years: 17 }, 
            'M1': { rank: '少校', base: 32710, pro_add: 45000, promotion_years: 4, annual_growth: 0.015, max_years: 22 }, 
            'M2': { rank: '中校', base: 37310, pro_add: 55000, promotion_years: 4, annual_growth: 0.015, max_years: 26 }, 
            'M3': { rank: '上校', base: 41900, pro_add: 65000, promotion_years: 6, annual_growth: 0.015, max_years: 30 }, 
            'G1': { rank: '少將', base: 48030, pro_add: 70000, promotion_years: 4, annual_growth: 0.01, max_years: 35 }, 
            'G2': { rank: '中將', base: 53390, pro_add: 80000, promotion_years: 3, annual_growth: 0.01, max_years: 38 }
        };
        const RANK_ORDER = ['S2', 'S3', 'S4', 'M1', 'M2', 'M3', 'G1', 'G2'];
        const VOLUNTEER_ADDITION = 15000;
        const PENSION_RATE = 0.14; 
        const INDIVIDUAL_PENSION_RATIO = 0.35; 

        let currentScenario = 'A';
        let scenarioData = { A: {}, B: {} };
        let charts = {}; // compare, inflation, distribution
        let counters = { allow: 0, exp: 0, inv: 0 };

        // --- 2. Init & Store ---
        function initScenarioStore() {
            const defaultParams = {
                targetRank: 'M2', serviceYears: 20, inflationRate: 2.0, salaryRaiseRate: 1.0, returnRate: 6.0,
                buyHouseToggle: false, buyYear: 10, housePriceWan: 1500, downPaymentPct: 20, mortgageRate: 2.2, loanTerm: 30, houseAppreciation: 1.5,
                investSliderPct: 30,
                allowances: [{val: 5000, start: 5, end: 10}],
                expenses: [{name: '基本開銷', val: 12000}, {name: '房租', val: 6000}],
                investments: [{name: '儲蓄險', val: 3000}]
            };
            scenarioData.A = JSON.parse(JSON.stringify(defaultParams));
            scenarioData.B = JSON.parse(JSON.stringify(defaultParams));
            scenarioData.B.serviceYears = 25;
            scenarioData.B.returnRate = 4.0;
            scenarioData.B.investSliderPct = 40;
        }

        function switchScenario(scen) {
            saveInputsToMemory(currentScenario);
            currentScenario = scen;
            document.getElementById('current-scen-label').innerText = `EDITING: ${scen}`;
            const btnA = document.getElementById('btn-scen-A');
            const btnB = document.getElementById('btn-scen-B');
            if(scen === 'A') {
                btnA.className = "py-2 text-xs font-bold rounded text-white bg-blue-600 shadow transition flex items-center justify-center gap-2";
                btnB.className = "py-2 text-xs font-bold rounded text-slate-400 hover:text-white transition flex items-center justify-center gap-2";
            } else {
                btnB.className = "py-2 text-xs font-bold rounded text-white bg-blue-600 shadow transition flex items-center justify-center gap-2";
                btnA.className = "py-2 text-xs font-bold rounded text-slate-400 hover:text-white transition flex items-center justify-center gap-2";
            }
            loadMemoryToInputs(scen);
            orchestrateSimulation();
        }

        function collectList(className, valClass) {
            const arr = [];
            document.querySelectorAll('.' + className).forEach(row => {
                const name = row.querySelector('.item-name')?.value || '';
                const val = parseInt(row.querySelector('.' + valClass).value) || 0;
                const start = row.querySelector('.allow-start') ? parseInt(row.querySelector('.allow-start').value) : 0;
                const end = row.querySelector('.allow-end') ? parseInt(row.querySelector('.allow-end').value) : 99;
                if(className === 'allowance-row') arr.push({val, start, end});
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
            fields.forEach(id => { 
                if(document.getElementById(id)) document.getElementById(id).value = data[id==='investSlider'?'investSliderPct':id]; 
            });
            
            // Housing Toggle
            const toggle = document.getElementById('buyHouseToggle');
            const hInputs = document.getElementById('housing-inputs');
            toggle.checked = data.buyHouseToggle;
            if(toggle.checked) hInputs.classList.remove('hidden');
            else hInputs.classList.add('hidden');

            updateSliderDisplay(); 

            // Lists
            document.getElementById('custom-allowances-container').innerHTML = '';
            (data.allowances || []).forEach(a => addCustomAllowance(a, true));
            document.getElementById('expense-items-container').innerHTML = '';
            (data.expenses || []).forEach(a => addExpenseItem(a, true));
            document.getElementById('invest-items-container').innerHTML = '';
            (data.investments || []).forEach(a => addInvestItem(a, true));
        }

        // --- 3. UI Helpers ---
        function updateSliderDisplay() {
            const val = document.getElementById('investSlider').value;
            document.getElementById('slider-percent-display').innerText = val + '%';
            orchestrateSimulation();
        }

        function setRisk(level) {
            const el = document.getElementById('returnRate');
            if(level === 'low') el.value = 1.5;
            if(level === 'mid') el.value = 5.0;
            if(level === 'high') el.value = 9.0;
            orchestrateSimulation();
        }

        function toggleHousingModule() {
            const isChecked = document.getElementById('buyHouseToggle').checked;
            const inputs = document.getElementById('housing-inputs');
            if (isChecked) inputs.classList.remove('hidden');
            else inputs.classList.add('hidden');
            orchestrateSimulation();
        }

        function createRowHtml(id, type, data) {
            const name = data?.name || (type === 'exp' ? '固定支出' : (type === 'inv' ? '定期定額' : '加給'));
            const val = data?.val || 5000;
            const color = type === 'exp' ? 'blue' : (type === 'inv' ? 'green' : 'slate');
            const valClass = type === 'exp' ? 'exp-val' : (type === 'inv' ? 'inv-val' : 'allow-val');
            const rowClass = type === 'exp' ? 'expense-row' : (type === 'inv' ? 'invest-row' : 'allowance-row');
            const inputBg = 'bg-navy-900 border border-navy-700 text-white';
            
            let extra = '';
            if(type === 'allow') {
                const s = data?.start || 5; const e = data?.end || 10;
                extra = `<div class="col-span-2"><input type="number" value="${s}" class="w-full ${inputBg} px-1 text-center allow-start text-[10px]"></div><div class="col-span-2"><input type="number" value="${e}" class="w-full ${inputBg} px-1 text-center allow-end text-[10px]"></div>`;
            }
            return `<div id="${id}" class="grid grid-cols-12 gap-1 items-center mb-1 text-[10px] bg-navy-800 p-1 rounded ${rowClass} border border-navy-700">
                <div class="col-span-${type==='allow'?4:7}"><input type="text" value="${name}" class="w-full bg-transparent border-b border-slate-600 px-1 item-name text-slate-300"></div>
                <div class="col-span-3"><input type="number" value="${val}" class="w-full bg-transparent border-b border-slate-600 px-1 text-right ${valClass} text-white"></div>
                ${extra}
                <div class="col-span-${type==='allow'?1:2} text-center"><button onclick="document.getElementById('${id}').remove(); orchestrateSimulation()" class="text-red-400 hover:text-red-300 font-bold">×</button></div>
            </div>`;
        }

        function addCustomAllowance(d, skipSim=false){ counters.allow++; document.getElementById('custom-allowances-container').insertAdjacentHTML('beforeend', createRowHtml(`allow-${counters.allow}`, 'allow', d)); if(!skipSim) orchestrateSimulation(); }
        function addExpenseItem(d, skipSim=false){ counters.exp++; document.getElementById('expense-items-container').insertAdjacentHTML('beforeend', createRowHtml(`exp-${counters.exp}`, 'exp', d)); if(!skipSim) orchestrateSimulation(); }
        function addInvestItem(d, skipSim=false){ counters.inv++; document.getElementById('invest-items-container').insertAdjacentHTML('beforeend', createRowHtml(`inv-${counters.inv}`, 'inv', d)); if(!skipSim) orchestrateSimulation(); }

        // --- 4. Logic ---
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

            const baseMonthlyExp = p.expenses.reduce((sum, item) => sum + item.val, 0);
            const baseFixedInv = p.investments.reduce((sum, item) => sum + item.val, 0);

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
                let allowance = 0; p.allowances.forEach(a => { if(y >= a.start && y <= a.end) allowance += a.val; });
                
                // Fixed Calculation: Removed food_add reference
                const netMonthly = Math.round((base + VOLUNTEER_ADDITION + allowance) * (1 - PENSION_RATE * INDIVIDUAL_PENSION_RATIO));
                
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

                // Hybrid Investment
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

        // --- 5. Orchestration ---
        function orchestrateSimulation() {
            saveInputsToMemory(currentScenario);
            const resA = calculateScenarioData(scenarioData.A);
            const resB = calculateScenarioData(scenarioData.B);
            updateUI((currentScenario === 'A') ? resA : resB, (currentScenario === 'A') ? resB : resA);
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
            if (res.params.buyHouse) hDiv.innerHTML = `<div class="mt-2 text-xs text-slate-500 space-y-1"><div class="flex justify-between"><span>市值:</span> <span class="font-bold text-orange-600">${formatMoney(h.house[last])}</span></div><div class="flex justify-between"><span>剩貸:</span> <span class="font-bold text-red-600">-${formatMoney(h.loan[last])}</span></div></div>`;
            else hDiv.innerHTML = `<p class="text-xl font-bold text-slate-300 mt-2">未啟用</p>`;

            const negYears = h.logs.filter(l => l.netAsset < 0).length;
            const sb = document.getElementById('status-bar');
            if(negYears>0) { sb.classList.remove('hidden'); document.getElementById('warn-scen').innerText = currentScenario; }
            else sb.classList.add('hidden');

            const tbody = document.getElementById('event-log-body'); tbody.innerHTML = '';
            h.logs.forEach(l => tbody.insertAdjacentHTML('beforeend', `<tr class="hover:bg-slate-50 transition"><td class="px-4 py-3 text-slate-500">Y${l.y}</td><td class="px-4 py-3 font-bold text-navy-900">${l.rank}</td><td class="px-4 py-3 text-right">${formatMoney(l.income)}</td><td class="px-4 py-3 text-right text-orange-500">${formatMoney(l.mortgage)}</td><td class="px-4 py-3 text-right text-slate-500">${formatMoney(l.expense)}</td><td class="px-4 py-3 text-right text-green-600">${formatMoney(l.invest)}</td><td class="px-4 py-3 text-right font-bold ${l.cashflow<0?'text-red-600':'text-blue-600'}">${formatMoney(l.cashflow)}</td><td class="px-4 py-3 text-right font-bold text-navy-900">${formatMoney(l.netAsset)}</td></tr>`));

            renderCharts(res, compareRes);
        }

        function renderCharts(res, compRes) {
            Chart.defaults.font.family = '"Noto Sans TC", sans-serif';
            Chart.defaults.color = '#64748b';
            const h = res.history; const ch = compRes.history;

            // 1. Line Chart
            if (charts.compare) charts.compare.destroy();
            const ctx1 = document.getElementById('assetCompareChart').getContext('2d');
            charts.compare = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: h.labels, 
                    datasets: [
                        { label: `方案 ${currentScenario}`, data: h.netAsset, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderWidth: 3, fill: true, tension: 0.3, pointRadius: 2 },
                        { label: `方案 ${currentScenario==='A'?'B':'A'}`, data: ch.netAsset, borderColor: '#94a3b8', borderWidth: 2, borderDash: [5,5], fill: false, tension: 0.3, pointRadius: 0 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false } } }
            });

            // 2. Inflation Area Chart
            if (charts.inflation) charts.inflation.destroy();
            const ctx2 = document.getElementById('inflationChart').getContext('2d');
            charts.inflation = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: h.labels,
                    datasets: [
                        { label: '名目', data: h.netAsset, borderColor: '#cbd5e1', borderWidth: 2, pointRadius: 0 },
                        { label: '實質 (購買力)', data: h.realAsset, borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.2)', borderWidth: 3, fill: true, pointRadius: 2 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } }
            });

            // 3. Distribution Pie Chart (First Year)
            if (charts.distribution) charts.distribution.destroy();
            const ctx3 = document.getElementById('distributionChart').getContext('2d');
            const totalIn = res.firstYearNet;
            const exp = res.firstYearExp;
            const inv = res.firstYearInv;
            const remain = Math.max(0, totalIn - exp - inv);
            
            charts.distribution = new Chart(ctx3, {
                type: 'doughnut',
                data: {
                    labels: ['生活支出', '投資理財', '現金結餘'],
                    datasets: [{
                        data: [exp, inv, remain],
                        backgroundColor: ['#3b82f6', '#10b981', '#cbd5e1'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    cutout: '70%',
                    plugins: { 
                        legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } 
                    } 
                }
            });
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
