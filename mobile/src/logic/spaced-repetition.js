// ===== SPACED REPETITION ENGINE (SM-2 Algorithm) =====
// Optimized for React Native / JavaScript Modules

export const SPACED_REP_CONFIG = {
    intervals: {
        again: 1,      // 1 ngày
        hard: 3,       // 3 ngày
        good: 7,       // 7 ngày
        easy: 21       // 21 ngày
    },
    initialEaseFactor: 2.5,
    minEaseFactor: 1.3
};

/**
 * Tính toán lần ôn tập tiếp theo dựa trên thuật toán SM-2
 * @param {Object} progress - Thông tin tiến độ hiện tại của thẻ
 * @param {string} quality - Đánh giá của người dùng ('again', 'hard', 'good', 'easy')
 * @returns {Object} - Thông tin tiến độ mới đã cập nhật
 */
export function calculateNextReview(progress, quality) {
    const currentProgress = progress || {
        status: 'new',
        interval: 0,
        ease_factor: SPACED_REP_CONFIG.initialEaseFactor,
        review_count: 0,
        created_at: Date.now()
    };

    const qualityMap = { again: 0, hard: 1, good: 3, easy: 4 };
    const q = qualityMap[quality];

    // Tính toán Ease Factor mới
    const newEF = Math.max(
        SPACED_REP_CONFIG.minEaseFactor,
        currentProgress.ease_factor + (0.1 - (5 - q) * 0.08)
    );

    // Tính toán Interval mới
    let newInterval;
    let newStatus = currentProgress.status;

    if (quality === 'again') {
        newInterval = SPACED_REP_CONFIG.intervals.again;
        newStatus = 'learning';
    } else if (quality === 'hard') {
        newInterval = SPACED_REP_CONFIG.intervals.hard;
        newStatus = 'learning';
    } else if (quality === 'good') {
        newInterval = Math.max(7, Math.round((currentProgress.interval || 1) * newEF));
        newStatus = 'review';
    } else { // easy
        newInterval = Math.max(21, Math.round((currentProgress.interval || 1) * newEF));
        newStatus = 'review';
    }

    // Tính toán ngày đến hạn (due date)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + newInterval);
    dueDate.setHours(0, 0, 0, 0);

    return {
        ...currentProgress,
        status: newStatus,
        interval: newInterval,
        ease_factor: newEF,
        due_date: dueDate.getTime(),
        last_reviewed: Date.now(),
        review_count: (currentProgress.review_count || 0) + 1
    };
}
