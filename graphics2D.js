/**
 * graphics2D.js
 * 2D Gear Tooth Profile Mathematics
 *
 * All profiles are computed in the transverse plane (the 2D cross-section
 * perpendicular to the gear axis). A single tooth is centred on the +Y axis;
 * the full gear outline is obtained by rotating that tooth |z| times by 2π/|z|.
 *
 * Segment assembly order (right half of one tooth, then mirrored):
 *   root arc  →  fillet trochoid (root → dFf)  →  involute (dFf → da)  →  tip arc
 */

'use strict';

window.canvasStates = window.canvasStates || {};
const canvasStates = window.canvasStates;

// ---------------------------------------------------------------------------
// Involute helper
// ---------------------------------------------------------------------------
const _inv = (angleRad) => Math.tan(angleRad) - angleRad;

// ---------------------------------------------------------------------------
// 1. INVOLUTE FLANK
// ---------------------------------------------------------------------------
/**
 * Calculates the right-flank involute for one tooth centred on the +Y axis.
 *
 * @param {number} db       - Base diameter (mm)
 * @param {number} d        - Reference diameter (mm)
 * @param {number} st       - Transverse circular tooth thickness at d (mm)
 * @param {number} alpha_t  - Transverse pressure angle (degrees)
 * @param {number} dFf      - Root form diameter (mm)  — involute starts here
 * @param {number} da       - Tip diameter (mm)        — involute ends here
 * @param {number} [nPts=80] - Number of sample points
 * @returns {{ success: boolean, points: {x,y}[], error?: string }}
 */
function calculateInvoluteFlank(db, d, st, alpha_t, dFf, da, nPts = 80) {
    const r_b = Math.abs(db) / 2;
    const r_start = Math.abs(dFf) / 2;
    const r_end = Math.abs(da) / 2;

    if (r_b <= 0) return { success: false, error: 'Base circle radius is zero or negative.' };

    // For external gears da > dFf  →  r_end > r_start
    // For internal gears da < dFf  →  r_end < r_start  (tooth is inside the rim)
    const isInternal = (da < dFf);  // equivalent to z < 0

    const r_inv_start = Math.max(r_start, r_b);
    const r_inv_end = Math.max(r_end, r_b);

    if (r_inv_start === r_inv_end && !isInternal) {
        return { success: false, error: 'Involute segment has zero length (tip below base circle).' };
    }

    const alphaTRad = alpha_t * (Math.PI / 180);
    const invAlphaT = _inv(alphaTRad);

    // Half-tooth polar angle contribution from tooth thickness at the reference circle
    const halfTheta_d = (st / 2) / (d / 2);   // = st / d  (arc / radius)

    const points = [];
    for (let i = 0; i <= nPts; i++) {
        const r = r_inv_start + (i / nPts) * (r_inv_end - r_inv_start);
        const ratio = Math.max(-1, Math.min(1, r_b / r));
        const alpha_r = Math.acos(ratio);

        let phi;
        if (isInternal) {
            // Internal gear: involute unfolds in the opposite angular sense
            phi = Math.PI / 2 - (halfTheta_d - invAlphaT + _inv(alpha_r));
        } else {
            // External gear
            phi = Math.PI / 2 - (halfTheta_d + invAlphaT - _inv(alpha_r));
        }

        points.push({ x: r * Math.cos(phi), y: r * Math.sin(phi) });
    }

    return { success: true, points };
}

// ---------------------------------------------------------------------------
// 2. ROOT FILLET TROCHOID  (epitrochoid for external, hypotrochoid for internal)
// ---------------------------------------------------------------------------
/**
 * Calculates the envelope of the cutter tip fillet arc, producing the root fillet
 * curve for one tooth centred on the +Y axis.
 *
 * @param {Object} eqResult   - Successful result from equivalentGearAlphaN0()
 * @param {number} mn         - Normal module (mm)
 * @param {number} rhoaP_coeff - Basic rack tip radius coefficient (ρaP* = ρaP/mn)
 * @param {number} z          - Number of gear teeth (negative for internal)
 * @param {number} [nPts=200] - Number of sweep samples
 * @returns {{ success: boolean, points: {x,y}[], error?: string }}
 */
function calculateRootTrochoid(eqResult, mn, rhoaP_coeff, z, nPts = 200) {
    if (!eqResult || !eqResult.success) return { success: false, error: 'Invalid equivalent gear data.' };

    const p = eqResult.value;
    const isInternal = (z < 0);
    const absZ = Math.abs(z);

    const rhoPercent = (p.rhoaP_max > 0) ? (rhoaP_coeff * mn) / p.rhoaP_max : 0;
    const rho = rhoPercent * p.gen_rhoaP_max;

    const phi_gap = Math.PI / 2 - Math.PI / absZ;
    const z0 = Math.abs(p.gen_d0 / p.gen_mt);
    const phi_range = Math.max(3 * Math.PI / z0, 3 * Math.PI / absZ);

    const points = [];

    if (z0 > 1000) {
        // --- EXACT RACK CUTTER GEOMETRY ---
        const r = Math.abs(p.gen_d) / 2;
        const ha_c = p.gen_haP0_coeff * p.gen_mn;
        const v_c = ha_c - rho;

        // Exact lateral offset of arc center for a straight rack
        const alpha_n = p.gen_alpha_t; // for a rack, alpha_t = alpha_n
        const Xc = p.gen_st0 / 2 - (ha_c - rho) * Math.tan(alpha_n) - rho / Math.cos(alpha_n);

        for (let i = 0; i <= nPts; i++) {
            const phi_g = phi_gap - phi_range / 2 + (i / nPts) * phi_range;
            const d = phi_g - phi_gap;

            const x_traj = (v_c - r) * Math.sin(d) + r * d * Math.cos(d) - Xc * Math.cos(d);
            const y_traj = (r - v_c) * Math.cos(d) + r * d * Math.sin(d) - Xc * Math.sin(d);

            const Tx = v_c * Math.cos(d) + (Xc - r * d) * Math.sin(d);
            const Ty = v_c * Math.sin(d) - (Xc - r * d) * Math.cos(d);

            const T_mag = Math.sqrt(Tx * Tx + Ty * Ty);
            if (T_mag < 1e-12) continue;

            const nx = Ty / T_mag;
            const ny = -Tx / T_mag;

            const x1 = x_traj + rho * nx, y1 = y_traj + rho * ny;
            const x2 = x_traj - rho * nx, y2 = y_traj - rho * ny;

            let xp = isInternal ? (x1 * x1 + y1 * y1 > x2 * x2 + y2 * y2 ? x1 : x2) : (x1 * x1 + y1 * y1 < x2 * x2 + y2 * y2 ? x1 : x2);
            let yp = isInternal ? (x1 * x1 + y1 * y1 > x2 * x2 + y2 * y2 ? y1 : y2) : (x1 * x1 + y1 * y1 < x2 * x2 + y2 * y2 ? y1 : y2);

            const rot = -Math.PI / absZ;
            points.push({
                x: xp * Math.cos(rot) - yp * Math.sin(rot),
                y: xp * Math.sin(rot) + yp * Math.cos(rot)
            });
        }
        // For the rack, d < 0 (i < nPts/2) corresponds to the tool plunging into the left side of the gap.
        // So the active cut goes from tip down to root. Reversing makes it root to tip.
        points.reverse();
    } else {
        // --- EXACT PINION CUTTER GEOMETRY ---
        const r1 = p.gen_d / 2;
        const r2 = p.gen_d0 / 2;
        const a = isInternal ? Math.abs(r1 - r2) : (r1 + r2);

        // Find exact arc center (Rc, theta_c) tangent to both tip circle and involute
        const Rc = p.gen_da0 / 2 - rho;
        const rb0 = p.db0 / 2;
        const alpha_c = Math.acos(Math.max(-1, Math.min(1, rb0 / Rc)));

        const tan_alpha_inv = Math.tan(alpha_c) + rho / rb0;
        const inv_alpha_t = Math.tan(p.gen_alpha_t) - p.gen_alpha_t;
        const theta_0 = p.gen_st0 / p.gen_d0 + inv_alpha_t;
        const theta_c = theta_0 - tan_alpha_inv + alpha_c;

        // Use +Xc (right flank of cutter) to cut the left side of the gap (right gear flank)
        const Xc = Rc * Math.sin(theta_c);
        const Yc = isInternal ? Rc * Math.cos(theta_c) : -Rc * Math.cos(theta_c);
        // Correct epicyclic rolling ratio: positive for external, negative for internal
        const rollingRatio = isInternal ? -(a / r2) : (a / r2);

        for (let i = 0; i <= nPts; i++) {
            const phi_g = phi_gap - phi_range / 2 + (i / nPts) * phi_range;
            const theta = (phi_g - phi_gap) * rollingRatio + (phi_gap - Math.PI / 2);

            const x_traj = Xc * Math.cos(theta) - Yc * Math.sin(theta) + a * Math.cos(phi_g);
            const y_traj = Xc * Math.sin(theta) + Yc * Math.cos(theta) + a * Math.sin(phi_g);

            const Tx = rollingRatio * (-Xc * Math.sin(theta) - Yc * Math.cos(theta)) - a * Math.sin(phi_g);
            const Ty = rollingRatio * (Xc * Math.cos(theta) - Yc * Math.sin(theta)) + a * Math.cos(phi_g);

            const T_mag = Math.sqrt(Tx * Tx + Ty * Ty);
            if (T_mag < 1e-12) continue;

            const nx = Ty / T_mag;
            const ny = -Tx / T_mag;

            const x1 = x_traj + rho * nx, y1 = y_traj + rho * ny;
            const x2 = x_traj - rho * nx, y2 = y_traj - rho * ny;

            let xp = isInternal ? (x1 * x1 + y1 * y1 > x2 * x2 + y2 * y2 ? x1 : x2) : (x1 * x1 + y1 * y1 < x2 * x2 + y2 * y2 ? x1 : x2);
            let yp = isInternal ? (x1 * x1 + y1 * y1 > x2 * x2 + y2 * y2 ? y1 : y2) : (x1 * x1 + y1 * y1 < x2 * x2 + y2 * y2 ? y1 : y2);

            points.push({ x: xp, y: yp });
        }
        // For the pinion, d > 0 (i > nPts/2) corresponds to the tool on the left side of the gap.
        // As the tool pulls out of the gap (d > 0), the stroke goes naturally from root to tip.
        // It is already in root to tip order in the second half of the array! No reverse needed.
    }

    if (points.length === 0) return { success: false, error: 'No trochoid points generated.' };
    return { success: true, points };
}

