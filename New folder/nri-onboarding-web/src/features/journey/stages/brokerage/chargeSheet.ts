// The read-only charge sheet as data: section → label → field of the GetBrokerageData response
// (Docs/UI/10-Brokerage.md §2).
export const CHARGE_SHEET: { title: string; rows: { label: string; field: string }[] }[] = [
  {
    title: 'Brokerage Summary',
    rows: [
      { label: 'Cash Delivery', field: 'cash_delivery' },
      { label: 'Cash Intraday', field: 'cash_intraday' },
      { label: 'Cash Futures', field: 'cash_futures' },
      { label: 'Cash Options', field: 'cash_options' },
      { label: 'Currency Futures', field: 'currency_futures' },
      { label: 'Currency Options', field: 'currency_options' },
      { label: 'MCX Futures', field: 'mcx_futures' },
      { label: 'MCX Options', field: 'mcx_options' },
    ],
  },
  {
    title: 'DP & Operating Charges',
    rows: [
      { label: 'Operating Charges', field: 'dp_operating_charges' },
      { label: 'Ongoing ISIN', field: 'ongoing_isin' },
      { label: 'MTF Pledge / Unpledge', field: 'mtf_pledge_unpledge' },
      { label: 'Margin Pledge / Unpledge', field: 'margin_pledge_unpledge' },
    ],
  },
  {
    title: 'Other Charges',
    rows: [
      { label: 'Account Opening', field: 'accountopening' },
      { label: 'MTF up to 25 Lacs', field: 'mtf_upto_25_lakhs' },
      { label: 'MTF 25 Lacs to 5 Cr', field: 'mtf_upto_25_lakhs_5_crore' },
      { label: 'MTF above 5 Cr', field: 'mtf_above_5_crore' },
      { label: 'Margin Pledge', field: 'margin_pledge' },
      { label: 'Delayed Payment Charges', field: 'delayed_payment_charges' },
    ],
  },
]
