/**
 * Generates and displays the PDF-friendly Gear Design Calculation Report.
 * @param {string|null} currentPower 
 */
function generateReport(currentPower) {
    const projNameInput = document.getElementById('project-name').value.trim();
    const reportTitle = projNameInput ? `Report - ${projNameInput}` : 'Gear Design Calculation Report';

    const reportContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>${reportTitle}</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Outfit', sans-serif; padding: 40px; background-color: #f8f9fa; color: #212529; }
                .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 650px; margin: auto; }
                .header-row { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0056b3; padding-bottom: 15px; margin-bottom: 20px;}
                h1 { color: #0056b3; margin: 0; border-bottom: none; padding-bottom: 0; font-size: 1.8rem; }
                h2 { margin-top: 35px; color: #495057; font-size: 1.3rem; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; }
                .data-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #dee2e6; }
                .data-label { font-weight: 500; color: #6c757d; }
                .data-val { color: #0056b3; font-weight: 600; font-size: 1.1rem; }
                .error { color: #dc3545; }
                
                .btn { background-color: #0056b3; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-family: 'Outfit', sans-serif; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s; }
                .btn:hover { background-color: #004494; transform: translateY(-1px); }

                @media print {
                    .no-print { display: none !important; }
                    body { background-color: white; padding: 0; }
                    .card { box-shadow: none; padding: 0; max-width: 100%; border: none; }
                    .header-row { border-bottom: 2px solid black; }
                    h1 { color: black; }
                    .data-val { color: black; }
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header-row">
                    <h1>${reportTitle}</h1>
                    <button class="btn no-print" onclick="window.print()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Save as PDF
                    </button>
                </div>
                
                <h2>1. Basic Data Results</h2>
                <div class="data-row">
                    <span class="data-label">Configuration:</span>
                    <span class="data-val">${document.getElementById('gear-config').options[document.getElementById('gear-config').selectedIndex].text}</span>
                </div>
                ${(() => {
            const config = document.getElementById('gear-config').value;
            let cdHTML = '';
            if (config === 'pair' || config === 'planetary') {
                cdHTML += `<div class="data-row"><span class="data-label">Working Center Distance (a<sub>w</sub>):</span><span class="data-val">${document.getElementById('aw1').value || '-'} mm</span></div>`;
            } else if (config === '3-train') {
                cdHTML += `<div class="data-row"><span class="data-label">Working Center Distance, Gear 1-2 (a<sub>w,12</sub>):</span><span class="data-val">${document.getElementById('aw1').value || '-'} mm</span></div>`;
                cdHTML += `<div class="data-row"><span class="data-label">Working Center Distance, Gear 2-3 (a<sub>w,23</sub>):</span><span class="data-val">${document.getElementById('aw2').value || '-'} mm</span></div>`;
            } else if (config === '4-train') {
                cdHTML += `<div class="data-row"><span class="data-label">Working Center Distance, Gear 1-2 (a<sub>w,12</sub>):</span><span class="data-val">${document.getElementById('aw1').value || '-'} mm</span></div>`;
                cdHTML += `<div class="data-row"><span class="data-label">Working Center Distance, Gear 2-3 (a<sub>w,23</sub>):</span><span class="data-val">${document.getElementById('aw2').value || '-'} mm</span></div>`;
                cdHTML += `<div class="data-row"><span class="data-label">Working Center Distance, Gear 3-4 (a<sub>w,34</sub>):</span><span class="data-val">${document.getElementById('aw3').value || '-'} mm</span></div>`;
            }
            return cdHTML;
        })()}
                <div class="data-row">
                    <span class="data-label">Gear 1 Hand of Helix:</span>
                    <span class="data-val">${document.getElementById('gear1-helix-hand-out') ? document.getElementById('gear1-helix-hand-out').textContent : '-'}</span>
                </div>

                <h2>2. Gear Properties</h2>
                ${(() => {
            const config = document.getElementById('gear-config').value;
            let gearsCount = 2;
            if (config === 'planetary' || config === '3-train') gearsCount = 3;
            if (config === '4-train') gearsCount = 4;

            let propsHTML = '';
            for (let i = 1; i <= gearsCount; i++) {
                const title = (config === 'planetary' && i === 3) ? 'Gear 3 (Ring)' : `Gear ${i}`;
                const z = document.getElementById('z' + i).value || '-';
                const b = document.getElementById('b' + i).value || '-';

                let x = '-';
                if (i === 1) {
                    x = document.getElementById('x1').value || '-';
                } else {
                    const xOut = document.getElementById('x' + i + '-out');
                    x = (xOut && xOut.textContent !== '--') ? xOut.textContent : '-';
                }

                let d = '-';
                const dOut = document.getElementById('d' + i + '-out');
                if (dOut && dOut.textContent !== '--') d = dOut.textContent;

                propsHTML += `
                            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dotted #ccc;">
                                <h4 style="margin: 0 0 5px 0; color: #0056b3;">${title}</h4>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Teeth (z<sub>${i}</sub>):</span> <span class="data-val">${z}</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Reference Diameter (d<sub>${i}</sub>):</span> <span class="data-val">${d}</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Base Diameter (d<sub>b${i}</sub>):</span> <span class="data-val">${(() => {
                        const dbOut = document.getElementById('db' + i + '-out');
                        return (dbOut && dbOut.textContent !== '--') ? dbOut.textContent : '-';
                    })()}</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Facewidth (b<sub>${i}</sub>):</span> <span class="data-val">${b} mm</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Profile Shift (x<sub>${i}</sub>):</span> <span class="data-val">${x}</span></div>
                            </div>
                        `;
            }
            return propsHTML;
        })()}

                <h2>3. Profile Parameters</h2>
                ${(() => {
            const config = document.getElementById('gear-config').value;
            const mn = parseFloat(document.getElementById('module')?.value) || 0;
            let gearsCount = 2;
            if (config === 'planetary' || config === '3-train') gearsCount = 3;
            if (config === '4-train') gearsCount = 4;

            let profHTML = '';
            for (let i = 1; i <= gearsCount; i++) {
                const title = (config === 'planetary' && i === 3) ? 'Gear 3 (Ring)' : `Gear ${i}`;

                const toolSelect = document.getElementById('tool-type-' + i);
                const refSelect = document.getElementById('reference-profile-' + i);

                const tool = toolSelect ? toolSelect.options[toolSelect.selectedIndex].text : '-';
                const ref = refSelect ? refSelect.options[refSelect.selectedIndex].text : '-';

                const addC = document.getElementById('addendum-coeff-' + i).value || '-';
                const dedC = document.getElementById('dedendum-coeff-' + i).value || '-';
                const rtC = document.getElementById('root-radius-coeff-' + i).value || '-';
                const tipAVal = parseFloat(document.getElementById('tip-alteration-' + i).value);
                const tipAMm = !isNaN(tipAVal) ? tipAVal.toFixed(3) + ' mm' : '-';
                const tipK = document.getElementById('tip-alteration-coeff-' + i)?.textContent || (!isNaN(tipAVal) && mn > 0 ? (tipAVal / mn).toFixed(4) : '-');
                const cutterTeeth = document.getElementById('cutter-teeth-' + i).value || '-';

                profHTML += `
                            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dotted #ccc;">
                                <h4 style="margin: 0 0 5px 0; color: #0056b3;">${title}</h4>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Manufacturing Process:</span> <span class="data-val">${tool}</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Cutter Teeth:</span> <span class="data-val">${cutterTeeth}</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Ref Profile:</span> <span class="data-val">${ref}</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Addendum Coeff:</span> <span class="data-val">${addC}</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Dedendum Coeff:</span> <span class="data-val">${dedC}</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Root Radius Coeff.:</span> <span class="data-val">${rtC}</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Tip Alteration (k&middot;m<sub>n</sub>):</span> <span class="data-val">${tipAMm}</span></div>
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Tip Alteration Coefficient (k):</span> <span class="data-val">${tipK}</span></div>
                            </div>
                        `;
            }
            return profHTML;
        })()}


                <h2>4. Rating Data Results</h2>
                ${(() => {
            const config = document.getElementById('gear-config').value;
            let gearsCount = 2;
            if (config === 'planetary' || config === '3-train') gearsCount = 3;
            if (config === '4-train') gearsCount = 4;
            let matHTML = '';
            for (let i = 1; i <= gearsCount; i++) {
                const title = (config === 'planetary' && i === 3) ? 'Gear 3 (Ring)' : `Gear ${i}`;
                const matSelect = document.getElementById('mat' + i);
                const qualSelect = document.getElementById('mat-qual-' + i);
                const hardInput = document.getElementById('mat-hard-' + i);
                const hardLabel = document.getElementById('mat-hard-label-' + i);
                const sigHOut = document.getElementById('sigma-H-lim-' + i + '-out');
                const sigFOut = document.getElementById('sigma-F-lim-' + i + '-out');

                const mat = (matSelect && matSelect.selectedIndex >= 0) ? matSelect.options[matSelect.selectedIndex].text : '-';
                const qual = (qualSelect && qualSelect.selectedIndex >= 0) ? qualSelect.options[qualSelect.selectedIndex].text : '-';
                const hard = (hardInput && hardInput.value !== '') ? hardInput.value : '-';
                const unit = hardLabel ? (hardLabel.textContent.includes('HBW') ? 'HBW' : 'HV') : '';
                const sigH = sigHOut ? sigHOut.textContent : '--';
                const sigF = sigFOut ? sigFOut.textContent : '--';

                const chdInput = document.getElementById('chd-' + i);
                const chdVal = (chdInput && chdInput.value !== '') ? `${chdInput.value} mm` : 'Auto (0.2 × mn)';

                const coreHardInput = document.getElementById('core-hard-' + i);
                const coreHardVal = (coreHardInput && coreHardInput.value !== '') ? `${coreHardInput.value} HV` : '350 HV (Default)';

                matHTML += `<div style="margin-bottom: 8px;">
                    <div class="data-row" style="padding: 2px 0; border: none; font-weight: 600;"><span class="data-label">${title}:</span><span class="data-val">${mat}</span></div>
                    <div class="data-row" style="padding: 2px 0; border: none; padding-left: 15px;"><span class="data-label">Quality:</span><span class="data-val">${qual}</span></div>
                    <div class="data-row" style="padding: 2px 0; border: none; padding-left: 15px;"><span class="data-label">Surface Hardness:</span><span class="data-val">${hard} ${unit}</span></div>
                    <div class="data-row" style="padding: 2px 0; border: none; padding-left: 15px;"><span class="data-label">Core Hardness:</span><span class="data-val">${coreHardVal}</span></div>
                    <div class="data-row" style="padding: 2px 0; border: none; padding-left: 15px;"><span class="data-label">Case Depth (CHD<sub>550HV</sub>):</span><span class="data-val">${chdVal}</span></div>
                    <div class="data-row" style="padding: 2px 0; border: none; padding-left: 15px;"><span class="data-label">&sigma;<sub>H lim</sub>:</span><span class="data-val">${sigH}</span></div>
                    <div class="data-row" style="padding: 2px 0; border: none; padding-left: 15px;"><span class="data-label">&sigma;<sub>F lim</sub>:</span><span class="data-val">${sigF}</span></div>
                </div>`;
            }
            return matHTML;
        })()}
                <div class="data-row" style="margin-top: 10px; margin-bottom: 6px; border-top: 1px dotted #ccc; padding-top: 8px;">
                    <span class="data-label" style="font-weight: 600;">Operating Parameters:</span>
                </div>
                ${(() => {
            const config = document.getElementById('gear-config').value;
            let gearsCount = 2;
            if (config === 'planetary' || config === '3-train') gearsCount = 3;
            if (config === '4-train') gearsCount = 4;
            const refGearVal = (document.querySelector('input[name="reference-gear"]:checked') || {}).value || '1';
            let opHTML = '<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 0.95rem;">';
            opHTML += '<thead><tr style="border-bottom: 1px solid #ccc; text-align: left;"><th style="padding: 4px;">Gear</th><th style="padding: 4px;">Speed (RPM)</th><th style="padding: 4px;">Torque (Nm)</th><th style="padding: 4px;">Power (kW)</th><th style="padding: 4px;">Role</th></tr></thead><tbody>';
            for (let i = 1; i <= gearsCount; i++) {
                const isRef = String(i) === String(refGearVal);
                let title = `Gear ${i}`;
                let role = isRef ? 'Reference' : 'Output';
                if (config === 'planetary') {
                    if (i === 1) {
                        title = 'Gear 1 (Sun)';
                        role = isRef ? 'Reference (Input)' : 'Input';
                    } else if (i === 2) {
                        title = 'Carrier';
                        role = isRef ? 'Reference (Output)' : 'Output';
                    } else if (i === 3) {
                        title = 'Gear 3 (Ring)';
                        role = 'Fixed (Reaction)';
                    }
                }
                const speedVal = document.getElementById('speed-' + i)?.value || '-';
                const torqueVal = document.getElementById('torque-' + i)?.value || '-';
                const powerVal = document.getElementById('power-' + i)?.value || '-';
                opHTML += `<tr style="border-bottom: 1px dotted #eee;"><td style="padding: 4px; font-weight: 500;">${title}</td><td style="padding: 4px;">${speedVal}</td><td style="padding: 4px;">${torqueVal}</td><td style="padding: 4px;">${powerVal}</td><td style="padding: 4px; color: ${isRef ? '#0056b3' : (config === 'planetary' && i === 3 ? '#6c757d' : '#28a745')}; font-weight: ${isRef ? '600' : 'normal'};">${role}</td></tr>`;
            }
            opHTML += '</tbody></table>';
            return opHTML;
        })()}
                <div class="data-row" style="margin-top: 6px; border-top: 1px dotted #ccc;">
                    <span class="data-label">Transmitted Power:</span>
                    <span class="data-val ${!currentPower ? 'error' : ''}">${currentPower || 'Calculation Failed / Missing Data'}</span>
                </div>
                <div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Target Design Life:</span><span class="data-val">${document.getElementById('target-life-hours')?.value || '20000'} Hours</span></div>
                <div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Application Factor (K<sub>A</sub>):</span><span class="data-val">${document.getElementById('ka-factor')?.value || '1.25'}</span></div>
                <div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Mesh Load Factor (K<sub>&gamma;</sub>):</span><span class="data-val" style="${parseFloat(document.getElementById('k-gamma-factor')?.value||1)>1?'color:#e3b341;font-weight:600;':''}">${document.getElementById('k-gamma-factor')?.value || '1.0'}</span></div>
                <div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Reversed Bending Checkbox:</span><span class="data-val">${document.getElementById('reversed-bending-check')?.checked ? 'Yes (Y<sub>M</sub> = 0.7 applied)' : 'No (Idlers/Planets auto-derated)'}</span></div>
                <div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Lubricant:</span><span class="data-val">${document.getElementById('lube-type')?.options[document.getElementById('lube-type').selectedIndex]?.text || '-'}, ISO VG ${document.getElementById('viscosity-grade')?.value || '220'} @ ${document.getElementById('oil-temp')?.value || '70'}&deg;C (${document.getElementById('lube-method')?.options[document.getElementById('lube-method').selectedIndex]?.text || '-'})</span></div>

                <h2>4. ISO 6336 Rating Results &amp; Safety Factors</h2>
                ${(() => {
            if (!window.isoRatingResults || window.isoRatingResults.length === 0) {
                return '<div style="color: #6c757d; font-style: italic;">No rating results calculated.</div>';
            }
            let rateHTML = '<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 0.88rem;">';
            rateHTML += '<thead><tr style="border-bottom: 2px solid #0056b3; text-align: left;"><th style="padding: 6px;">Mesh</th><th style="padding: 6px;">S<sub>H1</sub> / S<sub>H2</sub></th><th style="padding: 6px;">S<sub>F1</sub> / S<sub>F2</sub></th><th style="padding: 6px;">S<sub>FF1</sub> / S<sub>FF2</sub></th><th style="padding: 6px;">Pitting Life</th><th style="padding: 6px;">Bending Life</th></tr></thead><tbody>';
            window.isoRatingResults.forEach(r => {
                const shText = `${r.SH1.toFixed(2)} / ${r.SH2.toFixed(2)}`;
                const sfText = `${r.SF1.toFixed(2)} / ${r.SF2.toFixed(2)}`;
                const sffText = (r.SFF1 !== undefined && r.SFF2 !== undefined) ? `${r.SFF1.toFixed(2)} / ${r.SFF2.toFixed(2)}` : (r.SFF !== undefined ? r.SFF.toFixed(2) : '-');
                const sffPass = (r.SFF1 >= 1.2 && r.SFF2 >= 1.2);
                const pitLife = (r.lifePitting1 && r.lifePitting2) ? `${r.lifePitting1} / ${r.lifePitting2}` : '-';
                const bendLife = (r.lifeBending1 && r.lifeBending2) ? `${r.lifeBending1} / ${r.lifeBending2}` : '-';
                rateHTML += `<tr style="border-bottom: 1px dotted #ccc;"><td style="padding: 6px; font-weight: 600;">${r.meshTitle}</td><td style="padding: 6px; color: ${r.SH1 < 1.0 || r.SH2 < 1.0 ? '#dc3545' : '#28a745'}; font-weight: 600;">${shText}</td><td style="padding: 6px; color: ${r.SF1 < 1.4 || r.SF2 < 1.4 ? '#dc3545' : '#28a745'}; font-weight: 600;">${sfText}</td><td style="padding: 6px; color: ${sffPass ? '#28a745' : '#dc3545'}; font-weight: 600;">${sffText}</td><td style="padding: 6px; font-size: 0.82rem;">${pitLife}</td><td style="padding: 6px; font-size: 0.82rem;">${bendLife}</td></tr>`;
            });
            rateHTML += '</tbody></table>';
            return rateHTML;
        })()}

                <h2>5. Tolerances Data</h2>
                ${(() => {
            const config = document.getElementById('gear-config').value;
            let tolHTML = '';

            // Center Distance Tolerances
            let meshTolsHTML = '<div style="margin-bottom: 20px;">';
            meshTolsHTML += '<div style="font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #ccc;">Center Distance Tolerances</div>';

            const meshes = [
                { id: 1, title: config === 'planetary' ? 'Sun-Planet Mesh (1-2)' : 'Mesh 1-2' },
                { id: 2, title: config === 'planetary' ? 'Planet-Ring Mesh (2-3)' : 'Mesh 2-3' },
                { id: 3, title: 'Mesh 3-4' }
            ];

            let hasMeshTol = false;
            meshes.forEach(m => {
                const group = document.getElementById('aw-tol-group-' + m.id);
                if (group && !group.classList.contains('hidden')) {
                    const tol = document.getElementById('aw-tol-' + m.id).value || '-';
                    meshTolsHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">${m.title}:</span><span class="data-val">&plusmn; ${tol} mm</span></div>`;
                    hasMeshTol = true;
                }
            });
            meshTolsHTML += '</div>';
            if (hasMeshTol) tolHTML += meshTolsHTML;

            let gearsCount = 2;
            if (config === 'planetary' || config === '3-train') gearsCount = 3;
            if (config === '4-train') gearsCount = 4;

            for (let i = 1; i <= gearsCount; i++) {
                const title = (config === 'planetary' && i === 3) ? 'Gear 3 (Ring)' : `Gear ${i}`;
                const tolInput = document.getElementById('quality-grade-' + i);
                const val = tolInput ? tolInput.value || '-' : '-';

                const fpTOut = document.getElementById('fpt-' + i + '-out');
                const fpTVal = (fpTOut && fpTOut.textContent !== '--') ? fpTOut.textContent + ' &mu;m' : '-';

                const FpTOut = document.getElementById('Fpt-' + i + '-out');
                const FpTVal = (FpTOut && FpTOut.textContent !== '--') ? FpTOut.textContent + ' &mu;m' : '-';

                const FrTOut = document.getElementById('Frt-' + i + '-out');
                const FrTVal = (FrTOut && FrTOut.textContent !== '--') ? FrTOut.textContent + ' &mu;m' : '-';

                const ffalphaOut = document.getElementById('ffalpha-' + i + '-out');
                const ffalphaVal = (ffalphaOut && ffalphaOut.textContent !== '--') ? ffalphaOut.textContent + ' &mu;m' : '-';

                const FalphaOut = document.getElementById('Falpha-' + i + '-out');
                const FalphaVal = (FalphaOut && FalphaOut.textContent !== '--') ? FalphaOut.textContent + ' &mu;m' : '-';

                const fHbetaOut = document.getElementById('fHbeta-' + i + '-out');
                const fHbetaVal = (fHbetaOut && fHbetaOut.textContent !== '--') ? '&plusmn; ' + fHbetaOut.textContent + ' &mu;m' : '-';

                const ffbetaOut = document.getElementById('ffbeta-' + i + '-out');
                const ffbetaVal = (ffbetaOut && ffbetaOut.textContent !== '--') ? ffbetaOut.textContent + ' &mu;m' : '-';

                const FbetaOut = document.getElementById('Fbeta-' + i + '-out');
                const FbetaVal = (FbetaOut && FbetaOut.textContent !== '--') ? FbetaOut.textContent + ' &mu;m' : '-';

                const fHalphaOut = document.getElementById('fHalpha-' + i + '-out');
                const fHalphaVal = (fHalphaOut && fHalphaOut.textContent !== '--') ? '&plusmn; ' + fHalphaOut.textContent + ' &mu;m' : '-';

                const daTolInput = document.getElementById('da-tol-' + i);
                const daTolVal = daTolInput ? daTolInput.value || '-' : '-';

                const snTolUpperInput = document.getElementById('sn-tol-upper-' + i);
                const snTolLowerInput = document.getElementById('sn-tol-lower-' + i);
                const snTolUpperVal = snTolUpperInput ? snTolUpperInput.value || '-' : '-';
                const snTolLowerVal = snTolLowerInput ? snTolLowerInput.value || '-' : '-';

                const xeMaxOut = document.getElementById('xe-max-' + i + '-out');
                const xeMaxVal = (xeMaxOut && xeMaxOut.textContent !== '--') ? xeMaxOut.textContent : '-';
                const xeMinOut = document.getElementById('xe-min-' + i + '-out');
                const xeMinVal = (xeMinOut && xeMinOut.textContent !== '--') ? xeMinOut.textContent : '-';

                const dfAllowanceInput = document.getElementById('df-allowance-' + i);
                const dfAllowanceVal = dfAllowanceInput ? dfAllowanceInput.value || '0' : '0';

                tolHTML += `<div style="margin-bottom: 20px; padding-bottom: 5px; border-bottom: 2px solid #eee;">`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">${title} Tolerance Class (ISO 1328-1:2013):</span><span class="data-val">${val}</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Tip Diameter Tol. (&plusmn;):</span><span class="data-val">${daTolVal} mm</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Tooth Thickness Reduction (min/max):</span><span class="data-val">${snTolLowerVal} / ${snTolUpperVal} mm</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Generating Profile Shift (x<sub>E</sub>, min/max):</span><span class="data-val">${xeMinVal} / ${xeMaxVal}</span></div>`;

                const stMaxOut = document.getElementById('st-max-' + i + '-out');
                const stMaxVal = (stMaxOut && stMaxOut.textContent !== '--') ? stMaxOut.textContent : '-';
                const stMinOut = document.getElementById('st-min-' + i + '-out');
                const stMinVal = (stMinOut && stMinOut.textContent !== '--') ? stMinOut.textContent : '-';
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Trans. Tooth Thickness (s<sub>t</sub>, min/max):</span><span class="data-val">${stMinVal} / ${stMaxVal} mm</span></div>`;

                const snCalcMaxOut = document.getElementById('sn-max-' + i + '-out');
                const snCalcMaxVal = (snCalcMaxOut && snCalcMaxOut.textContent !== '--') ? snCalcMaxOut.textContent : '-';
                const snCalcMinOut = document.getElementById('sn-min-' + i + '-out');
                const snCalcMinVal = (snCalcMinOut && snCalcMinOut.textContent !== '--') ? snCalcMinOut.textContent : '-';
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Normal Tooth Thickness (s<sub>n</sub>, min/max):</span><span class="data-val">${snCalcMinVal} / ${snCalcMaxVal} mm</span></div>`;

                const mdMaxOut = document.getElementById('md-max-' + i + '-out');
                const mdMaxVal = (mdMaxOut && mdMaxOut.textContent !== '--') ? mdMaxOut.textContent : '-';
                const mdMinOut = document.getElementById('md-min-' + i + '-out');
                const mdMinVal = (mdMinOut && mdMinOut.textContent !== '--') ? mdMinOut.textContent : '-';
                const mdLabel = document.getElementById('md-' + i + '-label');
                const mdLabelText = mdLabel ? mdLabel.innerHTML : 'Dimension Over Balls (M<sub>dK</sub>)';

                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">${mdLabelText}, min/max:</span><span class="data-val">${mdMinVal} / ${mdMaxVal} mm</span></div>`;

                const dvMaxOut = document.getElementById('dv-max-' + i + '-out');
                const dvMaxVal = (dvMaxOut && dvMaxOut.textContent !== '--') ? dvMaxOut.textContent + ' mm' : '-';
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">V-Circle at Max. Tooth Thickness:</span><span class="data-val">${dvMaxVal}</span></div>`;

                const dfMaxOut = document.getElementById('df-max-' + i + '-out');
                const dfMaxVal = (dfMaxOut && dfMaxOut.textContent !== '--') ? dfMaxOut.textContent : '-';
                const dfMinOut = document.getElementById('df-min-' + i + '-out');
                const dfMinVal = (dfMinOut && dfMinOut.textContent !== '--') ? dfMinOut.textContent : '-';
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Root Diameter (d<sub>f</sub>, min/max):</span><span class="data-val">${dfMinVal} / ${dfMaxVal} mm</span></div>`;

                const dnfOut = document.getElementById('dnf-' + i + '-out');
                let dnfVal = '-';
                if (dnfOut && dnfOut.textContent !== '--') {
                    dnfVal = dnfOut.innerHTML;
                }
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none; align-items: flex-start;"><span class="data-label">Active Root Dia. (d<sub>Nf</sub>):</span><span class="data-val" style="text-align: right;">${dnfVal}</span></div>`;

                const dffOut = document.getElementById('dff-' + i + '-out');
                const dffVal = (dffOut && dffOut.textContent !== '--') ? dffOut.textContent : '-';
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none; align-items: flex-start;"><span class="data-label">Root Form Dia. (d<sub>Ff</sub>):</span><span class="data-val" style="text-align: right;">${dffVal}</span></div>`;

                const daMaxOut = document.getElementById('da-max-' + i + '-out');
                const daMaxVal = (daMaxOut && daMaxOut.textContent !== '--') ? daMaxOut.textContent : '-';
                const daMinOut = document.getElementById('da-min-' + i + '-out');
                const daMinVal = (daMinOut && daMinOut.textContent !== '--') ? daMinOut.textContent : '-';
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Tip Diameter (d<sub>a</sub>, min/max):</span><span class="data-val">${daMinVal} / ${daMaxVal} mm</span></div>`;

                const dmInput = document.getElementById('dm-' + i);
                const dmVal = dmInput ? dmInput.value || '-' : '-';
                const kSpannedInput = document.getElementById('k-spanned-' + i);
                const kSpannedVal = kSpannedInput ? kSpannedInput.value || '-' : '-';

                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Additional Root Diameter Allowance:</span><span class="data-val">${dfAllowanceVal} mm</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Measuring Ball Diameter (d<sub>M</sub>):</span><span class="data-val">${dmVal} mm</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Number of Teeth Spanned (k):</span><span class="data-val">${kSpannedVal}</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Runout Tolerance (F<sub>rT</sub>):</span><span class="data-val">${FrTVal}</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Single Pitch Tolerance (f<sub>pT</sub>):</span><span class="data-val">${fpTVal}</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Cum. Pitch Tolerance (F<sub>pT</sub>):</span><span class="data-val">${FpTVal}</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Profile Slope Tol. (f<sub>H&alpha;T</sub>):</span><span class="data-val">${fHalphaVal}</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Profile Form Tol. (f<sub>f&alpha;T</sub>):</span><span class="data-val">${ffalphaVal}</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Total Profile Tol. (F<sub>&alpha;T</sub>):</span><span class="data-val">${FalphaVal}</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Helix Slope Tol. (f<sub>H&beta;T</sub>):</span><span class="data-val">${fHbetaVal}</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Helix Form Tol. (f<sub>f&beta;T</sub>):</span><span class="data-val">${ffbetaVal}</span></div>`;
                tolHTML += `<div class="data-row" style="padding: 2px 0; border: none;"><span class="data-label">Total Helix Tol. (F<sub>&beta;T</sub>):</span><span class="data-val">${FbetaVal}</span></div>`;
                tolHTML += `</div>`;
            }
            return tolHTML;
        })()}
            </div>
        </body>
        </html>
    `;

    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportContent);
    reportWindow.document.close();
}