// ---------------------------------------------------------------------------
// 3. TOOTH PROFILE ASSEMBLY
// ---------------------------------------------------------------------------
/**
 * Assembles one full tooth (space-centre → space-centre) by stitching:
 *   root arc → fillet trochoid → involute → tip arc → mirror
 *
 * @param {Object} eqResult     - From equivalentGearAlphaN0()
 * @param {number} z            - Number of teeth (negative = internal)
 * @param {number} mn           - Normal module (mm)
 * @param {number} alpha_t      - Transverse pressure angle (degrees)
 * @param {number} d            - Reference diameter (mm)
 * @param {number} db           - Base diameter (mm)
 * @param {number} st           - Transverse tooth thickness at d (mm)
 * @param {number} dFf          - Root form diameter (mm)
 * @param {number} da           - Tip diameter (mm)
 * @param {number} rhoaP_coeff  - Basic rack tip radius coefficient
 * @returns {{ success: boolean, points: {x,y}[], error?: string }}
 */
function assembleToothProfile(eqResult, z, mn, alpha_t, d, db, st, dFf, da, rhoaP_coeff) {
    const absZ = Math.abs(z);
    const isInternal = (z < 0);

    const r_tip = Math.abs(da) / 2;
    const r_Ff = Math.abs(dFf) / 2;

    // Degenerate check: trochoid has consumed the entire tooth height
    if (!isInternal && r_Ff >= r_tip) {
        return { success: false, error: `Gear ${z}: dFf (${dFf.toFixed(3)}) ≥ da (${da.toFixed(3)}). Severely undercut — cannot draw profile.` };
    }
    if (isInternal && r_Ff <= r_tip) {
        return { success: false, error: `Internal gear ${z}: dFf (${dFf.toFixed(3)}) ≤ da (${da.toFixed(3)}). Severely undercut — cannot draw profile.` };
    }

    // -- 1. Generate core segments --
    const trochRes = calculateRootTrochoid(eqResult, mn, rhoaP_coeff, z);
    if (!trochRes.success) return trochRes;

    const invRes = calculateInvoluteFlank(db, d, st, alpha_t, dFf, da);
    if (!invRes.success) return invRes;
    const invPts = invRes.points;

    // Extend involute to dFf if it was clipped by db (undercut)
    const pInvStart = invPts[0];
    const r_actual_inv_start = Math.hypot(pInvStart.x, pInvStart.y);
    if (Math.abs(r_actual_inv_start - r_Ff) > 1e-4) {
        const ang = Math.atan2(pInvStart.y, pInvStart.x);
        invPts.unshift({ x: r_Ff * Math.cos(ang), y: r_Ff * Math.sin(ang) });
    }

    // -- 2. Robust Stitching: Find Root and Connection Point --
    // phi_range covers ~4× the half-pitch, so the raw trochoid extends well into
    // adjacent tooth spaces. Constrain both searches to the valid angular region to
    // avoid picking up spurious extrema far from the gap centre.
    const halfPitchLocal = Math.PI / absZ;
    const spaceCentre = Math.PI / 2 - halfPitchLocal;
    // Valid angular window: gap centre ± 1.5 half-pitches
    const angLo = spaceCentre - halfPitchLocal * 1.5;
    const angHi = Math.PI / 2 + halfPitchLocal * 0.5;

    // A) Find the True Root (extreme radius within the valid window)
    let rootIdx = -1;
    let extremeR = isInternal ? -Infinity : Infinity;
    for (let i = 0; i < trochRes.points.length; i++) {
        const p = trochRes.points[i];
        const ang = Math.atan2(p.y, p.x);
        if (ang < angLo || ang > angHi) continue;
        const r = Math.hypot(p.x, p.y);
        if (isInternal ? (r > extremeR) : (r < extremeR)) {
            extremeR = r;
            rootIdx = i;
        }
    }
    if (rootIdx === -1) rootIdx = Math.floor(trochRes.points.length / 2);

    // B) Find the Best Connection Point to the Involute (must be on the tooth side)
    let stitchIdx = -1;
    let minDist = Infinity;
    const target = invPts[0];
    for (let i = 0; i < trochRes.points.length; i++) {
        const p = trochRes.points[i];
        const ang = Math.atan2(p.y, p.x);
        // Must be between gap centre and tooth centre
        if (ang < spaceCentre - 1e-4 || ang > Math.PI / 2 + halfPitchLocal * 0.5) continue;
        const dist = Math.hypot(p.x - target.x, p.y - target.y);
        if (dist < minDist) {
            minDist = dist;
            stitchIdx = i;
        }
    }

    // -- 3. Extract the Fillet Segment --
    // We take the continuous path between the root and the stitch point
    let filletPts = [];
    if (stitchIdx !== -1) {
        if (rootIdx <= stitchIdx) {
            filletPts = trochRes.points.slice(rootIdx, stitchIdx + 1).map(p => ({ ...p }));
        } else {
            filletPts = trochRes.points.slice(stitchIdx, rootIdx + 1).reverse().map(p => ({ ...p }));
        }
    }

    // -- 4. Radius Culling and Angular Alignment --
    if (filletPts.length > 0) {
        // A) Radius Culling: Remove points that extend past the form diameter
        // (Due to discrete simulation steps, the 'closest' point might be slightly too high)
        while (filletPts.length > 1) {
            const last = filletPts[filletPts.length - 1];
            const r = Math.hypot(last.x, last.y);
            // External: cull if r > r_Ff. Internal: cull if r < r_Ff.
            if (isInternal ? (r < r_Ff - 1e-6) : (r > r_Ff + 1e-6)) {
                filletPts.pop();
            } else {
                break;
            }
        }

        // B) Angular Alignment: Rotate to match the involute flank angle
        const pFilletEnd = filletPts[filletPts.length - 1];
        const pInvStart = invPts[0];

        const angFillet = Math.atan2(pFilletEnd.y, pFilletEnd.x);
        const angInv = Math.atan2(pInvStart.y, pInvStart.x);
        const deltaTheta = angInv - angFillet;

        if (Math.abs(deltaTheta) > 1e-7) {
            const cosD = Math.cos(deltaTheta);
            const sinD = Math.sin(deltaTheta);
            for (let i = 0; i < filletPts.length; i++) {
                const p = filletPts[i];
                const nx = p.x * cosD - p.y * sinD;
                const ny = p.x * sinD + p.y * cosD;
                p.x = nx;
                p.y = ny;
            }
        }

        // C) Radius Snapping: Ensure the final point is exactly on the r_Ff circle
        // This eliminates the tiny radial gap that remains after rotation
        const last = filletPts[filletPts.length - 1];
        const rCurrent = Math.hypot(last.x, last.y);
        if (rCurrent > 0) {
            const scale = r_Ff / rCurrent;
            last.x *= scale;
            last.y *= scale;
        }
    }

    // -- 6. Tangency Snap (Root Refinement) --
    // We refine the rootPt using quadratic interpolation of the radii around rootIdx.
    // This finds the true mathematical extremum where the trochoid is tangent to the root circle.
    let refinedRootPt = filletPts[0] || (trochRes.points[rootIdx] ? { ...trochRes.points[rootIdx] } : null);
    if (refinedRootPt && rootIdx > 0 && rootIdx < trochRes.points.length - 1) {
        const p0 = trochRes.points[rootIdx - 1], p1 = trochRes.points[rootIdx], p2 = trochRes.points[rootIdx + 1];
        const a0 = Math.atan2(p0.y, p0.x), a1 = Math.atan2(p1.y, p1.x), a2 = Math.atan2(p2.y, p2.x);
        const r0 = Math.hypot(p0.x, p0.y), r1 = Math.hypot(p1.x, p1.y), r2 = Math.hypot(p2.x, p2.y);

        // Fit a parabola r(a) = A*a^2 + B*a + C through the three points
        const det = (a0 - a1) * (a0 - a2) * (a1 - a2);
        if (Math.abs(det) > 1e-12) {
            const A = (a2 * (r1 - r0) + a1 * (r0 - r2) + a0 * (r2 - r1)) / det;
            const B = (a2 * a2 * (r0 - r1) + a1 * a1 * (r2 - r0) + a0 * a0 * (r1 - r2)) / det;
            const peakA = -B / (2 * A);
            const peakR = A * peakA * peakA + B * peakA + (r0 - A * a0 * a0 - B * a0);

            // Only use refinement if the peak is reasonably close to the sampled point
            if (Math.abs(peakA - a1) < Math.abs(a2 - a0)) {
                refinedRootPt = { x: peakR * Math.cos(peakA), y: peakR * Math.sin(peakA) };
                if (filletPts.length > 0) filletPts[0] = refinedRootPt;
            }
        }
    }

    const rootPt = refinedRootPt;
    const rDeepest = rootPt ? Math.hypot(rootPt.x, rootPt.y) : 0;

    // -- 7. Tip arc (involute end → tooth centreline at π/2) --
    // -- 7. Tip arc (involute end → tooth centreline at π/2) --
    const pInvEnd = invPts[invPts.length - 1];
    const r_actual_inv_end = Math.hypot(pInvEnd.x, pInvEnd.y);
    if (isInternal ? (r_actual_inv_end > r_tip + 1e-4) : (r_actual_inv_end < r_tip - 1e-4)) {
        const ang = Math.atan2(pInvEnd.y, pInvEnd.x);
        invPts.push({ x: r_tip * Math.cos(ang), y: r_tip * Math.sin(ang) });
    }

    const invTipAngle = Math.atan2(invPts[invPts.length - 1].y, invPts[invPts.length - 1].x);
    const tipArc = _arcPoints(r_tip, invTipAngle, Math.PI / 2, 16);

    // -- 8. Root arc (gap centre → fillet start) --
    const halfPitch = Math.PI / absZ;
    const spaceCentreAngle = Math.PI / 2 - halfPitch;
    let rootArc = [];
    const filletStartAngle = rootPt ? Math.atan2(rootPt.y, rootPt.x) : spaceCentreAngle;

    // The root arc must always sweep *toward* the tooth (increasing angle toward π/2).
    // For internal gears the negative rolling ratio places the trochoid's deepest
    // point slightly on the wrong (left-gap) side of the gap centre, i.e.
    // filletStartAngle < spaceCentreAngle.  Drawing an arc in that direction
    // produces a backward hook.  Only draw the arc when the fillet root is
    // genuinely on the tooth side and within one half-pitch of the gap centre.
    const arcSweep = filletStartAngle - spaceCentreAngle; // positive = toward tooth

    if (rootPt && arcSweep > 1e-4 && arcSweep <= halfPitch) {
        rootArc = _arcPoints(rDeepest, spaceCentreAngle, filletStartAngle, 12);
    } else {
        // Either the root is exactly at the gap centre, or it is on the wrong
        // angular side — in both cases a single anchor point is correct.
        if (rootPt) {
            rootArc = [{ x: rDeepest * Math.cos(spaceCentreAngle), y: rDeepest * Math.sin(spaceCentreAngle) }];
        }
    }

    // -- 9. Final Assembly & Mirror --
    const rightHalf = [...rootArc, ...filletPts, ...invPts, ...tipArc];
    const leftHalf = rightHalf.slice().reverse().map(p => ({ x: -p.x, y: p.y }));

    return { success: true, points: [...rightHalf, ...leftHalf] };
}

