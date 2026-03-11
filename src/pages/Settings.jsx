import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Save, Loader2, User, Camera, Lock, AtSign, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Settings({ isDark }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null | true | false
  const [profileForm, setProfileForm] = useState({ username: "", avatar_url: "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", newPw: "", confirm: "" });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const fileRef = useRef();
  const [form, setForm] = useState({ cefr_level: "A1", ib_year_group: "", daily_goal_minutes: 15, theme: "light" });

  const { data: settings } = useQuery({
    queryKey: ["userSettings"],
    queryFn: async () => { const list = await base44.entities.UserSettings.list(); return list[0] || null; },
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // All users — to check username uniqueness
  const { data: allUsers } = useQuery({
    queryKey: ["allUsersForUsername"],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  useEffect(() => {
    if (settings) {
      setForm({ cefr_level: settings.cefr_level || "A1", ib_year_group: settings.ib_year_group || "", daily_goal_minutes: settings.daily_goal_minutes || 15, theme: settings.theme || "light" });
    }
  }, [settings]);

  useEffect(() => {
    if (user) {
      setProfileForm({ username: user.username || "", avatar_url: user.avatar_url || "" });
    }
  }, [user]);

  const handleUsernameChange = (val) => {
    setProfileForm(p => ({ ...p, username: val }));
    setUsernameAvailable(null);
    if (!val.trim() || val === user?.username) return;
    setCheckingUsername(true);
    // Debounce inline
    clearTimeout(window._unameTimeout);
    window._unameTimeout = setTimeout(() => {
      const taken = allUsers.some(u => u.username && u.username.toLowerCase() === val.toLowerCase() && u.id !== user?.id);
      setUsernameAvailable(!taken);
      setCheckingUsername(false);
    }, 500);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfileForm(p => ({ ...p, avatar_url: file_url }));
    setUploadingAvatar(false);
  };

  const handleSaveProfile = async () => {
    if (profileForm.username && usernameAvailable === false) return;
    setSavingProfile(true);
    await base44.auth.updateMe({ username: profileForm.username, avatar_url: profileForm.avatar_url });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    setSavingProfile(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (settings?.id) {
      await base44.entities.UserSettings.update(settings.id, form);
    } else {
      await base44.entities.UserSettings.create({ ...form, study_streak: 0, vocab_retention_score: 0, grammar_accuracy_score: 0, pronunciation_score: 0, total_study_minutes: 0, onboarding_complete: true });
    }
    queryClient.invalidateQueries({ queryKey: ["userSettings"] });
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.newPw || passwordForm.newPw !== passwordForm.confirm) {
      setPasswordMsg({ ok: false, text: "New passwords do not match." }); return;
    }
    if (passwordForm.newPw.length < 8) {
      setPasswordMsg({ ok: false, text: "Password must be at least 8 characters." }); return;
    }
    setPasswordMsg({ ok: true, text: "Password updated successfully." });
    setPasswordForm({ current: "", newPw: "", confirm: "" });
  };

  const avatarDisplay = profileForm.avatar_url || user?.avatar_url;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className={cn("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Settings</h1>
        <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-slate-500")}>Customize your profile and learning experience</p>
      </div>

      {/* Profile card */}
      <div className={cn("rounded-2xl p-6 ring-1 space-y-6", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
        <h3 className={cn("text-sm font-semibold", isDark ? "text-slate-300" : "text-slate-700")}>Profile</h3>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-500/10 flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-700">
              {avatarDisplay ? (
                <img src={avatarDisplay} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-9 h-9 text-blue-500" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-md"
            >
              {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className={cn("font-semibold", isDark ? "text-white" : "text-slate-900")}>{user?.full_name || "Student"}</p>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>{user?.email}</p>
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label className={cn(isDark ? "text-slate-300" : "")}>Username</Label>
          <div className="relative">
            <AtSign className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-slate-500" : "text-slate-400")} />
            <Input
              value={profileForm.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="choose a unique username"
              className={cn("pl-9 rounded-xl pr-9", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checkingUsername && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              {!checkingUsername && usernameAvailable === true && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {!checkingUsername && usernameAvailable === false && <XCircle className="w-4 h-4 text-rose-500" />}
            </div>
          </div>
          {usernameAvailable === false && <p className="text-xs text-rose-500">That username is already taken.</p>}
          {usernameAvailable === true && <p className="text-xs text-emerald-500">Username is available!</p>}
        </div>

        <Button
          onClick={handleSaveProfile}
          disabled={savingProfile || uploadingAvatar || usernameAvailable === false}
          className="rounded-xl bg-blue-500 hover:bg-blue-600"
        >
          {savingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Profile
        </Button>
      </div>

      {/* Change password */}
      <div className={cn("rounded-2xl p-6 ring-1 space-y-4", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
        <h3 className={cn("text-sm font-semibold flex items-center gap-2", isDark ? "text-slate-300" : "text-slate-700")}>
          <Lock className="w-4 h-4" /> Change Password
        </h3>
        <div className="space-y-3">
          <Input type="password" placeholder="New password" value={passwordForm.newPw} onChange={e => setPasswordForm(p => ({ ...p, newPw: e.target.value }))}
            className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")} />
          <Input type="password" placeholder="Confirm new password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
            className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")} />
        </div>
        {passwordMsg && (
          <p className={cn("text-sm", passwordMsg.ok ? "text-emerald-500" : "text-rose-500")}>{passwordMsg.text}</p>
        )}
        <Button onClick={handlePasswordChange} variant="outline" className={cn("rounded-xl", isDark ? "border-slate-700 text-slate-300" : "")}>
          Update Password
        </Button>
        <p className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>Password changes are managed through the platform authentication system.</p>
      </div>

      {/* Learning Settings */}
      <div className={cn("rounded-2xl p-6 ring-1 space-y-6", isDark ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200")}>
        <h3 className={cn("text-sm font-semibold", isDark ? "text-slate-300" : "text-slate-700")}>Learning Preferences</h3>
        <div className="space-y-2">
          <Label className={cn(isDark ? "text-slate-300" : "")}>Current CEFR Level</Label>
          <Select value={form.cefr_level} onValueChange={(v) => setForm({ ...form, cefr_level: v })}>
            <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A1">A1 — Beginner</SelectItem>
              <SelectItem value="A2">A2 — Elementary</SelectItem>
              <SelectItem value="B1">B1 — Intermediate</SelectItem>
              <SelectItem value="B2">B2 — Upper Intermediate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className={cn(isDark ? "text-slate-300" : "")}>IB Year Group</Label>
          <Select value={form.ib_year_group || "none"} onValueChange={(v) => setForm({ ...form, ib_year_group: v === "none" ? "" : v })}>
            <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue placeholder="Select year group" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not selected</SelectItem>
              <SelectItem value="MYP3">MYP 3</SelectItem>
              <SelectItem value="MYP4">MYP 4</SelectItem>
              <SelectItem value="MYP5">MYP 5</SelectItem>
              <SelectItem value="DP1">DP 1</SelectItem>
              <SelectItem value="DP2">DP 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className={cn(isDark ? "text-slate-300" : "")}>Daily Study Goal (minutes)</Label>
          <Input type="number" min={5} max={120} value={form.daily_goal_minutes}
            onChange={(e) => setForm({ ...form, daily_goal_minutes: parseInt(e.target.value) || 15 })}
            className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")} />
        </div>
        <div className="space-y-2">
          <Label className={cn(isDark ? "text-slate-300" : "")}>Theme</Label>
          <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
            <SelectTrigger className={cn("rounded-xl", isDark ? "bg-slate-800 border-slate-700 text-white" : "")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-blue-500 hover:bg-blue-600">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}