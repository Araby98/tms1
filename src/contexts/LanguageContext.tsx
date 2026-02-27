import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "fr" | "ar";

interface LanguageContextType {
  lang: Lang;
  toggle: () => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const translations: Record<string, Record<Lang, string>> = {
  // App name
  "app.name.prefix": { fr: "Mouv", ar: "حرك" },
  "app.name.suffix": { fr: "ement", ar: "ة" },
  
  // Landing
  "landing.hero.title": { fr: "Gérez vos mutations en toute simplicité", ar: "أدر تنقلاتك بكل سهولة" },
  "landing.hero.subtitle": { fr: "Plateforme de gestion des mouvements du personnel. Soumettez vos demandes et laissez le système détecter automatiquement les mutations mutuelles et cycliques.", ar: "منصة إدارة حركة الموظفين. قدم طلباتك ودع النظام يكتشف تلقائياً التبادلات الثنائية والدورية." },
  "landing.cta.start": { fr: "Commencer maintenant", ar: "ابدأ الآن" },
  "landing.cta.login": { fr: "J'ai déjà un compte", ar: "لدي حساب بالفعل" },
  "landing.how": { fr: "Comment ça marche ?", ar: "كيف يعمل؟" },
  "landing.mutual.title": { fr: "Mutation mutuelle", ar: "تبادل ثنائي" },
  "landing.mutual.desc": { fr: "Échange direct entre deux fonctionnaires de provinces différentes.", ar: "تبادل مباشر بين موظفين من إقليمين مختلفين." },
  "landing.cycle.title": { fr: "Mutation cyclique", ar: "تبادل دوري" },
  "landing.cycle.desc": { fr: "Rotation à trois : A→B, B→C, C→A détectée automatiquement.", ar: "دورة ثلاثية: أ→ب، ب→ج، ج→أ تُكتشف تلقائياً." },
  "landing.auto.title": { fr: "Détection automatique", ar: "اكتشاف تلقائي" },
  "landing.auto.desc": { fr: "Le système trouve les correspondances dès qu'une demande est soumise.", ar: "يجد النظام التطابقات فور تقديم الطلب." },
  "landing.track.title": { fr: "Suivi transparent", ar: "تتبع شفاف" },
  "landing.track.desc": { fr: "Consultez le statut de vos demandes en temps réel.", ar: "تابع حالة طلباتك في الوقت الفعلي." },
  "landing.footer": { fr: "Système de gestion des mutations", ar: "نظام إدارة التنقلات" },

  // Auth
  "auth.login": { fr: "Se connecter", ar: "تسجيل الدخول" },
  "auth.signup": { fr: "S'inscrire", ar: "إنشاء حساب" },
  "auth.logout": { fr: "Déconnexion", ar: "تسجيل الخروج" },
  "auth.email": { fr: "Email", ar: "البريد الإلكتروني" },
  "auth.password": { fr: "Mot de passe", ar: "كلمة المرور" },
  "auth.firstName": { fr: "Prénom", ar: "الاسم الشخصي" },
  "auth.lastName": { fr: "Nom", ar: "اسم العائلة" },
  "auth.grade": { fr: "Grade", ar: "الدرجة" },
  "auth.region": { fr: "Région", ar: "الجهة" },
  "auth.province": { fr: "Province d'origine", ar: "الإقليم الأصلي" },
  "auth.subtitle": { fr: "Système de gestion des mutations", ar: "نظام إدارة التنقلات" },
  "auth.no_account": { fr: "Pas encore inscrit ?", ar: "ليس لديك حساب؟" },
  "auth.has_account": { fr: "Déjà inscrit ?", ar: "لديك حساب بالفعل؟" },
  "auth.create_account": { fr: "Créer un compte", ar: "إنشاء حساب" },
  "auth.select_grade": { fr: "Sélectionner le grade", ar: "اختر الدرجة" },
  "auth.select_region": { fr: "Sélectionner la région", ar: "اختر الجهة" },
  "auth.select_province": { fr: "Sélectionner la province", ar: "اختر الإقليم" },
  "auth.choose_region_first": { fr: "Choisir d'abord une région", ar: "اختر الجهة أولاً" },
  "auth.admin_label": { fr: "Administrateur", ar: "مسؤول" },
  "auth.tech_label": { fr: "Technicien", ar: "تقني" },
  "auth.login_success": { fr: "Connexion réussie", ar: "تم تسجيل الدخول بنجاح" },
  "auth.signup_success": { fr: "Inscription réussie !", ar: "تم التسجيل بنجاح!" },

  // Nav
  "nav.dashboard": { fr: "Tableau de bord", ar: "لوحة التحكم" },
  "nav.transfer": { fr: "Demande de mutation", ar: "طلب تنقل" },
  "nav.profile": { fr: "Mon profil", ar: "ملفي الشخصي" },
  "nav.users": { fr: "Utilisateurs", ar: "المستخدمون" },
  "nav.approvals": { fr: "Approbations", ar: "الموافقات" },

  // Dashboard
  "dash.welcome": { fr: "Bienvenue,", ar: "مرحباً،" },
  "dash.province": { fr: "Province:", ar: "الإقليم:" },
  "dash.grade": { fr: "Grade:", ar: "الدرجة:" },
  "dash.users_count": { fr: "Utilisateurs", ar: "المستخدمون" },
  "dash.mutual_count": { fr: "Mutations mutuelles", ar: "التبادلات الثنائية" },
  "dash.cycle_count": { fr: "Mutations cycliques", ar: "التبادلات الدورية" },
  "dash.my_requests": { fr: "Mes demandes", ar: "طلباتي" },
  "dash.my_transfers": { fr: "Mes mutations", ar: "تنقلاتي" },
  "dash.no_requests": { fr: "Aucune demande pour le moment.", ar: "لا توجد طلبات حالياً." },
  "dash.matched": { fr: "Matchée", ar: "متطابقة" },
  "dash.pending": { fr: "En attente", ar: "قيد الانتظار" },
  "dash.approved": { fr: "Approuvée", ar: "مقبولة" },
  "dash.rejected": { fr: "Rejetée", ar: "مرفوضة" },
  "dash.mutual": { fr: "Mutation mutuelle", ar: "تبادل ثنائي" },
  "dash.cycle": { fr: "Mutation cyclique", ar: "تبادل دوري" },

  // Transfer request
  "transfer.title": { fr: "Demande de mutation", ar: "طلب تنقل" },
  "transfer.subtitle": { fr: "Indiquez votre destination souhaitée. Les mutations mutuelles et cycliques seront détectées automatiquement.", ar: "حدد وجهتك المطلوبة. سيتم الكشف عن التبادلات الثنائية والدورية تلقائياً." },
  "transfer.new": { fr: "Nouvelle demande", ar: "طلب جديد" },
  "transfer.current_at": { fr: "Vous êtes actuellement à", ar: "أنت حالياً في" },
  "transfer.where": { fr: "Où souhaitez-vous aller ?", ar: "إلى أين تريد الانتقال؟" },
  "transfer.dest": { fr: "Province de destination", ar: "إقليم الوجهة" },
  "transfer.select_province": { fr: "Sélectionner une province", ar: "اختر إقليماً" },
  "transfer.submit": { fr: "Soumettre", ar: "إرسال" },
  "transfer.my_requests": { fr: "Mes demandes", ar: "طلباتي" },

  // Profile
  "profile.title": { fr: "Mon profil", ar: "ملفي الشخصي" },
  "profile.subtitle": { fr: "Modifier vos informations personnelles.", ar: "تعديل معلوماتك الشخصية." },
  "profile.info": { fr: "Informations personnelles", ar: "المعلومات الشخصية" },
  "profile.update_below": { fr: "Mettez à jour votre profil ci-dessous.", ar: "حدّث ملفك الشخصي أدناه." },
  "profile.save": { fr: "Enregistrer les modifications", ar: "حفظ التعديلات" },

  // Users list
  "users.title": { fr: "Utilisateurs", ar: "المستخدمون" },
  "users.found": { fr: "trouvé", ar: "وُجد" },
  "users.filters": { fr: "Filtres", ar: "المرشحات" },
  "users.all": { fr: "Tous", ar: "الكل" },
  "users.all_f": { fr: "Toutes", ar: "الكل" },
  "users.name": { fr: "Nom", ar: "الاسم" },
  "users.dest_wished": { fr: "Destinations souhaitées", ar: "الوجهات المطلوبة" },
  "users.reset_filters": { fr: "Réinitialiser les filtres", ar: "إعادة تعيين المرشحات" },
  "users.none_found": { fr: "Aucun utilisateur trouvé", ar: "لم يتم العثور على مستخدمين" },

  // Approvals
  "approvals.title": { fr: "Approbations des mutations", ar: "الموافقة على التنقلات" },
  "approvals.subtitle": { fr: "Approuvez ou rejetez les mutations détectées.", ar: "وافق أو ارفض التنقلات المكتشفة." },
  "approvals.no_pending": { fr: "Aucune mutation en attente.", ar: "لا توجد تنقلات قيد الانتظار." },
  "approvals.approve": { fr: "Approuver", ar: "قبول" },
  "approvals.reject": { fr: "Rejeter", ar: "رفض" },
  "approvals.participants": { fr: "Participants", ar: "المشاركون" },
  "approvals.type": { fr: "Type", ar: "النوع" },
  "approvals.status": { fr: "Statut", ar: "الحالة" },
  "approvals.date": { fr: "Date", ar: "التاريخ" },
  "approvals.actions": { fr: "Actions", ar: "إجراءات" },
  "approvals.approved_success": { fr: "Mutation approuvée", ar: "تمت الموافقة على التنقل" },
  "approvals.rejected_success": { fr: "Mutation rejetée", ar: "تم رفض التنقل" },

  // Common
  "common.fill_all": { fr: "Veuillez remplir tous les champs", ar: "يرجى ملء جميع الحقول" },
  "common.unknown": { fr: "Inconnu", ar: "غير معروف" },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem("app_lang") as Lang) || "fr";
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("app_lang", lang);
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const toggle = () => setLang((l) => (l === "fr" ? "ar" : "fr"));

  const t = (key: string): string => {
    return translations[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggle, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
};
