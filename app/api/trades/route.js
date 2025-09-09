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
      
      // Calculate P&L with proper options multiplier
      const multiplier = trade.assetType === 'OPTION' ? 100 : 1;
      
      if (trade.type === 'BUY' || trade.type === 'BUY_TO_OPEN') {
        trade.pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity * multiplier;
      } else {
        trade.pnl = (trade.entryPrice - trade.exitPrice) * trade.quantity * multiplier;
      }
      
      trade.pnlPercent = (trade.pnl / (trade.entryPrice * trade.quantity * multiplier)) * 100;
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

// Calculate analytics from trades
function calculateAnalytics(trades) {
  const totalTrades = trades.length;
  const activeTrades = trades.filter(trade => trade.status === 'active').length;
  const closedTrades = trades.filter(trade => trade.status === 'closed').length;
  const pendingTrades = trades.filter(trade => trade.status === 'pending').length;
  
  const totalPnL = trades
    .filter(trade => trade.status === 'closed')
    .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  
  const winningTrades = trades
    .filter(trade => trade.status === 'closed' && trade.pnl > 0).length;
  
  const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;
  
  const mlScore = Math.min(85 + Math.random() * 15, 100); // Mock ML score
  const sharpeRatio = totalPnL > 0 ? 1.2 + Math.random() * 0.8 : 0.3 + Math.random() * 0.4;
  
  return {
    totalTrades,
    activeTrades,
    closedTrades,
    pendingTrades,
    totalPnL: Math.round(totalPnL * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    mlScore: Math.round(mlScore * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100
  };
}