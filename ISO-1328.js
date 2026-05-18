/**
 * ISO 1328 Calculations
 * Tolerances tab calculations
 */

function calculateTolerances(toleranceClass) {
    // Placeholder for future tolerance calculation logic and tables
    if (isNaN(toleranceClass) || toleranceClass < 1 || toleranceClass > 11) {
        return { success: false, error: 'Invalid class.' };
    }
    return { success: true, value: toleranceClass };
}

/**
 * Calculates Single Pitch Tolerance (f_pT) according to ISO 1328-1:2013 Formula (5)
 * @param {number} d - Reference diameter (mm)
 * @param {number} mn - Normal module (mm)
 * @param {number} A - Tolerance class (ISO 1328-1:2013)
 * @returns {Object} Result object with success flag and value (μm) or error message.
 */
function calculateSinglePitchTolerance(d, mn, A) {
    if (isNaN(d) || isNaN(mn) || isNaN(A) || A < 1 || A > 11) {
        return { success: false, error: 'Invalid input parameters.' };
    }
    // Formula (5): f_pT = (0.001 * d + 0.4 * mn + 5) * (sqrt(2))^(A - 5)
    const baseValue = 0.001 * d + 0.4 * mn + 5;
    const multiplier = Math.pow(Math.sqrt(2), A - 5);
    const fpT = baseValue * multiplier;

    return { success: true, value: fpT };
}

/**
 * Calculates Total Cumulative Pitch Tolerance (F_pT) according to ISO 1328-1:2013 Formula (6)
 * @param {number} d - Reference diameter (mm)
 * @param {number} mn - Normal module (mm)
 * @param {number} A - Tolerance class (ISO 1328-1:2013)
 * @returns {Object} Result object with success flag and value (μm) or error message.
 */
function calculateCumulativePitchTolerance(d, mn, A) {
    if (isNaN(d) || isNaN(mn) || isNaN(A) || A < 1 || A > 11) {
        return { success: false, error: 'Invalid input parameters.' };
    }
    // Formula (6): F_pT = (0.002 * d + 0.55 * sqrt(d) + 0.7 * mn + 12) * (sqrt(2))^(A - 5)
    const baseValue = 0.002 * d + 0.55 * Math.sqrt(d) + 0.7 * mn + 12;
    const multiplier = Math.pow(Math.sqrt(2), A - 5);
    const FpT = baseValue * multiplier;

    return { success: true, value: FpT };
}

/**
 * Calculates Runout Tolerance (F_rT) according to ISO 1328-1:2013
 * Formula: F_rT = 0.9 * F_pT
 * @param {number} FpT - Total cumulative pitch tolerance (μm)
 * @returns {Object} Result object with success flag and value (μm).
 */
function calculateRunoutTolerance(FpT) {
    if (isNaN(FpT)) {
        return { success: false, error: 'Invalid input.' };
    }
    return { success: true, value: 0.9 * FpT };
}

/**
 * Calculates Profile Slope Tolerance (f_HalphaT) according to ISO 1328-1:2013 Formula (7)
 * @param {number} d - Reference diameter (mm)
 * @param {number} mn - Normal module (mm)
 * @param {number} A - Tolerance class (ISO 1328-1:2013)
 * @returns {Object} Result object with success flag and value (μm) or error message.
 */
function calculateProfileSlopeTolerance(d, mn, A) {
    if (isNaN(d) || isNaN(mn) || isNaN(A) || A < 1 || A > 11) {
        return { success: false, error: 'Invalid input parameters.' };
    }
    // Formula (7): f_HalphaT = (0.4 * mn + 0.001 * d + 4) * (sqrt(2))^(A - 5)
    const baseValue = 0.4 * mn + 0.001 * d + 4;
    const multiplier = Math.pow(Math.sqrt(2), A - 5);
    const fHalphaT = baseValue * multiplier;

    return { success: true, value: fHalphaT };
}

/**
 * Calculates Profile Form Tolerance (f_falphaT) according to ISO 1328-1:2013 Formula (8)
 * @param {number} mn - Normal module (mm)
 * @param {number} A - Tolerance class (ISO 1328-1:2013)
 * @returns {Object} Result object with success flag and value (μm).
 */
