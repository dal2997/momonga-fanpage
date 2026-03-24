"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import GlassCard from "@/components/layout/GlassCard";


type ProfileData = {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  is_public: boolean;
  min_offer_multiplier: number | null;
  shipping_method: string | null;
  avatar_url: string | null;
};

const SHIPPING_OPTIONS = [
  { value: "", label: "설정 안 함" },
  { value: "direct", label: "직접 거래" },
  { value: "delivery", label: "택배" },
  { value: "both", label: "직거래 · 택배 둘 다" },
];

const MULTIPLIER_OPTIONS = [
  { value: "", label: "설정 안 함 (모든 제안 수락 가능)" },
  { value: "1.2", label: "1.2배 이상" },
  { value: "1.5", label: "1.5배 이상" },
  { value: "2", label: "2배 이상" },
  { value: "3", label: "3배 이상" },
];

// ── 스타일 토큰 ──────────────────────────────────────────
const heading = "text-zinc-900 dark:text-white";
const sub = "text-zinc-500 dark:text-white/50";
const labelCls = "mb-1.5 block text-xs font-medium text-zinc-500 dark:text-white/50";

const inputCls =
  "w-full rounded-xl border px-4 py-3 text-sm outline-none transition " +
  "border-black/10 bg-white/60 text-zinc-900 placeholder-zinc-400 " +
  "focus:border-black/20 focus:bg-white/80 " +
  "dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-white/30 " +
  "dark:focus:border-white/20 dark:focus:bg-white/[0.09]";

const btnBase =
  "rounded-full border px-5 py-2 text-sm font-medium transition " +
  "border-black/10 bg-black/[0.04] text-zinc-700 hover:bg-black/[0.08] " +
  "dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75 dark:hover:bg-white/[0.10] " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

const btnPrimary =
  "rounded-full border px-5 py-2 text-sm font-medium transition " +
  "border-black/15 bg-black/[0.08] text-zinc-900 hover:bg-black/[0.12] " +
  "dark:border-white/15 dark:bg-white/[0.10] dark:text-white dark:hover:bg-white/[0.15] " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

const panel =
  "rounded-2xl border p-5 " +
  "border-black/8 bg-black/[0.025] " +
  "dark:border-white/8 dark:bg-white/[0.035]";

function PublicToggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={[
        "relative inline-flex h-7 w-12 flex-shrink-0 rounded-full border transition-colors duration-200 focus:outline-none",
        value
          ? "border-black/20 bg-zinc-900 dark:border-white/20 dark:bg-white"
          : "border-black/10 bg-black/[0.08] dark:border-white/10 dark:bg-white/10",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
      aria-checked={value}
      role="switch"
    >
      <span
        className={[
          "absolute top-0.5 h-5 w-5 rounded-full shadow-sm transition-transform duration-200",
          value
            ? "translate-x-[22px] bg-white dark:bg-zinc-900"
            : "translate-x-0.5 bg-white dark:bg-white/60",
        ].join(" ")}
      />
    </button>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [editing, setEditing] = useState(false);

  // 편집 필드
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [shippingMethod, setShippingMethod] = useState("");
  const [minMultiplier, setMinMultiplier] = useState("");

  // 아바타
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // 저장 상태
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }
      setAuthed(true);

      const { data } = await supabase
        .from("profiles")
        .select("id, handle, display_name, bio, is_public, min_offer_multiplier, shipping_method, avatar_url")
        .eq("id", userData.user.id)
        .maybeSingle<ProfileData>();

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setIsPublic(data.is_public ?? false);
        setShippingMethod(data.shipping_method ?? "");
        setMinMultiplier(data.min_offer_multiplier != null ? String(data.min_offer_multiplier) : "");
      }
      setLoading(false);
    })();
  }, []);

  // 편집 시작 시 현재 값으로 초기화
  const startEditing = () => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    setIsPublic(profile.is_public);
    setShippingMethod(profile.shipping_method ?? "");
    setMinMultiplier(profile.min_offer_multiplier != null ? String(profile.min_offer_multiplier) : "");
    setAvatarFile(null);
    setAvatarPreview(null);
    setSaveError(null);
    setSaved(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setSaveError(null);
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    // 아바타 업로드 처리
    let newAvatarUrl = profile.avatar_url;
    if (avatarFile) {
      try {
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `avatars/${profile.id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("momonga")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("momonga").getPublicUrl(path);
        newAvatarUrl = urlData.publicUrl;
      } catch (uploadErr) {
        setSaving(false);
        setSaveError("아바타 업로드 실패. 다시 시도해줘.");
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        is_public: isPublic,
        shipping_method: shippingMethod || null,
        min_offer_multiplier: minMultiplier ? parseFloat(minMultiplier) : null,
        avatar_url: newAvatarUrl,
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      setSaveError(`저장 실패: ${error.message}`);
      return;
    }

    const updated = {
      ...profile,
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      is_public: isPublic,
      shipping_method: shippingMethod || null,
      min_offer_multiplier: minMultiplier ? parseFloat(minMultiplier) : null,
      avatar_url: newAvatarUrl,
    };
    setProfile(updated);
    setSaved(true);
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2500);
  };

  // ─── 로딩 ────────────────────────────────────────────
  if (loading) {
    return (
      <section id="profile" className="scroll-mt-24">
        <GlassCard className="p-10">
          <p className={`text-sm ${sub}`}>불러오는 중…</p>
        </GlassCard>
      </section>
    );
  }

  // ─── 비로그인 ─────────────────────────────────────────
  if (!authed) {
    return (
      <section id="profile" className="scroll-mt-24">
        <GlassCard className="p-10 text-center">
          <p className={`text-base ${heading}`}>로그인하면 프로필을 설정할 수 있어</p>
          <p className={`mt-2 text-sm ${sub}`}>수집 취향, 한 줄 소개, 공개 여부를 여기서 관리해.</p>
          <a
            href="/login"
            className="mt-6 inline-flex rounded-full border border-black/10 bg-black/[0.05] px-5 py-2 text-sm text-zinc-800 transition hover:bg-black/[0.09] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80 dark:hover:bg-white/[0.10]"
          >
            로그인 →
          </a>
        </GlassCard>
      </section>
    );
  }

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : "https://momonga.app"}/u/${profile?.handle ?? ""}`;

  // ─── 보기 모드 ────────────────────────────────────────
  if (!editing) {
    return (
      <section id="profile" className="scroll-mt-24">
        <GlassCard className="p-8 md:p-10">
          {/* 헤더 */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              {/* 아바타 */}
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name ?? profile.handle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl">🙂</div>
                )}
              </div>
              <div>
                <h2 className={`text-2xl font-semibold ${heading}`}>내 프로필</h2>
                <p className={`mt-0.5 text-sm ${sub}`}>@{profile?.handle}</p>
              </div>
            </div>
            <button type="button" onClick={startEditing} className={`flex-shrink-0 ${btnBase}`}>
              편집
            </button>
          </div>

          {saved && (
            <p className="mb-6 rounded-xl border border-green-500/20 bg-green-500/8 px-3 py-2 text-sm text-green-700 dark:border-green-400/20 dark:bg-green-400/8 dark:text-green-300">
              ✓ 저장됐어
            </p>
          )}

          <div className="space-y-6">
            {/* 닉네임 */}
            <div>
              <p className={`text-xs ${sub} mb-1`}>닉네임</p>
              <p className={`text-base font-medium ${heading}`}>
                {profile?.display_name || (
                  <span className="text-zinc-400 dark:text-white/30">
                    @{profile?.handle}
                  </span>
                )}
              </p>
            </div>

            {/* 수집 취향 */}
            <div>
              <p className={`text-xs ${sub} mb-1`}>수집 취향</p>
              {profile?.bio ? (
                <p className={`text-sm leading-relaxed ${heading}`}>{profile.bio}</p>
              ) : (
                <p className="text-sm text-zinc-400 dark:text-white/30">
                  아직 작성하지 않았어. 편집 버튼을 눌러 취향을 적어봐.
                </p>
              )}
            </div>

            {/* 수집 공개 상태 */}
            <div className={panel}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`text-sm font-medium ${heading}`}>수집 공개</p>
                  <p className={`mt-0.5 text-xs ${sub}`}>
                    {profile?.is_public
                      ? "켜짐 — 내 수집품이 탐색 페이지에 노출돼"
                      : "꺼짐 — 내 수집품이 나만 볼 수 있어"}
                  </p>
                </div>
                <span
                  className={[
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                    profile?.is_public
                      ? "border-green-500/20 bg-green-500/10 text-green-700 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300"
                      : "border-black/10 bg-black/[0.04] text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/40",
                  ].join(" ")}
                >
                  {profile?.is_public ? "공개" : "비공개"}
                </span>
              </div>

              {profile?.is_public && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/8 bg-white/50 px-3 py-2 dark:border-white/8 dark:bg-white/[0.04]">
                  <span className="flex-1 truncate text-xs text-zinc-500 dark:text-white/40">
                    {publicUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(publicUrl)}
                    className="flex-shrink-0 rounded-full border border-black/8 bg-black/[0.04] px-2.5 py-1 text-[11px] text-zinc-600 transition hover:bg-black/[0.07] dark:border-white/8 dark:bg-white/[0.04] dark:text-white/50 dark:hover:bg-white/[0.07]"
                  >
                    복사
                  </button>
                </div>
              )}
            </div>

            {/* 거래 설정 요약 */}
            {(profile?.shipping_method || profile?.min_offer_multiplier) && (
              <div className={panel}>
                <p className={`text-xs ${sub} mb-2`}>거래 설정</p>
                {profile.shipping_method && (
                  <p className={`text-sm ${heading}`}>
                    배송 방식: {SHIPPING_OPTIONS.find(o => o.value === profile.shipping_method)?.label ?? profile.shipping_method}
                  </p>
                )}
                {profile.min_offer_multiplier && (
                  <p className={`text-sm mt-1 ${heading}`}>
                    최소 제안: 판매가의 {profile.min_offer_multiplier}배 이상
                  </p>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      </section>
    );
  }

  // ─── 편집 모드 ────────────────────────────────────────
  return (
    <section id="profile" className="scroll-mt-24">
      <GlassCard className="p-8 md:p-10">
        <div className="mb-8">
          <h2 className={`text-2xl font-semibold ${heading}`}>프로필 편집</h2>
          <p className={`mt-1 text-sm ${sub}`}>@{profile?.handle}</p>
        </div>

        <div className="space-y-6">
          {/* 아바타 */}
          <div>
            <label className={labelCls}>프로필 사진</label>
            <div className="flex items-center gap-4">
              {/* 미리보기 */}
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
                {(avatarPreview ?? profile?.avatar_url) ? (
                  <img
                    src={avatarPreview ?? profile!.avatar_url!}
                    alt="아바타"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl">🙂</div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className={btnBase}
                >
                  사진 선택
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                    className="text-xs text-zinc-400 hover:text-zinc-600 dark:text-white/30 dark:hover:text-white/60"
                  >
                    취소
                  </button>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </div>

          {/* 닉네임 */}
          <div>
            <label htmlFor="profile-displayname" className={labelCls}>닉네임</label>
            <input
              id="profile-displayname"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={profile?.handle ?? "닉네임 없음"}
              maxLength={30}
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-white/30">
              비워두면 @handle로 표시돼.
            </p>
          </div>

          {/* 수집 취향 */}
          <div>
            <label htmlFor="profile-bio" className={labelCls}>수집 취향 소개</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={"어떤 굿즈를 모으는지, 수집하는 이유나 취향을 적어봐.\n예) 모몽가 피규어 위주로 모으고 있어. 한정판이면 더 좋고."}
              rows={4}
              maxLength={300}
              className={`${inputCls} resize-none`}
            />
            <p className="mt-1 text-right text-[11px] text-zinc-400 dark:text-white/30">
              {bio.length} / 300
            </p>
          </div>

          {/* 배송 방식 */}
          <div>
            <label htmlFor="profile-shipping" className={labelCls}>배송 방식</label>
            <select
              id="profile-shipping"
              value={shippingMethod}
              onChange={(e) => setShippingMethod(e.target.value)}
              className={inputCls}
            >
              {SHIPPING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 최소 제안 배수 */}
          <div>
            <label htmlFor="profile-multiplier" className={labelCls}>
              최소 수락 제안 배수
            </label>
            <select
              id="profile-multiplier"
              value={minMultiplier}
              onChange={(e) => setMinMultiplier(e.target.value)}
              className={inputCls}
            >
              {MULTIPLIER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-white/30">
              수집완료 아이템에 판매 희망가를 설정하면, 이 배수 미만 제안은 자동으로 안내 메시지가 표시돼.
            </p>
          </div>

          {/* 수집 공개 토글 */}
          <div className={panel}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-sm font-medium ${heading}`}>수집 공개</p>
                <p className={`mt-0.5 text-xs ${sub}`}>
                  켜면 내 수집품이 탐색 페이지에 나타나고 누구나 볼 수 있어.
                </p>
              </div>
              <PublicToggle value={isPublic} onChange={setIsPublic} disabled={saving} />
            </div>

            {isPublic && profile?.handle && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/8 bg-white/50 px-3 py-2 dark:border-white/8 dark:bg-white/[0.04]">
                <span className="flex-1 truncate text-xs text-zinc-500 dark:text-white/40">
                  {publicUrl}
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(publicUrl)}
                  className="flex-shrink-0 rounded-full border border-black/8 bg-black/[0.04] px-2.5 py-1 text-[11px] text-zinc-600 transition hover:bg-black/[0.07] dark:border-white/8 dark:bg-white/[0.04] dark:text-white/50"
                >
                  복사
                </button>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3">
              <button type="button" onClick={save} disabled={saving} className={btnPrimary}>
                {saving ? "저장 중…" : "저장"}
              </button>
              <button type="button" onClick={cancelEditing} disabled={saving} className={btnBase}>
                취소
              </button>
            </div>
            {saveError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-700 dark:border-red-400/20 dark:bg-red-400/8 dark:text-red-300">
                {saveError}
              </p>
            )}
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
