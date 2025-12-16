import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './NotificationSettings.css';

export default function NotificationSettings() {
    const { t } = useTranslation();
    const [pushEnabled, setPushEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [vapidPublicKey, setVapidPublicKey] = useState('');

    useEffect(() => {
        checkPushSubscription();
        fetchNotificationSettings();
    }, []);

    const fetchNotificationSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/users/notification-settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmailEnabled(response.data.emailNotifications || true);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const checkPushSubscription = async () => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const existingSubscription = await registration.pushManager.getSubscription();

                if (existingSubscription) {
                    setSubscription(existingSubscription);
                    setPushEnabled(true);
                }
            } catch (error) {
                console.error('Error checking subscription:', error);
            }
        }
    };

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeToPush = async () => {
        setLoading(true);
        try {
            // Get VAPID public key from backend
            const token = localStorage.getItem('token');
            const keyResponse = await axios.get('/api/push/vapid-public-key', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const vapidKey = keyResponse.data.publicKey;
            setVapidPublicKey(vapidKey);

            // Request notification permission
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                alert('Permissão de notificação negada');
                return;
            }

            // Subscribe to push
            const registration = await navigator.serviceWorker.ready;
            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            // Send subscription to backend
            await axios.post('/api/push/subscribe', newSubscription, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSubscription(newSubscription);
            setPushEnabled(true);
            alert('Notificações push ativadas com sucesso!');
        } catch (error) {
            console.error('Error subscribing to push:', error);
            alert('Erro ao ativar notificações push: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        setLoading(true);
        try {
            if (subscription) {
                await subscription.unsubscribe();

                const token = localStorage.getItem('token');
                await axios.post('/api/push/unsubscribe', subscription, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setSubscription(null);
            setPushEnabled(false);
            alert('Notificações push desativadas');
        } catch (error) {
            console.error('Error unsubscribing:', error);
            alert('Erro ao desativar notificações push');
        } finally {
            setLoading(false);
        }
    };

    const toggleEmailNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('/api/users/notification-settings', {
                emailNotifications: !emailEnabled
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmailEnabled(!emailEnabled);
        } catch (error) {
            console.error('Error updating email settings:', error);
            alert('Erro ao atualizar configurações de email');
        }
    };

    const sendTestNotification = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/push/test', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Notificação de teste enviada!');
        } catch (error) {
            console.error('Error sending test notification:', error);
            alert('Erro ao enviar notificação de teste');
        }
    };

    return (
        <div className="notification-settings">
            <h2>🔔 Configurações de Notificações</h2>

            {/* Push Notifications */}
            <div className="settings-section">
                <div className="setting-header">
                    <h3>Notificações Push</h3>
                    <p>Receba alertas em tempo real sobre novos chamados e atualizações</p>
                </div>

                <div className="setting-content">
                    {!('serviceWorker' in navigator) || !('PushManager' in window) ? (
                        <div className="warning-box">
                            ⚠️ Seu navegador não suporta notificações push
                        </div>
                    ) : (
                        <>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <strong>Status</strong>
                                    <span className={`status-badge ${pushEnabled ? 'active' : 'inactive'}`}>
                                        {pushEnabled ? '✅ Ativado' : '❌ Desativado'}
                                    </span>
                                </div>
                                <button
                                    className={`btn ${pushEnabled ? 'btn-danger' : 'btn-primary'}`}
                                    onClick={pushEnabled ? unsubscribeFromPush : subscribeToPush}
                                    disabled={loading}
                                >
                                    {loading ? 'Processando...' : (pushEnabled ? 'Desativar' : 'Ativar')}
                                </button>
                            </div>

                            {pushEnabled && (
                                <div className="setting-row">
                                    <div className="setting-info">
                                        <strong>Testar Notificação</strong>
                                        <small>Enviar uma notificação de teste</small>
                                    </div>
                                    <button className="btn btn-secondary" onClick={sendTestNotification}>
                                        Enviar Teste
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Email Notifications */}
            <div className="settings-section">
                <div className="setting-header">
                    <h3>Notificações por Email</h3>
                    <p>Receba resumos diários e alertas importantes por email</p>
                </div>

                <div className="setting-content">
                    <div className="setting-row">
                        <div className="setting-info">
                            <strong>Status</strong>
                            <span className={`status-badge ${emailEnabled ? 'active' : 'inactive'}`}>
                                {emailEnabled ? '✅ Ativado' : '❌ Desativado'}
                            </span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={emailEnabled}
                                onChange={toggleEmailNotifications}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="settings-section">
                <div className="setting-header">
                    <h3>Preferências de Notificação</h3>
                    <p>Escolha quais eventos devem gerar notificações</p>
                </div>

                <div className="setting-content">
                    <div className="preference-list">
                        <label className="preference-item">
                            <input type="checkbox" defaultChecked />
                            <div className="preference-text">
                                <strong>Novos Chamados</strong>
                                <small>Quando um novo chamado é criado</small>
                            </div>
                        </label>

                        <label className="preference-item">
                            <input type="checkbox" defaultChecked />
                            <div className="preference-text">
                                <strong>Atualizações de Status</strong>
                                <small>Quando o status de um chamado muda</small>
                            </div>
                        </label>

                        <label className="preference-item">
                            <input type="checkbox" defaultChecked />
                            <div className="preference-text">
                                <strong>Novas Mensagens</strong>
                                <small>Quando recebe uma nova mensagem</small>
                            </div>
                        </label>

                        <label className="preference-item">
                            <input type="checkbox" defaultChecked />
                            <div className="preference-text">
                                <strong>Orçamentos</strong>
                                <small>Quando um orçamento é enviado ou aprovado</small>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
