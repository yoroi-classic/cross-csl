import { expect } from 'chai';
import { init, WasmModuleProxy } from '../src';
import { expectPublicApiFixtureOutputs } from '../../cross-csl-core/spec/index.spec';

describe('Cross CSL NodeJS public API', () => {
  it('exports the Node entrypoint and preserves fixture outputs', async () => {
    expect(init).to.be.a('function');
    expect(WasmModuleProxy).to.be.a('function');

    await expectPublicApiFixtureOutputs(init('public-api') as any);
  });
});
