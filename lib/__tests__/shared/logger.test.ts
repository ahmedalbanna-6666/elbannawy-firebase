import { logger } from '../../shared/observability/logger';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log info messages', () => {
    logger.info('test message', { module: 'test', metadata: { key: 'value' } });
    expect(console.log).toHaveBeenCalled();
    const call = (console.log as jest.Mock).mock.calls[0][0];
    const parsed = JSON.parse(call);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('test message');
    expect(parsed.module).toBe('test');
  });

  it('should log error messages with error details', () => {
    const error = new Error('something broke');
    logger.error('operation failed', error, { module: 'test' });
    expect(console.error).toHaveBeenCalled();
    const call = (console.error as jest.Mock).mock.calls[0][0];
    const parsed = JSON.parse(call);
    expect(parsed.level).toBe('error');
    expect(parsed.error).toBe('something broke');
  });

  it('should include timestamp in all entries', () => {
    logger.info('timed');
    const call = (console.log as jest.Mock).mock.calls[0][0];
    const parsed = JSON.parse(call);
    expect(parsed.timestamp).toBeDefined();
    expect(() => new Date(parsed.timestamp)).not.toThrow();
  });
});
