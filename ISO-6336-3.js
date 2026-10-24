/**
 * ISO 6336-3:2019 Calculations
 * Rating tab calculations (Calculation of tooth bending strength)
 */

/**
 * Calculates the Helix Angle Factor (Y_beta) for tooth bending.
 * Reference: ISO 6336-3:2019 Clause 8.3, Formula (66) & (67)
 * 
 * Formula:
 *   Y_beta = (1 - eps_beta * (beta / 120)) * (1 / cos^3(beta))
 *   with beta <= 30 deg and eps_beta <= 1.0 substitution limits
 * 
 * @param {number} [beta=0] - Reference helix angle (degrees)
 * @param {number} [eps_beta=0] - Overlap ratio
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateHelixAngleFactor_Ybeta(beta = 0, eps_beta = 0) {
    if (isNaN(beta) || isNaN(eps_beta) || beta < 0 || beta >= 90) {
        return { success: false, error: 'Invalid parameters for Y_beta.' };
    }
    const betaEffective = Math.min(30.0, beta);
    const epsBetaEffective = Math.min(1.0, Math.max(0, eps_beta));

    const betaRad = betaEffective * (Math.PI / 180);
    const cosBeta = Math.cos(betaRad);
    if (cosBeta <= 0) {
        return { success: false, error: 'Helix angle too large.' };
    }

    const Ybeta = (1.0 - epsBetaEffective * (betaEffective / 120.0)) * (1.0 / Math.pow(cosBeta, 3));
    return { success: true, value: Ybeta };
}

/**
 * Calculates the Rim Thickness Factor (Y_B).
 * Reference: ISO 6336-3:2019 Clause 9.3, Formulae (68) - (71)
 * 
 * @param {Object} params
 * @param {number} params.sR - Rim thickness (mm)
 * @param {number} params.ht - Tooth height (mm)
 * @param {number} params.mn - Normal module (mm)
 * @param {boolean} [params.isInternal=false] - True if internal gear
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateRimThicknessFactor_YB(params = {}) {
    const sR = Number(params.sR);
    const ht = Number(params.ht);
    const mn = Number(params.mn);
    const isInternal = Boolean(params.isInternal);

    if (isNaN(sR) || sR <= 0) {
        return { success: true, value: 1.0 }; // Assume solid disc default
    }

    if (!isInternal) {
        // External gears: Clause 9.3.1
        if (isNaN(ht) || ht <= 0) return { success: true, value: 1.0 };
        const ratio = sR / ht;
        if (ratio >= 1.2) {
            return { success: true, value: 1.0 };
        } else if (ratio > 0.5) {
            // Formula (69)
            const YB = 1.6 * Math.log(2.242 * (ht / sR));
            return { success: true, value: Math.max(1.0, YB) };
        } else {
            return { success: false, error: 'sR / ht <= 0.5 shall be avoided for external gears.' };
        }
    } else {
        // Internal gears: Clause 9.3.2
        if (isNaN(mn) || mn <= 0) return { success: true, value: 1.0 };
        const ratio = sR / mn;
        if (ratio >= 3.5) {
            return { success: true, value: 1.0 };
        } else if (ratio > 1.75) {
            // Formula (71)
            const YB = 1.15 * Math.log(8.324 * (mn / sR));
            return { success: true, value: Math.max(1.0, YB) };
        } else {
            return { success: false, error: 'sR / mn <= 1.75 shall be avoided for internal gears.' };
        }
    }
}

/**
 * Calculates the Deep Tooth Factor (Y_DT).
 * Reference: ISO 6336-3:2019 Clause 10.3, Formulae (72) - (74)
 * 
 * @param {number} eps_alpha_n - Virtual contact ratio eps_alpha_n
 * @param {number} [toleranceClass=6] - ISO 1328-1 tolerance class
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateDeepToothFactor_YDT(eps_alpha_n, toleranceClass = 6) {
    if (isNaN(eps_alpha_n) || eps_alpha_n <= 0) {
        return { success: false, error: 'Invalid virtual contact ratio.' };
    }
    const tol = Math.round(Number(toleranceClass) || 6);

    if (eps_alpha_n <= 2.05 || tol > 4) {
        // Formula (72)
        return { success: true, value: 1.0 };
    } else if (eps_alpha_n <= 2.5) {
        // Formula (73)
        const YDT = -0.666 * eps_alpha_n + 2.366;
        return { success: true, value: YDT };
    } else {
        // Formula (74)
        return { success: true, value: 0.7 };
    }
}

/**
 * Calculates Tooth Form Factor (YF) and Stress Correction Factor (YS) for hobbed external gears.
 * Reference: ISO 6336-3:2019 Clause 6.2.2, 6.2.3, 7.2 (Formulae 9 - 32, 62 - 64)
 * 
 * @param {Object} params
 * @param {number} params.z - Number of teeth of virtual gear (zn)
 * @param {number} params.x - Profile shift coefficient (xn)
 * @param {number} params.mn - Normal module (mm)
 * @param {number} [params.alpha_n=20] - Normal pressure angle (degrees)
 * @param {number} [params.hfp_mn=1.2] - Basic rack dedendum ratio (hfp / mn)
 * @param {number} [params.rhofp_mn=0.3] - Basic rack root fillet radius ratio (rhofp / mn)
 * @param {number} [params.spr_mn=0] - Residual undercut ratio (spr / mn)
 * @param {number} [params.eps_alpha_n=1.5] - Virtual contact ratio (eps_alpha_n)
 * @param {number} [params.eps_beta=0] - Overlap ratio
 * @returns {Object} result - { success: boolean, YF: number, YS: number, sFn: number, hFe: number, rhoF: number, qs: number, error?: string }
 */
