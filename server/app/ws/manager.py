import json
from typing import Dict, Set, List
from fastapi import WebSocket

class ConnectionManager:
    """Управляет WebSocket соединениями и комнатами (лекциями)"""
    
    def __init__(self):
        # active_connections: pin_code -> список подключений
        self.active_connections: Dict[str, List[dict]] = {}
    
    async def connect(self, websocket: WebSocket, pin_code: str, user_type: str):
        """Подключение клиента к комнате по PIN коду"""
        await websocket.accept()
        
        if pin_code not in self.active_connections:
            self.active_connections[pin_code] = []
        
        self.active_connections[pin_code].append({
            "websocket": websocket,
            "user_type": user_type  # "teacher" или "student"
        })
        
        print(f"Подключен {user_type} к лекции {pin_code}")
        
    def disconnect(self, websocket: WebSocket, pin_code: str):
        """Отключение клиента от комнаты"""
        if pin_code in self.active_connections:
            self.active_connections[pin_code] = [
                conn for conn in self.active_connections[pin_code]
                if conn["websocket"] != websocket
            ]
            
            # Если комната пуста, удаляем её
            if len(self.active_connections[pin_code]) == 0:
                del self.active_connections[pin_code]
            
            print(f"Отключен от лекции {pin_code}")
    
    async def broadcast_to_room(self, pin_code: str, message: dict, exclude_teacher: bool = False):
        """Отправить сообщение всем в комнате"""
        if pin_code in self.active_connections:
            for conn in self.active_connections[pin_code]:
                if exclude_teacher and conn["user_type"] == "teacher":
                    continue
                try:
                    await conn["websocket"].send_json(message)
                except:
                    pass
    
    async def broadcast_to_teacher(self, pin_code: str, message: dict):
        """Отправить сообщение только преподавателю в комнате"""
        if pin_code in self.active_connections:
            for conn in self.active_connections[pin_code]:
                if conn["user_type"] == "teacher":
                    try:
                        await conn["websocket"].send_json(message)
                    except:
                        pass
    
    async def broadcast_participants(self, pin_code: str):
        """Отправить количество участников в комнате"""
        if pin_code in self.active_connections:
            count = len(self.active_connections[pin_code])
            message = {
                "type": "PARTICIPANTS_UPDATE",
                "data": {"count": count}
            }
            await self.broadcast_to_room(pin_code, message)
    
    def get_teacher_websocket(self, pin_code: str):
        """Получить websocket преподавателя в комнате"""
        if pin_code in self.active_connections:
            for conn in self.active_connections[pin_code]:
                if conn["user_type"] == "teacher":
                    return conn["websocket"]
        return None

# Глобальный экземпляр менеджера
manager = ConnectionManager()