function calculateProfileFormTolerance(mn, A) {
    if (isNaN(mn) || isNaN(A) || A < 1 || A > 11) {
        return { success: false, error: 'Invalid input parameters.' };
    }
    // Formula (8): f_falphaT = (0.55 * mn + 5) * (sqrt(2))^(A - 5)
    const baseValue = 0.55 * mn + 5;
    const multiplier = Math.pow(Math.sqrt(2), A - 5);
    const ffalphaT = baseValue * multiplier;

    return { success: true, value: ffalphaT };
}

/**
 * Calculates Total Profile Tolerance (F_alphaT) according to ISO 1328-1:2013 Formula (9)
 * @param {number} fHalphaT - Profile slope tolerance (unrounded, μm)
 * @param {number} ffalphaT - Profile form tolerance (unrounded, μm)
 * @returns {Object} Result object with success flag and value (μm).
 */
function calculateTotalProfileTolerance(fHalphaT, ffalphaT) {
    if (isNaN(fHalphaT) || isNaN(ffalphaT)) {
        return { success: false, error: 'Invalid input parameters.' };
    }
    // Formula (9): F_alphaT = sqrt(f_HalphaT^2 + f_falphaT^2)
    const FalphaT = Math.sqrt(Math.pow(fHalphaT, 2) + Math.pow(ffalphaT, 2));

    return { success: true, value: FalphaT };
}

/**
 * Calculates Helix Slope Tolerance (f_HbetaT) according to ISO 1328-1:2013 Formula (10)
 * @param {number} d - Reference diameter (mm)
 * @param {number} b - Facewidth (mm)
 * @param {number} A - Tolerance class (ISO 1328-1:2013)
 * @returns {Object} Result object with success flag and value (μm).
 */
function calculateHelixSlopeTolerance(d, b, A) {
    if (isNaN(d) || isNaN(b) || isNaN(A) || A < 1 || A > 11) {
        return { success: false, error: 'Invalid input parameters.' };
    }
    // Formula (10): f_HbetaT = (0.05 * sqrt(d) + 0.35 * sqrt(b) + 4) * (sqrt(2))^(A - 5)
    const baseValue = 0.05 * Math.sqrt(d) + 0.35 * Math.sqrt(b) + 4;
    const multiplier = Math.pow(Math.sqrt(2), A - 5);
    const fHbetaT = baseValue * multiplier;

    return { success: true, value: fHbetaT };
}

/**
 * Calculates Helix Form Tolerance (f_fbetaT) according to ISO 1328-1:2013 Formula (11)
 * @param {number} d - Reference diameter (mm)
 * @param {number} b - Facewidth (mm)
 * @param {number} A - Tolerance class (ISO 1328-1:2013)
 * @returns {Object} Result object with success flag and value (μm).
 */
function calculateHelixFormTolerance(d, b, A) {
    if (isNaN(d) || isNaN(b) || isNaN(A) || A < 1 || A > 11) {
        return { success: false, error: 'Invalid input parameters.' };
    }
    // Formula (11): f_fbetaT = (0.07 * sqrt(d) + 0.45 * sqrt(b) + 4) * (sqrt(2))^(A - 5)
    const baseValue = 0.07 * Math.sqrt(d) + 0.45 * Math.sqrt(b) + 4;
    const multiplier = Math.pow(Math.sqrt(2), A - 5);
    const ffbetaT = baseValue * multiplier;

    return { success: true, value: ffbetaT };
}

/**
 * Calculates Total Helix Tolerance (F_betaT) according to ISO 1328-1:2013 Formula (12)
 * @param {number} fHbetaT - Helix slope tolerance (unrounded, μm)
 * @param {number} ffbetaT - Helix form tolerance (unrounded, μm)
 * @returns {Object} Result object with success flag and value (μm).
 */
function calculateTotalHelixTolerance(fHbetaT, ffbetaT) {
    if (isNaN(fHbetaT) || isNaN(ffbetaT)) {
        return { success: false, error: 'Invalid input parameters.' };
    }
    // Formula (12): F_betaT = sqrt(f_HbetaT^2 + f_fbetaT^2)
    const FbetaT = Math.sqrt(Math.pow(fHbetaT, 2) + Math.pow(ffbetaT, 2));

    return { success: true, value: FbetaT };
}
