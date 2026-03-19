import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalculatorIcon, ClockIcon, RefreshIcon, SettingsIcon, TargetIcon, UsersIcon, WheelIcon } from '@/components/ui/Icons';
import { AlertIcon, CheckIcon, SearchIcon } from '@/components/ui/Icons';
import { WorkspaceLayout } from '@/components/layouts/WorkspaceLayout';
import { LiteStudentCard } from '@/components/lite/LiteStudentCard';
import { LiteActionDock } from '@/components/lite/LiteActionDock';
import { AdminSectionCard } from '@/components/ui/AdminSectionCard';
import { GoalsManagement } from '@/components/admin/GoalsManagement';
import { ActionLogPanel } from '@/components/admin/ActionLogPanel';
import { SaveNotificationProvider } from '@/contexts/SaveNotificationContext';
import { Settings, Target, Users } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDemoContext } from './DemoContext';
import { useDemoScoreEntry } from './useDemoScoreEntry';
import { DemoSettingsTab } from './DemoSettingsTab';
import { DemoClassesTab } from './DemoClassesTab';
import { NavItem } from '@/components/layouts/WorkspaceLayout';
import { CompetitionGoal } from '@/types';

const MotionDiv = motion.div as any;

// ── Loading fallback ──────────────────────────────────────────────────────────

const LoadingTab = () => (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-muted)] opacity-50">
        <RefreshIcon className="w-10 h-10 animate-spin" />
    </div>
);

// ── Points tab ────────────────────────────────────────────────────────────────

const CLASS_ENTITY_ID = 'CLASS_ENTITY';

