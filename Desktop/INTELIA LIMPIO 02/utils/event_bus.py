# utils/event_bus.py

class EventBus:
    _listeners = {}

    @classmethod
    def subscribe(cls, event, callback):
        cls._listeners.setdefault(event, []).append(callback)

    @classmethod
    def emit(cls, event, data=None):
        for cb in cls._listeners.get(event, []):
            cb(data)
