import React, { useState, useEffect } from 'react';
import { formatBWP } from '../utils/currency.js';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('summary');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('this-month');

  useEffect(() => {
    if (activeReport) {
      fetchReport();
    }
  }, [activeReport, period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${activeReport}?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        setReportData(getMockData(activeReport));
      }
    } catch (error) {
      console.error('Error:', error);
      setReportData(getMockData(activeReport));
    } finally {
      setLoading(false);
    }
  };

  const getMockData = (type) => {
    const data = {
      summary: {
        totalRevenue: 0,
        totalExpenses: 0,
        grossProfit: 0,
        netIncome: 0,
        accountsReceivable: 0,
        accountsPayable: 0,
        inventory: 0
      },
      'profit-loss': {
        revenue: 0,
        costOfGoodsSold: 0,
        grossProfit: 0,
        operatingExpenses: 0,
        operatingIncome: 0,
        taxes: 0,
        netIncome: 0
      },
      'balance-sheet': {
        assets: { current: 0, fixed: 0, total: 0 },
        liabilities: { current: 0, longTerm: 0, total: 0 },
        equity: 0
      },
      'cash-flow': {
        openingBalance: 0,
        operatingCashFlow: 0,
        investingCashFlow: 0,
        financingCashFlow: 0,
        closingBalance: 0
      }
    };
    return data[type] || data.summary;
  };

  const renderSummary = () => {
    if (!reportData) return null;
    const metrics = [
      { label: 'Total Revenue', value: reportData.totalRevenue, icon: 'arrow-up', color: '#28a745' },
      { label: 'Total Expenses', value: reportData.totalExpenses, icon: 'arrow-down', color: '#dc3545' },
      { label: 'Gross Profit', value: reportData.grossProfit, icon: 'chart-bar', color: '#ffc107' },
      { label: 'Net Income', value: reportData.netIncome, icon: 'dollar-sign', color: '#007bff' }
    ];

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>{m.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a' }}>{formatBWP(m.value)}</div></div>
                <div style={{ width: '50px', height: '50px', background: m.color + '20', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fas fa-${m.icon}`} style={{ fontSize: '24px', color: m.color }}></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              <i className="fas fa-inbox" style={{ marginRight: '8px', color: '#ffc107' }}></i>Accounts Receivable</h4>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#007bff' }}>{formatBWP(reportData.accountsReceivable)}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>Amount owed by customers</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              <i className="fas fa-box" style={{ marginRight: '8px', color: '#ffc107' }}></i>Inventory Value</h4>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#28a745' }}>{formatBWP(reportData.inventory)}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>Current inventory worth</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              <i className="fas fa-credit-card" style={{ marginRight: '8px', color: '#ffc107' }}></i>Accounts Payable</h4>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#dc3545' }}>{formatBWP(reportData.accountsPayable)}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>Amount owed to suppliers</div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfitLoss = () => {
    if (!reportData) return null;
    const rows = [
      { label: 'Revenue', value: reportData.revenue, color: '#28a745' },
      { label: 'Cost of Goods Sold', value: -reportData.costOfGoodsSold, color: '#dc3545' },
      { label: 'Gross Profit', value: reportData.grossProfit, color: '#ffc107', bold: true },
      { label: 'Operating Expenses', value: -reportData.operatingExpenses, color: '#dc3545' },
      { label: 'Operating Income', value: reportData.operatingIncome, color: '#007bff', bold: true },
      { label: 'Taxes', value: -reportData.taxes, color: '#dc3545' },
      { label: 'Net Income', value: reportData.netIncome, color: '#28a745', bold: true }
    ];

    return (
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            <i className="fas fa-chart-line" style={{ marginRight: '8px', color: '#ffc107' }}></i>Profit & Loss Statement</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: r.bold ? '2px solid #ddd' : '1px solid #e0e0e0', background: r.bold ? '#f9f9f9' : '#fff' }}>
                <td style={{ padding: '16px 24px', fontWeight: r.bold ? '600' : '500', color: r.bold ? '#1a1a1a' : '#666' }}>{r.label}</td>
                <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: r.bold ? '700' : '600', color: r.color }}>
                  {formatBWP(Math.abs(r.value))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!reportData) return null;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', background: '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              <i className="fas fa-coins" style={{ marginRight: '8px', color: '#28a745' }}></i>Assets</h4>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '12px 20px', color: '#666' }}>Current Assets</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', color: '#28a745', fontWeight: '600' }}>{formatBWP(reportData.assets.current)}</td>
              </tr>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <td style={{ padding: '12px 20px', color: '#666' }}>Fixed Assets</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', color: '#28a745', fontWeight: '600' }}>{formatBWP(reportData.assets.fixed)}</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={{ padding: '12px 20px', fontWeight: '600' }}>Total Assets</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '16px', fontWeight: '700', color: '#28a745' }}>{formatBWP(reportData.assets.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', background: '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              <i className="fas fa-credit-card" style={{ marginRight: '8px', color: '#dc3545' }}></i>Liabilities & Equity</h4>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '12px 20px', color: '#666' }}>Current Liabilities</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', color: '#dc3545', fontWeight: '600' }}>{formatBWP(reportData.liabilities.current)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '12px 20px', color: '#666' }}>Long-term Liabilities</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', color: '#dc3545', fontWeight: '600' }}>{formatBWP(reportData.liabilities.longTerm)}</td>
              </tr>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <td style={{ padding: '12px 20px', fontWeight: '600' }}>Total Liabilities</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '700', color: '#dc3545' }}>{formatBWP(reportData.liabilities.total)}</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={{ padding: '12px 20px', fontWeight: '600' }}>Owner Equity</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: '16px', fontWeight: '700', color: '#007bff' }}>{formatBWP(reportData.equity)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    if (!reportData) return null;
    const rows = [
      { label: 'Opening Cash Balance', value: reportData.openingBalance, color: '#007bff' },
      { label: 'Operating Activities', value: reportData.operatingCashFlow, color: '#28a745' },
      { label: 'Investing Activities', value: reportData.investingCashFlow, color: '#dc3545' },
      { label: 'Financing Activities', value: reportData.financingCashFlow, color: '#dc3545' },
      { label: 'Closing Cash Balance', value: reportData.closingBalance, color: '#28a745', bold: true }
    ];

    return (
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            <i className="fas fa-water" style={{ marginRight: '8px', color: '#ffc107' }}></i>Cash Flow Statement</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: r.bold ? '2px solid #ddd' : '1px solid #e0e0e0', background: r.bold ? '#f9f9f9' : '#fff' }}>
                <td style={{ padding: '16px 24px', fontWeight: r.bold ? '600' : '500', color: r.bold ? '#1a1a1a' : '#666' }}>{r.label}</td>
                <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: r.bold ? '700' : '600', color: r.color }}>
                  {r.value >= 0 ? '+' : ''}{formatBWP(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        borderBottom: '2px solid #ffc107',
        padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)'
          }}>
            <i className="fas fa-chart-bar" style={{ fontSize: '24px', color: '#1a1a1a' }}></i>
          </div>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#ffc107', margin: 0 }}>Financial Reports</h1>
            <p style={{ fontSize: '13px', color: '#b0b0b0', margin: '4px 0 0 0' }}>Comprehensive business analytics and financial statements</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Report Selection */}
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'summary', label: 'Summary', icon: 'chart-pie' },
                { id: 'profit-loss', label: 'P&L', icon: 'chart-line' },
                { id: 'balance-sheet', label: 'Balance Sheet', icon: 'balance-scale' },
                { id: 'cash-flow', label: 'Cash Flow', icon: 'water' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id)}
                  style={{
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    background: activeReport === r.id ? '#ffc107' : '#f0f0f0',
                    color: activeReport === r.id ? '#1a1a1a' : '#666',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className={`fas fa-${r.icon}`} style={{ marginRight: '6px' }}></i>{r.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>Period:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', background: '#fff', cursor: 'pointer' }}
              >
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-quarter">This Quarter</option>
                <option value="this-year">This Year</option>
                <option value="all-time">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #e0e0e0', borderTop: '4px solid #ffc107', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px', color: '#999' }}>Loading report...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}`}</style>
          </div>
        ) : (
          <>
            {activeReport === 'summary' && renderSummary()}
            {activeReport === 'profit-loss' && renderProfitLoss()}
            {activeReport === 'balance-sheet' && renderBalanceSheet()}
            {activeReport === 'cash-flow' && renderCashFlow()}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
