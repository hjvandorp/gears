/**
 * ISO 6336-5:2016 Calculations
 * Rating tab calculations (Strength and quality of materials)
 */

/**
 * Table 1 database for ISO 6336-5:2016: Calculation of sigma_H_lim and sigma_F_lim
 * Formula (2): sigma = A * x + B
 * where x is surface hardness in HBW or HV.
 * 
 * Each material entry specifies:
 * - material: Standard material type / designation
 * - description: Detailed description
 * - hardnessUnit: 'HBW' or 'HV'
 * - contact: { ML: [...], MQ: [...], ME: [...] }
 * - bending: { ML: [...], MQ: [...], ME: [...] }
 * Each curve segment has { A, B, minHardness, maxHardness, condition?, note? }
 */
const ISO_6336_5_TABLE_1 = {
    // 1. Normalized low carbon steels / cast steels (Table 1, items 1 - 8)
    'St_wrought': {
        name: 'Wrought normalized low carbon steels',
        abbreviation: 'St',
        hardnessUnit: 'HBW',
        contact: {
            'ML': [{ A: 1.000, B: 190, minHardness: 110, maxHardness: 210 }],
            'MQ': [{ A: 1.000, B: 190, minHardness: 110, maxHardness: 210 }], // ML/MQ same
            'ME': [{ A: 1.520, B: 250, minHardness: 110, maxHardness: 210 }]
        },
        bending: {
            'ML': [{ A: 0.455, B: 69, minHardness: 110, maxHardness: 210 }],
            'MQ': [{ A: 0.455, B: 69, minHardness: 110, maxHardness: 210 }], // ML/MQ same
            'ME': [{ A: 0.386, B: 147, minHardness: 110, maxHardness: 210 }]
        }
    },
    'St_cast': {
        name: 'Cast normalized low carbon steels',
        abbreviation: 'St (cast)',
        hardnessUnit: 'HBW',
        contact: {
            'ML': [{ A: 0.986, B: 131, minHardness: 140, maxHardness: 210 }],
            'MQ': [{ A: 0.986, B: 131, minHardness: 140, maxHardness: 210 }], // ML/MQ same
            'ME': [{ A: 1.143, B: 237, minHardness: 140, maxHardness: 210 }]
        },
        bending: {
            'ML': [{ A: 0.313, B: 62, minHardness: 140, maxHardness: 210 }],
            'MQ': [{ A: 0.313, B: 62, minHardness: 140, maxHardness: 210 }], // ML/MQ same
            'ME': [{ A: 0.254, B: 137, minHardness: 140, maxHardness: 210 }]
        }
    },

    // 2. Cast iron materials (Table 1, items 9 - 20)
    'GTS_perl': {
        name: 'Black malleable cast iron (perlitic)',
        abbreviation: 'GTS (perl.)',
        hardnessUnit: 'HBW',
        contact: {
            'ML': [{ A: 1.371, B: 143, minHardness: 135, maxHardness: 250 }],
            'MQ': [{ A: 1.371, B: 143, minHardness: 135, maxHardness: 250 }], // ML/MQ same
            'ME': [{ A: 1.333, B: 267, minHardness: 175, maxHardness: 250 }]
        },
        bending: {
            'ML': [{ A: 0.345, B: 77, minHardness: 135, maxHardness: 250 }],
            'MQ': [{ A: 0.345, B: 77, minHardness: 135, maxHardness: 250 }], // ML/MQ same
            'ME': [{ A: 0.403, B: 128, minHardness: 175, maxHardness: 250 }]
        }
    },
    'GGG': {
        name: 'Nodular cast iron (perlitic, bainitic, ferritic)',
        abbreviation: 'GGG',
        hardnessUnit: 'HBW',
        contact: {
            'ML': [{ A: 1.434, B: 211, minHardness: 175, maxHardness: 300 }],
            'MQ': [{ A: 1.434, B: 211, minHardness: 175, maxHardness: 300 }], // ML/MQ same
            'ME': [{ A: 1.500, B: 250, minHardness: 200, maxHardness: 300 }]
        },
        bending: {
            'ML': [{ A: 0.350, B: 119, minHardness: 175, maxHardness: 300 }],
            'MQ': [{ A: 0.350, B: 119, minHardness: 175, maxHardness: 300 }], // ML/MQ same
            'ME': [{ A: 0.380, B: 134, minHardness: 200, maxHardness: 300 }]
        }
    },
    'GG': {
        name: 'Grey cast iron',
        abbreviation: 'GG',
        hardnessUnit: 'HBW',
        contact: {
            'ML': [{ A: 1.033, B: 132, minHardness: 150, maxHardness: 240 }],
            'MQ': [{ A: 1.033, B: 132, minHardness: 150, maxHardness: 240 }], // ML/MQ same
            'ME': [{ A: 1.465, B: 122, minHardness: 175, maxHardness: 275 }]
        },
        bending: {
            'ML': [{ A: 0.256, B: 8, minHardness: 150, maxHardness: 240 }],
            'MQ': [{ A: 0.256, B: 8, minHardness: 150, maxHardness: 240 }], // ML/MQ same
            'ME': [{ A: 0.200, B: 53, minHardness: 175, maxHardness: 275 }]
        }
    },

    // 3. Through hardened wrought steels (Table 1, items 21 - 32)
    'V_carbon': {
        name: 'Through hardened wrought carbon steels',
        abbreviation: 'V (carbon)',
        hardnessUnit: 'HV',
        contact: {
            'ML': [{ A: 0.963, B: 283, minHardness: 135, maxHardness: 210 }],
            'MQ': [{ A: 0.925, B: 360, minHardness: 135, maxHardness: 210 }],
            'ME': [{ A: 0.838, B: 432, minHardness: 135, maxHardness: 210 }]
        },
        bending: {
            'ML': [{ A: 0.250, B: 108, minHardness: 115, maxHardness: 215 }],
            'MQ': [{ A: 0.240, B: 163, minHardness: 115, maxHardness: 215 }],
            'ME': [{ A: 0.283, B: 202, minHardness: 115, maxHardness: 215 }]
        }
    },
    'V_alloy': {
        name: 'Through hardened wrought alloy steels',
        abbreviation: 'V (alloy)',
        hardnessUnit: 'HV',
        contact: {
            'ML': [{ A: 1.313, B: 188, minHardness: 200, maxHardness: 360 }],
            'MQ': [{ A: 1.313, B: 373, minHardness: 200, maxHardness: 360 }],
            'ME': [{ A: 2.213, B: 260, minHardness: 200, maxHardness: 390 }]
        },
        bending: {
            'ML': [{ A: 0.423, B: 104, minHardness: 200, maxHardness: 360 }],
            'MQ': [{ A: 0.425, B: 187, minHardness: 200, maxHardness: 360 }],
            'ME': [{ A: 0.358, B: 231, minHardness: 200, maxHardness: 390 }]
        }
    },

    // 4. Through hardened cast steels (Table 1, items 33 - 40)
    'V_cast_carbon': {
        name: 'Through hardened cast carbon steels',
        abbreviation: 'V (cast carbon)',
        hardnessUnit: 'HV',
        contact: {
            'ML': [{ A: 0.831, B: 300, minHardness: 130, maxHardness: 215 }],
            'MQ': [{ A: 0.831, B: 300, minHardness: 130, maxHardness: 215 }], // ML/MQ same
            'ME': [{ A: 0.951, B: 345, minHardness: 130, maxHardness: 215 }]
        },
        bending: {
            'ML': [{ A: 0.224, B: 117, minHardness: 130, maxHardness: 215 }],
            'MQ': [{ A: 0.224, B: 117, minHardness: 130, maxHardness: 215 }], // ML/MQ same
            'ME': [{ A: 0.286, B: 167, minHardness: 130, maxHardness: 215 }]
        }
    },
    'V_cast_alloy': {
        name: 'Through hardened cast alloy steels',
        abbreviation: 'V (cast alloy)',
        hardnessUnit: 'HV',
        contact: {
            'ML': [{ A: 1.276, B: 298, minHardness: 200, maxHardness: 360 }],
            'MQ': [{ A: 1.276, B: 298, minHardness: 200, maxHardness: 360 }], // ML/MQ same
            'ME': [{ A: 1.350, B: 356, minHardness: 200, maxHardness: 360 }]
        },
        bending: {
            'ML': [{ A: 0.364, B: 161, minHardness: 200, maxHardness: 360 }],
            'MQ': [{ A: 0.364, B: 161, minHardness: 200, maxHardness: 360 }], // ML/MQ same
            'ME': [{ A: 0.356, B: 186, minHardness: 200, maxHardness: 360 }]
        }
    },

    // 5. Case hardened wrought steels (Table 1, items 41 - 48)
    'Eh': {
        name: 'Case hardened wrought steels',
        abbreviation: 'Eh',
        hardnessUnit: 'HV',
        contact: {
            'ML': [{ A: 0.000, B: 1300, minHardness: 600, maxHardness: 800 }],
            'MQ': [{ A: 0.000, B: 1500, minHardness: 660, maxHardness: 800 }],
            'ME': [{ A: 0.000, B: 1650, minHardness: 660, maxHardness: 800 }]
        },
        bending: {
            // Note: For MQ, Table 1 specifies 3 distinct core hardness / Jominy conditions:
            // - core hardness >= 25 HRC lower (J=12mm < 28 HRC): B = 425
            // - core hardness >= 25 HRC upper (J=12mm >= 28 HRC): B = 461
            // - core hardness >= 30 HRC: B = 500
            'ML': [{ A: 0.000, B: 312, minHardness: 600, maxHardness: 800 }],
            'MQ': [
                // NEEDS REVIEW, SEE SECTION 5.3.1 and Table 1 item 45-47
                // Default MQ branch uses B = 461 (>=25 HRC upper); conditions can be matched via options.coreHardnessCondition
                { condition: 'core_25HRC_lower', A: 0.000, B: 425, minHardness: 660, maxHardness: 800 },
                { condition: 'core_25HRC_upper', A: 0.000, B: 461, minHardness: 660, maxHardness: 800 },
                { condition: 'core_30HRC', A: 0.000, B: 500, minHardness: 660, maxHardness: 800 }
            ],
            'ME': [{ A: 0.000, B: 525, minHardness: 660, maxHardness: 800 }]
        }
    },

    // 6. Flame- or induction-hardened wrought and cast steels (Table 1, items 49 - 55)
    'IF': {
        name: 'Flame- or induction-hardened wrought and cast steels',
        abbreviation: 'IF',
        hardnessUnit: 'HV',
        contact: {
            'ML': [{ A: 0.740, B: 602, minHardness: 485, maxHardness: 615 }],
            'MQ': [{ A: 0.541, B: 882, minHardness: 500, maxHardness: 615 }],
            'ME': [{ A: 0.505, B: 1013, minHardness: 500, maxHardness: 615 }]
        },
        bending: {
            'ML': [{ A: 0.305, B: 76, minHardness: 485, maxHardness: 615 }],
            // NEEDS REVIEW, SEE SECTION 5.5 and Table 1 item 53-54
            // For MQ, two hardness sub-ranges exist: 500-570 HV (A=0.138, B=290) and 570-615 HV (A=0, B=369)
            'MQ': [
                { A: 0.138, B: 290, minHardness: 500, maxHardness: 570 },
                { A: 0.000, B: 369, minHardness: 570, maxHardness: 615 }
            ],
            'ME': [{ A: 0.271, B: 237, minHardness: 500, maxHardness: 615 }]
        }
    },

    // 7. Nitrided wrought steels / nitriding steels (Table 1, items 56 - 58, 62 - 64)
    'NT_nitr': {
        name: 'Nitrided wrought nitriding steels',
        abbreviation: 'NT (nitr.)',
        hardnessUnit: 'HV',
        contact: {
            'ML': [{ A: 0.000, B: 1125, minHardness: 650, maxHardness: 900 }],
            'MQ': [{ A: 0.000, B: 1250, minHardness: 650, maxHardness: 900 }],
            'ME': [{ A: 0.000, B: 1450, minHardness: 650, maxHardness: 900 }]
        },
        bending: {
            'ML': [{ A: 0.000, B: 270, minHardness: 650, maxHardness: 900 }],
            'MQ': [{ A: 0.000, B: 420, minHardness: 650, maxHardness: 900 }],
            'ME': [{ A: 0.000, B: 468, minHardness: 650, maxHardness: 900 }]
        }
    },

    // 8. Through hardening steels, nitrided (Table 1, items 59 - 61, 65 - 67)
    'NV_nitr': {
        name: 'Through hardening steels, nitrided',
        abbreviation: 'NV (nitr.)',
        hardnessUnit: 'HV',
        contact: {
            'ML': [{ A: 0.000, B: 788, minHardness: 450, maxHardness: 650 }],
            'MQ': [{ A: 0.000, B: 998, minHardness: 450, maxHardness: 650 }],
            'ME': [{ A: 0.000, B: 1217, minHardness: 450, maxHardness: 650 }]
        },
        bending: {
            'ML': [{ A: 0.000, B: 258, minHardness: 450, maxHardness: 650 }],
            'MQ': [{ A: 0.000, B: 363, minHardness: 450, maxHardness: 650 }],
            'ME': [{ A: 0.000, B: 432, minHardness: 450, maxHardness: 650 }]
        }
    },

    // 9. Wrought steels nitrocarburized (Table 1, items 68 - 73)
    'NV_nitrocar': {
        name: 'Wrought steels nitrocarburized',
        abbreviation: 'NV (nitrocar.)',
        hardnessUnit: 'HV',
        contact: {
            'ML': [{ A: 0.000, B: 650, minHardness: 300, maxHardness: 650 }],
            // NEEDS REVIEW, SEE SECTION 5.5 and Table 1 item 69-70
            // MQ/ME share the same curve: 300-450 HV (A=1.167, B=425) and 450-650 HV (A=0, B=950)
            'MQ': [
                { A: 1.167, B: 425, minHardness: 300, maxHardness: 450 },
                { A: 0.000, B: 950, minHardness: 450, maxHardness: 650 }
            ],
            'ME': [
                { A: 1.167, B: 425, minHardness: 300, maxHardness: 450 },
                { A: 0.000, B: 950, minHardness: 450, maxHardness: 650 }
            ]
        },
        bending: {
            'ML': [{ A: 0.000, B: 224, minHardness: 300, maxHardness: 650 }],
            // NEEDS REVIEW, SEE SECTION 5.5 and Table 1 item 72-73
            // MQ/ME share the same curve: 300-450 HV (A=0.653, B=94) and 450-650 HV (A=0, B=388)
            'MQ': [
                { A: 0.653, B: 94, minHardness: 300, maxHardness: 450 },
                { A: 0.000, B: 388, minHardness: 450, maxHardness: 650 }
            ],
            'ME': [
                { A: 0.653, B: 94, minHardness: 300, maxHardness: 450 },
                { A: 0.000, B: 388, minHardness: 450, maxHardness: 650 }
            ]
        }
    }
};

