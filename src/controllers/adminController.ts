import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const promoteToAnalyst = async (req: Request, res: Response) => {
  try {
    const { email, secretKey } = req.body;

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ error: 'Chave secreta inválida' });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ANALYST' }
    });

    return res.json({ message: 'Usuário promovido a Analista', user });
  } catch (error) {
    console.error('Error in promoteToAnalyst:', error);
    return res.status(500).json({ error: 'Erro ao promover usuário' });
  }
};

export const promoteToAdmin = async (req: Request, res: Response) => {
  try {
    const { email, secretKey } = req.body;

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ error: 'Chave secreta inválida' });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });

    return res.json({ message: 'Usuário promovido a Admin', user });
  } catch (error) {
    console.error('Error in promoteToAdmin:', error);
    return res.status(500).json({ error: 'Erro ao promover usuário' });
  }
};
