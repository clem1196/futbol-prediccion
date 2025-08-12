import { Request, Router, Response } from 'express';
import { Prediccion } from '../entities/Prediccion';
import { Usuario } from '../entities/Usuario';
import AppDataSource from '../data-source';

const router = Router();

// GET /api/clasificacion
router.get('/', async (req:Request, res:Response) => {
  const prediccionRepo = AppDataSource.getRepository(Prediccion);
  const usuarioRepo = AppDataSource.getRepository(Usuario);

  try {
    // Obtener puntos totales por usuario
    const resultados = await prediccionRepo
      .createQueryBuilder('prediccion')
      .select('prediccion.usuarioId', 'usuarioId')
      .addSelect('SUM(prediccion.puntos)', 'totalPuntos')
      .groupBy('prediccion.usuarioId')
      .orderBy('totalPuntos', 'DESC')
      .getRawMany();

    // Obtener nombres de usuarios
    const usuarios = await usuarioRepo.find();
    const usuariosMap = new Map(usuarios.map(u => [u.id, u.nombre]));

    const clasificacion = resultados.map(r => ({
      usuarioId: r.usuarioId,
      nombre: usuariosMap.get(r.usuarioId) || 'Usuario Desconocido',
      puntos: parseInt(r.totalPuntos),
    }));

    return res.json(clasificacion);
// oxlint-disable-next-line no-unused-vars
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener clasificación' });
  }
});

export default router;