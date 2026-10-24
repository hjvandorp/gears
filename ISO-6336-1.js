/**
 * ISO 6336-1:2019 Calculations
 * Rating tab calculations (Basic principles, introduction and general influence factors)
 */

/**
 * Calculates transmitted power from torque and rotational speed.
 * Reference: ISO 6336-1:2019 Formula (2) & (3)
 * @param {number} torque - Nominal torque (Nm)
 * @param {number} speed - Rotational speed (rpm)
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculatePower(torque, speed) {
    if (isNaN(torque) || isNaN(speed) || torque < 0 || speed < 0) {
        return { success: false, error: 'Invalid limits.' };
    }
    const power = (torque * speed * 2 * Math.PI) / 60000;
    return { success: true, value: power };
}

/**
 * Calculates the Application Factor (Method B)
 * Reference: ISO 6336-1:2019 Clause 5.3, Table 4
 * 
 * @param {string|number} [workingCharacteristicDriver='Uniform'] - Driver characteristic ('Uniform', 'Light shocks', 'Moderate shocks', 'Heavy shocks') or explicit numerical KA
 * @param {string} [workingCharacteristicDriven='Uniform'] - Driven machine characteristic ('Uniform', 'Light shocks', 'Moderate shocks', 'Heavy shocks')
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateApplicationFactor_B(workingCharacteristicDriver = 'Uniform', workingCharacteristicDriven = 'Uniform') {
    if (typeof workingCharacteristicDriver === 'number') {
        if (isNaN(workingCharacteristicDriver) || workingCharacteristicDriver < 1.0) {
            return { success: false, error: 'Application factor KA must be >= 1.0' };
        }
        return { success: true, value: workingCharacteristicDriver };
    }

    const table4 = {
        'Uniform': { 'Uniform': 1.00, 'Light shocks': 1.25, 'Moderate shocks': 1.50, 'Heavy shocks': 1.75 },
        'Light shocks': { 'Uniform': 1.10, 'Light shocks': 1.35, 'Moderate shocks': 1.60, 'Heavy shocks': 1.85 },
        'Moderate shocks': { 'Uniform': 1.25, 'Light shocks': 1.50, 'Moderate shocks': 1.75, 'Heavy shocks': 2.00 },
        'Heavy shocks': { 'Uniform': 1.50, 'Light shocks': 1.75, 'Moderate shocks': 2.00, 'Heavy shocks': 2.25 }
    };

    const driver = workingCharacteristicDriver || 'Uniform';
    const driven = workingCharacteristicDriven || 'Uniform';

    if (table4[driver] && table4[driver][driven] !== undefined) {
        return { success: true, value: table4[driver][driven] };
    }

    return { success: true, value: 1.0 };
}

/**
 * Calculates the Tooth Stiffness Parameters (Method B)
 * Reference: ISO 6336-1:2019 Clause 9.2, 9.3 (Formulae 81 - 94)
 * 
 * Analytical determination of:
 * - c'_th: Theoretical single stiffness from series expansion (Formula 83, 84, Table 13)
 * - c': Single tooth stiffness (Formula 82, 85, 86, 88, 90, 92)
 * - c_gamma_alpha: Mean mesh stiffness for dynamic factor Kv & transverse load factor (Formula 93)
 * - c_gamma_beta: Mean mesh stiffness for face load factor (Formula 94)
 * 
 * @param {Object} [params={}]
 * @param {number} [params.z1=25] - Number of teeth pinion
 * @param {number} [params.z2=50] - Number of teeth wheel (positive for external)
 * @param {number} [params.beta=0] - Reference helix angle (degrees)
 * @param {number} [params.x1=0] - Profile shift coefficient pinion
 * @param {number} [params.x2=0] - Profile shift coefficient wheel
 * @param {number} [params.eps_alpha=1.5] - Transverse contact ratio
 * @param {number} [params.b=1] - Facewidth (mm)
 * @param {number} [params.Ft=100] - Transverse tangential load (N)
 * @param {number} [params.KA=1.0] - Application factor
 * @param {number} [params.Kgamma=1.0] - Mesh load factor
 * @param {number} [params.CR=1.0] - Gear blank factor (Formula 86/87)
 * @param {number} [params.hfp_mn=1.2] - Dedendum ratio of basic rack (hfp/mn)
 * @param {number} [params.alpha_Pn=20] - Normal pressure angle of basic rack (degrees)
 * @param {number} [params.E1=206000] - Modulus of elasticity pinion (N/mm^2)
 * @param {number} [params.E2=206000] - Modulus of elasticity wheel (N/mm^2)
 * @returns {Object} result - { success: boolean, c_prime: number, c_gamma_alpha: number, c_gamma_beta: number, c_gamma: number, error?: string }
 */
