"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { getClientAuth } from "@/lib/firebase/client-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GovernorateSelect } from "@/components/ui/governorate-select";
import { normalizeEgyptMobile, validateEgyptMobile } from "@/lib/phone";
import {
  EDUCATIONAL_SYSTEMS,
  EDUCATIONAL_STAGES,
  GRADES,
} from "@/lib/education-options";
import {
  School,
  Phone,
  Lock,
  UserPlus,
  Eye,
  EyeOff,
  Globe,
  Building2,
  GraduationCap,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

interface RegisterPayload {
  fullName: string;
  englishName?: string;
  email?: string;
  mobile: string;
  parentMobile?: string;
  password: string;
  confirmPassword: string;
  governorate?: string;
  school?: string;
  educationalSystem?: string;
  educationalStage?: string;
  grade?: string;
}

type Step = 1 | 2 | 3 | 4;

const TOTAL_STEPS = 4;

// ── Preparing Screen ─────────────────────────────────────────────────

function PreparingScreen({ onDone }: { onDone: () => void }): ReactNode {
  const steps = [
    "✓ إنشاء حسابك",
    "✓ تجهيز المنهج الدراسي",
    "✓ إنشاء ملفك الدراسي",
    "✓ تحميل بيئة التعلم",
  ];
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(() => { onDone(); }, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return (): void => { clearInterval(interval); };
  }, [onDone, steps.length]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-500 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
          <School className="h-10 w-10 text-white animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          تجهيز حسابك
        </h1>
      </div>

      <div className="flex flex-col gap-4 w-72">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500 ${
              i <= visible
                ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 opacity-100 translate-x-0"
                : "bg-transparent text-neutral-400 opacity-40 translate-x-2"
            }`}
          >
            <Check className={`h-5 w-5 shrink-0 transition-all ${i <= visible ? "text-primary-500" : "text-neutral-400"}`} />
            <span className="text-sm font-medium">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step Progress Bar ────────────────────────────────────────────────

function StepProgress({ current, total }: { current: number; total: number }): ReactNode {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i < current ? "bg-primary-500" : "bg-neutral-200 dark:bg-neutral-700"
          }`}
        />
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function RegisterPage(): ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, oauthRegister, signInWithGoogle } = useAuth();

  // OAuth detection
  const oauthProvider = searchParams.get("oauth");
  const verifiedEmail = searchParams.get("email");
  const isOAuth = oauthProvider === "google" || oauthProvider === "apple";

  const [step, setStep] = useState<Step>(isOAuth ? 1 : 1);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [school, setSchool] = useState("");

  // Step 2
  const [educationalSystem, setEducationalSystem] = useState("");

  // Step 3
  const [educationalStage, setEducationalStage] = useState("");

  // Step 4
  const [grade, setGrade] = useState("");

  const validateStep1 = useCallback((): boolean => {
    if (!fullName || fullName.length < 2) { setError("الاسم العربي مطلوب"); return false; }

    const mobileResult = validateEgyptMobile(mobile);
    if (!mobileResult.valid) { setError(mobileResult.message ?? "رقم هاتف غير صحيح"); return false; }

    if (parentMobile) {
      const parentResult = validateEgyptMobile(parentMobile);
      if (!parentResult.valid) { setError(parentResult.message ?? "رقم ولي الأمر غير صحيح"); return false; }
    }

    if (!isOAuth) {
      if (!password || password.length < 8) { setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return false; }
      if (password !== confirmPassword) { setError("كلمات المرور غير متطابقة"); return false; }
    }

    if (!governorate) { setError("يرجى اختيار المحافظة"); return false; }
    return true;
  }, [fullName, mobile, parentMobile, password, confirmPassword, governorate, isOAuth]);

  const validateStep2 = useCallback((): boolean => {
    if (!educationalSystem) { setError("يرجى اختيار النظام التعليمي"); return false; }
    return true;
  }, [educationalSystem]);

  const validateStep3 = useCallback((): boolean => {
    if (!educationalStage) { setError("يرجى اختيار المرحلة التعليمية"); return false; }
    return true;
  }, [educationalStage]);

  const validateStep4 = useCallback((): boolean => {
    if (!grade) { setError("يرجى اختيار الصف الدراسي"); return false; }
    return true;
  }, [grade]);

  const handleNext = useCallback((): void => {
    setError(null);
    let valid = true;
    if (step === 1) valid = validateStep1();
    else if (step === 2) valid = validateStep2();
    else if (step === 3) valid = validateStep3();
    else valid = validateStep4();

    if (valid && step < 4) {
      setStep((prev) => (prev + 1) as Step);
    }
  }, [step, validateStep1, validateStep2, validateStep3, validateStep4]);

  const handleBack = useCallback((): void => {
    setError(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as Step);
    }
  }, [step]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      if (isOAuth && verifiedEmail) {
        await oauthRegister({
          email: verifiedEmail,
          fullName,
          englishName: englishName || undefined,
          mobile: normalizeEgyptMobile(mobile),
          parentMobile: parentMobile ? normalizeEgyptMobile(parentMobile) : undefined,
          password: password || undefined,
          governorate: governorate || undefined,
          school: school || undefined,
          educationalSystem,
          educationalStage,
          grade,
        });
      } else {
        const normalizedMobile = normalizeEgyptMobile(mobile);
        const payload: RegisterPayload = {
          fullName,
          englishName: englishName || undefined,
          email: email || undefined,
          mobile: normalizedMobile,
          parentMobile: parentMobile ? normalizeEgyptMobile(parentMobile) : undefined,
          password,
          confirmPassword,
          governorate: governorate || undefined,
          school: school || undefined,
          educationalSystem,
          educationalStage,
          grade,
        };

        await register(payload);
      }
      setRegistered(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "EMAIL_VERIFICATION_REQUIRED") {
        const normalizedMobile = normalizeEgyptMobile(mobile);
        const submittedEmail = email || `${normalizedMobile.replace(/[+\s]/g, '')}@el-bannawy.app`;
        setVerifyEmail(submittedEmail);
        setVerifyEmailSent(true);
      } else {
        setError(msg || "Registration failed");
      }
      setLoading(false);
    }
  }, [fullName, englishName, mobile, parentMobile, password, confirmPassword, governorate, school, educationalSystem, educationalStage, grade, register, oauthRegister, isOAuth, verifiedEmail]);

  const handlePreparingDone = useCallback((): void => {
    router.push("/dashboard");
  }, [router]);

  if (verifyEmailSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-500 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
          <School className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          تم إنشاء حسابك بنجاح
        </h1>
        <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
          لقد أرسلنا رابط التفعيل إلى <span className="font-bold text-neutral-700 dark:text-neutral-200" dir="ltr">{verifyEmail || "بريدك الإلكتروني"}</span>.
          <br />
          يرجى فتح البريد والنقر على الرابط لتفعيل حسابك.
        </p>
        <p className="text-xs text-neutral-400">
          بعد التفعيل، يمكنك{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
            تسجيل الدخول
          </Link>
        </p>
        <Button
          variant="outline"
          onClick={async (): Promise<void> => {
            try {
              const fbUser = getClientAuth().currentUser;
              if (fbUser) {
                const { sendEmailVerification: sendVerification } = await import("firebase/auth");
                await sendVerification(fbUser);
              }
            } catch { /* ignore */ }
          }}
        >
          إعادة إرسال رابط التفعيل
        </Button>
      </div>
    );
  }

  if (registered) {
    return <PreparingScreen onDone={handlePreparingDone} />;
  }

  const stepTitle = [
    "المعلومات الأساسية",
    "النظام التعليمي",
    "المرحلة التعليمية",
    "الصف الدراسي",
  ];

  const renderStep = (): ReactNode => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col gap-4">
            {isOAuth && verifiedEmail && (
              <div className="flex items-center gap-3 rounded-xl border-2 border-success-500/40 bg-success-500/5 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-500/10">
                  <Check className="h-5 w-5 text-success-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-neutral-200 break-all">{verifiedEmail}</span>
                  <span className="text-xs text-success-400">
                    {oauthProvider === "google" ? "✓ تم التحقق بواسطة Google" : "✓ تم التحقق بواسطة Apple"}
                  </span>
                </div>
              </div>
            )}
            <Input label="الاسم بالعربية" placeholder="أحمد حسن" value={fullName} onChange={(e): void => { setFullName(e.target.value); }} required />
            <Input label="الاسم بالإنجليزية" placeholder="Ahmed Hassan" value={englishName} onChange={(e): void => { setEnglishName(e.target.value); }} leftIcon={<Globe className="h-5 w-5" />} />
            <Input
              label="البريد الإلكتروني"
              type="email"
              placeholder="ahmed@example.com"
              value={email}
              onChange={(e): void => { setEmail(e.target.value); }}
              leftIcon={<Globe className="h-5 w-5" />}
            />
            <Input
              label="رقم الهاتف"
              type="tel"
              placeholder="01234567890"
              value={mobile}
              onChange={(e): void => { setMobile(e.target.value); }}
              onBlur={(): void => { setMobile(normalizeEgyptMobile(mobile)); }}
              leftIcon={<Phone className="h-5 w-5" />}
              required
            />
            <Input
              label="رقم ولي الأمر"
              type="tel"
              placeholder="01234567890"
              value={parentMobile}
              onChange={(e): void => { setParentMobile(e.target.value); }}
              onBlur={(): void => { setParentMobile(parentMobile ? normalizeEgyptMobile(parentMobile) : ""); }}
              leftIcon={<Phone className="h-5 w-5" />}
            />
            <Input
              label="كلمة المرور"
              type={showPassword ? "text" : "password"}
              placeholder="8 أحرف على الأقل"
              value={password}
              onChange={(e): void => { setPassword(e.target.value); }}
              leftIcon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button type="button" onClick={(): void => { setShowPassword(!showPassword); }} className="text-neutral-400 hover:text-neutral-600" aria-label={showPassword ? "إخفاء" : "إظهار"}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
              required
            />
            <Input label="تأكيد كلمة المرور" type={showPassword ? "text" : "password"} placeholder="أعد كتابة كلمة المرور" value={confirmPassword} onChange={(e): void => { setConfirmPassword(e.target.value); }} leftIcon={<Lock className="h-5 w-5" />} required />
            <GovernorateSelect value={governorate} onChange={setGovernorate} required />
            <Input label="المدرسة" placeholder="اسم المدرسة" value={school} onChange={(e): void => { setSchool(e.target.value); }} leftIcon={<Building2 className="h-5 w-5" />} />
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col gap-3">
            {EDUCATIONAL_SYSTEMS.map((sys) => {
              const Icon = sys.icon;
              return (
              <button
                key={sys.id}
                type="button"
                onClick={(): void => { setEducationalSystem(sys.id); }}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  educationalSystem === sys.id
                    ? "border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : "border-neutral-200 text-neutral-700 hover:border-primary-500/50 dark:border-neutral-700 dark:text-neutral-300"
                }`}
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                <span className="text-sm font-bold">{sys.label}</span>
              </button>
              );
            })}
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col gap-3">
            {EDUCATIONAL_STAGES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={(): void => { setEducationalStage(st.id); setGrade(""); }}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  educationalStage === st.id
                    ? "border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : "border-neutral-200 text-neutral-700 hover:border-primary-500/50 dark:border-neutral-700 dark:text-neutral-300"
                }`}
              >
                <GraduationCap className="h-5 w-5 shrink-0" />
                <span className="text-sm font-bold">{st.label}</span>
              </button>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col gap-3">
            {(GRADES[educationalStage] ?? []).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={(): void => { setGrade(g.id); }}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  grade === g.id
                    ? "border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : "border-neutral-200 text-neutral-700 hover:border-primary-500/50 dark:border-neutral-700 dark:text-neutral-300"
                }`}
              >
                <BookOpen className="h-5 w-5 shrink-0" />
                <span className="text-sm font-bold">{g.label}</span>
              </button>
            ))}
            {educationalStage === "" && (
              <p className="text-center text-sm text-neutral-400 py-4">يرجى اختيار المرحلة التعليمية أولاً</p>
            )}
          </div>
        );

    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card variant="elevated" padding="lg" className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500">
              <School className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                إنشاء حساب
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {stepTitle[step - 1]}
              </p>
            </div>
            <Badge variant="primary" className="text-[10px]">
              الخطوة {step} من {TOTAL_STEPS}
            </Badge>
          </div>
          <StepProgress current={step} total={TOTAL_STEPS} />
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-5">
            {renderStep()}

            {error && (
              <p className="rounded-xl bg-danger-500/10 px-4 py-3 text-sm text-danger-500">
                {error}
              </p>
            )}

            {!isOAuth && (
              <>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-neutral-400 dark:bg-neutral-900">أو</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={async (): Promise<void> => {
                    try {
                      setError(null);
                      setLoading(true);
                      await signInWithGoogle();

                      const fbUser = getClientAuth().currentUser;
                      if (fbUser) {
                        const token = await fbUser.getIdToken(true);
                        const meRes = await fetch("/api/v1/auth/me", {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const meData = await meRes.json();
                        if (meData.success && meData.data) {
                          router.push("/dashboard");
                          return;
                        }
                      }

                      const params = new URLSearchParams({ oauth: "google" });
                      if (fbUser?.email) params.set("email", fbUser.email);
                      router.replace(`/register?${params.toString()}`);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Google sign-in failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
              </>
            )}

            <div className="flex gap-3">
              {step > 1 && (
                <Button variant="outline" size="md" onClick={handleBack} disabled={loading}>
                  <ChevronRight className="h-5 w-5" />
                  السابق
                </Button>
              )}
              {step < 4 ? (
                <Button variant="primary" size="md" onClick={handleNext} fullWidth={step === 1}>
                  التالي
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={(): void => { void handleSubmit(); }}
                  loading={loading}
                >
                  <UserPlus className="h-5 w-5" />
                  إنشاء الحساب
                </Button>
              )}
            </div>

            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
