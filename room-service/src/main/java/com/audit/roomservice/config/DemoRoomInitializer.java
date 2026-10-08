package com.audit.roomservice.config;

import com.audit.roomservice.model.Room;
import com.audit.roomservice.model.RoomType;
import com.audit.roomservice.repository.RoomRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@ConditionalOnProperty(name = "demo.rooms.enabled", havingValue = "true")
public class DemoRoomInitializer implements ApplicationRunner {
    private static final long SEED_LOCK_ID = 9_283_748L;

    private final RoomRepository rooms;
    private final JdbcTemplate jdbc;

    public DemoRoomInitializer(RoomRepository rooms, JdbcTemplate jdbc) {
        this.rooms = rooms;
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        jdbc.queryForList("SELECT pg_advisory_xact_lock(" + SEED_LOCK_ID + ")");
        demoRooms().forEach(this::insertIfMissing);
    }

    private void insertIfMissing(Room room) {
        if (rooms.findByRoomNumber(room.getRoomNumber()).isEmpty()) {
            rooms.save(room);
        }
    }

    private List<Room> demoRooms() {
        return List.of(
                room("101", "Большая лекционная аудитория", RoomType.LECTURE_HALL, 120,
                        "Проектор, акустическая система и доска для лекций.", true),
                room("102", "Лекционная аудитория", RoomType.LECTURE_HALL, 72,
                        "Экран, проектор и рабочее место преподавателя.", true),
                room("103", "Малая лекционная аудитория", RoomType.LECTURE_HALL, 48,
                        "Компактный зал для лекций и презентаций.", true),
                room("201", "Лаборатория физики", RoomType.LABORATORY, 24,
                        "Лабораторные столы и оборудование для практических работ.", true),
                room("202", "Химическая лаборатория", RoomType.LABORATORY, 18,
                        "Вытяжной шкаф и индивидуальные рабочие места.", true),
                room("203", "Учебная лаборатория электроники", RoomType.LABORATORY, 20,
                        "Наборы для сборки и проверки электронных схем.", true),
                room("301", "Компьютерный класс A", RoomType.COMPUTER_LAB, 28,
                        "28 рабочих мест, Windows и доступ к учебной сети.", true),
                room("302", "Компьютерный класс B", RoomType.COMPUTER_LAB, 20,
                        "Рабочие места для программирования и проектных занятий.", true),
                room("303", "Компьютерная лаборатория", RoomType.COMPUTER_LAB, 16,
                        "Компьютеры с инструментами разработки.", false),
                room("401", "Семинарская аудитория", RoomType.SEMINAR_ROOM, 30,
                        "Передвижные столы для командной работы.", true),
                room("402", "Переговорная для семинаров", RoomType.SEMINAR_ROOM, 16,
                        "Интерактивная панель и доска.", true),
                room("501", "Учебная комната", RoomType.STUDY_ROOM, 12,
                        "Тихое пространство для самостоятельных занятий.", true),
                room("502", "Комната проектной работы", RoomType.STUDY_ROOM, 10,
                        "Рабочие столы и доска для проектных команд.", true)
        );
    }

    private Room room(String number, String name, RoomType type, int capacity, String description, boolean active) {
        Room room = new Room();
        room.setRoomNumber(number);
        room.setName(name);
        room.setType(type);
        room.setCapacity(capacity);
        room.setDescription(description);
        room.setIsActive(active);
        return room;
    }
}