function calculateToothStiffness_B(params = {}) {
    const z1 = Number(params.z1) || 25;
    const z2 = Number(params.z2) || 50;
    const beta = Number(params.beta) || 0;
    const x1 = Number(params.x1) || 0;
    const x2 = Number(params.x2) || 0;
    const eps_alpha = (params.eps_alpha !== undefined && !isNaN(params.eps_alpha)) ? Number(params.eps_alpha) : 1.5;
    const b = Number(params.b) || 1.0;
    const Ft = Number(params.Ft) || 100.0;
    const KA = Number(params.KA) || 1.0;
    const Kgamma = Number(params.Kgamma) || 1.0;
    const CR = (params.CR !== undefined && !isNaN(params.CR)) ? Number(params.CR) : 1.0;
    const hfp_mn = (params.hfp_mn !== undefined && !isNaN(params.hfp_mn)) ? Number(params.hfp_mn) : 1.2;
    const alpha_Pn = (params.alpha_Pn !== undefined && !isNaN(params.alpha_Pn)) ? Number(params.alpha_Pn) : 20.0;
    const E1 = Number(params.E1) || 206000;
    const E2 = Number(params.E2) || 206000;

    if (z1 <= 0 || b <= 0) {
        return { success: false, error: 'Invalid tooth geometry or facewidth.' };
    }

    const betaRad = beta * (Math.PI / 180);
    const cosBeta = Math.cos(betaRad);
    if (cosBeta <= 0) {
        return { success: false, error: 'Helix angle beta too large.' };
    }

    // Formula (81): Virtual numbers of teeth in normal section
    const zn1 = Math.abs(z1) / Math.pow(cosBeta, 3);
    const zn2 = Math.abs(z2) / Math.pow(cosBeta, 3);

    // Formula (84) and Table 13: Flexibility coefficients
    // q' = C1 + C2/zn1 + C3/zn2 + C4*x1 + C5*x1/zn1 + C6*x2 + C7*x2/zn2 + C8*x1^2 + C9*x2^2
    const C1 = 0.04723;
    const C2 = 0.15551;
    const C3 = 0.25791;
    const C4 = -0.00635;
    const C5 = -0.11654;
    const C6 = -0.00193;
    const C7 = -0.24188;
    const C8 = 0.00529;
    const C9 = 0.00182;

    const q_prime = C1 + (C2 / zn1) + (C3 / zn2)
        + (C4 * x1) + (C5 * x1 / zn1)
        + (C6 * x2) + (C7 * x2 / zn2)
        + (C8 * x1 * x1) + (C9 * x2 * x2);

    if (q_prime <= 0) {
        return { success: false, error: 'Calculated tooth flexibility q\' is non-positive.' };
    }

    // Formula (83): Theoretical single stiffness c'_th
    const c_prime_th = 1.0 / q_prime; // N / (mm * um)

    // Formula (85): Correction factor CM = 0.8
    const CM = 0.8;

    // Formula (88): Basic rack factor CB
    const CB = (1.0 + 0.5 * (1.2 - hfp_mn)) * (1.0 - 0.02 * (20.0 - alpha_Pn));

    // Base single tooth stiffness for steel (Formula 82)
    let c_prime = c_prime_th * CM * CR * CB * cosBeta;

    // Formula (90), (91): Material elasticity factor if other than standard steel
    const E_st = 206000;
    const E_reduced = (2 * E1 * E2) / (E1 + E2);
    if (Math.abs(E_reduced - E_st) > 1.0) {
        c_prime *= (E_reduced / E_st);
    }

    // Formula (92): Specific load influence if (Ft * KA * Kgamma) / b < 100 N/mm
    const specificLoad = (Ft * KA * Kgamma) / b;
    if (specificLoad > 0 && specificLoad < 100) {
        c_prime *= Math.pow(specificLoad / 100.0, 0.25);
    }

    // Formula (93): Mean mesh stiffness c_gamma_alpha (for Kv, KHalpha, KFalpha)
    const c_gamma_alpha = c_prime * (0.75 * eps_alpha + 0.25);

    // Formula (94): Mean mesh stiffness c_gamma_beta (for KHbeta, KFbeta)
    const c_gamma_beta = 0.85 * c_gamma_alpha;

    return {
        success: true,
        c_prime: c_prime,
        c_gamma: c_gamma_alpha,
        c_gamma_alpha: c_gamma_alpha,
        c_gamma_beta: c_gamma_beta
    };
}

