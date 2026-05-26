'use client';
import React, { useState } from 'react';
import PenyaluranTable from './PenyaluranTable';
import PenyaluranForm from './PenyaluranForm';
import PenyaluranDetailModal from './PenyaluranDetailModal';
import PenyaluranDeleteModal from './PenyaluranDeleteModal';
import { Penyaluran, KategoriZIS, UserAmil } from '@/types/lazis'; 

interface PenyaluranViewProps {
  penyaluranList: Penyaluran[];
  kategoriList: KategoriZIS[];
  currentUser: UserAmil | null;
  dataSaldo: any;
  onAdd: (newData: any) => void;
  onEdit: (id: number, updatedData: any) => void;
  onDelete: (id: number) => void;
  formatRupiah: (num: number) => string;
}

export default function PenyaluranView({
  penyaluranList,
  kategoriList,
  currentUser,
  onAdd,
  onEdit,
  onDelete,
  formatRupiah,
  dataSaldo
}: PenyaluranViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<Penyaluran | null>(null);

  // Fungsi untuk menerjemahkan ID Kategori menjadi Nama Kategori
  const getNamaKategori = (id: string) => {
    const kategori = kategoriList.find(k => String(k.id) === String(id));
    return kategori ? kategori.nama : id;
  };
  
  // Modals visibility states
  const [detailItem, setDetailItem] = useState<Penyaluran | null>(null);
  const [deletingItem, setDeletingItem] = useState<Penyaluran | null>(null);

  // Router aksi penambahan / edit
  const handleSaveForm = (payload: any, isEdit: boolean) => {
    if (isEdit && editingItem) {
      onEdit(editingItem.id, payload);
    } else {
      onAdd(payload);
    }
    setViewMode('list');
    setEditingItem(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingItem) return;
    onDelete(deletingItem.id);
    setDeletingItem(null);
  };

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="animate-fadeIn relative">
        <PenyaluranForm
          initialData={editingItem}
          kategoriList={kategoriList}
          dataSaldo={dataSaldo} 
          onCancel={() => {
            setViewMode('list');
            setEditingItem(null);
          }}
          onSave={handleSaveForm}
        />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn relative">
      <PenyaluranTable
        data={penyaluranList}
        currentUser={currentUser}
        formatRupiah={formatRupiah}
        getNamaKategori={getNamaKategori}
        onAddNew={() => setViewMode('add')}
        onEdit={(item) => {
          setEditingItem(item);
          setViewMode('edit');
        }}
        onDelete={(item) => setDeletingItem(item)}
        onViewDetail={(item) => setDetailItem(item)}
      />

      {/* Render Component Modal Eksternal */}
      <PenyaluranDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        formatRupiah={formatRupiah}
        getNamaKategori={getNamaKategori}
      />

      <PenyaluranDeleteModal
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}