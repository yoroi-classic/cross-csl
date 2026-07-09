# Cross CSL (cardanos-serialization-lib)

## Maintenance status

This package is in compatibility-maintenance mode while consumers migrate to
dcSpark cardano-multiplatform-lib. Changes should stay limited to build
stability, security/toolchain updates, and public API compatibility checks.

## Toolchain

Use Node.js 22 LTS with npm 10 or newer. The root `package-lock.json` is the
authoritative npm workspace lockfile; do not use Yarn or commit package-local
lockfiles for the workspace packages.

## Getting started

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
