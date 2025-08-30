import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient } from './aws-config';

export interface BedrockRequest {
  prompt: string;
  modelId?: string;
  maxTokens?: number;
}

export interface BedrockResponse {
  completion: string;
  stop_reason: string;
}

export class BedrockService {
  private static readonly DEFAULT_MODEL_ID = 'anthropic.claude-v2';

  static async invokeModel({ 
    prompt, 
    modelId = this.DEFAULT_MODEL_ID, 
    maxTokens = 200 
  }: BedrockRequest): Promise<BedrockResponse> {
    const input = {
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: maxTokens,
        temperature: 0.7,
        top_p: 1,
      }),
    };

    const command = new InvokeModelCommand(input);
    const response = await bedrockClient.send(command);
    
    const responseBody = JSON.parse(Buffer.from(response.body).toString());
    return responseBody;
  }
}
