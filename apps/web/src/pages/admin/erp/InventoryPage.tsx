import { useState } from 'react';
import { Package, Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInventory, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem, useAdminProperties } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const PRESETS = ['Beds','Mattresses','Fans','Tables','Chairs','Water Coolers','Almirahs','Buckets','Geysers','Inverters'];

function InventoryModal({ item, properties, onClose }: { item?: any; properties: any[]; onClose: () => void }) {
  const [form, setForm] = useState({
    propertyId: item?.propertyId?._id || item?.propertyId || properties[0]?._id || '',
    itemName: item?.itemName || '', totalCount: item?.totalCount ?? '', workingCount: item?.workingCount ?? '', damagedCount: item?.damagedCount ?? 0, notes: item?.notes || '',
  });
  const create = useCreateInventoryItem(); const update = useUpdateInventoryItem();
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    if (!form.propertyId || !form.itemName || form.totalCount === '') { toast.error('Property, name, total required'); return; }
    if (Number(form.damagedCount) > Number(form.totalCount)) { toast.error('Damaged cannot exceed total'); return; }
    try {
      if (item) { await update.mutateAsync({ id: item._id, ...form }); toast.success('Updated'); }
      else { await create.mutateAsync(form); toast.success('Item added'); }
      onClose();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between mb-4"><h3 className="font-bold">{item?'Edit':'Add'} Item</h3><button onClick={onClose}><X className="w-4 h-4"/></button></div>
        <div className="space-y-3">
          <div><label className="form-label">Property *</label>
            <select className="input-field" value={form.propertyId} onChange={set('propertyId')}>{properties.map((p:any)=><option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
          <div><label className="form-label">Item Name *</label>
            <input className="input-field" list="item-presets" value={form.itemName} onChange={set('itemName')} placeholder="Type or select…"/>
            <datalist id="item-presets">{PRESETS.map(p=><option key={p} value={p}/>)}</datalist></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="form-label">Total *</label><input type="number" className="input-field" value={form.totalCount} onChange={set('totalCount')} min={0}/></div>
            <div><label className="form-label">Working</label><input type="number" className="input-field" value={form.workingCount} onChange={set('workingCount')} min={0}/></div>
            <div><label className="form-label">Damaged</label><input type="number" className="input-field" value={form.damagedCount} onChange={set('damagedCount')} min={0}/></div>
          </div>
          <div><label className="form-label">Notes</label><input className="input-field" value={form.notes} onChange={set('notes')}/></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={submit} disabled={create.isPending||update.isPending}>{create.isPending||update.isPending?'Saving…':item?'Update':'Add Item'}</button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { data: propsData } = useAdminProperties();
  const properties = propsData?.data ?? [];
  const [propId, setPropId] = useState('');
  const [modal, setModal] = useState<{open:boolean;item?:any}>({open:false});
  const [delConfirm, setDelConfirm] = useState<any>(null);

  const { data, isLoading } = useInventory({ propertyId: propId||undefined });
  const deleteItem = useDeleteInventoryItem();
  const items = data?.data ?? [];
  const summary = data?.summary;

  const handleDelete = async () => {
    try { await deleteItem.mutateAsync(delConfirm._id); toast.success('Deleted'); setDelConfirm(null); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 className="text-2xl font-bold text-text-primary">Inventory</h1>
          <p className="text-sm text-text-secondary mt-0.5">Track items across your properties</p></div>
        <button className="btn-primary flex items-center gap-2" onClick={()=>setModal({open:true})}><Plus className="w-4 h-4"/>Add Item</button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[['Total Item Types', summary.totalTypes, 'text-primary'],['Total Units', summary.totalUnits, 'text-text-primary'],['Working Units', summary.workingUnits, 'text-emerald-600'],['Damaged Units', summary.damagedUnits, 'text-danger']].map(([label,val,color])=>(
            <div key={String(label)} className="card p-4"><p className="text-xs text-text-muted mb-1">{label}</p><p className={cn('text-2xl font-bold',String(color))}>{val}</p></div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-5">
        <select className="input-field w-48" value={propId} onChange={e=>setPropId(e.target.value)}>
          <option value="">All Properties</option>{properties.map((p:any)=><option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i=><div key={i} className="skeleton h-12 rounded-lg"/>)}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center"><Package className="w-10 h-10 text-text-muted mx-auto mb-3"/><p className="text-text-muted">No inventory items yet.</p></div>
        ) : (
          <table className="data-table">
            <thead><tr>{['Item Name','Total','Working','Damaged','Property','Status','Last Updated','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {items.map((item:any) => {
                const allDamaged = item.damagedCount > 0 && item.damagedCount >= item.totalCount;
                const partDamaged = item.damagedCount > 0 && item.damagedCount < item.totalCount;
                return (
                  <tr key={item._id} className={cn('transition-colors', allDamaged ? 'bg-red-50 hover:bg-red-100' : partDamaged ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-surface-input/40')}>
                    <td className="py-3 px-4 border-b border-surface-border font-medium text-sm">{item.itemName}</td>
                    <td className="py-3 px-4 border-b border-surface-border text-sm">{item.totalCount}</td>
                    <td className="py-3 px-4 border-b border-surface-border text-sm text-emerald-700 font-medium">{item.workingCount}</td>
                    <td className="py-3 px-4 border-b border-surface-border text-sm text-danger font-medium">{item.damagedCount}</td>
                    <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted">{(item.propertyId as any)?.name||'—'}</td>
                    <td className="py-3 px-4 border-b border-surface-border">
                      {allDamaged && <span className="badge badge-danger flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>Needs Attention</span>}
                      {partDamaged && <span className="badge badge-warning">Partial Damage</span>}
                      {!allDamaged && !partDamaged && <span className="badge badge-success">Good</span>}
                    </td>
                    <td className="py-3 px-4 border-b border-surface-border text-xs text-text-muted">{new Date(item.updatedAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 border-b border-surface-border">
                      <div className="flex gap-1">
                        <button onClick={()=>setModal({open:true,item})} className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg text-text-muted"><Edit2 className="w-3.5 h-3.5"/></button>
                        <button onClick={()=>setDelConfirm(item)} className="p-1.5 hover:bg-danger/10 hover:text-danger rounded-lg text-text-muted"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && <InventoryModal item={modal.item} properties={properties} onClose={()=>setModal({open:false})} />}
      {delConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="font-bold mb-2">Delete "{delConfirm.itemName}"?</p>
            <div className="flex gap-3 mt-4"><button className="btn-secondary flex-1" onClick={()=>setDelConfirm(null)}>Cancel</button><button className="btn-danger flex-1" onClick={handleDelete} disabled={deleteItem.isPending}>{deleteItem.isPending?'Deleting…':'Delete'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
