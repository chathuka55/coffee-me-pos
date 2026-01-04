import { Router } from 'express';
import {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
} from '../controllers/tables.controller';

const router = Router();

router.get('/', getAllTables);
router.get('/:id', getTableById);
router.post('/', createTable);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);
router.patch('/:id/status', updateTableStatus);

export default router;
