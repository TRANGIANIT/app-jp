import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const PETAL_COUNT = 15;

const SakuraPetal = () => {
    const animValue = useRef(new Animated.Value(0)).current;
    
    // Randomize initial position and timing
    const startX = Math.random() * width;
    const duration = 6000 + Math.random() * 5000;
    const delay = Math.random() * 10000;

    useEffect(() => {
        const startAnimation = () => {
            animValue.setValue(0);
            Animated.loop(
                Animated.timing(animValue, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: true,
                })
            ).start();
        };

        const timeout = setTimeout(startAnimation, delay);
        return () => clearTimeout(timeout);
    }, []);

    const translateY = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-20, height + 20],
    });

    const translateX = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [startX, startX + 50, startX - 20],
    });

    const rotate = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const opacity = animValue.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: [0, 0.6, 0.6, 0],
    });

    return (
        <Animated.View
            style={[
                styles.petal,
                {
                    opacity,
                    transform: [
                        { translateY },
                        { translateX },
                        { rotate },
                    ],
                },
            ]}
        />
    );
};

export default function SakuraAnimation({ children }) {
    return (
        <View style={styles.container}>
            {children}
            {Array.from({ length: PETAL_COUNT }).map((_, i) => (
                <SakuraPetal key={i} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7fafc',
    },
    petal: {
        position: 'absolute',
        width: 12,
        height: 12,
        backgroundColor: '#ffb7c5',
        borderRadius: 6,
        // Make it look more like a petal
        borderBottomRightRadius: 2,
    }
});
