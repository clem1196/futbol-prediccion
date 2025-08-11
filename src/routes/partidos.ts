import { Router } from 'express';
import { getPartidos } from '../controllers/partidoController';

const router = Router();

router.get('/', getPartidos);

export default router;