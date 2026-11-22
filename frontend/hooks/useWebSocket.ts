import { useEffect, useRef, useState } from "react";

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8000";

/**
 * Subscribe to live slot updates for a doctor on a given date.
 * Returns `liveBookedSlots` — extra slots to treat as booked beyond what
 * the initial API fetch returned.
 */
export function useWebSocket(doctorId: string, date: string) {
  const ws = useRef<WebSocket | null>(null);
  const [liveBookedSlots, setLiveBookedSlots] = useState<string[]>([]);
  const [liveCancelledSlots, setLiveCancelledSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!doctorId || !date) return;

    const url = `${WS_URL}/ws/slots/${doctorId}/${date}`;
    ws.current = new WebSocket(url);

    ws.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.action === "slot_booked" || msg.action === "slot_reallocated") {
          setLiveBookedSlots((prev) =>
            prev.includes(msg.slot) ? prev : [...prev, msg.slot]
          );
        } else if (msg.action === "slot_cancelled") {
          setLiveCancelledSlots((prev) =>
            prev.includes(msg.slot) ? prev : [...prev, msg.slot]
          );
          setLiveBookedSlots((prev) => prev.filter((s) => s !== msg.slot));
        }
      } catch {}
    };

    ws.current.onerror = () => {};  // silently ignore connection errors

    return () => {
      ws.current?.close();
    };
  }, [doctorId, date]);

  return { liveBookedSlots, liveCancelledSlots };
}
