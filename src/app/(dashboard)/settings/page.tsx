"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Settings as SettingsIcon, Shield, User, Camera } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { dataService } from "@/services";
import { User as UserType } from "@/services/types";
import { ImageCropper } from "@/components/common/image-cropper";
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
    const { t } = useTranslation();
    const [user, setUser] = useState<UserType | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const setCurrentUser = useAppStore(state => state.setCurrentUser);

    // Profile States
    const [fullName, setFullName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isCropOpen, setIsCropOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await dataService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setFullName(currentUser.full_name || "");
                setAvatarUrl(currentUser.avatar_url || "");
            }
        };
        loadUser();
    }, []);

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!newPassword || newPassword.length < 6) {
            setMessage({ type: 'error', text: t('settings.password_min_length') });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t('settings.password_mismatch') });
            return;
        }

        setIsSaving(true);
        // Mock save
        setTimeout(() => {
            setMessage({ type: 'success', text: t('settings.password_success') });
            setNewPassword("");
            setConfirmPassword("");
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }, 800);
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        setMessage(null);

        try {
            const updatedUser = await dataService.updateUser({
                ...user,
                full_name: fullName,
                avatar_url: avatarUrl
            });
            if (updatedUser) {
                setCurrentUser(updatedUser);
            }
            setMessage({ type: 'success', text: t('profile.success') });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: t('profile.error') });
        } finally {
            setIsSaving(false);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setSelectedImage(reader.result as string);
                setIsCropOpen(true);
            });
            reader.readAsDataURL(file);
            // clear input
            e.target.value = '';
        }
    };

    const handleCropComplete = async (croppedImage: string) => {
        setAvatarUrl(croppedImage);
        // We could auto-save here or wait for user to click "Save Changes"
        // Let's just update local state and let them save universally
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600">
                            <ArrowLeft className="h-4 w-4" /> {t('profile.back')}
                        </Button>
                    </Link>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                    <h1 className="text-2xl font-bold mb-8 text-slate-900 dark:text-slate-50 flex items-center gap-3">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-full">
                            <SettingsIcon className="h-6 w-6" />
                        </div>
                        {t('settings.app_settings')}
                    </h1>

                    <div className="space-y-12">
                        {/* Profile Section */}
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                                <User className="h-5 w-5 text-blue-500" /> {t('profile.title')}
                            </h2>

                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    <div className="relative group mx-auto sm:mx-0">
                                        <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-50">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-slate-300 dark:text-slate-600 dark:bg-zinc-800">
                                                    <User className="h-10 w-10" />
                                                </div>
                                            )}
                                        </div>
                                        <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                                            <Camera className="h-6 w-6" />
                                        </label>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={onFileChange}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="space-y-2">
                                            <Label htmlFor="full-name">{t('profile.full_name')}</Label>
                                            <Input
                                                id="full-name"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder={t('profile.enter_name_placeholder')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">{t('profile.email')}</Label>
                                            <Input
                                                id="email"
                                                value={user?.email || ""}
                                                disabled
                                                className="bg-slate-50 text-slate-500 dark:bg-zinc-900 dark:text-slate-400 dark:border-slate-800"
                                            />
                                            <p className="text-xs text-slate-400 dark:text-slate-500">{t('profile.email_desc')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? t('profile.saving') : t('profile.save')}
                                    </Button>
                                </div>
                            </form>
                        </section>

                        {/* Security Section */}
                        <section className="space-y-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                                <Shield className="h-5 w-5 text-green-500" /> {t('settings.security')}
                            </h2>
                            <div className="space-y-4">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">{t('settings.password_label')}</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder={t('settings.password_placeholder')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">{t('settings.confirm_password_label')}</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder={t('settings.confirm_password_placeholder')}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="button"
                                        onClick={handlePasswordChange}
                                        disabled={isSaving || !newPassword}
                                        variant="outline"
                                    >
                                        {t('settings.update_password')}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {message && (
                        <div className={`mt-6 p-4 rounded-lg flex items-center justify-between ${message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                            <p>{message.text}</p>
                        </div>
                    )}
                </div>
            </div>

            <ImageCropper
                imageSrc={selectedImage}
                open={isCropOpen}
                onOpenChange={setIsCropOpen}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
}
