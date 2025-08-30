import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/database';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 채팅 통계 조회
    const chatStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_chats,
        COUNT(DISTINCT user_id) as unique_users,
        DATE(created_at) as date,
        COUNT(*) as daily_count
      FROM chat_history 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    const totalStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_chats,
        COUNT(DISTINCT user_id) as unique_users
      FROM chat_history
    `);

    res.status(200).json({
      dailyStats: chatStats,
      totalStats: totalStats[0] || { total_chats: 0, unique_users: 0 }
    });
  } catch (error) {
    console.error('Dashboard Stats API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
