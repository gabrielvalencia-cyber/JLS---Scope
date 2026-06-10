/* ============================================================
   JLS BUSINESS CASE — shared model engine
   Reverse-engineered from the 4-slide business case, with the
   corrected Achievement cap + cost base:
     base case  : 40% adoption × +2 incr txns  → ~$2.82M annual
     Achievement: $6,000/txn up to a $7,500/broker ceiling,
                  then $500/txn beyond.
     cost       : $1.3M / yr  (5-yr cost $6.5M, benefits at 100%)
   ============================================================ */
(function () {
  // perTxn = company $ per incremental transaction (pre-cap for Achievement).
  // ceiling = high-value $ cap per adopting broker; beyond it each extra
  // transaction is worth beyondRate. (Productive/Affiliate are uncapped.)
  const BEYOND_RATE = 500;             // $/txn once a broker passes the cap
  const SEGMENTS = [
    { key: 'achievement', label: 'Achievement', brokers: 700,  perTxn: 6000, ceiling: 7500,     cur: 2, future: 4,  color: '#7849ff' },
    { key: 'productive',  label: 'Productive',  brokers: 900,  perTxn: 500,  ceiling: Infinity, cur: 8, future: 10, color: '#00b16a' },
    { key: 'affiliate',   label: 'Affiliate',   brokers: 1000, perTxn: 450,  ceiling: Infinity, cur: 5, future: 7,  color: '#fe9a00' },
  ];

  const INVEST = 1_300_000;            // annual platform cost ($500K+$300K+$250K+$250K)
  const RAMP   = [1.0, 1.0, 1.0, 1.0, 1.0]; // benefits realised at 100% every year

  // adoption scenario anchors (from the deck)
  const SCENARIOS = [
    { key: 'cons', label: 'Conservative', adoption: 0.30 },
    { key: 'base', label: 'Base',         adoption: 0.40 },
    { key: 'aggr', label: 'Aggressive',   adoption: 0.50 },
  ];

  // core engine -------------------------------------------------
  function compute(adoption, incrTxns) {
    const seg = SEGMENTS.map(s => {
      let effPerAdopter, capped;
      if (Number.isFinite(s.ceiling)) {
        // # of full-rate transactions needed to reach the ceiling
        const capReachTxns = Math.ceil(s.ceiling / s.perTxn);
        const highValue = Math.min(incrTxns * s.perTxn, s.ceiling);
        const beyondTxns = Math.max(0, incrTxns - capReachTxns);
        effPerAdopter = highValue + beyondTxns * BEYOND_RATE;
        capped = incrTxns * s.perTxn >= s.ceiling;
      } else {
        effPerAdopter = incrTxns * s.perTxn;
        capped = false;
      }
      const annual = s.brokers * adoption * effPerAdopter;
      return { ...s, effPerAdopter, annual, capped, adopters: Math.round(s.brokers * adoption) };
    });
    const total = seg.reduce((a, s) => a + s.annual, 0);

    const years = RAMP.map((r, i) => ({
      year: i + 1,
      benefit: total * r,
      cost: INVEST,
      net: total * r - INVEST,
      ramp: r,
    }));
    let cum = 0;
    years.forEach(y => { cum += y.net; y.cum = cum; });

    const benefits5 = years.reduce((a, y) => a + y.benefit, 0);
    const costs5 = INVEST * 5;
    const net5 = benefits5 - costs5;
    const roi = costs5 > 0 ? benefits5 / costs5 : Infinity; // benefit-to-cost ratio (gross)
    const netRoi = costs5 > 0 ? net5 / costs5 : Infinity;   // (benefits - costs)/costs
    const paybackYears = total > 0 ? INVEST / total : Infinity;

    return { seg, total, years, benefits5, costs5, net5, roi, netRoi, paybackYears };
  }

  // sensitivity matrix (adoption cols × incr-txn rows) ----------
  const SENS_ADOPT = [0.30, 0.35, 0.40, 0.50, 0.60];
  const SENS_TXNS  = [1, 2, 3, 4];
  function sensitivity() {
    return SENS_TXNS.map(t => ({
      txns: t,
      cells: SENS_ADOPT.map(a => ({ adoption: a, value: compute(a, t).total })),
    }));
  }

  // formatting helpers -----------------------------------------
  const fmtM = (v, dp = 2) => { if (!Number.isFinite(v)) v = 0; return '$' + (v / 1e6).toFixed(dp) + 'M'; };
  const fmtMoney = (v) => {
    if (!Number.isFinite(v)) v = 0;
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) { const k = v / 1e3; return '$' + (Number.isInteger(k) ? k : k.toFixed(1)) + 'K'; }
    return '$' + Math.round(v);
  };
  const fmtPct = (v) => (Number.isFinite(v) ? Math.round(v * 100) : 0) + '%';
  const fmtMonths = (yrs) => {
    const mo = Number.isFinite(yrs) ? yrs * 12 : 0;
    return (mo < 10 ? mo.toFixed(1) : Math.round(mo)) + ' mo';
  };

  window.JLSModel = {
    SEGMENTS, INVEST, RAMP, BEYOND_RATE, SCENARIOS, SENS_ADOPT, SENS_TXNS,
    compute, sensitivity,
    fmt: { fmtM, fmtMoney, fmtPct, fmtMonths },
  };
})();
