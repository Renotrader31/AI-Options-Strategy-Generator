/**
 * COMPREHENSIVE OPTIONS PRICING & P&L CALCULATION SYSTEM
 * 
 * This module provides accurate Black-Scholes pricing, Greeks calculations,
 * and comprehensive P&L analysis for options strategies.
 */

/**
 * Black-Scholes Option Pricing Model
 * 
 * @param {Object} params - Pricing parameters
 * @param {number} params.S - Current stock price
 * @param {number} params.K - Strike price
 * @param {number} params.T - Time to expiration (years)
 * @param {number} params.r - Risk-free rate (annual)
 * @param {number} params.sigma - Implied volatility (annual)
 * @param {string} params.type - Option type ('call' or 'put')
 * @returns {Object} Pricing results with option price and Greeks
 */
export function blackScholesPrice(params) {
  const { S, K, T, r = 0.05, sigma, type } = params;
  
  if (T <= 0) {
    // At expiration, return intrinsic value
    const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
    return {
      price: intrinsic,
      delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      intrinsicValue: intrinsic,
      timeValue: 0
    };
  }
  
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const NegNd1 = normalCDF(-d1);
  const NegNd2 = normalCDF(-d2);
  
  let price, delta, gamma, theta, vega;
  
  if (type === 'call') {
    price = S * Nd1 - K * Math.exp(-r * T) * Nd2;
    delta = Nd1;
    theta = -(S * normalPDF(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2;
  } else {
    price = K * Math.exp(-r * T) * NegNd2 - S * NegNd1;
    delta = -NegNd1;
    theta = -(S * normalPDF(d1) * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * NegNd2;
  }
  
  // Gamma and Vega are same for calls and puts
  gamma = normalPDF(d1) / (S * sigma * Math.sqrt(T));
  vega = S * normalPDF(d1) * Math.sqrt(T) / 100; // Per 1% change in volatility
  
  const intrinsicValue = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
  const timeValue = price - intrinsicValue;
  
  return {
    price: Math.max(0, price),
    delta: delta,
    gamma: gamma,
    theta: theta / 365, // Per day
    vega: vega,
    intrinsicValue: intrinsicValue,
    timeValue: Math.max(0, timeValue),
    d1: d1,
    d2: d2
  };
}

/**
 * Calculate P&L for a single option position
 * 
 * @param {Object} position - Option position details
 * @param {string} position.action - 'buy' or 'sell'
 * @param {string} position.type - 'call' or 'put'
 * @param {number} position.strike - Strike price
 * @param {number} position.quantity - Number of contracts
 * @param {number} position.entryPrice - Price paid/received when opened
 * @param {Object} marketData - Current market conditions
 * @returns {Object} P&L analysis
 */
export function calculateOptionPnL(position, marketData) {
  const { 
    action, 
    type, 
    strike, 
    quantity, 
    entryPrice,
    daysToExpiry = 30
  } = position;
  
  const {
    currentPrice,
    impliedVolatility = 0.25,
    riskFreeRate = 0.05
  } = marketData;
  
  const timeToExpiry = daysToExpiry / 365;
  
  // Calculate current option value
  const currentPricing = blackScholesPrice({
    S: currentPrice,
    K: strike,
    T: timeToExpiry,
    r: riskFreeRate,
    sigma: impliedVolatility,
    type: type
  });
  
  const currentValue = currentPricing.price;
  const contractMultiplier = 100; // Standard option contract size
  
  // Calculate P&L based on position
  let pnl, pnlPerContract, totalValue;
  
  if (action === 'buy') {
    pnlPerContract = currentValue - entryPrice;
    totalValue = currentValue * quantity * contractMultiplier;
  } else { // sell
    pnlPerContract = entryPrice - currentValue;
    totalValue = -currentValue * quantity * contractMultiplier; // Negative because it's a liability
  }
  
  pnl = pnlPerContract * quantity * contractMultiplier;
  
  return {
    currentPrice: currentValue,
    entryPrice: entryPrice,
    pnlPerContract: pnlPerContract,
    totalPnL: pnl,
    totalValue: totalValue,
    percentChange: entryPrice !== 0 ? (pnlPerContract / entryPrice) * 100 : 0,
    greeks: {
      delta: currentPricing.delta * quantity * contractMultiplier * (action === 'buy' ? 1 : -1),
      gamma: currentPricing.gamma * quantity * contractMultiplier * (action === 'buy' ? 1 : -1),
      theta: currentPricing.theta * quantity * contractMultiplier * (action === 'buy' ? 1 : -1),
      vega: currentPricing.vega * quantity * contractMultiplier * (action === 'buy' ? 1 : -1)
    },
    intrinsicValue: currentPricing.intrinsicValue,
    timeValue: currentPricing.timeValue,
    daysToExpiry: daysToExpiry
  };
}

/**
 * Calculate comprehensive P&L for multi-leg options strategies
 * 
 * @param {Array} legs - Array of option positions
 * @param {Object} marketData - Current market conditions
 * @param {Object} scenario - Price scenarios for analysis
 * @returns {Object} Strategy P&L analysis
 */
export function calculateStrategyPnL(legs, marketData, scenario = null) {
  const { currentPrice } = marketData;
  
  // Calculate P&L for each leg
  const legPnLs = legs.map(leg => calculateOptionPnL(leg, marketData));
  
  // Aggregate strategy P&L
  const totalPnL = legPnLs.reduce((sum, leg) => sum + leg.totalPnL, 0);
  const totalValue = legPnLs.reduce((sum, leg) => sum + leg.totalValue, 0);
  const totalDelta = legPnLs.reduce((sum, leg) => sum + leg.greeks.delta, 0);
  const totalGamma = legPnLs.reduce((sum, leg) => sum + leg.greeks.gamma, 0);
  const totalTheta = legPnLs.reduce((sum, leg) => sum + leg.greeks.theta, 0);
  const totalVega = legPnLs.reduce((sum, leg) => sum + leg.greeks.vega, 0);
  
  // Calculate net premium paid/received
  const netPremium = legs.reduce((sum, leg) => {
    const premiumValue = leg.entryPrice * leg.quantity * 100;
    return sum + (leg.action === 'buy' ? -premiumValue : premiumValue);
  }, 0);
  
  let result = {
    legs: legPnLs,
    totalPnL: totalPnL,
    totalValue: totalValue,
    netPremium: netPremium,
    greeks: {
      delta: totalDelta,
      gamma: totalGamma, 
      theta: totalTheta,
      vega: totalVega
    },
    breakevens: calculateBreakevens(legs, marketData),
    maxProfit: calculateMaxProfit(legs, marketData),
    maxLoss: calculateMaxLoss(legs, marketData),
    profitProbability: calculateProfitProbability(legs, marketData)
  };
  
  // Add scenario analysis if requested
  if (scenario) {
    result.scenarioAnalysis = calculateScenarioAnalysis(legs, marketData, scenario);
  }
  
  return result;
}

/**
 * Calculate breakeven points for the strategy
 */
function calculateBreakevens(legs, marketData) {
  const { currentPrice } = marketData;
  const breakevens = [];
  
  // For simple strategies, calculate based on net premium and strikes
  const strikes = legs.map(leg => leg.strike).sort((a, b) => a - b);
  const minStrike = strikes[0];
  const maxStrike = strikes[strikes.length - 1];
  
  // Calculate net premium per share
  const netPremiumPerShare = legs.reduce((sum, leg) => {
    const premiumPerShare = leg.entryPrice * (leg.action === 'buy' ? -1 : 1);
    return sum + premiumPerShare;
  }, 0);
  
  // For most strategies, breakevens are around strike prices adjusted by net premium
  if (legs.some(leg => leg.type === 'call' && leg.action === 'buy')) {
    // Bull call spread or similar
    breakevens.push(minStrike + Math.abs(netPremiumPerShare));
  }
  
  if (legs.some(leg => leg.type === 'put' && leg.action === 'buy')) {
    // Bear put spread or similar
    breakevens.push(maxStrike - Math.abs(netPremiumPerShare));
  }
  
  // For neutral strategies like iron condors
  if (legs.length >= 4) {
    const callStrikes = legs.filter(leg => leg.type === 'call').map(leg => leg.strike).sort((a, b) => a - b);
    const putStrikes = legs.filter(leg => leg.type === 'put').map(leg => leg.strike).sort((a, b) => a - b);
    
    if (callStrikes.length >= 2 && putStrikes.length >= 2) {
      breakevens.push(putStrikes[1] - Math.abs(netPremiumPerShare));
      breakevens.push(callStrikes[0] + Math.abs(netPremiumPerShare));
    }
  }
  
  return breakevens.filter(be => be > 0);
}

/**
 * Calculate maximum profit potential
 */
function calculateMaxProfit(legs, marketData) {
  const scenarios = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
  let maxProfit = -Infinity;
  let maxProfitPrice = 0;
  
  scenarios.forEach(price => {
    const scenarioMarketData = { ...marketData, currentPrice: price };
    let totalPnL = 0;
    
    legs.forEach(leg => {
      const legPnL = calculateOptionPnL(leg, scenarioMarketData);
      totalPnL += legPnL.totalPnL;
    });
    
    if (totalPnL > maxProfit) {
      maxProfit = totalPnL;
      maxProfitPrice = price;
    }
  });
  
  return {
    amount: maxProfit,
    atPrice: maxProfitPrice,
    isUnlimited: maxProfit > 10000 // Arbitrary large number indicating unlimited profit
  };
}

/**
 * Calculate maximum loss potential
 */
function calculateMaxLoss(legs, marketData) {
  const scenarios = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
  let maxLoss = Infinity;
  let maxLossPrice = 0;
  
  scenarios.forEach(price => {
    const scenarioMarketData = { ...marketData, currentPrice: price };
    let totalPnL = 0;
    
    legs.forEach(leg => {
      const legPnL = calculateOptionPnL(leg, scenarioMarketData);
      totalPnL += legPnL.totalPnL;
    });
    
    if (totalPnL < maxLoss) {
      maxLoss = totalPnL;
      maxLossPrice = price;
    }
  });
  
  return {
    amount: maxLoss,
    atPrice: maxLossPrice,
    isUnlimited: maxLoss < -10000 // Arbitrary large negative number indicating unlimited loss
  };
}

/**
 * Calculate probability of profit (simplified model)
 */
function calculateProfitProbability(legs, marketData) {
  const { currentPrice, impliedVolatility = 0.25 } = marketData;
  const daysToExpiry = legs[0]?.daysToExpiry || 30;
  
  // Simple probability model based on implied volatility and time
  const expectedMove = currentPrice * impliedVolatility * Math.sqrt(daysToExpiry / 365);
  const breakevens = calculateBreakevens(legs, marketData);
  
  if (breakevens.length === 0) return 0.5;
  
  // For simplicity, assume normal distribution
  // In practice, you'd use more sophisticated models
  let profitProb = 0;
  
  if (breakevens.length === 1) {
    const distance = Math.abs(currentPrice - breakevens[0]);
    profitProb = 1 - Math.exp(-0.5 * Math.pow(distance / expectedMove, 2));
  } else if (breakevens.length === 2) {
    const lower = Math.min(...breakevens);
    const upper = Math.max(...breakevens);
    if (currentPrice >= lower && currentPrice <= upper) {
      profitProb = 0.7; // Simplified: high probability if between breakevens
    } else {
      profitProb = 0.3;
    }
  }
  
  return Math.max(0, Math.min(1, profitProb));
}

/**
 * Calculate P&L across multiple price scenarios
 */
function calculateScenarioAnalysis(legs, marketData, scenario) {
  const { priceRange, timeDecay } = scenario;
  const results = [];
  
  priceRange.forEach(price => {
    const scenarioMarketData = { 
      ...marketData, 
      currentPrice: price 
    };
    
    // Calculate for different time scenarios if specified
    if (timeDecay && timeDecay.length > 0) {
      timeDecay.forEach(days => {
        const adjustedLegs = legs.map(leg => ({
          ...leg,
          daysToExpiry: days
        }));
        
        let totalPnL = 0;
        adjustedLegs.forEach(leg => {
          const legPnL = calculateOptionPnL(leg, scenarioMarketData);
          totalPnL += legPnL.totalPnL;
        });
        
        results.push({
          price: price,
          daysToExpiry: days,
          pnl: totalPnL
        });
      });
    } else {
      let totalPnL = 0;
      legs.forEach(leg => {
        const legPnL = calculateOptionPnL(leg, scenarioMarketData);
        totalPnL += legPnL.totalPnL;
      });
      
      results.push({
        price: price,
        pnl: totalPnL
      });
    }
  });
  
  return results;
}

/**
 * Helper functions for Black-Scholes calculations
 */
function normalCDF(x) {
  // Approximation of the cumulative distribution function of standard normal distribution
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x) / Math.sqrt(2);
  
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const t = 1 / (1 + p * x);
  const erf = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1 + sign * erf);
}

function normalPDF(x) {
  // Probability density function of standard normal distribution
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Utility function to estimate implied volatility from option price
 * Uses Newton-Raphson method for approximation
 */
export function impliedVolatility(optionPrice, S, K, T, r, type, initialGuess = 0.25) {
  const MAX_ITERATIONS = 100;
  const TOLERANCE = 1e-6;
  
  let sigma = initialGuess;
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const pricing = blackScholesPrice({ S, K, T, r, sigma, type });
    const priceDiff = pricing.price - optionPrice;
    
    if (Math.abs(priceDiff) < TOLERANCE) {
      return sigma;
    }
    
    // Newton-Raphson update
    const vega = pricing.vega;
    if (vega === 0) break;
    
    sigma = sigma - priceDiff / vega;
    
    // Keep sigma positive and reasonable
    sigma = Math.max(0.01, Math.min(5.0, sigma));
  }
  
  return sigma;
}

/**
 * Calculate portfolio Greeks for risk management
 */
export function calculatePortfolioGreeks(positions, marketData) {
  let totalDelta = 0;
  let totalGamma = 0;
  let totalTheta = 0;
  let totalVega = 0;
  let totalValue = 0;
  
  positions.forEach(position => {
    const pnl = calculateOptionPnL(position, marketData);
    totalDelta += pnl.greeks.delta;
    totalGamma += pnl.greeks.gamma;
    totalTheta += pnl.greeks.theta;
    totalVega += pnl.greeks.vega;
    totalValue += pnl.totalValue;
  });
  
  return {
    delta: totalDelta,
    gamma: totalGamma,
    theta: totalTheta,
    vega: totalVega,
    totalValue: totalValue,
    // Risk metrics
    deltaRisk: Math.abs(totalDelta), // Risk from price movement
    gammaRisk: Math.abs(totalGamma * marketData.currentPrice * 0.01), // Risk from delta changes
    thetaDecay: totalTheta, // Daily time decay
    vegaRisk: Math.abs(totalVega * 0.01) // Risk from 1% volatility change
  };
}

export default {
  blackScholesPrice,
  calculateOptionPnL,
  calculateStrategyPnL,
  impliedVolatility,
  calculatePortfolioGreeks
};