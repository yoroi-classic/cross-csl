import { expect } from 'chai';
import { expectPublicApiFixtureOutputs } from '../../cross-csl-core/spec/index.spec';

describe('Cross CSL Browser public API', () => {
  it('loads the browser entrypoint and preserves fixture outputs', async () => {
    const { init, WasmModuleProxy } = await import('../src');
    expect(init).to.be.a('function');
    expect(WasmModuleProxy).to.be.a('function');

    await expectPublicApiFixtureOutputs(init('public-api') as any);
  });
});