// Helper: evenly-spaced points on a circular arc
function _arcPoints(r, angStart, angEnd, n, center = { x: 0, y: 0 }) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
        const ang = angStart + (i / n) * (angEnd - angStart);
        pts.push({ x: center.x + r * Math.cos(ang), y: center.y + r * Math.sin(ang) });
    }
    return pts;
}

// ---------------------------------------------------------------------------
// 4. FULL GEAR PROFILE  (pattern one tooth |z| times)
// ---------------------------------------------------------------------------
/**
 * Generates the complete 2D transverse profile of a gear.
 *
 * @param {Object} cache - gearGeomCache entry populated by main.js after "Calculate All"
 *   Required fields: { z, mn, alpha_t, d, db, st, dFf, da, rhoaP_coeff, eqResult }
 * @returns {{ success: boolean, points: {x,y}[], da: number, error?: string }}
 */
function calculateGearProfile(cache) {
    const { z, mn, alpha_t, d, db, st, dFf, da, rhoaP_coeff, eqResult } = cache;

    if (!eqResult || !eqResult.success) {
        return { success: false, error: 'Missing or failed eqResult in cache.' };
    }

    // Assemble one tooth
    const toothRes = assembleToothProfile(eqResult, z, mn, alpha_t, d, db, st, dFf, da, rhoaP_coeff);
    if (!toothRes.success) return toothRes;

    const toothPts = toothRes.points;
    const absZ = Math.abs(z);
    const angleStep = (2 * Math.PI) / absZ;
    const fullProfile = [];

    for (let i = 0; i < absZ; i++) {
        const angle = i * angleStep;   // +i: each tooth connects end-to-end CCW
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        for (const p of toothPts) {
            fullProfile.push({
                x: p.x * cosA - p.y * sinA,
                y: p.x * sinA + p.y * cosA
            });
        }
    }

    return {
        success: true,
        points: fullProfile,
        geom: {
            z: z,
            da: Math.abs(da),
            dFf: Math.abs(dFf),
            db: Math.abs(db),
            df: cache.df ? Math.abs(cache.df) : (Math.abs(dFf) - mn),
            d: Math.abs(d)
        }
    };
}

// ---------------------------------------------------------------------------
// 5. CANVAS RENDERER  (minimal — visualization phase will expand this)
// ---------------------------------------------------------------------------
/**
 * Renders a gear profile onto an HTML5 canvas element.
 * Called internally by main.js after calculateGearProfile() succeeds.
 *
 * @param {HTMLCanvasElement} canvas - The target canvas element
 * @param {{x:number,y:number}[]} points - Full gear outline points
 * @param {number} da - Tip diameter (mm), used to set the scale
 */
