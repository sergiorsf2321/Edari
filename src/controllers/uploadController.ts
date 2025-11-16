import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateUploadUrl } from '../services/s3';

export const getUploadUrl = async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'Nome e tipo do arquivo são obrigatórios' });
    }

    const { uploadUrl, fileUrl } = await generateUploadUrl(fileName, fileType);

    return res.json({ uploadUrl, fileUrl });
  } catch (error) {
    console.error('Error in getUploadUrl:', error);
    return res.status(500).json({ error: 'Erro ao gerar URL de upload' });
  }
};
