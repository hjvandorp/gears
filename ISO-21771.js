/**
 * ISO 21771:2007 Calculations
 * Basic Data and Profile Calculations
 */

function calculateReferenceDiameter(z, mn, beta) {
    if (isNaN(z) || isNaN(mn) || isNaN(beta) || z === 0 || mn <= 0 || beta < 0 || beta >= 90) {
        return { success: false, error: 'Invalid limits.' };
    }
    const betaRadians = beta * (Math.PI / 180);
    const cosBeta = Math.cos(betaRadians);
    if (cosBeta <= 0) {
        return { success: false, error: 'Helix angle too large.' };
    }
    return { success: true, value: (Math.abs(z) * mn) / cosBeta };
}

/**
 * Calculates the base diameter (db).
 * Formula: db = d * cos(alpha_t)
 * @param {number} d - Reference diameter (mm)
 * @param {number} alpha_t - Transverse pressure angle (degrees)
 * @returns {Object} result - { success: boolean, value: number (mm), error: string }
 */
function calculateBaseDiameter(d, alpha_t) {
    if (isNaN(d) || isNaN(alpha_t)) {
        return { success: false, error: 'Invalid inputs.' };
    }
    const alphaTRad = alpha_t * (Math.PI / 180);
    return { success: true, value: d * Math.cos(alphaTRad) };
}

// Calculate standard center distance that will be suggested to the user
// Formula: aw = (z1 + z2) * mn / (2 * cos(beta))
function calculateStandardCenterDistance(z1, z2, mn, beta) {
    if (isNaN(z1) || isNaN(z2) || isNaN(mn) || isNaN(beta) || z1 === 0 || z2 === 0 || mn <= 0 || beta < 0 || beta >= 90) {
        return { success: false, error: 'Invalid config.' };
    }
    const betaRadians = beta * (Math.PI / 180);
    const cosBeta = Math.cos(betaRadians);
    if (cosBeta <= 0) {
        return { success: false, error: 'Helix angle too large.' };
    }
    return { success: true, value: Math.abs((z1 + z2) / 2) * mn / cosBeta };
}
function calculateWorkingTransversePressureAngle(z1, z2, mn, alpha_t, aw, beta) {
    if (isNaN(z1) || isNaN(z2) || isNaN(mn) || isNaN(alpha_t) || isNaN(aw) || isNaN(beta) || aw === 0) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const betaRadians = beta * (Math.PI / 180);
    const alphaTRadians = alpha_t * (Math.PI / 180);
    const cosBeta = Math.cos(betaRadians);

    if (cosBeta <= 0) {
        return { success: false, error: 'Helix angle too large.' };
    }

    // Formula calculation based on the ISO 21771:2007 equation 54:
    // alpha_wt = arccos[ abs(z1 + z2) * ( (mn * cos(alpha_t)) / (2 * abs(aw) * cos(beta)) ) ]
    const valueInsideAcos = Math.abs(z1 + z2) * ((mn * Math.cos(alphaTRadians)) / (2 * Math.abs(aw) * cosBeta));

    if (valueInsideAcos > 1 || valueInsideAcos < -1) {
        return { success: false, error: 'Domain error: Invalid geometry for arccos.' };
    }

    const alphaWtRadians = Math.acos(valueInsideAcos);
    const alphaWtDegrees = alphaWtRadians * (180 / Math.PI);

    return { success: true, value: alphaWtDegrees };
}

// Involute function: inv(alpha) = tan(alpha) - alpha (where alpha is in radians)
function involute(alphaDegrees) {
    const alphaRad = alphaDegrees * (Math.PI / 180);
    return Math.tan(alphaRad) - alphaRad;
}

// Rearranged sum of profile shift coefficients to solve for x2
// Equation: x1 + x2 = ((z1 + z2) * (inv(alpha_wt) - inv(alpha_t))) / (2 * tan(alpha_n))
// Therefore: x2 = [ ((z1 + z2) * (inv(alpha_wt) - inv(alpha_t))) / (2 * tan(alpha_n)) ] - x1
function calculateProfileShiftCoefficient2(z1, z2, alpha_wt, alpha_t, alpha_n, x1) {
    if (isNaN(z1) || isNaN(z2) || isNaN(alpha_wt) || isNaN(alpha_t) || isNaN(alpha_n) || isNaN(x1)) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const invAlphaWt = involute(alpha_wt);
    const invAlphaT = involute(alpha_t);
    const alphaNRad = alpha_n * (Math.PI / 180);
    const tanAlphaN = Math.tan(alphaNRad);

    if (tanAlphaN === 0) {
        return { success: false, error: 'Tangent of normal pressure angle is zero.' };
    }

    const sumX = ((z1 + z2) * (invAlphaWt - invAlphaT)) / (2 * tanAlphaN);
    const x2 = sumX - x1;

    return { success: true, value: x2 };
}
// Generating profile shift coefficient: xE = X - ((sn_reduction / 2) / tan(alpha_n)) / mn
function calculateGeneratingProfileShift(x, sn_reduction, mn, alpha_n) {
    if (isNaN(x) || isNaN(sn_reduction) || isNaN(mn) || isNaN(alpha_n) || mn <= 0) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const alphaNRad = alpha_n * (Math.PI / 180);
    const tanAlphaN = Math.tan(alphaNRad);

    if (tanAlphaN === 0) {
        return { success: false, error: 'Tangent of pressure angle is zero.' };
    }

    // xE = X - ((sn_reduction / 2) / tan(alpha_n)) / mn
    const xE = x - ((sn_reduction / 2) / tanAlphaN) / mn;

    return { success: true, value: xE };
}

