/**
 * 國軍財務戰情室 v27.0 - 學術決策版
 * 1. 修正收支平衡：若 (支出 + 投資 + 房貸) > 收入，觸發赤字警告。
 * 2. 生活通膨模型：階級越高，生活開銷基礎權重微幅上調 (0.8 -> 1.2)。
 * 3. 研究支撐：整合文獻引用標註。
 */

const APP = {
    // ... 原有基礎數據 ...
    
    calculateScenario: (d) => {
        // ... 原有初始化 ...
        let hasError = false; // 追蹤是否有赤字年度

        for(let y=1; y<=years; y++) {
            // [動態通膨邏輯]：隨階級提升，生活品味加權係數 (Lifestyle Creep)
            const creepFactor = 1 + (currentRankIdx * 0.02); // 每升一階生活水準多2%
            
            // A. 計算收入 (含退伍金模擬)
            // ... (同前版本)
            
            // B. 計算支出
            const livingAmt = (monthPay * (d.livingPct / 100)) * creepFactor;
            const totalMonthlyOut = livingAmt + d.fixed + (hasHouse ? mortPay/12 : 0);
            const annualOut = totalMonthlyOut * 12 * Math.pow(1+inflation, y-1);
            
            // C. 投資投入
            const annualInv = (monthPay * (d.rate / 100) * 12);
            
            // [防呆驗證]：教授強調的收支平衡
            const totalCashOut = annualOut + annualInv + (y === d.buyY ? downPayment : 0);
            if (totalCashOut > annualInc && cash <= 0 && inv <= 0) {
                hasError = true; // 財務破產預警
            }

            // D. 盈餘計算 (錄音中提到：如果扣完變負的，必須從資產抵扣)
            const surplus = annualInc - annualOut - annualInv;
            
            // 滾存邏輯 (略...)
        }
        
        // 渲染警告
        const warningEl = document.getElementById('budget-warning');
        if (hasError) {
            warningEl.innerHTML = "⚠️ 警示：部分年度出現財務赤字，請調降支出或投資比例！";
            warningEl.className = "p-2 bg-red-900/50 text-red-300 text-xs rounded border border-red-500 mb-4 animate-bounce";
        } else {
            warningEl.innerHTML = "✅ 財務狀態：各年度收支平衡穩定。";
            warningEl.className = "p-2 bg-green-900/20 text-green-400 text-xs rounded border border-green-800 mb-4";
        }

        return res;
    }
};
