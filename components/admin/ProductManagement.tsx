
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../App';
import { Button, Input, Card, Badge, Modal } from '../ui/Shared';
import { 
  Plus, Search, Edit2, Power, Star, Camera, Layers, List, Trash2, 
  AlertCircle, CheckSquare, Square, X, Check, ArrowUpDown, 
  ChevronUp, ChevronDown, LayoutGrid, List as ListIcon 
} from 'lucide-react';
import { Product } from '../../types';
import { useTranslation, Trans } from 'react-i18next';

type SortKey = 'name' | 'category' | 'unit' | 'price';
type SortOrder = 'asc' | 'desc';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default to grid
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'name', order: 'asc' });
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', category: '', unit: '', image: '', isPromo: false, price: undefined });
  const [error, setError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'product' | 'unit' | 'category' | 'bulk_delete';
    id?: string;
    name?: string;
  } | null>(null);

  const [isUnitEditModalOpen, setIsUnitEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [newUnitName, setNewUnitName] = useState('');

  const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    
    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? (sortConfig.key === 'price' ? 0 : '');
      const bVal = b[sortConfig.key] ?? (sortConfig.key === 'price' ? 0 : '');
      
      if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, search, sortConfig]);

  // Fix: Added missing filters for units and categories
  const filteredUnits = useMemo(() => 
    units.filter(u => u.toLowerCase().includes(search.toLowerCase())),
    [units, search]
  );

  const filteredCategories = useMemo(() => 
    categories.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [categories, search]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedProducts.map(p => p.id));
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
    setDeleteConfirm({ isOpen: true, type: 'product', id: product.id, name: product.name });
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
      for (const id of selectedIds) await deleteProduct(id);
      setSelectedIds([]);
    }
    setDeleteConfirm(null);
  };

  // Fix: Added missing handlers for unit and category management
  const handleOpenUnitEditModal = (unit: string) => {
    setEditingUnit(unit);
    setNewUnitName(unit);
    setIsUnitEditModalOpen(true);
  };

  const handleOpenCategoryEditModal = (category: string) => {
    setEditingCategory(category);
    setNewCategoryName(category);
    setIsCategoryEditModalOpen(true);
  };

  const handleSaveUnit = async () => {
    if (newUnitName.trim()) {
      if (editingUnit) {
        await updateUnit(editingUnit, newUnitName.trim());
      } else {
        await addUnit(newUnitName.trim());
      }
      setIsUnitEditModalOpen(false);
      setEditingUnit(null);
      setNewUnitName('');
    }
  };

  const handleSaveCategory = async () => {
    if (newCategoryName.trim()) {
      if (editingCategory) {
        await updateCategory(editingCategory, newCategoryName.trim());
      } else {
        await addCategory(newCategoryName.trim());
      }
      setIsCategoryEditModalOpen(false);
      setEditingCategory(null);
      setNewCategoryName('');
    }
  };

  const handleDeleteUnitClick = (unit: string) => {
    setDeleteConfirm({ isOpen: true, type: 'unit', id: unit, name: unit });
  };

  const handleDeleteCategoryClick = (category: string) => {
    setDeleteConfirm({ isOpen: true, type: 'category', id: category, name: category });
  };

  const handleAddClick = () => {
    if (activeTab === 'catalog') {
      handleOpenCreate();
    } else if (activeTab === 'units') {
      setEditingUnit(null);
      setNewUnitName('');
      setIsUnitEditModalOpen(true);
    } else if (activeTab === 'categories') {
      setEditingCategory(null);
      setNewCategoryName('');
      setIsCategoryEditModalOpen(true);
    }
  };

  const handleTabChange = (tab: 'catalog' | 'units' | 'categories') => {
    setActiveTab(tab);
    setSearch('');
    setSelectedIds([]);
  };

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="h-3 w-3 ml-1.5 opacity-30" />;
    return sortConfig.order === 'asc' ? <ChevronUp className="h-3 w-3 ml-1.5 text-blue-500" /> : <ChevronDown className="h-3 w-3 ml-1.5 text-blue-500" />;
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
           <Button onClick={handleAddClick} className="flex-1 sm:flex-none shadow-lg shadow-slate-200 dark:shadow-none bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 border-none">
             <Plus className="h-4 w-4 mr-2" /> {activeTab === 'catalog' ? t('products.add_product') : (activeTab === 'units' ? t('products.add_unit') : t('products.add_category'))}
           </Button>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
        <div className="flex overflow-x-auto no-scrollbar">
          {(['catalog', 'categories', 'units'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-8 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/20' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              {t(`products.${tab === 'categories' ? 'categories_btn' : tab}` as any)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
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
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                title="List View"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
            <button 
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors uppercase tracking-widest px-2"
            >
              {selectedIds.length === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0 ? (
                <CheckSquare className="h-5 w-5 text-emerald-600" />
              ) : (
                <Square className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">{i18n.language === 'ka' ? 'ყველას მონიშვნა' : 'Select All'}</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'catalog' ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
              {filteredAndSortedProducts.map(product => {
                const isSelected = selectedIds.includes(product.id);
                return (
                  <Card 
                    key={product.id} 
                    className={`overflow-hidden hover:shadow-xl transition-all border-2 group relative ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800'}`}
                  >
                    <button 
                      onClick={() => toggleSelection(product.id)}
                      className={`absolute top-3 left-3 z-20 p-1.5 rounded-lg transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/90 dark:bg-slate-950/90 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-500 backdrop-blur-sm shadow-sm'}`}
                    >
                      {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    </button>

                    <div className="h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden cursor-pointer" onClick={() => toggleSelection(product.id)}>
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {product.isPromo && (
                          <Badge variant="warning" className="shadow-md backdrop-blur-sm bg-amber-100/90 dark:bg-amber-950/90">
                            <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" /> PROMO
                          </Badge>
                        )}
                        <Badge variant={product.isActive ? 'success' : 'destructive'} className="shadow-md backdrop-blur-sm">
                          {product.isActive ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </div>
                      {product.isPromo && product.price && (
                        <div className="absolute bottom-3 left-3">
                           <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-black shadow-lg text-sm">
                             ${product.price.toFixed(2)}
                           </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight truncate">{product.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{product.category} • {product.unit}</p>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                        <Button variant="outline" size="sm" className="flex-1 h-9 text-[10px]" onClick={() => handleOpenEdit(product)}>
                          <Edit2 className="h-3.5 w-3.5 mr-1.5" /> {t('common.edit')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-9 p-0 text-slate-400 hover:text-amber-500"
                          onClick={() => toggleProductPromo(product.id)}
                        >
                          <Star className={`h-4 w-4 ${product.isPromo ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-9 p-0 text-slate-400 hover:text-red-500"
                          onClick={() => handleDeleteProductClick(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none mb-24">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left w-10">
                        <button onClick={handleSelectAll} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                           {selectedIds.length === filteredAndSortedProducts.length ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left cursor-pointer group" onClick={() => handleSort('name')}>
                        <div className="flex items-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {t('products.name_label')} <SortIndicator column="name" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left cursor-pointer group" onClick={() => handleSort('category')}>
                        <div className="flex items-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {t('products.category_label')} <SortIndicator column="category" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left cursor-pointer group" onClick={() => handleSort('price')}>
                        <div className="flex items-center text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          {t('products.price_label')} <SortIndicator column="price" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">სტატუსი</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAndSortedProducts.map(product => (
                      <tr key={product.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${selectedIds.includes(product.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                        <td className="px-6 py-4">
                           <button onClick={() => toggleSelection(product.id)}>
                              {selectedIds.includes(product.id) ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-slate-300 dark:text-slate-600" />}
                           </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <img src={product.image} className="h-10 w-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" />
                             <div>
                               <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{product.name}</p>
                               <p className="text-[10px] font-medium text-slate-400">{product.unit}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant="outline" className="text-[9px]">{product.category}</Badge>
                        </td>
                        <td className="px-6 py-4">
                           {product.isPromo ? (
                             <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">${product.price?.toFixed(2)}</span>
                           ) : (
                             <span className="text-[10px] text-slate-400 italic">Market Price</span>
                           )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={product.isActive ? 'success' : 'destructive'} className="text-[9px]">
                            {product.isActive ? t('common.active') : t('common.inactive')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                           <button onClick={() => handleOpenEdit(product)} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors" title="Edit"><Edit2 className="h-4 w-4" /></button>
                           <button onClick={() => toggleProductStatus(product.id)} className={`p-1.5 transition-colors ${product.isActive ? 'text-emerald-500 hover:text-red-500' : 'text-red-400 hover:text-emerald-500'}`} title="Status"><Power className="h-4 w-4" /></button>
                           <button onClick={() => handleDeleteProductClick(product)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {selectedIds.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-2xl animate-in slide-in-from-bottom-8 fade-in duration-300">
              <div className="bg-slate-950 dark:bg-slate-100 border border-white/10 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-3 pr-4 border-r border-white/10 dark:border-slate-300">
                   <div className="bg-emerald-500 text-white h-8 w-8 rounded-full flex items-center justify-center font-black text-xs">
                     {selectedIds.length}
                   </div>
                   <span className="text-xs font-black text-white dark:text-slate-900 uppercase tracking-widest">{i18n.language === 'ka' ? 'მონიშნულია' : 'Selected'}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                   <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-9 font-bold text-white border-none" onClick={() => handleBulkStatusUpdate(true)}>
                     <Check className="h-3.5 w-3.5 mr-1.5" /> {t('common.active')}
                   </Button>
                   <Button size="sm" variant="danger" className="bg-slate-800 dark:bg-slate-200 dark:text-slate-900 border-none h-9 font-bold" onClick={() => handleBulkStatusUpdate(false)}>
                     <Power className="h-3.5 w-3.5 mr-1.5" /> {t('common.inactive')}
                   </Button>
                   <Button size="sm" className="bg-red-600 hover:bg-red-700 h-9 font-bold text-white border-none" onClick={handleBulkDeleteClick}>
                     <Trash2 className="h-3.5 w-3.5 mr-1.5" /> {t('common.delete')}
                   </Button>
                </div>
                <button onClick={() => setSelectedIds([])} className="ml-auto p-2 text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-none mb-10 transition-colors">
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
                  <td className="px-8 py-5 text-sm font-bold text-slate-900 dark:text-slate-100">{item}</td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => activeTab === 'units' ? handleOpenUnitEditModal(item) : handleOpenCategoryEditModal(item)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 font-bold">
                      {t('common.edit')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => activeTab === 'units' ? handleDeleteUnitClick(item) : handleDeleteCategoryClick(item)} className="text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modals */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? t('products.edit_title') : t('products.add_title')}>
        <div className="space-y-5">
           {error && (
             <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-900/50">
               <AlertCircle className="h-4 w-4" />
               <p className="text-xs font-bold">{error}</p>
             </div>
           )}
           <div className="flex flex-col items-center justify-center">
              <div onClick={() => fileInputRef.current?.click()} className="group relative h-32 w-48 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-blue-500 transition-all cursor-pointer overflow-hidden flex items-center justify-center">
                {newProduct.image ? (
                   <>
                    <img src={newProduct.image} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera className="h-8 w-8 text-white" /></div>
                   </>
                ) : (
                  <div className="text-center"><Camera className="h-8 w-8 text-slate-300 mx-auto mb-1" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">სურათი</p></div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
           </div>
           <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">{t('products.name_label')}</label>
              <Input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder={t('products.product_placeholder')} />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">{t('products.category_label')}</label>
                <select className="w-full h-11 border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg px-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-slate-100" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">{t('products.unit_label')}</label>
                <select className="w-full h-11 border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg px-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none dark:text-slate-100" value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}>
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
           </div>
           <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2"><Star className={`h-5 w-5 ${newProduct.isPromo ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} /><span className="text-sm font-bold dark:text-slate-100">აქციის სტატუსი</span></div>
                 <input type="checkbox" checked={newProduct.isPromo} onChange={(e) => setNewProduct({...newProduct, isPromo: e.target.checked})} className="h-6 w-6 rounded-lg text-amber-500 focus:ring-amber-500 border-slate-200 dark:border-slate-800 cursor-pointer" />
              </div>
              {newProduct.isPromo && (
                <div className="animate-in slide-in-from-top-2">
                   <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-widest">{t('products.price_label')}</label>
                   <div className="relative"><Input type="number" value={newProduct.price || ''} onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})} placeholder="0.00" className="pl-8" /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span></div>
                </div>
              )}
           </div>
           <div className="pt-4 flex gap-3">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSaveProduct} className="flex-1 h-12 bg-slate-950 dark:bg-slate-100 dark:text-slate-900 border-none shadow-lg dark:shadow-none font-black uppercase text-xs tracking-widest">{t('common.save')}</Button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm?.isOpen} onClose={() => setDeleteConfirm(null)} title={t('products.delete_confirm_title')}>
        <div className="space-y-6">
           <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400">
             <AlertCircle className="h-8 w-8 shrink-0" />
             <p className="text-sm font-medium leading-relaxed"><Trans i18nKey="products.delete_confirm_desc" values={{ name: deleteConfirm?.name }} components={{ b: <b className="font-black" /> }} /></p>
           </div>
           <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
              <Button variant="danger" className="flex-1" onClick={handleConfirmDelete}>{t('common.delete')}</Button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isUnitEditModalOpen} onClose={() => setIsUnitEditModalOpen(false)} title={editingUnit ? t('products.edit_unit_title') : t('products.add_unit_title')}>
        <div className="space-y-4">
          <Input value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder={t('products.unit_placeholder')} />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsUnitEditModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveUnit} className="flex-1">{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCategoryEditModalOpen} onClose={() => setIsCategoryEditModalOpen(false)} title={editingCategory ? t('products.edit_category_title') : t('products.add_category_title')}>
        <div className="space-y-4">
          <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder={t('products.category_placeholder')} />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsCategoryEditModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveCategory} className="flex-1">{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
