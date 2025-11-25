import {runCommand} from '@oclif/test';
import {expect} from 'chai';

describe('hello', () => {
  it('runs hello', async () => {
    const {stdout} = await runCommand('hello bob --from jane');
    expect(stdout).to.contain('hello bob from jane!');
  });
});
