import {BaseCommand} from '@salesforce/b2c-tooling-sdk/cli';

export default class Test extends BaseCommand<typeof Test> {
  static description = 'Test logging output';
  static hidden = true;

  async run(): Promise<void> {
    // Test this.log() which now uses pino
    this.log('Using this.log() - goes through pino');
    this.warn('Using this.warn() - goes through pino');

    // Test logger directly at different levels
    this.logger.trace('Trace level message');
    this.logger.debug('Debug level message');
    this.logger.info('Info level message');
    this.logger.error('Error level message');

    // Context (visible in debug mode)
    this.logger.info({operation: 'test', duration: 123}, 'Message with context');

    this.logger.debug(
      {
        file: 'cartridge.zip',
        bytes: 45_678,
        instance: 'dev01.sandbox.us01.dx.commercecloud.salesforce.com',
      },
      'Debug with multiple context fields',
    );

    // Test redaction
    this.logger.info(
      {
        username: 'testuser',
        password: 'secret123',
        client_secret: 'abc123xyz', // eslint-disable-line camelcase
        accessToken: 'eyJhbGciOiJIUzI1NiJ9.test',
      },
      'This should have redacted fields',
    );

    // Child logger
    const childLogger = this.logger.child({operation: 'upload'});
    childLogger.info('Message from child logger');
  }
}
