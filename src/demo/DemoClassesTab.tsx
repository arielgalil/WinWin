import React, { useState } from 'react';
import { AdminSectionCard } from '@/components/ui/AdminSectionCard';
import { AdminButton } from '@/components/ui/AdminButton';
import { PlusIcon, UsersIcon, XIcon, EditIcon, ArrowRightIcon } from '@/components/ui/Icons';
import { useDemoContext } from './DemoContext';
import { ClassRoom } from '@/types';

const CLASS_COLORS = [
    '#7c3aed', '#0891b2', '#059669', '#dc2626',
    '#d97706', '#db2777', '#2563eb', '#16a34a',
    '#9333ea', '#0d9488', '#ea580c', '#4f46e5',
];

// ── Student View ──────────────────────────────────────────────────────────────

const StudentView: React.FC<{ cls: ClassRoom; onBack: () => void }> = ({ cls, onBack }) => {
    const { addStudent, removeStudent, renameStudent } = useDemoContext();
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleAdd = () => {
        const name = newName.trim();
        if (!name) return;
        addStudent(cls.id, name);
        setNewName('');
    };

    const startEdit = (id: string, name: string) => {
        setEditingId(id);
        setEditName(name);
    };

    const confirmEdit = () => {
        if (editingId && editName.trim()) {
            renameStudent(cls.id, editingId, editName.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="space-y-[var(--admin-section-gap)] pb-12">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-sm font-bold"
            >
                <ArrowRightIcon className="w-4 h-4 rotate-180" />
                חזרה לכיתות
            </button>

            <AdminSectionCard
                title={`תלמידי ${cls.name}`}
                icon={<UsersIcon className="w-6 h-6" />}
            >
                <div className="space-y-2 mb-4">
                    {cls.students.length === 0 && (
                        <p className="text-sm text-[var(--text-muted)] opacity-60 text-center py-4">אין תלמידים בכיתה זו</p>
                    )}
                    {cls.students.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-input)] transition-colors">
                            {editingId === s.id ? (
                                <>
                                    <input
                                        autoFocus
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onBlur={confirmEdit}
                                        onKeyDown={e => e.key === 'Enter' && confirmEdit()}
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-indigo-500 bg-[var(--bg-input)] text-[var(--text-main)] text-sm outline-none"
                                    />
                                    <button onClick={confirmEdit} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold">שמור</button>
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 font-medium text-[var(--text-main)] text-sm">{s.name}</span>
                                    <span className="text-xs text-[var(--text-muted)]">{s.score} נק'</span>
                                    <button onClick={() => startEdit(s.id, s.name)} className="text-[var(--text-muted)] hover:text-indigo-400 transition-colors p-1">
                                        <EditIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => removeStudent(cls.id, s.id)} className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-1">
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder="שם תלמיד חדש"
                        className="flex-1 px-3 py-2 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <AdminButton onClick={handleAdd} variant="primary" icon={<PlusIcon className="w-4 h-4" />}>
                        הוסף
                    </AdminButton>
                </div>
            </AdminSectionCard>
        </div>
    );
};

// ── Class List ────────────────────────────────────────────────────────────────

export const DemoClassesTab: React.FC = () => {
    const { classes, addClass, removeClass, updateClass } = useDemoContext();
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(CLASS_COLORS[0]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (selectedClass) {
        return <StudentView cls={selectedClass} onBack={() => setSelectedClassId(null)} />;
    }

    const handleAdd = () => {
        const name = newName.trim();
        if (!name) return;
        addClass(name, newColor);
        setNewName('');
    };

    const startEditName = (cls: ClassRoom) => {
        setEditingId(cls.id);
        setEditName(cls.name);
    };

    const confirmEditName = (classId: string) => {
        if (editName.trim()) updateClass(classId, { name: editName.trim() });
        setEditingId(null);
    };

    const sorted = [...classes].sort((a, b) => a.name.localeCompare(b.name, 'he'));

    return (
        <div className="space-y-[var(--admin-section-gap)] pb-12">
            <AdminSectionCard
                title="ניהול כיתות"
                icon={<UsersIcon className="w-6 h-6" />}
            >
                <div className="space-y-2 mb-6">
                    {sorted.map(cls => (
                        <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-input)] transition-colors group">
                            {/* Color picker */}
                            <div className="relative shrink-0">
                                <input
                                    type="color"
                                    value={cls.color}
                                    onChange={e => updateClass(cls.id, { color: e.target.value })}
                                    className="w-7 h-7 rounded-full cursor-pointer border-2 border-white/20 bg-transparent opacity-0 absolute inset-0"
                                />
                                <div
                                    className="w-7 h-7 rounded-full border-2 border-white/20 shrink-0"
                                    style={{ backgroundColor: cls.color }}
                                />
                            </div>

                            {/* Name */}
                            {editingId === cls.id ? (
                                <input
                                    autoFocus
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onBlur={() => confirmEditName(cls.id)}
                                    onKeyDown={e => e.key === 'Enter' && confirmEditName(cls.id)}
                                    className="flex-1 px-3 py-1 rounded-lg border border-indigo-500 bg-[var(--bg-input)] text-[var(--text-main)] text-sm font-bold outline-none"
                                />
                            ) : (
                                <span className="flex-1 font-bold text-[var(--text-main)]">{cls.name}</span>
                            )}

                            <span className="text-xs text-[var(--text-muted)] shrink-0">{cls.students.length} תלמידים</span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                    onClick={() => setSelectedClassId(cls.id)}
                                    className="px-2 py-1 text-xs rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors font-bold"
                                >
                                    תלמידים
                                </button>
                                <button onClick={() => startEditName(cls)} className="text-[var(--text-muted)] hover:text-indigo-400 transition-colors p-1">
                                    <EditIcon className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => removeClass(cls.id)} className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-1">
                                    <XIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {classes.length === 0 && (
                        <p className="text-sm text-[var(--text-muted)] opacity-60 text-center py-4">אין כיתות - הוסף כיתה למטה</p>
                    )}
                </div>

                {/* Add class form */}
                <div className="border-t border-[var(--border-subtle)] pt-4">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">הוספת כיתה חדשה</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder="שם הכיתה"
                            className="flex-1 min-w-[140px] px-3 py-2 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <div className="flex gap-1.5 flex-wrap">
                            {CLASS_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setNewColor(c)}
                                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                                    style={{
                                        backgroundColor: c,
                                        borderColor: newColor === c ? 'white' : 'transparent',
                                    }}
                                />
                            ))}
                        </div>
                        <AdminButton onClick={handleAdd} variant="primary" icon={<PlusIcon className="w-4 h-4" />}>
                            הוסף
                        </AdminButton>
                    </div>
                </div>
            </AdminSectionCard>
        </div>
    );
};
