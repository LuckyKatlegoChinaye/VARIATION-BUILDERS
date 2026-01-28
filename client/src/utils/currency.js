export function formatBWP(value) {
  if (value == null || isNaN(value)) return 'P0.00'
  try {
    return new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP', currencyDisplay: 'narrowSymbol' }).format(Number(value))
  } catch {
    return `BWP ${Number(value).toFixed(2)}`
  }
}

export default formatBWP