// Transverse circular tooth thickness: st = (mn / cos(beta)) * (PI/2 + 2 * xE * tan(alpha_n))
function calculateTransverseToothThickness(mn, beta, xE, alpha_n) {
    if (isNaN(mn) || isNaN(beta) || isNaN(xE) || isNaN(alpha_n) || mn <= 0) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const betaRad = beta * (Math.PI / 180);
    const cosBeta = Math.cos(betaRad);

    if (cosBeta <= 0) {
        return { success: false, error: 'Helix angle too large.' };
    }

    const alphaNRad = alpha_n * (Math.PI / 180);
    const tanAlphaN = Math.tan(alphaNRad);

    const st = (mn / cosBeta) * (Math.PI / 2 + 2 * xE * tanAlphaN);

    return { success: true, value: st };
}

// V-circle diameter: dv = d + 2 * (z / |z|) * xE * mn
function calculateVCircleDiameter(d, z, xE, mn) {
    if (isNaN(d) || isNaN(z) || isNaN(xE) || isNaN(mn) || z === 0 || mn <= 0) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const sign = z / Math.abs(z); // +1 for external, -1 for internal
    const dv = d + 2 * sign * xE * mn;

    return { success: true, value: dv };
}

/**
 * Calculates the root diameter (df).
 * Formula: df = d - 2 * (abs(z)/z) * (hfP_coeff * mn - xE * mn)
 * @param {number} d - Reference diameter (mm)
 * @param {number} z - Number of teeth
 * @param {number} hfP_coeff - Dedendum coefficient (hfP*)
 * @param {number} xE - Generating profile shift coefficient
 * @param {number} mn - Normal module (mm)
 * @returns {Object} result - { success: boolean, value: number (mm), error: string }
 */
function calculateRootDiameter(d, z, hfP_coeff, xE, mn) {
    if (isNaN(d) || isNaN(z) || isNaN(hfP_coeff) || isNaN(xE) || isNaN(mn) || z === 0 || mn <= 0) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const sign = z / Math.abs(z);
    // df = d - 2 * sign * (hfP_coeff * mn - xE * mn)
    const df = d - 2 * sign * (hfP_coeff * mn - xE * mn);

    return { success: true, value: df };
    // Note that this calculation calculates the theoretical generated root diameters in the absence of the "additional root diameter tolerance".
    // The "additional root diameter tolerance" is used to calculate the min and max root diameters that are shown in the web UI and in the report.
}

/**
 * Calculates the tip diameter (da).
 * Formula: da = d + 2 * (abs(z)/z) * (haP_coeff + xE + k) * mn
 * @param {number} d - Reference diameter (mm)
 * @param {number} z - Number of teeth
 * @param {number} haP_coeff - Addendum coefficient (haP*)
 * @param {number} xE - Generating profile shift coefficient
 * @param {number} k - Tip alteration coefficient
 * @param {number} mn - Normal module (mm)
 * @returns {Object} result - { success: boolean, value: number (mm), error: string }
 */
function calculateTipDiameter(d, z, haP_coeff, xE, k, mn) {
    if (isNaN(d) || isNaN(z) || isNaN(haP_coeff) || isNaN(xE) || isNaN(k) || isNaN(mn) || z === 0 || mn <= 0) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const sign = z / Math.abs(z);
    // da = d + 2 * sign * (haP_coeff + xE + k) * mn
    const da = d + 2 * sign * (haP_coeff + xE + k) * mn;

    return { success: true, value: da };
}

/**
 * Calculates the active root diameter (dNf).
 * Formula (69): dNfA = sqrt( (2 * aw * sin(alpha_wt) - (zA / |zA|) * sqrt(daB^2 - dbB^2) )^2 + dbA^2 )
 * @param {number} aw - Working center distance (mm)
 * @param {number} alpha_wt - Working transverse pressure angle (degrees)
 * @param {number} dbA - Base diameter of the gear for which dNf is being calculated (mm)
 * @param {number} dbB - Base diameter of the mating gear (mm)
 * @param {number} daB - Tip diameter of the mating gear (mm)
 * @param {number} zA - Number of teeth of the gear for which dNf is being calculated
 * @returns {Object} result - { success: boolean, value: number (mm), error: string }
 */
function calculateActiveRootDiameter(aw, alpha_wt, dbA, dbB, daB, zA) {
    if (isNaN(aw) || isNaN(alpha_wt) || isNaN(dbA) || isNaN(dbB) || isNaN(daB) || isNaN(zA) || zA === 0) {
        return { success: false, error: 'Invalid inputs.' };
    }
    const alphaWtRad = alpha_wt * (Math.PI / 180);
    const sign = zA / Math.abs(zA);

    const rootTerm1 = Math.pow(daB, 2) - Math.pow(dbB, 2);
    if (rootTerm1 < 0) {
        return { success: false, error: 'Invalid tip/base diameter ratio.' };
    }

    const innerTerm = 2 * aw * Math.sin(alphaWtRad) - sign * Math.sqrt(rootTerm1);
    const dNfA = Math.sqrt(Math.pow(innerTerm, 2) + Math.pow(dbA, 2));

    return { success: true, value: dNfA };
}

