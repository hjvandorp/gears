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

        const operatingCol3 = document.getElementById('operating-col-3');
        const operatingCol4 = document.getElementById('operating-col-4');
        const operatingTitle3 = document.getElementById('operating-title-3');

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
        const numPlanetsGroup = document.getElementById('num-planets-group');

        // Reset all to positive min=1 first
        [z1, z2, z3, z4].forEach(z => {
            if (z) z.setAttribute('min', '1');
        });

        // Reset operating parameter titles and labels to default gear names
        const refGearLabel1Reset = document.getElementById('ref-gear-label-1');
        if (refGearLabel1Reset) refGearLabel1Reset.textContent = 'Gear 1';
        const refGearLabel2Reset = document.getElementById('ref-gear-label-2');
        if (refGearLabel2Reset) refGearLabel2Reset.textContent = 'Gear 2';
        const refGearLabel3Reset = document.getElementById('ref-gear-label-3');
        if (refGearLabel3Reset) refGearLabel3Reset.textContent = 'Gear 3';

        const speedLabel2Reset = document.getElementById('speed-label-2');
        if (speedLabel2Reset) speedLabel2Reset.innerHTML = 'Speed, n<sub>2</sub> (RPM)';
        const torqueLabel2Reset = document.getElementById('torque-label-2');
        if (torqueLabel2Reset) torqueLabel2Reset.innerHTML = 'Torque, T<sub>2</sub> (Nm)';
        const powerLabel2Reset = document.getElementById('power-label-2');
        if (powerLabel2Reset) powerLabel2Reset.innerHTML = 'Power, P<sub>2</sub> (kW)';

        const refGearRadio3Reset = document.getElementById('ref-gear-radio-3');
        if (refGearRadio3Reset) refGearRadio3Reset.disabled = false;
        if (operatingTitle3) {
            operatingTitle3.style.opacity = '';
            operatingTitle3.style.cursor = 'pointer';
            operatingTitle3.title = '';
        }

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
            if (numPlanetsGroup) numPlanetsGroup.classList.add('hidden');
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
            if (operatingCol3) operatingCol3.classList.add('hidden');
            if (operatingCol4) operatingCol4.classList.add('hidden');
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

            const drawerMesh2 = document.getElementById('rating-drawer-mesh-2');
            const drawerMesh3 = document.getElementById('rating-drawer-mesh-3');
            if (drawerMesh2) drawerMesh2.classList.add('hidden');
            if (drawerMesh3) drawerMesh3.classList.add('hidden');

            if (z2) z2.removeAttribute('min');
        } else if (config === 'planetary') {
            cdLabel1.innerHTML = 'Working Center Distance, Sun-Planet (a<sub>w,12</sub>, mm)';
            if (cdLabel2) cdLabel2.innerHTML = 'Working Center Distance, Planet-Ring (a<sub>w,23</sub>, mm)';
            cgGroup2.classList.remove('hidden');
            cgGroup3.classList.add('hidden');
            if (numPlanetsGroup) numPlanetsGroup.classList.remove('hidden');
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
            if (operatingCol3) operatingCol3.classList.remove('hidden');
            if (operatingCol4) operatingCol4.classList.add('hidden');
            // In planetary config: Gear 1 is Sun, Gear 2 is Carrier, Gear 3 is Ring
            const refGearLabel1 = document.getElementById('ref-gear-label-1');
            if (refGearLabel1) refGearLabel1.textContent = 'Gear 1 (Sun)';
            const refGearLabel2 = document.getElementById('ref-gear-label-2');
            if (refGearLabel2) refGearLabel2.textContent = 'Carrier';
            const refGearLabel3 = document.getElementById('ref-gear-label-3');
            if (refGearLabel3) refGearLabel3.textContent = 'Gear 3 (Ring)';

            const speedLabel2 = document.getElementById('speed-label-2');
            if (speedLabel2) speedLabel2.innerHTML = 'Speed, n<sub>c</sub> (RPM)';
            const torqueLabel2 = document.getElementById('torque-label-2');
            if (torqueLabel2) torqueLabel2.innerHTML = 'Torque, T<sub>c</sub> (Nm)';
            const powerLabel2 = document.getElementById('power-label-2');
            if (powerLabel2) powerLabel2.innerHTML = 'Power, P<sub>c</sub> (kW)';

            // Ring gear speed is 0 (fixed/stationary), so ring gear cannot be reference
            const refGearRadio3 = document.getElementById('ref-gear-radio-3');
            if (refGearRadio3) {
                refGearRadio3.disabled = true;
                if (refGearRadio3.checked) {
                    const refGearRadio1 = document.getElementById('ref-gear-radio-1');
                    if (refGearRadio1) refGearRadio1.checked = true;
                }
            }
            if (operatingTitle3) {
                operatingTitle3.style.opacity = '0.6';
                operatingTitle3.style.cursor = 'default';
                operatingTitle3.title = 'Ring gear is fixed / stationary in this planetary configuration';
            }
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

            const drawerMesh2 = document.getElementById('rating-drawer-mesh-2');
            const drawerMesh3 = document.getElementById('rating-drawer-mesh-3');
            const summaryMesh2 = document.getElementById('summary-mesh-2');
            if (drawerMesh2) drawerMesh2.classList.remove('hidden');
            if (summaryMesh2) summaryMesh2.textContent = 'Intermediate ISO Factors: Planet-Ring Mesh (2-3)';
            if (drawerMesh3) drawerMesh3.classList.add('hidden');

            if (z3) z3.removeAttribute('min');
        } else if (config === '3-train') {
            cdLabel1.innerHTML = 'Working Center Distance, Gear 1-2 (a<sub>w,12</sub>, mm)';
            if (cdLabel2) cdLabel2.innerHTML = 'Working Center Distance, Gear 2-3 (a<sub>w,23</sub>, mm)';
            cgGroup2.classList.remove('hidden');
            cgGroup3.classList.add('hidden');
            if (numPlanetsGroup) numPlanetsGroup.classList.add('hidden');
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
            const refGearLabel3_train = document.getElementById('ref-gear-label-3');
            if (refGearLabel3_train) refGearLabel3_train.textContent = 'Gear 3';
            if (operatingCol3) operatingCol3.classList.remove('hidden');
            if (operatingCol4) operatingCol4.classList.add('hidden');
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

            const drawerMesh2_3 = document.getElementById('rating-drawer-mesh-2');
            const drawerMesh3_3 = document.getElementById('rating-drawer-mesh-3');
            const summaryMesh2_3 = document.getElementById('summary-mesh-2');
            if (drawerMesh2_3) drawerMesh2_3.classList.remove('hidden');
            if (summaryMesh2_3) summaryMesh2_3.textContent = 'Intermediate ISO Factors: Mesh 2-3';
            if (drawerMesh3_3) drawerMesh3_3.classList.add('hidden');

            if (z3) z3.removeAttribute('min');
        } else if (config === '4-train') {
            cdLabel1.innerHTML = 'Working Center Distance, Gear 1-2 (a<sub>w,12</sub>, mm)';
            if (cdLabel2) cdLabel2.innerHTML = 'Working Center Distance, Gear 2-3 (a<sub>w,23</sub>, mm)';
            cgGroup2.classList.remove('hidden');
            cgGroup3.classList.remove('hidden');
            if (numPlanetsGroup) numPlanetsGroup.classList.add('hidden');
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
            const refGearLabel3_4train = document.getElementById('ref-gear-label-3');
            if (refGearLabel3_4train) refGearLabel3_4train.textContent = 'Gear 3';
            if (operatingCol3) operatingCol3.classList.remove('hidden');
            if (operatingCol4) operatingCol4.classList.remove('hidden');
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

            const drawerMesh2_4 = document.getElementById('rating-drawer-mesh-2');
            const drawerMesh3_4 = document.getElementById('rating-drawer-mesh-3');
            const summaryMesh2_4 = document.getElementById('summary-mesh-2');
            if (drawerMesh2_4) drawerMesh2_4.classList.remove('hidden');
            if (summaryMesh2_4) summaryMesh2_4.textContent = 'Intermediate ISO Factors: Mesh 2-3';
            if (drawerMesh3_4) drawerMesh3_4.classList.remove('hidden');

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

    // ISO 6336-5 Material Configuration and Logic
    const ISO_MATERIALS = [
        { key: 'Eh', label: 'Eh - Case hardened wrought steels', defaultHardness: 730 },
        { key: 'V_alloy', label: 'V (alloy) - Through hardened wrought alloy steels', defaultHardness: 300 },
        { key: 'V_carbon', label: 'V (carbon) - Through hardened wrought carbon steels', defaultHardness: 175 },
        { key: 'St_wrought', label: 'St - Wrought normalized low carbon steels', defaultHardness: 160 },
        { key: 'St_cast', label: 'St (cast) - Cast normalized low carbon steels', defaultHardness: 175 },
        { key: 'V_cast_alloy', label: 'V (cast alloy) - Through hardened cast alloy steels', defaultHardness: 280 },
        { key: 'V_cast_carbon', label: 'V (cast carbon) - Through hardened cast carbon steels', defaultHardness: 170 },
        { key: 'IF', label: 'IF - Flame- or induction-hardened wrought/cast steels', defaultHardness: 550 },
        { key: 'NT_nitr', label: 'NT (nitr.) - Nitrided wrought nitriding steels', defaultHardness: 775 },
        { key: 'NV_nitr', label: 'NV (nitr.) - Through hardening steels, nitrided', defaultHardness: 550 },
        { key: 'NV_nitrocar', label: 'NV (nitrocar.) - Wrought steels nitrocarburized', defaultHardness: 475 },
        { key: 'GGG', label: 'GGG - Nodular cast iron', defaultHardness: 240 },
        { key: 'GTS_perl', label: 'GTS (perl.) - Black malleable cast iron (perlitic)', defaultHardness: 190 },
        { key: 'GG', label: 'GG - Grey cast iron', defaultHardness: 200 }
    ];

    function getQualityOptionsForMaterial(matKey) {
        if (matKey === 'Eh') {
            return [
                { value: 'ML', label: 'ML' },
                { value: 'MQ_lower', label: 'MQ (core \u2265 25 HRC, J12 < 28 HRC)' },
                { value: 'MQ', label: 'MQ (core \u2265 25 HRC, J12 \u2265 28 HRC)' },
                { value: 'MQ_high', label: 'MQ (core \u2265 30 HRC)' },
                { value: 'ME', label: 'ME' }
            ];
        }
        if (['St_wrought', 'St_cast', 'GTS_perl', 'GGG', 'GG', 'V_cast_carbon', 'V_cast_alloy'].includes(matKey)) {
            return [
                { value: 'ML_MQ', label: 'ML / MQ' },
                { value: 'ME', label: 'ME' }
            ];
        }
        return [
            { value: 'ML', label: 'ML' },
            { value: 'MQ', label: 'MQ' },
            { value: 'ME', label: 'ME' }
        ];
    }

    function updateMaterialStressLimits(gearIndex) {
        const matSelect = document.getElementById('mat' + gearIndex);
        const qualSelect = document.getElementById('mat-qual-' + gearIndex);
        const hardInput = document.getElementById('mat-hard-' + gearIndex);
        const sigHOut = document.getElementById('sigma-H-lim-' + gearIndex + '-out');
        const sigFOut = document.getElementById('sigma-F-lim-' + gearIndex + '-out');

        if (!matSelect || !qualSelect || !hardInput || !sigHOut || !sigFOut) return;

        const matKey = matSelect.value;
        const qualVal = qualSelect.value;
        const hardVal = parseFloat(hardInput.value);

        let actualQual = 'MQ';
        let coreCondition = undefined;

        if (matKey === 'Eh') {
            if (qualVal === 'ML') actualQual = 'ML';
            else if (qualVal === 'ME') actualQual = 'ME';
            else if (qualVal === 'MQ_lower') {
                actualQual = 'MQ';
                coreCondition = 'core_25HRC_lower';
            } else if (qualVal === 'MQ_high') {
                actualQual = 'MQ';
                coreCondition = 'core_30HRC';
            } else {
                actualQual = 'MQ';
                coreCondition = 'core_25HRC_upper';
            }
        } else if (qualVal === 'ML_MQ') {
            actualQual = 'MQ';
        } else {
            actualQual = qualVal || 'MQ';
        }

        const options = coreCondition ? { coreHardnessCondition: coreCondition } : {};

        if (typeof calculateAllowableContactStress_sigmaHlim === 'function' &&
            typeof calculateNominalBendingStress_sigmaFlim === 'function') {
            const resContact = calculateAllowableContactStress_sigmaHlim(matKey, actualQual, isNaN(hardVal) ? undefined : hardVal, options);
            const resBending = calculateNominalBendingStress_sigmaFlim(matKey, actualQual, isNaN(hardVal) ? undefined : hardVal, options);

            if (resContact && resContact.success) {
                sigHOut.innerHTML = `${resContact.value.toFixed(1)} <span style="font-size: 0.85rem; color: #6c757d;">N/mm\u00b2</span>`;
                sigHOut.style.color = '#0056b3';
            } else {
                sigHOut.textContent = '--';
                sigHOut.style.color = '#6c757d';
            }

            if (resBending && resBending.success) {
                sigFOut.innerHTML = `${resBending.value.toFixed(1)} <span style="font-size: 0.85rem; color: #6c757d;">N/mm\u00b2</span>`;
                sigFOut.style.color = '#0056b3';
            } else {
                sigFOut.textContent = '--';
                sigFOut.style.color = '#6c757d';
            }
        }
    }

    function initMaterialControls(gearIndex) {
        const matSelect = document.getElementById('mat' + gearIndex);
        const qualSelect = document.getElementById('mat-qual-' + gearIndex);
        const hardInput = document.getElementById('mat-hard-' + gearIndex);
        const hardLabel = document.getElementById('mat-hard-label-' + gearIndex);

        if (!matSelect || !qualSelect || !hardInput || !hardLabel) return;

        // Populate Material Types
        matSelect.innerHTML = '';
        ISO_MATERIALS.forEach(mat => {
            const opt = document.createElement('option');
            opt.value = mat.key;
            opt.textContent = mat.label;
            matSelect.appendChild(opt);
        });

        const updateQualAndHardness = (preserveHardness = false) => {
            const currentMatKey = matSelect.value;
            const matMeta = ISO_MATERIALS.find(m => m.key === currentMatKey) || ISO_MATERIALS[0];
            const matTableData = (typeof ISO_6336_5_TABLE_1 !== 'undefined') ? ISO_6336_5_TABLE_1[currentMatKey] : null;
            const unit = matTableData ? matTableData.hardnessUnit : 'HV';

            hardLabel.innerHTML = `Surface Hardness (${unit})`;

            const prevQual = qualSelect.value;
            const qualOpts = getQualityOptionsForMaterial(currentMatKey);
            qualSelect.innerHTML = '';
            qualOpts.forEach(q => {
                const opt = document.createElement('option');
                opt.value = q.value;
                opt.textContent = q.label;
                qualSelect.appendChild(opt);
            });

            // Restore previous quality if compatible, or select MQ / ML_MQ by default
            if (qualOpts.some(q => q.value === prevQual)) {
                qualSelect.value = prevQual;
            } else {
                const defaultQual = qualOpts.find(q => q.value === 'MQ' || q.value === 'ML_MQ') || qualOpts[0];
                qualSelect.value = defaultQual.value;
            }

            if (!preserveHardness || !hardInput.value) {
                hardInput.value = matMeta.defaultHardness;
            }

            updateMaterialStressLimits(gearIndex);
        };

        matSelect.addEventListener('change', () => {
            // If the user changed the material, update options and set default hardness for that material
            updateQualAndHardness(false);
        });
        qualSelect.addEventListener('change', () => updateMaterialStressLimits(gearIndex));
        hardInput.addEventListener('input', () => updateMaterialStressLimits(gearIndex));
        hardInput.addEventListener('change', () => updateMaterialStressLimits(gearIndex));

        // Default to Case hardened wrought steels (Eh)
        matSelect.value = 'Eh';
        updateQualAndHardness(false);
    }

    // Initialize Material controls for all 4 gears
    for (let i = 1; i <= 4; i++) {
        initMaterialControls(i);
    }

    // Kgamma tooltip hover
    const kgammaInfoTrigger = document.getElementById('kgamma-info-trigger');
    const kgammaTooltip = document.getElementById('kgamma-agma-tooltip');
    if (kgammaInfoTrigger && kgammaTooltip) {
        kgammaInfoTrigger.addEventListener('mouseenter', () => { kgammaTooltip.style.display = 'block'; });
        kgammaInfoTrigger.addEventListener('mouseleave', () => { kgammaTooltip.style.display = 'none'; });
    }

    // KA tooltip hover
    const kaInfoTrigger = document.getElementById('ka-info-trigger');
    const kaTooltip = document.getElementById('ka-agma-tooltip');
    if (kaInfoTrigger && kaTooltip) {
        kaInfoTrigger.addEventListener('mouseenter', () => { kaTooltip.style.display = 'block'; });
        kaInfoTrigger.addEventListener('mouseleave', () => { kaTooltip.style.display = 'none'; });
    }

    // Operating Parameters Controller
    function getSelectedReferenceGear() {
        const checked = document.querySelector('input[name="reference-gear"]:checked');
        return checked ? parseInt(checked.value, 10) : 1;
    }

    function getSelectedOperatingCalcMode() {
        // Read calc-mode from the reference gear's radio group
        const refGear = getSelectedReferenceGear();
        const checked = document.querySelector(`input[name="calc-mode-${refGear}"]:checked`);
        return checked ? checked.value : 'power';
    }

    function updateOperatingParametersEditability() {
        const config = document.getElementById('gear-config')?.value || 'pair';
        if (config === 'planetary') {
            const radio3 = document.getElementById('ref-gear-radio-3');
            if (radio3) {
                radio3.disabled = true;
                if (radio3.checked) {
                    const radio1 = document.getElementById('ref-gear-radio-1');
                    if (radio1) radio1.checked = true;
                }
            }
        }

        const refGear = getSelectedReferenceGear();
        const calcMode = getSelectedOperatingCalcMode();

        // Update hidden inputs for CSV export compatibility
        const refValInput = document.getElementById('reference-gear-val');
        if (refValInput) refValInput.value = refGear;
        const modeValInput = document.getElementById('calc-operating-mode-val');
        if (modeValInput) modeValInput.value = calcMode;

        for (let i = 1; i <= 4; i++) {
            const speedInput = document.getElementById('speed-' + i);
            const torqueInput = document.getElementById('torque-' + i);
            const powerInput = document.getElementById('power-' + i);

            // Enable/disable calc-mode radios for this gear (radio input has .calc-mode-label class)
            const calcModeRadios = document.querySelectorAll(`#operating-col-${i} input.calc-mode-label`);
            calcModeRadios.forEach(radio => {
                const parentLabel = radio.closest('label');
                if (i === refGear) {
                    radio.disabled = false;
                    if (parentLabel) {
                        parentLabel.style.opacity = '';
                        parentLabel.style.pointerEvents = '';
                        parentLabel.style.cursor = 'pointer';
                    }
                } else {
                    radio.disabled = true;
                    if (parentLabel) {
                        parentLabel.style.opacity = '0.35';
                        parentLabel.style.pointerEvents = 'none';
                        parentLabel.style.cursor = 'default';
                    }
                }
            });

            if (!speedInput || !torqueInput || !powerInput) continue;

            if (i === refGear) {
                // Reference gear: editable except the 1 chosen to be calculated
                speedInput.readOnly = (calcMode === 'speed');
                torqueInput.readOnly = (calcMode === 'torque');
                powerInput.readOnly = (calcMode === 'power');

                speedInput.style.backgroundColor = (calcMode === 'speed') ? 'rgba(255, 255, 255, 0.05)' : '';
                torqueInput.style.backgroundColor = (calcMode === 'torque') ? 'rgba(255, 255, 255, 0.05)' : '';
                powerInput.style.backgroundColor = (calcMode === 'power') ? 'rgba(255, 255, 255, 0.05)' : '';

                speedInput.style.color = (calcMode === 'speed') ? '#0056b3' : '';
                torqueInput.style.color = (calcMode === 'torque') ? '#0056b3' : '';
                powerInput.style.color = (calcMode === 'power') ? '#0056b3' : '';
            } else {
                // Non-reference gears: filled by calculation, non-editable
                speedInput.readOnly = true;
                torqueInput.readOnly = true;
                powerInput.readOnly = true;

                speedInput.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                torqueInput.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                powerInput.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';

                speedInput.style.color = '#0056b3';
                torqueInput.style.color = '#0056b3';
                powerInput.style.color = '#0056b3';
            }
        }
    }

    function initOperatingParametersControls() {
        const refRadios = document.querySelectorAll('input[name="reference-gear"]');
        refRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                updateOperatingParametersEditability();
            });
        });

        // Listen to all per-gear calc-mode radio groups
        for (let i = 1; i <= 4; i++) {
            const modeRadios = document.querySelectorAll(`input[name="calc-mode-${i}"]`);
            modeRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    updateOperatingParametersEditability();
                });
            });
        }

        // Set default values if empty
        const speed1 = document.getElementById('speed-1');
        const torque1 = document.getElementById('torque-1');
        if (speed1 && !speed1.value) speed1.value = 1440;
        if (torque1 && !torque1.value) torque1.value = 150;

        updateOperatingParametersEditability();
    }

    initOperatingParametersControls();

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

        // 1.9 Number of Planets Options
        if (config === 'planetary') {
            const planetOptionsOut = document.getElementById('planet-options-out');
            if (planetOptionsOut) {
                if (!isNaN(z1) && !isNaN(z3) && !isNaN(z2) && awRes1.success && !isNaN(x2Val) && !isNaN(mn) && !isNaN(beta)) {
                    const haPCoeff2El = document.getElementById('addendum-coeff-2');
                    const haPCoeff2 = parseFloat(haPCoeff2El ? haPCoeff2El.value : NaN);

                    if (!isNaN(haPCoeff2)) {
                        const tipAlteration2El = document.getElementById('tip-alteration-2');
                        const tipAlteration2Mm = parseFloat(tipAlteration2El ? tipAlteration2El.value : 0) || 0;
                        const kCoeff2 = (mn > 0) ? (tipAlteration2Mm / mn) : 0;
                        const daTol2El = document.getElementById('da-tol-2');
                        const daTol2 = daTol2El ? Math.abs(parseFloat(daTol2El.value) || 0) : 0;

                        const cosBeta = Math.cos(Math.abs(beta) * Math.PI / 180);
                        const d2 = (Math.abs(z2) * mn) / cosBeta;
                        const daRes2 = calculateTipDiameter(d2, z2, haPCoeff2, x2Val, kCoeff2, mn);

                        if (daRes2.success) {
                            const baseTipDia = daRes2.value;
                            let da2Max;
                            if (z2 > 0) {
                                da2Max = baseTipDia;
                            } else {
                                da2Max = baseTipDia + daTol2;
                            }

                            const aw12 = !isNaN(aw1) ? aw1 : calculateStandardCenterDistance(z1, z2, mn, beta).value;

                            const validPlanets = [];
                            for (let N = 1; N <= 50; N++) {
                                if (Math.abs(z1 - z3) % N === 0) {
                                    const distance = 2 * aw12 * Math.sin(Math.PI / N);
                                    if (da2Max < distance) {
                                        validPlanets.push(N);
                                    }
                                }
                            }
                            if (validPlanets.length > 0) {
                                planetOptionsOut.textContent = validPlanets.join(', ');
                                planetOptionsOut.style.color = '#0056b3';
                            } else {
                                planetOptionsOut.textContent = 'None';
                                planetOptionsOut.style.color = '#dc3545';
                            }
                        } else {
                            planetOptionsOut.textContent = '--';
                            planetOptionsOut.style.color = '#dc3545';
                        }
                    } else {
                        planetOptionsOut.textContent = '--';
                        planetOptionsOut.style.color = '#6c757d';
                    }
                } else {
                    planetOptionsOut.textContent = '--';
                    planetOptionsOut.style.color = '#6c757d';
                }
            }
        }

        // 3. Rating Data (Operating Parameters, Power & Material Strengths)
        const refGear = getSelectedReferenceGear();
        const calcMode = getSelectedOperatingCalcMode();

        const speedRefInput = document.getElementById('speed-' + refGear);
        const torqueRefInput = document.getElementById('torque-' + refGear);
        const powerRefInput = document.getElementById('power-' + refGear);

        let nRef = parseFloat(speedRefInput ? speedRefInput.value : NaN);
        let tRef = parseFloat(torqueRefInput ? torqueRefInput.value : NaN);
        let pRef = parseFloat(powerRefInput ? powerRefInput.value : NaN);

        let opError = null;

        // Calculate missing reference gear parameter
        if (calcMode === 'power') {
            if (isNaN(nRef) || isNaN(tRef)) {
                opError = 'Please enter valid speed and torque for reference gear.';
            } else {
                pRef = (tRef * nRef * 2 * Math.PI) / 60000;
                if (powerRefInput) powerRefInput.value = pRef.toFixed(3);
            }
        } else if (calcMode === 'torque') {
            if (isNaN(nRef) || isNaN(pRef)) {
                opError = 'Please enter valid speed and power for reference gear.';
            } else if (nRef === 0) {
                opError = 'Speed cannot be 0 to calculate torque.';
            } else {
                tRef = (pRef * 60000) / (nRef * 2 * Math.PI);
                if (torqueRefInput) torqueRefInput.value = tRef.toFixed(3);
            }
        } else if (calcMode === 'speed') {
            if (isNaN(tRef) || isNaN(pRef)) {
                opError = 'Please enter valid torque and power for reference gear.';
            } else if (tRef === 0) {
                opError = 'Torque cannot be 0 to calculate speed.';
            } else {
                nRef = (pRef * 60000) / (tRef * 2 * Math.PI);
                if (speedRefInput) speedRefInput.value = nRef.toFixed(3);
            }
        }

        // Calculate and propagate speed, torque, and power to other gears
        const activeGearCount = (config === 'pair') ? 2 : (config === '4-train' ? 4 : 3);
        const zArr = [z1, z2, z3, z4];

        if (!opError && !isNaN(nRef) && !isNaN(tRef) && !isNaN(pRef)) {
            if (config === 'planetary') {
                const zS = Math.abs(z1);
                const zR = Math.abs(z3);

                if (!isNaN(zS) && !isNaN(zR) && zS > 0 && zR > 0) {
                    const uSR = zR / zS; // z3 / z1
                    const uCarrier = uSR + 1; // z3 / z1 + 1

                    let n1_val, t1_val, p1_val;
                    let nc_val, tc_val, pc_val;
                    let n3_val, t3_val, p3_val;

                    if (refGear === 2) {
                        // Carrier is reference
                        nc_val = nRef;
                        tc_val = tRef;
                        pc_val = pRef;

                        n1_val = nc_val * uCarrier;
                        t1_val = tc_val / uCarrier;
                        p1_val = pc_val;

                        n3_val = 0;
                        t3_val = t1_val * uSR;
                        p3_val = 0;
                    } else {
                        // Sun is reference (refGear === 1 or fallback)
                        n1_val = nRef;
                        t1_val = tRef;
                        p1_val = pRef;

                        nc_val = n1_val / uCarrier;
                        tc_val = t1_val * uCarrier;
                        pc_val = p1_val;

                        n3_val = 0;
                        t3_val = t1_val * uSR;
                        p3_val = 0;
                    }

                    const speedInputs = [
                        document.getElementById('speed-1'),
                        document.getElementById('speed-2'),
                        document.getElementById('speed-3')
                    ];
                    const torqueInputs = [
                        document.getElementById('torque-1'),
                        document.getElementById('torque-2'),
                        document.getElementById('torque-3')
                    ];
                    const powerInputs = [
                        document.getElementById('power-1'),
                        document.getElementById('power-2'),
                        document.getElementById('power-3')
                    ];

                    const speeds = [n1_val, nc_val, n3_val];
                    const torques = [t1_val, tc_val, t3_val];
                    const powers = [p1_val, pc_val, p3_val];

                    for (let i = 1; i <= 3; i++) {
                        if (i !== refGear) {
                            if (speedInputs[i - 1]) speedInputs[i - 1].value = Math.abs(speeds[i - 1]).toFixed(2);
                            if (torqueInputs[i - 1]) torqueInputs[i - 1].value = Math.abs(torques[i - 1]).toFixed(2);
                            if (powerInputs[i - 1]) powerInputs[i - 1].value = powers[i - 1].toFixed(3);
                        }
                    }

                    currentPower = `${pRef.toFixed(3)} kW`;
                    showResult(ratingResultContainer, ratingResultValue, 'Operating Power', currentPower);

                    // Backward compatibility for hidden torque & speed
                    const tHidden = document.getElementById('torque');
                    const sHidden = document.getElementById('speed');
                    if (tHidden) tHidden.value = Math.abs(tRef);
                    if (sHidden) sHidden.value = Math.abs(nRef);
                } else {
                    currentPower = null;
                    showResult(ratingResultContainer, ratingResultValue, 'Operating Power', 'Invalid tooth numbers for planetary gear train.', true);
                }
            } else {
                // Standard sequential external meshes
                const ratioToG1 = [1];
                for (let k = 1; k < 4; k++) {
                    const zPrev = Math.abs(zArr[k - 1]);
                    const zCurr = Math.abs(zArr[k]);
                    if (!isNaN(zPrev) && !isNaN(zCurr) && zCurr > 0) {
                        ratioToG1[k] = ratioToG1[k - 1] * (-zPrev / zCurr);
                    } else {
                        ratioToG1[k] = 1;
                    }
                }

                const refRatio = ratioToG1[refGear - 1] || 1;

                for (let i = 1; i <= activeGearCount; i++) {
                    const sInput = document.getElementById('speed-' + i);
                    const tInput = document.getElementById('torque-' + i);
                    const pInput = document.getElementById('power-' + i);

                    const gearRatioFromRef = (ratioToG1[i - 1] || 1) / refRatio;
                    const ni = nRef * gearRatioFromRef;
                    const ti = gearRatioFromRef !== 0 ? (tRef / gearRatioFromRef) : 0;
                    const pi = pRef; // Transmitted power conserved across stages

                    if (i !== refGear) {
                        if (sInput) sInput.value = Math.abs(ni).toFixed(2);
                        if (tInput) tInput.value = Math.abs(ti).toFixed(2);
                        if (pInput) pInput.value = pi.toFixed(3);
                    }
                }

                currentPower = `${pRef.toFixed(3)} kW`;
                showResult(ratingResultContainer, ratingResultValue, 'Operating Power', currentPower);

                // Backward compatibility for hidden torque & speed
                const tHidden = document.getElementById('torque');
                const sHidden = document.getElementById('speed');
                if (tHidden) tHidden.value = Math.abs(tRef);
                if (sHidden) sHidden.value = Math.abs(nRef);
            }
        } else {
            currentPower = null;
            showResult(ratingResultContainer, ratingResultValue, 'Operating Power', opError || 'Invalid operating data.', true);
        }

        for (let i = 1; i <= 4; i++) {
            updateMaterialStressLimits(i);
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
                    const tipAlterationInputEl = document.getElementById('tip-alteration-' + i);
                    const tipAlterationVal = parseFloat(tipAlterationInputEl ? tipAlterationInputEl.value : NaN);
                    const tipAlterationMm = !isNaN(tipAlterationVal) ? tipAlterationVal : 0;
                    const kCoeff = (mn > 0) ? (tipAlterationMm / mn) : 0;

                    const tipAlterationCoeffDisplay = document.getElementById('tip-alteration-coeff-' + i);
                    if (tipAlterationCoeffDisplay) {
                        if (!isNaN(tipAlterationVal) && mn > 0) {
                            tipAlterationCoeffDisplay.textContent = kCoeff.toFixed(4);
                        } else {
                            tipAlterationCoeffDisplay.textContent = (0).toFixed(4);
                        }
                    }

                    const daTolEl = document.getElementById('da-tol-' + i);
                    const daTol = daTolEl ? Math.abs(parseFloat(daTolEl.value) || 0) : 0;

                    if (daMaxDisplay && daMinDisplay) {
                        if (resMax.success && resMin.success && !isNaN(haPCoeff) && !isNaN(zVal) && !isNaN(beta)) {
                            const cosBeta = Math.cos(Math.abs(beta) * Math.PI / 180);
                            const d = (Math.abs(zVal) * mn) / cosBeta;

                            const daRes = calculateTipDiameter(d, zVal, haPCoeff, xNom, kCoeff, mn);

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
                            const daRes = calculateTipDiameter(d, zVal, haPCoeff, xNom, kCoeff, mn);
                            let dA = NaN;
                            if (daRes.success) {
                                dA = daRes.value; // For both external (positive zVal where daMax = baseTipDia) and internal (negative zVal where daMin = baseTipDia)
                            }

                            const tanAlphaN = Math.tan(alphaN * Math.PI / 180);
                            const snMax = mn * (Math.PI / 2 + 2 * resMax.value * tanAlphaN);
                            const snMin = mn * (Math.PI / 2 + 2 * resMin.value * tanAlphaN);

                            if (dbRes.success && dfMaxRes.success && !isNaN(dA)) {
                                const db = dbRes.value;
                                const dF = dfMaxRes.value;

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
                                        const diVal = parseFloat(document.getElementById('di' + i)?.value) || 0;
                                        const holeCircle = parseFloat(document.getElementById('hole-circle-' + i)?.value) || 0;
                                        const holeDiameter = parseFloat(document.getElementById('hole-diameter-' + i)?.value) || 0;
                                        const numHoles = parseInt(document.getElementById('num-holes-' + i)?.value, 10) || 0;
                                        const holePattern = { holeCircle, holeDiameter, numHoles };

                                        const stMax = snMax / cosBetaG;
                                        const dmVal = parseFloat(document.getElementById('dm-' + i)?.value) || 0;
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
                                            eqResult: eqResult,
                                            di: diVal,
                                            holePattern: holePattern,
                                            beta: beta,
                                            alphaN: alphaN,
                                            dmVal: dmVal
                                        };

                                        if (typeof calculateGearProfile === 'function') {
                                            const profileRes = calculateGearProfile(gearGeomCache[i]);
                                            if (profileRes.success) {
                                                const canvas2d = document.getElementById('canvas-2d-' + i);

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

        // ==========================================
        // 8. ISO 6336 RATING CALCULATION PIPELINE
        // ==========================================
        window.isoRatingResults = [];
        const ratingSummaryCardsEl = document.getElementById('rating-summary-cards');

        try {
            // Read Operating Parameters
            const targetLifeHours = parseFloat(document.getElementById('target-life-hours')?.value) || 20000;
            const KA_user = Math.max(1.0, parseFloat(document.getElementById('ka-factor')?.value) || 1.25);
            const Kgamma_user = Math.max(1.0, parseFloat(document.getElementById('k-gamma-factor')?.value) || 1.0);
            const isReversedBendingGlobal = Boolean(document.getElementById('reversed-bending-check')?.checked);

            // Read Lubrication Parameters
            const lubeType = document.getElementById('lube-type')?.value || 'mineral';
            const v40 = parseFloat(document.getElementById('viscosity-grade')?.value) || 220;
            const oilTemp = parseFloat(document.getElementById('oil-temp')?.value) || 70;
            const lubeMethod = document.getElementById('lube-method')?.value || 'splash';

            // Active mesh definitions based on gear configuration
            const ratingMeshDefs = [];
            if (config === 'pair') {
                ratingMeshDefs.push({
                    id: 1,
                    meshTitle: 'Mesh 1-2 (Pinion–Wheel)',
                    g1: 1,
                    g2: 2,
                    isInternal: false,
                    isPlanetary: false,
                    drawerId: 'rating-drawer-mesh-1',
                    contentId: 'drawer-content-mesh-1'
                });
            } else if (config === '3-train') {
                ratingMeshDefs.push({
                    id: 1,
                    meshTitle: 'Mesh 1-2 (Input–Idler)',
                    g1: 1,
                    g2: 2,
                    isInternal: false,
                    isPlanetary: false,
                    drawerId: 'rating-drawer-mesh-1',
                    contentId: 'drawer-content-mesh-1'
                });
                ratingMeshDefs.push({
                    id: 2,
                    meshTitle: 'Mesh 2-3 (Idler–Output)',
                    g1: 2,
                    g2: 3,
                    isInternal: false,
                    isPlanetary: false,
                    drawerId: 'rating-drawer-mesh-2',
                    contentId: 'drawer-content-mesh-2'
                });
            } else if (config === '4-train') {
                ratingMeshDefs.push({
                    id: 1,
                    meshTitle: 'Mesh 1-2 (Input–Idler 1)',
                    g1: 1,
                    g2: 2,
                    isInternal: false,
                    isPlanetary: false,
                    drawerId: 'rating-drawer-mesh-1',
                    contentId: 'drawer-content-mesh-1'
                });
                ratingMeshDefs.push({
                    id: 2,
                    meshTitle: 'Mesh 2-3 (Idler 1–Idler 2)',
                    g1: 2,
                    g2: 3,
                    isInternal: false,
                    isPlanetary: false,
                    drawerId: 'rating-drawer-mesh-2',
                    contentId: 'drawer-content-mesh-2'
                });
                ratingMeshDefs.push({
                    id: 3,
                    meshTitle: 'Mesh 3-4 (Idler 2–Output)',
                    g1: 3,
                    g2: 4,
                    isInternal: false,
                    isPlanetary: false,
                    drawerId: 'rating-drawer-mesh-3',
                    contentId: 'drawer-content-mesh-3'
                });
            } else if (config === 'planetary') {
                ratingMeshDefs.push({
                    id: 1,
                    meshTitle: 'Sun–Planet Mesh (1-2)',
                    g1: 1,
                    g2: 2,
                    isInternal: false,
                    isPlanetary: true,
                    isSunPlanet: true,
                    drawerId: 'rating-drawer-mesh-1',
                    contentId: 'drawer-content-mesh-1'
                });
                ratingMeshDefs.push({
                    id: 2,
                    meshTitle: 'Planet–Ring Mesh (2-3)',
                    g1: 2,
                    g2: 3,
                    isInternal: true,
                    isPlanetary: true,
                    isPlanetRing: true,
                    drawerId: 'rating-drawer-mesh-2',
                    contentId: 'drawer-content-mesh-2'
                });
            }

            let summaryCardsHTML = '';

            // Calculate each mesh
            ratingMeshDefs.forEach(mesh => {
                const gA = mesh.g1;
                const gB = mesh.g2;

                const zA_raw = parseFloat(document.getElementById('z' + gA)?.value);
                const zB_raw = parseFloat(document.getElementById('z' + gB)?.value);
                const bA = parseFloat(document.getElementById('b' + gA)?.value) || 30;
                const bB = parseFloat(document.getElementById('b' + gB)?.value) || 30;
                const bMesh = Math.min(bA, bB);

                const speedA = Math.abs(parseFloat(document.getElementById('speed-' + gA)?.value) || 0);
                const torqueA = Math.abs(parseFloat(document.getElementById('torque-' + gA)?.value) || 0);
                const speedB = Math.abs(parseFloat(document.getElementById('speed-' + gB)?.value) || 0);

                const zA = Math.abs(zA_raw);
                const zB = Math.abs(zB_raw);

                if (isNaN(zA) || isNaN(zB) || zA <= 0 || zB <= 0 || isNaN(mn) || mn <= 0) {
                    const drawerContentEl = document.getElementById(mesh.contentId);
                    if (drawerContentEl) {
                        drawerContentEl.innerHTML = '<span style="color:#6c757d; font-style: italic;">Enter module (m<sub>n</sub>) and teeth numbers (z) in Basic Data, then click Calculate All to compute ISO rating factors.</span>';
                    }
                    return;
                }

                // Base & reference pitch diameters
                const cosBetaRef = Math.cos(Math.abs(beta) * Math.PI / 180);
                const d1 = (zA * mn) / cosBetaRef;
                const d2 = (zB * mn) / cosBetaRef;
                const alphaTRad = alphaT * (Math.PI / 180);
                const db1 = d1 * Math.cos(alphaTRad);
                const db2 = d2 * Math.cos(alphaTRad);

                // Tip diameters
                const da1 = parseFloat(document.getElementById('da-max-' + gA + '-out')?.textContent) || (d1 + 2 * mn);
                const da2 = parseFloat(document.getElementById('da-max-' + gB + '-out')?.textContent) || (d2 + (mesh.isInternal ? -2 * mn : 2 * mn));

                // Working transverse pressure angle & center distance
                let alpha_wt = alphaT;
                let awMesh = (mesh.isInternal ? Math.abs(d2 - d1) : (d1 + d2)) / 2;
                if (mesh.id === 1) {
                    const awVal = parseFloat(document.getElementById('aw1')?.value);
                    if (!isNaN(awVal) && awVal > 0) awMesh = awVal;
                    if (awRes1 && awRes1.success) alpha_wt = awRes1.value;
                } else if (mesh.id === 2) {
                    const awVal = parseFloat(document.getElementById('aw2')?.value);
                    if (!isNaN(awVal) && awVal > 0) awMesh = awVal;
                    if (awRes2 && awRes2.success) alpha_wt = awRes2.value;
                } else if (mesh.id === 3) {
                    const awVal = parseFloat(document.getElementById('aw3')?.value);
                    if (!isNaN(awVal) && awVal > 0) awMesh = awVal;
                    if (awRes3 && awRes3.success) alpha_wt = awRes3.value;
                }

                // Transverse contact ratio eps_alpha
                let eps_alpha = 1.5;
                const pbt = Math.PI * mn * Math.cos(alphaN * Math.PI / 180) / cosBetaRef;
                const awtRad = alpha_wt * (Math.PI / 180);
                try {
                    const gB_sign = zB_raw / Math.abs(zB_raw);
                    const t1Term = Math.max(0, Math.pow(da1, 2) - Math.pow(db1, 2));
                    const t2Term = Math.max(0, Math.pow(da2, 2) - Math.pow(db2, 2));
                    // ISO 6336-2: For external pair: 0.5*(sqrt(t1)+sqrt(t2)) - a_w*sin(awt)
                    // For internal pair (gB_sign = -1): 0.5*(sqrt(t1)-sqrt(t2)) + a_w*sin(awt)
                    const gAction = 0.5 * Math.sqrt(t1Term) + 0.5 * gB_sign * Math.sqrt(t2Term) - gB_sign * awMesh * Math.sin(awtRad);
                    if (pbt > 0 && gAction > 0) {
                        eps_alpha = Math.max(1.05, gAction / pbt);
                    }
                } catch (e) {
                    eps_alpha = 1.5;
                }

                // Overlap ratio eps_beta = b * sin(|beta|) / (pi * mn)
                const eps_beta = (Math.abs(beta) > 0) ? (bMesh * Math.sin(Math.abs(beta) * Math.PI / 180)) / (Math.PI * mn) : 0;

                // Tangential load Ft (N) at reference diameter d1
                // For planetary meshes with N_p planets, load splits across planets:
                const numPlanetsVal = (config === 'planetary') ? (parseInt(document.getElementById('num-planets')?.value, 10) || 3) : 1;
                let FtMesh;
                let vPitch;
                let effSpeedA = speedA;
                let effSpeedB = speedB;

                if (mesh.isPlanetary) {
                    const zS = Math.abs(parseFloat(document.getElementById('z1')?.value) || 1);
                    const zP = Math.abs(parseFloat(document.getElementById('z2')?.value) || 1);
                    const zR = Math.abs(parseFloat(document.getElementById('z3')?.value) || 1);
                    const nSun = Math.abs(parseFloat(document.getElementById('speed-1')?.value) || 0);
                    const tSun = Math.abs(parseFloat(document.getElementById('torque-1')?.value) || 0);
                    const nCarrier = Math.abs(parseFloat(document.getElementById('speed-2')?.value) || 0);
                    const dSun = (zS * mn) / cosBetaRef;

                    // Tangential force transmitted per planet mesh:
                    FtMesh = (tSun > 0 && dSun > 0) ? (2000.0 * tSun) / (dSun * numPlanetsVal) : 1000.0;

                    // Pitch line velocity relative to carrier:
                    const nRelSun = Math.abs(nSun - nCarrier);
                    vPitch = (Math.PI * dSun * nRelSun) / 60000.0;

                    const nPlanetRel = zP > 0 ? (nRelSun * zS / zP) : 0;

                    if (mesh.isSunPlanet) {
                        effSpeedA = nRelSun;
                        effSpeedB = nPlanetRel;
                    } else if (mesh.isPlanetRing) {
                        effSpeedA = nPlanetRel;
                        effSpeedB = nCarrier;
                    }
                } else {
                    FtMesh = (torqueA > 0 && d1 > 0) ? (2000.0 * torqueA) / d1 : 1000.0;
                    vPitch = (Math.PI * d1 * speedA) / 60000.0;
                }

                // Flank tolerance class
                const qClassA = parseInt(document.getElementById('quality-grade-' + gA)?.value, 10) || 6;
                const qClassB = parseInt(document.getElementById('quality-grade-' + gB)?.value, 10) || 6;
                const tolClass = Math.round((qClassA + qClassB) / 2);

                // Material limits from ISO-6336-5 outputs
                const matA = document.getElementById('mat' + gA)?.value || 'Eh';
                const matB = document.getElementById('mat' + gB)?.value || 'Eh';
                const sigHlimA = parseFloat(document.getElementById('sigma-H-lim-' + gA + '-out')?.textContent) || 1500;
                const sigHlimB = parseFloat(document.getElementById('sigma-H-lim-' + gB + '-out')?.textContent) || 1500;
                const sigFlimA = parseFloat(document.getElementById('sigma-F-lim-' + gA + '-out')?.textContent) || 430;
                const sigFlimB = parseFloat(document.getElementById('sigma-F-lim-' + gB + '-out')?.textContent) || 430;

                // Shaft and mounting defaults / inputs
                const dshInputA = parseFloat(document.getElementById('dsh-' + gA)?.value);
                const lSpanInputA = parseFloat(document.getElementById('l-span-' + gA)?.value);
                const sOffsetInputA = parseFloat(document.getElementById('s-offset-' + gA)?.value);
                const mountTypeA = document.getElementById('mount-type-' + gA)?.value || 'symmetric';

                const dshA = (!isNaN(dshInputA) && dshInputA > 0) ? dshInputA : (0.85 * d1);
                const lSpanA = (!isNaN(lSpanInputA) && lSpanInputA > 0) ? lSpanInputA : (2.0 * bA + 40.0);
                const sOffsetA = (!isNaN(sOffsetInputA)) ? sOffsetInputA : (0.1 * lSpanA);
                const KprimeA = (mountTypeA === 'cantilever') ? 0.95 : 0.48;

                // Tooth root tool profile parameters for Gear A and Gear B
                const hfpCoeffA = parseFloat(document.getElementById('dedendum-coeff-' + gA)?.value) || 1.25;
                const hfpCoeffB = parseFloat(document.getElementById('dedendum-coeff-' + gB)?.value) || 1.25;
                const rhofpCoeffA = parseFloat(document.getElementById('root-radius-coeff-' + gA)?.value) || 0.38;
                const rhofpCoeffB = parseFloat(document.getElementById('root-radius-coeff-' + gB)?.value) || 0.38;

                // ISO 6336-1: Mesh stiffness
                const resStiff = calculateToothStiffness_B({
                    z1: zA,
                    z2: zB,
                    beta: Math.abs(beta),
                    x1: parseFloat(document.getElementById('x' + gA)?.value) || 0,
                    x2: parseFloat(document.getElementById('x' + gB)?.value) || 0,
                    eps_alpha: eps_alpha,
                    b: bMesh,
                    Ft: FtMesh,
                    KA: KA_user,
                    Kgamma: Kgamma_user,
                    hfp_mn: hfpCoeffA,
                    alpha_Pn: alphaN
                });
                const c_gamma_alpha = resStiff.success ? resStiff.c_gamma_alpha : 20.0;
                const c_gamma_beta = resStiff.success ? resStiff.c_gamma_beta : 17.0;

                // ISO 6336-1: Dynamic factor Kv
                const resKv = calculateDynamicFactor_C({
                    v: Math.max(0.1, vPitch),
                    z1: zA,
                    u: Math.max(1.0, zB / zA),
                    toleranceClass: tolClass,
                    Ft: FtMesh,
                    b: bMesh,
                    KA: KA_user,
                    Kgamma: Kgamma_user,
                    beta: Math.abs(beta),
                    eps_beta: eps_beta
                });
                const Kv = resKv.success ? resKv.value : 1.15;

                // ISO 6336-1: Face load factors KHbeta and KFbeta
                const resFace = calculateFaceLoadFactors_C({
                    Ft: FtMesh,
                    b: bMesh,
                    d1: d1,
                    dsh: dshA,
                    l: lSpanA,
                    s: sOffsetA,
                    h: 2.25 * mn,
                    c_gamma_beta: c_gamma_beta,
                    KA: KA_user,
                    Kgamma: Kgamma_user,
                    Kv: Kv,
                    toleranceClass: tolClass,
                    material: matA,
                    sigmaHlim: Math.min(sigHlimA, sigHlimB),
                    v: Math.max(0.1, vPitch),
                    K_prime: KprimeA
                });
                const KHbeta = resFace.success ? resFace.K_Hbeta : 1.15;
                const KFbeta = resFace.success ? resFace.K_Fbeta : 1.12;

                // ISO 6336-1: Transverse load factors KHalpha and KFalpha
                const resTrans = calculateTransverseLoadFactors_B({
                    d1: d1,
                    mn: mn,
                    alpha_t: alphaT,
                    eps_alpha: eps_alpha,
                    eps_beta: eps_beta,
                    b: bMesh,
                    Ft: FtMesh,
                    c_gamma_alpha: c_gamma_alpha,
                    KA: KA_user,
                    Kgamma: Kgamma_user,
                    Kv: Kv,
                    KHbeta: KHbeta,
                    toleranceClass: tolClass,
                    material: matA,
                    sigmaHlim: Math.min(sigHlimA, sigHlimB),
                    v: Math.max(0.1, vPitch)
                });
                const KHalpha = resTrans.success ? resTrans.K_Halpha : 1.05;
                const KFalpha = resTrans.success ? resTrans.K_Falpha : 1.05;

                // Contacts per rev: planets contact both sun and ring => 1 per mesh
                // For sun or ring in planetary with N_p planets: contacts per rev = numPlanetsVal
                const contactsPerRevA = (mesh.isPlanetary && !mesh.isPlanetRing && gA === 1) ? numPlanetsVal : 1;
                const contactsPerRevB = (mesh.isPlanetary && mesh.isPlanetRing && gB === 3) ? numPlanetsVal : 1;

                // Number of load cycles NL1 & NL2 based on target life hours
                const NL1 = Math.max(1e4, effSpeedA * contactsPerRevA * 60.0 * targetLifeHours);
                const NL2 = Math.max(1e4, effSpeedB * contactsPerRevB * 60.0 * targetLifeHours);

                // Reversed Bending Factor YM determination:
                // Rule: If idler (gear 2 for 3-gear train, gear 2 & 3 for 4-gear train, or planet), derate once with YM = 0.7.
                // If global reversed-bending is checked, all gears get YM = 0.7. Do not double-derate (0.7^2).
                const isIdlerA = (config === '3-train' && gA === 2) ||
                    (config === '4-train' && (gA === 2 || gA === 3)) ||
                    (config === 'planetary' && gA === 2);
                const isIdlerB = (config === '3-train' && gB === 2) ||
                    (config === '4-train' && (gB === 2 || gB === 3)) ||
                    (config === 'planetary' && gB === 2);

                const YM1 = (isReversedBendingGlobal || isIdlerA) ? 0.7 : 1.0;
                const YM2 = (isReversedBendingGlobal || isIdlerB) ? 0.7 : 1.0;

                // ISO 6336-2: Surface Durability / Pitting (SH)
                const resPitting = calculateSurfaceDurability({
                    z1: zA,
                    z2: zB,
                    mn: mn,
                    b: bMesh,
                    beta: Math.abs(beta),
                    alpha_n: alphaN,
                    alpha_t: alphaT,
                    alpha_wt: alpha_wt,
                    beta_b: Math.asin(Math.sin(Math.abs(beta) * Math.PI / 180) * Math.cos(alphaN * Math.PI / 180)) * (180 / Math.PI),
                    d1: d1,
                    d2: d2,
                    db1: db1,
                    db2: db2,
                    da1: da1,
                    da2: da2,
                    eps_alpha: eps_alpha,
                    eps_beta: eps_beta,
                    Ft: FtMesh,
                    v: Math.max(0.1, vPitch),
                    NL1: NL1,
                    NL2: NL2,
                    material1: matA,
                    material2: matB,
                    sigmaHlim1: sigHlimA,
                    sigmaHlim2: sigHlimB,
                    KA: KA_user,
                    Kgamma: Kgamma_user,
                    Kv: Kv,
                    KHbeta: KHbeta,
                    KHalpha: KHalpha,
                    v40: v40,
                    Rz1: 4.0,
                    Rz2: 4.0,
                    isInternal: mesh.isInternal
                });

                // Rim thickness sR and tooth height ht from Mounting Geometry (di)
                const diInputA = parseFloat(document.getElementById('di' + gA)?.value);
                const diInputB = parseFloat(document.getElementById('di' + gB)?.value);
                const dfA = parseFloat(document.getElementById('df-max-' + gA + '-out')?.textContent) || (d1 - 2.5 * mn);
                const dfB = parseFloat(document.getElementById('df-max-' + gB + '-out')?.textContent) || (d2 + (mesh.isInternal ? 2.5 * mn : -2.5 * mn));

                const ht1 = Math.abs(da1 - dfA) / 2.0;
                const ht2 = Math.abs(da2 - dfB) / 2.0;

                // For external gears (z > 0), sR = (df - di) / 2
                // For internal gears (z < 0), sR = (di - df) / 2
                let sR1 = undefined;
                if (!isNaN(diInputA) && diInputA > 0) {
                    sR1 = (zA_raw > 0) ? (dfA - diInputA) / 2.0 : (diInputA - dfA) / 2.0;
                }
                let sR2 = undefined;
                if (!isNaN(diInputB) && diInputB > 0) {
                    sR2 = (zB_raw > 0) ? (dfB - diInputB) / 2.0 : (diInputB - dfB) / 2.0;
                }

                // ISO 6336-3: Tooth Root Bending Strength (SF)
                const resBending = calculateToothBendingStrength({
                    z1: zA,
                    z2: zB,
                    mn: mn,
                    b: bMesh,
                    beta: Math.abs(beta),
                    alpha_n: alphaN,
                    x1: parseFloat(document.getElementById('x' + gA)?.value) || 0,
                    x2: parseFloat(document.getElementById('x' + gB)?.value) || 0,
                    eps_alpha: eps_alpha,
                    eps_beta: eps_beta,
                    Ft: FtMesh,
                    KA: KA_user,
                    Kgamma: Kgamma_user,
                    Kv: Kv,
                    KFbeta: KFbeta,
                    KFalpha: KFalpha,
                    material1: matA,
                    material2: matB,
                    sigmaFlim1: sigFlimA,
                    sigmaFlim2: sigFlimB,
                    NL1: NL1,
                    NL2: NL2,
                    hfp_mn1: hfpCoeffA,
                    hfp_mn2: hfpCoeffB,
                    rhofp_mn1: rhofpCoeffA,
                    rhofp_mn2: rhofpCoeffB,
                    sR1: sR1,
                    sR2: sR2,
                    ht1: ht1,
                    ht2: ht2,
                    toleranceClass: tolClass,
                    isInternal: mesh.isInternal,
                    YM1: YM1,
                    YM2: YM2
                });

                // ISO 6336-4: Tooth Flank Fracture Load Capacity (SFF1 and SFF2)
                const hardA = parseFloat(document.getElementById('mat-hard-' + gA)?.value) || 700;
                const hardB = parseFloat(document.getElementById('mat-hard-' + gB)?.value) || 700;
                const coreHardInputA = parseFloat(document.getElementById('core-hard-' + gA)?.value);
                const coreHardInputB = parseFloat(document.getElementById('core-hard-' + gB)?.value);
                const coreHardA = (!isNaN(coreHardInputA) && coreHardInputA > 0) ? coreHardInputA : 350;
                const coreHardB = (!isNaN(coreHardInputB) && coreHardInputB > 0) ? coreHardInputB : 350;

                const chdInputA = parseFloat(document.getElementById('chd-' + gA)?.value);
                const chdInputB = parseFloat(document.getElementById('chd-' + gB)?.value);
                const chdA = (!isNaN(chdInputA) && chdInputA > 0) ? chdInputA : (0.2 * mn);
                const chdB = (!isNaN(chdInputB) && chdInputB > 0) ? chdInputB : (0.2 * mn);

                const tffFunc = (typeof calculateToothFlankFracture === 'function')
                    ? calculateToothFlankFracture
                    : (typeof calculateFlankFractureLoad === 'function'
                        ? calculateFlankFractureLoad
                        : (typeof window !== 'undefined' ? (window.calculateToothFlankFracture || window.calculateFlankFractureLoad) : null));

                const resTFF1 = (typeof tffFunc === 'function') ? tffFunc({
                    z1: zA,
                    z2: zB,
                    mn: mn,
                    b: bMesh,
                    alpha_t: alphaT,
                    beta: Math.abs(beta),
                    Ft: FtMesh,
                    KA: KA_user,
                    Kgamma: Kgamma_user,
                    Kv: Kv,
                    KHalpha: KHalpha,
                    KHbeta: KHbeta,
                    HVsurface: hardA,
                    HVcore: coreHardA,
                    CHD: chdA
                }) : { success: false, S_FF: 1.5 };

                const resTFF2 = (typeof tffFunc === 'function') ? tffFunc({
                    z1: zA,
                    z2: zB,
                    mn: mn,
                    b: bMesh,
                    alpha_t: alphaT,
                    beta: Math.abs(beta),
                    Ft: FtMesh,
                    KA: KA_user,
                    Kgamma: Kgamma_user,
                    Kv: Kv,
                    KHalpha: KHalpha,
                    KHbeta: KHbeta,
                    HVsurface: hardB,
                    HVcore: coreHardB,
                    CHD: chdB
                }) : { success: false, S_FF: 1.5 };

                // Extract final safety factors
                const SH1 = resPitting.success ? resPitting.SH1 : 1.0;
                const SH2 = resPitting.success ? resPitting.SH2 : 1.0;
                const SF1 = resBending.success ? resBending.SF1 : 1.4;
                const SF2 = resBending.success ? resBending.SF2 : 1.4;
                const SFF1 = resTFF1.success ? resTFF1.S_FF : 1.5;
                const SFF2 = resTFF2.success ? resTFF2.S_FF : 1.5;

                // Expected lifetimes before failure (ISO 6336-6 / S-N curve inversion)
                const fpFactors = resPitting.factors || {};
                const fbFactors = resBending.factors || {};

                // Contact reference permissible stress at ZNT = 1.0
                const znt1_val = fpFactors.ZNT1 || 1.0;
                const znt2_val = fpFactors.ZNT2 || 1.0;
                const sigHP1_ref = znt1_val > 0 ? (resPitting.sigma_HP1 / znt1_val) : (resPitting.sigma_HP1 || 1000);
                const sigHP2_ref = znt2_val > 0 ? (resPitting.sigma_HP2 / znt2_val) : (resPitting.sigma_HP2 || 1000);

                const lifePittingA = (typeof calculateExpectedLifetimePitting === 'function')
                    ? calculateExpectedLifetimePitting({
                        sigma_H: resPitting.sigma_H1,
                        sigma_HP_ref: sigHP1_ref,
                        material: matA,
                        speedRpm: effSpeedA,
                        meshCyclesPerRev: contactsPerRevA
                    })
                    : { formatted: '--' };

                const lifePittingB = (typeof calculateExpectedLifetimePitting === 'function')
                    ? calculateExpectedLifetimePitting({
                        sigma_H: resPitting.sigma_H2,
                        sigma_HP_ref: sigHP2_ref,
                        material: matB,
                        speedRpm: effSpeedB,
                        meshCyclesPerRev: contactsPerRevB
                    })
                    : { formatted: '--' };

                // Bending reference permissible stress at YNT = 1.0
                const ynt1_val = fbFactors.YNT1 || 1.0;
                const ynt2_val = fbFactors.YNT2 || 1.0;
                const sigFP1_ref = ynt1_val > 0 ? (resBending.sigma_FP1 / ynt1_val) : (resBending.sigma_FP1 || 400);
                const sigFP2_ref = ynt2_val > 0 ? (resBending.sigma_FP2 / ynt2_val) : (resBending.sigma_FP2 || 400);

                const lifeBendingA = (typeof calculateExpectedLifetimeBending === 'function')
                    ? calculateExpectedLifetimeBending({
                        sigma_F: resBending.sigma_F1,
                        sigma_FP_ref: sigFP1_ref,
                        material: matA,
                        speedRpm: effSpeedA,
                        meshCyclesPerRev: contactsPerRevA
                    })
                    : { formatted: '--' };

                const lifeBendingB = (typeof calculateExpectedLifetimeBending === 'function')
                    ? calculateExpectedLifetimeBending({
                        sigma_F: resBending.sigma_F2,
                        sigma_FP_ref: sigFP2_ref,
                        material: matB,
                        speedRpm: effSpeedB,
                        meshCyclesPerRev: contactsPerRevB
                    })
                    : { formatted: '--' };

                // Save result for report generation
                window.isoRatingResults.push({
                    meshTitle: mesh.meshTitle,
                    SH1, SH2, SF1, SF2, SFF1, SFF2,
                    Kv, KHbeta, KFbeta, KHalpha, KFalpha,
                    sigma_H1: resPitting.sigma_H1,
                    sigma_H2: resPitting.sigma_H2,
                    sigma_HP1: resPitting.sigma_HP1,
                    sigma_HP2: resPitting.sigma_HP2,
                    sigma_F1: resBending.sigma_F1,
                    sigma_F2: resBending.sigma_F2,
                    sigma_FP1: resBending.sigma_FP1,
                    sigma_FP2: resBending.sigma_FP2,
                    factorsPitting: fpFactors,
                    factorsBending: fbFactors,
                    lifePitting1: lifePittingA.formatted,
                    lifePitting2: lifePittingB.formatted,
                    lifeBending1: lifeBendingA.formatted,
                    lifeBending2: lifeBendingB.formatted
                });

                // Format summary cards
                const shPass = (SH1 >= 1.0 && SH2 >= 1.0);
                const sfPass = (SF1 >= 1.4 && SF2 >= 1.4);
                const sffPass = (SFF1 >= 1.2 && SFF2 >= 1.2);

                summaryCardsHTML += `
                    <div style="background: rgba(1, 4, 9, 0.4); border: 1px solid var(--card-border); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px;">
                        <div style="font-weight: 600; font-size: 1.05rem; color: var(--primary-color); border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
                            ${mesh.meshTitle}
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
                            <span style="color: #8b949e;">Pitting Safety S<sub>H</sub> (G${gA}/G${gB}):</span>
                            <span style="font-weight: 600; color: ${shPass ? '#3fb950' : '#f85149'};">
                                ${SH1.toFixed(2)} / ${SH2.toFixed(2)}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
                            <span style="color: #8b949e;">Tooth Bending S<sub>F</sub> (G${gA}/G${gB}):</span>
                            <span style="font-weight: 600; color: ${sfPass ? '#3fb950' : '#f85149'};">
                                ${SF1.toFixed(2)} / ${SF2.toFixed(2)}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
                            <span style="color: #8b949e;">Flank Fracture S<sub>FF</sub> (G${gA}/G${gB}):</span>
                            <span style="font-weight: 600; color: ${sffPass ? '#3fb950' : '#f85149'};">
                                ${SFF1.toFixed(2)} / ${SFF2.toFixed(2)}
                            </span>
                        </div>
                        <div style="border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 6px; font-size: 0.85rem; display: flex; flex-direction: column; gap: 3px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #8b949e;">Pitting Life (G${gA}/G${gB}):</span>
                                <span style="font-weight: 500; color: var(--text-main);">${lifePittingA.formatted} / ${lifePittingB.formatted}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #8b949e;">Bending Life (G${gA}/G${gB}):</span>
                                <span style="font-weight: 500; color: var(--text-main);">${lifeBendingA.formatted} / ${lifeBendingB.formatted}</span>
                            </div>
                        </div>
                        <div style="font-size: 0.8rem; color: #6c757d; margin-top: 2px; display: flex; justify-content: space-between;">
                            <span>K<sub>v</sub> = ${Kv.toFixed(3)}</span>
                            <span>K<sub>H&beta;</sub> = ${KHbeta.toFixed(3)}</span>
                            <span>K<sub>H&alpha;</sub> = ${KHalpha.toFixed(3)}</span>
                        </div>
                    </div>
                `;

                // Populate Factor Drawer
                const drawerContentEl = document.getElementById(mesh.contentId);
                if (drawerContentEl) {
                    const fp = fpFactors;
                    const fb = fbFactors;
                    drawerContentEl.innerHTML = `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                            <div>
                                <div style="font-weight: 600; color: var(--text-main); margin-bottom: 6px; border-bottom: 1px dotted rgba(255,255,255,0.1);">
                                    Load Factors (ISO 6336-1)
                                </div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Application Factor (K<sub>A</sub>):</td><td style="font-weight:500; text-align:right;">${KA_user.toFixed(3)}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Mesh Load Factor (K<sub>&gamma;</sub>):</td><td style="font-weight:500; text-align:right; ${Kgamma_user > 1.0 ? 'color:#e3b341;' : ''}">${Kgamma_user.toFixed(3)}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Dynamic Factor (K<sub>v</sub>):</td><td style="font-weight:500; text-align:right;">${Kv.toFixed(3)}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Face Load Factor Contact (K<sub>H&beta;</sub>):</td><td style="font-weight:500; text-align:right;">${KHbeta.toFixed(3)}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Face Load Factor Bending (K<sub>F&beta;</sub>):</td><td style="font-weight:500; text-align:right;">${KFbeta.toFixed(3)}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Transverse Factor Contact (K<sub>H&alpha;</sub>):</td><td style="font-weight:500; text-align:right;">${KHalpha.toFixed(3)}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Transverse Factor Bending (K<sub>F&alpha;</sub>):</td><td style="font-weight:500; text-align:right;">${KFalpha.toFixed(3)}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Mesh Stiffness c<sub>&gamma;&alpha;</sub> / c<sub>&gamma;&beta;</sub>:</td><td style="font-weight:500; text-align:right;">${c_gamma_alpha.toFixed(2)} / ${c_gamma_beta.toFixed(2)} N/(&mu;m&middot;mm)</td></tr>
                                </table>
                            </div>
                            <div>
                                <div style="font-weight: 600; color: var(--text-main); margin-bottom: 6px; border-bottom: 1px dotted rgba(255,255,255,0.1);">
                                    Contact Stress &amp; Expected Life (ISO 6336-2)
                                </div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Zone Factor (Z<sub>H</sub>):</td><td style="font-weight:500; text-align:right;">${fp.ZH ? fp.ZH.toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Elasticity Factor (Z<sub>E</sub>):</td><td style="font-weight:500; text-align:right;">${fp.ZE ? fp.ZE.toFixed(1) : '-'} &radic;MPa</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Contact Ratio Factor (Z<sub>&epsilon;</sub>):</td><td style="font-weight:500; text-align:right;">${fp.Zeps ? fp.Zeps.toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Helix Angle Factor (Z<sub>&beta;</sub>):</td><td style="font-weight:500; text-align:right;">${fp.Zbeta ? fp.Zbeta.toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Lubricant Influence Z<sub>L</sub> &middot; Z<sub>v</sub> &middot; Z<sub>R</sub>:</td><td style="font-weight:500; text-align:right;">${(fp.ZL1 && fp.ZV1 && fp.ZR1) ? (fp.ZL1 * fp.ZV1 * fp.ZR1).toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Life Factor (Z<sub>NT1</sub> / Z<sub>NT2</sub>):</td><td style="font-weight:500; text-align:right;">${fp.ZNT1 ? fp.ZNT1.toFixed(3) : '-'} / ${fp.ZNT2 ? fp.ZNT2.toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Contact Stress &sigma;<sub>H1</sub> / &sigma;<sub>H2</sub>:</td><td style="font-weight:500; text-align:right;">${resPitting.sigma_H1 ? resPitting.sigma_H1.toFixed(1) : '-'} / ${resPitting.sigma_H2 ? resPitting.sigma_H2.toFixed(1) : '-'} MPa</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Permissible Stress &sigma;<sub>HP1</sub> / &sigma;<sub>HP2</sub>:</td><td style="font-weight:500; text-align:right;">${resPitting.sigma_HP1 ? resPitting.sigma_HP1.toFixed(1) : '-'} / ${resPitting.sigma_HP2 ? resPitting.sigma_HP2.toFixed(1) : '-'} MPa</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Expected Pitting Life (G${gA}/G${gB}):</td><td style="font-weight:600; text-align:right; color:#58a6ff;">${lifePittingA.formatted} / ${lifePittingB.formatted}</td></tr>
                                </table>
                            </div>
                            <div>
                                <div style="font-weight: 600; color: var(--text-main); margin-bottom: 6px; border-bottom: 1px dotted rgba(255,255,255,0.1);">
                                    Tooth Root Bending &amp; Life (ISO 6336-3)
                                </div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Form Factor (Y<sub>F1</sub> / Y<sub>F2</sub>):</td><td style="font-weight:500; text-align:right;">${fb.YF1 ? fb.YF1.toFixed(3) : '-'} / ${fb.YF2 ? fb.YF2.toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Stress Correction (Y<sub>S1</sub> / Y<sub>S2</sub>):</td><td style="font-weight:500; text-align:right;">${fb.YS1 ? fb.YS1.toFixed(3) : '-'} / ${fb.YS2 ? fb.YS2.toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Helix Angle Factor (Y<sub>&beta;</sub>):</td><td style="font-weight:500; text-align:right;">${fb.Ybeta ? fb.Ybeta.toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Rim Thickness Factor (Y<sub>B1</sub> / Y<sub>B2</sub>):</td><td style="font-weight:500; text-align:right;">${fb.YB1 ? fb.YB1.toFixed(3) : '-'} / ${fb.YB2 ? fb.YB2.toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Reversed Bending Factor (Y<sub>M1</sub> / Y<sub>M2</sub>):</td><td style="font-weight:500; text-align:right; color: ${(YM1 < 1.0 || YM2 < 1.0) ? '#e3b341' : 'inherit'};">${YM1.toFixed(2)} / ${YM2.toFixed(2)}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Life Factor (Y<sub>NT1</sub> / Y<sub>NT2</sub>):</td><td style="font-weight:500; text-align:right;">${fb.YNT1 ? fb.YNT1.toFixed(3) : '-'} / ${fb.YNT2 ? fb.YNT2.toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Bending Stress &sigma;<sub>F1</sub> / &sigma;<sub>F2</sub>:</td><td style="font-weight:500; text-align:right;">${resBending.sigma_F1 ? resBending.sigma_F1.toFixed(1) : '-'} / ${resBending.sigma_F2 ? resBending.sigma_F2.toFixed(1) : '-'} MPa</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Permissible Stress &sigma;<sub>FP1</sub> / &sigma;<sub>FP2</sub>:</td><td style="font-weight:500; text-align:right;">${resBending.sigma_FP1 ? resBending.sigma_FP1.toFixed(1) : '-'} / ${resBending.sigma_FP2 ? resBending.sigma_FP2.toFixed(1) : '-'} MPa</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Expected Bending Life (G${gA}/G${gB}):</td><td style="font-weight:600; text-align:right; color:#58a6ff;">${lifeBendingA.formatted} / ${lifeBendingB.formatted}</td></tr>
                                </table>
                            </div>
                            <div>
                                <div style="font-weight: 600; color: var(--text-main); margin-bottom: 6px; border-bottom: 1px dotted rgba(255,255,255,0.1);">
                                    Flank Fracture (ISO/TS 6336-4)
                                </div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Case Depth CHD<sub>550</sub> (G${gA}/G${gB}):</td><td style="font-weight:500; text-align:right;">${chdA.toFixed(2)} / ${chdB.toFixed(2)} mm</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Surface Hardness (G${gA}/G${gB}):</td><td style="font-weight:500; text-align:right;">${hardA.toFixed(0)} / ${hardB.toFixed(0)} HV</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Core Hardness (G${gA}/G${gB}):</td><td style="font-weight:500; text-align:right;">${coreHardA.toFixed(0)} / ${coreHardB.toFixed(0)} HV</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Hertzian Half-Width b<sub>H</sub>:</td><td style="font-weight:500; text-align:right;">${resTFF1.bH ? resTFF1.bH.toFixed(3) : '-'} mm</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Dynamic Contact Stress p<sub>dyn</sub>:</td><td style="font-weight:500; text-align:right;">${resTFF1.pdyn_CP ? resTFF1.pdyn_CP.toFixed(1) : '-'} MPa</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Max Exposure A<sub>FF,max</sub> (G${gA}/G${gB}):</td><td style="font-weight:500; text-align:right;">${resTFF1.AFF_max ? resTFF1.AFF_max.toFixed(3) : '-'} / ${resTFF2.AFF_max ? resTFF2.AFF_max.toFixed(3) : '-'}</td></tr>
                                    <tr><td style="color:#8b949e; padding: 2px 0;">Safety Factor S<sub>FF</sub> (G${gA}/G${gB}):</td><td style="font-weight:600; text-align:right; color: ${sffPass ? '#3fb950' : '#f85149'};">${SFF1.toFixed(2)} / ${SFF2.toFixed(2)}</td></tr>
                                </table>
                            </div>
                        </div>
                    `;
                }
            });

            if (ratingSummaryCardsEl) {
                if (summaryCardsHTML) {
                    ratingSummaryCardsEl.innerHTML = summaryCardsHTML;
                } else {
                    ratingSummaryCardsEl.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: #8b949e; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.15); border-radius: 8px;">
                            Enter gear parameters (module and teeth numbers) on the Basic Data tab and click <strong>Calculate All</strong> to generate rating safety factors.
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('Rating calculation error:', err);
            if (ratingSummaryCardsEl) {
                ratingSummaryCardsEl.innerHTML = `<div style="color: #f85149; padding: 10px;">Error calculating ISO 6336 rating: ${err.message}</div>`;
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
