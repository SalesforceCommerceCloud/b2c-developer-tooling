import {runCommand} from '@oclif/test';
import {expect} from 'chai';

describe('_test', () => {
  it('runs the smoke test command without errors', async () => {
    const {error} = await runCommand('_test');
    expect(error).to.be.undefined;
  });
});
