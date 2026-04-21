import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, Dimensions, ScrollView, TouchableOpacity, Animated, PanResponder } from 'react-native';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

export default function Flashcard({ card, onSwipe }) {
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Core animation values
    const pan = useRef(new Animated.ValueXY()).current;
    const flipAnim = useRef(new Animated.Value(0)).current; // 0: front, 180: back

    // Flip action
    const toggleFlip = () => {
        setIsFlipped(!isFlipped);
        Animated.spring(flipAnim, {
            toValue: !isFlipped ? 180 : 0,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
    };

    const handleQualitySelect = (quality) => {
        onSwipe(quality);
        
        // Reset card immediately 
        pan.setValue({ x: 0, y: 0 });
        flipAnim.setValue(0);
        setIsFlipped(false);
    };

    const handleSwipeSubmit = (direction) => {
        const quality = direction === 'right' ? 'good' : 'again';
        handleQualitySelect(quality);
    };

    // Pan Responder setup for Tinder swipe
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    Animated.timing(pan, {
                        toValue: { x: width * 1.5, y: gesture.dy },
                        duration: 250,
                        useNativeDriver: false,
                    }).start(() => handleSwipeSubmit('right'));
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    Animated.timing(pan, {
                        toValue: { x: -width * 1.5, y: gesture.dy },
                        duration: 250,
                        useNativeDriver: false,
                    }).start(() => handleSwipeSubmit('left'));
                } else {
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        friction: 5,
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    // Interpolations
    const rotateZ = pan.x.interpolate({
        inputRange: [-width, 0, width],
        outputRange: ['-15deg', '0deg', '15deg'],
        extrapolate: 'clamp',
    });

    const frontRotateY = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });

    const backRotateY = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const frontOpacity = flipAnim.interpolate({
        inputRange: [89, 90],
        outputRange: [1, 0],
    });

    const backOpacity = flipAnim.interpolate({
        inputRange: [89, 90],
        outputRange: [0, 1],
    });

    const leftStampOpacity = pan.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const rightStampOpacity = pan.x.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const cardAnimatedStyle = {
        transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotateZ }
        ]
    };

    return (
        <View style={[styles.cardWrapper]}>
            <Animated.View style={[styles.panContainer, cardAnimatedStyle]} {...panResponder.panHandlers}>
                <TouchableOpacity onPress={toggleFlip} activeOpacity={1} style={styles.touchable}>
                    
                    {/* Front Face */}
                    <Animated.View style={[styles.cardContainer, { transform: [{ rotateY: frontRotateY }, {perspective: 1000}], opacity: frontOpacity }]}>
                        <Animated.View style={[styles.stampDrop, styles.stampLeft, { opacity: leftStampOpacity }]}>
                            <Text style={styles.stampTextLeft}>CHƯA THUỘC</Text>
                        </Animated.View>
                        <Animated.View style={[styles.stampDrop, styles.stampRight, { opacity: rightStampOpacity }]}>
                            <Text style={styles.stampTextRight}>ĐÃ THUỘC</Text>
                        </Animated.View>

                        <View style={styles.cardFace}>
                            <Text style={styles.grammarTitle}>{card.grammar}</Text>
                            <View style={styles.tapHint}>
                                <Text style={styles.hintEmoji}>👆</Text>
                                <Text style={styles.hint}>Nhấp để lật mặt sau</Text>
                                <Text style={styles.hintSwipe}>Hoặc vuốt Trái/Phải để học</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Back Face */}
                    <Animated.View style={[styles.cardContainer, styles.cardBackContainer, { transform: [{ rotateY: backRotateY }, {perspective: 1000}], opacity: backOpacity }]}>
                        <ScrollView style={styles.scrollFace} contentContainerStyle={[styles.cardFace, {paddingBottom: 20}]}>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>📖 Ý nghĩa</Text>
                                <Text style={styles.meaningText}>{card.meaning}</Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>🛠 Cách dùng</Text>
                                <Text style={styles.usageText}>{card.usage}</Text>
                                {card.note && <Text style={styles.noteText}>👉 {card.note}</Text>}
                            </View>

                            {card.examples && card.examples.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>💡 Ví dụ</Text>
                                    <Text style={styles.exampleJp}>{card.examples[0].jp}</Text>
                                    <Text style={styles.exampleVi}>{card.examples[0].vi}</Text>
                                </View>
                            )}
                            
                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={[styles.qButton, {backgroundColor: '#fed7d7'}]} onPress={() => handleQualitySelect('again')}>
                                    <Text style={styles.qButtonText}>Again (1d)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.qButton, {backgroundColor: '#fef3c7'}]} onPress={() => handleQualitySelect('hard')}>
                                    <Text style={styles.qButtonText}>Hard (3d)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.qButton, {backgroundColor: '#d1fae5'}]} onPress={() => handleQualitySelect('good')}>
                                    <Text style={styles.qButtonText}>Good (7d)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.qButton, {backgroundColor: '#dbeafe'}]} onPress={() => handleQualitySelect('easy')}>
                                    <Text style={styles.qButtonText}>Easy (21d)</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    cardWrapper: { width: width * 0.85, height: 520, alignSelf: 'center', marginVertical: 20 },
    panContainer: { flex: 1 },
    touchable: { flex: 1 },
    cardContainer: { position: 'absolute', width: '100%', height: '100%', backgroundColor: '#fff', borderRadius: 24, backfaceVisibility: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
    cardBackContainer: { borderTopWidth: 6, borderTopColor: '#e53e3e' },
    scrollFace: { flex: 1, borderRadius: 24 },
    cardFace: { flexGrow: 1, padding: 30, justifyContent: 'center' },
    grammarTitle: { fontSize: 36, fontWeight: 'bold', color: '#e53e3e', textAlign: 'center' },
    tapHint: { marginTop: 40, alignItems: 'center' },
    hintEmoji: { fontSize: 24, marginBottom: 8 },
    hint: { color: '#a0aec0', fontSize: 14, fontWeight: '500' },
    hintSwipe: { color: '#cbd5e0', fontSize: 12, marginTop: 5, fontStyle: 'italic' },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#4299e1', marginBottom: 8, letterSpacing: 0.5 },
    meaningText: { fontSize: 18, color: '#2d3748', lineHeight: 26, fontWeight: '600' },
    usageText: { fontSize: 16, color: '#4a5568', backgroundColor: '#f7fafc', padding: 10, borderRadius: 8, fontStyle: 'italic' },
    noteText: { marginTop: 8, fontSize: 14, color: '#ed8936' },
    exampleJp: { fontSize: 16, color: '#2d3748', fontWeight: '500' },
    exampleVi: { fontSize: 14, color: '#718096', marginTop: 4 },
    buttonRow: { flexDirection: 'row', marginTop: 20 },
    qButton: { flex: 1, marginHorizontal: 4, paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    qButtonText: { fontSize: 11, fontWeight: 'bold', color: '#2d3748' },
    stampDrop: { position: 'absolute', top: 40, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 4, borderRadius: 10, transform: [{ rotate: '-15deg' }], zIndex: 10 },
    stampLeft: { right: 20, borderColor: '#e53e3e', transform: [{ rotate: '15deg' }] },
    stampTextLeft: { color: '#e53e3e', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
    stampRight: { left: 20, borderColor: '#48bb78' },
    stampTextRight: { color: '#48bb78', fontSize: 22, fontWeight: '900', letterSpacing: 1 }
});
