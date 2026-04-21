import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { ref, push, set } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from '../firebase/config';
import { flashcardsData } from '../data/flashcards';

const { width } = Dimensions.get('window');

/**
 * JLPT Mock Test Screen
 * Simulates JLPT Exam levels N5-N1 based on available data
 */
export default function JLPTTestScreen() {
    const [user, setUser] = useState(null);
    const [testState, setTestState] = useState('menu'); // 'menu', 'active', 'result', 'review'
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // { index: selectedOption }
    const [startTime, setStartTime] = useState(null);
    const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return unsubscribe;
    }, []);

    // Generate Exam Questions (20 questions per test)
    const generateExam = (level) => {
        // Lọc dữ liệu theo level
        let pool = flashcardsData.filter(c => c.level === level);
        
        // Nếu không đủ 20 câu của level đó, lấy thêm từ các level khác để đủ 20
        if (pool.length < 20) {
            const others = flashcardsData.filter(c => c.level !== level).sort(() => 0.5 - Math.random());
            pool = [...pool, ...others.slice(0, 20 - pool.length)];
        }

        const selectedCards = pool.sort(() => 0.5 - Math.random()).slice(0, 20);

        const examQuestions = selectedCards.map((card, index) => {
            const questionType = ['meaning', 'usage', 'example'][Math.floor(Math.random() * 3)];
            let questionText = "";
            let correctAnswer = "";
            
            if (questionType === 'meaning') {
                questionText = `Ý nghĩa của cấu trúc "${card.grammar}" là gì?`;
                correctAnswer = card.meaning;
            } else if (questionType === 'usage') {
                questionText = `Cách sử dụng "${card.grammar}" đúng nhất là:`;
                correctAnswer = card.usage || card.meaning;
            } else {
                // Example based
                const example = (card.examples && card.examples.length > 0) ? card.examples[0].jp : "N/A";
                questionText = `Điền cấu trúc phù hợp vào câu: "${example.replace(card.grammar, '____')}"`;
                correctAnswer = card.grammar;
            }

            // Distractors
            const distractors = flashcardsData.filter(c => c.id !== card.id).sort(() => 0.5 - Math.random()).slice(0, 3);
            const options = [card, ...distractors].sort(() => 0.5 - Math.random());

            return {
                id: card.id,
                type: questionType,
                question: questionText,
                card: card,
                options: options.map(o => ({
                    id: o.id,
                    text: questionType === 'meaning' ? o.meaning : (questionType === 'usage' ? (o.usage || o.meaning) : o.grammar)
                })),
                correctAnswer: questionType === 'meaning' ? card.meaning : (questionType === 'usage' ? (card.usage || card.meaning) : card.grammar)
            };
        });

        setQuestions(examQuestions);
        setTestState('active');
        setCurrentIndex(0);
        setScore(0);
        setUserAnswers({});
        setStartTime(Date.now());
        setTimeLeft(3600);
    };

    // Timer Logic
    useEffect(() => {
        let interval;
        if (testState === 'active' && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && testState === 'active') {
            finishTest();
        }
        return () => clearInterval(interval);
    }, [testState, timeLeft]);

    const handleLevelSelect = (level) => {
        if (!user && level !== 'N5') {
            Alert.alert('Khóa tính năng', 'Vui lòng đăng nhập để thi thử các cấp độ cao hơn. Khách chỉ có thể thi thử N5.');
            return;
        }
        setSelectedLevel(level);
        Alert.alert(
            'Bắt đầu thi thử',
            `Bạn đã sẵn làm bài thi mô phỏng cấp độ ${level}? (Thời gian: 60 phút, 20 câu hỏi)`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Bắt đầu', onPress: () => generateExam(level) }
            ]
        );
    };

    const handleAnswer = (optionText) => {
        const newAnswers = { ...userAnswers, [currentIndex]: optionText };
        setUserAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const finishTest = async () => {
        let finalScore = 0;
        questions.forEach((q, idx) => {
            if (userAnswers[idx] === q.correctAnswer) {
                finalScore++;
            }
        });
        setScore(finalScore);
        setTestState('result');

        // Sync with Firebase
        if (user) {
            try {
                const resultsRef = ref(database, `users/${user.uid}/test_results`);
                const newResultRef = push(resultsRef);
                await set(newResultRef, {
                    level: selectedLevel,
                    score: finalScore,
                    total: questions.length,
                    timestamp: Date.now(),
                    duration: 3600 - timeLeft
                });
            } catch (error) {
                console.error('Lỗi lưu kết quả thi:', error);
            }
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Render Menu
    if (testState === 'menu') {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Luyện thi JLPT</Text>
                    <Text style={styles.subtitle}>Kiểm tra trình độ với các bài thi mô phỏng thực tế</Text>
                </View>

                <View style={styles.levels}>
                    {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => {
                        const isLocked = !user && level !== 'N5';
                        return (
                            <TouchableOpacity key={level} style={[styles.levelCard, isLocked ? { opacity: 0.6 } : null]} onPress={() => handleLevelSelect(level)}>
                                <View style={[styles.levelBadge, isLocked ? { backgroundColor: '#a0aec0' } : null]}>
                                    <Text style={styles.levelText}>{level}</Text>
                                </View>
                                <View style={styles.levelInfo}>
                                    <Text style={styles.levelTitle}>Kỳ thi mô phỏng {level} {isLocked ? '🔒' : ''}</Text>
                                    <Text style={styles.levelDesc}>Cấu trúc 100% giống đề thi thật</Text>
                                </View>
                                <Text style={styles.arrow}>{isLocked ? '🔒' : '›'}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        );
    }

    // Render Active Test
    if (testState === 'active') {
        const q = questions[currentIndex];
        return (
            <View style={styles.container}>
                <View style={styles.testHeader}>
                    <View style={styles.timerRow}>
                        <Text style={styles.timerText}>⏳ {formatTime(timeLeft)}</Text>
                        <TouchableOpacity onPress={finishTest}>
                            <Text style={styles.finishBtn}>Nộp bài</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.testProgressBar}>
                        <View style={[styles.testProgressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
                    </View>
                    <Text style={styles.testIndex}>Câu {currentIndex + 1} / {questions.length}</Text>
                </View>

                <ScrollView style={styles.questionSection}>
                    <Text style={styles.questionText}>{q.question}</Text>

                    <View style={styles.optionsList}>
                        {q.options.map((opt, i) => (
                            <TouchableOpacity 
                                key={i} 
                                style={[styles.optionBtn, userAnswers[currentIndex] === opt.text ? styles.optionBtnSelected : null]}
                                onPress={() => handleAnswer(opt.text)}
                            >
                                <Text style={[styles.optionLabel, userAnswers[currentIndex] === opt.text ? styles.optionLabelSelected : null]}>
                                    {String.fromCharCode(65 + i)}. {opt.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.navRow}>
                    <TouchableOpacity 
                        style={[styles.navBtn, currentIndex === 0 && { opacity: 0.5 }]} 
                        disabled={currentIndex === 0}
                        onPress={() => setCurrentIndex(currentIndex - 1)}
                    >
                        <Text style={styles.navBtnText}>Trở lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.navBtn, currentIndex === questions.length - 1 && { opacity: 0.5 }]} 
                        disabled={currentIndex === questions.length - 1}
                        onPress={() => setCurrentIndex(currentIndex + 1)}
                    >
                        <Text style={styles.navBtnText}>Tiếp theo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Render Result
    if (testState === 'result') {
        return (
            <View style={styles.container}>
                <View style={styles.resultView}>
                    <Text style={styles.resultTitle}>Kết quả thi thử {selectedLevel}</Text>
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreValue}>{score}</Text>
                        <Text style={styles.scoreMax}>/ {questions.length}</Text>
                    </View>
                    <Text style={styles.resultMsg}>
                        {score >= 12 ? 'Chúc mừng! Bạn đã đạt mức đỗ (Pass).' : 'Bạn cần cố gắng thêm một chút nữa.'}
                    </Text>
                    
                    <TouchableOpacity 
                        style={[styles.primaryBtn, { marginBottom: 12 }]} 
                        onPress={() => {
                            setCurrentIndex(0);
                            setTestState('review');
                        }}
                    >
                        <Text style={styles.primaryBtnText}>Xem lại bài</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryBtn} onPress={() => setTestState('menu')}>
                        <Text style={styles.secondaryBtnText}>Về trang chủ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Render Review Mode
    if (testState === 'review') {
        const q = questions[currentIndex];
        const userAnswer = userAnswers[currentIndex];
        const isCorrect = userAnswer === q.correctAnswer;

        return (
            <View style={styles.container}>
                <View style={styles.testHeader}>
                    <TouchableOpacity onPress={() => setTestState('result')}>
                        <Text style={styles.finishBtn}>Thoát xem lại</Text>
                    </TouchableOpacity>
                    <View style={styles.testProgressBar}>
                        <View style={[styles.testProgressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
                    </View>
                    <Text style={styles.testIndex}>Câu {currentIndex + 1} / {questions.length}</Text>
                </View>

                <ScrollView style={styles.questionSection}>
                    <View style={[styles.statusBadge, isCorrect ? styles.correctBadge : styles.wrongBadge]}>
                        <Text style={styles.statusBadgeText}>{isCorrect ? 'ĐÚNG' : 'SAI'}</Text>
                    </View>
                    
                    <Text style={styles.questionText}>{q.question}</Text>

                    <View style={styles.optionsList}>
                        {q.options.map((opt, i) => {
                            const isSelected = userAnswer === opt.text;
                            const isCorrectOpt = opt.text === q.correctAnswer;
                            
                            let optStyle = null;
                            if (isCorrectOpt) optStyle = styles.optionCorrect;
                            else if (isSelected && !isCorrect) optStyle = styles.optionWrong;

                            return (
                                <View 
                                    key={i} 
                                    style={[styles.optionBtn, optStyle]}
                                >
                                    <Text style={[styles.optionLabel, isSelected || isCorrectOpt ? { fontWeight: 'bold' } : null]}>
                                        {String.fromCharCode(65 + i)}. {opt.text}
                                        {isCorrectOpt && ' ✓'}
                                        {isSelected && !isCorrect && ' ✗'}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.explanationBox}>
                        <Text style={styles.explanationTitle}>Giải thích:</Text>
                        <Text style={styles.explanationText}>
                            Cấu trúc: <Text style={{fontWeight:'bold'}}>{q.card.grammar}</Text>{"\n"}
                            Ý nghĩa: {q.card.meaning}{"\n"}
                            {q.card.note}
                        </Text>
                        {q.card.examples && q.card.examples.length > 0 && (
                            <View style={{marginTop: 10}}>
                                <Text style={styles.explanationTitle}>Ví dụ:</Text>
                                <Text style={styles.exampleText}>{q.card.examples[0].jp}</Text>
                                <Text style={styles.exampleVi}>{q.card.examples[0].vi}</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.navRow}>
                    <TouchableOpacity 
                        style={[styles.navBtn, currentIndex === 0 && { opacity: 0.5 }]} 
                        disabled={currentIndex === 0}
                        onPress={() => setCurrentIndex(currentIndex - 1)}
                    >
                        <Text style={styles.navBtnText}>Trở lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.navBtn, currentIndex === questions.length - 1 && { opacity: 0.5 }]} 
                        disabled={currentIndex === questions.length - 1}
                        onPress={() => setCurrentIndex(currentIndex + 1)}
                    >
                        <Text style={styles.navBtnText}>Tiếp theo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7fafc',
    },
    header: {
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d3748',
    },
    subtitle: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
    },
    levels: {
        paddingHorizontal: 16,
    },
    levelCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    levelBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e53e3e',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    levelText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    levelInfo: {
        flex: 1,
    },
    levelTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2d3748',
    },
    levelDesc: {
        fontSize: 12,
        color: '#718096',
    },
    arrow: {
        fontSize: 24,
        color: '#cbd5e0',
    },
    // Test Screen Styles
    testHeader: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2f7',
    },
    timerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    timerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e53e3e',
    },
    finishBtn: {
        color: '#4299e1',
        fontWeight: 'bold',
    },
    testProgressBar: {
        height: 6,
        backgroundColor: '#edf2f7',
        borderRadius: 3,
        marginBottom: 8,
    },
    testProgressFill: {
        height: '100%',
        backgroundColor: '#48bb78',
        borderRadius: 3,
    },
    testIndex: {
        fontSize: 12,
        color: '#718096',
        textAlign: 'right',
    },
    questionSection: {
        flex: 1,
        padding: 24,
    },
    questionText: {
        fontSize: 20,
        lineHeight: 30,
        color: '#2d3748',
        marginBottom: 30,
        fontWeight: '500',
    },
    optionsList: {
        marginBottom: 40,
    },
    optionBtn: {
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    optionBtnSelected: {
        borderColor: '#e53e3e',
        backgroundColor: '#fff5f5',
    },
    optionLabel: {
        fontSize: 16,
        color: '#4a5568',
    },
    optionLabelSelected: {
        color: '#e53e3e',
        fontWeight: 'bold',
    },
    navRow: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#edf2f7',
    },
    navBtn: {
        flex: 1,
        height: 50,
        backgroundColor: '#f7fafc',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    navBtnText: {
        fontSize: 16,
        color: '#4a5568',
        fontWeight: '600',
    },
    // Result View
    resultView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    scoreCircle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 10,
        borderColor: '#e53e3e',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#2d3748',
    },
    scoreMax: {
        fontSize: 18,
        color: '#a0aec0',
    },
    resultMsg: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 50,
    },
    primaryBtn: {
        width: '100%',
        height: 56,
        backgroundColor: '#e53e3e',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryBtn: {
        width: '100%',
        height: 56,
        backgroundColor: '#fff',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    secondaryBtnText: {
        color: '#4a5568',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    correctBadge: {
        backgroundColor: '#c6f6d5',
    },
    wrongBadge: {
        backgroundColor: '#fed7d7',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2d3748',
    },
    optionCorrect: {
        borderColor: '#48bb78',
        backgroundColor: '#f0fff4',
    },
    optionWrong: {
        borderColor: '#e53e3e',
        backgroundColor: '#fff5f5',
    },
    explanationBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#edf2f7',
        marginTop: 20,
        marginBottom: 40,
    },
    explanationTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: 8,
    },
    explanationText: {
        fontSize: 15,
        color: '#4a5568',
        lineHeight: 22,
    },
    exampleText: {
        fontSize: 15,
        color: '#2d3748',
        fontStyle: 'italic',
    },
    exampleVi: {
        fontSize: 14,
        color: '#718096',
        marginTop: 4,
    }
});
