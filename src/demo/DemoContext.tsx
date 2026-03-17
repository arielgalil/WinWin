import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useReducer,
    useRef,
} from 'react';
import { ActionLog, AppSettings, Campaign, ClassRoom, Student, TickerMessage } from '@/types';
import { DEMO_CAMPAIGN, DEMO_SETTINGS, INITIAL_CLASSES } from './mockData';
import { getRandomCommentary } from './cannedCommentary';

// ── State ────────────────────────────────────────────────────────────────────

interface DemoState {
    classes: ClassRoom[];
    commentary: string;
    isSimulationRunning: boolean;
    settings: AppSettings;
    tickerMessages: TickerMessage[];
    logs: ActionLog[];
}

type DemoAction =
    | { type: 'ADD_STUDENT_POINTS'; studentId: string; classId: string; points: number }
    | { type: 'ADD_CLASS_POINTS'; classId: string; points: number }
    | { type: 'SET_COMMENTARY'; text: string }
    | { type: 'TOGGLE_SIMULATION' }
    | { type: 'RESET' }
    // Settings
    | { type: 'UPDATE_SETTINGS'; partial: Partial<AppSettings> }
    // Classes
    | { type: 'ADD_CLASS'; cls: ClassRoom }
    | { type: 'REMOVE_CLASS'; classId: string }
    | { type: 'UPDATE_CLASS'; classId: string; updates: Partial<Pick<ClassRoom, 'name' | 'color' | 'target_score'>> }
    // Students
    | { type: 'ADD_STUDENT'; classId: string; student: Student }
    | { type: 'REMOVE_STUDENT'; classId: string; studentId: string }
    | { type: 'RENAME_STUDENT'; classId: string; studentId: string; name: string }
    // Ticker messages
    | { type: 'ADD_TICKER'; message: TickerMessage }
    | { type: 'DELETE_TICKER'; id: string }
    | { type: 'UPDATE_TICKER'; id: string; updates: Partial<TickerMessage> }
    // Logs
    | { type: 'ADD_LOG'; entry: ActionLog }
    | { type: 'DELETE_LOG'; id: string }
    | { type: 'UPDATE_LOG'; id: string; description: string; points: number };

// ── Helpers ──────────────────────────────────────────────────────────────────

const cloneClasses = (classes: ClassRoom[]): ClassRoom[] =>
    classes.map(c => ({ ...c, students: c.students.map(s => ({ ...s })) }));

const INITIAL_TICKER: TickerMessage[] = [
    { id: 'tick-1', text: 'ברוכים הבאים לתחרות מצמיחה! 🌱' },
    { id: 'tick-2', text: 'כל נקודה מקרבת אתכם ליעד המשותף! 🚀' },
    { id: 'tick-3', text: 'המאמץ משתלם - המשיכו לעשות טוב! ⭐' },
];

const initialState: DemoState = {
    classes: cloneClasses(INITIAL_CLASSES),
    commentary: 'ברוכים הבאים לדגמה של מצמיחה!',
    isSimulationRunning: true,
    settings: { ...DEMO_SETTINGS },
    tickerMessages: INITIAL_TICKER,
    logs: [],
};

// ── Reducer ───────────────────────────────────────────────────────────────────