const DemoPointsEntry: React.FC = () => {
    const { t: tFn } = useLanguage();
    const demoScore = useDemoScoreEntry(null);
    const {
        selectedClassId, setSelectedClassId, selectedStudentIds,
        currentClass, filteredStudents, selectionLabel,
        searchTerm, setSearchTerm, isProcessing, toast,
        toggleSelection, clearSelection, submitPoints,
        classes, settings,
    } = demoScore;

    const sortedClasses = [...classes].sort((a, b) => a.name.localeCompare(b.name, 'he'));
    const isGlobalSearch = searchTerm.length >= 2;
    const globalSearchStudents = isGlobalSearch
        ? sortedClasses
              .flatMap(c => (c.students ?? []).map(s => ({ ...s, className: c.name, classId: c.id })))
              .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .sort((a, b) => a.name.localeCompare(b.name, 'he'))
        : [];

    const handleGlobalToggle = (studentId: string, classId: string) => {
        if (classId !== selectedClassId) {
            clearSelection();
            setSelectedClassId(classId);
        }
        toggleSelection(studentId);
    };

    return (
        <div className="space-y-[var(--admin-section-gap)] w-full">
            <AdminSectionCard title={tFn('tab_points')} icon={<SearchIcon className="w-6 h-6" />}>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1">
                        <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">{tFn('group_label')}</label>
                        <div className="relative">
                            <select
                                value={selectedClassId || ''}
                                onChange={e => { setSelectedClassId(e.target.value); clearSelection(); }}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[var(--fs-base)] appearance-none font-[var(--fw-medium)]"
                            >
                                {!selectedClassId && <option value="" className="bg-[var(--bg-card)]">{tFn('select_group_placeholder')}</option>}
                                {sortedClasses.map(c => <option key={c.id} value={c.id} className="bg-[var(--bg-card)]">{c.name}</option>)}
                            </select>
                            <div className="absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] opacity-50 text-[var(--fs-sm)]">▼</div>
                        </div>
                    </div>
                    <div className="relative flex-1">
                        <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            {isGlobalSearch ? tFn('search_all_groups') || 'חיפוש בכל הקבוצות' : tFn('search_student_placeholder')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={tFn('search_student_placeholder')}
                                className={`w-full px-4 py-3 rounded-[var(--radius-main)] border bg-[var(--bg-input)] text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[var(--fs-base)] font-[var(--fw-medium)] ps-11 placeholder:text-[var(--text-muted)] opacity-80 ${isGlobalSearch ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-[var(--border-main)]'}`}
                            />
                            <SearchIcon className={`absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isGlobalSearch ? 'text-indigo-500 opacity-100' : 'text-[var(--text-muted)] opacity-50'}`} />
                        </div>
                    </div>
                </div>
            </AdminSectionCard>

            <AdminSectionCard title={selectionLabel || tFn('students_label')} className="flex-1 min-h-[400px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {isGlobalSearch ? (
                        globalSearchStudents.map(student => (
                            <LiteStudentCard key={student.id} id={student.id} name={student.name} score={student.score}
                                isSelected={selectedStudentIds.has(student.id)}
                                onToggle={id => handleGlobalToggle(id, student.classId)}
                                subtitle={student.className}
                            />
                        ))
                    ) : (
                        <>
                            {currentClass && (
                                <LiteStudentCard id={CLASS_ENTITY_ID} name={currentClass.name} score={currentClass.score}
                                    isSelected={selectedStudentIds.has(CLASS_ENTITY_ID)} onToggle={toggleSelection} isClassEntity />
                            )}
                            {filteredStudents.map(student => (
                                <LiteStudentCard key={student.id} id={student.id} name={student.name} score={student.score}
                                    isSelected={selectedStudentIds.has(student.id)} onToggle={toggleSelection} />
                            ))}
                        </>
                    )}
                </div>
                {isGlobalSearch && globalSearchStudents.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-4 opacity-60">
                        <SearchIcon className="w-16 h-16" />
                        <span className="font-[var(--fw-bold)] text-[var(--fs-lg)]">{tFn('no_students_found')}</span>
                    </div>
                )}
                {!isGlobalSearch && filteredStudents.length === 0 && selectedClassId && (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-4 opacity-60">
                        <SearchIcon className="w-16 h-16" />
                        <span className="font-[var(--fw-bold)] text-[var(--fs-lg)]">{tFn('no_students_found')}</span>
                    </div>
                )}
                {!isGlobalSearch && !selectedClassId && (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-4 opacity-60">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] flex items-center justify-center border border-[var(--border-subtle)]">
                            <span className="text-[var(--fs-xl)]">?</span>
                        </div>
                        <span className="font-[var(--fw-bold)] text-[var(--fs-lg)]">{tFn('select_group_to_start')}</span>
                    </div>
                )}
            </AdminSectionCard>

            <div className="relative mt-auto">
                <LiteActionDock
                    selectedCount={selectedStudentIds.size}
                    selectionLabel={selectionLabel}
                    presets={settings.score_presets || []}
                    onAction={(pts, note) => submitPoints(pts, 'מנהל הדגמה', note)}
                    onClear={clearSelection}
                    isProcessing={isProcessing}
                />
            </div>

            <AnimatePresence>
                {toast && (
                    <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0 }}
                        className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-[var(--fw-bold)] bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center gap-3 backdrop-blur-xl ${toast.type === 'success' ? 'text-[var(--status-success-text)]' : 'text-[var(--status-error-text)]'}`}>
                        {toast.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <AlertIcon className="w-5 h-5" />}
                        {toast.msg}
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Goals tab ─────────────────────────────────────────────────────────────────

const DemoGoalsTab: React.FC = () => {
    const { settings, classes, updateSettings, updateClass } = useDemoContext();
    const totalScore = classes.reduce((sum, c) => sum + c.score, 0);

    const handleUpdateSettings = useCallback(async (goals: CompetitionGoal[], gridSize: number) => {
        updateSettings({ goals_config: goals, hex_grid_size: gridSize });
    }, [updateSettings]);

    const handleUpdateClassTarget = useCallback(async (classId: string, targetScore: number) => {
        updateClass(classId, { target_score: targetScore });
    }, [updateClass]);

    return (
        <div className="pb-12">
            <GoalsManagement
                settings={settings}
                classes={classes}
                totalInstitutionScore={totalScore}
                onUpdateSettings={handleUpdateSettings}
                onUpdateClassTarget={handleUpdateClassTarget}
            />
        </div>
    );
};

// ── Logs tab ──────────────────────────────────────────────────────────────────

const DemoLogsTab: React.FC = () => {
    const { logs, settings, campaign, classes, deleteLog, updateLog } = useDemoContext();

    return (
        <div className="pb-12 h-full">
            <ActionLogPanel
                logs={logs}
                onLoadMore={() => {}}
                onDelete={deleteLog}
                onUpdate={updateLog}
                currentUser={DEMO_PROFILE}
                settings={settings}
                campaign={campaign}
                classes={classes}
                isAdmin
                onSave={async () => {}}
            />
        </div>
    );
};

// ── Lucky Wheel tab ───────────────────────────────────────────────────────────

const DemoWheelTab: React.FC = () => {
    const { classes, wheel, activateWheel, spinWheel, deactivateWheel } = useDemoContext();
    const navigate = useNavigate();
    const [selectedPool, setSelectedPool] = useState<'all' | string>('all');

    const participants = useMemo(() => {
        if (selectedPool === 'all') {
            return classes.flatMap(c => c.students).map(s => s.name);
        }
        const cls = classes.find(c => c.id === selectedPool);
        return cls?.students.map(s => s.name) ?? [];
    }, [classes, selectedPool]);

    const handleActivate = () => activateWheel(participants);

    return (
        <div className="space-y-[var(--admin-section-gap)] w-full pb-12">
            {!wheel.isActive ? (
                <AdminSectionCard
                    title="הפעלת גלגל המזל"
                    icon={<span className="text-2xl">🎡</span>}
                >
                    <p className="text-[var(--text-muted)] text-sm mb-4">
                        בחר קבוצת משתתפים, לחץ "הפעל" - הגלגל יופיע מיד על מסך הלוח. עבור ללוח הפעיל כדי לראות אותו.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                משתתפים
                            </label>
                            <select
                                value={selectedPool}
                                onChange={e => setSelectedPool(e.target.value)}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[var(--fs-base)] appearance-none"
                            >
                                <option value="all">כל התלמידים ({participants.length})</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.students.length} תלמידים)</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                            <span className="text-[var(--text-muted)] text-sm">👥 {participants.length} משתתפים נבחרו</span>
                        </div>

                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={handleActivate}
                                disabled={participants.length < 2}
                                className="px-6 py-3 rounded-[var(--radius-main)] font-[var(--fw-bold)] text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg"
                            >
                                🎡 הפעל גלגל
                            </button>
                            <button
                                onClick={() => navigate('/demo')}
                                className="px-6 py-3 rounded-[var(--radius-main)] font-[var(--fw-bold)] text-sm bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow"
                            >
                                עבור ללוח →
                            </button>
                        </div>
                    </div>
                </AdminSectionCard>
            ) : (
                <AdminSectionCard
                    title="גלגל המזל פעיל"
                    icon={<span className="text-2xl">🎡</span>}
                >
                    <p className="text-[var(--text-muted)] text-sm mb-4">
                        הגלגל מוצג כעת על מסך הלוח עם <strong>{wheel.participants.length}</strong> משתתפים.
                    </p>

                    <div className="flex flex-wrap gap-3 mb-6">
                        {wheel.winnerIndex === null ? (
                            <>
                                <button
                                    onClick={spinWheel}
                                    className="px-6 py-3 rounded-[var(--radius-main)] font-[var(--fw-bold)] text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-lg animate-pulse"
                                >
                                    🎲 סובב!
                                </button>
                                <button
                                    onClick={() => navigate('/demo')}
                                    className="px-6 py-3 rounded-[var(--radius-main)] font-[var(--fw-bold)] text-sm bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow"
                                >
                                    עבור ללוח →
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <span className="text-2xl">🏆</span>
                                <div>
                                    <p className="font-bold text-amber-300 text-sm">הזוכה:</p>
                                    <p className="font-black text-white text-lg">{wheel.winnerName}</p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={deactivateWheel}
                            className="px-6 py-3 rounded-[var(--radius-main)] font-[var(--fw-bold)] text-sm bg-slate-600/30 text-slate-300 hover:bg-slate-600/50 border border-slate-500/40 transition-colors"
                        >
                            סגור גלגל
                        </button>
                    </div>

                    {wheel.winnerIndex !== null && (
                        <button
                            onClick={spinWheel}
                            className="px-6 py-3 rounded-[var(--radius-main)] font-[var(--fw-bold)] text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow"
                        >
                            🔄 סיבוב נוסף
                        </button>
                    )}
                </AdminSectionCard>
            )}
        </div>
    );
};

// ── Simulation controls ───────────────────────────────────────────────────────

const SimulationBar: React.FC = () => {
    const navigate = useNavigate();
    const { isSimulationRunning, toggleSimulation, reset } = useDemoContext();

    return (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
                <p className="font-bold text-amber-300 text-sm">מצב הדגמה - נתוני אימון בלבד</p>
                <p className="text-amber-300/70 text-xs mt-0.5">שינויים מתבטאים מיידית בלוח הניהול</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button onClick={toggleSimulation}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isSimulationRunning ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40' : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/40'}`}>
                    {isSimulationRunning ? 'השהה סימולציה' : 'חדש סימולציה'}
                </button>
                <button onClick={reset}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 border border-slate-500/40 transition-colors">
                    איפוס
                </button>
                <button onClick={() => navigate('/demo')}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow">
                    צפה בלוח
                </button>
            </div>
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────

