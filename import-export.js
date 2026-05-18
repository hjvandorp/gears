document.addEventListener('DOMContentLoaded', () => {
    // Import / Export Logic
    const exportBtn = document.getElementById('export-csv-btn');
    const dropZone = document.getElementById('csv-drop-zone');
    const fileInput = document.getElementById('csv-file-input');
    const gearConfig = document.getElementById('gear-config');
    const calcAllBtn = document.getElementById('calc-all-btn');

    const fields = [
        'project-name', 'gear-config', 'module', 'pressure-angle', 'helix-angle', 'aw1', 'aw2', 'aw3',
        'z1', 'b1', 'x1', 'di1', 'hole-circle-1', 'hole-diameter-1', 'num-holes-1', 'mat1',
        'z2', 'b2', 'di2', 'hole-circle-2', 'hole-diameter-2', 'num-holes-2', 'mat2',
        'z3', 'b3', 'di3', 'hole-circle-3', 'hole-diameter-3', 'num-holes-3', 'mat3',
        'z4', 'b4', 'di4', 'hole-circle-4', 'hole-diameter-4', 'num-holes-4', 'mat4',
        'tool-type-1', 'alpha-p0-1', 'cutter-teeth-1', 'reference-profile-1', 'dedendum-coeff-1', 'root-radius-coeff-1', 'addendum-coeff-1', 'tip-alteration-1',
        'tool-type-2', 'alpha-p0-2', 'cutter-teeth-2', 'reference-profile-2', 'dedendum-coeff-2', 'root-radius-coeff-2', 'addendum-coeff-2', 'tip-alteration-2',
        'tool-type-3', 'alpha-p0-3', 'cutter-teeth-3', 'reference-profile-3', 'dedendum-coeff-3', 'root-radius-coeff-3', 'addendum-coeff-3', 'tip-alteration-3',
        'tool-type-4', 'alpha-p0-4', 'cutter-teeth-4', 'reference-profile-4', 'dedendum-coeff-4', 'root-radius-coeff-4', 'addendum-coeff-4', 'tip-alteration-4',
        'quality-grade-1', 'da-tol-1', 'sn-tol-upper-1', 'sn-tol-lower-1', 'df-allowance-1', 'dm-1', 'k-spanned-1',
        'quality-grade-2', 'da-tol-2', 'sn-tol-upper-2', 'sn-tol-lower-2', 'df-allowance-2', 'dm-2', 'k-spanned-2',
        'quality-grade-3', 'da-tol-3', 'sn-tol-upper-3', 'sn-tol-lower-3', 'df-allowance-3', 'dm-3', 'k-spanned-3',
        'quality-grade-4', 'da-tol-4', 'sn-tol-upper-4', 'sn-tol-lower-4', 'df-allowance-4', 'dm-4', 'k-spanned-4',
        'aw-tol-1', 'aw-tol-2', 'aw-tol-3',
        'torque', 'speed'
    ];

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const config = gearConfig ? gearConfig.value : 'pair';

            const gear3Fields = [
                'z3', 'b3', 'di3', 'hole-circle-3', 'hole-diameter-3', 'num-holes-3', 'mat3',
                'tool-type-3', 'alpha-p0-3', 'cutter-teeth-3', 'reference-profile-3', 'dedendum-coeff-3', 'root-radius-coeff-3', 'addendum-coeff-3', 'tip-alteration-3',
                'quality-grade-3', 'da-tol-3', 'sn-tol-upper-3', 'sn-tol-lower-3', 'df-allowance-3', 'dm-3', 'k-spanned-3'
            ];

            const gear4Fields = [
                'z4', 'b4', 'di4', 'hole-circle-4', 'hole-diameter-4', 'num-holes-4', 'mat4',
                'tool-type-4', 'alpha-p0-4', 'cutter-teeth-4', 'reference-profile-4', 'dedendum-coeff-4', 'root-radius-coeff-4', 'addendum-coeff-4', 'tip-alteration-4',
                'quality-grade-4', 'da-tol-4', 'sn-tol-upper-4', 'sn-tol-lower-4', 'df-allowance-4', 'dm-4', 'k-spanned-4'
            ];

            if (config === 'pair') {
                [...gear3Fields, ...gear4Fields, 'aw2', 'aw3', 'aw-tol-2', 'aw-tol-3'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
            } else if (config === '3-train' || config === 'planetary') {
                [...gear4Fields, 'aw3', 'aw-tol-3'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
            }

            let csvContent = "Field,Value\n";
            fields.forEach(f => {
                const input = document.getElementById(f);
                const val = input ? input.value : '';
                csvContent += `${f},${val}\n`;
            });
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const projNameInput = document.getElementById('project-name');
            const projNameVal = projNameInput ? projNameInput.value.trim() : "";
            const exportFileName = projNameVal ? `${projNameVal}.csv` : "gear_design_data.csv";
            link.setAttribute("href", url);
            link.setAttribute("download", exportFileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => {
            let files = e.dataTransfer.files;
            if (files.length) handleFile(files[0]);
        });

        fileInput.addEventListener('change', function () {
            if (this.files.length) handleFile(this.files[0]);
        });
    }

    function handleFile(file) {
        if (!file.name.endsWith('.csv')) {
            alert('Please upload a valid CSV file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            // Clear previous fields before importing
            fields.forEach(f => {
                const input = document.getElementById(f);
                if (input) {
                    input.value = '';
                }
            });

            const text = e.target.result;
            const lines = text.split('\n');
            lines.forEach(line => {
                const cols = line.split(',');
                if (cols.length >= 2) {
                    const id = cols[0].trim();
                    const val = cols[1].trim();
                    if (fields.includes(id) && document.getElementById(id)) {
                        const input = document.getElementById(id);
                        input.value = val;
                        input.dispatchEvent(new Event('change'));
                    }
                }
            });
            // Automatically update UI based on loaded config
            if (gearConfig) gearConfig.dispatchEvent(new Event('change'));
            // Automatically calculate all after importing
            if (calcAllBtn) calcAllBtn.click();
        };
        reader.readAsText(file);
    }
});
