import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { motion } from 'framer-motion';
import { SproutIcon, AwardIcon, ArrowRightIcon } from './ui/Icons';
import { useLanguage } from '../hooks/useLanguage';
import { VersionFooter } from './ui/VersionFooter';

const { useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

const WHATSAPP_NUMBER = '972544572858';
const WHATSAPP_MSG = encodeURIComponent('ראיתי את פלטפורמת תחרות מצמיחה 🌱 ואשמח לשמוע עוד פרטים');

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number }> = ({ icon, title, children, delay = 0 }) => (
    <MotionDiv
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-card border border-border rounded-[var(--radius-container)] p-6 md:p-8 shadow-sm"
    >
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {icon}
            </div>
            <h2 className="text-lg md:text-xl font-black text-foreground">{title}</h2>
        </div>
        <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </MotionDiv>
);

export const AboutPage: React.FC = () => {
    const { dir } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="min-h-full flex flex-col bg-background text-foreground overflow-x-hidden" dir={dir}>
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-background via-primary/5 to-accent/5" />
                <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 w-full max-w-3xl mx-auto px-6 pt-8 md:px-8 md:pt-12 flex-1 pb-12 rtl:text-right ltr:text-left">
                {/* Back button */}
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-bold text-sm group"
                    >
                        <ArrowRightIcon className="w-4 h-4 rtl:rotate-0 ltr:rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                        חזרה לרשימת התחרויות
                    </button>
                </MotionDiv>

                {/* Header */}
                <MotionDiv initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-5 mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-xl flex items-center justify-center shrink-0 ring-4 ring-emerald-400/30">
                        <SproutIcon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
                            מהי תחרות <span className="text-primary">מצמיחה</span>?
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base font-medium mt-1">
                            גמיפיקציה בית-ספרית שמניעה צמיחה אמיתית
                        </p>
                    </div>
                </MotionDiv>

                {/* Sections */}
                <div className="space-y-5">

                    {/* Philosophy */}
                    <Section
                        icon={<SproutIcon className="w-5 h-5" />}
                        title="המהפכה הפדגוגית - תחרות שכולם מנצחים בה"
                        delay={0.1}
                    >
                        <p>
                            במערכת החינוך המסורתית, תחרות היא משחק סכום אפס: יש מנצח אחד, וכל השאר מרגישים מאחור.
                            Win2Grow נולדה כדי לשנות את המשוואה.{' '}
                            <strong className="text-foreground">אנחנו לא יוצרים תחרות של "מי הכי טוב" - אלא "תחרות מצמיחה"</strong>:
                            זירה שבה כל תלמיד וכל קבוצה נמדדים מול עצמם, וההצלחה של היחיד מזינה את ההצלחה של הכלל.
                        </p>
                        <p>
                            מחקרים בפסיכולוגיה חינוכית (Dweck, SDT) מראים שתחרות המבוססת על{' '}
                            <strong className="text-foreground">שיפור אישי ולא על השוואה לאחרים</strong> מייצרת מוטיבציה פנימית, מפחיתה חרדת ביצוע ומגבירה מעורבות לאורך זמן.
                        </p>
                    </Section>

                    {/* Three pillars */}
                    <Section
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        }
                        title="שלושת עמודי התווך של החזון"
                        delay={0.15}
                    >
                        <div className="space-y-4 mt-1">
                            {/* PBIS */}
                            <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🌟</span>
                                    <div className="font-black text-foreground text-sm">שיפור אקלים בית-הספר דרך חיזוקים חיוביים (PBIS)</div>
                                </div>
                                <p className="text-xs leading-relaxed">
                                    המערכת הופכת את הערכים הפדגוגיים שלכם למציאות ויזואלית. במקום לעסוק בכיבוי שריפות, Win2Grow מאירה בזרקור את ההתנהגויות החיוביות, ההתמדה והשיפור. כשתלמידים רואים את הניקוד שלהם עולה בזמן אמת על מסכי הקיוסק במסדרונות - נוצרת שפה משותפת של גאווה ופרגון.
                                </p>
                            </div>
                            {/* Mission Meter */}
                            <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🎯</span>
                                    <div className="font-black text-foreground text-sm">מד היעד - כוחה של חשיפה משותפת</div>
                                </div>
                                <p className="text-xs leading-relaxed">
                                    אחד הכלים הייחודיים שלנו הוא ה-<strong className="text-foreground">Mission Meter</strong>: מנגנון ויזואלי שבו יעד מוסדי גדול מיוצג על ידי תמונה מוסתרת. <strong className="text-foreground">כל נקודה שנוספת -חושפת עוד חלק מהתמונה.</strong> התלמידים מבינים שרק שיתוף פעולה של כולם יחשוף את ה"פרס הגדול". ההישג האישי הופך לתרומה קהילתית.
                                </p>
                            </div>
                            {/* Lucky Wheel */}
                            <div className="bg-muted/40 rounded-xl p-4 border border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🎡</span>
                                    <div className="font-black text-foreground text-sm">הוגנות והכלה - גלגל המזל המשוקלל</div>
                                </div>
                                <p className="text-xs leading-relaxed">
                                    בWin2Grow, הדירוג בטבלה אינו סוף פסוק. גלגל המזל שלנו מחשב הסתברויות כך שכל נקודה שנצברת מעלה את "משקל" הכרטיס של התלמיד בהגרלה. <strong className="text-foreground">גם תלמיד שנמצא במקום ה-20 נשאר מעורב ובעל מוטיבציה</strong> - כי הוא יודע שהמאמץ שלו קיים ושהוא עדיין "במשחק".
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* Three layers */}
                    <Section
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        }
                        title="שלוש שכבות תחרות במקביל"
                        delay={0.2}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                            {[
                                {
                                    emoji: '🧑',
                                    title: 'אישי',
                                    desc: 'כל תלמיד צובר נקודות ורואה את הדירוג האישי שלו - מהטלפון, מהמחשב, מהמסך בכיתה.'
                                },
                                {
                                    emoji: '🏫',
                                    title: 'כיתתי',
                                    desc: 'הכיתה מתחרה כצוות. מחנכים מוסיפים נקודות ומגדירים יעד כיתתי שכולם עובדים יחד להשיגו.'
                                },
                                {
                                    emoji: '🌱',
                                    title: 'מוסדי',
                                    desc: 'כל בית הספר מתקדם יחד לעבר יעדים מוסדיים עם מערכת שלבים ופרסים מוגדרים מראש.'
                                }
                            ].map(l => (
                                <div key={l.title} className="bg-muted/40 rounded-xl p-4 flex flex-col gap-2">
                                    <span className="text-2xl">{l.emoji}</span>
                                    <div className="font-black text-foreground text-sm">{l.title}</div>
                                    <div className="text-xs leading-relaxed">{l.desc}</div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* How it works */}
                    <Section
                        icon={<AwardIcon className="w-5 h-5" />}
                        title="איך זה עובד בפועל?"
                        delay={0.3}
                    >
                        <ul className="space-y-2 list-none">
                            {[
                                { num: '1', text: 'המחנך מוסיף נקודות לתלמיד או לכיתה דרך ממשק פשוט - מהטלפון, תוך שניות.' },
                                { num: '2', text: 'הלוח מתעדכן בזמן אמת על המסכים בבית הספר. תלמידים יכולים לעקוב גם מהטלפון החכם שלהם.' },
                                { num: '3', text: 'כל עלייה בדירוג מלווה בחגיגה - אנימציה, צליל, ופרשן AI שמדבר על הרגע.' },
                                { num: '4', text: 'הכיתה והמוסד מתקדמים לשלבים - כל שלב שמושג מציג חגיגה על כל המסכים.' },
                                { num: '5', text: 'גלגל מזל להגרלת תלמידים מצטיינים ממחיש שכל נקודה שווה - גם ממקום האמצע.' },
                            ].map(item => (
                                <li key={item.num} className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{item.num}</span>
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    {/* Kiosk / Live presence */}
                    <Section
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        }
                        title="נוכחות דיגיטלית חיה - מסך הקיוסק"
                        delay={0.35}
                    >
                        <p>
                            Win2Grow לא "כלואה" בתוך המחשב של המורה. היא <strong className="text-foreground">חיה על מסכי הטלוויזיה בבית הספר</strong>.
                            מצב הקיוסק הדינמי מציג את קריין ה-AI שמפרש את האירועים, את הטבלאות המשתנות ואת התקדמות היעד המשותף —
                            והופך את מסדרונות בית הספר לזירה אקטיבית של צמיחה.
                        </p>
                        <p>
                            התצוגה מתחלפת אוטומטית בין לוח הדירוג, מד היעד המשותף ואירועי השיא, ללא צורך בהתערבות מורה.
                        </p>
                    </Section>

                    {/* Features */}
                    <Section
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        }
                        title="תכונות מרכזיות"
                        delay={0.4}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                            {[
                                { emoji: '📱', label: 'נגיש מהטלפון', desc: 'תלמידים רואים את הדירוג האישי, הכיתתי והמוסדי בכל מקום' },
                                { emoji: '🎉', label: 'חוגגים כל עלייה', desc: 'אנימציות וצלילים על כל שינוי חיובי - לא רק לראשונים' },
                                { emoji: '🤖', label: 'פרשן AI', desc: 'פרשנות חכמה בזמן אמת על אירועי ניקוד מרגשים' },
                                { emoji: '🎯', label: 'שלבים ויעדים', desc: 'מטרות מוסדיות וכיתתיות עם חגיגות מובנות לכל השגה' },
                                { emoji: '🎡', label: 'גלגל מזל', desc: 'הגרלת תלמידים - גם ממקום האמצע יש סיכוי לזכות' },
                                { emoji: '📺', label: 'מסך קיוסק', desc: 'תצוגה אוטומטית מרהיבה לטלוויזיה של בית הספר' },
                                { emoji: '📊', label: 'לוח ניהול', desc: 'מנהל, מחנך וסגל - כל אחד עם ממשק מותאם לתפקידו' },
                                { emoji: '🏆', label: 'היסטוריית זכיות', desc: 'תיעוד כל הזוכים, הכיתות המובילות ואירועי השיא' },
                            ].map(f => (
                                <div key={f.label} className="flex items-start gap-3 bg-muted/40 rounded-xl p-3">
                                    <span className="text-xl">{f.emoji}</span>
                                    <div>
                                        <div className="font-black text-foreground text-sm">{f.label}</div>
                                        <div className="text-xs text-muted-foreground">{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* For the principal */}
                    <Section
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        title="השורה התחתונה למנהל/ת"
                        delay={0.45}
                    >
                        <p>
                            Win2Grow היא לא רק כלי לניהול ניקוד.{' '}
                            <strong className="text-foreground">היא מנוע לשינוי תרבותי.</strong>{' '}
                            היא רותמת את הכלים הטכנולוגיים המתקדמים ביותר - מחישובי הסתברות לכיול ויזואלי ועד בינה מלאכותית - כדי לשרת מטרה אחת: לגרום לכל ילד להרגיש שהוא יכול לצמוח, לתרום ולהצליח.
                        </p>
                        <p>
                            מחקרים מראים ששיטת ה-PBIS (חיזוק התנהגות חיובית) מפחיתה אירועי משמעת ומשפרת את הישגי התלמידים —
                            ותחרות מצמיחה בנויה על אותם עקרונות, עם אריזה שתלמידים אוהבים.
                            המערכת גמישה לתחרויות שבועיות, חודשיות ושנתיות, ומותאמת לכל גודל מוסד.
                        </p>
                        <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-base font-black text-foreground">בואו נצמיח יחד את דור המחר. 🌱</p>
                        </div>
                    </Section>

                    {/* Contact / Sales */}
                    <MotionDiv
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.4 }}
                        className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[var(--radius-container)] p-6 md:p-8 shadow-xl text-white"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-black">מעוניינים? דברו איתנו</h2>
                                <p className="text-white/70 text-xs font-medium">אריאל ישמח לענות על כל שאלה</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Phone */}
                            <a
                                href="tel:0544572858"
                                className="flex items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-4 py-3 transition-colors group flex-1"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div className="rtl:text-right ltr:text-left">
                                    <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">טלפון</div>
                                    <div className="font-black text-sm tracking-wide" dir="ltr">054-457-2858</div>
                                </div>
                            </a>

                            {/* WhatsApp */}
                            <a
                                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-4 py-3 transition-colors group flex-1"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                </div>
                                <div className="rtl:text-right ltr:text-left">
                                    <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">וואטסאפ</div>
                                    <div className="font-black text-sm">שלח הודעה</div>
                                </div>
                            </a>

                            {/* Email */}
                            <a
                                href="mailto:ariel.galil.work@gmail.com"
                                className="flex items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl px-4 py-3 transition-colors group flex-1"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="rtl:text-right ltr:text-left min-w-0">
                                    <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">אימייל</div>
                                    <div className="font-black text-sm truncate" dir="ltr">ariel.galil.work@gmail.com</div>
                                </div>
                            </a>
                        </div>
                    </MotionDiv>
                </div>

                {/* CTA */}
                <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-[var(--radius-main)] font-black shadow-lg hover:shadow-xl hover:brightness-110 transition-all active:scale-95"
                    >
                        <ArrowRightIcon className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                        לרשימת התחרויות
                    </button>
                </MotionDiv>
            </main>

            <div className="mt-auto relative z-10">
                <VersionFooter />
            </div>
        </div>
    );
};

export default AboutPage;
