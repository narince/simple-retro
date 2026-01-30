"use client";

import { useState, useEffect, useRef } from "react";
import {
    Loader2, User as UserIcon, Camera, Mail, ArrowLeft, Upload, Link as LinkIcon, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { dataService, User } from "@/services/api-service";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/ui/image-cropper";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function ProfilePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { currentUser, setCurrentUser } = useAppStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showUrlInput, setShowUrlInput] = useState(false);

    const [activeTab, setActiveTab] = useState("general"); // For future tabs

    // Image Cropper State
    const [cropperOpen, setCropperOpen] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
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
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            console.error(error);
            setMessage(t('profile.error'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // Increased limit to 5MB for high qual photos
                alert("File size must be less than 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setTempImage(reader.result as string);
                setCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset input value to allow re-uploading the same file
        e.target.value = '';
    };

    const handleCropComplete = async (croppedImage: string) => {
        if (!user) return;
        setIsUploading(true);
        try {
            // Upload base64/blob to server or updated field
            // dataService.updateUserAvatar will handle it
            await dataService.updateUserAvatar(croppedImage);

            const updated = { ...user, avatar_url: croppedImage };
            setUser(updated);
            setCurrentUser(updated); // Sync global header
            setAvatar(croppedImage); // Update local state for immediate feedback
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
            setAvatar(url);
            setMessage(t('profile.success'));
            setShowUrlInput(false);
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
                        {/* Avatar Trigger Area - Opens Dropdown Logic is on Button below, clicking image triggers generic Change */}
                        <div className="relative group">
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

                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-sm">
                            {showUrlInput ? (
                                <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-top-2">
                                    <Input
                                        placeholder={t('profile.enter_photo_url_placeholder')}
                                        className="h-9 text-sm"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.currentTarget.value;
                                                if (val && val.startsWith('http')) {
                                                    handleAvatarUpdate(val);
                                                }
                                            }
                                        }}
                                    />
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="shrink-0"
                                        onClick={(e) => {
                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                            if (input.value && input.value.startsWith('http')) {
                                                handleAvatarUpdate(input.value);
                                            }
                                        }}
                                    >
                                        {t('profile.load_url')}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="shrink-0 h-9 w-9"
                                        onClick={() => setShowUrlInput(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isUploading}
                                        >
                                            {isUploading ? t('profile.saving') : t('profile.change_photo')}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center">
                                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer gap-2">
                                            <Upload className="h-4 w-4" />
                                            <span>Upload from Computer</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowUrlInput(true)} className="cursor-pointer gap-2">
                                            <LinkIcon className="h-4 w-4" />
                                            <span>Enter URL</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {message && (
                            <p className={cn(
                                "mt-2 text-sm font-medium animate-in fade-in slide-in-from-top-1",
                                message.includes("Failed") || message.includes("error") ? "text-red-600" : "text-green-600"
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
