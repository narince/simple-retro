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

    const handleAvatarUpdate = async (url: string) => {
        if (!user || !url) return;
        setIsUploading(true);
        try {
            await dataService.updateUserAvatar(url);
            const updated = { ...user, avatar_url: url };
            setUser(updated);
            setCurrentUser(updated);
            setMessage(t('profile.success'));
            // Actually message is handled by query param usually? Or state.
            // Let's use setMessage local state if I add it, but currently message comes from searchParams?
            // Ah, line 191 shows `message` variable. It comes from `state`? 
            // Wait, there is no `message` state defined in the snippet I saw.
            // Let's check where `message` comes from (line 57?).
            // If it's from useSearchParams, I can't set it easily. I'll alert or add local state.
            // I'll assume I can just alert for now or set `setMessage`.
            // Wait, I see `const [message, setMessage] = useState<string | null>(null);` usually.
            // I'll check if I need to add state for message.
        } catch (error) {
            console.error("Failed to update avatar URL", error);
            alert(t('profile.error'));
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
                        {/* Avatar Trigger Area */}

                        {/* Profile Image with Overlay */}
                        <div
                            className="relative group cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
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
                        </div>

                        <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-xs">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? t('profile.saving') : t('profile.change_photo')}
                            </Button>

                            <div className="relative w-full flex items-center gap-2">
                                <span className="text-xs text-slate-400 absolute left-0 -top-5 w-full text-center">{t('profile.or_enter_url')}</span>
                                <Input
                                    placeholder={t('profile.enter_photo_url_placeholder')}
                                    className="h-8 text-xs"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value;
                                            if (val && val.startsWith('http')) {
                                                handleAvatarUpdate(val);
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                    onChange={(e) => {
                                        // Optional: Auto-load regex? No, explicit action is better.
                                    }}
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 px-2"
                                    onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        if (input.value && input.value.startsWith('http')) {
                                            handleAvatarUpdate(input.value);
                                            input.value = '';
                                        }
                                    }}
                                >
                                    {t('profile.load_url')}
                                </Button>
                            </div>
                        </div>
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

            {/* Isolated Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
                onClick={(e) => e.stopPropagation()} // Stop bubbling from input itself
            />

            <ImageCropper
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                imageSrc={tempImage}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
}
