import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { motion } from 'framer-motion';
import { SproutIcon, AwardIcon, ArrowRightIcon } from './ui/Icons';
import { useLanguage } from '../hooks/useLanguage';
import { VersionFooter } from './ui/VersionFooter';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

const WHATSAPP_NUMBER = '972544572858';
const WHATSAPP_MSG = encodeURIComponent('ראיתי את עמוד האודות של תחרות מצמיחה 🌱 ואשמח לשמוע עוד');

export const AboutPage: React.FC = () => {
    const { dir } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden" dir={dir}>
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-background via-primary/5 to-accent/5" />
                <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 w-full max-w-2xl mx-auto px-6 pt-8 md:px-8 md:pt-12 flex-1 pb-16 rtl:text-right ltr:text-left">

                {/* Back */}
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-bold text-sm group"
                    >
                        <ArrowRightIcon className="w-4 h-4 rtl:rotate-0 ltr:rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                        חזרה
                    </button>
                </MotionDiv>

                {/* ── HERO ── */}
                <MotionDiv initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-[#f8fafc] shadow-md flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                            <SproutIcon className="w-9 h-9 md:w-14 md:h-14 text-emerald-500" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
                            תחרות <span className="text-primary">מצמיחה</span> -<br />
                            <span className="text-amber-500">מפסיקים</span> לייצר מפסידים
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-base font-medium leading-relaxed max-w-xl">
                        כשהתחרות מודדת דירוג, המוטיבציה שייכת רק למי שנמצא בראש הטבלה. כשמעבירים את הפוקוס למדידת <strong className="text-foreground">שיפור</strong> - המוטיבציה הופכת לנחלת הכלל.
                    </p>
                </MotionDiv>

                {/* ── TESTIMONIAL ── */}
                <MotionDiv
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-10 border-r-4 border-primary pr-5 py-1"
                >
                    <p className="text-foreground text-base font-medium leading-relaxed italic">
                        "מדהים, אין מילים! עד כה 700 פעולות של לימוד תורה, תפילה וחסד. איזה עוצמה של אריות"
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground font-black uppercase tracking-wider">מבצע יתגבר כארי - הרב אבי שיש, ראש ישיבת אמית ברוכין</p>
                </MotionDiv>

                {/* ── THE PROBLEM ── */}
                <MotionDiv initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10">
                    <h2 className="text-xl font-black text-foreground mb-3">מה המחיר של תחרות רגילה?</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        תחרות של "סכום אפס" מייצרת מנצח אחד - ועשרים ותשעה תלמידים שמבינים מהר מאוד שהם לא הוא. עם הזמן, מי שלא בפסגה פשוט מפסיק לנסות. לא כי הוא חסר יכולת, אלא כי המערכת לימדה אותו שהסיכוי שלו לזכות בהכרה הוא אפסי.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { bad: 'מנצחים בודדים בטבלה', good: 'כל תלמיד מתחרה מול הגרסה הקודמת של עצמו' },
                            { bad: 'מי שמאחור - מאבד עניין', good: 'כל שיפור, קטן כגדול, מקבל במה ונחגג' },
                        ].map((row, i) => (
                            <React.Fragment key={i}>
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 rounded-xl p-3 flex items-center gap-2">
                                    <span className="text-red-400 shrink-0">✕</span>
                                    <span className="text-sm text-muted-foreground">{row.bad}</span>
                                </div>
                                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 rounded-xl p-3 flex items-center gap-2">
                                    <span className="text-green-500 shrink-0">✓</span>
                                    <span className="text-sm text-foreground font-medium">{row.good}</span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </MotionDiv>

                {/* ── PEDAGOGY ── */}
                <MotionDiv initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
                    <h2 className="text-xl font-black text-foreground mb-3">הגישה הפדגוגית: להפוך הצלחה אישית לכוח קהילתי</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        הפלטפורמה נשענת על עקרונות גישת ה-PBIS (חיזוק התנהגות חיובית): כאשר נותנים חיזוקים חיובי ומפנים זרקור אל הטוב בנוסף, או לצד קנס או ענישה על הדרוש תיקון, האקלים הבית-ספרי משתנה מהקצה אל הקצה. המערכת מפעילה שתי שכבות פסיכולוגיות מקבילות:
                    </p>
                    <div className="space-y-3">
                        <div className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">🏅</div>
                            <div>
                                <div className="font-black text-foreground text-sm mb-1">ניצחון מול עצמך</div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    הניקוד האישי של התלמיד עולה כשהוא מתאמץ ומשתפר. הגאווה היא על הדרך ועל העבודה הקשה, לא על הדירוג ביחס לאחרים.
                                </p>
                            </div>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">🌍</div>
                            <div>
                                <div className="font-black text-foreground text-sm mb-1">תרומה למשהו גדול יותר</div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    כל נקודה אישית דוחפת את הכיתה כולה, ואת בית-הספר כולו, לעבר יעד משותף. ההישג של היחיד מפסיק להיות אנוכי והופך לחלק מהצלחה של קהילה שלמה.
                                </p>
                            </div>
                        </div>
                    </div>
                </MotionDiv>

                {/* ── HOW IT COMES TO LIFE ── */}
                <MotionDiv initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-10">
                    <h2 className="text-xl font-black text-foreground mb-1">איך זה עובד בשטח?</h2>
                    <p className="text-muted-foreground text-sm mb-4">שלושה כלים טכנולוגיים שהופכים את התיאוריה למציאות יומיומית - בלי להוסיף עומס על הצוות.</p>
                    <div className="space-y-3">
                        {[
                            {
                                emoji: '📺',
                                title: 'לוח תוצאות - בית-הספר מדבר',
                                text: 'לוח דירוג חי על מסכי הטלוויזיה וגם בטלפונים חכמים ומחשבים. כל עלייה בניקוד מלווה באנימציה, צליל, ואפשרות לפרשן AI בזמן אמת*. התלמידים רואים את המאמץ שלהם מקבל הכרה פומבית.',
                            },
                            {
                                emoji: '🎯',
                                title: 'יעדים ושלבים - המאמץ המשותף',
                                text: 'במקום פרס רק למנצח בודד, היעד המשותף מוצג כתמונה מוסתרת. כל נקודה שנצברת חושפת עוד חלק מהפאזל. הניצחון שייך לכולם יחד.',
                            },
                            {
                                emoji: '🎡',
                                title: 'גלגל המזל - כולם נשארים במשחק',
                                text: 'הגרלות חיות בבית-הספר או בבית שבהן כל נקודה שווה כרטיס נוסף, או חלוקה שוויונית לחלוטין. המסך מסתובב והמתח מורגש בכל הכיתה.',
                            },
                        ].map(tool => (
                            <div key={tool.title} className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 text-xl">{tool.emoji}</div>
                                <div>
                                    <div className="font-black text-foreground text-sm mb-1">{tool.title}</div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{tool.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground/50 mt-2 px-1">* פרשן AI בזמן אמת זמין בתוספת תשלום.</p>
                </MotionDiv>

                {/* ── FOR THE PRINCIPAL ── */}
                <MotionDiv initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10 bg-muted/50 border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <AwardIcon className="w-5 h-5 text-primary shrink-0" />
                        <h2 className="text-xl font-black text-foreground">השורה האחרונה למנהלים/ות</h2>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        פחות התעסקות במשמעת, יותר תחושת שייכות. תלמידים שפותחים את הבוקר בשאלה "כמה נקודות חסרות לכיתה שלנו?" הם תלמידים שאכפת להם. המערכת גמישה לחלוטין (לתחרות שבועית, חודשית או שנתית) ומותאמת למידות של כל מוסד חינוכי.
                    </p>
                </MotionDiv>

                {/* ── CTA ── */}
                <MotionDiv initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 md:p-8 shadow-xl text-white mb-8">
                    <h2 className="text-xl font-black mb-1">בואו נצמיח יחד את דור המחר 🌱</h2>
                    <p className="text-white/90 text-sm mb-5">דקות ספורות - ותבינו למה זה עובד. ללא התחייבות.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* WhatsApp */}
                        <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20c05c] text-white rounded-xl px-5 py-3 font-black text-sm transition-colors flex-1 shadow-lg shadow-black/20"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
                        >
                            <svg className="w-5 h-5 shrink-0 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            שלח הודעה בוואטסאפ
                        </a>
                        {/* Demo */}
                        <button
                            onClick={() => navigate('/demo')}
                            className="flex items-center justify-center gap-2.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-xl px-5 py-3 font-black text-sm transition-colors flex-1 shadow-lg shadow-black/20"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
                        >
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400"></span>
                            </span>
                            שחק בהדגמה חיה
                        </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-start gap-4 text-white text-sm">
                        <img src="/profile.jpeg" alt="אריאל גליל" className="w-12 h-12 rounded-full object-cover border-2 border-white/40 shrink-0" />
                        <div className="flex flex-col gap-1 min-w-0">
                            <span className="font-black text-white">אריאל גליל · מנהל מוצר ו<a href="https://galilbio.wordpress.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/70 transition-colors">מורה</a></span>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 font-black leading-snug">
                                <a href="tel:0544572858" className="hover:text-white/70 transition-colors" dir="ltr">054-457-2858</a>
                                <span className="hidden sm:inline">·</span>
                                <a href="mailto:ariel.galil.work@gmail.com" className="hover:text-white/70 transition-colors break-all" dir="ltr">ariel.galil.work@gmail.com</a>
                            </div>
                        </div>
                    </div>
                </MotionDiv>


            </main>

            <div className="mt-auto relative z-10">
                <VersionFooter />
            </div>
        </div>
    );
};

export default AboutPage;
