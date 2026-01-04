import { Router } from 'express';
import {
  getAllOrders,
  getPendingOrders,
  getOrderById,
  createOrder,
  checkoutOrder,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/orders.controller';

const router = Router();

router.get('/', getAllOrders);
router.get('/pending', getPendingOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.post('/:id/checkout', checkoutOrder);
router.patch('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

export default router;
