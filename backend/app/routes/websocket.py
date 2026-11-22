"""
WebSocket — Live Slot Updates (Bonus Feature)
================================================
Patients browsing a doctor's calendar connect to:
  ws://<host>/ws/slots/<doctor_id>/<YYYY-MM-DD>

When any booking or cancellation happens on that doctor+date,
the server broadcasts a JSON message to every connected client.

Message shapes:
  { "action": "slot_booked",      "slot": "<ISO-UTC datetime>" }
  { "action": "slot_cancelled",   "slot": "<ISO-UTC datetime>" }
  { "action": "slot_reallocated", "slot": "<ISO-UTC datetime>" }
"""

from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    def __init__(self):
        # key → f"{doctor_id}_{date_str}"
        self.connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, ws: WebSocket, key: str):
        await ws.accept()
        self.connections.setdefault(key, []).append(ws)

    def disconnect(self, ws: WebSocket, key: str):
        if key in self.connections:
            self.connections[key] = [c for c in self.connections[key] if c != ws]

    async def broadcast(self, doctor_id: str, date_str: str, message: dict):
        key = f"{doctor_id}_{date_str}"
        dead = []
        for ws in self.connections.get(key, []):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for d in dead:
            self.connections[key].remove(d)


manager = ConnectionManager()


@router.websocket("/ws/slots/{doctor_id}/{date_str}")
async def slot_ws(websocket: WebSocket, doctor_id: str, date_str: str):
    key = f"{doctor_id}_{date_str}"
    await manager.connect(websocket, key)
    try:
        while True:
            await websocket.receive_text()  # keep-alive ping
    except WebSocketDisconnect:
        manager.disconnect(websocket, key)