function _drawGear2D(canvas, points, geom, di, holePattern) {
    if (!canvas) return;

    const id = canvas.id;
    if (!canvasStates[id]) {
        canvasStates[id] = {
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            points: points || [],
            geom: geom || null,
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0,
            lastMiddleClick: 0,
            showGrid: false,
            isBoxZoomMode: false,
            isBoxZooming: false,
            boxStartX: 0,
            boxStartY: 0,
            boxEndX: 0,
            boxEndY: 0
        };
    }

    const state = canvasStates[id];
    if (points) state.points = points;
    if (geom) state.geom = geom;
    if (di !== undefined) state.di = di;
    if (holePattern !== undefined) state.holePattern = holePattern;

    const pts = state.points;
    const dia = state.geom ? state.geom.da : 0;

    if (!pts || pts.length === 0) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const padding = 0.08;
    const maxR = Math.max(state.geom.da, state.geom.df, state.di || 0) / 2;
    const baseScale = (Math.min(W, H) / 2 * (1 - padding)) / maxR;
    state.baseScale = baseScale;
    const currentScale = baseScale * state.zoom;

    ctx.save();
    ctx.translate(W / 2 + state.offsetX, H / 2 + state.offsetY);
    ctx.scale(currentScale, -currentScale);

    // 0. Draw Polar Grid (Concentric Circles)
    if (state.showGrid && dia > 0) {
        ctx.lineWidth = 0.5 / currentScale;
        ctx.strokeStyle = '#f0f0f0';

        const maxDimMM = Math.max(W, H) / currentScale;
        // Target between 3 and 5 divisions across the largest dimension
        let step = Math.pow(10, Math.floor(Math.log10(maxDimMM / 3)));
        if (maxDimMM / (step * 5) >= 3) step *= 5;
        else if (maxDimMM / (step * 2.5) >= 3) step *= 2.5;
        else if (maxDimMM / (step * 2) >= 3) step *= 2;

        // Calculate visible radius range to avoid drawing thousands of off-screen circles
        const corners = [
            { x: -W / 2, y: -H / 2 },
            { x: W / 2, y: -H / 2 },
            { x: -W / 2, y: H / 2 },
            { x: W / 2, y: H / 2 }
        ];

        let maxR_view = 0;
        let minR_view = Infinity;
        for (let c of corners) {
            const gx = (c.x - state.offsetX) / currentScale;
            const gy = (c.y - state.offsetY) / currentScale;
            const r = Math.hypot(gx, gy);
            if (r > maxR_view) maxR_view = r;
            if (r < minR_view) minR_view = r;
        }

        // If the origin (0,0) is inside the viewport, minR_view should be 0
        const originX = -state.offsetX;
        const originY = -state.offsetY;
        if (originX >= -W / 2 && originX <= W / 2 && originY >= -H / 2 && originY <= H / 2) {
            minR_view = 0;
        }

        // Start drawing from the first visible step
        const startR = Math.floor(minR_view / step) * step;
        for (let r = startR; r <= maxR_view; r += step) {
            if (r <= 0) continue;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // Draw Diameter Labels
        ctx.save();
        ctx.scale(1 / currentScale, -1 / currentScale); // Revert scale for text rendering
        ctx.fillStyle = '#9aa0a6';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const leftBound = -(W / 2 + state.offsetX) + 20;
        const rightBound = W / 2 - state.offsetX - 20;
        const topBound = -(H / 2 + state.offsetY) + 20;
        const bottomBound = H / 2 - state.offsetY - 20;

        function getValidLabelPosition(R) {
            // 1. Prefer ideal 45 deg angle (top right)
            const idealX = R * Math.cos(-Math.PI / 4);
            const idealY = R * Math.sin(-Math.PI / 4);
            if (idealX >= leftBound && idealX <= rightBound && idealY >= topBound && idealY <= bottomBound) {
                return { x: idealX, y: idealY };
            }

            const candidates = [];

            // horizontal line intersections
            const hLines = [-state.offsetY, topBound, bottomBound];
            for (let y of hLines) {
                if (R >= Math.abs(y)) {
                    let dx = Math.sqrt(R * R - y * y);
                    candidates.push({ x: dx, y: y });
                    candidates.push({ x: -dx, y: y });
                }
            }

            // vertical line intersections
            const vLines = [-state.offsetX, leftBound, rightBound];
            for (let x of vLines) {
                if (R >= Math.abs(x)) {
                    let dy = Math.sqrt(R * R - x * x);
                    candidates.push({ x: x, y: dy });
                    candidates.push({ x: x, y: -dy });
                }
            }

            // Filter to those visibly on-screen (with padding)
            const valid = candidates.filter(p =>
                p.x >= leftBound && p.x <= rightBound &&
                p.y >= topBound && p.y <= bottomBound
            );

            if (valid.length > 0) {
                // Return intersection closest to the center of the screen
                valid.sort((a, b) => {
                    const da = Math.hypot(a.x - (-state.offsetX), a.y - (-state.offsetY));
                    const db = Math.hypot(b.x - (-state.offsetX), b.y - (-state.offsetY));
                    return da - db;
                });
                return valid[0];
            }
            return null;
        }

        for (let r = step; r <= maxR_view; r += step) {
            const R = r * currentScale;
            const pos = getValidLabelPosition(R);
            if (pos) {
                let val = (r * 2).toFixed(2); // Display diameter with 2 decimal places

                const text = 'Ø' + val;

                ctx.fillStyle = '#9aa0a6';
                ctx.fillText(text, pos.x, pos.y);
            }
        }

        ctx.restore();
    }



    // 3. Draw Gear Body (Solid Fill)
    const isInternal = state.geom.z < 0;
    ctx.beginPath();

    if (isInternal && state.di > 0) {
        // Internal Gear: Draw annulus boundary
        // Path 1: Outer rim (CCW)
        ctx.arc(0, 0, state.di / 2, 0, 2 * Math.PI, false);
        // Path 2: Teeth profile (CW)
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
    } else {
        // External Gear: Fill the teeth profile
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
    }

    ctx.fillStyle = '#7f8c8d'; // Medium metallic gray for better contrast
    ctx.fill('evenodd');

    // Draw Outline (Strokes all boundaries in the current path)
    ctx.lineWidth = 1.5 / currentScale;
    ctx.strokeStyle = '#2c3e50';
    ctx.stroke();

    // Add holes using destination-out so it doesn't mess with the evenodd winding of the self-intersecting gear profile
    if (state.holePattern) {
        const { holeCircle, holeDiameter, numHoles } = state.holePattern;
        if (holeCircle > 0 && holeDiameter > 0 && numHoles > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();

            const r_hc = holeCircle / 2;
            const r_h = holeDiameter / 2;
            const angleStep = 2 * Math.PI / numHoles;

            for (let i = 0; i < numHoles; i++) {
                const angle = i * angleStep;
                const hx = r_hc * Math.cos(angle);
                const hy = r_hc * Math.sin(angle);
                ctx.moveTo(hx + r_h, hy);
                ctx.arc(hx, hy, r_h, 0, 2 * Math.PI);
            }

            ctx.fill();
            ctx.restore();

            // Draw hole outlines
            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < numHoles; i++) {
                const angle = i * angleStep;
                const hx = r_hc * Math.cos(angle);
                const hy = r_hc * Math.sin(angle);
                ctx.moveTo(hx + r_h, hy);
                ctx.arc(hx, hy, r_h, 0, 2 * Math.PI);
            }
            ctx.lineWidth = 1.5 / currentScale;
            ctx.strokeStyle = '#2c3e50';
            ctx.stroke();
            ctx.restore();
        }
    }

    // 4. Center Bore / Hole (Decoration)
    if (!isInternal) {
        // For external gears, draw the bore hole decoration
        ctx.beginPath();
        const boreR = state.di > 0 ? state.di / 2 : maxR * 0.20;
        ctx.arc(0, 0, boreR, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 1 / currentScale;
        ctx.strokeStyle = '#2c3e50';
        ctx.stroke();
    }

    // 3. Draw Graph Lines (Axes) - Now on top
    ctx.lineWidth = 0.5 / currentScale;
    ctx.strokeStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(-dia, 0); ctx.lineTo(dia, 0); // X axis
    ctx.moveTo(0, -dia); ctx.lineTo(0, dia); // Y axis
    ctx.stroke();

    // 4. Draw Reference Circles - Now on top
    if (state.geom) {
        ctx.setLineDash([5 / currentScale, 5 / currentScale]);
        ctx.lineWidth = 1.2 / currentScale; // Slightly thicker for visibility

        const drawCircle = (d_val, color) => {
            if (!d_val || d_val <= 0) return;
            ctx.beginPath();
            ctx.arc(0, 0, d_val / 2, 0, 2 * Math.PI);
            ctx.strokeStyle = color;
            ctx.stroke();
        };

        drawCircle(state.geom.da, '#e74c3c');  // Tip: Red
        drawCircle(state.geom.dFf, '#f1c40f'); // Form (Min Active Root): Yellow
        drawCircle(state.geom.db, '#9b59b6');  // Base: Purple
        drawCircle(state.geom.df, '#3498db');  // Root: Blue
        ctx.setLineDash([]); // Reset
    }

    ctx.restore();

    // 4. Draw Box Zoom Selection
    if (state.isBoxZooming) {
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        const x = Math.min(state.boxStartX, state.boxEndX);
        const y = Math.min(state.boxStartY, state.boxEndY);
        const bw = Math.abs(state.boxEndX - state.boxStartX);
        const bh = Math.abs(state.boxEndY - state.boxStartY);
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeRect(x, y, bw, bh);
    }
}

/**
 * Generates the 2D transverse profile of the cutting tool.
 */
function calculateToolProfile(cache) {
    const { eqResult, toolType, z0 } = cache;

    if (!eqResult || !eqResult.success) {
        return { success: false, error: 'Missing or failed eqResult in cache.' };
    }

    const p = eqResult.value;

    if (toolType === 'shaper') {
        const toolZ = z0;
        const d = p.gen_d0;
        const db = p.db0;
        const da = p.gen_da0;
        const df = p.gen_df0;
        const st = p.gen_st0;
        const alpha_t = p.gen_alpha_t * (180 / Math.PI);
        const rho = p.actual_gen_fillet || 0;
        const dFa0 = p.gen_dFa0_act || da;

        // Generate involute from base circle up to active tip diameter dFa0
        const invRes = calculateInvoluteFlank(db, d, st, alpha_t, db, dFa0);
        if (!invRes.success) return invRes;
        const invPts = invRes.points;

        const rightHalf = [];

        // 1. Root Arc (from tooth space center to start of involute along base circle)
        const spaceAng = Math.PI / 2 - Math.PI / toolZ;
        const startAng = Math.atan2(invPts[0].y, invPts[0].x);
        const r_base = db / 2;
        const rootArc = (startAng > spaceAng) ? _arcPoints(r_base, spaceAng, startAng, 10) : [{ x: r_base * Math.cos(spaceAng), y: r_base * Math.sin(spaceAng) }];

        // 2. Tip Fillet Arc & Tip Arc
        const r_tip = da / 2;
        const lastInv = invPts[invPts.length - 1];
        let filletArc = [];
        let tipStartAng = Math.atan2(lastInv.y, lastInv.x);

        if (rho > 1e-4 && dFa0 < da) {
            // Normal to involute at end point points towards base circle tangent
            const r_last = Math.hypot(lastInv.x, lastInv.y);
            const r_b = db / 2;
            const cosGamma = Math.min(1, r_b / r_last);
            const gamma = Math.acos(cosGamma);
            const theta = Math.atan2(lastInv.y, lastInv.x);
            // Involute normal pointing inwards into the tooth body
            const normX = -Math.sin(theta + gamma);
            const normY = Math.cos(theta + gamma);
            const cX = lastInv.x + rho * normX;
            const cY = lastInv.y + rho * normY;
            const center = { x: cX, y: cY };

            const angStart = Math.atan2(lastInv.y - cY, lastInv.x - cX);
            const angEnd = Math.atan2(cY, cX);
            tipStartAng = angEnd;
            filletArc = _arcPoints(rho, angStart, angEnd, 10, center);
        }

        const tipArc = (Math.PI / 2 > tipStartAng) ? _arcPoints(r_tip, tipStartAng, Math.PI / 2, 8) : [{ x: 0, y: r_tip }];

        rightHalf.push(...rootArc, ...invPts, ...filletArc, ...tipArc);
        const leftHalf = rightHalf.slice().reverse().map(pt => ({ x: -pt.x, y: pt.y }));
        // Ensure no duplicate tip center point
        if (Math.abs(leftHalf[0].x) < 1e-6) leftHalf.shift();
        const toothPts = [...rightHalf, ...leftHalf];

        const angleStep = (2 * Math.PI) / toolZ;
        const fullProfile = [];

        for (let i = 0; i < toolZ; i++) {
            const angle = i * angleStep;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);
            for (const pt of toothPts) {
                fullProfile.push({
                    x: pt.x * cosA - pt.y * sinA,
                    y: pt.x * sinA + pt.y * cosA
                });
            }
        }
        return { success: true, points: fullProfile, toolType: 'shaper', geom: { da: da, db: db, d: d, df: df, z: toolZ } };

    } else {
        const pitch = Math.PI * p.gen_mt;
        const ha = p.gen_haP0_coeff * p.gen_mn;
        const hf = (p.gen_hfP0_coeff + 0.2) * p.gen_mn;
        //JVD, 2026-05-20: sonnet 4.6 made this section. It also doesn't fix the issue of the rack not rendering properly. 
        //Instead of the tip of the gear hitting the root of the rack, the root of the rack is self-intersecting.

        // const ha = p.gen_haP0_coeff * p.gen_mn; // rack tip at gear root circle (correct, unchanged)
        // // Rack root must clear the gear tip: hf anchored to da/2 - gen_d/2, then add tool clearance.
        // // This ensures rack whole depth = gear whole depth + clearance, regardless of gen_mn.
        // const _clearance = (cache.hfPCoeff !== undefined && cache.haPCoeff !== undefined)
        //     ? (cache.hfPCoeff - cache.haPCoeff) * cache.mn
        //     : p.gen_hfP0_coeff * p.gen_mn; // fallback to old behaviour if coefficients missing
        // const hf = (cache.da / 2 - p.gen_d / 2) + _clearance;
        const alpha = p.gen_alpha_t;
        const tanA = Math.tan(alpha);
        const s0 = p.gen_st0;
        const rho = p.actual_gen_fillet || 0;

        const numTeeth = 20;
        const fullProfile = [];

        const dy_flank = rho * (1 - Math.sin(alpha));
        const dx_inset = (Math.cos(alpha) > 1e-4) ? rho * (1 - Math.sin(alpha)) / Math.cos(alpha) : 0;

        for (let i = -Math.floor(numTeeth / 2); i <= Math.floor(numTeeth / 2); i++) {
            const offset = i * pitch;

            // 1. Left Root Corner (at y = -hf)
            const x_sharp_root_L = offset - s0 / 2 - hf * tanA;
            if (i === -Math.floor(numTeeth / 2)) {
                fullProfile.push({ x: offset - pitch / 2, y: -hf });
            }
            fullProfile.push({ x: x_sharp_root_L, y: -hf });

            // 2. Left Tip Corner (at y = ha)
            const x_sharp_tip_L = offset - s0 / 2 + ha * tanA;
            const c_tip_L = { x: x_sharp_tip_L + dx_inset, y: ha - rho };
            if (rho > 1e-4) {
                const tipArcL = _arcPoints(rho, Math.PI - alpha, Math.PI / 2, 6, c_tip_L);
                fullProfile.push(...tipArcL);
            } else {
                fullProfile.push({ x: x_sharp_tip_L, y: ha });
            }

            // 3. Right Tip Corner (at y = ha)
            const x_sharp_tip_R = offset + s0 / 2 - ha * tanA;
            const c_tip_R = { x: x_sharp_tip_R - dx_inset, y: ha - rho };
            if (rho > 1e-4) {
                const tipArcR = _arcPoints(rho, Math.PI / 2, alpha, 6, c_tip_R);
                fullProfile.push(...tipArcR);
            } else {
                fullProfile.push({ x: x_sharp_tip_R, y: ha });
            }

            // 4. Right Root Corner (at y = -hf)
            const x_sharp_root_R = offset + s0 / 2 + hf * tanA;
            fullProfile.push({ x: x_sharp_root_R, y: -hf });

            if (i === Math.floor(numTeeth / 2)) {
                fullProfile.push({ x: offset + pitch / 2, y: -hf });
            }
        }
        return { success: true, points: fullProfile, toolType: 'hob', geom: { da: numTeeth * pitch, d: numTeeth * pitch, df: numTeeth * pitch, isRack: true } };
    }
}

