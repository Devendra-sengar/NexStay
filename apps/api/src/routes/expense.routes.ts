import { Router } from 'express';
import { getExpenses, getExpenseBreakdown, createExpense, updateExpense, deleteExpense } from '../controllers/expense.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);
router.use(requireRoles('SUPER_ADMIN', 'PG_OWNER', 'PROPERTY_MANAGER'));

router.get('/', getExpenses);
router.get('/breakdown', getExpenseBreakdown);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
