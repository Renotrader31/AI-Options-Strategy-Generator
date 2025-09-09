// Quick fix script to test the functionality
function analyzeStock() {
    const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();
    if (!ticker) {
        alert('Please enter a stock ticker symbol');
        return;
    }
    
    setLoading(true);
    
    // Simplified test version
    setTimeout(() => {
        try {
            console.log('🔍 Testing with ticker:', ticker);
            
            // Show quick test result
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = `
                <div class="stock-info">
                    <h2>📊 ${ticker} Analysis 
                        <span style="font-size: 0.8em; background: #28a745; color: white; padding: 6px 12px; border-radius: 20px; margin-left: 15px; font-weight: bold;">
                            🔴 TESTING MODE
                        </span>
                    </h2>
                    <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; 
                         padding: 12px; border-radius: 8px; margin: 15px 0; text-align: center; font-weight: bold;">
                        ⚡ TESTING LIVE DATA CONNECTION ⚡
                    </div>
                    <p>✅ Button click working!</p>
                    <p>✅ JavaScript functions accessible!</p>
                    <p>✅ Ready to fetch live data for ${ticker}!</p>
                </div>
            `;
            resultsDiv.style.display = 'block';
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        } finally {
            setLoading(false);
        }
    }, 1000);
}

function setLoading(loading) {
    const btn = document.querySelector('.analyze-btn');
    const btnText = document.getElementById('btnText');
    
    if (loading) {
        btn.disabled = true;
        btnText.textContent = '⏳ Testing...';
    } else {
        btn.disabled = false;
        btnText.textContent = '🚀 Analyze Strategies';
    }
}

console.log('🧪 Fix script loaded - analyzeStock function is now available');