function _drawTool2D(canvas, toolPts, toolRes) {
    if (!canvas || !toolPts || toolPts.length === 0) return;
    const id = canvas.id;
    if (!canvasStates[id]) {
        canvasStates[id] = { zoom: 1, offsetX: 0, offsetY: 0 };
    }
    const state = canvasStates[id];
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const maxR = toolRes.geom.da / 2;
    const padding = 0.1;
    const baseScale = (Math.min(W, H) / 2 * (1 - padding)) / maxR;
    state.baseScale = baseScale;
    const currentScale = baseScale * state.zoom;

    ctx.save();
    ctx.translate(W / 2 + state.offsetX, H / 2 + state.offsetY);
    ctx.scale(currentScale, -currentScale);

    ctx.beginPath();
    ctx.moveTo(toolPts[0].x, toolPts[0].y);
    for (let i = 1; i < toolPts.length; i++) {
        ctx.lineTo(toolPts[i].x, toolPts[i].y);
    }
    if (!toolRes.geom.isRack) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(230, 126, 34, 0.5)';
        ctx.fill('evenodd');
    } else {
        const depth = Math.abs(toolPts[toolPts.length - 1].x - toolPts[0].x) * 0.15;
        ctx.lineTo(toolPts[toolPts.length - 1].x, toolPts[toolPts.length - 1].y - depth);
        ctx.lineTo(toolPts[0].x, toolPts[0].y - depth);
        ctx.closePath();
        ctx.fillStyle = 'rgba(230, 126, 34, 0.5)';
        ctx.fill();
    }

    ctx.lineWidth = 1.5 / currentScale;
    ctx.strokeStyle = '#d35400';
    ctx.stroke();

    // Reference Circles / Lines for Tool
    if (toolRes.geom) {
        ctx.setLineDash([5 / currentScale, 5 / currentScale]);
        ctx.lineWidth = 1.2 / currentScale;
        if (!toolRes.geom.isRack) {
            const drawCirc = (d_val, col) => {
                if (!d_val || d_val <= 0) return;
                ctx.beginPath();
                ctx.arc(0, 0, d_val / 2, 0, 2 * Math.PI);
                ctx.strokeStyle = col;
                ctx.stroke();
            };
            drawCirc(toolRes.geom.da, '#e74c3c'); // Tip: Red
            drawCirc(toolRes.geom.db, '#9b59b6'); // Base: Purple
            drawCirc(toolRes.geom.df, '#3498db'); // Root: Blue
            drawCirc(toolRes.geom.d, '#2ecc71');  // Pitch: Green
        } else {
            const W_span = Math.max(W, H) * 2;
            const drawLine = (y_val, col) => {
                ctx.beginPath();
                ctx.moveTo(-W_span, y_val);
                ctx.lineTo(W_span, y_val);
                ctx.strokeStyle = col;
                ctx.stroke();
            };
            const p = toolRes.geom;
            if (p.ha) drawLine(p.ha, '#e74c3c');
            drawLine(0, '#2ecc71');
            if (p.hf) drawLine(-p.hf, '#3498db');
        }
        ctx.setLineDash([]);
    }

    ctx.restore();

    if (state.isBoxZooming) {
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        const x = Math.min(state.boxStartX, state.boxEndX);
        const y = Math.min(state.boxStartY, state.boxEndY);
        const bw = Math.abs(state.boxEndX - state.boxStartX);
        const bh = Math.abs(state.boxEndY - state.boxStartY);
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeRect(x, y, bw, bh);
    }
}

