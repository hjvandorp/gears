/**
 * ISO 6336-6:2019 / ISO 6336-2 & ISO 6336-3 Calculations
 * Calculation of service life / expected lifetime before pitting and bending failure
 */

/**
 * Calculates expected number of cycles and operating hours before pitting failure (SH = 1.0).
 * Inverts the ISO 6336-2:2019 Clause 11.3 S-N curve (ZNT).
 *
 * @param {Object} params
 * @param {number} params.sigma_H - Actual contact stress (MPa)
 * @param {number} params.sigma_HP_ref - Permissible contact stress evaluated at ZNT = 1.0 (MPa)
 * @param {string} [params.material='Eh'] - Gear material
 * @param {number} [params.speedRpm=1440] - Rotational speed (RPM)
 * @param {number} [params.meshCyclesPerRev=1] - Mesh contacts per revolution
 * @returns {Object} { cycles: number, hours: number, isInfinite: boolean, formatted: string }
 */
function calculateExpectedLifetimePitting(params = {}) {
    const sigma_H = Number(params.sigma_H) || 0;
    const sigma_HP_ref = Number(params.sigma_HP_ref) || 0;
    const mat = (params.material || 'Eh').trim();
    const speedRpm = Math.max(0, Number(params.speedRpm) || 0);
    const meshCyclesPerRev = Math.max(1, Number(params.meshCyclesPerRev) || 1);

    if (sigma_H <= 0 || sigma_HP_ref <= 0 || speedRpm <= 0) {
        return { cycles: 0, hours: 0, isInfinite: false, formatted: '--' };
    }

    // Required ZNT so that sigma_HP = sigma_H
    const ZNT_req = sigma_H / sigma_HP_ref;

    // Define S-N curve parameters based on material
    // [NL_stat, ZNT_stat, NL_ref, ZNT_ref = 1.0, NL_long, ZNT_long]
    let NL_stat = 1e5;
    let ZNT_stat = 1.6;
    let NL_ref = 5e7;
    let NL_long = 1e10;
    let ZNT_long = 0.85;

    if (['GG', 'GGG(ferr.)', 'NT', 'NT(nitr.)', 'NV(nitr.)'].includes(mat)) {
        NL_stat = 1e5;
        ZNT_stat = 1.3;
        NL_ref = 2e6;
        NL_long = 1e10;
        ZNT_long = 0.85;
    } else if (mat.startsWith('NV')) {
        NL_stat = 1e5;
        ZNT_stat = 1.1;
        NL_ref = 2e6;
        NL_long = 1e10;
        ZNT_long = 0.85;
    }

    let cycles;
    let isInfinite = false;

    if (ZNT_req <= ZNT_long) {
        // Stress is below or at the long-term endurance limit
        isInfinite = true;
        cycles = NL_long;
    } else if (ZNT_req <= 1.0) {
        // Long life branch between NL_ref and NL_long
        const exp = (Math.log10(1.0 / ZNT_long)) / (Math.log10(NL_long / NL_ref));
        cycles = NL_ref * Math.pow(1.0 / ZNT_req, 1.0 / exp);
        if (cycles >= 1e9) isInfinite = true;
    } else if (ZNT_req <= ZNT_stat) {
        // Finite life Wöhler branch between NL_stat and NL_ref
        const exp = (Math.log10(ZNT_stat / 1.0)) / (Math.log10(NL_ref / NL_stat));
        cycles = NL_ref * Math.pow(1.0 / ZNT_req, 1.0 / exp);
    } else {
        // High overload range exceeding static capacity
        cycles = Math.max(1, NL_stat * (ZNT_stat / ZNT_req));
    }

    const hours = cycles / (speedRpm * 60.0 * meshCyclesPerRev);
    let formatted;
    if (isInfinite || hours >= 100000) {
        formatted = '> 100,000 h (Endurance)';
    } else if (hours < 1) {
        formatted = '< 1 h (Immediate overload)';
    } else {
        formatted = `${Math.round(hours).toLocaleString()} h`;
    }

    return { cycles, hours, isInfinite, formatted };
}

