import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { auth, database } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, set, update } from 'firebase/database';
import { flashcardsData } from '../data/flashcards';
import { calculateNextReview, SPACED_REP_CONFIG } from '../logic/spaced-repetition';

const { width } = Dimensions.get('window');

/**
 * Quiz Screen with full functionality matching Web version
 */
export default function QuizScreen() {
    const [user, setUser] = useState(null);
    const [cardProgress, setCardProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [quizState, setQuizState] = useState('menu'); // 'menu', 'setup', 'active', 'result'
    const [selectedDays, setSelectedDays] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [isSpacedRepMode, setIsSpacedRepMode] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const progressRef = ref(database, `users/${currentUser.uid}/card_progress`);
                onValue(progressRef, (snapshot) => {
                    setCardProgress(snapshot.val() || {});
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    // Get unique days available
    const availableDays = useMemo(() => {
        return [...new Set(flashcardsData.map(c => c.day))].sort((a, b) => a - b);
    }, []);

    const toggleDay = (day) => {
        if (!user && day !== 1) {
            Alert.alert('Khóa tính năng', 'Vui lòng đăng nhập để luyện tập bài này. Khách chỉ có thể luyện tập Ngày 1.');
            return;
        }
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const startQuiz = () => {
        if (selectedDays.length === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một ngày để bắt đầu.');
            return;
        }
        const pool = flashcardsData.filter(c => selectedDays.includes(c.day));
        setIsSpacedRepMode(false);
        generateQuizFromPool(pool);
    };

    const startSpacedRepQuiz = () => {
        if (!user) {
            Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng chế độ này.');
            return;
        }
        const today = new Date().setHours(0, 0, 0, 0);
        const duePool = flashcardsData.filter(card => {
            const prog = cardProgress[card.id];
            if (!prog) return true;
            return prog.status === 'learning' || (prog.status === 'review' && prog.due_date <= today);
        });

        if (duePool.length === 0) {
            Alert.alert('✨ Tuyệt vời!', 'Bạn đã hoàn thành toàn bộ bài ôn tập hôm nay.');
            return;
        }
        setIsSpacedRepMode(true);
        generateQuizFromPool(duePool.slice(0, 20));
    };

    const startShuffleQuiz = () => {
        setIsSpacedRepMode(false);
        const pool = user ? flashcardsData : flashcardsData.filter(c => c.day === 1);
        generateQuizFromPool(pool.slice(0, 20));
    };

    const generateQuizFromPool = (pool) => {
        if (pool.length < 4) {
             const extras = flashcardsData.filter(c => !pool.find(p => p.id === c.id)).sort(() => 0.5 - Math.random()).slice(0, 4);
             pool = [...pool, ...extras];
        }

        const generatedQuestions = pool.sort(() => 0.5 - Math.random()).map(card => {
            const others = flashcardsData.filter(c => c.id !== card.id);
            const distractors = others.sort(() => 0.5 - Math.random()).slice(0, 3);
            const options = [card, ...distractors].sort(() => 0.5 - Math.random());
            return { card, options };
        });

        setQuestions(generatedQuestions);
        setQuizState('active');
        setCurrentQuestionIndex(0);
        setScore(0);
        setUserAnswers([]);
        setSelectedOption(null);
        setShowExplanation(false);
    };

    const handleAnswer = async (option) => {
        if (showExplanation) return;
        setSelectedOption(option);
        setShowExplanation(true);

        const currentQ = questions[currentQuestionIndex];
        const isCorrect = option.id === currentQ.card.id;
        if (isCorrect) setScore(s => s + 1);
        
        setUserAnswers([...userAnswers, { question: currentQ, selected: option, isCorrect }]);

        // Sync Spaced Repetition progress
        if (isSpacedRepMode && user) {
            const quality = isCorrect ? 5 : 0; // 5 for correct, 0 for incorrect
            const currentProg = cardProgress[currentQ.card.id] || {
                status: 'new',
                interval: 0,
                ease_factor: 2.5,
                review_count: 0
            };
            const newProg = calculateNextReview(currentProg, quality);
            
            try {
                const progressRef = ref(database, `users/${user.uid}/card_progress/${currentQ.card.id}`);
                await set(progressRef, {
                    ...newProg,
                    last_reviewed: Date.now()
                });
            } catch (error) {
                console.log('Error syncing quiz progress:', error);
            }
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            setQuizState('result');
            setSelectedOption(null);
            setShowExplanation(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#e53e3e" /></View>;

    if (quizState === 'menu') {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Luyện tập Quiz</Text>
                    <Text style={styles.subtitle}>Chọn chế độ học để bắt đầu thử thách kiến thức</Text>
                </View>

                <View style={styles.options}>
                    <TouchableOpacity style={styles.optionCard} onPress={() => setQuizState('setup')}>
                        <Text style={styles.optionEmoji}>📅</Text>
                        <View>
                            <Text style={styles.optionTitle}>Theo ngày (Day-based)</Text>
                            <Text style={styles.optionDesc}>Luyện tập ngữ pháp của một hoặc nhiều ngày cụ thể</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.optionCard, { borderLeftColor: '#4299e1' }]} onPress={startShuffleQuiz}>
                        <Text style={styles.optionEmoji}>🎲</Text>
                        <View>
                            <Text style={styles.optionTitle}>Ngẫu nhiên (Shuffle All)</Text>
                            <Text style={styles.optionDesc}>Thử thách bản thân với 20 câu hỏi ngẫu nhiên</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.optionCard, { borderLeftColor: '#48bb78' }]} onPress={startSpacedRepQuiz}>
                        <Text style={styles.optionEmoji}>🔄</Text>
                        <View>
                            <Text style={styles.optionTitle}>Spaced Repetition</Text>
                            <Text style={styles.optionDesc}>Ôn tập các thẻ đã đến hạn (Due cards)</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    if (quizState === 'setup') {
        return (
            <View style={styles.container}>
                <View style={styles.header}><Text style={styles.title}>Chọn ngày ôn tập</Text></View>
                <ScrollView contentContainerStyle={styles.dayGrid}>
                    {availableDays.map(day => {
                        const isLocked = !user && day !== 1;
                        return (
                            <TouchableOpacity 
                                key={day} 
                                style={[styles.dayChip, selectedDays.includes(day) ? styles.dayChipActive : null, isLocked ? { opacity: 0.5 } : null]} 
                                onPress={() => toggleDay(day)}
                            >
                                <Text style={[styles.dayText, selectedDays.includes(day) ? styles.dayTextActive : null]}>Ngày {day} {isLocked ? '🔒' : ''}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => setQuizState('menu')}><Text style={styles.secondaryButtonText}>Quay lại</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={startQuiz}><Text style={styles.primaryButtonText}>Bắt đầu</Text></TouchableOpacity>
                </View>
            </View>
        );
    }

    if (quizState === 'active') {
        const q = questions[currentQuestionIndex];
        return (
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.quizHeader}>
                    <Text style={styles.quizProgress}>Câu {currentQuestionIndex + 1} / {questions.length}</Text>
                    <View style={styles.quizProgressBar}><View style={[styles.quizProgressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} /></View>
                </View>
                <View style={styles.questionContainer}>
                    <Text style={styles.questionTitle}>Ý nghĩa của cấu trúc:</Text>
                    <Text style={styles.questionText}>{q.card.grammar}</Text>
                </View>
                <View style={styles.optionsContainer}>
                    {q.options.map((opt) => {
                        let btnStyle = styles.answerButton;
                        let textStyle = styles.answerText;
                        if (showExplanation) {
                            if (opt.id === q.card.id) {
                                btnStyle = [styles.answerButton, styles.answerButtonCorrect];
                                textStyle = [styles.answerText, styles.answerTextCorrect];
                            } else if (opt.id === selectedOption?.id) {
                                btnStyle = [styles.answerButton, styles.answerButtonWrong];
                                textStyle = [styles.answerText, styles.answerTextWrong];
                            } else {
                                btnStyle = [styles.answerButton, { opacity: 0.5 }];
                            }
                        }
                        return (
                            <TouchableOpacity key={opt.id} style={btnStyle} onPress={() => handleAnswer(opt)} activeOpacity={showExplanation ? 1 : 0.7}>
                                <Text style={textStyle}>{opt.meaning}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {showExplanation && (
                    <View style={styles.explanationContainer}>
                        <View style={[styles.feedbackBadge, selectedOption?.id === q.card.id ? styles.feedbackCorrect : styles.feedbackWrong]}>
                            <Text style={styles.feedbackText}>
                                {selectedOption?.id === q.card.id ? '✅ CHÍNH XÁC' : '❌ SAI PHẦN NÀY'}
                            </Text>
                        </View>
                        <Text style={styles.explanationTitle}>Giải thích chi tiết:</Text>
                        <Text style={styles.explanationContent}>
                            <Text style={{fontWeight: 'bold'}}>• Ý nghĩa: </Text>{q.card.meaning}
                        </Text>
                        <Text style={styles.explanationContent}>
                            <Text style={{fontWeight: 'bold'}}>• Cách dùng: </Text>{q.card.usage}
                        </Text>
                        {q.card.note ? (
                            <Text style={styles.explanationContent}>
                                <Text style={{fontWeight: 'bold'}}>• Lưu ý: </Text>{q.card.note}
                            </Text>
                        ) : null}

                        {q.card.examples && q.card.examples.length > 0 ? (
                            <View style={styles.exampleBox}>
                                <Text style={styles.exampleJp}>{q.card.examples[0].jp}</Text>
                                <Text style={styles.exampleVi}>{q.card.examples[0].vi}</Text>
                            </View>
                        ) : null}
                        
                        <TouchableOpacity style={styles.nextQuestionButton} onPress={handleNextQuestion}>
                            <Text style={styles.nextQuestionText}>{currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        );
    }

    if (quizState === 'result') {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.resultHeader}>
                    <Text style={styles.resultEmoji}>{score > 10 ? '🎉' : '💪'}</Text>
                    <Text style={styles.resultTitle}>Kết quả: {score} / {questions.length}</Text>
                </View>
                <TouchableOpacity style={styles.mainButton} onPress={() => setQuizState('menu')}><Text style={styles.mainButtonText}>Làm lại</Text></TouchableOpacity>
                <View style={styles.reviewSection}>
                    {userAnswers.map((ans, i) => (
                        <View key={i} style={[styles.reviewItem, ans.isCorrect ? styles.correctItem : styles.wrongItem]}>
                            <Text style={styles.reviewGrammar}>{ans.question.card.grammar}</Text>
                            <Text style={styles.reviewAnswer}>Chọn: {ans.selected.meaning}</Text>
                            {ans.isCorrect ? null : <Text style={styles.correctAnswer}>Đúng: {ans.question.card.meaning}</Text>}
                        </View>
                    ))}
                </View>
            </ScrollView>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f7fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 24 },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: '#718096', marginTop: 4 },
    options: { paddingHorizontal: 16 },
    optionCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, borderLeftWidth: 6, borderLeftColor: '#e53e3e', elevation: 2 },
    optionEmoji: { fontSize: 32, marginRight: 16 },
    optionTitle: { fontSize: 16, fontWeight: 'bold' },
    optionDesc: { fontSize: 12, color: '#718096' },
    dayGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16 },
    dayChip: { width: (width - 64) / 3, height: 45, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', margin: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    dayChipActive: { backgroundColor: '#e53e3e', borderColor: '#e53e3e' },
    dayText: { fontSize: 14, color: '#4a5568' },
    dayTextActive: { color: '#fff' },
    footer: { padding: 20, flexDirection: 'row' },
    primaryButton: { flex: 2, height: 56, backgroundColor: '#e53e3e', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    primaryButtonText: { color: '#fff', fontWeight: 'bold' },
    secondaryButton: { flex: 1, height: 56, backgroundColor: '#edf2f7', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    secondaryButtonText: { color: '#4a5568' },
    quizHeader: { padding: 20, backgroundColor: '#fff' },
    quizProgress: { fontSize: 14, color: '#718096', marginBottom: 8 },
    quizProgressBar: { height: 8, backgroundColor: '#edf2f7', borderRadius: 4 },
    quizProgressFill: { height: '100%', backgroundColor: '#48bb78', borderRadius: 4 },
    questionContainer: { padding: 30, alignItems: 'center' },
    questionTitle: { fontSize: 16, color: '#718096' },
    questionText: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
    optionsContainer: { paddingHorizontal: 20 },
    answerButton: { backgroundColor: '#fff', padding: 18, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    answerButtonCorrect: { backgroundColor: '#f0fff4', borderColor: '#48bb78', borderWidth: 2 },
    answerButtonWrong: { backgroundColor: '#fff5f5', borderColor: '#e53e3e', borderWidth: 2 },
    answerText: { fontSize: 16, textAlign: 'center' },
    answerTextCorrect: { color: '#276749', fontWeight: 'bold' },
    answerTextWrong: { color: '#c53030', fontWeight: 'bold' },
    explanationContainer: { padding: 20, marginHorizontal: 20, backgroundColor: '#ebf8ff', borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: '#bee3f8' },
    feedbackBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
    feedbackCorrect: { backgroundColor: '#c6f6d5' },
    feedbackWrong: { backgroundColor: '#fed7d7' },
    feedbackText: { fontSize: 13, fontWeight: 'bold', color: '#2d3748' },
    explanationTitle: { fontSize: 16, fontWeight: 'bold', color: '#2b6cb0', marginBottom: 8 },
    explanationContent: { fontSize: 15, color: '#2c5282', marginBottom: 6, lineHeight: 22 },
    exampleBox: { marginTop: 8, padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#bee3f8' },
    exampleJp: { fontSize: 15, fontWeight: '500', color: '#2b6cb0', marginBottom: 4 },
    exampleVi: { fontSize: 14, color: '#4a5568', fontStyle: 'italic' },
    nextQuestionButton: { backgroundColor: '#4299e1', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
    nextQuestionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    resultHeader: { padding: 40, alignItems: 'center', backgroundColor: '#fff' },
    resultEmoji: { fontSize: 64 },
    resultTitle: { fontSize: 24, fontWeight: 'bold' },
    mainButton: { margin: 20, height: 56, backgroundColor: '#e53e3e', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    mainButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    reviewSection: { paddingHorizontal: 16, paddingBottom: 40 },
    reviewItem: { padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4 },
    correctItem: { backgroundColor: '#f0fff4', borderLeftColor: '#48bb78' },
    wrongItem: { backgroundColor: '#fff5f5', borderLeftColor: '#e53e3e' },
    reviewGrammar: { fontSize: 16, fontWeight: 'bold' },
    reviewAnswer: { fontSize: 14 },
    correctAnswer: { fontSize: 14, color: '#48bb78' }
});
