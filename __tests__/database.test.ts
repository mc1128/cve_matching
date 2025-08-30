import { executeQuery, getConnection } from '../lib/database';

// Mock mysql2
jest.mock('mysql2/promise', () => ({
  createConnection: jest.fn()
}));

describe('Database', () => {
  const mockConnection = {
    execute: jest.fn(),
    end: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('mysql2/promise').createConnection.mockResolvedValue(mockConnection);
  });

  it('should execute query successfully', async () => {
    const mockResult = [{ id: 1, name: 'test' }];
    mockConnection.execute.mockResolvedValue([mockResult]);

    const result = await executeQuery('SELECT * FROM test');

    expect(result).toEqual(mockResult);
    expect(mockConnection.execute).toHaveBeenCalledWith('SELECT * FROM test', []);
    expect(mockConnection.end).toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    mockConnection.execute.mockRejectedValue(new Error('Database error'));

    await expect(executeQuery('SELECT * FROM test')).rejects.toThrow('Database error');
    expect(mockConnection.end).toHaveBeenCalled();
  });
});
