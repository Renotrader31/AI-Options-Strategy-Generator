/**
 * P&L VISUALIZATION COMPONENTS
 * 
 * Interactive components for displaying options strategy P&L analysis,
 * risk metrics, and scenario planning.
 */

/**
 * Generate P&L chart data for visualization
 */
export function generatePnLChartData(scenarioAnalysis, currentPrice) {
  const chartData = {
    labels: [],
    datasets: [{
      label: 'P&L at Expiration',
      data: [],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: true
    }]
  };
  
  if (scenarioAnalysis && scenarioAnalysis.results) {
    // Group by price for expiration P&L
    const expirationResults = scenarioAnalysis.results.filter(r => 
      r.daysToExpiry === 0 || r.daysToExpiry === undefined
    );
    
    expirationResults.forEach(result => {
      chartData.labels.push(`$${result.price.toFixed(2)}`);
      chartData.datasets[0].data.push(result.pnl);
    });
  }
  
  return chartData;
}

/**
 * Create P&L summary card HTML
 */
export function createPnLSummaryCard(pnlAnalysis) {
  const { totalPnL, maxProfit, maxLoss, breakevens, profitProbability } = pnlAnalysis;
  
  const profitClass = totalPnL >= 0 ? 'text-success' : 'text-danger';
  const profitSymbol = totalPnL >= 0 ? '+' : '';
  
  return `
    <div class="pnl-summary-card">
      <h4>📊 P&L Analysis</h4>
      
      <div class="pnl-metrics-grid">
        <div class="pnl-metric">
          <label>Current P&L:</label>
          <span class="${profitClass} font-weight-bold">
            ${profitSymbol}$${totalPnL.toFixed(2)}
          </span>
        </div>
        
        <div class="pnl-metric">
          <label>Max Profit:</label>
          <span class="text-success">
            ${maxProfit.isUnlimited ? 'Unlimited' : `$${maxProfit.amount.toFixed(2)}`}
          </span>
        </div>
        
        <div class="pnl-metric">
          <label>Max Loss:</label>
          <span class="text-danger">
            ${maxLoss.isUnlimited ? 'Unlimited' : `$${maxLoss.amount.toFixed(2)}`}
          </span>
        </div>
        
        <div class="pnl-metric">
          <label>Profit Probability:</label>
          <span class="text-info">
            ${(profitProbability * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      
      ${breakevens && breakevens.length > 0 ? `
        <div class="breakeven-section">
          <label>Breakeven${breakevens.length > 1 ? 's' : ''}:</label>
          <div class="breakeven-values">
            ${breakevens.map(be => `<span class="breakeven-value">$${be.toFixed(2)}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Create Greeks display card
 */
export function createGreeksCard(pnlAnalysis) {
  const { greeks } = pnlAnalysis;
  
  return `
    <div class="greeks-card">
      <h4>🔢 Greeks Analysis</h4>
      
      <div class="greeks-grid">
        <div class="greek-item">
          <span class="greek-label">Delta:</span>
          <span class="greek-value ${greeks.delta >= 0 ? 'positive' : 'negative'}">
            ${greeks.delta.toFixed(3)}
          </span>
          <small class="greek-description">Price sensitivity</small>
        </div>
        
        <div class="greek-item">
          <span class="greek-label">Gamma:</span>
          <span class="greek-value ${greeks.gamma >= 0 ? 'positive' : 'negative'}">
            ${greeks.gamma.toFixed(4)}
          </span>
          <small class="greek-description">Delta sensitivity</small>
        </div>
        
        <div class="greek-item">
          <span class="greek-label">Theta:</span>
          <span class="greek-value ${greeks.theta >= 0 ? 'positive' : 'negative'}">
            ${greeks.theta.toFixed(2)}
          </span>
          <small class="greek-description">Time decay (per day)</small>
        </div>
        
        <div class="greek-item">
          <span class="greek-label">Vega:</span>
          <span class="greek-value ${greeks.vega >= 0 ? 'positive' : 'negative'}">
            ${greeks.vega.toFixed(2)}
          </span>
          <small class="greek-description">Volatility sensitivity</small>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create risk metrics card
 */
export function createRiskMetricsCard(riskMetrics) {
  const { riskRewardRatio, probAdjustedReturn, overallRiskGrade } = riskMetrics;
  
  const gradeColor = {
    'A': '#28a745', 'B': '#28a745', 'C': '#ffc107', 'D': '#fd7e14', 'F': '#dc3545'
  };
  
  return `
    <div class="risk-metrics-card">
      <h4>⚠️ Risk Analysis</h4>
      
      <div class="risk-metrics-grid">
        <div class="risk-metric">
          <label>Risk/Reward Ratio:</label>
          <span class="metric-value">
            ${riskRewardRatio === Infinity ? '∞' : `${riskRewardRatio}:1`}
          </span>
        </div>
        
        <div class="risk-metric">
          <label>Expected Return:</label>
          <span class="metric-value ${probAdjustedReturn >= 0 ? 'text-success' : 'text-danger'}">
            $${probAdjustedReturn.toFixed(2)}
          </span>
        </div>
        
        <div class="risk-metric">
          <label>Overall Grade:</label>
          <span class="risk-grade" style="background-color: ${gradeColor[overallRiskGrade]};">
            ${overallRiskGrade}
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create recommendations card
 */
export function createRecommendationsCard(recommendations) {
  if (!recommendations || recommendations.length === 0) {
    return '<div class="recommendations-card"><h4>💡 No specific recommendations</h4></div>';
  }
  
  return `
    <div class="recommendations-card">
      <h4>💡 Strategy Recommendations</h4>
      
      <div class="recommendations-list">
        ${recommendations.map(rec => `
          <div class="recommendation-item ${rec.type}">
            <div class="rec-title">${rec.title}</div>
            <div class="rec-message">${rec.message}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Create comprehensive P&L analysis display
 */
export function createComprehensivePnLDisplay(enhancedResult) {
  const { pnlAnalysis, riskMetrics, recommendations } = enhancedResult;
  
  if (!pnlAnalysis) {
    return '<div class="pnl-error">P&L analysis unavailable</div>';
  }
  
  return `
    <div class="comprehensive-pnl">
      <div class="pnl-header">
        <h3>📈 Comprehensive P&L Analysis</h3>
        <span class="analysis-badge">Enhanced with Black-Scholes</span>
      </div>
      
      <div class="pnl-cards-grid">
        ${createPnLSummaryCard(pnlAnalysis)}
        ${createGreeksCard(pnlAnalysis)}
        ${createRiskMetricsCard(riskMetrics)}
        ${createRecommendationsCard(recommendations)}
      </div>
      
      <div class="pnl-details">
        <h4>📋 Position Details</h4>
        <div class="legs-summary">
          ${pnlAnalysis.legs.map((leg, index) => `
            <div class="leg-item">
              <span class="leg-label">Leg ${index + 1}:</span>
              <span class="leg-pnl ${leg.totalPnL >= 0 ? 'profitable' : 'losing'}">
                ${leg.totalPnL >= 0 ? '+' : ''}$${leg.totalPnL.toFixed(2)}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate CSS styles for P&L visualization
 */
export function getPnLVisualizationStyles() {
  return `
    <style>
      .comprehensive-pnl {
        margin-top: 20px;
        padding: 20px;
        background: linear-gradient(145deg, #f8f9fa, #ffffff);
        border-radius: 12px;
        border: 1px solid #e9ecef;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      
      .pnl-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #e9ecef;
      }
      
      .analysis-badge {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
      }
      
      .pnl-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 25px;
      }
      
      .pnl-summary-card, .greeks-card, .risk-metrics-card, .recommendations-card {
        background: white;
        padding: 18px;
        border-radius: 10px;
        border: 1px solid #dee2e6;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
      
      .pnl-summary-card h4, .greeks-card h4, .risk-metrics-card h4, .recommendations-card h4 {
        color: #2c3e50;
        margin-bottom: 15px;
        font-size: 1.1rem;
      }
      
      .pnl-metrics-grid, .greeks-grid, .risk-metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
      }
      
      .pnl-metric, .risk-metric {
        text-align: center;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .pnl-metric label, .risk-metric label {
        display: block;
        font-size: 0.85rem;
        color: #6c757d;
        margin-bottom: 5px;
        font-weight: 500;
      }
      
      .greek-item {
        text-align: center;
        padding: 12px 8px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .greek-label {
        display: block;
        font-weight: 600;
        color: #495057;
        margin-bottom: 4px;
      }
      
      .greek-value {
        display: block;
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 4px;
      }
      
      .greek-value.positive { color: #28a745; }
      .greek-value.negative { color: #dc3545; }
      
      .greek-description {
        font-size: 0.75rem;
        color: #6c757d;
      }
      
      .breakeven-section {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #dee2e6;
      }
      
      .breakeven-values {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 8px;
      }
      
      .breakeven-value {
        background: #e3f2fd;
        color: #1976d2;
        padding: 6px 12px;
        border-radius: 16px;
        font-weight: 600;
        font-size: 0.9rem;
      }
      
      .risk-grade {
        display: inline-block;
        color: white;
        padding: 6px 12px;
        border-radius: 50%;
        font-weight: 700;
        font-size: 1.1rem;
        min-width: 40px;
        text-align: center;
      }
      
      .recommendations-list {
        space-y: 12px;
      }
      
      .recommendation-item {
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 10px;
        border-left: 4px solid;
      }
      
      .recommendation-item.positive {
        background: #d4edda;
        border-left-color: #28a745;
      }
      
      .recommendation-item.warning {
        background: #fff3cd;
        border-left-color: #ffc107;
      }
      
      .recommendation-item.info {
        background: #d1ecf1;
        border-left-color: #17a2b8;
      }
      
      .rec-title {
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 4px;
      }
      
      .rec-message {
        font-size: 0.9rem;
        color: #495057;
      }
      
      .pnl-details {
        background: white;
        padding: 18px;
        border-radius: 10px;
        border: 1px solid #dee2e6;
      }
      
      .legs-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-top: 12px;
      }
      
      .leg-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      .leg-pnl.profitable { color: #28a745; font-weight: 600; }
      .leg-pnl.losing { color: #dc3545; font-weight: 600; }
      
      .text-success { color: #28a745 !important; }
      .text-danger { color: #dc3545 !important; }
      .text-info { color: #17a2b8 !important; }
      .font-weight-bold { font-weight: 700 !important; }
    </style>
  `;
}

export default {
  generatePnLChartData,
  createPnLSummaryCard,
  createGreeksCard,
  createRiskMetricsCard,
  createRecommendationsCard,
  createComprehensivePnLDisplay,
  getPnLVisualizationStyles
};