/**
 * Calculates parameters for the Line of Action distances.
 * The distances are evaluated from the interference points T1 and T2.
 * @param {number} aw - Minimum working center distance (mm)
 * @param {number} alpha_wt - Working transverse pressure angle at aw (degrees)
 * @param {number} db1 - Base diameter of gear 1 (mm)
 * @param {number} db2 - Base diameter of gear 2 (mm)
 * @param {number} da1 - Maximum tip diameter of gear 1 (mm)
 * @param {number} da2 - Maximum tip diameter of gear 2 (mm)
 * @param {number} p_bt - Transverse base pitch (mm)
 * @param {number} z2 - Number of teeth of gear 2
 * @returns {Object} result - containing line of action parameters 
 */
function calculateLineOfActionDistances(aw, alpha_wt, db1, db2, da1, da2, p_bt, z2) {
    if (isNaN(aw) || isNaN(alpha_wt) || isNaN(db1) || isNaN(db2) || isNaN(da1) || isNaN(da2) || isNaN(p_bt) || isNaN(z2) || z2 === 0) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const alphaWtRad = alpha_wt * (Math.PI / 180);
    const sign = z2 / Math.abs(z2);

    // Formula (81), T1C, Gear 1 roll length at its Operating Pitch Diameter
    const rho_C1 = 0.5 * db1 * Math.tan(alphaWtRad);

    // Formula (82), T2C, Gear 2 roll length at its Operating Pitch Diameter
    const rho_C2 = 0.5 * sign * db2 * Math.tan(alphaWtRad);

    // Formula (83), T2A, Gear 2 roll length at its Tip Diameter
    const rho_A2 = 0.5 * sign * Math.sqrt(Math.pow(da2, 2) - Math.pow(db2, 2));

    // Formula (84), T1E, Gear 1 roll length at its Tip Diameter
    const rho_E1 = 0.5 * Math.sqrt(Math.pow(da1, 2) - Math.pow(db1, 2));

    // Formula (85), T1B, Gear 1 roll length at its LPSTC
    const rho_B1 = rho_E1 - p_bt;

    // Formula (86), T2D, Gear 2 roll length at its LPSTC
    const rho_D2 = rho_A2 - p_bt;

    // Formula (87), T1T2, distance between the two gears along the line of action
    const T1T2 = sign * aw * Math.sin(alphaWtRad);

    return {
        success: true,
        distances: {
            rho_C1: rho_C1,
            rho_C2: rho_C2,
            rho_A2: rho_A2,
            rho_E1: rho_E1,
            rho_B1: rho_B1,
            rho_D2: rho_D2,
            T1T2: T1T2
        }
    };
}

/**
 * Calculates the root form diameter (dFf) for a gear cut by a pinion cutter.
 * Internally calls equivalentGearAlphaN0 to obtain all kinematic and cutter
 * geometry results, then derives the active generating cutter tip diameter for
 * the supplied rhoaP_coeff and computes dFf.
 *
 * @param {number} z           - Number of teeth (negative for internal gears)
 * @param {number} mn          - Normal module (mm)
 * @param {number} alpha_n     - Normal pressure angle (degrees)
 * @param {number} beta        - Helix angle (degrees)
 * @param {number} d           - Reference diameter (mm)
 * @param {number} db          - Base diameter (mm)
 * @param {number} sn          - Normal circular tooth thickness (mm)
 * @param {number} dF          - Root diameter (mm)
 * @param {number} dA          - Tip diameter (mm)
 * @param {number} alpha_P0    - Generating normal pressure angle (degrees)
 * @param {number} haP0_coeff  - Addendum coefficient of the basic rack
 * @param {number} hfP0_coeff  - Dedendum coefficient of the basic rack
 * @param {number} rhoaP_coeff - Basic rack tip radius coefficient (ÏaP* = ÏaP/mn)
 * @param {number} z0          - Number of cutter teeth
 * @param {string} toolType    - Manufacturing process ('hob' or 'shaper')
 * @returns {{ success: boolean, value: number, error?: string }}
 */
