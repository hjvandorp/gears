/**
 * popout.js — Canvas pop-out window manager
 *
 * Uses postMessage for reliable cross-window communication,
 * which works correctly for file:// pages in all browsers.
 *
 * Protocol:
 *   1. Main window opens popup with canvasId encoded in URL hash.
 *   2. Popup finishes loading, sends { type:'popout-ready', canvasId } to opener.
 *   3. Main window receives 'ready', renders an offscreen hi-res canvas and sends
 *      { type:'popout-data', dataURL, title } back to the popup.
 *   4. On every subsequent Calculate All, main window sends updated pixels
 *      to all open popup windows via postMessage.
 *
 * Resolution:
 *   Rather than capturing the low-resolution (600×600) display canvas, we
 *   re-render on a larger offscreen canvas using the same drawing functions.
 *   HI_RES_SCALE = 3 gives a 1800×1800 output, which is crisp even when the
 *   popup window is on a 4K monitor.
 */

(function () {
    'use strict';

    const HI_RES_SCALE = 3;   // multiplier applied to the source canvas size

    // Map of  canvasId → { win: Window }
    const _popouts = {};

    // Temporary canvas id used while rendering offscreen (cleaned up immediately)
    const TMP_ID = '__popout_hires__';

    /** Human-readable title for each canvas id */
    function _titleFor(canvasId) {
        const titles = { 'canvas-assembly': '2D Full Assembly' };
        if (titles[canvasId]) return titles[canvasId];
        const m2d     = canvasId.match(/^canvas-2d-(\d+)$/);
        const minmesh = canvasId.match(/^canvas-inmesh-(\d+)$/);
        if (m2d)     return '2D Gear Profile \u2013 Gear ' + m2d[1];
        if (minmesh) return '2D In-Mesh View \u2013 Gear ' + minmesh[1];
        return 'Gear Graphics';
    }

    /**
     * Render the gear at HI_RES_SCALE× resolution on a temporary offscreen
     * canvas and return the PNG data-URL.  Falls back to the original canvas
     * pixels if the drawing functions are unavailable or the state is empty.
     */
    function _captureHiRes(canvasId) {
        const srcCanvas = document.getElementById(canvasId);
        if (!srcCanvas) return null;

        const states = window.canvasStates || {};
        const s      = states[canvasId]   || {};

        // Build an offscreen canvas at the scaled size
        const W = srcCanvas.width  * HI_RES_SCALE;
        const H = srcCanvas.height * HI_RES_SCALE;
        const off = document.createElement('canvas');
        off.width  = W;
        off.height = H;
        off.id     = TMP_ID;        // needed so _drawGear2D stores its state

        let rendered = false;

        try {
            if (canvasId.startsWith('canvas-2d-') &&
                s.points && s.points.length > 0 &&
                typeof _drawGear2D === 'function')
            {
                _drawGear2D(off, s.points, s.geom, s.di, s.holePattern);
                rendered = true;

            } else if (canvasId.startsWith('canvas-inmesh-') &&
                       s.gearPts && s.gearPts.length > 0 &&
                       typeof _drawInMesh2D === 'function')
            {
                _drawInMesh2D(off, s.gearPts, s.toolPts,
                              s.gearCache, s.toolRes, s.rollPhase || 0);
                rendered = true;

            } else if (canvasId === 'canvas-assembly' &&
                       window.assemblyCache && window.assemblyCache.length > 0 &&
                       typeof _drawFullAssembly2D === 'function')
            {
                // _drawFullAssembly2D uses window.assemblyCache (already populated)
                // and reads gear-config/aw1/aw2/aw3 from the DOM (available here).
                const assState = { zoom: 1, offsetX: 0, offsetY: 0,
                                   rollPhase: s.rollPhase || 0 };
                _drawFullAssembly2D(off, assState);
                rendered = true;
            }
        } catch (e) {
            console.warn('popout.js: hi-res render failed for', canvasId, e);
        }

        // Clean up temporary canvasStates entry so it doesn't accumulate
        if (window.canvasStates && window.canvasStates[TMP_ID]) {
            delete window.canvasStates[TMP_ID];
        }
        off.id = '';

        if (!rendered) {
            // Fallback: scale up whatever the display canvas already shows
            const ctx = off.getContext('2d');
            ctx.drawImage(srcCanvas, 0, 0, W, H);
        }

        try {
            const dataURL = off.toDataURL('image/png');
            return (dataURL && dataURL.length > 200) ? dataURL : null;
        } catch (e) {
            console.warn('popout.js: toDataURL failed for', canvasId, e);
            return null;
        }
    }

    /** Send current hi-res pixels to a popup window. */
    function _sendTo(win, canvasId) {
        if (!win || win.closed) return;
        const dataURL = _captureHiRes(canvasId);
        win.postMessage({
            type    : 'popout-data',
            title   : _titleFor(canvasId),
            dataURL : dataURL,
            hint    : dataURL ? null : 'Run \u201cCalculate All\u201d to generate graphics.'
        }, '*');
    }

    // ── Listen for 'ready' signals from popup windows ─────────────────────────
    window.addEventListener('message', function (e) {
        if (!e.data || e.data.type !== 'popout-ready') return;
        const canvasId = e.data.canvasId;
        const entry = _popouts[canvasId];
        if (entry && entry.win && !entry.win.closed) {
            _sendTo(entry.win, canvasId);
        }
    });

    /**
     * Open (or focus) a pop-out window for the given canvas.
     * @param {string} canvasId
     */
    function openPopout(canvasId) {
        const existing = _popouts[canvasId];
        if (existing && existing.win && !existing.win.closed) {
            existing.win.focus();
            _sendTo(existing.win, canvasId);
            return;
        }

        const isAssembly = (canvasId === 'canvas-assembly');
        const w = isAssembly ? 1100 : 900;
        const h = isAssembly ? 700  : 940;

        const url = 'popout-window.html#' + encodeURIComponent(canvasId);
        const win = window.open(
            url,
            'popout_' + canvasId,
            'width=' + w + ',height=' + h +
            ',resizable=yes,scrollbars=no,menubar=no,toolbar=no'
        );

        if (!win) {
            alert('Pop-out window was blocked.\nPlease allow pop-ups for this page.');
            return;
        }

        _popouts[canvasId] = { win };
        // Data is sent when the popup fires 'popout-ready' (handled above).
    }

    /**
     * Push fresh hi-res pixels to every open popup. Called after Calculate All.
     */
    function notifyPopouts() {
        for (const canvasId of Object.keys(_popouts)) {
            const entry = _popouts[canvasId];
            if (!entry || !entry.win || entry.win.closed) {
                delete _popouts[canvasId];
                continue;
            }
            _sendTo(entry.win, canvasId);
        }
    }

    window.openPopout    = openPopout;
    window.notifyPopouts = notifyPopouts;

})();
