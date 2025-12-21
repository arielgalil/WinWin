
export const triggerHaptic = (type: 'selection' | 'success' | 'error' | 'impact') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (type) {
      case 'selection':
        // Very light tap
        navigator.vibrate(5);
        break;
      case 'impact':
        // Medium tap
        navigator.vibrate(15);
        break;
      case 'success':
        // Double tap
        navigator.vibrate([10, 50, 20]);
        break;
      case 'error':
        // Long buzz
        navigator.vibrate([50, 50, 50]);
        break;
    }
  }
};
