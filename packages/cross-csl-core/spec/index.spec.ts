import { WasmModuleProxy } from '../src/index';
import { expect } from 'chai';

const BECH32_ADRESS =
  'addr_test1qqyu8ymdqng4fysrks40fm67jfurxhya44mnarz3e7pmjqm4nwegal2y04prwsratk06959g84g6ledz2us9ugd8mqesl76grg';
const PUBLIC_KEY =
  '4711516aac6adccd06054939c45e2487df239ba86cc277ae56aaac0a83f0bf96';
const BECH32_PUBLIC_KEY =
  'ed25519_pk1gug4z64vdtwv6ps9fyuugh3ysl0j8xagdnp80tjk42kq4qlsh7tqpmahzl';
const PRIVATE_KEY =
  'f5beaeff7932a4164d270afde7716067582412e8977e67986cd9b456fc082e3a';
const BIGPRIVATE_KEY =
  '70afd5ff1f7f551c481b7e3f3541f7c63f5f6bcb293af92565af3deea0bcd6481a6e7b8acbe38f3906c63ccbe8b2d9b876572651ac5d2afc0aca284d9412bb1b4839bf02e1d990056d0f06af22ce4bcca52ac00f1074324aab96bbaaaccf290d';
const BECH32_BIGPRIVATE_KEY =
  'xprv1wzhatlcl0a23cjqm0cln2s0hccl4767t9ya0jft94u77ag9u6eyp5mnm3t978reeqmrrejlgktvmsajhyeg6chf2ls9v52zdjsftkx6g8xls9cwejqzk6rcx4u3vuj7v554vqrcswsey42ukhw42enefp56smcvy';
const BASE58BYRON_ADDRESS =
  'Ae2tdPwUPEZ4xAL3nxLq4Py7BfS1D2tJ3u2rxZGnrAXC8TNkWhTaz41J3FN';
const BECH32_ADDRESS =
  'addr1u8pcjgmx7962w6hey5hhsd502araxp26kdtgagakhaqtq8sxy9w7g';
const ED25519KEYHASH =
  '1b268f4cba3faa7e36d8a0cc4adca2096fb856119412ee7330f692b5';
const BECH32_ADDRESS_V2 =
  'addr_test1qqhchrw4umcrf90ew5ep85zefj9724c5jcfg6kp667qau789d6z307gnggrp3hgye75yzgh5q0w6unkqnvfxjfu7vxlswtaxme';
const NATIVE_SCRIPT =
  '8200581ce541b3cf3eee5b50940cb19fae22d4949b9cb93cb4e476f47e7e8787';
const PUBLIC_API_METADATA_JSON = JSON.stringify({
  map: [
    { k: { string: 'purpose' }, v: { string: 'public-api' } },
    { k: { string: 'payload' }, v: { bytes: '000102ff' } }
  ]
});
const PUBLIC_API_ADDRESS_HEX =
  '002f8b8dd5e6f03495f9753213d0594c8be5571496128d583ad781de78e56e8517f913420618dd04cfa84122f403ddae4ec09b1269279e61bf';
const PUBLIC_API_METADATA_HEX =
  'a267707572706f73656a7075626c69632d617069677061796c6f616444000102ff';
const PUBLIC_API_AUXILIARY_DATA_HASH =
  '20a7e88f626f365f024170b185fc09a990d87aa5e4d4b5660ec47972f664fe12';
const PUBLIC_API_TRANSACTION_OUTPUT_HEX =
  '825839002f8b8dd5e6f03495f9753213d0594c8be5571496128d583ad781de78e56e8517f913420618dd04cfa84122f403ddae4ec09b1269279e61bf1a0012d687';

const toHex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex');

export const expectPublicApiFixtureOutputs = async (
  wasm: WasmModuleProxy
): Promise<void> => {
  const address = await wasm.Address.fromBech32(BECH32_ADDRESS_V2);
  expect(await address.toHex()).to.equal(PUBLIC_API_ADDRESS_HEX);
  expect(await address.toBech32(undefined)).to.equal(BECH32_ADDRESS_V2);
  expect(await address.networkId()).to.equal(0);

  const metadata = await wasm.encodeJsonStrToMetadatum(
    PUBLIC_API_METADATA_JSON,
    wasm.MetadataJsonSchema.DetailedSchema
  );
  expect(await metadata.toHex()).to.equal(PUBLIC_API_METADATA_HEX);
  expect(
    await wasm.decodeMetadatumToJsonStr(
      metadata,
      wasm.MetadataJsonSchema.DetailedSchema
    )
  ).to.equal(PUBLIC_API_METADATA_JSON);

  const auxiliaryData = await wasm.AuxiliaryData.new();
  const generalMetadata = await wasm.GeneralTransactionMetadata.new();
  await generalMetadata.insert(await wasm.BigNum.fromStr('674'), metadata);
  await auxiliaryData.setMetadata(generalMetadata);
  const auxiliaryDataHash = await wasm.hashAuxiliaryData(auxiliaryData);
  expect(await auxiliaryDataHash.toHex()).to.equal(
    PUBLIC_API_AUXILIARY_DATA_HASH
  );

  const output = await wasm.TransactionOutput.new(
    address,
    await wasm.Value.new(await wasm.BigNum.fromStr('1234567'))
  );
  expect(toHex(await output.toBytes())).to.equal(
    PUBLIC_API_TRANSACTION_OUTPUT_HEX
  );

  const roundTripOutput = await wasm.TransactionOutput.fromHex(
    PUBLIC_API_TRANSACTION_OUTPUT_HEX
  );
  const roundTripAddress = await roundTripOutput.address();
  expect(await roundTripAddress.toBech32(undefined)).to.equal(
    BECH32_ADDRESS_V2
  );
  const roundTripAmount = await roundTripOutput.amount();
  const roundTripCoin = await roundTripAmount.coin();
  expect(await roundTripCoin.toStr()).to.equal('1234567');
};