function calculateToothFormAndStressFactors_MethodB(params = {}) {
    const zn = Number(params.z) || 25;
    const xn = Number(params.x) || 0;
    const mn = Number(params.mn) || 2.0;
    const alpha_n = (params.alpha_n !== undefined && !isNaN(params.alpha_n)) ? Number(params.alpha_n) : 20.0;
    const hfp_mn = (params.hfp_mn !== undefined && !isNaN(params.hfp_mn)) ? Number(params.hfp_mn) : 1.2;
    const rhofp_mn = (params.rhofp_mn !== undefined && !isNaN(params.rhofp_mn)) ? Number(params.rhofp_mn) : 0.38;
    const spr_mn = Number(params.spr_mn) || 0;
    const eps_alpha_n = (params.eps_alpha_n !== undefined && !isNaN(params.eps_alpha_n)) ? Number(params.eps_alpha_n) : 1.5;
    const eps_beta = Number(params.eps_beta) || 0;

    if (zn <= 0 || mn <= 0) {
        return { success: false, error: 'Invalid virtual gear teeth or module.' };
    }

    const anRad = alpha_n * (Math.PI / 180);
    const cosAn = Math.cos(anRad);
    const sinAn = Math.sin(anRad);
    const tanAn = Math.tan(anRad);

    // Formula (26) divided by mn: E / mn
    const E_mn = (Math.PI / 4.0) - (hfp_mn * tanAn) + (spr_mn / cosAn) - ((1.0 - sinAn) * (rhofp_mn / cosAn));

    // Formula (27): G
    const G = (rhofp_mn - hfp_mn) + xn;

    // Formula (28): H
    const T = Math.PI / 3.0;
    const H = (2.0 / zn) * ((Math.PI / 2.0) - E_mn) - T;

    // Iteration for theta: Formula (29)
    // theta = (2*G / zn) * tan(theta) - H
    let theta = Math.PI / 6.0; // Seed value per Clause 6.2.3
    for (let iter = 0; iter < 10; iter++) {
        const nextTheta = (2.0 * G / zn) * Math.tan(theta) - H;
        if (Math.abs(nextTheta - theta) < 1e-7) {
            theta = nextTheta;
            break;
        }
        theta = nextTheta;
    }

    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const angleTerm = (Math.PI / 3.0) - theta;

    // Formula (30): Tooth root chord sFn / mn
    const sFn_mn = zn * Math.sin(angleTerm) + Math.sqrt(3.0) * ((G / cosTheta) - rhofp_mn);
    const sFn = sFn_mn * mn;

    // Formula (31): Radius of root fillet rhoF / mn
    const denomRho = zn * Math.pow(cosTheta, 2) - 2.0 * G;
    let rhoF_mn = rhofp_mn;
    if (denomRho > 0) {
        rhoF_mn = rhofp_mn + (2.0 * G * G) / (cosTheta * denomRho);
    }
    const rhoF = rhoF_mn * mn;

    // Auxiliary angle & roll angle at contact point Fen: Clause 6.2.2 & 6.2.3
    // For standard evaluation, alpha_Fen is derived from outer point of single pair contact
    // Involute function: inv(a) = tan(a) - a
    const invAn = tanAn - anRad;
    const gamma_e = ((0.5 * Math.PI + 2.0 * xn * tanAn) / zn) + invAn; // Approximate at reference
    const alpha_Fen = anRad; // Standard orientation angle at contact point

    // Formula (32): Bending moment arm hFe / mn
    // Simplified robust evaluation for hobbed teeth:
    const cosAngleTerm = Math.cos(angleTerm);
    const den_mn = zn + 2.0 * (1.0 + xn); // Approximate outer single contact diameter / mn
    const hFe_mn = 0.5 * (den_mn - zn * cosAngleTerm - ((G / cosTheta) - rhofp_mn));
    const hFe = Math.max(0.5 * mn, hFe_mn * mn);

    // Load distribution factor fe: Formulae (10) - (14)
    let fe = 1.0;
    if (eps_beta === 0) {
        fe = (eps_alpha_n < 2.0) ? 1.0 : 0.7;
    } else if (eps_beta < 1.0) {
        if (eps_alpha_n < 2.0) {
            fe = Math.pow(1.0 - eps_beta + (eps_beta / eps_alpha_n), 0.5);
        } else {
            fe = Math.pow((1.0 - eps_beta) / 2.0 + (eps_beta / eps_alpha_n), 0.5);
        }
    } else {
        fe = Math.pow(eps_alpha_n, -0.5);
    }

    // Formula (9): Form factor YF
    // YF = ( (6 * hFe / mn) * cos(alpha_Fen) / ((sFn / mn)^2 * cos(alpha_n)) ) * fe
    const YF = ((6.0 * (hFe / mn) * Math.cos(alpha_Fen)) / (Math.pow(sFn_mn, 2) * cosAn)) * fe;

    // Stress Correction Factor YS: Clause 7.2 Formula (62) - (64)
    const L = sFn / hFe; // Formula (63)
    const qs = sFn / (2.0 * rhoF); // Formula (64)

    // Formula (62): YS = (1.2 + 0.13 * L) * qs^( 1 / (1.21 + 2.3 / L) )
    const exponent = 1.0 / (1.21 + (2.3 / L));
    const YS = (1.2 + 0.13 * L) * Math.pow(Math.max(1.0, qs), exponent);

    return {
        success: true,
        YF: Math.max(0.5, YF),
        YS: Math.max(1.0, YS),
        sFn: sFn,
        hFe: hFe,
        rhoF: rhoF,
        qs: qs
    };
}

