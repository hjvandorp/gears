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
                const tipA = document.getElementById('tip-alteration-' + i).value || '-';
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
                                <div class="data-row" style="border:none; padding: 2px 0;"><span class="data-label">Tip Alteration Coefficient (k):</span> <span class="data-val">${tipA}</span></div>
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
                const mat = matSelect ? matSelect.options[matSelect.selectedIndex].text : '-';
                matHTML += `<div class="data-row" style="padding: 5px 0; border: none;"><span class="data-label">${title} Material:</span><span class="data-val">${mat}</span></div>`;
            }
            return matHTML;
        })()}
                <div class="data-row" style="margin-top: 10px; border-top: 1px dotted #ccc;">
                    <span class="data-label">Power Output:</span>
                    <span class="data-val ${!currentPower ? 'error' : ''}">${currentPower || 'Calculation Failed / Missing Data'}</span>
                </div>

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
