import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ref, onValue, set, update } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from '../firebase/config';
import Flashcard from '../components/Flashcard';
import { flashcardsData } from '../data/flashcards';
import { calculateNextReview, SPACED_REP_CONFIG } from '../logic/spaced-repetition';

export default function FlashcardsScreen() {
    const [user, setUser] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null); // null = All
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardProgress, setCardProgress] = useState({});
    const [loading, setLoading] = useState(true);
    const [showOnlyDue, setShowOnlyDue] = useState(false);

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

    // Danh sách các ngày duy nhất
    const days = useMemo(() => {
        const uniqueDays = [...new Set(flashcardsData.map(c => c.day))].sort((a, b) => a - b);
        return [null, ...uniqueDays];
    }, []);

    // Lọc thẻ theo ngày và trạng thái Cần ôn (Due)
    const filteredCards = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);
        return flashcardsData.filter(c => {
            const dayMatch = selectedDay === null || c.day === selectedDay;
            const prog = cardProgress[c.id];
            
            if (showOnlyDue) {
                // Thẻ Mới (chưa có progress) hoặc Thẻ đã đến hạn
                if (!prog) return dayMatch;
                return (prog.status === 'learning') || (prog.status === 'review' && prog.due_date <= today);
            }
            return dayMatch;
        });
    }, [selectedDay, showOnlyDue, cardProgress]);

    // Thẻ hiện tại trong danh sách đã lọc
    const currentCard = filteredCards[currentIndex];

    // Reset index khi đổi bộ lọc
    const handleSelectDay = (day) => {
        setSelectedDay(day);
        setCurrentIndex(0);
    };

    const handleSwipe = async (quality) => {
        if (!currentCard || !user) {
            // Nếu khách, vẫn cho qua thẻ tiếp theo
            if (currentIndex < filteredCards.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                alert('🎉 Bạn đã hoàn thành các thẻ.');
            }
            return;
        }

        const currentProg = cardProgress[currentCard.id] || {
            status: 'new',
            interval: 0,
            ease_factor: SPACED_REP_CONFIG?.initialEaseFactor || 2.5,
            review_count: 0
        };

        const newProg = calculateNextReview(currentProg, quality);
        
        // Sync with Firebase
        try {
            const progressRef = ref(database, `users/${user.uid}/card_progress/${currentCard.id}`);
            await set(progressRef, {
                ...newProg,
                last_reviewed: Date.now()
            });

            if (currentIndex < filteredCards.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                alert('🎉 Tuyệt vời! Bạn đã ôn tập xong các thẻ.');
            }
        } catch (error) {
            console.error('Lỗi sync firebase:', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Filter Section */}
            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    <TouchableOpacity 
                        style={[styles.dueToggle, showOnlyDue ? styles.dueToggleActive : null]}
                        onPress={() => { setShowOnlyDue(!showOnlyDue); setCurrentIndex(0); }}
                    >
                        <Text style={[styles.dueToggleText, showOnlyDue ? styles.dueToggleTextActive : null]}>
                            🔔 {showOnlyDue ? 'Đang lọc: Cần ôn' : 'Tất cả thẻ'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {days.map((day) => (
                        <TouchableOpacity 
                            key={String(day)} 
                            style={[styles.filterChip, selectedDay === day ? styles.filterChipActive : null]}
                            onPress={() => handleSelectDay(day)}
                        >
                            <Text style={[styles.filterText, selectedDay === day ? styles.filterTextActive : null]}>
                                {day === null ? 'Toàn bộ bài' : `Ngày ${day}`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#e53e3e" />
                </View>
            ) : (
                <>
                    <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    Tiến độ: {filteredCards.length > 0 ? currentIndex + 1 : 0} / {filteredCards.length}
                </Text>
                <View style={styles.progressBar}>
                    <View style={[
                        styles.progressFill, 
                        { width: filteredCards.length > 0 ? `${((currentIndex + 1) / filteredCards.length) * 100}%` : '0%' }
                    ]} />
                </View>
            </View>

                    <View style={styles.cardWrapper}>
                        {currentCard ? (
                            <Flashcard card={currentCard} onSwipe={handleSwipe} />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyEmoji}>✨</Text>
                                <Text style={styles.emptyText}>Tuyệt vời! Bạn không có thẻ nào cần học trong mục này.</Text>
                            </View>
                        )}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7fafc',
        paddingTop: 5,
    },
    filterWrapper: {
        height: 50,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#edf2f7',
        paddingVertical: 8,
    },
    filterScroll: {
        paddingHorizontal: 15,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        height: 32,
        justifyContent: 'center',
    },
    filterChipActive: {
        backgroundColor: '#e53e3e',
    },
    filterText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#fff',
    },
    dueToggle: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 8,
        height: 32,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dueToggleActive: {
        backgroundColor: '#fef2f2',
        borderColor: '#e53e3e',
    },
    dueToggleText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
    },
    dueToggleTextActive: {
        color: '#e53e3e',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 8,
        alignSelf: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        color: '#718096',
        fontSize: 16,
        textAlign: 'center',
    }
});