/**
 * Normalizes material identifier string or object to an internal key.
 * @param {string} materialKey
 * @returns {string}
 */
function resolveMaterialKey(materialKey) {
    if (!materialKey || typeof materialKey !== 'string') return 'Eh';
    const key = materialKey.trim().toLowerCase();

    if (key.includes('cast carbon') || key === 'v_cast_carbon') return 'V_cast_carbon';
    if (key.includes('cast alloy') || key === 'v_cast_alloy') return 'V_cast_alloy';
    if (key.includes('carbon') && key.startsWith('v')) return 'V_carbon';
    if (key.includes('alloy') && key.startsWith('v')) return 'V_alloy';
    if (key === 'st (cast)' || key.includes('st_cast') || key.includes('cast steel')) return 'St_cast';
    if (key === 'st' || key.includes('normalized')) return 'St_wrought';
    if (key.includes('gts')) return 'GTS_perl';
    if (key.includes('ggg')) return 'GGG';
    if (key.includes('gg')) return 'GG';
    if (key.includes('nitrocar') || key === 'nv(nitrocar.)') return 'NV_nitrocar';
    if (key.includes('nt') || key.includes('nitriding')) return 'NT_nitr';
    if (key.includes('nv') || key.includes('through hardening steels nitrided')) return 'NV_nitr';
    if (key.includes('if') || key.includes('induction') || key.includes('flame')) return 'IF';
    if (key.includes('eh') || key.includes('case')) return 'Eh';

    if (ISO_6336_5_TABLE_1[materialKey]) return materialKey;
    return 'Eh';
}

