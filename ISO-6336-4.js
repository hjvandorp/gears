/**
 * ISO/TS 6336-4:2019 Calculations
 * Rating tab calculations (Calculation of tooth flank fracture load capacity)
 */

/**
 * Calculates Hardness Depth Profile HV(y) according to Lang (Method C1).
 * Reference: ISO/TS 6336-4:2019 Clause 7.4.4, Formulae (75) - (79)
 * 
 * @param {number} y - Material depth normal to tooth flank (mm)
 * @param {number} CHD - Case hardening depth at 550 HV (mm)
 * @param {number} [HVsurface=700] - Surface hardness (HV)
 * @param {number} [HVcore=350] - Core hardness (HV)
 * @returns {number} HV - Vickers hardness at depth y
 */
function calculateHardnessDepth_Lang_C1(y, CHD, HVsurface = 700, HVcore = 350) {
    if (CHD <= 0 || y < 0) return HVsurface;
    const y_star = y / CHD; // Formula (77)
    const a = -0.0381; // Formula (78)
    const b = -0.2662; // Formula (79)
    // Formula (76): f(y*) = 10^( (a + b * y*) * y* )
    const expTerm = (a + b * y_star) * y_star;
    const f_y_star = Math.pow(10, expTerm);
    // Formula (75): HV(y*) = HVcore + (HVsurface - HVcore) * f(y*)
    const HV = HVcore + (HVsurface - HVcore) * f_y_star;
    return Math.max(HVcore, HV);
}

/**
 * Calculates Tangential Residual Stress Depth Profile sigma_RS(y).
 * Reference: ISO/TS 6336-4:2019 Clause 6.3.3, Method B, Formulae (63) & (64)
 * 
 * @param {number} HV - Local hardness HV(y)
 * @param {number} HVcore - Core hardness
 * @returns {number} sigma_RS - Residual stress (N/mm^2, <= 0)
 */
function calculateResidualStress_MethodB(HV, HVcore) {
    const diff = HV - HVcore;
    if (diff <= 0) return 0.0;

    let sigma_RS;
    if (diff > 300.0) {
        // Formula (63): for (HV(y) - HVcore) > 300
        sigma_RS = -1.25 * diff;
    } else {
        // Formula (64): for (HV(y) - HVcore) <= 300
        sigma_RS = -0.2857 * diff - 460.0 + 460.0 * (diff / 300.0); // smooth boundary to 0 at diff=0, or strict ISO:
        sigma_RS = -0.2857 * diff - (diff > 0 ? (300.0 - diff) * (460.0 / 300.0) : 0);
    }
    // Strictly per ISO formula (63) & (64):
    if (diff > 300.0) {
        sigma_RS = -1.25 * diff;
    } else {
        sigma_RS = -0.2857 * diff - 460.0;
    }
    return Math.min(0, sigma_RS);
}

/**
 * Calculates Quasi-stationary Residual Stress tau_eff,RS(y).
 * Reference: ISO/TS 6336-4:2019 Clause 6.3.1, Formula (61)
 * 
 * Formula:
 *   tau_eff,RS(y) = sqrt(2 / 15) * |sigma_RS(y)|
 * 
 * @param {number} sigma_RS - Tangential residual stress (N/mm^2)
 * @returns {number} tau_eff_RS - Equivalent quasi-stationary residual stress (N/mm^2)
 */
function calculateQuasiStationaryResidualStress(sigma_RS) {
    return Math.sqrt(2.0 / 15.0) * Math.abs(sigma_RS);
}

/**
 * Calculates Local Equivalent Stress without consideration of residual stresses tau_eff,L,CP(y).
 * Reference: ISO/TS 6336-4:2019 Clause 6.2.1, Formula (7) or Annex A Formula (A.1)
 * 
 * Formula (A.1):
 *   tau_eff,L,CP(y) = (0.149 * pdyn + y * (pdyn / bH) * (1 - y / sqrt(bH^2 + y^2))) / (0.4 * (y / bH) + 1.54)
 * 
 * @param {number} y - Material depth (mm)
 * @param {number} pdyn_CP - Local Hertzian contact stress (N/mm^2)
 * @param {number} bH_CP - Half Hertzian contact width (mm)
 * @returns {number} tau_eff_L_CP - Local equivalent stress (N/mm^2)
 */
