"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataService } from "@/services";
import { User } from "@/services/types";
import { ArrowLeft, User as UserIcon, Mail, Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/common/image-cropper";
import { useAppStore } from "@/lib/store";

export default function ProfilePage() {
    const router = useRouter();
    const { t } = useTranslation();
    const setCurrentUser = useAppStore(state => state.setCurrentUser);

    // Local state for form, but user object syncs with global if needed
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mock premium check - in real app this would come from user.plan_id or subscription
    const isPremium = false;

    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await dataService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setName(currentUser.full_name || "");
                setAvatar(currentUser.avatar_url || null);
            } else {
                router.push("/login");
            }
            setIsLoading(false);
        };
        loadUser();
    }, [router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        try {
            const updatedUser = await dataService.updateUser({ full_name: name });
            if (updatedUser) {
                setUser(updatedUser);
                setCurrentUser(updatedUser); // Sync global header
                setMessage(t('profile.success'));
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (error) {
            console.error(error);
            setMessage(t('profile.error'));
        } finally {
            setIsSaving(false);
        }
    };

    const [cropperOpen, setCropperOpen] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // Increased limit to 5MB for high qual photos
            alert("File size must be less than 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setTempImage(reader.result as string);
            setCropperOpen(true);
            // reset input so same file can be selected again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedImage: string) => {
        setIsUploading(true);
        // Optimistic update
        setAvatar(croppedImage);

        try {
            await dataService.updateUserAvatar(croppedImage);
            if (user) {
                const updated = { ...user, avatar_url: croppedImage };
                setUser(updated);
                setCurrentUser(updated); // Sync global header
            }
        } catch (error) {
            console.error("Failed to upload avatar", error);
            alert(t('profile.error'));
            // Revert on error? For now keep optimistic or maybe reload user.
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

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
                    <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-50 flex items-center gap-3">
                        {t('profile.title')}
                        {isPremium && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 px-2.5 py-0.5 text-xs font-semibold text-amber-900 shadow-sm">
                                {t('profile.premium')}
                            </span>
                        )}
                    </h1>

                    <div className="flex flex-col items-center mb-8">
                        {/* Hidden input - using ID for label association to prevent loop */}
                        <input
                            type="file"
                            id="avatar-upload"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                        />

                        {/* Use label instead of div with onClick to handle file input robustly */}
                        <label
                            htmlFor="avatar-upload"
                            className="relative group cursor-pointer block"
                        >
                            <div className={cn(
                                "h-24 w-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-inner flex items-center justify-center bg-slate-100",
                                isUploading && "opacity-50"
                            )}>
                                {avatar ? (
                                    <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <UserIcon className="h-12 w-12 text-slate-300" />
                                )}
                            </div>

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="h-6 w-6 text-white" />
                            </div>

                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                </div>
                            )}
                        </label>

                        {/* Text Button also acting as label */}
                        <label
                            htmlFor="avatar-upload"
                            className="mt-2 text-sm text-blue-600 font-medium cursor-pointer hover:text-blue-700 hover:underline"
                        >
                            {t('profile.change_photo')}
                        </label>
                        {message && (
                            <p className={cn(
                                "mt-2 text-sm font-medium animate-in fade-in slide-in-from-top-1",
                                message.includes("success") ? "text-green-600" : "text-red-600"
                            )}>
                                {message}
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('profile.email')}</Label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">{user?.email}</span>
                            </div>
                            <p className="text-xs text-slate-500">{t('profile.email_desc')}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">{t('profile.full_name')}</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('profile.enter_name_placeholder')}
                            />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                                {isSaving ? t('profile.saving') : t('profile.save')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <ImageCropper
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                imageSrc={tempImage}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
}
