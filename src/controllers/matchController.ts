import { Request, Response } from 'express';
import AppDataSource from '../data-source';
import { Match } from '../entities/Match';

export const getPartidos = async (req: Request, res: Response) => {
  const partidoRepo = AppDataSource.getRepository(Match);
  try {
    const partidos = await partidoRepo.find({
      relations: ['equipoLocal', 'equipoVisitante'],
    });
    return res.json(partidos);
// oxlint-disable-next-line no-unused-vars
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener partidos' });
  }
};