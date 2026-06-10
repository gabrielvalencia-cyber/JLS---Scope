/* ============================================================
   IDEA A — "Headline Engine"
   Editorial two-column: hero number + sliders (left),
   live segment breakdown + scenario strip (right).
   ============================================================ */
(function () {
  const { useMemo } = React;
  const M = window.JLSModel;
  const { fmtM } = M.fmt;

  // reference maxima so bars grow/shrink meaningfully across the range
  const MAX_SEG = M.compute(0.60, 4).seg.reduce((a, s) => Math.max(a, s.annual), 0); // achievement @ max

  function IdeaA() {
    const st = window.useModelState();
    const { res } = st;
    const total = window.useChase(res.total);
    const net5 = window.useChase(res.net5);
    const roi = window.useChase(res.roi);
    const payMo = window.useChase(res.paybackYears * 12);

    return (
      <div className="jls-frame ideaA">
        <div className="a-grid">
          {/* LEFT — headline + controls */}
          <div className="a-left">
            <window.Eyebrow>Business Case · Live Model</window.Eyebrow>
            <h2 className="a-title">What the platform is worth, <em>at your assumptions</em>.</h2>

            <div className="a-hero">
              <div className="a-hero-num tnum">{fmtM(total)}</div>
              <div className="a-hero-unit">annual incremental revenue <span>· run-rate</span></div>
            </div>

            <div className="a-metrics">
              <div className="jls-metric"><div className="jls-metric-v tnum">{fmtM(net5)}</div><div className="jls-metric-l">5-yr net benefit</div></div>
              <div className="a-div"></div>
              <div className="jls-metric"><div className="jls-metric-v tnum">{roi.toFixed(2)}x</div><div className="jls-metric-l">Return on cost</div></div>
              <div className="a-div"></div>
              <div className="jls-metric"><div className="jls-metric-v tnum">{payMo.toFixed(1)}<span className="a-mo"> mo</span></div><div className="jls-metric-l">Payback</div></div>
            </div>

            <div className="a-controls">
              <window.AdoptionSlider value={st.adoption} onChange={st.setAdoption} />
              <window.TxnSlider value={st.txns} onChange={st.setTxns} />
            </div>

            <div className="jls-hint"><span className="hd"></span>Drag the assumptions — every figure recalculates live</div>

            <div className="a-assume">
              Achievement earns <b>$6,000</b>/incremental txn up to a <b>$7,500</b> cap per broker, then <b>$500</b>/txn ·
              Platform cost <b>$1.3M/yr</b> · Benefits modeled at 100% over a 5-year horizon
            </div>
          </div>

          {/* RIGHT — segment breakdown */}
          <div className="a-right">
            <div className="a-right-head">
              <span className="a-rh-title">Revenue lift by broker segment</span>
              <span className="a-rh-sub tnum">{res.seg.reduce((a,s)=>a+s.adopters,0).toLocaleString()} adopters · {st.txns>1?'+':''}{st.txns} txns each</span>
            </div>

            <div className="a-segs">
              {res.seg.map((s, i) => <SegRow key={s.key} s={s} total={res.total} />)}
            </div>

            <div className="a-stack-wrap">
              <div className="a-stack-lbl">Total composition</div>
              <div className="a-stack">
                {res.seg.map(s => (
                  <div key={s.key} className="a-stack-seg"
                    style={{ flexGrow: Math.max(0.0001, s.annual), background: s.color }}
                    title={s.label}></div>
                ))}
              </div>
              <div className="a-stack-foot">
                {res.seg.map(s => (
                  <div key={s.key} className="a-stack-key">
                    <span className="jls-dot" style={{ background: s.color }}></span>
                    {s.label} <b className="tnum">{Math.round(s.annual / res.total * 100)}%</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function SegRow({ s, total }) {
    const v = window.useChase(s.annual);
    const w = Math.min(100, (s.annual / MAX_SEG) * 100);
    return (
      <div className="a-seg">
        <div className="a-seg-top">
          <div className="a-seg-name"><span className="jls-dot" style={{ background: s.color }}></span>{s.label}</div>
          <div className="a-seg-val tnum">{fmtM(v)}</div>
        </div>
        <div className="a-seg-track">
          <div className="a-seg-fill" style={{ width: w + '%', background: s.color }}></div>
        </div>
        <div className="a-seg-meta tnum">
          {s.adopters.toLocaleString()} adopters × {M.fmt.fmtMoney(s.effPerAdopter)}{s.capped ? ' · capped' : ''}
        </div>
      </div>
    );
  }

  window.IdeaA = IdeaA;
})();
