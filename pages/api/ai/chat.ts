import type { NextApiRequest, NextApiResponse } from 'next';
import { BedrockService } from '../../../lib/bedrock-service';
import { executeQuery } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt, userId } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Bedrock AI 호출
    const aiResponse = await BedrockService.invokeModel({ prompt });

    // 대화 기록을 RDS에 저장
    await executeQuery(
      'INSERT INTO chat_history (user_id, prompt, response, created_at) VALUES (?, ?, ?, NOW())',
      [userId || 'anonymous', prompt, aiResponse.completion]
    );

    res.status(200).json({
      response: aiResponse.completion,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Chat API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
