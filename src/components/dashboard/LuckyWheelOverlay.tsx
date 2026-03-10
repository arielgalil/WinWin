import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { LuckyWheel } from "./LuckyWheel";

interface LuckyWheelOverlayProps {
    /** Whether the overlay is visible */
    isActive: boolean;
    /** List of participant names */
    participants: string[];
    /** Pre-determined winner index (null = waiting to spin) */
    winnerIndex: number | null;
    /** Absolute truth winner name from admin */
    winnerName?: string;
    /** Campaign primary color */
    primaryColor?: string;
    /** Campaign secondary color */
    secondaryColor?: string;
    /** Wheel template name */
    wheelName?: string;
    /** Current round */
    roundNumber?: number;
    /** Called when spin finishes */
    onSpinComplete?: (winnerIndex: number, winnerName: string) => void;
}

export const LuckyWheelOverlay: React.FC<LuckyWheelOverlayProps> = ({
    isActive,
    participants,
    winnerIndex,
    winnerName,
    primaryColor,
    secondaryColor,
    wheelName,
    roundNumber = 1,
    onSpinComplete,
}) => {
    const { t } = useLanguage();
    return (
        <AnimatePresence>
            {isActive && participants.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.4 } }}
                    className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/95 backdrop-blur-lg overflow-hidden"
                >
                    {/* Header */}
                    <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="absolute top-4 left-0 right-0 text-center z-10"
                    >
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            🎡 {wheelName || t("tab_lucky_wheel")}
                        </h1>
                        <p className="text-white/50 text-sm mt-1">
                            {t("participants_count_label", {
                                count: participants.length,
                            })} • {t("round_prefix")} #{roundNumber}
                        </p>
                    </motion.div>

                    {/* Wheel */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 150,
                            damping: 20,
                            delay: 0.1,
                        }}
                        className="w-full h-full max-w-[550px] max-h-[85vh] p-4 pt-20 pb-20 flex items-center justify-center"
                    >
                        <LuckyWheel
                            participants={participants}
                            primaryColor={primaryColor}
                            secondaryColor={secondaryColor}
                            winnerIndex={winnerIndex}
                            winnerName={winnerName}
                            roundNumber={roundNumber}
                            onSpinComplete={onSpinComplete}
                        />
                    </motion.div>

                    {/* Waiting indicator */}
                    {winnerIndex == null && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute bottom-8 left-0 right-0 text-center z-10"
                        >
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                <span className="text-white/80 text-sm font-medium">
                                    {t("waiting_for_admin_label")}
                                </span>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
