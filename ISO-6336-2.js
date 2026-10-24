/**
 * ISO 6336-2:2019 Calculations
 * Rating tab calculations (Calculation of surface durability / pitting)
 */

/**
 * Calculates the Zone Factor (ZH).
 * Accounts for tooth flank curvature at the pitch point and transforms
 * tangential load at reference cylinder to normal load at pitch cylinder.
 * Reference: ISO 6336-2:2019 Clause 6.2.3, Formula (16)
 * 
 * Formula:
 *   ZH = sqrt( (2 * cos(beta_b) * cos(alpha_wt)) / (cos^2(alpha_t) * sin(alpha_wt)) )
 * 
 * @param {number} alpha_t - Transverse pressure angle (degrees)
 * @param {number} alpha_wt - Working transverse pressure angle (degrees)
 * @param {number} [beta_b=0] - Base helix angle (degrees)
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateZoneFactor_ZH(alpha_t, alpha_wt, beta_b = 0) {
    if (isNaN(alpha_t) || isNaN(alpha_wt) || isNaN(beta_b)) {
        return { success: false, error: 'Invalid angles for Zone Factor.' };
    }
    const atRad = alpha_t * (Math.PI / 180);
    const awtRad = alpha_wt * (Math.PI / 180);
    const bbRad = beta_b * (Math.PI / 180);

    const cosAwt = Math.cos(awtRad);
    const sinAwt = Math.sin(awtRad);
    const cosAt = Math.cos(atRad);
    const cosBb = Math.cos(bbRad);

    const denom = cosAt * cosAt * sinAwt;
    if (denom <= 0) {
        return { success: false, error: 'Denominator non-positive for Zone Factor calculation.' };
    }

    const val = (2.0 * cosBb * cosAwt) / denom;
    if (val < 0) {
        return { success: false, error: 'Invalid geometry resulting in negative radical for Zone Factor.' };
    }
    return { success: true, value: Math.sqrt(val) };
}

/**
 * Calculates the Elasticity Factor (ZE).
 * Accounts for material properties (modulus of elasticity E and Poisson's ratio nu).
 * Reference: ISO 6336-2:2019 Clause 7, Formulae (24) - (27)
 * 
 * Formula:
 *   ZE = sqrt( 1 / ( pi * ( (1 - nu1^2)/E1 + (1 - nu2^2)/E2 ) ) )
 * 
 * @param {number} [E1=206000] - Modulus of elasticity of pinion (N/mm^2)
 * @param {number} [E2=206000] - Modulus of elasticity of wheel (N/mm^2)
 * @param {number} [nu1=0.3] - Poisson's ratio of pinion
 * @param {number} [nu2=0.3] - Poisson's ratio of wheel
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateElasticityFactor_ZE(E1 = 206000, E2 = 206000, nu1 = 0.3, nu2 = 0.3) {
    if (isNaN(E1) || isNaN(E2) || E1 <= 0 || E2 <= 0) {
        return { success: false, error: 'Invalid modulus of elasticity.' };
    }
    const c1 = (1.0 - nu1 * nu1) / E1;
    const c2 = (1.0 - nu2 * nu2) / E2;
    const denom = Math.PI * (c1 + c2);
    if (denom <= 0) {
        return { success: false, error: 'Invalid elasticity calculation parameter.' };
    }
    return { success: true, value: Math.sqrt(1.0 / denom) };
}

/**
 * Calculates the Contact Ratio Factor (Z_eps).
 * Accounts for the influence of transverse contact ratio and overlap ratio.
 * Reference: ISO 6336-2:2019 Clause 8.2.2, Formulae (29) - (31)
 * 
 * Formulas:
 *   Spur gears: Z_eps = sqrt( (4 - eps_alpha) / 3 )
 *   Helical gears (eps_beta < 1): Z_eps = sqrt( ((4 - eps_alpha) / 3) * (1 - eps_beta) + (eps_beta / eps_alpha) )
 *   Helical gears (eps_beta >= 1): Z_eps = sqrt( 1 / eps_alpha )
 * 
 * @param {number} eps_alpha - Transverse contact ratio
 * @param {number} [eps_beta=0] - Overlap ratio
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateContactRatioFactor_Zeps(eps_alpha, eps_beta = 0) {
    if (isNaN(eps_alpha) || eps_alpha <= 0) {
        return { success: false, error: 'Transverse contact ratio eps_alpha must be positive.' };
    }
    const eb = Math.max(0, Number(eps_beta) || 0);

    let val;
    if (eb === 0) {
        // Formula (29) Spur gears
        val = (4.0 - eps_alpha) / 3.0;
    } else if (eb < 1.0) {
        // Formula (30) Helical gears with eps_beta < 1
        val = ((4.0 - eps_alpha) / 3.0) * (1.0 - eb) + (eb / eps_alpha);
    } else {
        // Formula (31) Helical gears with eps_beta >= 1
        val = 1.0 / eps_alpha;
    }

    if (val <= 0) {
        return { success: false, error: 'Calculated contact ratio factor term is non-positive.' };
    }
    return { success: true, value: Math.sqrt(val) };
}

/**
 * Calculates the Helix Angle Factor (Z_beta).
 * Reference: ISO 6336-2:2019 Clause 9, Formula (41)
 * 
 * Formula:
 *   Z_beta = sqrt( 1 / cos(beta) )
 * 
 * @param {number} [beta=0] - Reference helix angle (degrees)
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateHelixAngleFactor_Zbeta(beta = 0) {
    if (isNaN(beta) || beta < 0 || beta >= 90) {
        return { success: false, error: 'Invalid helix angle beta.' };
    }
    const betaRad = beta * (Math.PI / 180);
    const cosBeta = Math.cos(betaRad);
    if (cosBeta <= 0) {
        return { success: false, error: 'Helix angle too large.' };
    }
    return { success: true, value: Math.sqrt(1.0 / cosBeta) };
}

/**
 * Calculates Single Pair Tooth Contact Factors (ZB for pinion, ZD for wheel).
 * Converts contact stress at the pitch point to determinant contact stress.
 * Reference: ISO 6336-2:2019 Clause 6.3, Formulae (17) - (23), Table 3
 * 
 * @param {Object} params
 * @param {number} params.d1 - Reference diameter pinion (mm)
 * @param {number} params.d2 - Reference diameter wheel (mm)
 * @param {number} params.db1 - Base diameter pinion (mm)
 * @param {number} params.db2 - Base diameter wheel (mm)
 * @param {number} params.dNa1 - Active tip diameter pinion (mm, or tip diameter da1)
 * @param {number} params.dNa2 - Active tip diameter wheel (mm, or tip diameter da2)
 * @param {number} params.z1 - Number of teeth pinion
 * @param {number} params.z2 - Number of teeth wheel
 * @param {number} params.alpha_wt - Working transverse pressure angle (degrees)
 * @param {number} params.eps_alpha - Transverse contact ratio
 * @param {number} [params.eps_beta=0] - Overlap ratio
 * @param {number} [params.fz_ca=1.0] - Modification factor (Table 3: 1.0 optimized, 1.07 experience, 1.2 unmodified)
 * @param {boolean} [params.isInternal=false] - True if internal gear pair
 * @returns {Object} result - { success: boolean, ZB: number, ZD: number, M1: number, M2: number, error?: string }
 */