/**
 * Calculates the Dynamic Factor (Method C)
 * Reference: ISO 6336-1:2019 Clause 6.4.3, 6.6.1, 6.6.3 (Formulae 36 - 38, Table 11)
 * 
 * Purely analytical determination for subcritical running speed range without graphical interpolation.
 * 
 * @param {Object} [params={}]
 * @param {number} [params.v=5.0] - Pitch line velocity at reference cylinder (m/s)
 * @param {number} [params.z1=25] - Number of teeth pinion
 * @param {number} [params.u=2.0] - Gear ratio u = z2 / z1 (>= 1.0)
 * @param {number} [params.toleranceClass=6] - Flank tolerance class (ISO 1328-1, between 3 and 11)
 * @param {number} [params.Ft=1000] - Nominal transverse tangential load (N)
 * @param {number} [params.b=30] - Facewidth (mm)
 * @param {number} [params.KA=1.0] - Application factor
 * @param {number} [params.Kgamma=1.0] - Mesh load factor
 * @param {number} [params.beta=0] - Reference helix angle (degrees)
 * @param {number} [params.eps_beta=0] - Overlap ratio
 * @returns {Object} result - { success: boolean, value: number, error?: string }
 */
function calculateDynamicFactor_C(params = {}) {
    const v = (params.v !== undefined && !isNaN(params.v)) ? Number(params.v) : 5.0;
    const z1 = Number(params.z1) || 25;
    const u = Math.max(1.0, Number(params.u) || 1.0);
    const toleranceClass = Math.round(Math.min(11, Math.max(3, Number(params.toleranceClass) || 6)));
    const Ft = Number(params.Ft) || 1000.0;
    const b = Number(params.b) || 30.0;
    const KA = Number(params.KA) || 1.0;
    const Kgamma = Number(params.Kgamma) || 1.0;
    const beta = Number(params.beta) || 0;
    const eps_beta = (params.eps_beta !== undefined && !isNaN(params.eps_beta)) ? Number(params.eps_beta) : 0;

    if (v < 0 || z1 <= 0 || b <= 0 || Ft <= 0) {
        return { success: false, error: 'Invalid input parameters for dynamic factor calculation.' };
    }

    // Specific load (Ft * KA * Kgamma) / b, lower limit 100 N/mm per Clause 6.6.3
    let specificLoad = (Ft * KA * Kgamma) / b;
    if (specificLoad < 100.0) {
        specificLoad = 100.0;
    }

    // Parameter: (v * z1 / 100) * sqrt(u^2 / (1 + u^2))
    const uTerm = Math.sqrt((u * u) / (1.0 + u * u));
    const speedRatioParam = (v * z1 / 100.0) * uTerm;

    // Formulae (37) & (38): Factor K3
    let K3;
    if (speedRatioParam <= 0.2) {
        K3 = 2.0;
    } else {
        K3 = -0.357 * speedRatioParam + 2.071;
    }

    // Table 11: Values of factors K1 and K2
    const K1_spur = { 3: 2.1, 4: 3.9, 5: 7.5, 6: 14.9, 7: 26.8, 8: 39.1, 9: 52.8, 10: 76.6, 11: 102.6 };
    const K1_helical = { 3: 1.9, 4: 3.5, 5: 6.7, 6: 13.3, 7: 23.9, 8: 34.8, 9: 47.0, 10: 68.2, 11: 91.4 };
    const K2_spur = 0.0193;
    const K2_helical = 0.0087;

    const k1_spur_val = K1_spur[toleranceClass];
    const k1_hel_val = K1_helical[toleranceClass];

    // Formula (36): For spur gears
    const Kv_alpha = 1.0 + ((k1_spur_val / specificLoad) + K2_spur) * (v * z1 / 100.0) * K3 * uTerm;

    // Formula (36): For helical gears with eps_beta >= 1
    const Kv_beta = 1.0 + ((k1_hel_val / specificLoad) + K2_helical) * (v * z1 / 100.0) * K3 * uTerm;

    let Kv;
    if (beta === 0 || eps_beta <= 0) {
        Kv = Kv_alpha;
    } else if (eps_beta >= 1.0) {
        Kv = Kv_beta;
    } else {
        // Formula (35): Linear interpolation for helical gears with eps_beta < 1
        Kv = Kv_alpha - eps_beta * (Kv_alpha - Kv_beta);
    }

    // Bounds check per Clause 6.2.6 & 6.3: Kv >= 1.0 and Kv <= 2.0 outside resonance
    if (Kv < 1.0) {
        Kv = 1.0;
    } else if (Kv > 2.0) {
        Kv = 2.0;
    }

    return {
        success: true,
        value: Kv
    };
}

