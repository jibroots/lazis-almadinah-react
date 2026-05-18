export interface Penerimaan {
  id: number;
  namaMuzakki: string;
  nomorHp: string | null;
  kategoriId: string;
  jumlahUang: number | null;
  jumlahBeras: number | null;
  metodePembayaran: string | null;
  tanggalPenerimaan: string;
  keterangan: string | null;
  amilPenerima: string | null;
}

export interface Penyaluran {
  id: number;
  namaMustahik: string;
  kategoriId: string;
  jumlahUang: number;
  jumlahBeras: number;
  tanggalPenyaluran: string;
  keterangan: string | null;
  amilPenyalur: string | null;
}

export interface UserAmil {
  id: number;
  nama: string;
  username: string;
  password?: string;
  role: 'Admin' | 'Bendahara' | 'Amil';
  status: 'Aktif' | 'Nonaktif';
}

export interface KategoriZIS {
  id: string;
  nama: string;
  deskripsi: string;
}
