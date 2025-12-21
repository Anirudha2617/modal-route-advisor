# ev_data_logger/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class EVDataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "ev_data_broadcast"
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        print(f"WebSocket client connected to group {self.group_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        print(f"WebSocket client disconnected from group {self.group_name}")

    # This method is called when a message is sent to the group
    async def ev_reading_update(self, event):
        payload = event['payload']
        # Send message to WebSocket client
        await self.send(text_data=json.dumps({
            'type': 'ev_reading_update', # To help frontend identify message type
            'payload': payload
        }))
        print(f"Sent payload to WebSocket: {payload}")