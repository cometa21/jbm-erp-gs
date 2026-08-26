/**
 * Service for Browser Web Notifications and Background Alert Monitoring
 * for Critical Packaging Materials & Supplies.
 */

import type { InventoryItem } from '../types';

const NOTIFICATIONS_ENABLED_KEY = 'jbm_supplies_notifications_enabled';
const SOUND_ENABLED_KEY = 'jbm_supplies_sound_enabled';
const LAST_ALERT_TIMESTAMP_KEY = 'jbm_supplies_last_alert_time';
const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes cooldown between automatic duplicate background alerts

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationService {
  private audioCtx: AudioContext | null = null;
  private originalDocumentTitle: string = document.title || 'JBM Cítricos Premium ERP';
  private titleFlashInterval: any = null;
  private alertedItemIds: Set<number> = new Set();

  /**
   * Check if the browser supports the Notifications API
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Current permission status
   */
  public getPermissionStatus(): NotificationPermissionState {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationPermissionState;
  }

  /**
   * Request permission from the user
   */
  public async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) return 'unsupported';

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
      } else {
        localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
      }
      return permission as NotificationPermissionState;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return this.getPermissionStatus();
    }
  }

  /**
   * Check if sound is enabled
   */
  public isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem(SOUND_ENABLED_KEY);
    return val === null ? true : val === 'true';
  }

  /**
   * Set sound enabled state
   */
  public setSoundEnabled(enabled: boolean): void {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
  }

  /**
   * Play an alert tone using Web Audio API (safe, self-contained, no external asset needed)
   */
  public playAlertSound(): void {
    if (!this.isSoundEnabled()) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Note 1: High tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: Warning chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now + 0.18); // D6
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.35);
      gain2.gain.setValueAtTime(0.25, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Start title flashing when in background
   */
  public startTitleFlash(alertText: string): void {
    if (this.titleFlashInterval) return;
    this.originalDocumentTitle = document.title.replace(/^🚨\s*\[.*?\]\s*/, '');
    let toggle = false;

    this.titleFlashInterval = setInterval(() => {
      if (!document.hidden) {
        this.stopTitleFlash();
        return;
      }
      document.title = toggle 
        ? `🚨 ${alertText}` 
        : `⚠️ ${this.originalDocumentTitle}`;
      toggle = !toggle;
    }, 1200);

    const onVisible = () => {
      if (!document.hidden) {
        this.stopTitleFlash();
        document.removeEventListener('visibilitychange', onVisible);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
  }

  /**
   * Stop title flashing
   */
  public stopTitleFlash(): void {
    if (this.titleFlashInterval) {
      clearInterval(this.titleFlashInterval);
      this.titleFlashInterval = null;
    }
    document.title = this.originalDocumentTitle;
  }

  /**
   * Show desktop notification for critical supplies
   */
  public triggerCriticalAlert(
    criticalItems: InventoryItem[], 
    options?: { isManualTest?: boolean; onNavigate?: (url: string) => void }
  ): boolean {
    if (criticalItems.length === 0) return false;

    const count = criticalItems.length;
    const firstItem = criticalItems[0];
    const otherCount = count - 1;

    const title = options?.isManualTest 
      ? `🔔 Prueba de Notificación de Insumos - JBM Cítricos`
      : `🚨 Alerta de Desabasto Crítico (${count} ${count === 1 ? 'material' : 'materiales'})`;

    let body = '';
    if (options?.isManualTest) {
      body = `El sistema de alertas en segundo plano está activo y funcionando correctamente. Monitoreando materiales de empaque.`;
    } else if (count === 1) {
      const crit = firstItem.critical_stock || Math.round(firstItem.min_stock * 0.4);
      body = `${firstItem.item_name}: Stock actual de ${firstItem.quantity} ${firstItem.unit} (Límite crítico: ${crit} ${firstItem.unit}). ¡Se requiere reabastecimiento urgente!`;
    } else {
      const names = criticalItems.slice(0, 3).map(i => `${i.item_name} (${i.quantity} ${i.unit})`).join(', ');
      body = `${names}${otherCount > 2 ? ` y ${otherCount - 2} más` : ''} están por debajo del nivel de seguridad crítico.`;
    }

    // 1. Play sound
    this.playAlertSound();

    // 2. Start title flashing if document is hidden
    if (document.hidden) {
      this.startTitleFlash(`(${count} CRÍTICOS) Insumos JBM`);
    }

    // 3. Web Notification
    if (this.getPermissionStatus() === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'jbm-critical-supplies-notification',
          badge: '/favicon.ico',
          requireInteraction: true, // Keep notification visible until operator interacts
          data: {
            url: '/insumos',
            items: criticalItems.map(i => i.id)
          }
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          if (options?.onNavigate) {
            options.onNavigate('/insumos');
          } else {
            window.location.href = '/insumos';
          }
        };

        return true;
      } catch (err) {
        console.error('Error instantiating Notification:', err);
      }
    }

    return false;
  }

  /**
   * Monitor check function called by polling intervals or events
   */
  public evaluateInventory(
    items: InventoryItem[], 
    onNavigate?: (url: string) => void
  ): InventoryItem[] {
    if (!Array.isArray(items) || items.length === 0) return [];

    const critical = items.filter(item => {
      const criticalLimit = item.critical_stock !== undefined && item.critical_stock !== null
        ? item.critical_stock
        : Math.round(item.min_stock * 0.4);
      return item.quantity <= criticalLimit;
    });

    if (critical.length === 0) {
      this.alertedItemIds.clear();
      return [];
    }

    // Find newly critical items that haven't been alerted yet in this cycle
    const newlyCritical = critical.filter(i => !this.alertedItemIds.has(i.id));

    const now = Date.now();
    const lastAlertStr = localStorage.getItem(LAST_ALERT_TIMESTAMP_KEY);
    const lastAlertTime = lastAlertStr ? parseInt(lastAlertStr, 10) : 0;
    const cooldownElapsed = now - lastAlertTime > ALERT_COOLDOWN_MS;

    // Trigger alert if there are new critical items OR if the cooldown has elapsed and tab is in background
    if (newlyCritical.length > 0 || (cooldownElapsed && document.hidden)) {
      this.triggerCriticalAlert(critical, { onNavigate });
      localStorage.setItem(LAST_ALERT_TIMESTAMP_KEY, String(now));
      
      // Update alerted cache
      critical.forEach(i => this.alertedItemIds.add(i.id));
    }

    return critical;
  }
}

export const notificationService = new NotificationService();
