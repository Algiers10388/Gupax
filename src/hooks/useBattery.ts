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
    // Check if navigator.getBattery exists
    if ('getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<BatteryManager> })
        .getBattery()
        .then((batteryManager: BatteryManager) => {
          const update = () => {
            setBattery({
              level: batteryManager.level,
              charging: batteryManager.charging,
              chargingTime: batteryManager.chargingTime,
              dischargingTime: batteryManager.dischargingTime,
              isSupported: true,
            });
          };

          update();
          batteryManager.addEventListener('chargingchange', update);
          batteryManager.addEventListener('levelchange', update);

          return () => {
            batteryManager.removeEventListener('chargingchange', update);
            batteryManager.removeEventListener('levelchange', update);
          };
        })
        .catch(() => {
          // Fallback
          setBattery(b => ({ ...b, isSupported: false }));
        });
    }
  }, []);

  return battery;
}