function calculateRootFormDiameterPinionCutter(z, mn, alpha_n, beta, d, db, sn, dF, dA, alpha_P0, haP0_coeff, hfP0_coeff, rhoaP_coeff, z0, toolType) {

    // --- 1. Delegate all kinematic solving to equivalentGearAlphaN0 ---
    const eqResult = equivalentGearAlphaN0(z, mn, alpha_n, beta, d, db, sn, dF, dA, alpha_P0, haP0_coeff, hfP0_coeff, rhoaP_coeff, z0, toolType);
    if (!eqResult.success) {
        return { success: false, error: eqResult.error || 'equivalentGearAlphaN0 failed.' };
    }

    const {
        db0,
        rhoaP_max,
        rhoaP_coeff_max,
        gen_alpha_t, gen_mt,
        gen_da0,
        gen_rhoaP_max,
        gen_rhoaP_coeff_max,
    } = eqResult.value;

    const absZ = Math.abs(z);
    const sign = z / absZ;

    const safeAcos = (val) => Math.acos(Math.max(-1, Math.min(1, val)));

    // --- 2. Scale actual fillet from standard cutter to generating cutter ---
    // rhoaP_coeff * mn  â†’  actual fillet radius on the standard cutter (mm)
    // rhoaP_max   â†’  maximum possible fillet radius on the standard cutter (mm)
    // The same proportion is applied to the generating cutter's maximum fillet.
    const rhoPercent = (rhoaP_max > 0)
        ? (rhoaP_coeff * mn) / rhoaP_max
        : 0;
    const actual_gen_fillet = rhoPercent * gen_rhoaP_max;   // mm

    // --- 3. Iterate for the actual generating cutter active tip diameter ---
    // gen_dFa0 is the diameter at which the generating cutter tooth tip fillet
    // arc is tangent to the involute, for the actual (not maximum) fillet radius.
    let gen_dFa0_act = gen_da0 - 2 * actual_gen_fillet * (1 - Math.sin(gen_alpha_t));
    let iterations = 0;
    while (iterations < 100) {
        if (gen_dFa0_act < db0) break;
        const gen_alpha_Fa0_act = safeAcos(db0 / gen_dFa0_act);
        const next_gen_dFa0_act = gen_da0 - 2 * actual_gen_fillet * (1 - Math.sin(gen_alpha_Fa0_act));
        if (Math.abs(next_gen_dFa0_act - gen_dFa0_act) < 1e-6) {
            gen_dFa0_act = next_gen_dFa0_act;
            break;
        }
        gen_dFa0_act = next_gen_dFa0_act;
        iterations++;
    }

    // --- 4. Root form diameter (ISO 21771 formula) ---
    // Math.abs(z0 + z) handles internal gears correctly (z is negative).
    const gen_aw0 = 0.5 * Math.abs(z0 + z) * gen_mt;
    const term1 = 2 * gen_aw0 * Math.sin(gen_alpha_t)
        - sign * Math.sqrt(Math.max(0, Math.pow(gen_dFa0_act, 2) - Math.pow(db0, 2)));
    const dFf = Math.sqrt(Math.pow(term1, 2) + Math.pow(db, 2));


    return {
        success: true,
        value: dFf,
        steps: {
            ...eqResult.steps,
            "10": `Fillet Scaling: rhoPercent = ${(rhoPercent * 100).toFixed(2)}%, actual_gen_fillet = ${actual_gen_fillet.toFixed(4)} mm`,
            "11": `Generating Cutter: gen_dFa0_act = ${gen_dFa0_act.toFixed(4)} mm (iterations: ${iterations})`,
            "12": `Final dFf: gen_aw0 = ${gen_aw0.toFixed(4)}, term1 = ${term1.toFixed(4)}, dFf = ${dFf.toFixed(4)} mm`
        }
    };
}

/**
 * Inverse Involute function: solves tan(theta) - theta = inv_val for theta (in radians)
 * Uses Newton-Raphson method.
 * @param {number} invValue - The involute value inv(theta)
 * @returns {Object} result - { success: boolean, value: number (radians), error: string }
 */
function inverseInvolute(invValue) {
    if (isNaN(invValue) || invValue < 0) {
        return { success: false, error: 'Invalid involute value.' };
    }

    if (invValue === 0) return { success: true, value: 0 };

    // Initial guess for alpha (in radians)
    // For small inv_val, alpha Ã¢â€°Ë† (3 * inv_val)^(1/3)
    let alpha = Math.pow(3 * invValue, 1 / 3);
    const maxIterations = 20;
    const tolerance = 1e-10;

    for (let i = 0; i < maxIterations; i++) {
        const tanAlpha = Math.tan(alpha);
        const f = tanAlpha - alpha - invValue;
        const df = tanAlpha * tanAlpha; // d/dx[tan(x) - x] = sec^2(x) - 1 = tan^2(x)

        if (Math.abs(df) < 1e-14) break;

        const delta = f / df;
        alpha -= delta;

        if (Math.abs(delta) < tolerance) {
            return { success: true, value: alpha * (180 / Math.PI) };
        }
    }

    return { success: false, error: 'Inverse involute failed to converge.' };
}

/**
 * Calculates the dimension over balls for an external gear (9-step method).
 * @param {number} z - Number of teeth
 * @param {number} d - Reference diameter (mm)
 * @param {number} beta - Helix angle at reference diameter (degrees)
 * @param {number} alpha_n - Normal pressure angle at reference diameter (degrees)
 * @param {number} st - Transverse circular tooth thickness (mm)
 * @param {number} d_M - Ball diameter (mm)
 * @returns {Object} result - { success: boolean, value: number (mm), error: string }
 */
function calculateDimensionOverBalls(z, d, beta, alpha_n, st, d_M) {
    if (isNaN(z) || isNaN(d) || isNaN(beta) || isNaN(alpha_n) || isNaN(st) || isNaN(d_M) || z === 0 || d <= 0) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const absZ = Math.abs(z);
    const betaRad = beta * (Math.PI / 180);
    const alphaNRad = alpha_n * (Math.PI / 180);

    // Step 1: Transverse pressure angle, alpha_t = arctan(tan(alpha_n)/cos(beta))
    const alphaTRad = Math.atan(Math.tan(alphaNRad) / Math.cos(betaRad));

    // Step 2: Helix angle on the base diameter, beta_b = arctan(tan(beta)*cos(alpha_t))
    const betaBRad = Math.atan(Math.tan(betaRad) * Math.cos(alphaTRad));

    // Step 3: Transverse ball diameter, d_Mt = d_M / cos(beta_b)
    const dMt = d_M / Math.cos(betaBRad);

    // Step 4: Base diameter, d_b = d * cos(alpha_t)
    const db = d * Math.cos(alphaTRad);

    // Step 5: inv(alpha_t)
    const invAlphaT = Math.tan(alphaTRad) - alphaTRad;

    // Step 6: Involute of transverse pressure angle at pin centers
    // inv_alpha_Kt = st/d + d_Mt/d_b + inv(alpha_t) - PI/z
    const invAlphaKt = (st / d) + (dMt / db) + invAlphaT - (Math.PI / absZ);

    // Step 7: Calculate alpha_Kt using the inverse involute function
    const alphaKtRes = inverseInvolute(invAlphaKt);
    if (!alphaKtRes.success) {
        return { success: false, error: 'Failed to solve for alpha_Kt: ' + alphaKtRes.error };
    }
    const alphaKtRad = alphaKtRes.value * (Math.PI / 180);

    // Step 8: Diameter of ball centers, d_K = d_b / cos(alpha_Kt)
    const dK = db / Math.cos(alphaKtRad);

    // Step 9: Calculate the dimension over balls
    let MdK;
    if (absZ % 2 === 0) {
        // z is even
        MdK = dK + d_M;
    } else {
        // z is odd
        MdK = Math.cos((90 / absZ) * (Math.PI / 180)) * dK + d_M;
    }

    return { success: true, value: MdK };
}

