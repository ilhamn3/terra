// terra-logo.js — Infinite loop + diamond frame visible + safe init
class TerraLogo extends HTMLElement {
  static get observedAttributes() { return ['draw-time','pause-ms']; }

  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.drawTime = this.getAttribute('draw-time') || '3s';
    this.pauseMs  = parseInt(this.getAttribute('pause-ms') || '1200', 10);
    this._ready = false;
    this._timer = null;
  }

  connectedCallback() {
    if (this._ready) return;     // prevent double init
    this.render();
    this._ready = true;
    this.setup();                // start infinite loop
  }

  disconnectedCallback() {
    // clean up timer if element removed
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  attributeChangedCallback(name, oldV, newV) {
    if (!this._ready || oldV === newV) return;
    if (name === 'draw-time') this.drawTime = newV || '3s';
    if (name === 'pause-ms')  this.pauseMs  = parseInt(newV || '1200', 10);
    this.setup(true); // re-apply timings and continue loop
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:inline-block}
        #terra-logo{width:100%;height:auto}

        /* We’ll apply animations via JS each cycle */
        .piece path, #frame rect{
          stroke-dasharray: var(--len, 600);
          stroke-dashoffset: var(--len, 600);
        }
        #wordmark text, #submark text{ opacity:0 }

        @keyframes draw{ to{ stroke-dashoffset:0 } }
        @keyframes fade{ to{ opacity:1 } }
      </style>

      <svg id="terra-logo" viewBox="0 0 512 512" part="svg" aria-label="TERRA logo">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#B10F7A"/>
            <stop offset="1" stop-color="#FF7A59"/>
          </linearGradient>
        </defs>

        <!-- Diamond frame -->
        <g id="frame" class="piece">
          <rect x="76" y="76" width="360" height="360" rx="52" ry="52"
            fill="none" stroke="url(#grad)" stroke-width="18"
            transform="rotate(45 256 256)"/>
        </g>

        <!-- Buildings -->
        <g class="piece" stroke="url(#grad)" stroke-width="14" fill="none"
           stroke-linecap="round" stroke-linejoin="round">
          <path d="M180 360V208l38-28v180"/>
          <path d="M256 384V128h70v104"/>
          <path d="M332 352V232l36-28v144"/>
        </g>

        <!-- Horizon -->
        <g class="piece">
          <path d="M120 392c84-28 188-28 272 0"
                fill="none" stroke="url(#grad)" stroke-width="10" stroke-linecap="round"/>
        </g>

        <!-- Text -->
        <g id="wordmark" class="piece" font-family="Arial" font-weight="700" text-anchor="middle">
          <text x="256" y="440" font-size="48" fill="#B10F7A">TERRA</text>
        </g>
        <g id="submark" class="piece" font-family="Arial" font-weight="700" text-anchor="middle">
          <text x="256" y="476" font-size="26" fill="#B10F7A">D.T.C</text>
        </g>
      </svg>
    `;
  }

  setup() {
    const root = this.shadowRoot;
    const svg  = root.getElementById('terra-logo');
    if (!svg) return;

    // expose timing to CSS
    svg.style.setProperty('--draw-time', this.drawTime);

    // 1) Lengths for ALL strokes: paths + rect
    root.querySelectorAll('#terra-logo path, #frame rect').forEach(el=>{
      const len = el.getTotalLength();
      el.style.setProperty('--len', len.toFixed(2));
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
    });

    // 2) Single function to run one cycle and schedule the next (infinite)
    const start = () => {
      // Clear previous animations & reset to start
      root.querySelectorAll('.piece path, #frame rect, #wordmark text, #submark text').forEach(el=>{
        el.style.animation = 'none';
        if (el.tagName === 'path' || el.tagName === 'rect') {
          const len = parseFloat(getComputedStyle(el).getPropertyValue('--len')) || el.getTotalLength();
          el.style.strokeDashoffset = len; // rewind stroke
        } else {
          el.style.opacity = 0; // text hidden
        }
        void el.offsetWidth; // reflow
        // Re-apply animations
        el.style.animation = (el.tagName === 'path' || el.tagName === 'rect')
          ? `draw var(--draw-time) linear forwards`
          : `fade .6s ease forwards`;
        // Delay for text fade
        if (el.tagName !== 'path' && el.tagName !== 'rect') {
          el.style.animationDelay = `calc(var(--draw-time) - 1s)`;
        }
      });

      // Next cycle after draw-time + pause
      const seconds = parseFloat(this.drawTime) || 3; // supports '3s'
      const totalMs = (seconds * 1000) + this.pauseMs;
      clearTimeout(this._timer);
      this._timer = setTimeout(start, totalMs);
    };

    start();
  }
}

customElements.define('terra-logo', TerraLogo);
