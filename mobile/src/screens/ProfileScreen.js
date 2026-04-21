import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Switch } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue, get } from 'firebase/database';
import { auth, database } from '../firebase/config';
import AuthModal from '../components/auth/AuthModal';
import { flashcardsData } from '../data/flashcards';
import { useAudio } from '../logic/AudioContext';
import { scheduleDailyReminder } from '../logic/NotificationManager';
import * as Notifications from 'expo-notifications';

export default function ProfileScreen() {
    const { isPlaying, toggleMusic } = useAudio();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [notifsEnabled, setNotifsEnabled] = useState(true);
    const [stats, setStats] = useState({
        new: 0,
        due: 0,
        learning: 0,
        review: 0,
        daysLearned: 0,
        streak: 0
    });

    useEffect(() => {
        // Load notif state
        Notifications.getPermissionsAsync().then(({ status }) => {
            setNotifsEnabled(status === 'granted');
        });

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch stats from Firebase
                const progressRef = ref(database, `users/${currentUser.uid}/card_progress`);
                onValue(progressRef, (snapshot) => {
                    const data = snapshot.val() || {};
                    calculateStats(data);
                });
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const toggleNotifications = async (newValue) => {
        if (newValue) {
            await scheduleDailyReminder();
            const { status } = await Notifications.getPermissionsAsync();
            setNotifsEnabled(status === 'granted');
        } else {
            await Notifications.cancelAllScheduledNotificationsAsync();
            setNotifsEnabled(false);
        }
    };

    const calculateStats = (cardProgress) => {
        let newCount = flashcardsData.length;
        let dueCount = 0;
        let learningCount = 0;
        let reviewCount = 0;

        // Track unique days with activity
        const activityDays = new Set();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        Object.keys(cardProgress).forEach(cardId => {
            const progress = cardProgress[cardId];
            newCount--;

            if (progress.last_reviewed) {
                const reviewDate = new Date(progress.last_reviewed);
                reviewDate.setHours(0, 0, 0, 0);
                activityDays.add(reviewDate.getTime());
            }

            if (progress.status === 'learning') {
                learningCount++;
                dueCount++;
            } else if (progress.status === 'review') {
                reviewCount++;
                if (progress.due_date <= todayTimestamp) {
                    dueCount++;
                }
            }
        });

        // Calculate Streak
        let streak = 0;
        const sortedDays = Array.from(activityDays).sort((a, b) => b - a); // Newest first

        let checkDate = todayTimestamp;
        // Search if today or yesterday was active to start/continue streak
        if (activityDays.has(todayTimestamp) || activityDays.has(todayTimestamp - 86400000)) {
            if (!activityDays.has(todayTimestamp)) checkDate -= 86400000;

            while (activityDays.has(checkDate)) {
                streak++;
                checkDate -= 86400000;
            }
        }

        setStats({
            new: Math.max(0, newCount),
            due: dueCount,
            learning: learningCount,
            review: reviewCount,
            daysLearned: activityDays.size,
            streak: streak
        });
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            Alert.alert('Thông báo', 'Bạn đã đăng xuất thành công.');
        } catch (error) {
            Alert.alert('Lỗi', error.message);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#e53e3e" />
            </View>
        );
    }

    if (!user) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.center}>
                <AuthModal onAuthSuccess={() => { }} />
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.profileHeader}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{user.email ? user.email[0].toUpperCase() : 'U'}</Text>
                </View>
                <Text style={styles.userName}>{user.displayName || 'Học viên NIHONGO Roku 76'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>

                <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.streak}🔥</Text>
                    <Text style={styles.statLabel}>Ngày liên tiếp</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.daysLearned}</Text>
                    <Text style={styles.statLabel}>Tổng ngày học</Text>
                </View>
                <View style={[styles.statCard, { borderBottomColor: '#48bb78', borderBottomWidth: 3 }]}>
                    <Text style={styles.statValue}>{stats.review}</Text>
                    <Text style={styles.statLabel}>Đã thuộc</Text>
                </View>
            </View>

            <View style={styles.dashboardSection}>
                <Text style={styles.sectionTitle}>Dashboard Học Tập</Text>
                <View style={styles.dashboardGrid}>
                    <View style={styles.dashboardItem}>
                        <Text style={styles.dashboardValue}>{stats.learning}</Text>
                        <Text style={styles.dashboardLabel}>Đang học</Text>
                    </View>
                    <View style={styles.dashboardItem}>
                        <Text style={styles.dashboardValue}>{stats.due}</Text>
                        <Text style={styles.dashboardLabel}>Đến hạn</Text>
                    </View>
                </View>
            </View>

            <View style={styles.menu}>
                <TouchableOpacity style={styles.menuItem} onPress={toggleMusic}>
                    <Text style={[styles.menuText, { color: isPlaying ? '#d97706' : '#2d3748' }]}>
                        {isPlaying ? '🎵 Tắt Nhạc Nền' : '🎵 Bật Nhạc Nền (Lofi)'}
                    </Text>
                    <Text style={[styles.menuArrow, { color: isPlaying ? '#d97706' : '#cbd5e0' }]}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => setShowStatsModal(true)}>
                    <Text style={styles.menuText}>Thống kê Spaced Repetition</Text>
                    <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => setShowNotifModal(true)}>
                    <Text style={styles.menuText}>Cài đặt thông báo</Text>
                    <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                    <Text style={[styles.menuText, { color: '#e53e3e' }]}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>

            {/* Notification Modal */}
            <Modal visible={showNotifModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Thông báo</Text>
                        <View style={styles.modalRow}>
                            <Text style={styles.modalLabel}>Nhắc nhở học tập hàng ngày (9:00 AM)</Text>
                            <Switch value={notifsEnabled} onValueChange={toggleNotifications} />
                        </View>
                        <Text style={styles.modalDesc}>NIHONGO Roku76 sẽ nhắc bạn khi có thẻ đến hạn ôn tập.</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowNotifModal(false)}>
                            <Text style={styles.closeBtnText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Stats Modal */}
            <Modal visible={showStatsModal} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Thống kê chi tiết</Text>

                        <View style={styles.detailStat}>
                            <Text style={styles.detailLabel}>Tổng số ngữ pháp:</Text>
                            <Text style={styles.detailValue}>{flashcardsData.length}</Text>
                        </View>
                        <View style={styles.detailStat}>
                            <Text style={styles.detailLabel}>Chưa học:</Text>
                            <Text style={styles.detailValue}>{stats.new}</Text>
                        </View>
                        <View style={styles.detailStat}>
                            <Text style={styles.detailLabel}>Đang trong tiến trình học:</Text>
                            <Text style={styles.detailValue}>{stats.learning}</Text>
                        </View>
                        <View style={styles.detailStat}>
                            <Text style={styles.detailLabel}>Đã nắm vững (Review status):</Text>
                            <Text style={styles.detailValue}>{stats.review}</Text>
                        </View>
                        <View style={styles.detailStat}>
                            <Text style={styles.detailLabel}>Tỉ lệ hoàn thành:</Text>
                            <Text style={styles.detailValue}>{((stats.review / flashcardsData.length) * 100).toFixed(1)}%</Text>
                        </View>

                        <TouchableOpacity style={[styles.closeBtn, { marginTop: 20 }]} onPress={() => setShowStatsModal(false)}>
                            <Text style={styles.closeBtnText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7fafc',
    },
    center: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    profileHeader: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff',
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e53e3e',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2d3748',
    },
    userEmail: {
        fontSize: 14,
        color: '#a0aec0',
        marginTop: 4,
    },
    editButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#edf2f7',
    },
    editButtonText: {
        fontSize: 14,
        color: '#4a5568',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        padding: 16,
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e53e3e',
    },
    statLabel: {
        fontSize: 12,
        color: '#718096',
        marginTop: 4,
    },
    dashboardSection: {
        padding: 20,
        backgroundColor: '#fff',
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: 16,
    },
    dashboardGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dashboardItem: {
        flex: 1,
        backgroundColor: '#f7fafc',
        padding: 20,
        borderRadius: 16,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    dashboardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#e53e3e',
    },
    dashboardLabel: {
        fontSize: 12,
        color: '#718096',
        marginTop: 4,
    },
    menu: {
        backgroundColor: '#fff',
        marginTop: 16,
        paddingHorizontal: 16,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2f7',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 16,
        color: '#2d3748',
    },
    menuArrow: {
        fontSize: 20,
        color: '#cbd5e0',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalLabel: {
        fontSize: 16,
        color: '#4a5568',
        flex: 1,
    },
    modalDesc: {
        fontSize: 13,
        color: '#718096',
        marginBottom: 24,
    },
    closeBtn: {
        backgroundColor: '#edf2f7',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4a5568',
    },
    detailStat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2f7',
    },
    detailLabel: {
        fontSize: 15,
        color: '#718096',
    },
    detailValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2d3748',
    }
});
