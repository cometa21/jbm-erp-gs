import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, NotificationPermissionState } from '../services/notificationService';
import type { InventoryItem } from '../types';
import { useNavigate } from 'react-router-dom';

export function useSuppliesNotificationMonitor() {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    notificationService.getPermissionStatus()
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    notificationService.isSoundEnabled()
  );
  const [criticalItems, setCriticalItems] = useState<InventoryItem[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Check inventory from backend
  const checkInventory = useCallback(async () => {
    try {
      setIsChecking(true);
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data: InventoryItem[] = await res.json();
        if (Array.isArray(data)) {
          const critical = notificationService.evaluateInventory(data, (url) => {
            navigateRef.current(url);
          });
          setCriticalItems(critical);
          setLastCheckTime(new Date());
        }
      }
    } catch (err) {
      console.warn('Error polling inventory for notifications:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Request browser permission
  const requestPermission = useCallback(async () => {
    const status = await notificationService.requestPermission();
    setPermission(status);
    if (status === 'granted') {
      // Run an immediate check
      checkInventory();
    }
    return status;
  }, [checkInventory]);

  // Toggle sound alert
  const toggleSound = useCallback((enabled: boolean) => {
    notificationService.setSoundEnabled(enabled);
    setSoundEnabled(enabled);
  }, []);

  // Send a test notification
  const sendTestNotification = useCallback(() => {
    const dummyItems: InventoryItem[] = [
      {
        id: 9999,
        sku: 'TEST-CJ-40',
        item_name: 'Caja Exportación 40 lbs JBM Premium (PRUEBA)',
        category: 'Cajas',
        quantity: 120,
        unit: 'piezas',
        min_stock: 1000,
        critical_stock: 400,
        cost_unit: 24.50,
        supplier: 'Cartonera del Golfo',
        last_restock_date: new Date().toISOString()
      }
    ];

    notificationService.triggerCriticalAlert(dummyItems, {
      isManualTest: true,
      onNavigate: (url) => navigateRef.current(url)
    });
  }, []);

  // Setup periodic polling interval & visibility event listener
  useEffect(() => {
    setPermission(notificationService.getPermissionStatus());
    setSoundEnabled(notificationService.isSoundEnabled());

    // Initial check
    checkInventory();

    // Background interval check every 25 seconds
    const interval = setInterval(checkInventory, 25000);

    // When tab becomes visible/hidden, evaluate status
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab went to background, check inventory to ensure background alertness
        checkInventory();
      } else {
        // Tab returned to foreground, stop title flashing
        notificationService.stopTitleFlash();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      notificationService.stopTitleFlash();
    };
  }, [checkInventory]);

  return {
    permission,
    isSupported: notificationService.isSupported(),
    soundEnabled,
    criticalItems,
    criticalCount: criticalItems.length,
    isChecking,
    lastCheckTime,
    requestPermission,
    toggleSound,
    sendTestNotification,
    checkInventory
  };
}