function demoReducer(state: DemoState, action: DemoAction): DemoState {
    switch (action.type) {
        case 'ADD_STUDENT_POINTS': {
            const classes = cloneClasses(state.classes);
            const cls = classes.find(c => c.id === action.classId);
            if (!cls) return state;
            const student = cls.students.find(s => s.id === action.studentId);
            if (!student) return state;
            student.prev_score = student.score;
            student.score += action.points;
            cls.score = cls.students.reduce((sum, s) => sum + s.score, 0);
            return { ...state, classes };
        }
        case 'ADD_CLASS_POINTS': {
            const classes = cloneClasses(state.classes);
            const cls = classes.find(c => c.id === action.classId);
            if (!cls) return state;
            cls.score += action.points;
            return { ...state, classes };
        }
        case 'SET_COMMENTARY':
            return { ...state, commentary: action.text };
        case 'TOGGLE_SIMULATION':
            return { ...state, isSimulationRunning: !state.isSimulationRunning };
        case 'RESET':
            return {
                ...initialState,
                classes: cloneClasses(INITIAL_CLASSES),
                settings: { ...DEMO_SETTINGS },
                tickerMessages: INITIAL_TICKER,
                logs: [],
            };

        case 'UPDATE_SETTINGS':
            return { ...state, settings: { ...state.settings, ...action.partial } };

        case 'ADD_CLASS':
            return { ...state, classes: [...state.classes, action.cls] };
        case 'REMOVE_CLASS':
            return { ...state, classes: state.classes.filter(c => c.id !== action.classId) };
        case 'UPDATE_CLASS': {
            const classes = state.classes.map(c =>
                c.id === action.classId ? { ...c, ...action.updates } : c,
            );
            return { ...state, classes };
        }

        case 'ADD_STUDENT': {
            const classes = cloneClasses(state.classes);
            const cls = classes.find(c => c.id === action.classId);
            if (!cls) return state;
            cls.students = [...cls.students, action.student];
            return { ...state, classes };
        }
        case 'REMOVE_STUDENT': {
            const classes = cloneClasses(state.classes);
            const cls = classes.find(c => c.id === action.classId);
            if (!cls) return state;
            cls.students = cls.students.filter(s => s.id !== action.studentId);
            cls.score = cls.students.reduce((sum, s) => sum + s.score, 0);
            return { ...state, classes };
        }
        case 'RENAME_STUDENT': {
            const classes = cloneClasses(state.classes);
            const cls = classes.find(c => c.id === action.classId);
            if (!cls) return state;
            const student = cls.students.find(s => s.id === action.studentId);
            if (student) student.name = action.name;
            return { ...state, classes };
        }

        case 'ADD_TICKER':
            return { ...state, tickerMessages: [...state.tickerMessages, action.message] };
        case 'DELETE_TICKER':
            return { ...state, tickerMessages: state.tickerMessages.filter(m => m.id !== action.id) };
        case 'UPDATE_TICKER':
            return {
                ...state,
                tickerMessages: state.tickerMessages.map(m =>
                    m.id === action.id ? { ...m, ...action.updates } : m,
                ),
            };

        case 'ADD_LOG':
            return { ...state, logs: [action.entry, ...state.logs].slice(0, 200) };
        case 'DELETE_LOG':
            return { ...state, logs: state.logs.filter(l => l.id !== action.id) };
        case 'UPDATE_LOG':
            return {
                ...state,
                logs: state.logs.map(l =>
                    l.id === action.id
                        ? { ...l, description: action.description, points: action.points }
                        : l,
                ),
            };

        default:
            return state;
    }
}

// ── Simulation helpers ────────────────────────────────────────────────────────

const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const makeLogEntry = (
    description: string,
    points: number,
    classId?: string,
    studentId?: string,
): ActionLog => ({
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    created_at: new Date().toISOString(),
    description,
    points,
    teacher_name: 'סימולציה',
    class_id: classId ?? null,
    student_id: studentId ?? null,
    campaign_id: DEMO_CAMPAIGN.id,
});

// ── Context ───────────────────────────────────────────────────────────────────

interface DemoContextValue {
    campaign: Campaign;
    settings: AppSettings;
    classes: ClassRoom[];
    commentary: string;
    isSimulationRunning: boolean;
    tickerMessages: TickerMessage[];
    logs: ActionLog[];
    // Score mutations
    addPoints: (classId: string, points: number, studentId?: string) => void;
    // Simulation controls
    toggleSimulation: () => void;
    reset: () => void;
    updateCommentary: (text: string) => void;
    // Settings mutations
    updateSettings: (partial: Partial<AppSettings>) => void;
    // Class mutations
    addClass: (name: string, color: string) => void;
    removeClass: (classId: string) => void;
    updateClass: (classId: string, updates: Partial<Pick<ClassRoom, 'name' | 'color' | 'target_score'>>) => void;
    // Student mutations
    addStudent: (classId: string, name: string) => void;
    removeStudent: (classId: string, studentId: string) => void;
    renameStudent: (classId: string, studentId: string, name: string) => void;
    // Ticker mutations (async interface to match real MessagesManager callbacks)
    addTickerMessage: (text: string) => Promise<void>;
    deleteTickerMessage: (id: string) => Promise<void>;
    updateTickerMessage: (id: string, updates: Partial<TickerMessage>) => Promise<void>;
    // Log mutations
    deleteLog: (id: string) => Promise<void>;
    updateLog: (id: string, description: string, points: number) => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export const useDemoContext = () => {
    const ctx = useContext(DemoContext);
    if (!ctx) throw new Error('useDemoContext must be used within DemoProvider');
    return ctx;
};

// ── Provider ──────────────────────────────────────────────────────────────────

const BURST_COOLDOWN_MS = 15000;

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(demoReducer, initialState);