type TabId = 'settings' | 'points' | 'goals' | 'data-management' | 'logs' | 'lucky-wheel';

const NAV_ITEMS: NavItem[] = [
    { id: 'settings', label: 'הגדרות', icon: Settings },
    { id: 'data-management', label: 'כיתות ותלמידים', icon: Users },
    { id: 'goals', label: 'יעדים', icon: Target },
    { id: 'points', label: 'הוספת נקודות', icon: CalculatorIcon },
    { id: 'lucky-wheel', label: 'גלגל מזל', icon: WheelIcon },
    { id: 'logs', label: 'יומן פעילות', icon: ClockIcon },
];

const HEADER_CONFIG: Record<TabId, { icon: any; title: string; desc: string }> = {
    settings: { icon: SettingsIcon, title: 'הגדרות תחרות', desc: 'עיצוב, מיתוג, הודעות ועוד' },
    'data-management': { icon: UsersIcon, title: 'כיתות ותלמידים', desc: 'הוסף, ערוך ומחק כיתות ותלמידים' },
    goals: { icon: TargetIcon, title: 'יעדים', desc: 'הגדר יעדים ומדדי הצלחה' },
    points: { icon: CalculatorIcon, title: 'הוספת נקודות', desc: 'הוסף נקודות לתלמידים וכיתות' },
    'lucky-wheel': { icon: WheelIcon, title: 'גלגל המזל', desc: 'הפעל גלגל ובחר זוכה אקראי' },
    logs: { icon: ClockIcon, title: 'יומן פעילות', desc: 'היסטוריית הנקודות שנוספו' },
};

