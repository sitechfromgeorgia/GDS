
import React, { useState, useRef, useMemo } from 'react';
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

  const filteredProducts = useMemo(() => 
    products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const filteredUnits = useMemo(() => 
    units.filter(u => u.toLowerCase().includes(search.toLowerCase())),
    [units, search]
  );

  const filteredCategories = useMemo(() => 
    categories.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [categories, search]
  );

  // Bulk Actions
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    await bulkProductAction(selectedIds, { isActive });
    setSelectedIds([]);
  };

  const handleBulkPromoUpdate = async (isPromo: boolean) => {
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

  const handleTabChange = (tab: 'catalog' | 'units' | 'categories') => {
    setActiveTab(tab);
    setSearch('');
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6 relative min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('nav.products')}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t('products.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
           {activeTab === 'catalog' && (
             <>
               <Button variant="outline" onClick={() => handleTabChange('categories')} className="flex-1 sm:flex-none">
                 <List className="h-4 w-4 mr-2" /> {t('products.categories_btn')}
               </Button>
               <Button variant="outline" onClick={() => handleTabChange('units')} className="flex-1 sm:flex-none">
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
              <Button onClick={handleOpenCreate} className="flex-1 sm:flex-none shadow-lg shadow-slate-200 dark:shadow-none bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-none">
                <Plus className="h-4 w-4 mr-2" /> {t('products.add_product')}
              </Button>
           )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => handleTabChange('catalog')}
          className={`px-8 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'catalog' ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/20' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          {t('products.catalog')}
        </button>
        <button 
          onClick={() => handleTabChange('categories')}
          className={`px-8 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'categories' ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/20' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          {t('products.categories_btn')}
        </button>
        <button 
          onClick={() => handleTabChange('units')}
          className={`px-8 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === 'units' ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/20' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          {t('products.units')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input 
            placeholder={t('common.search')}
            className="pl-12 border-none shadow-none focus:ring-0 h-11 font-medium bg-transparent" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        {activeTab === 'catalog' && (
          <div className="flex items-center px-2">
            <button 
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors uppercase tracking-widest"
            >
              {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                <CheckSquare className="h-5 w-5 text-emerald-600" />
              ) : (
                <Square className="h-5 w-5" />
              )}
              {i18n.language === 'ka' ? 'ყველას მონიშვნა' : 'Select All'}
            </button>
          </div>
        )}
      </div>

      {activeTab === 'catalog' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
            {filteredProducts.map(product => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <Card 
                  key={product.id} 
                  className={`overflow-hidden hover:shadow-xl transition-all border-2 group relative ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <button 
                    onClick={() => toggleSelection(product.id)}
                    className={`absolute top-3 left-3 z-20 p-1 rounded-lg transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/80 dark:bg-slate-950/80 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-500 backdrop-blur-sm shadow-sm'}`}
                  >
                    {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                  </button>

                  <div className="h-52 bg-slate-100 dark:bg-slate-800 relative overflow-hidden cursor-pointer" onClick={() => toggleSelection(product.id)}>
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      {product.isPromo && (
                        <Badge variant="warning" className="shadow-md border-amber-200 dark:border-amber-900/50 backdrop-blur-sm bg-amber-100/90 dark:bg-amber-950/90">
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
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">{product.name}</h3>
                        <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tight">{product.category} • {product.unit}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button variant="outline" size="sm" className="flex-1 font-bold h-10" onClick={() => handleOpenEdit(product)}>
                        <Edit2 className="h-4 w-4 mr-2" /> {t('common.edit')}
                      </Button>
                      <Button 
                        variant={product.isPromo ? 'primary' : 'outline'} 
                        size="sm" 
                        className={`font-bold h-10 ${product.isPromo ? 'bg-amber-500 hover:bg-amber-600 border-none' : 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/10'}`}
                        onClick={() => toggleProductPromo(product.id)}
                      >
                        <Star className={`h-4 w-4 ${product.isPromo ? 'fill-white dark:fill-slate-950' : ''}`} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleProductStatus(product.id)}
                        className={product.isActive ? 'text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteProductClick(product)}
                        className="text-slate-300 dark:text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {selectedIds.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-2xl animate-in slide-in-from-bottom-8 fade-in duration-300">
              <div className="bg-slate-900 dark:bg-slate-100 border border-white/10 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-white/10 dark:border-slate-300">
                   <div className="bg-emerald-500 text-white h-8 w-8 rounded-full flex items-center justify-center font-black text-xs shadow-lg">
                     {selectedIds.length}
                   </div>
                   <span className="text-sm font-bold text-white dark:text-slate-900 uppercase tracking-wider">{i18n.language === 'ka' ? 'მონიშნულია' : 'Selected'}</span>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2">
                   <Button 
                     size="sm" 
                     className="bg-emerald-600 hover:bg-emerald-700 h-9 font-bold text-white border-none"
                     onClick={() => handleBulkStatusUpdate(true)}
                   >
                     <Check className="h-3.5 w-3.5 mr-1.5" /> {t('common.active')}
                   </Button>
                   <Button 
                     size="sm" 
                     variant="danger"
                     className="bg-slate-700 hover:bg-slate-600 dark:bg-slate-300 dark:hover:bg-slate-400 dark:text-slate-900 border-none h-9 font-bold"
                     onClick={() => handleBulkStatusUpdate(false)}
                   >
                     <Power className="h-3.5 w-3.5 mr-1.5" /> {t('common.inactive')}
                   </Button>
                   <Button 
                     size="sm" 
                     className="bg-amber-500 hover:bg-amber-600 h-9 font-bold border-none text-white"
                     onClick={() => handleBulkPromoUpdate(true)}
                   >
                     <Star className="h-3.5 w-3.5 mr-1.5 fill-white" /> {t('products.promo')}
                   </Button>
                   <Button 
                     size="sm" 
                     className="bg-red-600 hover:bg-red-700 h-9 font-bold text-white border-none"
                     onClick={handleBulkDeleteClick}
                   >
                     <Trash2 className="h-3.5 w-3.5 mr-1.5" /> {t('common.delete')}
                   </Button>
                </div>

                <button 
                  onClick={() => setSelectedIds([])}
                  className="ml-auto p-2 text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-900 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none mb-10 transition-colors">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-8 py-5 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                  {activeTab === 'units' ? t('products.unit_name') : t('products.category_name')}
                </th>
                <th className="px-8 py-5 text-right text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {(activeTab === 'units' ? filteredUnits : filteredCategories).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100">{item}</td>
                  <td className="px-8 py-5 whitespace-nowrap text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => activeTab === 'units' ? handleOpenUnitEditModal(item) : handleOpenCategoryEditModal(item)} className="text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 font-bold">
                      {t('common.edit')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => activeTab === 'units' ? handleDeleteUnitClick(item) : handleDeleteCategoryClick(item)} className="text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