    const isRunningRef = useRef(state.isSimulationRunning);
    const classesRef = useRef(state.classes);
    const settingsRef = useRef(state.settings);
    useEffect(() => { isRunningRef.current = state.isSimulationRunning; }, [state.isSimulationRunning]);
    useEffect(() => { classesRef.current = state.classes; }, [state.classes]);
    useEffect(() => { settingsRef.current = state.settings; }, [state.settings]);

    const lastBurstTime = useRef(0);

    useEffect(() => {
        let timerId: number;

        const scheduleNext = () => {
            timerId = window.setTimeout(tick, rand(3000, 6000));
        };

        const tick = () => {
            if (isRunningRef.current) {
                const classes = classesRef.current;
                const settings = settingsRef.current;
                const now = Date.now();
                const burstReady = now - lastBurstTime.current > BURST_COOLDOWN_MS;
                const roll = Math.random();

                if (!burstReady || roll < 0.45) {
                    const cls = pick(classes);
                    const student = pick(cls.students);
                    const pts = rand(6, 16);
                    dispatch({ type: 'ADD_STUDENT_POINTS', studentId: student.id, classId: cls.id, points: pts });
                    dispatch({ type: 'ADD_LOG', entry: makeLogEntry(`${student.name}: +${pts} נקודות`, pts, cls.id, student.id) });
                } else if (roll < 0.65) {
                    lastBurstTime.current = now;
                    const cls = pick(classes);
                    const student = pick(cls.students);
                    const pts = rand(22, 35);
                    dispatch({ type: 'ADD_STUDENT_POINTS', studentId: student.id, classId: cls.id, points: pts });
                    dispatch({ type: 'ADD_LOG', entry: makeLogEntry(`${student.name}: +${pts} נקודות`, pts, cls.id, student.id) });
                } else if (roll < 0.80) {
                    lastBurstTime.current = now;
                    const cls = pick(classes);
                    const pts = rand(55, 75);
                    dispatch({ type: 'ADD_CLASS_POINTS', classId: cls.id, points: pts });
                    dispatch({ type: 'ADD_LOG', entry: makeLogEntry(`כיתה ${cls.name}: +${pts} נקודות`, pts, cls.id) });
                } else if (roll < 0.90) {
                    lastBurstTime.current = now;
                    const sorted = [...classes].sort((a, b) => b.score - a.score);
                    if (sorted.length >= 2) {
                        const needed = sorted[0].score - sorted[1].score + rand(5, 15);
                        dispatch({ type: 'ADD_CLASS_POINTS', classId: sorted[1].id, points: needed });
                        dispatch({ type: 'ADD_LOG', entry: makeLogEntry(`כיתה ${sorted[1].name}: +${needed} נקודות`, needed, sorted[1].id) });
                    }
                } else {
                    lastBurstTime.current = now;
                    const totalScore = classes.reduce((sum, c) => sum + c.score, 0);
                    const goals = (settings.goals_config || []);
                    const nextGoal = goals.find(g => g.target_score > totalScore);
                    if (nextGoal) {
                        const needed = nextGoal.target_score - totalScore + rand(1, 10);
                        const cls = pick(classes);
                        dispatch({ type: 'ADD_CLASS_POINTS', classId: cls.id, points: needed });
                        dispatch({ type: 'ADD_LOG', entry: makeLogEntry(`יעד "${nextGoal.name}" הושג! +${needed} נקודות לכיתה ${cls.name}`, needed, cls.id) });
                    } else {
                        const cls = pick(classes);
                        const pts = rand(20, 40);
                        dispatch({ type: 'ADD_CLASS_POINTS', classId: cls.id, points: pts });
                        dispatch({ type: 'ADD_LOG', entry: makeLogEntry(`כיתה ${cls.name}: +${pts} נקודות`, pts, cls.id) });
                    }
                }

                dispatch({ type: 'SET_COMMENTARY', text: getRandomCommentary() });
            }

            scheduleNext();
        };

        scheduleNext();
        return () => window.clearTimeout(timerId);
    }, []);

