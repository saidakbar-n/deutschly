from fastapi import WebSocket, WebSocketDisconnect
from collections import defaultdict
import asyncio


class ConnectionManager:
    def __init__(self):
        self.active: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if websocket in self.active[user_id]:
            self.active[user_id].remove(websocket)
        if not self.active[user_id]:
            del self.active[user_id]

    async def send_to_user(self, user_id: int, data: dict):
        dead = []
        for ws in self.active.get(user_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(user_id, ws)

    def is_connected(self, user_id: int) -> bool:
        return bool(self.active.get(user_id))


manager = ConnectionManager()


async def chat_websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await asyncio.wait_for(websocket.receive_text(), timeout=60)
    except (WebSocketDisconnect, asyncio.TimeoutError, Exception):
        manager.disconnect(user_id, websocket)