export const setupTests = (
  wasm: WasmModuleProxy,
  suiteName: string
): Mocha.Suite => {
  async function makeTransactionBuilder() {
    const bigNum = await wasm.BigNum.fromStr('0');
    const linearFee = await wasm.LinearFee.new(bigNum, bigNum);
    const transactionBuilderConfig =
      await wasm.TransactionBuilderConfigBuilder.new()
        .then((b) => b.feeAlgo(linearFee))
        .then((b) => b.poolDeposit(bigNum))
        .then((b) => b.keyDeposit(bigNum))
        .then((b) => b.coinsPerUtxoByte(bigNum))
        .then((b) => b.maxValueSize(5000))
        .then((b) => b.maxTxSize(16384))
        .then(async (b) =>
          b.exUnitPrices(
            await wasm.ExUnitPrices.new(
              await wasm.UnitInterval.new(
                await wasm.BigNum.fromStr('577'),
                await wasm.BigNum.fromStr('1000')
              ),
              await wasm.UnitInterval.new(
                await wasm.BigNum.fromStr('721'),
                await wasm.BigNum.fromStr('10000000')
              )
            )
          )
        )
        .then((b) => b.preferPureChange(true))
        .then((b) => b.build());
    return await wasm.TransactionBuilder.new(transactionBuilderConfig);
  }

  return describe(suiteName, () => {
    const stakePrivateKey = wasm.PrivateKey.fromNormalBytes(
      Buffer.from(PRIVATE_KEY, 'hex')
    );

    describe('Public API fixtures', () => {
      it('preserves conversion and serialization outputs', async () => {
        await expectPublicApiFixtureOutputs(wasm);
      });
    });

    describe('BigNum', () => {
      if (suiteName !== 'Cross CSL Mobile') {
        it('.toBytes()', async () => {
          const o = await wasm.BigNum.fromStr('1')
            .then((x) => x.toBytes())
            .then((x) => [...x]);
          expect(o).to.eql([1]);
        });

        it('.toStr()', async () => {
          const o = await wasm.BigNum.fromStr('1').then((x) => x.toStr());
          expect(o).to.eql('1');
        });

        it('.checkedMul()', async () => {
          const x = await wasm.BigNum.fromStr('5');
          const y = await wasm.BigNum.fromStr('4');
          const z = await x.checkedMul(y);
          expect(await z.toStr()).to.eql('20');
        });

        it('.fromBytes()', async () => {
          const o = await wasm.BigNum.fromBytes(Buffer.from([0]));
          expect(o.hasValue()).to.be.true;
        });
      }

      it('.checkedAdd()', async () => {
        const x = await wasm.BigNum.fromStr('5');
        const y = await wasm.BigNum.fromStr('4');
        const z = await x.checkedAdd(y);
        expect(await z.toStr()).to.eql('9');
      });

      it('.checkedSub()', async () => {
        const x = await wasm.BigNum.fromStr('5');
        const y = await wasm.BigNum.fromStr('4');
        const z = await x.checkedSub(y);
        expect(await z.toStr()).to.eql('1');
      });

      it('.compare()', async () => {
        const x = await wasm.BigNum.fromStr('5');
        const y = await wasm.BigNum.fromStr('4');
        const z = await wasm.BigNum.fromStr('5');
        const zz = await wasm.BigNum.fromStr('6');
        expect(await x.compare(y)).to.eql(1);
        expect(await x.compare(z)).to.eql(0);
        expect(await x.compare(zz)).to.eql(-1);
      });

      it('.fromStr()', async () => {
        const o = await wasm.BigNum.fromStr('1');
        expect(o.hasValue()).to.be.true;
      });
    });

    describe('LinearFee', () => {
      it('new()', async () => {
        const coefficient = await wasm.BigNum.fromStr('100000');
        const constant = await wasm.BigNum.fromStr('1000');

        const l = await wasm.LinearFee.new(coefficient, constant);
        expect(l.hasValue()).to.be.true;
      });

      it('coefficient()', async () => {
        const coefficient = await wasm.BigNum.fromStr('100000');
        const constant = await wasm.BigNum.fromStr('1000');

        const l = await wasm.LinearFee.new(coefficient, constant);
        expect(await l.coefficient().then((x) => x.toStr())).to.be.equal(
          '100000'
        );
      });

      it('constant()', async () => {
        const coefficient = await wasm.BigNum.fromStr('100000');
        const constant = await wasm.BigNum.fromStr('1000');

        const l = await wasm.LinearFee.new(coefficient, constant);
        expect(await l.constant().then((x) => x.toStr())).to.be.equal('1000');
      });
    });

    describe('GeneralTransactionMetadata', () => {
      it('new()', async () => {
        const g = await wasm.GeneralTransactionMetadata.new();
        expect(g.hasValue()).to.be.true;
      });
      it('.toBytes()', async () => {
        const g = await wasm.GeneralTransactionMetadata.new().then((x) =>
          x.toBytes()
        );
        expect(g).to.be.instanceOf(Uint8Array);
      });
      it('.len()', async () => {
        const g = await wasm.GeneralTransactionMetadata.new();
        expect(await g.len().then((x) => x.toString())).to.be.equal('0');
      });
      it('.insert()', async () => {
        const metaKey = await wasm.BigNum.fromStr('721');
        const metadata = await wasm.GeneralTransactionMetadata.new();
        const metadatum = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify({ image: 'path://image', id: '1' }),
          1
        );
        await metadata.insert(metaKey, metadatum);
        const meta = await metadata.get(metaKey);
        expect(meta).to.not.be.undefined;

        const bytes = await meta!.toBytes();
        const str = Buffer.from(bytes).toString('ascii');

        expect(str)
          .to.contain('id')
          .and.to.contain('1')
          .and.to.contain('image')
          .and.to.contain('path://image');
      });

      it('.get()', async () => {
        const metaKey = await wasm.BigNum.fromStr('721');
        const metadata = await wasm.GeneralTransactionMetadata.new();
        const meta = await metadata.get(metaKey);
        expect(meta).to.be.undefined;
      });

      it('.keys()', async () => {
        const metaKey = await wasm.BigNum.fromStr('721');
        const metadata = await wasm.GeneralTransactionMetadata.new();
        const metadatum = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify({ image: 'path://image', id: '1' }),
          1
        );
        await metadata.insert(metaKey, metadatum);
        expect(
          await metadata.keys().then((x) => x.len().then((y) => y.toString()))
        ).to.be.equal('1');
      });
      it('.fromBytes()', async () => {
        const gBytes = await wasm.GeneralTransactionMetadata.new().then((x) =>
          x.toBytes()
        );
        const g = await wasm.GeneralTransactionMetadata.fromBytes(gBytes);
        expect(g.hasValue()).to.be.true;
      });
    });

    describe('TransactionMetadatumLabels', () => {
      it('new()', async () => {
        const t = await wasm.TransactionMetadatumLabels.new();
        expect(t.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const t = await wasm.TransactionMetadatumLabels.new();
        expect(await t.len().then((x) => x.toString())).to.be.equal('0');
      });
      it('.get()', async () => {
        const t = await wasm.TransactionMetadatumLabels.new();
        const value = await wasm.BigNum.fromStr('1');
        await t.add(value);
        expect(await (await t.get(0)).toStr()).to.be.equal('1');
      });
      it('.add()', async () => {
        const t = await wasm.TransactionMetadatumLabels.new();
        const value = await wasm.BigNum.fromStr('1');
        await t.add(value);
        expect(await t.get(0).then((x) => x.toStr())).to.be.equal('1');
      });
      it('.fromBytes()', async () => {
        const tBytes = await wasm.TransactionMetadatumLabels.new().then((x) =>
          x.toBytes()
        );
        const t = await wasm.TransactionMetadatumLabels.fromBytes(tBytes);
        expect(t.hasValue()).to.be.true;
      });

      it('.toBytes()', async () => {
        const g = await wasm.TransactionMetadatumLabels.new().then((x) =>
          x.toBytes()
        );
        expect(g).to.be.instanceOf(Uint8Array);
      });
    });

    describe('MetadataMap', () => {
      const detailedSchema = {
        map: [
          {
            k: { bytes: '8badf00d' },
            v: { bytes: 'deadbeef' }
          }
        ]
      };

      it('new()', async () => {
        const m = await wasm.MetadataMap.new();
        expect(m.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const t = await wasm.MetadataMap.new();
        expect(await t.len().then((x) => x.toString())).to.be.equal('0');
      });
      it('.toBytes()', async () => {
        const g = await wasm.MetadataMap.new().then((x) => x.toBytes());
        expect(g).to.be.instanceOf(Uint8Array);
      });
      it('.get()', async () => {
        const t = await wasm.MetadataMap.new();
        const metadatumKey = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify(detailedSchema),
          1
        );
        const metadatumValue = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify(detailedSchema),
          2
        );
        await t.insert(metadatumKey, metadatumValue);
        expect(await t.get(metadatumKey)).to.be.instanceOf(
          wasm.TransactionMetadatum
        );
      });

      it('.getStr()', async () => {
        const t = await wasm.MetadataMap.new();
        const key = 'key';
        const metadatumValue = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify(detailedSchema),
          2
        );
        await t.insertStr(key, metadatumValue);
        expect(await t.getStr(key)).to.be.instanceOf(wasm.TransactionMetadatum);
      });

      it('.getI32()', async () => {
        const t = await wasm.MetadataMap.new();
        const key = 0;
        const metadatumValue = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify(detailedSchema),
          2
        );
        await t.insertI32(key, metadatumValue);
        expect(await t.getI32(key)).to.be.instanceOf(wasm.TransactionMetadatum);
      });
      it('.insert()', async () => {
        const t = await wasm.MetadataMap.new();
        const metadatumKey = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify(detailedSchema),
          1
        );
        const metadatumValue = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify(detailedSchema),
          2
        );
        await t.insert(metadatumKey, metadatumValue);
        expect(await t.len().then((x) => x.toString())).to.be.equal('1');
      });

      it('.insertStr()', async () => {
        const t = await wasm.MetadataMap.new();
        const key = 'key';
        const metadatumValue = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify(detailedSchema),
          2
        );
        await t.insertStr(key, metadatumValue);
        expect(await t.getStr(key)).to.not.be.undefined;
      });

      it('.insertI32()', async () => {
        const t = await wasm.MetadataMap.new();
        const key = 0;
        const metadatumValue = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify(detailedSchema),
          2
        );
        await t.insertI32(key, metadatumValue);
        expect(await t.getI32(key)).to.not.be.undefined;
      });

      it('.has()', async () => {
        const t = await wasm.MetadataMap.new();
        const metadatumKey = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify(detailedSchema),
          1
        );
        const metadatumValue = await wasm.encodeJsonStrToMetadatum(
          JSON.stringify(detailedSchema),
          2
        );
        await t.insert(metadatumKey, metadatumValue);
        expect(await t.has(metadatumKey)).to.be.true;
      });
      it('.fromBytes()', async () => {
        const tBytes = await wasm.MetadataMap.new().then((x) => x.toBytes());
        const t = await wasm.MetadataMap.fromBytes(tBytes);
        expect(t.hasValue()).to.be.true;
      });
    });

    describe('Int', () => {
      it('.new()', async () => {
        const value = await wasm.BigNum.fromStr('1');
        const i = await wasm.Int.new(value);
        expect(i.hasValue()).to.be.true;
      });
      it('.newI32()', async () => {
        const i = await wasm.Int.newI32(1);
        expect(i.hasValue()).to.be.true;
      });
      it('.newNegative()', async () => {
        const value = await wasm.BigNum.fromStr('1');
        const i = await wasm.Int.newNegative(value);
        expect(i.hasValue()).to.be.true;
      });
      it('.isPositive()', async () => {
        const value = await wasm.BigNum.fromStr('1');
        const i = await wasm.Int.new(value);
        expect(await i.isPositive()).to.be.true;
      });
      it('.asPositive()', async () => {
        const value = await wasm.BigNum.fromStr('1');
        const i = await wasm.Int.new(value);
        expect(await (await i.asPositive())?.toStr()).to.be.equal('1');
      });
      it('.asNegative()', async () => {
        const value = await wasm.BigNum.fromStr('1');
        const i = await wasm.Int.newNegative(value);
        expect(await i.asNegative().then((x) => x?.toStr())).to.be.equal('1');
      });
      it('.asI32()', async () => {
        const value = await wasm.BigNum.fromStr('1');
        const i = await wasm.Int.new(value);
        expect(await i.asI32().then((x) => x?.toString())).to.be.equal('1');
      });

      it('.add()', async () => {
        const t = await wasm.TransactionMetadatumLabels.new();
        const value = await wasm.BigNum.fromStr('1');
        await t.add(value);
        expect(await t.get(0).then((x) => x?.toStr())).to.be.equal('1');
      });
      it('.fromBytes()', async () => {
        const tBytes = await wasm.TransactionMetadatumLabels.new().then((x) =>
          x.toBytes()
        );
        const t = await wasm.TransactionMetadatumLabels.fromBytes(tBytes);
        expect(t.hasValue()).to.be.true;
      });

      it('.toBytes()', async () => {
        const g = await wasm.TransactionMetadatumLabels.new().then((x) =>
          x.toBytes()
        );
        expect(g).to.be.instanceOf(Uint8Array);
      });
    });

    describe('TransactionMetadatum', () => {
      it('newMap()', async () => {
        const value = await wasm.MetadataMap.new();
        const t = await wasm.TransactionMetadatum.newMap(value);
        expect(t.hasValue()).to.be.true;
      });
      it('newList()', async () => {
        const value = await wasm.MetadataList.new();
        const t = await wasm.TransactionMetadatum.newList(value);
        expect(t.hasValue()).to.be.true;
      });
      it('newInt()', async () => {
        const value = await wasm.BigNum.fromStr('1');
        const intValue = await wasm.Int.new(value);
        const t = await wasm.TransactionMetadatum.newInt(intValue);
        expect(t.hasValue()).to.be.true;
      });
      it('newBytes()', async () => {
        const t = await wasm.TransactionMetadatum.newBytes(Buffer.from([0]));
        expect(t.hasValue()).to.be.true;
      });
      it('newText()', async () => {
        const t = await wasm.TransactionMetadatum.newText('text');
        expect(t.hasValue()).to.be.true;
      });
      it('toBytes()', async () => {
        const g = await wasm.TransactionMetadatum.newText('text').then((x) =>
          x.toBytes()
        );
        expect(g).to.be.instanceOf(Uint8Array);
      });
      it('kind()', async () => {
        const value = await wasm.BigNum.fromStr('1');
        const intValue = await wasm.Int.new(value);
        const t = await wasm.TransactionMetadatum.newInt(intValue);
        expect((await t.kind()).toString()).to.be.equal('2');
      });
      it('asInt()', async () => {
        const value = await wasm.BigNum.fromStr('1');
        const intValue = await wasm.Int.new(value);
        const t = await wasm.TransactionMetadatum.newInt(intValue);
        expect(
          await t.asInt()?.then((x) => x.asI32()?.then((y) => y?.toString()))
        ).to.be.equal('1');
      });
      it('asMap()', async () => {
        const value = await wasm.MetadataMap.new();
        const t = await wasm.TransactionMetadatum.newMap(value);
        expect(await t.asMap()).to.be.instanceOf(wasm.MetadataMap);
      });
      it('asList()', async () => {
        const value = await wasm.MetadataList.new();
        const t = await wasm.TransactionMetadatum.newList(value);
        expect(await t.asList()).to.be.instanceOf(wasm.MetadataList);
      });
      it('asBytes()', async () => {
        const t = await wasm.TransactionMetadatum.newBytes(Buffer.from([]));
        expect(await t.asBytes()).to.be.instanceOf(Uint8Array);
      });
      it('asText()', async () => {
        const t = await wasm.TransactionMetadatum.newText('text');
        expect(await t.asText()).to.be.equal('text');
      });
    });

    describe('AuxiliaryData', () => {
      it('.new()', async () => {
        const value = await wasm.GeneralTransactionMetadata.new();
        const a = await wasm.AuxiliaryData.new();
        await a.setMetadata(value);
        expect(a.hasValue()).to.be.true;
      });
      it('.toBytes()', async () => {
        const value = await wasm.GeneralTransactionMetadata.new();
        const auxdata = await wasm.AuxiliaryData.new();
        await auxdata.setMetadata(value);
        const g = await auxdata.toBytes();
        expect(g).to.be.instanceOf(Uint8Array);
      });
      it('.metadata()', async () => {
        const value = await wasm.GeneralTransactionMetadata.new();
        const a = await wasm.AuxiliaryData.new();
        await a.setMetadata(value);
        expect(await a.metadata()).to.be.instanceOf(
          wasm.GeneralTransactionMetadata
        );
      });
      it('.setMetadata()', async () => {
        const a = await wasm.AuxiliaryData.new();
        const m = await wasm.GeneralTransactionMetadata.new();
        await a.setMetadata(m);
        expect(await a.metadata()).to.be.instanceOf(
          wasm.GeneralTransactionMetadata
        );
      });
      it('.nativeScripts()', async () => {
        const value = await wasm.GeneralTransactionMetadata.new();
        const a = await wasm.AuxiliaryData.new();
        await a.setMetadata(value);
        expect(await a.nativeScripts()).to.be.undefined;
      });
      it('.setNativeScripts()', async () => {
        const value = await wasm.GeneralTransactionMetadata.new();
        const a = await wasm.AuxiliaryData.new();
        await a.setMetadata(value);
        const n = await wasm.NativeScripts.new();
        await a.setNativeScripts(n);
        expect(await a.nativeScripts()).to.be.instanceOf(wasm.NativeScripts);
      });
      it('.plutusScripts()', async () => {
        const value = await wasm.GeneralTransactionMetadata.new();
        const a = await wasm.AuxiliaryData.new();
        await a.setMetadata(value);
        expect(await a.plutusScripts()).to.be.undefined;
      });
      it('.setPlutusScripts()', async () => {
        const value = await wasm.GeneralTransactionMetadata.new();
        const a = await wasm.AuxiliaryData.new();
        await a.setMetadata(value);
        const p = await wasm.PlutusScripts.new();
        await a.setPlutusScripts(p);
        expect(await a.plutusScripts()).to.be.instanceOf(wasm.PlutusScripts);
      });
      it('.fromBytes()', async () => {
        const value = await wasm.GeneralTransactionMetadata.new();
        const auxdata = await wasm.AuxiliaryData.new();
        await auxdata.setMetadata(value);
        const aBytes = await auxdata.toBytes();
        const a = await wasm.AuxiliaryData.fromBytes(aBytes);
        expect(a.hasValue()).to.be.true;
      });
    });

    describe('AssetName', () => {
      it('.new()', async () => {
        const a = await wasm.AssetName.new(Buffer.from([0]));
        expect(a.hasValue()).to.be.true;
      });
      it('.toBytes()', async () => {
        const g = await wasm.AssetName.new(Buffer.from([]));
        expect(await g.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.name()', async () => {
        const a = await wasm.AssetName.new(Buffer.from([0]));
        expect(await a.name()).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const gBytes = await wasm.AssetName.new(Buffer.from([])).then((x) =>
          x.toBytes()
        );
        const a = await wasm.AssetName.fromBytes(gBytes);
        expect(a.hasValue()).to.be.true;
      });
    });

    describe('AssetNames', () => {
      it('.new()', async () => {
        const a = await wasm.AssetNames.new();
        expect(a.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const a = await wasm.AssetNames.new();
        expect((await a.len()).toString()).to.be.equal('0');
      });
      it('.get()', async () => {
        const a = await wasm.AssetNames.new();
        const name = await wasm.AssetName.new(Buffer.from([0]));
        await a.add(name);
        expect(await a.get(0)).to.be.instanceOf(wasm.AssetName);
      });
      it('.add()', async () => {
        const a = await wasm.AssetNames.new();
        const name = await wasm.AssetName.new(Buffer.from([0]));
        await a.add(name);
        expect(await a.get(0)).to.be.instanceOf(wasm.AssetName);
      });
    });

    describe('Assets', () => {
      it('.new()', async () => {
        const a = await wasm.Assets.new();
        expect(a.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const a = await wasm.Assets.new();
        expect((await a.len()).toString()).to.be.equal('0');
      });
      it('.get()', async () => {
        const a = await wasm.Assets.new();
        const assetName = await wasm.AssetName.new(Buffer.from([0]));
        const value = await wasm.BigNum.fromStr('0');
        await a.insert(assetName, value);
        expect(await a.get(assetName)).to.be.instanceOf(wasm.BigNum);
      });
      it('.insert()', async () => {
        const a = await wasm.Assets.new();
        const assetName = await wasm.AssetName.new(Buffer.from([0]));
        await a.insert(assetName, await wasm.BigNum.fromStr('0'));
        expect(await a.len()).to.be.equal(1);
      });
      it('.keys()', async () => {
        const a = await wasm.Assets.new();
        expect(await a.keys()).to.be.instanceOf(wasm.AssetNames);
      });
    });

    describe('ScriptHash', () => {
      it('.toBytes()', async () => {
        const s = await wasm.ScriptHash.fromBytes(
          Buffer.from(Array.from(Array(28).keys()).fill(0))
        ).then((x) => x.toBytes());
        expect(s).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const s = await wasm.ScriptHash.fromBytes(
          Buffer.from(Array.from(Array(28).keys()).fill(0))
        );
        expect(s.hasValue()).to.be.true;
      });
    });

    describe('ScriptHashes', () => {
      it('.new()', async () => {
        const s = await wasm.ScriptHashes.new();
        expect(s.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const s = await wasm.ScriptHashes.new();
        expect((await s.len()).toString()).to.be.equal('0');
      });
      it('.get()', async () => {
        const s = await wasm.ScriptHashes.new();
        const scriptHash = await wasm.ScriptHash.fromBytes(
          Buffer.from(Array.from(Array(28).keys()).fill(0))
        );
        await s.add(scriptHash);
        expect(await s.get(0)).to.be.instanceOf(wasm.ScriptHash);
      });
      it('.add()', async () => {
        const s = await wasm.ScriptHashes.new();
        const scriptHash = await wasm.ScriptHash.fromBytes(
          Buffer.from(Array.from(Array(28).keys()).fill(0))
        );
        await s.add(scriptHash);
        expect((await s.len()).toString()).to.be.equal('1');
      });
      it('.toBytes()', async () => {
        const s = await wasm.ScriptHashes.new();
        expect(await s.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const sBytes = await wasm.ScriptHashes.new().then((x) => x.toBytes());
        const s = await wasm.ScriptHashes.fromBytes(sBytes);
        expect(s.hasValue()).to.be.true;
      });
    });

    describe('MultiAsset', () => {
      it('.new()', async () => {
        const m = await wasm.MultiAsset.new();
        expect(m.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const m = await wasm.MultiAsset.new();
        expect((await m.len()).toString()).to.be.equal('0');
      });
      it('.get()', async () => {
        const m = await wasm.MultiAsset.new();
        const key = await wasm.ScriptHash.fromBytes(
          Buffer.from(Array.from(Array(28).keys()).fill(0))
        );
        const value = await wasm.Assets.new();
        await m.insert(key, value);
        expect(await m.get(key)).to.be.instanceOf(wasm.Assets);
      });
      it('.add()', async () => {
        const m = await wasm.MultiAsset.new();
        const key = await wasm.ScriptHash.fromBytes(
          Buffer.from(Array.from(Array(28).keys()).fill(0))
        );
        const value = await wasm.Assets.new();
        await m.insert(key, value);
        expect((await m.len()).toString()).to.be.equal('1');
      });
      it('.keys()', async () => {
        const m = await wasm.MultiAsset.new();
        expect(await m.keys()).to.be.instanceOf(wasm.ScriptHashes);
      });
      it('.sub()', async () => {
        const m = await wasm.MultiAsset.new();
        expect(await m.sub(m)).to.be.instanceOf(wasm.MultiAsset);
      });
    });

    describe('Ed25519KeyHash', () => {
      it('.toBytes()', async () => {
        const e = await wasm.Ed25519KeyHash.fromBytes(
          Buffer.from(Array.from(Array(28).keys()).fill(0))
        ).then((x) => x.toBytes());
        expect(e).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const e = await wasm.Ed25519KeyHash.fromBytes(
          Buffer.from(Array.from(Array(28).keys()).fill(0))
        );
        expect(e.hasValue()).to.be.true;
      });
    });

    describe('TransactionHash', () => {
      it('.toBytes()', async () => {
        const e = await wasm.TransactionHash.fromBytes(
          Buffer.from(Array.from(Array(32).keys()).fill(0))
        ).then((x) => x.toBytes());
        expect(e).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const e = await wasm.TransactionHash.fromBytes(
          Buffer.from(Array.from(Array(32).keys()).fill(0))
        );
        expect(e.hasValue()).to.be.true;
      });
    });

    describe('TransactionInput', () => {
      it('.new()', async () => {
        const thash = await wasm.TransactionHash.fromBytes(
          Buffer.from(Array.from(Array(32).keys()).fill(0))
        );
        const t = await wasm.TransactionInput.new(thash, 0);
        expect(t.hasValue()).to.be.true;
      });
      it('.transactionId()', async () => {
        const thash = await wasm.TransactionHash.fromBytes(
          Buffer.from(Array.from(Array(32).keys()).fill(0))
        );
        const t = await wasm.TransactionInput.new(thash, 0);
        expect(await t.transactionId()).to.be.instanceOf(wasm.TransactionHash);
      });
      it('.index()', async () => {
        const thash = await wasm.TransactionHash.fromBytes(
          Buffer.from(Array.from(Array(32).keys()).fill(0))
        );
        const t = await wasm.TransactionInput.new(thash, 0);
        expect((await t.index()).toString()).to.be.equal('0');
      });
      it('.toBytes()', async () => {
        const t = await wasm.TransactionInput.new(
          await wasm.TransactionHash.fromBytes(
            Buffer.from(Array.from(Array(32).keys()).fill(0))
          ),
          0
        ).then((x) => x.toBytes());
        expect(t).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const tBytes = await wasm.TransactionInput.new(
          await wasm.TransactionHash.fromBytes(
            Buffer.from(Array.from(Array(32).keys()).fill(0))
          ),
          0
        ).then((x) => x.toBytes());
        const t = await wasm.TransactionInput.fromBytes(tBytes);
        expect(t.hasValue()).to.be.true;
      });
    });

    describe('Value', () => {
      it('.new()', async () => {
        const value = await wasm.BigNum.fromStr('0');
        const v = await wasm.Value.new(value);
        expect(v.hasValue()).to.be.true;
      });
      it('.coin()', async () => {
        const value = await wasm.BigNum.fromStr('0');
        const v = await wasm.Value.new(value);
        expect(await v.coin().then((x) => x.toStr())).to.be.equal('0');
      });
      it('.setCoin()', async () => {
        const value = await wasm.BigNum.fromStr('0');
        const v = await wasm.Value.new(value);
        await v.setCoin(await wasm.BigNum.fromStr('1'));
        expect(await v.coin().then((x) => x.toStr())).to.be.equal('1');
      });
      it('.multiasset()', async () => {
        const value = await wasm.BigNum.fromStr('0');
        const v = await wasm.Value.new(value);
        const ma = await wasm.MultiAsset.new();
        await v.setMultiasset(ma);
        expect(await v.multiasset()).to.be.instanceOf(wasm.MultiAsset);
      });
      it('.setMultiasset()', async () => {
        const value = await wasm.BigNum.fromStr('0');
        const v = await wasm.Value.new(value);
        const multiAsset = await wasm.MultiAsset.new();
        await v.setMultiasset(multiAsset);
        expect(
          await v.multiasset().then((x) => x!.keys.length.toString())
        ).to.be.equal(multiAsset.keys.length.toString());
      });
      it('.checkedAdd()', async () => {
        const value = await wasm.BigNum.fromStr('0');
        const v = await wasm.Value.new(value);
        const value2 = await wasm.BigNum.fromStr('0');
        const v2 = await wasm.Value.new(value2);
        await v.checkedAdd(v2);
        expect(await v.coin().then((x) => x.toStr())).to.be.equal('0');
      });
      it('.checkedSub()', async () => {
        const value = await wasm.BigNum.fromStr('0');
        const v = await wasm.Value.new(value);
        const value2 = await wasm.BigNum.fromStr('0');
        const v2 = await wasm.Value.new(value2);
        await v.checkedSub(v2);
        expect(await v.coin().then((x) => x.toStr())).to.be.equal('0');
      });
      it('.clampedSub()', async () => {
        const value = await wasm.BigNum.fromStr('0');
        const v = await wasm.Value.new(value);
        const value2 = await wasm.BigNum.fromStr('0');
        const v2 = await wasm.Value.new(value2);
        await v.clampedSub(v2);
        expect(await v.coin().then((x) => x.toStr())).to.be.equal('0');
      });
      it('.compare()', async () => {
        const value = await wasm.BigNum.fromStr('1');
        const value2 = await wasm.BigNum.fromStr('0');
        const v = await wasm.Value.new(value);
        const v2 = await wasm.Value.new(value2);
        const v3 = await wasm.Value.new(value);
        expect(await v.compare(v3)).to.be.equal(0);
        expect(await v.compare(v2)).to.be.equal(1);
      });
    });

    describe('Address', () => {
      it('.toBytes()', async () => {
        const a = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        ).then((x) => x.toBytes());
        expect(a).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const a = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        expect(a.hasValue()).to.be.true;
      });
      it('.toBech32()', async () => {
        const a = await wasm.Address.fromBech32(BECH32_ADRESS);
        expect(await a.toBech32(undefined)).to.eql(BECH32_ADRESS);
      });
      it('.fromBech32()', async () => {
        const a = await wasm.Address.fromBech32(BECH32_ADRESS);
        expect(a.hasValue()).to.be.true;
      });
      it('.networkId()', async () => {
        const a = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        expect(await a.networkId()).to.be.equal(0);
      });
    });

    describe('PublicKey', () => {
      it('.toBech32()', async () => {
        const p = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        expect(await p.toBech32()).to.be.equal(BECH32_PUBLIC_KEY);
      });
      it('.asBytes()', async () => {
        expect(
          await wasm.PublicKey.fromBytes(Buffer.from(PUBLIC_KEY, 'hex')).then(
            (x) => x.asBytes()
          )
        ).to.be.instanceOf(Uint8Array);
      });
      it('.hash()', async () => {
        expect(
          await wasm.PublicKey.fromBytes(Buffer.from(PUBLIC_KEY, 'hex')).then(
            (x) => x.hash()
          )
        ).to.be.instanceOf(wasm.Ed25519KeyHash);
      });
      it('.fromBech32()', async () => {
        const p = await wasm.PublicKey.fromBech32(BECH32_PUBLIC_KEY);
        expect(p.hasValue()).to.be.true;
      });
      it('.fromBytes()', async () => {
        const p = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        expect(p.hasValue()).to.be.true;
      });
    });

    describe('PrivateKey', () => {
      it('.toPublic()', async () => {
        expect(
          await wasm.PrivateKey.fromNormalBytes(
            Buffer.from(PRIVATE_KEY, 'hex')
          ).then((x) => x.toPublic())
        ).to.be.instanceOf(wasm.PublicKey);
      });
      it('.toBech32()', async () => {
        expect(
          await wasm.PrivateKey.fromNormalBytes(
            Buffer.from(PRIVATE_KEY, 'hex')
          ).then((x) => x.toBech32())
        ).to.be.equal(
          'ed25519_sk17kl2almex2jpvnf8pt77wutqvavzgyhgjalx0xrvmx69dlqg9caqykn2tk'
        );
      });
      it('.asBytes()', async () => {
        expect(
          await wasm.PrivateKey.fromNormalBytes(
            Buffer.from(PRIVATE_KEY, 'hex')
          ).then((x) => x.asBytes())
        ).to.be.instanceOf(Uint8Array);
      });
      it('.sign()', async () => {
        expect(
          await wasm.PrivateKey.fromNormalBytes(
            Buffer.from(PRIVATE_KEY, 'hex')
          ).then((x) => x.sign(Buffer.from('test')))
        ).to.be.instanceOf(wasm.Ed25519Signature);
      });
      it('.fromExtendedBytes()', async () => {
        const p = await wasm.PrivateKey.fromExtendedBytes(
          Buffer.from(
            '4820f7ce221e177c8eae2b2ee5c1f1581a0d88ca5c14329d8f2389e77a465655c27662621bfb99cb9445bf8114cc2a630afd2dd53bc88c08c5f2aed8e9c7cb89',
            'hex'
          )
        );
        expect(p.hasValue()).to.be.true;
      });
      it('.fromNormalBytes()', async () => {
        const p = await wasm.PrivateKey.fromNormalBytes(
          Buffer.from(PRIVATE_KEY, 'hex')
        );
        expect(p.hasValue()).to.be.true;
      });
      it('.generateEd25519()', async () => {
        const p = await wasm.PrivateKey.generateEd25519();
        expect(p.hasValue()).to.be.true;
      });
      it('.generateEd25519extended()', async () => {
        const p = await wasm.PrivateKey.generateEd25519extended();
        expect(p.hasValue()).to.be.true;
      });
    });

    describe('Bip32PrivateKey', () => {
      it('.derive()', async () => {
        expect(
          await wasm.Bip32PrivateKey.fromBytes(
            Buffer.from(BIGPRIVATE_KEY, 'hex')
          ).then((x) => x.derive(0))
        ).to.be.instanceOf(wasm.Bip32PrivateKey);
      });
      it('.toRawKey()', async () => {
        expect(
          await wasm.Bip32PrivateKey.fromBytes(
            Buffer.from(BIGPRIVATE_KEY, 'hex')
          ).then((x) => x.toRawKey())
        ).to.be.instanceOf(wasm.PrivateKey);
      });
      it('.toPublic()', async () => {
        expect(
          await wasm.Bip32PrivateKey.fromBytes(
            Buffer.from(BIGPRIVATE_KEY, 'hex')
          ).then((x) => x.toPublic())
        ).to.be.instanceOf(wasm.Bip32PublicKey);
      });
      it('.asBytes()', async () => {
        expect(
          await wasm.Bip32PrivateKey.fromBytes(
            Buffer.from(BIGPRIVATE_KEY, 'hex')
          ).then((x) => x.asBytes())
        ).to.be.instanceOf(Uint8Array);
      });
      it('.toBech32()', async () => {
        expect(
          await wasm.Bip32PrivateKey.fromBytes(
            Buffer.from(BIGPRIVATE_KEY, 'hex')
          ).then((x) => x.toBech32())
        ).to.be.equal(BECH32_BIGPRIVATE_KEY);
      });
      it('.fromBip39Entropy()', async () => {
        const p = await wasm.Bip32PrivateKey.fromBip39Entropy(
          Buffer.from(BIGPRIVATE_KEY, 'hex'),
          Buffer.from(BIGPRIVATE_KEY, 'hex')
        );
        expect(p.hasValue()).to.be.true;
      });
      it('.fromBech32()', async () => {
        const p = await wasm.Bip32PrivateKey.fromBech32(BECH32_BIGPRIVATE_KEY);
        expect(p.hasValue()).to.be.true;
      });
      it('.fromBytes()', async () => {
        const p = await wasm.Bip32PrivateKey.fromBytes(
          Buffer.from(BIGPRIVATE_KEY, 'hex')
        );
        expect(p.hasValue()).to.be.true;
      });
      it('.generateEd25519Bip32()', async () => {
        const p = await wasm.Bip32PrivateKey.generateEd25519Bip32();
        expect(p.hasValue()).to.be.true;
      });
    });

    describe('ByronAddress', () => {
      it('.toBase58()', async () => {
        expect(
          await wasm.ByronAddress.fromBase58(BASE58BYRON_ADDRESS).then((x) =>
            x.toBase58()
          )
        ).to.be.equal(BASE58BYRON_ADDRESS);
      });
      it('.toAddress()', async () => {
        expect(
          await wasm.ByronAddress.fromBase58(BASE58BYRON_ADDRESS).then((x) =>
            x.toAddress()
          )
        ).to.be.instanceOf(wasm.Address);
      });
      it('.byronProtocolMagic()', async () => {
        expect(
          await wasm.ByronAddress.fromBase58(BASE58BYRON_ADDRESS).then((x) =>
            x.byronProtocolMagic()
          )
        ).to.be.equal(764824073);
      });
      it('.attributes()', async () => {
        expect(
          await wasm.ByronAddress.fromBase58(BASE58BYRON_ADDRESS).then((x) =>
            x.attributes()
          )
        ).to.be.instanceOf(Uint8Array);
      });
      it('.icarusFromKey()', async () => {
        const publicKey =
          await wasm.Bip32PrivateKey.generateEd25519Bip32().then((x) =>
            x.toPublic()
          );
        const b = await wasm.ByronAddress.icarusFromKey(publicKey, 0);
        expect(b.hasValue()).to.be.true;
      });
      it('.fromBase58()', async () => {
        const b = await wasm.ByronAddress.fromBase58(BASE58BYRON_ADDRESS);
        expect(b.hasValue()).to.be.true;
      });
      it('.fromAddress()', async () => {
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        const b = await wasm.ByronAddress.fromAddress(address);
        expect(b).to.be.undefined;
      });
      it('.isValid()', async () => {
        expect(await wasm.ByronAddress.isValid(BASE58BYRON_ADDRESS)).to.be.true;
      });
    });
    describe('TransactionOutput', () => {
      it('.toBytes()', async () => {
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        const numValue = await wasm.BigNum.fromStr('0');
        const value = await wasm.Value.new(numValue);
        const t = await wasm.TransactionOutput.new(address, value);
        expect(await t.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.address()', async () => {
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        const numValue = await wasm.BigNum.fromStr('0');
        const value = await wasm.Value.new(numValue);
        const t = await wasm.TransactionOutput.new(address, value);
        expect(await t.address()).to.be.instanceOf(wasm.Address);
      });
      it('.amount()', async () => {
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        const numValue = await wasm.BigNum.fromStr('0');
        const value = await wasm.Value.new(numValue);
        const t = await wasm.TransactionOutput.new(address, value);
        expect(await t.amount()).to.be.instanceOf(wasm.Value);
      });
      it('.new()', async () => {
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        const numValue = await wasm.BigNum.fromStr('0');
        const value = await wasm.Value.new(numValue);
        const t = await wasm.TransactionOutput.new(address, value);
        expect(t.hasValue()).to.be.true;
      });
      it('.fromBytes()', async () => {
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        const bigNum = await wasm.BigNum.fromStr('0');
        const value = await wasm.Value.new(bigNum);
        const tBytes = await wasm.TransactionOutput.new(address, value).then(
          (x) => x.toBytes()
        );
        const t = await wasm.TransactionOutput.fromBytes(tBytes);
        expect(t.hasValue()).to.be.true;
      });
    });
    describe('Credential', () => {
      it('.toBytes()', async () => {
        const key = await stakePrivateKey;
        const hash = await key.toPublic().then((x) => x.hash());
        const s = await wasm.Credential.fromKeyhash(hash);
        expect(await s.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.toKeyhash()', async () => {
        const key = await stakePrivateKey;
        const hash = await key.toPublic().then((x) => x.hash());
        const s = await wasm.Credential.fromKeyhash(hash);
        expect(await s.toKeyhash()).to.be.instanceOf(wasm.Ed25519KeyHash);
      });
      it('.toScripthash()', async () => {
        const scriptHash = await wasm.ScriptHash.fromBytes(new Uint8Array(28));
        const s = await wasm.Credential.fromScripthash(scriptHash);
        expect(await s.toScripthash()).to.be.instanceOf(wasm.ScriptHash);
      });
      it('.kind()', async () => {
        const key = await stakePrivateKey;
        const hash = await key.toPublic().then((x) => x.hash());
        const s = await wasm.Credential.fromKeyhash(hash);
        expect(await s.kind()).to.be.equal(0);
      });
      it('.fromBytes()', async () => {
        const key = await stakePrivateKey;
        const hash = await key.toPublic().then((x) => x.hash());
        const sBytes = await wasm.Credential.fromKeyhash(hash).then((x) =>
          x.toBytes()
        );
        const s = await wasm.Credential.fromBytes(sBytes);
        expect(s.hasValue()).to.be.true;
      });
      it('.fromKeyhash()', async () => {
        const key = await stakePrivateKey;
        const hash = await key.toPublic().then((x) => x.hash());
        const s = await wasm.Credential.fromKeyhash(hash);
        expect(s.hasValue()).to.be.true;
      });
      it('.fromScripthash()', async () => {
        const scriptHash = await wasm.ScriptHash.fromBytes(
          Buffer.from(Array.from(Array(28).keys()).fill(0))
        );
        const s = await wasm.Credential.fromScripthash(scriptHash);
        expect(s.hasValue()).to.be.true;
      });
    });
    describe('StakeRegistration', () => {
      it('.toBytes()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const s = await wasm.StakeRegistration.new(stakeCredential);
        expect(await s.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.stakeCredential()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const s = await wasm.StakeRegistration.new(stakeCredential);
        expect(await s.stakeCredential()).to.be.instanceOf(wasm.Credential);
      });
      it('.fromBytes()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const sBytes = await wasm.StakeRegistration.new(stakeCredential).then(
          (x) => x.toBytes()
        );
        const s = await wasm.StakeRegistration.fromBytes(sBytes);
        expect(s.hasValue()).to.be.true;
      });
      it('.new()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const s = await wasm.StakeRegistration.new(stakeCredential);
        expect(s.hasValue()).to.be.true;
      });
    });

    describe('StakeDeregistration', () => {
      it('.toBytes()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const s = await wasm.StakeDeregistration.new(stakeCredential);
        expect(await s.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.stakeCredential()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const s = await wasm.StakeDeregistration.new(stakeCredential);
        expect(await s.stakeCredential()).to.be.instanceOf(wasm.Credential);
      });
      it('.fromBytes()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const sBytes = await (
          await wasm.StakeDeregistration.new(stakeCredential)
        ).toBytes();
        const s = await wasm.StakeDeregistration.fromBytes(sBytes);
        expect(s.hasValue()).to.be.true;
      });
      it('.new()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const s = await wasm.StakeDeregistration.new(stakeCredential);
        expect(s.hasValue()).to.be.true;
      });
    });
    describe('StakeDelegation', () => {
      it('.toBytes()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const poolKeyHash = await key.toPublic().then((x) => x.hash());
        const s = await wasm.StakeDelegation.new(stakeCredential, poolKeyHash);
        expect(await s.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.stakeCredential()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const poolKeyHash = await key.toPublic().then((x) => x.hash());
        const s = await wasm.StakeDelegation.new(stakeCredential, poolKeyHash);
        expect(await s.stakeCredential()).to.be.instanceOf(wasm.Credential);
      });
      it('.poolKeyhash()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const poolKeyHash = await key.toPublic().then((x) => x.hash());
        const s = await wasm.StakeDelegation.new(stakeCredential, poolKeyHash);
        expect(await s.poolKeyhash()).to.be.instanceOf(wasm.Ed25519KeyHash);
      });
      it('.fromBytes()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const poolKeyHash = await key.toPublic().then((x) => x.hash());
        const sBytes = await wasm.StakeDelegation.new(
          stakeCredential,
          poolKeyHash
        ).then((x) => x.toBytes());
        const s = await wasm.StakeDelegation.fromBytes(sBytes);
        expect(s.hasValue()).to.be.true;
      });
      it('.new()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const poolKeyHash = await key.toPublic().then((x) => x.hash());
        const s = await wasm.StakeDelegation.new(stakeCredential, poolKeyHash);
        expect(s.hasValue()).to.be.true;
      });
    });
    describe('Certificate', () => {
      it('.toBytes()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const c = await wasm.Certificate.newStakeRegistration(
          await wasm.StakeRegistration.new(stakeCredential)
        );
        expect(await c.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.asStakeRegistration()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const stakeRegistration = await wasm.StakeRegistration.new(
          stakeCredential
        );
        const c = await wasm.Certificate.newStakeRegistration(
          stakeRegistration
        );
        expect(await c.asStakeRegistration()).to.be.instanceOf(
          wasm.StakeRegistration
        );
      });
      it('.asStakeDelegation()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const stakeDelegation = await wasm.StakeDelegation.new(
            stakeCredential,
            await key.toPublic().then((x) => x.hash())
        );
        const c = await wasm.Certificate.newStakeDelegation(
          stakeDelegation
        );
        expect(await c.asStakeDelegation()).to.be.instanceOf(
          wasm.StakeDelegation
        );
      });
      it('.fromBytes()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const stakeRegistration = await wasm.StakeRegistration.new(
          stakeCredential
        );
        const cBytes = await wasm.Certificate.newStakeRegistration(
          stakeRegistration
        ).then((x) => x.toBytes());
        const c = await wasm.Certificate.fromBytes(cBytes);
        expect(c.hasValue()).to.be.true;
      });
      it('.newStakeRegistration()', async () => {
        const stakeCredential = await wasm.Credential.fromKeyhash(
          await (await (await stakePrivateKey).toPublic()).hash()
        );
        const c = await wasm.Certificate.newStakeRegistration(
          await wasm.StakeRegistration.new(stakeCredential)
        );
        expect(c.hasValue()).to.be.true;
      });
      it('.newStakeDeregistration()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const stakeRegistration = await wasm.StakeRegistration.new(
          stakeCredential
        );
        const c = await wasm.Certificate.newStakeRegistration(
          stakeRegistration
        );
        expect(c.hasValue()).to.be.true;
      });
      it('.newStakeDelegation()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const poolKeyHash = await key.toPublic().then((x) => x.hash());
        const stakeDelegation = await wasm.StakeDelegation.new(
          stakeCredential,
          poolKeyHash
        );
        const c = await wasm.Certificate.newStakeDelegation(stakeDelegation);
        expect(c.hasValue()).to.be.true;
      });
    });
    describe('Certificates', () => {
      it('.new()', async () => {
        const c = await wasm.Certificates.new();
        expect(c.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const c = await wasm.Certificates.new();
        expect((await c.len()).toString()).to.be.equal('0');
      });
      it('.get()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const stakeRegistration = await wasm.StakeRegistration.new(
          stakeCredential
        );
        const certificate = await wasm.Certificate.newStakeRegistration(
          stakeRegistration
        );
        const c = await wasm.Certificates.new();
        await c.add(certificate);
        expect(await c.get(0)).to.be.instanceOf(wasm.Certificate);
      });
      it('.add()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const stakeRegistration = await wasm.StakeRegistration.new(
          stakeCredential
        );
        const certificate = await wasm.Certificate.newStakeRegistration(
          stakeRegistration
        );
        const c = await wasm.Certificates.new();
        await c.add(certificate);
        expect(await c.len().then((x) => x.toString())).to.be.equal('1');
      });
      it('.fromBytes()', async () => {
        const cBytes = await wasm.Certificates.new().then((x) => x.toBytes());
        const c = await wasm.Certificates.fromBytes(cBytes);
        expect(c.hasValue()).to.be.true;
      });

      it('.toBytes()', async () => {
        const c = await wasm.Certificates.new();
        expect(await c.toBytes()).to.be.instanceOf(Uint8Array);
      });
    });
    describe('RewardAddress', () => {
      it('.new()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const r = await wasm.RewardAddress.new(0, stakeCredential);
        expect(r.hasValue()).to.be.true;
      });
      it('.paymentCred()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const r = await wasm.RewardAddress.new(0, stakeCredential);
        expect(await r.paymentCred()).to.be.instanceOf(wasm.Credential);
      });
      it('.toAddress()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const r = await wasm.RewardAddress.new(0, stakeCredential);
        expect(await r.toAddress()).to.be.instanceOf(wasm.Address);
      });
      it('.fromAddress()', async () => {
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array(57).fill(0))
        );
        const c = await wasm.RewardAddress.fromAddress(address);
        expect(c).to.be.undefined;
      });
    });
    describe('RewardAddresses', () => {
      it('.new()', async () => {
        const r = await wasm.RewardAddresses.new();
        expect(r.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const r = await wasm.RewardAddresses.new();
        expect((await r.len()).toString()).to.be.equal('0');
      });
      it('.get()', async () => {
        const r = await wasm.RewardAddresses.new();
        const address = await wasm.Address.fromBech32(BECH32_ADDRESS);
        const rewardAddress = await wasm.RewardAddress.fromAddress(address);
        await r.add(rewardAddress!);
        expect(await r.get(0)).to.be.instanceOf(wasm.RewardAddress);
      });
      it('.add()', async () => {
        const r = await wasm.RewardAddresses.new();
        const address = await wasm.Address.fromBech32(BECH32_ADDRESS);
        const rewardAddress = await wasm.RewardAddress.fromAddress(address);
        await r.add(rewardAddress!);
        expect(await r.len().then((x) => x.toString())).to.be.equal('1');
      });
      it('.toBytes()', async () => {
        const r = await wasm.RewardAddresses.new();
        expect(await r.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const cBytes = await wasm.RewardAddresses.new().then((x) =>
          x.toBytes()
        );
        const c = await wasm.RewardAddresses.fromBytes(cBytes);
        expect(c.hasValue()).to.be.true;
      });
    });
    describe('Withdrawals', () => {
      it('.new()', async () => {
        const w = await wasm.Withdrawals.new();
        expect(w.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const w = await wasm.Withdrawals.new();
        expect(await w.len().then((x) => x.toString())).to.be.equal('0');
      });
      it('.get()', async () => {
        const r = await wasm.Withdrawals.new();
        const address = await wasm.Address.fromBech32(BECH32_ADDRESS);
        const rewardAddress = await wasm.RewardAddress.fromAddress(address);
        await r.insert(rewardAddress!, await wasm.BigNum.fromStr('0'));
        expect(await r.get(rewardAddress!)).to.be.instanceOf(wasm.BigNum);
      });
      it('.insert()', async () => {
        const r = await wasm.Withdrawals.new();
        const address = await wasm.Address.fromBech32(BECH32_ADDRESS);
        const rewardAddress = await wasm.RewardAddress.fromAddress(address);
        await r.insert(rewardAddress!, await wasm.BigNum.fromStr('0'));
        expect(await r.len().then((x) => x.toString())).to.be.equal('1');
      });
      it('.keys()', async () => {
        const r = await wasm.Withdrawals.new();
        expect(await r.keys()).to.be.instanceOf(wasm.RewardAddresses);
      });
      it('.toBytes()', async () => {
        const r = await wasm.Withdrawals.new();
        expect(await r.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const rBytes = await (await wasm.Withdrawals.new()).toBytes();
        const r = await wasm.Withdrawals.fromBytes(rBytes);
        expect(r.hasValue()).to.be.true;
      });
    });
    describe('TransactionInputs', () => {
      it('.len()', async () => {
        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        const inputs = await t.inputs();
        expect(await inputs.len().then((x) => x.toString())).to.be.equal('0');
      });
      it('.get()', async () => {
        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const hash = await wasm.Ed25519KeyHash.fromBytes(
          Buffer.from(ED25519KEYHASH, 'hex')
        );
        const tBytes = await wasm.TransactionInput.new(
          await wasm.TransactionHash.fromBytes(
            Buffer.from(Array.from(Array(32).keys()).fill(0))
          ),
          0
        ).then((x) => x.toBytes());
        const input = await wasm.TransactionInput.fromBytes(tBytes);
        const amount = await wasm.Value.new(await wasm.BigNum.fromStr('0'));
        tBuilder.addKeyInput(hash, input, amount);
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        const inputs = await t.inputs();
        expect(await inputs.get(0)).to.be.instanceOf(wasm.TransactionInput);
      });
    });
    describe('TransactionOutputs', () => {
      it('.len()', async () => {
        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        const outputs = await t.outputs();
        expect(await outputs.len().then((x) => x.toString())).to.be.equal('0');
      });
      it('.get()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        const value = await wasm.Value.new(bigNum);
        const tOutput = await wasm.TransactionOutput.new(address, value);
        tBuilder.addOutput(tOutput);
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        const outputs = await t.outputs();
        expect(await outputs.get(0)).to.be.instanceOf(wasm.TransactionOutput);
      });
    });
    describe('TransactionBody', () => {
      it('.inputs()', async () => {
        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        expect(await t.inputs()).to.be.instanceOf(wasm.TransactionInputs);
      });
      it('.outputs()', async () => {
        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        expect(await t.outputs()).to.be.instanceOf(wasm.TransactionOutputs);
      });
      it('.fee()', async () => {
        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        expect(await t.fee()).to.be.instanceOf(wasm.BigNum);
      });
      it('.ttl()', async () => {
        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        expect(await t.ttl()).to.be.undefined;
      });
      it('.certs()', async () => {
        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const key = await stakePrivateKey;
        const stakeCredential = await key
            .toPublic()
            .then((x) => x.hash())
            .then((x) => wasm.Credential.fromKeyhash(x));
        const stakeRegistration = await wasm.StakeRegistration.new(
            stakeCredential
        );
        const cert = await wasm.Certificate.newStakeRegistration(
            stakeRegistration
        );
        const certs = await wasm.Certificates.new();
        await certs.add(cert);

        await tBuilder.setCerts(certs);
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        expect(await t.certs()).to.be.instanceOf(wasm.Certificates);
      });
      it('.withdrawals()', async () => {
        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const key = await stakePrivateKey;
        const stakeCredential = await key
            .toPublic()
            .then((x) => x.hash())
            .then((x) => wasm.Credential.fromKeyhash(x));
        const rewardAddress = await wasm.RewardAddress.new(0, stakeCredential);
        const withdrawals = await wasm.Withdrawals.new();
        await withdrawals.insert(rewardAddress, await wasm.BigNum.fromStr('0'));
        await tBuilder.setWithdrawals(withdrawals);
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        expect(await t.withdrawals()).to.be.instanceOf(wasm.Withdrawals);
      });
      it('.toBytes()', async () => {
        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        expect(await t.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const tBuilder = await makeTransactionBuilder();
        await tBuilder.setFee(await wasm.BigNum.fromStr('0'));
        const tBodyBytes = await tBuilder.build().then((x) => x.toBytes());
        const t = await wasm.TransactionBody.fromBytes(tBodyBytes);
        expect(t.hasValue()).to.be.true;
      });
    });
    describe('TransactionBuilder', () => {
      it('.new()', async () => {
        const t = await makeTransactionBuilder();
        expect(t.hasValue()).to.be.true;
      });
      it('.addKeyInput()', async () => {
        const transactionHash = await wasm.TransactionHash.fromBytes(
          Buffer.from(Array.from(Array(32).keys()).fill(0))
        );
        const txBytes = await wasm.TransactionInput.new(
          transactionHash,
          0
        ).then((x) => x.toBytes());
        const t = await makeTransactionBuilder();
        await t.setFee(await wasm.BigNum.fromStr('0'));
        const hash = await wasm.Ed25519KeyHash.fromBytes(
          Buffer.from(ED25519KEYHASH, 'hex')
        );
        const input = await wasm.TransactionInput.fromBytes(txBytes);
        const amount = await wasm.Value.new(await wasm.BigNum.fromStr('0'));
        await t.addKeyInput(hash, input, amount);
        expect(await t.getImplicitInput()).to.be.instanceOf(wasm.Value);
      });
      it('.addBootstrapInput()', async () => {
        const transactionHash = await wasm.TransactionHash.fromBytes(
          Buffer.from(Array.from(Array(32).keys()).fill(0))
        );
        const tBytes = await wasm.TransactionInput.new(transactionHash, 0).then(
          (x) => x.toBytes()
        );
        const t = await makeTransactionBuilder();
        await t.setFee(await wasm.BigNum.fromStr('0'));
        const hash = await wasm.Ed25519KeyHash.fromBytes(
          Buffer.from(ED25519KEYHASH, 'hex')
        );
        const input = await wasm.TransactionInput.fromBytes(tBytes);
        const amount = await wasm.Value.new(await wasm.BigNum.fromStr('0'));
        await t.addKeyInput(hash, input, amount);
        expect(await t.getImplicitInput()).to.be.instanceOf(wasm.Value);
      });
      it('.addInput()', async () => {
        const transactionHash = await wasm.TransactionHash.fromBytes(
          Buffer.from(Array.from(Array(32).keys()).fill(0))
        );
        const tBytes = await wasm.TransactionInput.new(transactionHash, 0).then(
          (x) => x.toBytes()
        );
        const t = await makeTransactionBuilder();
        await t.setFee(await wasm.BigNum.fromStr('0'));
        const hash = await wasm.Ed25519KeyHash.fromBytes(
          Buffer.from(ED25519KEYHASH, 'hex')
        );
        const input = await wasm.TransactionInput.fromBytes(tBytes);
        const amount = await wasm.Value.new(await wasm.BigNum.fromStr('0'));
        await t.addKeyInput(hash, input, amount);
        expect(await t.getImplicitInput()).to.be.instanceOf(wasm.Value);
      });
      it('.feeForInput()', async () => {
        const transactionHash = await wasm.TransactionHash.fromBytes(
          Buffer.from(Array.from(Array(32).keys()).fill(0))
        );
        const tBytes = await wasm.TransactionInput.new(transactionHash, 0).then(
          (x) => x.toBytes()
        );
        const bigNum = await wasm.BigNum.fromStr('0');

        const t = await makeTransactionBuilder();
        const input = await wasm.TransactionInput.fromBytes(tBytes);
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        const value = await wasm.Value.new(bigNum);
        expect(await t.feeForInput(address, input, value)).to.be.instanceOf(
          wasm.BigNum
        );
      });
      it('.addOutput()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const t = await makeTransactionBuilder();
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        const value = await wasm.Value.new(bigNum);
        const toBytes = await wasm.TransactionOutput.new(address, value).then(
          (x) => x.toBytes()
        );
        await t.addOutput(await wasm.TransactionOutput.fromBytes(toBytes));
        expect(await t.getExplicitOutput()).to.be.instanceOf(wasm.Value);
      });
      it('.feeForOutput()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const t = await makeTransactionBuilder();
        const address = await wasm.Address.fromBytes(
          Buffer.from(Array.from(Array(57).keys()).fill(0))
        );
        const value = await wasm.Value.new(bigNum);
        const tOutput = await wasm.TransactionOutput.new(address, value);
        expect(await t.feeForOutput(tOutput)).to.be.instanceOf(wasm.BigNum);
      });
      it('.setFee()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const t = await makeTransactionBuilder();
        await t.setFee(bigNum);
        expect(t.hasValue()).to.be.true;
      });
      it('.setTtl()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const t = await makeTransactionBuilder();
        await t.setFee(bigNum);
        await t.setTtl(0);
        expect(t.hasValue()).to.be.true;
      });
      it('.setValidityStartInterval()', async () => {
        const t = await makeTransactionBuilder();
        await t.setValidityStartInterval(0);
        expect(t.hasValue()).to.be.true;
      });
      it('.setCerts()', async () => {
        const t = await makeTransactionBuilder();
        const cBytes = await wasm.Certificates.new().then((x) => x.toBytes());
        const certificates = await wasm.Certificates.fromBytes(cBytes);
        await t.setCerts(certificates);
        expect(t.hasValue()).to.be.true;
      });
      it('.setWithdrawals()', async () => {
        const t = await makeTransactionBuilder();
        const rBytes = await wasm.Withdrawals.new().then((x) => x.toBytes());
        const withdrawals = await wasm.Withdrawals.fromBytes(rBytes);
        await t.setWithdrawals(withdrawals);
        expect(t.hasValue()).to.be.true;
      });
      it('.setAuxiliaryData()', async () => {
        const t = await makeTransactionBuilder();
        const generalTransactionMetadata =
            await wasm.GeneralTransactionMetadata.new();
        const auxdata = await wasm.AuxiliaryData.new();
        await auxdata.setMetadata(generalTransactionMetadata);
        const aBytes = await auxdata.toBytes();
        const auxiliaryData = await wasm.AuxiliaryData.fromBytes(aBytes);
        await t.setAuxiliaryData(auxiliaryData);
        expect(t.hasValue()).to.be.true;
      });

      it('.getExplicitInput()', async () => {
        const t = await makeTransactionBuilder();
        expect(await t.getExplicitInput()).to.be.instanceOf(wasm.Value);
      });
      it('.getImplicitInput()', async () => {
        const t = await makeTransactionBuilder();
        expect(await t.getImplicitInput()).to.be.instanceOf(wasm.Value);
      });
      it('.getExplicitOutput()', async () => {
        const t = await makeTransactionBuilder();
        expect(await t.getExplicitOutput()).to.be.instanceOf(wasm.Value);
      });
      it('.getDeposit()', async () => {
        const t = await makeTransactionBuilder();
        expect(await t.getDeposit()).to.be.instanceOf(wasm.BigNum);
      });
      it('.getFeeIfSet()', async () => {
        const t = await makeTransactionBuilder();
        await t.setFee(await wasm.BigNum.fromStr('0'));
        expect(await t.getFeeIfSet()).to.be.instanceOf(wasm.BigNum);
      });
      it('.addChangeIfNeeded()', async () => {
        const t = await makeTransactionBuilder();
        expect(
          await t.addChangeIfNeeded(
            await wasm.Address.fromBytes(Buffer.from(Array(57).fill(0)))
          )
        ).to.be.false;
      });
      it('.build()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const t = await makeTransactionBuilder();
        await t.setFee(bigNum);
        expect(await t.build()).to.be.instanceOf(wasm.TransactionBody);
      });
      it('.minFee()', async () => {
        const t = await makeTransactionBuilder();
        expect(await t.minFee()).to.be.instanceOf(wasm.BigNum);
      });
    });

    describe('BaseAddress', () => {
      it('.new()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const b = await wasm.BaseAddress.new(
          0,
          stakeCredential,
          stakeCredential
        );
        expect(b.hasValue()).to.be.true;
      });
      it('.paymentCred()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const b = await wasm.BaseAddress.new(
          0,
          stakeCredential,
          stakeCredential
        );
        expect(await b.paymentCred()).to.be.instanceOf(wasm.Credential);
      });
      it('.stakeCred()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const b = await wasm.BaseAddress.new(
          0,
          stakeCredential,
          stakeCredential
        );
        expect(await b.stakeCred()).to.be.instanceOf(wasm.Credential);
      });
      it('.toAddress()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const b = await wasm.BaseAddress.new(
          0,
          stakeCredential,
          stakeCredential
        );
        expect(await b.toAddress()).to.be.instanceOf(wasm.Address);
      });
      it('.fromAddress()', async () => {
        const address = await wasm.Address.fromBech32(BECH32_ADDRESS_V2);
        const b = await wasm.BaseAddress.fromAddress(address);
        expect(b!.hasValue()).to.be.true;
      });
    });
    describe('PointerAddress', () => {
      it('.new()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const pointer = await wasm.Pointer.new(0, 0, 0);
        const b = await wasm.PointerAddress.new(0, stakeCredential, pointer);
        expect(b.hasValue()).to.be.true;
      });
      it('.paymentCred()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const pointer = await wasm.Pointer.new(0, 0, 0);
        const b = await wasm.PointerAddress.new(0, stakeCredential, pointer);
        expect(await b.paymentCred()).to.be.instanceOf(wasm.Credential);
      });
      it('.stakePointer()', async () => {
        const stakeCredential = await wasm.Credential.fromKeyhash(
          await (await (await stakePrivateKey).toPublic()).hash()
        );
        const b = await wasm.PointerAddress.new(
          0,
          stakeCredential,
          await wasm.Pointer.new(0, 0, 0)
        );
        expect(await b.stakePointer()).to.be.instanceOf(wasm.Pointer);
      });
      it('.toAddress()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const pointer = await wasm.Pointer.new(0, 0, 0);
        const b = await wasm.PointerAddress.new(0, stakeCredential, pointer);
        expect(await b.toAddress()).to.be.instanceOf(wasm.Address);
      });
      it('.fromAddress()', async () => {
        const address = await wasm.Address.fromBech32(BECH32_ADDRESS_V2);
        const b = await wasm.PointerAddress.fromAddress(address);
        expect(b).to.be.undefined;
      });
    });
    describe('EnterpriseAddress', () => {
      it('.new()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const b = await wasm.EnterpriseAddress.new(0, stakeCredential);
        expect(b.hasValue()).to.be.true;
      });
      it('.paymentCred()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const b = await wasm.EnterpriseAddress.new(0, stakeCredential);
        expect(await b.paymentCred()).to.be.instanceOf(wasm.Credential);
      });
      it('.toAddress()', async () => {
        const key = await stakePrivateKey;
        const stakeCredential = await key
          .toPublic()
          .then((x) => x.hash())
          .then((x) => wasm.Credential.fromKeyhash(x));
        const b = await wasm.EnterpriseAddress.new(0, stakeCredential);
        expect(await b.toAddress()).to.be.instanceOf(wasm.Address);
      });
      it('.fromAddress()', async () => {
        const address = await wasm.Address.fromBech32(BECH32_ADDRESS_V2);
        const b = await wasm.EnterpriseAddress.fromAddress(address);
        expect(b).to.be.undefined;
      });
    });
    describe('Pointer', () => {
      it('.new()', async () => {
        const p = await wasm.Pointer.new(0, 0, 0);
        expect(p.hasValue()).to.be.true;
      });
      it('.slot()', async () => {
        const p = await wasm.Pointer.new(0, 0, 0);
        expect(await p.slot()).to.be.equal(0);
      });
      it('.txIndex()', async () => {
        const p = await wasm.Pointer.new(0, 0, 0);
        expect(await p.txIndex()).to.be.equal(0);
      });
      it('.new()', async () => {
        const p = await wasm.Pointer.new(0, 0, 0);
        expect(await p.certIndex()).to.be.equal(0);
      });
    });
    describe('Vkey', () => {
      it('.new()', async () => {
        const pBytes = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        ).then((x) => x.asBytes());
        const publicKey = await wasm.PublicKey.fromBytes(pBytes);
        const v = await wasm.Vkey.new(publicKey);
        expect(v.hasValue()).to.be.true;
      });
    });
    describe('Ed25519Signature', () => {
      it('.fromBytes()', async () => {
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        expect(e.hasValue()).to.be.true;
      });
      it('.toBytes()', async () => {
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        expect(await e.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.toHex()', async () => {
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        expect(await e.toHex()).to.be.equal(
          '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        );
      });
    });
    describe('Vkeywitness', () => {
      it('.fromBytes()', async () => {
        const pkey = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        const vKey = await wasm.Vkey.new(pkey);
        const vkeyBytes = await wasm.Vkeywitness.new(vKey, e).then((x) =>
          x.toBytes()
        );
        const v = await wasm.Vkeywitness.fromBytes(vkeyBytes);
        expect(v.hasValue()).to.be.true;
      });
      it('.new()', async () => {
        const pkey = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        const vKey = await wasm.Vkey.new(pkey);
        const vkeyBytes = await wasm.Vkeywitness.new(vKey, e).then((x) =>
          x.toBytes()
        );
        const v = await wasm.Vkeywitness.fromBytes(vkeyBytes);
        expect(v.hasValue()).to.be.true;
      });
      it('.toBytes()', async () => {
        const pkey = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        const vKey = await wasm.Vkey.new(pkey);
        const vkeyBytes = await wasm.Vkeywitness.new(vKey, e).then((x) =>
          x.toBytes()
        );
        const v = await wasm.Vkeywitness.fromBytes(vkeyBytes);
        expect(await v.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.signature()', async () => {
        const pkey = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        const vKey = await wasm.Vkey.new(pkey);
        const vkeyBytes = await wasm.Vkeywitness.new(vKey, e).then((x) =>
          x.toBytes()
        );
        const v = await wasm.Vkeywitness.fromBytes(vkeyBytes);
        expect(await v.signature()).to.be.instanceOf(wasm.Ed25519Signature);
      });
    });
    describe('Vkeywitnesses', () => {
      it('.new()', async () => {
        const v = await wasm.Vkeywitnesses.new();
        expect(v.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        expect(
          await wasm.Vkeywitnesses.new()
            .then((x) => x.len())
            .then((y) => y.toString())
        ).to.be.equal('0');
      });
      it('.add()', async () => {
        const pkey = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        const vkey = await wasm.Vkey.new(pkey);
        const v = await wasm.Vkeywitnesses.new();
        v.add(await wasm.Vkeywitness.new(vkey, e));
        expect(await v.len().then((x) => x.toString())).to.be.equal('1');
      });
    });
    describe('BootstrapWitness', () => {
      it('.new()', async () => {
        const pkey = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        const vkey = await wasm.Vkey.new(pkey);
        const b = await wasm.BootstrapWitness.new(
          vkey,
          e,
          Buffer.from([]),
          Buffer.from([])
        );
        expect(b.hasValue()).to.be.true;
      });
      it('.toBytes()', async () => {
        const pkey = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        const vkey = await wasm.Vkey.new(pkey);
        const b = await wasm.BootstrapWitness.new(
          vkey,
          e,
          Buffer.from([]),
          Buffer.from([])
        );
        expect(await b.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const pkey = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        const vkey = await wasm.Vkey.new(pkey);
        const bootstrapWitness = await wasm.BootstrapWitness.new(
          vkey,
          e,
          Buffer.from([]),
          Buffer.from([])
        );
        const bootstrapWitnessBytes = await bootstrapWitness.toBytes();
        const b = await wasm.BootstrapWitness.fromBytes(bootstrapWitnessBytes);
        expect(b.hasValue()).to.be.true;
      });
    });
    describe('BootstrapWitnesses', () => {
      it('.new()', async () => {
        const b = await wasm.BootstrapWitnesses.new();
        expect(b.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        expect(
          await wasm.BootstrapWitnesses.new()
            .then((x) => x.len())
            .then((y) => y.toString())
        ).to.be.equal('0');
      });
      it('.add()', async () => {
        const pkey = await wasm.PublicKey.fromBytes(
          Buffer.from(PUBLIC_KEY, 'hex')
        );
        const e = await wasm.Ed25519Signature.fromBytes(
          Buffer.from(Array(64).fill(0))
        );
        const vkey = await wasm.Vkey.new(pkey);
        const b = await wasm.BootstrapWitnesses.new();
        b.add(
          await wasm.BootstrapWitness.new(
            vkey,
            e,
            Buffer.from([]),
            Buffer.from([])
          )
        );
        expect(await b.len().then((x) => x.toString())).to.be.equal('1');
      });
    });
    describe('TransactionWitnessSet', () => {
      it('.new()', async () => {
        const t = await wasm.TransactionWitnessSet.new();
        expect(t.hasValue()).to.be.true;
      });
      it('.setBootstraps()', async () => {
        const t = await wasm.TransactionWitnessSet.new();
        t.setBootstraps(await wasm.BootstrapWitnesses.new());
        expect(t.hasValue()).to.be.true;
      });
      it('.setVkeys()', async () => {
        const t = await wasm.TransactionWitnessSet.new();
        t.setVkeys(await wasm.Vkeywitnesses.new());
        expect(t.hasValue()).to.be.true;
      });
      it('.vkeys()', async () => {
        const t = await wasm.TransactionWitnessSet.new();
        const v = await wasm.Vkeywitnesses.new();
        const vkey = await wasm.Vkey.new(
            await wasm.PublicKey.fromBytes(Buffer.from(PUBLIC_KEY, 'hex'))
            );
        const e = await wasm.Ed25519Signature.fromBytes(
            Buffer.from(Array(64).fill(0))
            );
        v.add(await wasm.Vkeywitness.new(vkey, e));
        await t.setVkeys(v);
        expect(await t.vkeys()).to.be.instanceOf(wasm.Vkeywitnesses);
      });
    });
    describe('Transaction', () => {
      it('.new()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(bigNum);
        const tBody = await tBuilder.build();
        const transactionWitnessSet = await wasm.TransactionWitnessSet.new();
        const t = await wasm.Transaction.new(tBody, transactionWitnessSet, undefined);
        expect(t.hasValue()).to.be.true;
      });
      it('.fromBytes()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(bigNum);
        const tBody = await tBuilder.build();
        const transactionWitnessSet = await wasm.TransactionWitnessSet.new();
        const tBytes = await wasm.Transaction.new(
          tBody,
          transactionWitnessSet,
            undefined
        ).then((x) => x.toBytes());
        const t = await wasm.Transaction.fromBytes(tBytes);
        expect(t.hasValue()).to.be.true;
      });
      it('.body()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(bigNum);
        const tBody = await tBuilder.build();
        const transactionWitnessSet = await wasm.TransactionWitnessSet.new();
        const t = await wasm.Transaction.new(tBody, transactionWitnessSet, undefined);
        expect(await t.body()).to.be.instanceOf(wasm.TransactionBody);
      });
      it('.witnessSet()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(bigNum);
        const tBody = await tBuilder.build();
        const transactionWitnessSet = await wasm.TransactionWitnessSet.new();
        const t = await wasm.Transaction.new(tBody, transactionWitnessSet, undefined);
        expect(await t.witnessSet()).to.be.instanceOf(
          wasm.TransactionWitnessSet
        );
      });
      it('.isValid()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(bigNum);
        const tBody = await tBuilder.build();
        const transactionWitnessSet = await wasm.TransactionWitnessSet.new();
        const t = await wasm.Transaction.new(tBody, transactionWitnessSet, undefined);
        expect(await t.isValid()).to.be.true;
      });
      it('.isValid()', async () => {
        const bigNum = await wasm.BigNum.fromStr('0');

        const tBuilder = await makeTransactionBuilder();
        tBuilder.setFee(bigNum);
        const tBody = await tBuilder.build();
        const transactionWitnessSet = await wasm.TransactionWitnessSet.new();
        const t = await wasm.Transaction.new(tBody, transactionWitnessSet, undefined);
        expect(await t.toBytes()).to.be.instanceOf(Uint8Array);
      });
    });
    describe('NetworkInfo', () => {
      it('.new()', async () => {
        const n = await wasm.NetworkInfo.new(0, 0);
        expect(n.hasValue()).to.be.true;
      });
      it('.testnet()', async () => {
        const n = await wasm.NetworkInfo.testnetPreprod();
        expect(n.hasValue()).to.be.true;
      });
      it('.new()', async () => {
        const n = await wasm.NetworkInfo.mainnet();
        expect(n.hasValue()).to.be.true;
      });
      it('.networkId()', async () => {
        const n = await wasm.NetworkInfo.testnetPreprod();
        expect(await n.networkId()).to.be.equal(0);
      });
      it('.protocolMagic()', async () => {
        const n = await wasm.NetworkInfo.testnetPreprod();
        expect(await n.protocolMagic()).to.be.equal(1);
      });
    });
    describe('MetadataList', () => {
      it('.new()', async () => {
        const m = await wasm.MetadataList.new();
        expect(m.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const m = await wasm.MetadataList.new();
        expect((await m.len()).toString()).to.be.equal('0');
      });
      it('.get()', async () => {
        const m = await wasm.MetadataList.new();
        const TransactionMetadatum = await wasm.TransactionMetadatum.fromBytes(
          Buffer.from([0])
        );
        await m.add(TransactionMetadatum);
        expect(await m.get(0)).to.be.instanceOf(wasm.TransactionMetadatum);
      });
      it('.add()', async () => {
        const m = await wasm.MetadataList.new();
        const TransactionMetadatum = await wasm.TransactionMetadatum.fromBytes(
          Buffer.from([0])
        );
        await m.add(TransactionMetadatum);
        expect((await m.len()).toString()).to.be.equal('1');
      });
      it('.toBytes()', async () => {
        const m = await wasm.MetadataList.new();
        expect(await m.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const mBytes = await (await wasm.MetadataList.new()).toBytes();
        const m = await wasm.MetadataList.fromBytes(mBytes);
        expect(m.hasValue()).to.be.true;
      });
    });
    describe('NativeScript', () => {
      it('.toBytes()', async () => {
        const n = await wasm.NativeScript.fromBytes(
          Buffer.from(NATIVE_SCRIPT, 'hex')
        );
        expect(await n.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.hash()', async () => {
        const n = await wasm.NativeScript.fromBytes(
          Buffer.from(NATIVE_SCRIPT, 'hex')
        );
        expect(await n.hash()).to.be.instanceOf(wasm.ScriptHash);
      });
      it('.kind()', async () => {
        const n = await wasm.NativeScript.fromBytes(
          Buffer.from(NATIVE_SCRIPT, 'hex')
        );
        expect(await n.kind()).to.be.equal(0);
      });
      it('.fromBytes()', async () => {
        const n = await wasm.NativeScript.fromBytes(
          Buffer.from(NATIVE_SCRIPT, 'hex')
        );
        expect(n.hasValue()).to.be.true;
      });
    });
    describe('NativeScripts', () => {
      it('.new()', async () => {
        const n = await wasm.NativeScripts.new();
        expect(n.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const n = await wasm.NativeScripts.new();
        expect((await n.len()).toString()).to.be.equal('0');
      });
      it('.get()', async () => {
        const n = await wasm.NativeScripts.new();
        const nativeScript = await wasm.NativeScript.fromBytes(
          Buffer.from(NATIVE_SCRIPT, 'hex')
        );
        await n.add(nativeScript);
        expect(await n.get(0)).to.be.instanceOf(wasm.NativeScript);
      });
      it('.add()', async () => {
        const n = await wasm.NativeScripts.new();
        const nativeScript = await wasm.NativeScript.fromBytes(
          Buffer.from(NATIVE_SCRIPT, 'hex')
        );
        await n.add(nativeScript);
        expect(await n.len().then((x) => x.toString())).to.be.equal('1');
      });
    });
    describe('PlutusScript', () => {
      it('.toBytes()', async () => {
        const pBytes = await wasm.PlutusScript.new(Buffer.from([])).then((x) =>
          x.toBytes()
        );
        const p = await wasm.PlutusScript.fromBytes(pBytes);
        expect(await p.toBytes()).to.be.instanceOf(Uint8Array);
      });
      it('.bytes()', async () => {
        const p = await wasm.PlutusScript.new(Buffer.from([]));
        expect(await p.bytes()).to.be.instanceOf(Uint8Array);
      });
      it('.fromBytes()', async () => {
        const p = await wasm.PlutusScript.new(Buffer.from([]));
        expect(p.hasValue()).to.be.true;
      });
      it('.new()', async () => {
        const p = await wasm.PlutusScript.new(Buffer.from([]));
        expect(p.hasValue()).to.be.true;
      });
    });
    describe('PlutusScripts', () => {
      it('.new()', async () => {
        const p = await wasm.PlutusScripts.new();
        expect(p.hasValue()).to.be.true;
      });
      it('.len()', async () => {
        const p = await wasm.PlutusScripts.new();
        expect((await p.len()).toString()).to.be.equal('0');
      });
      it('.get()', async () => {
        const p = await wasm.PlutusScripts.new();
        const plutusScript = await wasm.PlutusScript.new(Buffer.from([]));
        await p.add(plutusScript);
        expect(await p.get(0)).to.be.instanceOf(wasm.PlutusScript);
      });
      it('.add()', async () => {
        const p = await wasm.PlutusScripts.new();
        const plutusScript = await wasm.PlutusScript.new(Buffer.from([]));
        await p.add(plutusScript);
        expect(await p.len().then((x) => x.toString())).to.be.equal('1');
      });
    });
    describe('DataCost', () => {
      it('.coinsPerByte()', async () => {
        const bigNum = await wasm.BigNum.fromStr('123');
        const d = await wasm.DataCost.newCoinsPerByte(bigNum);
        const coinsPerByte = await d.coinsPerByte();
        expect(coinsPerByte.toString()).to.be.equal(bigNum.toString());
      });
    });
    describe('TxBuilderConstants', () => {
      it('.plutusDefaultCostModels', async () => {
        const costmdls =
          await wasm.TxBuilderConstants.plutusDefaultCostModels();
        expect(costmdls).to.be.instanceOf(wasm.Costmdls);
      });
      it('.plutusAlonzoCostModels', async () => {
        const costmdls = await wasm.TxBuilderConstants.plutusAlonzoCostModels();
        expect(costmdls).to.be.instanceOf(wasm.Costmdls);
      });
      it('.plutusVasilCostModels', async () => {
        const costmdls = await wasm.TxBuilderConstants.plutusVasilCostModels();
        expect(costmdls).to.be.instanceOf(wasm.Costmdls);
      });
    });
  });
};