/**
 * Calculates Life Factor for Tooth Root Stress (YNT).
 * Reference: ISO 6336-3:2019 Clause 12.3, Table 3, Formula (6)
 * 
 * @param {number} NL - Number of load cycles
 * @param {string} [material='Eh'] - Material abbreviation
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateLifeFactor_YNT(NL, material = 'Eh') {
    if (isNaN(NL) || NL <= 0) {
        return { success: false, error: 'Number of load cycles NL must be > 0.' };
    }
    const mat = (material || 'Eh').trim();

    if (['St', 'V', 'GGG(perl. bai.)', 'GTS(perl.)', 'GGG'].includes(mat)) {
        // Table 3 line 1: static to 1e4, reference at 3e6
        if (NL <= 1e4) return { success: true, value: 2.5 };
        if (NL <= 3e6) {
            const exp = Math.log10(2.5 / 1.0) / Math.log10(3e6 / 1e4);
            return { success: true, value: 1.0 * Math.pow(3e6 / NL, exp) };
        }
        // Long life range NL > 3e6
        const exp = Math.log10(1.0 / 0.85) / Math.log10(1e10 / 3e6);
        return { success: true, value: Math.max(0.85, 1.0 * Math.pow(3e6 / NL, exp)) };
    } else if (['Eh', 'IF', 'IF(root)'].includes(mat)) {
        // Table 3 line 2: static to 1e3, reference at 3e6
        if (NL <= 1e3) return { success: true, value: 2.5 };
        if (NL <= 3e6) {
            const exp = Math.log10(2.5 / 1.0) / Math.log10(3e6 / 1e3);
            return { success: true, value: 1.0 * Math.pow(3e6 / NL, exp) };
        }
        const exp = Math.log10(1.0 / 0.85) / Math.log10(1e10 / 3e6);
        return { success: true, value: Math.max(0.85, 1.0 * Math.pow(3e6 / NL, exp)) };
    } else if (['GG', 'GGG(ferr.)', 'NT', 'NV(nitr.)'].includes(mat)) {
        // Table 3 line 3: static 1.6 to 1e3, reference 1.0 at 3e6
        if (NL <= 1e3) return { success: true, value: 1.6 };
        if (NL <= 3e6) {
            const exp = Math.log10(1.6 / 1.0) / Math.log10(3e6 / 1e3);
            return { success: true, value: 1.0 * Math.pow(3e6 / NL, exp) };
        }
        const exp = Math.log10(1.0 / 0.85) / Math.log10(1e10 / 3e6);
        return { success: true, value: Math.max(0.85, 1.0 * Math.pow(3e6 / NL, exp)) };
    } else {
        // NV (nitrocar.) Table 3 line 4
        if (NL <= 1e3) return { success: true, value: 1.1 };
        if (NL <= 3e6) {
            const exp = Math.log10(1.1 / 1.0) / Math.log10(3e6 / 1e3);
            return { success: true, value: 1.0 * Math.pow(3e6 / NL, exp) };
        }
        const exp = Math.log10(1.0 / 0.85) / Math.log10(1e10 / 3e6);
        return { success: true, value: Math.max(0.85, 1.0 * Math.pow(3e6 / NL, exp)) };
    }
}

/**
 * Calculates Relative Notch Sensitivity Factor (Y_delta_relT).
 * Reference: ISO 6336-3:2019 Clause 13.3.2, Formulae (75) - (77), Table 4
 * 
 * Formula:
 *   Y_delta_relT = (1 + sqrt(rho' * chi*)) / (1 + sqrt(rho' * chi*_T))
 *   where chi* = (1 / 5) * (1 + 2 * qs)
 *   and chi*_T = (1 / 5) * (1 + 2 * 2.5) = 1.2
 * 
 * @param {number} qs - Notch parameter qs = sFn / (2 * rhoF)
 * @param {string} [material='Eh'] - Material designation
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateRelativeNotchSensitivity_Ydelta(qs, material = 'Eh') {
    if (isNaN(qs) || qs <= 0) {
        return { success: false, error: 'Invalid notch parameter qs.' };
    }
    const mat = (material || 'Eh').trim();

    // Table 4: Slip layer thickness rho' (mm)
    let rho_prime = 0.0030; // default case hardened Eh, IF
    if (['GG'].includes(mat)) rho_prime = 0.3124;
    else if (['GGG(ferr.)', 'GGG'].includes(mat)) rho_prime = 0.3095;
    else if (['NT', 'NV'].includes(mat)) rho_prime = 0.1005;
    else if (['St'].includes(mat)) rho_prime = 0.0445;
    else if (['V', 'GTS', 'GGG(perl. bai.)'].includes(mat)) rho_prime = 0.0194;

    const chi_star = 0.2 * (1.0 + 2.0 * qs);
    const chi_star_T = 0.2 * (1.0 + 2.0 * 2.5); // 1.2 for reference gear

    const num = 1.0 + Math.sqrt(rho_prime * chi_star);
    const denom = 1.0 + Math.sqrt(rho_prime * chi_star_T);

    return { success: true, value: num / denom };
}

/**
 * Calculates Relative Surface Factor (Y_RrelT).
 * Reference: ISO 6336-3:2019 Clause 14.3.2, Formulae (84) - (89)
 * 
 * @param {number} [Rz=4.0] - Fillet surface roughness (um)
 * @param {string} [material='Eh'] - Material designation
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateRelativeSurfaceFactor_YRrelT(Rz = 4.0, material = 'Eh') {
    const roughness = Number(Rz) || 4.0;
    const mat = (material || 'Eh').trim();

    if (roughness < 1.0) {
        if (['St'].includes(mat)) return { success: true, value: 1.07 };
        if (['GG', 'GGG(ferr.)', 'NT', 'NV'].includes(mat)) return { success: true, value: 1.025 };
        return { success: true, value: 1.12 }; // Eh, V, GGG (perl)
    }

    const rzClamped = Math.min(40.0, roughness);

    if (['St'].includes(mat)) {
        // Formula (88)
        const YR = 5.306 - 4.203 * Math.pow(rzClamped + 1.0, 0.01);
        return { success: true, value: YR };
    } else if (['GG', 'GGG(ferr.)', 'NT', 'NV'].includes(mat)) {
        // Formula (89)
        const YR = 4.299 - 3.259 * Math.pow(rzClamped + 1.0, 0.005);
        return { success: true, value: YR };
    } else {
        // Formula (87) for Eh, IF, V, GTS, GGG(perl)
        const YR = 1.674 - 0.529 * Math.pow(rzClamped + 1.0, 0.1);
        return { success: true, value: YR };
    }
}

/**
 * Calculates Size Factor for Tooth Root Strength (YX).
 * Reference: ISO 6336-3:2019 Clause 15.3.3, Table 5
 * 
 * @param {number} mn - Normal module (mm)
 * @param {string} [material='Eh'] - Material designation
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateSizeFactor_YX(mn, material = 'Eh') {
    const m = Number(mn) || 2.0;
    const mat = (material || 'Eh').trim();

    if (m <= 5.0) {
        return { success: true, value: 1.0 };
    }

    if (['St', 'V', 'GGG(perl. bai.)', 'GTS(perl.)', 'GGG'].includes(mat)) {
        if (m < 30.0) {
            return { success: true, value: 1.03 - 0.006 * m };
        }
        return { success: true, value: 0.85 };
    } else if (['GG', 'GGG(ferr.)'].includes(mat)) {
        if (m < 25.0) {
            return { success: true, value: 1.075 - 0.015 * m };
        }
        return { success: true, value: 0.70 };
    } else {
        // Eh, IF, NT, NV
        if (m < 25.0) {
            return { success: true, value: 1.05 - 0.01 * m };
        }
        return { success: true, value: 0.80 };
    }
}

/**
 * Calculates Comprehensive Tooth Root Bending Strength.
 * Reference: ISO 6336-3:2019
 * 
 * Computes:
 * - Nominal tooth root stress: sigma_F0 (pinion & wheel) (Formula 4)
 * - Determinant tooth root stress: sigma_F (pinion & wheel) (Formula 3)
 * - Permissible bending stress: sigma_FP (pinion & wheel) (Formula 5)
 * - Tooth root bending safety factor: SF (pinion & wheel) (Formulae 1 & 2)
 * 
 * @param {Object} gearData - Gear geometry & operating configuration
 * @returns {Object} result - { success: boolean, sigma_F1, sigma_F2, sigma_FP1, sigma_FP2, SF1, SF2, factors, error?: string }
 */
