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
    const vertices = [];
    const indices = [];

    const gearPoints = uniquePoints; // CCW for external, CW for internal
    const holesPoints = []; // Array of arrays of points

    if (di > 0) {
        const numBorePts = 64;
        const bPts = [];
        for (let i = 0; i < numBorePts; i++) {
            // If external, bore is a hole (CW). If internal, bore is outer rim (CCW).
            const isCW = !isInternal;
            const a = isCW ? (2 * Math.PI - (i / numBorePts) * 2 * Math.PI) : ((i / numBorePts) * 2 * Math.PI);
            bPts.push({ x: (di / 2) * Math.cos(a), y: (di / 2) * Math.sin(a) });
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
        if (di > 0 && holesPoints.length > 0) {
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
 * Initializes global handlers for 3D graphics (Reset View, etc.)
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
}
