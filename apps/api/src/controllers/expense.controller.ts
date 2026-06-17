import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Expense } from '../models/Expense.model';
import { RentRecord } from '../models/RentRecord.model';

const EXPENSE_CATEGORIES = ['ELECTRICITY', 'WATER', 'STAFF_SALARY', 'MAINTENANCE', 'MISC'] as const;

// ─── List Expenses ────────────────────────────────────────────────────────────
export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, category, month, year, page = 1, limit = 30 } = req.query;
    const filter: any = {};

    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId as string);
    if (category) filter.category = category;

    if (month && year) {
      const m = Number(month) - 1;
      const y = Number(year);
      filter.date = { $gte: new Date(y, m, 1), $lte: new Date(y, m + 1, 0, 23, 59, 59) };
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('propertyId', 'name city')
        .lean(),
      Expense.countDocuments(filter),
    ]);

    res.json({ success: true, data: expenses, total });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Expense Breakdown (Pie Chart) ───────────────────────────────────────────
export const getExpenseBreakdown = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, month, year } = req.query;
    const now = new Date();
    const m = month ? Number(month) - 1 : now.getMonth();
    const y = year ? Number(year) : now.getFullYear();

    const matchFilter: any = {
      date: { $gte: new Date(y, m, 1), $lte: new Date(y, m + 1, 0, 23, 59, 59) },
    };
    if (propertyId) matchFilter.propertyId = new mongoose.Types.ObjectId(propertyId as string);

    const breakdown = await Expense.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const totalExpenses = breakdown.reduce((sum, b) => sum + b.total, 0);

    // Net collection
    const rentFilter: any = {
      paidAt: { $gte: new Date(y, m, 1), $lte: new Date(y, m + 1, 0, 23, 59, 59) },
    };
    const rentAgg = await RentRecord.aggregate([
      { $match: rentFilter },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]);
    const totalCollection = rentAgg[0]?.total || 0;

    const CATEGORY_COLORS: Record<string, string> = {
      ELECTRICITY: '#6C63FF',
      WATER: '#22D3EE',
      STAFF_SALARY: '#F97316',
      MAINTENANCE: '#F59E0B',
      MISC: '#10B981',
    };

    res.json({
      success: true,
      data: {
        breakdown: breakdown.map(b => ({
          category: b._id,
          total: b.total,
          count: b.count,
          percentage: totalExpenses > 0 ? Math.round((b.total / totalExpenses) * 100) : 0,
          color: CATEGORY_COLORS[b._id] || '#94A3B8',
        })),
        totalExpenses,
        totalCollection,
        netCollection: totalCollection - totalExpenses,
        month: new Date(y, m).toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Create Expense ───────────────────────────────────────────────────────────
export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { propertyId, category, amount, date, notes } = req.body;
    if (!propertyId || !category || !amount || !date) {
      res.status(400).json({ success: false, message: 'propertyId, category, amount and date are required' });
      return;
    }
    if (!EXPENSE_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, message: `Invalid category. Valid: ${EXPENSE_CATEGORIES.join(', ')}` });
      return;
    }
    const expense = await Expense.create({ propertyId, category, amount: Number(amount), date: new Date(date), notes });
    const populated = await expense.populate('propertyId', 'name city');
    res.status(201).json({ success: true, data: populated });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Update Expense ───────────────────────────────────────────────────────────
export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category, amount, date, notes } = req.body;
    const expense = await Expense.findByIdAndUpdate(
      id,
      { category, amount: Number(amount), date: date ? new Date(date) : undefined, notes },
      { new: true, runValidators: true }
    ).populate('propertyId', 'name city');
    if (!expense) { res.status(404).json({ success: false, message: 'Expense not found' }); return; }
    res.json({ success: true, data: expense });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── Delete Expense ───────────────────────────────────────────────────────────
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) { res.status(404).json({ success: false, message: 'Expense not found' }); return; }
    res.json({ success: true, message: 'Expense deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
