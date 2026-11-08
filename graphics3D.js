/**
 * graphics3D.js
 * 3D Gear Visualization using Three.js
 */

'use strict';

const canvas3DStates = {};

/**
 * Main 3D drawing function called from main.js
 * @param {HTMLCanvasElement} canvas - The target 3D canvas
 * @param {Array} points - 2D profile points from calculateGearProfile
 * @param {Object} geom - Gear geometry metadata {da, dFf}
 * @param {number} b - Facewidth (mm)
 * @param {number} beta - Helix angle (degrees)
 */
function _drawGear3D(canvas, points, geom, b, beta, di, holePattern) {
    if (!canvas || !points || points.length === 0) return;

    const id = canvas.id;

    // Ensure Three.js is loaded
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded. Cannot render 3D.');
        return;
    }

    if (!canvas3DStates[id]) {
        _init3DScene(canvas);
    }

    const state = canvas3DStates[id];
    const { scene, camera, renderer, controls } = state;

    // Synchronize renderer size with canvas dimensions (handles dynamic resizing from 300 to 600)
    if (renderer.domElement.width !== canvas.width || renderer.domElement.height !== canvas.height) {
        renderer.setSize(canvas.width, canvas.height);
        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
    }

    // Remove old mesh
    if (state.gearMesh) {
        scene.remove(state.gearMesh);
        state.gearMesh.geometry.dispose();
        state.gearMesh.material.dispose();
    }

    // Create Gear Geometry
    const geometry = _generateGearGeometry(points, b, beta, geom, di, holePattern);
    const material = new THREE.MeshPhongMaterial({
        color: 0x95a5a6, // Metallic gray
        specular: 0x111111,
        shininess: 30,
        side: THREE.DoubleSide,
        flatShading: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    state.gearMesh = mesh;

    // Adjust camera/controls to fit the new gear
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fitPos = new THREE.Vector3(center.x + maxDim, center.y + maxDim, center.z + maxDim);
    state.resetPos = fitPos.clone();
    state.resetTarget = center.clone();

    // Set initial camera position if it's the first time
    if (!state.initialized) {
        camera.position.copy(state.resetPos);
        controls.target.copy(state.resetTarget);
        state.initialized = true;
    }
}

/**
 * Initializes the Three.js environment for a specific canvas
 */
function _init3DScene(canvas) {
    const id = canvas.id;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f9);

    const camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 10000);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    
    const width = canvas.width;
    const height = canvas.height;
    renderer.setSize(width, height);

    // OrbitControls initialization
    let controls;
    if (typeof THREE.OrbitControls === 'function') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
    } else if (typeof window.OrbitControls === 'function') {
        controls = new window.OrbitControls(camera, renderer.domElement);
    } else {
        // Fallback or simple mock if controls not found
        controls = { update: () => { }, target: new THREE.Vector3() };
    }

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Zoom-to-cursor: intercept the wheel event before OrbitControls handles it.
    // Raycasts to a view-aligned plane through controls.target, then shifts both
    // camera and target toward the 3D world point under the mouse cursor.
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();
        event.stopImmediatePropagation(); // Prevents OrbitControls' bubble-phase listener

        const zoomFactor = event.deltaY > 0 ? 1.1 : 1 / 1.1;

        // Convert mouse position to normalized device coordinates (NDC)
        const rect = canvas.getBoundingClientRect();
        const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Build a ray from the camera through the cursor
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

        // Intersect a view-aligned plane through the current orbit target
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDir, controls.target);
        const worldPoint = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(plane, worldPoint)) return;

        // Shift camera and target: scale their distance to worldPoint by zoomFactor
        const scale = 1 - zoomFactor;
        camera.position.addScaledVector(
            new THREE.Vector3().subVectors(worldPoint, camera.position), scale
        );
        controls.target.addScaledVector(
            new THREE.Vector3().subVectors(worldPoint, controls.target), scale
        );
        controls.update();
    }, { capture: true, passive: false });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 500, 0);
    scene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(200, 300, 200);
    scene.add(mainLight);

    const fillLight = new THREE.PointLight(0xffffff, 0.3);
    fillLight.position.set(-200, -100, 100);
    scene.add(fillLight);

    canvas3DStates[id] = { scene, camera, renderer, controls, gearMesh: null, initialized: false };

    const animate = () => {
        if (!canvas3DStates[id]) return;
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
        if (canvas.clientWidth === 0 || canvas.clientHeight === 0) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
    resizeObserver.observe(canvas);
}