function _drawInMesh2D(canvas, gearPts, toolPts, gearCache, toolRes, rollPhase = 0) {
    if (!canvas || !gearPts || !toolPts || gearPts.length === 0) return;
    const id = canvas.id;
    if (!canvasStates[id]) {
        canvasStates[id] = { zoom: 1, offsetX: 0, offsetY: 0 };
    }
    const state = canvasStates[id];
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const maxR = Math.max(gearCache.da / 2, toolRes.geom.da / 2);
    const padding = 0.1;
    // Scale down a bit more to fit both
    const baseScale = (Math.min(W, H) / 2 * (1 - padding)) / (maxR * 1.5);
    state.baseScale = baseScale;
    const currentScale = baseScale * state.zoom;

    ctx.save();
    ctx.translate(W / 2 + state.offsetX, H / 2 + state.offsetY);
    ctx.scale(currentScale, -currentScale);

    const isInternal = gearCache.z < 0;
    const d1 = Math.abs(gearCache.d);

    // Calculate generating center distance a
    // Shaper: aw0 = (z + z0) / 2 * mt
    // Hob: tool reference line is tangent to gear generating pitch circle

    const eq = gearCache.eqResult.value;

    // Draw Gear
    ctx.save();
    // Gear rolls by phi
    const phi = rollPhase * (2 * Math.PI / Math.abs(gearCache.z));
    ctx.rotate(phi + Math.PI / Math.abs(gearCache.z));

    ctx.beginPath();
    if (isInternal) {
        const diVal = gearCache.di || 0;
        if (diVal > 0) {
            ctx.arc(0, 0, diVal / 2, 0, 2 * Math.PI, false);
        } else {
            ctx.arc(0, 0, gearCache.da / 2 + 2 * gearCache.mn, 0, 2 * Math.PI, false);
        }
        ctx.moveTo(gearPts[0].x, gearPts[0].y);
        for (let i = 1; i < gearPts.length; i++) ctx.lineTo(gearPts[i].x, gearPts[i].y);
        ctx.closePath();
    } else {
        ctx.moveTo(gearPts[0].x, gearPts[0].y);
        for (let i = 1; i < gearPts.length; i++) ctx.lineTo(gearPts[i].x, gearPts[i].y);
        ctx.closePath();

        // Center bore
        const boreR = gearCache.di > 0 ? gearCache.di / 2 : (gearCache.da / 2) * 0.20;
        ctx.moveTo(boreR, 0);
        ctx.arc(0, 0, boreR, 0, 2 * Math.PI);
    }

    // Add hole pattern
    const hp = gearCache.holePattern;
    if (hp && hp.holeCircle > 0 && hp.holeDiameter > 0 && hp.numHoles > 0) {
        const r_hc = hp.holeCircle / 2;
        const r_h = hp.holeDiameter / 2;
        const angleStep = 2 * Math.PI / hp.numHoles;
        for (let h = 0; h < hp.numHoles; h++) {
            const angle = h * angleStep;
            const hx = r_hc * Math.cos(angle);
            const hy = r_hc * Math.sin(angle);
            ctx.moveTo(hx + r_h, hy);
            ctx.arc(hx, hy, r_h, 0, 2 * Math.PI);
        }
    }

    ctx.fillStyle = '#7f8c8d';
    ctx.fill('evenodd');
    ctx.lineWidth = 1.5 / currentScale;
    ctx.strokeStyle = '#2c3e50';
    ctx.stroke();

    // Gear Reference Circles in Meshing View
    ctx.setLineDash([5 / currentScale, 5 / currentScale]);
    ctx.lineWidth = 1.2 / currentScale;
    const drawCirc = (d_val, col) => {
        if (!d_val || d_val <= 0) return;
        ctx.beginPath();
        ctx.arc(0, 0, d_val / 2, 0, 2 * Math.PI);
        ctx.strokeStyle = col;
        ctx.stroke();
    };
    drawCirc(gearCache.da, '#e74c3c'); // Tip: Red
    drawCirc(gearCache.db, '#9b59b6'); // Base: Purple
    drawCirc(gearCache.df, '#3498db'); // Root: Blue
    drawCirc(eq.gen_d, '#2ecc71');  // Generating Pitch: Green
    ctx.setLineDash([]);

    ctx.restore();

    // Draw Tool
    ctx.save();
    if (toolRes.toolType === 'shaper') {
        const d0 = eq.gen_d0;
        const a = Math.abs(eq.shaper_gen_aw0);

        ctx.translate(0, a); // Tool center is at y = a

        // Exact epicyclic rolling ratio: gear generating pitch dia / cutter generating pitch dia
        const ratio = isInternal ? Math.abs(eq.gen_d / eq.gen_d0) : -Math.abs(eq.gen_d / eq.gen_d0);
        // Tool needs to be rotated 180 deg to face the gear if external
        const initialToolRot = isInternal ? 0 : Math.PI;
        ctx.rotate(initialToolRot + phi * ratio);

        ctx.beginPath();
        ctx.moveTo(toolPts[0].x, toolPts[0].y);
        for (let i = 1; i < toolPts.length; i++) ctx.lineTo(toolPts[i].x, toolPts[i].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(230, 126, 34, 0.5)'; // semi-transparent orange
        ctx.fill();
        ctx.lineWidth = 1.5 / currentScale;
        ctx.strokeStyle = '#d35400';
        ctx.stroke();

        // Shaper Cutter Reference Circles in Meshing View
        ctx.setLineDash([5 / currentScale, 5 / currentScale]);
        ctx.lineWidth = 1.2 / currentScale;
        const drawToolCirc = (d_val, col) => {
            if (!d_val || d_val <= 0) return;
            ctx.beginPath();
            ctx.arc(0, 0, d_val / 2, 0, 2 * Math.PI);
            ctx.strokeStyle = col;
            ctx.stroke();
        };
        drawToolCirc(eq.gen_da0, '#e74c3c'); // Tip: Red
        drawToolCirc(eq.db0, '#9b59b6');     // Base: Purple
        drawToolCirc(eq.gen_df0, '#3498db'); // Root: Blue
        drawToolCirc(eq.gen_d0, '#2ecc71');  // Pitch: Green
        ctx.setLineDash([]);
    } else {
        // Hob
        const a = eq.gen_d / 2; // Exact generating pitch line distance
        const dx = -phi * a; // Exact rolling translation on generating pitch circle
        ctx.translate(dx, a);
        ctx.rotate(isInternal ? 0 : Math.PI); // Point teeth towards gear root

        ctx.beginPath();
        ctx.moveTo(toolPts[0].x, toolPts[0].y);
        for (let i = 1; i < toolPts.length; i++) ctx.lineTo(toolPts[i].x, toolPts[i].y);
        ctx.lineWidth = 1.5 / currentScale;
        ctx.strokeStyle = '#d35400';
        ctx.stroke();

        // Fill underneath the rack
        ctx.lineTo(toolPts[toolPts.length - 1].x, toolPts[toolPts.length - 1].y - eq.gen_mn * 10);
        ctx.lineTo(toolPts[0].x, toolPts[0].y - eq.gen_mn * 10);
        ctx.closePath();
        ctx.fillStyle = 'rgba(230, 126, 34, 0.5)';
        ctx.fill();
    }
    ctx.restore();

    ctx.restore();

    if (state.isBoxZooming) {
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        const x = Math.min(state.boxStartX, state.boxEndX);
        const y = Math.min(state.boxStartY, state.boxEndY);
        const bw = Math.abs(state.boxEndX - state.boxStartX);
        const bh = Math.abs(state.boxEndY - state.boxStartY);
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeRect(x, y, bw, bh);
    }
}

function _drawFullAssembly2D(canvas, state) {
    if (!canvas || !window.assemblyCache || window.assemblyCache.length === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const config = document.getElementById('gear-config')?.value || 'pair';
    const gearCount = (config === 'pair') ? 2 : ((config === 'planetary' || config === '3-train') ? 3 : 4);

    const aw1 = parseFloat(document.getElementById('aw1')?.value) || 50;
    const aw2 = parseFloat(document.getElementById('aw2')?.value) || 50;
    const aw3 = parseFloat(document.getElementById('aw3')?.value) || 50;

    const rollPhase = state.rollPhase || 0;
    const g1 = window.assemblyCache[1];
    if (!g1 || !g1.cache) return;

    const z1 = Math.abs(g1.cache.z || 20);
    const phi = rollPhase * (2 * Math.PI / z1); // driver rotation in radians

    // All teeth generated by assembleToothProfile are centered on +y axis (angle Math.PI/2).
    // Rotating by -Math.PI/2 aligns tooth 0 exactly along the +x axis (angle 0).
    const baseRot = -Math.PI / 2;
    const gearInstances = [];

    // Gear 1 (Driver / Sun) at (0, 0)
    // Contact with G2 is at angle 0 (+x axis). Tip at 0.
    gearInstances.push({
        idx: 1,
        x: 0,
        y: 0,
        rot: baseRot + phi,
        data: g1,
        col: '#3498db'
    });

    let z2 = 20, z3 = 20, z4 = 20;
    const k_rot = [0, 1]; // 1-based indexing for matching gear indices

    // Gear 2 (Planet / Driven)
    const g2 = window.assemblyCache[2];
    if (g2 && g2.cache && gearCount >= 2) {
        z2 = Math.abs(g2.cache.z || 20);
        const s1 = (g1.cache.z < 0 || g2.cache.z < 0) ? 1 : -1;
        k_rot[2] = k_rot[1] * s1 * (Math.abs(g1.cache.z) / Math.abs(g2.cache.z));
        
        let numPlanets = 1;
        if (config === 'planetary') {
            const npEl = document.getElementById('num-planets');
            if (npEl && !isNaN(parseInt(npEl.value))) {
                numPlanets = parseInt(npEl.value);
            }
        }
        
        for (let i = 0; i < numPlanets; i++) {
            const theta = i * (2 * Math.PI / numPlanets);
            // Contact with G1 is at angle π (-x axis) for the first planet. 
            // For other planets, adjust by theta (coordinate rotation) + theta*(z1/z2) (tooth phase shift).
            const rot2 = baseRot + Math.PI + Math.PI / z2 + theta * (1 + z1 / z2) + phi * k_rot[2];
            gearInstances.push({
                idx: 2,
                x: aw1 * Math.cos(theta),
                y: aw1 * Math.sin(theta),
                rot: rot2,
                data: g2,
                col: '#e67e22'
            });
        }
    }

    // Gear 3
    const g3 = window.assemblyCache[3];
    if (g3 && g3.cache && gearCount >= 3) {
        z3 = Math.abs(g3.cache.z || 20);
        const s2 = ((g2?.cache?.z ?? 1) < 0 || g3.cache.z < 0) ? 1 : -1;
        k_rot[3] = (k_rot[2] ?? -1) * s2 * (Math.abs(g2?.cache?.z || 20) / Math.abs(g3.cache.z));

        if (config === 'planetary') {
            // Ring gear centered at (0,0). Contact with Planet is at angle 0 (+x axis).
            // If z2 is odd, Planet has tip at 0 -> Ring needs space at 0 (add π/z3).
            // If z2 is even, Planet has space at 0 -> Ring needs tip at 0 (add 0).
            const rot3 = baseRot + ((z2 % 2 !== 0) ? Math.PI / z3 : 0) + phi * k_rot[3];
            gearInstances.push({
                idx: 3,
                x: 0,
                y: 0,
                rot: rot3,
                data: g3,
                col: '#9b59b6'
            });
        } else {
            // Train: G3 at (aw1+aw2, 0). Contact with G2 is at angle π (-x axis).
            // If z2 is even, G2 has space at 0 -> G3 needs tip at π (rot30 = baseRot + π).
            // If z2 is odd, G2 has tip at 0 -> G3 needs space at π (rot30 = baseRot + π + π/z3).
            const rot3 = baseRot + Math.PI + ((z2 % 2 !== 0) ? Math.PI / z3 : 0) + phi * k_rot[3];
            gearInstances.push({
                idx: 3,
                x: aw1 + aw2,
                y: 0,
                rot: rot3,
                data: g3,
                col: '#9b59b6'
            });
        }
    }

    // Gear 4
    const g4 = window.assemblyCache[4];
    if (g4 && g4.cache && gearCount >= 4) {
        z4 = Math.abs(g4.cache.z || 20);
        const s3 = ((g3?.cache?.z ?? 1) < 0 || g4.cache.z < 0) ? 1 : -1;
        k_rot[4] = (k_rot[3] ?? -1) * s3 * (Math.abs(g3?.cache?.z || 20) / Math.abs(g4.cache.z));

        // Contact with G3 is at angle π (-x axis).
        const k3 = z3 + (z2 % 2 === 0 ? 0 : 1);
        const rot4 = baseRot + Math.PI + ((k3 % 2 === 0) ? Math.PI / z4 : 0) + phi * k_rot[4];
        gearInstances.push({
            idx: 4,
            x: aw1 + aw2 + aw3,
            y: 0,
            rot: rot4,
            data: g4,
            col: '#2ecc71'
        });
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    gearInstances.forEach(inst => {
        const rTip = (inst.data.cache.da || 100) / 2;
        minX = Math.min(minX, inst.x - rTip);
        maxX = Math.max(maxX, inst.x + rTip);
        minY = Math.min(minY, inst.y - rTip);
        maxY = Math.max(maxY, inst.y + rTip);
    });
    if (minX === Infinity) { minX = -100; maxX = 100; minY = -100; maxY = 100; }
    const spanX = maxX - minX || 200;
    const spanY = maxY - minY || 200;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const padding = 0.15;
    const baseScale = Math.min(W / spanX, H / spanY) * (1 - padding);
    state.baseScale = baseScale;
    const currentScale = baseScale * state.zoom;

    ctx.save();
    ctx.translate(W / 2 + state.offsetX, H / 2 + state.offsetY);
    ctx.scale(currentScale, -currentScale);
    ctx.translate(-centerX, -centerY);

    // Draw solid gear teeth
    gearInstances.forEach(inst => {
        const pts = inst.data.points;
        const isInt = inst.data.cache.z < 0;
        if (!pts || pts.length === 0) return;

        ctx.save();
        ctx.translate(inst.x, inst.y);
        ctx.rotate(inst.rot);

        ctx.beginPath();
        if (isInt) {
            const diVal = inst.data.cache.di || 0;
            if (diVal > 0) {
                ctx.arc(0, 0, diVal / 2, 0, 2 * Math.PI, false);
            } else {
                ctx.arc(0, 0, (inst.data.cache.da / 2) + 2 * inst.data.cache.mn, 0, 2 * Math.PI, false);
            }
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
            ctx.closePath();
        } else {
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
            ctx.closePath();

            // Center bore
            const boreR = inst.data.cache.di > 0 ? inst.data.cache.di / 2 : (inst.data.cache.da / 2) * 0.20;
            ctx.moveTo(boreR, 0);
            ctx.arc(0, 0, boreR, 0, 2 * Math.PI);
        }

        // Add hole pattern
        const hp = inst.data.cache.holePattern;
        if (hp && hp.holeCircle > 0 && hp.holeDiameter > 0 && hp.numHoles > 0) {
            const r_hc = hp.holeCircle / 2;
            const r_h = hp.holeDiameter / 2;
            const angleStep = 2 * Math.PI / hp.numHoles;
            for (let h = 0; h < hp.numHoles; h++) {
                const angle = h * angleStep;
                const hx = r_hc * Math.cos(angle);
                const hy = r_hc * Math.sin(angle);
                ctx.moveTo(hx + r_h, hy);
                ctx.arc(hx, hy, r_h, 0, 2 * Math.PI);
            }
        }

        ctx.fillStyle = inst.col || '#7f8c8d';
        ctx.fill('evenodd');
        ctx.lineWidth = 1.5 / currentScale;
        ctx.strokeStyle = '#111';
        ctx.stroke();
        ctx.restore();
    });

    // Draw reference construction lines
    gearInstances.forEach(inst => {
        ctx.save();
        ctx.translate(inst.x, inst.y);
        const c = inst.data.cache;
        ctx.setLineDash([5 / currentScale, 5 / currentScale]);
        ctx.lineWidth = 1.2 / currentScale;
        const drawCirc = (d_val, col) => {
            if (!d_val || d_val <= 0) return;
            ctx.beginPath();
            ctx.arc(0, 0, d_val / 2, 0, 2 * Math.PI);
            ctx.strokeStyle = col;
            ctx.stroke();
        };
        drawCirc(c.da, '#e74c3c'); // Tip: Red
        drawCirc(c.db, '#9b59b6'); // Base: Purple
        drawCirc(c.df, '#3498db'); // Root: Blue
        drawCirc(c.eqResult?.value?.gen_d || c.d, '#2ecc71'); // Pitch: Green
        ctx.restore();
    });

    ctx.restore();
}

function _redrawCanvas(canvas, state, id) {
    if (id === 'canvas-assembly') {
        _drawFullAssembly2D(canvas, state);
    } else if (id.startsWith('canvas-tool-')) {
        _drawTool2D(canvas, state.toolPts, state.toolRes);
    } else if (id.startsWith('canvas-inmesh-')) {
        _drawInMesh2D(canvas, state.gearPts, state.toolPts, state.gearCache, state.toolRes, state.rollPhase);
    } else {
        _drawGear2D(canvas, state.points, state.geom, state.di, state.holePattern);
    }
}

/**
 * Initializes zoom/pan handlers for all 2D gear canvases.
 * Searches for canvases with ID pattern 'canvas-2d-N', 'canvas-tool-N', 'canvas-inmesh-N', 'canvas-assembly'.
 */
function initGraphicsHandlers() {
    const canvases = document.querySelectorAll('canvas[id^="canvas-2d-"], canvas[id^="canvas-tool-"], canvas[id^="canvas-inmesh-"], canvas[id="canvas-assembly"]');

    canvases.forEach(canvas => {
        const id = canvas.id;

        // Ensure state exists and has all properties
        if (!canvasStates[id]) {
            canvasStates[id] = {};
        }
        const state = canvasStates[id];
        state.zoom = state.zoom || 1;
        state.offsetX = state.offsetX || 0;
        state.offsetY = state.offsetY || 0;
        state.points = state.points || [];
        state.da = state.da || 0;
        state.isDragging = state.isDragging || false;
        state.lastMouseX = state.lastMouseX || 0;
        state.lastMouseY = state.lastMouseY || 0;
        state.lastMiddleClick = state.lastMiddleClick || 0;
        state.showGrid = state.showGrid || false;
        state.isBoxZoomMode = state.isBoxZoomMode || false;
        state.isBoxZooming = state.isBoxZooming || false;
        state.boxStartX = state.boxStartX || 0;
        state.boxStartY = state.boxStartY || 0;
        state.boxEndX = state.boxEndX || 0;
        state.boxEndY = state.boxEndY || 0;

        // Zoom (Mouse Wheel)
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const oldZoom = state.zoom;
            const targetFactor = e.deltaY < 0 ? 1.1 : 0.9;
            let newZoom = oldZoom * targetFactor;

            // Limit zoom range
            newZoom = Math.max(0.1, Math.min(newZoom, 100));
            const actualFactor = newZoom / oldZoom;

            if (actualFactor !== 1) {
                state.zoom = newZoom;
                const W = canvas.width;
                const H = canvas.height;
                state.offsetX = (mx - W / 2) * (1 - actualFactor) + state.offsetX * actualFactor;
                state.offsetY = (my - H / 2) * (1 - actualFactor) + state.offsetY * actualFactor;
            }

            _redrawCanvas(canvas, state, id);
        }, { passive: false });

        // Pan or Box Zoom (MouseDown / MouseMove / MouseUp)
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                if (state.isBoxZoomMode) {
                    const rect = canvas.getBoundingClientRect();
                    state.isBoxZooming = true;
                    state.boxStartX = e.clientX - rect.left;
                    state.boxStartY = e.clientY - rect.top;
                    state.boxEndX = state.boxStartX;
                    state.boxEndY = state.boxStartY;
                } else {
                    state.isDragging = true;
                    state.lastMouseX = e.clientX;
                    state.lastMouseY = e.clientY;
                    canvas.style.cursor = 'grabbing';
                }
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (state.isDragging) {
                const dx = e.clientX - state.lastMouseX;
                const dy = e.clientY - state.lastMouseY;
                state.offsetX += dx;
                state.offsetY += dy;
                state.lastMouseX = e.clientX;
                state.lastMouseY = e.clientY;
                _redrawCanvas(canvas, state, id);
            } else if (state.isBoxZooming) {
                const rect = canvas.getBoundingClientRect();
                state.boxEndX = e.clientX - rect.left;
                state.boxEndY = e.clientY - rect.top;
                _redrawCanvas(canvas, state, id);
            }
        });

        window.addEventListener('mouseup', () => {
            if (state.isDragging) {
                state.isDragging = false;
                canvas.style.cursor = state.isBoxZoomMode ? 'crosshair' : 'grab';
            } else if (state.isBoxZooming) {
                state.isBoxZooming = false;

                const w = Math.abs(state.boxEndX - state.boxStartX);
                const h = Math.abs(state.boxEndY - state.boxStartY);

                if (w > 5 && h > 5) {
                    if (state.baseScale > 0) {
                        const baseScale = state.baseScale;
                        const currentScale = baseScale * state.zoom;

                        const scaleX = canvas.width / w;
                        const scaleY = canvas.height / h;
                        const zoomFactor = Math.min(scaleX, scaleY);

                        const newCurrentScale = currentScale * zoomFactor;

                        const cx = (state.boxStartX + state.boxEndX) / 2;
                        const cy = (state.boxStartY + state.boxEndY) / 2;

                        const gx = (cx - canvas.width / 2 - state.offsetX) / currentScale;
                        const gy = -(cy - canvas.height / 2 - state.offsetY) / currentScale;

                        state.zoom = newCurrentScale / baseScale;
                        state.offsetX = -gx * newCurrentScale;
                        state.offsetY = gy * newCurrentScale;

                        // Disable Box Zoom mode after a zoom
                        state.isBoxZoomMode = false;
                        canvas.style.cursor = 'grab';
                        const type = id.split('-')[1];
                        const num = id.split('-').pop();
                        const btnId = (type === '2d') ? ('box-zoom-' + num) : ('box-zoom-' + type + '-' + num);
                        const btn = document.getElementById(btnId);
                        if (btn) btn.style.backgroundColor = '';
                    }
                }
                _redrawCanvas(canvas, state, id);
            }
        });

        canvas.style.cursor = 'grab';

        // Reset Button Handler
        const type = id === 'canvas-assembly' ? 'assembly' : id.split('-')[1]; // '2d', 'tool', 'inmesh', or 'assembly'
        const num = id.split('-').pop();
        const resetBtn = document.getElementById(id === 'canvas-assembly' ? 'reset-assembly' : ('reset-' + type + '-' + num));
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                resetGearView(id);
            });
        }

        // Roll Slider Handler for In-Mesh and Assembly
        if (type === 'inmesh' || type === 'assembly') {
            const slider = document.getElementById('roll-slider-' + num);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    state.rollPhase = parseFloat(e.target.value);
                    _redrawCanvas(canvas, state, id);
                });
            }

            const ccwBtn = document.getElementById('rotate-ccw-' + num);
            const cwBtn = document.getElementById('rotate-cw-' + num);
            const speedInput = document.getElementById('rotate-speed-' + num);

            let animFrameId = null;
            let lastTime = 0;
            let direction = 0; // -1 for CCW, 1 for CW

            const startRotation = (dir) => {
                if (animFrameId) return;
                direction = dir;
                lastTime = performance.now();
                const loop = (currentTime) => {
                    const dt = (currentTime - lastTime) / 1000;
                    lastTime = currentTime;
                    const speed = speedInput ? parseFloat(speedInput.value) || 1 : 1;
                    state.rollPhase = (state.rollPhase || 0) + direction * speed * dt;
                    if (slider) {
                        let clamped = ((state.rollPhase % 2) + 2) % 2;
                        if (clamped > 1) clamped -= 2;
                        slider.value = clamped;
                    }
                    _redrawCanvas(canvas, state, id);
                    animFrameId = requestAnimationFrame(loop);
                };
                animFrameId = requestAnimationFrame(loop);
            };

            const stopRotation = () => {
                if (animFrameId) {
                    cancelAnimationFrame(animFrameId);
                    animFrameId = null;
                }
            };

            if (ccwBtn) {
                const dirCCW = id.includes('inmesh') ? 1 : -1;
                ccwBtn.addEventListener('mousedown', () => startRotation(dirCCW));
                ccwBtn.addEventListener('mouseup', stopRotation);
                ccwBtn.addEventListener('mouseleave', stopRotation);
                ccwBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRotation(dirCCW); });
                ccwBtn.addEventListener('touchend', stopRotation);
            }
            if (cwBtn) {
                const dirCW = id.includes('inmesh') ? -1 : 1;
                cwBtn.addEventListener('mousedown', () => startRotation(dirCW));
                cwBtn.addEventListener('mouseup', stopRotation);
                cwBtn.addEventListener('mouseleave', stopRotation);
                cwBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRotation(dirCW); });
                cwBtn.addEventListener('touchend', stopRotation);
            }
        }

        // Toggle Grid Button Handler
        const toggleGridBtn = document.getElementById('toggle-grid-' + id.split('-').pop());
        if (toggleGridBtn) {
            toggleGridBtn.addEventListener('click', () => {
                state.showGrid = !state.showGrid;
                _redrawCanvas(canvas, state, id);
            });
        }

        // Box Zoom Button Handler
        const btnId = (id === 'canvas-assembly') ? 'box-zoom-assembly' : ((type === '2d') ? ('box-zoom-' + num) : ('box-zoom-' + type + '-' + num));
        const boxZoomBtn = document.getElementById(btnId);
        if (boxZoomBtn) {
            boxZoomBtn.addEventListener('click', () => {
                state.isBoxZoomMode = !state.isBoxZoomMode;
                canvas.style.cursor = state.isBoxZoomMode ? 'crosshair' : 'grab';
                boxZoomBtn.style.backgroundColor = state.isBoxZoomMode ? '#e0e0e0' : '';
            });
        }

        // Export DXF Button Handler
        if (id.startsWith('canvas-2d-')) {
            const exportDxfBtn = document.getElementById('export-dxf-' + id.split('-').pop());
            if (exportDxfBtn) {
                // Remove existing listener to prevent duplicates if initGraphicsHandlers is called multiple times
                const newBtn = exportDxfBtn.cloneNode(true);
                exportDxfBtn.parentNode.replaceChild(newBtn, exportDxfBtn);
                newBtn.addEventListener('click', () => {
                    const gearNum = id.split('-').pop();
                    exportGearDXF(id, 'Gear_' + gearNum + '_profile.dxf');
                });
            }
        }
    });
}