function calculateContactFactors_ZB_ZD(params = {}) {
    const d1 = Number(params.d1);
    const d2 = Number(params.d2);
    const db1 = Number(params.db1);
    const db2 = Number(params.db2);
    const dNa1 = Number(params.dNa1);
    const dNa2 = Number(params.dNa2);
    const z1 = Number(params.z1);
    const z2 = Number(params.z2);
    const alpha_wt = Number(params.alpha_wt);
    const eps_alpha = Number(params.eps_alpha);
    const eps_beta = Number(params.eps_beta) || 0;
    const fz_ca = Number(params.fz_ca) || 1.0;
    const isInternal = Boolean(params.isInternal);

    if (isNaN(d1) || isNaN(d2) || isNaN(db1) || isNaN(db2) || isNaN(dNa1) || isNaN(dNa2) || isNaN(alpha_wt) || isNaN(eps_alpha)) {
        return { success: false, error: 'Invalid input parameters for contact factors ZB and ZD.' };
    }

    const awtRad = alpha_wt * (Math.PI / 180);
    const tanAwt = Math.tan(awtRad);

    // Formula (17): M1 for pinion
    const term1_rad = Math.pow(dNa1 / db1, 2) - 1.0;
    const term2_rad = Math.pow(dNa2 / db2, 2) - 1.0;

    if (term1_rad < 0 || term2_rad < 0) {
        return { success: false, error: 'Active tip diameter smaller than base diameter.' };
    }

    const t1 = Math.sqrt(term1_rad) - (2.0 * Math.PI / Math.abs(z1));
    const t2 = Math.sqrt(term2_rad) - (eps_alpha - 1.0) * (2.0 * Math.PI / Math.abs(z2));

    let M1 = 1.0;
    if (t1 * t2 > 0) {
        M1 = tanAwt / Math.sqrt(t1 * t2);
    }

    // Formula (18): M2 for wheel
    const t3 = Math.sqrt(term2_rad) - (2.0 * Math.PI / Math.abs(z2));
    const t4 = Math.sqrt(term1_rad) - (eps_alpha - 1.0) * (2.0 * Math.PI / Math.abs(z1));

    let M2 = 1.0;
    if (t3 * t4 > 0) {
        M2 = tanAwt / Math.sqrt(t3 * t4);
    }

    let ZB = 1.0;
    let ZD = 1.0;

    const sqrtFzCa = Math.sqrt(fz_ca);

    if (eps_beta === 0) {
        // Spur gears (Clause 6.3 a)
        ZB = (M1 > 1.0) ? M1 : 1.0;
        if (isInternal) {
            ZD = 1.0;
        } else {
            ZD = (M2 > 1.0) ? M2 : 1.0;
        }
    } else if (eps_beta >= 1.0) {
        // Helical gears with eps_beta >= 1 (Formula 19)
        ZB = sqrtFzCa;
        ZD = sqrtFzCa;
    } else {
        // Helical gears with eps_beta < 1 (Formulae 20 - 23)
        const ZB_spur = (M1 > 1.0) ? M1 : 1.0;
        const ZD_spur = isInternal ? 1.0 : ((M2 > 1.0) ? M2 : 1.0);

        ZB = ZB_spur + eps_beta * (sqrtFzCa - ZB_spur);
        ZD = ZD_spur + eps_beta * (sqrtFzCa - ZD_spur);
    }

    return {
        success: true,
        ZB: ZB,
        ZD: ZD,
        M1: M1,
        M2: M2
    };
}

