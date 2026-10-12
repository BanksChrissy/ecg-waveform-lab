# ECG Calculus Lab

A buildless, browser-local mathematical ECG workbench. Serves from `docs/` using GitHub Pages.

## Features

- Fifteen leads in the specified main column, including the standard 12 and V7–V9. An optional second column contains V7R–V9R and V1R–V6R, bringing the total to 24. Alternative stacked, paired, standard, and custom arrangements remain available.
- Analytic periodic Gaussian PQRST functions with adjustable rate, model axis, width and amplitudes.
- Safe expression parser (no `eval`), forward automatic differentiation through second order, and adaptive Simpson integration.
- Linked limb-lead equations or independent per-lead expressions.
- Pointer/touch calipers, typed time coordinates, voltage, interval, slope, signed area and RMS measurements.
- Browser-local persistence, JSON session import/export, 1,000 Hz CSV export, and fitted printing.

Run verification with `node test-engine.mjs`, `node test-layout.mjs`, and `node test-shape.mjs`.

## Model limits

This is an original illustrative function generator, not ECGSYN, an inverse ECG solver, or a patient-specific electrophysiology model. Precordial, right-sided and posterior morphology is independently parameterized and illustrative, not reconstructed from standard leads. Gaussian widths do not define detected clinical intervals. The paired layout does not assert that opposite positions must be reciprocal. Physical screen/print millimeters are not calibrated; digital calipers and CSV use numerical seconds and millivolts.

The formula language supports arithmetic, powers, trigonometric/exponential functions, Gaussian pulses and waveform variables. There is no JavaScript execution. Periodic phase `u` is discontinuous at beat boundaries; derivatives there are conservatively undefined. Numerical integration accuracy is conditional on the expression's smoothness. Validation samples finite values on a 500 Hz mesh and cannot prove that arbitrary user expressions are free from narrower singularities. Plotting uses finite sampling and can alias high-frequency custom formulas; exported signals are sampled at 1,000 Hz.

Browser visual QA was unavailable in the build environment. Engine and static UI consistency checks passed.

The default main column is aVR, V7, V8, V9, V1, V2, V3, V4, II, III, aVF, aVL, I, V5, V6. The optional second column is V7R, V8R, V9R, V1R, V2R, V3R, V4R, V5R, V6R. Session versions 1 and 2 migrate to this arrangement without dropping formulas.

Per-lead waveform controls set each P/Q/R/S/T component's amplitude, timing offset, and Gaussian width, plus whole-lead gain and baseline. Drag mode moves the selected component's repeating handles in time and voltage. Adjustments are applied after formula evaluation as analytic Gaussian differences, then gain and baseline. Linked derived leads stay calculated; unlocking them permits direct manipulation. Shape edits persist in version 4 sessions and export through the same signal engine.

## GitHub Pages

In Settings → Pages, select **Deploy from a branch**, branch **main**, folder **/docs**. All assets use relative paths and require no build or server. Browser sessions are stored per website origin: use **Save session** on the previous site and **Load session** here to transfer edits.
