import { useState, useEffect } from 'react';
import { BatteryStatus } from '../types';

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => void) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => void) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => void) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => void) | null;
}

export function useBattery(): BatteryStatus {
  const [battery, setBattery] = useState<BatteryStatus>({
    level: 0.85,
    charging: false,
    chargingTime: 0,
    dischargingTime: Infinity,
    isSupported: false,
  });

  useEffect(() => {
    let isMounted = true;
    let manager: BatteryManager | null = null;
    let updateFn: (() => void) | null = null;

    if ('getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<BatteryManager> })
        .getBattery()
        .then((batteryManager: BatteryManager) => {
          if (!isMounted) return;
          manager = batteryManager;
          updateFn = () => {
            if (!isMounted) return;
            setBattery({
              level: batteryManager.level,
              charging: batteryManager.charging,
              chargingTime: batteryManager.chargingTime,
              dischargingTime: batteryManager.dischargingTime,
              isSupported: true,
            });
          };

          updateFn();
          batteryManager.addEventListener('chargingchange', updateFn);
          batteryManager.addEventListener('levelchange', updateFn);
        })
        .catch(() => {
          if (isMounted) {
            setBattery(b => ({ ...b, isSupported: false }));
          }
        });
    }

    return () => {
      isMounted = false;
      if (manager && updateFn) {
        manager.removeEventListener('chargingchange', updateFn);
        manager.removeEventListener('levelchange', updateFn);
      }
    };
  }, []);

  return battery;
}
