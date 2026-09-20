'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Upload } from 'lucide-react';

export default function AdminProductModal() {
  const { editingProduct, setEditingProduct, triggerProductsRefresh } = useAuth();

  const [form, setForm] = useState<any>({
    id: '',
    name_en: '',
    name_pa: '',
    description_en: '',
    description_pa: '',
    category: 'ghee',
    price_primary: 500,
    price_half: 250,
    primary_unit_label_en: '1 kg',
    primary_unit_label_pa: '1 ਕਿੱਲੋ',
    half_unit_label_en: '500 g',
    half_unit_label_pa: '500 ਗ੍ਰਾਮ',
    has_half: true,
    image: '/images/products/ghee-cow.jpg',
    is_bestseller: false,
    inStock: true,
    discontinued: false,
  });

  const [isNew, setIsNew] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    if (editingProduct) {
      if (editingProduct._isNew) {
        setIsNew(true);
        setForm({
          id: '',
          name_en: '',
          name_pa: '',
          description_en: '',
          description_pa: '',
          category: 'ghee',
          price_primary: 500,
          price_half: 250,
          primary_unit_label_en: '1 kg',
          primary_unit_label_pa: '1 ਕਿੱਲੋ',
          half_unit_label_en: '500 g',
          half_unit_label_pa: '500 ਗ੍ਰਾਮ',
          has_half: true,
          image: '/images/products/ghee-cow.jpg',
          is_bestseller: false,
          inStock: true,
          discontinued: false,
        });
      } else {
        setIsNew(false);
        setForm({ ...editingProduct });
      }
      setError('');
    }
  }, [editingProduct]);

  if (!editingProduct) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/products/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev: any) => ({ ...prev, image: data.url }));
      } else {
        setError(data.error || 'Upload failed. You can paste a direct image URL instead.');
      }
    } catch {
      setError('Error uploading image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name_en || !form.description_en || !form.category || form.price_primary === undefined || !form.image) {
      setError('Name, Description, Category, Price, and Image are required.');
      return;
    }

    setLoading(true);
    try {
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${form.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        triggerProductsRefresh();
        setEditingProduct(null);
      } else {
        setError(data.error || 'Failed to save product.');
      }
    } catch {
      setError('Network error while saving product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-dairy-border pb-3">
          <h3 className="font-serif text-xl font-bold text-dairy-green-dark">
            {isNew ? 'Add New Product' : `Edit: ${form.name_en}`}
          </h3>
          <button
            type="button"
            onClick={() => setEditingProduct(null)}
            className="p-1.5 rounded-lg text-dairy-muted hover:text-dairy-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            {error}
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">Name (English) *</label>
              <input
                type="text"
                required
                value={form.name_en || ''}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Name (Punjabi)</label>
              <input
                type="text"
                value={form.name_pa || ''}
                onChange={(e) => setForm({ ...form, name_pa: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs bg-white"
              >
                <option value="ghee">Ghee</option>
                <option value="paneer">Paneer</option>
                <option value="khoya">Khoya</option>
                <option value="milk">Milk</option>
                <option value="dahi">Dahi (Curd)</option>
                <option value="lassi">Lassi</option>
                <option value="house-special">House Special</option>
                <option value="white-butter">White Butter</option>
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1">Primary Price (₹) *</label>
              <input
                type="number"
                required
                min={0}
                value={form.price_primary ?? ''}
                onChange={(e) => setForm({ ...form, price_primary: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs font-bold text-dairy-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">Primary Unit Label</label>
              <input
                type="text"
                value={form.primary_unit_label_en || ''}
                onChange={(e) => setForm({ ...form, primary_unit_label_en: e.target.value })}
                placeholder="e.g. 1 kg"
                className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Half Price (₹, optional)</label>
              <input
                type="number"
                min={0}
                value={form.price_half ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price_half: e.target.value ? Number(e.target.value) : undefined,
                    has_half: Boolean(e.target.value),
                  })
                }
                placeholder="e.g. 250"
                className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold block">Photo (URL or Device Upload) *</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={form.image || ''}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="/images/products/ghee-cow.jpg or https://..."
                className="flex-1 px-3 py-2 rounded-xl border border-dairy-border text-xs"
              />
              <label className="px-3 py-2 rounded-xl bg-dairy-cream hover:bg-dairy-green hover:text-white cursor-pointer font-bold flex items-center gap-1 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading…' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">Description (English) *</label>
            <textarea
              rows={2}
              required
              value={form.description_en || ''}
              onChange={(e) => setForm({ ...form, description_en: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
            />
          </div>

          <div>
            <label className="font-bold block mb-1">Description (ਪੰਜਾਬੀ, Optional)</label>
            <textarea
              rows={2}
              value={form.description_pa || ''}
              onChange={(e) => setForm({ ...form, description_pa: e.target.value })}
              placeholder="ਪੰਜਾਬੀ ਵਿੱਚ ਵੇਰਵਾ..."
              className="w-full px-3 py-2 rounded-xl border border-dairy-border text-xs"
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={form.inStock ?? true}
                onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                className="w-4 h-4 text-dairy-green rounded"
              />
              <span>In Stock</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dairy-border">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="px-4 py-2 rounded-xl border border-dairy-border hover:bg-gray-100 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-extrabold shadow-md"
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