/**
 * Calculates the allowable contact stress number (sigma_H_lim).
 * Reference: ISO 6336-5:2016 Clause 5.2, 5.5, Table 1 (Formula 2)
 * Formula: sigma_H_lim = A * x + B
 * 
 * @param {string} materialKey - Material identifier (e.g., 'Eh', 'V_alloy', 'St_wrought', 'GGG', 'IF', etc.)
 * @param {string} [qualityClass='MQ'] - Material quality class: 'ML', 'MQ', or 'ME'
 * @param {number} [surfaceHardness] - Surface hardness in appropriate units (HBW or HV). If omitted, midpoint of valid range is used.
 * @param {Object} [options={}] - Additional options (e.g. allowExtrapolation)
 * @returns {Object} result - { success: boolean, value: number, hardness: number, hardnessUnit: string, minHardness: number, maxHardness: number, error?: string, warning?: string }
 */
function calculateAllowableContactStress_sigmaHlim(materialKey, qualityClass = 'MQ', surfaceHardness, options = {}) {
    const matKey = resolveMaterialKey(materialKey);
    const materialData = ISO_6336_5_TABLE_1[matKey];
    if (!materialData) {
        return { success: false, error: `Unknown material key '${materialKey}'.` };
    }

    const qClass = (qualityClass || 'MQ').toUpperCase().trim();
    if (!['ML', 'MQ', 'ME'].includes(qClass)) {
        return { success: false, error: `Invalid quality class '${qualityClass}'. Expected 'ML', 'MQ', or 'ME'.` };
    }

    const segments = materialData.contact[qClass];
    if (!segments || segments.length === 0) {
        return { success: false, error: `No contact stress data found for ${matKey} with quality ${qClass}.` };
    }

    // Determine overall hardness span
    const minOverall = segments[0].minHardness;
    const maxOverall = segments[segments.length - 1].maxHardness;

    // Use default midpoint if surface hardness is unspecified
    let x = (surfaceHardness !== undefined && !isNaN(surfaceHardness)) ? Number(surfaceHardness) : (minOverall + maxOverall) / 2.0;

    let warning;
    if (x < minOverall || x > maxOverall) {
        if (options.allowExtrapolation) {
            warning = `Hardness ${x} ${materialData.hardnessUnit} is outside standard ISO 6336-5 Table 1 range [${minOverall}, ${maxOverall}].`;
        } else {
            // Clamping per Section 5.4 note: values exceeding range are subject to agreement
            warning = `Hardness ${x} ${materialData.hardnessUnit} was outside Table 1 range [${minOverall}, ${maxOverall}] and was clamped.`;
            x = Math.max(minOverall, Math.min(maxOverall, x));
        }
    }

    // Match segment by hardness range
    let selectedSeg = segments[0];
    for (const seg of segments) {
        if (x >= seg.minHardness && x <= seg.maxHardness) {
            selectedSeg = seg;
            break;
        }
        if (x > seg.maxHardness) {
            selectedSeg = seg; // fallthrough to upper segment
        }
    }

    // Formula (2): sigma_H_lim = A * x + B
    const sigmaHlim = selectedSeg.A * x + selectedSeg.B;

    return {
        success: true,
        value: sigmaHlim,
        hardness: x,
        hardnessUnit: materialData.hardnessUnit,
        minHardness: minOverall,
        maxHardness: maxOverall,
        A: selectedSeg.A,
        B: selectedSeg.B,
        warning: warning
    };
}

