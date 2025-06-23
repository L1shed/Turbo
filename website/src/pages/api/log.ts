import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const logs = await prisma.log.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }
  } else if (req.method === 'POST') {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const log = await prisma.log.create({
        data: {
          message,
        },
      });

      return res.status(201).json(log);
    } catch (error) {
      console.error('Error creating log:', error);
      return res.status(500).json({ error: 'Failed to create log' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
