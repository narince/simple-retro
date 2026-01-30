"use client";

import { useState, useEffect } from "react";
import { dataService } from "@/services";
import { User } from "@/services/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreHorizontal, Shield, ShieldAlert, LogIn, LogOut, Plus, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dataExportService } from '@/services/export-service';
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { getInitials } from "@/lib/utils"; // Add this import

import { useTranslation } from "@/lib/i18n";

export default function AdminUsersPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const currentUser = useAppStore(state => state.currentUser);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Edit User State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editPassword, setEditPassword] = useState("");
    const [editAvatarUrl, setEditAvatarUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Create User State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createEmail, setCreateEmail] = useState("");
    const [createPassword, setCreatePassword] = useState("");
    const [createRole, setCreateRole] = useState<'admin' | 'user'>('user');

    // Delete User State
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    // Export State
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        // Protect route
        const checkAccess = async () => {
            const user = await dataService.getCurrentUser();
            if (!user || user.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            loadUsers();
        };
        checkAccess();
    }, [router]);

    const loadUsers = async () => {
        setIsLoading(true);
        const allUsers = await dataService.getUsers();
        setUsers(allUsers);
        setIsLoading(false);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setEditPassword("");
        setEditAvatarUrl(user.avatar_url || "");
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            // Update password if provided
            if (editPassword) {
                await dataService.updateUserPassword(editingUser.id, editPassword);
            }
            // Update profile
            await dataService.adminUpdateUser(editingUser.id, {
                avatar_url: editAvatarUrl
            });
            // Update other fields as needed (mock service mainly handles self-update, but we assume admin power)
            // Ideally backend handles this. For now we just refresh.
            await loadUsers();
            setEditingUser(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;
        setIsSaving(true);
        try {
            await dataService.deleteUser(deletingUser.id);
            setUsers(users.filter(u => u.id !== deletingUser.id));
            setDeletingUser(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateUser = async () => {
        if (!createName || !createEmail || !createPassword) return;
        setIsSaving(true);
        try {
            await dataService.createUser(createEmail, createName, createRole, createPassword);
            setCreateName("");
            setCreateEmail("");
            setCreatePassword("");
            setCreateRole('user');
            setIsCreateOpen(false);
            await loadUsers();
        } catch (error: any) {
            console.error(error);
            alert(t(('error.' + error.message) as any) || 'Error creating user');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRoleChange = async (user: User, newRole: 'admin' | 'user') => {
        try {
            await dataService.updateUserRole(user.id, newRole);
            setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Failed to update role", error);
        }
    };

    const handleImpersonate = async (user: User) => {
        await dataService.signIn(user.email);
        window.location.href = '/dashboard';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleString('tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (isLoading) return <div className="p-8">{t('board.loading')}</div>;



    const handleExport = async () => {
        setIsExporting(true);
        try {
            await dataExportService.exportDatabase();
        } catch (error) {
            console.error("Export error", error);
            alert("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                <div className="max-w-2xl">
                    <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-slate-100">
                        <Shield className="h-6 w-6 text-blue-600" /> {t('admin.users.title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{t('admin.users.subtitle')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100 dark:border-blue-900/50 whitespace-nowrap">
                        {t('admin.total_users', { count: users.length })}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="gap-2 dark:bg-zinc-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-zinc-800 whitespace-nowrap px-4"
                        >
                            {isExporting ? (
                                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isExporting ? "Exporting..." : t('admin.export_excel')}
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap px-4">
                            <Plus className="w-4 h-4" />
                            {t('admin.action.create')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-zinc-950 rounded-xl shadow-sm border dark:border-slate-800 overflow-hidden overflow-x-auto">
                <Table>
                    {/* ... existing table content ... */}
                    <TableHeader>
                        <TableRow className="dark:border-slate-800 dark:hover:bg-zinc-900/50">
                            <TableHead className="dark:text-slate-400">{t('admin.table.user')}</TableHead>
                            <TableHead className="dark:text-slate-400">{t('admin.table.role')}</TableHead>
                            <TableHead className="dark:text-slate-400">{t('admin.table.last_login')}</TableHead>
                            <TableHead className="dark:text-slate-400">{t('admin.table.last_logout')}</TableHead>
                            <TableHead className="text-right dark:text-slate-400">{t('admin.table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="dark:border-slate-800 dark:hover:bg-zinc-900/50">
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border dark:border-slate-700">
                                            <AvatarImage src={user.avatar_url} />
                                            <AvatarFallback className="dark:bg-slate-800 dark:text-slate-200">{getInitials(user.full_name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' ? "default" : "secondary"} className={user.role === 'admin' ? "" : "dark:bg-slate-800 dark:text-slate-300"}>
                                        {user.role || 'user'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <LogIn className="h-3 w-3 text-green-500" />
                                        {formatDate(user.last_login_at)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <LogOut className="h-3 w-3 text-orange-500" />
                                        {formatDate(user.last_logout_at)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-slate-200">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="dark:bg-zinc-950 dark:border-slate-800">
                                            <DropdownMenuItem onClick={() => handleEditUser(user)} className="cursor-pointer dark:focus:bg-zinc-900">
                                                <Edit className="mr-2 h-4 w-4" /> {t('admin.action.edit')}
                                            </DropdownMenuItem>

                                            {user.id !== currentUser?.id && (
                                                <DropdownMenuItem onClick={() => handleImpersonate(user)} className="cursor-pointer dark:focus:bg-zinc-900">
                                                    <LogIn className="mr-2 h-4 w-4 text-green-600" /> {t('admin.action.impersonate')}
                                                </DropdownMenuItem>
                                            )}

                                            {/* Role Management */}
                                            {user.id !== currentUser?.id && (
                                                user.role === 'admin' ? (
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user, 'user')} className="cursor-pointer dark:focus:bg-zinc-900">
                                                        <ShieldAlert className="mr-2 h-4 w-4 text-orange-600" /> {t('admin.action.make_user')}
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user, 'admin')} className="cursor-pointer dark:focus:bg-zinc-900">
                                                        <Shield className="mr-2 h-4 w-4 text-blue-600" /> {t('admin.action.make_admin')}
                                                    </DropdownMenuItem>
                                                )
                                            )}

                                            <DropdownMenuItem
                                                onClick={() => setDeletingUser(user)}
                                                className="text-red-600 focus:text-red-600 cursor-pointer dark:focus:bg-zinc-900"
                                                disabled={user.id === currentUser?.id}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> {t('admin.action.delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {users.map((user) => (
                    <div key={user.id} className="bg-white dark:bg-zinc-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border dark:border-slate-700">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback className="dark:bg-slate-800 dark:text-slate-200">{getInitials(user.full_name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-slate-200">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="dark:bg-zinc-950 dark:border-slate-800">
                                    <DropdownMenuItem onClick={() => handleEditUser(user)} className="cursor-pointer dark:focus:bg-zinc-900">
                                        <Edit className="mr-2 h-4 w-4" /> {t('admin.action.edit')}
                                    </DropdownMenuItem>
                                    {user.id !== currentUser?.id && (
                                        <DropdownMenuItem onClick={() => handleImpersonate(user)} className="cursor-pointer dark:focus:bg-zinc-900">
                                            <LogIn className="mr-2 h-4 w-4 text-green-600" /> {t('admin.action.impersonate')}
                                        </DropdownMenuItem>
                                    )}
                                    {user.id !== currentUser?.id && (
                                        user.role === 'admin' ? (
                                            <DropdownMenuItem onClick={() => handleRoleChange(user, 'user')} className="cursor-pointer dark:focus:bg-zinc-900">
                                                <ShieldAlert className="mr-2 h-4 w-4 text-orange-600" /> {t('admin.action.make_user')}
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem onClick={() => handleRoleChange(user, 'admin')} className="cursor-pointer dark:focus:bg-zinc-900">
                                                <Shield className="mr-2 h-4 w-4 text-blue-600" /> {t('admin.action.make_admin')}
                                            </DropdownMenuItem>
                                        )
                                    )}
                                    <DropdownMenuItem
                                        onClick={() => setDeletingUser(user)}
                                        className="text-red-600 focus:text-red-600 cursor-pointer dark:focus:bg-zinc-900"
                                        disabled={user.id === currentUser?.id}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> {t('admin.action.delete')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <Badge variant={user.role === 'admin' ? "default" : "secondary"} className={user.role === 'admin' ? "" : "dark:bg-slate-800 dark:text-slate-300"}>
                                {user.role || 'user'}
                            </Badge>
                            <div className="text-right text-xs text-slate-500">
                                <div>Log: {formatDate(user.last_login_at)}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.dialog.edit_title')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.dialog.edit_desc', { email: editingUser?.email || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('admin.form.avatar_url')}</Label>
                            <Input
                                value={editAvatarUrl}
                                onChange={(e) => setEditAvatarUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('settings.password_label')}</Label>
                            <Input
                                type="password"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                placeholder={t('settings.password_placeholder')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>{t('dialog.cancel')}</Button>
                        <Button onClick={handleUpdateUser} disabled={isSaving}>
                            {isSaving ? t('profile.saving') : t('profile.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.dialog.delete_title')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.dialog.delete_desc', { name: deletingUser?.full_name || '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingUser(null)}>{t('dialog.cancel')}</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={isSaving}
                        >
                            {isSaving ? "Deleting..." : t('dialog.confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.dialog.create_title')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.dialog.create_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('admin.form.fullname')}</Label>
                            <Input
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder={t('profile.enter_name_placeholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('admin.form.email')}</Label>
                            <Input
                                type="email"
                                value={createEmail}
                                onChange={(e) => setCreateEmail(e.target.value)}
                                placeholder="example@company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('admin.form.password')}</Label>
                            <Input
                                type="password"
                                value={createPassword}
                                onChange={(e) => setCreatePassword(e.target.value)}
                                placeholder="******"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('admin.form.role')}</Label>
                            <Select value={createRole} onValueChange={(v: 'admin' | 'user') => setCreateRole(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('admin.form.select_role')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>{t('dialog.cancel')}</Button>
                        <Button onClick={handleCreateUser} disabled={isSaving || !createName || !createEmail || !createPassword}>
                            {isSaving ? t('profile.saving') : t('dialog.create_board.submit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