/**
 * Resets the zoom and pan for a specific canvas.
 * @param {string} canvasId - The ID of the canvas to reset.
 */
function resetGearView(canvasId) {
    const state = canvasStates[canvasId];
    if (state) {
        state.zoom = 1;
        state.offsetX = 0;
        state.offsetY = 0;
        if (canvasId.startsWith('canvas-inmesh-') || canvasId === 'canvas-assembly') {
            state.rollPhase = 0;
            const num = canvasId === 'canvas-assembly' ? 'assembly' : canvasId.split('-').pop();
            const slider = document.getElementById('roll-slider-' + num);
            if (slider) slider.value = 0;
        }
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            _redrawCanvas(canvas, state, canvasId);
        }
    }
}

// ---------------------------------------------------------------------------
// 6. DXF EXPORT
// ---------------------------------------------------------------------------
/**
 * Exports the 2D gear profile for a given canvas as a DXF file (R12 format).
 *
 * Layers produced:
 *   GEAR_PROFILE  – full tooth outline polyline (white)
 *   CIRCLE_TIP    – tip circle, da          (red)
 *   CIRCLE_FORM   – root form circle, dFf   (yellow)
 *   CIRCLE_BASE   – base circle, db         (magenta)
 *   CIRCLE_ROOT   – root circle, df         (blue)
 *   CIRCLE_BORE   – bore / inside diameter and hole pattern  (cyan, only if di is set)
 *
 * @param {string} canvasId  - ID of the 2D canvas whose state holds the profile.
 * @param {string} [filename='gear_profile.dxf'] - Suggested download filename.
 */
