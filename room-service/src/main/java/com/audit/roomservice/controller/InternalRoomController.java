package com.audit.roomservice.controller;
import com.audit.roomservice.repository.RoomRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/internal/rooms")
public class InternalRoomController {
    private final RoomRepository rooms;
    public InternalRoomController(RoomRepository rooms) { this.rooms = rooms; }
    public record RoomReference(Long id, boolean isActive) {}
    @GetMapping("/{id}") public ResponseEntity<RoomReference> get(@PathVariable Long id) {
        return rooms.findById(id).map(r -> new RoomReference(r.getId(), Boolean.TRUE.equals(r.getIsActive()) && !r.isArchived())).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