/**
 * Calculates the Face Load Factors (Method C)
 * Reference: ISO 6336-1:2019 Clause 7.3.4, 7.5, 7.6 (Formulae 41 - 72)
 * 
 * Purely analytical determination of:
 * - KHbeta: Face load factor for contact stress (Formula 41/43)
 * - KFbeta: Face load factor for tooth root stress (Formula 71, 72)
 * 
 * @param {Object} [params={}]
 * @param {number} [params.Ft=1000] - Tangential load per mesh (N)
 * @param {number} [params.b=30] - Facewidth (mm)
 * @param {number} [params.d1=50] - Reference diameter pinion (mm)
 * @param {number} [params.dsh=45] - Shaft diameter pinion (mm)
 * @param {number} [params.l=100] - Bearing span (mm)
 * @param {number} [params.s=20] - Distance from pinion mid-plane to bearing span centre (mm)
 * @param {number} [params.h=6.75] - Tooth depth (root to tip, mm)
 * @param {number} [params.c_gamma_beta=17.0] - Mesh stiffness per unit face width (N/(mm*um))
 * @param {number} [params.KA=1.0] - Application factor
 * @param {number} [params.Kgamma=1.0] - Mesh load factor
 * @param {number} [params.Kv=1.1] - Dynamic factor
 * @param {number} [params.toleranceClass=6] - Flank tolerance class (ISO 1328-1)
 * @param {string} [params.helixModification='None'] - Modification ('None', 'Central crowning', 'Helix correction', 'End relief')
 * @param {string} [params.material='Eh'] - Material abbreviation (Table 3, e.g. 'Eh', 'V', 'St', 'GG')
 * @param {number} [params.sigmaHlim=1500] - Allowable contact stress (N/mm^2)
 * @param {number} [params.v=5.0] - Pitch line velocity (m/s)
 * @param {number} [params.K_prime=0.48] - Pinion offset constant (Figure 13)
 * @returns {Object} result - { success: boolean, K_Hbeta: number, K_Fbeta: number, Fbeta_y: number, error?: string }
 */
