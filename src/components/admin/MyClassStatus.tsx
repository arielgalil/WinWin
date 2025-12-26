import React, { useState, useMemo, useEffect } from 'react';
import { ClassRoom } from '../../types';
import { SchoolIcon, TrendUpIcon, TrendSameIcon, SearchIcon } from '../ui/Icons';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { useLanguage } from '../../hooks/useLanguage';

interface MyClassStatusProps {
    classId: string;
    classes: ClassRoom[];
    isAdmin?: boolean;
}

export const MyClassStatus: React.FC<MyClassStatusProps> = ({ classId, classes, isAdmin }) => {
    const { t } = useLanguage();
    const [selectedClassId, setSelectedClassId] = useState<string>(classId);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (classId) setSelectedClassId(classId);
    }, [classId]);

    const classData = classes.find(c => c.id === selectedClassId);

    const students = useMemo(() => {
        if (!classData) return [];
        const sorted = [...classData.students].sort((a, b) => b.score - a.score);
        let currentRank = 1;
        return sorted.map((s, idx) => {
            if (idx > 0 && s.score < sorted[idx - 1].score) {
                currentRank = idx + 1;
            }
            return { ...s, rank: currentRank };
        });
    }, [classData]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [students, searchTerm]);

    if (!classData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <SchoolIcon className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-xl font-bold">{t('no_group_assigned')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-[var(--radius-container)] border border-[var(--border-main)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                        <SchoolIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        {isAdmin ? (
                            <div className="relative group/select">
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="block w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-surface)] text-lg font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer hover:bg-[var(--bg-hover)]"
                                >
                                    {[...classes].sort((a, b) => a.name.localeCompare(b.name, 'he')).map(c => (
                                        <option key={c.id} value={c.id} className="bg-[var(--bg-card)] text-[var(--text-main)]">{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                                    ▼
                                </div>
                            </div>
                        ) : (
                            <h2 className="text-3xl font-bold text-[var(--text-main)]">{classData.name}</h2>
                        )}
                        <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm mt-1">{t('students_count', { count: students.length })}</p>
                    </div>
                </div>

                <div className="flex flex-col items-center bg-[var(--bg-surface)] px-8 py-3 rounded-[var(--radius-container)] border border-[var(--border-main)] shadow-inner">
                    <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mb-1">{t('points_label')}</span>
                    <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        <AnimatedCounter value={classData.score} />
                    </span>
                </div>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder={t('search_student_placeholder')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm rtl:pr-10 ltr:pl-10 text-sm"
                />
                <div className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 text-[var(--text-muted)] pointer-events-none">
                    <SearchIcon className="w-5 h-5" />
                </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-[var(--radius-container)] border border-[var(--border-main)] overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 bg-[var(--bg-surface)] text-[var(--text-muted)] text-[10px] font-bold uppercase p-4 border-b border-[var(--border-main)] tracking-widest">
                    <div className="col-span-2 md:col-span-1 text-center">{t('rank_label')}</div>
                    <div className="col-span-6 md:col-span-7 rtl:pr-2 ltr:pl-2">{t('student_name_label')}</div>
                    <div className="col-span-2 text-center">{t('trend_label')}</div>
                    <div className="col-span-2 rtl:text-left rtl:pl-2 ltr:text-right ltr:pr-2">{t('points_label')}</div>
                </div>

                <div className="divide-y divide-[var(--border-subtle)]">
                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                        <div key={student.id} className="grid grid-cols-12 items-center p-3 hover:bg-[var(--bg-hover)] transition-colors group">
                            <div className="col-span-2 md:col-span-1 flex justify-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md border
                             ${student.rank === 1 ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20' :
                                        student.rank === 2 ? 'bg-slate-300 text-slate-800 border-slate-200 shadow-slate-300/20' :
                                            student.rank === 3 ? 'bg-orange-400 text-white border-orange-300 shadow-orange-400/20' :
                                                'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-main)]'
                                    }`}>
                                    {student.rank}
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-7 rtl:pr-2 ltr:pl-2 font-semibold text-[var(--text-main)] text-base truncate">
                                {student.name}
                            </div>
                            <div className="col-span-2 flex justify-center">
                                {student.trend === 'up' && <TrendUpIcon className="w-5 h-5 text-green-500" />}
                                {student.trend === 'down' && <TrendUpIcon className="w-5 h-5 text-red-500 rotate-180" />}
                                {student.trend === 'same' && <TrendSameIcon className="w-5 h-5 text-gray-400" />}
                            </div>
                            <div className="col-span-2 rtl:text-left rtl:pl-2 ltr:text-right ltr:pr-2 font-bold text-lg text-indigo-600 dark:text-indigo-400 tabular-nums">
                                {student.score.toLocaleString()}
                            </div>
                        </div>
                    )) : (
                        <div className="p-12 text-center text-[var(--text-muted)] font-bold italic">
                            {t('no_students_found')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