/**
 * Calculates Lubricant Factor (ZL), Velocity Factor (ZV), and Roughness Factor (ZR).
 * Reference: ISO 6336-2:2019 Clause 12.3.2 (Formulae 42 - 56)
 * 
 * Purely analytical closed-form formulation for mineral oil without graph lookup.
 * 
 * @param {Object} params
 * @param {number} params.sigmaHlim - Allowable contact stress of softer material (N/mm^2)
 * @param {number} [params.v40=220] - Nominal kinematic viscosity at 40°C (mm^2/s)
 * @param {number} [params.vw=5.0] - Circumferential velocity at pitch line (m/s)
 * @param {number} [params.Rz1=4.0] - Flank roughness pinion (um)
 * @param {number} [params.Rz2=4.0] - Flank roughness wheel (um)
 * @param {number} [params.pred=10.0] - Radius of relative curvature at pitch point (mm)
 * @returns {Object} result - { success: boolean, ZL: number, ZV: number, ZR: number, product: number, error?: string }
 */
function calculateLubricationFactors_ZL_ZV_ZR(params = {}) {
    const sigmaHlim = Number(params.sigmaHlim) || 1500.0;
    const v40 = Math.min(500.0, Math.max(10.0, Number(params.v40) || 220.0));
    const vw = Math.max(0.1, Number(params.vw) || 5.0);
    const Rz1 = Number(params.Rz1) || 4.0;
    const Rz2 = Number(params.Rz2) || 4.0;
    const pred = Math.max(0.1, Number(params.pred) || 10.0);

    // Formulae (43) - (45): CZL
    let CZL;
    if (sigmaHlim < 850.0) {
        CZL = 0.83;
    } else if (sigmaHlim <= 1200.0) {
        CZL = (sigmaHlim / 437.5) + 0.6357;
    } else {
        CZL = 0.91;
    }

    // Formula (42): Lubricant factor ZL
    const zlTerm = 1.2 + (134.0 / v40);
    const ZL = CZL + (4.0 * (1.0 - CZL)) / (zlTerm * zlTerm);

    // Formula (47) & (48): Velocity factor ZV
    const CZV = CZL + 0.02;
    const zvTerm = 0.8 + (32.0 / vw);
    const ZV = CZV + (2.0 * (1.0 - CZV)) / Math.sqrt(zvTerm);

    // Formula (49): Mean roughness
    const Rz = (Rz1 + Rz2) / 2.0;

    // Formula (50): Relative mean roughness Rz10
    const Rz10 = Rz * Math.cbrt(10.0 / pred);

    // Formulae (54) - (56): CZR
    let CZR;
    if (sigmaHlim < 850.0) {
        CZR = 0.15;
    } else if (sigmaHlim <= 1200.0) {
        CZR = 0.32 - 0.0002 * sigmaHlim;
    } else {
        CZR = 0.08;
    }

    // Formula (53): Roughness factor ZR
    let ZR = 1.0;
    if (Rz10 > 0) {
        ZR = Math.pow(3.0 / Rz10, CZR);
    }

    return {
        success: true,
        ZL: ZL,
        ZV: ZV,
        ZR: ZR,
        product: ZL * ZV * ZR
    };
}

