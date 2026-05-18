document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Cache of fully-resolved gear geometry, populated after each "Calculate All".
    // Consumed by graphics2D.js → calculateGearProfile().
    const gearGeomCache = {};

    if (typeof initGraphicsHandlers === 'function') {
        initGraphicsHandlers();
    }
    if (typeof initGraphics3DHandlers === 'function') {
        initGraphics3DHandlers();
    }

    // Dynamic Center Distance & Gear Properties Setup
    const gearConfig = document.getElementById('gear-config');
    gearConfig.addEventListener('change', (e) => {
        const config = e.target.value;
        const cdLabel1 = document.getElementById('cd-label-1');
        const cgGroup2 = document.getElementById('cd-group-2');
        const cgGroup3 = document.getElementById('cd-group-3');

        const gearCol3 = document.getElementById('gear-col-3');
        const gearCol4 = document.getElementById('gear-col-4');
        const gearTitle3 = document.getElementById('gear-title-3');

        const profCol3 = document.getElementById('profile-col-3');
        const profCol4 = document.getElementById('profile-col-4');
        const profTitle3 = document.getElementById('profile-title-3');

        const mountingCol3 = document.getElementById('mounting-col-3');
        const mountingCol4 = document.getElementById('mounting-col-4');
        const mountingTitle3 = document.getElementById('mounting-title-3');

        const ratingCol3 = document.getElementById('rating-col-3');
        const ratingCol4 = document.getElementById('rating-col-4');
        const ratingTitle3 = document.getElementById('rating-title-3');

        const tolCol3 = document.getElementById('tolerance-col-3');
        const tolCol4 = document.getElementById('tolerance-col-4');
        const tolTitle3 = document.getElementById('tolerance-title-3');

        const calcCol3 = document.getElementById('mfg-res-col-3');
        const calcCol4 = document.getElementById('mfg-res-col-4');
        const calcTitle3 = document.getElementById('mfg-res-title-3');

        const tolCalcCol3 = document.getElementById('tol-calc-col-3');
        const tolCalcCol4 = document.getElementById('tol-calc-col-4');
        const tolCalcTitle3 = document.getElementById('tol-calc-title-3');
        const awTolGroup1 = document.getElementById('aw-tol-group-1');
        const awTolGroup2 = document.getElementById('aw-tol-group-2');
        const awTolGroup3 = document.getElementById('aw-tol-group-3');
        const awTolTitle1 = document.getElementById('aw-tol-title-1');
        const awTolTitle2 = document.getElementById('aw-tol-title-2');

        const dffDebugCol3 = document.getElementById('dff-debug-col-3');
        const dffDebugCol4 = document.getElementById('dff-debug-col-4');
        const dffDebugTitle3 = document.getElementById('dff-debug-title-3');

        const graphicsCol3 = document.getElementById('graphics-col-3');
        const graphicsCol4 = document.getElementById('graphics-col-4');
        const graphicsTitle3 = document.getElementById('graphics-title-3');

        const graphics3dCol3 = document.getElementById('graphics-3d-col-3');
        const graphics3dCol4 = document.getElementById('graphics-3d-col-4');
        const graphics3dTitle3 = document.getElementById('graphics-3d-title-3');

        const graphicsToolCol3 = document.getElementById('graphics-tool-col-3');
        const graphicsToolCol4 = document.getElementById('graphics-tool-col-4');
        const graphicsToolTitle3 = document.getElementById('graphics-tool-title-3');

        const graphicsInmeshCol3 = document.getElementById('graphics-inmesh-col-3');
        const graphicsInmeshCol4 = document.getElementById('graphics-inmesh-col-4');
        const graphicsInmeshTitle3 = document.getElementById('graphics-inmesh-title-3');

        const z1 = document.getElementById('z1');
        const z2 = document.getElementById('z2');
        const z3 = document.getElementById('z3');
        const z4 = document.getElementById('z4');
        const alphaWt23Container = document.getElementById('alpha-wt-23-container');

        // Reset all to positive min=1 first
        [z1, z2, z3, z4].forEach(z => {
            if (z) z.setAttribute('min', '1');
        });

        if (alphaWt23Container) alphaWt23Container.classList.add('hidden');
        const awAlpha23Cont = document.getElementById('aw-alpha-23-container');
        if (awAlpha23Cont) awAlpha23Cont.classList.add('hidden');

        const aw2Input = document.getElementById('aw2');
        const aw3Input = document.getElementById('aw3');
        const cdLabel2 = document.querySelector('#cd-group-2 label');

        if (config === 'pair') {
            cdLabel1.innerHTML = 'Working Center Distance (a<sub>w</sub>, mm)';
            cgGroup2.classList.add('hidden');
            cgGroup3.classList.add('hidden');
            if (aw2Input) aw2Input.disabled = false;
            if (aw3Input) aw3Input.disabled = false;

            gearCol3.classList.add('hidden');
            gearCol4.classList.add('hidden');
            if (mountingCol3) mountingCol3.classList.add('hidden');
            if (mountingCol4) mountingCol4.classList.add('hidden');
            profCol3.classList.add('hidden');
            profCol4.classList.add('hidden');
            ratingCol3.classList.add('hidden');
            ratingCol4.classList.add('hidden');
            if (tolCol3) tolCol3.classList.add('hidden');
            if (tolCol4) tolCol4.classList.add('hidden');
            if (calcCol3) calcCol3.classList.add('hidden');
            if (calcCol4) calcCol4.classList.add('hidden');
            if (tolCalcCol3) tolCalcCol3.classList.add('hidden');
            if (tolCalcCol4) tolCalcCol4.classList.add('hidden');
            if (dffDebugCol3) dffDebugCol3.classList.add('hidden');
            if (dffDebugCol4) dffDebugCol4.classList.add('hidden');
            if (graphicsCol3) graphicsCol3.classList.add('hidden');
            if (graphicsCol4) graphicsCol4.classList.add('hidden');
            if (graphics3dCol3) graphics3dCol3.classList.add('hidden');
            if (graphics3dCol4) graphics3dCol4.classList.add('hidden');
            if (graphicsToolCol3) graphicsToolCol3.classList.add('hidden');
            if (graphicsToolCol4) graphicsToolCol4.classList.add('hidden');
            if (graphicsInmeshCol3) graphicsInmeshCol3.classList.add('hidden');
            if (graphicsInmeshCol4) graphicsInmeshCol4.classList.add('hidden');

            if (awTolGroup1) {
                awTolTitle1.innerHTML = 'Mesh 1-2';
                awTolGroup1.classList.remove('hidden');
            }
            if (awTolGroup2) awTolGroup2.classList.add('hidden');
            if (awTolGroup3) awTolGroup3.classList.add('hidden');

            if (z2) z2.removeAttribute('min');
        } else if (config === 'planetary') {
            cdLabel1.innerHTML = 'Working Center Distance, Sun-Planet (a<sub>w,12</sub>, mm)';
            if (cdLabel2) cdLabel2.innerHTML = 'Working Center Distance, Planet-Ring (a<sub>w,23</sub>, mm)';
            cgGroup2.classList.remove('hidden');
            cgGroup3.classList.add('hidden');
            if (aw2Input) aw2Input.disabled = true;
            if (aw3Input) aw3Input.disabled = false;

            gearTitle3.innerHTML = 'Gear 3 (Ring)';
            gearCol3.classList.remove('hidden');
            gearCol4.classList.add('hidden');
            if (mountingTitle3) mountingTitle3.innerHTML = 'Gear 3 (Ring)';
            if (mountingCol3) mountingCol3.classList.remove('hidden');
            if (mountingCol4) mountingCol4.classList.add('hidden');
            profTitle3.innerHTML = 'Gear 3 (Ring)';
            profCol3.classList.remove('hidden');
            profCol4.classList.add('hidden');
            ratingTitle3.innerHTML = 'Gear 3 (Ring)';
            ratingCol3.classList.remove('hidden');
            ratingCol4.classList.add('hidden');
            if (tolTitle3) tolTitle3.innerHTML = 'Gear 3 (Ring)';
            if (tolCol3) tolCol3.classList.remove('hidden');
            if (tolCol4) tolCol4.classList.add('hidden');
            if (calcTitle3) calcTitle3.innerHTML = 'Gear 3 (Ring)';
            if (calcCol3) calcCol3.classList.remove('hidden');
            if (calcCol4) calcCol4.classList.add('hidden');
            if (tolCalcTitle3) tolCalcTitle3.innerHTML = 'Gear 3 (Ring)';
            if (tolCalcCol3) tolCalcCol3.classList.remove('hidden');
            if (tolCalcCol4) tolCalcCol4.classList.add('hidden');
            if (dffDebugTitle3) dffDebugTitle3.innerHTML = 'Gear 3 (Ring)';
            if (dffDebugCol3) dffDebugCol3.classList.remove('hidden');
            if (dffDebugCol4) dffDebugCol4.classList.add('hidden');
            if (graphicsTitle3) graphicsTitle3.innerHTML = 'Gear 3 (Ring)';
            if (graphicsCol3) graphicsCol3.classList.remove('hidden');
            if (graphicsCol4) graphicsCol4.classList.add('hidden');
            if (graphics3dTitle3) graphics3dTitle3.innerHTML = 'Gear 3 (Ring)';
            if (graphics3dCol3) graphics3dCol3.classList.remove('hidden');
            if (graphics3dCol4) graphics3dCol4.classList.add('hidden');

            if (graphicsToolTitle3) graphicsToolTitle3.innerHTML = 'Gear 3 (Ring) Tool';
            if (graphicsToolCol3) graphicsToolCol3.classList.remove('hidden');
            if (graphicsToolCol4) graphicsToolCol4.classList.add('hidden');

            if (graphicsInmeshTitle3) graphicsInmeshTitle3.innerHTML = 'Gear 3 (Ring) Mesh';
            if (graphicsInmeshCol3) graphicsInmeshCol3.classList.remove('hidden');
            if (graphicsInmeshCol4) graphicsInmeshCol4.classList.add('hidden');

            if (awTolGroup1) {
                awTolTitle1.innerHTML = 'Mesh Sun-Planet (1-2)';
                awTolGroup1.classList.remove('hidden');
            }
            if (awTolGroup2) {
                awTolTitle2.innerHTML = 'Mesh Planet-Ring (2-3)';
                awTolGroup2.classList.remove('hidden');
                const awTol2Input = document.getElementById('aw-tol-2');
                if (awTol2Input) awTol2Input.disabled = true;
            }
            if (awTolGroup3) awTolGroup3.classList.add('hidden');

            if (z3) z3.removeAttribute('min');
        } else if (config === '3-train') {
            cdLabel1.innerHTML = 'Working Center Distance, Gear 1-2 (a<sub>w,12</sub>, mm)';
            if (cdLabel2) cdLabel2.innerHTML = 'Working Center Distance, Gear 2-3 (a<sub>w,23</sub>, mm)';
            cgGroup2.classList.remove('hidden');
            cgGroup3.classList.add('hidden');
            if (aw2Input) aw2Input.disabled = false;
            if (aw3Input) aw3Input.disabled = false;

            gearTitle3.innerHTML = 'Gear 3';
            gearCol3.classList.remove('hidden');
            gearCol4.classList.add('hidden');
            if (mountingTitle3) mountingTitle3.innerHTML = 'Gear 3';
            if (mountingCol3) mountingCol3.classList.remove('hidden');
            if (mountingCol4) mountingCol4.classList.add('hidden');
            profTitle3.innerHTML = 'Gear 3';
            profCol3.classList.remove('hidden');
            profCol4.classList.add('hidden');
            ratingTitle3.innerHTML = 'Gear 3';
            ratingCol3.classList.remove('hidden');
            ratingCol4.classList.add('hidden');
            if (tolTitle3) tolTitle3.innerHTML = 'Gear 3';
            if (tolCol3) tolCol3.classList.remove('hidden');
            if (tolCol4) tolCol4.classList.add('hidden');
            if (calcTitle3) calcTitle3.innerHTML = 'Gear 3';
            if (calcCol3) calcCol3.classList.remove('hidden');
            if (calcCol4) calcCol4.classList.add('hidden');
            if (tolCalcTitle3) tolCalcTitle3.innerHTML = 'Gear 3';
            if (tolCalcCol3) tolCalcCol3.classList.remove('hidden');
            if (tolCalcCol4) tolCalcCol4.classList.add('hidden');
            if (dffDebugTitle3) dffDebugTitle3.innerHTML = 'Gear 3';
            if (dffDebugCol3) dffDebugCol3.classList.remove('hidden');
            if (dffDebugCol4) dffDebugCol4.classList.add('hidden');
            if (graphicsTitle3) graphicsTitle3.innerHTML = 'Gear 3';
            if (graphicsCol3) graphicsCol3.classList.remove('hidden');
            if (graphicsCol4) graphicsCol4.classList.add('hidden');
            if (graphics3dTitle3) graphics3dTitle3.innerHTML = 'Gear 3';
            if (graphics3dCol3) graphics3dCol3.classList.remove('hidden');
            if (graphics3dCol4) graphics3dCol4.classList.add('hidden');

            if (graphicsToolTitle3) graphicsToolTitle3.innerHTML = 'Gear 3 Tool';
            if (graphicsToolCol3) graphicsToolCol3.classList.remove('hidden');
            if (graphicsToolCol4) graphicsToolCol4.classList.add('hidden');

            if (graphicsInmeshTitle3) graphicsInmeshTitle3.innerHTML = 'Gear 3 Mesh';
            if (graphicsInmeshCol3) graphicsInmeshCol3.classList.remove('hidden');
            if (graphicsInmeshCol4) graphicsInmeshCol4.classList.add('hidden');

            if (awTolGroup1) {
                awTolTitle1.innerHTML = 'Mesh 1-2';
                awTolGroup1.classList.remove('hidden');
            }
            if (awTolGroup2) {
                awTolTitle2.innerHTML = 'Mesh 2-3';
                awTolGroup2.classList.remove('hidden');
                const awTol2Input = document.getElementById('aw-tol-2');
                if (awTol2Input) awTol2Input.disabled = false;
            }
            if (awTolGroup3) awTolGroup3.classList.add('hidden');

            if (z3) z3.removeAttribute('min');
        } else if (config === '4-train') {
            cdLabel1.innerHTML = 'Working Center Distance, Gear 1-2 (a<sub>w,12</sub>, mm)';
            if (cdLabel2) cdLabel2.innerHTML = 'Working Center Distance, Gear 2-3 (a<sub>w,23</sub>, mm)';
            cgGroup2.classList.remove('hidden');
            cgGroup3.classList.remove('hidden');
            if (aw2Input) aw2Input.disabled = false;
            if (aw3Input) aw3Input.disabled = false;

            gearTitle3.innerHTML = 'Gear 3';
            gearCol3.classList.remove('hidden');
            gearCol4.classList.remove('hidden');
            if (mountingTitle3) mountingTitle3.innerHTML = 'Gear 3';
            if (mountingCol3) mountingCol3.classList.remove('hidden');
            if (mountingCol4) mountingCol4.classList.remove('hidden');
            profTitle3.innerHTML = 'Gear 3';
            profCol3.classList.remove('hidden');
            profCol4.classList.remove('hidden');
            ratingTitle3.innerHTML = 'Gear 3';
            ratingCol3.classList.remove('hidden');
            ratingCol4.classList.remove('hidden');
            if (tolTitle3) tolTitle3.innerHTML = 'Gear 3';
            if (tolCol3) tolCol3.classList.remove('hidden');
            if (tolCol4) tolCol4.classList.remove('hidden');
            if (calcTitle3) calcTitle3.innerHTML = 'Gear 3';
            if (calcCol3) calcCol3.classList.remove('hidden');
            if (calcCol4) calcCol4.classList.remove('hidden');
            if (tolCalcTitle3) tolCalcTitle3.innerHTML = 'Gear 3';
            if (tolCalcCol3) tolCalcCol3.classList.remove('hidden');
            if (tolCalcCol4) tolCalcCol4.classList.remove('hidden');
            if (dffDebugTitle3) dffDebugTitle3.innerHTML = 'Gear 3';
            if (dffDebugCol3) dffDebugCol3.classList.remove('hidden');
            if (dffDebugCol4) dffDebugCol4.classList.remove('hidden');
            if (graphicsTitle3) graphicsTitle3.innerHTML = 'Gear 3';
            if (graphicsCol3) graphicsCol3.classList.remove('hidden');
            if (graphicsCol4) graphicsCol4.classList.remove('hidden');
            if (graphics3dTitle3) graphics3dTitle3.innerHTML = 'Gear 3';
            if (graphics3dCol3) graphics3dCol3.classList.remove('hidden');
            if (graphics3dCol4) graphics3dCol4.classList.remove('hidden');

            if (graphicsToolTitle3) graphicsToolTitle3.innerHTML = 'Gear 3 Tool';
            if (graphicsToolCol3) graphicsToolCol3.classList.remove('hidden');
            if (graphicsToolCol4) graphicsToolCol4.classList.remove('hidden');

            if (graphicsInmeshTitle3) graphicsInmeshTitle3.innerHTML = 'Gear 3 Mesh';
            if (graphicsInmeshCol3) graphicsInmeshCol3.classList.remove('hidden');
            if (graphicsInmeshCol4) graphicsInmeshCol4.classList.remove('hidden');

            if (awTolGroup1) {
                awTolTitle1.innerHTML = 'Mesh 1-2';
                awTolGroup1.classList.remove('hidden');
            }
            if (awTolGroup2) {
                awTolTitle2.innerHTML = 'Mesh 2-3';
                awTolGroup2.classList.remove('hidden');
                const awTol2Input = document.getElementById('aw-tol-2');
                if (awTol2Input) awTol2Input.disabled = false;
            }
            if (awTolGroup3) awTolGroup3.classList.remove('hidden');

            if (z4) z4.removeAttribute('min');
        }
    });

    // Initial trigger to sync UI with default configuration
    gearConfig.dispatchEvent(new Event('change'));

    // Manufacturing Process Logic (Cutter Teeth)
    for (let i = 1; i <= 4; i++) {
        const toolSelect = document.getElementById('tool-type-' + i);
        const cutterInput = document.getElementById('cutter-teeth-' + i);
        const alphaP0Input = document.getElementById('alpha-p0-' + i);
        const zInput = document.getElementById('z' + i);

        if (toolSelect && cutterInput && alphaP0Input) {
            const updateCutter = () => {
                const cutterGroup = cutterInput.closest('.input-group');
                const alphaGroup = alphaP0Input.closest('.input-group');
                if (toolSelect.value === 'hob') {
                    if (cutterGroup) cutterGroup.classList.add('hidden');
                    if (alphaGroup) alphaGroup.classList.remove('hidden');
                } else {
                    if (cutterGroup) cutterGroup.classList.remove('hidden');
                    if (alphaGroup) alphaGroup.classList.add('hidden');
                }
            };

            toolSelect.addEventListener('change', updateCutter);

            if (zInput) {
                const updateToolTypeOptions = () => {
                    const isInternal = parseFloat(zInput.value) < 0;
                    const hobOption = Array.from(toolSelect.options).find(opt => opt.value === 'hob');
                    if (hobOption) {
                        if (isInternal) {
                            hobOption.disabled = true;
                            if (toolSelect.value === 'hob') {
                                toolSelect.value = 'shaper';
                                updateCutter();
                            }
                        } else {
                            hobOption.disabled = false;
                        }
                    }
                };
                zInput.addEventListener('input', updateToolTypeOptions);
                zInput.addEventListener('change', updateToolTypeOptions);

                // Trigger once on initialization
                updateToolTypeOptions();
            }

            // Sync on init
            updateCutter();
        }
    }

    // Result Helper
    function showResult(container, valueElement, defaultLabel, text, isError = false) {
        valueElement.textContent = text;
        const labelElement = container.querySelector('.result-label');

        if (isError) {
            container.classList.add('error-state');
            labelElement.textContent = 'Error';
        } else {
            container.classList.remove('error-state');
            labelElement.textContent = defaultLabel;
        }

        container.classList.add('show');
    }

    // Cache containers
    const resultContainer = document.getElementById('result-container');
    const resultValue = document.getElementById('result-value');

    const profileResultContainer = document.getElementById('profile-result-container');
    const profileResultValue = document.getElementById('profile-result-value');

    const ratingResultContainer = document.getElementById('rating-result-container');
    const ratingResultValue = document.getElementById('rating-result-value');

    // Values strictly for Report Generation
    let currentPower = null;

    // Calculate All Logic
    const calcAllBtn = document.getElementById('calc-all-btn');

    calcAllBtn.addEventListener('click', () => {
        window.assemblyCache = [];
        const config = document.getElementById('gear-config').value;
        const aw1Input = document.getElementById('aw1');
        const aw2Input = document.getElementById('aw2');

        // Force aw2 = aw1 in planetary mode
        if (config === 'planetary') {
            const aw1Input = document.getElementById('aw1');
            const aw2Input = document.getElementById('aw2');
            if (aw1Input && aw2Input) aw2Input.value = aw1Input.value;

            const awTol1Input = document.getElementById('aw-tol-1');
            const awTol2Input = document.getElementById('aw-tol-2');
            if (awTol1Input && awTol2Input) awTol2Input.value = awTol1Input.value;
        }

        // 1. Basic Data (Reference Diameter)
        const z1 = parseFloat(document.getElementById('z1') ? document.getElementById('z1').value : NaN);
        const z2 = parseFloat(document.getElementById('z2') ? document.getElementById('z2').value : NaN);
        const z3 = parseFloat(document.getElementById('z3') ? document.getElementById('z3').value : NaN);
        const z4 = parseFloat(document.getElementById('z4') ? document.getElementById('z4').value : NaN);
        const mn = parseFloat(document.getElementById('module').value);

        const beta = parseFloat(document.getElementById('helix-angle').value) || 0;
        const alphaN = parseFloat(document.getElementById('pressure-angle').value);

        // Pre-calculate helix angles for each gear based on sequential mesh logic
        const gearZs = [z1, z2, z3, z4];
        const gearBetas = [beta];
        for (let j = 1; j < 4; j++) {
            // Rule: internal gears (z < 0) keep sign of preceding gear, external gears flip sign
            if (gearZs[j] < 0) {
                gearBetas[j] = gearBetas[j - 1];
            } else {
                gearBetas[j] = -gearBetas[j - 1];
            }
        }

        // 1.2 Hand of Helix Logic
        // 1.2 Hand of Helix Logic for each gear
        [1, 2, 3, 4].forEach(j => {
            const handOut = document.getElementById('gear' + j + '-helix-hand-out');
            if (handOut) {
                const b = gearBetas[j - 1];
                if (isNaN(b)) {
                    handOut.textContent = '--';
                    handOut.style.color = '#6c757d';
                } else if (b < 0) {
                    handOut.textContent = 'Left';
                    handOut.style.color = '#0056b3';
                } else if (b > 0) {
                    handOut.textContent = 'Right';
                    handOut.style.color = '#0056b3';
                } else {
                    handOut.textContent = 'Spur';
                    handOut.style.color = '#0056b3';
                }
            }
        });

        // 1.5 Standard & Working Center Distance Calculations
        // Calculate transverse pressure angle (alpha_t)
        const alphaRadians = alphaN * Math.PI / 180;
        const betaRadiansForAlphaT = beta * Math.PI / 180;
        const alphaTRadians = Math.atan(Math.tan(alphaRadians) / Math.cos(betaRadiansForAlphaT));
        const alphaT = alphaTRadians * 180 / Math.PI;

        // Calculate Reference & Base Diameter for all gears
        [1, 2, 3, 4].forEach(i => {
            const zVal = parseFloat(document.getElementById('z' + i) ? document.getElementById('z' + i).value : NaN);
            const dOut = document.getElementById('d' + i + '-out');
            const dbOut = document.getElementById('db' + i + '-out');
            if (dOut) {
                if (isNaN(zVal) || isNaN(mn)) {
                    dOut.textContent = '--';
                    dOut.style.color = '#6c757d';
                    if (dbOut) {
                        dbOut.textContent = '--';
                        dbOut.style.color = '#6c757d';
                    }
                } else {
                    const pdRes = calculateReferenceDiameter(zVal, mn, Math.abs(beta));
                    if (pdRes.success) {
                        const dVal = pdRes.value;
                        dOut.textContent = `${dVal.toFixed(3)} mm`;
                        dOut.style.color = '#0056b3';

                        if (dbOut) {
                            const dbRes = calculateBaseDiameter(dVal, alphaT);
                            if (dbRes.success) {
                                dbOut.textContent = `${dbRes.value.toFixed(3)} mm`;
                                dbOut.style.color = '#0056b3';
                            } else {
                                dbOut.textContent = 'Error';
                                dbOut.style.color = '#dc3545';
                            }
                        }
                    } else {
                        dOut.textContent = 'Error';
                        dOut.style.color = '#dc3545';
                        if (dbOut) {
                            dbOut.textContent = 'Error';
                            dbOut.style.color = '#dc3545';
                        }
                    }
                }
            }
        });

        const aw1 = parseFloat(document.getElementById('aw1') ? document.getElementById('aw1').value : NaN);
        const aw2 = parseFloat(document.getElementById('aw2') ? document.getElementById('aw2').value : NaN);
        const aw3 = parseFloat(document.getElementById('aw3') ? document.getElementById('aw3').value : NaN);

        const cdStd1 = document.getElementById('cd-std-1');
        const cdStd2 = document.getElementById('cd-std-2');
        const cdStd3 = document.getElementById('cd-std-3');
        const awAlpha1 = document.getElementById('aw-alpha-1');
        const awAlpha2 = document.getElementById('aw-alpha-2');
        const awAlpha3 = document.getElementById('aw-alpha-3');

        let awRes1 = { success: false };
        let awRes2 = { success: false };
        let awRes3 = { success: false };

        if (cdStd1 && awAlpha1) {
            const stdRes1 = calculateStandardCenterDistance(z1, z2, mn, beta);
            cdStd1.textContent = stdRes1.success ? `${stdRes1.value.toFixed(3)} mm` : (stdRes1.error || '--');
            cdStd1.style.color = stdRes1.success ? '#0056b3' : '#dc3545';

            awRes1 = calculateWorkingTransversePressureAngle(z1, z2, mn, alphaT, aw1, beta);
            awAlpha1.textContent = awRes1.success ? `${awRes1.value.toFixed(3)}°` : (awRes1.error || '--');
            awAlpha1.style.color = awRes1.success ? '#0056b3' : '#dc3545';

            // Populate Expanded Results Grid
            const alphaTOut = document.getElementById('alpha-t-out');
            const alphaWtOut = document.getElementById('alpha-wt-out');
            const invAlphaTOut = document.getElementById('inv-alpha-t-out');
            const invAlphaWtOut = document.getElementById('inv-alpha-wt-out');
            const sumXOut = document.getElementById('sum-x-out');

            if (alphaTOut) alphaTOut.textContent = `${alphaT.toFixed(3)}°`;

            if (awRes1.success) {
                if (alphaWtOut) alphaWtOut.textContent = `${awRes1.value.toFixed(3)}°`;
                if (invAlphaTOut) invAlphaTOut.textContent = involute(alphaT).toFixed(5);
                if (invAlphaWtOut) invAlphaWtOut.textContent = involute(awRes1.value).toFixed(5);
            } else {
                if (alphaWtOut) alphaWtOut.textContent = '--';
                if (invAlphaTOut) invAlphaTOut.textContent = '--';
                if (invAlphaWtOut) invAlphaWtOut.textContent = '--';
            }
        }

        if (cdStd2 && awAlpha2) {
            if (config === '3-train' || config === '4-train' || config === 'planetary') {
                const stdRes2 = calculateStandardCenterDistance(z2, z3, mn, beta);
                cdStd2.textContent = stdRes2.success ? `${stdRes2.value.toFixed(3)} mm` : (stdRes2.error || '--');
                cdStd2.style.color = stdRes2.success ? '#0056b3' : '#dc3545';

                awRes2 = calculateWorkingTransversePressureAngle(z2, z3, mn, alphaT, aw2, beta);
                awAlpha2.textContent = awRes2.success ? `${awRes2.value.toFixed(3)}°` : (awRes2.error || '--');
                awAlpha2.style.color = awRes2.success ? '#0056b3' : '#dc3545';
            } else {
                cdStd2.textContent = '--';
                cdStd2.style.color = '#6c757d';
                awAlpha2.textContent = '--';
                awAlpha2.style.color = '#6c757d';
            }
        }

        if (cdStd3 && awAlpha3) {
            if (config === '4-train') {
                const stdRes3 = calculateStandardCenterDistance(z3, z4, mn, beta);
                cdStd3.textContent = stdRes3.success ? `${stdRes3.value.toFixed(3)} mm` : (stdRes3.error || '--');
                cdStd3.style.color = stdRes3.success ? '#0056b3' : '#dc3545';

                awRes3 = calculateWorkingTransversePressureAngle(z3, z4, mn, alphaT, aw3, beta);
                awAlpha3.textContent = awRes3.success ? `${awRes3.value.toFixed(3)}°` : (awRes3.error || '--');
                awAlpha3.style.color = awRes3.success ? '#0056b3' : '#dc3545';
            } else {
                cdStd3.textContent = '--';
                cdStd3.style.color = '#6c757d';
                awAlpha3.textContent = '--';
                awAlpha3.style.color = '#6c757d';
            }
        }

        // 1.8 Dynamic Profile Shifts Cascades
        const x1 = parseFloat(document.getElementById('x1') ? document.getElementById('x1').value : NaN);
        const x2Out = document.getElementById('x2-out');
        const x3Out = document.getElementById('x3-out');
        const x4Out = document.getElementById('x4-out');

        let x2Val = NaN;
        if (x2Out && awRes1.success) {
            const x2Result = calculateProfileShiftCoefficient2(z1, z2, awRes1.value, alphaT, alphaN, x1);
            if (x2Result.success) {
                x2Val = x2Result.value;
                x2Out.textContent = x2Val.toFixed(4);
                x2Out.style.color = '#0056b3';

                // Update Sum of Profile Shift
                const sumXOut = document.getElementById('sum-x-out');
                if (sumXOut) sumXOut.textContent = (x1 + x2Val).toFixed(4);
            } else {
                x2Out.textContent = '--';
                x2Out.style.color = '#dc3545';
                const sumXOut = document.getElementById('sum-x-out');
                if (sumXOut) sumXOut.textContent = '--';
            }
        } else if (x2Out) {
            x2Out.textContent = '--';
            x2Out.style.color = '#6c757d';
        }

        let x3Val = NaN;
        if (x3Out && awRes2.success && !isNaN(x2Val)) {
            const x3Result = calculateProfileShiftCoefficient2(z2, z3, awRes2.value, alphaT, alphaN, x2Val);
            if (x3Result.success) {
                x3Val = x3Result.value;
                x3Out.textContent = x3Val.toFixed(4);
                x3Out.style.color = '#0056b3';
            } else {
                x3Out.textContent = '--';
                x3Out.style.color = '#dc3545';
            }
        } else if (x3Out) {
            x3Out.textContent = '--';
            x3Out.style.color = '#6c757d';
        }

        let x4Val = NaN;
        if (x4Out && awRes3.success && !isNaN(x3Val)) {
            const x4Result = calculateProfileShiftCoefficient2(z3, z4, awRes3.value, alphaT, alphaN, x3Val);
            if (x4Result.success) {
                x4Val = x4Result.value;
                x4Out.textContent = x4Val.toFixed(4);
                x4Out.style.color = '#0056b3';
            } else {
                x4Out.textContent = '--';
                x4Out.style.color = '#dc3545';
            }
        } else if (x4Out) {
            x4Out.textContent = '--';
            x4Out.style.color = '#6c757d';
        }

        // 3. Rating Data (Power)
        const torque = parseFloat(document.getElementById('torque').value);
        const speed = parseFloat(document.getElementById('speed').value);

        const powerResult = calculatePower(torque, speed);
        if (powerResult.success) {
            currentPower = `${powerResult.value.toFixed(3)} kW`;
            showResult(ratingResultContainer, ratingResultValue, 'Power (kW)', currentPower);
        } else {
            currentPower = null;
            showResult(ratingResultContainer, ratingResultValue, 'Power (kW)', powerResult.error, true);
        }

        // 4. Tolerances Data (Single Pitch Tolerance)
        const frtValues = [NaN, NaN, NaN, NaN];
        [1, 2, 3, 4].forEach(i => {
            const zVal = parseFloat(document.getElementById('z' + i) ? document.getElementById('z' + i).value : NaN);
            const aVal = parseInt(document.getElementById('quality-grade-' + i) ? document.getElementById('quality-grade-' + i).value : NaN, 10);
            const fpTOut = document.getElementById('fpt-' + i + '-out');
            const bigFpTOut = document.getElementById('Fpt-' + i + '-out');
            const bigFrtOut = document.getElementById('Frt-' + i + '-out');
            const fHalphaOut = document.getElementById('fHalpha-' + i + '-out');
            const ffalphaOut = document.getElementById('ffalpha-' + i + '-out');
            const FalphaOut = document.getElementById('Falpha-' + i + '-out');
            const fHbetaOut = document.getElementById('fHbeta-' + i + '-out');
            const ffbetaOut = document.getElementById('ffbeta-' + i + '-out');
            const FbetaOut = document.getElementById('Fbeta-' + i + '-out');

            const bVal = parseFloat(document.getElementById('b' + i) ? document.getElementById('b' + i).value : NaN);

            const allOuts = [fpTOut, bigFpTOut, bigFrtOut, fHalphaOut, ffalphaOut, FalphaOut, fHbetaOut, ffbetaOut, FbetaOut];

            if (allOuts.some(out => out !== null)) {
                if (isNaN(zVal) || isNaN(mn) || isNaN(aVal)) {
                    allOuts.forEach(out => {
                        if (out) { out.textContent = '--'; out.style.color = '#6c757d'; }
                    });
                } else {
                    const pdRes = calculateReferenceDiameter(zVal, mn, Math.abs(beta));
                    if (pdRes.success) {
                        const d = pdRes.value;
                        let FpTVal = NaN;
                        let fHalphaT_unrounded = NaN;
                        let ffalphaT_unrounded = NaN;
                        let fHbetaT_unrounded = NaN;
                        let ffbetaT_unrounded = NaN;

                        if (fpTOut) {
                            const fptRes = calculateSinglePitchTolerance(d, mn, aVal);
                            if (fptRes.success) {
                                fpTOut.textContent = fptRes.value.toFixed(1);
                                fpTOut.style.color = '#0056b3';
                            } else {
                                fpTOut.textContent = 'Error';
                                fpTOut.style.color = '#dc3545';
                            }
                        }

                        if (bigFpTOut) {
                            const FptRes = calculateCumulativePitchTolerance(d, mn, aVal);
                            if (FptRes.success) {
                                FpTVal = FptRes.value;
                                bigFpTOut.textContent = FpTVal.toFixed(1);
                                bigFpTOut.style.color = '#0056b3';
                            } else {
                                bigFpTOut.textContent = 'Error';
                                bigFpTOut.style.color = '#dc3545';
                            }
                        }

                        if (bigFrtOut) {
                            if (!isNaN(FpTVal)) {
                                const FrtRes = calculateRunoutTolerance(FpTVal);
                                if (FrtRes.success) {
                                    const frtVal = FrtRes.value;
                                    bigFrtOut.textContent = frtVal.toFixed(1);
                                    bigFrtOut.style.color = '#0056b3';
                                    frtValues[i - 1] = frtVal;
                                } else {
                                    bigFrtOut.textContent = 'Error';
                                    bigFrtOut.style.color = '#dc3545';
                                }
                            } else {
                                bigFrtOut.textContent = '--';
                                bigFrtOut.style.color = '#6c757d';
                            }
                        }

                        if (fHalphaOut || FalphaOut) {
                            const fHalphaRes = calculateProfileSlopeTolerance(d, mn, aVal);
                            if (fHalphaRes.success) {
                                fHalphaT_unrounded = fHalphaRes.value;
                                if (fHalphaOut) {
                                    fHalphaOut.textContent = fHalphaT_unrounded.toFixed(1);
                                    fHalphaOut.style.color = '#0056b3';
                                }
                            } else {
                                if (fHalphaOut) { fHalphaOut.textContent = 'Error'; fHalphaOut.style.color = '#dc3545'; }
                            }
                        }

                        if (ffalphaOut || FalphaOut) {
                            const ffalphaRes = calculateProfileFormTolerance(mn, aVal);
                            if (ffalphaRes.success) {
                                ffalphaT_unrounded = ffalphaRes.value;
                                if (ffalphaOut) {
                                    ffalphaOut.textContent = ffalphaT_unrounded.toFixed(1);
                                    ffalphaOut.style.color = '#0056b3';
                                }
                            } else {
                                if (ffalphaOut) { ffalphaOut.textContent = 'Error'; ffalphaOut.style.color = '#dc3545'; }
                            }
                        }

                        if (FalphaOut) {
                            if (!isNaN(fHalphaT_unrounded) && !isNaN(ffalphaT_unrounded)) {
                                const FalphaRes = calculateTotalProfileTolerance(fHalphaT_unrounded, ffalphaT_unrounded);
                                if (FalphaRes.success) {
                                    FalphaOut.textContent = FalphaRes.value.toFixed(1);
                                    FalphaOut.style.color = '#0056b3';
                                } else {
                                    FalphaOut.textContent = 'Error';
                                    FalphaOut.style.color = '#dc3545';
                                }
                            } else {
                                FalphaOut.textContent = '--';
                                FalphaOut.style.color = '#6c757d';
                            }
                        }

                        if (!isNaN(bVal)) {
                            if (fHbetaOut || FbetaOut) {
                                const fHbetaRes = calculateHelixSlopeTolerance(d, bVal, aVal);
                                if (fHbetaRes.success) {
                                    fHbetaT_unrounded = fHbetaRes.value;
                                    if (fHbetaOut) {
                                        fHbetaOut.textContent = fHbetaT_unrounded.toFixed(1);
                                        fHbetaOut.style.color = '#0056b3';
                                    }
                                } else {
                                    if (fHbetaOut) { fHbetaOut.textContent = 'Error'; fHbetaOut.style.color = '#dc3545'; }
                                }
                            }

                            if (ffbetaOut || FbetaOut) {
                                const ffbetaRes = calculateHelixFormTolerance(d, bVal, aVal);
                                if (ffbetaRes.success) {
                                    ffbetaT_unrounded = ffbetaRes.value;
                                    if (ffbetaOut) {
                                        ffbetaOut.textContent = ffbetaT_unrounded.toFixed(1);
                                        ffbetaOut.style.color = '#0056b3';
                                    }
                                } else {
                                    if (ffbetaOut) { ffbetaOut.textContent = 'Error'; ffbetaOut.style.color = '#dc3545'; }
                                }
                            }

                            if (FbetaOut) {
                                if (!isNaN(fHbetaT_unrounded) && !isNaN(ffbetaT_unrounded)) {
                                    const FbetaRes = calculateTotalHelixTolerance(fHbetaT_unrounded, ffbetaT_unrounded);
                                    if (FbetaRes.success) {
                                        FbetaOut.textContent = FbetaRes.value.toFixed(1);
                                        FbetaOut.style.color = '#0056b3';
                                    } else {
                                        FbetaOut.textContent = 'Error';
                                        FbetaOut.style.color = '#dc3545';
                                    }
                                } else {
                                    FbetaOut.textContent = '--';
                                    FbetaOut.style.color = '#6c757d';
                                }
                            }
                        } else {
                            if (fHbetaOut) { fHbetaOut.textContent = '--'; fHbetaOut.style.color = '#6c757d'; }
                            if (ffbetaOut) { ffbetaOut.textContent = '--'; ffbetaOut.style.color = '#6c757d'; }
                            if (FbetaOut) { FbetaOut.textContent = '--'; FbetaOut.style.color = '#6c757d'; }
                        }

                    } else {
                        allOuts.forEach(out => {
                            if (out) { out.textContent = '--'; out.style.color = '#6c757d'; }
                        });
                    }
                }
            }
        });

        // 5. Center Distance Range Calculations
        [1, 2, 3].forEach(i => {
            const awInput = document.getElementById('aw' + i);
            const awVal = awInput ? parseFloat(awInput.value) : NaN;
            const tolInput = document.getElementById('aw-tol-' + i);
            const awMaxSpan = document.getElementById('aw-max-' + i);
            const awMinSpan = document.getElementById('aw-min-' + i);

            if (awMaxSpan && awMinSpan) {
                const tol = tolInput ? parseFloat(tolInput.value) : NaN;
                if (!isNaN(awVal) && !isNaN(tol)) {
                    awMaxSpan.textContent = `${(awVal + tol).toFixed(3)} mm`;
                    awMinSpan.textContent = `${(awVal - tol).toFixed(3)} mm`;
                    awMaxSpan.style.color = '#0056b3';
                    awMinSpan.style.color = '#0056b3';
                } else {
                    awMaxSpan.textContent = '--';
                    awMinSpan.textContent = '--';
                    awMaxSpan.style.color = '#6c757d';
                    awMinSpan.style.color = '#6c757d';
                }
            }
        });

        // 6. Backlash Compensation Calculations
        const requiredReductions = [0, 0, 0, 0];
        const backlashDetails = [null, null, null, null];
        const meshConfigs = [
            { id: 1, gA: 1, gB: 2, zA: z1, zB: z2 },
            { id: 2, gA: 2, gB: 3, zA: z2, zB: z3 },
            { id: 3, gA: 3, gB: 4, zA: z3, zB: z4 }
        ];

        meshConfigs.forEach(m => {
            const awInput = document.getElementById('aw' + m.id);
            const tolInput = document.getElementById('aw-tol-' + m.id);
            if (!awInput || !tolInput) return;

            const aw = parseFloat(awInput.value);
            const tol = parseFloat(tolInput.value);

            // Check if mesh is active based on config and group visibility
            const group = document.getElementById('aw-tol-group-' + m.id);
            if (!group || group.classList.contains('hidden')) return;

            if (!isNaN(aw) && !isNaN(tol) && !isNaN(m.zA) && !isNaN(m.zB)) {
                // For internal gears (Planet-Ring mesh in planetary mode), 
                // the worst-case for backlash occurs at the maximum center distance.
                const awWork = (config === 'planetary' && m.id === 2) ? (aw + tol) : (aw - tol);

                const stdRes = calculateStandardCenterDistance(m.zA, m.zB, mn, beta);

                if (stdRes.success && awWork > 0) {
                    const stdValue = stdRes.value;
                    const cosAlphaT = Math.cos(alphaTRadians);
                    const cosAlphaWt = (stdValue * cosAlphaT) / awWork;

                    if (cosAlphaWt <= 1 && cosAlphaWt > 0) {
                        const alphaWtRad = Math.acos(cosAlphaWt);
                        const tanAlphaWt = Math.tan(alphaWtRad);

                        const frtA = frtValues[m.gA - 1];
                        const frtB = frtValues[m.gB - 1];

                        if (!isNaN(frtA) && !isNaN(frtB)) {
                            const sumFrtMM = (frtA + frtB) / 1000;
                            const dsT = 0.5 * sumFrtMM * tanAlphaWt;
                            const dsN = dsT * Math.cos(betaRadiansForAlphaT);

                            const detail = {
                                alphaWt: alphaWtRad * 180 / Math.PI,
                                sumFrt: frtA + frtB,
                                dsT: dsT,
                                dsN: dsN
                            };

                            if (dsN > requiredReductions[m.gA - 1]) {
                                requiredReductions[m.gA - 1] = dsN;
                                backlashDetails[m.gA - 1] = detail;
                            }
                            if (dsN > requiredReductions[m.gB - 1]) {
                                requiredReductions[m.gB - 1] = dsN;
                                backlashDetails[m.gB - 1] = detail;
                            }
                        }
                    }
                }
            }
        });

        // Update UI
        [1, 2, 3, 4].forEach(i => {
            const spanMain = document.getElementById('sn-min-backlash-' + i);
            const spanAlpha = document.getElementById('backlash-alpha-' + i);
            const spanSumFrt = document.getElementById('backlash-sumfrt-' + i);
            const spanDsT = document.getElementById('backlash-dst-' + i);
            const spanDsN = document.getElementById('backlash-dsn-' + i);

            if (spanMain) {
                const val = requiredReductions[i - 1];
                const detail = backlashDetails[i - 1];

                spanMain.textContent = val > 0 ? `${val.toFixed(4)} mm` : '--';

                if (detail && val > 0) {
                    if (spanAlpha) spanAlpha.textContent = `${detail.alphaWt.toFixed(3)}°`;
                    if (spanSumFrt) spanSumFrt.textContent = `${detail.sumFrt.toFixed(2)} μm`;
                    if (spanDsT) spanDsT.textContent = `${detail.dsT.toFixed(4)} mm`;
                    if (spanDsN) spanDsN.textContent = `${detail.dsN.toFixed(4)} mm`;
                } else {
                    if (spanAlpha) spanAlpha.textContent = '--';
                    if (spanSumFrt) spanSumFrt.textContent = '--';
                    if (spanDsT) spanDsT.textContent = '--';
                    if (spanDsN) spanDsN.textContent = '--';
                }
            }
        });

        // 7. Generating Profile Shift Calculations (xE)
        const xValues = [
            parseFloat(document.getElementById('x1').value),
            x2Val,
            x3Val,
            x4Val
        ];

        [1, 2, 3, 4].forEach(i => {
            const xNom = xValues[i - 1];
            const snUpperEl = document.getElementById('sn-tol-upper-' + i);
            const snLowerEl = document.getElementById('sn-tol-lower-' + i);
            const snUpper = snUpperEl ? parseFloat(snUpperEl.value) : 0;
            const snLower = snLowerEl ? parseFloat(snLowerEl.value) : 0;
            const xeMaxDisplay = document.getElementById('xe-max-' + i + '-out');
            const xeMinDisplay = document.getElementById('xe-min-' + i + '-out');
            const stMaxDisplay = document.getElementById('st-max-' + i + '-out');
            const stMinDisplay = document.getElementById('st-min-' + i + '-out');
            const snMaxDisplay = document.getElementById('sn-max-' + i + '-out');
            const snMinDisplay = document.getElementById('sn-min-' + i + '-out');
            const dvMaxDisplay = document.getElementById('dv-max-' + i + '-out');

            if (xeMaxDisplay && xeMinDisplay) {
                const zVal = parseFloat(document.getElementById('z' + i) ? document.getElementById('z' + i).value : NaN);
                const cutterEl = document.getElementById('cutter-teeth-' + i);
                const toolTypeEl = document.getElementById('tool-type-' + i);
                const isHob = toolTypeEl && toolTypeEl.value === 'hob';
                const z0 = isHob ? 10000 : (cutterEl && cutterEl.value && !isNaN(parseFloat(cutterEl.value))) ? parseFloat(cutterEl.value) : 10000;
                if (!isNaN(xNom) && !isNaN(mn) && !isNaN(alphaN) && !isNaN(zVal)) {
                    // xE_max corresponds to MIN reduction (snUpper)
                    const resMax = calculateGeneratingProfileShift(xNom, isNaN(snUpper) ? 0 : snUpper, mn, alphaN);
                    // xE_min corresponds to MAX reduction (snLower)
                    const resMin = calculateGeneratingProfileShift(xNom, isNaN(snLower) ? 0 : snLower, mn, alphaN);

                    const dfMaxDisplay = document.getElementById('df-max-' + i + '-out');
                    const dfMinDisplay = document.getElementById('df-min-' + i + '-out');
                    const hfPCoeff = parseFloat(document.getElementById('dedendum-coeff-' + i).value);

                    if (dfMaxDisplay && dfMinDisplay) {
                        if (resMax.success && resMin.success && !isNaN(hfPCoeff) && !isNaN(zVal) && !isNaN(beta)) {
                            const cosBeta = Math.cos(Math.abs(beta) * Math.PI / 180);
                            const d = (Math.abs(zVal) * mn) / cosBeta;

                            const dfRes1 = calculateRootDiameter(d, zVal, hfPCoeff, resMax.value, mn);
                            const dfRes2 = calculateRootDiameter(d, zVal, hfPCoeff, resMin.value, mn);

                            if (dfRes1.success && dfRes2.success) {
                                const val1 = dfRes1.value;
                                const val2 = dfRes2.value;
                                const dfAllowance = parseFloat(document.getElementById('df-allowance-' + i).value) || 0;
                                const baseMax = Math.max(val1, val2);
                                const baseMin = Math.min(val1, val2);
                                //the next two lines add the additional root diameter tolerance to the theoretical generated root diameters.
                                dfMaxDisplay.textContent = (baseMax + 0.5 * dfAllowance).toFixed(3);
                                dfMinDisplay.textContent = (baseMin - 0.5 * dfAllowance).toFixed(3);
                                dfMaxDisplay.style.color = '#0056b3';
                                dfMinDisplay.style.color = '#0056b3';
                            } else {
                                dfMaxDisplay.textContent = '--';
                                dfMinDisplay.textContent = '--';
                                dfMaxDisplay.style.color = '#dc3545';
                                dfMinDisplay.style.color = '#dc3545';
                            }
                        } else {
                            dfMaxDisplay.textContent = '--';
                            dfMinDisplay.textContent = '--';
                            dfMaxDisplay.style.color = '#6c757d';
                            dfMinDisplay.style.color = '#6c757d';
                        }
                    }

                    const daMaxDisplay = document.getElementById('da-max-' + i + '-out');
                    const daMinDisplay = document.getElementById('da-min-' + i + '-out');
                    const haPCoeff = parseFloat(document.getElementById('addendum-coeff-' + i).value);
                    const kCoeff = parseFloat(document.getElementById('tip-alteration-' + i).value) || 0;
                    const daTolEl = document.getElementById('da-tol-' + i);
                    const daTol = daTolEl ? Math.abs(parseFloat(daTolEl.value) || 0) : 0;

                    if (daMaxDisplay && daMinDisplay) {
                        if (resMax.success && resMin.success && !isNaN(haPCoeff) && !isNaN(zVal) && !isNaN(beta)) {
                            const cosBeta = Math.cos(Math.abs(beta) * Math.PI / 180);
                            const d = (Math.abs(zVal) * mn) / cosBeta;

                            const daRes = calculateTipDiameter(d, zVal, haPCoeff, resMax.value, kCoeff, mn);

                            if (daRes.success) {
                                const baseTipDia = daRes.value;
                                let daMax, daMin;

                                if (zVal > 0) {
                                    daMax = baseTipDia;
                                    daMin = baseTipDia - daTol;
                                } else {
                                    daMin = baseTipDia;
                                    daMax = baseTipDia + daTol;
                                }

                                daMaxDisplay.textContent = daMax.toFixed(3);
                                daMinDisplay.textContent = daMin.toFixed(3);
                                daMaxDisplay.style.color = '#0056b3';
                                daMinDisplay.style.color = '#0056b3';
                            } else {
                                daMaxDisplay.textContent = '--';
                                daMinDisplay.textContent = '--';
                                daMaxDisplay.style.color = '#dc3545';
                                daMinDisplay.style.color = '#dc3545';
                            }
                        } else {
                            daMaxDisplay.textContent = '--';
                            daMinDisplay.textContent = '--';
                            daMaxDisplay.style.color = '#6c757d';
                            daMinDisplay.style.color = '#6c757d';
                        }
                    }

                    // dFf (Root Form Diameter)
                    const alphaP0El = document.getElementById('alpha-p0-' + i);
                    const rhoFpCoeffEl = document.getElementById('root-radius-coeff-' + i);
                    const hfPCoeffEl = document.getElementById('dedendum-coeff-' + i);
                    const haPCoeffEl = document.getElementById('addendum-coeff-' + i);
                    const toolTypeEl = document.getElementById('tool-type-' + i);
                    const dffDisplay = document.getElementById('dff-' + i + '-out');

                    if (dffDisplay && alphaP0El && rhoFpCoeffEl && hfPCoeffEl && haPCoeffEl && toolTypeEl) {
                        const alphaP0 = parseFloat(alphaP0El.value) || 20;
                        const rhoFpCoeff = parseFloat(rhoFpCoeffEl.value) || 0;
                        const hfPCoeff = parseFloat(hfPCoeffEl.value) || 0;
                        const haPCoeff = parseFloat(haPCoeffEl.value) || 0;
                        const toolType = toolTypeEl.value;

                        if (resMax.success && resMin.success && !isNaN(alphaP0) && !isNaN(z0)) {
                            const cosBeta = Math.cos(Math.abs(beta) * Math.PI / 180);
                            const d = (Math.abs(zVal) * mn) / cosBeta;
                            const dbRes = calculateBaseDiameter(d, alphaT);
                            const dfMaxRes = calculateRootDiameter(d, zVal, hfPCoeff, resMax.value, mn);
                            const daMaxRes = calculateTipDiameter(d, zVal, haPCoeff, resMax.value, 0, mn);

                            const tanAlphaN = Math.tan(alphaN * Math.PI / 180);
                            const snMax = mn * (Math.PI / 2 + 2 * resMax.value * tanAlphaN);
                            const snMin = mn * (Math.PI / 2 + 2 * resMin.value * tanAlphaN);

                            if (dbRes.success && dfMaxRes.success && daMaxRes.success) {
                                const db = dbRes.value;
                                const dF = dfMaxRes.value;
                                const dA = daMaxRes.value;

                                // Recommended diameter to avoid thin rim
                                const wholeDepth = Math.abs(dA - dF) / 2;
                                let diRec;
                                if (zVal > 0) { // External
                                    diRec = dF - 2.5 * wholeDepth;
                                } else { // Internal
                                    diRec = dF + 2.5 * wholeDepth;
                                }
                                const diRecEl = document.getElementById('di-rec-' + i);
                                if (diRecEl) {
                                    diRecEl.textContent = diRec.toFixed(3) + ' mm';
                                }

                                const dffRes1 = calculateRootFormDiameterPinionCutter(zVal, mn, alphaN, beta, d, db, snMax, dF, dA, alphaP0, haPCoeff, hfPCoeff, rhoFpCoeff, z0, toolType);
                                const dffRes2 = calculateRootFormDiameterPinionCutter(zVal, mn, alphaN, beta, d, db, snMin, dF, dA, alphaP0, haPCoeff, hfPCoeff, rhoFpCoeff, z0, toolType);

                                if (dffRes1.success && dffRes2.success) {
                                    const v1 = dffRes1.value;
                                    const v2 = dffRes2.value;
                                    const maxDff = Math.max(v1, v2);
                                    dffDisplay.textContent = maxDff.toFixed(3);
                                    dffDisplay.style.color = '#0056b3';

                                    const stepsContainer = document.getElementById('dff-steps-' + i);
                                    if (stepsContainer && dffRes1.steps) {
                                        stepsContainer.innerHTML = '';
                                        Object.keys(dffRes1.steps).forEach(key => {
                                            const stepRow = document.createElement('div');
                                            stepRow.className = 'debug-step';
                                            const numSpan = document.createElement('span');
                                            numSpan.className = 'debug-step-num';
                                            numSpan.textContent = key + '.';
                                            const valSpan = document.createElement('span');
                                            valSpan.className = 'debug-step-val';
                                            valSpan.textContent = dffRes1.steps[key];
                                            stepRow.appendChild(numSpan);
                                            stepRow.appendChild(valSpan);
                                            stepsContainer.appendChild(stepRow);
                                        });
                                    }

                                    // 2D Graphics: populate cache and compute profile
                                    const cosBetaG = Math.cos(Math.abs(beta) * Math.PI / 180);
                                    const eqResult = equivalentGearAlphaN0(
                                        zVal, mn, alphaN, beta, d, db,
                                        snMax, dF, dA,
                                        alphaP0, haPCoeff, hfPCoeff, rhoFpCoeff, z0, toolType
                                    );
                                    if (eqResult.success) {
                                        const maxRootRadiusCoeffEl = document.getElementById('max-root-radius-coeff-' + i);
                                        if (maxRootRadiusCoeffEl) {
                                            maxRootRadiusCoeffEl.textContent = eqResult.value.rhoaP_coeff_max.toFixed(4);
                                        }
                                        const stMax = snMax / cosBetaG;
                                        gearGeomCache[i] = {
                                            z: zVal,
                                            mn: mn,
                                            alpha_t: alphaT,
                                            d: d,
                                            db: db,
                                            st: stMax,
                                            dFf: maxDff,
                                            da: dA,
                                            df: dF,
                                            rhoaP_coeff: rhoFpCoeff,
                                            eqResult: eqResult
                                        };

                                        if (typeof calculateGearProfile === 'function') {
                                            const profileRes = calculateGearProfile(gearGeomCache[i]);
                                            if (profileRes.success) {
                                                const canvas2d = document.getElementById('canvas-2d-' + i);
                                                const diVal = parseFloat(document.getElementById('di' + i).value) || 0;
                                                const holeCircle = parseFloat(document.getElementById('hole-circle-' + i)?.value) || 0;
                                                const holeDiameter = parseFloat(document.getElementById('hole-diameter-' + i)?.value) || 0;
                                                const numHoles = parseInt(document.getElementById('num-holes-' + i)?.value, 10) || 0;
                                                const holePattern = { holeCircle, holeDiameter, numHoles };
                                                
                                                if (canvas2d) {
                                                    _drawGear2D(canvas2d, profileRes.points, profileRes.geom, diVal, holePattern);
                                                }
                                                const canvas3d = document.getElementById('canvas-3d-' + i);
                                                if (canvas3d && typeof _drawGear3D === 'function') {
                                                    const bVal = parseFloat(document.getElementById('b' + i).value) || 10;
                                                    const gBeta = gearBetas[i - 1] || 0;
                                                    _drawGear3D(canvas3d, profileRes.points, profileRes.geom, bVal, gBeta, diVal, holePattern);
                                                }

                                                // Calculate and render cutting tool 2D profiles
                                                gearGeomCache[i].toolType = toolType;
                                                gearGeomCache[i].z0 = z0;
                                                if (typeof calculateToolProfile === 'function') {
                                                    const toolRes = calculateToolProfile(gearGeomCache[i]);
                                                    if (toolRes && toolRes.success) {
                                                        const canvasTool = document.getElementById('canvas-tool-' + i);
                                                        const canvasInMesh = document.getElementById('canvas-inmesh-' + i);

                                                        if (canvasTool) {
                                                            if (!window.canvasStates) window.canvasStates = {};
                                                            if (!window.canvasStates['canvas-tool-' + i]) window.canvasStates['canvas-tool-' + i] = { zoom: 1, offsetX: 0, offsetY: 0 };
                                                            const stateT = window.canvasStates['canvas-tool-' + i];
                                                            stateT.toolPts = toolRes.points;
                                                            stateT.toolRes = toolRes;
                                                            _drawTool2D(canvasTool, toolRes.points, toolRes);
                                                        }

                                                        if (canvasInMesh) {
                                                            if (!window.canvasStates) window.canvasStates = {};
                                                            if (!window.canvasStates['canvas-inmesh-' + i]) window.canvasStates['canvas-inmesh-' + i] = { zoom: 1, offsetX: 0, offsetY: 0, rollPhase: 0 };
                                                            const stateM = window.canvasStates['canvas-inmesh-' + i];
                                                            stateM.gearPts = profileRes.points;
                                                            stateM.toolPts = toolRes.points;
                                                            stateM.gearCache = gearGeomCache[i];
                                                            stateM.toolRes = toolRes;
                                                            _drawInMesh2D(canvasInMesh, profileRes.points, toolRes.points, gearGeomCache[i], toolRes, stateM.rollPhase || 0);
                                                        }

                                                        window.assemblyCache[i] = {
                                                            points: profileRes.points,
                                                            geom: profileRes.geom,
                                                            cache: gearGeomCache[i],
                                                            toolRes: toolRes
                                                        };
                                                    }
                                                }
                                            } else {
                                                console.warn('calculateGearProfile gear ' + i + ':', profileRes.error);
                                            }
                                        }
                                    }
                                } else {
                                    dffDisplay.textContent = '--';
                                    dffDisplay.style.color = '#dc3545';
                                    const maxRootRadiusCoeffEl = document.getElementById('max-root-radius-coeff-' + i);
                                    if (maxRootRadiusCoeffEl) maxRootRadiusCoeffEl.textContent = '--';
                                    const stepsContainer = document.getElementById('dff-steps-' + i);
                                    if (stepsContainer) stepsContainer.innerHTML = 'Error in calculation';
                                }
                            }
                        } else {
                            dffDisplay.textContent = '--';
                            dffDisplay.style.color = '#6c757d';
                            const maxRootRadiusCoeffEl = document.getElementById('max-root-radius-coeff-' + i);
                            if (maxRootRadiusCoeffEl) maxRootRadiusCoeffEl.textContent = '--';
                            const diRecEl = document.getElementById('di-rec-' + i);
                            if (diRecEl) diRecEl.textContent = '--';
                        }
                    }

                    if (resMax.success) {
                        xeMaxDisplay.textContent = resMax.value.toFixed(4);
                        xeMaxDisplay.style.color = '#0056b3';
                    } else {
                        xeMaxDisplay.textContent = '--';
                        xeMaxDisplay.style.color = '#dc3545';
                    }

                    if (resMin.success) {
                        xeMinDisplay.textContent = resMin.value.toFixed(4);
                        xeMinDisplay.style.color = '#0056b3';
                    } else {
                        xeMinDisplay.textContent = '--';
                        xeMinDisplay.style.color = '#dc3545';
                    }

                    // Calculate transverse and normal tooth thickness using xE values
                    if (stMaxDisplay && stMinDisplay && !isNaN(beta)) {
                        const cosBeta = Math.cos(Math.abs(beta) * Math.PI / 180);

                        if (resMax.success) {
                            const stMaxRes = calculateTransverseToothThickness(mn, Math.abs(beta), resMax.value, alphaN);
                            if (stMaxRes.success) {
                                stMaxDisplay.textContent = stMaxRes.value.toFixed(3);
                                stMaxDisplay.style.color = '#0056b3';
                                // sn = st * cos(beta)
                                if (snMaxDisplay) {
                                    snMaxDisplay.textContent = (stMaxRes.value * cosBeta).toFixed(3);
                                    snMaxDisplay.style.color = '#0056b3';
                                }
                            } else {
                                stMaxDisplay.textContent = '--';
                                stMaxDisplay.style.color = '#dc3545';
                                if (snMaxDisplay) { snMaxDisplay.textContent = '--'; snMaxDisplay.style.color = '#dc3545'; }
                            }

                            // V-Circle at Max Tooth Thickness (always uses xE_max)
                            if (dvMaxDisplay) {
                                const d = (Math.abs(zVal) * mn) / cosBeta;
                                const dvRes = calculateVCircleDiameter(d, zVal, resMax.value, mn);
                                if (dvRes.success) {
                                    dvMaxDisplay.textContent = dvRes.value.toFixed(3);
                                    dvMaxDisplay.style.color = '#0056b3';
                                } else {
                                    dvMaxDisplay.textContent = '--';
                                    dvMaxDisplay.style.color = '#dc3545';
                                }
                            }
                        } else {
                            stMaxDisplay.textContent = '--';
                            stMaxDisplay.style.color = '#6c757d';
                            if (snMaxDisplay) { snMaxDisplay.textContent = '--'; snMaxDisplay.style.color = '#6c757d'; }
                            if (dvMaxDisplay) { dvMaxDisplay.textContent = '--'; dvMaxDisplay.style.color = '#6c757d'; }
                        }

                        if (resMin.success) {
                            const stMinRes = calculateTransverseToothThickness(mn, Math.abs(beta), resMin.value, alphaN);
                            if (stMinRes.success) {
                                stMinDisplay.textContent = stMinRes.value.toFixed(3);
                                stMinDisplay.style.color = '#0056b3';
                                // sn = st * cos(beta)
                                if (snMinDisplay) {
                                    snMinDisplay.textContent = (stMinRes.value * cosBeta).toFixed(3);
                                    snMinDisplay.style.color = '#0056b3';
                                }
                            } else {
                                stMinDisplay.textContent = '--';
                                stMinDisplay.style.color = '#dc3545';
                                if (snMinDisplay) { snMinDisplay.textContent = '--'; snMinDisplay.style.color = '#dc3545'; }
                            }
                        } else {
                            stMinDisplay.textContent = '--';
                            stMinDisplay.style.color = '#6c757d';
                            if (snMinDisplay) { snMinDisplay.textContent = '--'; snMinDisplay.style.color = '#6c757d'; }
                        }

                        // 7.1. Ball Dimension Calculations
                        const dmVal = parseFloat(document.getElementById('dm-' + i).value);
                        const mdMaxDisplay = document.getElementById('md-max-' + i + '-out');
                        const mdMinDisplay = document.getElementById('md-min-' + i + '-out');
                        const mdLabel = document.getElementById('md-' + i + '-label');

                        if (mdMaxDisplay && mdMinDisplay && !isNaN(dmVal) && !isNaN(zVal)) {
                            const isInternal = zVal < 0;
                            const labelBase = isInternal ? 'Dimension Between Balls' : 'Dimension Over Balls';
                            if (mdLabel) mdLabel.innerHTML = `${labelBase} (M<sub>dK</sub>)`;

                            const d = (Math.abs(zVal) * mn) / cosBeta;

                            let mdMaxResult = { success: false };
                            let mdMinResult = { success: false };

                            if (resMax.success && resMin.success) {
                                const stMaxRes = calculateTransverseToothThickness(mn, Math.abs(beta), resMax.value, alphaN);
                                const stMinRes = calculateTransverseToothThickness(mn, Math.abs(beta), resMin.value, alphaN);

                                if (stMaxRes.success && stMinRes.success) {
                                    if (!isInternal) {
                                        mdMaxResult = calculateDimensionOverBalls(zVal, d, Math.abs(beta), alphaN, stMaxRes.value, dmVal);
                                        mdMinResult = calculateDimensionOverBalls(zVal, d, Math.abs(beta), alphaN, stMinRes.value, dmVal);
                                    } else {
                                        // Internal: st_min gives max dimension, st_max gives min dimension
                                        mdMaxResult = calculateDimensionBetweenBalls(zVal, d, Math.abs(beta), alphaN, stMinRes.value, dmVal);
                                        mdMinResult = calculateDimensionBetweenBalls(zVal, d, Math.abs(beta), alphaN, stMaxRes.value, dmVal);
                                    }
                                }
                            }

                            if (mdMaxResult.success) {
                                mdMaxDisplay.textContent = mdMaxResult.value.toFixed(3);
                                mdMaxDisplay.style.color = '#0056b3';
                            } else {
                                mdMaxDisplay.textContent = '--';
                                mdMaxDisplay.style.color = '#dc3545';
                            }

                            if (mdMinResult.success) {
                                mdMinDisplay.textContent = mdMinResult.value.toFixed(3);
                                mdMinDisplay.style.color = '#0056b3';
                            } else {
                                mdMinDisplay.textContent = '--';
                                mdMinDisplay.style.color = '#dc3545';
                            }
                        } else if (mdMaxDisplay && mdMinDisplay) {
                            mdMaxDisplay.textContent = '--';
                            mdMinDisplay.textContent = '--';
                            mdMaxDisplay.style.color = '#6c757d';
                            mdMinDisplay.style.color = '#6c757d';
                        }
                    }
                } else {
                    xeMaxDisplay.textContent = '--';
                    xeMinDisplay.textContent = '--';
                    xeMaxDisplay.style.color = '#6c757d';
                    xeMinDisplay.style.color = '#6c757d';
                    if (stMaxDisplay) { stMaxDisplay.textContent = '--'; stMaxDisplay.style.color = '#6c757d'; }
                    if (stMinDisplay) { stMinDisplay.textContent = '--'; stMinDisplay.style.color = '#6c757d'; }
                    if (snMaxDisplay) { snMaxDisplay.textContent = '--'; snMaxDisplay.style.color = '#6c757d'; }
                    if (snMinDisplay) { snMinDisplay.textContent = '--'; snMinDisplay.style.color = '#6c757d'; }
                    if (dvMaxDisplay) { dvMaxDisplay.textContent = '--'; dvMaxDisplay.style.color = '#6c757d'; }
                }
            }
        });
        // 8. Active Root Diameter (dNf) Calculations
        const dNfResults = [[], [], [], []];

        meshConfigs.forEach(m => {
            const group = document.getElementById('aw-tol-group-' + m.id);
            if (!group || group.classList.contains('hidden')) return;

            const awInput = document.getElementById('aw' + m.id);
            const tolInput = document.getElementById('aw-tol-' + m.id);
            if (!awInput || !tolInput) return;
            const awNom = parseFloat(awInput.value);
            const awTol = parseFloat(tolInput.value) || 0;
            const awValues = [awNom - awTol, awNom + awTol];

            const parseOut = (id) => {
                const el = document.getElementById(id);
                return el && el.textContent !== '--' ? parseFloat(el.textContent) : NaN;
            };

            const dbA = parseOut('db' + m.gA + '-out');
            const daMinA = parseOut('da-min-' + m.gA + '-out');
            const daMaxA = parseOut('da-max-' + m.gA + '-out');
            const zA = parseFloat(document.getElementById('z' + m.gA) ? document.getElementById('z' + m.gA).value : NaN);

            const dbB = parseOut('db' + m.gB + '-out');
            const daMinB = parseOut('da-min-' + m.gB + '-out');
            const daMaxB = parseOut('da-max-' + m.gB + '-out');
            const zB = parseFloat(document.getElementById('z' + m.gB) ? document.getElementById('z' + m.gB).value : NaN);

            if (isNaN(daMinA) || isNaN(daMaxA) || isNaN(dbA) || isNaN(zA) ||
                isNaN(daMinB) || isNaN(daMaxB) || isNaN(dbB) || isNaN(zB) || isNaN(awNom)) {
                return;
            }

            const calcDeepest = (awMin, awMax, dbSelf, dbMate, daMinMate, daMaxMate, zSelf, zMate) => {
                let currentAw, currentDaMate;

                if (zSelf > 0 && zMate > 0) {
                    currentAw = awMin;
                    currentDaMate = daMaxMate;
                } else {
                    currentAw = awMax;
                    if (zMate < 0) {
                        currentDaMate = daMinMate;
                    } else {
                        currentDaMate = daMaxMate;
                    }
                }

                if (currentAw <= 0) return null;
                const awRes = calculateWorkingTransversePressureAngle(zSelf, zMate, mn, alphaT, currentAw, beta);
                if (awRes.success) {
                    const res = calculateActiveRootDiameter(currentAw, awRes.value, dbSelf, dbMate, currentDaMate, zSelf);
                    if (res.success) {
                        return res.value;
                    }
                }
                return null;
            };

            const valA = calcDeepest(awValues[0], awValues[1], dbA, dbB, daMinB, daMaxB, zA, zB);
            if (valA !== null) dNfResults[m.gA - 1].push({ mesh: `${m.gA}-${m.gB}`, val: valA });

            const valB = calcDeepest(awValues[0], awValues[1], dbB, dbA, daMinA, daMaxA, zB, zA);
            if (valB !== null) dNfResults[m.gB - 1].push({ mesh: `${m.gA}-${m.gB}`, val: valB });
        });

        [1, 2, 3, 4].forEach(i => {
            const out = document.getElementById('dnf-' + i + '-out');
            const zInput = document.getElementById('z' + i);
            const isActive = zInput && !isNaN(parseFloat(zInput.value));

            if (out) {
                const resArray = dNfResults[i - 1];
                if (resArray.length > 0) {
                    if (resArray.length === 1) {
                        out.innerHTML = resArray[0].val.toFixed(3) + ' <span style="font-size: 0.9rem; color: #6c757d; margin-left: 3px;">mm</span>';
                    } else {
                        out.innerHTML = resArray.map(r => `<div style="font-size:0.95rem; line-height:1.3; margin-top:2px;">M${r.mesh}: ${r.val.toFixed(3)} <span style="font-size: 0.85rem; color: #6c757d;">mm</span></div>`).join('');
                    }
                    out.style.color = '#0056b3';
                } else {
                    out.textContent = '--';
                    out.style.color = isActive ? '#dc3545' : '#6c757d';
                }
            }
        });

        const canvasAssembly = document.getElementById('canvas-assembly');
        if (canvasAssembly && window.assemblyCache && window.canvasStates) {
            if (!window.canvasStates['canvas-assembly']) window.canvasStates['canvas-assembly'] = { zoom: 1, offsetX: 0, offsetY: 0, rollPhase: 0 };
            const stateA = window.canvasStates['canvas-assembly'];
            if (typeof _drawFullAssembly2D === 'function') {
                _drawFullAssembly2D(canvasAssembly, stateA);
            }
        }
    });

    // Initial calculation on page load
    if (calcAllBtn) calcAllBtn.click();

    // STL Export Handlers
    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById('export-stl-' + i);
        if (btn) {
            btn.addEventListener('click', () => {
                const canvasId = 'canvas-3d-' + i;
                const projectName = document.getElementById('project-name').value || 'Project';
                const filename = `${projectName}_Gear${i}.stl`.replace(/\s+/g, '_');
                if (typeof _exportGearSTL === 'function') {
                    _exportGearSTL(canvasId, filename);
                }
            });
        }
    }

    // Report Generation
    const reportBtn = document.getElementById('report-btn');
    reportBtn.addEventListener('click', () => {
        // auto-trigger calculate to ensure fresh values
        const calcAllBtn = document.getElementById('calc-all-btn');
        if (calcAllBtn) calcAllBtn.click();
        generateReport(currentPower);
    });


});
