import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

export default function AuthModal({ onAuthSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async () => {
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            onAuthSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isLogin ? 'Chào mừng trở lại!' : 'Đăng ký tài khoản'}</Text>
            <Text style={styles.subtitle}>Cùng Antigravity chinh phục tiếng Nhật mỗi ngày</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput 
                style={styles.input} 
                placeholder="Email" 
                value={email} 
                onChangeText={setEmail}
                autoCapitalize="none"
            />
            <TextInput 
                style={styles.input} 
                placeholder="Mật khẩu" 
                secureTextEntry 
                value={password} 
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.switchText}>
                    {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 24,
        backgroundColor: '#fff',
        borderRadius: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d3748',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    input: {
        height: 56,
        backgroundColor: '#f7fafc',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    button: {
        height: 56,
        backgroundColor: '#e53e3e',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    switchButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    switchText: {
        color: '#4299e1',
        fontSize: 14,
        fontWeight: '600',
    },
    errorText: {
        color: '#e53e3e',
        fontSize: 12,
        marginBottom: 16,
        textAlign: 'center',
    }
});