function calculateFaceLoadFactors_C(params = {}) {
    const Ft = Number(params.Ft) || 1000.0;
    const b = Number(params.b) || 30.0;
    const d1 = Number(params.d1) || 50.0;
    const dsh = Number(params.dsh) || (0.85 * d1);
    const l = Number(params.l) || (2.0 * b + 40.0);
    const s = (params.s !== undefined && !isNaN(params.s)) ? Number(params.s) : 0.1 * l;
    const h = Number(params.h) || 6.75;
    const c_gamma_beta = Number(params.c_gamma_beta) || 17.0;
    const KA = Number(params.KA) || 1.0;
    const Kgamma = Number(params.Kgamma) || 1.0;
    const Kv = Number(params.Kv) || 1.0;
    const toleranceClass = Math.round(Math.min(11, Math.max(3, Number(params.toleranceClass) || 6)));
    const helixMod = params.helixModification || 'None';
    const material = params.material || 'Eh';
    const sigmaHlim = Number(params.sigmaHlim) || 1500.0;
    const v = Number(params.v) || 5.0;

    if (b <= 0 || d1 <= 0 || dsh <= 0 || l <= 0 || h <= 0) {
        return { success: false, error: 'Invalid gear or shaft dimensions.' };
    }

    // Clause 7.2.2: Mean transverse specific loading Fm / b
    const Fm_b = (Ft * KA * Kgamma * Kv) / b;
    if (Fm_b <= 0) {
        return { success: false, error: 'Transverse load must be positive.' };
    }

    // Formula (59): Equivalent misalignment fsh due to pinion shaft bending & torsion
    const B_star = 1.0;
    const Kunit = 0.023; // mm * um / N
    const K_prime = (params.K_prime !== undefined && !isNaN(params.K_prime)) ? Number(params.K_prime) : 0.48;

    const termInsideAbs = B_star + K_prime * ((l * s) / (d1 * d1)) * Math.pow(d1 / dsh, 4) - 0.3;
    const fsh = Fm_b * Kunit * (Math.abs(termInsideAbs) + 0.3) * Math.pow(b / d1, 2);

    // Formula (66): Mesh misalignment fma from ISO 1328-1 tolerance class
    // calculateHelixSlopeTolerance: fHbetaT = (0.05 * sqrt(d) + 0.35 * sqrt(b) + 4) * (sqrt(2))^(A - 5)
    const baseTol = 0.05 * Math.sqrt(d1) + 0.35 * Math.sqrt(b) + 4.0;
    const fHbeta = baseTol * Math.pow(Math.SQRT2, toleranceClass - 5);
    const fma = Math.sqrt(2.0) * fHbeta; // Formula (66) assuming equal pinion and wheel tolerances

    // Table 12: Constants B1 and B2
    let B1 = 1.0;
    let B2 = 1.0;
    if (helixMod === 'Central crowning') {
        B1 = 0.5;
        B2 = 0.5;
    } else if (helixMod === 'Helix correction') {
        B1 = 0.1;
        B2 = 1.0;
    } else if (helixMod === 'Helix correction plus central crowning') {
        B1 = 0.1;
        B2 = 0.5;
    } else if (helixMod === 'End relief') {
        B1 = 0.7;
        B2 = 0.7;
    }

    // Formula (54) & (58): Initial equivalent misalignment Fbeta_x
    const Fbeta_x_min = Math.max(0.005 * Fm_b, 0.5 * fHbeta);
    let Fbeta_x = 1.33 * B1 * fsh + B2 * fma;
    if (Fbeta_x < Fbeta_x_min) {
        Fbeta_x = Fbeta_x_min;
    }

    // Formulae (46) - (51): Running-in allowance ybeta and factor chi_beta
    let ybeta = 0;
    if (['St', 'St (cast)', 'V', 'V (cast)', 'GGG (perl., bai.)', 'GTS (perl.)'].includes(material)) {
        ybeta = (320.0 / sigmaHlim) * Fbeta_x;
        if (v > 10.0) {
            ybeta = Math.min(ybeta, 12800.0 / sigmaHlim);
        } else if (v > 5.0) {
            ybeta = Math.min(ybeta, 25600.0 / sigmaHlim);
        }
    } else if (['GG', 'GGG (ferr.)'].includes(material)) {
        ybeta = 0.55 * Fbeta_x;
        if (v > 10.0) {
            ybeta = Math.min(ybeta, 22.0);
        } else if (v > 5.0) {
            ybeta = Math.min(ybeta, 45.0);
        }
    } else {
        // Case carburized / surface hardened steels: Eh, IF, NT, NV
        ybeta = 0.15 * Fbeta_x;
        ybeta = Math.min(ybeta, 6.0);
    }
    ybeta = Math.min(ybeta, Fbeta_x);

    // Formula (45): Effective equivalent misalignment Fbeta_y
    const Fbeta_y = Math.max(0, Fbeta_x - ybeta);

    // Formulae (41) & (43): Face load factor KHbeta
    let KHbeta;
    const limit = (2.0 * Fm_b) / c_gamma_beta;
    if (Fbeta_y <= limit) {
        // Formula (43): b_cal / b > 1
        KHbeta = 1.0 + (Fbeta_y * c_gamma_beta) / (2.0 * Fm_b);
    } else {
        // Formula (41): b_cal / b <= 1
        KHbeta = Math.sqrt((2.0 * Fbeta_y * c_gamma_beta) / Fm_b);
    }

    if (KHbeta < 1.0) {
        KHbeta = 1.0;
    }

    // Formulae (71) & (72): Face load factor for tooth root stress KFbeta
    const bh_ratio = Math.max(3.0, b / h);
    const bh_sq = bh_ratio * bh_ratio;
    const NF = bh_sq / (1.0 + bh_ratio + bh_sq);
    const KFbeta = Math.pow(KHbeta, NF);

    return {
        success: true,
        K_Hbeta: KHbeta,
        K_Fbeta: KFbeta,
        Fbeta_y: Fbeta_y
    };
}