/**
 * Calculates the dimension between balls for an internal gear (9-step method).
 * @param {number} z - Number of teeth
 * @param {number} d - Reference diameter (mm)
 * @param {number} beta - Helix angle at reference diameter (degrees)
 * @param {number} alpha_n - Normal pressure angle at reference diameter (degrees)
 * @param {number} st - Transverse circular tooth thickness (mm)
 * @param {number} d_M - Ball diameter (mm)
 * @returns {Object} result - { success: boolean, value: number (mm), error: string }
 */
function calculateDimensionBetweenBalls(z, d, beta, alpha_n, st, d_M) {
    if (isNaN(z) || isNaN(d) || isNaN(beta) || isNaN(alpha_n) || isNaN(st) || isNaN(d_M) || z === 0 || d <= 0) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const absZ = Math.abs(z);
    const betaRad = beta * (Math.PI / 180);
    const alphaNRad = alpha_n * (Math.PI / 180);

    // Step 1: Transverse pressure angle, alpha_t = arctan(tan(alpha_n)/cos(beta))
    const alphaTRad = Math.atan(Math.tan(alphaNRad) / Math.cos(betaRad));

    // Step 2: Helix angle on the base diameter, beta_b = arctan(tan(beta)*cos(alpha_t))
    const betaBRad = Math.atan(Math.tan(betaRad) * Math.cos(alphaTRad));

    // Step 3: Transverse ball diameter, d_Mt = d_M / cos(beta_b)
    const dMt = d_M / Math.cos(betaBRad);

    // Step 4: Base diameter, d_b = d * cos(alpha_t)
    const db = d * Math.cos(alphaTRad);

    // Step 5: inv(alpha_t)
    const invAlphaT = Math.tan(alphaTRad) - alphaTRad;

    // Step 6: Involute of transverse pressure angle at pin centers
    // Procedural change for internal gears:
    // inv_alpha_Kt = PI/|z| - st/d - d_Mt/d_b + inv(alpha_t)
    const invAlphaKt = (Math.PI / absZ) - (st / d) - (dMt / db) + invAlphaT;

    // Step 7: Calculate alpha_Kt using the inverse involute function
    const alphaKtRes = inverseInvolute(invAlphaKt);
    if (!alphaKtRes.success) {
        return { success: false, error: 'Failed to solve for alpha_Kt: ' + alphaKtRes.error };
    }
    const alphaKtRad = alphaKtRes.value * (Math.PI / 180);

    // Step 8: Diameter of ball centers, d_K = d_b / cos(alpha_Kt)
    const dK = db / Math.cos(alphaKtRad);

    // Step 9: Calculate the dimension between balls
    let MdK;
    if (absZ % 2 === 0) {
        // z is even
        MdK = dK - d_M;
    } else {
        // z is odd
        MdK = Math.cos((90 / absZ) * (Math.PI / 180)) * dK - d_M;
    }

    return { success: true, value: MdK };
}

/**
 * Calculates the equivalent gear parameters with the generating normal pressure angle.
 * @param {number} z          - Number of teeth
 * @param {number} mn         - Normal module (mm)
 * @param {number} alpha_n    - Normal pressure angle (degrees)
 * @param {number} beta       - Helix angle (degrees)
 * @param {number} d          - Reference diameter (mm)
 * @param {number} db         - Base diameter (mm)
 * @param {number} sn         - Normal circular tooth thickness (mm)
 * @param {number} dF         - Root diameter (mm)
 * @param {number} dA         - Tip diameter (mm)
 * @param {number} alpha_P0   - Generating normal pressure angle (degrees)
 * @param {number} haP0_coeff - Addendum coefficient of the basic rack
 * @param {number} hfP0_coeff - Dedendum coefficient of the basic rack
 * @param {number} rhoaP_coeff - Basic rack tip radius coefficient
 * @param {number} z0         - Number of cutter teeth
 * @param {string} toolType   - Manufacturing process ('hob' or 'shaper')
 * @returns {Object} result   - { success: boolean, value: object, error: string }
 */

