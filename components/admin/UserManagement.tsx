
import React, { useState, useRef } from 'react';
import { useApp } from '../../App';
import { Button, Input, Badge, Modal } from '../ui/Shared';
import { UserRole, User } from '../../types';
import { Plus, Search, Shield, User as UserIcon, Truck, Power, Lock, MapPin, Edit2, Phone, CheckCircle2, Camera, UserCircle, Trash2, AlertTriangle, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const UserManagement = () => {
  const { users, addUser, updateUser, updateUserStatus, deleteUser, showToast } = useApp();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newUser, setNewUser] = useState<Partial<User> & { password?: string }>({
    name: '',
    email: '',
    role: UserRole.RESTAURANT,
    phone: '',
    locationLink: '',
    password: '',
    avatar: ''
  });

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    user: User | null;
    adminPassword: string;
    confirmEmail: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    user: null,
    adminPassword: '',
    confirmEmail: '',
    isDeleting: false
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingId(null);
    setNewUser({ 
      name: '', 
      email: '', 
      role: UserRole.RESTAURANT, 
      phone: '', 
      locationLink: '', 
      password: '',
      avatar: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingId(user.id);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      locationLink: user.locationLink || '',
      password: '',
      avatar: user.avatar || ''
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewUser(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (editingId) {
      const originalUser = users.find(u => u.id === editingId);
      if (originalUser) {
        await updateUser({
          ...originalUser,
          name: newUser.name || originalUser.name,
          email: newUser.email || originalUser.email,
          role: newUser.role || originalUser.role,
          phone: newUser.phone,
          locationLink: newUser.locationLink,
          avatar: newUser.avatar
        });
      }
    } else {
      // Validate password length
      if (!newUser.password || newUser.password.length < 6) {
        showToast('პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს', 'error');
        return;
      }

      if (newUser.name && newUser.email && newUser.role) {
        await addUser({
          id: `u-${Date.now()}`, // Will be replaced by Supabase Auth ID
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          locationLink: newUser.locationLink,
          isActive: true,
          avatar: newUser.avatar,
          password: newUser.password, // Pass password for Supabase Auth
        } as User & { password?: string });
      }
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string, currentStatus: boolean = true) => {
    updateUserStatus(id, !currentStatus);
  };

  const handleOpenDeleteModal = (user: User) => {
    setDeleteModal({
      isOpen: true,
      user,
      adminPassword: '',
      confirmEmail: '',
      isDeleting: false
    });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      user: null,
      adminPassword: '',
      confirmEmail: '',
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.user) return;

    // Validate email matches
    if (deleteModal.confirmEmail !== deleteModal.user.email) {
      showToast('შეყვანილი მეილი არ ემთხვევა', 'error');
      return;
    }

    // Validate password is entered
    if (!deleteModal.adminPassword || deleteModal.adminPassword.length < 6) {
      showToast('შეიყვანეთ თქვენი პაროლი', 'error');
      return;
    }

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    const success = await deleteUser(deleteModal.user.id, deleteModal.adminPassword);

    if (success) {
      handleCloseDeleteModal();
    } else {
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <Shield className="h-4 w-4 text-purple-600" />;
      case UserRole.DRIVER: return <Truck className="h-4 w-4 text-blue-600" />;
      default: return <UserIcon className="h-4 w-4 text-emerald-600" />;
    }
  };

  const isRestaurant = newUser.role === UserRole.RESTAURANT || newUser.role === UserRole.DEMO;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-950 dark:text-slate-100 tracking-tight">{t('users.title')}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t('users.subtitle')}</p>
        </div>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto shadow-lg shadow-slate-200 dark:shadow-none">
          <Plus className="h-4 w-4 mr-2" /> {t('users.add_user')}
        </Button>
      </div>

      <div className="flex bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <Input 
            placeholder={t('common.search')}
            className="pl-12 border-none shadow-none focus:ring-0 h-12" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-100 dark:shadow-none rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('users.name')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('users.role')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('users.email')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-sm">
                            {user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">{user.phone || t('common.no_phone')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        {getRoleIcon(user.role)}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <Badge variant={user.isActive !== false ? 'success' : 'destructive'}>
                      {user.isActive !== false ? 'Active' : 'Stopped'}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1 sm:gap-2 flex-nowrap">
                      <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(user)} className="h-9 w-9 p-0">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={user.isActive !== false ? 'outline' : 'primary'}
                        className={`h-9 w-9 p-0 ${user.isActive !== false ? 'text-amber-500 border-amber-100 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-900/20' : ''}`}
                        onClick={() => toggleStatus(user.id, user.isActive)}
                        title={user.isActive !== false ? 'გათიშვა' : 'ჩართვა'}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 text-red-500 border-red-100 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
                        onClick={() => handleOpenDeleteModal(user)}
                        title="წაშლა"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'მონაცემების რედაქტირება' : 'მომხმარებლის დამატება'}
      >
        <div className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center justify-center space-y-3">
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="group relative h-28 w-28 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-emerald-500 transition-all flex items-center justify-center cursor-pointer overflow-hidden shadow-sm"
             >
               {newUser.avatar ? (
                 <>
                   <img src={newUser.avatar} className="h-full w-full object-cover" />
                   <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Camera className="h-6 w-6 text-white" />
                   </div>
                 </>
               ) : (
                 <div className="flex flex-col items-center">
                   <UserCircle className="h-10 w-10 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                   <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">ფოტო</span>
                 </div>
               )}
               <input 
                 ref={fileInputRef}
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 onChange={handleImageUpload} 
               />
             </div>
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">პროფილის სურათი</p>
          </div>

          <div className="space-y-4">
             <div>
                <label className="block text-[13px] font-bold text-slate-900 mb-1.5 uppercase tracking-wide">{t('users.name')}</label>
                <Input value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} placeholder="მაგ. რესტორანი თბილისი" />
             </div>
             
             <div>
                <label className="block text-[13px] font-bold text-slate-900 mb-1.5 uppercase tracking-wide">{t('users.email')}</label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} placeholder="user@gds.ge" />
             </div>

             <div>
                <label className="block text-[13px] font-bold text-slate-900 mb-2 uppercase tracking-wide">{t('users.role')}</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { r: UserRole.RESTAURANT, label: t('users.role_restaurant'), icon: UserIcon, desc: 'შეკვეთების განთავსება' },
                    { r: UserRole.DRIVER, label: t('users.role_driver'), icon: Truck, desc: 'მიწოდების აპლიკაცია' },
                    { r: UserRole.ADMIN, label: t('users.role_admin'), icon: Shield, desc: 'სრული კონტროლი' }
                  ].map((roleOption) => (
                    <div 
                      key={roleOption.r}
                      onClick={() => setNewUser({...newUser, role: roleOption.r})}
                      className={`flex items-center p-3.5 border-2 rounded-xl cursor-pointer transition-all select-none group ${
                        newUser.role === roleOption.r 
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg mr-4 transition-colors ${
                        newUser.role === roleOption.r 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}>
                        <roleOption.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${newUser.role === roleOption.r ? 'text-emerald-950' : 'text-slate-900'}`}>{roleOption.label}</p>
                        <p className={`text-[11px] font-medium ${newUser.role === roleOption.r ? 'text-emerald-700' : 'text-slate-400'}`}>{roleOption.desc}</p>
                      </div>
                      {newUser.role === roleOption.r && <CheckCircle2 className="h-5 w-5 text-emerald-600 ml-2" />}
                    </div>
                  ))}
                </div>
             </div>

             {!editingId && (
               <div>
                  <label className="block text-[13px] font-bold text-slate-900 mb-1.5 uppercase tracking-wide">{t('users.password')}</label>
                  <div className="relative">
                     <Input
                       type="text"
                       value={newUser.password}
                       onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                       placeholder="მინ. 6 სიმბოლო"
                       className={newUser.password && newUser.password.length < 6 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                     />
                     <Lock className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 ${newUser.password && newUser.password.length < 6 ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                  <p className={`text-[11px] mt-1.5 font-medium ${newUser.password && newUser.password.length < 6 ? 'text-red-500' : 'text-slate-400'}`}>
                    {newUser.password && newUser.password.length < 6
                      ? `პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს (ახლა: ${newUser.password.length})`
                      : 'პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს'}
                  </p>
               </div>
             )}
             
             <div className="pt-4 border-t border-slate-100">
               <h4 className="text-[11px] font-black text-slate-400 mb-4 flex items-center uppercase tracking-[0.2em]">
                 საკონტაქტო და მიწოდების დეტალები
               </h4>
               <div className="space-y-4">
                 <div>
                    <label className="block text-[13px] font-bold text-slate-900 mb-1.5">{t('users.phone')}</label>
                    <div className="relative">
                      <Input value={newUser.phone || ''} onChange={(e) => setNewUser({...newUser, phone: e.target.value})} placeholder="5XX XX XX XX" />
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                 </div>
                 
                 {isRestaurant && (
                   <div>
                     <label className="block text-[13px] font-bold text-slate-900 mb-1.5">ლოკაცია (Google Maps)</label>
                     <div className="relative">
                        <Input 
                          value={newUser.locationLink || ''} 
                          onChange={(e) => setNewUser({...newUser, locationLink: e.target.value})} 
                          placeholder="https://maps.app.goo.gl/..." 
                        />
                        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                     </div>
                     <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed italic">ჩასვით Google Maps-ის სრული ლინკი მძღოლისთვის ნავიგაციის გასამარტივებლად.</p>
                   </div>
                 )}
               </div>
             </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-slate-900 hover:bg-slate-800 ring-offset-2 shadow-lg shadow-slate-200">
              {editingId ? 'მონაცემების შენახვა' : 'მომხმარებლის დამატება'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        title="მომხმარებლის წაშლა"
      >
        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl">
            <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-300">
                ყურადღება! ეს მოქმედება შეუქცევადია
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                მომხმარებლის წაშლის შემდეგ მისი აღდგენა შეუძლებელი იქნება.
              </p>
            </div>
          </div>

          {/* User Info */}
          {deleteModal.user && (
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                {deleteModal.user.avatar ? (
                  <img src={deleteModal.user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-slate-600 dark:text-slate-300">
                    {deleteModal.user.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{deleteModal.user.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{deleteModal.user.email}</p>
              </div>
            </div>
          )}

          {/* Confirmation Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-1.5 uppercase tracking-wide">
                თქვენი პაროლი
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={deleteModal.adminPassword}
                  onChange={(e) => setDeleteModal(prev => ({ ...prev, adminPassword: e.target.value }))}
                  placeholder="შეიყვანეთ თქვენი პაროლი"
                  className="pr-10"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                უსაფრთხოებისთვის შეიყვანეთ თქვენი ადმინისტრატორის პაროლი
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-900 dark:text-slate-100 mb-1.5 uppercase tracking-wide">
                მომხმარებლის მეილი
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={deleteModal.confirmEmail}
                  onChange={(e) => setDeleteModal(prev => ({ ...prev, confirmEmail: e.target.value }))}
                  placeholder={deleteModal.user?.email || 'user@example.com'}
                  className="pr-10"
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                დასადასტურებლად ჩაწერეთ მომხმარებლის მეილი: <span className="font-bold text-slate-600 dark:text-slate-300">{deleteModal.user?.email}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCloseDeleteModal}
              disabled={deleteModal.isDeleting}
            >
              გაუქმება
            </Button>
            <Button
              variant="danger"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
              disabled={deleteModal.isDeleting || !deleteModal.adminPassword || !deleteModal.confirmEmail}
            >
              {deleteModal.isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  იშლება...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  წაშლა
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