/**
 * Calculates the Transverse Load Factors (Method B)
 * Reference: ISO 6336-1:2019 Clause 8.2.3, 8.3 (Formulae 73 - 80)
 * 
 * Purely analytical determination of:
 * - KHalpha: Transverse load factor for contact stress (Formula 73, 74, 75)
 * - KFalpha: Transverse load factor for tooth root stress (Formula 73, 74, 76)
 * 
 * @param {Object} [params={}]
 * @param {number} [params.d1=50] - Reference diameter pinion (mm)
 * @param {number} [params.mn=2] - Normal module (mm)
 * @param {number} [params.alpha_t=20] - Transverse pressure angle (degrees)
 * @param {number} [params.eps_alpha=1.5] - Transverse contact ratio
 * @param {number} [params.eps_beta=0] - Overlap ratio
 * @param {number} [params.b=30] - Facewidth (mm)
 * @param {number} [params.Ft=1000] - Tangential load (N)
 * @param {number} [params.c_gamma_alpha=20.0] - Mesh stiffness (N/(mm*um))
 * @param {number} [params.KA=1.0] - Application factor
 * @param {number} [params.Kgamma=1.0] - Mesh load factor
 * @param {number} [params.Kv=1.1] - Dynamic factor
 * @param {number} [params.KHbeta=1.15] - Face load factor for contact stress
 * @param {number} [params.toleranceClass=6] - Flank tolerance class (ISO 1328-1)
 * @param {string} [params.material='Eh'] - Material designation (Table 3)
 * @param {number} [params.sigmaHlim=1500] - Allowable contact stress (N/mm^2)
 * @param {number} [params.v=5.0] - Pitch line velocity (m/s)
 * @returns {Object} result - { success: boolean, K_Halpha: number, K_Falpha: number, error?: string }
 */
