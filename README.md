# Cross CSL (cardano-serialization-lib)

## Deprecation status

cross-csl is deprecated in favor of dcSpark Cardano Multiplatform Lib (CML):
https://github.com/dcSpark/cardano-multiplatform-lib

This repository is kept only as a temporary compatibility facade for existing
callers while consumers migrate to CML. Do not add new downstream dependencies
on `@emurgo/cross-csl-*` packages, and do not publish new cross-csl packages as
a long-term dependency path. Changes should stay limited to build stability,
security/toolchain updates, and public API compatibility checks.

Verified CML npm packages for migration targets:

- Node.js: `@dcspark/cardano-multiplatform-lib-nodejs`
- Browser: `@dcspark/cardano-multiplatform-lib-browser`

Both packages expose `cardano_multiplatform_lib.js` with
`cardano_multiplatform_lib.d.ts` types in the npm metadata. No direct package
replacement is made in this repository because cross-csl's API wraps CSL through
its own compatibility contracts.

Issue #2 tracks the CML migration direction. Issue #1's package replacement
direction is superseded by this deprecation path and should not be used to add a
new long-term cross-csl dependency chain.

## Toolchain

Use Node.js 22 LTS with npm 10 or newer. The root `package-lock.json` is the
authoritative npm workspace lockfile; do not use Yarn or commit package-local
lockfiles for the workspace packages.

## Legacy package use

The packages below are for existing compatibility callers only. New work should
use CML directly.

Package owners should also mark the legacy npm packages deprecated in the
registry after the replacement path is approved:

```
npm deprecate @emurgo/cross-csl-core "Deprecated: migrate to dcSpark Cardano Multiplatform Lib (CML)."
npm deprecate @emurgo/cross-csl-nodejs "Deprecated: migrate to @dcspark/cardano-multiplatform-lib-nodejs."
npm deprecate @emurgo/cross-csl-browser "Deprecated: migrate to @dcspark/cardano-multiplatform-lib-browser."
npm deprecate @emurgo/cross-csl-mobile "Deprecated: migrate to a CML-compatible mobile integration."
```

Install the core package:
```
npm i @emurgo/cross-csl-core
```

Install the package according to your runtime:
```
npm i @emurgo/cross-csl-nodejs
```
or:
```
npm i @emurgo/cross-csl-browser
```
or:
```
npm i @emurgo/cross-csl-mobile
```

Import and call the `init` function from the runtime package (nodejs example):
```
import { init } from '@emurgo/cross-csl-nodejs';
const wasm = init();
```

then simply use the objects from the constructed wasm:
```
const txBuilder = await wasm.TransactionBuilder.new(...);
```