    const addPoints = useCallback((classId: string, points: number, studentId?: string) => {
        const currentClasses = classesRef.current;
        if (studentId) {
            dispatch({ type: 'ADD_STUDENT_POINTS', studentId, classId, points });
        } else {
            dispatch({ type: 'ADD_CLASS_POINTS', classId, points });
        }
        const cls = currentClasses.find(c => c.id === classId);
        const student = studentId ? cls?.students.find(s => s.id === studentId) : undefined;
        const desc = student
            ? `${student.name}: +${points} נקודות`
            : `כיתה ${cls?.name ?? ''}: +${points} נקודות`;
        dispatch({ type: 'ADD_LOG', entry: makeLogEntry(desc, points, classId, studentId) });
    }, []);

    const toggleSimulation = useCallback(() => dispatch({ type: 'TOGGLE_SIMULATION' }), []);
    const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
    const updateCommentary = useCallback((text: string) => dispatch({ type: 'SET_COMMENTARY', text }), []);
    const updateSettings = useCallback((partial: Partial<AppSettings>) => dispatch({ type: 'UPDATE_SETTINGS', partial }), []);

    const addClass = useCallback((name: string, color: string) => {
        const id = `class-${Date.now()}`;
        dispatch({
            type: 'ADD_CLASS',
            cls: { id, name, color, score: 0, students: [] },
        });
    }, []);
    const removeClass = useCallback((classId: string) => dispatch({ type: 'REMOVE_CLASS', classId }), []);
    const updateClass = useCallback((classId: string, updates: Partial<Pick<ClassRoom, 'name' | 'color' | 'target_score'>>) =>
        dispatch({ type: 'UPDATE_CLASS', classId, updates }), []);

    const addStudent = useCallback((classId: string, name: string) => {
        const id = `std-${Date.now()}`;
        const student: Student = { id, name, score: 0, prev_score: 0, trend: 'same', class_id: classId };
        dispatch({ type: 'ADD_STUDENT', classId, student });
    }, []);
    const removeStudent = useCallback((classId: string, studentId: string) =>
        dispatch({ type: 'REMOVE_STUDENT', classId, studentId }), []);
    const renameStudent = useCallback((classId: string, studentId: string, name: string) =>
        dispatch({ type: 'RENAME_STUDENT', classId, studentId, name }), []);

    const addTickerMessage = useCallback(async (text: string) => {
        const id = `tick-${Date.now()}`;
        dispatch({ type: 'ADD_TICKER', message: { id, text } });
    }, []);
    const deleteTickerMessage = useCallback(async (id: string) =>
        dispatch({ type: 'DELETE_TICKER', id }), []);
    const updateTickerMessage = useCallback(async (id: string, updates: Partial<TickerMessage>) =>
        dispatch({ type: 'UPDATE_TICKER', id, updates }), []);

    const deleteLog = useCallback(async (id: string) => dispatch({ type: 'DELETE_LOG', id }), []);
    const updateLog = useCallback(async (id: string, description: string, points: number) =>
        dispatch({ type: 'UPDATE_LOG', id, description, points }), []);

    const settings: AppSettings = {
        ...state.settings,
        current_commentary: state.commentary,
    };

    return (
        <DemoContext.Provider value={{
            campaign: DEMO_CAMPAIGN,
            settings,
            classes: state.classes,
            commentary: state.commentary,
            isSimulationRunning: state.isSimulationRunning,
            tickerMessages: state.tickerMessages,
            logs: state.logs,
            addPoints,
            toggleSimulation,
            reset,
            updateCommentary,
            updateSettings,
            addClass,
            removeClass,
            updateClass,
            addStudent,
            removeStudent,
            renameStudent,
            addTickerMessage,
            deleteTickerMessage,
            updateTickerMessage,
            deleteLog,
            updateLog,
        }}>
            {children}
        </DemoContext.Provider>
    );
};