// -------------------------------------------------------------------------
// THIS FUNCTION CALCULATES THE EQUIVALENT GEAR PARAMETERS WITH
// THE GENERATING NORMAL PRESSURE ANGLE alpha_P0.
// FOR THE CUTTING TOOL, ONLY THE EQUIVALENT PINION CUTTER GEOMETRY IS CALCULATED.
// FOR GEARS PRODUCED BY A RACK-TYPE CUTTER OR HOB, WE APPROXIMATE THE RACK-CUTTER AS A PINION CUTTER WITH Z0 > 1000.
// -------------------------------------------------------------------------
function equivalentGearAlphaN0(z, mn, alpha_n, beta, d, db, sn, dF, dA, alpha_P0, haP0_coeff, hfP0_coeff, rhoaP_coeff, z0, toolType) {
    if (isNaN(z) || isNaN(mn) || isNaN(alpha_n) || isNaN(beta) || isNaN(d) || isNaN(db) ||
        isNaN(sn) || isNaN(dF) || isNaN(dA) || isNaN(alpha_P0) || isNaN(haP0_coeff) ||
        isNaN(hfP0_coeff) || isNaN(rhoaP_coeff) || isNaN(z0) || z === 0 || mn <= 0 || z0 === 0) {
        return { success: false, error: 'Invalid inputs.' };
    }

    const inv = (angle) => Math.tan(angle) - angle;
    const safeAcos = (val) => Math.acos(Math.max(-1, Math.min(1, val)));

    // -------------------------------------------------------------------------
    // Standard gear parameters
    // -------------------------------------------------------------------------
    const betaRad = beta * (Math.PI / 180);
    const alphaNRad = alpha_n * (Math.PI / 180);
    const absZ = Math.abs(z);
    const sign = z / absZ;
    const mt = mn / Math.cos(betaRad);
    const alphaTRad = Math.atan(Math.tan(alphaNRad) / Math.cos(betaRad));
    const xE = (sn / mn - Math.PI / 2) / (2 * Math.tan(alphaNRad));
    const st = sn / Math.cos(betaRad);

    // Standard pinion shaper cutter geometry
    const d0 = z0 * mt;
    const db0 = d0 * Math.cos(alphaTRad);
    const std_haP0_coeff = sign * (d - dF) / (2 * mn);
    const da0 = d0 + mn * 2 * std_haP0_coeff;
    const alpha_at0 = safeAcos(db0 / da0);
    const st0 = Math.PI * mt - st;

    // Lead
    const pz = (beta === 0 || Math.abs(beta) < 1e-10)
        ? Infinity
        : (absZ * mn * Math.PI) / Math.sin(betaRad);

    // Cutter transverse tooth thickness at the cutter tip diameter
    const st_a0 = da0 * (st0 / d0 + inv(alphaTRad) - inv(alpha_at0));

    // Iterative calculation for maximum basic rack tip radius
    let rhoaP_max = 0.5 * st_a0;
    let dFa0 = da0 - 2 * rhoaP_max * (1 - Math.sin(alphaTRad));
    let std_rho_iterations = 0;
    while (std_rho_iterations < 100) {
        if (dFa0 < db0) break;
        const alpha_Fat0 = safeAcos(db0 / dFa0);
        const st_Fat0 = dFa0 * (st0 / d0 + inv(alphaTRad) - inv(alpha_Fat0));
        const HalfToothAngle = st_Fat0 / dFa0;
        const next_rho = 0.5 * st_Fat0 / Math.cos(alpha_Fat0 + HalfToothAngle);
        dFa0 = da0 - 2 * next_rho * (1 - Math.sin(alpha_Fat0 + HalfToothAngle));

        if (Math.abs(next_rho - rhoaP_max) < 1e-6) {
            rhoaP_max = next_rho;
            break;
        }
        rhoaP_max = next_rho;
        std_rho_iterations++;
    }
    const rhoaP_coeff_max = rhoaP_max / mn;

    // -------------------------------------------------------------------------
    // Equivalent gear parameters
    // -------------------------------------------------------------------------
    let gen_alpha_t, gen_mt, gen_d, gen_beta, gen_mn;
    let gen_st, gen_xE, gen_haP0_coeff, gen_hfP0_coeff;
    let gen_d0, gen_da0, gen_st0, gen_alpha_at0, gen_st_a0;
    let kin_iterations = 0;
    // Shaper-only diagnostics (NaN for hob path)
    let shaper_x0 = NaN, shaper_gen_aw0 = NaN;

    if (toolType === 'shaper') {
        shaper_x0 = 0;
        gen_da0 = da0;
        shaper_gen_aw0 = 0.5 * (Math.abs(dF) + sign * gen_da0);

        for (let candidate_x0 = 0; candidate_x0 <= 2.0; candidate_x0 += 0.01) {
            const c_da0 = da0 + 2 * candidate_x0 * mn;
            const c_df0 = d0 - 2 * mn * (hfP0_coeff + 0.03) + 2 * candidate_x0 * mn;
            const c_aw0 = 0.5 * (Math.abs(dF) + sign * c_da0);

            if (c_df0 < db0) continue;

            const absDA = Math.abs(dA);
            const clearance = (sign === 1)
                ? c_aw0 - 0.5 * c_df0 - 0.5 * absDA
                : 0.5 * absDA - c_aw0 - 0.5 * c_df0;

            if (clearance >= 0.03 * mn - 1e-5) {
                shaper_x0 = candidate_x0;
                gen_da0 = c_da0;
                shaper_gen_aw0 = c_aw0;
                break;
            }
        }
        if (shaper_x0 === 0 && d0 - 2 * mn * (hfP0_coeff + 0.03) < db0) {
            shaper_x0 = Math.max(0, 0.5 * (db0 + 2 * mn * (hfP0_coeff + 0.03) - d0) / mn);
            gen_da0 = da0 + 2 * shaper_x0 * mn;
            shaper_gen_aw0 = 0.5 * (Math.abs(dF) + sign * gen_da0);
        }

        gen_alpha_t = safeAcos(Math.abs(db + sign * db0) / (2 * shaper_gen_aw0));
        gen_d = db / Math.cos(gen_alpha_t);
        gen_d0 = db0 / Math.cos(gen_alpha_t);
        gen_mt = gen_d0 / z0;

        gen_beta = (beta === 0 || !isFinite(pz)) ? 0 : Math.atan(gen_d * Math.PI / pz);
        gen_mn = gen_mt * Math.cos(gen_beta);

        gen_st = gen_d * (st / d + inv(alphaTRad) - inv(gen_alpha_t));
        // Cutter tooth thickness at generating pitch circle via involute transfer from its own reference circle.
        // Using the meshing identity (π*gen_mt - gen_st) is only valid when x0 = 0;
        // when x0 > 0 the cutter reference and generating pitch circles differ, so we must transfer explicitly.
        const st0_shifted = st0 + 2 * shaper_x0 * mn * Math.tan(alphaNRad) / Math.cos(betaRad);
        gen_st0 = gen_d0 * (st0_shifted / d0 + inv(alphaTRad) - inv(gen_alpha_t));

        gen_xE = (gen_st / gen_mt - Math.PI / 2) / (2 * Math.tan(gen_alpha_t));
        gen_haP0_coeff = sign * (gen_d - Math.abs(dF)) / (2 * gen_mn);
        gen_hfP0_coeff = haP0_coeff + hfP0_coeff - gen_haP0_coeff;

        gen_alpha_at0 = safeAcos(db0 / gen_da0);
        gen_st_a0 = gen_da0 * (gen_st0 / gen_d0 + inv(gen_alpha_t) - inv(gen_alpha_at0));
    } else {
        // Hob/Rack: iterative calculation for generating kinematics
        let alphaP0Rad = alpha_P0 * (Math.PI / 180);

        gen_d = d * Math.cos(alphaNRad) / Math.cos(alphaP0Rad);
        gen_beta = (beta === 0 || !isFinite(pz)) ? 0 : Math.atan(gen_d * Math.PI / pz);
        gen_alpha_t = Math.atan(Math.tan(alphaP0Rad) / Math.cos(gen_beta));
        gen_mt = mt * Math.cos(alphaTRad) / Math.cos(gen_alpha_t);

        while (kin_iterations < 100) {
            const next_gen_d = absZ * gen_mt;

            const next_gen_beta = (beta === 0 || !isFinite(pz))
                ? 0
                : Math.atan((next_gen_d * Math.PI) / pz);

            const next_gen_alpha_t = Math.atan(Math.tan(alphaP0Rad) / Math.cos(next_gen_beta));
            const next_gen_mt = mt * Math.cos(alphaTRad) / Math.cos(next_gen_alpha_t);

            const diff = Math.max(
                Math.abs(next_gen_alpha_t - gen_alpha_t),
                Math.abs(next_gen_mt - gen_mt),
                Math.abs(next_gen_d - gen_d),
                Math.abs(next_gen_beta - gen_beta)
            );

            gen_alpha_t = next_gen_alpha_t;
            gen_mt = next_gen_mt;
            gen_d = next_gen_d;
            gen_beta = next_gen_beta;

            if (diff < 1e-8) break;
            kin_iterations++;
        }
        gen_mn = gen_mt * Math.cos(gen_beta);

        gen_st = gen_d * (st / d + inv(alphaTRad) - inv(gen_alpha_t));
        gen_xE = (gen_st / gen_mt - Math.PI / 2) / (2 * Math.tan(gen_alpha_t));

        gen_haP0_coeff = sign * (gen_d - Math.abs(dF)) / (2 * gen_mn);
        gen_hfP0_coeff = haP0_coeff + hfP0_coeff - gen_haP0_coeff;

        gen_d0 = z0 * gen_mt;
        gen_da0 = gen_d0 + gen_mn * 2 * gen_haP0_coeff;
        gen_st0 = Math.PI * gen_mt - gen_st;
        gen_alpha_at0 = safeAcos(db0 / gen_da0);
        gen_st_a0 = gen_da0 * (gen_st0 / gen_d0 + inv(gen_alpha_t) - inv(gen_alpha_at0));
    }

    // Iterative calculation for maximum generating basic rack tip radius
    let gen_rhoaP_max = 0.5 * gen_st_a0;
    let gen_dFa0 = gen_da0 - 2 * gen_rhoaP_max * (1 - Math.sin(gen_alpha_t));
    let gen_rho_iterations = 0;
    while (gen_rho_iterations < 100) {
        if (gen_dFa0 < db0) break;
        const gen_alpha_Fat0 = safeAcos(db0 / gen_dFa0);
        const gen_st_Fat0 = gen_dFa0 * (gen_st0 / gen_d0 + inv(gen_alpha_t) - inv(gen_alpha_Fat0));
        const gen_HalfToothAngle = gen_st_Fat0 / gen_dFa0;
        const gen_next_rho = 0.5 * gen_st_Fat0 / Math.cos(gen_alpha_Fat0 + gen_HalfToothAngle);
        gen_dFa0 = gen_da0 - 2 * gen_next_rho * (1 - Math.sin(gen_alpha_Fat0 + gen_HalfToothAngle));

        if (Math.abs(gen_next_rho - gen_rhoaP_max) < 1e-6) {
            gen_rhoaP_max = gen_next_rho;
            break;
        }
        gen_rhoaP_max = gen_next_rho;
        gen_rho_iterations++;
    }
    const gen_rhoaP_coeff_max = gen_rhoaP_max / gen_mn;

    // Calculate actual generating fillet radius scaled by user coefficient rhoaP_coeff
    const rhoPercent = (rhoaP_max > 0) ? Math.min(1, (rhoaP_coeff * mn) / rhoaP_max) : 0;
    const actual_gen_fillet = rhoPercent * gen_rhoaP_max;

    // Calculate generating cutter root diameter ensuring clearance with gear tip dA
    let gen_df0 = d0 - 2 * mn * (hfP0_coeff + 0.03) + (!isNaN(shaper_x0) ? 2 * shaper_x0 * mn : 0);
    if (!isNaN(shaper_gen_aw0)) {
        const absDA = Math.abs(dA);
        const max_allowed_df0 = (sign === 1)
            ? 2 * Math.abs(shaper_gen_aw0) - absDA - 0.06 * mn
            : absDA - 2 * Math.abs(shaper_gen_aw0) - 0.06 * mn;
        if (gen_df0 > max_allowed_df0) {
            gen_df0 = Math.max(db0, max_allowed_df0);
        }
    }

    // Iterative calculation for generating cutter active tip diameter where actual_gen_fillet is tangent to involute
    let gen_dFa0_act = gen_da0 - 2 * actual_gen_fillet * (1 - Math.sin(gen_alpha_t));
    let act_rho_iterations = 0;
    while (act_rho_iterations < 100) {
        if (gen_dFa0_act < db0) break;
        const gen_alpha_Fat0 = safeAcos(db0 / gen_dFa0_act);
        const next_gen_dFa0 = gen_da0 - 2 * actual_gen_fillet * (1 - Math.sin(gen_alpha_Fat0));
        if (Math.abs(next_gen_dFa0 - gen_dFa0_act) < 1e-6) {
            gen_dFa0_act = next_gen_dFa0;
            break;
        }
        gen_dFa0_act = next_gen_dFa0;
        act_rho_iterations++;
    }

    const steps = {
        "Eq.1": `Std Gear: mt=${mt.toFixed(4)}, alpha_t=${(alphaTRad * 180 / Math.PI).toFixed(4)}°, st=${st.toFixed(4)}`,
        "Eq.2": `Std Cutter: d0=${d0.toFixed(4)}, db0=${db0.toFixed(4)}, da0=${da0.toFixed(4)}, st0=${st0.toFixed(4)}`,
        "Eq.3": `Std Cutter Tip: alpha_at0=${(alpha_at0 * 180 / Math.PI).toFixed(4)}°, st_a0=${st_a0.toFixed(4)}, haP0*=${std_haP0_coeff.toFixed(4)}`,
        "Eq.4": `Std Cutter Max Fillet: rhoaP_max=${rhoaP_max.toFixed(4)}, rhoaP_coeff_max=${rhoaP_coeff_max.toFixed(4)} (iterations: ${std_rho_iterations})`,
        ...(!isNaN(shaper_x0) ? {
            "Eq.4a": `Shaper Cutter Shift: x0=${shaper_x0.toFixed(4)}, gen_da0=${gen_da0.toFixed(4)} mm`,
            "Eq.4b": `Shaper Gen Center Dist: gen_aw0=${shaper_gen_aw0.toFixed(4)} mm`,
        } : {}),
        "Eq.5": `Gen Kinematics: gen_alpha_t=${(gen_alpha_t * 180 / Math.PI).toFixed(4)}°, gen_beta=${(gen_beta * 180 / Math.PI).toFixed(4)}°, gen_mn=${gen_mn.toFixed(4)}${isNaN(shaper_x0) ? ` (iterations: ${kin_iterations})` : ''}`,
        "Eq.6": `Gen Gear: gen_st=${gen_st.toFixed(4)}, gen_xE=${gen_xE.toFixed(4)}`,
        "Eq.6a": `Gen Cutter Pitch Dia: gen_d0=${gen_d0.toFixed(4)} mm, gen_st0=${gen_st0.toFixed(4)} mm`,
        "Eq.7": `Gen Rack: gen_haP0*=${gen_haP0_coeff.toFixed(4)}, gen_hfP0*=${gen_hfP0_coeff.toFixed(4)}`,
        "Eq.8": `Gen Cutter: gen_d0=${gen_d0.toFixed(4)}, gen_da0=${gen_da0.toFixed(4)}, gen_df0=${gen_df0.toFixed(4)}, gen_st0=${gen_st0.toFixed(4)}`,
        "Eq.9": `Gen Cutter Tip: alpha_at0=${(gen_alpha_at0 * 180 / Math.PI).toFixed(4)}°, st_a0=${gen_st_a0.toFixed(4)}`,
        "Eq.10": `Gen Cutter Max Fillet: gen_rhoaP_max=${gen_rhoaP_max.toFixed(4)}, gen_rhoaP_coeff_max=${gen_rhoaP_coeff_max.toFixed(4)} (iterations: ${gen_rho_iterations})`,
        "Eq.10a": `Actual Gen Fillet: rho=${actual_gen_fillet.toFixed(4)} mm, dFa0_act=${gen_dFa0_act.toFixed(4)} mm`,
        "Eq.11": `Lead (pz): ${pz === Infinity ? 'Infinity' : pz.toFixed(4)}`
    };

    return {
        success: true,
        value: {
            // Standard cutter results
            mt, alphaTRad, xE, st,
            d0, db0, da0, st0, st_a0,
            rhoaP_max, rhoaP_coeff_max,
            // Equivalent gear kinematic results
            gen_alpha_t, gen_mt, gen_d, gen_beta, gen_mn,
            gen_st, gen_xE,
            // Generating basic rack coefficients
            gen_haP0_coeff, gen_hfP0_coeff,
            // Generating cutter results
            gen_d0, gen_da0, gen_df0, gen_st0, gen_alpha_at0, gen_st_a0,
            gen_rhoaP_max, gen_rhoaP_coeff_max, actual_gen_fillet, gen_dFa0_act,
            shaper_gen_aw0, shaper_x0,
        },
        steps
    };
}
