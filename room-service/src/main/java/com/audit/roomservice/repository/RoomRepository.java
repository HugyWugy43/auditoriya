package com.audit.roomservice.repository;

import com.audit.roomservice.model.Room;
import com.audit.roomservice.model.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomNumber(String roomNumber);
    List<Room> findByType(RoomType type);
    List<Room> findByIsActive(Boolean isActive);
    List<Room> findByTypeAndIsActive(RoomType type, Boolean isActive);
}





