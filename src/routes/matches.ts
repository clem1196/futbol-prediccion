import { Router } from 'express';
import { getPartidos } from '../controllers/matchController';

const router = Router();

router.get('/', getPartidos);

export default router;