function calculateToothBendingStrength(gearData = {}) {
    // 1. Basic geometry & loading
    const z1 = Number(gearData.z1) || 25;
    const z2 = Number(gearData.z2) || 50;
    const mn = Number(gearData.mn) || 2.0;
    const b = Number(gearData.b) || 30.0;
    const beta = Number(gearData.beta) || 0;
    const alpha_n = (gearData.alpha_n !== undefined && !isNaN(gearData.alpha_n)) ? Number(gearData.alpha_n) : 20.0;
    const x1 = Number(gearData.x1) || 0;
    const x2 = Number(gearData.x2) || 0;
    const eps_alpha = (gearData.eps_alpha !== undefined && !isNaN(gearData.eps_alpha)) ? Number(gearData.eps_alpha) : 1.5;
    const eps_beta = (gearData.eps_beta !== undefined && !isNaN(gearData.eps_beta)) ? Number(gearData.eps_beta) : 0;
    const Ft = Number(gearData.Ft) || 1000.0;
    const u = Math.abs(z2 / z1);

    // Virtual parameters (Clause 6.2.2)
    const betaRad = beta * (Math.PI / 180);
    const alphaNRad = alpha_n * (Math.PI / 180);
    const sinBeta = Math.sin(betaRad);
    const cosAlphaN = Math.cos(alphaNRad);
    const beta_b = Math.asin(sinBeta * cosAlphaN) * (180.0 / Math.PI);
    const cosBetaB = Math.cos(beta_b * Math.PI / 180);
    const cosBeta = Math.cos(betaRad);

    const zn1 = Math.abs(z1) / (Math.pow(cosBetaB, 2) * cosBeta);
    const zn2 = Math.abs(z2) / (Math.pow(cosBetaB, 2) * cosBeta);
    const eps_alpha_n = eps_alpha / Math.pow(cosBetaB, 2);

    // ISO 6336-1 General influence factors for tooth root
    const KA = Number(gearData.KA) || 1.0;
    const Kgamma = Number(gearData.Kgamma) || 1.0;
    const Kv = Number(gearData.Kv) || 1.0;
    const KFbeta = Number(gearData.KFbeta) || 1.0;
    const KFalpha = Number(gearData.KFalpha) || 1.0;

    // Material and strength limits
    const mat1 = gearData.material1 || gearData.material || 'Eh';
    const mat2 = gearData.material2 || gearData.material || 'Eh';
    const sigmaFlim1 = Number(gearData.sigmaFlim1) || Number(gearData.sigmaFlim) || 430.0;
    const sigmaFlim2 = Number(gearData.sigmaFlim2) || Number(gearData.sigmaFlim) || 430.0;
    const SFmin = Number(gearData.SFmin) || 1.4;
    const NL1 = Number(gearData.NL1) || 1e7;
    const NL2 = Number(gearData.NL2) || (NL1 / u);

    // 2. Helix angle factor Y_beta (Formula 66)
    const resYbeta = calculateHelixAngleFactor_Ybeta(beta, eps_beta);
    if (!resYbeta.success) return resYbeta;
    const Ybeta = resYbeta.value;

    // 3. Rim thickness factor Y_B (Formulae 68 - 71)
    const resYB1 = calculateRimThicknessFactor_YB({ sR: gearData.sR1, ht: gearData.ht1, mn, isInternal: false });
    const resYB2 = calculateRimThicknessFactor_YB({ sR: gearData.sR2, ht: gearData.ht2, mn, isInternal: Boolean(gearData.isInternal) });
    const YB1 = resYB1.success ? resYB1.value : 1.0;
    const YB2 = resYB2.success ? resYB2.value : 1.0;

    // 4. Deep tooth factor Y_DT (Formulae 72 - 74)
    const resYDT = calculateDeepToothFactor_YDT(eps_alpha_n, gearData.toleranceClass || 6);
    const YDT = resYDT.success ? resYDT.value : 1.0;

    // 5. Form factor YF and Stress correction factor YS (Pinion and Wheel)
    const hfp_mn1 = gearData.hfp_mn1 || gearData.hfp_mn || 1.25;
    const hfp_mn2 = gearData.hfp_mn2 || gearData.hfp_mn || 1.25;
    const rhofp_mn1 = gearData.rhofp_mn1 !== undefined ? gearData.rhofp_mn1 : (gearData.rhofp_mn !== undefined ? gearData.rhofp_mn : 0.38);
    const rhofp_mn2 = gearData.rhofp_mn2 !== undefined ? gearData.rhofp_mn2 : (gearData.rhofp_mn !== undefined ? gearData.rhofp_mn : 0.38);

    const resTooth1 = calculateToothFormAndStressFactors_MethodB({
        z: zn1, x: x1, mn, alpha_n,
        hfp_mn: hfp_mn1,
        rhofp_mn: rhofp_mn1,
        eps_alpha_n, eps_beta
    });
    if (!resTooth1.success) return resTooth1;

    const resTooth2 = calculateToothFormAndStressFactors_MethodB({
        z: zn2, x: x2, mn, alpha_n,
        hfp_mn: hfp_mn2,
        rhofp_mn: rhofp_mn2,
        eps_alpha_n, eps_beta
    });
    if (!resTooth2.success) return resTooth2;

    const YF1 = resTooth1.YF;
    const YS1 = resTooth1.YS;
    const YF2 = resTooth2.YF;
    const YS2 = resTooth2.YS;

    // 6. Nominal tooth root stress sigma_F0 (Formula 4)
    // sigma_F0 = (Ft / (b * mn)) * YF * YS * Ybeta * YB * YDT
    const specificLoadBending = Ft / (b * mn);
    const sigma_F0_1 = specificLoadBending * YF1 * YS1 * Ybeta * YB1 * YDT;
    const sigma_F0_2 = specificLoadBending * YF2 * YS2 * Ybeta * YB2 * YDT;

    // 7. Determinant tooth root stress sigma_F (Formula 3)
    // sigma_F = sigma_F0 * KA * Kgamma * Kv * KFbeta * KFalpha
    const rootLoadMultiplier = KA * Kgamma * Kv * KFbeta * KFalpha;
    const sigma_F1 = sigma_F0_1 * rootLoadMultiplier;
    const sigma_F2 = sigma_F0_2 * rootLoadMultiplier;

    // 8. Influence factors for permissible bending stress (Formula 5)
    // Stress correction factor of reference test gear YST = 2.0 (Clause 7.4)
    const YST = 2.0;

    // Life factor YNT
    const resYNT1 = calculateLifeFactor_YNT(NL1, mat1);
    const resYNT2 = calculateLifeFactor_YNT(NL2, mat2);
    const YNT1 = resYNT1.success ? resYNT1.value : 1.0;
    const YNT2 = resYNT2.success ? resYNT2.value : 1.0;

    // Relative notch sensitivity factor Y_delta_relT
    const resYdelta1 = calculateRelativeNotchSensitivity_Ydelta(resTooth1.qs, mat1);
    const resYdelta2 = calculateRelativeNotchSensitivity_Ydelta(resTooth2.qs, mat2);
    const Ydelta1 = resYdelta1.success ? resYdelta1.value : 1.0;
    const Ydelta2 = resYdelta2.success ? resYdelta2.value : 1.0;

    // Relative surface factor Y_RrelT
    const resYR1 = calculateRelativeSurfaceFactor_YRrelT(gearData.Rz1 || 4.0, mat1);
    const resYR2 = calculateRelativeSurfaceFactor_YRrelT(gearData.Rz2 || 4.0, mat2);
    const YR1 = resYR1.success ? resYR1.value : 1.0;
    const YR2 = resYR2.success ? resYR2.value : 1.0;

    // Size factor YX
    const resYX1 = calculateSizeFactor_YX(mn, mat1);
    const resYX2 = calculateSizeFactor_YX(mn, mat2);
    const YX1 = resYX1.success ? resYX1.value : 1.0;
    const YX2 = resYX2.success ? resYX2.value : 1.0;

    // Reversed bending factor YM (Clause 13, YM = 0.7 for reversed bending, 1.0 for standard)
    const YM1 = Number(gearData.YM1) || Number(gearData.YM) || 1.0;
    const YM2 = Number(gearData.YM2) || Number(gearData.YM) || 1.0;

    // 9. Permissible bending stress sigma_FP (Formula 5 with YM reversed bending factor)
    // sigma_FP = (sigma_Flim * YST * YNT / SFmin) * Y_delta_relT * Y_RrelT * YX * YM
    const sigma_FP1 = (sigmaFlim1 * YST * YNT1 / SFmin) * Ydelta1 * YR1 * YX1 * YM1;
    const sigma_FP2 = (sigmaFlim2 * YST * YNT2 / SFmin) * Ydelta2 * YR2 * YX2 * YM2;

    // 10. Tooth root bending safety factor (Formulae 1 & 2)
    // SF = (sigma_FP * SFmin) / sigma_F = sigma_FG / sigma_F
    const sigma_FG1 = sigma_FP1 * SFmin;
    const sigma_FG2 = sigma_FP2 * SFmin;

    const SF1 = sigma_F1 > 0 ? (sigma_FG1 / sigma_F1) : 999.0;
    const SF2 = sigma_F2 > 0 ? (sigma_FG2 / sigma_F2) : 999.0;

    return {
        success: true,
        sigma_F0_1: sigma_F0_1,
        sigma_F0_2: sigma_F0_2,
        sigma_F1: sigma_F1,
        sigma_F2: sigma_F2,
        sigma_FP1: sigma_FP1,
        sigma_FP2: sigma_FP2,
        SF1: SF1,
        SF2: SF2,
        factors: {
            YF1: YF1,
            YS1: YS1,
            YF2: YF2,
            YS2: YS2,
            Ybeta: Ybeta,
            YB1: YB1,
            YB2: YB2,
            YDT: YDT,
            YST: YST,
            YNT1: YNT1,
            YNT2: YNT2,
            Ydelta1: Ydelta1,
            Ydelta2: Ydelta2,
            YR1: YR1,
            YR2: YR2,
            YX1: YX1,
            YX2: YX2,
            YM1: YM1,
            YM2: YM2
        }
    };
}

