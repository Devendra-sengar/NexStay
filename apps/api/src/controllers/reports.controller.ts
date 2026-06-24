import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { Bed } from '../models/Bed.model';
import { Room } from '../models/Room.model';
import { RentRecord } from '../models/RentRecord.model';
import { Expense } from '../models/Expense.model';
import { Property } from '../models/Property.model';

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function csvRow(vals: (string|number)[]): string {
  return vals.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
}

function sendCsv(res: Response, filename: string, rows: string[]): void {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(rows.join('\n'));
}

// ── Helper: build month list ──────────────────────────────────────────────────
function lastNMonths(n: number): string[] {
  const list = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    list.push(ym(d));
  }
  return list;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OCCUPANCY REPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const getOccupancyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId } = req.query as Record<string, string>;
    const filter: any = { tenantId };
    if (propertyId) filter._id = new mongoose.Types.ObjectId(propertyId);

    const properties = await Property.find(filter).lean();
    const result = [];
    let totalBeds = 0, occupiedTotal = 0;

    for (const prop of properties) {
      const rooms = await Room.find({ propertyId: prop._id }).lean();
      let propBeds = 0, propOccupied = 0;
      const roomRows = [];
      for (const room of rooms) {
        const beds = await Bed.find({ roomId: room._id }).lean();
        const occ = beds.filter((b: any) => b.status === 'OCCUPIED').length;
        propBeds += beds.length; propOccupied += occ;
        roomRows.push({ roomNumber: room.roomNumber, type: room.roomType, total: beds.length, occupied: occ, vacant: beds.length - occ });
      }
      result.push({ propertyName: (prop as any).name, total: propBeds, occupied: propOccupied, vacant: propBeds - propOccupied, rooms: roomRows });
      totalBeds += propBeds; occupiedTotal += propOccupied;
    }

    res.json({
      success: true,
      data: { totalBeds, occupied: occupiedTotal, vacant: totalBeds - occupiedTotal, occupancyPct: totalBeds ? Math.round((occupiedTotal / totalBeds) * 100) : 0, byProperty: result },
    });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const exportOccupancyCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId } = req.query as Record<string, string>;
    const filter: any = { tenantId };
    if (propertyId) filter._id = new mongoose.Types.ObjectId(propertyId);
    const properties = await Property.find(filter).lean();
    const rows = [csvRow(['Property','Room No','Type','Total Beds','Occupied','Vacant'])];
    for (const prop of properties) {
      const rooms = await Room.find({ propertyId: prop._id }).lean();
      for (const room of rooms) {
        const beds = await Bed.find({ roomId: room._id }).lean();
        const occ = beds.filter((b: any) => b.status === 'OCCUPIED').length;
        rows.push(csvRow([(prop as any).name, room.roomNumber, room.roomType, beds.length, occ, beds.length - occ]));
      }
    }
    sendCsv(res, 'occupancy-report.csv', rows);
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE REPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const getRevenueReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId } = req.query as Record<string, string>;
    const propFilter: any = { tenantId };
    if (propertyId) propFilter.propertyId = new mongoose.Types.ObjectId(propertyId);

    const monthList = lastNMonths(12);
    const table = [];
    for (const m of monthList) {
      const recs = await RentRecord.find({ tenantId, ...(propertyId && { propertyId: new mongoose.Types.ObjectId(propertyId) }), month: m, isFee: { $ne: true } }).lean();
      const due = recs.reduce((s, r) => s + r.amount + (r.fine || 0), 0);
      const collected = recs.reduce((s, r) => s + (r.paidAmount || 0), 0);
      const pending = Math.max(0, due - collected);

      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const expenses = await Expense.find({ tenantId, ...(propertyId && { propertyId: new mongoose.Types.ObjectId(propertyId) }), date: { $gte: start, $lte: end } }).lean();
      const expTotal = expenses.reduce((s, e) => s + e.amount, 0);

      const [y, mo2] = m.split('-');
      table.push({ month: m, label: `${months[Number(mo2) - 1]} ${y}`, due, collected, pending, expenses: expTotal, net: collected - expTotal });
    }

    res.json({ success: true, data: { table, last6: table.slice(-6), last12: table } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const exportRevenueCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId } = req.query as Record<string, string>;
    const monthList = lastNMonths(12);
    const rows = [csvRow(['Month','Rent Due','Collected','Pending','Expenses','Net Surplus'])];
    for (const m of monthList) {
      const recs = await RentRecord.find({ tenantId, ...(propertyId && { propertyId: new mongoose.Types.ObjectId(propertyId) }), month: m }).lean();
      const due = recs.reduce((s, r) => s + r.amount, 0);
      const collected = recs.reduce((s, r) => s + (r.paidAmount || 0), 0);
      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const expTotal = (await Expense.find({ tenantId, date: { $gte: start, $lte: end } }).lean()).reduce((s, e) => s + e.amount, 0);
      rows.push(csvRow([m, due, collected, Math.max(0, due - collected), expTotal, collected - expTotal]));
    }
    sendCsv(res, 'revenue-report.csv', rows);
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTION REPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const getCollectionReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, month = ym(new Date()) } = req.query as Record<string, string>;
    const filter: any = { tenantId, month, isFee: { $ne: true } };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);

    const records = await RentRecord.find(filter)
      .populate('hostelStudentId', 'name phone')
      .populate('propertyId', 'name')
      .populate('roomId', 'roomNumber')
      .lean();

    const paid = records.filter(r => r.status === 'PAID').length;
    const partial = records.filter(r => r.status === 'PARTIAL').length;
    const unpaid = records.filter(r => r.status === 'UNPAID').length;

    res.json({ success: true, data: { records, summary: { paid, partial, unpaid, total: records.length } } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const exportCollectionCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, month = ym(new Date()) } = req.query as Record<string, string>;
    const filter: any = { tenantId, month };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);
    const records = await RentRecord.find(filter).populate('hostelStudentId', 'name phone').populate('roomId', 'roomNumber').lean();
    const rows = [csvRow(['Student','Phone','Room','Month','Due','Paid','Balance','Status'])];
    for (const r of records) {
      const s = r.hostelStudentId as any;
      rows.push(csvRow([s?.name || '—', s?.phone || '—', (r.roomId as any)?.roomNumber || '—', r.month, r.amount + (r.fine || 0), r.paidAmount || 0, Math.max(0, r.amount + (r.fine || 0) - (r.paidAmount || 0)), r.status]));
    }
    sendCsv(res, `collection-${month}.csv`, rows);
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSE REPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const getExpenseReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, month = ym(new Date()) } = req.query as Record<string, string>;
    const buildFilter = (m: string) => {
      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const f: any = { tenantId, date: { $gte: start, $lte: end } };
      if (propertyId) f.propertyId = new mongoose.Types.ObjectId(propertyId);
      return f;
    };

    const [yr, mo] = month.split('-').map(Number);
    const prevM = new Date(yr, mo - 2, 1);
    const prevMonth = ym(prevM);

    const [curr, prev] = await Promise.all([
      Expense.find(buildFilter(month)).lean(),
      Expense.find(buildFilter(prevMonth)).lean(),
    ]);

    const byCategory: Record<string, number> = {};
    curr.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    const total = curr.reduce((s, e) => s + e.amount, 0);

    const prevByCategory: Record<string, number> = {};
    prev.forEach(e => { prevByCategory[e.category] = (prevByCategory[e.category] || 0) + e.amount; });

    const table = Object.entries(byCategory).map(([cat, amt]) => ({
      category: cat, amount: amt, pct: total ? Math.round((amt / total) * 100) : 0,
      prevAmount: prevByCategory[cat] || 0,
      trend: amt > (prevByCategory[cat] || 0) ? 'UP' : amt < (prevByCategory[cat] || 0) ? 'DOWN' : 'FLAT',
    }));

    res.json({ success: true, data: { month, prevMonth, byCategory, prevByCategory, total, table } });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const exportExpenseCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, month = ym(new Date()) } = req.query as Record<string, string>;
    const [yr, mo] = month.split('-').map(Number);
    const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
    const filter: any = { tenantId, date: { $gte: start, $lte: end } };
    if (propertyId) filter.propertyId = new mongoose.Types.ObjectId(propertyId);
    const exps = await Expense.find(filter).populate('propertyId', 'name').lean();
    const rows = [csvRow(['Category','Amount','Date','Property','Description'])];
    exps.forEach(e => rows.push(csvRow([e.category, e.amount, new Date(e.date).toLocaleDateString('en-IN'), (e.propertyId as any)?.name || '—', e.description || '—'])));
    sendCsv(res, `expenses-${month}.csv`, rows);
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROFIT REPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const getProfitReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId } = req.query as Record<string, string>;
    const monthList = lastNMonths(12);
    const table = [];

    for (const m of monthList) {
      const recs = await RentRecord.find({ tenantId, ...(propertyId && { propertyId: new mongoose.Types.ObjectId(propertyId) }), month: m }).lean();
      const revenue = recs.reduce((s, r) => s + (r.paidAmount || 0), 0);
      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const expenses = (await Expense.find({ tenantId, ...(propertyId && { propertyId: new mongoose.Types.ObjectId(propertyId) }), date: { $gte: start, $lte: end } }).lean()).reduce((s, e) => s + e.amount, 0);
      const net = revenue - expenses;
      table.push({ month: m, label: `${months[mo - 1]} ${yr}`, revenue, expenses, net, status: net >= 0 ? 'PROFIT' : 'LOSS' });
    }

    res.json({ success: true, data: table });
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};

export const exportProfitCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.id;
    const { propertyId } = req.query as Record<string, string>;
    const monthList = lastNMonths(12);
    const rows = [csvRow(['Month','Revenue','Expenses','Net','Status'])];
    for (const m of monthList) {
      const recs = await RentRecord.find({ tenantId, ...(propertyId && { propertyId: new mongoose.Types.ObjectId(propertyId) }), month: m }).lean();
      const revenue = recs.reduce((s, r) => s + (r.paidAmount || 0), 0);
      const [yr, mo] = m.split('-').map(Number);
      const start = new Date(yr, mo - 1, 1); const end = new Date(yr, mo, 0, 23, 59, 59);
      const expenses = (await Expense.find({ tenantId, date: { $gte: start, $lte: end } }).lean()).reduce((s, e) => s + e.amount, 0);
      rows.push(csvRow([m, revenue, expenses, revenue - expenses, revenue >= expenses ? 'PROFIT' : 'LOSS']));
    }
    sendCsv(res, 'profit-report.csv', rows);
  } catch { res.status(500).json({ success: false, message: 'Server error' }); }
};