const DEMO_USER = { full_name: 'מנהל הדגמה', initials: 'מה', roleLabel: 'הדגמה' };
const DEMO_PROFILE = { id: 'demo-user', email: 'demo@demo.com', role: 'admin' as const, class_id: null, full_name: 'מנהל הדגמה' };

const DemoAdminInner: React.FC = () => {
    const navigate = useNavigate();
    const { settings } = useDemoContext();
    const [activeTab, setActiveTab] = useState<TabId>('settings');
    const header = HEADER_CONFIG[activeTab];

    const breadcrumbs = useMemo(() => [
        { label: 'ניהול הדגמה', href: '/demo/admin' },
        { label: header.title },
    ], [header.title]);

    return (
        <WorkspaceLayout
            navItems={NAV_ITEMS}
            activeTab={activeTab}
            onTabChange={tab => setActiveTab(tab as TabId)}
            onLogout={() => navigate('/demo')}
            onViewDashboard={() => navigate('/demo')}
            user={DEMO_USER}
            institution={{ name: settings.school_name || 'בית ספר לדוגמה', logoUrl: settings.logo_url ?? undefined }}
            headerTitle={header.title}
            headerDescription={header.desc}
            headerIcon={header.icon}
            breadcrumbs={breadcrumbs}
            showVersion={false}
        >
            <SimulationBar />
            <Suspense fallback={<LoadingTab />}>
                <AnimatePresence mode="wait">
                    <MotionDiv
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        {activeTab === 'settings' && <DemoSettingsTab />}
                        {activeTab === 'data-management' && <DemoClassesTab />}
                        {activeTab === 'goals' && <DemoGoalsTab />}
                        {activeTab === 'points' && <DemoPointsEntry />}
                        {activeTab === 'lucky-wheel' && <DemoWheelTab />}
                        {activeTab === 'logs' && <DemoLogsTab />}
                    </MotionDiv>
                </AnimatePresence>
            </Suspense>
        </WorkspaceLayout>
    );
};

export const DemoAdminPage: React.FC = () => (
    <SaveNotificationProvider>
        <DemoAdminInner />
    </SaveNotificationProvider>
);