/**
 * Calculates the nominal bending stress number (sigma_F_lim).
 * Reference: ISO 6336-5:2016 Clause 5.3.1, 5.5, Table 1 (Formula 2)
 * Formula: sigma_F_lim = A * x + B
 * 
 * @param {string} materialKey - Material identifier (e.g., 'Eh', 'V_alloy', 'St_wrought', 'GGG', 'IF', etc.)
 * @param {string} [qualityClass='MQ'] - Material quality class: 'ML', 'MQ', or 'ME'
 * @param {number} [surfaceHardness] - Surface hardness in appropriate units (HBW or HV). If omitted, midpoint of valid range is used.
 * @param {Object} [options={}] - Additional options (coreHardnessCondition, reversedBending, allowExtrapolation)
 * @returns {Object} result - { success: boolean, value: number, sigmaFE: number, hardness: number, hardnessUnit: string, minHardness: number, maxHardness: number, error?: string, warning?: string }
 */
function calculateNominalBendingStress_sigmaFlim(materialKey, qualityClass = 'MQ', surfaceHardness, options = {}) {
    const matKey = resolveMaterialKey(materialKey);
    const materialData = ISO_6336_5_TABLE_1[matKey];
    if (!materialData) {
        return { success: false, error: `Unknown material key '${materialKey}'.` };
    }

    const qClass = (qualityClass || 'MQ').toUpperCase().trim();
    if (!['ML', 'MQ', 'ME'].includes(qClass)) {
        return { success: false, error: `Invalid quality class '${qualityClass}'. Expected 'ML', 'MQ', or 'ME'.` };
    }

    const segments = materialData.bending[qClass];
    if (!segments || segments.length === 0) {
        return { success: false, error: `No bending stress data found for ${matKey} with quality ${qClass}.` };
    }

    // Handle case hardened MQ multi-branch conditions (Table 1 items 45-47)
    let selectedSeg = segments[0];
    if (matKey === 'Eh' && qClass === 'MQ') {
        const cond = options.coreHardnessCondition || 'core_25HRC_upper';
        const match = segments.find(s => s.condition === cond);
        selectedSeg = match || segments[1]; // default to core_25HRC_upper (B=461)
    }

    const minOverall = segments[0].minHardness;
    const maxOverall = segments[segments.length - 1].maxHardness;

    let x = (surfaceHardness !== undefined && !isNaN(surfaceHardness)) ? Number(surfaceHardness) : (minOverall + maxOverall) / 2.0;

    let warning;
    if (x < minOverall || x > maxOverall) {
        if (options.allowExtrapolation) {
            warning = `Hardness ${x} ${materialData.hardnessUnit} is outside standard ISO 6336-5 Table 1 range [${minOverall}, ${maxOverall}].`;
        } else {
            warning = `Hardness ${x} ${materialData.hardnessUnit} was outside Table 1 range [${minOverall}, ${maxOverall}] and was clamped.`;
            x = Math.max(minOverall, Math.min(maxOverall, x));
        }
    }

    // If multi-segment by hardness range (e.g. IF MQ or NV nitrocarburized MQ/ME)
    if (segments.length > 1 && !(matKey === 'Eh' && qClass === 'MQ')) {
        for (const seg of segments) {
            if (x >= seg.minHardness && x <= seg.maxHardness) {
                selectedSeg = seg;
                break;
            }
            if (x > seg.maxHardness) {
                selectedSeg = seg;
            }
        }
    }

    // Formula (2): sigma_F_lim = A * x + B
    let sigmaFlim = selectedSeg.A * x + selectedSeg.B;

    // Clause 5.3.2 Formula (1): sigma_FE = sigma_F_lim * YST, where YST = 2.0
    const YST = 2.0;
    let sigmaFE = sigmaFlim * YST;

    // Clause 5.3.3: Reversed bending reduction (e.g., idler gears with full load reversal: factor 0.7)
    if (options.reversedBending) {
        sigmaFlim *= 0.7;
        sigmaFE *= 0.7;
    }

    return {
        success: true,
        value: sigmaFlim,
        sigmaFE: sigmaFE,
        hardness: x,
        hardnessUnit: materialData.hardnessUnit,
        minHardness: minOverall,
        maxHardness: maxOverall,
        A: selectedSeg.A,
        B: selectedSeg.B,
        warning: warning
    };
}