function calculateTransverseLoadFactors_B(params = {}) {
    const d1 = Number(params.d1) || 50.0;
    const mn = Number(params.mn) || 2.0;
    const alpha_t = (params.alpha_t !== undefined && !isNaN(params.alpha_t)) ? Number(params.alpha_t) : 20.0;
    const eps_alpha = (params.eps_alpha !== undefined && !isNaN(params.eps_alpha)) ? Number(params.eps_alpha) : 1.5;
    const eps_beta = (params.eps_beta !== undefined && !isNaN(params.eps_beta)) ? Number(params.eps_beta) : 0;
    const b = Number(params.b) || 30.0;
    const Ft = Number(params.Ft) || 1000.0;
    const c_gamma_alpha = Number(params.c_gamma_alpha) || 20.0;
    const KA = Number(params.KA) || 1.0;
    const Kgamma = Number(params.Kgamma) || 1.0;
    const Kv = Number(params.Kv) || 1.0;
    const KHbeta = Number(params.KHbeta) || 1.0;
    const toleranceClass = Math.round(Math.min(11, Math.max(3, Number(params.toleranceClass) || 6)));
    const material = params.material || 'Eh';
    const sigmaHlim = Number(params.sigmaHlim) || 1500.0;
    const v = Number(params.v) || 5.0;

    if (d1 <= 0 || mn <= 0 || b <= 0 || Ft <= 0 || eps_alpha <= 0) {
        return { success: false, error: 'Invalid input parameters for transverse load factor.' };
    }

    // Total contact ratio eps_gamma = eps_alpha + eps_beta
    const eps_gamma = eps_alpha + eps_beta;

    // Clause 8.3.2: Determinant tangential load in transverse plane FtH
    const FtH = Ft * KA * Kgamma * Kv * KHbeta;
    const FtH_b = FtH / b;

    // Base pitch deviation fpb from ISO 1328-1:2013 single pitch tolerance Formula (5)
    // fpb = fpt * cos(alpha_t) per ISO 6336-1 Clause 6.4.3 c)
    const alpha_t_rad = alpha_t * (Math.PI / 180);
    const fpt = (0.001 * d1 + 0.4 * mn + 5.0) * Math.pow(Math.SQRT2, toleranceClass - 5);
    const fpb = fpt * Math.cos(alpha_t_rad);

    // Formulae (77) - (80): Running-in allowance y_alpha
    let y_alpha = 0;
    if (['St', 'St(cast)', 'V', 'V(cast)', 'GGG(perl., bai.)', 'GTS(perl.)'].includes(material)) {
        y_alpha = (160.0 / sigmaHlim) * fpb;
        if (v > 10.0) {
            y_alpha = Math.min(y_alpha, 6400.0 / sigmaHlim);
        } else if (v > 5.0) {
            y_alpha = Math.min(y_alpha, 12800.0 / sigmaHlim);
        }
    } else if (['GG', 'GGG(ferr.)'].includes(material)) {
        y_alpha = 0.275 * fpb;
        if (v > 10.0) {
            y_alpha = Math.min(y_alpha, 11.0);
        } else if (v > 5.0) {
            y_alpha = Math.min(y_alpha, 22.0);
        }
    } else {
        // Case hardened Eh, IF, NT, NV
        y_alpha = 0.075 * fpb;
        y_alpha = Math.min(y_alpha, 3.0);
    }
    y_alpha = Math.min(y_alpha, fpb);

    const diff = Math.max(0, fpb - y_alpha);

    // Formula (73) & (74): Evaluation of KHalpha and KFalpha
    let KHalpha;
    let KFalpha;

    if (eps_gamma <= 2.0) {
        // Formula (73)
        const commonTerm = 0.9 + 0.4 * ((c_gamma_alpha * diff) / FtH_b);
        KHalpha = (eps_gamma / 2.0) * commonTerm;
        KFalpha = KHalpha;
    } else {
        // Formula (74)
        const commonTerm = 0.9 + 0.4 * ((2.0 * (eps_gamma - 1.0)) / eps_gamma) * ((c_gamma_alpha * diff) / FtH_b);
        KHalpha = commonTerm;
        KFalpha = commonTerm;
    }

    // Formula (75): Limiting conditions for KHalpha
    // 1.0 <= KHalpha <= eps_gamma / (eps_alpha * Z_eps^2)
    // where Z_eps^2 = (4 - eps_alpha) / 3 for spur gears, or 1/eps_alpha for helical
    let Z_eps_sq;
    if (eps_beta >= 1.0) {
        Z_eps_sq = 1.0 / eps_alpha;
    } else {
        const Z_eps_sq_spur = (4.0 - eps_alpha) / 3.0;
        const Z_eps_sq_hel = 1.0 / eps_alpha;
        Z_eps_sq = Z_eps_sq_spur - eps_beta * (Z_eps_sq_spur - Z_eps_sq_hel);
    }
    const KHalpha_max = eps_gamma / (eps_alpha * Z_eps_sq);
    if (KHalpha > KHalpha_max) {
        KHalpha = KHalpha_max;
    }
    if (KHalpha < 1.0) {
        KHalpha = 1.0;
    }

    // Formula (76): Limiting conditions for KFalpha
    // 1.0 <= KFalpha <= eps_gamma / (0.25 * eps_alpha + 0.75)
    const KFalpha_max = eps_gamma / (0.25 * eps_alpha + 0.75);
    if (KFalpha > KFalpha_max) {
        KFalpha = KFalpha_max;
    }
    if (KFalpha < 1.0) {
        KFalpha = 1.0;
    }

    return {
        success: true,
        K_Halpha: KHalpha,
        K_Falpha: KFalpha
    };
}