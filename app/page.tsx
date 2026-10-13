"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Fuse from "fuse.js";
import { Search, Copy, Check, Info, ChevronDown, Filter, ChevronUp } from "lucide-react";
import dataKomoditasRaw from "./data/data_komoditas_lengkap.json";

interface Komoditas {
  kelompok: string;
  kategori: string;
  subkategori: string;
  komoditas: string;
  satuan: string;
  kode: string;
}

const dataKomoditas: Komoditas[] = dataKomoditasRaw;
const ITEMS_PER_PAGE = 30;

// Fungsi merapikan nama label
const formatLabel = (name: string) => {
  if (!name) return "";
  return name.replace(/^\d{2}\.\d{1,2}\.\d{1,2}\s*/, "").replace(/^\d{2,4}\.\s*/, "");
};

// ==========================================
// KOMPONEN CUSTOM DROPDOWN MODERN
// ==========================================
interface DropdownProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
}

const CustomDropdown = ({ options, value, onChange, placeholder, disabled }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Menutup dropdown jika klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border ${
          isOpen ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-gray-200"
        } py-2.5 pl-4 pr-3 rounded-xl text-sm font-medium shadow-sm transition-all text-left ${
          disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "text-gray-700 hover:border-emerald-300 cursor-pointer"
        }`}
      >
        <span className="truncate pr-2">
          {value === "Semua" ? placeholder : formatLabel(value)}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {options.map((opt, idx) => (
              <li
                key={idx}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  value === opt
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                }`}
              >
                {opt === "Semua" ? placeholder : formatLabel(opt)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
// ==========================================

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedKelompok, setSelectedKelompok] = useState("Semua");
  const [selectedKategori, setSelectedKategori] = useState("Semua");
  const [selectedSubkategori, setSelectedSubkategori] = useState("Semua");
  const [copiedKode, setCopiedKode] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [query, selectedKelompok, selectedKategori, selectedSubkategori]);

  useEffect(() => {
    setSelectedKategori("Semua");
    setSelectedSubkategori("Semua");
  }, [selectedKelompok]);

  useEffect(() => {
    setSelectedSubkategori("Semua");
  }, [selectedKategori]);

  const daftarKelompok = useMemo(() => {
    return ["Semua", ...Array.from(new Set(dataKomoditas.map(i => i.kelompok))).filter(Boolean)];
  }, []);

  const daftarKategori = useMemo(() => {
    let data = dataKomoditas;
    if (selectedKelompok !== "Semua") data = data.filter(i => i.kelompok === selectedKelompok);
    return ["Semua", ...Array.from(new Set(data.map(i => i.kategori))).filter(Boolean)];
  }, [selectedKelompok]);

  const daftarSubkategori = useMemo(() => {
    let data = dataKomoditas;
    if (selectedKelompok !== "Semua") data = data.filter(i => i.kelompok === selectedKelompok);
    if (selectedKategori !== "Semua") data = data.filter(i => i.kategori === selectedKategori);
    return ["Semua", ...Array.from(new Set(data.map(i => i.subkategori))).filter(Boolean)];
  }, [selectedKelompok, selectedKategori]);

  const dataTerfilter = useMemo(() => {
    return dataKomoditas.filter((item) => {
      const matchKelompok = selectedKelompok === "Semua" || item.kelompok === selectedKelompok;
      const matchKategori = selectedKategori === "Semua" || item.kategori === selectedKategori;
      const matchSubkategori = selectedSubkategori === "Semua" || item.subkategori === selectedSubkategori;
      return matchKelompok && matchKategori && matchSubkategori;
    });
  }, [selectedKelompok, selectedKategori, selectedSubkategori]);

  const fuse = useMemo(() => {
    return new Fuse(dataTerfilter, {
      keys: ["komoditas", "kode"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [dataTerfilter]);

  const baseData = useMemo(() => {
    if (!query.trim()) return dataTerfilter;
    return fuse.search(query).map((result) => result.item);
  }, [query, fuse, dataTerfilter]);

  const displayedData = baseData.slice(0, visibleCount);
  const hasMore = visibleCount < baseData.length;

  const handleLoadMore = () => setVisibleCount((prev) => prev + ITEMS_PER_PAGE);

  const copyToClipboard = (kode: string) => {
    navigator.clipboard.writeText(kode);
    setCopiedKode(kode);
    setTimeout(() => setCopiedKode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10">
              <Image src="/bps_logo.webp" alt="Logo BPS" fill className="object-contain" priority />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="font-extrabold text-gray-900 text-[13px] sm:text-base leading-tight tracking-tight">
                SPDT-NTP <span className="text-emerald-600">2026</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                BPS Kabupaten Garut
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* HERO SECTION & FILTERS */}
        <div className="relative mb-8 rounded-3xl border border-emerald-100/50 shadow-sm">
          {/* Latar Belakang & Efek Blur dipisah ke layer sendiri dengan overflow-hidden */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl"></div>
          </div>
          
          {/* Konten Utama diletakkan di layer atas TANPA overflow-hidden */}
          <div className="relative z-10 py-8 sm:py-10 px-4 sm:px-10 max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 text-center sm:text-left">
              Cari KBLI <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Komoditas</span>
            </h2>
            
            {/* Teks Pengantar Dikembalikan */}
            <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed max-w-xl text-center sm:text-left mx-auto sm:mx-0">
              Survei Penyempurnaan Diagram Timbang Nilai Tukar Petani. Ketik nama komoditas atau kode untuk menyalinnya secara instan.
            </p>
            
            {/* Input Pencarian */}
            <div className="relative group max-w-2xl mx-auto sm:mx-0 mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 sm:pl-14 pr-4 py-3 sm:py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 shadow-sm transition-all text-base sm:text-lg font-medium"
                placeholder="Cari beras, bawang, atau ketik kode..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* CUSTOM CASCADING DROPDOWN FILTERS */}
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-emerald-800 justify-center sm:justify-start">
              <Filter className="w-4 h-4" /> Filter Spesifik:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CustomDropdown
                options={daftarKelompok}
                value={selectedKelompok}
                onChange={setSelectedKelompok}
                placeholder="Semua Sektor / Kelompok"
              />
              <CustomDropdown
                options={daftarKategori}
                value={selectedKategori}
                onChange={setSelectedKategori}
                placeholder="Semua Kategori"
                disabled={daftarKategori.length <= 1}
              />
              <CustomDropdown
                options={daftarSubkategori}
                value={selectedSubkategori}
                onChange={setSelectedSubkategori}
                placeholder="Semua Subkategori"
                disabled={daftarSubkategori.length <= 1}
              />
            </div>
          </div>
        </div>

        {/* INFO HASIL PENCARIAN */}
        <div className="mb-4 text-sm font-medium text-gray-600 px-1">
          Ditemukan <span className="text-emerald-600 font-bold">{baseData.length.toLocaleString("id-ID")}</span> KBLI
        </div>

        {/* HASIL PENCARIAN (GRID) */}
        {displayedData.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-gray-300">
            <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700">Tidak ditemukan</h3>
            <p className="text-sm text-gray-500 mt-1">Coba sesuaikan filter dropdown atau kata kunci pencarian.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {displayedData.map((item, index) => (
                <div
                  key={`${item.kode}-${index}`}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 flex flex-col h-full group"
                >
                  <div className="mb-3">
                    <div className="text-[10px] sm:text-[11px] bg-emerald-800 inline-block p-1 rounded-md text-white-600 font-bold uppercase tracking-wider mb-1 line-clamp-1" title={item.kategori}>
                      {formatLabel(item.kelompok)}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-emerald-600 font-bold uppercase tracking-wider mb-1 line-clamp-1" title={item.kategori}>
                      {formatLabel(item.kategori)}
                    </div>
                    {item.subkategori && (
                      <div className="text-[11px] sm:text-xs text-gray-500 font-medium line-clamp-1" title={item.subkategori}>
                        {formatLabel(item.subkategori)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 mb-5">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-emerald-900 transition-colors">
                      {item.komoditas}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                      Satuan: {item.satuan || "-"}
                    </span>
                  </div>

                  <hr className="border-gray-100 mb-4" />

                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tighter">
                      {item.kode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(item.kode)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                        copiedKode === item.kode
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {copiedKode === item.kode ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 text-gray-700 hover:border-emerald-300 hover:text-emerald-700 rounded-full font-bold shadow-sm hover:shadow-md transition-all active:scale-95 text-sm sm:text-base"
                >
                  <ChevronDown className="w-5 h-5" />
                  Tampilkan Lebih Banyak
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="py-6 border-t border-gray-200 bg-white text-center mt-auto">
        <p className="text-xs sm:text-sm font-semibold text-gray-500">
          Copyright &copy; 2026 BPS Kabupaten Garut
        </p>
      </footer>
    </div>
  );
}