function calculateLocalEquivalentStress_NoRS(y, pdyn_CP, bH_CP) {
    if (bH_CP <= 0 || pdyn_CP <= 0) return 0.0;
    const y_bH = y / bH_CP;
    const sqrtTerm = Math.sqrt(bH_CP * bH_CP + y * y);
    const bracket = 1.0 - (y / sqrtTerm);
    const num = 0.149 * pdyn_CP + y * (pdyn_CP / bH_CP) * bracket;
    const denom = 0.4 * y_bH + 1.54;
    return num / denom;
}

/**
 * Calculates the Influence of Residual Stresses on Local Equivalent Stress Delta_tau_eff,L,RS,CP(y).
 * Reference: ISO/TS 6336-4:2019 Clause 6.4, Formulae (65) - (70)
 * 
 * @param {Object} params
 * @param {number} params.y - Depth (mm)
 * @param {number} params.sigma_RS - Local residual stress at depth y (N/mm^2)
 * @param {number} params.sigma_RS_max - Maximum residual stress magnitude |sigma_RS,max| (N/mm^2)
 * @param {number} params.pdyn_CP - Local Hertzian contact stress (N/mm^2)
 * @param {number} params.pred_CP - Normal relative radius of curvature (mm)
 * @param {number} params.CHD - Case hardening depth (mm)
 * @returns {number} Delta_tau - Influence on local equivalent stress (N/mm^2)
 */
function calculateResidualStressInfluence_DeltaTau(params = {}) {
    const y = Number(params.y) || 0;
    const sigma_RS = Math.abs(Number(params.sigma_RS) || 0);
    const sigma_RS_max = Math.max(1.0, Math.abs(Number(params.sigma_RS_max) || 400.0));
    const pdyn_CP = Number(params.pdyn_CP) || 1000.0;
    const pred_CP = Number(params.pred_CP) || 20.0;
    const CHD = Number(params.CHD) || 1.0;

    // Formula (68): K_pH,sigmaRS,max
    const term68 = Math.pow(Math.max(0, -0.07 * (pdyn_CP / (-sigma_RS_max))), 2.385);
    const K_pH_sigmaRS_max = -1.98 * Math.tanh(term68) - 0.98;

    // Formula (69): K_CHD
    const K_CHD = 11.25 * Math.exp(-5.151 * CHD) + 0.115 * Math.exp(-1.834 * CHD);

    // Formula (66): K1
    const K1 = (1.0 - K_pH_sigmaRS_max) * Math.tanh(K_CHD * Math.pow(y, 4.58)) + K_pH_sigmaRS_max;

    // Formula (67): K2
    const termPred = -Math.tanh(0.1 * (pred_CP - 10.0)) + 1.0;
    const innerTanh = Math.tanh((-2.0 * (pdyn_CP / 100.0) - 200.0) / 100.0);
    const innerTerm = (CHD * CHD / 16.0) * y * (sigma_RS_max / 10.0) * innerTanh + (sigma_RS_max / 10.0);
    const K2 = termPred * innerTerm;

    // Formula (65): Delta_tau_eff,L,RS,CP(y)
    const Delta_tau = K1 * (sigma_RS / 100.0) * 32.0 * Math.tanh(9.0 * Math.pow(y, 1.1)) - K2;
    return Delta_tau;
}

/**
 * Calculates Local Material Shear Strength tau_per,CP(y).
 * Reference: ISO/TS 6336-4:2019 Clause 7, Formulae (71) - (74)
 * 
 * Formula:
 *   tau_per,CP(y) = K_tau,per * K_material * HV(y)
 * 
 * @param {number} HV - Local hardness HV(y)
 * @param {number} [st_BD=20] - Chordal tooth thickness at pitch/line of action (mm)
 * @param {number} [Rm=1000] - Tensile strength of gear material (N/mm^2)
 * @returns {number} tau_per - Local material shear strength (N/mm^2)
 */
function calculateLocalMaterialShearStrength(HV, st_BD = 20, Rm = 1000) {
    // Clause 7.2: K_tau,per = 0.4 for case carburized steels (Formula 72)
    const K_tau_per = 0.4;

    // Clause 7.3: K_material (Formula 73 & 74)
    const stClamped = Math.min(40.0, Math.max(10.0, st_BD));
    let K_material;
    if (Rm <= 800.0) {
        K_material = 0.70 + (40.0 - stClamped) * 0.01; // Formula (73)
    } else if (Rm >= 900.0) {
        K_material = 0.90 + (40.0 - stClamped) * 0.0077; // Formula (74)
    } else {
        // Linear interpolation for 800 < Rm < 900
        const K_800 = 0.70 + (40.0 - stClamped) * 0.01;
        const K_900 = 0.90 + (40.0 - stClamped) * 0.0077;
        K_material = K_800 + ((Rm - 800.0) / 100.0) * (K_900 - K_800);
    }

    return K_tau_per * K_material * HV;
}

