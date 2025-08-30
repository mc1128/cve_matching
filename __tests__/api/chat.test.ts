import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/ai/chat';

// Mock dependencies
jest.mock('../../lib/bedrock-service');
jest.mock('../../lib/database');

describe('/api/ai/chat', () => {
  it('should handle POST request successfully', async () => {
    const { BedrockService } = require('../../lib/bedrock-service');
    const { executeQuery } = require('../../lib/database');

    BedrockService.invokeModel = jest.fn().mockResolvedValue({
      completion: 'AI response',
      stop_reason: 'stop_sequence'
    });

    executeQuery.mockResolvedValue([]);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        prompt: 'Test prompt',
        userId: 'test-user'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.response).toBe('AI response');
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 400 for missing prompt', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {}
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });
});