/**
 * Calculates Case Depth of Carburized and Hardened Gears (CHD_opt, CHD_c, CHD_min, CHD_max).
 * Reference: ISO 6336-5:2016 Clause 5.6.2, Formulae (3) & (4), Figure 17
 * 
 * @param {Object} params
 * @param {number} params.mn - Normal module (mm)
 * @param {number} [params.sigmaH=1000] - Contact stress (N/mm^2)
 * @param {number} [params.dw1=50] - Working pitch diameter pinion (mm)
 * @param {number} [params.alpha_wt=20] - Working transverse pressure angle (degrees)
 * @param {number} [params.beta_b=0] - Base helix angle (degrees)
 * @param {number} [params.z1=25] - Teeth pinion
 * @param {number} [params.z2=50] - Teeth wheel
 * @param {string} [params.qualityClass='MQ'] - 'ML', 'MQ', or 'ME'
 * @returns {Object} result - { success: boolean, CHDH_opt, CHDF_opt_min, CHDF_opt_max, CHDc, CHD_min, CHD_max, error?: string }
 */
function calculateCarburizedCaseDepth(params = {}) {
    const mn = Number(params.mn);
    if (isNaN(mn) || mn <= 0) {
        return { success: false, error: 'Normal module mn must be positive.' };
    }

    const sigmaH = Number(params.sigmaH) || 1000.0;
    const dw1 = Number(params.dw1) || (params.z1 ? params.z1 * mn : 50.0);
    const alpha_wt = Number(params.alpha_wt) || 20.0;
    const beta_b = Number(params.beta_b) || 0;
    const z1 = Number(params.z1) || 25;
    const z2 = Number(params.z2) || 50;
    const qClass = (params.qualityClass || 'MQ').toUpperCase().trim();

    // Clause 5.6.2 a) & Figure 17: Optimum case depth regarding surface load capacity
    // Formula from Figure 17: CHDH_opt = 0.15 * mn for mn <= 10; or 0.083 * mn + 0.67 for larger mn
    const CHDH_opt = (mn <= 10.0) ? (0.15 * mn) : (0.083 * mn + 0.67);

    // Clause 5.6.2 b) Formula (3): Optimum case depth regarding root bending
    const CHDF_opt_min = 0.10 * mn;
    const CHDF_opt_max = 0.20 * mn;

    // Clause 5.6.2 c) Formula (4): Case depth regarding case-crushing CHDc
    const awtRad = alpha_wt * (Math.PI / 180);
    const bbRad = beta_b * (Math.PI / 180);
    const UH = (qClass === 'ML') ? 44000.0 : 66000.0;
    const gearRatioTerm = z2 / (z1 + z2);
    const CHDc = (sigmaH * dw1 * Math.sin(awtRad) / (UH * Math.cos(bbRad))) * gearRatioTerm;

    // Clause 5.6.2 d): Minimum and maximum limits
    const CHD_min = 0.3; // mm
    const CHD_max = Math.min(6.0, 0.4 * mn); // mm

    return {
        success: true,
        CHDH_opt: CHDH_opt,
        CHDF_opt_min: CHDF_opt_min,
        CHDF_opt_max: CHDF_opt_max,
        CHDc: CHDc,
        CHD_min: CHD_min,
        CHD_max: CHD_max
    };
}

