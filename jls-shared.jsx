/* ============================================================
   JLS — shared UI primitives for the three interactive frames
   Exports to window: useChase, useModelState, JLSSlider, SegPill,
   Eyebrow, fmt helpers re-exported.
   ============================================================ */
(function () {
  const { useState, useEffect, useRef, useCallback } = React;
  const M = window.JLSModel;

  /* number that smoothly chases its target (spring-ish lerp).
     RAF drives the smooth tween; a guaranteed timeout lands the exact
     target even if requestAnimationFrame is throttled/paused. */
  function useChase(target, { ms = 420 } = {}) {
    const safeTarget = Number.isFinite(target) ? target : 0;
    const [val, setVal] = useState(safeTarget);
    const ref = useRef({ from: safeTarget, to: safeTarget, start: 0 });
    useEffect(() => {
      const to = Number.isFinite(target) ? target : 0;
      const from = Number.isFinite(val) ? val : to;
      ref.current = { from, to, start: performance.now() };
      let raf;
      const tick = (now) => {
        const { from, to, start } = ref.current;
        // clamp BOTH ends — a negative t (clock skew / stale start) would make
        // (1 - t)^3 explode into e+38; clamping makes the runaway impossible.
        const t = Math.max(0, Math.min(1, (now - start) / ms));
        const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const next = from + (to - from) * e;
        setVal(Number.isFinite(next) ? next : to);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      // safety net: ensure we always settle on the exact target
      const done = setTimeout(() => setVal(to), ms + 30);
      return () => { cancelAnimationFrame(raf); clearTimeout(done); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);
    return Number.isFinite(val) ? val : safeTarget;
  }

  /* central assumption state + derived model, shared shape per frame */
  function useModelState(initAdopt = 0.40, initTxns = 2) {
    const [adoption, setAdoption] = useState(initAdopt);
    const [txns, setTxns] = useState(initTxns);
    const res = M.compute(adoption, txns);
    const scenario =
      Math.abs(adoption - 0.30) < 0.006 ? 'cons' :
      Math.abs(adoption - 0.40) < 0.006 ? 'base' :
      Math.abs(adoption - 0.50) < 0.006 ? 'aggr' : null;
    return { adoption, setAdoption, txns, setTxns, res, scenario };
  }

  /* the adoption slider — continuous, with scenario tick marks */
  function AdoptionSlider({ value, onChange, accent = '#7849ff' }) {
    const pct = ((value - 0.20) / (0.60 - 0.20)) * 100;
    return (
      <div className="jls-ctl">
        <div className="jls-ctl-head">
          <span className="jls-ctl-label">Adoption rate</span>
          <span className="jls-ctl-val" style={{ color: accent }}>{Math.round(value * 100)}%</span>
        </div>
        <div className="jls-slider-wrap">
          <div className="jls-slider-track">
            <div className="jls-slider-fill" style={{ width: pct + '%', background: accent }}></div>
          </div>
          <input
            type="range" min="20" max="60" step="1"
            value={Math.round(value * 100)}
            onChange={e => onChange(+e.target.value / 100)}
            style={{ '--accent': accent }}
          />
          <div className="jls-ticks">
            {M.SCENARIOS.map(s => (
              <button key={s.key}
                className={'jls-tick' + (Math.abs(value - s.adoption) < 0.006 ? ' on' : '')}
                style={{ left: ((s.adoption - 0.20) / 0.40 * 100) + '%', '--accent': accent }}
                onClick={() => onChange(s.adoption)}>
                <span className="jls-tick-dot"></span>
                <span className="jls-tick-lbl">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* the incremental-transactions stepper slider — discrete 1..4 */
  function TxnSlider({ value, onChange, accent = '#7849ff' }) {
    return (
      <div className="jls-ctl">
        <div className="jls-ctl-head">
          <span className="jls-ctl-label">Incremental transactions <em>/ broker</em></span>
          <span className="jls-ctl-val" style={{ color: accent }}>+{value}</span>
        </div>
        <div className="jls-seg" style={{ '--accent': accent }}>
          {[1, 2, 3, 4].map(n => (
            <button key={n}
              className={'jls-seg-btn' + (n === value ? ' on' : '')}
              onClick={() => onChange(n)}>+{n}</button>
          ))}
        </div>
      </div>
    );
  }

  function Eyebrow({ children }) {
    return (
      <div className="jls-eyebrow"><span className="jls-eyebrow-rule"></span>{children}</div>
    );
  }

  Object.assign(window, {
    useChase, useModelState, AdoptionSlider, TxnSlider, Eyebrow,
  });
})();