/**
 * Calculates the Life Factor for Contact Stress (ZNT).
 * Reference: ISO 6336-2:2019 Clause 11.3, Table 5, Formulae (7) - (15)
 * 
 * @param {number} NL - Number of load cycles
 * @param {string} [material='Eh'] - Material designation ('Eh', 'V', 'St', 'GG', 'GGG', 'NT', 'NV')
 * @param {boolean} [limitedPittingPermitted=false] - Whether limited pitting is tolerable
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateLifeFactor_ZNT(NL, material = 'Eh', limitedPittingPermitted = false) {
    if (isNaN(NL) || NL <= 0) {
        return { success: false, error: 'Number of load cycles NL must be > 0.' };
    }

    const mat = (material || 'Eh').trim();

    if (['St', 'V', 'Eh', 'IF', 'GGG(perl., bai.)', 'GTS(perl.)', 'GGG'].includes(mat)) {
        if (limitedPittingPermitted) {
            // Table 5 line 1
            if (NL <= 6e5) return { success: true, value: 1.6 };
            if (NL <= 1e7) {
                // Formula (7) & (8)
                const exp = 0.3705 * Math.log10(1.6 / 1.3);
                return { success: true, value: 1.3 * Math.pow(1e7 / NL, exp) };
            }
            if (NL <= 1e9) {
                // S-N branch to 1.0 at 1e9
                const exp = (Math.log10(1.3 / 1.0)) / (Math.log10(1e9 / 1e7));
                return { success: true, value: 1.0 * Math.pow(1e9 / NL, exp) };
            }
            // Long life range NL > 1e9
            const exp = (Math.log10(1.0 / 0.85)) / (Math.log10(1e10 / 1e9));
            return { success: true, value: Math.max(0.85, 1.0 * Math.pow(1e9 / NL, exp)) };
        } else {
            // Table 5 line 2 (no pitting permissible)
            if (NL <= 1e5) return { success: true, value: 1.6 };
            if (NL <= 5e7) {
                // Formula (11)
                const exp = (Math.log10(1.6 / 1.0)) / (Math.log10(5e7 / 1e5));
                return { success: true, value: 1.0 * Math.pow(5e7 / NL, exp) };
            }
            // Long life NL > 5e7
            const exp = (Math.log10(1.0 / 0.85)) / (Math.log10(1e10 / 5e7));
            return { success: true, value: Math.max(0.85, 1.0 * Math.pow(5e7 / NL, exp)) };
        }
    } else if (['GG', 'GGG(ferr.)', 'NT', 'NT(nitr.)', 'NV(nitr.)'].includes(mat)) {
        // Table 5 line 3
        if (NL <= 1e5) return { success: true, value: 1.3 };
        if (NL <= 2e6) {
            // Formula (12) & (13)
            const exp = (Math.log10(1.3 / 1.0)) / (Math.log10(2e6 / 1e5));
            return { success: true, value: 1.0 * Math.pow(2e6 / NL, exp) };
        }
        const exp = (Math.log10(1.0 / 0.85)) / (Math.log10(1e10 / 2e6));
        return { success: true, value: Math.max(0.85, 1.0 * Math.pow(2e6 / NL, exp)) };
    } else {
        // NV (nitrocarburized) Table 5 line 4
        if (NL <= 1e5) return { success: true, value: 1.1 };
        if (NL <= 2e6) {
            const exp = (Math.log10(1.1 / 1.0)) / (Math.log10(2e6 / 1e5));
            return { success: true, value: 1.0 * Math.pow(2e6 / NL, exp) };
        }
        const exp = (Math.log10(1.0 / 0.85)) / (Math.log10(1e10 / 2e6));
        return { success: true, value: Math.max(0.85, 1.0 * Math.pow(2e6 / NL, exp)) };
    }
}

/**
 * Calculates Work Hardening Factor (ZW).
 * Reference: ISO 6336-2:2019 Clause 13.3 (Formulae 58 - 71)
 * 
 * @param {Object} params
 * @param {number} [params.HB1=300] - Brinell hardness pinion
 * @param {number} [params.HB2=200] - Brinell hardness wheel
 * @param {number} [params.u=2.0] - Gear ratio u = z2 / z1 (>= 1.0)
 * @param {string} [params.pairing='ThroughHardenedSteel'] - 'ThroughHardenedSteel', 'SurfaceHardenedPinionThroughHardenedGear', 'SurfaceHardenedPinionDuctileIronGear'
 * @param {number} [params.Rz1=4.0] - Roughness pinion (um)
 * @param {number} [params.Rz2=4.0] - Roughness wheel (um)
 * @param {number} [params.pred=10.0] - Pitch point radius of relative curvature (mm)
 * @param {number} [params.v40=220] - Viscosity at 40°C (mm^2/s)
 * @param {number} [params.vw=5.0] - Velocity at pitch line (m/s)
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateWorkHardeningFactor_ZW(params = {}) {
    const pairing = params.pairing || 'ThroughHardenedSteel';
    const HB1 = Number(params.HB1) || 300.0;
    const HB2 = Number(params.HB2) || 200.0;
    const u = Math.min(20.0, Math.max(1.0, Number(params.u) || 1.0));

    if (pairing === 'SurfaceHardenedPinionThroughHardenedGear') {
        // Clause 13.3.1
        const Rz1 = Number(params.Rz1) || 3.0;
        const Rz2 = Number(params.Rz2) || 3.0;
        const pred = Math.max(0.1, Number(params.pred) || 10.0);
        const v40 = Math.max(10.0, Number(params.v40) || 220.0);
        const vw = Math.max(0.1, Number(params.vw) || 5.0);

        // Formula (58): Equivalent roughness RzH
        const num = Rz1 * Math.pow(10.0 / pred, 0.33) * Math.pow(Rz1 / Rz2, 0.66);
        const denom = Math.pow((v40 * vw) / 1500.0, 0.33);
        let RzH = num / denom;
        if (RzH > 16.0) RzH = 16.0;
        if (RzH < 3.0) RzH = 3.0;

        // Formula (59) - (61)
        let ZW;
        if (HB2 < 130.0) {
            ZW = 1.2 * Math.pow(3.0 / RzH, 0.15);
        } else if (HB2 <= 470.0) {
            ZW = (1.2 - ((HB2 - 130.0) / 1700.0)) * Math.pow(3.0 / RzH, 0.15);
        } else {
            ZW = Math.pow(3.0 / RzH, 0.15);
        }
        return { success: true, value: Math.max(1.0, ZW) };
    } else if (pairing === 'SurfaceHardenedPinionDuctileIronGear') {
        // Clause 13.3.3 Formula (69) - (71)
        let ZW;
        if (HB2 < 162.0) {
            ZW = 1.2;
        } else if (HB2 <= 344.0) {
            ZW = 1.2 - ((1.87 * HB2 - 303.6) / 1700.0);
        } else {
            ZW = 1.0;
        }
        return { success: true, value: Math.max(1.0, ZW) };
    } else {
        // Through hardened steel pinion and gear (Clause 13.3.2)
        const ratio = HB1 / HB2;
        if (ratio < 1.2) {
            return { success: true, value: 1.0 };
        } else if (ratio <= 1.7) {
            // Formula (65) & (66)
            const A = 0.00898 * ratio - 0.00829;
            const ZW = 1.0 + A * (u - 1.0);
            return { success: true, value: ZW };
        } else {
            // Formula (68)
            const ZW = 1.0 + 0.00698 * (u - 1.0);
            return { success: true, value: ZW };
        }
    }
}

/**
 * Calculates Nominal Contact Stress (sigma_H0).
 * Reference: ISO 6336-2:2019 Clause 5.3, Formula (3)
 * 
 * Formula:
 *   sigma_H0 = ZH * ZE * Zeps * Zbeta * sqrt( (Ft / (d1 * b)) * ((u + 1) / u) )
 * 
 * @param {Object} params
 * @param {number} params.ZH - Zone factor
 * @param {number} params.ZE - Elasticity factor (N/mm^2)^0.5
 * @param {number} params.Zeps - Contact ratio factor
 * @param {number} params.Zbeta - Helix angle factor
 * @param {number} params.Ft - Transverse tangential load at reference cylinder (N)
 * @param {number} params.d1 - Reference diameter pinion (mm)
 * @param {number} params.b - Facewidth (mm)
 * @param {number} params.u - Gear ratio u = z2 / z1 (positive)
 * @param {boolean} [params.isInternal=false] - True for internal gear pair
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateNominalContactStress_sigmaH0(params = {}) {
    const ZH = Number(params.ZH);
    const ZE = Number(params.ZE);
    const Zeps = Number(params.Zeps);
    const Zbeta = Number(params.Zbeta);
    const Ft = Number(params.Ft);
    const d1 = Number(params.d1);
    const b = Number(params.b);
    const u = Number(params.u);
    const isInternal = Boolean(params.isInternal);

    if (isNaN(ZH) || isNaN(ZE) || isNaN(Zeps) || isNaN(Zbeta) || isNaN(Ft) || isNaN(d1) || isNaN(b) || isNaN(u)) {
        return { success: false, error: 'Invalid parameters for nominal contact stress.' };
    }
    if (d1 <= 0 || b <= 0 || Ft <= 0 || u <= 0) {
        return { success: false, error: 'Geometric and load parameters must be positive.' };
    }

    // ISO 6336-2:2019 Formula (3):
    // For external gear pairs: (u + 1) / u
    // For internal gear pairs: (u - 1) / u
    const uRatio = isInternal ? ((u - 1.0) / u) : ((u + 1.0) / u);
    const underRadical = (Ft / (d1 * b)) * uRatio;
    if (underRadical < 0) {
        return { success: false, error: 'Negative value under radical for contact stress.' };
    }

    const sigmaH0 = ZH * ZE * Zeps * Zbeta * Math.sqrt(underRadical);
    return { success: true, value: sigmaH0 };
}

/**
 * Calculates Comprehensive Surface Durability (Pitting) Rating.
 * Reference: ISO 6336-2:2019
 * 
 * Computes:
 * - Determinant contact stresses: sigma_H1 (pinion) & sigma_H2 (wheel) (Formulae 4 & 5)
 * - Permissible contact stresses: sigma_HP1 & sigma_HP2 (Formula 6)
 * - Pitting safety factors: SH1 & SH2 (Formulae 1 & 2)
 * 
 * @param {Object} gearData - Gear geometry & operating data
 * @returns {Object} result - { success: boolean, sigma_H0, sigma_H1, sigma_H2, sigma_HP1, sigma_HP2, SH1, SH2, factors, error?: string }
 */