function exportGearDXF(canvasId, filename = 'gear_profile.dxf') {
    const state = canvasStates[canvasId];
    if (!state || !state.points || state.points.length === 0) {
        alert('No gear profile data available. Please run "Calculate All" first.');
        return;
    }

    const pts = state.points;
    const geom = state.geom;   // { z, da, dFf, db, df, d }
    const di = state.di || 0;
    const holePattern = state.holePattern;

    // ---- DXF builder helpers -----------------------------------------------
    const lines = [];

    const g = (code, value) => {
        lines.push(String(code));
        lines.push(String(value));
    };

    // DXF colour indices (ACI)
    const COLOR = { white: 7, red: 1, yellow: 2, green: 3, cyan: 4, blue: 5, magenta: 6 };

    const layerDef = (name, color) => {
        g(0, 'LAYER');
        g(2, name);
        g(70, 64);   // layer flags: 64 = loaded
        g(62, color);
        g(6, 'CONTINUOUS');
    };

    // ---- HEADER ------------------------------------------------------------
    g(0, 'SECTION');
    g(2, 'HEADER');
    g(9, '$ACADVER');
    g(1, 'AC1009');    // R12
    g(9, '$INSUNITS');
    g(70, 4);          // millimetres
    g(0, 'ENDSEC');

    // ---- TABLES ------------------------------------------------------------
    g(0, 'SECTION');
    g(2, 'TABLES');

    g(0, 'TABLE');
    g(2, 'LAYER');
    g(70, 6);

    layerDef('GEAR_PROFILE', COLOR.white);
    layerDef('CIRCLE_TIP', COLOR.red);
    layerDef('CIRCLE_FORM', COLOR.yellow);
    layerDef('CIRCLE_BASE', COLOR.magenta);
    layerDef('CIRCLE_ROOT', COLOR.blue);
    layerDef('CIRCLE_BORE', COLOR.cyan);
    layerDef('HOLE_PATTERN', COLOR.cyan);

    g(0, 'ENDTAB');
    g(0, 'ENDSEC');

    // ---- ENTITIES ----------------------------------------------------------
    g(0, 'SECTION');
    g(2, 'ENTITIES');

    // -- Gear profile polyline --
    g(0, 'POLYLINE');
    g(8, 'GEAR_PROFILE');
    g(66, 1);   // vertices follow
    g(70, 1);   // closed polyline
    g(10, 0.0);
    g(20, 0.0);
    g(30, 0.0);

    for (const p of pts) {
        g(0, 'VERTEX');
        g(8, 'GEAR_PROFILE');
        g(10, p.x.toFixed(6));
        g(20, p.y.toFixed(6));
        g(30, 0.0);
    }
    g(0, 'SEQEND');

    // -- Reference circles --
    const addCircle = (layer, diameter) => {
        if (!diameter || diameter <= 0) return;
        g(0, 'CIRCLE');
        g(8, layer);
        g(10, 0.0);
        g(20, 0.0);
        g(30, 0.0);
        g(40, (diameter / 2).toFixed(6));   // radius
    };

    if (geom) {
        addCircle('CIRCLE_TIP', geom.da);
        addCircle('CIRCLE_FORM', geom.dFf);
        addCircle('CIRCLE_BASE', geom.db);
        addCircle('CIRCLE_ROOT', geom.df);
    }
    if (di > 0) addCircle('CIRCLE_BORE', di);

    if (holePattern) {
        const { holeCircle, holeDiameter, numHoles } = holePattern;
        if (holeCircle > 0 && holeDiameter > 0 && numHoles > 0) {
            const r_hc = holeCircle / 2;
            const angleStep = 2 * Math.PI / numHoles;
            for (let i = 0; i < numHoles; i++) {
                const angle = i * angleStep;
                const hx = r_hc * Math.cos(angle);
                const hy = r_hc * Math.sin(angle);
                g(0, 'CIRCLE');
                g(8, 'HOLE_PATTERN');
                g(10, hx.toFixed(6));
                g(20, hy.toFixed(6));
                g(30, 0.0);
                g(40, (holeDiameter / 2).toFixed(6));
            }
        }
    }

    g(0, 'ENDSEC');
    g(0, 'EOF');

    // ---- Trigger download --------------------------------------------------
    const dxfText = lines.join('\n');
    const blob = new Blob([dxfText], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
