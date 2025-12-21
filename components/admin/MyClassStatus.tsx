import React, { useState, useMemo, useEffect } from 'react';
import { ClassRoom } from '../../types';
import { SchoolIcon, TrendUpIcon, TrendDownIcon, TrendSameIcon, TrophyIcon, SearchIcon } from '../ui/Icons';
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

    // Sync state if classId prop changes
    useEffect(() => {
        if (classId) setSelectedClassId(classId);
    }, [classId]);

    const classData = classes.find(c => c.id === selectedClassId);

    // Process and sort students
    const students = useMemo(() => {
        if (!classData) return [];

        // 1. Sort students by score descending
        const sorted = [...classData.students].sort((a, b) => b.score - a.score);

        // 2. Assign Rank (Handling ties)
        let currentRank = 1;
        return sorted.map((s, idx) => {
            if (idx > 0 && s.score < sorted[idx - 1].score) {
                currentRank = idx + 1;
            }
            return { ...s, rank: currentRank };
        });
    }, [classData]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => s.name.includes(searchTerm));
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
        <div className="max-w-4xl mx-auto space-y-6 pb-12 px-4">
            <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner border border-white/5">
                        <SchoolIcon className="w-8 h-8 text-blue-300" />
                    </div>
                    <div>
                        {isAdmin ? (
                            <div className="relative group/select">
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="bg-white/10 text-white text-2xl font-black rounded-xl pr-3 pl-10 py-1 outline-none border border-white/10 focus:border-blue-500/50 appearance-none cursor-pointer hover:bg-white/15 transition-all w-full md:w-auto"
                                >
                                    {[...classes].sort((a, b) => a.name.localeCompare(b.name, 'he')).map(c => (
                                        <option key={c.id} value={c.id} className="bg-slate-900 text-base">{c.name}</option>
                                    ))}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-xs">
                                    ▼
                                </div>
                            </div>
                        ) : (
                            <h2 className="text-3xl font-black text-white">{classData.name}</h2>
                        )}
                        <p className="text-blue-200 font-bold opacity-80">{t('students_count', { count: students.length })}</p>
                    </div>
                </div>

                <div className="flex flex-col items-center bg-black/20 px-8 py-3 rounded-2xl border border-white/5">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">{t('points_label')}</span>
                    <span className="text-4xl font-black text-white tabular-nums">
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 rtl:pr-10 ltr:pl-10 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
                />
                <div className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 text-slate-500 pointer-events-none">
                    <SearchIcon className="w-5 h-5" />
                </div>
            </div>

            <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-lg">
                <div className="grid grid-cols-12 bg-black/20 text-slate-400 text-xs font-bold uppercase p-4 border-b border-white/5">
                    <div className="col-span-2 md:col-span-1 text-center">{t('rank_label')}</div>
                    <div className="col-span-6 md:col-span-7 rtl:pr-2 ltr:pl-2">{t('student_name_label')}</div>
                    <div className="col-span-2 text-center">{t('trend_label')}</div>
                    <div className="col-span-2 rtl:text-left rtl:pl-2 ltr:text-right ltr:pr-2">{t('points_label')}</div>
                </div>

                <div className="divide-y divide-white/5">
                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                        <div key={student.id} className="grid grid-cols-12 items-center p-3 hover:bg-white/5 transition-colors group">
                            <div className="col-span-2 md:col-span-1 flex justify-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                             ${student.rank === 1 ? 'bg-yellow-500 text-yellow-900' :
                                        student.rank === 2 ? 'bg-slate-300 text-slate-800' :
                                            student.rank === 3 ? 'bg-orange-400 text-orange-900' :
                                                'bg-slate-700 text-slate-300'
                                    }`}>
                                    {student.rank}
                                </div>
                            </div>
                            <div className="col-span-6 md:col-span-7 rtl:pr-2 ltr:pl-2 font-bold text-white text-base truncate">
                                {student.name}
                            </div>
                            <div className="col-span-2 flex justify-center">
                                {student.trend === 'up' && <TrendUpIcon className="w-5 h-5 text-green-400" />}
                                {student.trend === 'down' && <TrendUpIcon className="w-5 h-5 text-red-400 rotate-180" />}
                                {student.trend === 'same' && <TrendSameIcon className="w-5 h-5 text-slate-600 opacity-50" />}
                            </div>
                            <div className="col-span-2 rtl:text-left rtl:pl-2 ltr:text-right ltr:pr-2 font-black text-lg text-blue-200 tabular-nums">
                                {student.score.toLocaleString()}
                            </div>
                        </div>
                    )) : (
                        <div className="p-8 text-center text-slate-500">
                            {t('no_students_found')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};