/**
 * Returns comprehensive material strength properties and limits for ISO 6336 gear rating.
 * Reference: ISO 6336-5:2016
 * 
 * @param {string} materialKey - Material abbreviation or designation
 * @param {string} [qualityClass='MQ'] - 'ML', 'MQ', or 'ME'
 * @param {number} [surfaceHardness] - Hardness in HBW or HV
 * @param {Object} [options={}] - Additional parameters
 * @returns {Object} result - Combined material evaluation object
 */
function getMaterialStrength(materialKey = 'Eh', qualityClass = 'MQ', surfaceHardness, options = {}) {
    const contactResult = calculateAllowableContactStress_sigmaHlim(materialKey, qualityClass, surfaceHardness, options);
    const bendingResult = calculateNominalBendingStress_sigmaFlim(materialKey, qualityClass, surfaceHardness, options);

    if (!contactResult.success) return contactResult;
    if (!bendingResult.success) return bendingResult;

    const matKey = resolveMaterialKey(materialKey);
    const matData = ISO_6336_5_TABLE_1[matKey];

    return {
        success: true,
        material: matKey,
        materialName: matData.name,
        qualityClass: qualityClass.toUpperCase(),
        hardness: contactResult.hardness,
        hardnessUnit: matData.hardnessUnit,
        minHardness: contactResult.minHardness,
        maxHardness: contactResult.maxHardness,
        sigma_H_lim: contactResult.value,
        sigma_F_lim: bendingResult.value,
        sigma_FE: bendingResult.sigmaFE,
        warnings: [contactResult.warning, bendingResult.warning].filter(Boolean)
    };
}