/**
 * Calculates Tooth Flank Fracture Load Capacity and Material Exposure.
 * Reference: ISO/TS 6336-4:2019
 * 
 * Evaluates:
 * - Local equivalent stress depth profile: tau_eff,CP(y) (Formula 6)
 * - Local material shear strength depth profile: tau_per,CP(y) (Formula 71)
 * - Local material exposure: A_FF,CP(y) = (tau_eff,CP(y) / tau_per,CP(y)) + c1 (Formula 4)
 * - Maximum material exposure: A_FF,max = max(A_FF,CP(y)) for y >= bH (Formula 1 & 2)
 * - Tooth Flank Fracture safety factor: S_FF = 1 / A_FF,max (or allowable ratio based on threshold 0.8)
 * 
 * @param {Object} params - Geometry, load, and case hardening parameters
 * @returns {Object} result - { success: boolean, AFF_max, S_FF, y_crit, bH, pdyn, profiles: Array, error?: string }
 */
function calculateFlankFractureLoad(params = {}) {
    const mn = Number(params.mn) || 2.0;
    const b = Number(params.b) || 30.0;
    const z1 = Number(params.z1) || 25;
    const z2 = Number(params.z2) || 50;
    const alpha_t = (params.alpha_t !== undefined && !isNaN(params.alpha_t)) ? Number(params.alpha_t) : 20.0;
    const beta = Number(params.beta) || 0;
    const Ft = Number(params.Ft) || 1000.0;
    const KA = Number(params.KA) || 1.0;
    const Kgamma = Number(params.Kgamma) || 1.0;
    const Kv = Number(params.Kv) || 1.0;
    const KHalpha = Number(params.KHalpha) || 1.0;
    const KHbeta = Number(params.KHbeta) || 1.0;

    // Material & case parameters
    const CHD = Number(params.CHD) || (0.2 * mn); // Typical default CHD ~ 0.2 * mn
    const HVsurface = Number(params.HVsurface) || 720.0;
    const HVcore = Number(params.HVcore) || 350.0;
    const Rm = Number(params.Rm) || 1100.0;
    const E1 = Number(params.E1) || 206000.0;
    const E2 = Number(params.E2) || 206000.0;
    const nu1 = Number(params.nu1) || 0.3;
    const nu2 = Number(params.nu2) || 0.3;

    if (mn <= 0 || b <= 0 || Ft <= 0 || CHD <= 0) {
        return { success: false, error: 'Invalid module, facewidth, load, or CHD for tooth flank fracture calculation.' };
    }

    // 1. Reduced modulus of elasticity Er (Formula 12)
    const c1_E = (1.0 - nu1 * nu1) / E1;
    const c2_E = (1.0 - nu2 * nu2) / E2;
    const Er = 2.0 / (c1_E + c2_E);

    // 2. Transverse & normal relative radius of curvature at pitch point (Clause 6.2.2)
    const atRad = alpha_t * (Math.PI / 180);
    const betaRad = beta * (Math.PI / 180);
    const d1 = (z1 * mn) / Math.cos(betaRad);
    const d2 = (z2 * mn) / Math.cos(betaRad);
    const db1 = d1 * Math.cos(atRad);
    const db2 = d2 * Math.cos(atRad);

    const pt1 = 0.5 * db1 * Math.tan(atRad);
    const pt2 = 0.5 * db2 * Math.tan(atRad);
    const pred_t = (pt1 * pt2) / (pt1 + pt2);

    const sinBeta = Math.sin(betaRad);
    const cosAlphaT = Math.cos(atRad);
    const cosAlphaN = Math.cos(Math.atan(Math.tan(atRad) * Math.cos(betaRad)));
    const beta_b = Math.asin(sinBeta * cosAlphaN);
    const pred_CP = pred_t / Math.cos(beta_b); // Formula (8)

    // 3. Elasticity factor ZE (Formula 17)
    const ZE = Math.sqrt(Er / (2.0 * Math.PI));

    // 4. Local nominal Hertzian contact stress pH,CP,B at pitch point (Xcp = 1.0, Formula 16)
    const Xcp = 1.0;
    const pH_CP = ZE * Math.sqrt((Ft * Xcp) / (b * pred_CP * cosAlphaT));

    // 5. Dynamic Hertzian contact stress pdyn,CP (Formula 15)
    const loadMult = Math.sqrt(KA * Kgamma * Kv * KHalpha * KHbeta);
    const pdyn_CP = pH_CP * loadMult;

    // 6. Half of Hertzian contact width bH,CP (Formula 3)
    const bH_CP = 4.0 * pred_CP * (pdyn_CP / Er);

    // 7. Maximum residual stress estimate from surface & core hardness (Formulae 63, 64, 70)
    const HV_max = HVsurface;
    const sigma_RS_max = Math.abs(calculateResidualStress_MethodB(HV_max, HVcore));

    // 8. Tooth thickness estimate st,B-D (ISO 21771 approximation at pitch circle)
    const st_BD = 0.5 * Math.PI * mn;

    // 9. Material depth discretization (from y = bH_CP to y = 3 * CHD)
    let maxAFF = 0.0;
    let critDepth = bH_CP;
    const depthProfiles = [];

    const startDepth = Math.max(0.05, bH_CP);
    const maxDepth = Math.max(3.0 * CHD, 2.5 * bH_CP);
    const steps = 40;
    const dy = (maxDepth - startDepth) / steps;

    for (let i = 0; i <= steps; i++) {
        const y = startDepth + i * dy;

        // Local hardness HV(y) via Method C1
        const HV_y = calculateHardnessDepth_Lang_C1(y, CHD, HVsurface, HVcore);

        // Local residual stress sigma_RS(y)
        const sigma_RS_y = calculateResidualStress_MethodB(HV_y, HVcore);

        // Quasi-stationary residual stress tau_eff,RS(y)
        const tau_eff_RS = calculateQuasiStationaryResidualStress(sigma_RS_y);

        // Local equivalent stress without residual stresses tau_eff,L,CP(y)
        const tau_eff_L = calculateLocalEquivalentStress_NoRS(y, pdyn_CP, bH_CP);

        // Influence of residual stress Delta_tau_eff,L,RS,CP(y)
        const Delta_tau = calculateResidualStressInfluence_DeltaTau({
            y,
            sigma_RS: sigma_RS_y,
            sigma_RS_max,
            pdyn_CP,
            pred_CP,
            CHD
        });

        // Formula (6): Total local equivalent stress tau_eff,CP(y)
        let tau_eff_CP = tau_eff_L - Delta_tau - tau_eff_RS;
        if (tau_eff_CP < 0) tau_eff_CP = 0.0;

        // Local material shear strength tau_per,CP(y) (Formula 71)
        const tau_per = calculateLocalMaterialShearStrength(HV_y, st_BD, Rm);

        // Formula (4): Local material exposure A_FF,CP(y) (c1 = 0.04 for case carburized)
        const c1 = 0.04;
        const AFF = (tau_per > 0) ? (tau_eff_CP / tau_per + c1) : 0.0;

        depthProfiles.push({
            y: y,
            HV: HV_y,
            sigma_RS: sigma_RS_y,
            tau_eff: tau_eff_CP,
            tau_per: tau_per,
            AFF: AFF
        });

        if (AFF > maxAFF) {
            maxAFF = AFF;
            critDepth = y;
        }
    }

    // Safety factor against tooth flank fracture S_FF (Reference: AFF,max < 0.8 threshold)
    const S_FF = maxAFF > 0 ? (0.8 / maxAFF) : 999.0;

    return {
        success: true,
        AFF_max: maxAFF,
        S_FF: S_FF,
        criticalDepth: critDepth,
        bH: bH_CP,
        pdyn_CP: pdyn_CP,
        CHD: CHD,
        profiles: depthProfiles
    };
}

// Function alias for ISO 6336-4 Tooth Flank Fracture calculation
function calculateToothFlankFracture(params = {}) {
    return calculateFlankFractureLoad(params);
}

if (typeof window !== 'undefined') {
    window.calculateFlankFractureLoad = calculateFlankFractureLoad;
    window.calculateToothFlankFracture = calculateToothFlankFracture;
}