function calculateSurfaceDurability(gearData = {}) {
    // 1. Geometry & kinematic extractions
    const z1 = Number(gearData.z1) || 25;
    const z2 = Number(gearData.z2) || 50;
    const mn = Number(gearData.mn) || 2.0;
    const b = Number(gearData.b) || 30.0;
    const beta = Number(gearData.beta) || 0;
    const alpha_n = (gearData.alpha_n !== undefined && !isNaN(gearData.alpha_n)) ? Number(gearData.alpha_n) : 20.0;
    const alpha_t = (gearData.alpha_t !== undefined && !isNaN(gearData.alpha_t)) ? Number(gearData.alpha_t) : 20.0;
    const alpha_wt = (gearData.alpha_wt !== undefined && !isNaN(gearData.alpha_wt)) ? Number(gearData.alpha_wt) : alpha_t;
    const beta_b = (gearData.beta_b !== undefined && !isNaN(gearData.beta_b)) ? Number(gearData.beta_b) : 0;
    const d1 = Number(gearData.d1) || (z1 * mn / Math.cos(beta * Math.PI / 180));
    const d2 = Number(gearData.d2) || (z2 * mn / Math.cos(beta * Math.PI / 180));
    const db1 = Number(gearData.db1) || (d1 * Math.cos(alpha_t * Math.PI / 180));
    const db2 = Number(gearData.db2) || (d2 * Math.cos(alpha_t * Math.PI / 180));
    const da1 = Number(gearData.da1) || (d1 + 2 * mn);
    const da2 = Number(gearData.da2) || (d2 + 2 * mn);
    const eps_alpha = (gearData.eps_alpha !== undefined && !isNaN(gearData.eps_alpha)) ? Number(gearData.eps_alpha) : 1.5;
    const eps_beta = (gearData.eps_beta !== undefined && !isNaN(gearData.eps_beta)) ? Number(gearData.eps_beta) : 0;
    const u = Math.abs(z2 / z1);

    // Operating load & speed
    const Ft = Number(gearData.Ft) || 1000.0;
    const v = Number(gearData.v) || 5.0;
    const NL1 = Number(gearData.NL1) || 1e7;
    const NL2 = Number(gearData.NL2) || (NL1 / u);

    // Material properties
    const mat1 = gearData.material1 || gearData.material || 'Eh';
    const mat2 = gearData.material2 || gearData.material || 'Eh';
    const sigmaHlim1 = Number(gearData.sigmaHlim1) || Number(gearData.sigmaHlim) || 1500.0;
    const sigmaHlim2 = Number(gearData.sigmaHlim2) || Number(gearData.sigmaHlim) || 1500.0;
    const E1 = Number(gearData.E1) || 206000.0;
    const E2 = Number(gearData.E2) || 206000.0;
    const nu1 = Number(gearData.nu1) || 0.3;
    const nu2 = Number(gearData.nu2) || 0.3;
    const Rz1 = Number(gearData.Rz1) || 4.0;
    const Rz2 = Number(gearData.Rz2) || 4.0;
    const v40 = Number(gearData.v40) || 220.0;
    const SHmin = Number(gearData.SHmin) || 1.0;

    // ISO 6336-1 General Influence Factors
    const KA = Number(gearData.KA) || 1.0;
    const Kgamma = Number(gearData.Kgamma) || 1.0;
    const Kv = Number(gearData.Kv) || 1.0;
    const KHbeta = Number(gearData.KHbeta) || 1.0;
    const KHalpha = Number(gearData.KHalpha) || 1.0;

    // 2. Zone factor ZH
    const resZH = calculateZoneFactor_ZH(alpha_t, alpha_wt, beta_b);
    if (!resZH.success) return resZH;
    const ZH = resZH.value;

    // 3. Elasticity factor ZE
    const resZE = calculateElasticityFactor_ZE(E1, E2, nu1, nu2);
    if (!resZE.success) return resZE;
    const ZE = resZE.value;

    // 4. Contact ratio factor Zeps
    const resZeps = calculateContactRatioFactor_Zeps(eps_alpha, eps_beta);
    if (!resZeps.success) return resZeps;
    const Zeps = resZeps.value;

    // 5. Helix angle factor Zbeta
    const resZbeta = calculateHelixAngleFactor_Zbeta(beta);
    if (!resZbeta.success) return resZbeta;
    const Zbeta = resZbeta.value;

    // 6. Nominal contact stress sigma_H0
    const resH0 = calculateNominalContactStress_sigmaH0({ ZH, ZE, Zeps, Zbeta, Ft, d1, b, u, isInternal: Boolean(gearData.isInternal) });
    if (!resH0.success) return resH0;
    const sigma_H0 = resH0.value;

    // 7. Contact factors ZB and ZD
    const resZBD = calculateContactFactors_ZB_ZD({
        d1, d2, db1, db2,
        dNa1: da1, dNa2: da2,
        z1, z2, alpha_wt, eps_alpha, eps_beta,
        fz_ca: Number(gearData.fz_ca) || 1.0,
        isInternal: Boolean(gearData.isInternal)
    });
    if (!resZBD.success) return resZBD;
    const { ZB, ZD } = resZBD;

    // 8. Determinant contact stress sigma_H1 (pinion) and sigma_H2 (wheel)
    // Formulae (4) & (5): sigma_H = ZB/ZD * sigma_H0 * sqrt(KA * Kgamma * Kv * KHbeta * KHalpha)
    const loadFactorProduct = KA * Kgamma * Kv * KHbeta * KHalpha;
    const sqrtLoadFactor = Math.sqrt(Math.max(1.0, loadFactorProduct));

    const sigma_H1 = ZB * sigma_H0 * sqrtLoadFactor;
    const sigma_H2 = ZD * sigma_H0 * sqrtLoadFactor;

    // 9. Lubrication & surface influence factors ZL, ZV, ZR
    const awtRad = alpha_wt * (Math.PI / 180);
    const pred1 = 0.5 * db1 * Math.tan(awtRad);
    const pred2 = 0.5 * db2 * Math.tan(awtRad);
    const pred = (pred1 * pred2) / (pred1 + pred2);

    const resLube1 = calculateLubricationFactors_ZL_ZV_ZR({
        sigmaHlim: sigmaHlim1, v40, vw: v, Rz1, Rz2, pred
    });
    const resLube2 = calculateLubricationFactors_ZL_ZV_ZR({
        sigmaHlim: sigmaHlim2, v40, vw: v, Rz1, Rz2, pred
    });

    // 10. Work hardening factor ZW
    const resZW1 = calculateWorkHardeningFactor_ZW({ HB1: gearData.HB1, HB2: gearData.HB2, u });
    const resZW2 = calculateWorkHardeningFactor_ZW({ HB1: gearData.HB1, HB2: gearData.HB2, u });
    const ZW1 = resZW1.success ? resZW1.value : 1.0;
    const ZW2 = resZW2.success ? resZW2.value : 1.0;

    // 11. Size factor ZX = 1.0 per Clause 14
    const ZX = 1.0;

    // 12. Life factors ZNT1 and ZNT2
    const resZNT1 = calculateLifeFactor_ZNT(NL1, mat1, Boolean(gearData.limitedPittingPermitted));
    const resZNT2 = calculateLifeFactor_ZNT(NL2, mat2, Boolean(gearData.limitedPittingPermitted));
    const ZNT1 = resZNT1.success ? resZNT1.value : 1.0;
    const ZNT2 = resZNT2.success ? resZNT2.value : 1.0;

    // 13. Permissible contact stress sigma_HP (Formula 6)
    // sigma_HP = (sigma_Hlim * ZNT / SHmin) * ZL * ZV * ZR * ZW * ZX
    const sigma_HP1 = (sigmaHlim1 * ZNT1 / SHmin) * resLube1.ZL * resLube1.ZV * resLube1.ZR * ZW1 * ZX;
    const sigma_HP2 = (sigmaHlim2 * ZNT2 / SHmin) * resLube2.ZL * resLube2.ZV * resLube2.ZR * ZW2 * ZX;

    // 14. Pitting safety factors (Formulae 1 & 2)
    // SH = sigma_HG / sigma_H = (sigma_HP * SHmin) / sigma_H
    const sigma_HG1 = sigma_HP1 * SHmin;
    const sigma_HG2 = sigma_HP2 * SHmin;

    const SH1 = sigma_H1 > 0 ? (sigma_HG1 / sigma_H1) : 999.0;
    const SH2 = sigma_H2 > 0 ? (sigma_HG2 / sigma_H2) : 999.0;

    return {
        success: true,
        sigma_H0: sigma_H0,
        sigma_H1: sigma_H1,
        sigma_H2: sigma_H2,
        sigma_HP1: sigma_HP1,
        sigma_HP2: sigma_HP2,
        SH1: SH1,
        SH2: SH2,
        factors: {
            ZH: ZH,
            ZE: ZE,
            Zeps: Zeps,
            Zbeta: Zbeta,
            ZB: ZB,
            ZD: ZD,
            ZL1: resLube1.ZL,
            ZV1: resLube1.ZV,
            ZR1: resLube1.ZR,
            ZL2: resLube2.ZL,
            ZV2: resLube2.ZV,
            ZR2: resLube2.ZR,
            ZW1: ZW1,
            ZW2: ZW2,
            ZX: ZX,
            ZNT1: ZNT1,
            ZNT2: ZNT2
        }
    };
}