/**
 * Calculates expected number of cycles and operating hours before tooth bending failure (SF = 1.0).
 * Inverts the ISO 6336-3:2019 Clause 12.3 S-N curve (YNT).
 *
 * @param {Object} params
 * @param {number} params.sigma_F - Actual tooth root stress (MPa)
 * @param {number} params.sigma_FP_ref - Permissible bending stress evaluated at YNT = 1.0 (MPa)
 * @param {string} [params.material='Eh'] - Gear material
 * @param {number} [params.speedRpm=1440] - Rotational speed (RPM)
 * @param {number} [params.meshCyclesPerRev=1] - Mesh contacts per revolution
 * @returns {Object} { cycles: number, hours: number, isInfinite: boolean, formatted: string }
 */
function calculateExpectedLifetimeBending(params = {}) {
    const sigma_F = Number(params.sigma_F) || 0;
    const sigma_FP_ref = Number(params.sigma_FP_ref) || 0;
    const mat = (params.material || 'Eh').trim();
    const speedRpm = Math.max(0, Number(params.speedRpm) || 0);
    const meshCyclesPerRev = Math.max(1, Number(params.meshCyclesPerRev) || 1);

    if (sigma_F <= 0 || sigma_FP_ref <= 0 || speedRpm <= 0) {
        return { cycles: 0, hours: 0, isInfinite: false, formatted: '--' };
    }

    // Required YNT so that sigma_FP = sigma_F
    const YNT_req = sigma_F / sigma_FP_ref;

    // Table 3 parameters
    let NL_stat = 1e3;
    let YNT_stat = 2.5;
    let NL_ref = 3e6;
    let NL_long = 1e10;
    let YNT_long = 0.85;

    if (['St', 'V', 'GGG(perl. bai.)', 'GTS(perl.)', 'GGG'].includes(mat)) {
        NL_stat = 1e4;
        YNT_stat = 2.5;
    } else if (['Eh', 'IF', 'IF(root)'].includes(mat)) {
        NL_stat = 1e3;
        YNT_stat = 2.5;
    } else if (['GG', 'GGG(ferr.)', 'NT', 'NV(nitr.)'].includes(mat)) {
        NL_stat = 1e3;
        YNT_stat = 1.6;
    } else {
        NL_stat = 1e3;
        YNT_stat = 1.1;
    }

    let cycles;
    let isInfinite = false;

    if (YNT_req <= YNT_long) {
        // Stress below endurance threshold
        isInfinite = true;
        cycles = NL_long;
    } else if (YNT_req <= 1.0) {
        // Long life branch
        const exp = (Math.log10(1.0 / YNT_long)) / (Math.log10(NL_long / NL_ref));
        cycles = NL_ref * Math.pow(1.0 / YNT_req, 1.0 / exp);
        if (cycles >= 1e9) isInfinite = true;
    } else if (YNT_req <= YNT_stat) {
        // Finite life Wöhler branch
        const exp = (Math.log10(YNT_stat / 1.0)) / (Math.log10(NL_ref / NL_stat));
        cycles = NL_ref * Math.pow(1.0 / YNT_req, 1.0 / exp);
    } else {
        // Overload branch
        cycles = Math.max(1, NL_stat * (YNT_stat / YNT_req));
    }

    const hours = cycles / (speedRpm * 60.0 * meshCyclesPerRev);
    let formatted;
    if (isInfinite || hours >= 100000) {
        formatted = '> 100,000 h (Endurance)';
    } else if (hours < 1) {
        formatted = '< 1 h (Immediate yield/fracture)';
    } else {
        formatted = `${Math.round(hours).toLocaleString()} h`;
    }

    return { cycles, hours, isInfinite, formatted };
}

if (typeof window !== 'undefined') {
    window.calculateExpectedLifetimePitting = calculateExpectedLifetimePitting;
    window.calculateExpectedLifetimeBending = calculateExpectedLifetimeBending;
}
