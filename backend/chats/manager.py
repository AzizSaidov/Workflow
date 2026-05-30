from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.rooms: dict[str, list[WebSocket]] = {}

    async def connect(self, project_id: str, ws: WebSocket):
        await ws.accept()
        self.rooms.setdefault(project_id, []).append(ws)

    def disconnect(self, project_id: str, ws: WebSocket):
        room = self.rooms.get(project_id, [])
        if ws in room:
            room.remove(ws)

    async def broadcast(self, project_id: str, message: dict):
        for ws in self.rooms.get(project_id, []):
            await ws.send_json(message)


manager = ConnectionManager()
