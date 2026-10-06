package com.audit.roomservice.service;

import com.audit.roomservice.model.Room;
import com.audit.roomservice.model.RoomType;
import com.audit.roomservice.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RoomService {
    
    @Autowired
    private RoomRepository roomRepository;
    
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }
    
    public Optional<Room> getRoomById(Long id) {
        return roomRepository.findById(id);
    }
    
    public List<Room> getRoomsByType(RoomType type) {
        return roomRepository.findByType(type);
    }
    
    public List<Room> getActiveRooms() {
        return roomRepository.findByIsActive(true);
    }
    
    public Room createRoom(Room room) {
        room.setId(null); room.setArchived(false);
        if (roomRepository.findByRoomNumber(room.getRoomNumber()).isPresent()) {
            throw new IllegalArgumentException("Room number already exists");
        }
        return roomRepository.save(room);
    }
    
    public Optional<Room> updateRoom(Long id, Room roomDetails) {
        return roomRepository.findById(id).map(room -> {
            if (!room.getRoomNumber().equals(roomDetails.getRoomNumber()) && 
                roomRepository.findByRoomNumber(roomDetails.getRoomNumber()).isPresent()) {
                throw new IllegalArgumentException("Room number already exists");
            }
            room.setRoomNumber(roomDetails.getRoomNumber());
            room.setName(roomDetails.getName());
            room.setType(roomDetails.getType());
            room.setCapacity(roomDetails.getCapacity());
            room.setDescription(roomDetails.getDescription());
            if (room.isArchived() && Boolean.TRUE.equals(roomDetails.getIsActive())) throw new IllegalArgumentException("Архивную аудиторию нельзя активировать");
            room.setIsActive(roomDetails.getIsActive());
            return roomRepository.save(room);
        });
    }
    
    public boolean deleteRoom(Long id) {
        if (roomRepository.existsById(id)) {
            Room room = roomRepository.findById(id).orElseThrow();
            room.setArchived(true); room.setIsActive(false);
            roomRepository.save(room);
            return true;
        }
        return false;
    }
}