/**
 * Generates the 3D BufferGeometry for a gear by extruding and twisting a 2D profile
 */
function _generateGearGeometry(points, b, beta, geom, di, holePattern) {
    // 0. Deduplicate points to avoid triangulation and geometry issues
    const uniquePoints = [];
    let lastP = null;
    for (const p of points) {
        if (!lastP || Math.hypot(p.x - lastP.x, p.y - lastP.y) > 1e-4) {
            uniquePoints.push(p);
            lastP = p;
        }
    }
    // Ensure the loop doesn't have identical start/end points
    if (uniquePoints.length > 0) {
        const first = uniquePoints[0];
        const last = uniquePoints[uniquePoints.length - 1];
        if (Math.hypot(first.x - last.x, first.y - last.y) < 1e-4) {
            uniquePoints.pop();
        }
    }
    const n = uniquePoints.length;
    if (n < 3) return new THREE.BufferGeometry();

    // Slicing approach for helical gears
    const absB = Math.abs(b) || 1;
    const numSlices = Math.max(2, Math.ceil(absB / 2));
    const zStep = b / (numSlices - 1);

    // Calculate Lead pz = (d * PI) / tan(beta)
    const betaRad = beta * Math.PI / 180;
    const refDia = (geom.da + geom.dFf) / 2;
    const pz = (Math.abs(beta) < 1e-6) ? Infinity : (refDia * Math.PI) / Math.tan(betaRad);

    const isInternal = geom.z < 0;
    const effectiveDi = (isInternal && (!di || di <= 0)) ? ((geom.da || 100) + 4 * (geom.mn || 2)) : di;
    const vertices = [];
    const indices = [];

    const gearPoints = uniquePoints; // CCW for external, CW for internal
    const holesPoints = []; // Array of arrays of points

    if (effectiveDi > 0) {
        const numBorePts = 64;
        const bPts = [];
        for (let i = 0; i < numBorePts; i++) {
            // If external, bore is a hole (CW). If internal, bore is outer rim (CCW).
            const isCW = !isInternal;
            const a = isCW ? (2 * Math.PI - (i / numBorePts) * 2 * Math.PI) : ((i / numBorePts) * 2 * Math.PI);
            bPts.push({ x: (effectiveDi / 2) * Math.cos(a), y: (effectiveDi / 2) * Math.sin(a) });
        }
        holesPoints.push(bPts);
    }

    if (holePattern) {
        const { holeCircle, holeDiameter, numHoles } = holePattern;
        if (holeCircle > 0 && holeDiameter > 0 && numHoles > 0) {
            const r_hc = holeCircle / 2;
            const r_h = holeDiameter / 2;
            const numHolePts = 32;
            const angleStep = 2 * Math.PI / numHoles;
            for (let j = 0; j < numHoles; j++) {
                const cx = r_hc * Math.cos(j * angleStep);
                const cy = r_hc * Math.sin(j * angleStep);
                const hPts = [];
                for (let i = 0; i < numHolePts; i++) {
                    const isCW = true; // All cut-out holes are CW
                    const a = isCW ? (2 * Math.PI - (i / numHolePts) * 2 * Math.PI) : ((i / numHolePts) * 2 * Math.PI);
                    hPts.push({ x: cx + r_h * Math.cos(a), y: cy + r_h * Math.sin(a) });
                }
                holesPoints.push(hPts);
            }
        }
    }

    const n_gear = gearPoints.length;
    const holeOffsets = [];
    let n_total = n_gear;
    for (const hPts of holesPoints) {
        holeOffsets.push(n_total);
        n_total += hPts.length;
    }

    // 2. Generate Vertices for all slices (Side Walls)
    for (let s = 0; s < numSlices; s++) {
        const z = s * zStep;
        const theta = (pz === Infinity) ? 0 : (z / pz) * 2 * Math.PI;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        for (const p of gearPoints) {
            vertices.push(p.x * cosT - p.y * sinT, p.x * sinT + p.y * cosT, z);
        }
        for (const hPts of holesPoints) {
            for (const p of hPts) {
                vertices.push(p.x * cosT - p.y * sinT, p.x * sinT + p.y * cosT, z);
            }
        }
    }

    // Add separate vertices for Front Cap (z = 0) to ensure flat shading
    const frontCapOffset = vertices.length / 3;
    for (const p of gearPoints) {
        vertices.push(p.x, p.y, 0);
    }
    for (const hPts of holesPoints) {
        for (const p of hPts) {
            vertices.push(p.x, p.y, 0);
        }
    }

    // Add separate vertices for Back Cap (z = b)
    const backCapOffset = vertices.length / 3;
    const zBack = b;
    const thetaBack = (pz === Infinity) ? 0 : (zBack / pz) * 2 * Math.PI;
    const cosTBack = Math.cos(thetaBack);
    const sinTBack = Math.sin(thetaBack);
    for (const p of gearPoints) {
        vertices.push(p.x * cosTBack - p.y * sinTBack, p.x * sinTBack + p.y * cosTBack, zBack);
    }
    for (const hPts of holesPoints) {
        for (const p of hPts) {
            vertices.push(p.x * cosTBack - p.y * sinTBack, p.x * sinTBack + p.y * cosTBack, zBack);
        }
    }

    // 3. Generate Indices for Side Faces (Quads)
    for (let s = 0; s < numSlices - 1; s++) {
        const offset1 = s * n_total;
        const offset2 = (s + 1) * n_total;

        // Gear Profile Walls (Main gear teeth)
        // Note: gearPoints is always generated in CCW order.
        for (let i = 0; i < n_gear; i++) {
            const next = (i + 1) % n_gear;
            const v1 = offset1 + i;
            const v2 = offset1 + next;
            const v3 = offset2 + next;
            const v4 = offset2 + i;
            
            if (!isInternal) {
                // External gear: solid is inside, empty is outside. 
                // CCW path gives normal pointing away from origin (outward).
                indices.push(v1, v2, v3);
                indices.push(v1, v3, v4);
            } else {
                // Internal gear: solid is outside, empty is inside (center).
                // CCW path gives normal pointing away from origin (into the solid).
                // We MUST flip the winding so normals point towards origin (outward).
                indices.push(v1, v3, v2);
                indices.push(v1, v4, v3);
            }
        }

        // Holes / Rim Walls
        for (let k = 0; k < holesPoints.length; k++) {
            const hPts = holesPoints[k];
            const startIdx = holeOffsets[k];
            const hLen = hPts.length;

            for (let i = 0; i < hLen; i++) {
                const next = (i + 1) % hLen;
                const v1 = offset1 + startIdx + i;
                const v2 = offset1 + startIdx + next;
                const v3 = offset2 + startIdx + next;
                const v4 = offset2 + startIdx + i;
                
                indices.push(v1, v2, v3);
                indices.push(v1, v3, v4);
            }
        }
    }

    const gPoints2 = gearPoints.map(p => new THREE.Vector2(p.x, p.y));
    
    let contourPoints;
    const holeArrays = [];
    const indexMap = [];

    if (!isInternal) {
        contourPoints = gPoints2;
        for (let i = 0; i < n_gear; i++) indexMap.push(i);
        
        for (let k = 0; k < holesPoints.length; k++) {
            holeArrays.push(holesPoints[k].map(p => new THREE.Vector2(p.x, p.y)));
            const start = holeOffsets[k];
            for (let i = 0; i < holesPoints[k].length; i++) {
                indexMap.push(start + i);
            }
        }
    } else {
        if (effectiveDi > 0 && holesPoints.length > 0) {
            contourPoints = holesPoints[0].map(p => new THREE.Vector2(p.x, p.y));
            const rimStart = holeOffsets[0];
            for (let i = 0; i < holesPoints[0].length; i++) {
                indexMap.push(rimStart + i);
            }
            
            holeArrays.push(gPoints2);
            for (let i = 0; i < n_gear; i++) indexMap.push(i);
            
            for (let k = 1; k < holesPoints.length; k++) {
                holeArrays.push(holesPoints[k].map(p => new THREE.Vector2(p.x, p.y)));
                const start = holeOffsets[k];
                for (let i = 0; i < holesPoints[k].length; i++) {
                    indexMap.push(start + i);
                }
            }
        } else {
            contourPoints = [];
        }
    }

    let triangles;
    if (contourPoints && contourPoints.length >= 3) {
        triangles = THREE.ShapeUtils.triangulateShape(contourPoints, holeArrays);
        
        // Remap indices to our global vertex indices
        if (Array.isArray(triangles[0])) {
            triangles = triangles.map(tri => tri.map(idx => indexMap[idx]));
        } else {
            triangles = triangles.map(idx => indexMap[idx]);
        }
    } else {
        triangles = [];
    }

    const isFlat = !Array.isArray(triangles[0]);
    if (isFlat) {
        for (let j = 0; j < triangles.length; j += 3) {
            const v1 = triangles[j], v2 = triangles[j+1], v3 = triangles[j+2];
            indices.push(frontCapOffset + v1, frontCapOffset + v3, frontCapOffset + v2); 
            indices.push(backCapOffset + v1, backCapOffset + v2, backCapOffset + v3);
        }
    } else {
        for (const tri of triangles) {
            const v1 = tri[0], v2 = tri[1], v3 = tri[2];
            indices.push(frontCapOffset + v1, frontCapOffset + v3, frontCapOffset + v2); 
            indices.push(backCapOffset + v1, backCapOffset + v2, backCapOffset + v3);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

/**
 * Exports the current 3D mesh to an STL file
 * @param {string} canvasId - The ID of the canvas whose gear to export
 * @param {string} filename - Desired filename
 */
function _exportGearSTL(canvasId, filename) {
    const state = canvas3DStates[canvasId];
    if (!state || !state.gearMesh) {
        alert("No 3D model available to export. Please calculate the gear first.");
        return;
    }

    const geometry = state.gearMesh.geometry;
    const position = geometry.attributes.position;
    const index = geometry.index;

    if (!index) {
        alert("Geometry is not indexed; cannot export STL.");
        return;
    }

    let stl = "solid gear\n";

    for (let i = 0; i < index.count; i += 3) {
        const i1 = index.getX(i);
        const i2 = index.getX(i + 1);
        const i3 = index.getX(i + 2);

        const v1 = { x: position.getX(i1), y: position.getY(i1), z: position.getZ(i1) };
        const v2 = { x: position.getX(i2), y: position.getY(i2), z: position.getZ(i2) };
        const v3 = { x: position.getX(i3), y: position.getY(i3), z: position.getZ(i3) };

        // Calculate normal
        const cb = { x: v3.x - v2.x, y: v3.y - v2.y, z: v3.z - v2.z };
        const ab = { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
        const n = {
            x: cb.y * ab.z - cb.z * ab.y,
            y: cb.z * ab.x - cb.x * ab.z,
            z: cb.x * ab.y - cb.y * ab.x
        };
        const len = Math.hypot(n.x, n.y, n.z);
        if (len > 0) { n.x /= len; n.y /= len; n.z /= len; }

        stl += `  facet normal ${n.x.toExponential(6)} ${n.y.toExponential(6)} ${n.z.toExponential(6)}\n`;
        stl += "    outer loop\n";
        stl += `      vertex ${v1.x.toExponential(6)} ${v1.y.toExponential(6)} ${v1.z.toExponential(6)}\n`;
        stl += `      vertex ${v2.x.toExponential(6)} ${v2.y.toExponential(6)} ${v2.z.toExponential(6)}\n`;
        stl += `      vertex ${v3.x.toExponential(6)} ${v3.y.toExponential(6)} ${v3.z.toExponential(6)}\n`;
        stl += "    endloop\n";
        stl += "  endfacet\n";
    }

    stl += "endsolid gear\n";

    const blob = new Blob([stl], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || "gear.stl";
    link.click();
}

/**
 * Draws the complete multi-gear 3D assembly meshing view
 * @param {HTMLCanvasElement} canvas - The target 3D canvas (e.g. canvas-assembly-3d)
 */
function _drawFullAssembly3D(canvas) {
    if (!canvas || !window.assemblyCache || window.assemblyCache.length === 0) return;

    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded. Cannot render 3D assembly.');
        return;
    }

    const id = canvas.id;
    if (!canvas3DStates[id]) {
        _init3DScene(canvas);
    }

    const state = canvas3DStates[id];
    const { scene, camera, renderer, controls } = state;

    if (renderer.domElement.width !== canvas.width || renderer.domElement.height !== canvas.height) {
        renderer.setSize(canvas.width, canvas.height);
        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
    }

    // Clean up previous assembly group
    if (state.assemblyGroup) {
        scene.remove(state.assemblyGroup);
        state.assemblyGroup.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        });
        state.assemblyGroup = null;
        state.assemblyMeshes = [];
    }

    const layout = typeof _computeAssemblyLayout === 'function' ? _computeAssemblyLayout(state.rollPhase || 0) : null;
    if (!layout || !layout.gearInstances || layout.gearInstances.length === 0) return;

    const { gearInstances, z1, config } = layout;
    state.z1 = z1;
    state.assemblyMeshes = [];

    const assemblyGroup = new THREE.Group();

    // Cache geometries by gear index so shared gears (e.g. planets in planetary gears) reuse geometry
    const geomCacheByIndex = {};

    const colorMap = {
        1: 0x3498db, // Steel Blue
        2: 0xe67e22, // Orange / Bronze
        3: 0x9b59b6, // Purple
        4: 0x2ecc71  // Emerald Green
    };

    gearInstances.forEach(inst => {
        const idx = inst.idx;
        const d = inst.data;
        if (!d || !d.points || d.points.length === 0) return;

        let geom = geomCacheByIndex[idx];
        if (!geom) {
            const b = d.b || parseFloat(document.getElementById('b' + idx)?.value) || 10;
            const beta = d.beta ?? 0;
            const di = d.di ?? (d.cache?.di || 0);
            const holePattern = d.holePattern ?? d.cache?.holePattern;
            geom = _generateGearGeometry(d.points, b, beta, d.geom, di, holePattern);
            geomCacheByIndex[idx] = geom;
        }

        const colorHex = colorMap[idx] || 0x95a5a6;
        const material = new THREE.MeshPhongMaterial({
            color: colorHex,
            specular: 0x222222,
            shininess: 35,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geom, material);
        mesh.position.set(inst.x, inst.y, 0);
        mesh.rotation.z = inst.rot;
        mesh.userData = {
            idx: inst.idx,
            rot_static: inst.rot_static,
            k_rot: inst.k_rot
        };

        assemblyGroup.add(mesh);
        state.assemblyMeshes.push(mesh);
    });

    scene.add(assemblyGroup);
    state.assemblyGroup = assemblyGroup;

    // Adjust camera/controls to fit assembly
    const boundingBox = new THREE.Box3().setFromObject(assemblyGroup);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 50);

    // Position camera looking at assembly from an isometric angle
    const fitPos = new THREE.Vector3(center.x, center.y - maxDim * 0.45, center.z + maxDim * 1.5);
    state.resetPos = fitPos.clone();
    state.resetTarget = center.clone();

    if (!state.initialized || state.lastConfig !== config) {
        camera.position.copy(state.resetPos);
        controls.target.copy(state.resetTarget);
        controls.update();
        state.initialized = true;
        state.lastConfig = config;
    }
}
window._drawFullAssembly3D = _drawFullAssembly3D;

/**
 * Updates mesh rotations in the 3D assembly based on current rollPhase
 */
function _updateAssembly3DRotation(state) {
    if (!state || !state.assemblyMeshes || !state.z1) return;
    const phi = (state.rollPhase || 0) * (2 * Math.PI / state.z1);
    state.assemblyMeshes.forEach(mesh => {
        if (mesh.userData && typeof mesh.userData.rot_static === 'number') {
            mesh.rotation.z = mesh.userData.rot_static + phi * (mesh.userData.k_rot || 0);
        }
    });
}
window._updateAssembly3DRotation = _updateAssembly3DRotation;

/**
 * Synchronizes 3D assembly roll phase to 2D assembly
 */
function _syncAssemblyTo2D(rollPhase) {
    if (window.canvasStates && window.canvasStates['canvas-assembly']) {
        const state2D = window.canvasStates['canvas-assembly'];
        state2D.rollPhase = rollPhase;
        const slider2D = document.getElementById('roll-slider-assembly');
        if (slider2D) {
            let clamped = ((rollPhase % 2) + 2) % 2;
            if (clamped > 1) clamped -= 2;
            slider2D.value = clamped;
        }
        const canvas2D = document.getElementById('canvas-assembly');
        if (canvas2D && typeof _drawFullAssembly2D === 'function') {
            _drawFullAssembly2D(canvas2D, state2D);
        }
    }
}
window._syncAssemblyTo2D = _syncAssemblyTo2D;

/**
 * Exports all gears in the 3D assembly to a unified STL file
 */
function _exportAssemblySTL(canvasId, filename) {
    const state = canvas3DStates[canvasId];
    if (!state || !state.assemblyMeshes || state.assemblyMeshes.length === 0) {
        alert("No 3D assembly model available to export. Please calculate the gears first.");
        return;
    }

    const parts = ["solid gear_assembly\n"];
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const cb = new THREE.Vector3();
    const ab = new THREE.Vector3();
    const n = new THREE.Vector3();

    // Ensure world matrices are completely updated
    state.scene.updateMatrixWorld(true);

    state.assemblyMeshes.forEach(mesh => {
        const geometry = mesh.geometry;
        if (!geometry) return;
        const position = geometry.attributes.position;
        const index = geometry.index;
        if (!position) return;

        const matrix = mesh.matrixWorld;

        if (index) {
            for (let i = 0; i < index.count; i += 3) {
                const i1 = index.getX(i);
                const i2 = index.getX(i + 1);
                const i3 = index.getX(i + 2);

                v1.set(position.getX(i1), position.getY(i1), position.getZ(i1)).applyMatrix4(matrix);
                v2.set(position.getX(i2), position.getY(i2), position.getZ(i2)).applyMatrix4(matrix);
                v3.set(position.getX(i3), position.getY(i3), position.getZ(i3)).applyMatrix4(matrix);

                cb.subVectors(v3, v2);
                ab.subVectors(v1, v2);
                n.crossVectors(cb, ab);
                const len = n.length();
                if (len > 0) n.divideScalar(len);

                parts.push(
                    `  facet normal ${n.x.toExponential(6)} ${n.y.toExponential(6)} ${n.z.toExponential(6)}\n`,
                    "    outer loop\n",
                    `      vertex ${v1.x.toExponential(6)} ${v1.y.toExponential(6)} ${v1.z.toExponential(6)}\n`,
                    `      vertex ${v2.x.toExponential(6)} ${v2.y.toExponential(6)} ${v2.z.toExponential(6)}\n`,
                    `      vertex ${v3.x.toExponential(6)} ${v3.y.toExponential(6)} ${v3.z.toExponential(6)}\n`,
                    "    endloop\n",
                    "  endfacet\n"
                );
            }
        } else {
            for (let i = 0; i < position.count; i += 3) {
                v1.set(position.getX(i), position.getY(i), position.getZ(i)).applyMatrix4(matrix);
                v2.set(position.getX(i + 1), position.getY(i + 1), position.getZ(i + 1)).applyMatrix4(matrix);
                v3.set(position.getX(i + 2), position.getY(i + 2), position.getZ(i + 2)).applyMatrix4(matrix);

                cb.subVectors(v3, v2);
                ab.subVectors(v1, v2);
                n.crossVectors(cb, ab);
                const len = n.length();
                if (len > 0) n.divideScalar(len);

                parts.push(
                    `  facet normal ${n.x.toExponential(6)} ${n.y.toExponential(6)} ${n.z.toExponential(6)}\n`,
                    "    outer loop\n",
                    `      vertex ${v1.x.toExponential(6)} ${v1.y.toExponential(6)} ${v1.z.toExponential(6)}\n`,
                    `      vertex ${v2.x.toExponential(6)} ${v2.y.toExponential(6)} ${v2.z.toExponential(6)}\n`,
                    `      vertex ${v3.x.toExponential(6)} ${v3.y.toExponential(6)} ${v3.z.toExponential(6)}\n`,
                    "    endloop\n",
                    "  endfacet\n"
                );
            }
        }
    });

    parts.push("endsolid gear_assembly\n");

    const blob = new Blob([parts.join('')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || "gear_assembly.stl";
    link.click();
}
window._exportAssemblySTL = _exportAssemblySTL;

/**
 * Initializes global handlers for 3D graphics (Reset View, STL Export, Assembly Animation, etc.)
 */
function initGraphics3DHandlers() {
    const resetButtons = document.querySelectorAll('button[id^="reset-3d-"]');
    resetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.id;
            const canvasId = id.replace('reset-3d-', 'canvas-3d-');
            const state = canvas3DStates[canvasId];
            if (state && state.resetPos && state.resetTarget) {
                state.camera.position.copy(state.resetPos);
                state.controls.target.copy(state.resetTarget);
                state.controls.update();
            }
        });
    });

    // 3D Assembly Handlers
    const resetAssembly3DBtn = document.getElementById('reset-assembly-3d');
    const sliderAssembly3D = document.getElementById('roll-slider-assembly-3d');
    const ccwBtn3D = document.getElementById('rotate-ccw-assembly-3d');
    const cwBtn3D = document.getElementById('rotate-cw-assembly-3d');
    const speedInput3D = document.getElementById('rotate-speed-assembly-3d');
    const exportStlAssemblyBtn = document.getElementById('export-stl-assembly');

    if (resetAssembly3DBtn) {
        resetAssembly3DBtn.addEventListener('click', () => {
            const state = canvas3DStates['canvas-assembly-3d'];
            if (state) {
                if (state.resetPos && state.resetTarget) {
                    state.camera.position.copy(state.resetPos);
                    state.controls.target.copy(state.resetTarget);
                    state.controls.update();
                }
                state.rollPhase = 0;
                if (sliderAssembly3D) sliderAssembly3D.value = 0;
                _updateAssembly3DRotation(state);
                _syncAssemblyTo2D(0);
            }
        });
    }

    if (sliderAssembly3D) {
        sliderAssembly3D.addEventListener('input', (e) => {
            const state = canvas3DStates['canvas-assembly-3d'];
            if (state) {
                state.rollPhase = parseFloat(e.target.value);
                _updateAssembly3DRotation(state);
                _syncAssemblyTo2D(state.rollPhase);
            }
        });
    }

    // CCW & CW Continuous Animation for 3D Assembly
    let animFrameId3D = null;
    let lastTime3D = 0;
    let dir3D = 0;

    const startRotation3D = (direction) => {
        if (animFrameId3D) return;
        dir3D = direction;
        lastTime3D = performance.now();
        const loop = (currentTime) => {
            const dt = (currentTime - lastTime3D) / 1000;
            lastTime3D = currentTime;
            const speed = speedInput3D ? parseFloat(speedInput3D.value) || 1 : 1;
            const state = canvas3DStates['canvas-assembly-3d'];
            if (state) {
                state.rollPhase = (state.rollPhase || 0) + dir3D * speed * dt;
                let clamped = ((state.rollPhase % 2) + 2) % 2;
                if (clamped > 1) clamped -= 2;
                if (sliderAssembly3D) sliderAssembly3D.value = clamped;
                _updateAssembly3DRotation(state);
                _syncAssemblyTo2D(state.rollPhase);
            }
            animFrameId3D = requestAnimationFrame(loop);
        };
        animFrameId3D = requestAnimationFrame(loop);
    };

    const stopRotation3D = () => {
        if (animFrameId3D) {
            cancelAnimationFrame(animFrameId3D);
            animFrameId3D = null;
        }
    };

    if (ccwBtn3D) {
        ccwBtn3D.addEventListener('mousedown', () => startRotation3D(-1));
        ccwBtn3D.addEventListener('mouseup', stopRotation3D);
        ccwBtn3D.addEventListener('mouseleave', stopRotation3D);
        ccwBtn3D.addEventListener('touchstart', (e) => { e.preventDefault(); startRotation3D(-1); });
        ccwBtn3D.addEventListener('touchend', stopRotation3D);
    }

    if (cwBtn3D) {
        cwBtn3D.addEventListener('mousedown', () => startRotation3D(1));
        cwBtn3D.addEventListener('mouseup', stopRotation3D);
        cwBtn3D.addEventListener('mouseleave', stopRotation3D);
        cwBtn3D.addEventListener('touchstart', (e) => { e.preventDefault(); startRotation3D(1); });
        cwBtn3D.addEventListener('touchend', stopRotation3D);
    }

    if (exportStlAssemblyBtn) {
        exportStlAssemblyBtn.addEventListener('click', () => {
            const projectName = document.getElementById('project-name')?.value || 'Project';
            const config = document.getElementById('gear-config')?.value || 'Assembly';
            const filename = `${projectName}_${config}_3D_Assembly.stl`.replace(/\s+/g, '_');
            _exportAssemblySTL('canvas-assembly-3d', filename);
        });
    }
}
