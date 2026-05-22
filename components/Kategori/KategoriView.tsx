'use client';
import React, { useState } from 'react';
import KategoriTable from './KategoriTable';
import KategoriForm from './KategoriForm';
import KategoriDetailModal from './KategoriDetailModal';
import KategoriDeleteModal from './KategoriDeleteModal';
import { KategoriZIS } from '@/types/lazis';

interface KategoriViewProps {
  kategoriList: KategoriZIS[];
  onAdd: (newData: any) => Promise<boolean>;
  onEdit: (id: number, updatedData: any) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export default function KategoriView({
  kategoriList,
  onAdd,
  onEdit,
  onDelete
}: KategoriViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<KategoriZIS | null>(null);

  // Popups visibility states
  const [detailItem, setDetailItem] = useState<KategoriZIS | null>(null);
  const [deletingItem, setDeletingItem] = useState<KategoriZIS | null>(null);

  const handleSaveForm = async (payload: any, isEdit: boolean) => {
    if (isEdit && editingItem) {
      await onEdit(Number(editingItem.id), payload);
    } else {
      await onAdd(payload);
    }
    setViewMode('list');
    setEditingItem(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    await onDelete(Number(deletingItem.id));
    setDeletingItem(null);
  };

  // RENDERING FORM ADD / EDIT PAGE
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="animate-fadeIn relative">
        <KategoriForm
          initialData={editingItem}
          onCancel={() => {
            setViewMode('list');
            setEditingItem(null);
          }}
          onSave={handleSaveForm}
        />
      </div>
    );
  }

  // RENDERING LIST PAGE (DEFAULT VIEW)
  return (
    <div className="animate-fadeIn relative">
      <KategoriTable
        data={kategoriList}
        onAddNew={() => setViewMode('add')}
        onEdit={(item) => {
          setEditingItem(item);
          setViewMode('edit');
        }}
        onDelete={(item) => setDeletingItem(item)}
        onViewDetail={(item) => setDetailItem(item)}
      />

      <KategoriDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />

      <KategoriDeleteModal
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}