// Mock AWS SDK completely
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('../lib/aws-config');

import { BedrockService } from '../lib/bedrock-service';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient } from '../lib/aws-config';

const mockBedrockClient = bedrockClient as jest.Mocked<typeof bedrockClient>;

describe('BedrockService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should invoke model with correct parameters', async () => {
    const mockResponse = {
      body: Buffer.from(JSON.stringify({
        completion: 'Test response',
        stop_reason: 'stop_sequence'
      }))
    };

    mockBedrockClient.send = jest.fn().mockResolvedValue(mockResponse);

    const response = await BedrockService.invokeModel({
      prompt: 'Test prompt',
      maxTokens: 100
    });

    expect(response.completion).toBe('Test response');
    expect(mockBedrockClient.send).toHaveBeenCalledTimes(1);
    expect(mockBedrockClient.send).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
  });

  it('should handle errors gracefully', async () => {
    mockBedrockClient.send = jest.fn().mockRejectedValue(new Error('AWS Error'));

    await expect(BedrockService.invokeModel({
      prompt: 'Test prompt'
    })).rejects.toThrow('AWS Error');
  });
});
