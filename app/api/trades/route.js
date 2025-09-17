/**
 * Trades API Route for Scanner Pro AI
 * Enhanced for both STOCK and OPTION trading
 */

import { NextResponse } from 'next/server';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// In-memory storage (in production, use a database)
let trades = [];
let tradeIdCounter = 1;

// Handle OPTIONS requests for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET endpoint - fetch trades and analytics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const analytics = searchParams.get('analytics') === 'true';
    const updatePrices = searchParams.get('updatePrices') === 'true';
    
    if (analytics) {
      const analyticsData = calculateAnalytics(trades);
      return NextResponse.json({
        success: true,
        trades,
        analytics: analyticsData,
        timestamp: new Date().toISOString()
      }, {
        status: 200,
        headers: corsHeaders
      });
    }
    
    let filteredTrades = trades;
    if (status) {
      filteredTrades = trades.filter(trade => trade.status === status);
    }
    
    return NextResponse.json({
      success: true,
      trades: filteredTrades,
      count: filteredTrades.length,
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: corsHeaders
    });
    
    // Update unrealized P&L for active trades if requested
    if (updatePrices) {
      filteredTrades = filteredTrades.map(trade => {
        if (trade.status === 'active') {
          // Simulate current market price (in production, fetch real prices)
          const currentPrice = trade.currentPrice * (0.98 + Math.random() * 0.04); // ±2% random movement
          trade.currentPrice = Math.round(currentPrice * 100) / 100;
          
          // Calculate unrealized P&L
          trade.unrealizedPnL = calculateCorrectPnL({
            ...trade,
            type: trade.type
          }, currentPrice);
          
          // Calculate unrealized P&L percentage
          const costBasis = Math.abs(trade.entryPrice * trade.quantity * (trade.assetType === 'OPTION' ? 100 : 1));
          trade.unrealizedPnLPercent = costBasis > 0 ? (trade.unrealizedPnL / costBasis) * 100 : 0;
          trade.unrealizedPnLPercent = Math.round(trade.unrealizedPnLPercent * 100) / 100;
        }
        return trade;
      });
    }
    
  } catch (error) {
    console.error('Trades GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trades',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// POST endpoint - create new trade
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      symbol,
      assetType,
      type,
      quantity,
      entryPrice,
      stopLoss,
      takeProfit,
      notes,
      optionType,
      strikePrice,
      expirationDate,
      premium,
      quickSave = false
    } = body;

    // Validation
    if (!symbol || !assetType || !type || !quantity || !entryPrice) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Create new trade
    const newTrade = {
      id: tradeIdCounter++,
      symbol: symbol.toUpperCase(),
      assetType: assetType.toUpperCase(),
      type: type.toUpperCase(),
      quantity: parseFloat(quantity),
      entryPrice: parseFloat(entryPrice),
      currentPrice: parseFloat(entryPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      notes: notes || '',
      status: 'active',
      entryDate: new Date().toISOString(),
      exitDate: null,
      exitPrice: null,
      pnl: 0,
      pnlPercent: 0
    };

    // Add options-specific fields if it's an option trade
    if (assetType.toUpperCase() === 'OPTION') {
      newTrade.optionType = optionType?.toUpperCase() || 'CALL';
      newTrade.strikePrice = strikePrice ? parseFloat(strikePrice) : null;
      newTrade.expirationDate = expirationDate || null;
      newTrade.premium = premium ? parseFloat(premium) : null;
    }

    trades.push(newTrade);

    return NextResponse.json({
      success: true,
      trade: newTrade,
      message: quickSave ? 'Trade quickly saved!' : 'Trade recorded successfully!',
      timestamp: new Date().toISOString()
    }, {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Trades POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create trade',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// PUT endpoint - update existing trade
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, status, exitPrice, exitDate } = body;

    const tradeIndex = trades.findIndex(trade => trade.id === id);
    
    if (tradeIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Trade not found'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    const trade = trades[tradeIndex];
    
    if (status) {
      trade.status = status;
    }
    
    if (exitPrice && status === 'closed') {
      trade.exitPrice = parseFloat(exitPrice);
      trade.currentPrice = parseFloat(exitPrice);
      trade.exitDate = exitDate || new Date().toISOString();
      
      // Calculate P&L with CORRECTED logic for options
      trade.pnl = calculateCorrectPnL(trade, parseFloat(exitPrice));
      
      // Calculate percentage return based on cost basis
      const costBasis = Math.abs(trade.entryPrice * trade.quantity * (trade.assetType === 'OPTION' ? 100 : 1));
      trade.pnlPercent = costBasis > 0 ? (trade.pnl / costBasis) * 100 : 0;
    }

    return NextResponse.json({
      success: true,
      trade,
      message: 'Trade updated successfully!',
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Trades PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update trade',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// DELETE endpoint - delete trade
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'));

    const tradeIndex = trades.findIndex(trade => trade.id === id);
    
    if (tradeIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Trade not found'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    const deletedTrade = trades.splice(tradeIndex, 1)[0];

    return NextResponse.json({
      success: true,
      deletedTrade,
      message: 'Trade deleted successfully!',
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Trades DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete trade',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// FIXED P&L CALCULATION FUNCTION
function calculateCorrectPnL(trade, exitPrice) {
  const multiplier = trade.assetType === 'OPTION' ? 100 : 1;
  const quantity = trade.quantity;
  const entryPrice = trade.entryPrice;
  
  let pnl = 0;
  
  // Handle different trade types correctly
  switch (trade.type?.toUpperCase()) {
    case 'BUY':
    case 'BUY_TO_OPEN':
    case 'LONG':
      // Long position: profit when price goes up
      pnl = (exitPrice - entryPrice) * quantity * multiplier;
      break;
      
    case 'SELL':
    case 'SELL_TO_OPEN':
    case 'SHORT':
      // Short position: profit when price goes down
      pnl = (entryPrice - exitPrice) * quantity * multiplier;
      break;
      
    case 'SELL_TO_CLOSE':
      // Closing a long position
      pnl = (exitPrice - entryPrice) * quantity * multiplier;
      break;
      
    case 'BUY_TO_CLOSE':
      // Closing a short position
      pnl = (entryPrice - exitPrice) * quantity * multiplier;
      break;
      
    default:
      // Default to long position calculation
      console.warn(`Unknown trade type: ${trade.type}, defaulting to long calculation`);
      pnl = (exitPrice - entryPrice) * quantity * multiplier;
      break;
  }
  
  // Round to 2 decimal places
  return Math.round(pnl * 100) / 100;
}

// Calculate analytics from trades
function calculateAnalytics(trades) {
  const totalTrades = trades.length;
  const activeTrades = trades.filter(trade => trade.status === 'active').length;
  const closedTrades = trades.filter(trade => trade.status === 'closed').length;
  const pendingTrades = trades.filter(trade => trade.status === 'pending').length;
  
  // Calculate realized P&L from closed trades
  const realizedPnL = trades
    .filter(trade => trade.status === 'closed')
    .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  
  // Calculate unrealized P&L from active trades
  const unrealizedPnL = trades
    .filter(trade => trade.status === 'active')
    .reduce((sum, trade) => sum + (trade.unrealizedPnL || 0), 0);
  
  const totalPnL = realizedPnL + unrealizedPnL;
  
  const winningTrades = trades
    .filter(trade => trade.status === 'closed' && (trade.pnl || 0) > 0).length;
  
  const losingTrades = trades
    .filter(trade => trade.status === 'closed' && (trade.pnl || 0) < 0).length;
  
  const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;
  
  // Calculate average win and loss
  const avgWin = winningTrades > 0 ? 
    trades.filter(t => t.status === 'closed' && (t.pnl || 0) > 0)
          .reduce((sum, t) => sum + t.pnl, 0) / winningTrades : 0;
          
  const avgLoss = losingTrades > 0 ? 
    trades.filter(t => t.status === 'closed' && (t.pnl || 0) < 0)
          .reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losingTrades : 0;
  
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 5 : 1);
  
  // Calculate total capital invested
  const totalCapital = trades.reduce((sum, trade) => {
    const multiplier = trade.assetType === 'OPTION' ? 100 : 1;
    return sum + Math.abs(trade.entryPrice * trade.quantity * multiplier);
  }, 0);
  
  const returnOnCapital = totalCapital > 0 ? (totalPnL / totalCapital) * 100 : 0;
  
  return {
    totalTrades,
    activeTrades,
    closedTrades,
    pendingTrades,
    realizedPnL: Math.round(realizedPnL * 100) / 100,
    unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    returnOnCapital: Math.round(returnOnCapital * 100) / 100,
    winningTrades,
    losingTrades
  };
}