import { Router } from 'express';

import exampleRoutes from './example/example.routes';

const router = Router({ mergeParams: true });

router.use('/example', exampleRoutes);

export default router;
