
import React, { useState, useRef } from 'react';
import { useApp } from '../../App';
import { Button, Input, Card, Badge, Modal } from '../ui/Shared';
import { Plus, Search, Edit2, Power, Star, Camera, Layers, List, Trash2, AlertCircle, CheckSquare, Square, X, Check } from 'lucide-react';
import { Product } from '../../types';
import { useTranslation, Trans } from 'react-i18next';

export const ProductManager = () => {
  const { t, i18n } = useTranslation();
  const { 
    products, 
    units, 
    categories, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    toggleProductStatus, 
    toggleProductPromo, 
    bulkProductAction,
    addUnit, 
    updateUnit, 
    deleteUnit,
    addCategory,
    updateCategory,
    deleteCategory
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'catalog' | 'units' | 'categories'>('catalog');
  const [search, setSearch] = useState('');
  
  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Product state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', category: '', unit: '', image: '', isPromo: false, price: undefined });
  const [error, setError] = useState<string | null>(null);

  // Confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'product' | 'unit' | 'category' | 'bulk_delete';
    id?: string;
    name?: string;
  } | null>(null);

  // Unit management state
  const [isUnitEditModalOpen, setIsUnitEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [newUnitName, setNewUnitName] = useState('');

  // Category management state
  const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // Bulk Actions
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    await bulkProductAction(selectedIds, { isActive });
    setSelectedIds([]);
  };

  const handleBulkPromoUpdate = async (isPromo: boolean) => {
    // Note: This only sets the flag. If items don't have prices, they might need individual attention later or a default.
    await bulkProductAction(selectedIds, { isPromo });
    setSelectedIds([]);
  };

  const handleBulkDeleteClick = () => {
    setDeleteConfirm({
      isOpen: true,
      type: 'bulk_delete',
      name: `${selectedIds.length} ${t('common.items')}`
    });
  };

  // Image Upload Logic
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setNewProduct({ 
      name: '', 
      category: categories[0] || '', 
      unit: units[0] || '', 
      image: '',
      isPromo: false,
      price: undefined
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({ ...product });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (newProduct.name && newProduct.category && newProduct.unit) {
      // Logic requirement: Promo items MUST have a price
      if (newProduct.isPromo && (!newProduct.price || newProduct.price <= 0)) {
        setError(t('products.price_required'));
        return;
      }

      const productToSave = {
        ...newProduct,
        price: newProduct.isPromo ? newProduct.price : undefined
      } as Product;

      if (editingProduct) {
        await updateProduct({ ...editingProduct, ...productToSave });
      } else {
        await addProduct({
          id: `p${Date.now()}`,
          isActive: true,
          image: newProduct.image || 'https://picsum.photos/300/200?random=' + Date.now(),
          ...productToSave
        });
      }
      setIsModalOpen(false);
      setError(null);
    }
  };

  // Delete Action Click Handlers
  const handleDeleteProductClick = (product: Product) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'product',
      id: product.id,
      name: product.name
    });
  };

  const handleDeleteUnitClick = (unit: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'unit',
      id: unit,
      name: unit
    });
  };

  const handleDeleteCategoryClick = (cat: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'category',
      id: cat,
      name: cat
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'product' && deleteConfirm.id) {
      await deleteProduct(deleteConfirm.id);
    } else if (deleteConfirm.type === 'unit' && deleteConfirm.id) {
      await deleteUnit(deleteConfirm.id);
    } else if (deleteConfirm.type === 'category' && deleteConfirm.id) {
      await deleteCategory(deleteConfirm.id);
    } else if (deleteConfirm.type === 'bulk_delete') {
      for (const id of selectedIds) {
        await deleteProduct(id);
      }
      setSelectedIds([]);
    }

    setDeleteConfirm(null);
  };

  // Unit actions
  const handleOpenUnitEditModal = (unit: string | null = null) => {
    setEditingUnit(unit);
    setNewUnitName(unit || '');
    setIsUnitEditModalOpen(true);
  };

  const handleSaveUnit = async () => {
    if (newUnitName.trim()) {
      if (editingUnit) {
        await updateUnit(editingUnit, newUnitName.trim());
      } else {
        await addUnit(newUnitName.trim());
      }
      setNewUnitName('');
      setIsUnitEditModalOpen(false);
    }
  };

  // Category actions
  const handleOpenCategoryEditModal = (cat: string | null = null) => {
    setEditingCategory(cat);
    setNewCategoryName(cat || '');
    setIsCategoryEditModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (newCategoryName.trim()) {
      if (editingCategory) {
        await updateCategory(editingCategory, newCategoryName.trim());
      } else {
        await addCategory(newCategoryName.trim());
      }
      setNewCategoryName('');
      setIsCategoryEditModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 relative min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t('nav.products')}</h2>
          <p className="text-slate-500 font-medium">{t('products.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
           {activeTab === 'catalog' && (
             <>
               <Button variant="outline" onClick={() => setActiveTab('categories')} className="flex-1 sm:flex-none">
                 <List className="h-4 w-4 mr-2" /> {t('products.categories_btn')}
               </Button>
               <Button variant="outline" onClick={() => setActiveTab('units')} className="flex-1 sm:flex-none">
                 <Layers className="h-4 w-4 mr-2" /> {t('products.units')}
               </Button>
             </>
           )}
           
           {activeTab === 'categories' ? (
              <Button onClick={() => handleOpenCategoryEditModal(null)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" /> {t('products.add_category')}
              </Button>
           ) : activeTab === 'units' ? (
              <Button onClick={() => handleOpenUnitEditModal(null)} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4 mr-2" /> {t('products.add_unit')}
              </Button>
           ) : (
              <Button onClick={handleOpenCreate} className="flex-1 sm:flex-none shadow-lg shadow-slate-200 bg-slate-900 text-white">
                <Plus className="h-4 w-4 mr-2" /> {t('products.add_product')}
              </Button>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => { setActiveTab('catalog'); setSelectedIds([]); }}
          className={`px-8 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'catalog' ? 'border-slate-900 text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          {t('products.catalog')}
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`px-8 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'categories' ? 'border-slate-900 text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          {t('products.categories_btn')}
        </button>
        <button 
          onClick={() => setActiveTab('units')}
          className={`px-8 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'units' ? 'border-slate-900 text-slate-900 bg-slate-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          {t('products.units')}
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={t('common.search')}
                className="pl-12 border-none shadow-none focus:ring-0 h-11 font-medium" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div className="flex items-center px-2">
              <button 
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
              >
                {selectedIds.length === filtered.length && filtered.length > 0 ? (
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
                {i18n.language === 'ka' ? 'ყველას მონიშვნა' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
            {filtered.map(product => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <Card 
                  key={product.id} 
                  className={`overflow-hidden hover:shadow-xl transition-all border-2 group relative ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200'}`}
                >
                  {/* Selection Checkbox */}
                  <button 
                    onClick={() => toggleSelection(product.id)}
                    className={`absolute top-3 left-3 z-20 p-1 rounded-lg transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/80 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-500 backdrop-blur-sm shadow-sm'}`}
                  >
                    {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                  </button>

                  <div className="h-52 bg-slate-100 relative overflow-hidden cursor-pointer" onClick={() => toggleSelection(product.id)}>
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {product.isPromo && (
                        <Badge variant="warning" className="shadow-md border-amber-200 backdrop-blur-sm bg-amber-100/90">
                          <Star className="h-3 w-3 mr-1.5 fill-amber-500 text-amber-500" /> {t('products.promo')}
                        </Badge>
                      )}
                      <Badge variant={product.isActive ? 'success' : 'destructive'} className="shadow-md backdrop-blur-sm">
                        {product.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </div>
                    {product.isPromo && product.price && (
                      <div className="absolute bottom-3 left-3">
                         <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-black shadow-lg text-lg">
                           ${product.price.toFixed(2)}
                         </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 leading-tight">{product.name}</h3>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-tight">{product.category} • {product.unit}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button variant="outline" size="sm" className="flex-1 font-bold h-10" onClick={() => handleOpenEdit(product)}>
                        <Edit2 className="h-4 w-4 mr-2" /> {t('common.edit')}
                      </Button>
                      <Button 
                        variant={product.isPromo ? 'primary' : 'outline'} 
                        size="sm" 
                        className={`font-bold h-10 ${product.isPromo ? 'bg-amber-500 hover:bg-amber-600 border-none' : 'text-amber-600 border-amber-200 hover:bg-amber-50'}`}
                        onClick={() => toggleProductPromo(product.id)}
                      >
                        <Star className={`h-4 w-4 ${product.isPromo ? 'fill-white' : ''}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleProductStatus(product.id)}
                        className={product.isActive ? 'text-slate-300 hover:text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteProductClick(product)}
                        className="text-slate-300 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Floating Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-2xl animate-in slide-in-from-bottom-8 fade-in duration-300">
              <div className="bg-slate-900 border border-white/10 shadow-2xl rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                   <div className="bg-emerald-500 text-white h-8 w-8 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                     {selectedIds.length}
                   </div>
                   <span className="text-sm font-bold text-white uppercase tracking-wider">{i18n.language === 'ka' ? 'მონიშნულია' : 'Selected'}</span>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2">
                   <Button 
                     size="sm" 
                     className="bg-emerald-600 hover:bg-emerald-700 h-9 font-bold"
                     onClick={() => handleBulkStatusUpdate(true)}
                   >
                     <Check className="h-3.5 w-3.5 mr-1.5" /> {t('common.active')}
                   </Button>
                   <Button 
                     size="sm" 
                     variant="danger"
                     className="bg-slate-700 hover:bg-slate-600 h-9 font-bold"
                     onClick={() => handleBulkStatusUpdate(false)}
                   >
                     <Power className="h-3.5 w-3.5 mr-1.5" /> {t('common.inactive')}
                   </Button>
                   <Button 
                     size="sm" 
                     className="bg-amber-500 hover:bg-amber-600 h-9 font-bold border-none"
                     onClick={() => handleBulkPromoUpdate(true)}
                   >
                     <Star className="h-3.5 w-3.5 mr-1.5 fill-white" /> {t('products.promo')}
                   </Button>
                   <Button 
                     size="sm" 
                     className="bg-red-600 hover:bg-red-700 h-9 font-bold"
                     onClick={handleBulkDeleteClick}
                   >
                     <Trash2 className="h-3.5 w-3.5 mr-1.5" /> {t('common.delete')}
                   </Button>
                </div>

                <button 
                  onClick={() => setSelectedIds([])}
                  className="ml-auto p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : activeTab === 'units' ? (
        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-100 mb-10">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('products.unit_name')}</th>
                <th className="px-8 py-5 text-right text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {units.map((unit, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-900">{unit}</td>
                  <td className="px-8 py-5 whitespace-nowrap text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenUnitEditModal(unit)} className="text-blue-500 hover:bg-blue-50 font-bold">
                      {t('common.edit')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUnitClick(unit)} className="text-red-400 hover:bg-red-50 font-bold">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-8 py-10 text-center text-slate-400 italic">{t('products.no_units')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-100 mb-10">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('products.category_name')}</th>
                <th className="px-8 py-5 text-right text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {categories.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-900">{cat}</td>
                  <td className="px-8 py-5 whitespace-nowrap text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenCategoryEditModal(cat)} className="text-blue-500 hover:bg-blue-50 font-bold">
                      {t('common.edit')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCategoryClick(cat)} className="text-red-400 hover:bg-red-50 font-bold">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                 <tr>
                    <td colSpan={2} className="px-8 py-10 text-center text-slate-400 italic">{t('products.no_categories')}</td>
                 </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('products.delete_confirm_title')}
      >
        <div className="space-y-6 py-2">
           <div className="flex flex-col items-center text-center">
             <div className="bg-red-50 p-4 rounded-full mb-4">
                <Trash2 className="h-10 w-10 text-red-500" />
             </div>
             <h3 className="text-lg font-bold text-slate-900 mb-2">{t('products.delete_confirm_title')}</h3>
             <p className="text-sm text-slate-500 leading-relaxed px-4">
                <Trans 
                  i18nKey="products.delete_confirm_desc" 
                  values={{ name: deleteConfirm?.name }}
                  components={{ b: <b /> }}
                />
             </p>
           </div>

           <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button variant="outline" className="flex-1 h-12 font-bold" onClick={() => setDeleteConfirm(null)}>
                {t('common.cancel')}
              </Button>
              <Button className="flex-1 h-12 bg-red-600 hover:bg-red-700 font-bold shadow-lg shadow-red-100" onClick={handleConfirmDelete}>
                {t('common.delete')}
              </Button>
           </div>
        </div>
      </Modal>

      {/* Product Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProduct ? t('products.edit_title') : t('products.add_title')}
      >
        <div className="space-y-6 py-2">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-3 uppercase tracking-wide">{t('products.upload_image_label')}</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-48 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-500 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden shadow-inner"
            >
              {newProduct.image ? (
                <>
                  <img src={newProduct.image} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="h-8 w-8 text-slate-400 group-hover:text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-500 group-hover:text-emerald-600">{t('products.upload_help')}</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-slate-900 mb-1.5 uppercase tracking-wide">{t('products.name_label')}</label>
              <Input 
                value={newProduct.name} 
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
                placeholder={t('products.product_placeholder')} 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-900 mb-1.5 uppercase tracking-wide">{t('products.category_label')}</label>
                <select 
                  className="flex h-11 w-full rounded-lg border-2 border-slate-100 bg-white px-4 py-2 text-sm font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                >
                  {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-900 mb-1.5 uppercase tracking-wide">{t('products.unit_label')}</label>
                <select 
                  className="flex h-11 w-full rounded-lg border-2 border-slate-100 bg-white px-4 py-2 text-sm font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                >
                  {units.map((u, i) => <option key={i} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
               <div className="flex items-center gap-3">
                 <input 
                   type="checkbox" 
                   id="promo-toggle"
                   className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                   checked={newProduct.isPromo || false}
                   onChange={(e) => {
                     setNewProduct({...newProduct, isPromo: e.target.checked});
                     if (!e.target.checked) setError(null);
                   }}
                 />
                 <label htmlFor="promo-toggle" className="text-sm font-black text-slate-900 uppercase tracking-widest cursor-pointer">
                    {t('products.promo')}
                 </label>
               </div>

               {newProduct.isPromo && (
                 <div className="animate-in slide-in-from-top-2">
                   <label className="block text-[13px] font-bold text-slate-900 mb-1.5 uppercase tracking-wide">{t('products.price_label')}</label>
                   <div className="relative">
                      <Input 
                        type="number" 
                        step="0.01"
                        value={newProduct.price || ''} 
                        onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})} 
                        placeholder="0.00" 
                        className="pl-8"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                   </div>
                 </div>
               )}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveProduct} className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200">
              {editingProduct ? t('common.save') : t('products.add_btn')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unit Edit/Add Modal */}
      <Modal 
        isOpen={isUnitEditModalOpen} 
        onClose={() => setIsUnitEditModalOpen(false)} 
        title={editingUnit ? t('products.edit_unit_title') : t('products.add_unit_title')}
      >
        <div className="space-y-6 py-2">
          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-1.5 uppercase tracking-wide">{t('products.unit_name')}</label>
            <Input 
              value={newUnitName} 
              onChange={(e) => setNewUnitName(e.target.value)} 
              placeholder={t('products.unit_placeholder')} 
              autoFocus
            />
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setIsUnitEditModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveUnit} className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200" disabled={!newUnitName.trim()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Edit/Add Modal */}
      <Modal 
        isOpen={isCategoryEditModalOpen} 
        onClose={() => setIsCategoryEditModalOpen(false)} 
        title={editingCategory ? t('products.edit_category_title') : t('products.add_category_title')}
      >
        <div className="space-y-6 py-2">
          <div>
            <label className="block text-[13px] font-bold text-slate-900 mb-1.5 uppercase tracking-wide">{t('products.category_name')}</label>
            <Input 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)} 
              placeholder={t('products.category_placeholder')} 
              autoFocus
            />
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setIsCategoryEditModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveCategory} className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-200" disabled={!newCategoryName.trim()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
